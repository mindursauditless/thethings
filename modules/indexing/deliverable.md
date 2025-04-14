
# Indexing & Crawlability Module – Audit Deliverable

---

## Summary

Key service or location pages on your site are either not indexed by Google, blocked by crawl directives, or lack clear signals for discoverability. If Google can’t consistently crawl or index your most important content, no other optimization efforts will matter.

---

## Affected Pages / Indexation Gaps

| URL | Status Code | Indexed? | Robots Meta | Internal Links | Flag |
| --- | ----------- | -------- | ------------ | --------------- | ---- |
| /services/duct-cleaning | 200 | No | noindex | 2 | Blocked from index |
| /locations/phoenix | 200 | No | index | 0 | Orphaned |
| /blog/hvac-myths | 301 → /404 | No | — | 1 | Redirect chain |
| /services/ac-installation | 200 | Yes | index | 3 | OK |

---

## Action Plan

- Remove `noindex` from any core service or location pages unless intentionally excluded
- Ensure each page you want indexed:
  - Returns a 200 status code
  - Is internally linked from at least one strategic page
  - Is referenced in your sitemap
- Fix redirect chains (especially 3xx → 4xx paths)
- Review and simplify `robots.txt` to avoid accidental blocks
- Submit affected pages via Google Search Console for reindexing after fixes

---

## Templates / Tools

### Indexing Decision Tree

Should this page be indexed?

- ✅ Yes, if:
  - It targets a valuable query
  - It contains unique, helpful content
  - It supports lead generation or organic discovery

- ❌ No, if:
  - It’s a checkout page, login, thank you, or internal dashboard
  - It’s thin or duplicative with no strategic purpose

### Sitemap Inclusion Checklist

- [ ] Page is not blocked by `robots.txt`
- [ ] Page is not marked `noindex`
- [ ] Page returns 200 status
- [ ] Page is included in `/sitemap.xml`
- [ ] Page has internal links from other pages

### Sample Robots.txt Guidelines

```
User-agent: *
Disallow: /admin/
Disallow: /checkout/
Allow: /
Sitemap: https://yourdomain.com/sitemap.xml
```

---

## Validation & Caveats

- Use Google Search Console's Index Coverage report to validate whether pages are being excluded
- Tools like Screaming Frog or Sitebulb can help surface orphaned or non-indexed URLs at scale
- Do not index every page by default — only index what supports SEO, visibility, or conversion goals
- Always review redirect logic before fixing chains — some may be intentional

Addressing indexing and crawlability ensures that your site is discoverable, navigable, and not leaving traffic opportunities on the table.
