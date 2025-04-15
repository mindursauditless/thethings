// upload-test.js

const { createClient } = require('@supabase/supabase-js');

// 🔐 Replace these with your real values
const supabase = createClient(
  'https://swyxefqcjfaajrpolhkf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3eXhlZnFjamZhYWpycG9saGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NzgyMDMsImV4cCI6MjA2MDI1NDIwM30.Uf-5re806svvYNYZYET3PqEmq4SC5XcBWzf-vl9GgRE' // from Supabase > API > Project API keys
);

async function testUpload() {
  const fileContent = JSON.stringify({ hello: "world", timestamp: Date.now() });
  const path = `raw/test-${Date.now()}.json`;

  const { data, error } = await supabase.storage
    .from('raw-inputs')
    .upload(path, Buffer.from(fileContent), {
      contentType: 'application/json',
      upsert: true
    });

  if (error) {
    console.error("❌ Upload failed:", error);
  } else {
    console.log("✅ Upload succeeded:", data);
  }
}

testUpload();
