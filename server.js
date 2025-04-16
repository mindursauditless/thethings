// server.js — Supabase upload + GPT module audit

const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const CLASSIFY_ASSISTANT_ID = process.env.CLASSIFY_ASSISTANT_ID;
const { prepareFilesForGPT } = require('./prepareFilesForGPT');
const { runModuleAudits } = require('./runModuleAudits');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Log SDK version to confirm
//console.log("🤖 OpenAI SDK version:", require('openai/package.json').version);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(express.json({ limit: '25mb' }));

app.get('/', (req, res) => {
  res.send('✅ Server is up and running with Supabase fetch uploader and GPT audit');
});

app.post('/classify-csvs', async (req, res) => {
  console.log("⚡️ classify-csvs triggered");
  res.status(200).json({ message: 'Received. Processing in background...' });

  try {
    const {
      Business_Name,
      Website_Link,
      Email,
      Name,
      Files = '',
      thread_id: incomingThreadId
    } = req.body;

    const thread_key = incomingThreadId || uuidv4();
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;
    const BUCKET = 'raw-inputs';

    console.log("📥 Zapier Data:", { Business_Name, Website_Link, Email, Name, thread_key });
    console.time("⏱️ Total classification time");

    const fileUrls = Files.split(',').map(url => url.trim()).filter(Boolean);
    const uploadedCsvs = fileUrls.map(url => {
      const parts = url.split('/');
      return {
        filename: decodeURIComponent(parts[parts.length - 1]),
        url
      };
    });

    const moduleData = await prepareFilesForGPT(uploadedCsvs, CLASSIFY_ASSISTANT_ID);

    const threadMessages = [
      {
        role: "user",
        content: JSON.stringify({
          rows: moduleData.rows,
          matchedModules: moduleData.matchedModules,
        }),
      },
    ];

    console.log("📤 Sending messages to new GPT thread...");

    const thread = await openai.beta.threads.create({ messages: threadMessages });
    const thread_id = thread.id;
    console.log("✅ Thread created with ID:", thread_id);

    // Diagnostic logging before run
    console.log("🧪 Calling runs.create() with:", {
      thread_id,
      assistant_id: CLASSIFY_ASSISTANT_ID
    });

    const run = await openai.beta.threads.runs.create({
      thread_id,
      assistant_id: CLASSIFY_ASSISTANT_ID
    });

    console.log(`🧠 GPT run started: ${run.id} for thread ${thread_id}`);

    const { rows, matchedModules } = moduleData;
    console.log("✅ CSVs classified into modules:", Object.keys(moduleData));

    for (const [module, rows] of Object.entries(moduleData)) {
      if (rows.length === 0) continue;
      const jsonString = JSON.stringify(rows, null, 2);
      const storagePath = `raw/${thread_id}/${module}.json`;
      const endpoint = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`;

      console.time(`⏫ Upload ${storagePath}`);
      const uploadRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: jsonString
      });

      const result = await uploadRes.text();
      console.timeEnd(`⏫ Upload ${storagePath}`);

      if (!uploadRes.ok) {
        console.error(`❌ Failed to upload ${storagePath} to Supabase:`, result);
      } else {
        console.log(`✅ Uploaded to Supabase: ${storagePath}`);
      }
    }

    const allModules = Object.keys(moduleData);
    await runModuleAudits(thread_id, allModules);

    console.timeEnd("⏱️ Total classification time");
  } catch (err) {
    console.error("🔥 classify-csvs error:", err);

    if (err.response && typeof err.response.text === 'function') {
      const responseBody = await err.response.text();
      console.error("📨 OpenAI response body:", responseBody);
    } else if (err instanceof Error) {
      console.error("❗️ Error details:", err.message);
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
