// runModuleAudits.js — pulls module JSON from Supabase and generates Markdown

const fetch = require('node-fetch');
const loadModulePrompt = require('./moduleprompt');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SUPABASE_PROJECT = process.env.SUPABASE_URL.replace('https://', '');
const BUCKET = 'raw-inputs';

async function runModuleAudits(thread_id, moduleNames = []) {
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

      console.log(`📦 ${rows.length} rows loaded for module '${moduleName}'`);

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
        console.error(`❌ GPT returned no content for ${moduleName}`);
        continue;
      }

      const reportsDir = path.join(__dirname, 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir);
      }

      const filePath = path.join(reportsDir, `${moduleName}.md`);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Saved report: /reports/${moduleName}.md`);
    } catch (err) {
      console.error(`❌ Error generating module report for ${moduleName}:`, err);
    }
  }
}

generateAllModules("782dec75-bc3e-435c-8d12-815e405595a7", [
  "schema",
  "internal_links",
  "onsite",
  "content_redundancy",
  "content_quality",
  "indexing",
  "information_architecture",
  "gbp",
  "service_area_pages"
]);


//module.exports = { runModuleAudits };
