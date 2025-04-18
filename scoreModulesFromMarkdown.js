
const fs = require('fs');
const path = require('path');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');
const { compareScores } = require('./compareScores');

async function scoreModulesFromMarkdown(parent_id) {
  const reportsDir = path.join(__dirname, 'reports');
  const reportFiles = fs.readdirSync(reportsDir).filter(file =>
    file.startsWith(parent_id) && file.endsWith('.md')
  );

  const scores = {};
  const diffs = {};
  const scoreHistoryFile = path.join(reportsDir, `${parent_id}_score_history.json`);

  for (const file of reportFiles) {
    const filepath = path.join(reportsDir, file);
    const moduleName = file.replace(`${parent_id}--`, '').replace('.md', '');

    try {
      const content = fs.readFileSync(filepath, 'utf8');

      const scorePrompt = `
You are an SEO scoring engine. Read the markdown report below and return a JSON object like:
{
  "score": 7.5,
  "confidence": 0.85,
  "priority": "High"
}
Only return JSON. No comments or explanations.

Report:
${content}
`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": \`Bearer \${process.env.OPENAI_API_KEY}\`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.REPORT_MODEL || 'gpt-3.5-turbo',
          messages: [{ role: "user", content: scorePrompt }],
          temperature: 0.2
        })
      });

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content;
      if (!raw || raw.trim() === 'undefined') throw new Error("GPT returned undefined");

      const score = JSON.parse(raw);
      scores[moduleName] = score;

      // Read previous score for diff tracking
      const oldScoresPath = path.join(reportsDir, `${parent_id}_score_history.json`);
      let oldScores = {};
      if (fs.existsSync(oldScoresPath)) {
        oldScores = JSON.parse(fs.readFileSync(oldScoresPath, 'utf8'));
      }

      const delta = compareScores(oldScores[moduleName], score);
      if (delta) diffs[moduleName] = delta;

      // Inject score block into markdown
      const updated = `${content.trim()}

---
## Module Scoring
**Priority:** ${score.priority}
**Confidence:** ${score.confidence}
**Score:** ${score.score}/10
`;

      fs.writeFileSync(filepath, updated, 'utf8');
      console.log(`🧮 ${moduleName} scored: ${score.score}/10 (${delta ? 'Δ ' + delta : 'no previous'})`);

      await uploadMarkdownToSupabase(parent_id, moduleName);
    } catch (err) {
      console.error(`❌ Failed to score ${file}:`, err.message);
    }
  }

  // Save score diff and current scores
  fs.writeFileSync(path.join(reportsDir, `${parent_id}_score_diff.json`), JSON.stringify(diffs, null, 2));
  fs.writeFileSync(path.join(reportsDir, `${parent_id}_score_history.json`), JSON.stringify(scores, null, 2));
  console.log(`📦 Saved module scores to: ${reportsDir}/${parent_id}_score_history.json`);
}

module.exports = { scoreModulesFromMarkdown };
