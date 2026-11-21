#!/usr/bin/env python3
"""Rebuild HatRack and everything that documents it, in order:

  1. build.py                      app → index.html, and CHANGELOG.md (both from src/release.json)
  2. guide-src/capture.py          fresh screenshots of every screen
  3. guide-src/build_guide.py      guide.html + the in-app tour (guide/tour.js)
  4. guide-src/capture.py --only tour, then build_guide.py again (screens of the tour and What's new)
  5. guide-src/check_docs.py       stops if a feature has no docs, anything is stale, or the app
                                   changed since its version was published without a new
                                   change-log entry

Usage:  python3 release.py [--fonts FOLDER] [--publish]
  --publish   after every check passes, record this version's code fingerprint in
              src/release-lock.json (the GitHub workflow does this on every push to main;
              Vercel serves the site — see vercel.json)
Needs:  pip install playwright pillow && python3 -m playwright install chromium
"""
import datetime, json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
args = sys.argv[1:]
fonts = []
if '--fonts' in args: fonts = [args[args.index('--fonts') + 1]]
steps = [['build.py'], ['guide-src/capture.py', *fonts], ['guide-src/build_guide.py'],
         ['guide-src/capture.py', '--only', 'tour', *fonts], ['guide-src/build_guide.py'], ['guide-src/check_docs.py']]
for s in steps:
    print(f'\n▶ {" ".join(s)}', flush=True)
    r = subprocess.run([sys.executable, str(ROOT / s[0]), *s[1:]], cwd=ROOT)
    if r.returncode: sys.exit(f'\n✗ {s[0]} failed — nothing was published. Fix the message above and run release.py again.')

if '--publish' in args:
    sys.path.insert(0, str(ROOT))
    import build
    rel = json.loads((ROOT / 'src' / 'release.json').read_text())
    lock_p = ROOT / 'src' / 'release-lock.json'
    lock = json.loads(lock_p.read_text())
    v = rel['version']
    if v not in lock['published']:
        lock['published'][v] = {'fingerprint': build.app_fingerprint(), 'date': datetime.date.today().isoformat()}
        lock['published'] = dict(sorted(lock['published'].items(), key=lambda kv: build.ver_key(kv[0])))
        lock_p.write_text(json.dumps(lock, indent=2, ensure_ascii=False) + '\n')
        print(f'\n✓ Recorded HatRack {v} as published. From now on, changing the app needs a new version and a change-log entry.')
print('\n✓ App, change log, screenshots, guide and tour are up to date.')
