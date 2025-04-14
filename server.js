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
          text: `You will be given CSV rows of SEO audit data.

Your task is to classify each row into the correct module based on the rules below.

Return a JSON object like this:
{
  "schema": {
    "source_file": "filename.csv",
    "rows": [
      { "URL": "...", "Issue": "...", "OtherColumn": "..." }
    ]
  },
  "internal_links": {
    "source_file": "filename.csv",
    "rows": [ ... ]
  }
}

Do not summarize. Do not analyze. Just group the full rows under the right modules.
Only include rows that are clearly relevant. Skip empty or non-actionable rows.

Include **any row** that could reasonably apply to the module — do not over-filter.  
Your goal is to provide **all possible context** for each module. SEO Strategic evaluation will happen later. The modules are indexing, internal linking, content quality, content redundancy, information architecture, gbp, schema, onsite, and service area pages.
Use the following matching criteria to determine which rows belong to each module:

schema: ["schema", "structured data", "markup", "json-ld"]
internal_links: ["internal link", "internal anchor", "link depth", "links", "orphan", "301"]
onsite: ["title tag", "title", "duplicate title", "h1", "h2", "description", "meta" ]
content_redundancy: ["duplicate content", "low word count", "thin content", "similar", "unique"]
content_quality: ["duplicate content", "low word count", "thin content", "similar", "unique"]
indexing: ["mobile", "4xx", "5xx", "sitemap", "crawl", "index", "301", "broken", "blocked", "crawl", "canonical", "noindex", "orphan", "robots", "redirect"]
information_architecture: ["internal link", "internal anchor", "link depth", "links", "orphan", "301", "mobile", "4xx", "5xx", "sitemap", "crawl", "index", "301", "broken", "blocked", "crawl", "canonical", "noindex", "orphan", "robots", "redirect"]
gbp: ["reviews", "category", "address"]
service_area_pages: ["title tag", "title", "duplicate title", "h1", "h2", "description", "meta", "internal link", "internal anchor", "link depth", "links", "orphan", "301", "crawl", "index", "301", "broken", "blocked", "crawl", "canonical", "noindex", "orphan", "robots", "redirect"]


Note: content quality, service area pages, and information architecture should also receive all ranking report data
...

For each module, include all CSV rows where the Issue column contains a related keyword.  Literally every single row.

`
          
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

      console.log("✅ Final modules parsed:", Object.keys(parsed));

      // Send result to Zapier catch hook in the background
      if (process.env.ZAPIER_CATCH_HOOK_URL) {
        const zapPayload = {
          name: Name,
          email: Email,
          business: Business_Name,
          website: Website_Link,
          thread_id: thread.id,
          modules: parsed
        };

        fetch(process.env.ZAPIER_CATCH_HOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(zapPayload)
        })
          .then(() => console.log('📤 Sent parsed modules to Zapier'))
          .catch(err => console.error('❌ Failed to send to Zapier:', err));
      }
    } else {
      throw new Error("Assistant run failed");
    }
  } catch (err) {
    console.error("🔥 Assistants API classify-csvs error:", err);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
