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

      console.log("✅ Report sent to Zap B.");

    } catch (err) {
      console.error("🔥 Background processing failed:", err.message);
    }
  }, 100); // Let response finish before doing anything heavy
}
