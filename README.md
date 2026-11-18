# HatRack

**Every task, on the right hat.** A lightweight visual sorter for entrepreneurs who run several businesses, projects and obligations at once. Paste in the long, messy to-do lists you collect everywhere, sort them onto your parents, entities and sub-branches, nest subtasks, then export each sector to the task app you actually work in.

![HatRack board with sample data](guide/overview.webp)

- **No install, no server.** The app is a single `index.html`. Open it, or host it free on GitHub Pages.
- **Private by default.** Everything is saved in your browser on your device. Nothing is uploaded.
- **Getting-started tour built in.** Step-by-step slides with real screenshots — an *Everyday use* track and a *Setting up* track for admins. It opens the first time HatRack starts; Help (?) → *Getting started tour* reopens it. After each update, a short *What's new* tour shows what changed.
- **Illustrated guide built in.** Help (?) → *Visual guide*, or open `guide.html`. Every screen, menu and setting is annotated.
- **Docs that keep up.** Every update re-takes the screenshots and rebuilds the guide and the tour; the build stops if a new feature isn't documented.

---

## What's in this folder

| File | What it is |
|---|---|
| `index.html` | The app |
| `guide.html` + `guide/` | The visual guide, the tour (`guide/tour.js`) and their screenshots — keep the folder next to `index.html` |
| `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `manifest.webmanifest` | Home-screen icons and install support for phones |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |
| `src/`, `build.py` | The app's source; `src/release.json` holds the version and the What's new list |
| `release.py`, `guide-src/` | Rebuilds the screenshots, guide and tour, and checks every feature is documented (`guide-src/features.json`) |
| `.github/workflows/release.yml` | Runs `release.py` and publishes the site on every push |

## Put it on GitHub Pages (5 minutes)

1. On GitHub, click **New repository**. Name it `hatrack` (or anything). On a free plan the repository must be public for Pages.
2. Upload **everything in this folder**, including the `guide`, `src`, `guide-src` and `.github` folders. (The web uploader skips folders that start with a dot — use the command line below, or GitHub Desktop, so `.github` comes along.)
3. Go to **Settings → Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open the **Actions** tab: the *Build, document and publish* workflow runs on every push (or click **Run workflow**). In a few minutes the app is live at `https://<your-username>.github.io/hatrack/`, with the guide at `…/hatrack/guide.html`.

Prefer not to use Actions? Set **Source** to *Deploy from a branch* → **main** / **(root)** instead. The site works the same, but the screenshots, guide and tour only refresh when you run `python3 release.py` yourself.

Prefer the command line?

```bash
git init hatrack && cd hatrack
# copy everything from this folder in here
git add . && git commit -m "HatRack"
git branch -M main
git remote add origin https://github.com/<your-username>/hatrack.git
git push -u origin main
```

To run it without GitHub, double-click `index.html`.

### Add it to a phone

- **iPhone:** open the address in Safari → Share → **Add to Home Screen**. It gets the HatRack icon.
- **Android:** Chrome menu → **Add to Home screen** / **Install app**.

The home-screen app keeps its own data, separate from the browser tab. Move tasks across with Configure → Data → Download backup, then Restore.

---

## How it works

Your work is organized as a tree you define in **Configure → Groups & levels**:

```
Parent              →  Entity          →  Sub-branch
Northside Coffee    →  Wholesale       →  Grocery accounts
Personal            →  Health
```

Rename the levels to fit (Business / Department / Project…). Each task hangs on one spot in the tree and has a **type**, **priority**, **status**, **estimated time**, **due date**, **repeat**, tags, source, a **card color**, notes, **subnotes** (a checklist), **subtasks** (full tasks inside it, up to three levels), attachments and any custom fields you add.

### 1 · Bring your notes in — Import (`I`)

Paste a long list, open a `.txt` / `.md` / `.csv` file, or drop text onto a board column. A live preview shows where every line will land before anything is saved.

- Headings (`Northside:`, `# Personal`, ALL-CAPS lines) become groups; existing names and keywords are matched.
- Indented lines become **subnotes** or **subtasks** — your choice.
- Blocks separated by blank lines become one task each (first line = title, the rest = notes).
- Spreadsheets with a header row map columns like Title, Notes, Project, Due, Priority, Estimate, Color and Parent ID. Todoist CSV exports import too.
- Keywords on each group auto-sort notes; type keywords turn “Remind me to…” into a Reminder.
- The same reminder written five times becomes one card marked **×5**.

### 2 · Sort visually — Board

- **Drag** a card to a column to set that field. **Drop on the middle of another card to make it a subtask.** Drop on a card's top or bottom edge to place it there. **Alt/Option-drag** copies.
- **Long entries fold to three lines.** “Show more” on a card opens its notes, subnotes and subtasks; Options → *Expand every card* opens them all.
- **Right-click a card** for color, add subtask, nest under…, move to…, duplicate.
- **Click a column name** to open that group and sort into the level below.
- **Columns** and **Rows** can be any field. **Select** cards (`Ctrl/⌘`-click, `Shift`-click, tick box) and press `1`–`9`, or use the bar at the bottom.
- **Triage** (`T`) walks through unsorted tasks one at a time.

### 3 · Review — List, Outline, Reports

- **List:** sortable table with in-place editing; subtasks show their parent.
- **Outline:** a document by Parent → Entity → Sub-branch. **Drag** tasks to reorder, move them between groups, or nest them; drag subnotes between tasks. Copy as Markdown, download, or print to PDF.
- **Reports:** open work and hours by group, overdue, the next 14 days, priorities, types, statuses, repeats you keep writing down.

### 4 · Send it on — Export (`E`)

| Format | Use it for | Notes |
|---|---|---|
| **Todoist CSV** | Todoist | Sections, p1–p4, durations, repeats; subtasks become Todoist sub-tasks. 300 tasks per project — use *one file per section*. |
| **Asana CSV** | Asana | *Add tasks via → CSV*. Subtasks arrive as tasks marked “Subtask of …”. |
| **Spreadsheet CSV** | Excel, Google Sheets, Notion, Airtable, ClickUp, Monday | Every level, Parent task, Parent ID and Color are columns (re-importable with the hierarchy). |
| **Plain list** | Trello, Apple Reminders, Things, Microsoft To Do | Subtasks are indented. |
| **Markdown checklist** | Obsidian, Notion, GitHub | Nested checklists. |
| **Calendar (.ics)** | Google, Outlook, Apple Calendar | Dated tasks as all-day events; repeats keep their schedule. |
| **HatRack file** | Another computer | Configure → Data → Restore. |

### For admins: share one structure with a team

HatRack has no accounts. The person who sets it up can **Configure → Data → Download setup template** (groups, levels, keywords, types, priorities, statuses, durations, fields — no tasks) and share it. Everyone else loads it with **Restore → Apply setup**, which adds what's missing (matched by name) and keeps their tasks.

## Shortcuts you can type in any task

| Type | Meaning | Examples |
|---|---|---|
| `@Group` | where it goes | `@northside` `@Ledgerline/Admin` `@"Home & personal"` |
| `#Type` | type; other hashtags become tags | `#Reminder` `#idea` `#client` |
| `!priority` | by name or position | `!high` `!1` |
| `~time` | estimated time | `~15m` `~1h30m` `~2d` |
| `^date` | due date | `^today` `^fri` `^11/14` `^+3d` `^eom` |
| `*repeat` | repeating | `*daily` `*weekdays` `*weekly` `*monthly` `*yearly` |

## Keyboard

`N` quick add · `I` import · `T` triage · `E` export · `G` guide · `?` shortcuts · `← →` move through the tour · `1`–`9` move selection · `Ctrl/⌘ C / V / D` copy, paste, duplicate · `Delete` · `Ctrl/⌘ Z` undo · `→ / ←` expand or fold the focused card · `Esc` close.

## Your data

- Saved in your browser for the address you open HatRack from. A different browser, device or address starts empty; clearing site data erases it. **Back up** from Configure → Data.
- **Attachments** need no extra software: links are stored with the task; files go in the browser's built-in database (IndexedDB). Tick “Include stored attachment files” when backing up to move them.

## Changing the app — and keeping the tour and guide current

The app is assembled from `src/` (one stylesheet, a page shell and numbered script files). For every update:

1. Make the change in `src/`.
2. In `src/release.json`, raise `version` and add an entry at the top of `changelog` (title, one-line text, and optionally the tour step it relates to). People see it as a *What's new* tour the next time they open HatRack.
3. If you added a control (a button, view, Configure tab, export format, bulk action or menu item), list it in `guide-src/features.json` with its guide section and tour step, and add the step in `guide-src/build_guide.py` (`TOUR_STEPS`).
4. Push. The workflow runs `release.py`, which:
   - builds `index.html`,
   - re-takes every screenshot from the running app,
   - rebuilds `guide.html` and the tour (`guide/tour.js`),
   - checks that every control is documented, every numbered spot still matches the app, and the screenshots came from this build,
   - then publishes the site and commits the refreshed files.

If the check fails, the site is not published and the Actions log says exactly what is missing. To run the same thing locally: `pip install playwright pillow`, `python3 -m playwright install chromium`, then `python3 release.py`.

## Not included (yet)

- Live syncing between devices or a shared team board — that needs a backend (for example Supabase).
- Touch drag-and-drop varies by phone browser; on phones, tick cards and use **Move to…** or **Nest under…**.
