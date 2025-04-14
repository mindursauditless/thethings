## 2. **Module 1: Indexing & Crawling**

```markdown
<!-- Filename: module1-indexing-crawling.md -->

# Module 1: Indexing & Crawling

## Purpose
Ensure all important pages (services, locations, etc.) are crawlable, indexable, and returning 200 status codes. Catch and prevent foundational issues that block visibility.

## Inputs Required
- Sitemap presence and structure
- Robots.txt contents
- Meta robots tags
- HTTP response codes (200/301/404/500/etc.)
- site: search sampling (homepage, services, locations)

## Philosophy
- Indexing is foundational: if Google can’t see it, nothing else matters.
- Don’t optimize SEO content or fix other modules until crawl/index issues are fixed.
- Not every page needs to be indexed—evaluate value first.
- Show data: Don’t just say a page is missing; show why it matters.

## Core Checks

| Check                                   | Method               | Output                                                             |
|-----------------------------------------|----------------------|--------------------------------------------------------------------|
| Sitemap present & includes priority     | Parse XML            | Missing sitemap or incomplete coverage                             |
| robots.txt blocking key paths           | Crawl robots.txt     | Flag disallowed service/location paths                             |
| Noindex on important pages              | Scan head/meta       | Flag meta noindex or x-robots header                               |
| Core pages not indexed                  | Google site: search  | List missing service/location/home pages                           |
| Pages returning 404 or 500             | Response headers     | Flag non-200 on critical pages                                     |
| Redirects to homepage                  | Track redirect chain | Flag if location/service pages redirect to homepage                |
| Orphaned critical pages                | Compare internal links| Flag pages w/ 0 incoming links that should be indexed              |

## OS Tone
- “Fix this or nothing else matters.”
- “You’re optimizing a page Google doesn’t see.”

## Decision Context
- Only flag non-indexed pages if they’re critical (revenue, nav, GBP-ref).
- If borderline, use 🔍 Validate.

## MAL Crossover
- **Internal Linking**: Orphaned pages → add contextual links.
- **IA**: Key pages missing from nav → might remove from index or merge.

## Example Findings
- **Finding**: Homepage 200 but doesn’t appear in `site:domain.com`.
  - **Response**: 🧱 Foundation, 📌 Must Act → “Red flag for trust/crawl. Check canonical, internal links, sitemap coverage.”
- **Finding**: 8/10 location pages 200 but unindexed, no backlinks, no internal links.
  - **Response**: 🧱 Foundation, 💥 High Impact, ❓ Blind Spot → “Structurally invisible. Consolidate or fix.”

## Recommendation Tags
- 🧱 Foundation
- 📌 Must Act
- 💥 High Impact
- 🔍 Validate
- ❓ Blind Spot
- 📎 Nice to Know

## Execution Risk Notes
- Don’t recommend indexing everything blindly.
- If deleting unindexed pages, confirm why they failed.
- Watch for redirect chains/homepage redirects—trust killers.
- Don’t just say “add to sitemap”—ask why it wasn’t there first.

## Future Enhancements
- GSC integration
- Visual crawl depth map
- Compare sitemap, nav, internal links
- Bulk validation vs. GBP-linked URLs
