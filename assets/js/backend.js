/* =========================================================================
   CashAuto — přihlášení, profil a data (window.AKbackend)

   Dva režimy podle assets/js/config.js:
   • OSTRÝ (Supabase): účty a hesla spravuje ověřovací služba, data jsou v databázi a
     přístup k nim hlídají pravidla na serveru (RLS). Tento soubor volá jen veřejné
     REST rozhraní; žádné tajné klíče v prohlížeči nejsou.
   • UKÁZKOVÝ: účty a případy žijí jen v localStorage tohoto prohlížeče. Slouží k
     vyzkoušení průchodu, NENÍ to zabezpečení — kdokoliv s přístupem k prohlížeči je vidí.

   Role: "client" (klient) a "staff" (správce). V ostrém režimu roli nastavuje jen
   vlastník projektu v databázi; z prohlížeče ji změnit nejde.
   ========================================================================= */
(function () {
  "use strict";
  var CFG = Object.assign({ supabaseUrl: "", supabaseAnonKey: "" }, window.AK_CONFIG || {});
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {       // jen pro vývoj na vlastním počítači
    try { Object.assign(CFG, JSON.parse(localStorage.getItem("ak_dev_config") || "{}")); } catch (e) { /* bez přepisu */ }
  }
  var LIVE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
  var BASE = String(CFG.supabaseUrl).replace(/\/+$/, "");
  var current = null, listeners = [];
  function set(s) { current = s; listeners.forEach(function (fn) { try { fn(s); } catch (e) { /* posluchač nesmí shodit přihlášení */ } }); return s; }
  function fail(msg, code) { var e = new Error(msg); e.code = code || "error"; return e; }
  var ls = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* nic */ } }
  };
  var cleanProfile = function (p) {
    p = p || {};
    var t = function (v, n) { return String(v == null ? "" : v).trim().slice(0, n); };
    return { name: t(p.name, 120), company: t(p.company, 160), ico: t(p.ico, 8).replace(/\D/g, ""), phone: t(p.phone, 30) };
  };
  function checkPassword(p) {
    p = String(p || "");
    if (p.length < 10) return "Heslo musí mít aspoň 10 znaků.";
    if (!/[A-Za-zÀ-ž]/.test(p) || !/\d/.test(p)) return "Heslo musí obsahovat písmeno i číslici.";
    return null;
  }
  var validEmail = function (e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || "").trim()); };

  // ======================================================================= OSTRÝ REŽIM
  var SKEY = "ak_sb_session";
  function sbError(j, status) {
    var raw = (j && (j.error_description || j.msg || j.message || j.error)) || "", code = (j && (j.error_code || j.code || j.error)) || String(status);
    var m = /invalid login|invalid_grant|invalid_credentials/i.test(raw + code) ? "Nesprávný e-mail nebo heslo."
      : /already registered|user_already_exists/i.test(raw + code) ? "Účet s tímto e-mailem už existuje. Přihlaste se, nebo si nechte poslat nové heslo."
      : /not confirmed|email_not_confirmed/i.test(raw + code) ? "E-mail ještě není potvrzený. Klikněte na odkaz, který jsme vám poslali."
      : /weak|should be at least|weak_password/i.test(raw + code) ? "Heslo je příliš slabé. Zvolte delší heslo s písmeny i číslicemi."
      : status === 429 || /rate limit|over_.*rate/i.test(raw + code) ? "Příliš mnoho pokusů. Zkuste to prosím za chvíli."
      : status === 401 || status === 403 ? "K tomuto kroku nemáte oprávnění, nebo přihlášení vypršelo. Přihlaste se znovu."
      : "Něco se nepovedlo (" + status + "). Zkuste to prosím znovu.";
    return fail(m, String(code));
  }
  function sb(path, opt) {
    opt = opt || {};
    var h = { apikey: CFG.supabaseAnonKey, Authorization: "Bearer " + (opt.token || CFG.supabaseAnonKey) };
    if (opt.body !== undefined) h["Content-Type"] = "application/json";
    if (opt.prefer) h.Prefer = opt.prefer;
    return fetch(BASE + path, { method: opt.method || "GET", headers: h, body: opt.body !== undefined ? JSON.stringify(opt.body) : undefined }).then(function (r) {
      return r.text().then(function (t) {
        var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = null; }
        if (!r.ok) throw sbError(j, r.status);
        return j;
      });
    }, function () { throw fail("Nepodařilo se spojit se serverem. Zkontrolujte připojení a zkuste to znovu.", "network"); });
  }
  function storeTokens(j) {
    var s = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (Number(j.expires_in) || 3600) * 1000, user: j.user ? { id: j.user.id, email: j.user.email } : null };
    ls.set(SKEY, s); return s;
  }
  var refreshing = null;
  function token() {
    var s = ls.get(SKEY);
    if (!s || !s.access_token) return Promise.reject(fail("Přihlášení vypršelo. Přihlaste se znovu.", "no_session"));
    if (s.expires_at - Date.now() > 60000) return Promise.resolve(s.access_token);
    if (!refreshing) refreshing = sb("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: s.refresh_token } })
      .then(function (j) { refreshing = null; return storeTokens(j).access_token; }, function (e) { refreshing = null; ls.del(SKEY); set(null); throw e; });
    return refreshing;
  }
  function loadProfile(user) {
    return token().then(function (t) {
      return sb("/rest/v1/profiles?id=eq." + encodeURIComponent(user.id) + "&select=*", { token: t }).then(function (rows) {
        if (rows && rows[0]) return rows[0];
        // profil běžně zakládá spouštěč v databázi; kdyby chyběl, založí se zde (role vždy client)
        return sb("/rest/v1/profiles", { method: "POST", token: t, prefer: "return=representation", body: { id: user.id, email: user.email } }).then(function (r) { return (r && r[0]) || { id: user.id }; });
      });
    }).then(function (p) {
      return set({ user: user, profile: cleanProfile(p), role: p.role === "staff" ? "staff" : "client", live: true });
    });
  }
  function hashSession() {     // návrat z potvrzovacího nebo obnovovacího e-mailu: #access_token=…&type=recovery|signup
    if (!/access_token=/.test(location.hash)) return null;
    var q = new URLSearchParams(location.hash.slice(1)), j = { access_token: q.get("access_token"), refresh_token: q.get("refresh_token"), expires_in: q.get("expires_in") };
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { location.hash = ""; }
    return j.access_token && j.refresh_token ? { tokens: j, type: q.get("type") || "" } : null;
  }
  var live = {
    init: function () {
      var h = hashSession();
      var start = h ? sb("/auth/v1/user", { token: h.tokens.access_token }).then(function (u) { h.tokens.user = u; storeTokens(h.tokens); api.linkType = h.type; }) : Promise.resolve();
      return start.then(function () { var s = ls.get(SKEY); return s && s.user ? loadProfile(s.user) : set(null); }).catch(function () { ls.del(SKEY); return set(null); });
    },
    signUp: function (d) {
      return sb("/auth/v1/signup", { method: "POST", body: { email: d.email, password: d.password, data: cleanProfile(d) } }).then(function (j) {
        if (j && j.access_token) { var s = storeTokens(j); return loadProfile(s.user).then(function (cur) { return { session: cur, needsConfirm: false }; }); }
        return { session: null, needsConfirm: true };
      });
    },
    signIn: function (email, password) {
      return sb("/auth/v1/token?grant_type=password", { method: "POST", body: { email: email, password: password } }).then(function (j) { return loadProfile(storeTokens(j).user); });
    },
    signOut: function () {
      var s = ls.get(SKEY); ls.del(SKEY); set(null);
      return s && s.access_token ? sb("/auth/v1/logout", { method: "POST", token: s.access_token }).catch(function () { /* odhlášeno místně */ }) : Promise.resolve();
    },
    resetPassword: function (email) {
      var back = location.origin + "/prihlaseni.html";
      return sb("/auth/v1/recover?redirect_to=" + encodeURIComponent(back), { method: "POST", body: { email: email } }).then(function () { return true; });
    },
    changePassword: function (p) { return token().then(function (t) { return sb("/auth/v1/user", { method: "PUT", token: t, body: { password: p } }); }).then(function () { return true; }); },
    updateProfile: function (patch) {
      return token().then(function (t) {
        return sb("/rest/v1/profiles?id=eq." + encodeURIComponent(current.user.id), { method: "PATCH", token: t, prefer: "return=representation", body: cleanProfile(Object.assign({}, current.profile, patch)) });
      }).then(function (rows) { return set(Object.assign({}, current, { profile: cleanProfile(rows && rows[0]) })); });
    },
    submitApplication: function (c) {
      var go = function (t) { return sb("/rest/v1/cases", { method: "POST", token: t, prefer: "return=minimal", body: { stage: "lead", line: c.line || "auto", data: c } }); };
      return (current ? token().then(go) : go()).then(function () { return true; });
    },
    listCases: function () {
      return token().then(function (t) { return sb("/rest/v1/cases?select=id,stage,position,line,data,created_at&order=position.asc,created_at.desc", { token: t }); })
        .then(function (rows) { return (rows || []).map(function (r) { return Object.assign({}, r.data || {}, { id: r.id, line: r.line || "auto", _stage: r.stage, _pos: r.position, _created: r.created_at }); }); });
    },
    saveCases: function (rows) {
      if (!rows.length) return Promise.resolve(true);
      return token().then(function (t) { return sb("/rest/v1/cases?on_conflict=id", { method: "POST", token: t, prefer: "resolution=merge-duplicates,return=minimal", body: rows }); }).then(function () { return true; });
    }
  };

  // ======================================================================= UKÁZKOVÝ REŽIM
  var UKEY = "ak_demo_users", DKEY = "ak_demo_session", AKEY = "ak_demo_applications";
  var SAMPLE = {
    client: { user: { id: "demo-client", email: "jan.novak@example.com" }, profile: { name: "Jan Novák", company: "Jan Novák — elektroinstalace", ico: "76522901", phone: "" }, role: "client", sample: true },
    staff: { user: { id: "demo-staff", email: "spravce@example.com" }, profile: { name: "Ukázkový správce", company: "CashAuto", ico: "", phone: "" }, role: "staff", sample: true }
  };
  var hex = function (buf) { return [].map.call(new Uint8Array(buf), function (b) { return (b < 16 ? "0" : "") + b.toString(16); }).join(""); };
  function pbkdf2(password, saltHex) {
    var enc = new TextEncoder(), salt = new Uint8Array(saltHex.match(/../g).map(function (h) { return parseInt(h, 16); }));
    return crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"])
      .then(function (k) { return crypto.subtle.deriveBits({ name: "PBKDF2", salt: salt, iterations: 150000, hash: "SHA-256" }, k, 256); }).then(hex);
  }
  var users = function () { return ls.get(UKEY) || []; };
  var pub = function (u) { return { user: { id: u.id, email: u.email }, profile: cleanProfile(u.profile), role: "client", demo: true }; };
  var demo = {
    init: function () {
      var d = ls.get(DKEY);
      if (!d) return Promise.resolve(set(null));
      if (d.sample && SAMPLE[d.sample]) return Promise.resolve(set(Object.assign({ demo: true }, SAMPLE[d.sample])));
      var u = users().filter(function (x) { return x.id === d.id; })[0];
      return Promise.resolve(set(u ? pub(u) : null));
    },
    demoLogin: function (role) { ls.set(DKEY, { sample: role }); return Promise.resolve(set(Object.assign({ demo: true }, SAMPLE[role]))); },
    signUp: function (d) {
      var list = users(), email = d.email.toLowerCase();
      if (list.some(function (u) { return u.email === email; })) return Promise.reject(fail("Účet s tímto e-mailem už v tomto prohlížeči existuje. Přihlaste se.", "user_already_exists"));
      if (!window.crypto || !crypto.subtle) return Promise.reject(fail("Tento prohlížeč neumí bezpečně uložit heslo. Otevřete stránku přes https.", "no_crypto"));
      var salt = hex(crypto.getRandomValues(new Uint8Array(16)));
      return pbkdf2(d.password, salt).then(function (hash) {
        var u = { id: "local-" + hex(crypto.getRandomValues(new Uint8Array(8))), email: email, salt: salt, hash: hash, profile: cleanProfile(d) };
        list.push(u); if (!ls.set(UKEY, list)) throw fail("Účet se nepodařilo uložit (prohlížeč nepovolil úložiště).", "storage");
        ls.set(DKEY, { id: u.id }); return { session: set(pub(u)), needsConfirm: false };
      });
    },
    signIn: function (email, password) {
      var u = users().filter(function (x) { return x.email === String(email).toLowerCase(); })[0];
      var bad = fail("Nesprávný e-mail nebo heslo.", "invalid_credentials");
      if (!u) return pbkdf2(password, "00000000000000000000000000000000").then(function () { throw bad; });
      return pbkdf2(password, u.salt).then(function (h) { if (h !== u.hash) throw bad; ls.set(DKEY, { id: u.id }); return set(pub(u)); });
    },
    signOut: function () { ls.del(DKEY); set(null); return Promise.resolve(); },
    resetPassword: function () { return Promise.reject(fail("V ukázkovém režimu se e-maily neposílají. Založte si prosím nový ukázkový účet.", "demo")); },
    changePassword: function (p) {
      if (current.sample) return Promise.reject(fail("Ukázkový účet heslo nemá.", "demo"));
      var list = users(), u = list.filter(function (x) { return x.id === current.user.id; })[0];
      u.salt = hex(crypto.getRandomValues(new Uint8Array(16)));
      return pbkdf2(p, u.salt).then(function (h) { u.hash = h; ls.set(UKEY, list); return true; });
    },
    updateProfile: function (patch) {
      var np = cleanProfile(Object.assign({}, current.profile, patch));
      if (!current.sample) { var list = users(), u = list.filter(function (x) { return x.id === current.user.id; })[0]; u.profile = np; ls.set(UKEY, list); }
      return Promise.resolve(set(Object.assign({}, current, { profile: np })));
    },
    submitApplication: function (c) {
      var list = ls.get(AKEY) || []; c.id = "AK-" + (9000 + list.length + 1) + "-" + Date.now().toString(36).slice(-3).toUpperCase();
      list.push(c); return ls.set(AKEY, list) ? Promise.resolve(true) : Promise.reject(fail("Žádost se nepodařilo uložit.", "storage"));
    },
    // žádosti odeslané z formuláře v tomto prohlížeči (administrace si je převezme do fáze „Nový lead“)
    takeApplications: function () { var l = ls.get(AKEY) || []; return l; },
    listCases: function () {
      if (!current) return Promise.resolve([]);
      var mine = String(current.user.email).toLowerCase();
      var board = ls.get("ak_pipeline_v4"), where = {};
      if (board && board.cols) board.cols.forEach(function (col) { col.items.forEach(function (it) { where[it.id] = { stage: col.key, it: it }; }); });
      return Promise.resolve((ls.get(AKEY) || []).filter(function (c) { return current.role === "staff" || String(c.email || "").toLowerCase() === mine; })
        .map(function (c) { var w = where[c.id]; return Object.assign({}, c, w ? w.it : {}, { _stage: w ? w.stage : "lead" }); }));
    },
    saveCases: function () { return Promise.resolve(true); }
  };

  // ======================================================================= ROZHRANÍ
  var impl = LIVE ? live : demo;
  var api = {
    live: LIVE, mode: LIVE ? "live" : "demo", linkType: "",
    session: function () { return current; },
    onAuth: function (fn) { listeners.push(fn); },
    checkPassword: checkPassword, validEmail: validEmail,
    signUp: function (d) {
      d = Object.assign({}, d, { email: String(d.email || "").trim() });
      if (!validEmail(d.email)) return Promise.reject(fail("Zadejte platný e-mail.", "email"));
      var pe = checkPassword(d.password); if (pe) return Promise.reject(fail(pe, "weak_password"));
      if (!/^\d{8}$/.test(String(d.ico || "").replace(/\s/g, ""))) return Promise.reject(fail("Zadejte IČO (8 číslic). Služba je jen pro podnikatele a firmy.", "ico"));
      if (String(d.name || "").trim().length < 3) return Promise.reject(fail("Vyplňte jméno a příjmení.", "name"));
      return impl.signUp(d);
    },
    signIn: function (email, password) {
      if (!validEmail(email) || !password) return Promise.reject(fail("Vyplňte e-mail a heslo.", "missing"));
      return impl.signIn(String(email).trim(), password);
    },
    signOut: function () { return impl.signOut(); },
    resetPassword: function (email) { return validEmail(email) ? impl.resetPassword(String(email).trim()) : Promise.reject(fail("Zadejte platný e-mail.", "email")); },
    changePassword: function (p) { var pe = checkPassword(p); return pe ? Promise.reject(fail(pe, "weak_password")) : current ? impl.changePassword(p) : Promise.reject(fail("Nejste přihlášeni.", "no_session")); },
    updateProfile: function (patch) { return current ? impl.updateProfile(patch) : Promise.reject(fail("Nejste přihlášeni.", "no_session")); },
    demoLogin: function (role) { return LIVE ? Promise.reject(fail("Ukázkové účty jsou v ostrém režimu vypnuté.", "live")) : demo.demoLogin(role === "staff" ? "staff" : "client"); },
    submitApplication: function (c) { return impl.submitApplication(c); },
    listCases: function () { return impl.listCases(); },
    saveCases: function (rows) { return impl.saveCases(rows); },
    takeDemoApplications: function () { return LIVE ? [] : demo.takeApplications(); }
  };
  api.ready = impl.init().then(function () { return current; }, function () { return set(null); });
  window.AKbackend = api;
})();
