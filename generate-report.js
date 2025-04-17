const fetch = require('node-fetch');
const { loadModulePrompt } = require('./moduleprompt');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REPORT_ASSISTANT_ID = process.env.REPORT_ASSISTANT_ID;

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

  // 🔁 GPT integration placeholder
  const markdown = `# ${moduleName} Report\n\nThis is a placeholder report for ${rows.length} rows.`;

  await uploadMarkdownToSupabase(parent_id, moduleName);
  return markdown;
}

module.exports = { generateReport };
