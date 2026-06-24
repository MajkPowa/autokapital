/* =========================================================================
   AutoKapitál — Mock data layer (B2C / spotřebitel)
   Exposes window.AK with all demo data. Read-only prototype content (CZ).
   Positioning: spotřebitelsky bezpečný fintech — dočasné uvolnění kapitálu z auta.
   ========================================================================= */
window.AK = (function () {
  "use strict";

  const user = {
    name: "Jan Novák",
    household: "Domácnost · Brno",
    initials: "JN",
    email: "jan.novak@email.cz",
    segment: "Běžná domácnost",
  };

  // Active client case (drives the client portal) — consumer credit, sale-&-use-back
  const activeCase = {
    id: "AK-2026-04812",
    product: "24 měsíců",
    status: "Aktivní",
    statusKind: "success",
    marketValue: 520000,     // odhad hodnoty vozu
    amount: 320000,          // získaná částka (výše úvěru)
    offer: 320000,           // alias (získaná částka)
    monthly: 14750,          // měsíční splátka
    rpsn: "9,9 %",
    rate: "8,7 % p.a.",
    termMonths: 24,
    totalPayable: 354000,    // celková částka k úhradě (24 × splátka)
    buyback: 320000,         // cena zpětného odkupu za předem známých podmínek
    offerValidUntil: "8. 7. 2026",
    payoutDate: "26. 3. 2026",
    nextPaymentDate: "26. 6. 2026",
    earlyBuybackAvailable: true,
    approvalProbability: 92,
  };

  const vehicle = {
    brand: "Škoda",
    model: "Octavia Combi 2.0 TDI",
    year: 2020,
    vin: "TMBJJ7NE0M0123456",
    spz: "5AK 4812",
    mileage: 96400,
    fuel: "Diesel",
    transmission: "Manuál",
    owners: 1,
    stk: "platná do 3/2027",
    insurance: "Povinné ručení, platné",
    role: "Vlastník: AutoKapitál a.s. · Provozovatel: Jan Novák",
    photos: 6,
    conditionScore: 84,
  };

  // Client process tracker (7 consumer steps)
  const processSteps = [
    { title: "Žádost přijata", meta: "18. 3. 2026", state: "done" },
    { title: "Orientační nabídka", meta: "18. 3. 2026", state: "done" },
    { title: "Ověření vozu a úvěruschopnosti", meta: "23. 3. 2026", state: "done" },
    { title: "Předsmluvní informace a podpis", meta: "25. 3. 2026", state: "done" },
    { title: "Výplata peněz", meta: "26. 3. 2026 · 320 000 Kč", state: "done" },
    { title: "Splácení · auto používáte dál", meta: "splátka 14 750 Kč / měsíc", state: "active" },
    { title: "Zpětný odkup", meta: "možný kdykoliv za předem známých podmínek", state: "todo" },
  ];

  // Client payments — monthly splátky
  const payments = [
    { date: "26. 4. 2026", label: "Splátka — duben", amount: 14750, state: "Uhrazeno" },
    { date: "26. 5. 2026", label: "Splátka — květen", amount: 14750, state: "Uhrazeno" },
    { date: "26. 6. 2026", label: "Splátka — červen", amount: 14750, state: "Splatné" },
    { date: "kdykoliv", label: "Předčasný zpětný odkup (volitelný)", amount: 320000, state: "Možné" },
  ];

  const documents = [
    { name: "Předsmluvní informace (formulář)", meta: "PDF · 24. 3. 2026", kind: "Informace", signed: false },
    { name: "Smlouva o financování", meta: "PDF · 25. 3. 2026", kind: "Smlouva", signed: true },
    { name: "Smlouva o užívání vozidla", meta: "PDF · 25. 3. 2026", kind: "Smlouva", signed: true },
    { name: "Smlouva o zpětném odkupu", meta: "PDF · 25. 3. 2026", kind: "Odkup", signed: true },
    { name: "Předávací protokol", meta: "PDF · 26. 3. 2026", kind: "Protokol", signed: true },
    { name: "Splátkový a odkupní kalendář", meta: "PDF · 26. 3. 2026", kind: "Přehled", signed: false },
  ];

  // ----- Admin data (private individuals, consumer credit) -----
  const pipeline = [
    { key: "lead", label: "Nový lead", items: [
      { id: "AK-5104", name: "Pavel Horák", car: "VW Passat B8", amount: 180000, ltv: 56, risk: "low" },
      { id: "AK-5103", name: "Marie Dvořáková", car: "Hyundai i30", amount: 120000, ltv: 58, risk: "low" },
    ]},
    { key: "incomplete", label: "Čeká na doklady / KYC", items: [
      { id: "AK-5098", name: "Jana Marešová", car: "Škoda Fabia", amount: 95000, ltv: 60, risk: "low" },
      { id: "AK-5095", name: "Tomáš Král", car: "Ford Focus", amount: 140000, ltv: 62, risk: "med" },
    ]},
    { key: "priced", label: "Předběžně oceněno", items: [
      { id: "AK-5089", name: "Lucie Procházková", car: "Kia Ceed", amount: 160000, ltv: 59, risk: "low" },
    ]},
    { key: "review", label: "Čeká na schválení", items: [
      { id: "AK-5081", name: "Petr Beneš", car: "VW Tiguan", amount: 290000, ltv: 61, risk: "med" },
      { id: "AK-5077", name: "Jan Novák", car: "Škoda Octavia", amount: 320000, ltv: 62, risk: "low" },
    ]},
    { key: "active", label: "Aktivní případ", items: [
      { id: "AK-4812", name: "Jan Novák", car: "Škoda Octavia", amount: 320000, ltv: 62, risk: "low" },
      { id: "AK-4790", name: "Eva Horáková", car: "Toyota Yaris", amount: 110000, ltv: 60, risk: "low" },
    ]},
    { key: "closed", label: "Splaceno / odkoupeno", items: [
      { id: "AK-4503", name: "Martin Veselý", car: "Renault Mégane", amount: 130000, ltv: 60, risk: "low" },
    ]},
  ];

  const adminLeads = [
    { id: "AK-5081", client: "Petr Beneš", city: "Praha", car: "VW Tiguan 2.0 TDI", market: 470000, offer: 290000, ltv: 61, product: "24 měsíců", clientScore: 79, vehicleScore: 82, risk: "med", stage: "Čeká na schválení" },
    { id: "AK-5077", client: "Jan Novák", city: "Brno", car: "Škoda Octavia Combi 2.0 TDI", market: 520000, offer: 320000, ltv: 62, product: "24 měsíců", clientScore: 84, vehicleScore: 84, risk: "low", stage: "Čeká na schválení" },
    { id: "AK-5089", client: "Lucie Procházková", city: "Ostrava", car: "Kia Ceed 1.5", market: 270000, offer: 160000, ltv: 59, product: "18 měsíců", clientScore: 81, vehicleScore: 80, risk: "low", stage: "Předběžně oceněno" },
    { id: "AK-5103", client: "Marie Dvořáková", city: "Plzeň", car: "Hyundai i30 1.6", market: 205000, offer: 120000, ltv: 58, product: "12 měsíců", clientScore: 76, vehicleScore: 78, risk: "low", stage: "Nový lead" },
  ];

  const riskAlerts = [
    { kind: "warning", title: "Posouzení úvěruschopnosti čeká na doklad příjmu", meta: "AK-5095 · Tomáš Král", action: "Vyžádat doklad" },
    { kind: "danger", title: "Splátka po splatnosti", meta: "AK-4655 · 3 dny · 7 200 Kč", action: "Spustit upomínku" },
    { kind: "warning", title: "Blíží se konec lhůty pro odkup", meta: "AK-4790 · Eva Horáková", action: "Kontaktovat klienta" },
    { kind: "info", title: "Nahrán nový doklad — čeká na ověření", meta: "AK-5089 · technický průkaz", action: "Ověřit dokument" },
    { kind: "danger", title: "Nesoulad vlastníka a žadatele", meta: "AK-5070 · nutná ruční kontrola", action: "Eskalovat" },
  ];

  const adminVehicles = [
    { spz: "5AK 4812", model: "Škoda Octavia", state: "Aktivní", stk: "3/2027", ins: "OK", caseId: "AK-4812" },
    { spz: "2BX 9920", model: "Toyota Yaris", state: "Aktivní", stk: "11/2026", ins: "OK", caseId: "AK-4790" },
    { spz: "7CD 1180", model: "Renault Mégane", state: "Odkoupeno zpět", stk: "5/2027", ins: "—", caseId: "AK-4503" },
    { spz: "3EF 4521", model: "VW Tiguan", state: "K prodeji", stk: "1/2026", ins: "Pozor", caseId: "AK-4399" },
  ];

  const kpis = [
    { label: "Aktivní případy", value: "126", delta: "+14", trend: "up" },
    { label: "Objem financování", value: "23,8 M Kč", delta: "+2,6 M", trend: "up" },
    { label: "Průměrné RPSN", value: "9,9 %", delta: "stabilní", trend: "flat" },
    { label: "Míra splacení / odkupu", value: "93 %", delta: "+2 pb", trend: "up" },
  ];

  // Vehicle valuation base values by segment (CZK, ~ new/recent)
  const segmentBase = {
    "Malé / hatchback": 380000,
    "Střední třída / kombi": 560000,
    "SUV": 760000,
    "Rodinné MPV / van": 620000,
    "Prémiové / vyšší třída": 1150000,
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

  // Consumer FAQ
  const faqs = [
    { q: "Mohu auto opravdu dál používat?", a: "Ano. Vozidlo můžete dál používat pro běžný život podle smluvních podmínek — jezdíte do práce, vozíte děti i na dovolenou. Po dobu financování je vlastníkem AutoKapitál a.s., vy jste provozovatel." },
    { q: "Kdo bude vlastníkem vozidla?", a: "Po dobu financování je vlastníkem AutoKapitál a.s. Vy zůstáváte provozovatelem a máte smluvně danou možnost vůz získat zpět za předem známých podmínek." },
    { q: "Jak funguje zpětný odkup?", a: "Cenu i podmínky zpětného odkupu znáte předem ze smlouvy. Odkup můžete zahájit kdykoliv v klientském portálu — předčasný odkup vás nijak nepenalizuje." },
    { q: "Kolik zaplatím celkem?", a: "Před podpisem vidíte kompletní reprezentativní příklad: získanou částku, dobu, úrokovou sazbu, RPSN, výši splátek i celkovou částku k úhradě. Žádné skryté poplatky." },
    { q: "Co když chci auto odkoupit dříve?", a: "Předčasný odkup je možný kdykoliv a bez sankcí. V portálu uvidíte aktuální cenu odkupu k danému dni." },
    { q: "Co když nestihnu termín splátky?", a: "Ozvěte se nám co nejdříve — termíny hlídá portál a upozorní vás předem. Společně hledáme řešení; podmínky případného prodlení jsou jasně uvedené ve smlouvě." },
    { q: "Je nutné doložit příjem?", a: "U spotřebitelského financování ano. Provádíme posouzení úvěruschopnosti podle pravidel, abychom nabídli jen to, co zvládnete bez problémů splácet." },
    { q: "Proč probíhá posouzení?", a: "Posouzení úvěruschopnosti je zákonná povinnost i ochrana pro vás — ověřuje, že splátky odpovídají vaší situaci. Chrání vás před nadměrným zadlužením." },
    { q: "Je služba dostupná pro každého?", a: "Ne. Nabídka závisí na posouzení vozidla i vaší úvěruschopnosti. Neslibujeme schválení všem a vědomě neoslovujeme rizikové či zranitelné skupiny." },
    { q: "Co když je auto v leasingu nebo úvěru?", a: "Řekněte nám to hned na začátku. Vozidlo zatížené leasingem, úvěrem nebo zástavou posuzujeme individuálně — v některých případech řešení existuje, v jiných ne." },
  ];

  // Consumer products (durations)
  const products = [
    { name: "12 měsíců", months: 12, tagline: "Krátké období", use: "Rychlé překlenutí a nižší celkový náklad.", highlight: false },
    { name: "24 měsíců", months: 24, tagline: "Nejoblíbenější", use: "Vyvážená výše splátky pro běžnou domácnost.", highlight: true },
    { name: "36 měsíců", months: 36, tagline: "Nižší splátka", use: "Delší doba a nižší měsíční splátka.", highlight: false },
  ];

  // Reprezentativní příklad (povinné údaje u spotřebitelského úvěru s číselným údajem)
  const representativeExample = {
    amount: 200000,            // celková výše úvěru
    termMonths: 24,            // doba trvání
    rate: "8,7 % p.a.",        // pevná úroková sazba
    rpsn: "9,9 %",             // RPSN
    monthly: 9200,             // výše měsíční splátky
    totalPayable: 220800,      // celková částka splatná spotřebitelem
  };

  return {
    user, activeCase, vehicle, processSteps, payments, documents,
    pipeline, adminLeads, riskAlerts, adminVehicles, kpis,
    segmentBase, brands, products, faqs, representativeExample,
  };
})();
