
# Framework for Information Architecture Module

## Strategy Directives
- Focus on improving access to conversion-driving pages: Homepage, Service Pages, and Location Pages.
- Analyze whether the site structure supports intuitive discovery: are important pages accessible in 1–2 clicks?
- Ensure page paths are clean, keyword-aligned, and consistent with naming conventions.
- Review the main navigation menu: does it include service and location hubs? Are dropdowns overwhelming or underused?
- Check whether the URL naming aligns with page titles and H1s — and flag any disconnects.
- Do not include template/table unless meaningful IA issues are detected.

- If a useful insight can be logically inferred from patterns in the data (e.g. repeated structures, high frequency, consistent gaps), you're allowed to do so — but be transparent.

Avoid making guesses about missing information. If a data point is missing, describe the implications of that absence or recommend how it could be collected.

These templates should be added to the overall report. You are helping build the full report and we want to provide real actionable insights. We don't want lame obvious recommendations like you need more content on your thin pages.... give them actual guidance on what the pages should look like, what should be the focus/target of those pages, what the benefit/impact would be of improving them and use specific examples.

Our goal isn't to repeat issues they already know about from the csv data... We want to provide actual insights and recommendations.

## Template Option

### Recommended Page Path Table  
Only include if the current structure is disorganized or non-standard.

```
| Page Type         | Suggested Path                | Reason for Change                   | Redirect From                    |
|------------------|-------------------------------|-------------------------------------|----------------------------------|
| Homepage         | /                             | Standard                            | n/a                              |
| Service Page     | /services/fence-installation  | Clarifies service + intent          | /fencing                         |
| Location Page    | /locations/charlotte-nc       | Scalable and city-standardized      | /charlotte                      |
| Category Landing | /services                     | Needed for internal link structure  | n/a                              |
```

Add templates to the templates/tools section of the report markdown doc

