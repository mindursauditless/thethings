const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { loadModulePrompt } = require('./moduleprompt');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');
require('dotenv').config();

const REPORT_MODEL = process.env.REPORT_MODEL || 'gpt-4o';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function generateReport({ parent_id, moduleName, rows = [], rankings = [] }) {
  console.log(`🧠 Generating report for module: ${moduleName}`);

  // Optional blogPages support for internal_links module
  let blogs = [];
  if (moduleName === 'internal_links') {
    try {
      const blogPath = path.join(__dirname, 'raw-inputs', 'raw', parent_id, 'blogs.json');
      if (fs.existsSync(blogPath)) {
        const blogContent = fs.readFileSync(blogPath, 'utf8');
        blogs = JSON.parse(blogContent);
        console.log(`🔗 Loaded ${blogs.length} blog pages for internal linking`);
      }
    } catch (err) {
      console.warn(`⚠️ Could not load blogs.json:`, err.message);
    }
  }

  const prompt = loadModulePrompt(moduleName, rows, rankings, blogs);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: REPORT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO strategist generating markdown reports based on audit data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4
    })
  });

  const data = await response.json();
  const markdown = data?.choices?.[0]?.message?.content;

  if (!markdown) {
    console.warn(`❌ GPT returned 'undefined' or unusable markdown for ${moduleName}`);
    return null;
  }

  const reportPath = path.join(__dirname, 'reports', parent_id);
  if (!fs.existsSync(reportPath)) fs.mkdirSync(reportPath, { recursive: true });

  const reportFile = path.join(reportPath, `${moduleName}.md`);
  fs.writeFileSync(reportFile, markdown, 'utf8');
  console.log(`✅ Markdown saved to reports/${parent_id}/${moduleName}.md`);

  await uploadMarkdownToSupabase(parent_id, moduleName, markdown);
  console.log(`✅ Uploaded '${moduleName}' markdown to Supabase`);

  return markdown;
}

module.exports = { generateReport };
