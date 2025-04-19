
# Framework for Indexing & Crawling Module

## Strategy Directives
- Focus on identifying patterns in technical errors — not just isolated flags.
- Look for clusters of 404s, soft 404s, canonical issues, or redirect chains, and investigate the structural causes (e.g., deleted sections, outdated CMS templates, poor internal linking).
- Don't just flag issues — explain *why* they're happening and *how* to prevent them long-term.
- Avoid surface-level recommendations like "add a canonical tag" — if the page is a query string or pagination variant, that may not be necessary.
- Treat this module like a diagnostic lens for deeper architectural and technical habits.

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

Add templates to the templates/tools section of the report markdown doc
