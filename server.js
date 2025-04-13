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
      const fileBlob = await fileRes.buffer(); // note: buffer for node-fetch v2

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
      if (fileData.id) fileIds.push(fileData.id);
    }

    const threadRes = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const thread = await threadRes.json();
    const threadId = thread.id;

    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'user',
        content: `Please analyze the uploaded lead data.\n\n${leadDetails}\n\nReturn only JSON.`,
        file_ids: fileIds
      })
    });

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
    while (attempts < 20) {
      const statusRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
      });
      status = await statusRes.json();
      if (status.status === 'completed') break;
      await new Promise(r => setTimeout(r, 1500));
      attempts++;
    }

    const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
    });

    let content = (await messagesRes.json())?.data?.[0]?.content?.[0]?.text?.value;
    if (content?.startsWith('```json')) {
      content = content.replace(/```json|```/g, '').trim();
    }

    const parsed = JSON.parse(content);

    await fetch('https://hooks.zapier.com/hooks/catch/11845590/20e3egd/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent_key,
        summary: parsed.summary,
        zapier_payload: parsed.zapier_payload
      })
    });

    console.log("✅ Report sent to Zapier");
    res.status(200).json({ message: "Report complete and sent to Zapier." });

  } catch (err) {
    console.error("🔥 Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
