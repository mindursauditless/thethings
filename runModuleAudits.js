// runModuleAudits.js — fixed import of loadModulePrompt

const fetch = require('node-fetch');
const loadModulePrompt = require('./moduleprompt');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function runModuleAudits(modules) {
  for (const [moduleName, rows] of Object.entries(modules)) {
    if (!rows || rows.length === 0) {
      console.log(`⏩ Skipping ${moduleName} — no rows to analyze.`);
      continue;
    }

    console.log(`🧠 Auditing module: ${moduleName} (${rows.length} rows)`);

    try {
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

module.exports = { runModuleAudits };
