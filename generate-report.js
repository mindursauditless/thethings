const fs = require('fs');
const path = require('path');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');
const loadModulePrompt = require('./moduleprompt');
const { createRunAndPoll } = require('./createRunAndPoll');
require('dotenv').config();

const REPORT_MODEL = process.env.REPORT_MODEL || 'gpt-3.5-turbo';

async function generateReport(parent_id, moduleName, rankingData = []) {
  const rawPath = path.join(__dirname, 'raw', parent_id, `${moduleName}.json`);
  const reportDir = path.join(__dirname, 'reports');
  const markdownPath = path.join(reportDir, `${parent_id}--${moduleName}.md`);

  if (!fs.existsSync(rawPath)) {
    console.warn(`⚠️ No raw data found for module ${moduleName}`);
    return;
  }

  const rows = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const trimmedRows = rows.slice(0, 50);

  console.log(`✍️ Building GPT prompt for module: ${moduleName}`);
  const prompt = loadModulePrompt(moduleName, trimmedRows, rankingData);

  let markdown;
  try {
    const result = await createRunAndPoll(prompt, REPORT_MODEL);
    markdown = result?.content?.trim();

    if (!markdown || markdown === 'undefined') {
      console.warn(`⚠️ GPT returned no usable content for ${moduleName}`);
      return;
    }
  } catch (err) {
    console.error(`❌ GPT request failed for ${moduleName}:`, err.message);
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
