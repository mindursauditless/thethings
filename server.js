const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { prepareFilesForGPT } = require('./prepareFilesForGPT');
const { runModuleAudits } = require('./runModuleAudits');
const { uploadJsonToSupabase } = require('./upload-json-to-supabase');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json({ limit: '25mb' }));

const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('✅ Server is up and running with Supabase uploader and GPT audit!');
});

app.post('/classify-csvs', async (req, res) => {
  console.log("📥 Incoming POST /classify-csvs");
  console.log("➡️ Payload keys:", Object.keys(req.body));

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

    // ✅ Convert to arrays if stringified
    const fileList = Array.isArray(Files) ? Files : Files.split(',').filter(Boolean);
    const rankingList = Array.isArray(Rankings) ? Rankings : Rankings.split(',').filter(Boolean);

    const uploadedCsvs = fileList.map(url => ({
      filename: decodeURIComponent(url.split('/').pop()),
      url: url.trim()
    }));

    const uploadedRankings = rankingList.map(url => ({
      filename: decodeURIComponent(url.split('/').pop()),
      url: url.trim()
    }));

    console.log(`${logPrefix} 📥 Starting prepareFilesForGPT with`, {
      uploadedCsvs,
      uploadedRankings
    });

    const moduleData = await prepareFilesForGPT(parent_id, uploadedCsvs, uploadedRankings);
    const { rankings, matchedModules, ...moduleMap } = moduleData;

    const actualModules = Object.keys(moduleMap).filter(
      key => key !== 'rows' && moduleMap[key].length > 0
    );
    console.log(`${logPrefix} 📦 Modules with data:`, actualModules);

    for (const moduleName of actualModules) {
      const rows = moduleMap[moduleName];
      console.log(`📤 Uploading module '${moduleName}' with ${rows.length} rows to Supabase...`);

      try {
        await uploadJsonToSupabase(parent_id, moduleName, rows);
        console.log(`✅ Uploaded raw JSON for '${moduleName}' to raw-inputs`);
      } catch (uploadErr) {
        console.error(`❌ Failed to upload '${moduleName}':`, uploadErr.message);
      }
    }

    console.log("🧠 Calling runModuleAudits with:");
    console.log("parent_id:", parent_id);
    console.log("modules:", actualModules);
    console.log("ranking count:", rankings?.length || 0);

    await runModuleAudits(parent_id, actualModules, rankings);

    console.timeEnd(`${logPrefix} ⏱️ Total classification time`);
    console.log(`${logPrefix} ✅ Classification and audit complete`);

  } catch (err) {
    console.error("🔥 classify-csvs error:", err); // Do not call res.json here
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
