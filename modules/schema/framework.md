
# Framework for Schema Module

## Strategy Directives
- Only recommend schema changes when issues are evident in the data — malformed JSON, missing required properties, or no schema where one is clearly beneficial.
- Focus on high-impact schema types: LocalBusiness, Service, Product, FAQPage, and BreadcrumbList.
- All schema recommendations must be sourced from schema.org definitions — do not make up fields or include examples not validated against their documentation.
- Do not recommend adding schema just to add it — it must be contextually relevant to the page’s purpose.
- Always recommend user-side validation via Google's Rich Results Test and the Schema.org validator before implementation.

- - If a useful insight can be logically inferred from patterns in the data (e.g. repeated structures, high frequency, consistent gaps), you're allowed to do so — but be transparent.

Avoid making guesses about missing information. If a data point is missing, describe the implications of that absence or recommend how it could be collected.

These templates should be added to the overall report. You are helping build the full report and we want to provide real actionable insights. We don't want lame obvious recommendations like you need more content on your thin pages.... give them actual guidance on what the pages should look like, what should be the focus/target of those pages, what the benefit/impact would be of improving them and use specific examples.

Our goal isn't to repeat issues they already know about from the csv data... We want to provide actual insights and recommendations.

## Template Option

### Validated Schema Snippet Examples  
Use only when schema issues are detected. Match the page type to the schema type.

```
**LocalBusiness Schema**
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Example Business",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main Street",
    "addressLocality": "City",
    "addressRegion": "ST",
    "postalCode": "12345"
  },
  "telephone": "(123) 456-7890",
  "openingHours": "Mo-Fr 09:00-17:00"
}

**Service Schema**
{
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Fence Installation",
  "provider": {
    "@type": "LocalBusiness",
    "name": "Example Business"
  }
}
```

## Output Format
1. Summary (what’s wrong with the schema implementation)
2. Affected URLs (with missing or broken schema)
3. Action Plan (2–5 specific steps to fix or enhance schema)
4. Tools/Templates (only include snippets validated from schema.org)
5. Validation Notes (Always instruct user to use Rich Results Test + Schema.org Validator before implementing)
