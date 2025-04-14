const express = require('express');
const fetch = require('node-fetch');
const { prepareFilesForGPT } = require('./prepareFilesForGPT');

const app = express();
app.use(express.json({ limit: '25mb' }));

// Health check
app.get('/', (req, res) => {
  res.send('✅ Server is running');
});

// Classification route
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

    const prompt = `
You will be given full CSV files below. Your job is to classify each row into the correct SEO module.
Only sort rows. Do not summarize or analyze.

Return valid JSON where each key is a module name (e.g., schema, internal_linking), and each value is an object:
{
  "source_file": "filename.csv",
  "rows": [...]
}

${formattedMarkdown}
    `;

    const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-0125-preview',
        messages: [
          { role: 'system', content: 'You are a JSON-only returning assistant. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      })
    });

    const chatJson = await chatRes.json();
    let content = chatJson?.choices?.[0]?.message?.content;

    if (!content || typeof content !== 'string' || content.length < 10) {
      throw new Error("GPT returned no usable content");
    }

    if (content.startsWith('```json')) {
      content = content.replace(/```json|```/g, '').trim();
    }

    const parsed = JSON.parse(content);

    console.log("✅ Parsed GPT classification output:", Object.keys(parsed));

    return res.status(200).json({
      name: Name,
      email: Email,
      business: Business_Name,
      website: Website_Link,
      modules: parsed
    });

  } catch (err) {
    console.error("🔥 classify-csvs error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
