// server.js — using Assistants API

const express = require('express');
const fetch = require('node-fetch');
const { prepareFilesForGPT } = require('./prepareFilesForGPT');
const { OpenAI } = require('openai');

const app = express();
app.use(express.json({ limit: '25mb' }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

app.get('/', (req, res) => {
  res.send('✅ Server is up and running with Assistants API');
});

app.post('/classify-csvs', async (req, res) => {
  // ✅ Respond immediately to Zapier
  res.status(200).json({ message: 'Received. Processing in background...' });

  // 🧠 Background process begins
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

    // Chunk if too large for a single Assistants message
    const CHUNK_SIZE = 950_000;
    const chunks = [];
    for (let i = 0; i < formattedMarkdown.length; i += CHUNK_SIZE) {
      chunks.push(formattedMarkdown.slice(i, i + CHUNK_SIZE));
    }

    const thread = await openai.beta.threads.create();

    for (const chunk of chunks) {
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: [{ type: 'text', text: chunk }]
      });
    }

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Now that you have all the CSV data, classify the rows into the correct SEO modules. Return valid JSON as described earlier.`
        }
      ]
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
      instructions: 'Only return valid JSON, nothing else.'
    });

    let runStatus = run.status;
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

      // You can send this to Notion, email, or a second Zapier hook here
      console.log("✅ Final modules parsed:", Object.keys(parsed));
    } else {
      throw new Error("Assistant run failed");
    }
  } catch (err) {
    console.error("🔥 Assistants API classify-csvs error:", err);
  }
});

// Replace with your actual Zapier Catch Hook URL
const ZAPIER_CATCH_HOOK_URL = process.env.ZAPIER_CATCH_HOOK_URL;

await fetch(ZAPIER_CATCH_HOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: Name,
    email: Email,
    business: Business_Name,
    website: Website_Link,
    modules: parsed
  })
});

console.log("📤 Sent parsed modules to Zapier");


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
