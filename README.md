# Blue Heron Records

Marketing website for **Blue Heron Records** — a home-based record label and recording studio in Oak Lawn, Illinois. Producer · Recording · Promotion.

Single-page static site — no build step.

## Files
- `index.html` — all content/sections
- `styles.css` — design system (dark "analog-soul" theme, Fraunces + Inter, heron + brass accents)
- `app.js` — header, mobile nav, scroll reveal, lightbox, contact form (pre-filled email)
- `images/` — web-optimized studio & freelancer photos
- `favicon.svg`, `404.html`, `robots.txt`, `sitemap.xml`

## Sections
Hero · At-a-glance · Our Home · Our Story · Services · Recording Artists · Studio Tour · Gear (Studio Resources) · Listen · Team · Education · Community · Posts · Special Thanks · Contact

## Local preview
Serve the folder over HTTP (so relative paths and the SVG sprite resolve):

```
cd blue-heron-records
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy (GitHub Pages)
Push to `main`; enable Pages on the repo root. The site is built for the project URL
`https://btabiado.github.io/blue-heron-records/`. When `blueheronrecords.com` is registered,
switch the canonical/OG/sitemap URLs and add a `CNAME` file.

## Content status / placeholders
- **Contact email** is currently `joeleduc@msn.com` — swap to a branded address when ready.
- **Listen** and **Posts** are tasteful placeholders pending real streaming embeds / blog content.
- **Artist photos** (Willie Smith, Carol Jenkins) and **owner/some freelancer photos** use a heron
  monogram placeholder until real images are provided.
- Equipment list is sourced from the BHR Studio Guide.

© Blue Heron Records.
