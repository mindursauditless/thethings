const fs = require('fs');
const path = require('path');

/**
 * Load a file if it exists, otherwise return empty string
 */
function loadIfExists(filepath) {
  try {
    return fs.readFileSync(filepath, 'utf8');
  } catch (err) {
    return '';
  }
}

/**
 * Builds a full GPT prompt for the given module
 */
function loadModulePrompt(moduleName, rows = [], rankings = []) {
  const basePath = path.join(__dirname, 'modules', moduleName);
  const universalPath = path.join(__dirname, 'modules', 'universal');

  const instructions = loadIfExists(path.join(basePath, 'instructions.md'));
  const deliverables = loadIfExists(path.join(basePath, 'deliverables.md'));
  const framework = loadIfExists(path.join(basePath, 'framework.md'));

  const tone = loadIfExists(path.join(universalPath, 'tone.md'));
  const enhancers = loadIfExists(path.join(universalPath, 'enhancers.md'));
  const appliedStrategy = loadIfExists(path.join(universalPath, 'appliedstrategyinsights.md'));
  const logic = loadIfExists(path.join(universalPath, 'logic.md'));

  const rowsJSON = JSON.stringify(rows.slice(0, 50), null, 2);
  const rankingsJSON = rankings.length ? JSON.stringify(rankings.slice(0, 50), null, 2) : '';

  const parts = [
    `## Instructions\n${instructions}`,
    `\n---\n\n## Deliverable Format\n${deliverables}`,
    `\n---\n\n## Template Examples\n${framework}`,
    `\n---\n\n## Style Guide\n${tone}`,
    enhancers ? `\n---\n\n## Enhancer Logic\n${enhancers}` : '',
    appliedStrategy ? `\n---\n\n## Applied Strategy Guidance\n${appliedStrategy}` : '',
    logic ? `\n---\n\n## Logic Flags\n${logic}` : '',
    `\n---\n\n## Raw CSV Rows\n\n\`\`\`json\n${rowsJSON}\n\`\`\``,
    rankings.length ? `\n---\n\n## Related Ranking Data\n\n\`\`\`json\n${rankingsJSON}\n\`\`\`` : ''
  ];

  return parts.filter(Boolean).join('\n\n').trim();
}

module.exports = { loadModulePrompt };
