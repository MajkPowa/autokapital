/* =========================================================================
   CashAuto — UX vrstva provozních aplikací (admin, klientská zóna, aftersales)
   Spodní navigace na telefonu, vysouvací menu s pozadím, tabulky jako karty.
   Nic neposílá na server; jen přepíná existující panely (.side-link → .tab-panel).
   ========================================================================= */
(function () {
  "use strict";
  var sb = document.querySelector(".sidebar");
  if (!sb) return;
  var links = [].slice.call(sb.querySelectorAll(".side-link[data-target]"));
  var toggles = [].slice.call(document.querySelectorAll("[data-sidebar-toggle]"));

  // ---------- vysouvací menu: pozadí, Escape, zámek posunu ----------
  var backdrop = document.createElement("div");
  backdrop.className = "sidebar-backdrop";
  document.body.appendChild(backdrop);
  var lastFocus = null;
  function closeDrawer() { sb.classList.remove("open"); }
  function syncDrawer() {
    var open = sb.classList.contains("open");
    backdrop.classList.toggle("on", open);
    document.body.classList.toggle("drawer-open", open);
    toggles.forEach(function (t) { t.setAttribute("aria-expanded", open ? "true" : "false"); t.setAttribute("aria-controls", sb.id || "sidebar"); });
    if (more) more.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      lastFocus = document.activeElement;
      var first = sb.querySelector(".side-link.active") || sb.querySelector(".side-link");
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 60);
    } else if (lastFocus && document.body.contains(lastFocus) && sb.contains(document.activeElement)) {
      lastFocus.focus({ preventScroll: true });
    }
  }
  backdrop.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && sb.classList.contains("open")) closeDrawer(); });

  // ---------- spodní navigace ----------
  var chosen = links.filter(function (l) { return l.hasAttribute("data-bn"); });
  if (!chosen.length) chosen = links.slice(0, 4);
  var nav = document.createElement("nav");
  nav.className = "bottom-nav";
  nav.setAttribute("aria-label", "Hlavní sekce");
  var items = chosen.map(function (l) {
    var b = document.createElement("button");
    b.type = "button";
    var svg = l.querySelector("svg");
    var label = l.getAttribute("data-bn") || l.getAttribute("data-title") || l.textContent.trim();
    b.innerHTML = (svg ? svg.outerHTML : "") + '<span class="lbl"></span>';
    b.querySelector(".lbl").textContent = label;
    b.addEventListener("click", function () { closeDrawer(); l.click(); });
    nav.appendChild(b);
    return { link: l, btn: b };
  });
  var more = null;
  if (links.length > chosen.length || sb.querySelector(".side-link:not([data-target])")) {
    more = document.createElement("button");
    more.type = "button";
    more.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg><span class="lbl">Více</span>';
    more.setAttribute("aria-label", "Další sekce");
    more.addEventListener("click", function () { sb.classList.toggle("open"); });
    nav.appendChild(more);
  }
  document.body.appendChild(nav);
  document.body.classList.add("has-bottom-nav");

  function syncNav() {
    var inNav = false, shown = 0;
    items.forEach(function (it) {
      var on = it.link.classList.contains("active");
      it.btn.hidden = it.link.hidden || shown >= 4;      // nejvýš čtyři položky + „Více“
      if (!it.btn.hidden) shown++;
      if (on && !it.btn.hidden) inNav = true;
      it.btn.classList.toggle("active", on);
      if (on) it.btn.setAttribute("aria-current", "page"); else it.btn.removeAttribute("aria-current");
      var badge = it.link.querySelector(".badge-count"), mine = it.btn.querySelector(".bn-badge");
      var txt = badge ? badge.textContent.trim() : "";
      if (txt && txt !== "0") {
        if (!mine) { mine = document.createElement("span"); mine.className = "bn-badge"; mine.setAttribute("aria-hidden", "true"); it.btn.appendChild(mine); }
        if (mine.textContent !== txt) mine.textContent = txt;
      } else if (mine) mine.remove();
      var al = it.link.getAttribute("aria-label");
      if (al) it.btn.setAttribute("aria-label", al); else it.btn.removeAttribute("aria-label");
    });
    if (more) more.classList.toggle("active", !inNav && links.some(function (l) { return l.classList.contains("active"); }));
  }

  var wasOpen = false, pending = false;
  new MutationObserver(function () {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () {
      pending = false;
      var open = sb.classList.contains("open");
      if (open !== wasOpen) { wasOpen = open; syncDrawer(); }
      syncNav();
    });
  }).observe(sb, { attributes: true, attributeFilter: ["class", "aria-label", "hidden"], subtree: true, childList: true, characterData: true });
  syncNav(); syncDrawer();

  // ---------- tabulky na telefonu ----------
  // Široké tabulky (5+ sloupců, nebo užší, které se nevejdou) se na telefonu skládají do karet:
  // každá buňka dostane popisek ze záhlaví. Úzké tabulky zůstanou tabulkou s menšími okraji.
  var mqPhone = window.matchMedia("(max-width: 640px)");
  function labelTables() {
    document.querySelectorAll(".app-content table.table:not(.no-stack)").forEach(function (t) {
      var heads = [].map.call(t.querySelectorAll("thead th"), function (th) { return th.textContent.trim(); });
      if (!heads.length) return;
      [].forEach.call(t.tBodies, function (tb) {
        [].forEach.call(tb.rows, function (tr) {
          if (tr.dataset.lbl === "1") return;
          tr.dataset.lbl = "1";
          var titled = false;
          [].forEach.call(tr.cells, function (td, i) {
            td.setAttribute("data-label", td.colSpan > 1 ? "" : (heads[i] || ""));
            if (td.querySelector(".btn")) td.classList.add("is-action");
            else if (!titled && tr.cells.length > 2 && td.querySelector("strong")) { td.classList.add("is-title"); titled = true; }
          });
        });
      });
      var wrap = t.closest(".table-wrap"), stack = heads.length >= 5 || t.dataset.stack === "1";
      if (!stack && mqPhone.matches && t.offsetParent !== null) {
        t.classList.remove("is-stacked"); t.classList.add("is-compact");
        if (wrap) wrap.classList.remove("stacked-wrap");
        if (wrap && t.scrollWidth > wrap.clientWidth + 2) { stack = true; t.dataset.stack = "1"; }
      }
      t.classList.toggle("is-stacked", stack);
      if (stack) t.classList.remove("is-compact");
      if (wrap) {
        wrap.classList.toggle("stacked-wrap", stack);
        var card = wrap.parentNode;
        if (card && card.classList.contains("card") && card.children.length === 1) card.classList.toggle("stacked-card", stack);
      }
    });
  }
  labelTables();
  var content = document.querySelector(".app-content"), lt = 0;
  function relabelSoon() { clearTimeout(lt); lt = setTimeout(labelTables, 80); }
  if (content) new MutationObserver(relabelSoon).observe(content, { childList: true, subtree: true });
  links.forEach(function (l) { l.addEventListener("click", relabelSoon); });
  window.addEventListener("resize", relabelSoon);
  if (document.readyState !== "complete") window.addEventListener("load", relabelSoon);

  window.AKux = { closeDrawer: closeDrawer, labelTables: labelTables };
})();
