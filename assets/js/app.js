/* =========================================================================
   CashAuto — Shared app logic (dočasný výkup vozu se zpětným odkupem)
   Formatting, toast, tabs, sidebar, výkup calculators, wizard, FAQ.
   Model: výkupní cena = 70 % odhadní hodnoty; měsíční rezervační poplatek = 4 %
   z hodnoty vozu; cena zpětného odkupu = výkupní cena (podle smlouvy).
   NENÍ úvěr — žádné RPSN, úroky ani splátky.
   ========================================================================= */
(function () {
  "use strict";
  const AK = (window.AK = window.AK || {});

  // ---------- Formatting ----------
  // Částky: tisícové oddělovače i mezera před „Kč“ jsou nezlomitelné (U+00A0), aby se „Kč“
  // v úzkých buňkách nezalomilo na samostatný řádek.
  AK.fmt = {
    num(n) { return Math.round(n).toLocaleString("cs-CZ").replace(/\s/g, "\u00a0"); },
    czk(n) { return AK.fmt.num(n) + "\u00a0Kč"; },
    pct(n) { return Math.round(n) + " %"; },
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
  // Odhad vychází z ceny NOVÉHO vozu segmentu, ze které se odečítá stáří, nájezd a stav.
  // Kalibrace: referenční vůz webu (kombi, 2018, 132 000 km, dobrý) ≈ 275 000–295 000 Kč,
  // tj. v pásmu ukázkové hodnoty 300 000 Kč. Hodnoty v AK.segmentBase (data.js) slouží jen jako záloha.
  const NEW_PRICE = {
    "Malé / hatchback": 500000,
    "Střední třída / kombi": 800000,
    "SUV": 1100000,
    "Rodinné MPV / van": 900000,
    "Prémiové / vyšší třída": 1700000,
  };
  // Roční pokles hodnoty (osobní vozy rychleji než stroje a tahače) a škála nájezdu podle vertikály
  // (auto = km, tech = km, agro = motohodiny). Faktor nájezdu má spodní mez 0,45.
  const AGE_FACTOR = { auto: 0.91, agro: 0.95, tech: 0.95 };
  const WEAR_SCALE = { auto: 600000, agro: 30000, tech: 1500000 };
  const WEAR_DEFAULT = { auto: 100000, agro: 6000, tech: 450000 };
  const SEGMENT_MAP = {
    "hatchback": "Malé / hatchback", "male": "Malé / hatchback",
    "kombi": "Střední třída / kombi", "stredni": "Střední třída / kombi",
    "suv": "SUV",
    "mpv": "Rodinné MPV / van", "van": "Rodinné MPV / van",
    "premium": "Prémiové / vyšší třída", "premiove": "Prémiové / vyšší třída",
  };

  // Vertikála (auto | agro | tech): z body[data-vertical], jinak z ?typ= (žádost), jinak auto
  AK.vertical = function () {
    const fromBody = document.body && document.body.getAttribute("data-vertical");
    const fromQuery = new URLSearchParams(location.search).get("typ");
    const key = fromBody || fromQuery || "auto";
    const V = AK.verticals || {};
    return V[key] || V.auto || { key: "auto", vykupRate: VYKUP_RATE, feeRate: FEE_RATE, segments: [] };
  };

  AK.valuation = {
    VYKUP_RATE, FEE_RATE,
    resolveSegment(s) { return (NEW_PRICE[s] || (AK.segmentBase && AK.segmentBase[s])) ? s : (SEGMENT_MAP[s] || "Střední třída / kombi"); },
    estimateMarketValue({ segment, year, mileage, condition, vertical }) {
      const V = vertical || AK.vertical();
      const vKey = V.key in WEAR_SCALE ? V.key : "auto";
      let base;
      if (vKey !== "auto") {
        const seg = (V.segments || []).find(x => x.key === segment) || (V.segments || [])[0];
        base = seg ? seg.base : 1500000;
      } else {
        const seg = this.resolveSegment(segment);
        base = NEW_PRICE[seg] || (AK.segmentBase && AK.segmentBase[seg]) || NEW_PRICE["Střední třída / kombi"];
      }
      const age = Math.max(0, new Date().getFullYear() - (year || 2018));
      const ageFactor = Math.pow(AGE_FACTOR[vKey], age);
      const wear = mileage == null ? WEAR_DEFAULT[vKey] : mileage;
      const mileageFactor = clamp(1 - wear / WEAR_SCALE[vKey], 0.45, 1);
      const condFactor = COND_FACTOR[condition] || 0.9;
      return round(base * ageFactor * mileageFactor * condFactor, vKey === "auto" ? 5000 : 10000);
    },
    // Dočasný výkup: výkupní cena + měsíční rezervační poplatek. Cena zpětného odkupu = výkupní cena.
    // Sazby lze předat (kalkulačky vertikál), jinak se vezmou z aktivní vertikály.
    // Stávající zatížení vozu (leasing apod.) se do orientační nabídky nepromítá — posuzuje se
    // individuálně po telefonátu, jak říká nápověda v žádosti i FAQ.
    buildOffer({ marketValue, vykupRate, feeRate }) {
      const V = AK.vertical();
      const vr = vykupRate || V.vykupRate || VYKUP_RATE;
      const fr = feeRate || V.feeRate || FEE_RATE;
      const vykup = round(marketValue * vr, 5000);
      const fee = round(marketValue * fr, 100);
      return {
        marketValue, vykup, fee, buyback: vykup, vykupRate: vr, feeRate: fr,
        fee1: fee, fee3: fee * 3, fee6: fee * 6, fee12: fee * 12,
      };
    },
    feeForMonths(marketValue, months) { return round(marketValue * (AK.vertical().feeRate || FEE_RATE), 100) * (months || 1); },
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

  // ---------- Přenos hodnoty vozu z kalkulaček do žádosti ----------
  // Hodnota se ukládá jen po skutečné interakci s kalkulačkou (ne při prvním vykreslení) a platí 24 h.
  // V žádosti slouží pouze jako VÝCHOZÍ odhad: jakmile klient změní typ, rok, nájezd nebo stav,
  // počítá se z jeho údajů (viz computeWizardResult).
  const CARRY_TTL_MS = 24 * 60 * 60 * 1000;
  const VEHICLE_FIELDS = ["w_segment", "w_year", "w_mileage", "w_condition"];
  const vehicleSnapshot = () => VEHICLE_FIELDS.map(id => { const e = document.getElementById(id); return e ? String(e.value) : ""; }).join("|");
  let wizardDefaults = null; // snímek výchozích hodnot kroku 1 (po přizpůsobení vertikále)
  AK.rememberValue = function (v) {
    // hodnota se pamatuje per vertikála (auto/agro/tech), aby traktor nepřepsal odhad dodávky
    try { localStorage.setItem("ak_hodnota", JSON.stringify({ v: AK.vertical().key, k: v, t: Date.now() })); } catch (e) { /* private mode */ }
    // CTA odkazy na žádost nesou hodnotu i v query stringu (a zachovají ?typ= vertikály)
    document.querySelectorAll('a[href*="zadost.html"]').forEach(a => {
      const href = a.getAttribute("href");
      const base = href.split("?")[0];
      const params = new URLSearchParams(href.split("?")[1] || "");
      params.set("hodnota", String(v));
      const vKey = AK.vertical().key;
      if (vKey && vKey !== "auto") params.set("typ", vKey);
      a.setAttribute("href", base + "?" + params.toString());
    });
  };
  AK.recallValue = function () {
    const q = new URLSearchParams(location.search).get("hodnota");
    if (q && +q >= 50000) return +q;
    try {
      const s = localStorage.getItem("ak_hodnota");
      if (s) {
        const o = JSON.parse(s);
        const fresh = o && typeof o.t === "number" && (Date.now() - o.t) < CARRY_TTL_MS;
        if (fresh && o.v === AK.vertical().key && +o.k >= 50000) return +o.k;
      }
    } catch (e) { /* starý formát nebo private mode */ }
    return null;
  };

  // ---------- Hero calculator (odhad hodnoty → výkupní nabídka + rezervační poplatek) ----------
  AK.initHeroCalc = function () {
    const range = document.getElementById("heroRange");
    if (!range) return;
    const elValue = document.getElementById("heroValue");
    const elAmount = document.getElementById("heroAmount");   // výkupní nabídka
    const elFee = document.getElementById("heroFee");         // měsíční rezervační poplatek
    const elBuyback = document.getElementById("heroBuyback"); // cena zpětného odkupu
    const elTerm = document.getElementById("heroTerm");       // doba rezervace (měsíce)
    const elPeriod = document.getElementById("heroPeriod");   // poplatek za zvolenou dobu celkem
    // remember = true jen při skutečném posunu jezdce (ne při prvním vykreslení ani změně doby)
    function render(remember) {
      const value = +range.value;
      const o = AK.valuation.buildOffer({ marketValue: value });
      const months = +(elTerm && elTerm.value) || 3;
      // čtečka oznámí „300 000 Kč“ místo surového čísla 300000
      range.setAttribute("aria-valuetext", AK.fmt.czk(value));
      if (elValue) elValue.textContent = AK.fmt.czk(value);
      if (elAmount) elAmount.textContent = AK.fmt.czk(o.vykup);
      if (elFee) elFee.textContent = AK.fmt.czk(o.fee) + " / měsíc";
      if (elBuyback) elBuyback.textContent = AK.fmt.czk(o.buyback);
      if (elPeriod) elPeriod.textContent = AK.fmt.czk(o.fee * months) + " za " + months + (months === 1 ? " měsíc" : (months < 5 ? " měsíce" : " měsíců"));
      if (remember) AK.rememberValue(value);
    }
    range.addEventListener("input", () => render(true));
    if (elTerm) { elTerm.addEventListener("input", () => render(false)); elTerm.addEventListener("change", () => render(false)); }
    render(false);
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
    function render(remember) {
      const value = +valEl.value || 300000;
      const o = AK.valuation.buildOffer({ marketValue: value });
      const months = +(elTerm && elTerm.value) || 3;
      if (valEl.type === "range") valEl.setAttribute("aria-valuetext", AK.fmt.czk(value));
      if (elAmount) elAmount.textContent = AK.fmt.czk(o.vykup);
      if (elFee) elFee.textContent = AK.fmt.czk(o.fee);
      if (elPeriod) elPeriod.textContent = AK.fmt.czk(o.fee * months);
      if (elBuyback) elBuyback.textContent = AK.fmt.czk(o.buyback);
      if (remember && +valEl.value >= 50000) AK.rememberValue(value);
    }
    valEl.addEventListener("input", () => render(true));
    if (elTerm) { elTerm.addEventListener("input", () => render(false)); elTerm.addEventListener("change", () => render(false)); }
    render(false);
  };

  // ---------- FAQ accordion ----------
  AK.initFaq = function () {
    document.querySelectorAll(".faq-item .faq-q").forEach((q, i) => {
      // vazba tlačítko → panel odpovědi (aria-controls), panel dostane id, pokud ho nemá
      const panel = q.closest(".faq-item") && q.closest(".faq-item").querySelector(".faq-a");
      if (panel) { if (!panel.id) panel.id = "faq-a-" + (i + 1); q.setAttribute("aria-controls", panel.id); }
      q.setAttribute("aria-expanded", "false");
      q.addEventListener("click", () => {
        const item = q.closest(".faq-item");
        const open = item.classList.toggle("open");
        q.setAttribute("aria-expanded", String(open));
      });
    });
  };

  // ---------- Multi-step wizard (zadost.html) ----------
  // Reverzní lead-gate: nabídka se ukazuje PŘED kontaktem. Výpočet proběhne na každém
  // kroku obsahujícím #r_market; krok s [data-validate="contact"] se validuje před odchodem dál.
  AK.initWizard = function () {
    const wiz = document.querySelector("[data-wizard]");
    if (!wiz) return;
    const steps = [...wiz.querySelectorAll(".wizard-step")];
    const wps = [...document.querySelectorAll(".wizard-progress .wp")];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = 0;
    const validateContact = (step) => {
      let ok = true;
      const req = (id, test) => {
        const inp = document.getElementById(id);
        if (!inp) return true;
        const field = inp.closest(".field") || inp.closest(".notice") || inp.parentElement;
        const valid = test(inp);
        if (field && field.classList) field.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
        return valid;
      };
      req("c_name", el => el.value.trim().length >= 3);
      // B2B: IČO je povinné (8 číslic; mezery povoleny)
      req("c_ico", el => /^\d{8}$/.test(el.value.replace(/\s/g, "")));
      const phoneOk = (document.getElementById("c_phone") || { value: "" }).value.replace(/\s/g, "").length >= 9;
      const mailOk = /.+@.+\..+/.test((document.getElementById("c_email") || { value: "" }).value);
      req("c_phone", () => phoneOk || mailOk);
      req("c_email", () => phoneOk || mailOk);
      const agree = document.getElementById("c_agree");
      if (agree) {
        const wrapper = agree.closest("label") || agree.parentElement;
        wrapper.style.outline = agree.checked ? "" : "2px solid var(--danger)";
        wrapper.style.outlineOffset = agree.checked ? "" : "4px";
        if (!agree.checked) ok = false;
      }
      const errBox = step.querySelector(".wizard-error");
      if (errBox) errBox.classList.toggle("hide", ok);
      return ok;
    };
    // moveFocus: po přechodu na další/předchozí krok převezme fokus nadpis kroku — tlačítko, na kterém
    // byl fokus, se skryje (display:none) a bez toho by fokus spadl na <body>; čtečka tak přečte
    // název kroku (např. „Vaše orientační nabídka“). Při načtení stránky se fokus nepřesouvá.
    const show = (n, moveFocus) => {
      i = clamp(n, 0, steps.length - 1);
      steps.forEach((s, k) => s.classList.toggle("active", k === i));
      wps.forEach((w, k) => { w.classList.toggle("active", k === i); w.classList.toggle("done", k < i); });
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      if (steps[i].querySelector("#r_market")) AK.computeWizardResult();
      if (moveFocus) {
        const h = steps[i].querySelector("h2, h3");
        if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
      }
    };
    wiz.addEventListener("click", e => {
      const nextBtn = e.target.closest("[data-next]");
      if (nextBtn) {
        const cur = steps[i];
        if (cur.hasAttribute("data-validate") && cur.getAttribute("data-validate") === "contact" && !validateContact(cur)) return;
        // úspěšné odeslání kontaktu (poslední krok s data-submit-toast)
        if (nextBtn.hasAttribute("data-submit-toast")) { AK.toast(nextBtn.getAttribute("data-submit-toast")); }
        show(i + 1, true);
      }
      if (e.target.closest("[data-prev]")) show(i - 1, true);
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
    // výchozí hodnoty kroku 1 (už po přizpůsobení vertikále) — proti nim se pozná, zda klient údaje upravil
    wizardDefaults = vehicleSnapshot();
    show(0, false);
  };

  // Result ids: r_market, r_amount (výkupní nabídka), r_fee (měsíční poplatek),
  // r_period (poplatek za zvolenou dobu), r_months, r_buyback (cena zpětného odkupu).
  // Žádná pravděpodobnost schválení — klientovi se procenta schválení neukazují.
  AK.computeWizardResult = function () {
    const get = id => { const e = document.getElementById(id); return e ? e.value : ""; };
    const segment = get("w_segment") || "Střední třída / kombi";
    const year = +get("w_year") || 2018;
    const mileage = +get("w_mileage") || null; // null = výchozí nájezd vertikály v estimateMarketValue
    const condition = get("w_condition") || "dobry";
    const months = +get("w_months") || 3;
    // Hodnota z landing kalkulačky (?hodnota= / localStorage, max. 24 h) je jen VÝCHOZÍ odhad: platí,
    // dokud klient nechá údaje o voze tak, jak byly. Jakmile změní typ, rok, nájezd nebo stav,
    // odhad se počítá z jeho údajů — pole nesmí být „mrtvá“.
    const carried = AK.recallValue ? AK.recallValue() : null;
    const untouched = wizardDefaults === null || vehicleSnapshot() === wizardDefaults;
    const market = (carried && untouched) ? carried : AK.valuation.estimateMarketValue({ segment, year, mileage, condition });
    const o = AK.valuation.buildOffer({ marketValue: market });
    const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    set("r_market", AK.fmt.czk(o.marketValue));
    set("r_amount", AK.fmt.czk(o.vykup));
    set("r_fee", AK.fmt.czk(o.fee));
    set("r_period", AK.fmt.czk(o.fee * months));
    set("r_months", months + (months === 1 ? " měsíc" : (months < 5 ? " měsíce" : " měsíců")));
    set("r_buyback", AK.fmt.czk(o.buyback));
    // sticky souhrn trojice čísel (viditelný během dalších kroků)
    set("os_vykup", AK.fmt.czk(o.vykup));
    set("os_fee", AK.fmt.czk(o.fee) + "/měs.");
    set("os_buyback", AK.fmt.czk(o.buyback));
    const sb = document.getElementById("offerSummaryBar"); if (sb) sb.classList.remove("hide");
  };

  // ---------- Animace: scroll reveal ----------
  AK.initReveal = function () {
    document.documentElement.classList.add("reveal-ready"); // ruší nouzový fallback z head scriptu
    const els = document.querySelectorAll("[data-reveal]");
    if (!els.length) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) { els.forEach(el => el.classList.add("revealed")); return; }
    // stagger: děti kontejneru [data-reveal-stagger] dostanou postupné zpoždění
    document.querySelectorAll("[data-reveal-stagger]").forEach(wrap => {
      [...wrap.children].forEach((child, i) => {
        if (!child.hasAttribute("data-reveal")) child.setAttribute("data-reveal", "");
        child.style.setProperty("--reveal-delay", Math.min(i * 90, 450) + "ms");
      });
    });
    // Mobilní carousel (≤860px): karty vpravo jsou mimo viewport, takže by se odkrývaly až při swipu
    // (uživatel by ~1 s viděl prázdnou šedou dlaždici) a „peek“ karta (~7 % viditelná) nedosáhne
    // threshold 0.12 vůbec. Proto se na mobilu odkrývá celý pás najednou jako jeden blok:
    // obal dostane data-reveal, karty nulové zpoždění a při protnutí obalu se odkryjí všechny.
    const carouselMq = window.matchMedia("(max-width: 860px)");
    if (carouselMq.matches) {
      document.querySelectorAll(".mobile-carousel[data-reveal-stagger]").forEach(wrap => {
        if (!wrap.hasAttribute("data-reveal")) wrap.setAttribute("data-reveal", "");
        [...wrap.children].forEach(child => child.style.setProperty("--reveal-delay", "0ms"));
      });
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add("revealed"); io.unobserve(el);
        // pás carouselu: spolu s obalem (nebo první viditelnou kartou po zúžení okna) odkrýt i karty mimo viewport
        const wrap = el.classList.contains("mobile-carousel") ? el : (carouselMq.matches ? el.closest(".mobile-carousel") : null);
        if (wrap) wrap.querySelectorAll("[data-reveal]").forEach(c => { c.classList.add("revealed"); io.unobserve(c); });
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll("[data-reveal]").forEach(el => io.observe(el));
  };

  // ---------- Animace: count-up čísel ([data-count="210000"] [data-count-suffix=" Kč"]) ----------
  AK.initCountUp = function () {
    const els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const run = (el) => {
      const target = +el.getAttribute("data-count") || 0;
      const suffix = el.getAttribute("data-count-suffix") || "";
      if (reduce) { el.textContent = AK.fmt.num(target) + suffix; return; }
      const dur = 1200; const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = AK.fmt.num(Math.round(target * eased)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!("IntersectionObserver" in window)) { els.forEach(run); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.5 });
    els.forEach(el => io.observe(el));
  };

  // ---------- Sticky mobilní CTA lišta (marketingové stránky) ----------
  AK.initMobileCta = function () {
    if (document.body.getAttribute("data-shell") !== "marketing") return;
    if (/zadost/.test(location.pathname)) return; // na formuláři žádosti lištu nezobrazovat
    if (document.querySelector(".mobile-cta-bar")) return;
    const bar = document.createElement("div");
    bar.className = "mobile-cta-bar";
    const vKey = AK.vertical().key;
    const href = "/zadost.html" + (vKey && vKey !== "auto" ? "?typ=" + vKey : "");
    // popisek i tlačítko odpovídají CTA dané stránky („Chci nabídku pro stroj / pro vozidlo“)
    const LABELS = {
      auto: ["Chci nabídku", "Firemní vůz · 3 čísla za 2 minuty"],
      agro: ["Chci nabídku pro stroj", "Traktor či kombajn · 3 čísla za 2 minuty"],
      tech: ["Chci nabídku pro vozidlo", "Tahač či návěs · 3 čísla za 2 minuty"],
    };
    const [ctaText, subText] = LABELS[vKey] || LABELS.auto;
    bar.innerHTML = '<span class="mc-price">Nezávazná orientační nabídka<strong>' + subText + '</strong></span>' +
      '<a class="btn btn-primary" href="' + href + '">' + ctaText + '</a>';
    document.body.appendChild(bar);
    document.body.classList.add("has-mobile-cta");
    let ticking = false;
    // Lišta se neukazuje, dokud je ve viewportu kalkulačka s vlastním CTA a varováním o ceně
    // (na 360–430 px sahá hero kalkulačka do ~1500 px, takže samotný práh 520 px nestačí),
    // ani při otevřeném mobilním menu (lišta by překryla spodní tlačítka menu, např. „Zavolat“).
    const calcs = [...document.querySelectorAll(".hero-tiles .calc-card, .hero .calc-card, .calc-large")];
    const calcVisible = () => calcs.some(c => { const r = c.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; });
    const menuOpen = () => { const m = document.getElementById("mobileMenu"); return !!(m && m.classList.contains("open")); };
    const update = () => {
      ticking = false;
      const show = !menuOpen() && !calcVisible() && window.scrollY > 520 && (window.innerHeight + window.scrollY) < document.body.scrollHeight - 420;
      bar.classList.toggle("visible", show);
    };
    const schedule = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    // přepnutí menu (shell.js) — delegovaně, aby nezáleželo na pořadí inicializace; rAF počká na změnu třídy
    document.addEventListener("click", e => { if (e.target.closest && e.target.closest("#navToggle")) schedule(); });
    update();
  };

  // ---------- Žádost: přizpůsobení vertikále (?typ=agro|tech) ----------
  // Přepne typy strojů v #w_segment, popisky s [data-v-auto]/[data-v-agro]/[data-v-tech] a označí body.
  AK.initWizardVertical = function () {
    const wiz = document.querySelector("[data-wizard]");
    if (!wiz) return;
    const V = AK.vertical();
    document.body.setAttribute("data-vertical", V.key);
    // varianty textů: <span data-v="auto">…</span><span data-v="agro">…</span>
    document.querySelectorAll("[data-v]").forEach(el => { el.hidden = el.getAttribute("data-v") !== V.key; });
    const sel = document.getElementById("w_segment");
    if (sel && V.key !== "auto" && V.segments && V.segments.length) {
      sel.innerHTML = V.segments.map((s, i) => `<option value="${s.key}"${i === 0 ? " selected" : ""}>${s.label}</option>`).join("");
    }
    // nájezd u strojů = motohodiny
    const mil = document.getElementById("w_mileage");
    const milLbl = document.querySelector('label[for="w_mileage"]');
    if (mil && V.key === "agro") { mil.value = 6000; mil.step = 100; if (milLbl) milLbl.textContent = "Motohodiny"; }
    if (mil && V.key === "tech") { mil.value = 450000; mil.step = 10000; if (milLbl) milLbl.textContent = "Nájezd (km)"; }
    const pill = document.getElementById("verticalPill");
    if (pill && V.key !== "auto") { pill.innerHTML = (AK.subBrand ? AK.subBrand[V.key] : V.name) + ' <span class="muted" style="font-weight:600">· ' + V.label + "</span>"; pill.classList.remove("hide"); }
  };

  // ---------- Rádce: související články ([data-related] + data-slug na body/článku) ----------
  AK.initRelated = function () {
    const box = document.querySelector("[data-related]");
    if (!box || !AK.articles) return;
    const cur = box.getAttribute("data-related") || document.body.getAttribute("data-slug") || "";
    const vert = document.body.getAttribute("data-vertical") || "";
    // Rotace podle pozice aktuálního článku: seznam začíná článkem NÁSLEDUJÍCÍM po aktuálním,
    // takže každý článek dostane jinou trojici (ne stále první tři). Stabilní řazení pak
    // upřednostní články stejné vertikály. Na stránkách vertikál (data-related není slug) se nerotuje.
    const list = AK.articles;
    const idx = list.findIndex(a => a.slug === cur);
    const start = idx < 0 ? 0 : idx + 1;
    const pool = list.slice(start).concat(list.slice(0, start)).filter(a => a.slug !== cur);
    pool.sort((a, b) => (b.vertical === vert) - (a.vertical === vert));
    const pick = pool.slice(0, 3);
    box.innerHTML = pick.map(a => `
      <a class="card hover post-card" href="/blog/${a.slug}.html">
        <div class="pc-cover-wrap"><img class="pc-cover" src="${a.cover}" alt="" width="1376" height="768" loading="lazy" /></div>
        <div class="pc-body">
          <span class="pill pill-muted pc-tag">${a.tag}</span>
          <h3>${a.title}</h3>
          <p>${a.excerpt}</p>
          <div class="pc-meta"><span>${a.read} min čtení</span></div>
        </div>
      </a>`).join("");
  };

  // ---------- Niche ovladač kalkulačky: „Kdy čekáte tržby?“ (měsíce) / „Splatnost faktur“ (dny) → doba rezervace ----------
  // <select data-niche-ctl="heroTerm" data-map="months|days"> — vybere nejbližší dostupnou dobu (1/3/6/12) v segmentovém ovladači
  AK.initNicheCtl = function () {
    document.querySelectorAll("[data-niche-ctl]").forEach(sel => {
      const targetId = sel.getAttribute("data-niche-ctl");
      const group = document.querySelector('[data-segmented="' + targetId + '"]');
      const pick = (months) => {
        const term = months <= 1 ? 1 : months <= 3 ? 3 : months <= 6 ? 6 : 12;
        const btn = group && group.querySelector('button[data-val="' + term + '"]');
        if (btn) btn.click();
      };
      const apply = () => {
        const v = +sel.value;
        if (sel.getAttribute("data-map") === "days") pick(Math.ceil(v / 30));
        else pick(v);
        const hint = document.getElementById(sel.getAttribute("aria-describedby") || "") || (sel.closest(".niche-ctl") && sel.closest(".niche-ctl").querySelector(".hint-line"));
        if (hint) hint.textContent = sel.getAttribute("data-map") === "days"
          ? "Rezervaci nastavíme na " + (v <= 30 ? "1 měsíc" : v <= 90 ? "3 měsíce" : v <= 180 ? "6 měsíců" : "12 měsíců") + " — odkup hned po zaplacení faktur, dřívější odkup bez penalizace."
          : "Rezervaci nastavíme na " + (v <= 1 ? "1 měsíc" : v <= 3 ? "3 měsíce" : v <= 6 ? "6 měsíců" : "12 měsíců") + " — odkup po sklizni či výplatě, dřívější odkup bez penalizace.";
      };
      // měsíce do sklizně: naplnit názvy měsíců od příštího měsíce
      if (sel.getAttribute("data-map") === "months" && !sel.options.length) {
        const names = ["leden", "únor", "březen", "duben", "květen", "červen", "červenec", "srpen", "září", "říjen", "listopad", "prosinec"];
        const now = new Date().getMonth();
        for (let i = 1; i <= 12; i++) {
          const o = document.createElement("option"); o.value = String(i); o.textContent = names[(now + i) % 12] + (i === 12 ? " (za rok)" : ""); if (i === 6) o.selected = true; sel.appendChild(o);
        }
      }
      sel.addEventListener("change", apply);
      apply();
    });
  };

  // ---------- Segmentový ovladač (Apple-like) → skrytý input + event change ----------
  AK.initSegmented = function () {
    document.querySelectorAll("[data-segmented]").forEach(group => {
      const target = document.getElementById(group.getAttribute("data-segmented"));
      const btns = [...group.querySelectorAll("button")];
      // ARIA radiogroup: roving tabindex — Tab zastaví jen na zaškrtnuté volbě, mezi volbami se chodí šipkami / Home / End
      const set = (b) => {
        btns.forEach(x => { const on = x === b; x.classList.toggle("active", on); x.setAttribute("aria-checked", String(on)); x.tabIndex = on ? 0 : -1; });
        if (target) { target.value = b.dataset.val; target.dispatchEvent(new Event("change", { bubbles: true })); }
      };
      btns.forEach(b => b.addEventListener("click", () => set(b)));
      const cur = btns.find(b => b.classList.contains("active")) || btns[0]; // bez zaškrtnuté volby je Tab zastávkou první tlačítko
      btns.forEach(x => { x.tabIndex = x === cur ? 0 : -1; });
      group.addEventListener("keydown", e => {
        const i = btns.findIndex(b => b.classList.contains("active"));
        let n = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % btns.length;
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + btns.length) % btns.length;
        if (e.key === "Home") n = 0;
        if (e.key === "End") n = btns.length - 1;
        if (n >= 0) { e.preventDefault(); set(btns[n]); btns[n].focus(); }
      });
    });
  };
  // Slider: vyplněná část dráhy (--pct) jako v iOS
  AK.initRangeFill = function () {
    document.querySelectorAll('input[type="range"].range').forEach(r => {
      const paint = () => { const pct = ((+r.value - +r.min) / ((+r.max - +r.min) || 1)) * 100; r.style.setProperty("--pct", pct.toFixed(2) + "%"); };
      r.addEventListener("input", paint); paint();
    });
  };

  // ---------- Boot ----------
  document.documentElement.classList.add("js");
  document.addEventListener("DOMContentLoaded", function () {
    AK.initTabs();
    AK.initSidebar();
    AK.initWizardVertical();
    AK.initSegmented();
    AK.initNicheCtl();
    AK.initRangeFill();
    AK.initHeroCalc();
    AK.initBigCalc();
    AK.initFaq();
    AK.initWizard();
    AK.initReveal();
    AK.initCountUp();
    AK.initMobileCta();
    AK.initRelated();
    document.querySelectorAll("[data-demo]").forEach(el => {
      el.addEventListener("click", e => { e.preventDefault(); AK.toast(el.getAttribute("data-demo") || "Funkce v demu není aktivní"); });
      // klávesnicová aktivace pro ne-button prvky s role="button" (dropzone apod.)
      if (el.getAttribute("role") === "button") {
        el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); } });
      }
    });
  });
})();
