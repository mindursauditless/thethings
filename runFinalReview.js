const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');
require('dotenv').config();

const FINAL_MODEL = process.env.FINAL_MODEL || 'gpt-4o';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function saveReportUnprocessed({ moduleName, parent_id, reason }) {
  const unprocessedPath = path.join(__dirname, 'reports', parent_id, `skipped-${moduleName}.log`);
  const timestamp = new Date().toISOString();
  fs.writeFileSync(unprocessedPath, `[${timestamp}] Skipped ${moduleName}: ${reason}\n`);
}

async function runFinalReview(parent_id, rankingData = []) {
  const promptPath = path.join(__dirname, 'finalreview.md');
  const reviewPrompt = fs.readFileSync(promptPath, 'utf8');

  const reportDir = path.join(__dirname, 'reports', parent_id);
  const scoresPath = path.join(reportDir, 'scores.json');

  if (!fs.existsSync(scoresPath)) {
    console.error(`❌ No scores.json found for ${parent_id}. Skipping GPT-4 review.`);
    return;
  }

  const scores = JSON.parse(fs.readFileSync(scoresPath, 'utf8'));
  const files = fs.readdirSync(reportDir).filter(f => f.endsWith('.md') && f !== 'summary.md');

  for (const file of files) {
    const moduleName = file.replace('.md', '');
    const score = scores[moduleName];

    const skip = score && (
      (score.seo_quality_score ?? 0) >= 9 ||
      (score.score ?? 10) <= 3
    );

    if (skip) {
      console.log(`🚫 Skipping GPT-4 for '${moduleName}' — score indicates no major issues.`);
      saveReportUnprocessed({
        moduleName,
        parent_id,
        reason: `Skipped due to score (SEO ≥ 9 or module ≤ 3)`
      });
      continue;
    }

    const reportPath = path.join(reportDir, file);
    const originalMarkdown = fs.readFileSync(reportPath, 'utf8');

    // Fetch raw JSON from Supabase
    const rawUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/raw-inputs/raw/${parent_id}/${moduleName}.json`;
    let rawModuleData = [];

    try {
      const res = await fetch(rawUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      rawModuleData = await res.json();
    } catch (err) {
      console.error(`❌ Failed to load raw data for ${moduleName}:`, err.message);
      continue;
    }

    const prompt = `
${reviewPrompt}

---

### Original Module Report (markdown):
\`\`\`
${originalMarkdown}
\`\`\`

---

### Module-Specific CSV Rows:
\`\`\`json
${JSON.stringify(rawModuleData.slice(0, 50), null, 2)}
\`\`\`

---

### Ranking Data:
\`\`\`json
${JSON.stringify(rankingData.slice(0, 50), null, 2)}
\`\`\`

Return only your final markdown version of the module report.
`;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: FINAL_MODEL,
          messages: [
            { role: 'system', content: 'You are a senior SEO strategist reviewing internal team work.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2
        })
      });

      const data = await res.json();
      const finalMarkdown = data.choices?.[0]?.message?.content;

      if (!finalMarkdown || typeof finalMarkdown !== 'string') {
        console.error(`❌ GPT returned invalid content for ${moduleName}`);
        continue;
      }

      const timestamp = new Date().toISOString().split('.')[0].replace(/:/g, '-');
      const finalPath = path.join(reportDir, `final-${moduleName}-${timestamp}.md`);
      fs.writeFileSync(finalPath, finalMarkdown, 'utf8');
      console.log(`🧼 Final rewrite complete: ${finalPath}`);

      await uploadMarkdownToSupabase(parent_id, `final-${moduleName}-${timestamp.replace(/:/g, '-')}`);
      console.log(`📤 Final report uploaded for: ${moduleName}`);
    } catch (err) {
      console.error(`❌ GPT error during final review for ${moduleName}:`, err.message);
    }
  }
}

module.exports = { runFinalReview };
