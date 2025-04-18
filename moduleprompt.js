const fs = require('fs');
const path = require('path');

function loadModulePrompt(moduleName, rows = [], rankings = []) {
  const frameworkPath = path.join(__dirname, 'prompts', moduleName, 'framework.md');
  const instructionsPath = path.join(__dirname, 'prompts', 'universal', 'instructions.md');
  const deliverablesPath = path.join(__dirname, 'prompts', 'universal', 'deliverables.md');

  console.log(`🧠 Assembling prompt for ${moduleName}`);
  console.log(`📁 Using framework path: ${frameworkPath}`);
  console.log(`📁 Using instructions path: ${instructionsPath}`);
  console.log(`📁 Using deliverables path: ${deliverablesPath}`);

  let framework = '';
  let instructions = '';
  let deliverables = '';

  try {
    framework = fs.readFileSync(frameworkPath, 'utf8');
  } catch {
    console.warn(`⚠️ Missing framework.md for ${moduleName}`);
  }

  try {
    instructions = fs.readFileSync(instructionsPath, 'utf8');
  } catch {
    console.warn("⚠️ Missing universal instructions.md");
  }

  try {
    deliverables = fs.readFileSync(deliverablesPath, 'utf8');
  } catch {
    console.warn("⚠️ Missing universal deliverables.md");
  }

  const dataPreview = rows.slice(0, 10);
  const prompt = `
${framework}

${instructions}

${deliverables}

### Example Data:
\`\`\`json
${JSON.stringify(dataPreview, null, 2)}
\`\`\`

${rankings?.length > 0 ? `### Related Ranking Data:
\`\`\`json
${JSON.stringify(rankings.slice(0, 10), null, 2)}
\`\`\`` : ''}
`.trim();

  console.log("📩 Final Prompt Start >>>\n", prompt.slice(0, 800));

  return prompt;
}

module.exports = loadModulePrompt;
