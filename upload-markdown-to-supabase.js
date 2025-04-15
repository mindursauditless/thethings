// upload-markdown-to-supabase.js (patched to include thread_id in path)

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const BUCKET = 'reports';

async function uploadMarkdownToSupabase(thread_id, moduleName) {
  try {
    const localPath = path.join(__dirname, 'reports', `${thread_id}--${moduleName}.md`);
    if (!fs.existsSync(localPath)) {
      throw new Error(`Report file not found at ${localPath}`);
    }

    const fileContent = fs.readFileSync(localPath, 'utf8');
    const uploadPath = `${thread_id}/${moduleName}.md`;
    const endpoint = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${uploadPath}`;

    console.log(`📤 Uploading report: ${uploadPath}`);
    const uploadRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'text/markdown'
      },
      body: fileContent
    });

    const result = await uploadRes.text();
    if (!uploadRes.ok) {
      console.error(`❌ Failed to upload report:`, result);
      return null;
    }

    console.log(`✅ Uploaded to Supabase: ${uploadPath}`);
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${uploadPath}`;
    return publicUrl;
  } catch (err) {
    console.error(`🔥 Error uploading markdown for ${moduleName}:`, err.message);
    return null;
  }
}

module.exports = { uploadMarkdownToSupabase };
