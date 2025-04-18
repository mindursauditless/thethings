const fs = require('fs');
const path = require('path');

function loadModulePrompt(moduleName, rows = [], rankings = []) {
  const basePath = path.join(__dirname, 'modules', moduleName);
  const universalPath = path.join(__dirname, 'modules', 'universal_os.md');

  const frameworkPath = path.join(basePath, 'framework.md');
  const instructionsPath = path.join(basePath, 'instructions.md');
  const deliverablePath = path.join(basePath, 'deliverable.md');

  console.log(`🧠 Assembling prompt for ${moduleName}`);
  console.log(`📁 universal: ${universalPath}`);
  console.log(`📁 framework: ${frameworkPath}`);
  console.log(`📁 instructions: ${instructionsPath}`);
  console.log(`📁 deliverable: ${deliverablePath}`);

  let universal = '';
  let framework = '';
  let instructions = '';
  let deliverable = '';

  try {
    universal = fs.readFileSync(universalPath, 'utf8');
  } catch {
    console.warn("⚠️ Missing universal_os.md");
  }

  try {
    framework = fs.readFileSync(frameworkPath, 'utf8');
  } catch {
    console.warn(`⚠️ Missing framework.md for ${moduleName}`);
  }

  try {
    instructions = fs.readFileSync(instructionsPath, 'utf8');
  } catch {
    console.warn(`⚠️ Missing instructions.md for ${moduleName}`);
  }

  try {
    deliverable = fs.readFileSync(deliverablePath, 'utf8');
  } catch {
    console.warn(`⚠️ Missing deliverable.md for ${moduleName}`);
  }

  const csvRows = JSON.stringify(rows.slice(0, 50), null, 2);
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
`.trim();

  console.log("📩 Final Prompt Preview >>>\n", prompt.slice(0, 1000));
  return prompt;
}

module.exports = loadModulePrompt;
