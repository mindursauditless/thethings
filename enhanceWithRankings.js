const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const ENHANCE_MODEL = process.env.REPORT_MODEL || 'gpt-3.5-turbo';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function enhanceWithRankings({ moduleName, parent_id, rows, rankingData, reportMarkdown }) {
  try {
    const enhancePromptPath = path.join(__dirname, 'enhanceprompt.md');
    const enhancePrompt = fs.existsSync(enhancePromptPath)
      ? fs.readFileSync(enhancePromptPath, 'utf8')
      : '';

    if (!enhancePrompt.trim()) {
      console.warn(`⚠️ Missing enhanceprompt.md content`);
      return {};
    }

    const inputPrompt = `
${enhancePrompt}

---

## Existing Markdown Report:
\`\`\`
${reportMarkdown}
\`\`\`

---

## Raw Module Data (first 50 rows):
\`\`\`json
${JSON.stringify(rows.slice(0, 50), null, 2)}
\`\`\`

---

## Related Ranking Data (if available):
\`\`\`json
${JSON.stringify(rankingData.slice(0, 50), null, 2)}
\`\`\`
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + OPENAI_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: ENHANCE_MODEL,
        messages: [{ role: "user", content: inputPrompt }],
        temperature: 0.4
      })
    });

    const data = await response.json();
    const markdown = data.choices?.[0]?.message?.content;

    return {
      markdown: typeof markdown === 'string' ? markdown.trim() : undefined,
      usage: data.usage || null
    };
  } catch (err) {
    console.error(`❌ GPT enhancement error for ${moduleName}:`, err.message);
    return {};
  }
}

module.exports = { enhanceWithRankings };
