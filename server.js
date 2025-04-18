const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { prepareFilesForGPT } = require('./prepareFilesForGPT');
const { runModuleAudits } = require('./runModuleAudits');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express(); // ✅ ← This is the missing line
app.use(express.json({ limit: '25mb' }));

app.post('/classify-csvs', async (req, res) => {
  console.log("📥 classify-csvs triggered");

  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      console.error("❌ Invalid or missing request body");
      return res.status(400).json({ error: 'Invalid request body' });
    }

    console.log("📦 Full body received:", body);

    const Business_Name = body.Business_Name || null;
    const Website_Link = body.Website_Link || null;
    const Email = body.Email || null;
    const Name = body.Name || null;
    const Files = body.Files || '';
    const Rankings = body.Rankings || '';
    const parent_id = body.Parent_ID;

    if (!parent_id) {
      console.warn("⚠️ No Parent_ID provided. Skipping processing.");
      return res.status(400).json({ error: 'Missing Parent_ID' });
    }

    res.status(200).json({ message: 'Received. Processing in background...' });

    const thread_key = uuidv4();
    const logPrefix = `🧩 [Parent ${parent_id}]`;

    console.time(`${logPrefix} ⏱️ Total classification time`);

    const fileUrls = typeof Files === 'string' ? Files.split(',').map(f => f.trim()).filter(Boolean) : [];
    const uploadedCsvs = fileUrls.map(url => {
      const parts = url.split('/');
      return {
        filename: decodeURIComponent(parts[parts.length - 1]),
        url
      };
    });

    const rankingUrls = typeof Rankings === 'string' ? Rankings.split(',').map(f => f.trim()).filter(Boolean) : [];
    const uploadedRankings = rankingUrls.map(url => {
      const parts = url.split('/');
      return {
        filename: decodeURIComponent(parts[parts.length - 1]),
        url
      };
    });

    console.log(`${logPrefix} 📥 Starting prepareFilesForGPT with`, {
      uploadedCsvs,
      uploadedRankings
    });

    const moduleData = await prepareFilesForGPT(uploadedCsvs, CLASSIFY_ASSISTANT_ID, uploadedRankings);
    const {
      rankings,
      rows,
      matchedModules,
      ...moduleMap
    } = moduleData;

    const actualModules = Object.keys(moduleMap).filter(key => moduleMap[key].length > 0);
    console.log(`${logPrefix} 📦 Modules with data:`, actualModules);

    // ✅ New: Upload to Supabase before running audits
    for (const moduleName of actualModules) {
      const rows = moduleMap[moduleName];
      console.log(`📤 Uploading module '${moduleName}' with ${rows.length} rows to Supabase...`);

      try {
        await uploadMarkdownToSupabase(parent_id, moduleName, rows);
        console.log(`✅ Uploaded '${moduleName}' successfully`);
      } catch (uploadErr) {
        console.error(`❌ Failed to upload '${moduleName}':`, uploadErr.message || uploadErr);
      }
    }

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
    res.status(500).json({ error: 'Server error during classification' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

