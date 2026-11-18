/* =========================================================================
   CashAuto — ochrana stránek aplikace (admin.html, aftersales.html, portal.html)
   Vkládá se do <head> ZA config.js a backend.js:
     <script src="assets/js/guard.js" data-need="staff"></script>   … jen správci
     <script src="assets/js/guard.js" data-need="any"></script>     … kdokoliv přihlášený
   Dokud není ověřené přihlášení, stránka se nevykreslí. Nepřihlášený návštěvník je
   přesměrován na prihlaseni.html. Skutečnou ochranu DAT dělá databáze (RLS) — tento
   skript jen řídí, co se komu zobrazí.
   ========================================================================= */
(function () {
  "use strict";
  var B = window.AKbackend, me = document.currentScript, need = (me && me.getAttribute("data-need")) || "any";
  var root = document.documentElement;
  root.classList.add("auth-wait");
  var st = document.createElement("style");
  st.textContent = "html.auth-wait body{visibility:hidden}html.auth-wait{background:#0F1512}";
  document.head.appendChild(st);
  var page = location.pathname.split("/").pop() || "index.html";
  function toLogin() { location.replace("prihlaseni.html?next=" + encodeURIComponent(page + location.hash)); }
  if (!B) { toLogin(); return; }
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var initials = function (s) { var p = String(s.profile.name || s.user.email || "?").trim().split(/\s+/); return ((p[0] || "?").charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : "")).toUpperCase(); };
  var dom = function (fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); };

  function denied(s) {
    dom(function () {
      document.body.innerHTML = '<main class="auth-denied"><h1>Sem nemáte přístup</h1><p>Účet <strong>' + esc(s.user.email) + '</strong> je klientský. Administrace je jen pro správce.</p>' +
        '<p><a class="btn btn-primary" href="portal.html">Do klientské zóny</a> <button type="button" class="btn btn-ghost" id="gdOut">Odhlásit se</button></p></main>';
      document.getElementById("gdOut").addEventListener("click", function () { B.signOut().then(toLogin); });
      root.classList.remove("auth-wait");
    });
  }
  function accountUi(s) {
    var av = document.querySelector(".topbar .avatar"); if (!av) return;
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "avatar acct-btn"; btn.textContent = initials(s);
    btn.setAttribute("aria-haspopup", "true"); btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-label", "Účet: " + (s.profile.name || s.user.email));
    av.parentNode.replaceChild(btn, av);
    var pill = btn.parentNode.querySelector(".pill");
    if (pill && need === "staff") pill.innerHTML = '<span class="dot"></span> ' + (B.live ? "Ostrý režim" : "Ukázkový režim");
    var menu = null;
    function close() { if (menu) { menu.remove(); menu = null; btn.setAttribute("aria-expanded", "false"); } }
    btn.addEventListener("click", function () {
      if (menu) return close();
      var cur = B.session() || s, hasProfile = !!document.getElementById("profil");
      menu = document.createElement("div"); menu.className = "acct-menu"; menu.setAttribute("role", "dialog"); menu.setAttribute("aria-label", "Účet");
      menu.innerHTML = '<div class="am-who"><strong>' + esc(cur.profile.name || "Bez jména") + "</strong><span>" + esc(cur.user.email) + '</span><span class="am-role">' + (cur.role === "staff" ? "Správce" : "Klient") +
        " · " + (B.live ? "ostrý režim" : "ukázkový režim") + "</span></div>" +
        (hasProfile ? '<button type="button" data-a="profile">Můj profil</button>' : cur.role === "staff" ? '<a href="portal.html#profil">Můj profil</a>' : "") +
        (cur.role === "staff" && need !== "staff" ? '<a href="admin.html">Administrace</a>' : "") +
        '<button type="button" data-a="out">Odhlásit se</button>';
      document.body.appendChild(menu);
      var r = btn.getBoundingClientRect(); menu.style.top = (r.bottom + 8) + "px"; menu.style.right = Math.max(12, window.innerWidth - r.right) + "px";
      btn.setAttribute("aria-expanded", "true");
      menu.addEventListener("click", function (e) {
        var b = e.target.closest("[data-a]"); if (!b) return;
        if (b.dataset.a === "out") B.signOut().then(function () { location.href = "prihlaseni.html"; });
        else { close(); var l = document.querySelector('.side-link[data-target="profil"]'); if (l) l.click(); }
      });
      (menu.querySelector("button, a") || menu).focus();
    });
    document.addEventListener("click", function (e) { if (menu && !menu.contains(e.target) && e.target !== btn) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu) { close(); btn.focus(); } });
    B.onAuth(function (n) { if (n) { btn.textContent = initials(n); btn.setAttribute("aria-label", "Účet: " + (n.profile.name || n.user.email)); } });
  }
  // správce: po 30 minutách nečinnosti odhlásit (ostrý režim)
  function idleLogout() {
    var t = 0, LIMIT = 30 * 60 * 1000;
    var arm = function () { clearTimeout(t); t = setTimeout(function () { B.signOut().then(toLogin); }, LIMIT); };
    ["pointerdown", "keydown", "scroll", "visibilitychange"].forEach(function (ev) { window.addEventListener(ev, arm, { passive: true }); });
    arm();
  }

  B.ready.then(function (s) {
    if (!s) return toLogin();
    if (need === "staff" && s.role !== "staff") return denied(s);
    window.AKsession = s;
    root.setAttribute("data-mode", B.mode); root.setAttribute("data-role", s.role);
    if (s.sample) root.setAttribute("data-sample", "1");
    root.classList.remove("auth-wait");
    dom(function () { accountUi(s); document.dispatchEvent(new CustomEvent("ak:auth", { detail: s })); });
    if (B.live && s.role === "staff") idleLogout();
    B.onAuth(function (n) { if (!n) toLogin(); });
  });
})();
