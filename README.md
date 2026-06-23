# AutoKapitál — prototyp produktu

> **Uvolněte kapitál z vozu. Jezdit můžete dál.**
> Moderní, férové provozní financování proti hodnotě vozu pro podnikatele a firmy.

Klikací webový prototyp produktu typu **„dočasný výkup vozu se zpětným odkupem"** (sale & use-back):
klient dočasně prodá vozidlo, dál ho používá jako provozovatel a má předem známou možnost odkoupit ho zpět.

## Co prototyp obsahuje

### Fáze 1 — MVP
- **Landing page** (`index.html`) — hero, orientační kalkulačka, jak to funguje, produkty, pro koho, trust box
- **Žádost & kalkulačka** (`zadost.html`) — 4krokový průvodce s orientační nabídkou a transparentním celkovým nákladem
- **Klientský portál** (`portal.html`) — nabídka, vozidlo, stav procesu, platby, dokumenty, podpora
- **Admin systém** (`admin.html`) — lead pipeline, scoring vozidla i klienta, žádosti, vozidla, platby, rizikové centrum, dokumenty
- **Férovost & compliance** (`compliance.html`) — právní konstrukce, regulatorní mantinel, transparentnost

### Fáze 2 — Roadmapa
- **Roadmapa & Fáze 2** (`faze2.html`) — auto-oceňování, externí registry, risk engine, párování plateb, e-podpis, partnerská síť, remarketing, mobilní aplikace
- **Prezentace projektu** (`prezentace.html`) — obchodní/investiční prezentace ve 12 sekcích

## Technologie
Statický web — HTML5 + CSS (design systém v `assets/css/design-system.css`) + vanilla JS
(`assets/js/data.js`, `shell.js`, `app.js`). Bez build kroku.

## Lokální spuštění
```bash
npx serve .
```
Pak otevřete `http://localhost:3000`.

## Compliance-first
Komunikace je úmyslně vedena jako B2B provozní financování, ne jako rychlopůjčka.
Vyhýbáme se zavádějícím frázím; cenu zpětného odkupu i celkový náklad klient zná předem.

---
*Demoprezentace. Nejedná se o závaznou nabídku ani o právní poradenství.*
