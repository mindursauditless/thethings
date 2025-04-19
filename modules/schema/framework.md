
# Framework for Schema Module

## Strategy Directives
- Only recommend schema changes when issues are evident in the data — malformed JSON, missing required properties, or no schema where one is clearly beneficial.
- Focus on high-impact schema types: LocalBusiness, Service, Product, FAQPage, and BreadcrumbList.
- All schema recommendations must be sourced from schema.org definitions — do not make up fields or include examples not validated against their documentation.
- Always recommend user-side validation via Google's Rich Results Test and the Schema.org validator before implementation.

- - If a useful insight can be logically inferred from patterns in the data (e.g. repeated structures, high frequency, consistent gaps), you're allowed to do so — but be transparent.

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

Add templates to the templates/tools section of the report markdown doc
