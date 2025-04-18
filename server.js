
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
  console.log("👋 Root endpoint hit");
  res.send('✅ Server is up and running with Supabase fetch uploader and GPT audit');
});

app.post('/classify-csvs', async (req, res) => {
  try {
    console.log("📥 classify-csvs triggered");

    if (!req.body) {
      console.error("❌ req.body is undefined");
      return res.status(400).json({ error: 'Missing request body' });
    }

    const {
      Business_Name,
      Website_Link,
      Email,
      Name,
      Files = '',
      Rankings = '',
      Parent_ID: parent_id
    } = req.body;

    console.log("🧩 Parsed Zapier fields:", { Business_Name, Website_Link, Email, Name, Files, Rankings, parent_id });

    res.status(200).json({ message: 'Received. Processing in background...' });

    const thread_key = uuidv4();
    const logPrefix = `🧩 [Parent ${parent_id}]`;

    console.time(`${logPrefix} ⏱️ Total classification time`);

    const fileUrls = (Files || '').split(',').map(url => url.trim()).filter(Boolean);
    const uploadedCsvs = fileUrls.map(url => {
      const parts = url.split('/');
      return {
        filename: decodeURIComponent(parts[parts.length - 1]),
        url
      };
    });

    const rankingUrls = (Rankings || '').split(',').map(url => url.trim()).filter(Boolean);
    const uploadedRankings = rankingUrls.map(url => {
      const parts = url.split('/');
      return {
        filename: decodeURIComponent(parts[parts.length - 1]),
        url
      };
    });

    console.log(`${logPrefix} 📥 Starting prepareFilesForGPT...`);
    const moduleData = await prepareFilesForGPT(uploadedCsvs, CLASSIFY_ASSISTANT_ID, uploadedRankings);

    const {
      rankings,
      rows,
      matchedModules,
      ...moduleMap
    } = moduleData;

    const actualModules = Object.keys(moduleMap).filter(key => moduleMap[key].length > 0);
    console.log(`${logPrefix} 📦 Modules with data:`, actualModules);

    console.log(`${logPrefix} 🛠 Running module audits...`);
    await runModuleAudits(parent_id, actualModules, rankings);

    console.timeEnd(`${logPrefix} ⏱️ Total classification time`);
    console.log(`${logPrefix} ✅ Classification and audit complete`);
  } catch (err) {
    console.error("🔥 classify-csvs error:", err);
    if (err.response && typeof err.response.text === 'function') {
      const responseBody = await err.response.text();
      console.error("📨 OpenAI response body:", responseBody);
    } else if (err instanceof Error) {
      console.error("❗️ Error details:", err.message);
    }
    res.status(500).json({ error: 'Server crashed during classification.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
