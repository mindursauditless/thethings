const { generateReport } = require('./create-report');
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
      await generateReport(thread_id, moduleName);
    } catch (err) {
      console.error(`❌ Error generating module report for ${moduleName}:`, err);
    }
  }
}

module.exports = { runModuleAudits };
