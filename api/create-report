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

  const leadDetails = `
Business Name: ${BusinessName}
Website: ${WebsiteLink}
Email: ${EmailAddress}
First Name: ${FirstName}
`;

  try {
    // 1. Upload CSV files to OpenAI
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

    // 2. Create a thread
    const threadRes = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const thread = await threadRes.json();
    const threadId = thread.id;

    // 3. Add message to thread
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

    // 4. Run Assistant
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

    // 5. Wait for completion
    let status;
    do {
      const checkRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
      });
      status = await checkRes.json();
      if (status.status === 'completed') break;
      await new Promise((r) => setTimeout(r, 1500));
    } while (status.status === 'queued' || status.status === 'in_progress');

    // 6. Get assistant response
    const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
    });

    const messages = await messagesRes.json();
    let content = messages.data?.[0]?.content?.[0]?.text?.value;

    if (content?.startsWith('```json')) {
      content = content.replace(/```json|```/g, '').trim();
    }

    const parsed = JSON.parse(content);

    // 7. Return result to Zapier
    return res.status(200).json({
      parent_key,
      thread_id: threadId,
      summary: parsed.summary,
      zapier_payload: parsed.zapier_payload
    });

  } catch (err) {
    console.error("❌ Error in create-report:", err);
    return res.status(500).json({ error: 'Failed to generate report', details: err.message });
  }
}
