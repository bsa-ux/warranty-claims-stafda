# Halvern Warranty Desk · Specialty tools & fasteners warranty and claims solution (demo)

A ready-made warranty and claims solution, dressed as **Halvern Tool & Fastener Co.** of Rockford, IL, a fictional maker of cordless tools, rotary hammers, diamond blades, anchors, powder-actuated tools and lasers. Specialty distributors file and track claims at the counter, on a phone or tablet, and Halvern's warranty team decides them on a laptop. Built for **STAFDA 2026, Anaheim (Nov 15–17)**.

The build is a static PWA: no backend, all sample data, and it works offline. Every company and person is fictional, and prices, terms and figures are illustrative.

## What is on screen

- **Distributor screens and sign-in: the Halvern brand** (draft v0.1, awaiting approval). Graphite bars and buttons, garnet as the signature colour, Barlow Condensed / Barlow / IBM Plex Mono, the hex-nut "H" mark, and a Higgsfield counter photo on sign-in.
- **Manufacturer view: the Extend design system**, unchanged from the Tessford build.
- **Look up:** a search box with a DEMO card of presets by catalog number, description and product line. Every preset returns results.
- **View as:** Distributor / Manufacturer keeps you on the matching screen, and "All distributors" opens the account directory.

## 3-minute script (STAFDA)

1. **Sign in** as Distributor, choosing **Corridan Construction Supply**.
   - Say: *"Claimed at the counter."*
   - **Look up:** tap **HV-HD20-K2**. Registered tools carry 5 years instead of 3.
   - **File:** ORD-2026-3101, then HV-HD20-K2. Enter 3 failed, High, Motor or switch failure, then tap **File claim**. It becomes **WC-2049**.
2. **View as: Manufacturer.** You land on WC-2049 in Halvern's queue (the Extend admin).
3. Open three claims to show the decisions, each with its reason in words:
   - **WC-2043:** diamond blade lost segments, approved as a defect.
   - **WC-2044:** blade worn down evenly, denied as normal wear.
   - **WC-2046:** laser dropped, denied (impact is excluded), recalibration quoted.
4. **View as: Distributor.** **WC-2041** shows credit memo CM-71304: $537.00 in parts plus a $45.00 freight credit.
5. **Analytics:** failure types, claims by distributor, and the date-code risk monitor, where battery batch **2618F** is flagged from two distributors. Close with: *"Every claim arrives with its date code, so you see a bad batch before it becomes a recall."*

**Guardrails:** ORD-2021-3103 (HV-HD20-B) is expired, and Tallis Jobsite Supply's HV-PAT27-SA registration is voided for non-Halvern loads. Both are blocked, with the reason shown.

## Build

From `tools/core/`:

```
python build.py --pack ../packs/stafda-halvern.json --skin ../skins/halvern --out ../../out/halvern-warranty-desk
python test_build.py ../../out/halvern-warranty-desk/index.html ../packs/stafda-halvern.test.json
```

Needs Python 3, plus `pip install playwright` then `playwright install chromium` for the tests (54 checks). A new trade is a new pack (data, wording, test profile) plus a skin (colours, fonts, mark, photo). The code itself doesn't change.

**Service worker cache:** `warranty-claims-halvern-v1`. Bump it on every release with `--cache`.

## Known limits

- The brand is a draft and needs approval: name, colours, mark and sign-in copy.
- The tab icons reuse the Tessford square-ended set.
- Phones are 555 numbers, and distributor emails use `.example`.
- Dates are set for STAFDA (Nov 15–17, 2026). Refresh them for any later event.
