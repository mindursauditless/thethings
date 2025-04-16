const fetch = require('node-fetch');
const { parse } = require('csv-parse/sync');

/**
 * Converts a CSV string into a markdown block formatted for GPT classification
 * @param {string} csvText - Raw CSV content
 * @param {string} filename - Original filename for traceability
 * @returns {string} GPT-formatted markdown block
 */
function formatCsvForGPT(csvText, filename) {
  let records = parse(csvText, { columns: true, skip_empty_lines: true });

  // Remove empty rows
  records = records.filter(row =>
    Object.values(row).some(val => val && val.toString().trim() !== '')
  );

  // Limit to 800 rows
  if (records.length > 800) {
    console.warn(`✂️ Trimming ${records.length} rows down to 800 for: ${filename}`);
    records = records.slice(0, 800);
  }

  const headers = Object.keys(records[0] || {});
  const rowsMarkdown = records.map(row => {
    const values = headers.map(h => row[h]?.toString().replace(/\n/g, ' ').trim());
    return `- ${values.join(' | ')}`;
  }).join('\n');

  return [
    `### File: ${filename}`,
    `**Total Rows:** ${records.length}`,
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
      chunks.push(markdown);
    } catch (err) {
      console.error(`Error processing ${filename}:`, err);
    }
  }

  return {
    formattedMarkdown: chunks.join('\n\n')
  };
}

module.exports = { prepareFilesForGPT };
