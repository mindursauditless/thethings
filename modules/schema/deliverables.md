
# Schema Markup Module – Audit Deliverable

---

## Summary

Your site is either missing structured data or using schema markup incorrectly. Schema helps search engines better understand your business, services, and content — especially for local SEO. Missing or misconfigured schema can limit your eligibility for enhanced SERP features and clarity in search relevance.

---

## Affected Pages / Schema Issues

| URL | Schema Present | Type Used | Flag |
| --- | --------------- | ---------- | ---- |
| / | None | — | Missing LocalBusiness markup |
| /services/ac-repair | Yes | WebPage only | Incomplete |
| /locations/phoenix | No | — | Missing location-specific schema |

---

## Action Plan

- Add **LocalBusiness** schema to your homepage and main location page(s)
- Use **Service** schema for individual service pages
- Add **FAQPage** schema only when actual FAQs exist on-page
- Ensure schema reflects real content visible on the page — never inject fake or hidden data
- Validate your markup using Google’s Rich Results Test or Schema.org validator

---

## Templates / Tools

### LocalBusiness Schema Template (JSON-LD)

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "True Air HVAC",
  "image": "https://trueair.com/images/logo.png",
  "url": "https://trueair.com",
  "telephone": "+16025551234",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1234 Cool Ave",
    "addressLocality": "Phoenix",
    "addressRegion": "AZ",
    "postalCode": "85004",
    "addressCountry": "US"
  },
  "openingHours": "Mo-Fr 08:00-17:00",
  "sameAs": ["https://facebook.com/trueairhvac"]
}
```

### Service Schema Template (JSON-LD)

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "AC Repair",
  "provider": {
    "@type": "LocalBusiness",
    "name": "True Air HVAC"
  },
  "areaServed": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Phoenix",
      "addressRegion": "AZ"
    }
  },
  "serviceType": "Air Conditioning Repair"
}
```

### FAQPage Schema Template

Only use when your content includes real questions and answers on the page.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "How quickly can you repair AC units?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "We offer same-day AC repair in most Phoenix locations."
    }
  }]
}
```

---

## Validation & Caveats

- Do not use schema markup for content that does not exist on the page
- Avoid stacking multiple schema types in one blob (e.g., FAQ + Service + LocalBusiness)
- Validate every schema block with [Google’s Rich Results Test](https://search.google.com/test/rich-results)
- Schema does not directly improve rankings — but it improves relevance, eligibility for SERP enhancements, and trustworthiness

Used correctly, schema can give your site more visibility, structure, and clarity — especially in local organic and map-based results.
