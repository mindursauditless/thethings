const fs = require('fs');
const path = require('path');
const { loadModulePrompt } = require('./moduleprompt');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REPORT_ASSISTANT_ID = process.env.REPORT_ASSISTANT_ID;

async function generateReport(thread_id, moduleName) {
  const filePath = path.join(__dirname, `downloads`, `${thread_id}--${moduleName}.json`);
  const markdownPath = path.join(__dirname, `reports`, `${thread_id}--${moduleName}.md`);
  const rows = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const prompt = loadModulePrompt(moduleName, rows);

  // 🔁 GPT thread/message/run logic goes here (Assistant API)

  // For now: placeholder
  const markdown = `# ${moduleName} Report\n\nThis is a placeholder report for ${rows.length} rows.`;

  fs.writeFileSync(markdownPath, markdown);
  await uploadMarkdownToSupabase(thread_id, moduleName);

  return markdown;
}

module.exports = { generateReport };
