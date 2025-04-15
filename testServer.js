// testServer.js — Minimal debug-only server for Markdown upload test

const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const loadModulePrompt = require('./moduleprompt');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');
require('dotenv').config();

const app = express();
app.use(express.json());

const SUPABASE_PROJECT = process.env.SUPABASE_URL.replace('https://', '');
const RAW_BUCKET = 'raw-inputs';

app.get('/', (req, res) => {
  res.send('✅ Test server is running');
});

app.post('/test-upload-only', async (req, res) => {
  const { thread_id, module } = req.body;
  if (!thread_id || !module) {
    return res.status(400).json({ error: 'Missing thread_id or module in request body' });
  }

  try {
    const url = `https://${SUPABASE_PROJECT}/storage/v1/object/public/${RAW_BUCKET}/raw/${thread_id}/${module}.json`;
    console.log(`📥 Fetching raw data: ${url}`);

    const fileRes = await fetch(url);
    if (!fileRes.ok) throw new Error(`Supabase fetch failed with status ${fileRes.status}`);
    const rows = await fileRes.json();

    console.log(`🧠 Loaded ${rows.length} rows from Supabase`);

    const prompt = loadModulePrompt(module, rows);

    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

    const filePath = path.join(reportsDir, `${thread_id}--${module}.md`);
    fs.writeFileSync(filePath, prompt, 'utf8');
    console.log(`✅ Saved test Markdown to ${filePath}`);

    const publicUrl = await uploadMarkdownToSupabase(thread_id, module);
    if (publicUrl) {
      console.log(`✅ Uploaded report to: ${publicUrl}`);
      return res.json({ success: true, url: publicUrl });
    } else {
      throw new Error('Upload failed');
    }
  } catch (err) {
    console.error(`❌ Test failed:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Test server running on port ${PORT}`));
