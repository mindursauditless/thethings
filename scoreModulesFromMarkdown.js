const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REPORT_MODEL = process.env.REPORT_MODEL || 'gpt-3.5-turbo';

async function scoreModulesFromMarkdown(parent_id) {
  const reportsDir = path.join(__dirname, 'reports');
  const promptPath = path.join(__dirname, 'scoringprompt.md');
  const systemPrompt = fs.readFileSync(promptPath, 'utf8');

  const files = fs.readdirSync(reportsDir).filter(f => f.startsWith(parent_id) && f.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(reportsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const moduleName = file.split('--')[1].replace('.md', '');

    const prompt = `
${systemPrompt}

---

Here is the full module report:

\`\`\`markdown
${content}
\`\`\`

Please return only the JSON object.
`;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: REPORT_MODEL,
          messages: [
            { role: 'system', content: 'You are an expert SEO auditor scoring modular reports.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3
        })
      });

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content;
      const score = JSON.parse(raw);

      const scoreBlock = `\n---\n## Final Module Scoring\n**Priority:** ${score.priority}\n\n**Confidence:** ${score.confidence}\n\n**Score:** ${score.score}/10\n`;

      fs.appendFileSync(filePath, scoreBlock);
      console.log(`✅ Scored and updated: ${file}`);

      await uploadMarkdownToSupabase(parent_id, moduleName);
    } catch (err) {
      console.error(`❌ Failed to score ${file}:`, err.message || err);
    }
  }
}

module.exports = { scoreModulesFromMarkdown };
