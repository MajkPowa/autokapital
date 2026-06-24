/* =========================================================================
   AutoKapitál — Shared chrome (icons, logo, marketing header + footer)
   Pages set <body data-shell="marketing" data-active="home"> to auto-render
   the header into #site-header and footer into #site-footer.
   ========================================================================= */
(function () {
  "use strict";

  // ---- Inline icon set (stroke-based, currentColor) ----
  const I = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13l2-5a3 3 0 0 1 2.8-2h8.4A3 3 0 0 1 21 8l2 5"/><path d="M2 13h20v5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" transform="translate(-1 0)"/><circle cx="7" cy="16" r="1.4"/><circle cx="17" cy="16" r="1.4"/></svg>',
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
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="4"/><path d="M11 11l8 8M16 16l2-2M19 19l2-2"/></svg>',
  };

  // Brand logo — real WEBP asset (green "Auto" + dark "Kapitál")
  const LOGO_SRC = "Public/components/logo-autokapital-transparent.webp";
  const LOGO_IMG = '<img class="brand-logo" src="' + LOGO_SRC + '" alt="AutoKapitál" width="520" height="120">';
  // White wordmark for dark/green surfaces (sidebars)
  const LOGO_WHITE = '<span class="brand-wordmark" aria-hidden="true"><svg width="26" height="20" viewBox="0 0 26 20" fill="none"><path d="M6 1H11L5 19H0L6 1Z" fill="#fff"/><path d="M14 1H19L13 19H8L14 1Z" fill="#fff"/></svg></span><span>AutoKapitál</span>';

  const NAV = [
    { label: "Výhody", href: "index.html#vyhody", key: "home" },
    { label: "Jak to funguje", href: "index.html#jak-to-funguje", key: "home" },
    { label: "Pro koho", href: "index.html#pro-koho", key: "home" },
    { label: "Kalkulačka", href: "index.html#kalkulacka", key: "home" },
    { label: "O nás", href: "prezentace.html", key: "prezentace" },
    { label: "FAQ", href: "index.html#faq", key: "home" },
  ];

  function navLinks() {
    return NAV.map(n => `<li><a href="${n.href}">${n.label}</a></li>`).join("");
  }

  function headerHTML() {
    return `
    <header class="site-header">
      <div class="container nav-inner">
        <a class="brand" href="index.html" aria-label="AutoKapitál — domů">${LOGO_IMG}</a>
        <nav aria-label="Hlavní navigace"><ul class="nav-links">${navLinks()}</ul></nav>
        <div class="nav-actions">
          <a class="btn btn-ghost btn-sm desktop-only" href="portal.html">Přihlásit se</a>
          <a class="btn btn-primary btn-sm" href="zadost.html">Získat nabídku</a>
          <button class="nav-toggle" id="navToggle" aria-label="Otevřít menu" aria-expanded="false">${I.menu}</button>
        </div>
      </div>
      <div class="mobile-menu" id="mobileMenu">
        <nav aria-label="Mobilní navigace"><ul class="nav-links">${navLinks()}
          <li><a href="portal.html">Přihlásit do portálu</a></li>
          <li><a href="admin.html">Admin (demo)</a></li>
        </ul></nav>
      </div>
    </header>`;
  }

  function footerHTML() {
    return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <a class="brand" href="index.html" aria-label="AutoKapitál — domů">${LOGO_IMG}</a>
            <p class="mt-3" style="max-width:320px">Peníze z auta. Auto používáte dál. Rychlé a férové řešení, když potřebujete peníze, ale auto dál potřebujete pro život.</p>
            <span class="pill pill-mint mt-2">${I.shield} Rychle · Férově · Bez starostí</span>
          </div>
          <div>
            <h4>Produkty</h4>
            <ul class="footer-links">
              <li><a href="zadost.html">Peníze z hodnoty auta</a></li>
              <li><a href="index.html#jak-to-funguje">Zpětný odkup</a></li>
              <li><a href="index.html#pro-koho">Pro domácnosti a řidiče</a></li>
              <li><a href="index.html#kalkulacka">Orientační kalkulačka</a></li>
            </ul>
          </div>
          <div>
            <h4>Společnost</h4>
            <ul class="footer-links">
              <li><a href="prezentace.html">O nás / Prezentace</a></li>
              <li><a href="faze2.html">Roadmapa & Fáze 2</a></li>
              <li><a href="compliance.html">Férovost & compliance</a></li>
              <li><a href="portal.html">Klientský portál</a></li>
            </ul>
          </div>
          <div>
            <h4>Podpora</h4>
            <ul class="footer-links">
              <li><a href="index.html#faq">Časté dotazy</a></li>
              <li><a href="mailto:info@autokapital.cz">info@autokapital.cz</a></li>
              <li><a href="tel:+420800123456">+420 800 123 456</a></li>
              <li class="muted">Po–Pá 8:00–18:00</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2026 AutoKapitál a.s. — Demoprezentace produktu. Nejedná se o závaznou nabídku ani o právní poradenství.</span>
          <span>Financování proti hodnotě vozu se zpětným odkupem · Podmínky vždy předem.</span>
        </div>
      </div>
    </footer>`;
  }

  // Expose for all pages
  window.AK = window.AK || {};
  window.AK.icons = I;
  window.AK.logoSrc = LOGO_SRC;
  window.AK.logoImg = LOGO_IMG;
  window.AK.logoWhite = LOGO_WHITE;
  window.AK.icon = (name) => I[name] || "";

  // Auto-render marketing chrome
  document.addEventListener("DOMContentLoaded", function () {
    if (document.body.getAttribute("data-shell") === "marketing") {
      const h = document.getElementById("site-header");
      const f = document.getElementById("site-footer");
      if (h) h.outerHTML = headerHTML();
      if (f) f.outerHTML = footerHTML();

      // active link highlight
      const active = document.body.getAttribute("data-active");
      if (active) {
        document.querySelectorAll(".nav-links a").forEach(a => {
          const item = NAV.find(n => n.href === a.getAttribute("href"));
          if (item && item.key === active) a.style.color = "var(--blue)";
        });
      }
      // mobile toggle
      const tog = document.getElementById("navToggle");
      const menu = document.getElementById("mobileMenu");
      if (tog && menu) {
        tog.addEventListener("click", () => {
          const open = menu.classList.toggle("open");
          tog.setAttribute("aria-expanded", String(open));
          tog.innerHTML = open ? I.x : I.menu;
        });
      }
    }
  });
})();
