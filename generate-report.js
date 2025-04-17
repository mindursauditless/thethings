const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { loadModulePrompt } = require('./moduleprompt');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');
require('dotenv').config();

async function generateReport(parent_id, moduleName, rankingData = []) {
  const remoteUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/raw-inputs/raw/${parent_id}/${moduleName}.json`;
  let rows = [];

  try {
    const res = await fetch(remoteUrl);
    if (!res.ok) {
      console.error(`❌ Failed to fetch ${moduleName} from Supabase (${res.status})`);
      return null;
    }
    rows = await res.json();
  } catch (err) {
    console.error(`❌ Error parsing ${moduleName} data:`, err.message);
    return null;
  }

  const prompt = loadModulePrompt(moduleName, rows, rankingData);

  // Placeholder markdown content
  const markdown = `# ${moduleName} Report\n\nThis is a placeholder report for ${rows.length} rows.`;

  // ✅ Ensure /reports exists
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

  // ✅ Save markdown file
  const markdownPath = path.join(reportsDir, `${parent_id}--${moduleName}.md`);
  fs.writeFileSync(markdownPath, markdown, 'utf8');

  // ✅ Upload to Supabase
  await uploadMarkdownToSupabase(parent_id, moduleName);

  return markdown;
}

module.exports = { generateReport };
