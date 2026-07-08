# Publisher Module

This module contains the server-side HTML generation engine migrated from AI HTML Publisher.

V1 scope:

- input plain text / Markdown
- output product website HTML
- support website templates only
- no dashboard / PPT generation yet

Public API:

```ts
generateProductWebsiteHtml(options): Promise<PublisherResult>
```
