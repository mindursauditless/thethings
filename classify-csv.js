const express = require('express');
const { prepareFilesForGPT } = require('./prepareFilesForGPT');
const fetch = require('node-fetch');
const router = express.Router();

router.post('/classify-csvs', async (req, res) => {
  try {
    const {
      Business_Name,
      Website_Link,
      Email,
      Name,
      Files = ''
    } = req.body;

    console.log("📥 Zapier Data:", { Business_Name, Website_Link, Email, Name });

    // 1. Parse comma-separated file URLs
    const fileUrls = Files.split(',').map(url => url.trim()).filter(Boolean);

    // 2. Convert to { filename, url } format
    const uploadedCsvs = fileUrls.map(url => {
      const parts = url.split('/');
      return {
        filename: decodeURIComponent(parts[parts.length - 1]),
        url
      };
    });

    // 3. Generate formatted markdown
    const { formattedMarkdown } = await prepareFilesForGPT(uploadedCsvs);

    // 4. Build GPT prompt
    const prompt = `
You will be given full CSV files below. Your job is to classify each row into the correct SEO module.
Only sort rows. Do not summarize or analyze.

Return valid JSON where each key
