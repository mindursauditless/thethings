// runModuleAudits.js — with 500 row cap, empty row filtering, and Supabase upload

const fetch = require('node-fetch');
const loadModulePrompt = require('./moduleprompt');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SUPABASE_PROJECT = process.env.SUPABASE_URL.replace('https://', '');
const BUCKET = 'raw-inputs';

const moduleNames = [
  'schema',
  'internal_links',
  'onsite',
  'content_redundancy',
  'content_quality',
  'indexing',
  'information_architecture',
  'gbp',
  'service_area_pages'
];

const thread_id = process.argv[2];
if (!thread_id) {
  console.error('❌ Please provide a thread_id as the first argument');
  process.exit(1);
}

(async () => {
  for (const moduleName of moduleNames) {
    console.log(`🧠 Auditing module: ${moduleName}`);

    try {
      const supabaseUrl = `https://${SUPABASE_PROJECT}/storage/v1/object/public/${BUCKET}/raw/${thread_id}/${moduleName}.json`;
      const fileRes = await fetch(supabaseUrl);

      if (!fileRes.ok) {
        console.warn(`⏩ Skipping ${moduleName} — could not fetch file (${fileRes.status})`);
        continue;
      }

      const rows = await fileRes.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        console.warn(`⏩ Skipping ${moduleName} — no rows in Supabase file`);
        continue;
      }

      const filteredRows = rows.filter(row =>
        Object.values(row).some(val => val !== null && val !== '' && val !== undefined)
      );

      const trimmedRows = filteredRows.slice(0, 400);

      console.log(`📦 ${trimmedRows.length} usable rows for module '${moduleName}'`);

      const prompt = loadModulePrompt(moduleName, trimmedRows);

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
        console.error(`❌ GPT returned no content for ${moduleName}`);
        continue;
      }

      const reportsDir = path.join(__dirname, 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir);
      }

      const filePath = path.join(reportsDir, `${thread_id}--${moduleName}.md`);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Saved report: /reports/${thread_id}--${moduleName}.md`);

      await uploadMarkdownToSupabase(thread_id, moduleName);
    } catch (err) {
      console.error(`❌ Error generating module report for ${moduleName}:`, err);
    }
  }
})();

module.exports = uploadMarkdownToSupabase;


const { sendReportToZapier } = require('./zapier-report-hook');

(async () => {
  try {
    if (!process.env.ZAPIER_FINAL_HOOK_URL) {
      console.error('❌ ZAPIER_FINAL_HOOK_URL not defined — skipping webhook post');
      return;
    }

    await sendReportToZapier({
      thread_id,
      moduleName,
      content
    });
  } catch (err) {
    console.error(`🔥 Error sending ${moduleName} to Zapier:`, err);
  }
})();

