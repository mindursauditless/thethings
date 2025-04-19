const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { uploadJsonToSupabase } = require('./upload-json-to-supabase');
uploadedCsvs = uploadedCsvs.filter(f => f && f.filename && f.url);

function parseCsv(csvString, sourceFile) {
  const records = parse(csvString, {
    columns: true,
    skip_empty_lines: true
  });
  return records.map(row => ({
    ...row,
    source_file: sourceFile
  }));
}

function classifyCsv(filename) {
  const name = (filename || '').toLowerCase();
  if (name.includes('structured_data')) return 'schema';
  if (name.includes('internal_links')) return 'internal_links';
  if (name.includes('onsite')) return 'onsite';
  if (name.includes('duplicate')) return 'content_redundancy';
  if (name.includes('quality')) return 'content_quality';
  if (name.includes('index')) return 'indexing';
  if (name.includes('architecture')) return 'information_architecture';
  if (name.includes('gbp')) return 'gbp';
  if (name.includes('sap') || name.includes('service_area')) return 'service_area_pages';
  if (name.includes('positions') || name.includes('rankings')) return 'ranking';
  return null;
}

async function prepareFilesForGPT(parent_id, uploadedCsvs = [], uploadedRankings = []) {
  // Sanitize input files before loop
  uploadedCsvs = uploadedCsvs.filter(f => f && f.filename && f.url);

  const moduleData = {};
  const allRows = [];
  const matchedModules = new Set();
  const blogPages = [];

  for (const file of uploadedCsvs) {
    const moduleName = classifyCsv(file.filename);

    if (!moduleName) {
      console.warn(`❌ Skipping file: ${file?.filename || '[Unknown]'}`);
      continue;
    }

    if (moduleName === 'ranking') {
      console.log(`⚠️ Skipping ${file.filename} – looks like ranking file`);
      continue;
    }

    const res = await fetch(file.url);
    const csvText = await res.text();
    const rows = parseCsv(csvText, file.filename);

    console.log(`📄 Processed ${rows.length} rows from ${file.filename}`);
    allRows.push(...rows);

    for (const row of rows) {
      const isBlog = row?.url?.includes('/blog/') || row?.page_type === 'blog';

      if (isBlog) blogPages.push(row);
      if (isBlog && !['indexing', 'schema'].includes(moduleName)) {
        continue;
      }

      if (!moduleData[moduleName]) {
        moduleData[moduleName] = [];
      }

      moduleData[moduleName].push(row);
      matchedModules.add(moduleName);
    }
  }

  for (const [mod, rows] of Object.entries(moduleData)) {
    console.log(`📤 Uploading module '${mod}' with ${rows.length} rows to Supabase...`);
    await uploadJsonToSupabase('raw-inputs', parent_id, mod, rows);
  }

  if (blogPages.length) {
    const topBlogs = blogPages.slice(0, 100);
    console.log(`📤 Uploading blogs.json with ${topBlogs.length} blog pages...`);
    await uploadJsonToSupabase('raw-inputs', parent_id, 'blogs', topBlogs);
  }

  return {
    matchedModules: Array.from(matchedModules),
    rows: allRows,
    rankings: uploadedRankings,
    ...moduleData
  };
}


module.exports = { prepareFilesForGPT };
