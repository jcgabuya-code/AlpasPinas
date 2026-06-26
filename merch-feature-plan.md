# AlpasPinas — Merchandise / Shop Feature Plan

> Plan for a merch page + featured/promo system. Decisions locked with JC (2026-06-25):
> **(1) Checkout = inquiry/reserve only** (no live payments — orders collected, paid manually).
> **(2) Catalog lives in a Supabase table** (admin-editable, RLS, like `training_signups`).
> **(3) Landing-page promo = announcement bar + featured section** (both).

## Goal

Let visitors browse team gear/items and submit an order/reservation (no online payment yet),
while a featured/promo item grabs attention the moment they hit the home page.

---

## 1. Data model (Supabase)

Two new tables in a new migration `supabase/migrations/2026XXXX_merch.sql`, following the
exact patterns already proven in `training_signups` (default-deny RLS, `is_admin()` gate,
PII-free RPC for public reads, idempotent DDL).

### `products`
| column | type | notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `name` | text not null | |
| `slug` | text unique | for clean URLs `/shop/<slug>` |
| `description` | text | |
| `price` | numeric not null | display price |
| `currency` | text default `'MYR'` | team is MY-based |
| `category` | text | e.g. Apparel / Accessories / Gear |
| `image_url` | text | `public/shop/<file>` or external |
| `images` | jsonb | optional extra photos |
| `sizes` | jsonb | optional `["S","M","L","XL"]` |
| `stock` | int | null = unlimited; 0 = sold out |
| `is_active` | boolean default true | hide without deleting |
| `is_featured` | boolean default false | drives home featured section |
| `promo_label` | text | e.g. "LIMITED DROP", "20% OFF" — also powers the bar |
| `promo_price` | numeric | optional sale price (show struck-through original) |
| `sort_order` | int default 0 | manual ordering |
| `created_at` | timestamptz default now() | |

**RLS**
- SELECT: public (`using (is_active or is_admin())`) — anyone reads active products; admins read all.
- INSERT/UPDATE/DELETE: `is_admin()` only.

### `merch_orders` (the "inquiry/reserve" record)
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | `default auth.uid()`, nullable (allow guest orders) |
| `contact_name` | text not null | |
| `contact_email` | text not null | |
| `contact_phone` | text | |
| `items` | jsonb not null | `[{product_id, name, size, qty, unit_price}]` snapshot |
| `total` | numeric not null | computed snapshot |
| `note` | text | buyer message |
| `status` | text default `'pending'` | check in (`pending`,`confirmed`,`paid`,`fulfilled`,`cancelled`) |
| `created_at` | timestamptz default now() | |

**RLS**
- INSERT: anyone (`with check (status = 'pending')`) — bare insert, no `.select()` (same anon-insert
  gotcha noted in project-notes for applications).
- SELECT: owner (`user_id = auth.uid()`) or `is_admin()`.
- UPDATE/DELETE: `is_admin()` (admin moves pending → confirmed/paid/fulfilled).

> Snapshotting `items`/`total`/`unit_price` into the order means later price/stock changes
> don't rewrite past orders.

### Public RPC (optional, mirrors `training_signup_counts`)
`featured_products()` — SECURITY DEFINER, returns active+featured rows so the home page /
announcement bar can read promo data without exposing the admin-only columns. In practice a
plain `is_active` SELECT policy already covers this, so this is only needed if we want to
hide internal fields. **Recommend: skip the RPC, use the SELECT policy.**

---

## 2. Frontend

### Data layer — `src/utils/merch.ts`
Single module (mirrors `bookings.ts`/`users.ts`): `getProducts()`, `getProduct(slug)`,
`getFeatured()`, `submitOrder(order)`. Talks to Supabase via the existing `supabase.ts` singleton.
Cart state is **client-side only** (React context or a small `useCart` hook backed by
in-memory + a localStorage cache like `alpas-cart-v1`) — no server cart needed for reserve-only.

### New routes (in `App.tsx`)
```
/shop          → Shop (catalog grid, category filter, featured strip on top)
/shop/:slug    → ProductDetail (gallery, size picker, qty, "Add to cart")
/cart          → Cart + inquiry/reserve checkout form → submitOrder()
```
Lazy-load these like `Admin` is lazy-loaded, to keep the main bundle lean.

### New pages/components
- `src/pages/Shop.tsx` — hero banner + category tabs + product grid (reuse the Gallery/Events
  card+filter pattern; emerald gradient fallback for missing images).
- `src/pages/ProductDetail.tsx` — image gallery, size/qty, price (with struck-through
  `price` when `promo_price` set), "Add to cart", stock/sold-out state.
- `src/pages/Cart.tsx` — line items, totals, contact form (name/email/phone/note), submit →
  success state ("We'll contact you to arrange payment"), reusing the confirmation pattern
  from `BookingModal`.
- `src/components/ProductCard.tsx` — shared card with promo badge (`promo_label`) in the
  team `sun #F2B544` accent reserved for emphasis per `design-plan.md`.
- `src/components/CartContext.tsx` (or `hooks/useCart.ts`) — add/remove/qty, badge count.

### Navigation / Footer
Add **Shop** to `Navigation.tsx` + `Footer.tsx`, plus a cart icon with a live item-count badge.

---

## 3. Landing-page promo (both bar + section)

### A. Announcement bar — `src/components/PromoBar.tsx`
- Thin full-width strip at the very top of `Layout` (above `Navigation`), so it shows on
  every page.
- Reads the top active+featured product with a `promo_label`. Text e.g.
  *"🔥 LIMITED DROP: 2026 Race Jersey — Reserve yours →"* linking to `/shop/<slug>`.
- Uses the **`sun` warm accent** (the design plan's one deliberate attention color) so it
  pops against the dark/emerald without fighting the brand.
- **Dismissible**, remembered in localStorage (`alpas-promo-dismissed-<id>`); re-shows when
  a new promo id appears. Respects `prefers-reduced-motion` (no pulse animation).

### B. Featured section — `src/components/FeaturedGear.tsx`
- A "FEATURED GEAR" band on `Home.tsx`, placed right after `Hero`/`Marquee` and before
  `Features`, so it's the first content below the fold.
- Shows 1–3 `is_featured` products as larger cards with promo badges + "Shop now" CTA.
- The announcement bar's link can deep-link/scroll to this section (`/#featured`) or go
  straight to the product — recommend linking the bar to the product page, section is for browsing.

`Home.tsx` change is minimal:
```tsx
<Hero />
<Marquee />
{isMobile && <HeroPhoto />}
<FeaturedGear />   {/* new */}
<Features />
<Team />
<Contact />
```

---

## 4. Admin

Add a **Merch** area to the existing `/admin` (lazy `Admin.tsx` already splits sub-pages
under `src/pages/admin/`). Two screens, matching `AdminApplications`/`AdminSignups`:
- `AdminProducts.tsx` — list/create/edit/delete products; toggle `is_active`, `is_featured`;
  set `promo_label`/`promo_price`/`stock`/`sort_order`. Image via URL field (drop files in
  `public/shop/`); optional Supabase Storage upload as a later enhancement.
- `AdminOrders.tsx` — inbound reservations; move `pending → confirmed → paid → fulfilled`;
  see contact details + item snapshot. This is where the team manages manual payment.

Wire both into the admin nav/dashboard.

---

## 5. Build order (suggested)

1. **Migration** — `products` + `merch_orders` tables, RLS, (skip RPC). Deploy via the
   Management-API-over-HTTPS workaround noted in project-notes (ports 5432/6543 are blocked
   on this Mac), then record the version in `schema_migrations`.
2. **Data layer** — `src/utils/merch.ts` + cart hook/context. Seed 3–4 sample products.
3. **Shop pages** — Shop grid, ProductDetail, Cart + reserve checkout. Nav/Footer links + cart badge.
4. **Featured + PromoBar** — `FeaturedGear` on Home, `PromoBar` in Layout.
5. **Admin** — `AdminProducts` + `AdminOrders`.
6. **Verify** — `npx tsc -b` clean; manual run in `npm run dev`; test as guest + logged-in +
   admin; confirm RLS (non-admin can't write products, can't read others' orders); check
   reduced-motion + mobile layout.

## Open questions for later
- Guest checkout, or require login to reserve? (Plan allows guest; easy to tighten.)
- Sizes/variants per product — flat list now, or full variant matrix (size × color × stock) later?
- Order notification: email the team on a new order (reuse the Apps Script Gmail mailer)?
- Currency display — MYR only, or also PHP for the home team?
