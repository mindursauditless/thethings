const fs = require('fs');
const path = require('path');
const { generateReport } = require('./generate-report');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');
const { scoreModulesFromMarkdown } = require('./scoreModulesFromMarkdown');
const { generateScoreSummary } = require('./generateScoreSummary');
const { runFinalReview } = require('./runFinalReview');

const moduleNames = [
  'schema',
  'internal_links',
  'content_quality',
  'information_architecture',
  'service_area_pages',
  'topical_authority',
  'onpage_optimization',
  'conversion_barriers',
  'local_visibility'
];

async function runModuleAudits(parent_id, modules = moduleNames, rankingData = []) {
  if (!parent_id) {
    console.error('❌ runModuleAudits() was called without a parent_id');
    return;
  }

  for (const moduleName of modules) {
    try {
      console.log(`📊 Generating module report: ${moduleName}`);

      const content = await generateReport(parent_id, moduleName, rankingData);

      if (!content) {
        console.error(`❌ GPT returned no content for ${moduleName}`);
        continue;
      }

      const reportsDir = path.join(__dirname, 'reports');
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

      const filePath = path.join(reportsDir, `${parent_id}--${moduleName}.md`);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Saved report: /reports/${parent_id}--${moduleName}.md`);

      await uploadMarkdownToSupabase(parent_id, moduleName);
    } catch (err) {
      console.error(`❌ Error generating module report for ${moduleName}:`, err);
    }
  }

  // 📈 Post-processing pipeline
  await scoreModulesFromMarkdown(parent_id);
  await generateScoreSummary(parent_id);
  await runFinalReview(parent_id, rankingData);
}

module.exports = { runModuleAudits };
