# Wiring the roster to Google Sheets

This connects the `/roster` page to the team's spreadsheet so membership
updates made in the sheet (add a row, change a role, set Status to `inactive`)
are reflected on the site automatically. ~10 minutes, one-time.

## 1. Add the script to the sheet

1. Open the same team spreadsheet you use for sign-ups.
2. Menu: **Extensions → Apps Script**. The editor opens.
3. Click the **+** next to "Files" to add a new script file — name it
   `roster` (or anything you like).
4. Paste the entire contents of **`google/roster-script.gs`** into it.
5. Click **Save** (💾).

A tab called **"Roster"** is created automatically on first use. It has
these columns: `Name | Role | Side | Joined | Photo | Status`.

## 2. Populate the Roster tab

Fill in your real members. Leave **Photo** blank (or paste a URL).
Set **Status** to `active` for current members; `inactive` hides them from
the site without deleting the row.

| Name | Role | Side | Joined | Photo | Status |
|------|------|------|--------|-------|--------|
| JC Gabuya | Senior Paddler | Left | 2022 | | active |
| … | … | … | … | … | active |

## 3. Deploy as a web app

> If you already deployed for training sign-ups, you can add the roster
> script to the **same** Apps Script project — just add a new file.
> You will need to create a **new deployment** (a new `/exec` URL) since
> each deployment is tied to a specific version of the script.

1. In the Apps Script editor click **Deploy → New deployment**.
2. Gear → **Web app**.
3. Settings:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy** and authorise when prompted.
5. Copy the **Web app URL** (ends in `/exec`).

## 4. Point the site at it

In `.env.local` add:

```
VITE_ROSTER_ENDPOINT=https://script.google.com/macros/s/AKfy.../exec
```

Restart the dev server (`npm run dev`). For the deployed site, add the
same variable in your host's build/environment settings.

## How it behaves

| Situation | What happens |
|-----------|-------------|
| No URL set | Serves the bundled `roster.json` — dev works without the sheet |
| Sheet updated | Next page load (or tab focus) fetches the latest list |
| Member set to `inactive` | Hidden from the roster page immediately after refresh |
| Network down | Last-cached roster is shown; no error shown to visitors |

## Quick test

With `.env.local` set and dev server running, add a row to the Roster tab,
then hard-refresh `/roster` — the new member should appear.
