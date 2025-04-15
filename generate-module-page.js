// generate-module-page.js (patched to run GPT and save returned strategy)

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const loadModulePrompt = require('./moduleprompt');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');
require('dotenv').config();

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

    // 🧠 Run GPT using Assistants API
    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: [{ type: 'text', text: prompt }]
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
      instructions: 'Only return valid Markdown, formatted as a strategy report.'
    });

    let runStatus = run.status;
    while (runStatus !== 'completed' && runStatus !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const statusCheck = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      runStatus = statusCheck.status;
    }

    if (runStatus !== 'completed') {
      throw new Error('GPT run failed');
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMsg = messages.data.find(m => m.role === 'assistant');
    const gptContent = assistantMsg?.content?.[0]?.text?.value?.trim();

    if (!gptContent || gptContent.length < 10) {
      throw new Error('GPT returned no usable content');
    }

    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

    const filePath = path.join(reportsDir, `${thread_id}--${moduleName}.md`);
    fs.writeFileSync(filePath, gptContent, 'utf8');
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
