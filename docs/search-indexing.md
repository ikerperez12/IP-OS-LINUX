# Search indexing plan

This document keeps IP Linux ready for Google Search Console, Bing Webmaster Tools and public search indexing.

## Production URL

- Canonical URL: https://ip-os-linux.vercel.app/
- Sitemap: https://ip-os-linux.vercel.app/sitemap.xml
- Robots: https://ip-os-linux.vercel.app/robots.txt
- Google verification file: https://ip-os-linux.vercel.app/google6a5cbce09f2cfee5.html

## Current verification status

| Engine | Method | Status | Notes |
| --- | --- | --- | --- |
| Google | HTML verification file | Prepared | The file `google6a5cbce09f2cfee5.html` is shipped from `app/public/`. Verification must be completed in Google Search Console after deployment. |
| Bing | Import from Google Search Console | Prepared | Bing Webmaster Tools can import a verified Google Search Console property. No Bing-specific token was provided, so no fake `msvalidate.01` tag was added. |
| Bing | XML/meta/DNS verification | No verificado | Add the real Bing token only when it is available from Bing Webmaster Tools. |

## Primary keyword cluster

These are the intended search themes. They are used naturally in the title, description, structured data, README and public copy. Google does not use `meta keywords` for ranking, so the real SEO signal is the visible content, metadata, sitemap and structured data.

| Priority | Keyword / phrase | Intent | Target surface |
| --- | --- | --- | --- |
| 1 | browser desktop environment | Users looking for a desktop-like web app | Title, description, JSON-LD |
| 1 | web desktop environment | General product category | Description, README, JSON-LD |
| 1 | React desktop UI | Developers looking for React desktop interfaces | Metadata, README |
| 1 | local-first web app | Architecture and privacy positioning | Description, README |
| 2 | glassmorphism UI | Visual style discovery | Metadata, README |
| 2 | web operating system | Broad discovery phrase | Keywords, structured data |
| 2 | virtual desktop | Feature-oriented discovery | Keywords, README |
| 2 | window manager web app | Feature-oriented discovery | Keywords, JSON-LD |
| 2 | reactive wallpaper | Visual feature discovery | Metadata, README |
| 3 | Vercel static app | Deployment and portfolio discovery | README, structured data |
| 3 | productivity apps browser | App surface discovery | README |
| 3 | desktop simulation | General demo category | Keywords, launch copy |

## Indexing assets

| Asset | Path | Purpose |
| --- | --- | --- |
| `index.html` metadata | `app/index.html` | Canonical, title, description, robots directives, OG/Twitter cards, JSON-LD and crawlable no-JS fallback. |
| Sitemap | `app/public/sitemap.xml` | Lists the canonical homepage and important image assets for crawlers. |
| Robots | `app/public/robots.txt` | Allows crawling and advertises the absolute sitemap URL. |
| Manifest | `app/public/manifest.webmanifest` | PWA metadata and screenshots. |
| Social image | `app/public/og-image.png` | Share preview for Open Graph and Twitter/X. |
| Screenshots | `app/public/screenshots/` | Public screenshots for sitemap image entries and manifest screenshots. |
| Google verification | `app/public/google6a5cbce09f2cfee5.html` | Search Console HTML-file verification. |

## Submission checklist

### Google Search Console

1. Open Google Search Console.
2. Add URL-prefix property: `https://ip-os-linux.vercel.app/`.
3. Select HTML file verification.
4. Confirm that `https://ip-os-linux.vercel.app/google6a5cbce09f2cfee5.html` returns the verification text.
5. Click Verify.
6. Submit sitemap: `https://ip-os-linux.vercel.app/sitemap.xml`.
7. Use URL Inspection for `https://ip-os-linux.vercel.app/`.
8. Request indexing after the production deployment is live.

### Bing Webmaster Tools

Preferred path:

1. Open Bing Webmaster Tools.
2. Import the verified Google Search Console property.
3. Submit sitemap: `https://ip-os-linux.vercel.app/sitemap.xml`.
4. Inspect the homepage URL.

Alternative path:

1. Use Bing's HTML file, meta tag or DNS verification option.
2. Add only the real token issued by Bing.
3. Do not commit placeholders or invented verification tags.

## Production validation commands

Run these after deployment:

```powershell
curl.exe -I https://ip-os-linux.vercel.app/
curl.exe https://ip-os-linux.vercel.app/robots.txt
curl.exe https://ip-os-linux.vercel.app/sitemap.xml
curl.exe https://ip-os-linux.vercel.app/google6a5cbce09f2cfee5.html
curl.exe https://ip-os-linux.vercel.app/manifest.webmanifest
```

Expected:

- Homepage returns `200`.
- `robots.txt` contains the absolute sitemap URL.
- `sitemap.xml` contains `https://ip-os-linux.vercel.app/`.
- Google verification file returns `google-site-verification: google6a5cbce09f2cfee5.html`.
- Manifest returns valid JSON.

## Notes

- No private tokens, cookies, account IDs or environment values are required for indexing.
- The Google verification filename is public by design.
- Bing-specific verification is `No verificado` until a real Bing token is provided or the Google property is imported.
- The app is a single-page Vite application, so the canonical indexable URL is the homepage.
