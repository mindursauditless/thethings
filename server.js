// server.js — Supabase upload + GPT module audit

const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { prepareFilesForGPT } = require('./prepareFilesForGPT');
const { runModuleAudits } = require('./runModuleAudits');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

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
      thread_id = uuidv4()
    } = req.body;

    console.log("📥 Zapier Data:", { Business_Name, Website_Link, Email, Name });
    console.time("⏱️ Total classification time");

    const fileUrls = Files.split(',').map(url => url.trim()).filter(Boolean);
    const uploadedCsvs = fileUrls.map(url => {
      const parts = url.split('/');
      return {
        filename: decodeURIComponent(parts[parts.length - 1]),
        url
      };
    });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;
    const BUCKET = 'raw-inputs';

    console.time("⏱️ prepareFilesForGPT");
    const moduleData = await prepareFilesForGPT(uploadedCsvs);
    console.timeEnd("⏱️ prepareFilesForGPT");
    console.log("✅ CSVs classified into modules:", Object.keys(moduleData));

    for (const [module, rows] of Object.entries(moduleData)) {
      console.log(`📦 Module '${module}' ready with ${rows.length} rows.`);
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
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
