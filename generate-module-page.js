const fs = require('fs');
const path = require('path');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');
const loadModulePrompt = require('./moduleprompt');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'OpenAI-Beta': 'assistants=v2'
  }
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

async function generateModulePage(parent_id, moduleName, rows, rankingData = []) {
  const prompt = loadModulePrompt(moduleName, rows, rankingData);

  let markdown;
  try {
    console.log(`📡 [${moduleName}] Creating Assistant thread...`);
    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: prompt
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });

    let completed = false;
    let attempts = 0;
    let result;

    while (!completed && attempts < 20) {
      await new Promise(res => setTimeout(res, 2000));
      result = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      completed = result.status === 'completed';
      attempts++;
    }

    if (!completed) {
      console.warn(`⚠️ Assistant timeout for ${moduleName}`);
      return;
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
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
