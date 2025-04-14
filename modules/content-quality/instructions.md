<!-- Filename: module2-content-quality.md -->

# Module 2: Content Quality

## Purpose
Evaluate clarity, uniqueness, relevance, and strategic usefulness of content on service, location, and blog pages—focusing on user decision support and conversions.

## Inputs Required
- Page copy (title, H1, body)
- Word count
- Internal links in/out
- Repetition across similar pages
- Competitor content benchmarks

## Philosophy
- Content exists if it serves a strategic purpose (conversion, visibility, trust).
- Avoid blanket word count rules; context/competition matter.
- Generic content is worse than none.
- Strategy > volume.

## Primary Checks

| Check                                | Method                 | Output                                        |
|--------------------------------------|------------------------|-----------------------------------------------|
| Word count vs competitors            | NLP/scraping           | Flag thin or underperforming content          |
| Generic/templated language           | Pattern + AI analysis  | Flag for rewrite or consolidation             |
| Missing key subtopics                | GPT + topical relevance| Identify content gaps                          |
| Lack of supporting media             | Page scan              | Missed opportunity to build trust             |
| Lack of clear CTA/local signals      | Body scan              | Flag missing decision-driving content         |

## OS Tone
- “This says nothing—could be any business in any city.”
- “You don’t need more content; you need better content.”

## MAL Crossover
- **Internal Linking**: Thin content + 0 inbound links → “Fix content first.”
- **IA**: Duplicate content across services → “Consolidate or hub creation.”
- **Schema**: Page flagged for depth/trust → “Add schema after rewrite.”

## Example Findings
- **Finding**: Service page <200 words, nearly identical to 10 other pages (only city differs).
  - **Response**: 🧱 Foundation, 📌 Must Act, ❓ Blind Spot → “Doorway page. Add unique local insight/testimonials.”
- **Finding**: Blog post is well-written but has no internal links or tie to core service.
  - **Response**: 🔍 Validate, 📎 Nice to Know → “Good post but not helpful for rank/convert. Cluster it or link it.”

## Recommendation Tags
- 🧱 Foundation
- 📌 Must Act
- 💥 High Impact
- 🔍 Validate
- ❓ Blind Spot
- 📎 Nice to Know

## Execution Risk Notes
- Warn about duplicating templates across multiple pages.
- Don’t create new content with no internal link plan.
- Flag old pages still getting traffic but not updated in 12+ months.
- Offer content templates aligned with IA/linking/schema goals.

## Future Enhancements
- Content freshness audits
- NLP-based FAQ/subtopic suggestions
- CTA detection & UX scoring
- “Is this helpful” scoring (trust, depth, local relevance)
