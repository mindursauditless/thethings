export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const {
    parent_key,
    BusinessName,
    WebsiteLink,
    EmailAddress,
    FirstName,
    UploadFiles = []
  } = req.body;

  // ✅ Acknowledge Zapier immediately
  res.status(200).json({ message: 'Report is being processed.' });
// Step 1: Get Assistant reply
const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
  headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
});

const messages = await messagesRes.json();
let content = messages.data?.[0]?.content?.[0]?.text?.value;

// Step 2: Strip formatting if wrapped in ```json
if (content?.startsWith('```json')) {
  content = content.replace(/```json|```/g, '').trim();
}

// Step 3: Parse it safely
let parsed;
try {
  parsed = JSON.parse(content);
} catch (err) {
  console.error("❌ Failed to parse GPT response as JSON:", err.message);
  return;
}

  // ✅ Background task: GPT logic + callback to Zap B
  setTimeout(async () => {
    try {
      console.log("⚙️ Background task started...");

      // 1. Upload CSVs
      // 2. Create Assistant thread
      // 3. Send user message with file_ids
      // 4. Run Assistant and wait
      // 5. Parse response

      // ⬇️ At the end, send the result to Zap B (Catch Hook)
      await fetch('https://hooks.zapier.com/hooks/catch/11845590/20e3egd/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_key,
          summary: parsed.summary,
          zapier_payload: parsed.zapier_payload
        })
      });
      const thread = await threadRes.json();
      const threadId = thread.id;

      console.log("✅ Report sent to Zap B.");

    } catch (err) {
      console.error("🔥 Background processing failed:", err.message);
    }
  }, 100); // Let response finish before doing anything heavy
}
