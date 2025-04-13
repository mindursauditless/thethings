const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/', async (req, res) => {
  const {
    parent_key,
    BusinessName,
    WebsiteLink,
    EmailAddress,
    FirstName,
    UploadFiles = []
  } = req.body;

  try {
    console.log("📥 Request received:", req.body);
    console.log("⚙️ Starting full report process...");

    const leadDetails = `
Business Name: ${BusinessName}
Website: ${WebsiteLink}
Email: ${EmailAddress}
First Name: ${FirstName}
`;

    // 📊 Fetch and flatten CSV data
    const allCsvData = [];
    for (const fileUrl of UploadFiles) {
      console.log(`📎 Downloading file: ${fileUrl}`);
      const fileRes = await fetch(fileUrl);
      const csvText = await fileRes.text();
      const lines = csvText.trim().split('\n');
      const headers = lines[0]?.split(',') || [];
      const rows = lines.slice(1).map(l => l.split(','));

      allCsvData.push({
        filename: fileUrl.split('/').pop(),
        headers,
        sample: rows.slice(0, 5)
      });
    }

    const csvSummary = allCsvData.map(file => {
      return `File: ${file.filename}
Headers: ${file.headers.join(', ')}
Sample Rows:
${file.sample.map(row => row.join(', ')).join('\n')}`;
    }).join('\n\n');

    const promptMessage = [
      "You are The Lead Whisperer, an advanced local SEO strategist.\n\n",
      "You:\n",
      "- Prioritize clarity, business impact, and lead generation.\n",
      "- Are direct, confident, and tactical.\n",
      "- Use the Lead Whisperer OS framework to interpret all data and guide decisions.\n",
      "- Categorize recommendations as Must-Act, Nice-to-Know, Strategic Fix, or Validate.\n",
      "- Cross-reference across all uploaded modules using the Modular Awareness Layer.\n",
      "- Make sure to create a summary report as defined below.\n",
      "- Make sure to provide the specific markup needed for Zapier.\n\n",
      "📥 Lead Details:\n",
      leadDetails,
      "\n\n📎 Uploaded CSV Data:\n",
      csvSummary,
      "\n\nReturn a single valid JSON object using the format provided in your documentation."
    ].join('');

    console.log("💬 Sending chat completion...");

    const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-0125-preview',
        messages: [
          { role: 'system', content: 'You are a JSON-only returning assistant. Respond only with valid JSON.' },
          { role: 'user', content: promptMessage }
        ],
        temperature: 0.3
      })
    });

    const chatJson = await chatRes.json();
    let content = chatJson?.choices?.[0]?.message?.content;

    console.log("🧠 GPT raw content:", content);

    if (!content || typeof content !== 'string' || content.length < 10) {
      throw new Error("GPT returned no usable content");
    }

    if (content.startsWith('```json')) {
      content = content.replace(/```json|```/g, '').trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      console.error("❌ Failed to parse GPT response:", content);
      throw new Error("Invalid JSON returned from GPT");
    }

    console.log("✅ Parsed GPT response:", parsed);

    const zapRes = await fetch('https://hooks.zapier.com/hooks/catch/11845590/20e3egd/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent_key,
        summary: parsed.summary,
        zapier_payload: parsed.zapier_payload
      })
    });

    const zapText = await zapRes.text();
    console.log("📤 Sent to Zapier. Zapier replied:", zapText);

    return res.status(200).json({ message: "Report complete and sent to Zapier." });

  } catch (err) {
    console.error("🔥 FULL ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
