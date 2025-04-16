// send-all-reports.js — Patched to safely skip Zapier if ZAPIER_HOOK is not defined

const fetch = require('node-fetch');
require('dotenv').config();

const ZAPIER_HOOK = process.env.ZAPIER_HOOK;

async function sendAllReports(thread_id, allModules) {
  if (!ZAPIER_HOOK) {
    console.warn("⚠️ ZAPIER_HOOK is not defined. Skipping Zapier webhook.");
    return;
  }

  try {
    console.log('📤 Sending combined report payload to Zapier...');
    console.log('📡 Payload:', JSON.stringify({ thread_id, modules: allModules }, null, 2));
    console.log('📡 ZAPIER_HOOK:', ZAPIER_HOOK);

    const response = await fetch(ZAPIER_HOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_id, modules: allModules })
    });

    const text = await response.text();
    console.log('📬 Zapier response:', response.status, text);

    if (!response.ok) {
      throw new Error(`Zapier returned non-OK status: ${response.status}`);
    }
  } catch (err) {
    console.error(`🔥 Error sending combined report to Zapier:`, err);
  }
}

module.exports = { sendAllReports };
