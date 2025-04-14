const fs = require('fs');
const path = require('path');

function loadModulePrompt(moduleName, rows = []) {
  const moduleDir = path.join(__dirname, 'modules', moduleName);
  const osPath = path.join(__dirname, 'modules', 'universal_os.md');

  const instructionPath = path.join(moduleDir, 'instructions.md');
  const deliverablePath = path.join(moduleDir, 'deliverable.md');

  const instructions = fs.existsSync(instructionPath) ? fs.readFileSync(instructionPath, 'utf8') : '';
  const deliverable = fs.existsSync(deliverablePath) ? fs.readFileSync(deliverablePath, 'utf8') : '';
  const os = fs.existsSync(osPath) ? fs.readFileSync(osPath, 'utf8') : '';

  return `
You are generating an SEO audit report for the "${moduleName}" module.

## Universal OS Guidelines
${os}

## Instructions for This Module
${instructions}

## Expected Deliverable Format
${deliverable}

## Data to Analyze
${JSON.stringify(rows.slice(0, 25), null, 2)}

Respond with only valid JSON using the structure in the deliverable section.
`;
}
