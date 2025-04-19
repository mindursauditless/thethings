const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');
const { loadModulePrompt } = require('./moduleprompt');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log("✅ Using fetch-based Assistant v2 generate-report.js");

const REPORT_MODEL = process.env.REPORT_MODEL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
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

  // Sanity check and debug log for prompt
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    console.error("❌ Invalid prompt! Value:", prompt);
    return;
  }
  console.log("📩 Prompt being sent to GPT:", prompt.slice(0, 500));

  let markdown;
  try {
    console.log("🧠 Fetch-based Assistant run for:", moduleName);

    const headers = {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    };

    const threadRes = await fetch("https://api.openai.com/v1/threads", {
      method: 'POST',
      headers
    });
    const thread = await threadRes.json();

    await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        role: 'user',
        content: prompt
      })
    });

    const runRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        assistant_id: REPORT_MODEL
      })
    });
    const run = await runRes.json();

    let completed = false;
    let result;
    let attempts = 0;
    while (!completed && attempts < 20) {
      await new Promise(res => setTimeout(res, 2000));
      const poll = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers
      });
      result = await poll.json();
      completed = result.status === 'completed';
      attempts++;
    }

    if (!completed) {
      console.warn(`⏱️ GPT run for ${moduleName} timed out`);
      return;
    }

    const msgRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers
    });
    const messages = await msgRes.json();
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
