#!/usr/bin/env python3
"""Rebuild HatRack and everything that documents it, in order:

  1. build.py                      app → index.html (version from src/release.json)
  2. guide-src/capture.py          fresh screenshots of every screen
  3. guide-src/build_guide.py      guide.html + the in-app tour (guide/tour.js)
  4. guide-src/capture.py --only tour, then build_guide.py again (screens of the tour itself)
  5. guide-src/check_docs.py       stops if a feature has no docs or anything is stale

Usage:  python3 release.py [--fonts FOLDER]
Needs:  pip install playwright pillow && python3 -m playwright install chromium
The GitHub workflow in .github/workflows runs this on every push.
"""
import subprocess, sys
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
print('\n✓ App, screenshots, guide and tour are up to date.')
