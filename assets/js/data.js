/* =========================================================================
   AutoKapitál — Mock data layer
   Exposes window.AK with all demo data. Read-only prototype content (CZ).
   ========================================================================= */
window.AK = (function () {
  "use strict";

  const user = {
    name: "Martin Dvořák",
    company: "Dvořák Stavby s.r.o.",
    ico: "287 41 559",
    initials: "MD",
    email: "martin@dvorakstavby.cz",
    segment: "Malá firma",
  };

  // Active client case (drives the client portal)
  const activeCase = {
    id: "AK-2026-04812",
    product: "Flex 90",
    status: "Aktivní užívání",
    statusKind: "success",
    marketValue: 520000,
    offer: 320000,           // výkupní cena vyplacená klientovi
    buyback: 320000,         // cena zpětného odkupu = výkupní cena (za stejnou částku)
    monthlyFee: 6900,        // měsíční užívací poplatek
    totalFees: 20700,        // celkový náklad za 90 dní (3 × užívací poplatek)
    termDays: 90,
    offerValidUntil: "8. 7. 2026",
    payoutDate: "26. 3. 2026",
    buybackDate: "24. 6. 2026",
    earlyBuybackAvailable: true,
    daysRemaining: 0,
    approvalProbability: 92,
  };

  const vehicle = {
    brand: "Škoda",
    model: "Superb 2.0 TDI Style",
    year: 2021,
    vin: "TMBJJ7NE0M0123456",
    spz: "5AK 4812",
    mileage: 78400,
    fuel: "Diesel",
    transmission: "Automat (DSG)",
    owners: 1,
    stk: "platná do 3/2027",
    insurance: "Povinné + havarijní, platné",
    role: "Vlastník: AutoKapitál a.s. · Provozovatel: Dvořák Stavby s.r.o.",
    photos: 6,
    conditionScore: 86,
  };

  // Client process tracker
  const processSteps = [
    { title: "Žádost přijata", meta: "18. 3. 2026", state: "done" },
    { title: "Nacenění vozu", meta: "19. 3. 2026", state: "done" },
    { title: "Kontrola vozu a dokumentů", meta: "23. 3. 2026", state: "done" },
    { title: "Podpis smluv", meta: "25. 3. 2026", state: "done" },
    { title: "Převod a výplata", meta: "26. 3. 2026 · 320 000 Kč", state: "done" },
    { title: "Aktivní užívání", meta: "vůz dál používáte", state: "active" },
    { title: "Zpětný odkup", meta: "možný kdykoliv · do 24. 6. 2026", state: "todo" },
  ];

  // Client payments
  const payments = [
    { date: "26. 4. 2026", label: "Užívací poplatek — duben", amount: 6900, state: "Uhrazeno" },
    { date: "26. 5. 2026", label: "Užívací poplatek — květen", amount: 6900, state: "Uhrazeno" },
    { date: "26. 6. 2026", label: "Užívací poplatek — červen", amount: 6900, state: "Splatné" },
    { date: "24. 6. 2026", label: "Zpětný odkup (volitelný)", amount: 320000, state: "Naplánováno" },
  ];

  const documents = [
    { name: "Kupní smlouva", meta: "PDF · 25. 3. 2026", kind: "Smlouva", signed: true },
    { name: "Smlouva o užívání vozidla", meta: "PDF · 25. 3. 2026", kind: "Smlouva", signed: true },
    { name: "Smlouva o budoucím zpětném odkupu", meta: "PDF · 25. 3. 2026", kind: "Opce", signed: true },
    { name: "Předávací protokol", meta: "PDF · 26. 3. 2026", kind: "Protokol", signed: true },
    { name: "Potvrzení o výplatě", meta: "PDF · 26. 3. 2026", kind: "Platba", signed: false },
    { name: "Splátkový a odkupní kalendář", meta: "PDF · 26. 3. 2026", kind: "Přehled", signed: false },
  ];

  // ----- Admin data -----
  const pipeline = [
    { key: "lead", label: "Nový lead", items: [
      { id: "AK-5104", name: "Pavel Horák — OSVČ", car: "VW Passat B8", amount: 240000, ltv: 58, risk: "low" },
      { id: "AK-5103", name: "TruckLine s.r.o.", car: "MAN TGX", amount: 880000, ltv: 61, risk: "med" },
    ]},
    { key: "incomplete", label: "Čeká na fotky / KYC", items: [
      { id: "AK-5098", name: "Jana Marešová — OSVČ", car: "Škoda Kodiaq", amount: 310000, ltv: 60, risk: "low" },
      { id: "AK-5095", name: "Servis Brno s.r.o.", car: "Ford Transit", amount: 190000, ltv: 64, risk: "med" },
    ]},
    { key: "priced", label: "Předběžně oceněno", items: [
      { id: "AK-5089", name: "Elektro Novák", car: "Mercedes Vito", amount: 420000, ltv: 59, risk: "low" },
    ]},
    { key: "review", label: "Čeká na schválení", items: [
      { id: "AK-5081", name: "Dřevo Group s.r.o.", car: "BMW X5", amount: 690000, ltv: 62, risk: "med" },
      { id: "AK-5077", name: "Martin Dvořák", car: "Škoda Superb", amount: 320000, ltv: 61, risk: "low" },
    ]},
    { key: "active", label: "Aktivní případ", items: [
      { id: "AK-4812", name: "Dvořák Stavby s.r.o.", car: "Škoda Superb", amount: 320000, ltv: 61, risk: "low" },
      { id: "AK-4790", name: "AutoDoprava Klíma", car: "Iveco Daily", amount: 260000, ltv: 63, risk: "med" },
    ]},
    { key: "closed", label: "Zpětně odkoupeno", items: [
      { id: "AK-4503", name: "Zedník & syn", car: "Toyota Hilux", amount: 280000, ltv: 60, risk: "low" },
    ]},
  ];

  const adminLeads = [
    { id: "AK-5081", company: "Dřevo Group s.r.o.", ico: "094 22 117", car: "BMW X5 xDrive30d", market: 1110000, offer: 690000, ltv: 62, product: "Business 180", clientScore: 78, vehicleScore: 81, risk: "med", stage: "Čeká na schválení" },
    { id: "AK-5077", company: "Martin Dvořák (OSVČ)", ico: "765 22 901", car: "Škoda Superb 2.0 TDI", market: 520000, offer: 320000, ltv: 61, product: "Flex 90", clientScore: 84, vehicleScore: 86, risk: "low", stage: "Čeká na schválení" },
    { id: "AK-5089", company: "Elektro Novák", ico: "281 90 334", car: "Mercedes Vito 119", market: 700000, offer: 420000, ltv: 59, product: "Flex 90", clientScore: 80, vehicleScore: 83, risk: "low", stage: "Předběžně oceněno" },
    { id: "AK-5103", company: "TruckLine s.r.o.", ico: "067 55 210", car: "MAN TGX 18.480", market: 1450000, offer: 880000, ltv: 61, product: "Business 180", clientScore: 71, vehicleScore: 74, risk: "med", stage: "Nový lead" },
  ];

  const riskAlerts = [
    { kind: "warning", title: "Konec opční lhůty za 7 dní", meta: "AK-4790 · AutoDoprava Klíma", action: "Kontaktovat klienta" },
    { kind: "danger", title: "Platba po splatnosti", meta: "AK-4655 · 3 dny · 7 200 Kč", action: "Spustit upomínku" },
    { kind: "warning", title: "Blíží se konec STK", meta: "AK-4812 · vozidlo 5AK 4812 · 3/2027", action: "Pouze evidence" },
    { kind: "info", title: "Nahrán nový doklad — čeká na ověření", meta: "AK-5089 · technický průkaz", action: "Ověřit dokument" },
    { kind: "danger", title: "Nesoulad vlastníka a žadatele", meta: "AK-5070 · nutná ruční kontrola", action: "Eskalovat" },
  ];

  const adminVehicles = [
    { spz: "5AK 4812", model: "Škoda Superb", state: "Aktivní", stk: "3/2027", ins: "OK", caseId: "AK-4812" },
    { spz: "2BX 9920", model: "Iveco Daily", state: "Aktivní", stk: "11/2026", ins: "OK", caseId: "AK-4790" },
    { spz: "7CD 1180", model: "Toyota Hilux", state: "Odkoupeno zpět", stk: "5/2027", ins: "—", caseId: "AK-4503" },
    { spz: "3EF 4521", model: "BMW X5", state: "K prodeji", stk: "1/2026", ins: "Pozor", caseId: "AK-4399" },
  ];

  // KPIs for admin dashboard
  const kpis = [
    { label: "Aktivní případy", value: "38", delta: "+6", trend: "up" },
    { label: "Objem financování", value: "14,2 M Kč", delta: "+1,8 M", trend: "up" },
    { label: "Průměrné LTV", value: "61 %", delta: "stabilní", trend: "flat" },
    { label: "Míra zpětného odkupu", value: "94 %", delta: "+2 pb", trend: "up" },
  ];

  // Vehicle valuation base values by segment (CZK, ~ new/recent)
  const segmentBase = {
    "Malé / hatchback": 480000,
    "Střední třída / kombi": 720000,
    "SUV": 980000,
    "Dodávka / užitkové": 850000,
    "Prémiové / vyšší třída": 1450000,
  };

  // Brands grouped to segment (for the calculator dropdown)
  const brands = [
    { name: "Škoda", segment: "Střední třída / kombi" },
    { name: "Volkswagen", segment: "Střední třída / kombi" },
    { name: "Toyota", segment: "Střední třída / kombi" },
    { name: "Hyundai", segment: "Malé / hatchback" },
    { name: "Ford", segment: "Dodávka / užitkové" },
    { name: "Mercedes-Benz", segment: "Prémiové / vyšší třída" },
    { name: "BMW", segment: "Prémiové / vyšší třída" },
    { name: "Audi", segment: "Prémiové / vyšší třída" },
    { name: "Kia", segment: "SUV" },
    { name: "Renault", segment: "Malé / hatchback" },
    { name: "Iveco", segment: "Dodávka / užitkové" },
    { name: "MAN", segment: "Dodávka / užitkové" },
  ];

  const faqs = [
    { q: "Mohu auto dál používat?", a: "Ano. Vozidlo zůstává ve vašem provozu jako u provozovatele — používáte ho dál pro práci i běžně. Vlastníkem se po dobu financování stává AutoKapitál a.s." },
    { q: "Co potřebuji doložit?", a: "Doklady k vozidlu (velký technický průkaz), fotky vozu a údaje o firmě (IČO). U podnikatelů ověřujeme oprávnění jednat za firmu v rámci KYC/AML procesu." },
    { q: "Jak rychle dostanu peníze?", a: "Orientační nabídku máte do 2 minut online. Po ověření vozu, dokumentů a podpisu smluv odesíláme peníze zpravidla do 24 hodin na váš účet." },
    { q: "Co když chci splatit dříve?", a: "Zpětný odkup můžete zahájit kdykoliv přímo v klientském portálu. Cenu zpětného odkupu znáte předem a předčasný odkup vás nijak nepenalizuje." },
    { q: "Máte skryté poplatky?", a: "Ne. Před podpisem vidíte kompletní podmínky — výkupní cenu, měsíční poplatek, celkový náklad i cenu zpětného odkupu. Žádné překvapení na konci." },
    { q: "Je nutné havarijní pojištění?", a: "Vozidlo musí být po dobu financování řádně pojištěné (povinné ručení, u dražších vozů i havarijní). Termíny pojištění a STK hlídá za vás systém." },
  ];

  const products = [
    { name: "Express 30", days: 30, tagline: "Krátké překlenutí cashflow", use: "Faktury po splatnosti, nákup materiálu, krátkodobé výpadky.", feeRate: 0.026, highlight: false },
    { name: "Flex 90", days: 90, tagline: "Hlavní produkt", use: "Provoz firmy s možností prodloužení po kontrole.", feeRate: 0.0215, highlight: true },
    { name: "Business 180", days: 180, tagline: "Pro firmy a flotily", use: "Delší překlenovací období, práce s více vozy.", feeRate: 0.0195, highlight: false },
  ];

  return {
    user, activeCase, vehicle, processSteps, payments, documents,
    pipeline, adminLeads, riskAlerts, adminVehicles, kpis,
    segmentBase, brands, products, faqs,
  };
})();
