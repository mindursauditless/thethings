// prepareFilesForGPT.js — patched to skip invalid rows and log them

const { parse } = require('csv-parse/sync');
const https = require('https');

const MODULE_KEYWORDS = {
  schema: ["schema", "structured data", "markup", "json-ld"],
  internal_links: ["internal link", "internal anchor", "link depth", "links", "orphan", "301"],
  onsite: ["title tag", "title", "duplicate title", "h1", "h2", "description", "meta"],
  content_redundancy: ["duplicate content", "low word count", "thin content", "similar", "unique"],
  content_quality: ["duplicate content", "low word count", "thin content", "similar", "unique"],
  indexing: ["mobile", "4xx", "5xx", "sitemap", "crawl", "index", "301", "broken", "blocked", "canonical", "noindex", "orphan", "robots", "redirect"],
  information_architecture: ["internal link", "internal anchor", "link depth", "links", "orphan", "301", "mobile", "4xx", "5xx", "sitemap", "crawl", "index", "canonical", "noindex", "robots", "redirect"],
  gbp: ["reviews", "category", "address"],
  service_area_pages: ["title tag", "title", "duplicate title", "h1", "h2", "description", "meta", "internal link", "internal anchor", "link depth", "links", "orphan", "301", "crawl", "index", "broken", "blocked", "canonical", "noindex", "robots", "redirect"]
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

function matchModulesFromHeaders(headers) {
  const matchedModules = new Set();

  for (const header of headers) {
    const col = header.toLowerCase();
    for (const [module, keywords] of Object.entries(MODULE_KEYWORDS)) {
      if (keywords.some((kw) => col.includes(kw.toLowerCase()))) {
        matchedModules.add(module);
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

    let records = [];
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        on_record: (record, { lines }) => {
          if (!record || typeof record !== 'object') {
            console.warn(`⚠️ Skipping invalid row at line ${lines}`);
            return undefined;
          }
          return record;
        }
      });
    } catch (err) {
      console.error(`❌ Failed to parse ${file.filename || filePath}:`, err.message);
      continue;
    }

    console.log(`📊 Parsed ${records.length} valid rows from ${file.filename || filePath}`);

    allRows = allRows.concat(records);
    const headers = Object.keys(records[0] || {});
    const fileModules = matchModulesFromHeaders(headers);

    fileModules.forEach(mod => matchedModules.add(mod));

    for (const moduleName of fileModules) {
      if (!moduleData[moduleName]) moduleData[moduleName] = [];
      moduleData[moduleName] = moduleData[moduleName].concat(records);
    }
  }

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
