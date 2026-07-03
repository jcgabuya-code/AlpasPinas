import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PAGE_URL = 'http://localhost:5173/';
const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../design-export');

async function exportTheme(browser, theme) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript((t) => {
    localStorage.setItem('theme', t);
  }, theme);
  await page.goto(PAGE_URL, { waitUntil: 'networkidle' });

  // let entrance animations / lazy images settle
  await page.waitForTimeout(1500);
  await page.evaluate(async () => {
    const step = window.innerHeight;
    const max = document.body.scrollHeight;
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 200));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });

  // Freeze the rendered page into a self-contained HTML snapshot.
  const html = await page.evaluate(async () => {
    // Reveal everything gated behind IntersectionObserver (.reveal -> .is-visible)
    // so nothing stays at opacity:0 in the frozen copy.
    for (const el of Array.from(document.querySelectorAll('.reveal'))) {
      el.classList.add('is-visible');
    }
    // Force lazy images to load, then wait for every image to actually decode
    // (populates currentSrc for the RaceRecord slider photos, etc.).
    for (const img of Array.from(document.images)) {
      if (img.loading === 'lazy') img.loading = 'eager';
    }
    await Promise.all(
      Array.from(document.images).map((img) => img.decode().catch(() => {}))
    );

    const toDataURL = async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const blob = await res.blob();
        return await new Promise((resolve) => {
          const fr = new FileReader();
          fr.onloadend = () => resolve(fr.result);
          fr.onerror = () => resolve(null);
          fr.readAsDataURL(blob);
        });
      } catch {
        return null;
      }
    };

    // 1) Inline <img> (and drop srcset so the embedded src is used).
    for (const img of Array.from(document.images)) {
      const src = img.currentSrc || img.src;
      if (src && !src.startsWith('data:')) {
        const data = await toDataURL(src);
        if (data) img.setAttribute('src', data);
      }
      img.removeAttribute('srcset');
    }

    // 2) Inline CSS background-image url(...) on every element.
    const urlRe = /url\(["']?([^"')]+)["']?\)/g;
    for (const el of Array.from(document.querySelectorAll('*'))) {
      const bg = getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none' && bg.includes('url(')) {
        let replaced = bg;
        const matches = [...bg.matchAll(urlRe)];
        for (const m of matches) {
          const raw = m[1];
          if (raw.startsWith('data:')) continue;
          const abs = new URL(raw, location.href).href;
          const data = await toDataURL(abs);
          if (data) replaced = replaced.replace(raw, data);
        }
        if (replaced !== bg) el.style.backgroundImage = replaced;
      }
    }

    // 3) Inline external stylesheets (fonts, resets, etc.) into <style> tags.
    for (const link of Array.from(document.querySelectorAll('link[rel="stylesheet"]'))) {
      try {
        const res = await fetch(link.href);
        if (!res.ok) continue;
        const cssText = await res.text();
        const style = document.createElement('style');
        style.textContent = cssText;
        link.replaceWith(style);
      } catch {
        // leave the <link> as-is (keeps working when online)
      }
    }

    // 4) Remove scripts so the static DOM can't be re-hydrated / blanked by React.
    for (const s of Array.from(document.querySelectorAll('script'))) s.remove();

    return '<!doctype html>\n' + document.documentElement.outerHTML;
  });

  const outPath = path.join(OUT_DIR, `home-${theme}.html`);
  await writeFile(outPath, html, 'utf8');
  await page.close();
  console.log(`Saved ${outPath}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  await exportTheme(browser, 'light');
  await exportTheme(browser, 'dark');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
