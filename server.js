// server.js — Supabase upload + GPT module audit (now using raw fetch for GPT)

const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { prepareFilesForGPT } = require('./prepareFilesForGPT');
const { runModuleAudits } = require('./runModuleAudits');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CLASSIFY_ASSISTANT_ID = process.env.CLASSIFY_ASSISTANT_ID;

const app = express();
app.use(express.json({ limit: '25mb' }));

app.get('/', (req, res) => {
  res.send('✅ Server is up and running with Supabase fetch uploader and GPT audit');
});

app.post('/classify-csvs', async (req, res) => {
  console.log("⚡️ classify-csvs triggered");
  console.log("🧾 Raw request body:", JSON.stringify(req.body, null, 2));
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

    // === Replacing SDK GPT Thread/Run with raw fetch ===
    console.log("📤 Creating GPT thread via raw fetch...");
    console.log("🧾 Raw request body:", JSON.stringify(req.body, null, 2));
    
    if (!moduleData || !moduleData.rows || moduleData.rows.length === 0) {
      console.error("❌ No usable rows found in moduleData. Skipping GPT call.");
      return;
    }
    
    console.log("📤 Creating GPT thread via raw fetch...");
    
    const threadRes = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify({})
    });
    
    const threadData = await threadRes.json();
    const thread_id = threadData.id;
    
    console.log("🧵 Thread created:", thread_id);


    const messageRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify({
        role: "user",
        content: JSON.stringify({
          rows: moduleData.rows,
          matchedModules: moduleData.matchedModules,
        })
      })
    });

    const messageData = await messageRes.json();
    console.log("✉️ Message added:", messageData.id);

    const runRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify({
        assistant_id: CLASSIFY_ASSISTANT_ID
      })
    });

    const run = await runRes.json();
    console.log("🚀 GPT run started:", run.id);

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
