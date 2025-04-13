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

  res.status(200).json({ message: 'Report is being processed.' });

(async () => {
  try {
    console.log("⚙️ Background task started...");

      const leadDetails = `
Business Name: ${BusinessName}
Website: ${WebsiteLink}
Email: ${EmailAddress}
First Name: ${FirstName}
`;

      // 🗂️ Upload CSVs
      console.log("📦 Uploading files...");
      const fileIds = [];
      for (const fileUrl of UploadFiles) {
        console.log(`📎 Uploading file: ${fileUrl}`);
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
        if (fileData.id) {
          fileIds.push(fileData.id);
          console.log(`✅ Uploaded: ${fileData.id}`);
        } else {
          console.error("❌ File upload failed:", fileData);
        }
      }

      console.log("✅ Files uploaded:", fileIds);

      // 🧵 Create thread
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
      console.log("✅ Thread created:", threadId);

      // ✉️ Add message to thread
      console.log("✉️ Sending message to Assistant...");
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
      console.log("▶️ Running Assistant...");
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

      // ⏳ Polling GPT
      console.log("⏳ Waiting for GPT...");
      let status;
      let attempts = 0;
      const maxAttempts = 20;
      do {
        const statusRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
        });
        status = await statusRes.json();
        if (status.status === 'completed') break;
        attempts++;
        if (attempts >= maxAttempts) {
          console.error("❌ GPT polling exceeded max attempts.");
          return;
        }
        await new Promise(res => setTimeout(res, 1500));
      } while (status.status === 'queued' || status.status === 'in_progress');

      // 🧾 Fetch GPT response
      const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
      });

      const messages = await messagesRes.json();
      let content = messages.data?.[0]?.content?.[0]?.text?.value;
      console.log("🧠 GPT raw content:", content);

      if (!content || typeof content !== 'string') {
        console.error("❌ GPT returned no usable content.");
        return;
      }

      if (content.startsWith('```json')) {
        content = content.replace(/```json|```/g, '').trim();
      }

      let parsed;
      try {
        parsed = JSON.parse(content);
        console.log("✅ Parsed GPT response:", parsed);
      } catch (err) {
        console.error("❌ Failed to parse GPT response:", err.message);
        return;
      }

      // 📤 Send to Zapier
      console.log("📤 Sending report to Zap B:", {
        parent_key,
        summary: parsed.summary,
        zapier_payload: parsed.zapier_payload
      });

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
      console.log("📬 Zapier webhook response:", zapText);
      console.log("✅ Report sent to Zap B.");

  } catch (err) {
    console.error("🔥 Background processing failed:", err.message);
  }
})();
