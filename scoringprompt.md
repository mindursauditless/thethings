# Scoring Prompt

Your task is to assess SEO health and module impact based on the report below. Use only the data provided. Do not assume anything.

Scoring Criteria:

- `seo_quality_score` (0–10): How well-implemented this module is now.
0–2 = major failure, 3–4 = weak, 5–6 = mixed, 7–8 = solid, 9–10 = best practice
- `module_score` (0–10): How important this module is for the site's success.
0–3 = low, 4–6 = moderate, 7–10 = high
- `confidence` (0.0–1.0): How clear and well-supported your judgment is.
- `priority`: Based on `module_score` and confidence.

Example Scenarios:

- If 50% of SAPs are thin or duplicated, that’s a low `seo_quality_score` (≤4) and high `module_score` (≥7)
- If all metadata is optimized and titles match the content, that’s a high `seo_quality_score` (≥8)
- -- Begin Data ---
[Module markdown + sample row summary]
--- End Data ---

Respond in JSON:
{
"priority": "High" | "Medium" | "Low",
"confidence": 0.0–1.0,
"module_score": 0–10,
"seo_quality_score": 0–10,
"reasoning": "[short, data-grounded explanation]"
}
