# CashAuto — prototyp produktu (dříve AutoKapitál)

> **Peníze z auta. Jezdíte dál.**
> Rychle. Férově. Přehledně. · **Výhradně pro podnikatele a firmy (IČO)**

Klikací webový prototyp služby **„dočasný výkup vozu se zpětným odkupem"** pro podnikatele:
vůz od OSVČ nebo firmy dočasně **vykoupíme**, podnikatel ho **dál používá pro podnikání** jako
provozovatel podle smlouvy a má **předem sjednanou možnost zpětného odkupu**. Za rezervaci této
možnosti a správu smlouvy platí **měsíční rezervační poplatek** (4 % z odhadní hodnoty vozu).
**Není to úvěr ani půjčka** — žádné RPSN, úroky ani splátky; vše je v Kč a předem.
**Spotřebitelům se služba neposkytuje** (podnikatelský účel = mimo režim zákona o spotřebitelském úvěru).

## Živě
**https://cashauto.cz** (custom doména) · záloha: https://majkpowa.github.io/autokapital/

## Ekonomika (ukázka)
| Položka | Ukázka |
| --- | --- |
| Odhad hodnoty vozu | 300 000 Kč |
| Výkupní nabídka (vyplatíme) | 210 000 Kč |
| Měsíční rezervační poplatek | 12 000 Kč (4 %) |
| Poplatek za 3 měsíce | 36 000 Kč |
| Cena zpětného odkupu | 210 000 Kč |
| Auto používáte dál pro podnikání | ano, podle smlouvy |

## Co prototyp obsahuje

### Fáze 1 — MVP
- **Landing** (`index.html`) — hero s B2B kvalifikací, výhody, 7 kroků CRM, pro koho (OSVČ/řemeslníci/firmy/dopravci), výkupní kalkulačka s varováním o ceně, klientská zóna, FAQ, CTA
- **Žádost** (`zadost.html`) — kvalifikační brána „Podnikáte na IČO?", reverzní lead-gate (nabídka před kontaktem), povinné IČO s ověřením v ARES
- **Klientská zóna** (`portal.html`) — moje žádost, auto, rezervační poplatky, dokumenty, podpora
- **Admin** (`admin.html`) — 7fázová CRM pipeline, měsíční channel report (Plan/Real, ME koef.), vozidlová segmentace s pricing, scoring, rizika, compliance checklist (17 kroků)
- **Aftersales portál** (`aftersales.html`) — smlouvy, poplatky & upomínky (podpora před vymáháním), zpětné odkupy, remarketing, retention
- **Férovost & compliance** (`compliance.html`) — B2B pojistka, výhrada zpětné koupě, smluvní balík, dobrovolně držená spotřebitelská pravidla (CCD2), povinné informace

### Fáze 2 — Roadmapa
- **Roadmapa** (`faze2.html`) — auto-oceňování, registry/ARES, risk engine, e-podpis, partnerská síť, mobilní app; Fáze 4 = fleet & flotily
- **Prezentace projektu** (`prezentace.html`)

## Technologie
Statický web — HTML5 + CSS (`assets/css/design-system.css`, zelený brand #007A52) + vanilla JS
(`assets/js/data.js`, `shell.js`, `app.js`). Bez build kroku. Fotky v `assets/img/`, zdrojové podklady v `Public/`.

## Lokální spuštění
```bash
npx serve .
```

---
*Demoprezentace. Nejedná se o závaznou nabídku ani o právní poradenství. Ukázková data.*
