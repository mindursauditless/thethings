const fs = require('fs');
const path = require('path');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');
const loadModulePrompt = require('./moduleprompt');
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'OpenAI-Beta': 'assistants=v2'
  }
});

console.log("🧠 generate-report.js is using Assistant v2");

const REPORT_MODEL = process.env.REPORT_MODEL;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function fetchRawJsonFromSupabase(parent_id, moduleName) {
  const path = `raw/${parent_id}/${moduleName}.json`;
  const { data, error } = await supabase.storage.from('raw-inputs').download(path);
  if (error) throw new Error(`Supabase fetch failed for ${moduleName}: ${error.message}`);
  const text = await data.text();
  return JSON.parse(text);
}

async function generateReport(parent_id, moduleName, rankingData = []) {
  const reportDir = path.join(__dirname, 'reports');
  const markdownPath = path.join(reportDir, `${parent_id}--${moduleName}.md`);

  let rows;
  try {
    rows = await fetchRawJsonFromSupabase(parent_id, moduleName);
  } catch (err) {
    console.warn(`⚠️ No raw data found for module ${moduleName}:`, err.message);
    return;
  }

  const trimmedRows = rows.slice(0, 50);
  const prompt = loadModulePrompt(moduleName, trimmedRows, rankingData);

  let markdown;
  try {
    console.log(`📡 Creating Assistant thread for ${moduleName}`);
    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: prompt
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: REPORT_MODEL
    });

    let completed = false;
    let attempts = 0;
    let maxAttempts = 20;
    let result;

    while (!completed && attempts < maxAttempts) {
      await new Promise(res => setTimeout(res, 2000));
      result = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      completed = result.status === 'completed';
      attempts++;
    }

    if (!completed) {
      console.warn(`⏱️ GPT run for ${moduleName} timed out`);
      return;
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const last = messages.data.find(m => m.role === 'assistant');
    markdown = last?.content?.[0]?.text?.value?.trim();

    if (!markdown) {
      console.warn(`⚠️ GPT returned no markdown for ${moduleName}`);
      return;
    }
  } catch (err) {
    console.error(`❌ GPT enhancement failed for ${moduleName}:`, err.message);
    return;
  }

  try {
    fs.writeFileSync(markdownPath, markdown, 'utf8');
    console.log(`📄 Saved report for ${moduleName} to ${markdownPath}`);
    await uploadMarkdownToSupabase(parent_id, moduleName, markdown);
    console.log(`📤 Uploaded ${moduleName} report to Supabase`);
  } catch (err) {
    console.error(`❌ Failed to save or upload report for ${moduleName}:`, err.message);
  }
}

module.exports = { generateReport };
