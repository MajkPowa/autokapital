/* =========================================================================
   CashAuto — detail případu v CRM pipeline (admin.html)
   Záložky: Přehled · Údaje · Smlouvy · E-maily · Aktivita.
   - Údaje se dají upravovat a ukládají se k případu (v tomto prohlížeči).
   - Smlouvy se plní ze šablon údaji případu; náhled, tisk / PDF, stažení pro Word, stavy.
     Texty šablon jsou VZORY — před ostrým použitím je musí schválit právník.
   - E-maily ze šablon: náhled, úprava, otevření v poštovním programu (mailto), kopírování.
     Administrace sama e-maily neodesílá (není napojená na e-mailovou službu).
   - Automatizace: při přesunu do fáze se e-mail sám připraví do fronty a ve fázi Schválení
     se vygeneruje balík smluv.
   Vyžaduje kanban.js (window.AKkanban) a admin-line.js (window.AKline).
   ========================================================================= */
(function () {
  "use strict";
  var K = window.AKkanban, AK = window.AK || {}, LN = window.AKline;
  if (!K || !LN) return;
  var esc = K.esc, czk = K.czk, STAGES = K.STAGES, sheet = K.sheet;
  var OP = AK.operator || { brand: "CashAuto", name: "", ico: "", dic: "", seat: "", reg: "", email: "", phone: "", web: "cashauto.cz" };
  var CFG_KEY = "ak_case_cfg_v1";
  var NB = "\u00A0";

  // ---------- nastavení společné pro všechny případy (automatizace, upravené šablony) ----------
  var cfg = { auto: { call: true, scoring: true, technik: true, approval: true, insurance: true, done: true }, autoDocs: true, tpl: {} };
  try { var c0 = JSON.parse(localStorage.getItem(CFG_KEY) || "null"); if (c0 && c0.auto) cfg = { auto: Object.assign(cfg.auto, c0.auto), autoDocs: c0.autoDocs !== false, tpl: c0.tpl || {} }; } catch (e) { /* výchozí */ }
  function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { /* jen do zavření stránky */ } }

  // ---------- pomocné ----------
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  function today() { var d = new Date(); return d.getDate() + ". " + (d.getMonth() + 1) + ". " + d.getFullYear(); }
  function stamp() { var d = new Date(); return today() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  var lineOf = function (it) { return LN.cfg(it); };
  var market = function (it) { return it.market || Math.round(it.vykup / lineOf(it).rate / 1000) * 1000; };
  var term = function (it) { return it.term || 3; };
  var months = function (n) { return n + NB + (n === 1 ? "měsíc" : n < 5 ? "měsíce" : "měsíců"); };
  var clientName = function (it) { return String(it.name).replace(/\s*—\s*OSVČ.*$/, ""); };
  var isOsvc = function (it) { return /—\s*OSVČ/.test(it.name); };
  var num = function (n) { return Number(n).toLocaleString("cs-CZ").replace(/\s/g, NB); };
  var pct = function (x) { return String(Math.round(x * 1000) / 10).replace(".", ",") + NB + "%"; };
  function act(it, kind, text) { (it.activity = it.activity || []).unshift({ t: stamp(), k: kind, x: text }); if (it.activity.length > 60) it.activity.length = 60; }

  // ---------- pole případu ----------
  function fields(it) {
    var L = lineOf(it);
    return {
      name: { l: "Název / jméno", sec: "Klient" }, ico: { l: "IČO", sec: "Klient", mode: "numeric" }, contact: { l: "Kontaktní osoba", sec: "Klient" },
      phone: { l: "Telefon", sec: "Klient", type: "tel" }, email: { l: "E-mail", sec: "Klient", type: "email" }, city: { l: "Sídlo / město", sec: "Klient" },
      car: { l: L.noun.n === "stroj" ? "Stroj" : "Vozidlo", sec: "Předmět výkupu" }, year: { l: "Rok výroby", sec: "Předmět výkupu", n: 1 }, km: { l: L.km, sec: "Předmět výkupu", n: 1 },
      spz: { l: L.plate, sec: "Předmět výkupu" }, vin: { l: L.vin, sec: "Předmět výkupu" },
      market: { l: "Odhad hodnoty (Kč)", sec: "Obchod", n: 1 }, vykup: { l: "Výkupní cena (Kč)", sec: "Obchod", n: 1 }, fee: { l: "Měsíční rezervační poplatek (Kč)", sec: "Obchod", n: 1 },
      term: { l: "Doba rezervace", sec: "Obchod", opts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (m) { return [m, months(m)]; }) },
      line: { l: "Řada", sec: "Obchod", opts: [["auto", "CashAuto"], ["agro", "AgroCash"], ["tech", "TechCash"]] },
      risk: { l: "Riziko", sec: "Obchod", opts: [["low", "nízké"], ["med", "střední"], ["high", "vysoké"]] },
      segment: { l: "Segment / typ", sec: "Obchod" }, channel: { l: "Kanál", sec: "Obchod" }
    };
  }
  function val(it, k) { return k === "market" ? market(it) : k === "term" ? term(it) : k === "line" ? LN.of(it) : (it[k] == null ? "" : it[k]); }
  function missing(it, need) { var F = fields(it); return need.filter(function (k) { return val(it, k) === "" || val(it, k) === 0 && k !== "km"; }).map(function (k) { return { k: k, l: F[k].l }; }); }

  // ---------- kontrolní seznam fáze ----------
  var CHECKS = {
    lead: ["IČO ověřeno v ARES", "Žádost je úplná (předmět výkupu, kontakt)"],
    call: ["Údaje ze žádosti ověřeny telefonátem", "Klient potvrdil, že jedná jako podnikatel", "Domluven další postup"],
    scoring: ["Zkontrolován navržený výpočet", "Schváleno rozmezí výkupní ceny"],
    technik: ["Domluven termín prohlídky", "Stav zkontrolován podle checklistu", "Ověřeny doklady a vlastnictví", "Doplněny identifikační údaje (VIN / výrobní číslo)"],
    approval: ["Smlouvy a ceník vygenerovány", "Právní revize", "Kontrola KYC/AML", "Odesláno klientovi k podpisu"],
    insurance: ["Ověřena pojistitelnost", "Zadán převod pojištění"],
    done: ["Smlouvy podepsány", "Přepis v registru", "Výplata schválena dvěma osobami"]
  };

  // ---------- šablony smluv (VZORY k právní revizi) ----------
  function ctx(it) {
    var L = lineOf(it), N = L.noun, m = market(it);
    return { it: it, L: L, N: N, id: it.id, klient: clientName(it), kontakt: it.contact || clientName(it), ico: it.ico || "[doplňte IČO]", sidlo: it.city || "[doplňte sídlo]",
      vuz: it.car, rok: it.year || "[rok]", km: it.km ? num(it.km) : "[doplňte]", spz: it.spz || "[doplňte]", vin: it.vin || "[doplňte]",
      hodnota: czk(m), vykup: czk(it.vykup), poplatek: czk(it.fee), odkup: czk(it.vykup), doba: months(term(it)), sazba: pct(it.fee / m), podil: pct(it.vykup / m),
      forma: isOsvc(it) ? "podnikající fyzická osoba" : "právnická osoba", datum: today() };
  }
  var sec = function (h, ps) { return "<h3>" + esc(h) + "</h3>" + ps.map(function (p) { return "<p>" + p + "</p>"; }).join(""); };
  var party = function (role, c, isOp) {
    return isOp ? "<strong>" + esc(OP.name) + "</strong>, IČO " + esc(OP.ico) + ", DIČ " + esc(OP.dic) + ", se sídlem " + esc(OP.seat) + ", " + esc(OP.reg) + " (dále jen „" + role + "“)"
                : "<strong>" + esc(c.klient) + "</strong>, " + c.forma + ", IČO " + esc(c.ico) + ", se sídlem / místem podnikání " + esc(c.sidlo) + " (dále jen „" + role + "“)";
  };
  var subject = function (c) {
    return esc(c.vuz) + ", rok výroby " + esc(c.rok) + ", " + esc(c.L.vin) + " " + esc(c.vin) + (c.L.plate ? ", " + esc(c.L.plate) + " " + esc(c.spz) : "") + ", " + esc(c.L.km.toLowerCase()) + " " + esc(c.km);
  };
  var signs = function (a, b) { return '<div class="signs"><div><span></span>' + esc(a) + '</div><div><span></span>' + esc(b) + "</div></div>"; };
  var DOCS = [
    { key: "kupni", name: function (c) { return "Kupní smlouva na " + c.N.a; }, need: ["ico", "city", "year", "vin", "km"], sign: 1, body: function (c) {
      return sec("1. Smluvní strany", [party("prodávající", c), party("kupující", c, 1)]) +
        sec("2. Předmět koupě", ["Prodávající prodává kupujícímu " + c.N.a + ": " + subject(c) + " (dále jen „" + c.N.n + "“)."]) +
        sec("3. Kupní cena", ["Kupní (výkupní) cena činí <strong>" + c.vykup + "</strong>. Kupující ji uhradí bezhotovostně na účet prodávajícího, zpravidla do 24 hodin od podpisu této smlouvy a předání dokladů."]) +
        sec("4. Prohlášení prodávajícího", ["Prodávající prohlašuje, že je výlučným vlastníkem " + c.N.g + ", že " + c.N.n + " není zatížen" + (c.N.n === "stroj" ? "" : "o") + " právy třetích osob (leasing, zástavní právo, exekuce) a že smlouvu uzavírá jako podnikatel v souvislosti se svou podnikatelskou činností."]) +
        sec("5. Přechod vlastnictví a užívání", ["Vlastnické právo přechází na kupujícího úhradou kupní ceny. Prodávající zůstává provozovatelem a " + c.N.a + " dále užívá podle samostatné smlouvy o užívání."]) +
        sec("6. Související smlouvy", ["Současně s touto smlouvou strany uzavírají smlouvu o užívání a smlouvu o zpětném odkupu; cena zpětného odkupu činí " + c.odkup + "."]) +
        sec("7. Závěrečná ustanovení", ["Smlouva je vyhotovena ve dvou stejnopisech a nabývá účinnosti dnem podpisu oběma stranami."]) + signs("Prodávající", "Kupující");
    } },
    { key: "uzivani", name: function (c) { return "Smlouva o užívání " + c.N.g; }, need: ["ico", "city", "vin"], sign: 1, body: function (c) {
      return sec("1. Smluvní strany", [party("vlastník", c, 1), party("uživatel", c)]) +
        sec("2. Předmět užívání", ["Vlastník přenechává uživateli k užívání " + c.N.a + ": " + subject(c) + "."]) +
        sec("3. Účel", ["Uživatel smí " + c.N.a + " užívat výhradně pro svou podnikatelskou činnost. Zůstává zapsán jako provozovatel."]) +
        sec("4. Povinnosti uživatele", ["Uživatel udržuje " + c.N.a + " v řádném technickém stavu, hradí běžný provoz a údržbu, dodržuje termíny technických prohlídek a udržuje sjednané pojištění.", "Bez souhlasu vlastníka " + c.N.a + " nepřenechá třetí osobě ani jej nezatíží."]) +
        sec("5. Doba užívání", ["Smlouva se uzavírá na dobu trvání rezervace zpětného odkupu, tj. na " + c.doba + ", a končí nejpozději realizací zpětného odkupu nebo zánikem práva na něj."]) +
        sec("6. Úhrady", ["Úhrady spojené s rezervací upravuje smlouva o zpětném odkupu a ceník rezervačního poplatku."]) + signs("Vlastník", "Uživatel");
    } },
    { key: "odkup", name: function () { return "Smlouva o zpětném odkupu (opce)"; }, need: ["ico", "city", "vin"], sign: 1, body: function (c) {
      return sec("1. Smluvní strany", [party("vlastník", c, 1), party("oprávněný", c)]) +
        sec("2. Právo zpětného odkupu", ["Oprávněný má právo koupit zpět " + c.N.a + " (" + subject(c) + ") za cenu zpětného odkupu <strong>" + c.odkup + "</strong>."]) +
        sec("3. Doba rezervace", ["Právo trvá " + c.doba + " od podpisu. Oprávněný je může uplatnit kdykoliv dříve, bez sankce."]) +
        sec("4. Rezervační poplatek", ["Za rezervaci práva zpětného odkupu hradí oprávněný měsíční rezervační poplatek <strong>" + c.poplatek + "</strong> (" + c.sazba + " z odhadní hodnoty " + c.hodnota + "). Splatnost: [doplní se dle platebního kalendáře]."]) +
        sec("5. Zánik práva", ["Neuhradí-li oprávněný rezervační poplatek ani v dodatečné lhůtě [lhůta dle právní revize], právo zpětného odkupu zaniká. Vlastník oprávněného na blížící se splatnost předem upozorní."]) +
        sec("6. Realizace odkupu", ["Uhrazením ceny zpětného odkupu přechází vlastnické právo zpět na oprávněného; vlastník poskytne součinnost při zápisu změny v registru."]) + signs("Vlastník", "Oprávněný");
    } },
    { key: "cenik", name: function () { return "Ceník rezervačního poplatku"; }, need: [], body: function (c) {
      return "<p>Případ " + esc(c.id) + " · " + esc(c.klient) + " · " + esc(c.vuz) + "</p>" +
        "<table><tr><th>Položka</th><th>Částka</th></tr><tr><td>Odhadní hodnota</td><td>" + c.hodnota + "</td></tr><tr><td>Výkupní cena (" + c.podil + " z odhadní hodnoty)</td><td>" + c.vykup + "</td></tr>" +
        "<tr><td>Měsíční rezervační poplatek (" + c.sazba + " z odhadní hodnoty)</td><td>" + c.poplatek + "</td></tr><tr><td>Poplatek za celou dobu rezervace (" + c.doba + ")</td><td>" + czk(c.it.fee * term(c.it)) + "</td></tr>" +
        "<tr><td>Cena zpětného odkupu</td><td>" + c.odkup + "</td></tr></table>" +
        "<p>Další poplatky: [doplní se dle platného ceníku]. Služba není zdarma — za rezervaci možnosti zpětného odkupu platíte měsíční poplatek.</p>";
    } },
    { key: "info", name: function () { return "Informační dokument pro klienta"; }, need: [], body: function (c) {
      return sec("Co uzavíráte", ["Dočasný výkup se zpětným odkupem: " + c.N.a + " " + esc(c.vuz) + " od vás koupíme a vy jej dál užíváte pro své podnikání. Není to úvěr ani půjčka."]) +
        sec("Tři čísla předem", ["Výkupní cena: <strong>" + c.vykup + "</strong><br>Měsíční rezervační poplatek: <strong>" + c.poplatek + "</strong><br>Cena zpětného odkupu: <strong>" + c.odkup + "</strong><br>Doba rezervace: " + c.doba]) +
        sec("Kdo je vlastník", ["Po výkupu je vlastníkem " + esc(OP.name) + " (provozovatel služby " + esc(OP.brand) + "). Vy zůstáváte provozovatelem."]) +
        sec("Na co si dát pozor", ["Služba není zdarma. Když rezervační poplatek neuhradíte, právo zpětného odkupu podle smlouvy zaniká. Pokud víte, že se platba zpozdí, ozvěte se nám předem.", "Služba je určena výhradně podnikatelům a firmám s IČO."]) +
        sec("Kontakt", [esc(OP.name) + " · " + esc(OP.seat) + " · " + esc(OP.email) + " · " + esc(OP.phone)]);
    } },
    { key: "protokol", name: function () { return "Předávací protokol"; }, need: ["vin", "km"], sign: 1, body: function (c) {
      return sec("Předmět", [subject(c) + "."]) + sec("Předávající / přebírající", [esc(c.klient) + " (IČO " + esc(c.ico) + ") · " + esc(OP.name)]) +
        "<table><tr><th>Předáno</th><th>Ano / počet</th></tr><tr><td>Technický průkaz (velký)</td><td></td></tr><tr><td>Osvědčení o registraci (malý TP)</td><td></td></tr><tr><td>Klíče</td><td></td></tr><tr><td>Servisní dokumentace</td><td></td></tr></table>" +
        sec("Stav při předání", ["[popis stavu, zjištěné vady, fotodokumentace]"]) + sec("Místo a datum", ["[místo], " + c.datum]) + signs("Předávající", "Přebírající");
    } }
  ];
  var docByKey = function (k) { return DOCS.filter(function (d) { return d.key === k; })[0]; };
  var DSTAT = { none: "Nevygenerováno", ready: "Vygenerováno", sent: "Odesláno klientovi", signed: "Podepsáno" };
  function docHTML(it, key) {
    var d = docByKey(key), c = ctx(it);
    return '<article class="paper"><p class="paper-flag">Vzor vygenerovaný ze šablony · před použitím nutná právní revize</p><h2>' + esc(d.name(c)) + "</h2>" +
      '<p class="paper-meta">Případ ' + esc(it.id) + " · " + esc(lineOf(it).label) + " · " + c.datum + "</p>" + d.body(c) + "</article>";
  }
  var PAPER_CSS = "body{font:15px/1.55 Georgia,'Times New Roman',serif;color:#111;margin:0;padding:32px 40px;max-width:820px}h2{font:700 22px/1.2 Arial,sans-serif;margin:0 0 4px}h3{font:700 14px/1.3 Arial,sans-serif;margin:18px 0 4px}p{margin:0 0 8px}" +
    ".paper-flag{font:700 11px/1 Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#8a5a00;border:1px solid #d9b56b;padding:6px 8px;display:inline-block;margin-bottom:14px}.paper-meta{font:13px Arial,sans-serif;color:#555;margin-bottom:14px}" +
    "table{border-collapse:collapse;width:100%;margin:10px 0 14px;font:14px Arial,sans-serif}th,td{border:1px solid #999;padding:7px 9px;text-align:left}td:last-child,th:last-child{text-align:right;white-space:nowrap}" +
    ".signs{display:flex;gap:48px;margin-top:56px;font:13px Arial,sans-serif}.signs div{flex:1}.signs span{display:block;border-top:1px solid #111;margin-bottom:6px}@page{margin:18mm}";
  function fullDoc(it, key) { return '<!doctype html><html lang="cs"><head><meta charset="utf-8"><title>' + esc(docByKey(key).name(ctx(it))) + " — " + esc(it.id) + "</title><style>" + PAPER_CSS + "</style></head><body>" + docHTML(it, key) + "</body></html>"; }
  function printDoc(it, key) {
    var f = document.createElement("iframe"); f.setAttribute("aria-hidden", "true"); f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    document.body.appendChild(f);
    var d = f.contentWindow.document; d.open(); d.write(fullDoc(it, key)); d.close();
    setTimeout(function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { K.toast("Tisk se nepodařilo spustit"); } setTimeout(function () { f.remove(); }, 2000); }, 200);
  }
  function downloadDoc(it, key) {
    var blob = new Blob(["\ufeff" + fullDoc(it, key)], { type: "application/msword" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = it.id + "_" + key + ".doc"; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ---------- šablony e-mailů ----------
  var SIGN = "\n\nS pozdravem\n{{znacka}} — {{rada}}\n{{provozovatel}} · {{web}}";
  var TPL = [
    { key: "prijeti", stage: "lead", name: "Potvrzení přijetí žádosti", subject: "Vaši žádost {{id}} jsme přijali",
      body: "Dobrý den,\n\nděkujeme za žádost o dočasný výkup se zpětným odkupem ({{predmet}}: {{vuz}}). Evidujeme ji pod číslem {{id}}.\n\nCo bude dál:\n1. Ozveme se vám telefonicky a ověříme údaje ze žádosti.\n2. Připravíme orientační nabídku — výkupní cenu, měsíční rezervační poplatek a cenu zpětného odkupu, vše v korunách.\n3. Technik si {{predmet}} prohlédne přímo u vás.\n\nSlužba je určena výhradně podnikatelům a firmám s IČO." + SIGN },
    { key: "call", stage: "call", name: "Domluva telefonátu", subject: "Krátký telefonát k žádosti {{id}}",
      body: "Dobrý den,\n\nrádi bychom s vámi telefonicky ověřili údaje ze žádosti {{id}} ({{vuz}}). Napište nám prosím, kdy se vám to hodí, nebo zavolejte na {{telefon_firmy}}." + SIGN },
    { key: "nabidka", stage: "scoring", name: "Orientační nabídka", subject: "Orientační nabídka k žádosti {{id}} — {{vuz}}",
      body: "Dobrý den,\n\nna základě údajů ze žádosti jsme připravili orientační nabídku:\n\nOdhad hodnoty: {{hodnota}}\nVýkupní cena: {{vykup}}\nMěsíční rezervační poplatek: {{poplatek}}\nCena zpětného odkupu: {{odkup}}\nDoba rezervace: {{doba}}\n\nJde o orientační výpočet, ne o závaznou nabídku. Konečná čísla potvrdíme po prohlídce technikem a ověření dokladů. Služba není zdarma — za rezervaci možnosti zpětného odkupu platíte měsíční poplatek. {{predmet_velke}} po celou dobu dál používáte pro své podnikání." + SIGN },
    { key: "technik", stage: "technik", name: "Termín prohlídky technikem", subject: "Prohlídka technikem — domluva termínu ({{id}})",
      body: "Dobrý den,\n\ndalším krokem je prohlídka technikem ({{vuz}}). Technik přijede za vámi. Připravte si prosím technický průkaz, doklad totožnosti a servisní historii, pokud ji máte.\n\nNavrhněte nám prosím dva termíny, které se vám hodí." + SIGN },
    { key: "smlouvy", stage: "approval", name: "Smlouvy k podpisu", subject: "Smlouvy k podpisu — {{id}}",
      body: "Dobrý den,\n\nv příloze posíláme smluvní dokumentaci k dočasnému výkupu ({{vuz}}):\n{{dokumenty}}\n\nProjděte si ji prosím v klidu. Tři čísla, která ve smlouvách najdete:\nVýkupní cena: {{vykup}}\nMěsíční rezervační poplatek: {{poplatek}}\nCena zpětného odkupu: {{odkup}}\n\nPokud je cokoliv nejasné, ozvěte se — vše vysvětlíme ještě před podpisem." + SIGN },
    { key: "pojisteni", stage: "insurance", name: "Podklady k pojištění", subject: "Pojištění — {{vuz}} ({{id}})",
      body: "Dobrý den,\n\npo výkupu se mění vlastník, vy zůstáváte provozovatelem. Aby pojištění navazovalo bez přerušení, potřebujeme od vás název pojišťovny a číslo stávající pojistné smlouvy. Převod vyřídíme administrativně za vás." + SIGN },
    { key: "vyplata", stage: "done", name: "Podepsáno — co bude následovat", subject: "Smlouvy jsou podepsané — co bude následovat ({{id}})",
      body: "Dobrý den,\n\nděkujeme za podpis. Výkupní cenu {{vykup}} odesíláme na váš firemní účet, zpravidla do 24 hodin od podpisu.\n\n{{predmet_velke}} dál používáte pro podnikání podle smlouvy o užívání. Měsíční rezervační poplatek {{poplatek}} drží možnost zpětného odkupu za {{odkup}}; odkoupit zpět můžete kdykoliv dříve.\n\nTermíny plateb uvidíte v klientské zóně." + SIGN },
    { key: "pripominka", stage: "", name: "Připomínka poplatku", subject: "Připomínka: rezervační poplatek ({{id}})",
      body: "Dobrý den,\n\npřipomínáme blížící se splatnost měsíčního rezervačního poplatku {{poplatek}} ({{vuz}}). Datum splatnosti: [doplňte].\n\nPokud víte, že se platba zpozdí, dejte nám prosím vědět předem — společně najdeme řešení." + SIGN }
  ];
  var tplByKey = function (k) { return TPL.filter(function (t) { return t.key === k; })[0]; };
  var tplText = function (t) { var o = cfg.tpl[t.key]; return { subject: o && o.subject != null ? o.subject : t.subject, body: o && o.body != null ? o.body : t.body }; };
  var PLACE = ["id", "klient", "kontakt", "vuz", "predmet", "hodnota", "vykup", "poplatek", "odkup", "doba", "rada", "dokumenty", "telefon_firmy", "znacka", "provozovatel", "web"];
  function merge(text, it) {
    var c = ctx(it), cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
    var docs = DOCS.filter(function (d) { return (it.docs[d.key] || {}).s && it.docs[d.key].s !== "none"; }).map(function (d) { return "– " + d.name(c); }).join("\n") || "– [vygenerujte dokumenty v záložce Smlouvy]";
    var m = { id: it.id, klient: c.klient, kontakt: c.kontakt, vuz: it.car, predmet: c.N.n, predmet_velke: cap(c.N.n), hodnota: c.hodnota, vykup: c.vykup, poplatek: c.poplatek, odkup: c.odkup, doba: c.doba,
      rada: c.L.label, dokumenty: docs, telefon_firmy: OP.phone, znacka: OP.brand, provozovatel: OP.name, web: OP.web };
    return String(text).replace(/\{\{(\w+)\}\}/g, function (all, k) { return m[k] != null ? String(m[k]).replace(/\u00A0/g, " ") : "[" + k + "]"; });
  }

  // ---------- výchozí stav případu ----------
  function ensure(it, stageIdx) {
    if (it._cd) return;
    it._cd = 1; it.docs = it.docs || {}; it.mails = it.mails || []; it.checks = it.checks || {}; it.activity = it.activity || [];
    var s = stageIdx >= 6 ? "signed" : stageIdx === 5 ? "sent" : stageIdx === 4 ? "ready" : "none";
    DOCS.forEach(function (d) { if (!it.docs[d.key]) it.docs[d.key] = { s: s === "signed" && !d.sign ? "sent" : s }; });
    if (!it.activity.length) it.activity.push({ t: "ukázková data", k: "info", x: "Případ založen z kanálu " + it.channel });
  }
  function generate(it, key) { var d = it.docs[key]; if (d.s === "none") { d.s = "ready"; d.at = stamp(); return true; } return false; }
  function queueMail(it, tplKey, how) {
    if (it.mails.some(function (m) { return m.tpl === tplKey && m.s === "queued"; })) return false;
    it.mails.unshift({ tpl: tplKey, s: "queued", at: stamp(), how: how || "ručně" });
    return true;
  }

  // ---------- automatizace při přesunu ----------
  K.onMove(function (it, fromKey, toKey, isUndo) {
    var ti = STAGES.map(function (s) { return s.key; }).indexOf(toKey), a = STAGES.filter(function (s) { return s.key === fromKey; })[0], b = STAGES[ti];
    ensure(it, STAGES.indexOf(a));   // výchozí stav dokumentů podle fáze, ze které případ odchází
    act(it, "stage", (isUndo ? "Vráceno: " : "") + a.label + " → " + b.label);
    if (isUndo) return;
    var notes = [];
    var t = TPL.filter(function (x) { return x.stage === toKey; })[0];
    if (t && cfg.auto[toKey] && queueMail(it, t.key, "automaticky")) { act(it, "mail", "Automatizace: e-mail „" + t.name + "“ připraven k odeslání"); notes.push("e-mail „" + t.name + "“ je připraven"); }
    if (toKey === "approval" && cfg.autoDocs) {
      var n = DOCS.filter(function (d) { return !missing(it, d.need).length && generate(it, d.key); }).length;
      if (n) { act(it, "doc", "Automatizace: vygenerováno dokumentů: " + n); notes.push("vygenerováno dokumentů: " + n); }
    }
    if (notes.length) setTimeout(function () { K.toast("Automatizace: " + notes.join(", ")); }, 700);
  });

  // ---------- vykreslení ----------
  var ui = { id: null, tab: "prehled", view: null, focus: null };
  var ICON = {
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    warn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.5"/></svg>',
    doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>'
  };
  var btn = function (cls, actn, label, extra) { return '<button type="button" class="btn btn-sm ' + cls + '" data-act="' + actn + '"' + (extra || "") + ">" + label + "</button>"; };

  function tabPrehled(it, f) {
    var st = STAGES[f.c], L = lineOf(it), m = market(it), list = CHECKS[st.key] || [], ch = it.checks[st.key] || [], done = list.filter(function (x, i) { return ch[i]; }).length;
    var miss = missing(it, ["contact", "phone", "email", "city", "year", "vin"]);
    return '<div class="sheet-sec"><div class="sh-next">' + K.ICO.info + "<span><strong>" + esc(st.label) + ".</strong> " + esc(K.NEXT[st.key] || "") + "</span></div></div>" +
      '<div class="sheet-sec"><h3>Fáze případu</h3><div class="cd-stepper">' + STAGES.map(function (s, i) {
        return '<button type="button" data-act="stage" data-key="' + s.key + '" class="' + (i < f.c ? "is-past" : "") + '"' + (i === f.c ? ' aria-current="step"' : "") + ' aria-label="Fáze ' + s.n + " " + esc(s.label) + '"><span class="n">' + s.n + '</span><span class="t">' + esc(s.short) + "</span></button>";
      }).join("") + "</div></div>" +
      '<div class="sheet-sec"><h3>Co je v této fázi potřeba <span class="cd-count">' + done + " / " + list.length + '</span></h3><ul class="cd-checks">' + list.map(function (x, i) {
        return '<li><label><input type="checkbox" data-chk="' + i + '"' + (ch[i] ? " checked" : "") + " /><span>" + esc(x) + "</span></label></li>";
      }).join("") + "</ul></div>" +
      '<div class="sheet-sec"><h3>Tři čísla případu</h3><div class="sh-three"><div><span>Výkupní cena</span><strong>' + czk(it.vykup) + "</strong></div><div><span>Měsíční rezervační poplatek</span><strong>" + czk(it.fee) +
        "</strong></div><div><span>Cena zpětného odkupu</span><strong>" + czk(it.vykup) + '</strong></div></div><p class="cd-fine">Odhad hodnoty ' + czk(m) + " · výkup " + pct(it.vykup / m) + " · poplatek " + pct(it.fee / m) +
        " měsíčně · rezervace " + months(term(it)) + " (poplatek celkem " + czk(it.fee * term(it)) + ")</p></div>" +
      (miss.length ? '<div class="sheet-sec"><div class="cd-warn">' + ICON.warn + "<span>Chybí údaje: " + miss.map(function (x) { return esc(x.l); }).join(", ") + ".</span>" + btn("btn-ghost", "fill", "Doplnit", ' data-k="' + miss[0].k + '"') + "</div></div>" : "") +
      '<div class="sheet-sec"><h3>Rychlé akce</h3><div class="cd-quick">' + btn("btn-primary", "mail-stage", ICON.mail + "Napsat e-mail") + btn("btn-ghost", "tab", ICON.doc + "Smlouvy", ' data-tab="smlouvy"') +
        (it.phone ? '<a class="btn btn-sm btn-ghost" href="tel:' + esc(String(it.phone).replace(/\s/g, "")) + '">Zavolat</a>' : "") +
        (it.ico ? '<a class="btn btn-sm btn-ghost" target="_blank" rel="noopener" href="https://ares.gov.cz/ekonomicke-subjekty?ico=' + encodeURIComponent(it.ico) + '">Ověřit v ARES</a>' : "") + "</div></div>";
  }

  function tabUdaje(it) {
    var F = fields(it), secs = {}, order = [];
    Object.keys(F).forEach(function (k) { var s = F[k].sec; if (!secs[s]) { secs[s] = []; order.push(s); } secs[s].push(k); });
    var L = lineOf(it);
    return order.map(function (s) {
      return '<div class="sheet-sec"><h3>' + esc(s) + '</h3><div class="cd-form">' + secs[s].map(function (k) {
        var fd = F[k], v = val(it, k), id = "cdf_" + k;
        var ctl = fd.opts ? '<select id="' + id + '" data-f="' + k + '">' + fd.opts.map(function (o) { return '<option value="' + o[0] + '"' + (String(o[0]) === String(v) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>"
          : '<input id="' + id + '" data-f="' + k + '" type="' + (fd.type || "text") + '"' + (fd.n || fd.mode ? ' inputmode="numeric"' : "") + ' value="' + esc(v) + '" autocomplete="off" />';
        return '<div class="cd-field' + (v === "" ? " is-empty" : "") + '"><label for="' + id + '">' + esc(fd.l) + "</label>" + ctl + "</div>";
      }).join("") + "</div>" + (s === "Obchod" ? '<p class="cd-fine">Sazby řady ' + esc(L.label) + ": výkup " + pct(L.rate) + " a poplatek " + pct(L.fee) + " z odhadní hodnoty měsíčně. " +
        '<button type="button" class="cd-link" data-act="recalc">Přepočítat výkup a poplatek z odhadu</button></p>' : "") + "</div>";
    }).join("") + '<p class="cd-fine">Změny se ukládají hned. Údaje se propisují do smluv i e-mailů.</p>';
  }

  function tabSmlouvy(it) {
    var c = ctx(it), gen = DOCS.filter(function (d) { return it.docs[d.key].s !== "none"; }).length, sg = DOCS.filter(function (d) { return it.docs[d.key].s === "signed"; }).length;
    return '<div class="sheet-sec"><div class="cd-note">' + K.ICO.info + "<span>Dokumenty se plní ze šablon údaji případu. Texty jsou <strong>vzory</strong> — před ostrým použitím je musí schválit právník.</span></div></div>" +
      '<div class="sheet-sec"><div class="cd-bar"><span><strong>' + gen + "</strong> z " + DOCS.length + " vygenerováno · <strong>" + sg + "</strong> podepsáno</span><span class=\"cd-bar-a\">" + btn("btn-ghost", "doc-all", "Vygenerovat vše") + btn("btn-primary", "doc-send", "Odeslat balík klientovi") + "</span></div>" +
      '<ul class="cd-docs">' + DOCS.map(function (d) {
        var st = it.docs[d.key], miss = missing(it, d.need);
        var next = st.s === "none" ? btn("btn-primary", "doc-gen", "Vygenerovat", ' data-key="' + d.key + '"') : st.s === "ready" ? btn("btn-ghost", "doc-set", "Označit odeslané", ' data-key="' + d.key + '" data-s="sent"')
          : st.s === "sent" && d.sign ? btn("btn-ghost", "doc-set", "Označit podepsané", ' data-key="' + d.key + '" data-s="signed"') : "";
        return '<li class="cd-doc"><span class="doc-ico">' + ICON.doc + '</span><div class="cd-doc-m"><strong>' + esc(d.name(c)) + '</strong><span class="cd-st s-' + st.s + '">' + DSTAT[st.s] + (st.at ? " · " + esc(st.at) : "") + "</span>" +
          (miss.length ? '<span class="cd-miss">Chybí: ' + miss.map(function (x) { return esc(x.l); }).join(", ") + ' · <button type="button" class="cd-link" data-act="fill" data-k="' + miss[0].k + '">doplnit</button></span>' : "") +
          '</div><div class="cd-doc-a">' + btn("btn-ghost", "doc-view", "Náhled", ' data-key="' + d.key + '"') + next + "</div></li>";
      }).join("") + "</ul></div>";
  }
  function viewDoc(it, key) {
    var d = docByKey(key), st = it.docs[key];
    return '<div class="cd-viewbar">' + btn("btn-ghost", "back", ICON.back + "Zpět na smlouvy") + '<span class="cd-st s-' + st.s + '">' + DSTAT[st.s] + "</span></div>" +
      '<div class="cd-viewbar cd-tools">' + btn("btn-primary", "doc-print", "Tisk / uložit PDF", ' data-key="' + key + '"') + btn("btn-ghost", "doc-dl", "Stáhnout pro Word", ' data-key="' + key + '"') +
      (st.s === "none" ? btn("btn-ghost", "doc-gen", "Označit vygenerované", ' data-key="' + key + '"') : "") + "</div>" +
      '<div class="cd-paper">' + docHTML(it, key) + "</div>";
  }

  function tabMaily(it, f) {
    var q = it.mails.filter(function (m) { return m.s === "queued"; }), sent = it.mails.filter(function (m) { return m.s === "sent"; }), stKey = STAGES[f.c].key;
    var row = function (m) {
      var t = tplByKey(m.tpl), i = it.mails.indexOf(m);
      return '<li class="cd-mail"><span class="doc-ico">' + ICON.mail + '</span><div class="cd-doc-m"><strong>' + esc(t ? t.name : m.tpl) + '</strong><span class="cd-st s-' + (m.s === "sent" ? "signed" : "ready") + '">' +
        (m.s === "sent" ? "Označeno jako odeslané" : "Připraveno · " + esc(m.how || "")) + " · " + esc(m.at) + '</span></div><div class="cd-doc-a">' +
        (m.s === "queued" ? btn("btn-primary", "mail-open", "Otevřít", ' data-i="' + i + '"') + btn("btn-ghost", "mail-drop", "Zahodit", ' data-i="' + i + '"') : btn("btn-ghost", "mail-open", "Zobrazit", ' data-i="' + i + '"')) + "</div></li>";
    };
    return '<div class="sheet-sec"><div class="cd-note">' + K.ICO.info + "<span>Administrace e-maily sama neodesílá — není napojená na e-mailovou službu. Zprávu otevřete ve svém poštovním programu nebo ji zkopírujte.</span></div></div>" +
      '<div class="sheet-sec"><h3>Připravené k odeslání <span class="cd-count">' + q.length + "</span></h3>" + (q.length ? '<ul class="cd-docs">' + q.map(row).join("") + "</ul>" : '<p class="cd-fine">Nic nečeká. E-mail se sem připraví sám při přesunu do další fáze, nebo ho vyberte ze šablon níže.</p>') + "</div>" +
      '<div class="sheet-sec"><h3>Napsat ze šablony</h3><div class="cd-tpls">' + TPL.map(function (t) {
        return '<button type="button" data-act="mail-new" data-tpl="' + t.key + '"' + (t.stage === stKey ? ' class="is-rec"' : "") + "><strong>" + esc(t.name) + "</strong><span>" + (t.stage === stKey ? "doporučeno pro tuto fázi" : t.stage ? "fáze " + esc(STAGES.filter(function (s) { return s.key === t.stage; })[0].short) : "kdykoliv") + "</span></button>";
      }).join("") + "</div></div>" +
      (sent.length ? '<div class="sheet-sec"><h3>Odeslané</h3><ul class="cd-docs">' + sent.map(row).join("") + "</ul></div>" : "") +
      '<div class="sheet-sec"><h3>Automatizace</h3><p class="cd-fine">Platí pro všechny případy. Při přesunu do fáze se e-mail sám připraví do fronty; odeslání potvrzujete vy.</p><ul class="cd-autos">' +
        STAGES.filter(function (s) { return TPL.some(function (t) { return t.stage === s.key; }) && s.key !== "lead"; }).map(function (s) {
          var t = TPL.filter(function (x) { return x.stage === s.key; })[0];
          return '<li><label class="cd-switch"><input type="checkbox" data-auto="' + s.key + '"' + (cfg.auto[s.key] ? " checked" : "") + ' /><i></i><span>Fáze <strong>' + s.n + " · " + esc(s.label) + "</strong> → e-mail „" + esc(t.name) + "“</span></label></li>";
        }).join("") +
        '<li><label class="cd-switch"><input type="checkbox" data-auto="__docs"' + (cfg.autoDocs ? " checked" : "") + " /><i></i><span>Fáze <strong>5 · Schválení</strong> → vygenerovat balík smluv</span></label></li></ul></div>" +
      '<div class="sheet-sec"><h3>Znění šablon</h3><ul class="cd-tpl-list">' + TPL.map(function (t) {
        return "<li><span>" + esc(t.name) + (cfg.tpl[t.key] ? ' <em>upraveno</em>' : "") + '</span><button type="button" class="cd-link" data-act="tpl-edit" data-tpl="' + t.key + '">upravit</button></li>';
      }).join("") + "</ul></div>";
  }
  function viewMail(it, v) {
    var m = v.i != null ? it.mails[v.i] : null, t = tplByKey(v.tpl), x = tplText(t);
    var subj = m && m.subject != null ? m.subject : merge(x.subject, it), body = m && m.body != null ? m.body : merge(x.body, it), ro = m && m.s === "sent";
    return '<div class="cd-viewbar">' + btn("btn-ghost", "back", ICON.back + "Zpět na e-maily") + '<span class="cd-st s-' + (ro ? "signed" : "ready") + '">' + esc(t.name) + "</span></div>" +
      (!it.email ? '<div class="cd-warn">' + ICON.warn + "<span>Případ nemá e-mail klienta.</span>" + btn("btn-ghost", "fill", "Doplnit", ' data-k="email"') + "</div>" : "") +
      '<div class="cd-form one"><div class="cd-field"><label for="cdm_to">Komu</label><input id="cdm_to" type="email" value="' + esc(it.email || "") + '" data-m="to"' + (ro ? " readonly" : "") + " /></div>" +
      '<div class="cd-field"><label for="cdm_s">Předmět</label><input id="cdm_s" type="text" value="' + esc(subj) + '" data-m="subject"' + (ro ? " readonly" : "") + " /></div>" +
      '<div class="cd-field"><label for="cdm_b">Text</label><textarea id="cdm_b" rows="14" data-m="body"' + (ro ? " readonly" : "") + ">" + esc(body) + "</textarea></div></div>" +
      (t.key === "smlouvy" ? '<p class="cd-fine">Přílohy se nepřikládají samy: dokumenty uložte ze záložky Smlouvy (Tisk / uložit PDF) a přiložte je v poštovním programu.</p>' : "") +
      '<div class="cd-viewbar cd-tools">' + btn("btn-primary", "mail-send", "Otevřít v e-mailu") + btn("btn-ghost", "mail-copy", "Kopírovat text") + (ro ? "" : btn("btn-ghost", "mail-done", "Označit jako odeslané")) + "</div>";
  }
  function viewTpl(key) {
    var t = tplByKey(key), x = tplText(t);
    return '<div class="cd-viewbar">' + btn("btn-ghost", "back", ICON.back + "Zpět na e-maily") + '<span class="cd-st s-ready">Šablona</span></div>' +
      '<h3 class="cd-h">' + esc(t.name) + '</h3><p class="cd-fine">Změna platí pro všechny případy. Zástupné výrazy ve složených závorkách se při psaní e-mailu nahradí údaji případu.</p>' +
      '<div class="cd-form one"><div class="cd-field"><label for="cdt_s">Předmět</label><input id="cdt_s" type="text" value="' + esc(x.subject) + '" /></div>' +
      '<div class="cd-field"><label for="cdt_b">Text</label><textarea id="cdt_b" rows="14">' + esc(x.body) + "</textarea></div></div>" +
      '<div class="cd-place" aria-label="Zástupné výrazy">' + PLACE.map(function (p) { return '<button type="button" data-act="tpl-ins" data-p="' + p + '">{{' + p + "}}</button>"; }).join("") + "</div>" +
      '<div class="cd-viewbar cd-tools">' + btn("btn-primary", "tpl-save", "Uložit šablonu", ' data-tpl="' + key + '"') + (cfg.tpl[key] ? btn("btn-ghost", "tpl-reset", "Vrátit výchozí znění", ' data-tpl="' + key + '"') : "") + "</div>";
  }

  function tabAktivita(it) {
    var cls = { stage: "is-stage", mail: "is-mail", doc: "is-doc", note: "is-note", edit: "is-edit", info: "" };
    return '<div class="sheet-sec"><h3>Poznámka</h3><div class="cd-form one"><div class="cd-field"><label for="cd_note" class="sr-live">Nová poznámka</label><textarea id="cd_note" rows="3" placeholder="Co jste s klientem domluvili…"></textarea></div></div>' +
      '<div class="cd-viewbar cd-tools">' + btn("btn-primary", "note-add", "Přidat poznámku") + "</div></div>" +
      '<div class="sheet-sec"><h3>Historie případu</h3><ul class="cd-time">' + it.activity.map(function (a) {
        return '<li class="' + (cls[a.k] || "") + '"><span class="when">' + esc(a.t) + "</span><span>" + esc(a.x) + "</span></li>";
      }).join("") + "</ul></div>";
  }

  var TABS = [["prehled", "Přehled"], ["udaje", "Údaje"], ["smlouvy", "Smlouvy"], ["maily", "E-maily"], ["aktivita", "Aktivita"]];
  function fill(id) {
    var f = K.find(id); if (!f) return false;
    var it = f.item, st = STAGES[f.c], prev = STAGES[f.c - 1], next = STAGES[f.c + 1], L = lineOf(it);
    ensure(it, f.c);
    if (ui.id !== id) { ui.id = id; ui.tab = "prehled"; ui.view = null; }
    var body = sheet.querySelector("#shBody"), keep = body.dataset.sig === id + ui.tab + JSON.stringify(ui.view) ? body.scrollTop : 0;
    sheet.querySelector("#shId").innerHTML = '<span class="kb-line" data-l="' + LN.of(it) + '">' + esc(L.short) + "</span> " + esc(it.id) + " · fáze " + st.n + " z " + STAGES.length + " · " + esc(st.label);
    sheet.querySelector("#shTitle").textContent = it.name;
    sheet.querySelector("#shSub").textContent = it.car + (it.ico ? " · IČO " + it.ico : "") + (it.city ? " · " + it.city : "");
    var gen = DOCS.filter(function (d) { return it.docs[d.key].s !== "none"; }).length, q = it.mails.filter(function (m) { return m.s === "queued"; }).length;
    var badge = { smlouvy: gen + "/" + DOCS.length, maily: q || "" };
    var content = ui.view ? (ui.view.type === "doc" ? viewDoc(it, ui.view.key) : ui.view.type === "mail" ? viewMail(it, ui.view) : viewTpl(ui.view.key))
      : ui.tab === "udaje" ? tabUdaje(it) : ui.tab === "smlouvy" ? tabSmlouvy(it) : ui.tab === "maily" ? tabMaily(it, f) : ui.tab === "aktivita" ? tabAktivita(it) : tabPrehled(it, f);
    body.innerHTML = '<div class="cd-tabs" role="tablist">' + TABS.map(function (t) {
      return '<button type="button" role="tab" data-act="tab" data-tab="' + t[0] + '" aria-selected="' + (ui.tab === t[0] ? "true" : "false") + '">' + t[1] + (badge[t[0]] ? '<span class="cd-badge' + (t[0] === "maily" ? " hot" : "") + '">' + badge[t[0]] + "</span>" : "") + "</button>";
    }).join("") + '</div><div class="cd-pane" role="tabpanel">' + content + "</div>";
    body.dataset.sig = id + ui.tab + JSON.stringify(ui.view); body.scrollTop = keep;
    sheet.querySelector("#shFoot").innerHTML = (prev ? '<button type="button" class="btn btn-ghost" data-step="-1">← ' + esc(prev.short) + "</button>" : "") +
      (next ? '<button type="button" class="btn btn-primary" data-step="1">Posunout: ' + esc(next.short) + " →</button>" : '<button type="button" class="btn btn-primary" data-close>Zavřít</button>');
    if (ui.focus) { var el = sheet.querySelector('[data-f="' + ui.focus + '"]'); ui.focus = null; if (el) setTimeout(function () { el.focus(); el.scrollIntoView({ block: "center" }); }, 60); }
    return true;
  }
  function refresh(touch) { if (touch) K.touch(ui.id); fill(ui.id); }
  function cur() { var f = K.find(ui.id); return f ? f.item : null; }
  function copy(text) {
    var ok = function () { K.toast("Zkopírováno do schránky"); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, function () { K.toast("Kopírování se nepodařilo"); });
    else { var t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); ok(); } catch (e) { K.toast("Kopírování se nepodařilo"); } t.remove(); }
  }
  function mailVals() { return { to: (sheet.querySelector('[data-m="to"]') || {}).value || "", subject: (sheet.querySelector('[data-m="subject"]') || {}).value || "", body: (sheet.querySelector('[data-m="body"]') || {}).value || "" }; }
  function keepDraft(it) { var v = ui.view; if (!v || v.type !== "mail" || v.i == null) return; var m = it.mails[v.i], x = mailVals(); if (m && m.s === "queued") { m.subject = x.subject; m.body = x.body; } }

  // ---------- události ----------
  sheet.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b || !ui.id) return;
    var it = cur(); if (!it) return;
    var a = b.dataset.act, key = b.dataset.key, c = ctx(it);
    if (a === "tab") { ui.tab = b.dataset.tab; ui.view = null; return fill(ui.id); }
    if (a === "back") { keepDraft(it); ui.view = null; return refresh(true); }
    if (a === "stage") { if (!b.hasAttribute("aria-current")) K.moveTo(ui.id, key, 0, { reveal: true }); return; }
    if (a === "fill") { ui.tab = "udaje"; ui.view = null; ui.focus = b.dataset.k; return fill(ui.id); }
    if (a === "recalc") { var L = lineOf(it), m = market(it); it.market = m; it.vykup = Math.round(m * L.rate / 1000) * 1000; it.fee = Math.round(m * L.fee / 100) * 100; act(it, "edit", "Přepočet podle sazeb řady " + L.label + ": výkup " + czk(it.vykup) + ", poplatek " + czk(it.fee)); return refresh(true); }
    if (a === "doc-view") { ui.view = { type: "doc", key: key }; return fill(ui.id); }
    if (a === "doc-gen") { if (generate(it, key)) act(it, "doc", "Vygenerováno: " + docByKey(key).name(c)); return refresh(true); }
    if (a === "doc-all") { var n = DOCS.filter(function (d) { return generate(it, d.key); }).length; if (n) act(it, "doc", "Vygenerováno dokumentů: " + n); K.toast(n ? "Vygenerováno dokumentů: " + n : "Všechny dokumenty už jsou vygenerované"); return refresh(true); }
    if (a === "doc-set") { it.docs[key].s = b.dataset.s; it.docs[key].at = stamp(); act(it, "doc", docByKey(key).name(c) + ": " + DSTAT[b.dataset.s].toLowerCase()); return refresh(true); }
    if (a === "doc-send") {
      var rdy = DOCS.filter(function (d) { return it.docs[d.key].s === "ready"; });
      if (!rdy.length) { K.toast("Nejdřív dokumenty vygenerujte"); return; }
      rdy.forEach(function (d) { it.docs[d.key].s = "sent"; it.docs[d.key].at = stamp(); });
      queueMail(it, "smlouvy", "balík smluv"); act(it, "doc", "Balík smluv označen jako odeslaný klientovi (" + rdy.length + ")");
      ui.tab = "maily"; ui.view = { type: "mail", tpl: "smlouvy", i: it.mails.map(function (m) { return m.tpl + m.s; }).indexOf("smlouvyqueued") };
      return refresh(true);
    }
    if (a === "doc-print") return printDoc(it, key);
    if (a === "doc-dl") return downloadDoc(it, key);
    if (a === "mail-stage") { var st = STAGES[K.find(ui.id).c].key, t = TPL.filter(function (x) { return x.stage === st; })[0] || TPL[0]; ui.tab = "maily"; ui.view = { type: "mail", tpl: t.key }; return fill(ui.id); }
    if (a === "mail-new") { ui.view = { type: "mail", tpl: b.dataset.tpl }; return fill(ui.id); }
    if (a === "mail-open") { var mm = it.mails[+b.dataset.i]; ui.view = { type: "mail", tpl: mm.tpl, i: +b.dataset.i }; return fill(ui.id); }
    if (a === "mail-drop") { var d0 = it.mails.splice(+b.dataset.i, 1)[0]; act(it, "mail", "Připravený e-mail zahozen: " + (tplByKey(d0.tpl) || {}).name); return refresh(true); }
    if (a === "mail-copy") { var v1 = mailVals(); return copy(v1.subject + "\n\n" + v1.body); }
    if (a === "mail-send" || a === "mail-done") {
      var v = mailVals(), t2 = tplByKey(ui.view.tpl);
      if (a === "mail-send") {
        if (!v.to) { K.toast("Doplňte e-mail příjemce"); return; }
        window.location.href = "mailto:" + encodeURIComponent(v.to) + "?subject=" + encodeURIComponent(v.subject) + "&body=" + encodeURIComponent(v.body.replace(/\r?\n/g, "\r\n"));
        act(it, "mail", "E-mail „" + t2.name + "“ otevřen v poštovním programu"); keepDraft(it); K.touch(ui.id); return;
      }
      var i = ui.view.i; if (i == null) { it.mails.unshift({ tpl: t2.key, s: "queued", at: stamp(), how: "ručně" }); i = 0; }
      Object.assign(it.mails[i], { s: "sent", at: stamp(), subject: v.subject, body: v.body });
      act(it, "mail", "E-mail „" + t2.name + "“ označen jako odeslaný" + (v.to ? " (" + v.to + ")" : "")); ui.view = null; K.toast("Označeno jako odeslané"); return refresh(true);
    }
    if (a === "tpl-edit") { ui.view = { type: "tpl", key: b.dataset.tpl }; return fill(ui.id); }
    if (a === "tpl-ins") { var ta = sheet.querySelector("#cdt_b"), p = "{{" + b.dataset.p + "}}", s0 = ta.selectionStart; ta.value = ta.value.slice(0, s0) + p + ta.value.slice(ta.selectionEnd); ta.focus(); ta.selectionStart = ta.selectionEnd = s0 + p.length; return; }
    if (a === "tpl-save") { cfg.tpl[b.dataset.tpl] = { subject: sheet.querySelector("#cdt_s").value, body: sheet.querySelector("#cdt_b").value }; saveCfg(); K.toast("Šablona uložena"); ui.view = null; return fill(ui.id); }
    if (a === "tpl-reset") { delete cfg.tpl[b.dataset.tpl]; saveCfg(); K.toast("Vráceno výchozí znění"); return fill(ui.id); }
    if (a === "note-add") { var n0 = sheet.querySelector("#cd_note"), tx = n0.value.trim(); if (!tx) { n0.focus(); return; } act(it, "note", "Poznámka: " + tx); return refresh(true); }
  });
  sheet.addEventListener("change", function (e) {
    var it = cur(); if (!it) return;
    var t = e.target;
    if (t.matches("[data-chk]")) { var st = STAGES[K.find(ui.id).c].key; (it.checks[st] = it.checks[st] || [])[+t.dataset.chk] = t.checked; K.touch(ui.id); return fill(ui.id); }
    if (t.matches("[data-auto]")) { if (t.dataset.auto === "__docs") cfg.autoDocs = t.checked; else cfg.auto[t.dataset.auto] = t.checked; saveCfg(); K.toast(t.checked ? "Automatizace zapnuta" : "Automatizace vypnuta"); return; }
    if (t.matches("[data-f]")) {
      var k = t.dataset.f, F = fields(it)[k], v = t.value.trim(), old = val(it, k);
      if (F.n || k === "term") { v = v === "" ? "" : Number(String(v).replace(/[^\d]/g, "")); if (v !== "" && !isFinite(v)) v = old; }
      if ((k === "vykup" || k === "fee" || k === "name" || k === "car") && (v === "" || v === 0)) { t.value = old; K.toast("Toto pole nemůže být prázdné"); return; }
      if (String(v) === String(old)) return;
      it[k] = v; act(it, "edit", F.l + ": " + (v === "" ? "smazáno" : F.opts ? (F.opts.filter(function (o) { return String(o[0]) === String(v); })[0] || [0, v])[1] : v));
      t.closest(".cd-field").classList.toggle("is-empty", v === "");
      K.touch(ui.id);
      if (k === "line" || k === "name" || k === "car" || k === "ico" || k === "city") fill(ui.id);
    }
  });

  window.AKcase = {
    fill: fill,
    reset: function (id) { if (ui.id !== id) { ui.id = id; ui.tab = "prehled"; ui.view = null; } },
    back: function () { if (!ui.view) return false; var it = cur(); if (it) keepDraft(it); ui.view = null; fill(ui.id); return true; },
    docs: DOCS, templates: TPL
  };
})();
