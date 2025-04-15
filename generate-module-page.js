// generate-module-page.js (patched to auto-upload to Supabase)

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const loadModulePrompt = require('./moduleprompt');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SUPABASE_PROJECT = process.env.SUPABASE_URL.replace('https://', '');
const BUCKET = 'raw-inputs';

async function generateModulePage(thread_id, moduleName) {
  try {
    console.log(`🟨 [START] Generating report for module: ${moduleName} (Thread: ${thread_id})`);

    const fileUrl = `https://${SUPABASE_PROJECT}/storage/v1/object/public/${BUCKET}/raw/${thread_id}/${moduleName}.json`;
    const fileRes = await fetch(fileUrl);

    if (!fileRes.ok) {
      throw new Error(`🟥 Failed to fetch module data (${fileRes.status})`);
    }

    const rows = await fileRes.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error(`🟥 No rows available in Supabase file for ${moduleName}`);
    }

    console.log(`📥 Loaded ${rows.length} rows for ${moduleName}`);

    const prompt = loadModulePrompt(moduleName, rows);

    const response = await openai.chat.completions.create({
      model: 'gpt-4-0125-preview',
      messages: [
        { role: 'system', content: 'You are a Markdown-only assistant. Return only valid Markdown, not JSON or code blocks.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error(`🟥 GPT returned no content for ${moduleName}`);
    }

    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }

    const filePath = path.join(reportsDir, `${thread_id}--${moduleName}.md`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Saved report to /reports/${thread_id}--${moduleName}.md`);

    const url = await uploadMarkdownToSupabase(thread_id, moduleName);
    if (url) console.log(`🔗 Report URL: ${url}`);

    return url;
  } catch (err) {
    console.error(`🔥 Error in generateModulePage for ${moduleName}:`, err.message);
    return null;
  }
}

async function generateAllModules(thread_id, modules = []) {
  const links = [];

  for (const moduleName of modules) {
    const url = await generateModulePage(thread_id, moduleName);
    if (url) links.push({ module: moduleName, url });
  }

  console.log("✅ All reports generated:");
  console.table(links);
  return links;
}

module.exports = { generateModulePage, generateAllModules };
