// runModuleAudits.js

const fetch = require('node-fetch');
const { OpenAI } = require('openai');
const { loadModulePrompt } = require('./moduleprompt');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Run GPT audit for each module and return audit output
 * @param {Object} parsedModules - the JSON object from previous classification
 * @returns {Promise<Object>} - audit results per module
 */
async function runModuleAudits(parsedModules) {
  const results = {};

  for (const [moduleName, moduleData] of Object.entries(parsedModules)) {
    if (!moduleData.rows || moduleData.rows.length === 0) {
      console.log(`⏩ Skipping ${moduleName} — no rows to analyze.`);
      continue;
    }

    const prompt = loadModulePrompt(moduleName, moduleData.rows);

    try {
      const chatRes = await openai.chat.completions.create({
        model: 'gpt-4-0125-preview',
        messages: [
          { role: 'system', content: 'You are a JSON-only returning assistant. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });

      let content = chatRes.choices?.[0]?.message?.content;

      if (!content || typeof content !== 'string' || content.length < 10) {
        throw new Error(`GPT returned no usable content for module: ${moduleName}`);
      }

      if (content.startsWith('```json')) {
        content = content.replace(/```json|```/g, '').trim();
      }

      const parsed = JSON.parse(content);
      results[moduleName] = parsed;

      console.log(`✅ Completed audit for ${moduleName}`);
    } catch (err) {
      console.error(`❌ GPT audit failed for ${moduleName}:`, err);
    }
  }

  return results;
}

module.exports = { runModuleAudits };
