
# Framework for Indexing & Crawling Module

## Strategy Directives
- Focus on identifying patterns in technical errors — not just isolated flags.
- Look for clusters of 404s, soft 404s, canonical issues, or redirect chains, and investigate the structural causes (e.g., deleted sections, outdated CMS templates, poor internal linking).
- Don't just flag issues — explain *why* they're happening and *how* to prevent them long-term.
- Avoid surface-level recommendations like "add a canonical tag" — if the page is a query string or pagination variant, that may not be necessary.
- Treat this module like a diagnostic lens for deeper architectural and technical habits.

- If a useful insight can be logically inferred from patterns in the data (e.g. repeated structures, high frequency, consistent gaps), you're allowed to do so — but be transparent.

Avoid making guesses about missing information. If a data point is missing, describe the implications of that absence or recommend how it could be collected.

These templates should be added to the overall report. You are helping build the full report and we want to provide real actionable insights. We don't want lame obvious recommendations like you need more content on your thin pages.... give them actual guidance on what the pages should look like, what should be the focus/target of those pages, what the benefit/impact would be of improving them and use specific examples.

Our goal isn't to repeat issues they already know about from the csv data... We want to provide actual insights and recommendations.


## Template Option

### Recommended Redirect Table  
Use this if the user has a pattern of 404s or redirect chains.

```
| Affected URL                  | Recommended Redirect Target     | Reason for Redirect               |
|------------------------------|----------------------------------|-----------------------------------|
| /old-page                    | /services/fence-installation     | Replaced with current page        |
| /products/item?id=123        | /products/fence-panels           | Canonical version exists          |
| /blog/2019/fence-guide       | /blog/fence-installation-basics  | Updated version available         |
```

## Output Format
1. Summary (why the issue matters)
2. Affected URLs or technical issues
3. Action Plan (2–5 precise steps, ideally clustered)
4. Tools/Templates (include redirect table **only if needed**)
5. Validation Notes (e.g., use GSC or crawl data to verify canonical needs or valid 404s)
