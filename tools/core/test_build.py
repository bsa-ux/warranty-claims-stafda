#!/usr/bin/env python3
"""test_build.py - headless regression for any pack + skin build (Playwright + Chromium).

  python test_build.py <build folder>/index.html <pack>.test.json [screenshot dir]

Generalized from test_tessford.py: the same checks, with names, claims, orders and brand
values read from the pack's test profile. Checks: no page errors; role-toggle landing paths;
the live claim flow in Modern and Classic; expired and voided blocks; Classic and Modern
search; account directory; analytics columns at 1366/798/420; brand separation (skin on the
claimant screens and sign-in, Extend on the manufacturer view); Look up presets; sign-in fit
at five sizes; no banned or leftover words on screen.
"""
import asyncio, sys, json, pathlib
from playwright.async_api import async_playwright
SRC = pathlib.Path(sys.argv[1]).resolve(); T = json.load(open(sys.argv[2], encoding="utf-8"))
SHOTS = pathlib.Path(sys.argv[3] if len(sys.argv) > 3 else SRC.parent.parent / "_screens"); SHOTS.mkdir(parents=True, exist_ok=True)
results = []
def ok(name, cond, info=""):
    results.append((bool(cond), name, info)); print(("PASS " if cond else "FAIL ") + name + (f"  [{info}]" if info else ""))
async def fresh(p, w=390, h=844, classic=False):
    b = await p.chromium.launch(); pg = await b.new_page(viewport={"width": w, "height": h})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto(SRC.as_uri()); await pg.wait_for_timeout(500)
    if classic: await pg.evaluate("setTheme('classic')"); await pg.wait_for_timeout(200)
    return b, pg, errs
async def main_text(pg): return await pg.evaluate("document.getElementById('mainContent').innerText")
async def pick(pg, order, item_index=None, sku=None):
    await pg.select_option("#claimOrder", order); await pg.wait_for_timeout(150)
    if sku: item_index = await pg.evaluate(f"[...document.querySelectorAll('#claimProduct option')].findIndex(o=>o.text.indexOf('{sku}')>-1)")
    await pg.select_option("#claimProduct", index=item_index); await pg.wait_for_timeout(200)
async def file_claim(pg, label):
    L = T["live_claim"]
    await pg.evaluate("handleLogin('distributor', DATA.distributors[0].id)"); await pg.wait_for_timeout(200)
    await pg.evaluate("switchDistTab('newclaim')"); await pg.wait_for_timeout(200)
    await pick(pg, L["order"], sku=L["sku"])
    await pg.fill("#claimQty", "3"); await pg.select_option("#claimSeverity", "high")
    await pg.select_option("#claimFailure", index=1); await pg.fill("#claimDesc", L["desc"])
    await pg.evaluate("submitClaim()"); await pg.wait_for_timeout(250)
    t = await main_text(pg); ok(f"{label}: {L['id']} filed", L["id"] in t and "CLAIM FILED" in t.upper(), t[:60].replace("\n", " "))
    await pg.evaluate("switchRole('manufacturer')"); await pg.wait_for_timeout(300)
    ok(f"{label}: manufacturer lands on {L['id']}", L["id"] in await main_text(pg))
    await pg.evaluate("switchRole('distributor')"); await pg.wait_for_timeout(300)
    ok(f"{label}: claimant lands back on {L['id']}", L["id"] in await main_text(pg))

async def main():
    async with async_playwright() as p:
        b, pg, errs = await fresh(p)
        await pg.screenshot(path=str(SHOTS / "c01-sign-in.png"))
        body = await pg.evaluate("getComputedStyle(document.body).fontFamily"); ok("sign-in uses the skin's type", T["body_font"] in body, body[:40])
        await pg.evaluate("handleLogin('distributor', DATA.distributors[0].id)"); await pg.wait_for_timeout(300)
        hdr = await pg.evaluate("getComputedStyle(document.querySelector('.app-header')).backgroundColor")
        ok("claimant header uses the skin colour", hdr == T["claimant_header_rgb"], hdr)
        shots = [("c02-home", "switchDistTab('home')"), ("c05-file", "switchDistTab('newclaim')"), ("c07-register", "switchDistTab('register')"),
                 ("c08-history", "switchDistTab('history')")] + [(n, f"showDistDetail('{c}')") for n, c in T["screens"].items()]
        for n, js in shots: await pg.evaluate(js); await pg.wait_for_timeout(250); await pg.screenshot(path=str(SHOTS / f"{n}.png"))
        await pg.evaluate("switchDistTab('lookup')"); await pg.wait_for_timeout(200)
        ok("look up: heading + DEMO presets card", await pg.evaluate("!!document.querySelector('.tfl-title') && !document.getElementById('lookupPresets').hidden && document.querySelectorAll('.tfl-chip').length>=12"))
        await pg.screenshot(path=str(SHOTS / "c03-look-up.png"), full_page=True)
        chips = await pg.evaluate("[...document.querySelectorAll('.tfl-chip')].map(b=>b.dataset.q)"); empty = []
        for i, c in enumerate(chips):
            await pg.evaluate(f"document.querySelectorAll('.tfl-chip')[{i}].click()"); await pg.wait_for_timeout(60)
            if await pg.evaluate("document.querySelectorAll('#lookupResults .product-card').length") < 1: empty.append(c)
            await pg.evaluate("document.getElementById('lookupClear').click()"); await pg.wait_for_timeout(40)
        ok(f"look up: all {len(chips)} presets return results", not empty, ", ".join(empty))
        await pg.fill("#lookupInput", T["lookup_first"]); await pg.dispatch_event("#lookupInput", "input"); await pg.wait_for_timeout(200)
        await pg.screenshot(path=str(SHOTS / "c04-look-up-results.png"))
        for q, want in T["lookup_queries"]:
            await pg.fill("#lookupInput", q); await pg.dispatch_event("#lookupInput", "input"); await pg.wait_for_timeout(60)
            ok(f"look up: '{q}' finds {want}", want in await main_text(pg))
        await pg.fill("#lookupInput", T["lookup_exact"]); await pg.dispatch_event("#lookupInput", "input"); await pg.wait_for_timeout(60)
        first = await pg.evaluate("document.querySelector('#lookupResults .pc-part').innerText")
        ok("look up: exact catalog number ranks first", first.startswith(T["lookup_exact"]), first)
        ok("look up: presets hide while searching", await pg.evaluate("document.getElementById('lookupPresets').hidden"))
        await pg.evaluate("document.getElementById('lookupClear').click()"); await pg.wait_for_timeout(60)
        ok("look up: clear brings presets back", await pg.evaluate("!document.getElementById('lookupPresets').hidden && document.getElementById('lookupInput').value===''"))
        L = T["live_claim"]; await pg.evaluate("switchDistTab('newclaim')"); await pick(pg, L["order"], sku=L["sku"])
        await pg.screenshot(path=str(SHOTS / "c06-file-form.png"), full_page=True)
        E = T["expired"]; await pick(pg, E["order"], E["item"])
        ok("expired registration blocks the claim", "can’t be claimed" in await main_text(pg)); await pg.screenshot(path=str(SHOTS / "c06b-file-blocked.png"))
        Vd = T["voided"]; await pg.evaluate(f"handleLogin('distributor', DATA.distributors[{Vd['account']}].id)"); await pg.evaluate("switchDistTab('newclaim')"); await pg.wait_for_timeout(150)
        await pick(pg, Vd["order"], Vd["item"]); t = await main_text(pg); ok("voided registration blocks the claim", "voided" in t and "can’t be claimed" in t)
        await pg.evaluate("handleLogin('manufacturer')"); await pg.wait_for_timeout(250)
        mf = await pg.evaluate("getComputedStyle(document.body).fontFamily"); ok("manufacturer view uses Extend type", "Inter" in mf, mf[:40])
        mh = await pg.evaluate("getComputedStyle(document.querySelector('.app-header')).backgroundColor"); ok("manufacturer header is Extend white", mh == "rgb(255, 255, 255)", mh)
        ok("admin title", (await pg.title()) == T["admin_title"], await pg.title())
        await pg.evaluate("window.__cdHintAction && window.__cdHintAction('manufacturer', document.querySelector('.rs-hint'))"); await pg.wait_for_timeout(250)
        t = await main_text(pg); ok(f"account directory lists {len(T['directory'])} accounts", all(n in t for n in T["directory"]))
        await pg.evaluate("handleLogin('distributor', DATA.distributors[0].id)"); await pg.evaluate(f"showDistDetail('{T['toggle_claim']}')")
        await pg.evaluate("switchRole('manufacturer')"); await pg.wait_for_timeout(200); ok("toggle: claimant claim -> same claim", T["toggle_claim"] in await main_text(pg))
        await pg.evaluate("switchMfgTab('queue')"); await pg.evaluate("switchRole('distributor')"); await pg.wait_for_timeout(200)
        ok("toggle: queue -> claimant history", "YOUR CLAIMS" in (await main_text(pg)).upper())
        await pg.evaluate("switchDistTab('home')"); await pg.evaluate("switchRole('manufacturer')"); await pg.wait_for_timeout(200)
        ok("toggle: home -> dashboard", "TOTAL CLAIMS" in (await main_text(pg)).upper())
        await pg.set_viewport_size({"width": 1280, "height": 800})
        for n, js in [("m01-dashboard", "switchMfgTab('dashboard')"), ("m02-queue", "switchMfgTab('queue')"),
                      ("m03-claim", f"showMfgDetail('{T['admin_claim']}')"), ("m04-analytics", "switchMfgTab('analytics')")]:
            await pg.evaluate(js); await pg.wait_for_timeout(300); await pg.screenshot(path=str(SHOTS / f"{n}.png"))
        text = ""
        for js in ["switchMfgTab('dashboard')", "switchMfgTab('queue')", "switchMfgTab('analytics')", f"showMfgDetail('{T['admin_claim']}')"]:
            await pg.evaluate(js); await pg.wait_for_timeout(150); text += await pg.evaluate("document.body.innerText")
        await pg.evaluate("handleLogin('distributor', DATA.distributors[0].id)")
        for js in ["switchDistTab('home')", "switchDistTab('register')", "switchDistTab('history')", "switchDistTab('lookup')"] + [f"showDistDetail('{c}')" for c in T["screens"].values()]:
            await pg.evaluate(js); await pg.wait_for_timeout(120); text += await pg.evaluate("document.body.innerText")
        await pg.evaluate("showRegForm && showRegForm()") if await pg.evaluate("typeof showRegForm==='function'") else None
        text += await pg.evaluate("document.body.innerText") + await pg.title()
        left = sorted({w for w in T["banned"] if w in text}); ok("no banned or leftover words on screen", not left, ", ".join(left))
        ok("modern: no page errors", not errs, "; ".join(errs[:2])); await b.close()
        for w, h in ((390, 844), (375, 667), (360, 640), (320, 568), (844, 390)):
            b, pg, errs = await fresh(p, w, h)
            ok(f"sign-in {w}x{h}: Modern/Classic toggle removed", not await pg.evaluate("!!document.getElementById('themeToggle')"))
            for role in ("manufacturer", "distributor"):
                await pg.evaluate("document.getElementById('loginScreen').scrollTop=0")
                await pg.select_option("#loginRole", role); await pg.wait_for_timeout(150)
                if role == "distributor": await pg.select_option("#loginDistAccount", index=1)
                await pg.wait_for_timeout(700)
                r = await pg.evaluate("""(()=>{const b=document.getElementById('loginBtn').getBoundingClientRect();
                  const inner=[...document.querySelectorAll('#loginScreen *')].filter(e=>e.scrollHeight>e.clientHeight+2&&/auto|scroll/.test(getComputedStyle(e).overflowY)).length;
                  return [b.top>=0&&b.bottom<=innerHeight, inner]})()""")
                ok(f"sign-in {w}x{h} {role}: Sign in visible, no inner scroller", r[0] and r[1] == 0, str(r))
            await pg.click("#loginBtn"); await pg.wait_for_timeout(250)
            ok(f"sign-in {w}x{h}: signs in", await pg.evaluate("getComputedStyle(document.getElementById('appShell')).display!=='none'")); await b.close()
        for w in (1366, 798, 420):
            b, pg, errs = await fresh(p, w, 900)
            await pg.evaluate("handleLogin('manufacturer')"); await pg.evaluate("switchMfgTab('analytics')"); await pg.wait_for_timeout(300)
            cols = await pg.evaluate("(()=>{var g=document.querySelector('.an-grid'); if(!g) return 1; var c=getComputedStyle(g).gridTemplateColumns; return c==='none'?1:c.split(' ').length;})()")
            ok(f"analytics at {w}px: {2 if w >= 800 else 1} column(s)", cols == (2 if w >= 800 else 1), str(cols)); await b.close()
        for classic in (False, True):
            b, pg, errs = await fresh(p, classic=classic); await file_claim(pg, "classic" if classic else "modern")
            q = T["history_search"]; await pg.evaluate("switchDistTab('history')"); await pg.wait_for_timeout(200)
            if classic:
                n0 = await pg.evaluate("document.querySelectorAll('.rl-row').length")
                await pg.fill(".rl-search input", q); await pg.dispatch_event(".rl-search input", "input"); await pg.wait_for_timeout(200)
                n1 = await pg.evaluate("[...document.querySelectorAll('.rl-row')].filter(r=>r.offsetParent).length"); ok("classic: search narrows the list", n0 > n1 >= 1, f"{n0}->{n1}")
            else:
                n0 = await pg.evaluate("document.querySelectorAll('.mt-table tbody tr').length")
                await pg.fill(".mt-search input", q); await pg.dispatch_event(".mt-search input", "input"); await pg.wait_for_timeout(200)
                n1 = await pg.evaluate("[...document.querySelectorAll('.mt-table tbody tr')].filter(r=>r.offsetParent&&!r.querySelector('.mt-empty')).length"); ok("modern: search narrows the table", n0 > n1 >= 1, f"{n0}->{n1}")
            ok(("classic" if classic else "modern") + ": no page errors in flow", not errs, "; ".join(errs[:2])); await b.close()
    bad = [r for r in results if not r[0]]
    print(f"\n{len(results) - len(bad)}/{len(results)} passed. Screens in {SHOTS}"); sys.exit(1 if bad else 0)
asyncio.run(main())
