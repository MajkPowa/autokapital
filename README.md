# CashAuto — prototyp produktu (dříve AutoKapitál)

> **Peníze z auta. Jezdíte dál.**
> Rychle. Férově. Přehledně. · **Výhradně pro podnikatele a firmy (IČO)**

Klikací webový prototyp služby **„dočasný výkup vozu se zpětným odkupem"** pro podnikatele:
vůz, stroj nebo tahač od OSVČ či firmy dočasně **vykoupíme**, podnikatel ho **dál používá pro podnikání**
jako provozovatel podle smlouvy a má **předem sjednanou možnost zpětného odkupu**. Za rezervaci této
možnosti a správu smlouvy platí **měsíční rezervační poplatek**. **Není to úvěr ani půjčka** — žádné RPSN,
úroky ani splátky; vše je v Kč a předem. **Spotřebitelům se služba neposkytuje.**

## Živě
**https://cashauto.cz** (custom doména, HTTPS) · záloha: https://majkpowa.github.io/autokapital/

## Tři produktové řady
| Řada | Stránka | Pro koho | Orientační sazby (prototyp) |
| --- | --- | --- | --- |
| **CashAuto** | `index.html` | OSVČ, řemeslníci, malé firmy — firemní vozy | výkup 70 % odhadní hodnoty · poplatek 4 %/měs |
| **AgroCash** | `agrocash.html` | farmy a agro-podniky — traktory, kombajny, manipulátory | výkup 65 % · poplatek 3 %/měs |
| **TechCash** | `techcash.html` | autodopravci — tahače, návěsy, nákladní vozy | výkup 65 % · poplatek 3,5 %/měs |

Sazby, rozsahy kalkulaček a typy strojů jsou v `assets/js/data.js` (`AK.verticals`) — jsou to konfigurační
předpoklady prototypu, ne závazná nabídka. Ukázka: vůz 300 000 Kč → výkup 210 000 Kč → poplatek 12 000 Kč/měs
(36 000 Kč za 3 měsíce) → cena zpětného odkupu 210 000 Kč.

## Co prototyp obsahuje
- **Landing pages** — `index.html` (výběr řady, 3 + 7 kroků, srovnání „prodat / čekat / dočasný výkup", kalkulačka, námitky, rádce, FAQ), `agrocash.html` (sezónní osa, use-cases, typy strojů, dotace), `techcash.html` (osa splatnosti faktur, flotila, mezinárodní provoz)
- **Žádost** (`zadost.html`) — kvalifikační brána „Podnikáte na IČO?", reverzní lead-gate (nabídka před kontaktem), IČO s ověřením v ARES; `?typ=agro|tech` přepíná typy strojů, motohodiny a texty
- **Rádce** (`blog/`) — 8 článků pro podnikatele (průvodce, ceny, cash flow, prodej vs. výkup, oceňování, AgroCash, TechCash, daně) s JSON-LD Article, TOC a souvisejícími články
- **Klientská zóna** (`portal.html`), **Admin** (`admin.html`, 7fázová pipeline, channel report, segmentace, compliance checklist), **Aftersales** (`aftersales.html`) — demo portály (noindex)
- **Férovost & compliance** (`compliance.html`), **Roadmapa** (`faze2.html`), **Prezentace** (`prezentace.html`)

## Design (v4 — Apple-like, mobile-first)
Jedno písmo (Inter), velké titulky v sentence case s těsným prokladem, šedé dlaždice `#f5f5f7` bez rámečků,
pill tlačítka, tenký translucentní header, segmentové ovladače a iOS slider v kalkulačce, horizontální snap
carousely karet na mobilu, klidný scroll-reveal. Vertikály mají vlastní akcent (`body[data-vertical]`):
AgroCash sklizňová zlatá, TechCash signální oranžová. Vše v `assets/css/design-system.css` (vrstvy v1 → v4).

## SEO
Canonical, Open Graph, JSON-LD (Organization, WebSite, Service, FAQPage, Article, BreadcrumbList),
`sitemap.xml`, `robots.txt`, OG obrázky `assets/img/og-*.jpg`, demo portály noindex.

## Kontroly
```bash
node tools/check-links.js    # interní odkazy, kotvy, assety, sitemap, JS literály
node tools/check-seo.js      # title/description, canonical, OG, h1, JSON-LD vs. obsah, sitemap
node tools/check-terms.js    # terminologie & compliance (--strict = jen tvrdá porušení)
```
Pravidla pro texty a články: `tools/ARTICLE-BRIEF.md`, šablona článku `tools/article-template.html`.

## Technologie
Statický web — HTML5 + CSS + vanilla JS (`assets/js/data.js`, `shell.js`, `app.js`). Bez build kroku.
Fotky v `assets/img/`, zdrojové podklady v `Public/`. Odkazy v hlavičce/patičce jsou root-absolutní (kvůli `/blog/`).

## Lokální spuštění
```bash
npx serve .
```
Pozn.: `serve` při přesměrování na clean URL zahodí query string — žádost s vertikálou testujte jako `/zadost?typ=agro`.

---
*Demoprezentace. Nejedná se o závaznou nabídku ani o právní poradenství. Ukázková data.*
