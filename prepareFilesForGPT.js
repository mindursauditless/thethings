const fs = require("fs");
const parse = require('csv-parse/lib/sync');
const path = require("path");
const CLASSIFY_ASSISTANT_ID = process.env.CLASSIFY_ASSISTANT_ID;

const https = require('https');

function downloadCsv(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}


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

const modulesToIncludeRanking = [
  "content_quality",
  "information_architecture",
  "service_area_pages"
];

async function prepareFilesForGPT(filePath, assistantId) {
  const fileContent = fs.readFileSync(filePath, "utf8");

  let parsedRows = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`📥 Total parsed rows: ${parsedRows.length}`);

  // ✅ Limit to first 1000 rows only for CLASSIFY_ASSISTANT_ID
  if (assistantId === CLASSIFY_ASSISTANT_ID) {
    parsedRows = parsedRows.slice(0, 1000);
    console.log(`🔒 Trimmed to first 1000 rows for assistant: ${assistantId}`);
  }

  const matchedModules = new Set();
  for (const header of headers) {
    for (const [module, patterns] of Object.entries(moduleMap)) {
      for (const regex of patterns) {
        if (regex.test(header)) {
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
