export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const ASSISTANT_ID = process.env.ASSISTANT_ID;

  const {
    parent_key,
    BusinessName,
    WebsiteLink,
    EmailAddress,
    FirstName,
    UploadFiles = []
  } = req.body;

  // ✅ Return quickly to Zapier
  res.status(200).json({ message: 'Report is being processed.' });

  // ✅ Background task: do all the real work after Zapier is done
  setTimeout(async () => {
    try {
      console.log("⚙️ Background task started...");

      const leadDetails = `
Business Name: ${BusinessName}
Website: ${WebsiteLink}
Email: ${EmailAddress}
First Name: ${FirstName}
`;

      // 🗂️ Upload all files to OpenAI
      const fileIds = [];
      for (const fileUrl of UploadFiles) {
        const fileRes = await fetch(fileUrl);
        const fileBlob = await fileRes.blob();
        const formData = new FormData();
        formData.append('file', fileBlob, fileUrl.split('/').pop());
        formData.append('purpose', 'assistants');

        const upload = await fetch('https://api.openai.com/v1/files', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`
          },
          body: formData
        });

        const fileData = await upload.json();
        if (fileData.id) fileIds.push(fileData.id);
      }

      // 🧠 Create a new thread
      const threadRes = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const thread = await threadRes.json();
      const threadId = thread.id;

      // ✉️ Add a user message
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

      // ▶️ Run the Assistant
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

      // ⏳ Wait for completion
      let status;
      do {
        const statusRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
        });
        status = await statusRes.json();
        if (status.status === 'completed') break;
        await new Promise(res => setTimeout(res, 1500));
      } while (status.status === 'queued' || status.status === 'in_progress');

      // 🧾 Get the assistant response
      const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
      });

      const messages = await messagesRes.json();
      let content = messages.data?.[0]?.content?.[0]?.text?.value;

      if (content?.startsWith('```json')) {
        content = content.replace(/```json|```/g, '').trim();
      }

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (err) {
        console.error("❌ Failed to parse GPT response as JSON:", err.message);
        return;
      }

      // 🔁 Send result to Zap B
      await fetch('https://hooks.zapier.com/hooks/catch/11845590/20e3egd/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_key,
          summary: parsed.summary,
          zapier_payload: parsed.zapier_payload
        })
      });

      console.log("✅ Report sent to Zap B.");

    } catch (err) {
      console.error("🔥 Background processing failed:", err.message);
    }
  }, 100);
}
