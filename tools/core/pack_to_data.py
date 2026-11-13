#!/usr/bin/env python3
"""pack_to_data.py - generalized Niche Pack -> solution data (synthetic-data.js / .json).

  python pack_to_data.py <pack.json> <out folder>

Generalized from pack_to_poc.py (Tessford/lighting). Everything trade-specific now comes
from the pack: spec fields (variant size/power/rating -> the solution's awg/tempRating/
voltageRating slots, labelled by ui.spec_labels), coverage wording, registration term
(policy.registered_term_years), severity per reason code, status labels, void reasons
and the "extra credit" line (labor allowance for lighting, freight credit for tools).
Output schema is unchanged, so the solution code runs as-is.
"""
import json, sys, os
from datetime import date, timedelta

STATUS_MAP = {"draft": "pending", "submitted": "pending", "under_review": "under_review", "info_requested": "info_requested",
              "ra_issued": "sample_requested", "received": "sample_requested", "approved": "approved",
              "credit_issued": "approved", "closed": "approved", "rejected": "rejected"}
d = lambda s: date.fromisoformat(s) if s else None
iso = lambda x: x.isoformat() if x else None
def nice(s):
    try: x = date.fromisoformat(s); return x.strftime("%a, %b ") + str(x.day)
    except Exception: return s
def add_years(x, n):
    try: return x.replace(year=x.year + n)
    except ValueError: return x.replace(year=x.year + n, day=28)

def build(pack):
    ui = pack.get("ui", {}); mfr = pack["manufacturer"]; short = mfr.get("short", mfr["name"].split()[0])
    desk = mfr.get("warranty_user", {"name": "Warranty Team"})
    subs = pack.get("distributors") or pack.get("contractors")
    sub = pack.get("submitter", {"tier_registered": "Registered Partner", "tier_standard": "Standard"})
    policies = {p["id"]: p for p in pack["warranty_policies"]}
    reasons = {r["code"]: r for r in pack["reason_codes"]}
    names = {c["id"]: c["name"] for c in subs}
    extra = ui.get("extra_credit_label", "labor allowance")
    out = {"manufacturer": {"name": mfr["name"], "tagline": mfr.get("tagline", "Warranty Desk"), "location": mfr.get("location", ""),
                            "phone": mfr.get("phone", "(555) 555-0100"), "certifications": mfr.get("badges", [])}}
    prods, price, pol_of = [], {}, {}
    for p in pack["products"]:
        pol = policies[p["policy"]]
        reg = pol.get("registered_term_years")
        terms = (f"{pol['term_years']}-yr ({p['policy']})" + (f", {reg} years if registered" if reg and reg > pol["term_years"] else "")
                 + f". Covers {pol['failure_definition']}. Remedy: {pol['coverage']}. Excludes: " + ", ".join(pol.get("exclusions", [])) + ".")
        for v in p["variants"]:
            prods.append({"partNumber": v["sku"], "name": p["name"].split(" ", 1)[1] if p["name"].startswith(short) else p["name"],
                          "category": p["category"], "description": f"{p['name']} — {v['size']}",
                          "awg": v["size"], "tempRating": v["power"], "voltageRating": v["rating"],
                          "certifications": p.get("certifications", []), "warrantyYears": pol["term_years"], "registeredYears": pol.get("registered_term_years", pol["term_years"]), "warrantyTerms": terms,
                          "applications": p.get("applications", []), "unitOfMeasure": p.get("uom", "ea"), "listPricePer1000ft": v["price"]})
            price[v["sku"]] = v["price"]; pol_of[v["sku"]] = pol
    out["products"] = prods
    out["distributors"] = [{"id": c["id"], "name": c["name"], "code": c["id"].split("-")[-1],
                            "tier": sub["tier_registered"] if c.get("registers_jobs") else sub["tier_standard"],
                            "region": c.get("segment", ""), "contactName": c.get("contact", "Warranty Contact"),
                            "contactEmail": c.get("email", f"warranty@{c['id'].lower()}.example"),
                            "contactPhone": c.get("phone", "(555) 555-01" + str(20 + i)), "city": c["city"],
                            "accountSince": c.get("since", "2018"), "annualVolume": c.get("volume", "(illustrative)")} for i, c in enumerate(subs)]
    orders, claims, regs = [], [], []
    def term(sku, registered): pol = pol_of[sku]; return pol.get("registered_term_years", pol["term_years"]) if registered else pol["term_years"]
    for i, c in enumerate(pack["claims"], 1):
        sku = c["sku"]; assert sku in price, f"{c['id']}: unknown SKU {sku}"
        inst = d(c.get("installed")); lot = c.get("serial", "—"); oid = f"ORD-{inst.year}-{1000 + i}"
        orders.append({"orderId": oid, "distributorId": c["contractor"], "date": iso(inst - timedelta(days=7)),
                       "items": [{"partNumber": sku, "quantity": max(c["qty"] * 4, c["qty"]), "unitPrice": price[sku], "lotNumber": lot}]})
        st = STATUS_MAP[c["status"]]; who = names[c["contractor"]]; reason = reasons[c["reason"]]; sub_d = d(c.get("submitted"))
        tl = [{"date": iso(sub_d), "event": f"Claim submitted by {who}", "by": who}]
        if c.get("missing"): tl.append({"date": iso(sub_d + timedelta(days=1)), "event": "Info requested: " + ", ".join(c["missing"]), "by": desk["name"]})
        if c.get("ra_issued"): tl.append({"date": c["ra_issued"], "event": f"RA issued {c.get('ra_number','')}".strip() + " — return the tool to a Halvern service center within 10 days".replace("Halvern", short), "by": desk["name"]})
        if c.get("advance_replacement_shipped"): tl.append({"date": c["advance_replacement_shipped"], "event": f"Advance replacement shipped — failed units due back {nice(c.get('return_due',''))}", "by": desk["name"]})
        if c.get("approved"): tl.append({"date": c["approved"], "event": "Approved — " + c.get("decision_note", "replacement authorized"), "by": desk["name"]})
        if c.get("credit_issued"): tl.append({"date": c["credit_issued"], "event": f"Credit memo {c['credit_memo']} issued — ${c['credit_total']:,.2f}", "by": desk["name"]})
        if st == "rejected": tl.append({"date": iso(sub_d + timedelta(days=3)), "event": "Denied — " + c["denial_reason"], "by": desk["name"]})
        res = None
        if st == "rejected": res = "Denied — " + c["denial_reason"]
        elif c.get("credit_issued"): res = f"Credit memo {c['credit_memo']}: parts ${c['parts_credit']:,.2f} + {extra} ${c.get('extra_credit',0):,.2f}"
        elif st == "approved": res = f"Approved — parts ${c['parts_credit']:,.2f}. " + c.get("decision_note", "")
        desc = c["description"] + (f" Evidence: {c['evidence']}." if c.get("evidence") else "")
        claims.append({"claimId": c["id"], "distributorId": c["contractor"], "orderId": oid, "partNumber": sku, "lotNumber": lot,
                       "quantityAffected": c["qty"], "status": st, "severity": c.get("severity") or reason.get("severity", "medium"),
                       "failureType": reason["label"], "description": desc, "environment": c.get("environment", c["site"]),
                       "installDate": c.get("installed"), "claimDate": iso(sub_d), "assignedTo": desk["name"], "resolution": res,
                       "creditAmount": (c.get("credit_total") or c.get("parts_credit")) if st == "approved" else None,
                       "sampleRequested": bool(c.get("ra_issued")), "sampleReceived": False, "sampleReceivedDate": None,
                       "resolvedDate": c.get("credit_issued") or (c.get("approved") if st == "approved" else None),
                       "timeline": tl, "claimSource": c.get("source", "Counter")})
        if c.get("registered"):
            regs.append({"registrationId": f"WR-{inst.year}-{len(regs)+1:04d}", "distributorId": c["contractor"], "orderId": oid, "partNumber": sku,
                         "lotNumber": lot, "quantityRegistered": c["qty"] * 4, "endCustomer": c["site"], "projectName": c.get("project", c["site"]),
                         "siteAddress": None, "installDate": c["installed"], "registrationDate": iso(inst + timedelta(days=5)),
                         "warrantyExpiry": iso(add_years(inst, term(sku, True))), "status": "active", "voidReason": None, "voidDate": None,
                         "environment": c.get("env_code", "dry_indoor"), "necCompliance": True, "installCompliance": True, "notes": "Registered."})
    for o in pack.get("demo_orders", []):
        items = []
        for it in o["items"]:
            sku = it["sku"]; assert sku in price, f"{o['id']}: unknown SKU {sku}"
            items.append({"partNumber": sku, "quantity": it["qty"], "unitPrice": price[sku], "lotNumber": it["date_code"]})
            r = it.get("registration")
            if r:
                inst = d(r["installed"]); voided = r.get("status") == "voided"
                regs.append({"registrationId": f"WR-{inst.year}-{len(regs)+1:04d}", "distributorId": o["contractor"], "orderId": o["id"],
                             "partNumber": sku, "lotNumber": it["date_code"], "quantityRegistered": it["qty"], "endCustomer": o["site"],
                             "projectName": o.get("project"), "siteAddress": o.get("address"), "installDate": r["installed"],
                             "registrationDate": iso(inst + timedelta(days=r.get("registered_after_days", 6))),
                             "warrantyExpiry": iso(add_years(inst, term(sku, True))), "status": "voided" if voided else "active",
                             "voidReason": r.get("void_reason") if voided else None, "voidDate": r.get("void_date") if voided else None,
                             **({"voidedBy": desk["name"]} if voided else {}), "environment": o.get("env_code", "dry_indoor"),
                             "necCompliance": True, "installCompliance": not voided, "notes": r.get("notes", "Registered.")})
        orders.append({"orderId": o["id"], "distributorId": o["contractor"], "date": o["date"], "items": items})
    out["orders"] = orders; out["claims"] = claims
    dom = mfr.get("domain", "example.com")
    out["qualityTeam"] = [{**t, "email": t.get("email") or f"{t['name'][0].lower()}{t['name'].split()[-1].lower()}@{dom}"} for t in pack.get("mfr_team", [])]
    lab = ui.get("status_labels", {})
    out["claimStatuses"] = {k: {"label": lab.get(k, v), "color": col, "icon": ic} for k, v, col, ic in [
        ("pending", "Submitted", "#D97706", "clock"), ("under_review", "Under Review", "#2563EB", "search"),
        ("sample_requested", "RA issued – return the tool", "#7C3AED", "package"), ("info_requested", "Needs receipt or label photo", "#EA580C", "help-circle"),
        ("approved", "Approved – credit / replacement", "#16A34A", "check-circle"), ("rejected", "Denied", "#DC2626", "x-circle")]}
    out["failureTypes"] = [r["label"] for r in pack["reason_codes"]]
    out["severityLevels"] = pack["severity_levels"]
    out["warrantyRegistrations"] = regs
    out["voidReasons"] = pack["void_reasons"]
    out["ui"] = {"specLabels": ui.get("spec_labels", ["Size", "Rating", "Voltage"]), "lookupPresets": ui.get("lookup_presets", []),
                 "itemWord": ui.get("item_word", "product"), "itemsWord": ui.get("items_word", "products"),
                 "catalogPrefix": ui.get("catalog_prefix", ""), "lookupHint": ui.get("lookup_hint", "Dashes and spaces don’t matter."),
                 "unitSearch": ui.get("unit_search", False)}
    return out

if __name__ == "__main__":
    pack = json.load(open(sys.argv[1], encoding="utf-8")); os.makedirs(sys.argv[2], exist_ok=True)
    data = build(pack); body = json.dumps(data, indent=2, ensure_ascii=False)
    open(os.path.join(sys.argv[2], "synthetic-data.js"), "w", encoding="utf-8").write(
        f"// {data['manufacturer']['name']} — Warranty Claims Synthetic Data ({pack['meta']['vertical']} › {pack['meta']['niche']})\n"
        "// Generated by pack_to_data.py. Loaded via <script> tag for file:// compatibility\n" f"const SYNTHETIC_DATA = {body};\n")
    open(os.path.join(sys.argv[2], "synthetic-data.json"), "w", encoding="utf-8").write(body)
    print(f"products={len(data['products'])} accounts={len(data['distributors'])} orders={len(data['orders'])} claims={len(data['claims'])} registrations={len(data['warrantyRegistrations'])}")
