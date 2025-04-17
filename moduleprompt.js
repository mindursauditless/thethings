// moduleprompt.js — patched to use all rows and trigger full report generation

const fs = require('fs');
const path = require('path');

function loadModulePrompt(moduleName, rows = []) {
  const moduleDir = path.join(__dirname, 'modules', moduleName);
  const osPath = path.join(__dirname, 'modules', 'universal_os.md');
  const instructionPath = path.join(moduleDir, 'instructions.md');
  const deliverablePath = path.join(moduleDir, 'deliverable.md');

  const instructions = fs.existsSync(instructionPath)
    ? fs.readFileSync(instructionPath, 'utf8')
    : '';
  const deliverable = fs.existsSync(deliverablePath)
    ? fs.readFileSync(deliverablePath, 'utf8')
    : '';
  const os = fs.existsSync(osPath)
    ? fs.readFileSync(osPath, 'utf8')
    : '';

  return `You are generating an SEO audit report for the "${moduleName}" module.
Format any lists (issues, action items) as bulleted strings, not arrays.
Your output should be immediately ready to be sent and easily understood by Notion or Zapier.

## Universal OS Guidelines
${os}

## Instructions for This Module
${instructions}

## Expected Deliverable Format
${deliverable}

## Data to Analyze
${JSON.stringify(rows, null, 2)}

---
Now generate a complete SEO strategy audit report for the "${moduleName}" module using the format above.
Respond with fully formatted Markdown only. Do not echo the prompt or instructions.`;
}

module.exports = { loadModulePrompt };
