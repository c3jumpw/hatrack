#!/usr/bin/env python3
"""Fail the build when the guide or the tour has fallen behind the app.

Checks that:
  * every control in index.html (buttons, views, toolbar, Configure tabs, export formats,
    bulk actions, menu items tagged with `feature:`) belongs to a feature in features.json,
  * every feature has a guide section in guide.html and a step in guide/tour.js,
  * the screenshots were captured from the current index.html,
  * the version in src/release.json matches the app, the guide and the tour,
  * every image the guide and tour use exists.
"""
import hashlib, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
app = (ROOT / 'index.html').read_text()
guide = (ROOT / 'guide.html').read_text()
tour_js = (ROOT / 'guide' / 'tour.js').read_text() if (ROOT / 'guide' / 'tour.js').exists() else ''
tour = json.loads(tour_js[tour_js.index('{'):tour_js.rindex('}') + 1]) if tour_js else {'slides': {}, 'version': None}
reg = json.loads((ROOT / 'guide-src' / 'features.json').read_text())['features']
rel = json.loads((ROOT / 'src' / 'release.json').read_text())
meta_p = ROOT / 'guide-src' / 'capture-meta.json'
meta = json.loads(meta_p.read_text()) if meta_p.exists() else {}
errors = []

# controls in the app
ui = set(re.findall(r'id="(btn-[a-z-]+)"', app)) | {'tb-' + m for m in re.findall(r'id="tb-([a-z-]+)"', app)}
ui |= {'view:' + m for m in re.findall(r'data-view="([a-z]+)"', app)} | {'sb:' + m for m in re.findall(r'data-sb="([a-z]+)"', app)}
ui |= {'data:' + m for m in re.findall(r'data-data="([a-z]+)"', app)} | {'act:' + m for m in re.findall(r'data-act="([a-z]+)"', app)}
tabs = re.search(r'const SET_TABS = \[(.*?)\];', app, re.S)
ui |= {'tab:' + m for m in re.findall(r"\['([a-z]+)', '", tabs.group(1))} if tabs else set()
ui |= {'fmt:' + m for m in re.findall(r"\{ id: '([a-z]+)', name: '", app)}
ui |= set(re.findall(r"feature: '([a-z]+:[a-z]+)'", app))
if 'id="quick"' in app: ui.add('quick')

documented = {t for f in reg for t in f['ui']}
for t in sorted(ui - documented): errors.append(f'Not documented: “{t}” is in the app but no feature in guide-src/features.json lists it.')
for t in sorted(documented - ui): errors.append(f'Out of date: features.json lists “{t}”, which is no longer in the app.')
gids = set(re.findall(r'id="([a-z0-9-]+)"', guide))
for f in reg:
    if f['guide'] not in gids: errors.append(f'Feature “{f["name"]}”: guide section #{f["guide"]} is missing from guide.html.')
    if f['tour'] not in tour['slides']: errors.append(f'Feature “{f["name"]}”: tour step {f["tour"]} is missing from guide/tour.js.')

# freshness and versions
sha = hashlib.sha256((ROOT / 'index.html').read_bytes()).hexdigest()
if meta.get('app_sha256') != sha: errors.append('Screenshots are older than the app: run release.py (or guide-src/capture.py) to re-take them.')
v = rel['version']
if rel['changelog'][0]['version'] != v: errors.append(f'release.json: the newest changelog entry ({rel["changelog"][0]["version"]}) should match the version ({v}).')
if f'"version": "{v}"' not in app: errors.append(f'index.html was built from an older release.json — run build.py.')
if tour.get('version') != v: errors.append(f'guide/tour.js is for version {tour.get("version")}, not {v} — run build_guide.py.')
if f'HatRack {v}' not in guide: errors.append(f'guide.html does not mention HatRack {v} — run build_guide.py.')

# images
for src in set(re.findall(r'src="(guide/[^"]+|apple-touch-icon\.png)"', guide)):
    if not (ROOT / src).exists(): errors.append(f'guide.html uses a missing image: {src}')
for s in tour['slides'].values():
    if s.get('img') and not (ROOT / s['img']).exists(): errors.append(f'Tour step {s["id"]} uses a missing image: {s["img"]}')

if errors:
    print('Docs check failed:\n  - ' + '\n  - '.join(errors)); sys.exit(1)
print(f'Docs check passed: {len(ui)} controls in {len(reg)} features, {len(tour["slides"])} tour steps, screens from this build of HatRack {v}.')
