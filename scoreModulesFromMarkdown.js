const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');
const { compareScores } = require('./compareScores');
require('dotenv').config();

async function scoreModuleMarkdown(parent_id, moduleName) {
  const reportsDir = path.join(__dirname, 'reports');
  const file = `${parent_id}--${moduleName}.md`;
  const filepath = path.join(reportsDir, file);

  if (!fs.existsSync(filepath)) {
    console.warn(`⚠️ No markdown found for module ${moduleName}`);
    return null;
  }

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
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
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

    const updated = `${content.trim()}

---
## Module Scoring
**Priority:** ${score.priority}
**Confidence:** ${score.confidence}
**Score:** ${score.score}/10
`;

    fs.writeFileSync(filepath, updated, 'utf8');
    await uploadMarkdownToSupabase(parent_id, moduleName, updated);

    console.log(`🧮 Scored ${moduleName}: ${score.score}/10`);
    return score;
  } catch (err) {
    console.error(`❌ Failed to score module ${moduleName}:`, err.message);
    return null;
  }
}

module.exports = { scoreModuleMarkdown };
