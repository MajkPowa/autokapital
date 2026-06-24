/* =========================================================================
   AutoKapitál — Shared app logic (green brand)
   Formatting, toast, tabs, sidebar, valuation, hero + section calculators,
   wizard, FAQ accordion.
   ========================================================================= */
(function () {
  "use strict";
  const AK = (window.AK = window.AK || {});

  // ---------- Formatting ----------
  AK.fmt = {
    czk(n) { return Math.round(n).toLocaleString("cs-CZ").replace(/ /g, " ") + " Kč"; },
    num(n) { return Math.round(n).toLocaleString("cs-CZ").replace(/ /g, " "); },
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

  // ---------- Valuation engine ----------
  const LTV = 0.62;
  const RPSN_PCT = 9.9;            // indikativní RPSN (orientační)
  const FEE_BY_DAYS = { 30: 0.026, 90: 0.0215, 180: 0.0195 };
  const COND_FACTOR = { vyborny: 1.0, dobry: 0.93, prumerny: 0.84, horsi: 0.72 };
  // Robust segment lookup: accept both display labels and short slugs.
  const SEGMENT_MAP = {
    "hatchback": "Malé / hatchback", "male": "Malé / hatchback",
    "kombi": "Střední třída / kombi", "stredni": "Střední třída / kombi",
    "suv": "SUV",
    "dodavka": "Dodávka / užitkové", "uzitkove": "Dodávka / užitkové",
    "premium": "Prémiové / vyšší třída", "premiove": "Prémiové / vyšší třída",
  };

  AK.valuation = {
    LTV, RPSN_PCT,
    resolveSegment(s) { return (AK.segmentBase && AK.segmentBase[s]) ? s : (SEGMENT_MAP[s] || "Střední třída / kombi"); },
    estimateMarketValue({ segment, year, mileage, condition }) {
      const seg = this.resolveSegment(segment);
      const base = (AK.segmentBase && AK.segmentBase[seg]) || 720000;
      const age = Math.max(0, 2026 - (year || 2020));
      const ageFactor = Math.pow(0.88, age);
      const mileageFactor = clamp(1 - (mileage || 80000) / 280000, 0.45, 1);
      const condFactor = COND_FACTOR[condition] || 0.9;
      return round(base * ageFactor * mileageFactor * condFactor, 5000);
    },
    // Indicative monthly payment (annuity) at RPSN.
    monthly(principal, months, annualPct) {
      const r = (annualPct == null ? RPSN_PCT : annualPct) / 100 / 12;
      const n = months || 12;
      if (r === 0) return principal / n;
      return round(principal * r / (1 - Math.pow(1 + r, -n)), 50);
    },
    // Transparent offer (sale-&-use-back). Buyback = offer (par). Usage cost = sum of fees.
    buildOffer({ marketValue, requested, encumbered, days }) {
      let maxOffer = marketValue * LTV;
      if (encumbered) maxOffer *= 0.9;
      maxOffer = round(maxOffer, 5000);
      const offer = round(clamp(requested || maxOffer, 20000, maxOffer), 5000);
      const rate = FEE_BY_DAYS[days] || FEE_BY_DAYS[90];
      const months = Math.max(1, Math.round((days || 90) / 30));
      const monthly = round(offer * rate, 100);
      const totalFees = monthly * months;
      const requestedLtv = (requested ? requested / marketValue : LTV) * 100;
      let approval = 96;
      if (requestedLtv > 60) approval -= (requestedLtv - 60) * 1.6;
      if (encumbered) approval -= 14;
      approval = Math.round(clamp(approval, 48, 97));
      return { marketValue, offer, monthly, months, totalFees, buyback: offer, approval, maxOffer, ltvPct: Math.round((offer / marketValue) * 100) };
    },
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

  // ---------- Hero calculator (Odhad hodnoty vozu slider + Požadovaná částka presets) ----------
  AK.initHeroCalc = function () {
    const range = document.getElementById("heroRange");
    if (!range) return;
    const elValue = document.getElementById("heroValue");
    const elAmount = document.getElementById("heroAmount");
    const presets = document.querySelectorAll(".preset[data-val]");
    let requested = +(document.querySelector(".preset.active")?.dataset.val) || 350000;
    function render() {
      if (elValue) elValue.textContent = AK.fmt.czk(+range.value);
      if (elAmount) elAmount.textContent = AK.fmt.czk(requested);
      presets.forEach(p => p.classList.toggle("active", +p.dataset.val === requested));
    }
    range.addEventListener("input", render);
    presets.forEach(p => p.addEventListener("click", () => { requested = +p.dataset.val; render(); }));
    render();
  };

  // ---------- Section 05 big calculator ----------
  AK.initBigCalc = function () {
    const range = document.getElementById("bigRange");
    if (!range) return;
    const elAmount = document.getElementById("bigAmount");
    const elValue = document.getElementById("bigValue");          // input (odhad hodnoty vozu)
    const elTerm = document.getElementById("bigTerm");            // select months
    const elType = document.getElementById("bigType");            // select segment
    const elMonthly = document.getElementById("bigMonthly");
    const elRpsn = document.getElementById("bigRpsn");
    const elMax = document.getElementById("bigMax");
    const elTotal = document.getElementById("bigTotal");
    function render() {
      const value = +(elValue && elValue.value) || 620000;
      const maxAvail = round(value * LTV, 5000);
      let amount = +range.value;
      amount = Math.min(amount, maxAvail);
      const months = +(elTerm && elTerm.value) || 12;
      const monthly = AK.valuation.monthly(amount, months);
      if (elAmount) elAmount.textContent = AK.fmt.czk(amount);
      if (elMonthly) elMonthly.textContent = AK.fmt.czk(monthly);
      if (elRpsn) elRpsn.textContent = "od " + String(RPSN_PCT).replace(".", ",") + " %";
      if (elMax) elMax.textContent = AK.fmt.czk(maxAvail);
      if (elTotal) elTotal.textContent = AK.fmt.czk(monthly * months);
    }
    range.addEventListener("input", render);
    [elValue, elTerm, elType].forEach(el => el && el.addEventListener("input", render));
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

  // Consumer-credit wizard result (annuity splátka + RPSN). Reads w_months / w_amount.
  AK.computeWizardResult = function () {
    const get = id => { const e = document.getElementById(id); return e ? e.value : ""; };
    const segment = get("w_segment") || "Střední třída / kombi";
    const year = +get("w_year") || 2019;
    const mileage = +get("w_mileage") || 100000;
    const condition = get("w_condition") || "dobry";
    const months = +get("w_months") || 24;
    const encumbered = get("w_encumbered") === "yes";
    const requested = +get("w_amount") || 0;
    const market = AK.valuation.estimateMarketValue({ segment, year, mileage, condition });
    const maxAvail = round(market * LTV, 5000);
    const amount = round(clamp(requested || maxAvail, 20000, maxAvail), 5000);
    const monthly = AK.valuation.monthly(amount, months);
    const total = monthly * months;
    let approval = 95;
    const reqLtv = amount / market * 100;
    if (reqLtv > 60) approval -= (reqLtv - 60) * 1.5;
    if (encumbered) approval -= 12;
    approval = Math.round(clamp(approval, 50, 96));
    const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    set("r_market", AK.fmt.czk(market));
    set("r_amount", AK.fmt.czk(amount));
    set("r_monthly", AK.fmt.czk(monthly));
    set("r_rpsn", "od " + String(RPSN_PCT).replace(".", ",") + " %");
    set("r_total", AK.fmt.czk(total));
    set("r_buyback", AK.fmt.czk(amount));
    set("r_months", months + " měsíců");
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
