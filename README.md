# The Shop Music City — Astro + Decap CMS

Marketing site for The Shop Music City, "All Things Custom" — window tinting,
vinyl wraps, paint protection and detailing at 517 Myatt Drive, Suite A,
Madison, TN 37115. Owner-operated by Justin since 2019.

Static Astro build. **The quote form is UI only** — Netlify form attributes are
in place so the wiring is ready, but there is no backend, email routing or
database behind it.

## Commands

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
npm run preview
```

## Images

`public/images` is **generated output — never edit it by hand.** Drop new source
photos into the sibling `../Images` folder and re-run the pipeline:

```bash
node scripts/convert-images.mjs
```

Source folders it reads:

| Folder | Used for |
| --- | --- |
| `../Images` | hero, logo, owner photo, about-block truck |
| `../Images/Services thumbs` | service card frames, ranked by filename |
| `../Images/Favorites` | home page favourites rail |
| `../Images/gallery-src` | gallery, numbered `NN_<hash>.jpg` |

Service card filenames encode the owner's preference — no number or `1` is his
favourite, then `1.1`, `1.2`, `2`, `2.1`, `3`. The script emits them in that
order as `svc-<slug>-0.webp`, `-1.webp` … and each card cross-dissolves through
its set every 3 seconds.

## Structure

```
public/
  admin/          Decap CMS (index.html + config.yml)
  images/         generated WebP assets
    gallery/      grid copies (720px) + full/ copies for the lightbox
src/
  data/           settings, home, about, services, gallery, contact JSON
  content/
    reviews/      one JSON file per review
    faqs/         one JSON file per question
  components/     Header, Footer, CtaBand, Testimonials, QuoteForm, Icon, Hex…
  layouts/        BaseLayout (view transitions, scroll reveal, card tilt)
  pages/          index, services, gallery, about, reviews, faq, contact, thanks
  styles/
    global.css    inherited dark shell, rebranded to red
    shop.css      everything new or overridden for this brand
```

`global.css` came from an earlier build and still carries some unused rules;
`shop.css` loads after it and is where this site's own styling lives.

## Palette

| Token | Value |
| --- | --- |
| `--accent` | `#e2102f` |
| `--accent-lt` | `#ff3d5c` |
| `--accent-dk` | `#a80a24` |
| navy | `#1e2a44` |
| ground | `#08080a` |

## Content editing

Decap CMS at `/admin/`, authenticated through Netlify Identity + Git Gateway.
Settings, every page, gallery photos (with category), reviews and FAQs are all
editable there.

For local CMS work set `local_backend: true` in `public/admin/config.yml` and
run `npx decap-server` alongside `npm run dev`. **It must be `false` on the live
site.**

## Deploy

Pushed to `main` on GitHub, which Netlify builds automatically
(`npm run build` → `dist`, config in `netlify.toml`).
