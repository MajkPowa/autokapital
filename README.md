# AutoKapitál — prototyp produktu

> **Peníze z auta. Auto používáte dál.**
> Rychle. Férově. Bez starostí.

Klikací webový prototyp spotřebitelsky bezpečného fintech produktu typu **„dočasný výkup vozu se zpětným odkupem"**:
běžný člověk získá rychle peníze z hodnoty svého auta, vůz dál používá pro běžný život a má smluvně danou
možnost odkoupit ho zpět za předem známých podmínek.

Produkt je stavěný a prezentovaný jako **spotřebitelský úvěr** — s posouzením úvěruschopnosti,
předsmluvními informacemi a reprezentativním příkladem všude, kde se objeví číselný údaj o nákladech.

## Cílová skupina
Běžné domácnosti a řidiči (segmenty **C1–C3**), 35–55 let — jezdí do práce, vozí děti, řeší nečekané výdaje
a nechtějí auto prodat natrvalo. **Není** to B2B / cashflow nástroj pro firmy. Zranitelné skupiny (segment E) vědomě neoslovujeme.

## Co prototyp obsahuje

### Fáze 1 — MVP
- **Landing** (`index.html`) — hero, výhody, jak to funguje (7 kroků), pro koho, kalkulačka s reprezentativním příkladem, proč AutoKapitál, náhled portálu, FAQ, CTA
- **Žádost & kalkulačka** (`zadost.html`) — průvodce s posouzením úvěruschopnosti a orientační nabídkou (splátka, RPSN, celková částka, cena zpětného odkupu)
- **Klientský portál** (`portal.html`) — osobní zóna: moje žádost, auto, platby, dokumenty, podpora
- **Admin systém** (`admin.html`) — pipeline, scoring vozidla i úvěruschopnosti, vozidla, platby, rizika, dokumenty a **compliance checklist** (11 kroků)
- **Férovost & compliance** (`compliance.html`) — spotřebitelský úvěr, posouzení úvěruschopnosti, předsmluvní informace, AML/KYC, „co v reklamě nikdy nepoužíváme"

### Fáze 2 — Roadmapa
- **Roadmapa & Fáze 2** (`faze2.html`) — automatické oceňování, externí registry, risk engine, párování plateb, e-podpis, partnerská síť, remarketing, mobilní aplikace
- **Prezentace projektu** (`prezentace.html`) — prezentace ve 12 sekcích se segmentací C1–C3

## Technologie
Statický web — HTML5 + CSS (`assets/css/design-system.css`, zelený brand) + vanilla JS
(`assets/js/data.js`, `shell.js`, `app.js`). Bez build kroku. Assety v `Public/` a `assets/img/`.

## Lokální spuštění
```bash
npx serve .
```

## Compliance-first
Komunikace je vedena férově a nepredátorsky. Vyhýbáme se zavádějícím frázím (např. „bez registru",
„bez doložení příjmů", „schválíme každému") a cenu, RPSN, celkový náklad i cenu zpětného odkupu klient zná předem.

---
*Demoprezentace. Nejedná se o závaznou nabídku ani o právní poradenství.*
