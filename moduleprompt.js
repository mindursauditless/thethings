const fs = require('fs');
const path = require('path');

function loadModulePrompt(moduleName, rows, rankings = []) {
  const moduleDir = path.join(__dirname, 'modules', moduleName);
  const instructionsPath = path.join(moduleDir, 'instructions.md');
  const deliverablePath = path.join(moduleDir, 'deliverable.md');
  const frameworkPath = path.join(moduleDir, 'framework.md');
  const universalPath = path.join(__dirname, 'universal_os.md');

  const instructions = fs.existsSync(instructionsPath)
    ? fs.readFileSync(instructionsPath, 'utf8')
    : '';
  const deliverable = fs.existsSync(deliverablePath)
    ? fs.readFileSync(deliverablePath, 'utf8')
    : '';
  const framework = fs.existsSync(frameworkPath)
    ? fs.readFileSync(frameworkPath, 'utf8')
    : '';
  const universal = fs.existsSync(universalPath)
    ? fs.readFileSync(universalPath, 'utf8')
    : '';

  const csvRows = rows
    .slice(0, 50)
    .map(row => JSON.stringify(row, null, 2))
    .join('\n\n');

  const prompt = `
${universal}

---

## Strategic Framework
${framework}

---

## Instructions
${instructions}

---

## Deliverable Format
${deliverable}

---

### Raw CSV rows:
\`\`\`json
${csvRows}
\`\`\`

${rankings.length ? `
---

### Related Ranking Data:
\`\`\`json
${JSON.stringify(rankings.slice(0, 50), null, 2)}
\`\`\`` : ''}
`;

  return prompt.trim();
}

module.exports = loadModulePrompt;
