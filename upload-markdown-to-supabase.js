// upload-markdown-to-supabase.js — ensures upsert=true

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const BUCKET = 'reports';

async function uploadMarkdownToSupabase(thread_id, module) {
  try {
    const filePath = path.join(__dirname, 'reports', `${thread_id}--${module}.md`);
    const fileBuffer = fs.readFileSync(filePath);
    const remotePath = `reports/${thread_id}/${module}.md`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(remotePath, fileBuffer, {
        contentType: 'text/markdown',
        upsert: true // ✅ Allow overwriting old versions
      });

    if (error) throw error;

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${thread_id}/${module}.md`;
    return publicUrl;
  } catch (err) {
    console.error(`❌ Failed to upload ${module} report to Supabase:`, err);
    return null;
  }
}

module.exports = { uploadMarkdownToSupabase };
