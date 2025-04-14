// server.js — using Assistants API

const express = require('express');
const fetch = require('node-fetch');
const { prepareFilesForGPT } = require('./prepareFilesForGPT');
const { OpenAI } = require('openai');

const app = express();
app.use(express.json({ limit: '25mb' }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // ✅ Set this in Railway or your .env
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID; // ✅ Set this too

app.get('/', (req, res) => {
  res.send('✅ Server is up and running with Assistants API');
});

app.post('/classify-csvs', async (req, res) => {
  try {
    const {
      Business_Name,
      Website_Link,
      Email,
      Name,
      Files = ''
    } = req.body;

    console.log("📥 Zapier Data:", { Business_Name, Website_Link, Email, Name });

    const fileUrls = Files.split(',').map(url => url.trim()).filter(Boolean);
    const uploadedCsvs = fileUrls.map(url => {
      const parts = url.split('/');
      return {
        filename: decodeURIComponent(parts[parts.length - 1]),
        url
      };
    });

    const { formattedMarkdown } = await prepareFilesForGPT(uploadedCsvs);

    console.log("🧠 Total Markdown Length:", formattedMarkdown.length);

    // 🧠 Assistants API flow
    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Here is the full CSV data from an SEO audit. Classify each row into the correct SEO module.

Only classify. Do not summarize. Return only valid JSON with modules as keys:

{
  "module_name": {
    "source_file": "filename.csv",
    "rows": [...]
  }
}

CSV Data:

${formattedMarkdown}`
        }
      ]
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
      instructions: 'Only return valid JSON, nothing else.'
    });

    let runStatus = run.status;
    let result;

    while (runStatus !== 'completed' && runStatus !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const statusCheck = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      runStatus = statusCheck.status;
    }

    if (runStatus === 'completed') {
      const messages = await openai.beta.threads.messages.list(thread.id);
      const latest = messages.data.find(m => m.role === 'assistant');
      const content = latest?.content?.[0]?.text?.value?.trim();

      if (!content || content.length < 10) {
        throw new Error("GPT returned no usable content");
      }

      const cleaned = content.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return res.status(200).json({
        name: Name,
        email: Email,
        business: Business_Name,
        website: Website_Link,
        modules: parsed
      });
    } else {
      throw new Error("Assistant run failed");
    }
  } catch (err) {
    console.error("🔥 Assistants API classify-csvs error:", err);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
