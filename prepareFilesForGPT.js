// prepareFilesForGPT.js

const fetch = require('node-fetch');
const { parse } = require('csv-parse/sync');

function formatCsvForGPT(csvText, filename) {
  const parsed = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true, // allows minor column mismatches
    on_record: (record, { lines }) => {
      const keys = Object.keys(record);
      const hasEmptyRow = keys.every(k => record[k] === undefined || record[k] === '');
      if (hasEmptyRow) {
        console.warn(`⚠️ Skipping empty or malformed row on line ${lines}`);
        return null; // skip this record entirely
      }
      return record;
    }
  });

  if (!parsed.length) {
    console.warn(`⚠️ No valid rows found in ${filename}`);
    return `### File: ${filename}\n⚠️ No valid rows\n`;
  }

  const headers = Object.keys(parsed[0]);

  const rowsMarkdown = parsed.map(row => {
    const values = headers.map(h => row[h]?.toString().replace(/\n/g, ' ').trim() || '');
    return `- ${values.join(' | ')}`;
  }).join('\n');

  return [
    `### File: ${filename}`,
    `**Total Rows:** ${parsed.length}`,
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
