// test-upload-only.js

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const loadModulePrompt = require('./moduleprompt');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');

// CHANGE THESE TO MATCH A KNOWN EXISTING THREAD
const thread_id = '782dec75-bc3e-435c-8d12-815e405595a7';
const moduleName = 'content_quality';

const SUPABASE_PROJECT = process.env.SUPABASE_URL.replace('https://', '');
const RAW_BUCKET = 'raw-inputs';

(async () => {
  try {
    const url = `https://${SUPABASE_PROJECT}/storage/v1/object/public/${RAW_BUCKET}/raw/${thread_id}/${moduleName}.json`;
    console.log(`📥 Fetching raw data: ${url}`);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const rows = await res.json();

    console.log(`🧠 Loaded ${rows.length} rows`);

    const prompt = loadModulePrompt(moduleName, rows);

    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

    const localPath = path.join(reportsDir, `${thread_id}--${moduleName}.md`);
    fs.writeFileSync(localPath, prompt, 'utf8');
    console.log(`✅ Saved fake GPT output to ${localPath}`);

    await uploadMarkdownToSupabase(thread_id, moduleName);
  } catch (err) {
    console.error(`❌ Test failed:`, err.message);
  }
})();
