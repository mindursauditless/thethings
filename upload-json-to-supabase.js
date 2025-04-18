const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * Uploads JSON data to the specified Supabase bucket
 * @param {string} bucket - Bucket name (e.g. 'raw-inputs')
 * @param {string} parent_id - ID used to group files
 * @param {string} moduleName - Module name to be used in filename
 * @param {Object|Array} jsonData - Parsed JSON data to upload
 */
async function uploadJsonToSupabase(bucket, parent_id, moduleName, jsonData) {
  const remotePath = `${parent_id}/${moduleName}.json`;
  const content = JSON.stringify(jsonData, null, 2);
  const buffer = Buffer.from(content, 'utf-8');

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(remotePath, buffer, {
      contentType: 'application/json',
      upsert: true
    });

  if (error) throw error;
  return data;
}

module.exports = { uploadJsonToSupabase };
