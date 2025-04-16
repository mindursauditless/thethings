// gpt-thread-test.js

const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

(async () => {
  try {
    console.log("🤖 SDK version:", require("openai/package.json").version);

    // Step 1: Create a blank thread
    const thread = await openai.beta.threads.create();
    console.log("🧵 Thread created:", thread);
    const thread_id = thread.id;

    // Step 2: Add a dummy message to thread
    const message = await openai.beta.threads.messages.create({
      thread_id,
      role: "user",
      content: "Hello GPT, just testing a thread run."
    });
    console.log("✉️ Message added:", message);

    // Step 3: Start the run
    const run = await openai.beta.threads.runs.create(
      thread_id,
      {
        assistant_id: process.env.CLASSIFY_ASSISTANT_ID
      }
    );
    console.log("🚀 Run started:", run);
  } catch (err) {
    console.error("🔥 Test GPT thread/run error:", err);

    if (err.response && typeof err.response.text === 'function') {
      const body = await err.response.text();
      console.error("📨 OpenAI error response:", body);
    }
  }
})();
