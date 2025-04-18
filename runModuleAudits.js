
// 🔧 PATCHED runModuleAudits.js

const fs = require('fs');
const path = require('path');
const { generateReport } = require('./generate-report');
const { scoreModulesFromMarkdown } = require('./scoreModulesFromMarkdown');
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

async function runModuleAudits(parent_id, modules = moduleNames, rankingData = []) {
  if (!parent_id) {
    console.error('❌ runModuleAudits() was called without a parent_id');
    return;
  }

  for (const moduleName of modules) {
    try {
      console.log(`📊 Generating module report: ${moduleName}`);
      await generateReport(parent_id, moduleName, rankingData);
    } catch (err) {
      console.error(`❌ Error generating module report for ${moduleName}:`, err);
    }
  }

  try {
    console.log(`🧮 Scoring reports...`);
    await scoreModulesFromMarkdown(parent_id);
  } catch (err) {
    console.error(`❌ Failed during scoring:`, err);
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
