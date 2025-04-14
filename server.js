// server.js — using modular classification + optional GPT audit triggering

const express = require('express');
const fetch = require('node-fetch');
const { prepareFilesForGPT } = require('./prepareFilesForGPT');
const app = express();
app.use(express.json({ limit: '25mb' }));

app.get('/', (req, res) => {
  res.send('✅ Server is up and running with modular CSV classification');
});

app.post('/classify-csvs', async (req, res) => {
  // ✅ Respond immediately to Zapier
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

    if (process.env.ZAPIER_CATCH_HOOK_URL) {
      const zapPayload = {
        name: Name,
        email: Email,
        business: Business_Name,
        website: Website_Link,
        modules: moduleData
      };

      fetch(process.env.ZAPIER_CATCH_HOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zapPayload)
      })
        .then(() => console.log('📤 Sent cleaned module data to Zapier'))
        .catch(err => console.error('❌ Failed to send to Zapier:', err));
    }
  } catch (err) {
    console.error("🔥 classify-csvs error:", err);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
