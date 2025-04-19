const fs = require('fs');
const path = require('path');
const { enhanceAndScoreModules } = require('./enhanceAndScoreModules');
const { generateScoreSummary } = require('./generateScoreSummary');
const { runFinalReview } = require('./runFinalReview');
const { generateReport } = require('./generate-report');

const moduleNames = [
  'schema',
  'internal_links',
  'onsite',
  'content_redundancy',
  'content_quality',
  'indexing',
  'information_architecture',
  'gbp',
  'service_area_pages'
];

/**
 * Full audit process: Generate report, enhance, score, summarize, review
 */
async function runModuleAudits(parent_id, modules = moduleNames, rankingData = []) {
  if (!parent_id) {
    console.error('❌ runModuleAudits() was called without a parent_id');
    return;
  }

  // STEP 4: Generate GPT module reports
  for (const moduleName of modules) {
    try {
      const rawPath = path.join(__dirname, 'raw-inputs', 'raw', parent_id, `${moduleName}.json`);
      if (!fs.existsSync(rawPath)) {
        console.warn(`⚠️ No raw data found for module ${moduleName}`);
        continue;
      }

      const rawData = fs.readFileSync(rawPath, 'utf8');
      const rows = JSON.parse(rawData);

      console.log(`🧠 Generating report for module: ${moduleName}`);
      await generateReport({ parent_id, moduleName, rows, rankings: rankingData });
    } catch (err) {
      console.error(`❌ Failed to generate report for ${moduleName}:`, err);
    }
  }

  try {
    console.log(`🧠 Enhancing and scoring all modules...`);
    await enhanceAndScoreModules(parent_id, modules, rankingData);
  } catch (err) {
    console.error(`❌ Failed during enhancement and scoring:`, err);
  }

  try {
    console.log(`📊 Generating score summary...`);
    await generateScoreSummary(parent_id);
  } catch (err) {
    console.error(`❌ Failed during score summary:`, err);
  }

  try {
    console.log(`🧠 Running GPT-4o final review...`);
    await runFinalReview(parent_id, rankingData);
  } catch (err) {
    console.error(`❌ Failed during final review:`, err);
  }

  console.log(`✅ All module audits complete for ${parent_id}`);
}

module.exports = { runModuleAudits };
