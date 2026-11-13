#!/usr/bin/env python3
"""build.py - one command for any Warranty & Claims niche build.

  python build.py --pack ../packs/stafda-halvern.json --skin ../skins/halvern --out ../out/halvern-warranty-desk

Inputs
  core/base.html                  the solution (relabelled for manufacturer-reviews-claims), with the generalized Look up
  core/layer.css, classic.js,     Classic / Modern layout layers (colour slots --tf-*, no brand)
       modern.js
  core/claimant-theme.prefixed.css  claimant-screen theme structure; the skin supplies colours, fonts and hero photo
  core/extend-admin.prefixed.css  Extend design system for the manufacturer (admin) view
  core/runtime.js                 sign-in hero, header lockup, icons, titles; text from skin.json
  <pack>.json + <pack>.swaps.json the niche: data (via pack_to_data.py) and wording
  <skin>/skin.json, fonts/, assets/
Writes a complete static PWA folder (index.html, data/, assets/, manifest.json, sw.js, vercel.json, README.md).
Look, words and data only: no behaviour is added.
"""
import argparse, json, pathlib, shutil, subprocess, sys, re
H = pathlib.Path(__file__).resolve().parent
ap = argparse.ArgumentParser(); ap.add_argument("--pack", required=True); ap.add_argument("--skin", required=True)
ap.add_argument("--out", required=True); ap.add_argument("--cache", default=None); a = ap.parse_args()
pack_p, skin_d, out = pathlib.Path(a.pack).resolve(), pathlib.Path(a.skin).resolve(), pathlib.Path(a.out).resolve()
pack = json.load(open(pack_p, encoding="utf-8")); skin = json.load(open(skin_d / "skin.json", encoding="utf-8"))
sw = json.load(open(pack_p.with_suffix(".swaps.json"), encoding="utf-8"))
rd = lambda p: (H / p).read_text(encoding="utf-8")

html, classic, modern = rd("base.html"), rd("classic.js"), rd("modern.js")
missing = []
for old, new in sw["swaps"]:
    hit = False
    for name in ("html", "classic", "modern"):
        v = locals()[name]
        if old in v: hit = True; v = v.replace(old, new)
        if name == "html": html = v
        elif name == "classic": classic = v
        else: modern = v
    if not hit: missing.append(old[:60])
for old, new in sw.get("renames", []):
    html, classic, modern = html.replace(old, new), classic.replace(old, new), modern.replace(old, new)

theme = rd("claimant-theme.prefixed.css")
for k, v in skin["fontVars"].items():
    theme, n = re.subn(re.escape(k) + r":[^;]*;", f"{k}:{v};", theme, count=1); assert n, k
for old, new in skin["colors"].items():
    theme = theme.replace(old, new).replace(old.lower(), new)
theme = theme.replace("assets/tessford-signin.jpg", "assets/" + skin["hero"])
ff = "\n".join(f"@font-face{{font-family:'{fam}';src:url(assets/fonts/{f}) format('woff2');font-display:swap;{x}}}" for fam, f, x in skin["fonts"])
ff += "\n@font-face{font-family:'InterV';src:url(assets/fonts/inter.woff2) format('woff2');font-display:swap;font-weight:100 900;}"
ff += "\n@font-face{font-family:'RecursiveV';src:url(assets/fonts/recursive.woff2) format('woff2');font-display:swap;font-weight:300 1000;}"
head = ("<script>try{localStorage.removeItem('ec-theme');}catch(e){}</script><link rel=\"icon\" href=\"assets/favicon.svg\">"
        "<style id=\"tf-theme\">\n" + ff + "\n" + rd("layer.css") + "\n" + theme + "\n" + rd("extend-admin.prefixed.css") + "\n</style>\n")
html = html.replace("</head>", head + "</head>", 1)
html = re.sub(r"<title>.*?</title>", f"<title>{skin['title']}</title>", html, count=1, flags=re.S)
html = re.sub(r'<meta name="theme-color" content="[^"]*">', f'<meta name="theme-color" content="{skin["themeColor"]}">', html, count=1)
fav = "data:image/svg+xml," + (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="{skin["themeColor"]}"/>'
       f'<g transform="translate(6 6) scale(.75)" fill="{skin["markOnDark"]}">{skin["mark"]}</g></svg>').replace("#", "%23")
cfg = {k: skin[k] for k in ("title", "company", "shortName", "lockupName", "lockupSub", "headline", "tagline", "legend", "signoff", "markOnDark", "mark")}
cfg["favicon"] = fav
runtime = rd("runtime.js").replace("__CFG__", json.dumps(cfg, ensure_ascii=False))
tail = ('<script>(function(){var s=document.getElementById("tf-theme");if(s){document.body.appendChild(s);}})();</script>'
        '<script id="cd-classic">\n' + classic + '\n</script><script id="cd-modern">\n' + modern + '\n</script><script id="tf-runtime">' + runtime + '</script>')
i = html.rfind("</body>"); html = html[:i] + tail + html[i:]

if out.exists(): shutil.rmtree(out)
(out / "assets" / "fonts").mkdir(parents=True)
(out / "index.html").write_text(html, encoding="utf-8")
subprocess.run([sys.executable, str(H / "pack_to_data.py"), str(pack_p), str(out / "data")], check=True)
for f, *_ in [(x[1],) for x in skin["fonts"]]: shutil.copy(skin_d / "fonts" / f, out / "assets" / "fonts" / f)
for f in ("inter.woff2", "recursive.woff2"): shutil.copy(H / "fonts" / f, out / "assets" / "fonts" / f)
for f in skin_d.joinpath("assets").iterdir(): shutil.copy(f, out / "assets" / f.name)
if (skin_d / "README-deploy.md").exists(): shutil.copy(skin_d / "README-deploy.md", out / "README.md")
slug = re.sub(r"[^a-z0-9]+", "-", skin["shortName"].lower()).strip("-")
cache = a.cache or f"warranty-claims-{slug}-v1"
(out / "manifest.json").write_text(json.dumps({"name": skin["title"], "short_name": "Warranty Desk",
    "description": f"{skin['company']} warranty desk (demo, sample data, fictional company)", "start_url": "./", "scope": "./",
    "display": "standalone", "background_color": skin["themeColor"], "theme_color": skin["themeColor"], "orientation": "portrait-primary",
    "icons": [{"src": "assets/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable"},
              {"src": "assets/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}]}, indent=2), encoding="utf-8")
assets = ["./", "./index.html", "./manifest.json", "./data/synthetic-data.js", "./data/synthetic-data.json"] + \
         sorted("./" + str(p.relative_to(out)).replace("\\", "/") for p in (out / "assets").rglob("*") if p.is_file())
(out / "sw.js").write_text(f"const CACHE_NAME = '{cache}';\nconst ASSETS = {json.dumps(assets, indent=2)};\n" + """
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => { e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))); });
""", encoding="utf-8")
(out / "vercel.json").write_text('{\n  "cleanUrls": true\n}\n', encoding="utf-8")
print(f"built {out.name}: {len(sw['swaps'])-len(missing)}/{len(sw['swaps'])} swaps applied, cache {cache}")
if missing: print("NOT FOUND:", missing)
