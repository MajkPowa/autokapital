/* =========================================================================
   CashAuto — Shared chrome (icons, logo, marketing header + footer)
   Pages set <body data-shell="marketing" data-active="home|agro|tech|blog|prezentace">
   to auto-render the header into #site-header and footer into #site-footer.
   All chrome links are root-absolute so pages in /blog/ resolve correctly.
   ========================================================================= */
(function () {
  "use strict";

  // ---- Inline icon set (stroke-based, currentColor) ----
  const I = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    menu: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    x: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13l2-5a3 3 0 0 1 2.8-2h8.4A3 3 0 0 1 21 8l2 5"/><path d="M2 13h20v5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" transform="translate(-1 0)"/><circle cx="7" cy="16" r="1.4"/><circle cx="17" cy="16" r="1.4"/></svg>',
    tractor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15V9h6l2-5h4v11"/><path d="M10 9V4"/><circle cx="7" cy="17" r="3.5"/><circle cx="18" cy="18" r="2.5"/><path d="M10.5 17h5"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h12v10H2z"/><path d="M14 9h4l3 3v4h-7"/><circle cx="6" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/></svg>',
    calc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h2M14 10h2M8 14h2M14 14h2M8 18h2M14 18h2"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v0H5"/><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="16" cy="13.5" r="1.4"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6M18 20a6 6 0 0 0-3-5.2"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 16H3z"/><path d="M12 9v4M12 16.5v.5"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4l6 6L8 22H2v-6z"/><path d="M13 5l6 6"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2"/><path d="M18 4v5h-5M6 20v-5h5"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="4"/><path d="M11 11l8 8M16 16l2-2M19 19l2-2"/></svg>',
  };

  // ---- Piktogramy v6 „Signál“ (mřížka 24, tah 2 px, třída .a = barevná výplň) ----
  // Stejné tvary jsou staticky vložené v HTML stránek (tools/apply-pictograms.py je čte odsud).
  const P = {
    bolt: '<path class="a" d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5z"/><path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5z"/>',
    shield: '<path class="a" d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z"/><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/>',
    visit: '<path class="a" d="M5 10.4 12 5l7 5.4V19H5z"/><path d="M3 11l9-7 9 7"/><path d="M5 10v9h14v-9"/><path d="M10 19v-5h4v5"/>',
    screen: '<rect class="a" x="3" y="4" width="18" height="13" rx="2"/><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M7 12l3-3 2.5 2.5L17 8"/>',
    van: '<path class="a" d="M2 6h11v10H2z"/><path d="M2 16V6h11v10"/><path d="M13 9h4.5l3.5 4v3h-8"/><path d="M9 16h5"/><circle cx="6.5" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    tractor: '<circle class="a" cx="7" cy="17" r="3.5"/><path d="M4 13.5V9h6l2-5h4v10.5"/><path d="M10 9V4"/><circle cx="7" cy="17" r="3.5"/><circle cx="18" cy="18" r="2.5"/><path d="M10.5 17h5"/>',
    truck: '<path class="a" d="M2 6h12v10H2z"/><path d="M2 6h12v10H2z"/><path d="M14 9h4l3 3v4h-7"/><circle cx="6" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    doc: '<path class="a" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
    back: '<circle class="a" cx="12" cy="12" r="5.2"/><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3 3v5h5"/><path d="M12 8v4l2.5 1.5"/>',
    clock: '<circle class="a" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    seed: '<path class="a" d="M12 12c-4 0-7-3-7-7 4 0 7 3 7 7z"/><path d="M12 22V12"/><path d="M12 12c-4 0-7-3-7-7 4 0 7 3 7 7z"/><path d="M12 14c4 0 7-3 7-7-4 0-7 3-7 7z"/>',
    fuel: '<path class="a" d="M4 20V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14z"/><path d="M4 20V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14"/><path d="M3 20h14M16 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V10l-3-3"/><path d="M7 8h6"/>',
    wrench: '<path class="a" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',
    users: '<circle class="a" cx="9" cy="8" r="3.2"/><circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6M18 20a6 6 0 0 0-3-5.2"/>',
    calendar: '<path class="a" d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4H3z"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    bag: '<path class="a" d="M7 9h10l1.5 11h-13z"/><path d="M7 9h10l1.5 11h-13z"/><path d="M9 9V6.5a3 3 0 0 1 6 0V9"/>',
    chart: '<rect class="a" x="8.4" y="4" width="3.2" height="16"/><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    map: '<path class="a" d="M9 4 3 6v14l6-2z"/><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    tyre: '<circle class="a" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/>',
    cover: '<path class="a" d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z"/><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z"/>',
    case: '<path class="a" d="M4 7h16v13H4z"/><path d="M4 7h16v13H4z"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M4 12h16"/>',
    tick: '<path d="M4 12.5l5 5L20 6.5"/>',
    calc: '<rect class="a" x="7" y="5" width="10" height="4" rx="1"/><rect x="4" y="2" width="16" height="20" rx="2"/><rect x="7" y="5" width="10" height="4" rx="1"/><path d="M8 13h2M14 13h2M8 17h2M14 17h2"/>',
    seal: '<circle class="a" cx="12" cy="9" r="6"/><circle cx="12" cy="9" r="6"/><path d="M8.8 14.2 7 21l5-2.800L17 21l-1.800-6.800"/><path d="M9.500 9l1.800 1.800 3.400-3.400"/>',
    user: '<circle class="a" cx="12" cy="8" r="4"/><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  };

  // Logo — dvojité lomítko v dlaždici (asfalt + dynamická barva) a wordmark v Archivu
  const LOGO_MARK = '<svg class="logo-mark" width="34" height="28" viewBox="0 0 34 28" aria-hidden="true"><rect class="lm-bg" width="34" height="28" rx="7"/><path class="lm-s" d="M11.6 6h5.200l-4.300 16H7.300z"/><path class="lm-s" d="M21.500 6h5.200l-4.300 16h-5.200z"/></svg>';
  const LOGO_IMG = LOGO_MARK + '<span class="brand-word"><span class="bw-cash">Cash</span><span class="bw-auto">Auto</span></span>';
  const LOGO_WHITE = LOGO_MARK + '<span>CashAuto</span>';
  // Sub-brand wordmarky
  const SUB = {
    agro: '<span class="brand-word"><span class="bw-ink">Agro</span><span class="bw-cash">Cash</span></span>',
    tech: '<span class="brand-word"><span class="bw-ink">Tech</span><span class="bw-cash">Cash</span></span>',
    auto: '<span class="brand-word"><span class="bw-cash">Cash</span><span class="bw-ink">Auto</span></span>',
  };

  const PHONE = { tel: "+420800123456", label: "800 123 456" };
  // Aktivovat až po dodání ověřeného WhatsApp Business čísla v mezinárodním formátu.
  // Prázdná hodnota nezobrazuje odkaz; demo telefon se pro WhatsApp nepoužívá.
  const WHATSAPP_NUMBER = "";
  function whatsappLink(className) {
    if (!/^\+?[1-9]\d{7,14}$/.test(WHATSAPP_NUMBER)) return "";
    const number = WHATSAPP_NUMBER.replace(/^\+/, "");
    const message = encodeURIComponent("Dobrý den, zajímají mě podmínky dočasného výkupu pro podnikatele.");
    return `<a class="${className}" href="https://wa.me/${number}?text=${message}" target="_blank" rel="noopener noreferrer">Napsat na WhatsApp</a>`;
  }

  function familyHTML(active) {
    return `<div class="brand-family"><div class="container brand-family-inner">
      <p><strong>Provoz se nezastaví.</strong><span> Rodina CashAuto</span></p>
      <nav aria-label="Produktové řady CashAuto">${[
        ["home", "/index.html", "CashAuto"], ["agro", "/agrocash.html", "AgroCash"], ["tech", "/techcash.html", "TechCash"]
      ].map(([key, href, label]) => `<a href="${href}"${active === key ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>
    </div></div>`;
  }

  // Jediný zdroj sazeb pro srovnání i kalkulačky: AK.verticals v data.js.
  function renderPricingComparison() {
    const verticals = window.AK && window.AK.verticals;
    if (!verticals) return;
    const percent = n => (n * 100).toLocaleString("cs-CZ", { maximumFractionDigits: 1 }) + " %";
    const current = document.body.getAttribute("data-vertical") || "auto";
    document.querySelectorAll("[data-pricing-comparison]").forEach(host => {
      host.innerHTML = `<section class="section pricing-comparison dyn" aria-labelledby="pricing-title"><div class="container">
        <div class="section-head"><div><span class="eyebrow">Podmínky vedle sebe</span><h2 id="pricing-title">Tři řady. Přehledné ceny.</h2>
          <p>Každá řada má vlastní orientační parametry podle typu majetku. Sazba ${percent(verticals.auto.feeRate)} měsíčně platí pro firemní vozy CashAuto; AgroCash a TechCash mají sazby uvedené níže.</p></div></div>
        <div class="pricing-table-wrap" role="region" aria-label="Srovnání orientačních cen produktových řad" tabindex="0"><table class="pricing-table">
          <caption>Výkup a měsíční rezervační poplatek z odhadní hodnoty majetku</caption>
          <thead><tr><th scope="col">Produktová řada</th><th scope="col">Výkup</th><th scope="col">Poplatek za měsíc</th></tr></thead>
          <tbody>${["auto", "agro", "tech"].map(key => {
            const v = verticals[key];
            const href = key === "auto" ? "/index.html" : key === "agro" ? "/agrocash.html" : "/techcash.html";
            return `<tr${key === current ? ' class="pricing-current"' : ""}><th scope="row"><a href="${href}">${v.name}</a><span>${v.label}</span></th><td>${percent(v.vykupRate)}</td><td>${percent(v.feeRate)}</td></tr>`;
          }).join("")}</tbody></table></div>
        <p class="pricing-note"><strong>Obě procenta vycházejí z odhadní hodnoty, nikoli z vyplacené částky.</strong> Nižší procentní sazba proto sama o sobě neznamená nižší poplatek v Kč. Konkrétní výkupní cenu, poplatky za zvolenou dobu a cenu zpětného odkupu uvidíte před podpisem.</p>
        <p class="muted mb-0" style="font-size:var(--fs-sm)">Orientační propočet není závazná nabídka. Stav a hodnotu majetku i podmínky každé žádosti posuzujeme individuálně. <a href="/compliance.html">Podmínky a férovost</a></p>
      </div></section>`;
    });
  }

  // Kotvy „Jak to funguje“ / „Kalkulačka“ / „Časté dotazy“ vedou na sekci AKTUÁLNÍ stránky
  // (agrocash.html a techcash.html mají vlastní), jinak na hlavní stránku. Volá se až při renderu (DOM je k dispozici).
  function own(id) {
    return document.getElementById(id) ? location.pathname + "#" + id : "/index.html#" + id;
  }

  // Hlavní menu = obsah; tři produktové řady nese pás rodiny značek (viditelný na všech šířkách).
  // Mobilní menu obsahuje obojí.
  const LINES = [
    { label: "CashAuto", href: "/index.html", key: "home" },
    { label: "AgroCash", href: "/agrocash.html", key: "agro" },
    { label: "TechCash", href: "/techcash.html", key: "tech" },
  ];
  const NAV = [
    { label: "Jak to funguje", anchor: "jak-to-funguje", key: "" },
    { label: "Kalkulačka", anchor: "kalkulacka", key: "" },
    { label: "Rádce", href: "/blog/", key: "blog" },
    { label: "O nás", href: "/prezentace.html", key: "prezentace" },
  ];

  function navLinks(active, items) {
    return (items || NAV).map(n => {
      const href = n.anchor ? own(n.anchor) : n.href;
      const cls = n.key && n.key === active ? ' class="active" aria-current="page"' : "";
      return `<li><a href="${href}"${cls}>${n.label}</a></li>`;
    }).join("");
  }

  // Stránka žádosti: CTA „Chci nabídku“ by jen znovu načetlo formulář (a smazalo rozpracované kroky) → nabízíme telefon
  const ON_ZADOST = /\/zadost(?:\.html)?$/.test(location.pathname);

  // CTA do žádosti nese vertikálu (agro/tech), aby žádost ukázala správné typy strojů.
  // Na /zadost.html?typ=… nemá body ještě data-vertical (doplní ho až app.js), proto fallback na parametr v URL.
  // Povoleny jen známé hodnoty — parametr z URL se vkládá do href.
  function zadostHref() {
    const v = document.body.getAttribute("data-vertical") || new URLSearchParams(location.search).get("typ");
    return "/zadost.html" + (v === "agro" || v === "tech" ? "?typ=" + v : "");
  }

  function headerHTML(active) {
    const callBtn = (size) => `<a class="btn btn-primary ${size}" href="tel:${PHONE.tel}" aria-label="Zavolat ${PHONE.label}"><span class="hide-xs">Zavolat </span>${PHONE.label}</a>`;
    const headerCta = ON_ZADOST ? callBtn("btn-sm") : `<a class="btn btn-primary btn-sm" href="${zadostHref()}">Chci nabídku</a>`;
    const mobileCta = ON_ZADOST ? callBtn("btn-lg") : `<a class="btn btn-primary btn-lg" href="${zadostHref()}">Chci nabídku</a>
          <a class="btn btn-ghost btn-lg" href="tel:${PHONE.tel}">Zavolat ${PHONE.label}</a>`;
    const headerPhone = ON_ZADOST ? "" : `<a class="nav-phone desktop-only" href="tel:${PHONE.tel}">${PHONE.label}</a>`;
    // Mobilní menu je SOUROZENEC hlavičky (position:fixed pod hlavičkou); zavřené je visibility:hidden,
    // takže jeho odkazy nejsou ve fokusovém pořadí.
    return `
    <a class="skip-link" href="#main">Přeskočit na obsah</a>
    <div class="top-sentinel" id="topSentinel" aria-hidden="true"></div>
    <header class="site-header">
      <div class="container nav-inner">
        <a class="brand" href="/" aria-label="CashAuto — domů">${LOGO_IMG}</a>
        <nav aria-label="Hlavní navigace"><ul class="nav-links">${navLinks(active)}</ul></nav>
        <div class="nav-actions">
          ${headerPhone}
          <a class="nav-plain desktop-only" href="/portal.html">Přihlásit se</a>
          ${headerCta}
          <button class="nav-toggle" id="navToggle" aria-label="Otevřít menu" aria-expanded="false" aria-controls="mobileMenu">${I.menu}</button>
        </div>
      </div>
      <span class="scroll-progress" aria-hidden="true"></span>
    </header>
    ${familyHTML(active)}
    <div class="mobile-menu" id="mobileMenu">
      <nav aria-label="Mobilní navigace"><ul class="nav-links">${navLinks(active, LINES)}${navLinks(active)}
        <li><a href="/compliance.html">Férovost &amp; compliance</a></li>
        <li><a href="/portal.html">Přihlásit do klientské zóny</a></li>
      </ul></nav>
      <div class="mm-actions">
        ${mobileCta}
        ${whatsappLink("btn btn-ghost btn-lg")}
      </div>
    </div>`;
  }

  function footerHTML() {
    const A = (window.AK && window.AK.articles) || [];
    const guide = A.slice(0, 5).map(a => `<li><a href="/blog/${a.slug}.html">${a.title}</a></li>`).join("");
    return `
    <footer class="site-footer">
      <div class="container">
        <div class="lane" aria-hidden="true"></div>
        <div class="footer-grid cols-5">
          <div>
            <a class="brand" href="/" aria-label="CashAuto — domů">${LOGO_IMG}</a>
            <p class="mt-3" style="max-width:320px"><strong>Provoz se nezastaví.</strong> CashAuto, AgroCash a TechCash — jedna rodina pro podnikatele. Dočasný výkup vozu, stroje či tahače se zpětným odkupem.</p>
            <span class="pill mt-3">${I.shield} Rychle · Férově · Přehledně</span>
          </div>
          <div>
            <h4>Řešení</h4>
            <ul class="footer-links">
              <li><a href="/index.html">CashAuto — firemní vozy</a></li>
              <li><a href="/agrocash.html">AgroCash — zemědělská technika</a></li>
              <li><a href="/techcash.html">TechCash — autodopravci</a></li>
              <li><a href="${own("kalkulacka")}">Orientační kalkulačka</a></li>
              <li><a href="${zadostHref()}">Nezávazná žádost</a></li>
            </ul>
          </div>
          <div>
            <h4>Společnost</h4>
            <ul class="footer-links">
              <li><a href="/prezentace.html">O nás</a></li>
              <li><a href="/compliance.html">Férovost &amp; compliance</a></li>
              <li><a href="/portal.html">Klientská zóna</a></li>
            </ul>
          </div>
          <div>
            <h4>Rádce pro podnikatele</h4>
            <ul class="footer-links">${guide}<li><a href="/blog/"><strong>Všechny články →</strong></a></li></ul>
          </div>
          <div>
            <h4>Podpora</h4>
            <ul class="footer-links">
              <li><a href="${own("faq")}">Časté dotazy</a></li>
              <li><a href="mailto:info@cashauto.cz">info@cashauto.cz</a></li>
              <li><a href="tel:${PHONE.tel}">+420 ${PHONE.label}</a></li>
              ${whatsappLink("") ? `<li>${whatsappLink("")}</li>` : ""}
              <li class="muted">Po–Pá 8–18</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span><strong>Povinné informace:</strong> CashAuto a.s. (demo) · IČO 000 00 000 · Sídlo a adresa pro doručování: Příkladová 123, 110 00 Praha 1 · Tel.: <a href="tel:${PHONE.tel}">+420 ${PHONE.label}</a> · E-mail: <a href="mailto:info@cashauto.cz">info@cashauto.cz</a> · <a href="/compliance.html#povinne-informace">Povinné informace, kontaktní údaje a vaše práva</a></span>
          <span>Pozor! Tato služba není zdarma — za rezervaci možnosti zpětného odkupu platíte měsíční poplatek.</span>
          <span>© 2026 CashAuto a.s. — Demoprezentace produktu. Nejedná se o závaznou nabídku ani o právní poradenství. Služba je určena výhradně podnikatelům a firmám — spotřebitelům ji neposkytujeme. AgroCash a TechCash jsou produktové řady CashAuto a.s.</span>
          <span>Pro partnery a investory (demo): <a href="/prezentace.html">Prezentace</a> · <a href="/faze2.html">Fáze 2</a> · <a href="/admin.html">Admin</a> · <a href="/aftersales.html">Aftersales</a></span>
        </div>
      </div>
    </footer>`;
  }

  // Expose for all pages
  window.AK = window.AK || {};
  window.AK.icons = I;
  window.AK.logoImg = LOGO_IMG;
  window.AK.logoWhite = LOGO_WHITE;
  window.AK.subBrand = SUB;
  window.AK.phone = PHONE;
  window.AK.icon = (name) => I[name] || "";
  window.AK.pic = (name) => `<svg class="pic" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ""}</svg>`;

  // Běžící pás: <div class="marquee" data-marquee="a|b|c"> → dvě kopie obsahu (druhá aria-hidden), smyčka v CSS
  function buildMarquees() {
    document.querySelectorAll("[data-marquee]").forEach(el => {
      const items = (el.getAttribute("data-marquee") || "").split("|").map(t => t.trim()).filter(Boolean);
      if (!items.length) return;
      const once = (hidden) => items.concat(items).map(t => `<span${hidden ? ' aria-hidden="true"' : ""}>${t}</span>`).join("");
      el.innerHTML = `<div class="marquee-track">${once(false)}${once(true)}</div>`;
    });
  }
  // Nekonečné pásy běží jen ve viewportu (třída .is-inview); hlavička se „zhutní“ po odscrollování.
  // Vše přes IntersectionObserver — žádné posluchače scrollu.
  function observeMotion() {
    const loops = document.querySelectorAll(".marquee, .lane, .calc-band");
    if (!("IntersectionObserver" in window)) { loops.forEach(el => el.classList.add("is-inview")); return; }
    const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle("is-inview", e.isIntersecting)), { rootMargin: "80px 0px" });
    loops.forEach(el => io.observe(el));
    const top = document.getElementById("topSentinel");
    if (top) new IntersectionObserver(es => es.forEach(e => document.documentElement.classList.toggle("is-scrolled", !e.isIntersecting))).observe(top);
  }

  // Auto-render marketing chrome
  document.addEventListener("DOMContentLoaded", function () {
    if (document.body.getAttribute("data-shell") === "marketing") {
      const active = document.body.getAttribute("data-active") || "";
      const h = document.getElementById("site-header");
      const f = document.getElementById("site-footer");
      if (h) h.outerHTML = headerHTML(active);
      if (f) f.outerHTML = footerHTML();
      renderPricingComparison();
      buildMarquees();
      observeMotion();
      document.querySelectorAll(".site-header svg, .mobile-menu svg, .site-footer svg").forEach(s => s.setAttribute("aria-hidden", "true"));
      // hlavní obsah pro skip-link (mobilní menu je sourozenec hlavičky, proto první prvek ZA ním)
      const main = document.querySelector("main") || document.querySelector(".mobile-menu + *");
      if (main && !main.id) main.id = "main";
      // mobile toggle
      const tog = document.getElementById("navToggle");
      const menu = document.getElementById("mobileMenu");
      const family = document.querySelector(".brand-family");
      if (tog && menu) {
        tog.addEventListener("click", () => {
          const open = menu.classList.toggle("open");
          if (family) family.inert = open;
          tog.setAttribute("aria-expanded", String(open));
          tog.setAttribute("aria-label", open ? "Zavřít menu" : "Otevřít menu");
          tog.innerHTML = open ? I.x : I.menu;
          document.body.style.overflow = open ? "hidden" : "";
          document.documentElement.classList.toggle("menu-open", open);
        });
        menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => { if (menu.classList.contains("open")) tog.click(); }));
        menu.addEventListener("keydown", e => {
          if (e.key === "Escape" && menu.classList.contains("open")) { tog.click(); tog.focus(); }
        });
      }
    }
  });
})();
