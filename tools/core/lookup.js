/* Look up (generalized, v2.0): heading, search with icon, DEMO card of preset searches.
   Presets, hint, spec labels and wording come from DATA.ui (the niche pack), so the same
   code serves any trade. Matching ignores dashes and spaces; every preset returns results. */
function lk() { return (typeof DATA !== 'undefined' && DATA && DATA.ui) || {}; }
var TF_SEARCH_ICON = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"square\" stroke-linejoin=\"miter\" aria-hidden=\"true\"><circle cx=\"10.5\" cy=\"10.5\" r=\"6\"/><path d=\"M15 15l5.5 5.5\"/></svg>";

function renderDistLookup(el) {
  var groups = (lk().lookupPresets || []).map(function (g) {
    return '<div class="tfl-group-label">' + g[0] + '</div><div class="tfl-chips">' +
      g[2].map(function (v) {
        return '<button type="button" class="tfl-chip' + (g[1] ? ' tfl-mono' : '') + '" data-q="' + esc(v) + '">' + esc(v) + '</button>';
      }).join('') + '</div>';
  }).join('');
  el.innerHTML =
    '<div class="tfl">' +
      '<h2 class="tfl-title">What are you looking for?</h2>' +
      '<div class="tfl-search">' + TF_SEARCH_ICON +
        '<input class="search-input" id="lookupInput" type="search" autocomplete="off" spellcheck="false" enterkeyhint="search" ' +
        'placeholder="Catalog number or description" aria-describedby="tflHint" oninput="doLookup()">' +
        '<button type="button" class="tfl-clear" id="lookupClear" aria-label="Clear search" hidden>&times;</button>' +
      '</div>' +
      '<div class="tfl-hint" id="tflHint">'+esc(lk().lookupHint||'')+'</div>' +
      '<div class="tfl-card" id="lookupPresets">' +
        '<div class="tfl-card-head"><span class="tf-demo">DEMO</span><b>Try one of these</b></div>' +
        '<div class="tfl-card-note">This is a demonstration catalog. Every one of these returns results.</div>' +
        groups +
      '</div>' +
      '<div id="lookupResults"></div>' +
    '</div>';
  el.scrollTop = 0;
  var inp = document.getElementById('lookupInput');
  el.querySelectorAll('.tfl-chip').forEach(function (b) {
    b.addEventListener('click', function () { inp.value = b.getAttribute('data-q'); doLookup(); inp.focus(); });
  });
  document.getElementById('lookupClear').addEventListener('click', function () { inp.value = ''; doLookup(); inp.focus(); });
  setTimeout(function () { if (inp && window.matchMedia('(hover:hover)').matches) inp.focus(); }, 100);
}

function tfNorm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

function tfMatches(q) {
  var qn = tfNorm(q);
  if (!qn) return [];
  var words = q.toLowerCase().split(/[\s,\/]+/).map(tfNorm).filter(Boolean);
  var watt = lk().unitSearch ? q.match(/^\s*(\d{2,3})\s*w\s*$/i) : null;
  var hits = DATA.products.filter(function (p) {
    if (watt) return String(p.awg).split(/[^0-9]+/).indexOf(watt[1]) !== -1;
    if (tfNorm(p.partNumber).indexOf(qn) !== -1) return true;
    var hay = tfNorm([p.name, p.category, p.description, p.awg, (p.applications || []).join(' '), (p.certifications || []).join(' ')].join(' '));
    return words.every(function (w) { return hay.indexOf(w) !== -1; });
  });
  /* catalog-number hits first, exact match on top */
  function rank(p) { var n = tfNorm(p.partNumber); return n === qn ? 0 : n.indexOf(qn) === 0 ? 1 : n.indexOf(qn) !== -1 ? 2 : 3; }
  return hits.map(function (p, i) { return [rank(p), i, p]; }).sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; }).map(function (x) { return x[2]; });
}

function doLookup() {
  var raw = document.getElementById('lookupInput').value || '';
  var q = raw.trim();
  var r = document.getElementById('lookupResults');
  var presets = document.getElementById('lookupPresets');
  var clr = document.getElementById('lookupClear');
  if (clr) clr.hidden = !raw;
  if (presets) presets.hidden = !!q;
  if (!q) { r.innerHTML = ''; return; }
  var matches = tfMatches(q);
  if (!matches.length) { r.innerHTML = '<div class="empty-state">No '+esc(lk().itemWord||'product')+' matches that. Check the catalog number on the label'+(lk().catalogPrefix?'; it starts with '+esc(lk().catalogPrefix):'')+'.</div>'; return; }
  var html = '<div class="tfl-count">' + matches.length + (matches.length === 1 ? ' '+(lk().itemWord||'product') : ' '+(lk().itemsWord||'products')) + ' for “' + esc(q) + '”</div>';
  matches.forEach(function (p) {
    /* warranty registrations for this product by the current contractor */
    var prodRegs = getAllRegistrations().filter(function (r) { return r.partNumber === p.partNumber && r.distributorId === currentUser.distId; });
    var regHtml = '';
    if (prodRegs.length) {
      regHtml = '<div style="padding:8px 16px 12px;border-top:1px solid var(--outline-variant)"><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--on-surface-muted);margin-bottom:6px">Your registrations</div>';
      prodRegs.forEach(function (r) {
        var ws = getWarrantyStatus(r);
        regHtml += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:12px">' +
          '<span style="color:var(--on-surface-variant)">' + esc(r.endCustomer) + ' — ' + r.quantityRegistered.toLocaleString() + ' units</span>' +
          '<span class="status-chip ' + ws.cls + '" style="font-size:10px">' + ws.label + '</span></div>';
      });
      regHtml += '</div>';
    }
    html += '<div class="product-card"><div class="pc-header"><div class="pc-name">' + esc(p.name) + '</div>' +
      '<div class="pc-part">' + p.partNumber + ' — ' + esc(p.category) + '</div>' +
      '<div class="cert-badges">' + p.certifications.map(function (c) { return '<span class="cert-badge">' + esc(c) + '</span>'; }).join('') + '</div></div>' +
      '<div class="pc-specs">' +
      specItem((lk().specLabels||[])[0]||'Size', p.awg) + specItem((lk().specLabels||[])[1]||'Rating', p.tempRating) + specItem((lk().specLabels||[])[2]||'Voltage', p.voltageRating) + specItem('Warranty', p.warrantyYears + ' years') +
      '</div><div class="pc-warranty">' + esc(p.warrantyTerms) + '</div>' + regHtml + '</div>';
  });
  r.innerHTML = html;
}

