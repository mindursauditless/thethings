const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { loadModulePrompt } = require('./moduleprompt');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');
const { enhanceWithRankings } = require('./enhanceWithRankings');
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

  // Step 1: Generate initial draft (placeholder or GPT-first-draft)
  let markdown = `# ${moduleName} Report\n\nThis is a placeholder report for ${rows.length} rows.`;
  console.log(`✍️ Draft report created for ${moduleName}`);

  // Step 2: Enhance with ranking data + scoring
  const enhanced = await enhanceWithRankings({
    moduleName,
    parent_id,
    rows,
    rankingData,
    reportMarkdown: markdown
  });

  if (enhanced && enhanced.markdown) {
    markdown = enhanced.markdown;

    // Step 3: Append score section to report
    if (enhanced.score) {
      const scoreBlock = `\n---\n## Module Scoring\n**Priority:** ${enhanced.score.priority}\n\n**Confidence:** ${enhanced.score.confidence}\n\n**Score:** ${enhanced.score.score}/10\n`;
      markdown += scoreBlock;
      console.log(`🎯 Score injected for ${moduleName}`);
    }
  } else {
    console.warn(`⚠️ Enhancement failed or returned invalid data for ${moduleName}`);
  }

  // Step 4: Save .md file to /reports and re-upload
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

  const markdownPath = path.join(reportsDir, `${parent_id}--${moduleName}.md`);
  fs.writeFileSync(markdownPath, markdown, 'utf8');
  console.log(`✅ Saved report: /reports/${parent_id}--${moduleName}.md`);

  await uploadMarkdownToSupabase(parent_id, moduleName);
  console.log(`📤 Uploaded updated report for ${moduleName}`);

  return markdown;
}

module.exports = { generateReport };
