// server.js — now also saving raw classified data per module to /raw/*.json

const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { prepareFilesForGPT } = require('./prepareFilesForGPT');
const generateModulePage = require('./generate-module-page');
const { runModuleAudits } = require('./runModuleAudits');

const app = express();

// ✅ JSON parser middleware
app.use(express.json({ limit: '25mb' }));

// ✅ Catch JSON parse errors
app.use((err, req, res, next) => {
  console.error('❌ JSON Parse Error:', err.message);
  res.status(400).json({ error: 'Invalid JSON body' });
});

// ✅ Serve markdown reports and raw module data
app.use('/reports', express.static(path.join(__dirname, 'reports')));
app.use('/raw', express.static(path.join(__dirname, 'raw')));

// ✅ Mount other routes
app.use('/', generateModulePage);

app.get('/', (req, res) => {
  res.send('✅ Server is up and running with modular CSV classification and audit generation');
});

app.post('/classify-csvs', async (req, res) => {
  res.status(200).json({ message: 'Received. Processing in background...' });

  try {
    const {
      Business_Name,
      Website_Link,
      Email,
      Name,
      Files = ''
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

    const rawDir = path.join(__dirname, 'raw');
    if (!fs.existsSync(rawDir)) {
      fs.mkdirSync(rawDir);
    }

    for (const [module, rows] of Object.entries(moduleData)) {
      console.log(`📦 Module '${module}' ready with ${rows.length} rows.`);
      if (rows.length === 0) continue;

      const outPath = path.join(rawDir, `${module}.json`);
      fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), 'utf8');
      console.log(`💾 Saved: /raw/${module}.json`);
    }

    await runModuleAudits(moduleData);
  } catch (err) {
    console.error("🔥 classify-csvs error:", err);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
