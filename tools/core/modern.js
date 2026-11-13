

(function () {
  function isC() { return document.body.classList.contains('theme-classic'); }
  function h(s) { return esc(s == null ? '' : String(s)); }
  var lists = {}, seq = 0, pending = null;   // pending = rules to apply to the next table rendered
  var I = {
    claim: '<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    status: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    sev: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    money: '<path d="M12 2v20M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>',
    tag: '<path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    filter: '<path d="M4 4h16l-6 8v6l-4 2v-8z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    dl: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    home: '<path d="M3 11l9-8 9 8v10H3z"/><path d="M9 21v-6h6v6"/>',
    queue: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5"/><circle cx="17.5" cy="9" r="2.5"/><path d="M16.5 14.6c3 .3 5.5 2 5.5 5.4"/>'
  };
  var TFI = {"search": "<circle cx=\"10.5\" cy=\"10.5\" r=\"6\"/><path d=\"M15 15l5.5 5.5\"/>", "filter": "<path d=\"M3 4h18l-7 8v6l-4 2.5V12z\"/>", "dl": "<path d=\"M12 3v12M7 10l5 5 5-5M4 20h16\"/>", "plus": "<path d=\"M12 4v16M4 12h16\"/>", "claim": "<path d=\"M5 3h14v18l-2.5-1.8L14 21l-2-1.8L10 21l-2.5-1.8L5 21z\"/><path d=\"M9 8h6M9 12h6M9 16h3\"/>", "tag": "<path d=\"M9 4h12v16H9l-6-6v-4z\"/><path d=\"M6.5 12h.01M12 9h6M12 13h6M12 17h4\"/>", "box": "<path d=\"M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z\"/><path d=\"M3 7.5l9 4.5 9-4.5M12 12v9\"/>", "cal": "<path d=\"M9 3h6v5l3 3v3H6v-3l3-3z\"/><path d=\"M4 18h16M7 21h10\"/>", "money": "<rect x=\"3\" y=\"6\" width=\"18\" height=\"12\"/><path d=\"M7 10h4M7 14h7M16 10.5v3\"/>"};
  function ico(n, s) { if (TFI[n] && !document.body.classList.contains('cd-mfg')) return '<svg class="mt-i" viewBox="0 0 24 24" width="' + (s || 16) + '" height="' + (s || 16) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">' + TFI[n] + '</svg>'; return ico0(n, s); }
  function ico0(n, s) { return '<svg class="mt-i" viewBox="0 0 24 24" width="' + (s || 16) + '" height="' + (s || 16) + '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + I[n] + '</svg>'; }
  function fam(pn) { return String(pn || '').split('-').slice(0, 2).join('-'); }

  
  function slaText(c) { try { return getSlaInfo(c).text; } catch (e) { return ''; } }
  var DEF = {
    mfg: {
      view: 'All Claims', noun: 'Claim',
      cols: [
        ['Claim', 'claim', function (c) { var p = getProd(c.partNumber); return '<a class="mt-link">' + h(c.claimId) + '</a><div class="mt-sub">' + h(p ? p.name : c.partNumber) + '</div>'; }, 'claimId'],
        ['Contractor', 'user', function (c) { var d = getDist(c.distributorId); return h(d ? d.name : c.distributorId); }, null],
        ['Status', 'status', function (c) { return '<span class="status-chip status-' + c.status + '">' + statusLabel(c.status) + '</span>'; }, null],
        ['Severity', 'sev', function (c) { return '<span class="severity-text sev-' + c.severity + '">' + sevLabel(c.severity) + '</span>'; }, null],
        ['SLA', 'clock', function (c) { var s = getSlaInfo(c); return '<span class="sla-pill ' + s.cls + '">' + s.text + '</span>'; }, null],
        ['Claim date', 'cal', function (c) { return fmtDate(c.claimDate); }, 'claimDate'],
        ['Credit', 'money', function (c) { return c.creditAmount ? fmtCur(c.creditAmount) : '<span class="mt-muted">—</span>'; }, 'creditAmount']
      ],
      fields: {
        'Status': function (c) { return statusLabel(c.status); },
        'Severity': function (c) { return sevLabel(c.severity); },
        'Contractor': function (c) { var d = getDist(c.distributorId); return d ? d.name : c.distributorId; },
        'Failure type': function (c) { return c.failureType; },
        'Product family': function (c) { return fam(c.partNumber); },
        'SLA': slaText
      },
      colField: { Contractor: 'Contractor', Status: 'Status', Severity: 'Severity', SLA: 'SLA', Claim: 'Product family' }
    },
    dist: {
      view: 'My Claims', noun: 'Claim',
      cols: [
        ['Claim', 'claim', function (c) { var p = getProd(c.partNumber); return '<a class="mt-link">' + h(c.claimId) + '</a><div class="mt-sub">' + h(p ? p.name : c.partNumber) + '</div>'; }, 'claimId'],
        ['Failure type', 'tag', function (c) { return h(c.failureType); }, null],
        ['Status', 'status', function (c) { return '<span class="status-chip status-' + c.status + '">' + statusLabel(c.status) + '</span>'; }, null],
        ['Severity', 'sev', function (c) { return '<span class="severity-text sev-' + c.severity + '">' + sevLabel(c.severity) + '</span>'; }, null],
        ['Claim date', 'cal', function (c) { return fmtDate(c.claimDate); }, 'claimDate'],
        ['Credit', 'money', function (c) { return c.creditAmount ? fmtCur(c.creditAmount) : '<span class="mt-muted">—</span>'; }, 'creditAmount']
      ],
      fields: {
        'Status': function (c) { return statusLabel(c.status); },
        'Severity': function (c) { return sevLabel(c.severity); },
        'Failure type': function (c) { return c.failureType; },
        'Product family': function (c) { return fam(c.partNumber); }
      },
      colField: { Status: 'Status', Severity: 'Severity', 'Failure type': 'Failure type', Claim: 'Product family' }
    },
    reg: {
      view: 'Registrations', noun: 'Registration',
      cols: [
        ['Registration', 'claim', function (r) { return '<a class="mt-link">' + h(r.registrationId) + '</a><div class="mt-sub">' + h(r.projectName || '') + '</div>'; }, 'registrationId'],
        ['Customer', 'user', function (r) { return h(r.endCustomer); }, null],
        ['Product', 'box', function (r) { var p = getProd(r.partNumber); return h(p ? p.name : r.partNumber) + '<div class="mt-sub mt-mono">' + h(r.partNumber) + ' · ' + h(r.lotNumber) + '</div>'; }, null],
        ['Qty (ea)', 'tag', function (r) { return h(r.quantityRegistered); }, 'quantityRegistered'],
        ['Warranty', 'status', function (r) { var w = getWarrantyStatus(r); return '<span class="status-chip ' + w.cls + '">' + w.label + '</span>'; }, null],
        ['Installed', 'cal', function (r) { return fmtDate(r.installDate); }, 'installDate'],
        ['Expires', 'clock', function (r) { return fmtDate(r.warrantyExpiry); }, 'warrantyExpiry']
      ],
      fields: {
        'Warranty': function (r) { return getWarrantyStatus(r).label; },
        'Customer': function (r) { return r.endCustomer; },
        'Product family': function (r) { return fam(r.partNumber); }
      },
      colField: { Warranty: 'Warranty', Customer: 'Customer', Product: 'Product family' }
    }
  };
  function keyOf(x) { return x.claimId || x.registrationId; }
  function valuesFor(L, field) {
    var f = DEF[L.kind].fields[field], seen = {};
    L.items.forEach(function (x) { var v = f(x); if (v != null && v !== '') seen[v] = 1; });
    return Object.keys(seen).sort();
  }
  function passes(L, x) {
    var q = L.q.toLowerCase().trim();
    if (q) {
      var txt = DEF[L.kind].cols.map(function (c) { return c[2](x).replace(/<[^>]+>/g, ' '); }).join(' ') + ' ' + (x.partNumber || '') + ' ' + (x.lotNumber || '');
      if (txt.toLowerCase().indexOf(q) < 0) return false;
    }
    return L.rules.every(function (r) {
      if (!r.values.length) return true;
      var v = DEF[L.kind].fields[r.field](x), hit = r.values.indexOf(v) >= 0;
      return r.op === 'not' ? !hit : hit;
    });
  }
  function visible(L) {
    var rows = L.items.filter(function (x) { return passes(L, x); });
    var k = L.sortKey, d = L.sortDir;
    rows.sort(function (a, b) { var A = a[k], B = b[k]; if (A == null) A = ''; if (B == null) B = '';
      return (typeof A === 'number' && typeof B === 'number' ? A - B : String(A).localeCompare(String(B))) * d; });
    return rows;
  }

  
  function shell(id) {
    var L = lists[id], D = DEF[L.kind], isDist = currentUser && currentUser.role === 'distributor';
    var act = L.kind === 'reg' ? (isDist ? '<button type="button" class="mt-btn" onclick="showRegForm()">' + ico('plus') + 'Register a job</button>' : '')
            : (isDist ? '<button type="button" class="mt-btn" onclick="switchDistTab(\'newclaim\')">' + ico('plus') + 'File a claim</button>' : '');
    return '<div class="mt-wrap" id="' + id + '">' +
      (L.showView ? '<div class="mt-views"><span class="mt-view active">' + D.view + '</span></div>' : '') +
      '<div class="mt-card"><div class="mt-toolbar">' +
        '<label class="mt-search">' + ico('search') + '<input type="text" placeholder="Search" aria-label="Search" oninput="__mt.search(\'' + id + '\',this.value)"></label>' +
        '<div class="mt-fwrap"><button type="button" class="mt-fbtn" onclick="__mt.toggleFilters(\'' + id + '\')">' + ico('filter') + '<span class="mt-fcount">Filter</span></button><div class="mt-pop" hidden></div></div>' +
        '<span class="mt-sel" hidden></span>' +
        '<div class="mt-right"><button type="button" class="mt-btn" onclick="__mt.exportCsv(\'' + id + '\')">' + ico('dl') + '<span class="mt-exl">Export</span></button>' + act + '</div>' +
      '</div><div class="mt-scroll"><table class="mt-table"><thead></thead><tbody></tbody></table></div><div class="mt-empty" hidden></div></div></div>';
  }
  function paint(id) {
    var el = document.getElementById(id); if (!el) return;
    var L = lists[id], D = DEF[L.kind], rows = visible(L);
    var allSel = rows.length && rows.every(function (x) { return L.sel[keyOf(x)]; });
    el.querySelector('thead').innerHTML = '<tr><th class="mt-cb"><input type="checkbox" aria-label="Select all"' + (allSel ? ' checked' : '') + ' onchange="__mt.selAll(\'' + id + '\',this.checked)"></th>' +
      D.cols.map(function (c, i) {
        var f = D.colField[c[0]], sorted = L.sortKey === c[3];
        return '<th><div class="mt-th"><button type="button" class="mt-thb" ' + (c[3] ? 'onclick="__mt.sort(\'' + id + '\',' + i + ')"' : 'disabled') + '>' + ico(c[1]) + '<span>' + c[0] + (i === 0 ? ' <span class="mt-n">(' + rows.length + ')</span>' : '') + '</span>' + (sorted ? '<span class="mt-arrow">' + (L.sortDir > 0 ? '↑' : '↓') + '</span>' : '') + '</button>' +
          (f ? '<button type="button" class="mt-colf' + (L.rules.some(function (r) { return r.field === f && r.values.length; }) ? ' on' : '') + '" aria-label="Filter by ' + f + '" onclick="__mt.colFilter(\'' + id + '\',\'' + f + '\')">' + ico('filter', 14) + '</button>' : '') + '</div></th>';
      }).join('') + '</tr>';
    el.querySelector('tbody').innerHTML = rows.map(function (x) {
      var k = keyOf(x);
      return '<tr class="' + (L.sel[k] ? 'mt-on' : '') + '" onclick="' + L.handler + '(\'' + k + '\')"><td class="mt-cb" onclick="event.stopPropagation()"><input type="checkbox" aria-label="Select ' + k + '"' + (L.sel[k] ? ' checked' : '') + ' onchange="__mt.sel(\'' + id + '\',\'' + k + '\',this.checked)"></td>' +
        D.cols.map(function (c) { return '<td data-label="' + c[0] + '">' + c[2](x) + '</td>'; }).join('') + '</tr>';
    }).join('');
    var em = el.querySelector('.mt-empty');
    em.hidden = rows.length > 0;
    em.innerHTML = 'No ' + D.noun.toLowerCase() + 's match these filters. <button type="button" class="mt-linkbtn" onclick="__mt.clear(\'' + id + '\')">Clear filters</button>';
    var n = L.rules.filter(function (r) { return r.values.length; }).length;
    var fb = el.querySelector('.mt-fbtn'); fb.classList.toggle('on', n > 0);
    el.querySelector('.mt-fcount').textContent = n ? n + (n === 1 ? ' Filter' : ' Filters') : 'Filter';
    var selN = Object.keys(L.sel).length, sl = el.querySelector('.mt-sel');
    sl.hidden = !selN; sl.innerHTML = selN + ' selected · <button type="button" class="mt-linkbtn" onclick="__mt.exportCsv(\'' + id + '\',true)">Export selected</button> · <button type="button" class="mt-linkbtn" onclick="__mt.selAll(\'' + id + '\',false)">Clear</button>';
    var pop = el.querySelector('.mt-pop'); if (!pop.hidden) paintPop(id);
  }
  function paintPop(id) {
    var el = document.getElementById(id), L = lists[id], D = DEF[L.kind], pop = el.querySelector('.mt-pop');
    var fields = Object.keys(D.fields);
    pop.innerHTML = (L.rules.length ? L.rules.map(function (r, i) {
      var vals = valuesFor(L, r.field);
      return (i ? '<div class="mt-and"><span>AND</span></div>' : '') +
        '<div class="mt-rule"><select aria-label="Field" onchange="__mt.setField(\'' + id + '\',' + i + ',this.value)">' +
        fields.map(function (f) { return '<option' + (f === r.field ? ' selected' : '') + '>' + f + '</option>'; }).join('') + '</select>' +
        '<select aria-label="Operator" onchange="__mt.setOp(\'' + id + '\',' + i + ',this.value)"><option value="in"' + (r.op !== 'not' ? ' selected' : '') + '>is one of</option><option value="not"' + (r.op === 'not' ? ' selected' : '') + '>is not one of</option></select>' +
        '<button type="button" class="mt-x" aria-label="Remove filter" onclick="__mt.rm(\'' + id + '\',' + i + ')">' + ico('x', 14) + '</button>' +
        '<div class="mt-vals">' + vals.map(function (v) { var on = r.values.indexOf(v) >= 0;
          return '<button type="button" class="mt-val' + (on ? ' on' : '') + '" onclick="__mt.tog(\'' + id + '\',' + i + ',this.getAttribute(\'data-v\'))" data-v="' + h(v) + '">' + h(v) + '</button>'; }).join('') + '</div></div>';
    }).join('') : '<div class="mt-hint">No filters yet. Narrow the list by status, severity, contractor and more.</div>') +
      '<div class="mt-popf"><button type="button" class="mt-add" onclick="__mt.add(\'' + id + '\')">' + ico('plus', 14) + 'Add filter</button>' +
      (L.rules.length ? '<button type="button" class="mt-linkbtn" onclick="__mt.clear(\'' + id + '\')">Clear all</button>' : '') + '</div>';
  }
  function table(items, handler, kind, showView) {
    var id = 'mt' + (++seq);
    var dk = kind === 'reg' ? 'installDate' : 'claimDate';
    lists[id] = { items: items, handler: handler, kind: kind, rules: pending ? pending.slice() : [], q: '', sel: {}, sortKey: dk, sortDir: -1, showView: showView };
    pending = null;
    setTimeout(function () { paint(id); }, 0);
    return shell(id);
  }
  function L_(id) { return lists[id]; }
  var api = window.__mt = {
    search: function (id, v) { L_(id).q = v || ''; paint(id); },
    sort: function (id, i) { var L = L_(id), k = DEF[L.kind].cols[i][3]; if (L.sortKey === k) L.sortDir *= -1; else { L.sortKey = k; L.sortDir = -1; } paint(id); },
    toggleFilters: function (id) {
      var el = document.getElementById(id), pop = el.querySelector('.mt-pop'); pop.hidden = !pop.hidden;
      if (!pop.hidden) { if (!L_(id).rules.length) api.add(id, true); paintPop(id); }
    },
    colFilter: function (id, field) {
      var L = L_(id); if (!L.rules.some(function (r) { return r.field === field; })) L.rules.push({ field: field, op: 'in', values: [] });
      var pop = document.getElementById(id).querySelector('.mt-pop'); pop.hidden = false; paint(id); paintPop(id);
    },
    add: function (id, silent) { var L = L_(id), used = L.rules.map(function (r) { return r.field; });
      var f = Object.keys(DEF[L.kind].fields).find(function (x) { return used.indexOf(x) < 0; }) || Object.keys(DEF[L.kind].fields)[0];
      L.rules.push({ field: f, op: 'in', values: [] }); if (!silent) paintPop(id); },
    rm: function (id, i) { L_(id).rules.splice(i, 1); paint(id); paintPop(id); },
    setField: function (id, i, f) { var r = L_(id).rules[i]; r.field = f; r.values = []; paint(id); paintPop(id); },
    setOp: function (id, i, op) { L_(id).rules[i].op = op; paint(id); },
    tog: function (id, i, v) { var r = L_(id).rules[i], k = r.values.indexOf(v); if (k >= 0) r.values.splice(k, 1); else r.values.push(v); paint(id); paintPop(id); },
    clear: function (id) { var L = L_(id); L.rules = []; L.q = ''; var s = document.querySelector('#' + id + ' .mt-search input'); if (s) s.value = ''; paint(id); var p = document.querySelector('#' + id + ' .mt-pop'); if (p && !p.hidden) paintPop(id); },
    sel: function (id, k, on) { var L = L_(id); if (on) L.sel[k] = 1; else delete L.sel[k]; paint(id); },
    selAll: function (id, on) { var L = L_(id); L.sel = {}; if (on) visible(L).forEach(function (x) { L.sel[keyOf(x)] = 1; }); paint(id); },
    exportCsv: function (id, onlySel) {
      var L = L_(id), D = DEF[L.kind], rows = visible(L).filter(function (x) { return !onlySel || L.sel[keyOf(x)]; });
      var q = function (v) { v = v == null ? '' : String(v).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      var lines = [['ID'].concat(D.cols.map(function (c) { return c[0]; })).join(',')];
      rows.forEach(function (x) { lines.push([keyOf(x)].concat(D.cols.map(function (c) { return q(c[2](x)); })).join(',')); });
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/csv' }));
      a.download = (L.kind === 'reg' ? 'registrations' : 'warranty-claims') + '.csv'; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); showToast('Exported ' + rows.length + ' rows');
    },
    
    queueFor: function (contractorName) {
      pending = [{ field: 'Contractor', op: 'in', values: [contractorName] }];
      if (typeof filterQueue === 'function' && currentMfgTab === 'queue' && document.getElementById('queueListWrap')) filterQueue('all'); else switchMfgTab('queue');
    }
  };
  document.addEventListener('click', function (e) {   // close filter popovers on outside click
    document.querySelectorAll('.mt-pop:not([hidden])').forEach(function (p) { if (!p.parentNode.contains(e.target)) p.hidden = true; });
  });

  
  window.isClassic = function () { return true; };       // both views take the table/list branch; each theme picks its renderer
  var pM = window.claimTableMfg, pD = window.claimTableDist, pR = window.regTableDist;
  window.claimTableMfg = function (c, hnd) { return isC() ? pM(c, hnd) : table(c, hnd, 'mfg', !document.getElementById('queueFilters')); };
  window.claimTableDist = function (c, hnd) { return isC() ? pD(c, hnd) : table(c, hnd, 'dist', false); };
  window.regTableDist = function (r, hnd) { return isC() ? pR(r, hnd) : table(r, hnd, 'reg', false); };

  
  function stats(d) {
    var cl = getAllClaims().filter(function (c) { return c.distributorId === d.id; });
    var regs = getAllRegistrations().filter(function (r) { return r.distributorId === d.id; });
    var credit = cl.reduce(function (s, c) { return s + (c.status === 'approved' && c.creditAmount ? c.creditAmount : 0); }, 0);
    var last = cl.map(function (c) { return c.claimDate; }).sort().pop();
    var breach = cl.filter(function (c) { try { return /breach/i.test(getSlaInfo(c).text); } catch (e) { return false; } }).length;
    return { claims: cl.length, open: cl.filter(function (c) { return c.status !== 'approved' && c.status !== 'rejected'; }).length,
      regs: regs.length, active: regs.filter(function (r) { var w = getWarrantyStatus(r).status; return w === 'active' || w === 'expiring_soon'; }).length,
      credit: credit, last: last, breach: breach };
  }
  window.showContractorDirectory = function () {
    if (!currentUser || currentUser.role !== 'manufacturer') return;
    document.querySelectorAll('#mfgTabs button').forEach(function (b) { b.classList.remove('active'); });
    var rail = document.querySelector('#mfgTabs button[data-tab="contractors"]'); if (rail) rail.classList.add('active');
    var ds = DATA.distributors.map(function (d) { return { d: d, s: stats(d) }; });
    var tot = ds.reduce(function (a, x) { a.c += x.s.claims; a.o += x.s.open; a.r += x.s.active; a.cr += x.s.credit; return a; }, { c: 0, o: 0, r: 0, cr: 0 });
    var mc = document.getElementById('mainContent');
    mc.innerHTML = '<div class="dir-head"><div><div class="section-label" style="padding:0">Contractor accounts</div><h2 class="dir-title">All contractors</h2>' +
      '<p class="dir-p">Installers who buy ' + h(DATA.manufacturer.name.split(' ')[0]) + ' fixtures and file warranty claims. Open one to see its claims, or view the portal as that contractor.</p></div></div>' +
      '<div class="stat-row">' + tile(ds.length, 'Contractors', 'var(--chart-1)') + tile(tot.o, 'Open claims', 'var(--chart-4)') + tile(tot.r, 'Active registrations', 'var(--chart-2)') + tile(fmtCur(tot.cr).replace('.00', ''), 'Credits issued', 'var(--chart-5)') + '</div>' +
      '<div class="mt-wrap"><div class="mt-card"><div class="mt-scroll"><table class="mt-table dir-table"><thead><tr>' +
      '<th><div class="mt-th"><span class="mt-thb">' + ico('people') + '<span>Contractor <span class="mt-n">(' + ds.length + ')</span></span></span></div></th>' +
      '<th><div class="mt-th"><span class="mt-thb">' + ico('tag') + '<span>Tier</span></span></div></th>' +
      '<th><div class="mt-th"><span class="mt-thb">' + ico('claim') + '<span>Claims · open</span></span></div></th>' +
      '<th><div class="mt-th"><span class="mt-thb">' + ico('clock') + '<span>SLA breached</span></span></div></th>' +
      '<th><div class="mt-th"><span class="mt-thb">' + ico('box') + '<span>Registrations</span></span></div></th>' +
      '<th><div class="mt-th"><span class="mt-thb">' + ico('money') + '<span>Credits</span></span></div></th>' +
      '<th><div class="mt-th"><span class="mt-thb">' + ico('cal') + '<span>Last claim</span></span></div></th>' +
      '<th><div class="mt-th"><span class="mt-thb"><span>Actions</span></span></div></th></tr></thead><tbody>' +
      ds.map(function (x) {
        var d = x.d, s = x.s, reg = /registered/i.test(d.tier);
        return '<tr onclick="__mt.queueFor(\'' + h(d.name).replace(/'/g, "\\'") + '\')">' +
          '<td data-label="Contractor"><a class="mt-link">' + h(d.name) + '</a><div class="mt-sub">' + h(d.contactName) + ' · ' + h(d.contactPhone) + '</div></td>' +
          '<td data-label="Tier"><span class="status-chip ' + (reg ? 'status-approved' : 'mt-tier') + '">' + h(d.tier) + '</span></td>' +
          '<td data-label="Claims · open">' + s.claims + ' <span class="mt-muted">· ' + s.open + ' open</span></td>' +
          '<td data-label="SLA breached">' + (s.breach ? '<span class="sla-pill sla-breach">' + s.breach + '</span>' : '<span class="mt-muted">0</span>') + '</td>' +
          '<td data-label="Registrations">' + s.active + ' <span class="mt-muted">active of ' + s.regs + '</span></td>' +
          '<td data-label="Credits">' + (s.credit ? fmtCur(s.credit) : '<span class="mt-muted">—</span>') + '</td>' +
          '<td data-label="Last claim">' + (s.last ? fmtDate(s.last) : '<span class="mt-muted">—</span>') + '</td>' +
          '<td data-label="Actions" onclick="event.stopPropagation()"><div class="dir-acts">' +
          '<button type="button" class="btn btn-outlined dir-btn" onclick="__mt.queueFor(\'' + h(d.name).replace(/'/g, "\\'") + '\')">Claims</button>' +
          '<button type="button" class="btn btn-primary dir-btn" onclick="__cdViewAs(\'' + d.id + '\')">View as</button></div></td></tr>';
      }).join('') + '</tbody></table></div></div></div>';
    mc.scrollTop = 0;
  };
  window.__cdViewAs = function (distId) { handleLogin('distributor', distId); showToast('Contractor view: ' + (getDist(distId) || {}).name); };

  
  function accountPicker(anchor) {
    var old = document.querySelector('.acct-pop'); if (old) { old.remove(); return; }
    var pop = document.createElement('div'); pop.className = 'acct-pop';
    pop.innerHTML = '<div class="acct-h">Switch contractor account</div>' + DATA.distributors.map(function (d) {
      return '<button type="button" class="acct-i' + (currentUser.distId === d.id ? ' on' : '') + '" data-id="' + d.id + '"><b>' + h(d.name) + '</b><span>' + h(d.tier) + ' · ' + h(d.city || '') + '</span></button>';
    }).join('');
    pop.addEventListener('click', function (e) { var b = e.target.closest('.acct-i'); if (!b) return; pop.remove();
      if (b.getAttribute('data-id') !== currentUser.distId) window.__cdViewAs(b.getAttribute('data-id')); });
    document.body.appendChild(pop);
    var r = anchor.getBoundingClientRect(); pop.style.top = (r.bottom + 6) + 'px'; pop.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
    setTimeout(function () { document.addEventListener('click', function off(e) { if (!pop.contains(e.target) && e.target !== anchor) { pop.remove(); document.removeEventListener('click', off); } }); }, 0);
  }
  window.__cdHintAction = function (role, btn) { if (role === 'manufacturer') window.showContractorDirectory(); else accountPicker(btn); };

  
  var tabs = document.getElementById('mfgTabs');
  if (tabs && !tabs.querySelector('[data-tab="contractors"]')) {
    var map = { dashboard: 'home', queue: 'queue', analytics: 'chart' };
    tabs.querySelectorAll('button[data-tab]').forEach(function (b) { var n = map[b.getAttribute('data-tab')]; if (n) b.innerHTML = ico(n, 20) + '<span>' + b.textContent + '</span>'; });
    var cb = document.createElement('button'); cb.setAttribute('data-tab', 'contractors'); cb.type = 'button';
    cb.innerHTML = ico('people', 20) + '<span>Contractors</span>'; cb.onclick = function () { window.showContractorDirectory(); };
    tabs.appendChild(cb);
  }
  
  var oA = window.renderMfgAnalytics;
  if (typeof oA === 'function') window.renderMfgAnalytics = function (el) {
    var r = oA.apply(this, arguments);
    try {
      var cards = Array.prototype.slice.call(el.querySelectorAll(':scope > .analytics-card'));
      if (cards.length) { var g = document.createElement('div'); g.className = 'an-grid'; el.insertBefore(g, cards[0]); cards.forEach(function (c) { g.appendChild(c); }); }
    } catch (e) { console.error('analytics grid', e); }
    return r;
  };

  function roleClass() { document.body.classList.toggle('cd-mfg', !!(currentUser && currentUser.role === 'manufacturer')); }
  ['handleLogin', 'signOut'].forEach(function (n) { var o = window[n]; if (typeof o !== 'function') return;
    window[n] = function () { var r = o.apply(this, arguments); roleClass(); return r; }; });
})();

