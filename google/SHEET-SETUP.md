# Wiring training sign-ups to the Google Sheet

This connects the `/training` page to the team's spreadsheet so sign-ups are
saved to the sheet and read back on every device. ~15 minutes, one-time.

You'll need to be signed in to the Google account that owns the
`Alpas Lake Training Sign-ups` sheet (ID `1fG-2ynmQfSobp4NevuwTTVvfsDDUeTTaHsg_xDWTN8o`).

## 1. Add the script to the sheet

1. Open the spreadsheet in your browser.
2. Menu: **Extensions → Apps Script**. A new editor tab opens.
3. Delete whatever is in `Code.gs`, then paste the entire contents of
   **`google/apps-script.gs`** (in this project) into it.
4. Click the **Save** icon (💾).

A tab called **"Web Signups"** will be created automatically the first time a
sign-up comes in (or the first time the script runs). It has these columns:
Timestamp, EventId, EventTitle, Name, Gender, Side/Role, Weight (kg),
Need PFD?, Need Paddle?, Joining, Status. It's separate from your formatted
per-weekend tabs, so nothing there is touched.

## 2. Deploy it as a web app

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear next to "Select type" → choose **Web app**.
3. Set:
   - **Description:** `AlpasPinas training signups` (anything)
   - **Execute as:** **Me** (your account)
   - **Who has access:** **Anyone**  ← required so the public site can post
4. Click **Deploy**.
5. Google will ask you to **authorize**. Approve it (you may see an
   "unverified app" screen — click *Advanced → Go to … (unsafe)*; it's your
   own script).
6. Copy the **Web app URL**. It ends in **`/exec`**.

> If you change the script later, use **Deploy → Manage deployments → Edit →
> Version: New version** so the same URL keeps working.

## 3. Point the site at it

1. In the project root, copy `.env.example` to **`.env.local`**.
2. Paste your URL:

   ```
   VITE_BOOKINGS_ENDPOINT=https://script.google.com/macros/s/AKfy.../exec
   ```

3. Restart the dev server (`npm run dev`) so Vite picks up the new env var.
   For the deployed site, set the same variable in your host's build settings.

That's it. New sign-ups now append a row to **Web Signups**, and capacity
counts / "your sign-ups" read from the sheet on every device.

## How it behaves

- **No URL set?** The site runs in local-only mode (sign-ups stay in the
  browser, exactly as before) — so dev still works without the sheet.
- **Network hiccup?** The last-known list stays cached so the page still
  renders; the sign-up just errors and can be retried.
- **Cancel** marks the matching row's Status as `cancelled` (kept for history,
  hidden from counts) rather than deleting it.

## Quick test

With `.env.local` set and the dev server running, submit a test sign-up on
`/training`, then refresh the spreadsheet — a new row should appear in
**Web Signups**. Open the site in a different browser; the seat count should
already reflect it.
