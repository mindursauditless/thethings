const { enhanceAndScoreModules } = require('./enhanceAndScoreModules');
const { generateScoreSummary } = require('./generateScoreSummary');
const { runFinalReview } = require('./runFinalReview');

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
 * Full audit process: Enhance reports with GPT, score, summarize, final review
 */
async function runModuleAudits(parent_id, modules = moduleNames, rankingData = []) {
  if (!parent_id) {
    console.error('❌ runModuleAudits() was called without a parent_id');
    return;
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
