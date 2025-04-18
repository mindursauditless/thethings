const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const BUCKET = 'reports';

async function uploadMarkdownToSupabase(parent_id, name, ext = 'md') {
  const fsPath = path.join(__dirname, 'reports', parent_id, `${name}.${ext}`);
  const remotePath = `reports/${parent_id}/${name}.${ext}`;

  const fileBuffer = fs.readFileSync(fsPath);
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
