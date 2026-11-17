/* =========================================================================
   CashAuto — Reklama a výkon (admin.html, panel #reklama)
   - propojení reklamních účtů (Meta, Google, TikTok, Sklik) s průběhem připojení
   - nejdůležitější hodnoty, vývoj v čase, rozdělení podle platforem, tabulka kampaní
   - filtry: období, platformy, srovnání s předchozím obdobím, hledání kampaně; řada se bere
     z přepínače řad nahoře (admin-line.js)
   - při každém načtení se zobrazí kostra (skeleton) a načítací animace

   POZOR: administrace nemá server, takže propojení je SIMULACE a čísla jsou UKÁZKOVÁ
   (počítají se zde, deterministicky). Skutečné napojení = nahradit funkci fetchAds()
   voláním vlastního backendu, který drží přístupové tokeny platforem (OAuth).
   ========================================================================= */
(function () {
  "use strict";
  var root = document.getElementById("adsRoot");
  if (!root) return;
  var LN = window.AKline || { get: function () { return "all"; }, LINES: {} };
  var KEY = "ak_ads_v1", NB = " ";
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  // Platformy v pevném pořadí; barvy ověřené validátorem palety na světlém povrchu (identita platformy, ne řady)
  var PLATFORMS = [
    { key: "meta", name: "Meta Ads", sub: "Facebook a Instagram", color: "#2a78d6", account: "CashAuto — reklamní účet (ukázka)" },
    { key: "google", name: "Google Ads", sub: "Vyhledávání, PMax, YouTube", color: "#1baf7a", account: "CashAuto — Google Ads (ukázka)" },
    { key: "tiktok", name: "TikTok Ads", sub: "In-Feed video", color: "#e87ba4", account: "CashAuto — TikTok Business (ukázka)" },
    { key: "sklik", name: "Sklik", sub: "Seznam.cz", color: "#6250d6", account: "CashAuto — Sklik (ukázka)" }
  ];
  var P = {}; PLATFORMS.forEach(function (p) { P[p.key] = p; });
  // Ukázkové kampaně: [platforma, řada, název, denní útrata, CPC, CTR, konverze klik→žádost]
  var CAMPAIGNS = [
    ["meta", "auto", "CashAuto — potenciální zákazníci (široké B2B)", 900, 14, 0.011, 0.021], ["meta", "auto", "CashAuto — remarketing kalkulačky", 320, 9, 0.019, 0.046],
    ["meta", "agro", "AgroCash — potenciální zákazníci", 420, 16, 0.009, 0.018], ["meta", "tech", "TechCash — potenciální zákazníci", 480, 17, 0.010, 0.017],
    ["google", "auto", "CashAuto — Search: dočasný výkup", 1100, 22, 0.058, 0.052], ["google", "auto", "CashAuto — Search: faktury po splatnosti", 520, 15, 0.034, 0.024],
    ["google", "auto", "Značka CashAuto", 140, 5, 0.240, 0.110], ["google", "agro", "AgroCash — Search", 380, 19, 0.047, 0.041], ["google", "tech", "TechCash — Search", 460, 24, 0.044, 0.038],
    ["google", "all", "Performance Max — tři řady", 600, 12, 0.016, 0.019],
    ["tiktok", "auto", "CashAuto — návštěvnost", 260, 6, 0.008, 0.006], ["tiktok", "agro", "AgroCash — návštěvnost", 120, 7, 0.007, 0.005], ["tiktok", "tech", "TechCash — návštěvnost", 140, 7, 0.007, 0.005],
    ["sklik", "auto", "CashAuto — vyhledávání", 420, 13, 0.041, 0.036], ["sklik", "agro", "AgroCash — vyhledávání", 160, 12, 0.036, 0.031]
  ].map(function (c, i) { return { id: i, platform: c[0], line: c[1], name: c[2], spend: c[3], cpc: c[4], ctr: c[5], cvr: c[6] }; });
  var METRICS = {
    spend: { l: "Útrata", unit: "czk", sum: 1, dir: 0 }, impr: { l: "Zobrazení", unit: "int", sum: 1, dir: 1 }, clicks: { l: "Kliky", unit: "int", sum: 1, dir: 1 },
    ctr: { l: "CTR", unit: "pct", dir: 1, hint: "kliky / zobrazení" }, cpc: { l: "Cena za klik", unit: "czk1", dir: -1 }, leads: { l: "Odeslané žádosti", unit: "int", sum: 1, dir: 1 },
    cpl: { l: "Cena za žádost", unit: "czk", dir: -1, hint: "útrata / žádosti" }, cvr: { l: "Konverze kliku na žádost", unit: "pct", dir: 1 }
  };
  var TILES = ["spend", "leads", "cpl", "clicks", "ctr", "cpc", "impr", "cvr"], CHART_METRICS = ["spend", "leads", "cpl", "clicks"];
  var DAYS = 180;

  // ---------- stav ----------
  var st = { conn: {}, f: { range: 30, platforms: [], compare: true, q: "", metric: "spend", split: false, sort: "spend", dir: -1 } };
  try { var s0 = JSON.parse(localStorage.getItem(KEY) || "null"); if (s0) { st.conn = s0.conn || {}; Object.assign(st.f, s0.f || {}); } } catch (e) { /* výchozí */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* jen do zavření stránky */ } }
  var flow = {};          // průběh připojování: { meta: { step, pct } }
  var connected = function () { return PLATFORMS.filter(function (p) { return st.conn[p.key]; }).map(function (p) { return p.key; }); };
  var activePlatforms = function () { var c = connected(), sel = st.f.platforms.filter(function (k) { return c.indexOf(k) >= 0; }); return sel.length ? sel : c; };

  // ---------- ukázková data (deterministická) ----------
  function rnd(seed) { var x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); }
  var todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);
  var dayDate = function (ago) { return new Date(todayMid.getTime() - ago * 864e5); };
  var cache = {};
  function dayRow(c, ago) {      // hodnoty kampaně za den „před ago dny“ (0 = včera)
    var k = c.id + ":" + ago; if (cache[k]) return cache[k];
    var d = dayDate(ago + 1), wd = d.getDay(), dn = Math.floor(d.getTime() / 864e5);
    var week = wd === 0 ? 0.42 : wd === 6 ? 0.5 : wd === 1 ? 1.08 : 1;
    var trend = 1 + (DAYS - ago) / DAYS * 0.16, n1 = 0.78 + rnd(dn * 13 + c.id * 7) * 0.44, n2 = 0.85 + rnd(dn * 5 + c.id * 31) * 0.3, n3 = 0.7 + rnd(dn * 3 + c.id * 17) * 0.6;
    var spend = Math.round(c.spend * week * trend * n1), clicks = Math.max(0, Math.round(spend / (c.cpc * n2)));
    var impr = Math.round(clicks / (c.ctr * (0.9 + rnd(dn + c.id) * 0.2))), exp = clicks * c.cvr * n3, leads = Math.floor(exp) + (rnd(dn * 11 + c.id * 3) < exp - Math.floor(exp) ? 1 : 0);
    return (cache[k] = { spend: spend, clicks: clicks, impr: impr, leads: leads });
  }
  var zero = function () { return { spend: 0, clicks: 0, impr: 0, leads: 0 }; };
  var add = function (a, b) { a.spend += b.spend; a.clicks += b.clicks; a.impr += b.impr; a.leads += b.leads; return a; };
  function metric(t, m) {
    return m === "ctr" ? (t.impr ? t.clicks / t.impr : null) : m === "cpc" ? (t.clicks ? t.spend / t.clicks : null) : m === "cpl" ? (t.leads ? t.spend / t.leads : null) : m === "cvr" ? (t.clicks ? t.leads / t.clicks : null) : t[m];
  }
  // „Dotaz na API“: vrací Promise, aby šel jednou nahradit skutečným voláním backendu.
  function fetchAds(f) {
    var line = LN.get(), plats = activePlatforms(), q = f.q.trim().toLowerCase();
    var camps = CAMPAIGNS.filter(function (c) { return plats.indexOf(c.platform) >= 0 && (line === "all" || c.line === line) && (!q || c.name.toLowerCase().indexOf(q) >= 0); });
    var n = f.range, bucket = n > 45 ? 7 : 1, points = Math.ceil(n / bucket);
    var series = function (list, offset) {
      var out = [];
      for (var i = 0; i < points; i++) {
        var t = zero();
        for (var d = 0; d < bucket; d++) { var ago = offset + n - 1 - (i * bucket + d); if (ago >= offset) list.forEach(function (c) { add(t, dayRow(c, ago)); }); }
        out.push(t);
      }
      return out;
    };
    var total = function (list, offset) { var t = zero(); for (var a = offset; a < offset + n; a++) list.forEach(function (c) { add(t, dayRow(c, a)); }); return t; };
    var res = {
      camps: camps.map(function (c) { return { c: c, t: total([c], 0) }; }), cur: total(camps, 0), prev: total(camps, n), series: series(camps, 0), prevSeries: series(camps, n),
      byPlatform: plats.map(function (k) { var l = camps.filter(function (c) { return c.platform === k; }); return { key: k, t: total(l, 0), series: series(l, 0) }; }),
      labels: (function () { var a = []; for (var i = 0; i < points; i++) a.push(dayDate(n - i * bucket)); return a; })(), bucket: bucket, points: points
    };
    return new Promise(function (ok) { setTimeout(function () { ok(res); }, 520 + Math.round(Math.random() * 260)); });
  }

  // ---------- formátování ----------
  var int = function (n) { return Math.round(n).toLocaleString("cs-CZ").replace(/\s/g, NB); };
  function fmt(v, unit, compact) {
    if (v == null || !isFinite(v)) return "—";
    if (unit === "pct") return (v * 100).toFixed(v < 0.1 ? 2 : 1).replace(".", ",") + NB + "%";
    if (unit === "czk1") return v.toFixed(1).replace(".", ",") + NB + "Kč";
    if (compact && v >= 1e6) return (v / 1e6).toFixed(v >= 1e7 ? 1 : 2).replace(".", ",") + NB + "mil." + (unit === "czk" ? NB + "Kč" : "");
    if (compact && v >= 1e5) return Math.round(v / 1e3) + NB + "tis." + (unit === "czk" ? NB + "Kč" : "");
    return int(v) + (unit === "czk" ? NB + "Kč" : "");
  }
  var dm = function (d) { return d.getDate() + ". " + (d.getMonth() + 1) + "."; };
  function delta(cur, prev, dir) {
    if (cur == null || prev == null || !prev) return null;
    var p = (cur - prev) / prev, up = p > 0.0005, down = p < -0.0005;
    var tone = !dir || (!up && !down) ? "flat" : (up ? dir > 0 : dir < 0) ? "good" : "bad";
    return { txt: (up ? "+" : down ? "−" : "") + Math.abs(p * 100).toFixed(1).replace(".", ",") + NB + "%", tone: tone, arrow: up ? "up" : down ? "down" : "flat",
      sr: (up ? "nárůst" : down ? "pokles" : "beze změny") + (tone === "good" ? ", příznivé" : tone === "bad" ? ", nepříznivé" : "") };
  }
  var ARROW = { up: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 2l4 5H7v3H5V7H2z"/></svg>', down: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 10L2 5h3V2h2v3h3z"/></svg>', flat: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 5h8v2H2z"/></svg>' };
  var I = {
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1"/><path d="M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/></svg>',
    sync: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 0 1-14 5.300M4 12a8 8 0 0 1 14-5.300"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.500l5 5L20 6.500"/></svg>', info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.500"/></svg>'
  };

  // ---------- kostra stránky ----------
  root.innerHTML =
    '<div class="ads-note">' + I.info + '<span><strong>Ukázková data.</strong> Propojení účtů je zatím simulace — administrace nemá server, který by bezpečně držel přístupové tokeny platforem. Po napojení backendu se zde zobrazí skutečná čísla z Meta, Google, TikTok a Skliku.</span></div>' +
    '<section class="ads-sec" aria-labelledby="adsConnH"><div class="ads-sec-h"><h3 id="adsConnH">Reklamní účty</h3><button type="button" class="btn btn-sm btn-ghost" id="adsDemoAll">Připojit všechny ukázkově</button></div><div class="ads-conn" id="adsConn"></div></section>' +
    '<section class="ads-sec" aria-labelledby="adsPerfH"><div class="ads-sec-h"><h3 id="adsPerfH">Výkon reklam</h3><span class="ads-period" id="adsPeriod"></span></div>' +
      '<div class="ads-filters" id="adsFilters"></div><div id="adsBody" aria-live="polite"></div></section>';
  var elConn = document.getElementById("adsConn"), elFilters = document.getElementById("adsFilters"), elBody = document.getElementById("adsBody");

  // ---------- účty ----------
  var STEPS = ["Otevírám přihlášení k platformě…", "Ověřuji oprávnění ke čtení statistik…", "Načítám reklamní účty…", "První synchronizace dat…"];
  function renderConn() {
    elConn.innerHTML = PLATFORMS.map(function (p) {
      var c = st.conn[p.key], fl = flow[p.key];
      var body = fl ? '<div class="ac-flow" role="status"><span class="spin" aria-hidden="true"></span><span>' + esc(STEPS[fl.step]) + '</span></div><div class="ac-prog"><i style="width:' + fl.pct + '%"></i></div>'
        : c ? '<div class="ac-acc"><span class="ac-ok">' + I.check + "Připojeno</span><strong>" + esc(p.account) + "</strong><span>Poslední synchronizace: " + esc(c.at) + '</span></div><div class="ac-act">' +
              '<button type="button" class="btn btn-sm btn-ghost" data-ads="sync" data-p="' + p.key + '">' + I.sync + 'Synchronizovat</button><button type="button" class="ac-off" data-ads="off" data-p="' + p.key + '">Odpojit</button></div>'
        : '<p class="ac-none">Nepřipojeno</p><div class="ac-act"><button type="button" class="btn btn-sm btn-primary" data-ads="on" data-p="' + p.key + '">' + I.link + "Připojit účet</button></div>";
      return '<article class="ads-acc' + (c ? " is-on" : "") + (fl ? " is-busy" : "") + '" aria-busy="' + (fl ? "true" : "false") + '"><header><i class="pdot" style="background:' + p.color + '"></i><div><h4>' + esc(p.name) + "</h4><span>" + esc(p.sub) + "</span></div></header>" + body + "</article>";
    }).join("");
    document.getElementById("adsDemoAll").hidden = connected().length === PLATFORMS.length;
  }
  function stamp() { var d = new Date(), z = function (n) { return (n < 10 ? "0" : "") + n; }; return dm(d) + " " + z(d.getHours()) + ":" + z(d.getMinutes()); }
  function connect(key, quick) {
    if (flow[key]) return Promise.resolve();
    flow[key] = { step: quick ? 3 : 0, pct: quick ? 55 : 6 }; renderConn();
    return new Promise(function (ok) {
      var t = setInterval(function () {
        var f = flow[key]; if (!f) { clearInterval(t); return; }
        f.pct = Math.min(100, f.pct + 9 + Math.random() * 9); f.step = Math.min(STEPS.length - 1, Math.max(f.step, Math.floor(f.pct / 26)));
        if (f.pct >= 100) { clearInterval(t); delete flow[key]; st.conn[key] = { at: stamp() }; save(); renderConn(); renderFilters(); ok(); } else renderConn();
      }, 190);
    });
  }
  elConn.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ads]"); if (!b) return;
    var k = b.dataset.p, a = b.dataset.ads;
    if (a === "on") connect(k).then(load);
    else if (a === "sync") connect(k, true).then(load);
    else if (a === "off") { delete st.conn[k]; st.f.platforms = st.f.platforms.filter(function (x) { return x !== k; }); save(); renderConn(); renderFilters(); load(); }
  });
  document.getElementById("adsDemoAll").addEventListener("click", function () {
    Promise.all(PLATFORMS.filter(function (p) { return !st.conn[p.key]; }).map(function (p, i) { return new Promise(function (ok) { setTimeout(function () { connect(p.key).then(ok); }, i * 240); }); })).then(load);
  });

  // ---------- filtry ----------
  function renderFilters() {
    var c = connected(), sel = activePlatforms(), all = !st.f.platforms.length || sel.length === c.length;
    var dirty = st.f.range !== 30 || st.f.platforms.length || st.f.q || !st.f.compare;
    elFilters.hidden = !c.length;
    elFilters.innerHTML =
      '<div class="af-group" role="group" aria-label="Období">' + [7, 14, 30, 90].map(function (n) { return '<button type="button" data-f="range" data-v="' + n + '" aria-pressed="' + (st.f.range === n) + '">' + n + NB + "dní</button>"; }).join("") + "</div>" +
      '<div class="af-chips" role="group" aria-label="Platformy"><button type="button" class="af-chip" data-f="pall" aria-pressed="' + all + '">Všechny platformy</button>' + c.map(function (k) {
        return '<button type="button" class="af-chip" data-f="plat" data-v="' + k + '" aria-pressed="' + (!all && sel.indexOf(k) >= 0) + '"><i class="pdot" style="background:' + P[k].color + '"></i>' + esc(P[k].name) + "</button>";
      }).join("") + "</div>" +
      '<label class="af-switch"><input type="checkbox" data-f="compare"' + (st.f.compare ? " checked" : "") + " /><i></i><span>Srovnat s předchozím obdobím</span></label>" +
      '<label class="af-search"><span class="sr-live">Hledat kampaň</span><input type="search" data-f="q" placeholder="Hledat kampaň" value="' + esc(st.f.q) + '" autocomplete="off" /></label>' +
      (dirty ? '<button type="button" class="af-reset" data-f="reset">Zrušit filtry</button>' : "");
  }
  var qt = 0;
  elFilters.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-f]"); if (!b) return;
    var f = b.dataset.f, v = b.dataset.v;
    if (f === "range") st.f.range = +v;
    else if (f === "pall") st.f.platforms = [];
    else if (f === "plat") { var a = st.f.platforms.length ? st.f.platforms.slice() : [], i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); st.f.platforms = a.length === connected().length ? [] : a; }
    else if (f === "reset") { st.f.range = 30; st.f.platforms = []; st.f.q = ""; st.f.compare = true; }
    save(); renderFilters(); load();
  });
  elFilters.addEventListener("change", function (e) { if (e.target.matches('[data-f="compare"]')) { st.f.compare = e.target.checked; save(); renderFilters(); load(); } });
  elFilters.addEventListener("input", function (e) {
    if (!e.target.matches('[data-f="q"]')) return;
    clearTimeout(qt); var v = e.target.value; qt = setTimeout(function () { st.f.q = v; save(); load(true); }, 260);
  });

  // ---------- načítání + skeleton ----------
  var req = 0, last = null;
  function skeleton() {
    var tile = '<div class="ads-tile sk"><span class="sk-l" style="width:52%"></span><span class="sk-l big" style="width:74%"></span><span class="sk-l" style="width:38%"></span></div>';
    return '<div class="ads-loading" role="status"><span class="spin" aria-hidden="true"></span>Načítám výkon reklam…</div><div class="ads-tiles" aria-hidden="true">' + new Array(9).join(tile) + "</div>" +
      '<div class="ads-grid" aria-hidden="true"><div class="ads-card sk"><span class="sk-l" style="width:30%"></span><div class="sk-chart">' + [38, 52, 44, 63, 58, 71, 49, 66, 80, 62, 74, 90].map(function (h) { return '<i style="height:' + h + '%"></i>'; }).join("") + "</div></div>" +
      '<div class="ads-card sk"><span class="sk-l" style="width:44%"></span>' + [88, 64, 40, 28].map(function (w) { return '<span class="sk-l bar" style="width:' + w + '%"></span>'; }).join("") + "</div></div>" +
      '<div class="ads-card sk" aria-hidden="true">' + [100, 96, 100, 92, 98].map(function (w) { return '<span class="sk-l row" style="width:' + w + '%"></span>'; }).join("") + "</div>";
  }
  function load(keepFocus) {
    var c = connected(), my = ++req;
    document.getElementById("adsPeriod").textContent = c.length ? "posledních " + st.f.range + " dní · " + dm(dayDate(st.f.range)) + " – " + dm(dayDate(1)) : "";
    if (!c.length) { elBody.setAttribute("aria-busy", "false"); elBody.innerHTML = '<div class="ads-empty"><div class="ae-art" aria-hidden="true">' + [34, 58, 46, 72, 60, 88].map(function (h) { return '<i style="height:' + h + '%"></i>'; }).join("") + "</div><h4>Zatím není připojený žádný reklamní účet</h4><p>Připojte Meta, Google, TikTok nebo Sklik a uvidíte útratu, žádosti a cenu za žádost na jednom místě.</p><button type=\"button\" class=\"btn btn-primary\" id=\"adsEmptyBtn\">Připojit ukázkové účty</button></div>"; return; }
    elBody.setAttribute("aria-busy", "true"); elBody.innerHTML = skeleton();
    fetchAds(st.f).then(function (res) { if (my !== req) return; last = res; elBody.setAttribute("aria-busy", "false"); renderBody(res); if (keepFocus) { var q = elFilters.querySelector('[data-f="q"]'); if (q) { q.focus(); q.selectionStart = q.selectionEnd = q.value.length; } } });
  }
  elBody.addEventListener("click", function (e) {
    if (e.target.closest("#adsEmptyBtn")) return document.getElementById("adsDemoAll").click();
    var m = e.target.closest("[data-metric]"); if (m) { st.f.metric = m.dataset.metric; save(); return renderBody(last); }
    if (e.target.closest("[data-split]")) { st.f.split = !st.f.split; save(); return renderBody(last); }
    var th = e.target.closest("[data-sort]"); if (th) { var k = th.dataset.sort; if (st.f.sort === k) st.f.dir = -st.f.dir; else { st.f.sort = k; st.f.dir = k === "name" ? 1 : -1; } save(); return renderBody(last); }
  });

  // ---------- vykreslení výsledků ----------
  function spark(vals) {
    var v = vals.filter(function (x) { return x != null; }); if (v.length < 2) return "";
    var mx = Math.max.apply(null, v), mn = Math.min.apply(null, v), w = 96, h = 28, r = mx - mn || 1;
    var pts = vals.map(function (x, i) { return x == null ? null : [(i / (vals.length - 1)) * w, h - 3 - ((x - mn) / r) * (h - 6)]; }).filter(Boolean);
    return '<svg class="spark" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" points="' + pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ") + '"/><circle cx="' + pts[pts.length - 1][0].toFixed(1) + '" cy="' + pts[pts.length - 1][1].toFixed(1) + '" r="2.6"/></svg>';
  }
  function renderBody(res) {
    if (!res) return;
    if (!res.camps.length) { elBody.innerHTML = '<div class="ads-empty small"><h4>Filtru neodpovídá žádná kampaň</h4><p>Zkuste jinou řadu, platformu nebo hledaný výraz.</p></div>'; return; }
    var m = METRICS[st.f.metric] ? st.f.metric : "spend", M = METRICS[m];
    // dlaždice
    var tiles = TILES.map(function (k) {
      var K = METRICS[k], cur = metric(res.cur, k), d = st.f.compare ? delta(cur, metric(res.prev, k), K.dir) : null;
      return '<div class="ads-tile"><span class="at-l">' + esc(K.l) + '</span><strong class="at-v">' + fmt(cur, K.unit, true) + "</strong>" +
        (d ? '<span class="at-d ' + d.tone + '" title="oproti předchozím ' + st.f.range + ' dnům">' + ARROW[d.arrow] + d.txt + '<span class="sr-live"> ' + d.sr + "</span></span>" : '<span class="at-d flat">' + (K.hint ? esc(K.hint) : "&nbsp;") + "</span>") +
        spark(res.series.map(function (t) { return metric(t, k); })) + "</div>";
    }).join("");
    // přepínač metriky grafu
    var tabs = '<div class="ac-tabs" role="group" aria-label="Co graf ukazuje">' + CHART_METRICS.map(function (k) { return '<button type="button" data-metric="' + k + '" aria-pressed="' + (k === m) + '">' + esc(METRICS[k].l) + "</button>"; }).join("") + "</div>";
    var canSplit = res.byPlatform.length > 1, split = st.f.split && canSplit;
    var series = split ? res.byPlatform.map(function (b) { return { key: b.key, name: P[b.key].name, color: P[b.key].color, v: b.series.map(function (t) { return metric(t, m); }) }; })
      : [{ key: "total", name: "Celkem", color: "var(--ink)", v: res.series.map(function (t) { return metric(t, m); }) }];
    var prev = !split && st.f.compare ? res.prevSeries.map(function (t) { return metric(t, m); }) : null;
    var legend = (split || prev) ? '<ul class="ac-legend">' + series.map(function (s) { return '<li><i style="background:' + s.color + '"></i>' + esc(s.name) + "</li>"; }).join("") + (prev ? '<li><i class="dash"></i>Předchozích ' + st.f.range + " dní</li>" : "") + "</ul>" : "";
    // sloupce podle platforem
    var bp = res.byPlatform.map(function (b) { return { p: P[b.key], v: metric(b.t, m) }; }), bmax = Math.max.apply(null, bp.map(function (b) { return b.v || 0; })) || 1;
    var bars = '<ul class="ads-bars">' + bp.map(function (b) {
      return '<li title="' + esc(b.p.name) + ": " + fmt(b.v, M.unit) + '"><span class="ab-n"><i class="pdot" style="background:' + b.p.color + '"></i>' + esc(b.p.name) + '</span><span class="ab-t"><i style="width:' + Math.max(1.5, (b.v || 0) / bmax * 100).toFixed(1) + "%;background:" + b.p.color + '"></i></span><span class="ab-v">' + fmt(b.v, M.unit, true) + "</span></li>";
    }).join("") + "</ul>";
    // tabulka kampaní
    var cols = [["name", "Kampaň"], ["platform", "Platforma"], ["line", "Řada"], ["spend", "Útrata"], ["clicks", "Kliky"], ["ctr", "CTR"], ["cpc", "Cena za klik"], ["leads", "Žádosti"], ["cpl", "Cena za žádost"]];
    var rows = res.camps.slice().sort(function (a, b) {
      var k = st.f.sort, x = k === "name" ? a.c.name : k === "platform" ? P[a.c.platform].name : k === "line" ? a.c.line : metric(a.t, k), y = k === "name" ? b.c.name : k === "platform" ? P[b.c.platform].name : k === "line" ? b.c.line : metric(b.t, k);
      if (typeof x === "string") return x.localeCompare(y, "cs") * st.f.dir;
      return ((x == null ? -1 : x) - (y == null ? -1 : y)) * st.f.dir;
    });
    var lineName = function (l) { return l === "all" ? "Všechny" : (LN.LINES[l] || {}).label || l; };
    var table = '<div class="table-wrap"><table class="table rowhover ads-table"><thead><tr>' + cols.map(function (c, i) {
      var on = st.f.sort === c[0];
      return "<th" + (i > 2 ? ' class="num"' : "") + ' aria-sort="' + (on ? (st.f.dir > 0 ? "ascending" : "descending") : "none") + '"><button type="button" data-sort="' + c[0] + '"' + (on ? ' class="on ' + (st.f.dir > 0 ? "asc" : "desc") + '"' : "") + ">" + c[1] + "</button></th>";
    }).join("") + "</tr></thead><tbody>" + rows.map(function (r) {
      var t = r.t, c = r.c;
      return "<tr><td><strong>" + esc(c.name) + '</strong></td><td><span class="ab-n"><i class="pdot" style="background:' + P[c.platform].color + '"></i>' + esc(P[c.platform].name) + "</span></td><td>" + esc(lineName(c.line)) + "</td>" +
        '<td class="num mono">' + fmt(t.spend, "czk") + '</td><td class="num mono">' + fmt(t.clicks, "int") + '</td><td class="num mono">' + fmt(metric(t, "ctr"), "pct") + '</td><td class="num mono">' + fmt(metric(t, "cpc"), "czk1") +
        '</td><td class="num mono">' + fmt(t.leads, "int") + '</td><td class="num mono">' + fmt(metric(t, "cpl"), "czk") + "</td></tr>";
    }).join("") + "</tbody></table></div>";

    elBody.innerHTML = '<div class="ads-tiles ads-in">' + tiles + "</div>" +
      '<div class="ads-grid ads-in"><div class="ads-card"><div class="ac-head"><h4>' + esc(M.l) + (res.bucket > 1 ? " po týdnech" : " po dnech") + "</h4>" + tabs +
        (canSplit ? '<button type="button" class="ac-split" data-split aria-pressed="' + split + '">Podle platforem</button>' : "") + "</div>" + legend +
        '<div class="ac-plot" id="adsPlot"></div></div>' +
      '<div class="ads-card"><div class="ac-head"><h4>' + esc(M.l) + " podle platforem</h4></div>" + bars + "</div></div>" +
      '<div class="ads-card ads-in"><div class="ac-head"><h4>Kampaně</h4><span class="ac-sub">' + res.camps.length + " kampaní · řazení kliknutím na záhlaví</span></div>" + table + "</div>";
    drawChart(series, prev, res, M);
  }

  // ---------- čárový graf (jedna osa, nitkový kříž s popiskem) ----------
  var chartArgs = null;
  function drawChart(series, prev, res, M) {
    chartArgs = [series, prev, res, M];
    var box = document.getElementById("adsPlot"); if (!box) return;
    var W = Math.max(280, box.clientWidth), H = W < 520 ? 210 : 270, padL = 54, padR = series.length > 1 ? 14 : 14, padT = 12, padB = 26, n = res.points;
    var all = []; series.forEach(function (s) { all = all.concat(s.v); }); if (prev) all = all.concat(prev);
    all = all.filter(function (x) { return x != null; });
    var max = Math.max.apply(null, all.concat([1])), mag = Math.pow(10, Math.floor(Math.log10(max))), step = [1, 2, 2.5, 5, 10].map(function (k) { return k * mag / 2; }).filter(function (s) { return max / s <= 4.2; })[0] || mag;
    var top = Math.ceil(max / step) * step, x = function (i) { return padL + (n === 1 ? 0.5 : i / (n - 1)) * (W - padL - padR); }, y = function (v) { return padT + (1 - v / top) * (H - padT - padB); };
    var path = function (v) { var d = "", pen = false; v.forEach(function (val, i) { if (val == null) { pen = false; return; } d += (pen ? "L" : "M") + x(i).toFixed(1) + " " + y(val).toFixed(1); pen = true; }); return d; };
    var grid = ""; for (var g = 0; g <= top + 1e-9; g += step) grid += '<line class="g" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(g).toFixed(1) + '" y2="' + y(g).toFixed(1) + '"/><text class="yl" x="' + (padL - 8) + '" y="' + (y(g) + 4).toFixed(1) + '" text-anchor="end">' + fmt(g, M.unit === "czk1" ? "czk" : M.unit, true) + "</text>";
    var every = Math.ceil(n / (W < 520 ? 4 : 7)), xl = "";
    for (var i = 0; i < n; i += every) xl += '<text class="xl" x="' + x(i).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="' + (i === 0 ? "start" : "middle") + '">' + dm(res.labels[i]) + "</text>";
    box.innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + esc(M.l) + " za posledních " + st.f.range + ' dní; přesné hodnoty jsou v tabulce kampaní">' + grid + xl +
      (prev ? '<path class="prev" d="' + path(prev) + '"/>' : "") + series.map(function (s) { return '<path class="ln" style="stroke:' + s.color + '" d="' + path(s.v) + '"/>'; }).join("") +
      '<line class="cross" id="adsCross" y1="' + padT + '" y2="' + (H - padB) + '" x1="0" x2="0" visibility="hidden"/><g id="adsDots"></g></svg><div class="ac-tip" id="adsTip" hidden></div>';
    var svg = box.querySelector("svg"), cross = box.querySelector("#adsCross"), dots = box.querySelector("#adsDots"), tip = box.querySelector("#adsTip");
    function show(px) {
      var r = svg.getBoundingClientRect(), i = Math.max(0, Math.min(n - 1, Math.round((px - r.left - padL) / (W - padL - padR) * (n - 1))));
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility", "visible");
      dots.innerHTML = series.map(function (s) { return s.v[i] == null ? "" : '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(s.v[i]).toFixed(1) + '" r="4.5" style="fill:' + s.color + '"/>'; }).join("");
      var d = res.labels[i], end = new Date(d.getTime() + (res.bucket - 1) * 864e5);
      tip.innerHTML = "<strong>" + dm(d) + (res.bucket > 1 ? " – " + dm(end) : "") + "</strong>" + series.map(function (s) { return '<span><i style="background:' + s.color + '"></i>' + esc(s.name) + "<b>" + fmt(s.v[i], M.unit) + "</b></span>"; }).join("") +
        (prev ? '<span><i class="dash"></i>Předchozí období<b>' + fmt(prev[i], M.unit) + "</b></span>" : "");
      tip.hidden = false;
      var tw = tip.offsetWidth, left = x(i) + 12; if (left + tw > W - 4) left = x(i) - tw - 12;
      tip.style.left = Math.max(4, left) + "px"; tip.style.top = padT + "px";
    }
    function hide() { cross.setAttribute("visibility", "hidden"); dots.innerHTML = ""; tip.hidden = true; }
    svg.addEventListener("pointermove", function (e) { show(e.clientX); });
    svg.addEventListener("pointerdown", function (e) { show(e.clientX); });
    svg.addEventListener("pointerleave", hide);
  }
  var rz = 0; window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { if (chartArgs && document.getElementById("adsPlot")) drawChart.apply(null, chartArgs); }, 120); });

  // ---------- start ----------
  document.addEventListener("ak:line", function () { if (connected().length) load(); });
  [].forEach.call(document.querySelectorAll('.side-link[data-target="reklama"]'), function (l) { l.addEventListener("click", function () { setTimeout(function () { if (chartArgs && document.getElementById("adsPlot")) drawChart.apply(null, chartArgs); else if (!last) load(); }, 60); }); });
  renderConn(); renderFilters(); load();
})();
