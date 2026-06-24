/* =========================================================================
   AutoKapitál — Mock data layer (B2C · dočasný výkup vozu se zpětným odkupem)
   Exposes window.AK with demo data (CZ). NENÍ úvěr — výkupní cena + měsíční
   rezervační poplatek (4 % z hodnoty vozu) + cena zpětného odkupu.
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
    role: "Vlastník: AutoKapitál a.s. · Provozovatel: Jan Novák",
    photos: 6,
    conditionScore: 82,
  };

  // Client process tracker (7 kroků výkupu)
  const processSteps = [
    { title: "Žádost přijata", meta: "18. 3. 2026", state: "done" },
    { title: "Orientační výkupní nabídka", meta: "18. 3. 2026", state: "done" },
    { title: "Ověření vozu a dokumentů", meta: "23. 3. 2026", state: "done" },
    { title: "Podpis smluv", meta: "25. 3. 2026 · kupní · užívání · zpětný odkup", state: "done" },
    { title: "Výplata výkupní ceny", meta: "26. 3. 2026 · 210 000 Kč", state: "done" },
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
    { name: "Informační dokument pro spotřebitele", meta: "PDF · 24. 3. 2026", kind: "Informace", signed: false },
  ];

  // ----- Admin data (soukromé osoby, model výkupu) -----
  const pipeline = [
    { key: "lead", label: "Nový lead", items: [
      { id: "AK-5104", name: "Pavel Horák", car: "VW Passat B8", vykup: 175000, fee: 10000, risk: "low" },
      { id: "AK-5103", name: "Marie Dvořáková", car: "Hyundai i30", vykup: 119000, fee: 6800, risk: "low" },
    ]},
    { key: "incomplete", label: "Čeká na doklady / KYC", items: [
      { id: "AK-5098", name: "Jana Marešová", car: "Škoda Fabia", vykup: 91000, fee: 5200, risk: "low" },
      { id: "AK-5095", name: "Tomáš Král", car: "Ford Focus", vykup: 133000, fee: 7600, risk: "med" },
    ]},
    { key: "priced", label: "Předběžně oceněno", items: [
      { id: "AK-5089", name: "Lucie Procházková", car: "Kia Ceed", vykup: 154000, fee: 8800, risk: "low" },
    ]},
    { key: "review", label: "Čeká na schválení výkupu", items: [
      { id: "AK-5081", name: "Petr Beneš", car: "VW Tiguan", vykup: 280000, fee: 16000, risk: "med" },
      { id: "AK-5077", name: "Jan Novák", car: "Škoda Octavia", vykup: 210000, fee: 12000, risk: "low" },
    ]},
    { key: "active", label: "Aktivní případ", items: [
      { id: "AK-4812", name: "Jan Novák", car: "Škoda Octavia", vykup: 210000, fee: 12000, risk: "low" },
      { id: "AK-4790", name: "Eva Horáková", car: "Toyota Yaris", vykup: 105000, fee: 6000, risk: "low" },
    ]},
    { key: "closed", label: "Zpětně odkoupeno", items: [
      { id: "AK-4503", name: "Martin Veselý", car: "Renault Mégane", vykup: 126000, fee: 7200, risk: "low" },
    ]},
  ];

  const adminLeads = [
    { id: "AK-5081", client: "Petr Beneš", city: "Praha", car: "VW Tiguan 2.0 TDI", market: 400000, vykup: 280000, fee: 16000, product: "3 měsíce", vehicleScore: 82, risk: "med", stage: "Čeká na schválení" },
    { id: "AK-5077", client: "Jan Novák", city: "Brno", car: "Škoda Octavia Combi 1.6 TDI", market: 300000, vykup: 210000, fee: 12000, product: "3 měsíce", vehicleScore: 84, risk: "low", stage: "Čeká na schválení" },
    { id: "AK-5089", client: "Lucie Procházková", city: "Ostrava", car: "Kia Ceed 1.5", market: 220000, vykup: 154000, fee: 8800, product: "6 měsíců", vehicleScore: 80, risk: "low", stage: "Předběžně oceněno" },
    { id: "AK-5103", client: "Marie Dvořáková", city: "Plzeň", car: "Hyundai i30 1.6", market: 170000, vykup: 119000, fee: 6800, product: "1 měsíc", vehicleScore: 78, risk: "low", stage: "Nový lead" },
  ];

  const riskAlerts = [
    { kind: "warning", title: "Chybí doklad o vlastnictví vozidla", meta: "AK-5095 · Tomáš Král", action: "Vyžádat doklad" },
    { kind: "danger", title: "Rezervační poplatek po splatnosti", meta: "AK-4655 · 3 dny · 7 200 Kč", action: "Spustit upomínku" },
    { kind: "warning", title: "Blíží se konec lhůty pro zpětný odkup", meta: "AK-4790 · Eva Horáková", action: "Kontaktovat klienta" },
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

  // Consumer FAQ (model výkupu)
  const faqs = [
    { q: "Mohu auto opravdu dál používat?", a: "Ano. Po výkupu je vlastníkem AutoKapitál a.s., vy jste provozovatel a vůz můžete dál užívat pro běžný život podle smlouvy o užívání vozidla." },
    { q: "Kdo bude vlastníkem vozidla?", a: "Po výkupu je vlastníkem AutoKapitál a.s. Vy zůstáváte provozovatelem a máte předem sjednanou možnost zpětného odkupu za podmínek uvedených ve smlouvě." },
    { q: "Jak funguje zpětný odkup?", a: "Cenu i podmínky zpětného odkupu máte uvedené ve smlouvě předem. Možnost odkupu si držíte úhradou měsíčního rezervačního poplatku a odkup zahájíte kdykoliv v klientské zóně." },
    { q: "Co je měsíční rezervační poplatek?", a: "Poplatek za rezervaci možnosti zpětného odkupu a správu smlouvy — 4 % z odhadní hodnoty vozu měsíčně. Přesnou částku v Kč vidíte vždy před podpisem." },
    { q: "Kolik celkem zaplatím?", a: "Před podpisem vidíte výkupní cenu, měsíční rezervační poplatek v Kč, poplatek za 1, 3, 6 i 12 měsíců a cenu zpětného odkupu. Žádné skryté kroky." },
    { q: "Co když poplatek nezaplatím?", a: "Možnost zpětného odkupu je vázaná na řádnou úhradu rezervačního poplatku. Okamžik, kdy právo na odkup zaniká, máte jasně uvedený ve smlouvě — ozvěte se nám prosím včas." },
    { q: "Kdo platí pojištění, servis, STK a pokuty?", a: "Podmínky užívání (pojištění, servis, pokuty, škody, STK i případné limity nájezdu) jsou jasně uvedené ve smlouvě o užívání vozidla." },
    { q: "Můžu auto odkoupit dříve?", a: "Ano, kdykoliv. Cenu zpětného odkupu znáte předem a předčasný odkup vás nijak nepenalizuje." },
    { q: "Je služba dostupná pro každého?", a: "Ne. Vykupujeme jen vozidla, která projdou ověřením stavu a dokumentů. Neslibujeme přijetí všem a vědomě neoslovujeme zranitelné skupiny." },
    { q: "Co když je auto v leasingu nebo úvěru?", a: "Řekněte nám to hned na začátku. Vozidlo zatížené leasingem, úvěrem nebo zástavou posuzujeme individuálně — někdy řešení existuje, jindy ne." },
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
  };
})();
