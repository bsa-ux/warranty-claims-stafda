

(function () {
  function isC() { return document.body.classList.contains('theme-classic'); }
  var archived = {};            // claimId/regId -> true (demo only, in memory)
  var showArchived = false;
  var sortDesc = true;
  var lists = {};               // listId -> {items, handler, kind}
  var seq = 0;

  function h(s) { return esc(s == null ? '' : String(s)); }
  function raNumber(c) {
    var m = (c.timeline || []).map(function (t) { return t.event; }).join(' ').match(/RA-[A-Z]+-\d+/);
    return m ? m[0] : null;
  }
  function regFor(c) {
    return getAllRegistrations().find(function (r) { return r.lotNumber === c.lotNumber && r.distributorId === c.distributorId; }) || null;
  }
  var CHEV = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>';
  var SORT = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>';

  
  function toolbar(id, kind) {
    var isDist = currentUser && currentUser.role === 'distributor';
    var newBtn = (kind !== 'reg' && isDist) ? '<button type="button" class="rl-btn" onclick="switchDistTab(\'newclaim\')">File a claim</button>'
               : (kind === 'reg' && isDist) ? '<button type="button" class="rl-btn" onclick="showRegForm()">Register a job</button>' : '';
    return '<div class="rl-toolbar">' +
      '<button type="button" class="rl-btn" onclick="__rl.sort(\'' + id + '\')">' + SORT + '<span>' + (kind === 'reg' ? 'Install Date' : 'Date Created') + (sortDesc ? ' ↓' : ' ↑') + '</span></button>' +
      '<button type="button" class="rl-btn" onclick="__rl.exportDlg(\'' + id + '\')">Options</button>' + newBtn +
      '<div class="rl-search"><input type="text" placeholder="Wild Card Search" aria-label="Wild card search" oninput="__rl.search(\'' + id + '\',this.value)"><button type="button" aria-label="Clear search" onclick="var i=this.previousSibling;i.value=\'\';__rl.search(\'' + id + '\',\'\')">X</button></div>' +
      '</div>';
  }
  function rowHtml(kind, x, handler) {
    var key, d, name, sub, mid, midSub, right, rightSub, search;
    if (kind === 'reg') {
      var ws = getWarrantyStatus(x), p = getProd(x.partNumber);
      key = x.registrationId; d = x.installDate;
      name = h(x.endCustomer) + ' - ' + h(x.registrationId); sub = h(x.partNumber);
      mid = '<span class="status-chip ' + ws.cls + '">' + ws.label + '</span>'; midSub = 'Date code ' + h(x.lotNumber);
      right = fmtDate(x.installDate); rightSub = 'Expires ' + fmtDate(x.warrantyExpiry);
      search = [x.registrationId, x.endCustomer, x.partNumber, p && p.name, x.lotNumber, ws.label].join(' ');
    } else {
      var dist = getDist(x.distributorId), prod = getProd(x.partNumber), ra = raNumber(x), sla = getSlaInfo(x);
      key = x.claimId; d = x.claimDate;
      name = kind === 'mfg' ? h(dist ? dist.name : x.distributorId) + ' - ' + h(x.claimId) : h(x.claimId) + ' - ' + h(prod ? prod.name : x.partNumber);
      sub = h(x.partNumber) + ' · ' + h(x.failureType);
      mid = '<span class="status-chip status-' + x.status + '">' + statusLabel(x.status) + '</span>';
      midSub = ra ? 'RA # ' + ra : 'Date code ' + h(x.lotNumber);
      right = fmtDate(x.claimDate);
      rightSub = kind === 'mfg' ? '<span class="sla-pill ' + sla.cls + '">' + sla.text + '</span>' : (x.creditAmount ? 'Credit ' + fmtCur(x.creditAmount) : '<span class="severity-text sev-' + x.severity + '">' + sevLabel(x.severity) + '</span>');
      search = [x.claimId, dist && dist.name, x.partNumber, prod && prod.name, x.failureType, statusLabel(x.status), x.lotNumber, ra].join(' ');
    }
    var arch = !!archived[key];
    return '<div class="rl-row' + (arch ? ' rl-archived' : '') + '" data-date="' + d + '" data-search="' + h(String(search).toLowerCase()) + '" onclick="' + handler + '(\'' + key + '\')" tabindex="0">' +
      '<div class="rl-c1"><div class="rl-name">' + name + '</div><div class="rl-sub">' + sub + '</div></div>' +
      '<div class="rl-c2"><div>' + mid + '</div><div class="rl-sub">' + midSub + '</div></div>' +
      '<div class="rl-c3"><div>' + right + '</div><div class="rl-sub">' + rightSub + '</div></div>' +
      '<label class="rl-arch" onclick="event.stopPropagation()">Archive<input type="checkbox"' + (arch ? ' checked' : '') + ' onchange="__rl.archive(\'' + key + '\',this)"></label>' +
      '<span class="rl-chev">' + CHEV + '</span></div>';
  }
  function body(id) {
    var L = lists[id], k = L.kind, dateKey = k === 'reg' ? 'installDate' : 'claimDate';
    var items = L.items.slice().sort(function (a, b) { return sortDesc ? String(b[dateKey]).localeCompare(a[dateKey]) : String(a[dateKey]).localeCompare(b[dateKey]); });
    var vis = items.filter(function (x) { return showArchived || !archived[x.claimId || x.registrationId]; });
    var html = '<div class="rl-results"><span class="rl-count">Showing ' + vis.length + ' Result' + (vis.length === 1 ? '' : 's') + '</span>' +
      '<button type="button" class="rl-showall" onclick="__rl.toggleArchived(\'' + id + '\')">' + (showArchived ? 'Hide Archived' : 'Show All') + '</button></div>';
    var last = null;
    vis.forEach(function (x) {
      var dt = x[dateKey];
      if (dt !== last) { html += '<div class="rl-date">' + fmtDate(dt) + '</div>'; last = dt; }
      html += rowHtml(k, x, L.handler);
    });
    if (!vis.length) html += '<div class="rl-empty">No records.</div>';
    return html;
  }
  function legacyList(items, handler, kind) {
    var id = 'rl' + (++seq);
    lists[id] = { items: items, handler: handler, kind: kind };
    return '<div class="rl-wrap" id="' + id + '">' + toolbar(id, kind) + '<div class="rl-list">' + body(id) + '</div></div>';
  }
  function rerender(id) {
    var el = document.getElementById(id); if (!el) return;
    el.querySelector('.rl-list').innerHTML = body(id);
    var q = el.querySelector('.rl-search input'); if (q && q.value) api.search(id, q.value);
    var sb = el.querySelector('.rl-toolbar .rl-btn span'); if (sb) sb.textContent = (lists[id].kind === 'reg' ? 'Install Date' : 'Date Created') + (sortDesc ? ' ↓' : ' ↑');
  }

  var api = window.__rl = {
    sort: function (id) { sortDesc = !sortDesc; rerender(id); },
    toggleArchived: function (id) { showArchived = !showArchived; rerender(id); },
    archive: function (key, cb) { if (cb.checked) archived[key] = true; else delete archived[key];
      var row = cb.closest('.rl-row'); if (row) row.classList.toggle('rl-archived', cb.checked);
      showToast(cb.checked ? key + ' archived (demo only)' : key + ' restored'); },
    search: function (id, q) {
      var el = document.getElementById(id); if (!el) return; q = (q || '').toLowerCase().trim();
      var rows = el.querySelectorAll('.rl-row'), n = 0;
      rows.forEach(function (r) { var ok = !q || r.getAttribute('data-search').indexOf(q) >= 0; r.style.display = ok ? '' : 'none'; if (ok) n++; });
      el.querySelectorAll('.rl-date').forEach(function (d) {
        var s = d.nextElementSibling, any = false;
        while (s && !s.classList.contains('rl-date')) { if (s.classList.contains('rl-row') && s.style.display !== 'none') any = true; s = s.nextElementSibling; }
        d.style.display = any ? '' : 'none';
      });
      var c = el.querySelector('.rl-count'); if (c) c.textContent = 'Showing ' + n + ' Result' + (n === 1 ? '' : 's');
    },
    
    exportDlg: function (id) {
      var L = lists[id]; if (!L) return;
      var F = L.kind === 'reg'
        ? ['Registration ID', 'Customer', 'Project', 'SKU', 'Product', 'Date Code', 'Qty Registered', 'Warranty Status', 'Install Date', 'Expires']
        : ['Claim ID', 'Status', 'Contractor', 'SKU', 'Product', 'Date Code', 'Qty (ea)', 'Failure Type', 'Severity', 'Claim Date', 'Assigned To', 'RA #', 'Credit'];
      var chosen = L.kind === 'reg' ? F.slice(0, 5) : ['Claim ID', 'Status', 'SKU', 'Contractor', 'Assigned To', 'Credit'];
      var ov = document.createElement('div'); ov.className = 'rl-modal-ov';
      function paint() {
        ov.innerHTML = '<div class="rl-modal" role="dialog" aria-label="Specify field order for export">' +
          '<div class="rl-modal-h">Specify Field Order for Export</div>' +
          '<p class="rl-modal-p">Select and move the fields to be exported. To group data, tick "Group by" first.</p>' +
          '<div class="rl-modal-g"><div><div class="rl-modal-l">Available fields</div><select multiple size="10" class="rl-avail">' +
          F.filter(function (f) { return chosen.indexOf(f) < 0; }).map(function (f) { return '<option>' + f + '</option>'; }).join('') + '</select></div>' +
          '<div class="rl-modal-mid"><button type="button" class="rl-mbtn" data-a="move">Move</button><button type="button" class="rl-mbtn" data-a="all">Move All</button><button type="button" class="rl-mbtn" data-a="clear">Clear All</button></div>' +
          '<div><div class="rl-modal-l">Group by</div><label class="rl-grp"><input type="checkbox" class="rl-groupby"> ' + (L.kind === 'reg' ? 'Install Date' : 'Date Created') + '</label>' +
          '<div class="rl-modal-l">Field export order</div><ol class="rl-order">' + chosen.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ol></div></div>' +
          '<div class="rl-modal-f"><button type="button" class="btn" data-a="cancel">Cancel</button><button type="button" class="btn btn-primary" data-a="export">Export CSV</button></div></div>';
      }
      paint();
      ov.addEventListener('click', function (e) {
        var a = e.target.getAttribute && e.target.getAttribute('data-a');
        if (e.target === ov || a === 'cancel') { ov.remove(); return; }
        if (a === 'move') { Array.prototype.forEach.call(ov.querySelector('.rl-avail').selectedOptions, function (o) { chosen.push(o.value); }); paint(); }
        if (a === 'all') { chosen = F.slice(); paint(); }
        if (a === 'clear') { chosen = []; paint(); }
        if (a === 'export') { doExport(L, chosen, ov.querySelector('.rl-groupby').checked); ov.remove(); }
      });
      document.body.appendChild(ov);
    }
  };
  function val(L, x, f) {
    if (L.kind === 'reg') {
      var p = getProd(x.partNumber), ws = getWarrantyStatus(x);
      return { 'Registration ID': x.registrationId, 'Customer': x.endCustomer, 'Project': x.projectName, 'SKU': x.partNumber, 'Product': p && p.name,
        'Date Code': x.lotNumber, 'Qty Registered': x.quantityRegistered, 'Warranty Status': ws.label, 'Install Date': x.installDate, 'Expires': x.warrantyExpiry }[f];
    }
    var dist = getDist(x.distributorId), prod = getProd(x.partNumber);
    return { 'Claim ID': x.claimId, 'Status': statusLabel(x.status), 'Contractor': dist && dist.name, 'SKU': x.partNumber, 'Product': prod && prod.name,
      'Date Code': x.lotNumber, 'Qty (ea)': x.quantityAffected, 'Failure Type': x.failureType, 'Severity': sevLabel(x.severity), 'Claim Date': x.claimDate,
      'Assigned To': x.assignedTo, 'RA #': raNumber(x), 'Credit': x.creditAmount }[f];
  }
  function doExport(L, fields, group) {
    if (!fields.length) { showToast('Choose at least one field to export'); return; }
    var dk = L.kind === 'reg' ? 'installDate' : 'claimDate';
    var items = L.items.slice().sort(function (a, b) { return String(b[dk]).localeCompare(a[dk]); });
    var cols = group ? [L.kind === 'reg' ? 'Install Date (group)' : 'Date Created (group)'].concat(fields) : fields;
    var q = function (v) { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var lines = [cols.map(q).join(',')];
    items.forEach(function (x) { var r = fields.map(function (f) { return q(val(L, x, f)); }); if (group) r.unshift(q(x[dk])); lines.push(r.join(',')); });
    var blob = new Blob([lines.join('\r\n')], { type: 'text/csv' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = (L.kind === 'reg' ? 'registrations' : 'warranty-claims') + '-export.csv';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    showToast('Exported ' + items.length + ' records');
  }

  
  var oM = window.claimTableMfg, oD = window.claimTableDist, oR = window.regTableDist;
  window.claimTableMfg = function (claims, handler) { return isC() ? legacyList(claims, handler, 'mfg') : oM(claims, handler); };
  window.claimTableDist = function (claims, handler) { return isC() ? legacyList(claims, handler, 'dist') : oD(claims, handler); };
  window.regTableDist = function (regs, handler) { return isC() ? legacyList(regs, handler, 'reg') : oR(regs, handler); };

  
  function cardByHeader(root, text) {
    var out = null;
    root.querySelectorAll(':scope > .detail-card').forEach(function (c) {
      var hd = c.querySelector('.detail-card-header'); if (hd && hd.textContent.trim().indexOf(text) === 0) out = c;
    });
    return out;
  }
  function row(label, value) { return '<div class="rd-f"><div class="rd-l">' + label + '</div><div class="rd-v">' + (value == null || value === '' ? '—' : value) + '</div></div>'; }
  function transformDetail(role, claimId) {
    var c = getAllClaims().find(function (x) { return x.claimId === claimId; }); if (!c) return;
    var mc = document.getElementById('mainContent');
    var dist = getDist(c.distributorId), prod = getProd(c.partNumber), order = getOrder(c.orderId), reg = regFor(c), ra = raNumber(c), sla = getSlaInfo(c);
    var ws = reg ? getWarrantyStatus(reg) : null;
    var back = mc.querySelector(':scope > .detail-back');
    var take = function (t) { var el = cardByHeader(mc, t); if (el) el.remove(); return el; };
    ['Claim ', 'Product', 'Contractor'].forEach(function (t) { take(t); });
    var shipping = take('RA / Return Tracking'), failure = take('Failure Details') || take('Details'), resolution = take('Resolution'), regCard = take('Warranty Registration');
    var wcard = mc.querySelector(':scope > .warranty-card'); if (wcard) wcard.remove();
    var timeline = mc.querySelector(':scope > .timeline-card'); if (timeline) timeline.remove();
    var actions = Array.prototype.slice.call(mc.querySelectorAll(':scope > .action-bar'));
    actions.forEach(function (a) { a.remove(); });
    if (back) back.remove();
    var tl = c.timeline || [], first = tl[0] || {}, lastE = tl[tl.length - 1] || {};
    var team = DATA.qualityTeam || [], other = team.find(function (m) { return m.name !== c.assignedTo; }) || team[0] || { name: '—', role: 'Project Manager' };
    var pm = other.name, pmRole = (other.role || 'Project Manager').split(/[—,]/)[0].trim();
    var head = '<div class="rd-head"><button type="button" class="rd-back">‹ Go to List</button>' +
      '<div class="rd-title">' + h(dist ? dist.name : c.distributorId) + ' - ' + h(c.claimId) + '</div>' +
      '<div class="rd-ref"><span>Ref#</span><b>' + h(c.claimId.replace(/\D/g, '')) + '</b></div>' +
      '<label class="rd-arch">Archived<input type="checkbox"' + (archived[c.claimId] ? ' checked' : '') + ' onchange="__rl.archive(\'' + c.claimId + '\',this)"></label></div>';
    var top = '<div class="rd-top">' +
      '<div><div class="rd-tl">Status</div><div class="rd-tv"><span class="status-chip status-' + c.status + '">' + statusLabel(c.status) + '</span></div></div>' +
      '<div><div class="rd-tl">Assigned To</div><div class="rd-tv">' + h(c.assignedTo || '—') + '</div></div>' +
      '<div><div class="rd-tl">' + h(pmRole) + '</div><div class="rd-tv">' + h(pm) + '</div></div></div>';
    var left = '<div class="rd-panel">' +
      row('Contractor', h(dist ? dist.name : c.distributorId)) +
      row('Site', h(reg ? reg.endCustomer : (c.environment || ''))) +
      row('Product', h(prod ? prod.name : '')) +
      row('SKU', '<span class="rd-mono">' + h(c.partNumber) + '</span>') +
      row('Date Code', '<span class="rd-mono">' + h(c.lotNumber) + '</span>') +
      row('RA #', ra ? '<span class="rd-mono">' + h(ra) + '</span>' : '—') +
      row('Qty (ea)', h(c.quantityAffected)) +
      row('Credit', c.creditAmount ? '<b>' + fmtCur(c.creditAmount) + '</b>' : '—') + '</div>';
    var right = '<div class="rd-panel">' +
      row('Main', dist ? h(dist.contactPhone) + ' <span class="rd-note">' + h(dist.contactName) + '</span>' : '') +
      row('Email', dist ? h(dist.contactEmail) : '') +
      row('Order', h(c.orderId) + (order ? ' <span class="rd-note">' + fmtDate(order.date) + '</span>' : '')) +
      row('Failure', h(c.failureType)) +
      row('Severity', '<span class="severity-text sev-' + c.severity + '">' + sevLabel(c.severity) + '</span>') +
      row('SLA', '<span class="sla-pill ' + sla.cls + '">' + sla.text + '</span>') +
      row('Warranty', ws ? '<span class="status-chip ' + ws.cls + '">' + ws.label + '</span> <span class="rd-note">exp. ' + fmtDate(reg.warrantyExpiry) + '</span>' : (prod ? prod.warrantyYears + '-yr, not registered' : '')) +
      row('Claim Date', fmtDate(c.claimDate)) + '</div>';
    var logs = '<div class="rd-logs">' + tl.slice().reverse().map(function (t) {
      var type = /approved|rejected|denied|RA issued|info requested|credit/i.test(t.event) ? 'Status' : 'Note';
      return '<div class="rd-log"><div class="rd-log-l">Log Type</div><div class="rd-log-t">' + type + '</div><div class="rd-log-u">' + h(t.by) + '</div><div class="rd-log-d">' + fmtDate(t.date) + '</div>' +
        '<div class="rd-log-l rd-log-nl">Log Note</div><div class="rd-log-n">' + h(t.event) + '</div></div>';
    }).join('') + '</div>';
    var assign = '<div class="rd-assign"><div class="rd-assign-t">Review ' + h(c.claimId) + ': ' + h(c.failureType) + '</div>' +
      '<div class="rd-assign-c">Created: ' + fmtDate(c.claimDate) + '</div><div class="rd-assign-m">' +
      '<div>Staff: ' + h(c.assignedTo || '—') + '</div><div>Status: ' + ((c.status === 'approved' || c.status === 'rejected') ? 'Done' : 'In Progress') + '</div>' +
      '<div>Category: ' + h(c.failureType) + '</div><div>Priority: ' + sevLabel(c.severity) + '</div><div>SLA: ' + sla.text + '</div></div></div>';
    var docs = '<div class="rd-docs">' + [['Fixture label photo', 'JPG', 'SKU + date code ' + c.lotNumber], ['Installation photo', 'JPG', reg ? reg.endCustomer : 'Site photo'], ['Invoice ' + c.orderId, 'PDF', 'Proof of purchase']].map(function (d) {
      return '<div class="rd-doc"><div class="rd-doc-i">' + d[1] + '</div><div class="rd-doc-n"><b>' + h(d[0]) + '</b><span>' + h(d[2]) + '</span></div>' +
        '<button type="button" class="btn" onclick="showToast(\'Demo: document preview not connected\')">Preview</button></div>';
    }).join('') + '</div>';
    var tabs = [['Logs', tl.length, logs], ['Shipping', shipping ? 1 : 0, null], ['Assignments', 1, assign], ['Service', 0, null], ['Docs', 3, docs]];
    var wrap = document.createElement('div'); wrap.className = 'rd-wrap';
    wrap.innerHTML = head + top + '<div class="rd-grid">' + left + right + '</div><div class="rd-actions"></div>' +
      '<div class="rd-tabs" role="tablist">' + tabs.map(function (t, i) { return '<button type="button" role="tab" class="rd-tab' + (i === 0 ? ' active' : '') + '" data-i="' + i + '">' + t[0] + (t[1] ? '<sup>' + t[1] + '</sup>' : '') + '</button>'; }).join('') + '</div>' +
      '<div class="rd-panes">' + tabs.map(function (t, i) { return '<div class="rd-pane' + (i === 0 ? ' active' : '') + '" data-i="' + i + '">' + (t[2] || '') + '</div>'; }).join('') + '</div>' +
      '<div class="rd-stamp"><div>Created By: ' + h(first.by || '—') + '<br>Created On: ' + fmtDate(first.date) + '</div><div>Modified By: ' + h(lastE.by || '—') + '<br>Modified On: ' + fmtDate(lastE.date) + '</div></div>';
    mc.innerHTML = ''; mc.appendChild(wrap);
    var acts = wrap.querySelector('.rd-actions'); actions.forEach(function (a) { acts.appendChild(a); });
    var panes = wrap.querySelectorAll('.rd-pane');
    if (shipping) panes[1].appendChild(shipping); else panes[1].innerHTML = '<div class="rd-emptytab">No RA issued yet. ' + (role === 'manufacturer' ? 'Use <b>Issue RA</b> above to request the failed unit back.' : 'The manufacturer will issue an RA if the failed unit must be returned.') + '</div>';
    [failure, resolution, regCard, wcard].forEach(function (el) { if (el) panes[3].appendChild(el); });
    var svcN = panes[3].children.length;
    if (!svcN) panes[3].innerHTML = '<div class="rd-emptytab">No service details.</div>';
    else { var st = wrap.querySelector('.rd-tab[data-i="3"]'); if (st) st.innerHTML = 'Service<sup>' + svcN + '</sup>'; }
    if (timeline && !tl.length) panes[0].appendChild(timeline);
    wrap.querySelector('.rd-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.rd-tab'); if (!b) return; var i = b.getAttribute('data-i');
      wrap.querySelectorAll('.rd-tab').forEach(function (x) { x.classList.toggle('active', x === b); });
      panes.forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-i') === i); });
    });
    wrap.querySelector('.rd-back').addEventListener('click', function () {
      if (back) back.click(); else if (role === 'manufacturer') switchMfgTab(currentMfgTab); else switchDistTab(currentDistTab);
    });
    mc.scrollTop = 0;
  }
  function wrapDetail(name, role) {
    var o = window[name]; if (typeof o !== 'function') return;
    window[name] = function (id) { var r = o.apply(this, arguments); if (isC()) { try { transformDetail(role, id); } catch (e) { console.error('classic detail', e); } } return r; };
  }
  wrapDetail('showMfgDetail', 'manufacturer');
  wrapDetail('showDistDetail', 'distributor');
})();

