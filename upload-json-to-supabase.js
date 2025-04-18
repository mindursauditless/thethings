const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Hardcoded bucket for clarity and safety
const BUCKET = 'raw-inputs';

/**
 * Uploads JSON data to the raw-inputs/raw/{parent_id}/{module}.json path
 * @param {string} parent_id - ID used to group files
 * @param {string} moduleName - Module name to be used in filename
 * @param {Object|Array} jsonData - Parsed JSON data to upload
 */
async function uploadJsonToSupabase(parent_id, moduleName, jsonData) {
  const remotePath = `raw/${parent_id}/${moduleName}.json`;
  const content = JSON.stringify(jsonData, null, 2);
  const buffer = Buffer.from(content, 'utf-8');

  console.log(`📤 Uploading to ${BUCKET}/${remotePath} (upsert: true)`);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(remotePath, buffer, {
      contentType: 'application/json',
      upsert: true
    });

  if (error) {
    console.error(`❌ Supabase upload error (${BUCKET}/${remotePath}):`, error.message);
    throw error;
  }

  return data;
}

module.exports = { uploadJsonToSupabase };
