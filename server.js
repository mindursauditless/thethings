const express = require('express');
const fetch = require('node-fetch');
const FormData = require('form-data');

const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = process.env.ASSISTANT_ID;

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

    const fileIds = [];
    for (const fileUrl of UploadFiles) {
      console.log(`📎 Uploading file: ${fileUrl}`);
      const fileRes = await fetch(fileUrl);
      const fileBlob = await fileRes.buffer();

      const formData = new FormData();
      formData.append('file', fileBlob, fileUrl.split('/').pop());
      formData.append('purpose', 'assistants');

      const upload = await fetch('https://api.openai.com/v1/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      const fileData = await upload.json();
      if (fileData.id) {
        fileIds.push(fileData.id);
        console.log(`✅ Uploaded file ID: ${fileData.id}`);
      } else {
        console.warn("⚠️ File upload failed:", fileData);
      }
    }

    console.log("🧵 Creating thread...");
    const threadRes = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const thread = await threadRes.json();
    const threadId = thread.id;

    console.log("📨 Sending message to GPT...");
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'user',
       content: [
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
  "\n📎 You also have access to multiple uploaded CSV files.\n\n",
  "Return a single valid JSON object using the format provided in your documentation."
].join(''),
        file_ids: fileIds
      })
    });

    console.log("▶️ Running assistant...");
    const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID,
        instructions: 'Use your knowledge base and rules to return a summary and zapier_payload in valid JSON.'
      })
    });

    const run = await runRes.json();
    const runId = run.id;

    let status;
    let attempts = 0;
    console.log("⏳ Waiting for GPT to complete...");
    while (attempts < 20) {
      const statusRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
      });
      status = await statusRes.json();
      if (status.status === 'completed') break;
      await new Promise(r => setTimeout(r, 1500));
      attempts++;
    }

    console.log("📨 Fetching GPT response...");
    const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
    });

    const messages = await messagesRes.json();
    let content = messages.data?.[0]?.content?.[0]?.text?.value;

    console.log("🧠 GPT raw content:", content);

    // Fail gracefully if content is invalid
    if (!content || typeof content !== 'string' || content.length < 10) {
      throw new Error("GPT returned no usable content");
    }

    // Clean up markdown wrappers if needed
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

    // Send to Zapier
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
