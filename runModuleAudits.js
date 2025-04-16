const fs = require('fs');
const path = require('path');
const { generateReport } = require('./create-report');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');

const moduleNames = [
  'schema',
  'internal_links',
  'content_quality',
  'information_architecture',
  'service_area_pages',
  'topical_authority',
  'onpage_optimization',
  'conversion_barriers',
  'local_visibility'
];

async function runModuleAudits(thread_id, modules = moduleNames) {
  if (!thread_id) {
    console.error('❌ runModuleAudits() was called without a thread_id');
    return;
  }

  for (const moduleName of modules) {
    try {
      console.log(`📊 Generating module report: ${moduleName}`);
      const content = await generateReport(thread_id, moduleName);

      if (!content) {
        console.error(`❌ GPT returned no content for ${moduleName}`);
        continue;
      }

      const reportsDir = path.join(__dirname, 'reports');
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

      const filePath = path.join(reportsDir, `${thread_id}--${moduleName}.md`);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Saved report: /reports/${thread_id}--${moduleName}.md`);

      await uploadMarkdownToSupabase(thread_id, moduleName);
    } catch (err) {
      console.error(`❌ Error generating module report for ${moduleName}:`, err);
    }
  }
}

module.exports = { runModuleAudits };
