// generate-module-page.js (with upload debug logs)

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const loadModulePrompt = require('./moduleprompt');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SUPABASE_PROJECT = process.env.SUPABASE_URL.replace('https://', '');
const RAW_BUCKET = 'raw-inputs';

async function generateModulePage(thread_id, moduleName) {
  try {
    console.log(`🧠 Auditing module: ${moduleName}`);

    const fileUrl = `https://${SUPABASE_PROJECT}/storage/v1/object/public/${RAW_BUCKET}/raw/${thread_id}/${moduleName}.json`;
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) {
      console.log(`⏩ Skipping ${moduleName} — could not fetch file (${fileRes.status})`);
      return;
    }

    const rows = await fileRes.json();
    console.log(`📦 ${rows.length} rows loaded for module '${moduleName}'`);

    if (!rows.length) {
      console.log(`⏩ Skipping ${moduleName} — no rows to analyze.`);
      return;
    }

    const prompt = loadModulePrompt(moduleName, rows);

    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

    const filePath = path.join(reportsDir, `${thread_id}--${moduleName}.md`);
    fs.writeFileSync(filePath, prompt, 'utf8');
    console.log(`✅ Saved report: /reports/${thread_id}--${moduleName}.md`);

    console.log(`📤 Attempting upload for ${thread_id}--${moduleName}.md`);
    const url = await uploadMarkdownToSupabase(thread_id, moduleName);

    if (url) {
      console.log(`🔗 Supabase URL: ${url}`);
    } else {
      console.log(`❌ Upload failed or returned null`);
    }

    return url;
  } catch (err) {
    console.error(`🔥 Error generating module report for ${moduleName}:`, err);
  }
}

async function generateAllModules(thread_id, modules = []) {
  const links = [];
  for (const module of modules) {
    const url = await generateModulePage(thread_id, module);
    if (url) links.push({ module, url });
  }
  console.log(`⏱️ Total classification time: ${new Date().toLocaleTimeString()}`);
  return links;
}

module.exports = { generateModulePage, generateAllModules };
