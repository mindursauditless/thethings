// generate-module-page.js

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const loadModulePrompt = require('./moduleprompt').loadModulePrompt;

router.post('/generate-module-page', async (req, res) => {
  console.log('📥 Incoming request to /generate-module-page');
  console.log('🔍 Body:', JSON.stringify(req.body, null, 2));

  try {
    const { module, rows = [] } = req.body;

    if (!module || !Array.isArray(rows) || rows.length === 0) {
      console.error('❌ Invalid input. Module:', module, 'Rows:', rows);
      return res.status(400).json({ error: 'Missing or invalid module or rows' });
    }

    console.log(`📥 Generating final module page for: ${module}`);
    console.log(`📊 Row count: ${rows.length}`);

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

Format all lists (issues, action items, URLs) using bullets. Return valid Markdown, not JSON or code blocks.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-0125-preview',
      messages: [
        { role: 'system', content: 'You are a Markdown-only assistant. Return only valid Markdown, not JSON or code blocks.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      console.error('❌ GPT returned no content');
      return res.status(500).json({ error: 'No content returned from GPT' });
    }

    console.log('📦 Full GPT Output (raw content):');
    console.log(content);

    const outPath = path.join(__dirname, `temp-output-${module}.md`);
    fs.writeFileSync(outPath, content, 'utf8');
    const stats = fs.statSync(outPath);
    console.log(`📁 GPT output saved to: ${outPath} (${stats.size} bytes)`);

    res.status(200).json({
      status: "✅ Report saved to file",
      module
    });

  } catch (err) {
    console.error(`❌ Failed to generate module page:`, err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
