const fetch = require('node-fetch');
require('dotenv').config();

(async () => {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const ASSISTANT_ID = process.env.CLASSIFY_ASSISTANT_ID;

  try {
    console.log("🤖 Raw test — creating thread");

    // Step 1: Create thread
    const threadRes = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify({})
    });

    const thread = await threadRes.json();
    const thread_id = thread.id;
    console.log("🧵 Thread ID:", thread_id);

    // Step 2: Add message
    const msgRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify({
        role: "user",
        content: "Hello GPT, just testing a raw thread run."
      })
    });

    const message = await msgRes.json();
    console.log("✉️ Message:", message);

    // Step 3: Create run
    const runRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID
      })
    });

    const run = await runRes.json();
    console.log("🚀 Run created:", run);
  } catch (err) {
    console.error("🔥 Raw API test failed:", err);
  }
})();
