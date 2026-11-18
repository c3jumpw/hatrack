#!/usr/bin/env python3
"""Bundle src/ into a single index.html (no build tools needed to run the app).

The version and changelog come from src/release.json. The getting-started tour and the
guide's screenshots are separate files (guide/tour.js, guide/*.webp) made by
guide-src/build_guide.py — run release.py to rebuild everything in one go.
"""
import json
from pathlib import Path

root = Path(__file__).parent
src = root / "src"
release = json.loads((src / "release.json").read_text())
css = (src / "styles.css").read_text()
js = "\n".join(p.read_text() for p in sorted((src / "js").glob("*.js")))
js = js.replace("__RELEASE_JSON__", json.dumps(release, ensure_ascii=False))
shell = (src / "shell.html").read_text()
out = shell.replace("/*__CSS__*/", css).replace("/*__JS__*/", js)
(root / "index.html").write_text(out)
print(f"index.html  {len(out) / 1024:.1f} KB  (HatRack {release['version']})")
