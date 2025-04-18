const fetch = require('node-fetch');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REPORT_MODEL = process.env.REPORT_MODEL || 'gpt-3.5-turbo';

async function enhanceWithRankings({ moduleName, parent_id, rows, rankingData, reportMarkdown }) {
  if (!OPENAI_API_KEY) throw new Error("Missing OpenAI API key");

  const prompt = `
You are enhancing an SEO module report for: **${moduleName}**

---

### Original Module Report:
\`\`\`markdown
${reportMarkdown}
\`\`\`

---

### Ranking Data:
${JSON.stringify(rankingData.slice(0, 50), null, 2)}

Use this ranking data to:
- Add specific page-level insight
- Prioritize high-value opportunities
- Identify what’s most likely to move the needle

Then score this module:
- Priority: High / Medium / Low
- Confidence: 0.0–1.0
- Score: 0–10

---

### Return your answer as JSON like this:
\`\`\`json
{
  "markdown": "...",
  "score": {
    "priority": "High",
    "confidence": 0.87,
    "score": 9.0
  }
}
\`\`\`
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: REPORT_MODEL,
        messages: [
          { role: "system", content: "You are an SEO analyst enhancing modular reports." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      })
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;

    const extracted = JSON.parse(raw);
    return extracted;
  } catch (err) {
    console.error(`❌ Error in enhanceWithRankings for ${moduleName}:`, err);
    return null;
  }
}

module.exports = { enhanceWithRankings };

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: REPORT_MODEL,
        messages: [
          { role: "system", content: "You are an SEO analyst enhancing modular reports." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      })
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;

    if (!raw || typeof raw !== 'string') {
      console.error(`❌ GPT did not return a usable markdown+score object for ${moduleName}`);
      return null;
    }

    let extracted;
    try {
      extracted = JSON.parse(raw);
    } catch (err) {
      console.error(`❌ Failed to parse JSON for ${moduleName}:`, err.message);
      return null;
    }

    return {
      ...extracted,
      usage: data.usage
    };

  } catch (err) {
    console.error(`❌ Error in enhanceWithRankings for ${moduleName}:`, err);
    return null;
  }

