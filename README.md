# AutoKapitál — prototyp produktu

> **Peníze z hodnoty auta. Auto můžete dál používat.**
> Rychle. Férově. Bez starostí.

Klikací webový prototyp služby **„dočasný výkup vozu se zpětným odkupem"** pro běžné domácnosti:
vůz od klienta dočasně **vykoupíme**, klient ho **dál používá** jako provozovatel podle smlouvy a má
**předem sjednanou možnost zpětného odkupu**. Za rezervaci této možnosti a správu smlouvy platí
**měsíční rezervační poplatek** (4 % z odhadní hodnoty vozu). **Není to úvěr ani půjčka** — žádné RPSN,
úroky ani splátky; vše je v Kč a předem.

## Cílová skupina
Běžné domácnosti a řidiči (segmenty **C1–C3**), 35–55 let. **Není** to B2B/cashflow nástroj.
Zranitelné skupiny (segment E) vědomě neoslovujeme.

## Ekonomika (ukázka)
| Položka | Ukázka |
| --- | --- |
| Odhad hodnoty vozu | 300 000 Kč |
| Výkupní nabídka (vyplatíme) | 210 000 Kč |
| Měsíční rezervační poplatek | 12 000 Kč (4 %) |
| Poplatek za 3 měsíce | 36 000 Kč |
| Cena zpětného odkupu | 210 000 Kč |
| Auto používáte dál | ano, podle smlouvy |

## Co prototyp obsahuje

### Fáze 1 — MVP
- **Landing** (`index.html`) — hero, výhody, jak to funguje (7 kroků), pro koho, výkupní kalkulačka, proč AutoKapitál, klientská zóna, FAQ, CTA
- **Žádost & kalkulačka** (`zadost.html`) — průvodce s ověřením vozu a orientační výkupní nabídkou
- **Klientská zóna** (`portal.html`) — moje žádost, auto, rezervační poplatky, dokumenty, podpora
- **Admin systém** (`admin.html`) — pipeline, scoring vozidla, ověření, vozidla, platby, rizika, dokumenty a **compliance checklist** (11 kroků)
- **Férovost & compliance** (`compliance.html`) — výhrada zpětné koupě, smluvní balík, regulatorní opatrnost (riziko překvalifikace na spotřebitelský úvěr → právní posouzení), AML/KYC

### Fáze 2 — Roadmapa
- **Roadmapa & Fáze 2** (`faze2.html`) a **Prezentace projektu** (`prezentace.html`) se segmentací C1–C3

## Technologie
Statický web — HTML5 + CSS (`assets/css/design-system.css`, zelený brand) + vanilla JS
(`assets/js/data.js`, `shell.js`, `app.js`). Bez build kroku. Assety v `Public/` a `assets/img/`.

## Lokální spuštění
```bash
npx serve .
```

## Pojmenování — na co si dáváme pozor
Komunikujeme **výkup s možností zpětného odkupu** a **rezervační poplatek**, nikoliv „úvěr", „půjčka"
ani „zástava". Vyhýbáme se zavádějícím frázím („bez registru", „schválíme každého"…). Protože regulátor
posuzuje **ekonomický obsah**, ne jen název smlouvy, je před spuštěním nutné právní posouzení.

---
*Demoprezentace. Nejedná se o závaznou nabídku ani o právní poradenství.*
