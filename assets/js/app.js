/* =========================================================================
   AutoKapitál — Shared app logic (dočasný výkup vozu se zpětným odkupem)
   Formatting, toast, tabs, sidebar, výkup calculators, wizard, FAQ.
   Model: výkupní cena = 70 % odhadní hodnoty; měsíční rezervační poplatek = 4 %
   z hodnoty vozu; cena zpětného odkupu = výkupní cena (podle smlouvy).
   NENÍ úvěr — žádné RPSN, úroky ani splátky.
   ========================================================================= */
(function () {
  "use strict";
  const AK = (window.AK = window.AK || {});

  // ---------- Formatting ----------
  AK.fmt = {
    czk(n) { return Math.round(n).toLocaleString("cs-CZ").replace(/ /g, " ") + " Kč"; },
    num(n) { return Math.round(n).toLocaleString("cs-CZ").replace(/ /g, " "); },
    pct(n) { return Math.round(n) + " %"; },
  };
  const round = (n, to) => Math.round(n / to) * to;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  // ---------- Toast ----------
  AK.toast = function (msg) {
    let wrap = document.querySelector(".toast-wrap");
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = '<span class="ico">' + (AK.icon ? AK.icon("check") : "✓") + "</span><span></span>";
    t.querySelector("span:last-child").textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity .3s"; }, 2600);
    setTimeout(() => t.remove(), 3000);
  };

  // ---------- Výkup engine ----------
  const VYKUP_RATE = 0.70;   // výkupní cena = 70 % odhadní hodnoty
  const FEE_RATE = 0.04;     // měsíční rezervační poplatek = 4 % z hodnoty vozu
  const COND_FACTOR = { vyborny: 1.0, dobry: 0.93, prumerny: 0.84, horsi: 0.72 };
  const SEGMENT_MAP = {
    "hatchback": "Malé / hatchback", "male": "Malé / hatchback",
    "kombi": "Střední třída / kombi", "stredni": "Střední třída / kombi",
    "suv": "SUV",
    "mpv": "Rodinné MPV / van", "van": "Rodinné MPV / van",
    "premium": "Prémiové / vyšší třída", "premiove": "Prémiové / vyšší třída",
  };

  AK.valuation = {
    VYKUP_RATE, FEE_RATE,
    resolveSegment(s) { return (AK.segmentBase && AK.segmentBase[s]) ? s : (SEGMENT_MAP[s] || "Střední třída / kombi"); },
    estimateMarketValue({ segment, year, mileage, condition }) {
      const seg = this.resolveSegment(segment);
      const base = (AK.segmentBase && AK.segmentBase[seg]) || 560000;
      const age = Math.max(0, 2026 - (year || 2018));
      const ageFactor = Math.pow(0.88, age);
      const mileageFactor = clamp(1 - (mileage || 100000) / 280000, 0.45, 1);
      const condFactor = COND_FACTOR[condition] || 0.9;
      return round(base * ageFactor * mileageFactor * condFactor, 5000);
    },
    // Dočasný výkup: výkupní cena + měsíční rezervační poplatek. Cena zpětného odkupu = výkupní cena.
    buildOffer({ marketValue, encumbered }) {
      let vykup = marketValue * VYKUP_RATE;
      if (encumbered) vykup *= 0.9;
      vykup = round(vykup, 5000);
      const fee = round(marketValue * FEE_RATE, 100);
      return {
        marketValue, vykup, fee, buyback: vykup,
        fee1: fee, fee3: fee * 3, fee6: fee * 6, fee12: fee * 12,
      };
    },
    feeForMonths(marketValue, months) { return round(marketValue * FEE_RATE, 100) * (months || 1); },
  };

  // ---------- Tabs ----------
  AK.initTabs = function (root) {
    (root || document).querySelectorAll("[data-tabs]").forEach(group => {
      const tabs = group.querySelectorAll(".tab");
      tabs.forEach(tab => tab.addEventListener("click", () => {
        const target = tab.getAttribute("data-target");
        const scope = group.getAttribute("data-tabs") === "self" ? group.parentElement : document;
        tabs.forEach(t => t.classList.toggle("active", t === tab));
        scope.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.id === target));
        if (history.replaceState) history.replaceState(null, "", "#" + target);
      }));
    });
    const hash = location.hash.replace("#", "");
    if (hash) { const t = document.querySelector('.tab[data-target="' + hash + '"]'); if (t) t.click(); }
  };

  // ---------- Sidebar + side-nav panel switching ----------
  AK.initSidebar = function () {
    const sb = document.querySelector(".sidebar");
    document.querySelectorAll("[data-sidebar-toggle]").forEach(btn =>
      btn.addEventListener("click", () => sb && sb.classList.toggle("open")));
    const links = [...document.querySelectorAll(".side-link[data-target]")];
    const title = document.getElementById("appTitle");
    const activate = (link) => {
      const target = link.getAttribute("data-target");
      links.forEach(l => l.classList.toggle("active", l === link));
      document.querySelectorAll(".app-content .tab-panel").forEach(p => p.classList.toggle("active", p.id === target));
      if (title && link.dataset.title) title.textContent = link.dataset.title;
      if (history.replaceState) history.replaceState(null, "", "#" + target);
      if (window.innerWidth <= 860 && sb) sb.classList.remove("open");
      window.scrollTo({ top: 0 });
    };
    links.forEach(l => l.addEventListener("click", e => { e.preventDefault(); activate(l); }));
    document.querySelectorAll(".side-link:not([data-target])").forEach(l =>
      l.addEventListener("click", () => { if (window.innerWidth <= 860 && sb) sb.classList.remove("open"); }));
    if (links.length) {
      const hash = location.hash.replace("#", "");
      const initial = links.find(l => l.getAttribute("data-target") === hash) || links[0];
      activate(initial);
    }
  };

  // ---------- Hero calculator (odhad hodnoty → výkupní nabídka + rezervační poplatek) ----------
  AK.initHeroCalc = function () {
    const range = document.getElementById("heroRange");
    if (!range) return;
    const elValue = document.getElementById("heroValue");
    const elAmount = document.getElementById("heroAmount");   // výkupní nabídka
    const elFee = document.getElementById("heroFee");         // měsíční rezervační poplatek
    const elBuyback = document.getElementById("heroBuyback"); // cena zpětného odkupu
    function render() {
      const value = +range.value;
      const o = AK.valuation.buildOffer({ marketValue: value });
      if (elValue) elValue.textContent = AK.fmt.czk(value);
      if (elAmount) elAmount.textContent = AK.fmt.czk(o.vykup);
      if (elFee) elFee.textContent = AK.fmt.czk(o.fee) + " / měsíc";
      if (elBuyback) elBuyback.textContent = AK.fmt.czk(o.buyback);
    }
    range.addEventListener("input", render);
    render();
  };

  // ---------- Section 05 big calculator ----------
  AK.initBigCalc = function () {
    const valEl = document.getElementById("bigValue");        // odhad hodnoty (input or range)
    if (!valEl) return;
    const elAmount = document.getElementById("bigAmount");    // výkupní nabídka
    const elFee = document.getElementById("bigFee");          // měsíční rezervační poplatek
    const elTerm = document.getElementById("bigTerm");        // doba (měsíce)
    const elPeriod = document.getElementById("bigPeriod");    // poplatek za zvolenou dobu
    const elBuyback = document.getElementById("bigBuyback");  // cena zpětného odkupu
    function render() {
      const value = +valEl.value || 300000;
      const o = AK.valuation.buildOffer({ marketValue: value });
      const months = +(elTerm && elTerm.value) || 3;
      if (elAmount) elAmount.textContent = AK.fmt.czk(o.vykup);
      if (elFee) elFee.textContent = AK.fmt.czk(o.fee);
      if (elPeriod) elPeriod.textContent = AK.fmt.czk(o.fee * months);
      if (elBuyback) elBuyback.textContent = AK.fmt.czk(o.buyback);
    }
    valEl.addEventListener("input", render);
    if (elTerm) elTerm.addEventListener("input", render);
    render();
  };

  // ---------- FAQ accordion ----------
  AK.initFaq = function () {
    document.querySelectorAll(".faq-item .faq-q").forEach(q => {
      q.setAttribute("aria-expanded", "false");
      q.addEventListener("click", () => {
        const item = q.closest(".faq-item");
        const open = item.classList.toggle("open");
        q.setAttribute("aria-expanded", String(open));
      });
    });
  };

  // ---------- Multi-step wizard (zadost.html) ----------
  AK.initWizard = function () {
    const wiz = document.querySelector("[data-wizard]");
    if (!wiz) return;
    const steps = [...wiz.querySelectorAll(".wizard-step")];
    const wps = [...document.querySelectorAll(".wizard-progress .wp")];
    let i = 0;
    const show = (n) => {
      i = clamp(n, 0, steps.length - 1);
      steps.forEach((s, k) => s.classList.toggle("active", k === i));
      wps.forEach((w, k) => { w.classList.toggle("active", k === i); w.classList.toggle("done", k < i); });
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (i === steps.length - 1) AK.computeWizardResult();
    };
    wiz.addEventListener("click", e => {
      if (e.target.closest("[data-next]")) show(i + 1);
      if (e.target.closest("[data-prev]")) show(i - 1);
    });
    wiz.querySelectorAll(".choice-row").forEach(row => {
      row.addEventListener("click", e => {
        const c = e.target.closest(".choice"); if (!c) return;
        row.querySelectorAll(".choice").forEach(x => x.classList.remove("active"));
        c.classList.add("active");
        const target = row.getAttribute("data-bind");
        if (target) { const inp = document.getElementById(target); if (inp) inp.value = c.dataset.val; }
      });
    });
    show(0);
  };

  // Result ids: r_market, r_amount (výkupní nabídka), r_fee (měsíční poplatek),
  // r_period (poplatek za zvolenou dobu), r_months, r_buyback (cena zpětného odkupu), r_approval(+bar)
  AK.computeWizardResult = function () {
    const get = id => { const e = document.getElementById(id); return e ? e.value : ""; };
    const segment = get("w_segment") || "Střední třída / kombi";
    const year = +get("w_year") || 2018;
    const mileage = +get("w_mileage") || 120000;
    const condition = get("w_condition") || "dobry";
    const months = +get("w_months") || 3;
    const encumbered = get("w_encumbered") === "yes";
    const market = AK.valuation.estimateMarketValue({ segment, year, mileage, condition });
    const o = AK.valuation.buildOffer({ marketValue: market, encumbered });
    let approval = 95;
    if (condition === "prumerny") approval -= 8;
    if (condition === "horsi") approval -= 20;
    if (encumbered) approval -= 18;
    approval = Math.round(clamp(approval, 45, 96));
    const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    set("r_market", AK.fmt.czk(o.marketValue));
    set("r_amount", AK.fmt.czk(o.vykup));
    set("r_fee", AK.fmt.czk(o.fee));
    set("r_period", AK.fmt.czk(o.fee * months));
    set("r_months", months + (months === 1 ? " měsíc" : (months < 5 ? " měsíce" : " měsíců")));
    set("r_buyback", AK.fmt.czk(o.buyback));
    set("r_approval", approval + " %");
    const bar = document.getElementById("r_approvalbar"); if (bar) bar.style.width = approval + "%";
  };

  // ---------- Boot ----------
  document.addEventListener("DOMContentLoaded", function () {
    AK.initTabs();
    AK.initSidebar();
    AK.initHeroCalc();
    AK.initBigCalc();
    AK.initFaq();
    AK.initWizard();
    document.querySelectorAll("[data-demo]").forEach(el =>
      el.addEventListener("click", e => { e.preventDefault(); AK.toast(el.getAttribute("data-demo") || "Funkce v demu není aktivní"); }));
  });
})();
