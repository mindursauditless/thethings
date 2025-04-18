const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const BUCKET = 'reports';

/**
 * Uploads a markdown string directly to Supabase storage
 * @param {string} parent_id - Unique report/grouping ID
 * @param {string} name - Module name (used in filename)
 * @param {string} markdown - Markdown string to upload
 * @param {string} ext - File extension (default: 'md')
 */
async function uploadMarkdownToSupabase(parent_id, name, markdown, ext = 'md') {
  const remotePath = `reports/${parent_id}/${name}.${ext}`;
  const fileBuffer = Buffer.from(markdown, 'utf-8');
  const contentType = ext === 'json' ? 'application/json' : 'text/markdown';

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(remotePath, fileBuffer, {
      contentType,
      upsert: true
    });

  if (error) throw error;
  return data;
}

module.exports = { uploadMarkdownToSupabase };

