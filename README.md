# Blue Heron Records

Website for **Blue Heron Records** — a home-grown record label & recording studio in Oak Lawn, Illinois, founded by **Joe LeDuc** (producer · promoter · audio engineer). Producer · Recording · Promotion.

**Live:** https://blueheronrecords.com (GitHub Pages, custom domain, HTTPS enforced).

Static site — no build step.

## Structure
- `index.html` — the main one-page site (hero, founder spotlight, get-to-know-us, our home, story, services, artists, house band, shows, studio tour, gear, listen, partners, **Our Musical Family**, education, community, posts, special thanks, contact)
- `artists/` — themed one-page sites: `willie-smith`, `carol-jenkins`, `abby`, `mary`, `brant-the-bluesman-buckley`, `whiskey-and-harmony`, `southside-chicago-blues-band`, `bhr-house-band`
- `sessions/first-session.html` — "Our First Recording Session" photo story (Picture-Minded, 2024)
- `styles.css` — main-site design system (dark navy "analog-soul" theme, Fraunces + Inter)
- `app.js` — header, mobile nav, scroll reveal, lightbox, contact form (pre-filled email)
- `images/` — web-optimized photos, the real logos, favicons
- `favicon` / `404.html` / `robots.txt` / `sitemap.xml` / `CNAME`

## Local preview
```
cd blue-heron-records
python3 -m http.server 8000   # open http://localhost:8000
```

## Deploy
Push to `main`; GitHub Pages rebuilds. Custom domain (`blueheronrecords.com`) and `CNAME` are
already in place, with canonical/OG/sitemap URLs pointing at the domain and HTTPS enforced.

## Content status / placeholders
- **Willie Smith** and **Carol Jenkins** have full real bios + photos. Abby, Mary, Brant "The Bluesman"
  Buckley, and the Southside Chicago Blues Band are roster names with "coming soon" placeholders.
- **Demo MP3s**, real **streaming/social links**, and **show dates** are placeholders awaiting content.
- Contact is **Text/Call (630) 926-0446** and **joeleduc@msn.com** (SMS/tel/mailto — no server backend).

© Blue Heron Records.
