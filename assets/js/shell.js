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
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    menu: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    x: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
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

  // Brand logo — inline SVG mark (zelená dvojitá lomítka) + wordmark Cash(zelená)Auto(tmavá)
  const LOGO_MARK = '<svg width="30" height="24" viewBox="0 0 30 24" fill="none" aria-hidden="true" style="flex:none"><path d="M7 1h7L7 23H0L7 1Z" fill="#007A52"/><path d="M17 1h7l-7 22h-7L17 1Z" fill="#007A52"/></svg>';
  const LOGO_IMG = LOGO_MARK + '<span class="brand-word"><span class="bw-cash">Cash</span><span class="bw-auto">Auto</span></span>';
  const LOGO_WHITE = '<svg width="24" height="18" viewBox="0 0 26 20" fill="none" aria-hidden="true"><path d="M6 1H11L5 19H0L6 1Z" fill="#fff"/><path d="M14 1H19L13 19H8L14 1Z" fill="#fff"/></svg><span>CashAuto</span>';
  // Sub-brand wordmarky (Cash vždy zeleně)
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
      host.innerHTML = `<section class="section pricing-comparison" aria-labelledby="pricing-title"><div class="container">
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

  // v4 (Apple-like): položky jsou čistý text — bez barevných teček vertikál (.nav-dot) v hlavičce i v mobilním menu.
  const NAV = [
    { label: "CashAuto", href: "/index.html", key: "home" },
    { label: "AgroCash", href: "/agrocash.html", key: "agro" },
    { label: "TechCash", href: "/techcash.html", key: "tech" },
    { label: "Jak to funguje", anchor: "jak-to-funguje", key: "" },
    { label: "Rádce", href: "/blog/", key: "blog" },
    { label: "O nás", href: "/prezentace.html", key: "prezentace" },
  ];

  function navLinks(active) {
    return NAV.map(n => {
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
    // v4 (Apple-like) hlavička vpravo: 13px textové položky (telefon jako prostý text bez ikony, „Přihlásit se“ bez rámečku)
    // a jediná malá pilulka (headerCta). Na /zadost.html je pilulkou samotný telefon → textový telefon by byl duplicitní.
    const headerPhone = ON_ZADOST ? "" : `<a class="nav-phone desktop-only" href="tel:${PHONE.tel}">${PHONE.label}</a>`;
    // Mobilní menu je SOUROZENEC hlavičky, ne její potomek: .site-header má backdrop-filter, a stala by se tak
    // containing blockem pro position:fixed → otevřené menu by mělo výšku jen paddingu a přetékalo přes obsah.
    // overflow-y:auto: na nižších displejích (např. 375×812) je obsah menu vyšší než viewport minus hlavička.
    return `
    <a class="skip-link" href="#main">Přeskočit na obsah</a>
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
    </header>
    ${familyHTML(active)}
    <div class="mobile-menu" id="mobileMenu" style="overflow-y:auto">
      <nav aria-label="Mobilní navigace"><ul class="nav-links">${navLinks(active)}
        <li><a href="${own("kalkulacka")}">Kalkulačka</a></li>
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
        <div class="footer-grid cols-5">
          <div>
            <a class="brand" href="/" aria-label="CashAuto — domů">${LOGO_IMG}</a>
            <p class="mt-3" style="max-width:320px"><strong>Provoz se nezastaví.</strong> CashAuto, AgroCash a TechCash — jedna rodina pro podnikatele. Dočasný výkup vozu, stroje či tahače se zpětným odkupem.</p>
            <span class="pill pill-mint mt-2">${I.shield} Rychle · Férově · Přehledně</span>
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

  // Auto-render marketing chrome
  document.addEventListener("DOMContentLoaded", function () {
    if (document.body.getAttribute("data-shell") === "marketing") {
      const active = document.body.getAttribute("data-active") || "";
      const h = document.getElementById("site-header");
      const f = document.getElementById("site-footer");
      if (h) h.outerHTML = headerHTML(active);
      if (f) f.outerHTML = footerHTML();
      renderPricingComparison();
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
        });
        menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => { if (menu.classList.contains("open")) tog.click(); }));
        menu.addEventListener("keydown", e => {
          if (e.key === "Escape" && menu.classList.contains("open")) { tog.click(); tog.focus(); }
        });
      }
    }
  });
})();
