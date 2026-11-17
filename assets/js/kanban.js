/* =========================================================================
   CashAuto — CRM pipeline jako kanban s přetahováním (admin.html)
   - přetažení myší, dotykem (podržením karty nebo za úchyt) i klávesnicí (Shift + šipky)
   - tlačítko „Posunout“ na kartě, nabídka „Přesunout do fáze“, krok Zpět
   - hledání, filtr rizika, součty sloupců, detail případu
   Ukázková data z AK.pipeline (data.js); stav se ukládá jen v tomto prohlížeči.
   ========================================================================= */
(function () {
  "use strict";
  var AK = window.AK || {};
  var board = document.getElementById("pipelineBoard");
  if (!board || !AK.pipeline) return;

  var STORE = "ak_pipeline_v4";
  var SHORT = { lead: "Lead", call: "Call", scoring: "Scoring", technik: "Technik", approval: "Schválení", insurance: "Pojištění", done: "Hotovo" };
  // Co je v dané fázi na řadě — odpovídá tabulce „Automatizované workflow“ na Přehledu.
  var NEXT = {
    lead: "Systém případ založil sám. Na řadě je první telefonát s klientem.",
    call: "Ověřte údaje ze žádosti telefonátem (skript je předvyplněný).",
    scoring: "Systém navrhl výkupní cenu. Schvalte rozmezí.",
    technik: "Technik zkontroluje stav vozu podle checklistu v aplikaci.",
    approval: "Právní revize smluv a ceníku, kontrola KYC/AML.",
    insurance: "Zkontrolujte pojistitelnost a převod pojištění.",
    done: "Přepis a podpis jsou hotové. Výplata prochází dvojím schválením."
  };
  var RISK = { low: "nízké", med: "střední", high: "vysoké" };
  var STAGES = AK.pipeline.map(function (c, i) {
    return { key: c.key, n: i + 1, label: String(c.label).replace(/^\d+\s*·\s*/, "").replace(/\s*—\s*hotovo$/i, ""), short: SHORT[c.key] || c.label };
  });
  var stageOf = function (key) { return STAGES.filter(function (s) { return s.key === key; })[0]; };

  var NB = " ";
  var czk = function (n) { return Number(n).toLocaleString("cs-CZ").replace(/\s/g, NB) + NB + "Kč"; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var norm = function (s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var ICO = {
    grip: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="5" cy="3" r="1.5"/><circle cx="11" cy="3" r="1.5"/><circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/><circle cx="5" cy="13" r="1.5"/><circle cx="11" cy="13" r="1.5"/></svg>',
    right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    more: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h.01M12 12h.01M19 12h.01" stroke-width="3.4"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    hand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V11m0-3a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.700L3.500 14a1.500 1.500 0 0 1 2.500-1.600L8 15"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/></svg>'
  };

  // ---------- stav ----------
  function seed() { return AK.pipeline.map(function (c) { return { key: c.key, items: c.items.map(function (x) { return Object.assign({}, x); }) }; }); }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE) || "null");
      if (!s || !Array.isArray(s.cols) || s.cols.length !== STAGES.length) return null;
      if (s.cols.some(function (c, i) { return c.key !== STAGES[i].key || !Array.isArray(c.items); })) return null;
      return s;
    } catch (e) { return null; }
  }
  var saved = load();
  var state = saved ? saved.cols : seed();
  var changed = !!saved;
  var log = (saved && saved.log) || {};
  function save() { try { localStorage.setItem(STORE, JSON.stringify({ cols: state, log: log })); } catch (e) { /* soukromé okno: stav drží jen do zavření stránky */ } }
  function find(id) {
    for (var c = 0; c < state.length; c++) for (var i = 0; i < state[c].items.length; i++) if (state[c].items[i].id === id) return { c: c, i: i, item: state[c].items[i], key: state[c].key };
    return null;
  }
  var listeners = [];
  var filter = { q: "", risk: "all" };
  var L = window.AKline || { get: function () { return "all"; }, of: function () { return "auto"; }, LINES: {} };
  function inLine(it) { var l = L.get(); return l === "all" || L.of(it) === l; }
  function matches(it) {
    if (!inLine(it)) return false;
    if (filter.risk !== "all" && it.risk !== filter.risk) return false;
    if (!filter.q) return true;
    return norm([it.id, it.name, it.ico, it.car, it.channel, it.segment].join(" ")).indexOf(filter.q) >= 0;
  }

  // ---------- kostra nad nástěnkou ----------
  var live = document.createElement("div"); live.className = "sr-live"; live.setAttribute("aria-live", "polite"); document.body.appendChild(live);
  function say(t) { live.textContent = ""; setTimeout(function () { live.textContent = t; }, 30); }

  var toolbar = document.createElement("div"); toolbar.className = "kb-toolbar";
  toolbar.innerHTML =
    '<label class="kb-search">' + ICO.search + '<span class="sr-live">Hledat v pipeline</span>' +
      '<input type="search" id="kbSearch" placeholder="Hledat jméno, IČO, vůz nebo číslo případu" autocomplete="off" enterkeyhint="search" />' +
      '<button type="button" class="kb-clear" aria-label="Vymazat hledání">×</button></label>' +
    '<div class="kb-filters" role="group" aria-label="Filtr rizika">' +
      '<button type="button" class="kb-chip" data-risk="all" aria-pressed="true">Vše</button>' +
      '<button type="button" class="kb-chip" data-risk="low" aria-pressed="false"><span class="rd"></span>Nízké riziko</button>' +
      '<button type="button" class="kb-chip" data-risk="med" aria-pressed="false"><span class="rd med"></span>Střední</button>' +
      '<button type="button" class="kb-chip" data-risk="high" aria-pressed="false"><span class="rd high"></span>Vysoké</button>' +
    '</div>' +
    '<div class="kb-summary" id="kbSummary"></div>' +
    '<button type="button" class="kb-reset" id="kbReset" hidden>Vrátit ukázková data</button>';
  var hint = document.createElement("p"); hint.className = "kb-hint";
  hint.innerHTML = ICO.hand + '<span><span class="only-mouse">Kartu chytněte a přetáhněte do jiné fáze, nebo klikněte na „Dál“. Kliknutím na kartu otevřete celý případ. Z klávesnice: <kbd>Shift</kbd> + <kbd>←</kbd> <kbd>→</kbd>.</span>' +
    '<span class="only-touch">Kartu podržte a přetáhněte, nebo klepněte na „Dál“. Klepnutím otevřete celý případ.</span></span>';
  var stagesBar = document.createElement("div"); stagesBar.className = "kb-stages"; stagesBar.setAttribute("role", "group"); stagesBar.setAttribute("aria-label", "Přejít na fázi");
  board.parentNode.insertBefore(toolbar, board);
  board.parentNode.insertBefore(hint, board);
  board.parentNode.insertBefore(stagesBar, board);
  board.setAttribute("role", "list");
  board.setAttribute("aria-label", "CRM pipeline, 7 fází");

  // ---------- vykreslení ----------
  function cardHTML(it, st) {
    var prev = STAGES[st.n - 2], next = STAGES[st.n];
    var aria = it.id + ", " + it.name + ", " + it.car + ", výkupní cena " + czk(it.vykup) + ", fáze " + st.n + " " + st.label;
    return '<div class="kb-card' + (matches(it) ? "" : " hidden") + '" tabindex="0" role="listitem" data-id="' + esc(it.id) + '" aria-label="' + esc(aria) + '">' +
      '<div class="kb-top"><span class="rd ' + esc(it.risk) + '" title="Riziko: ' + (RISK[it.risk] || "") + '"></span><span class="kb-id">' + esc(it.id) + '</span>' +
        '<span class="kb-line" data-l="' + L.of(it) + '">' + esc((L.LINES[L.of(it)] || {}).short || "") + '</span>' +
        '<span class="kb-seg" title="Segment nebo typ">' + esc(it.segment) + '</span>' +
        '<button type="button" class="kb-grip" tabindex="-1" aria-hidden="true" title="Přetáhnout">' + ICO.grip + '</button></div>' +
      '<div class="kb-name">' + esc(it.name) + '</div>' +
      '<div class="kb-car">' + esc(it.car) + ' · ' + esc(it.channel) + '</div>' +
      '<div class="kb-money"><span class="v">' + czk(it.vykup) + '</span><span class="f">poplatek ' + czk(it.fee) + '/měs</span></div>' +
      '<div class="kb-actions">' +
        '<button type="button" class="kb-prev" ' + (prev ? 'aria-label="Vrátit do fáze ' + prev.n + ' ' + esc(prev.label) + '" title="Vrátit: ' + esc(prev.short) + '"' : "disabled aria-label=\"Není kam vrátit\"") + '>' + ICO.left + '</button>' +
        (next ? '<button type="button" class="kb-next" aria-label="Posunout do fáze ' + next.n + ' ' + esc(next.label) + '">Dál: ' + esc(next.short) + ICO.right + '</button>'
              : '<span class="kb-doneflag">' + ICO.check + 'Hotovo</span>') +
        '<button type="button" class="kb-more" aria-haspopup="menu" aria-label="Přesunout do jiné fáze" title="Přesunout do fáze…">' + ICO.more + '</button>' +
      '</div></div>';
  }
  function render(focusId) {
    board.innerHTML = state.map(function (col, ci) {
      var st = STAGES[ci];
      return '<section class="kanban-col" data-key="' + st.key + '" aria-label="Fáze ' + st.n + ' ' + esc(st.label) + '">' +
        '<div class="col-head"><span class="col-n">' + st.n + '</span><span class="col-t" title="' + esc(st.label) + '">' + esc(st.label) + '</span><span class="col-c"></span><span class="col-sum"></span></div>' +
        '<div class="col-list">' + col.items.map(function (it) { return cardHTML(it, st); }).join("") + '</div>' +
        '<div class="col-empty">Sem přetáhněte případ</div></section>';
    }).join("");
    refresh();
    if (focusId) { var el = cardEl(focusId); if (el) el.focus({ preventScroll: true }); }
  }
  function cardEl(id) { return board.querySelector('.kb-card[data-id="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]'); }

  // počty, součty, souhrn, přepínač fází, přehled na úvodní obrazovce, odznak v menu
  function refresh() {
    var total = 0, shown = 0, sum = 0, active = 0, filtering = filter.q || filter.risk !== "all", line = L.get();
    state.forEach(function (col, ci) {
      var el = board.children[ci]; if (!el) return;
      var vis = col.items.filter(matches), s = vis.reduce(function (a, b) { return a + b.vykup; }, 0);
      var mine = col.items.filter(inLine);
      total += mine.length; shown += vis.length; sum += s;
      if (col.key !== "done") active += mine.length;
      el.querySelector(".col-c").textContent = filtering ? vis.length + "/" + mine.length : mine.length;
      el.querySelector(".col-sum").textContent = vis.length ? "výkup celkem " + czk(s) : "";
      el.classList.toggle("is-empty", vis.length === 0);
      el.querySelector(".col-empty").textContent = mine.length && !vis.length ? "Nic neodpovídá filtru" : "Sem přetáhněte případ";
    });
    document.getElementById("kbSummary").innerHTML = (line !== "all" ? esc(L.LINES[line].label) + " · " : "") + (filtering ? "Zobrazeno <strong>" + shown + "</strong> z " + total : "<strong>" + total + "</strong> případů") + " · výkup celkem <strong>" + czk(sum) + "</strong>";
    document.getElementById("kbReset").hidden = !changed;
    var cur = stagesBar.querySelector('[aria-current="true"]'), curKey = cur ? cur.dataset.key : STAGES[0].key;
    var chips = function (cls) {
      return STAGES.map(function (st, i) {
        var n = state[i].items.filter(inLine).length;
        return '<button type="button" data-key="' + st.key + '"' + (cls === "bar" && st.key === curKey ? ' aria-current="true"' : "") + ' aria-label="Fáze ' + st.n + " " + esc(st.label) + ", " + n + ' případů"><span class="n">' + st.n + "</span>" + esc(st.short) +
          '<span class="c' + (n ? "" : " zero") + '">' + n + "</span></button>";
      }).join("");
    };
    stagesBar.innerHTML = chips("bar");
    var flow = document.getElementById("stageFlow"); if (flow) flow.innerHTML = chips("flow");
    var link = document.querySelector('.side-link[data-target="pipeline"]');
    if (link) {
      var b = link.querySelector(".badge-count"); if (b && b.textContent !== String(active)) b.textContent = active;
      link.setAttribute("aria-label", "CRM pipeline (7 fází), " + active + " aktivních případů" + (line !== "all" ? " v řadě " + L.LINES[line].label : ""));
    }
  }
  function applyFilter() {
    state.forEach(function (col) { col.items.forEach(function (it) { var el = cardEl(it.id); if (el) el.classList.toggle("hidden", !matches(it)); }); });
    refresh();
  }

  // ---------- přesun ----------
  function toast(msg, undo) {
    var wrap = document.querySelector(".toast-wrap");
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
    [].forEach.call(wrap.querySelectorAll(".toast.has-action"), function (t) { t.remove(); });
    var t = document.createElement("div"); t.className = "toast" + (undo ? " has-action" : ""); t.setAttribute("role", "status");
    t.innerHTML = '<span class="ico">' + ICO.check.replace("<svg", '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"') + "</span><span></span>";
    t.querySelector("span:last-child").textContent = msg;
    if (undo) {
      var b = document.createElement("button"); b.type = "button"; b.className = "toast-undo"; b.textContent = "Zpět";
      b.addEventListener("click", function () { t.remove(); undo(); });
      t.appendChild(b);
    }
    wrap.appendChild(t);
    setTimeout(function () { t.style.transition = "opacity .3s"; t.style.opacity = "0"; }, undo ? 5600 : 2600);
    setTimeout(function () { t.remove(); }, undo ? 6000 : 3000);
  }
  function moveTo(id, toKey, toIdx, opts) {
    opts = opts || {};
    var f = find(id); if (!f) return false;
    var tc = STAGES.map(function (s) { return s.key; }).indexOf(toKey); if (tc < 0) return false;
    var from = { key: f.key, i: f.i };
    state[f.c].items.splice(f.i, 1);
    var list = state[tc].items;
    if (toIdx == null || toIdx > list.length) toIdx = list.length;
    if (toIdx < 0) toIdx = 0;
    list.splice(toIdx, 0, f.item);
    if (from.key === toKey && from.i === toIdx) { render(opts.focus ? id : null); return false; }
    changed = true;
    var a = stageOf(from.key), b = stageOf(toKey);
    if (from.key !== toKey && !opts.isUndo) {
      (log[id] = log[id] || []).unshift({ t: new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }), from: a.label, to: b.label });
      if (log[id].length > 8) log[id].length = 8;
    } else if (opts.isUndo && log[id]) log[id].shift();
    if (from.key !== toKey) listeners.forEach(function (fn) { try { fn(f.item, from.key, toKey, !!opts.isUndo); } catch (err) { /* automatizace nesmí zablokovat přesun */ } });
    save();
    render(opts.focus ? id : null);
    var el = cardEl(id);
    if (el) { el.classList.add("just-moved"); setTimeout(function () { el.classList.remove("just-moved"); }, 600); if (opts.reveal) el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" }); }
    if (sheetId === id) fillSheet(id);
    if (from.key !== toKey) {
      var msg = f.item.name.split(" — ")[0] + ": " + b.n + " · " + b.label;
      say(f.item.id + " přesunuto do fáze " + b.n + " " + b.label);
      if (!opts.isUndo) toast(msg, function () { moveTo(id, from.key, from.i, { isUndo: true, focus: true, reveal: true }); });
      else toast("Vráceno: " + a.n + " · " + a.label);
    } else say(f.item.id + " přeřazeno ve fázi " + b.label);
    return true;
  }
  function step(id, dir, opts) {
    var f = find(id); if (!f) return;
    var t = STAGES[f.c + dir]; if (!t) return;
    moveTo(id, t.key, 0, Object.assign({ focus: true, reveal: true }, opts || {}));
  }

  // ---------- nabídka „Přesunout do fáze“ ----------
  var menu = null;
  function closeMenu(refocus) { if (!menu) return; var o = menu._opener; menu.remove(); menu = null; if (refocus && o && document.body.contains(o)) o.focus(); }
  function openMenu(btn, id) {
    closeMenu();
    var f = find(id); if (!f) return;
    menu = document.createElement("div"); menu.className = "kb-menu"; menu.setAttribute("role", "menu"); menu._opener = btn;
    menu.innerHTML = '<div class="kb-menu-t">Přesunout do fáze</div>' + STAGES.map(function (s) {
      return '<button type="button" role="menuitem" data-key="' + s.key + '"' + (s.key === f.key ? ' aria-current="true"' : "") + '><span class="n">' + s.n + "</span>" + esc(s.label) + "</button>";
    }).join("");
    document.body.appendChild(menu);
    var r = btn.getBoundingClientRect(), mw = menu.offsetWidth, mh = menu.offsetHeight;
    var x = Math.min(Math.max(12, r.right - mw), window.innerWidth - mw - 12);
    var y = r.bottom + 6; if (y + mh > window.innerHeight - 12) y = Math.max(12, r.top - mh - 6);
    menu.style.left = x + "px"; menu.style.top = y + "px";
    menu.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-key]"); if (!b) return;
      closeMenu(); if (b.dataset.key !== f.key) moveTo(id, b.dataset.key, 0, { focus: true, reveal: true });
    });
    menu.addEventListener("keydown", function (e) {
      var its = [].slice.call(menu.querySelectorAll("button")), i = its.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); its[(i + 1) % its.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); its[(i - 1 + its.length) % its.length].focus(); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeMenu(true); }
      else if (e.key === "Tab") closeMenu();
    });
    (menu.querySelector('[aria-current="true"]') || menu.querySelector("button")).focus();
  }
  document.addEventListener("pointerdown", function (e) { if (menu && !menu.contains(e.target) && !e.target.closest(".kb-more")) closeMenu(); }, true);
  window.addEventListener("scroll", function () { closeMenu(); }, { passive: true });
  window.addEventListener("resize", function () { closeMenu(); });

  // ---------- detail případu ----------
  var sheetId = null, sheetReturn = null;
  var backdrop = document.createElement("div"); backdrop.className = "sheet-backdrop";
  var sheet = document.createElement("aside"); sheet.className = "sheet"; sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true"); sheet.setAttribute("aria-labelledby", "shTitle");
  sheet.innerHTML = '<div class="sheet-head"><div><div class="sh-id" id="shId"></div><h2 id="shTitle"></h2><div class="sh-sub" id="shSub"></div></div>' +
    '<button type="button" class="sheet-close" aria-label="Zavřít detail">×</button></div><div class="sheet-body" id="shBody"></div><div class="sheet-foot" id="shFoot"></div>';
  document.body.appendChild(backdrop); document.body.appendChild(sheet);
  function fillSheet(id) {
    var f = find(id); if (!f) { closeSheet(); return; }
    if (window.AKcase && window.AKcase.fill(id) !== false) return;
    var it = f.item, st = STAGES[f.c], prev = STAGES[f.c - 1], next = STAGES[f.c + 1];
    document.getElementById("shId").textContent = it.id + " · fáze " + st.n + " z " + STAGES.length;
    document.getElementById("shTitle").textContent = it.name;
    document.getElementById("shSub").textContent = it.car + (it.ico ? " · IČO " + it.ico : "");
    var hist = (log[id] || []).map(function (h) { return "<li>" + esc(h.t) + " · " + esc(h.from) + " → <strong>" + esc(h.to) + "</strong></li>"; }).join("");
    document.getElementById("shBody").innerHTML =
      '<div class="sheet-sec"><div class="sh-next">' + ICO.info + "<span><strong>" + esc(st.label) + ".</strong> " + esc(NEXT[st.key] || "") + "</span></div></div>" +
      '<div class="sheet-sec"><h3>Tři čísla případu</h3><div class="sh-three">' +
        "<div><span>Výkupní cena</span><strong>" + czk(it.vykup) + "</strong></div>" +
        "<div><span>Měsíční rezervační poplatek</span><strong>" + czk(it.fee) + "</strong></div>" +
        "<div><span>Cena zpětného odkupu</span><strong>" + czk(it.vykup) + "</strong></div></div></div>" +
      '<div class="sheet-sec"><h3>Případ</h3><dl class="sh-kv">' +
        "<dt>Vozidlo</dt><dd>" + esc(it.car) + "</dd>" + (it.ico ? "<dt>IČO</dt><dd>" + esc(it.ico) + "</dd>" : "") +
        "<dt>Segment vozu</dt><dd>" + esc(it.segment) + "</dd><dt>Kanál</dt><dd>" + esc(it.channel) + "</dd>" +
        '<dt>Riziko</dt><dd><span class="rd ' + esc(it.risk) + '" style="display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px"></span>' + (RISK[it.risk] || "") + "</dd></dl></div>" +
      '<div class="sheet-sec"><h3>Přesunout do fáze</h3><ul class="sh-stages">' + STAGES.map(function (s, i) {
        return '<li><button type="button" data-key="' + s.key + '" class="' + (i < f.c ? "is-past" : "") + '"' + (i === f.c ? ' aria-current="true"' : "") + '><span class="n">' + s.n + "</span>" + esc(s.label) + (i === f.c ? '<span class="here">tady je teď</span>' : "") + "</button></li>";
      }).join("") + "</ul></div>" +
      (hist ? '<div class="sheet-sec"><h3>Přesuny v tomto prohlížeči</h3><ul class="sh-log">' + hist + "</ul></div>" : "");
    document.getElementById("shFoot").innerHTML =
      (prev ? '<button type="button" class="btn btn-ghost" data-step="-1">' + "← " + esc(prev.short) + "</button>" : "") +
      (next ? '<button type="button" class="btn btn-primary" data-step="1">Posunout: ' + esc(next.short) + " →</button>" : '<button type="button" class="btn btn-primary" data-close>Zavřít</button>');
  }
  function openSheet(id, opener) {
    sheetId = id; sheetReturn = opener || document.activeElement;
    if (window.AKcase && window.AKcase.reset) window.AKcase.reset(id);
    sheet.classList.toggle("wide", !!window.AKcase); fillSheet(id);
    sheet.classList.add("on"); backdrop.classList.add("on"); document.body.classList.add("drawer-open");
    setTimeout(function () { sheet.querySelector(".sheet-close").focus({ preventScroll: true }); }, 40);
  }
  function closeSheet() {
    if (!sheetId) return;
    var id = sheetId; sheetId = null;
    sheet.classList.remove("on"); backdrop.classList.remove("on"); document.body.classList.remove("drawer-open");
    var el = cardEl(id) || sheetReturn; if (el && document.body.contains(el)) el.focus({ preventScroll: true });
  }
  backdrop.addEventListener("click", closeSheet);
  sheet.addEventListener("click", function (e) {
    if (e.target.closest(".sheet-close, [data-close]")) return closeSheet();
    var s = e.target.closest("[data-step]"); if (s) return step(sheetId, +s.dataset.step, { focus: false, reveal: true });
    var b = e.target.closest(".sh-stages button"); if (b && !b.hasAttribute("aria-current")) moveTo(sheetId, b.dataset.key, 0, { reveal: true });
  });
  sheet.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { e.preventDefault(); if (window.AKcase && window.AKcase.back && window.AKcase.back()) return; closeSheet(); return; }
    if (e.key !== "Tab") return;
    var f = [].slice.call(sheet.querySelectorAll("button, a[href], input, select, textarea")).filter(function (x) { return !x.disabled && x.offsetParent !== null; });
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });

  // ---------- klik a klávesnice na nástěnce ----------
  var suppressClick = false;
  board.addEventListener("click", function (e) {
    if (suppressClick) { e.preventDefault(); e.stopPropagation(); return; }
    var card = e.target.closest(".kb-card"); if (!card) return;
    var id = card.dataset.id;
    if (e.target.closest(".kb-next")) return step(id, 1);
    if (e.target.closest(".kb-prev")) return step(id, -1);
    var m = e.target.closest(".kb-more"); if (m) return openMenu(m, id);
    if (e.target.closest(".kb-grip")) return;
    openSheet(id, card);
  });
  board.addEventListener("keydown", function (e) {
    var card = e.target.closest(".kb-card"); if (!card || e.target !== card) return;
    var id = card.dataset.id, f = find(id); if (!f) return;
    var col = card.closest(".kanban-col");
    var vis = function (c) { return [].slice.call(c.querySelectorAll(".kb-card:not(.hidden)")); };
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openSheet(id, card); }
    else if (e.shiftKey && (e.key === "ArrowRight" || e.key === "ArrowLeft")) { e.preventDefault(); step(id, e.key === "ArrowRight" ? 1 : -1); }
    else if (e.shiftKey && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault(); var ni = f.i + (e.key === "ArrowDown" ? 1 : -1);
      if (ni >= 0 && ni < state[f.c].items.length) moveTo(id, f.key, ni, { focus: true });
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      var l = vis(col), i = l.indexOf(card) + (e.key === "ArrowDown" ? 1 : -1);
      if (l[i]) { e.preventDefault(); l[i].focus(); }
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      var c = col; do { c = e.key === "ArrowRight" ? c.nextElementSibling : c.previousElementSibling; } while (c && !vis(c).length);
      if (c) { e.preventDefault(); var t = vis(c)[0]; t.focus({ preventScroll: true }); t.scrollIntoView({ block: "nearest", inline: "nearest" }); }
    }
  });

  // ---------- přetahování (ukazatel: myš, dotyk, pero) ----------
  var pend = null, drag = null, lpTimer = 0, raf = 0;
  function clearPend() { clearTimeout(lpTimer); if (pend && pend.card) pend.card.classList.remove("is-held"); pend = null; }
  board.addEventListener("pointerdown", function (e) {
    if (drag || (e.pointerType === "mouse" && e.button !== 0)) return;
    var card = e.target.closest(".kb-card"); if (!card) return;
    var grip = !!e.target.closest(".kb-grip");
    if (!grip && e.target.closest("button, a, input, select")) return;
    var p = pend = { card: card, pid: e.pointerId, x: e.clientX, y: e.clientY, touch: e.pointerType !== "mouse", grip: grip };
    if (p.touch && !grip) {
      lpTimer = setTimeout(function () {
        if (pend !== p) return;
        if (navigator.vibrate) { try { navigator.vibrate(10); } catch (err) { /* bez vibrace */ } }
        begin(p, p.x, p.y);
      }, 280);
      card.classList.add("is-held");
    }
  });
  window.addEventListener("pointermove", function (e) {
    if (drag) { if (e.pointerId === drag.pid) { drag.x = e.clientX; drag.y = e.clientY; place(); } return; }
    if (!pend || e.pointerId !== pend.pid) return;
    var d = Math.hypot(e.clientX - pend.x, e.clientY - pend.y);
    if (pend.touch && !pend.grip) { if (d > 10) clearPend(); return; }      // prst se pohnul dřív, než karta „chytla“ → je to posun stránky
    if (d > 6) begin(pend, e.clientX, e.clientY);
  });
  window.addEventListener("pointerup", function (e) { if (drag && e.pointerId === drag.pid) finish(true); else clearPend(); });
  window.addEventListener("pointercancel", function (e) { if (drag && e.pointerId === drag.pid) finish(false); else clearPend(); });
  window.addEventListener("blur", function () { if (drag) finish(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drag) { e.preventDefault(); finish(false); } });
  // trvale zaregistrováno kvůli Safari: během tažení nesmí stránka rolovat pod prstem
  document.addEventListener("touchmove", function (e) { if (drag && e.cancelable) e.preventDefault(); }, { passive: false });
  board.addEventListener("contextmenu", function (e) { if (pend || drag) e.preventDefault(); });
  board.addEventListener("dragstart", function (e) { e.preventDefault(); });

  function begin(p, x, y) {
    clearTimeout(lpTimer); pend = null; closeMenu();
    var card = p.card, r = card.getBoundingClientRect();
    card.classList.remove("is-held");
    var ghost = card.cloneNode(true);
    ghost.classList.add("kb-ghost"); ghost.removeAttribute("tabindex"); ghost.setAttribute("aria-hidden", "true");
    ghost.style.width = r.width + "px"; ghost.style.height = r.height + "px";
    document.body.appendChild(ghost);
    drag = { card: card, ghost: ghost, pid: p.pid, ox: x - r.left, oy: y - r.top, x: x, y: y, id: card.dataset.id,
             fromList: card.parentNode, fromNext: card.nextElementSibling, over: null };
    card.classList.add("is-placeholder");
    document.body.classList.add("kb-dragging");
    say("Držíte případ " + drag.id + ". Přetáhněte ho do jiné fáze, Escape přetažení zruší.");
    place(); tick();
  }
  function place() {
    if (!drag) return;
    drag.ghost.style.transform = "translate3d(" + (drag.x - drag.ox) + "px," + (drag.y - drag.oy) + "px,0) rotate(2deg)";
    var cols = board.children, target = null, best = Infinity;
    for (var i = 0; i < cols.length; i++) {
      var r = cols[i].getBoundingClientRect();
      if (r.right < 0 || r.left > window.innerWidth) continue;
      var d = drag.x < r.left ? r.left - drag.x : drag.x > r.right ? drag.x - r.right : 0;
      if (d < best) { best = d; target = cols[i]; }
    }
    if (!target || best > 80) return;
    if (drag.over !== target) { if (drag.over) drag.over.classList.remove("is-over"); target.classList.add("is-over"); drag.over = target; }
    var list = target.querySelector(".col-list"), before = null;
    var cards = list.querySelectorAll(".kb-card:not(.hidden)");
    for (var j = 0; j < cards.length; j++) {
      if (cards[j] === drag.card) continue;
      var cr = cards[j].getBoundingClientRect();
      if (drag.y < cr.top + cr.height / 2) { before = cards[j]; break; }
    }
    if (drag.card.parentNode !== list || drag.card.nextElementSibling !== before) {
      if (before !== drag.card) list.insertBefore(drag.card, before);
      [].forEach.call(board.children, function (c) { c.classList.toggle("is-empty", !c.querySelector(".kb-card:not(.hidden)")); });
    }
  }
  function tick() {
    if (!drag) return;
    var br = board.getBoundingClientRect(), edge = 64, vx = 0, vy = 0;
    if (drag.x < br.left + edge) vx = -Math.ceil((br.left + edge - drag.x) / 4);
    else if (drag.x > Math.min(br.right, window.innerWidth) - edge) vx = Math.ceil((drag.x - (Math.min(br.right, window.innerWidth) - edge)) / 4);
    var bottom = window.innerHeight - (document.body.classList.contains("has-bottom-nav") && window.innerWidth <= 860 ? 70 : 0);
    if (drag.y < 96) vy = -Math.ceil((96 - drag.y) / 5); else if (drag.y > bottom - 70) vy = Math.ceil((drag.y - (bottom - 70)) / 5);
    vx = Math.max(-22, Math.min(22, vx)); vy = Math.max(-18, Math.min(18, vy));
    if (vx) board.scrollLeft += vx;
    if (vy) window.scrollBy(0, vy);
    if (vx || vy) place();
    raf = requestAnimationFrame(tick);
  }
  function finish(commit) {
    if (!drag) return;
    var d = drag; drag = null; cancelAnimationFrame(raf);
    d.ghost.remove(); d.card.classList.remove("is-placeholder");
    if (d.over) d.over.classList.remove("is-over");
    document.body.classList.remove("kb-dragging");
    suppressClick = true; setTimeout(function () { suppressClick = false; }, 60);
    var col = d.card.closest(".kanban-col"), list = d.card.parentNode;
    var idx = [].indexOf.call(list.querySelectorAll(".kb-card"), d.card);
    if (!commit || !col) { d.fromList.insertBefore(d.card, d.fromNext); render(d.id); say("Přetažení zrušeno."); return; }
    if (!moveTo(d.id, col.dataset.key, idx, { focus: true })) render(d.id);
  }

  // ---------- ovládací prvky ----------
  var search = document.getElementById("kbSearch"), sWrap = search.closest(".kb-search"), st = 0;
  search.addEventListener("input", function () {
    clearTimeout(st); st = setTimeout(function () { filter.q = norm(search.value.trim()); sWrap.classList.toggle("has-q", !!search.value); applyFilter(); }, 90);
  });
  sWrap.querySelector(".kb-clear").addEventListener("click", function () { search.value = ""; filter.q = ""; sWrap.classList.remove("has-q"); applyFilter(); search.focus(); });
  toolbar.querySelector(".kb-filters").addEventListener("click", function (e) {
    var b = e.target.closest(".kb-chip"); if (!b) return;
    filter.risk = b.dataset.risk;
    [].forEach.call(toolbar.querySelectorAll(".kb-chip"), function (c) { c.setAttribute("aria-pressed", c === b ? "true" : "false"); });
    applyFilter();
  });
  document.getElementById("kbReset").addEventListener("click", function () {
    state = seed(); log = {}; changed = false;
    try { localStorage.removeItem(STORE); } catch (e) { /* nic */ }
    render(); toast("Ukázková data jsou zpět ve výchozím stavu");
  });

  function goStage(key, smooth) {
    var col = board.querySelector('.kanban-col[data-key="' + key + '"]'); if (!col) return;
    board.scrollTo({ left: col.offsetLeft - board.offsetLeft - 2, behavior: smooth === false ? "auto" : "smooth" });
  }
  stagesBar.addEventListener("click", function (e) { var b = e.target.closest("button[data-key]"); if (b) goStage(b.dataset.key); });
  var sr = 0;
  board.addEventListener("scroll", function () {
    if (sr) return;
    sr = requestAnimationFrame(function () {
      sr = 0; var x = board.scrollLeft + 24, key = STAGES[0].key;
      [].forEach.call(board.children, function (c) { if (c.offsetLeft - board.offsetLeft <= x) key = c.dataset.key; });
      if (board.scrollLeft + board.clientWidth >= board.scrollWidth - 4) key = STAGES[STAGES.length - 1].key;
      [].forEach.call(stagesBar.children, function (b) {
        var on = b.dataset.key === key;
        if (on) { b.setAttribute("aria-current", "true"); if (stagesBar.scrollWidth > stagesBar.clientWidth) stagesBar.scrollTo({ left: b.offsetLeft - stagesBar.clientWidth / 2 + b.offsetWidth / 2, behavior: "smooth" }); }
        else b.removeAttribute("aria-current");
      });
    });
  }, { passive: true });
  var flow = document.getElementById("stageFlow");
  if (flow) flow.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-key]"); if (!b) return;
    var link = document.querySelector('.side-link[data-target="pipeline"]'); if (link) link.click();
    setTimeout(function () { goStage(b.dataset.key, false); }, 60);
  });

  document.addEventListener("ak:line", function () { applyFilter(); });
  render();
  // otevření případu odjinud (např. z tabulky Žádosti): <button data-open-case="AK-5081">
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-open-case]"); if (!b) return;
    e.preventDefault(); if (find(b.getAttribute("data-open-case"))) openSheet(b.getAttribute("data-open-case"), b);
  });

  window.AKkanban = {
    STAGES: STAGES, NEXT: NEXT, RISK: RISK, ICO: ICO, czk: czk, esc: esc,
    find: find, moveTo: moveTo, step: step, toast: toast, say: say,
    open: openSheet, close: closeSheet, current: function () { return sheetId; },
    sheet: sheet, state: function () { return state; },
    onMove: function (fn) { listeners.push(fn); },
    touch: function (id) { changed = true; save(); var a = document.activeElement, inSheet = sheet.contains(a); render(); if (!inSheet && id) { var el = cardEl(id); if (el && !sheetId) el.focus({ preventScroll: true }); } },
    reset: function () { document.getElementById("kbReset").click(); }
  };
})();
