const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const loadModulePrompt = require('./moduleprompt');
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

  let markdown = `# ${moduleName} Report

This is a placeholder report for ${rows.length} rows.`;
  console.log(`✍️ Draft report created for ${moduleName}`);

  let enhanced;
  try {
    enhanced = await enhanceWithRankings({
      moduleName,
      parent_id,
      rows,
      rankingData,
      reportMarkdown: markdown
    });

    if (enhanced?.usage) {
      const { prompt_tokens, completion_tokens, total_tokens } = enhanced.usage;
      const costEstimate = (total_tokens / 1000) * 0.001;
      console.log(`🧾 Token usage for ${moduleName} — Prompt: ${prompt_tokens}, Completion: ${completion_tokens}, Total: ${total_tokens}, Estimated Cost: ~$${costEstimate.toFixed(4)}`);
    }

  } catch (err) {
    console.error(`⚠️ Enhancement error for ${moduleName}:`, err.message);
    return;
  }

  if (!enhanced || !enhanced.markdown || enhanced.markdown.trim() === 'undefined') {
    console.warn(`⚠️ Enhancement failed or returned invalid data for ${moduleName}`);
    return;
  }

  markdown = enhanced.markdown;

  if (enhanced.score) {
    const scoreBlock = `
---
## Module Scoring
**Priority:** ${enhanced.score.priority}

**Confidence:** ${enhanced.score.confidence}

**Score:** ${enhanced.score.score}/10
`;
    markdown += scoreBlock;
    console.log(`🎯 Score injected for ${moduleName}`);
  } else {
    console.warn(`⚠️ No scoring object returned from GPT for ${moduleName}`);
  }

  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

  const markdownPath = path.join(reportsDir, `${parent_id}--${moduleName}.md`);
  fs.writeFileSync(markdownPath, markdown, 'utf8');
  console.log(`✅ Saved report: /reports/${parent_id}--${moduleName}.md`);

  try {
    await uploadMarkdownToSupabase(parent_id, moduleName, markdown);
    console.log(`📤 Uploaded updated report for ${moduleName}`);
  } catch (uploadErr) {
    console.error(`❌ Failed to upload ${moduleName} report:`, uploadErr.message);
  }

  console.log(`✅ Finished module: ${moduleName}`);
  return markdown;
}

module.exports = { generateReport };
