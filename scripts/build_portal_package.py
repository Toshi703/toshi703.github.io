#!/usr/bin/env python3
"""Build a clean, offline-friendly HTML5 ZIP for compatible game portals.

This package excludes site-specific ad tags, external CDN/font requests, and the
site service worker. It deliberately does not add a portal SDK.
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

# Remove website identity and third-party ad integrations from portal builds.
html = re.sub(r"\s*<meta name=\"monetag\"[^>]*>", "", html)
html = re.sub(r"\s*<link rel=\"canonical\"[^>]*>", "", html)
html = re.sub(r"\s*<meta (?:property=\"og:[^\"]+\"|name=\"twitter:[^\"]+\")[^>]*>", "", html)
html = re.sub(r"\s*<script type=\"application/ld\+json\">.*?</script>", "", html, flags=re.S)
html = re.sub(r"\s*<script>\(function\(s\)\{s\.dataset\.zone='[^']+'.*?</script>", "", html, flags=re.S)
html = html.replace(
    '  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9479603502419364"\n     crossorigin="anonymous"></script>\n',
    "",
)
html = re.sub(r"\s*<script src=\"https://cdn\.tailwindcss\.com\"></script>", "", html)
html = re.sub(r"\s*<link rel=\"preconnect\" href=\"https://fonts\.(?:googleapis|gstatic)\.com\"[^>]*>", "", html)
html = re.sub(r"\s*<link href=\"https://fonts\.googleapis\.com/[^\"]+\"[^>]*>", "", html)
html = html.replace('<body class="min-h-screen">', '<body>')
html = re.sub(r'<article class="utility-card">.*?id="boostButton".*?</article>', "", html, flags=re.S)
html = re.sub(r'\s*<section class="ad-slot"[^>]*>.*?</section>', "", html, flags=re.S)
html = re.sub(r'\s*<div id="boostModal".*?</div></div>', "", html, flags=re.S)

# Remove the site's service worker registration and demo-only rewarded-ad wiring.
js = re.sub(
    r"\n  if \('serviceWorker' in navigator\) \{.*?\n  \}\n",
    "\n",
    js,
    flags=re.S,
)
boost_wiring = """  $('boostButton').addEventListener('click', () => { $('boostModal').hidden = false; $('closeModal').focus(); });
  $('closeModal').addEventListener('click', () => $('boostModal').hidden = true);
  $('boostModal').addEventListener('click', event => { if (event.target === $('boostModal')) $('boostModal').hidden = true; });
"""
if boost_wiring not in js:
    raise SystemExit("Could not locate demo rewarded-ad handlers; review portal transformation.")
js = js.replace(boost_wiring, "")
js = js.replace(
    "if (event.key === 'Escape') { $('boostModal').hidden = true; $('offlineModal').hidden = true; }",
    "if (event.key === 'Escape') { $('offlineModal').hidden = true; }",
)

css = re.sub(r"^@import url\([^\n]+\);\s*", "", css)
css = "body{min-height:100vh}\n" + css
css = css.replace(".bottom-grid{display:grid;grid-template-columns:1fr 1fr;", ".bottom-grid{display:grid;grid-template-columns:1fr;")

if re.search(r"https?://", html + css + js):
    raise SystemExit("Unexpected external URL remains in clean package source; review before publishing.")
if any(token in html + js for token in ("monetag", "adsbygoogle.js", "nap5k.com", "12167433", "boostButton", "boostModal", "serviceWorker.register")):
    raise SystemExit("Ad integration or site-specific worker remains in clean package.")

readme = """Neon Miner — HTML5 portal package

This clean build excludes Monetag, Google AdSense, visible ad placeholders, remote font/CDN calls, and the website service worker. It includes local progress saves, 12-hour capped offline earnings, bulk purchases, prestige, optional synthesized audio, and JSON save import/export. No CrazyGames, Poki, Newgrounds, or GameDistribution SDK is included; each portal integration and submission must follow that portal's current instructions.

Entry point: index.html (archive root).
Language: French.
Controls: click/tap; keyboard focus is supported.
Progress: local browser storage; no account or cross-device sync.
"""
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    archive.writestr("index.html", html)
    archive.writestr("styles.css", css)
    archive.writestr("game.js", js)
    archive.writestr("README.txt", readme)
print(OUTPUT)
print(f"archive bytes: {OUTPUT.stat().st_size}")
