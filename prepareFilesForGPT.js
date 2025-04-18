const fetch = require('node-fetch');
const { parse } = require('csv-parse/sync');

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
  'content_quality',
  'information_architecture',
  'service_area_pages'
];

async function prepareFilesForGPT(uploadedCsvs = []) {
  const moduleData = Object.fromEntries(Object.keys(MODULE_KEYWORDS).map(key => [key, []]));
  const allRows = [];

  for (const { filename, url } of uploadedCsvs) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to download ${filename}`);

      const csvText = await res.text();
      const records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true
      });

      const lowerFilename = filename.toLowerCase();
      const isRankingFile = lowerFilename.includes('ranking') || lowerFilename.includes('positions');

      for (const row of records) {
        const rowText = Object.values(row).join(' ').toLowerCase();
        const annotatedRow = { ...row, source_file: filename };
        allRows.push(annotatedRow);

        let matched = false;

        for (const [module, keywords] of Object.entries(MODULE_KEYWORDS)) {
          if (keywords.some(k => rowText.includes(k))) {
            moduleData[module].push(annotatedRow);
            matched = true;
          }
        }

        if (isRankingFile) {
          for (const module of modulesToIncludeRanking) {
            moduleData[module].push(annotatedRow);
          }
        }

        if (!matched && !isRankingFile) {
          // Log unmatched rows if needed
          // console.log(`🚫 Unmatched row in ${filename}:`, rowText.slice(0, 80));
        }
      }

      console.log(`📄 Processed ${records.length} rows from ${filename}`);
    } catch (err) {
      console.error(`❌ Error processing ${filename}:`, err);
    }
  }

  const matchedModules = Object.entries(moduleData).filter(([_, rows]) => rows.length > 0).map(([key]) => key);
  console.log("📊 Matched modules:", matchedModules);

  return {
    matchedModules,
    rows: allRows,
    rankings: uploadedCsvs,
    ...moduleData
  };
}

module.exports = { prepareFilesForGPT };
