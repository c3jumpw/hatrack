#!/usr/bin/env python3
"""Bundle src/ into a single index.html (no build tools needed to run the app),
and write CHANGELOG.md from the same change log.

The version and change log come from src/release.json — the one place every change is recorded.
The getting-started tour and the guide's screenshots are separate files (guide/tour.js,
guide/*.webp) made by guide-src/build_guide.py — run release.py to rebuild everything in one go.

Also used as a module by release.py and guide-src/check_docs.py:
  validate_release(rel) -> list of problems with src/release.json
  changelog_md(rel)     -> the text of CHANGELOG.md
  app_fingerprint()     -> a hash of the app's code (everything in src/ except release.json),
                           so a published version can't change without a new change-log entry
"""
import hashlib, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
KINDS = {"new": "New", "improved": "Improved", "fixed": "Fixed", "changed": "Changed", "removed": "Removed"}
AUDIENCES = {"all": "Everyone", "admin": "Admins"}


def ver_key(v):
    return tuple(int(x) for x in v.split("."))


def validate_release(rel):
    """problems with src/release.json, as sentences; empty when it's fine"""
    out = []
    v, log = rel.get("version", ""), rel.get("changelog") or []
    if not re.fullmatch(r"\d+\.\d+\.\d+", v):
        return [f'release.json: "version" should look like 1.4.0, not “{v}”.']
    if not log:
        return ['release.json: "changelog" is empty — add an entry for this version.']
    if log[0].get("version") != v:
        out.append(f'release.json: the version is {v} but the newest change-log entry is {log[0].get("version")} — add an entry for {v} at the top of "changelog".')
    if rel.get("date") != log[0].get("date"):
        out.append(f'release.json: "date" ({rel.get("date")}) should match the newest change-log entry ({log[0].get("date")}).')
    prev = None
    for r in log:
        rv = r.get("version", "?")
        if not re.fullmatch(r"\d+\.\d+\.\d+", rv):
            out.append(f"release.json: change-log version “{rv}” should look like 1.4.0."); continue
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", r.get("date", "")):
            out.append(f'release.json: {rv} needs a "date" like 2026-11-20.')
        if prev and ver_key(rv) >= ver_key(prev["version"]):
            out.append(f"release.json: keep the change log newest first — {rv} comes after {prev['version']}.")
        if prev and r.get("date", "") > prev.get("date", ""):
            out.append(f"release.json: {rv} is dated after the newer {prev['version']}.")
        if not r.get("items"):
            out.append(f'release.json: {rv} has no changes listed in "items".')
        for it in r.get("items", []):
            t = it.get("title", "").strip()
            if not t or not it.get("text", "").strip():
                out.append(f'release.json: every change in {rv} needs a "title" and a "text".')
            if it.get("kind", "new") not in KINDS:
                out.append(f'release.json: {rv} “{t}”: "kind" must be one of {", ".join(KINDS)}.')
            if it.get("audience", "all") not in AUDIENCES:
                out.append(f'release.json: {rv} “{t}”: "audience" must be "all" (everyone) or "admin" (admins only).')
        prev = r
    return out


def changelog_md(rel):
    lines = ["# HatRack change log", "",
             "Every release of HatRack and what changed, newest first. In the app: Configure → Change log (oldest first, with filters and downloads).",
             "", "<!-- Generated from src/release.json by build.py — edit that file, not this one. -->", ""]
    for r in rel["changelog"]:
        lines += [f"## {r['version']} — {r['date']}" + (f" · {r['title']}" if r.get("title") else ""), ""]
        for it in r["items"]:
            lines.append(f"- **{it['title']}** _({KINDS[it.get('kind', 'new')]} · {AUDIENCES[it.get('audience', 'all')]})_ — {it['text']}")
        lines.append("")
    return "\n".join(lines)


def app_fingerprint(root=ROOT):
    """sha256 of the page shell, the stylesheet and every script — not release.json"""
    h, src = hashlib.sha256(), Path(root) / "src"
    for p in [src / "shell.html", src / "styles.css", *sorted((src / "js").glob("*.js"))]:
        h.update(p.relative_to(root).as_posix().encode() + b"\0" + p.read_bytes() + b"\0")
    return h.hexdigest()


def main():
    release = json.loads((SRC / "release.json").read_text())
    problems = validate_release(release)
    if problems:
        sys.exit("✗ " + "\n✗ ".join(problems))
    css = (SRC / "styles.css").read_text()
    js = "\n".join(p.read_text() for p in sorted((SRC / "js").glob("*.js")))
    js = js.replace("__RELEASE_JSON__", json.dumps(release, ensure_ascii=False))
    shell = (SRC / "shell.html").read_text()
    out = shell.replace("/*__CSS__*/", css).replace("/*__JS__*/", js)
    (ROOT / "index.html").write_text(out)
    (ROOT / "CHANGELOG.md").write_text(changelog_md(release))
    n = sum(len(r["items"]) for r in release["changelog"])
    print(f"index.html  {len(out) / 1024:.1f} KB  (HatRack {release['version']}) · CHANGELOG.md  {len(release['changelog'])} releases, {n} changes")


if __name__ == "__main__":
    main()
