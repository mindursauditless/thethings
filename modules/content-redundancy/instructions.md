<!-- Filename: module9-content-redundancy.md -->

# Module 9: Content Redundancy & Cannibalization

## Purpose
Identify content overlap, intent collisions, and page bloat that confuse users and dilute site authority.

## Primary Checks

| Check                               | Method                             | Output                                 |
|-------------------------------------|------------------------------------|----------------------------------------|
| Pages targeting same keyword        | Compare titles/H1s/intros          | Flag cannibalization                   |
| Duplicate blog posts                | Cluster by topic                   | Suggest consolidation                  |
| Location/service overlap            | Many near-identical pages          | Warn if user confusion or bloat        |
| Thin clones                         | Check uniqueness                   | Flag low-value                         |
| Index status of duplicate pages     | GSC or `site:` check               | Suggest merge/redirect/rewrite         |

## CrossoverIssues
- **Indexing & Crawling**: Wrong version indexed → canonical or consolidate.
- **Content Quality**: Two weak pages on same topic → merge into one strong asset.
- **IA**: Redundant nav links → IA cleanup.
- **Schema**: Same schema on near-duplicates → “Google sees them as near-identical.”

## Recommendation Tags
- 📌 Must Act → if cannibalization is hurting performance
- 🧱 Foundation → if bloat affects crawl/index
- 🔍 Validate → might need a closer look
- 🧠 Strategic Fix → recommends consolidation for efficiency

## Example Reactions
- **Finding**: 2 location pages for “Plumbing in Pasadena” and “Plumbers Pasadena CA” with 90% identical text.
  - **Response**: 📌 Must Act, 🧠 Strategic Fix → “They’re weak duplicates. Merge them.”
- **Finding**: 12 blog posts on “how to maintain HVAC,” all similar.
  - **Response**: 🔍 Validate, 🧠 Strategic Fix → “Likely filler. Combine or differentiate.”
