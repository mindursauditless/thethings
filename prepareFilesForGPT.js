// prepareFilesForGPT.js — Fully patched to fix MODULE_KEYWORDS issue and match headers

const { parse } = require('csv-parse/sync');
const https = require('https');

const MODULE_KEYWORDS = {
  schema: ['schema', 'json-ld'],
  internal_links: ['internal'],
  content_quality: ['content', 'word count'],
  information_architecture: ['architecture', 'structure'],
  service_area_pages: ['SAP', 'location'],
  topical_authority: ['topical', 'cluster'],
  onpage_optimization: ['meta', 'title', 'description'],
  conversion_barriers: ['conversion', 'CTA'],
  local_visibility: ['GBP', 'local']
};

function downloadCsv(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function matchModuleHeaders(headers) {
  const matchedModules = new Set();

  for (const header of headers) {
    const headerLower = header.toLowerCase();
    for (const [module, keywords] of Object.entries(MODULE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (headerLower.includes(keyword.toLowerCase())) {
          matchedModules.add(module);
        }
      }
    }
  }

  return [...matchedModules];
}

async function prepareFilesForGPT(uploadedCsvs, assistantId) {
  const moduleData = {};
  let allRows = [];
  let matchedModules = new Set();

  for (const file of uploadedCsvs) {
    const filePath = file.url || file.filename;
    console.log(`📥 Downloading file from: ${filePath}`);

    const fileContent = await downloadCsv(filePath);
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    console.log(`📊 Parsed ${records.length} rows from ${file.filename || filePath}`);

    allRows = allRows.concat(records);
    const headers = Object.keys(records[0] || {});
    const fileModules = matchModuleHeaders(headers);

    fileModules.forEach(mod => matchedModules.add(mod));

    for (const moduleName of fileModules) {
      if (!moduleData[moduleName]) moduleData[moduleName] = [];
      moduleData[moduleName] = moduleData[moduleName].concat(records);
    }
  }

  // Always include key modules if matching data exists
  const rankingRelated = ['information_architecture', 'content_quality', 'service_area_pages'];
  for (const module of rankingRelated) {
    if (!moduleData[module]) moduleData[module] = [];
  }

  if (assistantId === process.env.CLASSIFY_ASSISTANT_ID) {
    const maxRows = 1000;
    console.log(`🔍 Trimming input to ${maxRows} rows for GPT classification...`);
    allRows = allRows.slice(0, maxRows);
  }

  return {
    rows: allRows,
    matchedModules: [...matchedModules],
    ...moduleData
  };
}

module.exports = { prepareFilesForGPT };
