/* =========================================================================
   CashAuto — přepínač řad v administraci (Vše / CashAuto / AgroCash / TechCash)
   Volba se pamatuje v prohlížeči, mění dynamickou barvu a filtruje to, co má u dat
   uvedenou řadu: CRM pipeline, počty fází na Přehledu a řádky tabulek s data-line.
   Sekce bez rozlišení řad dostanou poznámku, že ukazují souhrn.
   Musí se načíst PŘED kanban.js.
   ========================================================================= */
(function () {
  "use strict";
  var KEY = "ak_admin_line";
  var LINES = {
    all:  { label: "Všechny řady", short: "Vše" },
    auto: { label: "CashAuto", short: "CashAuto", color: "#D4F23A", rate: 0.70, fee: 0.04, what: "Osobní a užitková auta",
            noun: { n: "vozidlo", g: "vozidla", a: "vozidlo", i: "vozidlem", l: "vozidle" }, km: "Stav tachometru (km)", plate: "SPZ", vin: "VIN" },
    agro: { label: "AgroCash", short: "AgroCash", color: "#FFC738", rate: 0.65, fee: 0.03, what: "Zemědělská technika",
            noun: { n: "stroj", g: "stroje", a: "stroj", i: "strojem", l: "stroji" }, km: "Motohodiny", plate: "Registrační značka", vin: "Výrobní číslo" },
    tech: { label: "TechCash", short: "TechCash", color: "#FF7A33", rate: 0.65, fee: 0.035, what: "Tahače, návěsy, nákladní vozy",
            noun: { n: "vozidlo", g: "vozidla", a: "vozidlo", i: "vozidlem", l: "vozidle" }, km: "Stav tachometru (km)", plate: "SPZ", vin: "VIN" }
  };
  var cur = "all";
  try { var v = localStorage.getItem(KEY); if (v && LINES[v]) cur = v; } catch (e) { /* výchozí: vše */ }
  var of = function (item) { return item && LINES[item.line] && item.line !== "all" ? item.line : "auto"; };

  function apply() {
    document.body.setAttribute("data-line", cur);
    if (bar) [].forEach.call(bar.querySelectorAll("button[data-line]"), function (b) {
      var on = b.dataset.line === cur; b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    // řádky tabulek s uvedenou řadou
    [].forEach.call(document.querySelectorAll(".app-content tbody"), function (tb) {
      var rows = [].filter.call(tb.rows, function (r) { return r.hasAttribute("data-line"); });
      if (!rows.length) return;
      var shown = 0;
      rows.forEach(function (r) { var ok = cur === "all" || r.getAttribute("data-line") === cur; r.hidden = !ok; if (ok) shown++; });
      var empty = tb.querySelector("tr.line-empty");
      if (!shown) {
        if (!empty) { empty = tb.insertRow(-1); empty.className = "line-empty"; var td = empty.insertCell(0); td.colSpan = 99; }
        empty.cells[0].textContent = "V řadě " + LINES[cur].label + " tu teď nic není.";
        empty.hidden = false;
      } else if (empty) empty.hidden = true;
    });
    // sekce bez rozlišení řad
    [].forEach.call(document.querySelectorAll(".app-content [data-line-note]"), function (n) {
      n.hidden = cur === "all";
      if (cur !== "all") n.querySelector("span").textContent = "Vybraná řada: " + LINES[cur].label + ". Ukázková data v této části nejsou podle řad rozdělená — vidíte souhrn za všechny.";
    });
  }
  function set(line) {
    if (!LINES[line] || line === cur) return;
    cur = line;
    try { localStorage.setItem(KEY, cur); } catch (e) { /* jen do zavření stránky */ }
    apply();
    document.dispatchEvent(new CustomEvent("ak:line", { detail: { line: cur } }));
  }

  // pruh pod horní lištou
  var bar = null, top = document.querySelector(".app-main .topbar");
  if (top) {
    bar = document.createElement("div"); bar.className = "line-bar"; bar.setAttribute("role", "group"); bar.setAttribute("aria-label", "Která řada se zobrazuje");
    bar.innerHTML = '<span class="lb-t">Řada</span>' + ["all", "auto", "agro", "tech"].map(function (k) {
      var L = LINES[k];
      return '<button type="button" data-line="' + k + '" aria-pressed="false"' + (L.what ? ' title="' + L.what + '"' : "") + ">" +
        (L.color ? '<i style="background:' + L.color + '"></i>' : "") + L.short + "</button>";
    }).join("");
    top.parentNode.insertBefore(bar, top.nextSibling);
    bar.addEventListener("click", function (e) { var b = e.target.closest("button[data-line]"); if (b) set(b.dataset.line); });
  }
  // poznámka do sekcí, kde ukázková data řadu nerozlišují
  var NOTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/></svg><span></span>';
  ["dashboard", "report", "segmenty", "scoring", "platby", "rizika", "dokumenty", "compliance"].forEach(function (id) {
    var p = document.getElementById(id); if (!p) return;
    var n = document.createElement("p"); n.className = "line-note"; n.setAttribute("data-line-note", ""); n.hidden = true; n.innerHTML = NOTE;
    var kpi = id === "dashboard" ? document.getElementById("kpiGrid") : null;
    if (kpi) kpi.parentNode.insertBefore(n, kpi.nextSibling); else p.insertBefore(n, p.firstChild);
  });

  window.AKline = { LINES: LINES, get: function () { return cur; }, set: set, of: of, cfg: function (item) { return LINES[of(item)]; }, apply: apply };
  apply();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply);
  window.addEventListener("load", apply);
})();
