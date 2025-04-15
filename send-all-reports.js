const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const thread_id = process.argv[2];
if (!thread_id) {
  console.error('❌ Please provide a thread_id as the first argument');
  process.exit(1);
}

const ZAPIER_HOOK = process.env.ZAPIER_FINAL_HOOK_URL;
if (!ZAPIER_HOOK || !ZAPIER_HOOK.startsWith('http')) {
  throw new Error('ZAPIER_FINAL_HOOK_URL is missing or invalid');
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

  const allModules = {};

  for (const file of data) {
    const moduleName = file.name.replace('.md', '');
    const publicUrl = `https://${process.env.SUPABASE_URL.replace('https://', '')}/storage/v1/object/public/reports/reports/${thread_id}/${file.name}`;

    try {
      const res = await fetch(publicUrl);
      if (!res.ok) throw new Error(`Failed to fetch file (${res.status})`);
      const content = await res.text();
      allModules[moduleName] = content;
    } catch (err) {
      console.error(`❌ Error loading ${moduleName}:`, err.message);
    }
  }

  try {
    console.log('📤 Sending combined report payload to Zapier...');
    const response = await fetch(ZAPIER_HOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_id, modules: allModules })
    });
    const zapText = await response.text();
    console.log(`📬 Zapier responded (${response.status}):`, zapText);
  } catch (err) {
    console.error('❌ Failed to send to Zapier:', err.message);
  }
})();
