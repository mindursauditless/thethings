// prepareFilesForGPT.js

const fetch = require('node-fetch');
const { parse } = require('csv-parse/sync');

// ✂️ Add your own keywords to drop columns you don't want to send to GPT
const IGNORE_COLUMN_KEYWORDS = [
  'image', 'css', 'js', 'amp', 'trends', 'number of results', 'serp features by keyword', 'amp', 'covid', 'movie', 'ilr', 'salary', 'viewport', 'certificate', 'encoding', 'hreflang', 'software', 'html', 'twitter', 'open graph'
];

/**
 * Filters out columns whose headers include any ignored keyword
 */
function filterCsvColumns(records, ignoreList) {
  const lowerCaseIgnore = ignoreList.map(w => w.toLowerCase());
  const headers = Object.keys(records[0]);

  const keepHeaders = headers.filter(h => {
    return !lowerCaseIgnore.some(ignore => h.toLowerCase().includes(ignore));
  });

  const filteredRecords = records.map(row => {
    const filteredRow = {};
    for (const key of keepHeaders) {
      filteredRow[key] = row[key];
    }
    return filteredRow;
  });

  return { headers: keepHeaders, filteredRecords };
}

/**
 * Converts a CSV string into a markdown block formatted for GPT classification
 * @param {string} csvText - Raw CSV content
 * @param {string} filename - Original filename for traceability
 * @returns {string} GPT-formatted markdown block
 */
function formatCsvForGPT(csvText, filename) {
  const parsed = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    on_record: (record, { lines }) => {
      const keys = Object.keys(record);
      const hasEmptyRow = keys.every(k => record[k] === undefined || record[k] === '');
      if (hasEmptyRow) {
        console.warn(`⚠️ Skipping empty or malformed row on line ${lines}`);
        return null;
      }
      return record;
    }
  });

  if (!parsed.length) {
    console.warn(`⚠️ No valid rows found in ${filename}`);
    return `### File: ${filename}\n⚠️ No valid rows\n`;
  }

  const { headers, filteredRecords } = filterCsvColumns(parsed, IGNORE_COLUMN_KEYWORDS);

  const rowsMarkdown = filteredRecords.map(row => {
    const values = headers.map(h => row[h]?.toString().replace(/\n/g, ' ').trim() || '');
    return `- ${values.join(' | ')}`;
  }).join('\n');

  return [
    `### File: ${filename}`,
    `**Total Rows:** ${filteredRecords.length}`,
    `**Headers:** ${headers.join(', ')}`,
    `**Rows:**`,
    rowsMarkdown,
    ''
  ].join('\n');
}

/**
 * Prepares multiple uploaded CSV files for GPT classification
 * @param {Array} uploadedCsvs - [{ filename, url }]
 * @returns {Promise<{ formattedMarkdown: string }>}
 */
async function prepareFilesForGPT(uploadedCsvs = []) {
  const chunks = [];

  for (const { filename, url } of uploadedCsvs) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to download ${filename}`);

      const csvText = await res.text();
      const markdown = formatCsvForGPT(csvText, filename);
      console.log(`📄 Processed ${filename}, length: ${markdown.length}`);
      chunks.push(markdown);
    } catch (err) {
      console.error(`❌ Error processing ${filename}:`, err);
    }
  }

  return {
    formattedMarkdown: chunks.join('\n\n')
  };
}

module.exports = { prepareFilesForGPT };
