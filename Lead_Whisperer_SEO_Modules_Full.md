
# Content Redundancy & Cannibalization Module – Audit Deliverable

---

## Summary

Multiple pages on your site appear to target the same or overlapping keywords, serve the same user intent, or use nearly identical content templates. This creates redundancy, splits authority, and may lead to Google ranking none of the pages well.

---

## Affected Pages / Overlap Map

| Page A | Page B | Keyword / Intent Overlap | Suggested Action |
| --- | --- | ---------------------------- | ---------------- |
| /services/ac-repair | /ac-repair | “ac repair near me” | Merge or Redirect |
| /blog/ac-tips | /blog/ac-checklist | Seasonal AC help | Combine |
| /locations/dallas | /locations/dallas-hvac | HVAC in Dallas | Consolidate under one page |

---

## Action Plan

- Identify clusters of redundant or overlapping pages
- Decide whether to:
  - Merge: combine content into one stronger page
  - Redirect: 301 one to the other, based on performance
  - Rewrite: make the page more unique in scope or intent
- Use keyword mapping to ensure each URL targets a distinct query or topic
- Update internal links and sitemaps to reflect new preferred URLs

---

## Templates / Tools

### Page Consolidation Decision Guide

| Trigger | Recommended Action |
| --- | --------------------- |
| Duplicate title/H1 | Rewrite or Merge |
| Competing for same query | Merge + 301 |
| One page performs, one does not | Keep top performer, redirect other |
| Both pages weak | Merge + rewrite |

### Query Mapping Worksheet

- List all key queries you want to rank for
- Assign a unique preferred URL to each
- Flag overlaps and resolve before creating new content

### Pruning Audit Table

| URL | Indexed? | Traffic? | Query Target | Keep? | Action |
| --- | -------- | -------- | -------------| ------| ------ |
| /ac-repair | Yes | 50 visits/mo | “ac repair near me” | ✅ | Primary |
| /services/ac-repair | Yes | 12 visits/mo | Same | ❌ | Redirect to /ac-repair |

---

## Validation & Caveats

- Use GA4, GSC, and tools like Ahrefs or Semrush to determine:
  - Which page gets more traffic or backlinks
  - Which URL is ranking more consistently
- Avoid over-pruning — thin content is not the same as duplicate content
- Never remove pages without redirecting if they’ve been indexed

Resolving cannibalization and redundancy strengthens topical authority, improves UX, and increases your ability to rank more consistently with less effort.


---


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


---


# Google Business Profile (GBP) Optimization Module – Audit Deliverable

---

## Summary

Your Google Business Profile is either incomplete, misaligned with your website, or under-leveraged. GBP is a key factor in local visibility — especially for mobile and “near me” searches. Gaps in categories, reviews, or listing structure can directly limit your local pack exposure.

---

## Affected Profile Gaps / Misalignments

| Area | Current State | Flag |
| --- | -------------- | ---- |
| Primary Category | “Contractor” | Too broad — should be more specific |
| Secondary Categories | None listed | Missed opportunity |
| Website Link | Points to homepage | Should point to service or location page |
| Business Description | Missing | Needs keyword-relevant copy |
| Photos | 2 generic images | Weak trust signal |
| Reviews | 14 reviews, 4.2 avg | Room for growth + replies missing |

---

## Action Plan

- Update your GBP with a more specific primary category (e.g., “HVAC Contractor”)
- Add relevant secondary categories that reflect services you want to rank for
- Link to a service or location page — not just the homepage
- Write a 750-character business description using core keywords and value propositions
- Add 5–10 real photos (team, trucks, job sites, storefronts, service work)
- Start replying to recent reviews — even brief thank-you notes build trust

---

## Templates / Tools

### Category Selection Guide

Use industry-specific categories based on your vertical.  
Examples for HVAC:
- HVAC Contractor (Primary)
- Air Conditioning Contractor
- Furnace Repair Service
- Heating Equipment Supplier

### GBP Description Template

“[Business Name] is a trusted [Primary Category] in [City]. We specialize in [Services]. Our team is known for [USP], and we proudly serve [Service Area]. Contact us today for [CTA or booking prompt].”

**Example:**  
“True Air is a trusted HVAC contractor in Phoenix. We specialize in AC repair, furnace installation, and air quality testing. Our team is known for fast turnaround and friendly service. We proudly serve all of Maricopa County. Contact us today for same-day service.”

### Photo Content Suggestions

- Before/after job shots
- Team portraits
- Inside of work vehicle or office
- Certifications or awards
- Screenshot of 5-star reviews

---

## Validation & Caveats

- Your GBP is not guaranteed to rank — proximity and prominence matter
- Categories must reflect real services (don’t “stuff” irrelevant ones)
- Never use stock photos — real images outperform every time
- Review management builds local authority — but don’t incentivize reviews in violation of Google policy

Optimizing your GBP is one of the most cost-effective ways to improve local map pack visibility and drive high-converting leads.


---


# On-Site Optimization Module – Audit Deliverable

---

## Summary

Critical on-page elements like title tags, H1s, and H2 structures are either missing, duplicated, misaligned with keyword targeting, or inconsistent across key service and location pages. This weakens your ability to match user search intent and can reduce click-through rates and topical clarity.

---

## Affected Pages / On-Page Issues

| URL | Title Tag | H1 Tag | Flag |
| --- | --------- | ------ | ---- |
| /services/hvac-repair | “Home” | “Welcome to Our Site” | No targeting |
| /services/furnace-install | Missing | “Furnace Install Services” | Missing title |
| /locations/dallas | “Dallas Plumbing Pros” | “Service in Your Area” | Weak H1 relevance |

---

## Action Plan

- Ensure every core page (services, locations) includes:
  - A unique, keyword-targeted title tag (70 characters max)
  - A single, relevant H1 that includes the service and/or location
  - Logical use of H2s to break up the page and support relevance
- Use the title to communicate both relevance and value — not just “what” but “why choose you”
- Avoid using the same H1 or title tag across multiple pages

---

## Templates / Tools

### Title Tag Template

`[Primary Service] in [Location] | [Brand Name or CTA]`  
**Example:** AC Repair in Dallas | Same-Day HVAC Service

### H1 Template

- Service Pages:  
  `Professional [Service Name] in [City]`

- Location Pages:  
  `Reliable [Service Category] in [Location]`

### Meta Description Prompt

Use this format to guide high-CTR meta writing:
- [Problem statement] → [Benefit of your solution] → [Clear CTA]

**Example:**  
> “AC issues ruining your comfort? Our Dallas HVAC team offers same-day repairs and 24/7 service. Call now or book online.”

### H2 Section Prompts

- “Why Our [Service] Stands Out in [City]”
- “Trusted by Local Homeowners & Businesses”
- “Common [Service] Problems We Solve”
- “Our [Service] Process, Step by Step”

---

## Validation & Caveats

- Use Google Search Console’s “Performance” tab to identify which pages are underperforming in clicks/impressions — weak or irrelevant title tags may be a factor
- Avoid stuffing keywords — use natural phrasing that improves clarity and trust
- Don’t use marketing fluff like “Welcome to Our Site” as H1s — lead with relevance

Fixing these on-site elements improves your visibility in search results and improves relevance signals for both users and Google.


---


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


---


# Internal Linking Module – Audit Deliverable

---

## Summary

Your current internal linking structure lacks the consistency and intent needed to support content hierarchy, search relevance, and crawl efficiency. Service and location pages are often isolated or buried, and blog content is under-leveraged as a source of contextual signals.

---

## Affected Pages / Link Coverage Gaps

| URL | Incoming Links | Outgoing Links | Indexed? | Flag |
| --- | --------------- | --------------- | -------- | ---- |
| /services/hvac-installation | 0 | 1 | Yes | Orphaned |
| /blog/ac-tips | 1 | 0 | Yes | Missed link opportunity |
| /locations/houston | 2 | 0 | Yes | Add links to relevant services |

---

## Action Plan

- Ensure every service and location page is linked from:
  - Main navigation OR
  - A hub page (services or locations)
- Link blog content contextually to service or location pages
- Audit all “orphan” pages (0 internal links pointing to them)
- Standardize internal linking across templates so every new page includes 1–2 strategic links
- Use descriptive anchor text that reflects page purpose (avoid "click here")

---

## Templates / Tools

### Internal Link Strategy Guide

| Page Type | Should Link To | Should Receive Links From |
| --- | --- | --- |
| Service Page | Location pages, related services, blog | Hub pages, blog posts |
| Location Page | Services in that area, contact page | Location hub, service pages |
| Blog Post | Related services, location pages | Home page (if evergreen), other blogs |

### Sentence Starter Examples (Blog > Services)

- “If your AC is blowing hot air, you might need our [AC repair service].”
- “Learn more about our [electrical safety inspections] offered in Houston.”
- “Residents in [Austin] can book same-day service through our [local team].”

### Internal Link Checklist (for Writers/Editors)

- [ ] Does this page link to at least 2 relevant internal pages?
- [ ] Are anchor texts natural and informative?
- [ ] Is the page being linked *to* from at least 1 hub or contextual page?
- [ ] Have we avoided linking to non-SEO pages (e.g., login, cart)?

---

## Validation & Caveats

- Internal links should add value — don’t force them unnaturally just for SEO
- Avoid sitewide footers with hundreds of links (dilutes authority)
- Use crawl tools to verify crawl paths and ensure orphaned pages can be discovered
- Internal links are a powerful signal for relevance and priority — treat them like strategy, not decoration

Fixing internal linking boosts topical relevance, crawlability, and user pathing — and helps your best pages get found faster.


---


# Information Architecture (IA) Module – Audit Deliverable

---

## Summary

Your website’s current structure lacks clarity and logical grouping, making it difficult for users and search engines to understand what services you offer, where you offer them, and how to access them. Poor IA can reduce crawl efficiency, dilute internal authority signals, and frustrate visitors.

---

## Affected URLs / Navigation Issues

| Issue | Example | Flag |
| --- | --- | --- |
| Services buried in dropdowns | /services/hvac buried under "Our Work" | Hard to discover |
| Location pages not grouped | /austin, /dallas, /houston | No hub or structure |
| Duplicate nav items | "Moving Services" and "Movers" | UX confusion |
| Missing top nav links | No "Service Areas" or "Locations" page | Navigation gap |

---

## Action Plan

- Create or restructure your navigation to include clear categories:
  - Primary: Services, Locations, About, Contact
  - Secondary: Blog, Reviews, Careers (if needed)
- Group services logically (e.g., HVAC, Electrical, Plumbing) and assign hub pages if service list exceeds 5–7
- Add a central “Locations” or “Service Areas” hub to link out to each city/region page
- Flatten nested menus where possible (ideally ≤2 levels deep)
- Ensure URLs reflect structural logic and are not random (e.g., /services/plumbing vs. /our-products/page-2)

---

## Templates / Tools

### Sample Navigation Layout

**Main Nav Example (Multi-Service, Multi-Location):**

- Home
- Services
  - Heating & Cooling
  - Electrical
  - Plumbing
- Locations
  - Dallas
  - Fort Worth
  - Arlington
- About
- Contact

### Hub Page Template

Used when you have too many child pages to include directly in the nav.

**Example:**  
**/services/** → Contains links to:
- /services/heating
- /services/cooling
- /services/air-quality

**Hub Page Should Include:**
- Intro paragraph explaining what’s grouped here
- Visual links/cards
- CTA to request a quote or service

### URL Structure Cheat Sheet

| Page Type | Recommended Format |
| --- | --- |
| Service Page | /services/[service-name] |
| Location Page | /locations/[city-name] |
| Blog Post | /blog/[post-title] |
| Hub Page | /services/ or /locations/ |

---

## Validation & Caveats

- Avoid changing URL paths without proper 301 redirects
- Do not create overlapping categories in nav (e.g., “Our Services” and “Solutions”)
- Keep nav focused on discovery — remove vanity pages unless they serve a conversion or relevance purpose
- Use analytics or heatmaps to determine if users are engaging with your current nav

Fixing IA increases clarity, crawlability, and conversion flow — especially for users entering on deep service or blog pages.


---


# Service Area Pages (SAP) Module – Audit Deliverable

---

## Summary

Your site includes multiple service area pages targeting specific ZIP codes or towns. Many of these pages are thin, unindexed, poorly linked, or duplicative in structure. Continuing to scale this content model without validation could dilute your SEO effectiveness, waste crawl budget, or cause ranking confusion.

---

## Affected URLs (Review & Update)

| URL | Indexed? | Word Count | Internal Links | Action Flag |
| --- | -------- | ----------- | --------------- | ------------ |
| /locations/77005 | No | 142 | 0 | Rewrite or Merge |
| /locations/77006 | No | 125 | 0 | Remove or Consolidate |
| /locations/77007 | Yes | 196 | 1 | Rewrite |
| /locations/77008 | Yes | 210 | 2 | Retain with Optimization |

---

## Action Plan

- Consolidate unindexed or low-value ZIP SAPs into a **regional cluster page**
- Use internal links from service pages and blog posts to drive authority to priority SAPs
- Eliminate or merge SAPs that:
  - Are unindexed
  - Have zero impressions or clicks
  - Lack unique content or purpose
- Rewrite or improve pages with thin copy, low trust signals, or generic templates
- Avoid publishing any new SAPs until:
  - Existing pages are validated and fixed
  - A scalable structure and format is established

---

## Templates / Tools

### ZIP Cluster Page Template

- Headline: "Serving the [Area Name] Region"
- Sections:
  - Overview of service availability
  - Short paragraphs for each ZIP (with embedded review or client mention if possible)
  - Internal jump links
  - Map embed of entire service zone
  - Call-to-action block for each ZIP or at page end

### County / City / Town Consolidation Template

- Structured format for regional page covering multiple small towns
- Include expandable list of areas served
- CTA encouraging booking by ZIP or nearest city

### SAP Decision Framework

- Only keep or create SAPs that:
  - Are indexable
  - Can be made unique
  - Match actual service areas and demand
  - Show traction in GSC or GA

### SAP Page Layout Template (Standalone)

- H1: Service + Location (e.g., "Plumbing Services in 77005")
- Sections:
  - Quick intro + CTA
  - What services are available
  - Localized proof (review, quote, etc.)
  - Why choose [Brand] in this area
  - Service map or radius mention
  - Footer CTA or sticky booking bar

### Pages to Remove / Rewrite – Review Table

| URL | Indexed? | Clicks? | Why Flagged | Suggested Action |
| --- | -------- | ------- | ------------ | ---------------- |
| /locations/77006 | No | 0 | Duplicate content, no traffic | Merge into ZIP cluster |
| /locations/77005 | No | 0 | No local context or structure | Remove |

### Internal Linking Prompts

- Link SAPs from:
  - City or service hubs
  - Blog posts targeting the region
- Link SAPs to:
  - Core service pages
  - Booking/contact page
  - Other nearby service areas (where relevant)

---

## Validation & Caveats

Before removing or consolidating SAPs:
- Confirm with GA4 or GSC that they receive zero meaningful traffic or impressions
- Pages with strong performance should not be merged or deleted — optimize instead
- Don’t rely solely on ZIP codes as a targeting strategy. Use local trust elements, customer stories, or neighborhood mentions to provide relevance
- Schema should only be used if the content on-page supports it contextually

Use this deliverable to clean up or scale your SAP strategy in a sustainable, smart way that aligns with user intent and search engine signals.


---


# Content Quality Module – Audit Deliverable

---

## Summary

We identified specific service and location pages on your site with thin content, minimal internal linking, and weak user trust elements.

---

## Affected URLs (Review & Update)

| URL | Word Count | Internal Links | Indexed? |
| --- | --- | --- | --- |
| /services/ac-repair | 193 | 1 | Yes |
| /services/heating | 222 | 0 | Yes |
| /locations/mesa | 171 | 0 | No |

---

## Action Plan

- Rewrite each page to exceed 500 words (or match top competitors in your market)
- Add at least 2 internal links using relevant anchor text
- Include:
  - Customer reviews or testimonials
  - Local affiliations or certifications
  - Clear and direct CTAs at the top and bottom of the page
- Address specific local pain points if applicable

---

## Templates / Tools

### Service Page Template: AC Repair

Use this layout to rebuild or enhance your AC Repair service page. The structure is designed to maximize local relevance, user trust, and search visibility.

- H1: AC Repair in [City] — Fast, Affordable HVAC Service

**Sections:**

1. Intro + CTA
   - Quick overview of common AC problems
   - Top-of-page call-to-action button

2. Common AC Issues We Fix
   - Bullet list with icons
   - Optional expandable FAQ toggle

3. Why Locals Choose [Brand]
   - Testimonials
   - Star ratings / service guarantees
   - Years of service, certifications

4. Area-Specific Relevance
   - Embedded Google Map
   - Mention ZIP codes or neighborhoods
   - Quote from a local customer

5. Visual Proof
   - Real photos of service work
   - Before/after layout or carousel

6. CTA Section
   - Sticky footer CTA or contact form
   - Mobile-clickable phone number

---

## Internal Linking Map

| Page Being Updated | Suggested Source Page | Anchor Text Ideas |
| --- | --- | --- |
| /services/ac-repair | /blog/summer-ac-tips | “reliable AC repair services” |
| /locations/mesa | /about-us | “Mesa HVAC team” |

---

## Validation & Caveats

Before removing or rewriting any content:

- Confirm with GA4 and GSC whether the page has traffic or impression history
- High-performing pages may only need optimization — not full rewrites
- Avoid over-optimization by repeating keywords unnaturally or duplicating other service pages

Use this module’s guidance to create content that ranks and converts — by proving relevance, trust, and value in every section.


---



---

USE THIS AS A TEMPLATE IF THE USER ASKS FOR A REPORT THAT IS NOT BASED ON OUR CURRENT MODULES



# SEO Strategy Report – {{Business Name}}

---

## Top-Level Issues Summary

{{Top_Level_Summary}}

---

## Priority Recommendations

These are listed in strategic priority order. We do not assume your timetable. Work through them as capacity allows — but this sequence will yield the highest impact.

### 1. Foundation-Level Fixes
{{Foundation_Fixes}}

### 2. Strategic Alignment Fixes
{{Strategic_Fixes}}

### 3. Authority & Visibility Levers
{{Visibility_Levers}}

---

## Strategic Roadmap

This is phased based on dependency and impact, not timeline.

### Phase 1 – Fix What Blocks Visibility
{{Phase_1}}

### Phase 2 – Strengthen Core Pages
{{Phase_2}}

### Phase 3 – Expand Local Relevance
{{Phase_3}}

---

## Common Missteps to Avoid

{{Anti_Priorities}}

---

## Module Reports & Templates

Each module contains:
- Specific issues found
- Page-level tasks
- Copy-paste-ready templates


---

