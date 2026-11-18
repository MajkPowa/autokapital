/* CashAuto — přihlašovací stránka (prihlaseni.html): přihlášení, nový účet, obnova hesla. */
(function () {
  "use strict";
  var B = window.AKbackend;
  var $ = function (id) { return document.getElementById(id); };
  var panes = { login: $("paneLogin"), signup: $("paneSignup"), reset: $("paneReset"), newpass: $("paneNewpass") };
  var tabs = { login: $("tabLogin"), signup: $("tabSignup") }, msg = $("authMsg");
  // kam po přihlášení: jen vlastní stránky aplikace (žádné cizí adresy)
  var ALLOWED = ["portal.html", "admin.html", "aftersales.html"];
  var next = new URLSearchParams(location.search).get("next") || "";
  var nextPage = next.split("#")[0];
  if (ALLOWED.indexOf(nextPage) < 0) next = "";
  function dest(s) {
    if (s.role === "staff") return next || "admin.html";
    return next && nextPage === "portal.html" ? next : "portal.html";
  }
  function say(text, kind) { msg.hidden = !text; msg.textContent = text || ""; msg.className = "auth-msg" + (kind ? " " + kind : ""); }
  function show(name) {
    Object.keys(panes).forEach(function (k) { panes[k].hidden = k !== name; });
    Object.keys(tabs).forEach(function (k) { tabs[k].setAttribute("aria-selected", k === name ? "true" : "false"); });
    document.querySelector(".auth-tabs").hidden = name === "newpass";
    say("");
    var f = panes[name].querySelector("input"); if (f) f.focus({ preventScroll: true });
  }
  function busy(form, on) { var b = form.querySelector(".auth-submit"); b.disabled = on; b.classList.toggle("is-busy", on); form.setAttribute("aria-busy", on ? "true" : "false"); }
  function run(form, promise, done) {
    busy(form, true); say("");
    promise.then(function (r) { busy(form, false); done(r); }, function (e) { busy(form, false); say(e && e.message ? e.message : "Něco se nepovedlo. Zkuste to prosím znovu.", "err"); });
  }
  function go(s) { say("Přihlášeno, přesměrovávám…", "ok"); location.replace(dest(s)); }

  if (!B) { say("Přihlášení se nepodařilo načíst. Obnovte prosím stránku.", "err"); return; }
  $("authDemo").hidden = B.live;

  tabs.login.addEventListener("click", function () { show("login"); });
  tabs.signup.addEventListener("click", function () { show("signup"); });
  document.addEventListener("click", function (e) {
    var g = e.target.closest("[data-go]"); if (g) { show(g.dataset.go); if (g.dataset.go === "reset") $("r_email").value = $("l_email").value; return; }
    var eye = e.target.closest("[data-eye]");
    if (eye) { var inp = $(eye.dataset.eye), on = inp.type === "password"; inp.type = on ? "text" : "password"; eye.textContent = on ? "Skrýt" : "Zobrazit"; eye.setAttribute("aria-pressed", on ? "true" : "false"); return; }
    var d = e.target.closest("[data-demo-login]");
    if (d) B.demoLogin(d.dataset.demoLogin).then(go, function (er) { say(er.message, "err"); });
  });

  panes.login.addEventListener("submit", function (e) { e.preventDefault(); run(panes.login, B.signIn($("l_email").value, $("l_pass").value), go); });
  panes.signup.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!$("s_agree").checked) { say("Potvrďte prosím, že jednáte jako podnikatel nebo za firmu.", "err"); $("s_agree").focus(); return; }
    run(panes.signup, B.signUp({ name: $("s_name").value, ico: $("s_ico").value.replace(/\s/g, ""), phone: $("s_phone").value, company: $("s_company").value, email: $("s_email").value, password: $("s_pass").value }), function (r) {
      if (r.session) return go(r.session);
      show("login"); $("l_email").value = $("s_email").value; say("Účet je založený. Poslali jsme vám e-mail s potvrzovacím odkazem — po kliknutí se přihlásíte.", "ok");
    });
  });
  panes.reset.addEventListener("submit", function (e) {
    e.preventDefault();
    run(panes.reset, B.resetPassword($("r_email").value), function () { show("login"); say("Pokud u nás účet s tímto e-mailem je, poslali jsme na něj odkaz pro nastavení nového hesla.", "ok"); });
  });
  panes.newpass.addEventListener("submit", function (e) {
    e.preventDefault();
    run(panes.newpass, B.changePassword($("n_pass").value), function () { go(B.session()); });
  });
  // ukazatel síly hesla (jen orientační)
  $("s_pass").addEventListener("input", function () {
    var p = this.value, n = (p.length >= 10 ? 1 : 0) + (/[A-Za-zÀ-ž]/.test(p) && /\d/.test(p) ? 1 : 0) + (p.length >= 14 || /[^A-Za-z0-9À-ž]/.test(p) ? 1 : 0);
    [].forEach.call(panes.signup.querySelectorAll(".auth-meter i"), function (el, i) { el.className = i < n ? "on" : ""; });
  });

  if (/[?&]tab=novy/.test(location.search)) show("signup");
  B.ready.then(function (s) {
    // odkaz pro obnovu hesla i pozvánka od správce: nejdřív si člověk nastaví vlastní heslo
    if (s && (B.linkType === "recovery" || B.linkType === "invite")) {
      show("newpass");
      if (B.linkType === "invite") say("Vítejte. Nastavte si heslo ke svému účtu – pak vás přihlásíme.", "ok");
      return;
    }
    if (s) go(s);
  });
})();
