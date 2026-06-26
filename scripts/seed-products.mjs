#!/usr/bin/env node
// ============================================================================
// seed-products.mjs — insert sample shop products via the Management API
// ============================================================================
// Same HTTPS workaround as deploy-migration.mjs (ports 5432/6543 are blocked on
// this Mac). Idempotent: upserts on the unique `slug`, so re-running just
// refreshes the sample rows rather than duplicating them.
//
// Usage (from project root):
//   node scripts/seed-products.mjs
//   DRY_RUN=1 node scripts/seed-products.mjs   # print SQL, don't apply
// ============================================================================

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const REF_FILE = resolve('supabase/.temp/project-ref');
const API = 'https://api.supabase.com';

function fail(m) { console.error(`\n✖ ${m}\n`); process.exit(1); }

if (!existsSync(REF_FILE)) fail(`Project ref not found at ${REF_FILE}. Run \`supabase link\`.`);
const projectRef = readFileSync(REF_FILE, 'utf8').trim();

let token;
try {
  token = execFileSync('security', ['find-generic-password', '-s', 'Supabase CLI', '-w'], { encoding: 'utf8' }).trim();
} catch {
  fail('Could not read the Supabase CLI token from the keychain. Run `supabase login` once, then retry.');
}
if (!token) fail('Supabase CLI token was empty. Run `supabase login`.');

// --- sample catalog ---------------------------------------------------------
// Prices in MYR. Images were copied into public/shop/ (served at /shop/...).
const products = [
  {
    name: 'AlpasPinas Drifit Shirt (Unisex)',
    slug: 'drifit-shirt',
    description:
      'Premium drifit race jersey in the AlpasPinas navy-to-red gradient with batik-pattern sleeves. ' +
      'Lightweight, breathable, quick-dry and stretchable — built for the boat and the bleachers.',
    price: 90,
    currency: 'MYR',
    category: 'Apparel',
    image_url: '/shop/shirt-model1.png',
    images: [
      '/shop/shirt-model1.png',
      '/shop/shirt-model1-front.png',
      '/shop/shirt-model1-back.png',
      '/shop/model1-details.png',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    stock: null,
    is_active: true,
    is_featured: true,
    promo_label: 'LIMITED DROP',
    promo_price: 75,
    sort_order: 1,
  },
  {
    name: 'AlpasPinas Racerback Tank Top (Unisex)',
    slug: 'racerback-tank',
    description:
      'Racerback training tank in the same batik-overlay design. Premium drifit fabric — lightweight, ' +
      'breathable, quick-dry, stretchable. Ideal for hot-weather paddling and gym sessions.',
    price: 80,
    currency: 'MYR',
    category: 'Apparel',
    image_url: '/shop/tank-model1.png',
    images: [
      '/shop/tank-model1.png',
      '/shop/tank-model1-front.png',
      '/shop/tank-mode1-back.png',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    stock: null,
    is_active: true,
    is_featured: false,
    promo_label: null,
    promo_price: null,
    sort_order: 2,
  },
  {
    name: 'AlpasPinas Race Jersey (Unisex)',
    slug: 'race-jersey',
    description:
      'The white-edition team race jersey — crisp "ALPAS PINAS" crest with red-and-blue raglan ' +
      'sleeves and gold pinstripe detailing. Premium drifit fabric: lightweight, breathable, ' +
      'quick-dry and stretchable, built for race day and training alike.',
    price: 90,
    currency: 'MYR',
    category: 'Apparel',
    image_url: '/shop/shirt-A.png',
    images: ['/shop/shirt-A.png'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    stock: null,
    is_active: true,
    is_featured: true,
    promo_label: null,
    promo_price: null,
    sort_order: 3,
  },
  {
    name: 'AlpasPinas Racerback Tank – White (Unisex)',
    slug: 'racerback-tank-white',
    description:
      'White-edition racerback training tank with the "ALPAS PINAS" crest and sunburst back panel. ' +
      'Premium drifit fabric — lightweight, breathable, quick-dry, stretchable. Ideal for ' +
      'hot-weather paddling and gym sessions.',
    price: 80,
    currency: 'MYR',
    category: 'Apparel',
    image_url: '/shop/tank-A.png',
    images: ['/shop/tank-A.png'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    stock: null,
    is_active: true,
    is_featured: false,
    promo_label: null,
    promo_price: null,
    sort_order: 4,
  },
  {
    name: 'AlpasPinas Long Sleeve Jersey (Unisex)',
    slug: 'longsleeve-jersey',
    description:
      'White-edition long-sleeve race jersey with red-and-blue raglan arms and gold pinstripe ' +
      'detailing. Premium drifit fabric — lightweight, breathable, quick-dry, stretchable. Extra ' +
      'sun coverage for long sets on the water.',
    price: 110,
    currency: 'MYR',
    category: 'Apparel',
    image_url: '/shop/longsleeve-A.png',
    images: ['/shop/longsleeve-A.png'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    stock: null,
    is_active: true,
    is_featured: false,
    promo_label: null,
    promo_price: null,
    sort_order: 5,
  },
];

const lit = (v) => (v === null ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const jsonLit = (v) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const numOrNull = (v) => (v === null || v === undefined ? 'null' : Number(v));

const values = products
  .map(
    (p) => `(
    ${lit(p.name)}, ${lit(p.slug)}, ${lit(p.description)}, ${Number(p.price)}, ${lit(p.currency)},
    ${lit(p.category)}, ${lit(p.image_url)}, ${jsonLit(p.images)}, ${jsonLit(p.sizes)},
    ${numOrNull(p.stock)}, ${p.is_active}, ${p.is_featured}, ${lit(p.promo_label)},
    ${numOrNull(p.promo_price)}, ${Number(p.sort_order)}
  )`,
  )
  .join(',\n');

const sql = `
insert into public.products
  (name, slug, description, price, currency, category, image_url, images, sizes,
   stock, is_active, is_featured, promo_label, promo_price, sort_order)
values
${values}
on conflict (slug) do update set
  name        = excluded.name,
  description = excluded.description,
  price       = excluded.price,
  currency    = excluded.currency,
  category    = excluded.category,
  image_url   = excluded.image_url,
  images      = excluded.images,
  sizes       = excluded.sizes,
  stock       = excluded.stock,
  is_active   = excluded.is_active,
  is_featured = excluded.is_featured,
  promo_label = excluded.promo_label,
  promo_price = excluded.promo_price,
  sort_order  = excluded.sort_order;
`;

console.log(`Project : ${projectRef}`);
console.log(`Seeding : ${products.length} products (${products.map((p) => p.slug).join(', ')})`);

if (process.env.DRY_RUN) {
  console.log('\n[DRY_RUN] SQL:\n' + sql);
  process.exit(0);
}

const res = await fetch(`${API}/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
if (!res.ok) fail(`Seed failed (HTTP ${res.status}):\n${text}`);

console.log('\n✓ Seeded. Open the shop or check the products table in Supabase.');
