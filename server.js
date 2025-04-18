const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { prepareFilesForGPT } = require('./prepareFilesForGPT');
const { runModuleAudits } = require('./runModuleAudits');
const { uploadJsonToSupabase } = require('./upload-json-to-supabase');
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
      Rankings = '',
      Parent_ID: parent_id
    } = req.body;

    if (!parent_id) {
      console.warn("⚠️ No Parent_ID provided. Skipping processing.");
      return;
    }

    const thread_key = uuidv4();
    const logPrefix = `🧩 [Parent ${parent_id}]`;

    console.time(`${logPrefix} ⏱️ Total classification time`);

    const fileUrls = Files.split(',').map(f => f.trim()).filter(Boolean);
    const uploadedCsvs = fileUrls.map(url => ({
      filename: decodeURIComponent(url.split('/').pop()),
      url
    }));

    const rankingUrls = Rankings.split(',').map(f => f.trim()).filter(Boolean);
    const uploadedRankings = rankingUrls.map(url => ({
      filename: decodeURIComponent(url.split('/').pop()),
      url
    }));

    console.log(`${logPrefix} 📥 Starting prepareFilesForGPT with`, {
      uploadedCsvs,
      uploadedRankings
    });

    const moduleData = await prepareFilesForGPT(uploadedCsvs, process.env.CLASSIFY_ASSISTANT_ID, uploadedRankings);
    const { rankings, matchedModules, ...moduleMap } = moduleData;

    const actualModules = Object.keys(moduleMap).filter(key => moduleMap[key].length > 0);
    console.log(`${logPrefix} 📦 Modules with data:`, actualModules);

    for (const moduleName of actualModules) {
      const rows = moduleMap[moduleName];
      console.log(`📤 Uploading module '${moduleName}' with ${rows.length} rows to Supabase...`);

      try {
        await uploadJsonToSupabase(parent_id, moduleName, rows);
        console.log(`✅ Uploaded raw JSON for '${moduleName}' to raw-inputs`);
        // GPT markdown generation happens in Step 3 (runModuleAudits)
      } catch (uploadErr) {
        console.error(`❌ Failed to upload '${moduleName}':`, uploadErr.message);
      }
    }

    console.log(`${logPrefix} 🛠 Running module audits...`);
    await runModuleAudits(parent_id, actualModules, rankings);

    console.timeEnd(`${logPrefix} ⏱️ Total classification time`);
    console.log(`${logPrefix} ✅ Classification and audit complete`);

  } catch (err) {
    console.error("🔥 classify-csvs error:", err);
    res.status(500).json({ error: 'Server error during classification' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
