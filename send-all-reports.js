const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const { sendReportToZapier } = require('./zapier-report-hook');

const thread_id = process.argv[2];
if (!thread_id) {
  console.error('❌ Please provide a thread_id as the first argument');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

(async () => {
  const folderPath = `reports/${thread_id}`;
  const { data, error } = await supabase
    .storage
    .from('reports')
    .list(folderPath, { limit: 50 });

  if (error || !data?.length) {
    console.error('❌ Could not list report files from Supabase:', error || 'No files found');
    return;
  }

  for (const file of data) {
    const moduleName = file.name.replace('.md', '');

    const publicUrl = `https://${process.env.SUPABASE_URL.replace('https://', '')}/storage/v1/object/public/reports/reports/${thread_id}/${file.name}`;

    try {
      const res = await fetch(publicUrl);
      if (!res.ok) throw new Error(`Failed to fetch file (${res.status})`);
      const content = await res.text();

      await sendReportToZapier({ thread_id, moduleName, content });
    } catch (err) {
      console.error(`❌ Error sending ${moduleName}:`, err.message);
    }
  }
})();
