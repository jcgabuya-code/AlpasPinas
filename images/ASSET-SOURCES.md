# AlpasPinas — Asset Sources & Licensing Reference

> Where to get icons and images for the site, and how each one is allowed to be used.
> Rule of thumb: **MIT / CC0 / Unsplash-License = safe to use freely.** "Free with attribution" = safe *only if you credit*. Paid stock = buy a license + self-host. When in doubt, don't.

## How we use assets on this site

There are two delivery methods, and each source only supports one of them:

- **Hot-link** = reference the image straight from the provider's CDN by URL (no file in our repo). Only allowed when the provider permits it. We do this today for Unsplash in `events.json` and `gallery.json`.
- **Download + self-host** = save the file into `public/` (or `images/` for working copies) and serve it from our own site. Required for everything that can't be hot-linked.

---

## Icons (SVG — preferred for nav + UI components)

| Source | License | Use method | Notes |
|---|---|---|---|
| [Tabler Icons](https://tabler.io/icons) | MIT | Download / copy SVG | Thin-stroke style matches our `Features.tsx` icons best. |
| [Lucide](https://lucide.dev) | ISC | Import as React or copy SVG | Already importable in our code (`lucide-react`). |
| [Phosphor Icons](https://phosphoricons.com) | MIT | Download / copy SVG | Multiple weights (thin → bold). |
| [Heroicons](https://heroicons.com) | MIT | Download / copy SVG | Clean, by the Tailwind team. |
| [SVG Repo](https://svgrepo.com) | Mixed (filter per icon) | Download SVG | Good for niche: dragon boat, paddle, life vest. **Check each icon's license.** |
| [The Noun Project](https://thenounproject.com) | Free w/ attribution (or paid) | Download SVG/PNG | Best sport-specific symbols. Credit required on free tier. |
| [Flaticon](https://www.flaticon.com) | Free **w/ attribution** (or paid) | **Download + self-host** | ⚠️ No hot-linking. Free tier needs a visible "Icons by Flaticon" credit link. Paid removes it. |

All SVG icons can be recolored to our emerald (`#10b981`) and will adapt to light/dark automatically.

## Photos / imagery

| Source | License | Use method | Notes |
|---|---|---|---|
| [Unsplash](https://unsplash.com) | Unsplash License | **Hot-link OK** or download | Free, commercial-ok, no attribution required. Already used via `images.unsplash.com`. |
| [Pexels](https://pexels.com) | Pexels License | Download (prefer self-host) | Free, commercial-ok, no attribution required. |
| [Pixabay](https://pixabay.com) | Pixabay License | Download | Free, commercial-ok. |
| [Shutterstock](https://www.shutterstock.com) | Paid license | **Buy license + download + self-host** | ⚠️ No hot-linking. Free previews are watermarked and not usable on a live site. |

For dragon-boat photos specifically, search any of these for: "dragon boat", "paddling", "regatta", "outrigger". Coverage is thinner than generic sports.

---

## Licensing cheat-sheet

- ✅ **Safe, no credit:** MIT, ISC, CC0, Unsplash/Pexels/Pixabay licenses.
- ⚠️ **Safe only if you credit:** The Noun Project (free tier), Flaticon (free tier).
- 💳 **Must buy + self-host:** Shutterstock and any other paid stock.
- 🚫 **Avoid:** random images from Google results or arbitrary websites — copyrighted by default even when easy to download. A public team site is exactly where this can cause problems.

## Where downloaded files go

- Working/review copies: `images/` (e.g. `images/glif-icons/` for the icon set + its `index.html` contact sheet).
- Production assets the site serves: `public/` (icons at `public/icons/<name>.png|svg`, photos at `public/...`).
- When you add a "free w/ attribution" asset (Flaticon / Noun Project), note the required credit here so we remember to surface it in the site footer.

### Attribution log (fill in as we add credited assets)

| File | Source | Required credit | Where credited |
|---|---|---|---|
| _example: paddle-icon1.png_ | _(source TBD)_ | _(TBD)_ | _(footer? page?)_ |
