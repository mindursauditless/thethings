const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');
const loadModulePrompt = require('./moduleprompt');
require('dotenv').config();

console.log("✅ Using fetch-based Assistant v2 generate-module-page.js");

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function generateModulePage(parent_id, moduleName, rows, rankingData = []) {
  const prompt = loadModulePrompt(moduleName, rows, rankingData);
  let markdown;

  try {
    console.log(`📡 [${moduleName}] Creating Assistant thread...`);

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
        assistant_id: ASSISTANT_ID
      })
    });
    const run = await runRes.json();

    let completed = false;
    let result;
    let attempts = 0;

    while (!completed && attempts < 20) {
      await new Promise(res => setTimeout(res, 2000));
      const pollRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers
      });
      result = await pollRes.json();
      completed = result.status === 'completed';
      attempts++;
    }

    if (!completed) {
      console.warn(`⚠️ Assistant timeout for ${moduleName}`);
      return;
    }

    const messagesRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers
    });
    const messages = await messagesRes.json();
    const last = messages.data.find(m => m.role === 'assistant');
    markdown = last?.content?.[0]?.text?.value?.trim();

    if (!markdown) {
      console.warn(`⚠️ Assistant returned no content for ${moduleName}`);
      return;
    }

  } catch (err) {
    console.error(`❌ Assistant error for ${moduleName}:`, err.message);
    return;
  }

  try {
    const outPath = path.join(__dirname, 'reports', `${parent_id}--${moduleName}.md`);
    fs.writeFileSync(outPath, markdown, 'utf8');
    console.log(`📄 Saved final module page to ${outPath}`);
    await uploadMarkdownToSupabase(parent_id, moduleName, markdown);
    console.log(`📤 Uploaded ${moduleName} to Supabase`);
  } catch (err) {
    console.error(`❌ Save/upload failed for ${moduleName}:`, err.message);
  }
}

module.exports = { generateModulePage };
