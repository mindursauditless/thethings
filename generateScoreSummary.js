const fs = require('fs');
const path = require('path');
const { uploadMarkdownToSupabase } = require('./upload-markdown-to-supabase');

async function generateScoreSummary(parent_id) {
  const parentDir = path.join(__dirname, 'reports', parent_id);
  const diffPath = path.join(parentDir, 'score_diff.json');
  const summaryPath = path.join(parentDir, 'summary.md');

  if (!fs.existsSync(diffPath)) {
    console.warn(`⚠️ No score_diff.json found for ${parent_id}`);
    return;
  }

  const diff = JSON.parse(fs.readFileSync(diffPath, 'utf8'));

  // Build markdown summary
  let md = `# SEO Report Summary — ${parent_id}\n\n`;
  md += `**Previous Average Score:** ${diff.previous_average}\n`;
  md += `**Current Average Score:** ${diff.current_average}\n`;
  md += `**Overall Change:** ${diff.overall_change > 0 ? '+' : ''}${diff.overall_change}\n\n`;

  md += `---\n\n## Module Score Changes\n\n`;
  md += `| Module | Previous | Current | Change |\n`;
  md += `|--------|----------|---------|--------|\n`;

  const topUps = [];
  const topDowns = [];

  for (const [mod, entry] of Object.entries(diff.modules)) {
    const change = entry.change !== null ? (entry.change > 0 ? `+${entry.change}` : `${entry.change}`) : '—';
    md += `| ${mod} | ${entry.previous ?? '—'} | ${entry.current ?? '—'} | ${change} |\n`;

    if (typeof entry.change === 'number') {
      if (entry.change > 0) topUps.push({ module: mod, delta: entry.change });
      else if (entry.change < 0) topDowns.push({ module: mod, delta: entry.change });
    }
  }

  // Highlights section
  md += `\n---\n\n## Highlights\n\n`;

  const topGain = topUps.sort((a, b) => b.delta - a.delta)[0];
  const topLoss = topDowns.sort((a, b) => a.delta - b.delta)[0];

  if (topGain) {
    md += `📈 **Top Improvement:** \`${topGain.module}\` improved by +${topGain.delta}\n\n`;
  }
  if (topLoss) {
    md += `📉 **Top Decline:** \`${topLoss.module}\` dropped by ${topLoss.delta}\n\n`;
  }

  fs.writeFileSync(summaryPath, md, 'utf8');
  console.log(`📄 Generated summary.md for ${parent_id}`);

  // ✅ Pass actual content to Supabase upload
  await uploadMarkdownToSupabase(parent_id, 'summary', md);
  await uploadMarkdownToSupabase(parent_id, 'score_diff', JSON.stringify(diff, null, 2), 'json');
}

module.exports = { generateScoreSummary };
