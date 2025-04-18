const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const FINAL_MODEL = process.env.FINAL_MODEL || 'gpt-4o';

async function runFinalReview(parent_id, rankingData = []) {
  const reportsDir = path.join(__dirname, 'reports');
  const outputPath = path.join(reportsDir, `${parent_id}--final-reviewed.md`);

  const reportFiles = fs.readdirSync(reportsDir).filter(f =>
    f.startsWith(parent_id) && f.endsWith('.md') && !f.includes('final')
  );

  if (reportFiles.length === 0) {
    console.warn(`⚠️ No markdown files found for parent_id ${parent_id}`);
    return;
  }

  const combinedMarkdown = reportFiles.map(filename =>
    fs.readFileSync(path.join(reportsDir, filename), 'utf8')
  ).join('\n\n---\n\n');

  const prompt = `
You are a senior SEO strategist. Review the following markdown reports and combine them into one clean, cohesive strategy document. Fix structure, remove redundancy, and ensure clarity.

Return only the final markdown version. Do not explain your edits.

---

${combinedMarkdown}

---

### Related Ranking Data:
\`\`\`json
${JSON.stringify(rankingData.slice(0, 30), null, 2)}
\`\`\`
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({
      model: FINAL_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5
    })
  });

  const data = await response.json();
  const markdown = data.choices?.[0]?.message?.content?.trim();

  if (!markdown) {
    console.warn(`⚠️ GPT returned no final report`);
    return;
  }

  fs.writeFileSync(outputPath, markdown, 'utf8');
  console.log(`✅ Final report saved to ${outputPath}`);
}

module.exports = { runFinalReview };
