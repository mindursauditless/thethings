const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const REPORT_MODEL = process.env.REPORT_MODEL;

async function createReportFromPrompt(prompt) {
  const threadRes = await fetch('https://api.openai.com/v1/threads', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    }
  });

  const thread = await threadRes.json();

  await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({
      role: 'user',
      content: prompt
    })
  });

  const runRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({
      assistant_id: REPORT_MODEL
    })
  });

  const run = await runRes.json();

  let attempts = 0;
  while (attempts < 20) {
    await new Promise(res => setTimeout(res, 2000));
    const statusRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
      headers: {
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    const statusData = await statusRes.json();
    if (statusData.status === 'completed') {
      const messagesRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
        headers: {
          'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      const messages = await messagesRes.json();
      const finalMessage = messages.data.find(m => m.role === 'assistant');
      return finalMessage?.content?.[0]?.text?.value?.trim();
    }
    attempts++;
  }

  throw new Error('GPT run timed out');
}

module.exports = { createReportFromPrompt };
