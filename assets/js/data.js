/* =========================================================================
   AutoKapitál — Mock data layer (B2B · dočasný výkup vozu se zpětným odkupem — pro podnikatele)
   Exposes window.AK with demo data (CZ). NENÍ úvěr — výkupní cena + měsíční
   rezervační poplatek (4 % z hodnoty vozu) + cena zpětného odkupu.
   ========================================================================= */
window.AK = (function () {
  "use strict";

  const user = {
    name: "Jan Novák",
    profile: "OSVČ · elektroinstalace · Brno",
    ico: "765 22 901",
    initials: "JN",
    email: "jan.novak@elektronovak.cz",
    segment: "OSVČ / živnostník",
  };

  // Active case (drives the client portal) — dočasný výkup se zpětným odkupem
  const activeCase = {
    id: "AK-2026-04812",
    product: "Dočasný výkup",
    status: "Aktivní · auto používáte",
    statusKind: "success",
    marketValue: 300000,     // odhad hodnoty vozu
    vykup: 210000,           // výkupní cena (vyplaceno klientovi)
    offer: 210000,           // alias (výkupní cena)
    fee: 12000,              // měsíční rezervační poplatek (4 % z hodnoty vozu)
    buyback: 210000,         // cena zpětného odkupu (= výkupní cena, podle smlouvy)
    monthsElapsed: 2,
    payoutDate: "26. 3. 2026",
    nextPaymentDate: "26. 6. 2026",
    earlyBuybackAvailable: true,
    acceptProbability: 92,
  };

  const vehicle = {
    brand: "Škoda",
    model: "Octavia Combi 1.6 TDI",
    year: 2018,
    vin: "TMBJJ7NE0J0123456",
    spz: "5AK 4812",
    mileage: 132000,
    fuel: "Diesel",
    transmission: "Manuál",
    owners: 2,
    stk: "platná do 3/2027",
    insurance: "Povinné ručení, platné",
    role: "Vlastník: AutoKapitál a.s. · Provozovatel: Jan Novák (OSVČ, IČO 765 22 901)",
    photos: 6,
    conditionScore: 82,
  };

  // Client process tracker — 7 fází CRM (lead → call → scoring → technik → schválení → pojištění → přepis/podpis)
  // + aftersales (užívání, zpětný odkup)
  const processSteps = [
    { title: "1 · Žádost přijata", meta: "18. 3. 2026 · online formulář", state: "done" },
    { title: "2 · Telefonát — ověření údajů", meta: "18. 3. 2026 · 14 minut", state: "done" },
    { title: "3 · Scoring a orientační nabídka", meta: "19. 3. 2026 · výkup 210 000 Kč", state: "done" },
    { title: "4 · Návštěva technika", meta: "23. 3. 2026 · prohlídka vozu u vás", state: "done" },
    { title: "5 · Schválení výkupu", meta: "24. 3. 2026", state: "done" },
    { title: "6 · Pojištění vozidla", meta: "25. 3. 2026 · převod pojištění", state: "done" },
    { title: "7 · Přepis a podpis — hotovo", meta: "26. 3. 2026 · výplata 210 000 Kč", state: "done" },
    { title: "Užíváte vůz · rezervační poplatek", meta: "12 000 Kč / měsíc", state: "active" },
    { title: "Zpětný odkup", meta: "možný kdykoliv · cena 210 000 Kč", state: "todo" },
  ];

  // Client payments — měsíční rezervační poplatky
  const payments = [
    { date: "26. 4. 2026", label: "Rezervační poplatek — duben", amount: 12000, state: "Uhrazeno" },
    { date: "26. 5. 2026", label: "Rezervační poplatek — květen", amount: 12000, state: "Uhrazeno" },
    { date: "26. 6. 2026", label: "Rezervační poplatek — červen", amount: 12000, state: "Splatné" },
    { date: "kdykoliv", label: "Zpětný odkup vozu (volitelný)", amount: 210000, state: "Možné" },
  ];

  const documents = [
    { name: "Kupní smlouva na vozidlo", meta: "PDF · 25. 3. 2026", kind: "Smlouva", signed: true },
    { name: "Předávací protokol", meta: "PDF · 26. 3. 2026", kind: "Protokol", signed: true },
    { name: "Smlouva o užívání vozidla", meta: "PDF · 25. 3. 2026", kind: "Smlouva", signed: true },
    { name: "Smlouva o zpětném odkupu (opce)", meta: "PDF · 25. 3. 2026", kind: "Odkup", signed: true },
    { name: "Ceník rezervačního poplatku", meta: "PDF · 24. 3. 2026", kind: "Ceník", signed: false },
    { name: "Informační dokument pro klienta", meta: "PDF · 24. 3. 2026", kind: "Informace", signed: false },
  ];

  // ----- Admin data (podnikatelé a firmy, model výkupu) -----
  // CRM pipeline — 7 fází dle interního reportu:
  // 1 lead → 2 call → 3 scoring → 4 návštěva technikem → 5 schválení → 6 pojištění → 7 přepis & podpis (hotovo)
  const pipeline = [
    { key: "lead", label: "1 · Nový lead", items: [
      { id: "AK-5104", name: "Pavel Horák — OSVČ", ico: "089 12 334", car: "VW Passat B8", vykup: 175000, fee: 10500, segment: "C2", channel: "GA/PPC", risk: "low" },
      { id: "AK-5103", name: "Dvořák Pekařství s.r.o.", ico: "062 44 810", car: "Hyundai i30", vykup: 119000, fee: 7800, segment: "C3", channel: "Facebook", risk: "low" },
    ]},
    { key: "call", label: "2 · Call", items: [
      { id: "AK-5101", name: "Jiří Svoboda — OSVČ", ico: "714 55 902", car: "Dacia Duster", vykup: 98000, fee: 6500, segment: "C3", channel: "Sklik", risk: "low" },
      { id: "AK-5098", name: "Marešová Úklid s.r.o.", ico: "045 78 123", car: "Škoda Fabia", vykup: 91000, fee: 5900, segment: "C3", channel: "GA/PPC", risk: "low" },
    ]},
    { key: "scoring", label: "3 · Scoring", items: [
      { id: "AK-5095", name: "Tomáš Král — OSVČ", ico: "728 91 445", car: "Ford Focus", vykup: 133000, fee: 8700, segment: "C2", channel: "Instagram", risk: "med" },
      { id: "AK-5089", name: "Procházková Catering — OSVČ", ico: "691 02 887", car: "Kia Ceed", vykup: 154000, fee: 9200, segment: "C2", channel: "Retention/CRM", risk: "low" },
    ]},
    { key: "technik", label: "4 · Návštěva technikem", items: [
      { id: "AK-5085", name: "Novotný Stavby s.r.o.", ico: "277 40 551", car: "Škoda Kodiaq", vykup: 320000, fee: 17600, segment: "C1", channel: "GA/PPC", risk: "low" },
    ]},
    { key: "approval", label: "5 · Schválení", items: [
      { id: "AK-5081", name: "Beneš Autodoprava — OSVČ", ico: "745 20 663", car: "VW Tiguan", vykup: 280000, fee: 16800, segment: "C2", channel: "Facebook", risk: "med" },
      { id: "AK-5077", name: "Jan Novák — OSVČ", ico: "765 22 901", car: "Škoda Octavia", vykup: 210000, fee: 12000, segment: "C3", channel: "GA/PPC", risk: "low" },
    ]},
    { key: "insurance", label: "6 · Pojištění", items: [
      { id: "AK-5072", name: "Křížová Květiny — OSVČ", ico: "701 33 289", car: "Toyota Corolla", vykup: 185000, fee: 11100, segment: "C2", channel: "Retention/CRM", risk: "low" },
    ]},
    { key: "done", label: "7 · Přepis & podpis — hotovo", items: [
      { id: "AK-4812", name: "Jan Novák — OSVČ", ico: "765 22 901", car: "Škoda Octavia", vykup: 210000, fee: 12000, segment: "C3", channel: "GA/PPC", risk: "low" },
      { id: "AK-4790", name: "Horáková Krejčovství — OSVČ", ico: "688 45 120", car: "Toyota Yaris", vykup: 105000, fee: 6800, segment: "C3", channel: "Sklik", risk: "low" },
    ]},
  ];

  // Segmentace PŘÍPADŮ dle parametrů vozidla (hodnota, stáří, stav) — klienti jsou podnikatelé (OSVČ/firmy)
  // Rezervační poplatek diferencovaný podle vozového segmentu; core business = C2–C3, segment E nevykupujeme.
  const segments = [
    { key: "A",  label: "A · Prémiové vozy (nad 900 tis. Kč)",   feePct: "3 %",   cap: "strop 12 000 Kč", share: "1 %",  note: "Vysoká hodnota vozu — absolutní výše poplatku roste rychle, proto strop.", tone: "prémiová, diskrétní péče", channels: "LinkedIn, remarketing na prémiová publika" },
    { key: "B",  label: "B · Vyšší třída (600–900 tis. Kč)",     feePct: "4 %",   cap: "strop 15 000 Kč", share: "2 %",  note: "Bonitní případy, nízké riziko — komfort a rychlost.", tone: "profesionální", channels: "LinkedIn, remarketing" },
    { key: "C1", label: "C1 · Střední třída (400–600 tis. Kč)",  feePct: "5,5 %", cap: "—",               share: "9 %",  note: "Stabilní vozy s dobrou obchodovatelností.", tone: "spolehlivá, férová", channels: "online + retargeting + e-mailing (CRM)" },
    { key: "C2", label: "C2 · Nižší střední (250–400 tis. Kč)",  feePct: "6 %",   cap: "—",               share: "26 %", note: "Nejčastější firemní kombi a dodávky.", tone: "spolehlivá, věcná", channels: "online kampaně, retargeting, e-mailing" },
    { key: "C3", label: "C3 · Základní vozy (do 250 tis. Kč)",   feePct: "6,5 %", cap: "—",               share: "62 %", note: "Největší objem případů — starší vozy OSVČ a živnostníků.", tone: "přímočará, srozumitelná", channels: "Google Ads, FB Ads, Sklik (performance)" },
    { key: "E",  label: "E · Mimo výkupní kritéria",             feePct: "—",     cap: "—",               share: "—",    note: "NEVYKUPUJEME — vozy starší 15 let, špatný stav nebo právní vady.", tone: "—", channels: "—" },
  ];

  // Typický případ (průměry 2025 z interní analýzy) — profil vozu a subjektu, ne osoby
  const typicalClient = { form: "OSVČ 72 % · s.r.o. 28 %", carAge: 10.1, mileage: 162500, marketValue: 256000, score2026: 35 };

  const adminLeads = [
    { id: "AK-5081", client: "Beneš Autodoprava — OSVČ", ico: "745 20 663", city: "Praha", car: "VW Tiguan 2.0 TDI", market: 400000, vykup: 280000, fee: 16000, product: "3 měsíce", vehicleScore: 82, risk: "med", stage: "Čeká na schválení" },
    { id: "AK-5077", client: "Jan Novák — OSVČ", ico: "765 22 901", city: "Brno", car: "Škoda Octavia Combi 1.6 TDI", market: 300000, vykup: 210000, fee: 12000, product: "3 měsíce", vehicleScore: 84, risk: "low", stage: "Čeká na schválení" },
    { id: "AK-5089", client: "Procházková Catering — OSVČ", ico: "691 02 887", city: "Ostrava", car: "Kia Ceed 1.5", market: 220000, vykup: 154000, fee: 8800, product: "6 měsíců", vehicleScore: 80, risk: "low", stage: "Předběžně oceněno" },
    { id: "AK-5103", client: "Dvořák Pekařství s.r.o.", ico: "062 44 810", city: "Plzeň", car: "Hyundai i30 1.6", market: 170000, vykup: 119000, fee: 6800, product: "1 měsíc", vehicleScore: 78, risk: "low", stage: "Nový lead" },
  ];

  const riskAlerts = [
    { kind: "warning", title: "Chybí doklad o vlastnictví vozidla", meta: "AK-5095 · Tomáš Král", action: "Vyžádat doklad" },
    { kind: "danger", title: "Rezervační poplatek po splatnosti", meta: "AK-4655 · 3 dny · 7 200 Kč", action: "Nabídnout řešení" },
    { kind: "warning", title: "Blíží se konec lhůty pro zpětný odkup", meta: "AK-4790 · Horáková Krejčovství — OSVČ", action: "Kontaktovat klienta" },
    { kind: "info", title: "Nahrán nový doklad — čeká na ověření", meta: "AK-5089 · technický průkaz", action: "Ověřit dokument" },
    { kind: "danger", title: "Vozidlo zatížené zástavou / leasingem", meta: "AK-5070 · nutná ruční kontrola", action: "Eskalovat" },
  ];

  const adminVehicles = [
    { spz: "5AK 4812", model: "Škoda Octavia", state: "Aktivní", stk: "3/2027", ins: "OK", caseId: "AK-4812" },
    { spz: "2BX 9920", model: "Toyota Yaris", state: "Aktivní", stk: "11/2026", ins: "OK", caseId: "AK-4790" },
    { spz: "7CD 1180", model: "Renault Mégane", state: "Odkoupeno zpět", stk: "5/2027", ins: "—", caseId: "AK-4503" },
    { spz: "3EF 4521", model: "VW Tiguan", state: "K prodeji", stk: "1/2026", ins: "Pozor", caseId: "AK-4399" },
  ];

  const kpis = [
    { label: "Aktivní případy", value: "126", delta: "+14", trend: "up" },
    { label: "Objem výkupů", value: "23,8 M Kč", delta: "+2,6 M", trend: "up" },
    { label: "Průměrný výkup", value: "70 % hodnoty", delta: "stabilní", trend: "flat" },
    { label: "Míra zpětného odkupu", value: "93 %", delta: "+2 pb", trend: "up" },
  ];

  // ----- Měsíční channel report (struktura dle MONTHLY_REPORT_ONLINE_prefinal) -----
  // Funnel na kanál: náklady → návštěvníci → formulář (žádost) → kontaktováno → nabídka → kontrola dokumentace → smlouva.
  // months: Plan/Real páry za 2026 H2 (demo čísla za červenec; srpen–prosinec jen Plan).
  const reportMonths = ["07/26", "08/26", "09/26", "10/26", "11/26", "12/26"];
  const channelReport = [
    { channel: "Online agency (GA/PPC)", costs: 85000, funnel: {
      visitors:  { plan: 5200, real: 5480 }, forms: { plan: 156, real: 171 }, contacted: { plan: 125, real: 138 },
      offers:    { plan: 94,  real: 103 },  docs:  { plan: 61,  real: 66 },  contracts: { plan: 34,  real: 38 } },
      paid: 7980000 },
    { channel: "SoMe Facebook", costs: 42000, funnel: {
      visitors:  { plan: 3100, real: 2890 }, forms: { plan: 78,  real: 71 },  contacted: { plan: 59,  real: 55 },
      offers:    { plan: 41,  real: 39 },   docs:  { plan: 26,  real: 24 },  contracts: { plan: 14,  real: 13 } },
      paid: 2730000 },
    { channel: "SoMe Instagram", costs: 28000, funnel: {
      visitors:  { plan: 2400, real: 2610 }, forms: { plan: 48,  real: 55 },  contacted: { plan: 36,  real: 42 },
      offers:    { plan: 25,  real: 29 },   docs:  { plan: 16,  real: 18 },  contracts: { plan: 8,   real: 10 } },
      paid: 1890000 },
    { channel: "SoMe LinkedIn", costs: 15000, funnel: {
      visitors:  { plan: 620,  real: 540 },  forms: { plan: 9,   real: 7 },   contacted: { plan: 7,   real: 6 },
      offers:    { plan: 5,   real: 4 },    docs:  { plan: 3,   real: 3 },   contracts: { plan: 2,   real: 2 } },
      paid: 860000 },
    { channel: "SoMe YouTube & ostatní", costs: 18000, funnel: {
      visitors:  { plan: 1500, real: 1320 }, forms: { plan: 22,  real: 19 },  contacted: { plan: 17,  real: 14 },
      offers:    { plan: 12,  real: 10 },   docs:  { plan: 8,   real: 6 },   contracts: { plan: 4,   real: 3 } },
      paid: 640000 },
    { channel: "Retention/CRM", costs: 9000, funnel: {
      visitors:  { plan: 1800, real: 1930 }, forms: { plan: 54,  real: 61 },  contacted: { plan: 47,  real: 54 },
      offers:    { plan: 38,  real: 44 },   docs:  { plan: 28,  real: 31 },  contracts: { plan: 19,  real: 22 } },
      paid: 4300000 },
    { channel: "Test new media (Sklik…)", costs: 12000, funnel: {
      visitors:  { plan: 900,  real: 1040 }, forms: { plan: 16,  real: 21 },  contacted: { plan: 12,  real: 16 },
      offers:    { plan: 9,   real: 12 },   docs:  { plan: 6,   real: 8 },   contracts: { plan: 3,   real: 5 } },
      paid: 1050000 },
  ];
  // Řádky funnelu v pořadí reportu (label → klíč)
  const reportRows = [
    { key: "visitors",  label: "Noví návštěvníci" },
    { key: "forms",     label: "Vyplněný formulář = žádost" },
    { key: "contacted", label: "Kontaktované kontakty" },
    { key: "offers",    label: "Odeslaná nabídka" },
    { key: "docs",      label: "Kontrola dokumentace" },
    { key: "contracts", label: "Uzavřená smlouva" },
  ];

  // ----- Aftersales data (po podpisu: poplatky, prodloužení, odkupy, remarketing, retention) -----
  const aftersalesCases = [
    { id: "AK-4812", client: "Jan Novák — OSVČ", car: "Škoda Octavia", spz: "5AK 4812", vykup: 210000, fee: 12000, feeState: "Uhrazeno", months: 2, buyback: 210000, phase: "Aktivní užívání", risk: "low" },
    { id: "AK-4790", client: "Horáková Krejčovství — OSVČ", car: "Toyota Yaris", spz: "2BX 9920", vykup: 105000, fee: 6800, feeState: "Splatné za 5 dní", months: 4, buyback: 105000, phase: "Aktivní užívání", risk: "low" },
    { id: "AK-4655", client: "Fiala Instalatérství — OSVČ", car: "Ford Mondeo", spz: "8GH 2214", vykup: 120000, fee: 7200, feeState: "3 dny po splatnosti", months: 3, buyback: 120000, phase: "Upomínka", risk: "high" },
    { id: "AK-4703", client: "Malá Grafika — OSVČ", car: "VW Golf", spz: "4JK 7731", vykup: 145000, fee: 9000, feeState: "Uhrazeno", months: 5, buyback: 145000, phase: "Žádost o odkup", risk: "low" },
    { id: "AK-4503", client: "Veselý Servis s.r.o.", car: "Renault Mégane", spz: "7CD 1180", vykup: 126000, fee: 7200, feeState: "—", months: 6, buyback: 126000, phase: "Odkoupeno zpět", risk: "low" },
  ];
  const buybackRequests = [
    { id: "AK-4703", client: "Malá Grafika — OSVČ", car: "VW Golf", buyback: 145000, requested: "28. 6. 2026", state: "Čeká na platbu", next: "Po připsání platby připravit přepis" },
    { id: "AK-4788", client: "Beran Zednictví — OSVČ", car: "Škoda Fabia", buyback: 89000, requested: "25. 6. 2026", state: "Platba přijata", next: "Objednat přepis na úřadě / Portál dopravy" },
    { id: "AK-4762", client: "Urbanová Kadeřnictví — OSVČ", car: "Kia Rio", buyback: 96000, requested: "20. 6. 2026", state: "Přepis dokončen", next: "Předat vůz + protokol, uzavřít případ" },
  ];
  const remarketingCars = [
    { spz: "3EF 4521", model: "VW Tiguan 2.0 TDI", year: 2017, km: 168000, price: 315000, state: "Inzerováno", note: "právo odkupu zaniklo 4/2026" },
    { spz: "9LM 0083", model: "Peugeot 308 SW", year: 2016, km: 190000, price: 129000, state: "Příprava k prodeji", note: "čištění + STK" },
    { spz: "1NP 6612", model: "Hyundai Tucson", year: 2018, km: 141000, price: 289000, state: "Rezervace kupce", note: "záloha přijata" },
  ];
  const retentionCampaigns = [
    { name: "Návratoví klienti — e-mail sekvence", audience: "klienti 6–18 měsíců po odkupu", state: "Běží", kpi: "open rate 41 % · 22 smluv YTD" },
    { name: "Připomínka před koncem rezervace", audience: "aktivní případy 30 dní před koncem", state: "Běží", kpi: "SMS+e-mail · 93 % odkupů včas" },
    { name: "Reference & video příběhy", audience: "spokojení klienti po odkupu", state: "Příprava", kpi: "cíl: 10 videí do Q4" },
  ];

  // Odhadní hodnoty podle segmentu (CZK)
  const segmentBase = {
    "Malé / hatchback": 280000,
    "Střední třída / kombi": 420000,
    "SUV": 620000,
    "Rodinné MPV / van": 480000,
    "Prémiové / vyšší třída": 900000,
  };

  const brands = [
    { name: "Škoda", segment: "Střední třída / kombi" },
    { name: "Volkswagen", segment: "Střední třída / kombi" },
    { name: "Toyota", segment: "Střední třída / kombi" },
    { name: "Hyundai", segment: "Malé / hatchback" },
    { name: "Kia", segment: "SUV" },
    { name: "Ford", segment: "Střední třída / kombi" },
    { name: "Renault", segment: "Malé / hatchback" },
    { name: "Dacia", segment: "Malé / hatchback" },
    { name: "Mercedes-Benz", segment: "Prémiové / vyšší třída" },
    { name: "BMW", segment: "Prémiové / vyšší třída" },
    { name: "Audi", segment: "Prémiové / vyšší třída" },
    { name: "Seat", segment: "Malé / hatchback" },
  ];

  // B2B FAQ (podnikatelé a firmy) (model výkupu)
  const faqs = [
    { q: "Pro koho je služba určená?", a: "Výhradně pro podnikatele a firmy — OSVČ, živnostníky a společnosti s IČO, které vůz používají pro podnikání. Spotřebitelům službu neposkytujeme." },
    { q: "Musím mít IČO?", a: "Ano. Služba je určena podnikatelům — v žádosti uvádíte IČO (OSVČ nebo firmy) a u společností ověřujeme oprávnění jednat." },
    { q: "Mohu auto dál používat pro práci?", a: "Ano. Po výkupu je vlastníkem AutoKapitál a.s., vy jste provozovatel a vůz dál používáte pro podnikání podle smlouvy o užívání vozidla — zakázky, materiál, klienti." },
    { q: "Kdo bude vlastníkem vozidla?", a: "Po výkupu je vlastníkem AutoKapitál a.s. Vy zůstáváte provozovatelem a máte předem sjednanou možnost zpětného odkupu za podmínek uvedených ve smlouvě." },
    { q: "Jak funguje zpětný odkup?", a: "Cenu i podmínky zpětného odkupu máte uvedené ve smlouvě předem. Možnost odkupu si držíte úhradou měsíčního rezervačního poplatku a odkup zahájíte kdykoliv v klientské zóně." },
    { q: "Co je měsíční rezervační poplatek?", a: "Poplatek za rezervaci možnosti zpětného odkupu a správu smlouvy — 4 % z odhadní hodnoty vozu měsíčně. Přesnou částku v Kč vidíte vždy před podpisem a jde o daňově uznatelný provozní náklad (posuďte s účetním)." },
    { q: "Co když poplatek nezaplatím?", a: "Možnost zpětného odkupu je vázaná na řádnou úhradu poplatku. Okamžik, kdy právo na odkup zaniká, máte jasně uvedený ve smlouvě — ozvěte se nám prosím včas, hledáme řešení." },
    { q: "Kdo platí pojištění, servis a STK?", a: "Podmínky užívání (pojištění, servis, pokuty, škody, STK i případné limity nájezdu) jsou jasně uvedené ve smlouvě o užívání vozidla." },
    { q: "Je služba dostupná každému podnikateli?", a: "Ne. Vykupujeme jen vozidla, která projdou ověřením stavu a dokumentů, a každou žádost posuzujeme individuálně. Výkup neslibujeme všem." },
    { q: "Co když je auto v leasingu nebo úvěru?", a: "Uveďte to prosím hned na začátku — zatížení vozu posuzujeme individuálně; někdy řešení existuje, jindy ne." },
  ];

  // Délka rezervace zpětného odkupu
  const products = [
    { name: "1 měsíc", months: 1, tagline: "Krátká rezervace", use: "Když chcete vůz odkoupit zpět brzy.", highlight: false },
    { name: "3 měsíce", months: 3, tagline: "Nejoblíbenější", use: "Vyvážené řešení pro překlenutí období.", highlight: true },
    { name: "6 měsíců", months: 6, tagline: "Delší rezervace", use: "Více času na zpětný odkup.", highlight: false },
    { name: "12 měsíců", months: 12, tagline: "Nejdelší rezervace", use: "Maximální časový prostor.", highlight: false },
  ];

  // Ukázkový příklad výkupu (transparentní rozpad — v Kč)
  const exampleOffer = {
    marketValue: 300000,   // odhad hodnoty vozu
    vykup: 210000,         // výkupní nabídka
    fee: 12000,            // měsíční rezervační poplatek (4 % z hodnoty)
    fee3: 36000,           // poplatek za 3 měsíce
    buyback: 210000,       // cena zpětného odkupu
  };

  return {
    user, activeCase, vehicle, processSteps, payments, documents,
    pipeline, adminLeads, riskAlerts, adminVehicles, kpis,
    segmentBase, brands, products, faqs, exampleOffer,
    segments, typicalClient,
    reportMonths, channelReport, reportRows,
    aftersalesCases, buybackRequests, remarketingCars, retentionCampaigns,
  };
})();
