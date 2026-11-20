# Working on HatRack

HatRack is a single-page task sorter. `index.html` is **generated** — edit `src/`, then run `python3 build.py`.

## Every change to the app goes in the change log

Admins read the full history in Configure → Change log, everyone else sees the changes for their role in What's new after an update, and the publish step refuses code changes that aren't logged. So with any change under `src/` (other than `src/release.json` itself):

1. In `src/release.json`, raise `version` (patch for fixes, minor for features) and set `date` to today (YYYY-MM-DD).
2. Add an entry at the **top** of `changelog` with the same `version` and `date`, a short `title`, and one item per change:
   - `kind`: `new`, `improved`, `fixed`, `changed` or `removed`
   - `audience`: `all` (everyone, including everyday users) or `admin` (setup, backups, hosting, docs, build — admins only)
   - `title` (a few words) and `text` (one plain sentence about what the person will notice)
   - optional `slide`: a tour step id from `TOUR_STEPS` in `guide-src/build_guide.py`, opened by **Show me**
3. Never rewrite or delete older entries. They're the history. Fixing a typo in one is fine.

`src/release-lock.json` is written by the GitHub workflow when a version is published. Don't edit it. If `check_docs.py` says the app changed after a version was published, the fix is a new version plus a change-log entry, never a lock edit.

## New controls need docs

A new button, view, Configure tab, export format, bulk action or menu item (anything tagged `feature:`) must be listed in `guide-src/features.json` with a guide section and a tour step. Add the step to `TOUR_STEPS` and, if it needs a new screenshot, add it to `guide-src/capture.py`.

## Check before pushing

```
pip install playwright pillow && python3 -m playwright install chromium
python3 release.py            # build, screenshots, guide, tour, CHANGELOG.md, then all checks
```

Pushing to `main` runs the same steps in `.github/workflows/release.yml` with `--publish`, commits the refreshed files and deploys GitHub Pages.
