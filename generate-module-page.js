// generate-module-page.js

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const loadModulePrompt = require('./moduleprompt').loadModulePrompt;

router.post('/generate-module-page', async (req, res) => {
  try {
    const { module, rows = [] } = req.body;

    if (!module || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid module or rows' });
    }

    console.log(`📥 Generating final module page for: ${module}`);

    const moduleDir = path.join(__dirname, 'modules', module);
    const osPath = path.join(__dirname, 'modules', 'universal_os.md');

    const instructionPath = path.join(moduleDir, 'instructions.md');
    const deliverablePath = path.join(moduleDir, 'deliverable.md');

    const instructions = fs.existsSync(instructionPath) ? fs.readFileSync(instructionPath, 'utf8') : '';
    const deliverable = fs.existsSync(deliverablePath) ? fs.readFileSync(deliverablePath, 'utf8') : '';
    const os = fs.existsSync(osPath) ? fs.readFileSync(osPath, 'utf8') : '';

    const prompt = `
You are generating a final SEO audit report for the "${module}" module.

Use the following context to guide your tone, format, and recommendations:

## Universal OS Philosophy
${os}

## Module Instructions
${instructions}

## Deliverables Template (Structure)
${deliverable}

## Data to Analyze
${JSON.stringify(rows.slice(0, 25), null, 2)}

Format all lists (issues, action items, URLs) using bullets. Return valid JSON structured in the format provided in the Deliverables Template.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-0125-preview',
      messages: [
        { role: 'system', content: 'You are a JSON-only assistant. Do not return markdown or code blocks.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content returned from GPT');

    const cleaned = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    console.log(`✅ Generated report for ${module}`);
    res.status(200).json({ module, report: parsed });
  } catch (err) {
    console.error(`❌ Failed to generate module page:`, err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
