const { generateReport } = require('./generate-report');
const { scoreModuleMarkdown } = require('./scoreModulesFromMarkdown');
require('dotenv').config();

/**
 * Enhances and scores all specified modules for a given parent_id
 * @param {string} parent_id - Unique ID tying all modules together
 * @param {string[]} modules - List of module names to process
 * @param {Array<Object>} rankingData - Optional ranking data to enhance reports
 */
async function enhanceAndScoreModules(parent_id, modules = [], rankingData = []) {
  if (!parent_id || modules.length === 0) {
    console.error("❌ Missing parent_id or modules list");
    return;
  }

  for (const moduleName of modules) {
    try {
      console.log(`🧠 Enhancing module: ${moduleName}`);
      await generateReport(parent_id, moduleName, rankingData);

      console.log(`🧮 Scoring module: ${moduleName}`);
      await scoreModuleMarkdown(parent_id, moduleName);
    } catch (err) {
      console.error(`❌ Failed for module '${moduleName}':`, err.message);
    }
  }

  console.log(`✅ All modules enhanced and scored for parent_id: ${parent_id}`);
}

module.exports = { enhanceAndScoreModules };
