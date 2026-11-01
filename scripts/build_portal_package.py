#!/usr/bin/env python3
"""Build an ad-free, offline-friendly HTML5 ZIP for portals that allow it.

This package deliberately excludes the live site's Monetag verification/tag,
external fonts/CDNs, and service worker. It does not add any portal SDK.
Usage: python3 scripts/build_portal_package.py [output.zip]
"""
from pathlib import Path
import re
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT.parent / "NeonMiner-HTML5-clean.zip"
OUTPUT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_OUTPUT

html = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "styles.css").read_text(encoding="utf-8")
js = (ROOT / "game.js").read_text(encoding="utf-8")

# The listing build must not send traffic to Monetag or inherit the live site's canonical URL.
html = re.sub(r"\s*<meta name=\"monetag\"[^>]*>", "", html)
html = re.sub(r"\s*<link rel=\"canonical\"[^>]*>", "", html)
html = re.sub(r"\s*<meta (?:property=\"og:[^\"]+\"|name=\"twitter:[^\"]+\")[^>]*>", "", html)
html = re.sub(r"\s*<script type=\"application/ld\+json\">.*?</script>", "", html, flags=re.S)
html = re.sub(r"\s*<script>\(function\(s\)\{s\.dataset\.zone='[^']+'.*?</script>", "", html, flags=re.S)
html = re.sub(r"\s*<script src=\"https://cdn\.tailwindcss\.com\"></script>", "", html)
html = re.sub(r"\s*<link rel=\"preconnect\" href=\"https://fonts\.(?:googleapis|gstatic)\.com\"[^>]*>", "", html)
html = re.sub(r"\s*<link href=\"https://fonts\.googleapis\.com/[^\"]+\"[^>]*>", "", html)
html = html.replace('<body class="min-h-screen">', '<body>')

# Strip site-specific automatic service-worker registration from this clean listing build.
js = re.sub(
    r"\n\s*if \('serviceWorker' in navigator\) \{\n\s*window\.addEventListener\('load', \(\) => \{\n\s*navigator\.serviceWorker\.register\(new URL\('sw\.js', document\.baseURI\)\)\n\s*\.then\(\(\) => console\.info\('Neon Miner service worker registered\.'\)\)\n\s*\.catch\(error => console\.warn\('Neon Miner service worker registration failed:', error\)\);\n\s*\}, \{ once: true \}\);\n\s*\}\n",
    "\n",
    js,
)
css = re.sub(r"^@import url\([^\n]+\);\s*", "", css)
css = "body{min-height:100vh}\n" + css

if re.search(r"https?://", html + css + js):
    raise SystemExit("Unexpected external URL remains in clean package source; review before publishing.")
if "serviceWorker.register" in js or "nap5k.com" in html or "12167433" in html:
    raise SystemExit("Live advertising or service-worker registration remains in clean package.")

readme = """Neon Miner — HTML5 portal package\n\nThis is a clean, ad-free build for portal review. It excludes Monetag, remote font/CDN calls, and the site's service worker. The rewarded-ad button remains a clearly labelled demo placeholder; it does not grant a reward or show an ad. No CrazyGames, Poki, Newgrounds, or GameDistribution SDK has been added.\n\nEntry point: index.html (archive root).\nLanguage: French.\nControls: click/tap.\nProgress: local browser storage; no account or cross-device sync.\n"""
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    archive.writestr("index.html", html)
    archive.writestr("styles.css", css)
    archive.writestr("game.js", js)
    archive.writestr("README.txt", readme)
print(OUTPUT)
print(f"archive bytes: {OUTPUT.stat().st_size}")
