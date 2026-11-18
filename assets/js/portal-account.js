/* =========================================================================
   CashAuto — klientská zóna: domovská obrazovka „vše po ruce“ a profil (portal.html)
   • ukázkový klient (Jan Novák) vidí ukázkový případ z data.js,
   • každý jiný účet vidí jen SVÉ žádosti a případy (podle e-mailu účtu), nebo výzvu k podání žádosti.
   Vyžaduje backend.js a guard.js (událost ak:auth).
   ========================================================================= */
(function () {
  "use strict";
  var B = window.AKbackend, AK = window.AK || {};
  var home = document.getElementById("clientHome");
  if (!B || !home) return;
  var NB = " ";
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var czk = function (n) { return Number(n).toLocaleString("cs-CZ").replace(/\s/g, NB) + NB + "Kč"; };
  var PHONE = (AK.operator && AK.operator.phone) || "800 123 456";
  var I = {
    pay: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.500" y="5" width="19" height="14" rx="2.500"/><path d="M2.500 9.500h19M6 15h4"/></svg>',
    doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    car: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13l2-5a3 3 0 0 1 2.800-2h8.400A3 3 0 0 1 19 8l2 5"/><path d="M3 13h18v5H3z"/><circle cx="7.500" cy="16" r="1.300"/><circle cx="16.500" cy="16" r="1.300"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.600-5.900"/><path d="M4 4v5h5"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.500a8.500 8.500 0 0 1-12.300 7.600L3 21l1.900-5.700A8.500 8.500 0 1 1 21 11.500z"/></svg>',
    call: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
  };
  var STAGES = [
    ["lead", "Žádost přijata", "Ozveme se vám telefonicky a ověříme údaje ze žádosti."],
    ["call", "Ověření po telefonu", "Po telefonátu připravíme orientační nabídku v korunách."],
    ["scoring", "Orientační nabídka", "Domluvíme prohlídku technikem přímo u vás."],
    ["technik", "Prohlídka technikem", "Po prohlídce potvrdíme čísla a připravíme smlouvy."],
    ["approval", "Smlouvy", "Smlouvy vám pošleme k prostudování a podpisu."],
    ["insurance", "Pojištění", "Vyřizujeme převod pojištění, aby navazovalo bez přerušení."],
    ["done", "Podepsáno", "Výkupní cenu odesíláme na váš účet, zpravidla do 24 hodin od podpisu."]
  ];
  function goto(target) { var l = document.querySelector('.side-link[data-target="' + target + '"]'); if (l) l.click(); }
  var quick = function (items) {
    return '<div class="ch-quick">' + items.map(function (q) {
      return q.href ? '<a href="' + q.href + '">' + q.ico + "<span>" + q.t + "</span></a>" : '<button type="button" data-goto="' + q.go + '">' + q.ico + "<span>" + q.t + "</span></button>";
    }).join("") + "</div>";
  };
  var tel = "tel:+420" + PHONE.replace(/\D/g, "");
  function hello(s, vocative) {
    var p = s.profile, bits = [p.company, p.ico ? "IČO " + p.ico : "", s.user.email].filter(Boolean);
    return '<div class="ch-hello"><h2>Dobrý den' + (vocative ? ", " + esc(vocative) : "") + "</h2><p>" + (vocative ? "" : esc(p.name) + (bits.length ? " · " : "")) + esc(bits.join(" · ")) + "</p></div>";
  }

  function renderSample(s) {
    var c = AK.activeCase || {};
    home.innerHTML = hello(s, "Jane") +
      '<div class="ch-top"><div class="ch-pay"><span class="ch-l">Další rezervační poplatek</span><strong class="ch-amt">' + czk(c.fee) + '</strong><span class="ch-due">splatný ' + esc(c.nextPaymentDate) + " · případ " + esc(c.id) + "</span>" +
        '<div class="ch-pay-a"><button type="button" class="btn btn-mint" data-goto="platby">Platby a termíny</button><button type="button" class="btn btn-line" data-goto="platby">Zpětný odkup</button></div></div>' +
      '<div class="ch-three"><div class="ch-state"><span>Stav</span><strong>' + esc(c.status) + "</strong></div><div><span>Výkupní cena (vyplaceno)</span><strong>" + czk(c.vykup) + "</strong></div><div><span>Měsíční rezervační poplatek</span><strong>" + czk(c.fee) +
        "</strong></div><div><span>Cena zpětného odkupu</span><strong>" + czk(c.buyback) + "</strong></div></div></div>" +
      quick([{ go: "platby", t: "Platby", ico: I.pay }, { go: "dokumenty", t: "Dokumenty", ico: I.doc }, { go: "vozidlo", t: "Moje auto", ico: I.car }, { go: "platby", t: "Zpětný odkup", ico: I.back }, { go: "podpora", t: "Napsat nám", ico: I.chat }, { href: tel, t: "Zavolat", ico: I.call }]);
  }
  function caseCard(c) {
    var i = Math.max(0, STAGES.map(function (x) { return x[0]; }).indexOf(c._stage || "lead")), st = STAGES[i];
    var nums = c.vykup ? '<div class="ch-three"><div><span>Výkupní cena</span><strong>' + czk(c.vykup) + "</strong></div>" + (c.fee ? "<div><span>Měsíční rezervační poplatek</span><strong>" + czk(c.fee) + "</strong></div>" : "") +
      "<div><span>Cena zpětného odkupu</span><strong>" + czk(c.vykup) + '</strong></div></div><p class="ch-next">' + (i < 4 ? "Čísla jsou orientační, dokud je nepotvrdí prohlídka technikem a smlouva." : "Čísla podle smluvní dokumentace.") + "</p>" : "";
    return '<article class="ch-case"><div class="ch-case-h"><h3>' + esc(c.car || "Vaše žádost") + "</h3><span>" + esc(c.id || "") + '</span></div><div class="ch-steps" role="img" aria-label="Krok ' + (i + 1) + " ze 7: " + st[1] + '">' +
      STAGES.map(function (x, k) { return '<i class="' + (k < i ? "on" : k === i ? "cur" : "") + '"></i>'; }).join("") + '</div><div class="ch-stage">' + (i + 1) + ". " + st[1] + '</div><p class="ch-next">Co bude dál: ' + st[2] + "</p>" + nums + "</article>";
  }
  function renderOwn(s) {
    home.innerHTML = hello(s) + '<div class="ch-case" aria-busy="true"><span class="ch-next">Načítám vaše žádosti…</span></div>';
    B.listCases().then(function (cases) {
      var actions = quick([{ href: "zadost.html", t: "Nová žádost", ico: I.plus }, { go: "podpora", t: "Napsat nám", ico: I.chat }, { href: tel, t: "Zavolat", ico: I.call }, { go: "profil", t: "Můj profil", ico: I.user }, { href: "index.html#kalkulacka", t: "Kalkulačka", ico: I.pay }, { href: "compliance.html", t: "Jak to funguje", ico: I.doc }]);
      home.innerHTML = hello(s) + (cases.length ? cases.map(caseCard).join("")
        : '<div class="ch-empty"><h3>Zatím u nás nemáte žádnou žádost</h3><p>Spočítejte si orientační nabídku a pošlete nezávaznou žádost. Uvidíte zde pak její průběh krok za krokem.</p><a class="btn btn-primary" href="zadost.html">Podat žádost</a></div>') + actions +
        (B.live ? "" : '<p class="ch-demo"><strong>Ukázkový režim.</strong> Účet i žádosti jsou uložené jen v tomto prohlížeči.</p>');
    }, function (e) { home.innerHTML = hello(s) + '<div class="ch-empty"><h3>Žádosti se nepodařilo načíst</h3><p>' + esc(e.message) + '</p><button type="button" class="btn btn-primary" id="chRetry">Zkusit znovu</button></div>'; });
  }
  home.addEventListener("click", function (e) {
    var g = e.target.closest("[data-goto]"); if (g) return goto(g.dataset.goto);
    if (e.target.closest("#chRetry")) renderOwn(B.session());
  });

  // ---------- profil ----------
  function fillProfile(s) {
    var f = document.getElementById("profileForm"); if (!f) return;
    ["name", "company", "ico", "phone"].forEach(function (k) { f.elements[k].value = s.profile[k] || ""; });
    f.elements.email.value = s.user.email;
    var m = document.getElementById("profileMode");
    if (m) m.innerHTML = B.live ? "<strong>Ostrý režim.</strong> Účet spravuje ověřovací služba, heslo se u nás neukládá v čitelné podobě."
      : "<strong>Ukázkový režim.</strong> Účet existuje jen v tomto prohlížeči. " + (s.sample ? "Jde o předpřipravený ukázkový účet bez hesla." : "Heslo je uložené jen jako otisk v tomto zařízení.");
    var pf = document.getElementById("passForm"); if (pf) pf.hidden = !!s.sample;
  }
  function wire(formId, msgId, action, okText) {
    var f = document.getElementById(formId), m = document.getElementById(msgId); if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var b = f.querySelector(".pf-save"); b.disabled = true; b.classList.add("is-busy"); m.textContent = ""; m.className = "pf-msg";
      action(f).then(function () { m.textContent = okText; m.className = "pf-msg ok"; }, function (er) { m.textContent = er.message || "Uložení se nepovedlo."; m.className = "pf-msg err"; })
        .then(function () { b.disabled = false; b.classList.remove("is-busy"); });
    });
  }
  wire("profileForm", "profileMsg", function (f) {
    var ico = f.elements.ico.value.replace(/\s/g, "");
    if (f.elements.name.value.trim().length < 3) return Promise.reject(new Error("Vyplňte jméno a příjmení."));
    if (ico && !/^\d{8}$/.test(ico)) return Promise.reject(new Error("IČO má mít 8 číslic."));
    return B.updateProfile({ name: f.elements.name.value, company: f.elements.company.value, ico: ico, phone: f.elements.phone.value });
  }, "Profil je uložený.");
  wire("passForm", "passMsg", function (f) { return B.changePassword(f.elements.newpass.value).then(function () { f.reset(); }); }, "Heslo je změněné.");
  var out = document.getElementById("profileLogout");
  if (out) out.addEventListener("click", function () { B.signOut().then(function () { location.href = "prihlaseni.html"; }); });

  function start(s) {
    // sekce s ukázkovým případem patří jen ukázkovému klientovi
    ["vozidlo", "platby", "dokumenty"].forEach(function (t) { var l = document.querySelector('.side-link[data-target="' + t + '"]'); if (l) l.hidden = !s.sample; });
    if (s.sample) renderSample(s); else renderOwn(s);
    fillProfile(s);
    if (!s.sample && ["#vozidlo", "#platby", "#dokumenty"].indexOf(location.hash) >= 0) goto("overview");
  }
  document.addEventListener("ak:auth", function (e) { start(e.detail); });
  B.onAuth(function (s) { if (s) { fillProfile(s); var h = home.querySelector(".ch-hello"); if (h && !s.sample) h.outerHTML = hello(s); } });
  if (window.AKsession) start(window.AKsession);
})();
