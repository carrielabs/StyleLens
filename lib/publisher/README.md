# Publisher Module

This module contains the server-side HTML generation engine migrated from AI HTML Publisher.

Current scope:

- input plain text / Markdown
- input `.csv` / `.json` / `.xlsx` data files
- output product website HTML
- output Dashboard HTML
- support 8 website templates
- support 15 Dashboard templates
- no PPT generation yet

Public API:

```ts
generateProductWebsiteHtml(options): Promise<PublisherResult>
generateDashboardHtmlFromDataFile(options): Promise<PublisherResult & { sourceFileName: string }>
```
