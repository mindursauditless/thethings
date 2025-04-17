const fs = require('fs');
const path = require('path');
const { loadModulePrompt } = require('./moduleprompt');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REPORT_ASSISTANT_ID = process.env.REPORT_ASSISTANT_ID;

async function generateReport(parent_id, moduleName, rankingData = []) {
  const filePath = path.join(__dirname, 'downloads', `${parent_id}--${moduleName}.json`);
  const markdownPath = path.join(__dirname, 'reports', `${parent_id}--${moduleName}.md`);

  let rows = [];
  try {
    rows = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`❌ Failed to read data for ${moduleName}:`, err.message);
    return null;
  }

  const prompt = loadModulePrompt(moduleName, rows, rankingData);

  // 🔁 GPT logic will go here later — for now, simple placeholder
  const markdown = `# ${moduleName} Report\n\nThis is a placeholder report for ${rows.length} rows.`;

  fs.writeFileSync(markdownPath, markdown);
  await uploadMarkdownToSupabase(parent_id, moduleName);

  return markdown;
}

module.exports = { generateReport };
