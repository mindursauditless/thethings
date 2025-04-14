<!-- Filename: module8-schema-markup.md -->

# Module 8: Schema Markup

## Purpose
Provide clear entity/content signals through properly implemented, non-spammy schema—so search engines better understand the site.

## Primary Checks

| Check                      | Method                  | Output                                                   |
|----------------------------|-------------------------|----------------------------------------------------------|
| LocalBusiness schema       | HTML/JSON-LD parse      | Flag if missing                                          |
| Service/Product schema     | Presence + match        | Flag if misaligned or missing                            |
| Review schema              | Check compliance        | Warn if fake/stacked/deprecated                          |
| FAQ schema                 | Present & correct?      | Flag missing connection to actual content               |
| Homepage schema            | Multiple types stacked? | Warn if excessive/incoherent                             |
| Markup accuracy            | Compare NAP/IDs         | Check correctness vs. GBP or site data                  |

## OS Tone
- “Schema is not magic dust—it supports everything else.”
- “If your schema says HVAC, but your page says Home Services, that’s a mismatch.”

## MAL Crossover
- **On-Site Optimization**: Titles/H1s vs. schema
- **GBP Optimization**: Business category vs. schema type
- **Content Quality**: Thin content but rich schema → “Seems like gaming the system.”
- **Internal Linking**: If page is orphaned but heavily marked up → “What’s the point?”

## Recommendation Tags
- 🧱 Foundation → entity recognition
- 🔍 Validate → needs human review
- ⚠ Risk → potential penalties if misused
- 📌 Must Act → if missing LocalBusiness or NAP data
- ❓ Blind Spot → if schema contradicts on-page text

## Example Reactions
- **Finding**: Schema shows `@type: pest control` but content says “construction.”
  - **Response**: ⚠ Risk, ❓ Blind Spot → “Accident or manipulation. Fix it.”
- **Finding**: No LocalBusiness schema on homepage/contact page.
  - **Response**: 📌 Must Act, 🧱 Foundation → “Add it with consistent NAP.”

