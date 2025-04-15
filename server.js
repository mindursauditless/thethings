// server.js — saves raw inputs to Supabase

const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { prepareFilesForGPT } = require('./prepareFilesForGPT');
const generateModulePage = require('./generate-module-page');
const { runModuleAudits } = require('./runModuleAudits');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const app = express();

// ✅ JSON parser middleware
app.use(express.json({ limit: '25mb' }));

// ✅ Catch JSON parse errors
app.use((err, req, res, next) => {
  console.error('❌ JSON Parse Error:', err.message);
  res.status(400).json({ error: 'Invalid JSON body' });
});

// ✅ Serve markdown reports (if needed)
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// ✅ Mount audit generator
app.use('/', generateModulePage);

app.get('/', (req, res) => {
  res.send('✅ Server is up and running with Supabase integration');
});

app.post('/classify-csvs', async (req, res) => {
  res.status(200).json({ message: 'Received. Processing in background...' });

  try {
    const {
      Business_Name,
      Website_Link,
      Email,
      Name,
      Files = '',
      thread_id = 'no-thread-id'
    } = req.body;

    console.log("📥 Zapier Data:", { Business_Name, Website_Link, Email, Name });

    const fileUrls = Files.split(',').map(url => url.trim()).filter(Boolean);
    const uploadedCsvs = fileUrls.map(url => {
      const parts = url.split('/');
      return {
        filename: decodeURIComponent(parts[parts.length - 1]),
        url
      };
    });

    const moduleData = await prepareFilesForGPT(uploadedCsvs);
    console.log("✅ CSVs classified into modules:", Object.keys(moduleData));

    for (const [module, rows] of Object.entries(moduleData)) {
      console.log(`📦 Module '${module}' ready with ${rows.length} rows.`);
      if (rows.length === 0) continue;

      const jsonString = JSON.stringify(rows, null, 2);
      const uploadPath = `raw/${thread_id}/${module}.json`;
      const { error } = await supabase
        .storage
        .from('raw-inputs')
        .upload(uploadPath, Buffer.from(jsonString), {
          contentType: 'application/json',
          upsert: true
        });

      if (error) {
        console.error(`❌ Failed to upload ${uploadPath} to Supabase:`, error);
      } else {
        console.log(`✅ Uploaded to Supabase: ${uploadPath}`);
      }
    }

    await runModuleAudits(moduleData);
  } catch (err) {
    console.error("🔥 classify-csvs error:", err);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
