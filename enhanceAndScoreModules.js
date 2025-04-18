const fs = require('fs');
const path = require('path');
const { generateReport } = require('./generate-report');
const { scoreModuleMarkdown } = require('./scoreModulesFromMarkdown');
const { compareScores } = require('./compareScores');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');

async function enhanceAndScoreModules(parent_id, modules = [], rankingData = []) {
  if (!parent_id || modules.length === 0) {
    console.error("❌ Missing parent_id or modules list");
    return;
  }

  const scores = {};
  const reportsDir = path.join(__dirname, 'reports');
  const oldScorePath = path.join(reportsDir, `${parent_id}_score_history.json`);
  let oldScores = {};

  if (fs.existsSync(oldScorePath)) {
    oldScores = JSON.parse(fs.readFileSync(oldScorePath, 'utf8'));
  }

  for (const moduleName of modules) {
    try {
      console.log(`🧠 Enhancing module: ${moduleName}`);
      await generateReport(parent_id, moduleName, rankingData);

      console.log(`🧮 Scoring module: ${moduleName}`);
      const score = await scoreModuleMarkdown(parent_id, moduleName);
      if (score) scores[moduleName] = score;
    } catch (err) {
      console.error(`❌ Failed for module '${moduleName}':`, err.message);
    }
  }

  const diff = compareScores(oldScores, scores);
  const diffPath = path.join(reportsDir, `${parent_id}_score_diff.json`);
  const newScorePath = path.join(reportsDir, `${parent_id}_score_history.json`);

  fs.writeFileSync(diffPath, JSON.stringify(diff, null, 2));
  fs.writeFileSync(newScorePath, JSON.stringify(scores, null, 2));

  console.log(`📊 Saved score diff and history for ${parent_id}`);

  await uploadMarkdownToSupabase(parent_id, 'score_diff', JSON.stringify(diff, null, 2), 'json');
  await uploadMarkdownToSupabase(parent_id, 'score_history', JSON.stringify(scores, null, 2), 'json');
}

module.exports = { enhanceAndScoreModules };
