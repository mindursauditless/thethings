// server.js — updated to support Parent_ID and Rankings from Zapier

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

app.use((req, res, next) => {
  console.log(`🛰️ Incoming ${req.method} ${req.url}`);
  next();
});

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
      Parent_ID,
      Rankings
    } = req.body;

    const parent_id = Parent_ID || uuidv4();
    const logPrefix = `🧩 [Parent ${parent_id}]`;

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;
    const BUCKET = 'raw-inputs';

    console.log(`${logPrefix} Zapier Data:`, { Business_Name, Website_Link, Email, Name });
    console.time(`${logPrefix} ⏱️ Total classification time`);

    const fileUrls = Files.split(',').map(url => url.trim()).filter(Boolean);
    const uploadedCsvs = fileUrls.map(url => {
      const parts = url.split('/');
      return {
        filename: decodeURIComponent(parts[parts.length - 1]),
        url
      };
    });

    const moduleData = await prepareFilesForGPT(uploadedCsvs, CLASSIFY_ASSISTANT_ID, Rankings);
    const { rows, matchedModules, ...moduleMap } = moduleData;

    console.log(`${logPrefix} 📦 Modules to upload:`, Object.keys(moduleMap));
    console.log(`${logPrefix} 📦 Attempting Supabase upload...`);
    console.log("🧪 Supabase URL:", SUPABASE_URL);
    console.log("🧪 Supabase Key length:", SUPABASE_KEY?.length);
    console.log("🧪 Supabase Bucket:", BUCKET);

    for (const [module, rows] of Object.entries(moduleMap)) {
      if (rows.length === 0) {
        console.log(`${logPrefix} ⚠️ Skipping empty module '${module}'`);
        continue;
      }

      const jsonString = JSON.stringify(rows, null, 2);
      const storagePath = `raw/${parent_id}/${module}.json`;
      const endpoint = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`;

      console.time(`${logPrefix} ⏫ Upload ${storagePath}`);
      const uploadRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: jsonString
      });
      const result = await uploadRes.text();
      console.timeEnd(`${logPrefix} ⏫ Upload ${storagePath}`);
      console.log(`${logPrefix} 🧪 Supabase response:`, uploadRes.status, result);

      if (!uploadRes.ok) {
        console.error(`${logPrefix} ❌ Failed to upload ${storagePath} to Supabase`);
      } else {
        console.log(`${logPrefix} ✅ Uploaded to Supabase: ${storagePath}`);
      }
    }

    await runModuleAudits(parent_id, Object.keys(moduleMap));
    console.timeEnd(`${logPrefix} ⏱️ Total classification time`);

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
