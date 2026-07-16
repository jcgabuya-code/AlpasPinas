// Screenshot driver for eyeballing the running app (incl. auth-gated /admin).
//
// The dev server must already be running (npm run dev). Then:
//   node scripts/shot.mjs /                       → desktop shot of home
//   node scripts/shot.mjs /shop --mobile          → 390px mobile shot
//   node scripts/shot.mjs /admin --section Boats  → log in, open Boats section
//   node scripts/shot.mjs /admin --section Boats --mobile --full
//
// Flags:
//   --mobile        390x844 @2x iPhone-ish viewport (default: 1280x900 desktop)
//   --section NAME  after reaching /admin, click the sidebar item matching NAME
//   --full          full-page screenshot (default: just the viewport)
//   --out PATH      output file (default: scratchpad/shot[-mobile].png)
//   --base URL      dev server origin (default: $PW_BASE or http://localhost:5174)
//   --wait MS       extra settle time before the shot (default: 500)
//
// Admin login reads PW_ADMIN_EMAIL / PW_ADMIN_PASSWORD from the environment,
// falling back to those same keys in .env.local (gitignored). Any /admin path
// triggers the login flow automatically.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

// ---- args -----------------------------------------------------------------
const argv = process.argv.slice(2);
const path = argv.find((a) => !a.startsWith('--')) ?? '/';
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const mobile = flag('mobile');
const theme = opt('theme', null); // 'light' | 'dark' — seeds localStorage before load
const section = opt('section', null);
const fullPage = flag('full');
const waitMs = Number(opt('wait', '500'));
const base = (opt('base', process.env.PW_BASE) || 'http://localhost:5174').replace(/\/$/, '');
const out = opt(
  'out',
  resolve(
    process.env.SCRATCHPAD || repoRoot,
    `shot${mobile ? '-mobile' : ''}.png`,
  ),
);

// ---- credentials (.env.local fallback) ------------------------------------
function fromEnvLocal(key) {
  if (process.env[key]) return process.env[key];
  try {
    const txt = readFileSync(resolve(repoRoot, '.env.local'), 'utf8');
    const line = txt.split('\n').find((l) => l.trim().startsWith(`${key}=`));
    return line ? line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '') : undefined;
  } catch {
    return undefined;
  }
}

const isAdmin = path.startsWith('/admin') || flag('login');

// ---- drive ----------------------------------------------------------------
const browser = await chromium.launch();
const context = await browser.newContext(
  mobile
    ? {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      }
    : { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 },
);
if (theme) {
  await context.addInitScript((t) => localStorage.setItem('theme', t), theme);
}
const page = await context.newPage();
page.on('console', (m) => m.type() === 'error' && console.error('[page error]', m.text()));

try {
  if (isAdmin) {
    const email = fromEnvLocal('PW_ADMIN_EMAIL');
    const password = fromEnvLocal('PW_ADMIN_PASSWORD');
    if (!email || !password) {
      throw new Error(
        'Admin login needs PW_ADMIN_EMAIL and PW_ADMIN_PASSWORD (env or .env.local).',
      );
    }
    await page.goto(`${base}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    // Login redirects away from /login on success.
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 });
  }

  await page.goto(`${base}${path}`, { waitUntil: 'networkidle', timeout: 30000 });

  if (section) {
    // On mobile the admin sidebar is hidden behind a hamburger in .admin-topbar;
    // open it before the section link is clickable.
    const menuBtn = page.locator('.admin-topbar button').first();
    if (await menuBtn.isVisible().catch(() => false)) {
      await menuBtn.click();
      await page.waitForTimeout(250);
    }
    const item = page.getByRole('button', { name: new RegExp(section, 'i') }).first();
    await item.click({ timeout: 10000 }).catch(async () => {
      // Fallback: any clickable element carrying the label.
      await page.getByText(new RegExp(`^${section}$`, 'i')).first().click({ timeout: 10000 });
    });
    await page.waitForTimeout(300);
  }

  await page.waitForTimeout(waitMs);
  await page.screenshot({ path: out, fullPage });
  console.log(`✓ ${out}`);
} finally {
  await browser.close();
}
