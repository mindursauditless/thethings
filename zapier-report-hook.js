const fetch = require('node-fetch');

async function sendReportToZapier({ thread_id, moduleName, content }) {
  try {
    const response = await fetch(process.env.ZAPIER_FINAL_HOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thread_id,
        module: moduleName,
        markdown: content,
        url: `https://${process.env.SUPABASE_URL.replace('https://', '')}/storage/v1/object/public/reports/${thread_id}/${moduleName}.md`
      })
    });

    if (!response.ok) {
      console.error(`❌ Failed to send ${moduleName} to Zapier:`, await response.text());
    } else {
      console.log(`📤 Sent ${moduleName} report to Zapier`);
    }
  } catch (err) {
    console.error(`🔥 Error posting ${moduleName} to Zapier:`, err);
  }
}

module.exports = { sendReportToZapier };
