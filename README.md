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
- **Rádce** (`blog/`) — 11 článků pro podnikatele (průvodce, ceny, cash flow, prodej vs. výkup, oceňování, AgroCash, TechCash, daně, Euro 7, spotřebitelský úvěr a insolvence odběratele) s JSON-LD Article, TOC a souvisejícími články
- **Klientská zóna** (`portal.html`), **Admin** (`admin.html`, 7fázová pipeline, channel report, segmentace, compliance checklist), **Aftersales** (`aftersales.html`) — demo portály (noindex)
- **Férovost & compliance** (`compliance.html`), **Roadmapa** (`faze2.html`), **Prezentace** (`prezentace.html`)

## Design (v6 — „Signál“, mobile-first)
Barva reflexní vesty a jízdních pruhů — svět řemeslníků, dopravců a zemědělců. Motivem je dvojité lomítko `//` z loga
(šikmé dlaždice, běžící přerušované čáry, pásy).

- **Dvě hlavní barvy + jedna dynamická.** Asfalt `--ink #0F1512` a papír `--paper #F4F1EA` (ostatní neutrály jsou jen
  jejich odstíny). Dynamická `--dyn` zabírá zhruba 30 % plochy stránky (blok v heru, pás kalkulačky, srovnání řad,
  jedna celá sekce, závěrečná výzva) a je dynamická dvakrát: mění se podle řady přes `body[data-vertical]`
  (CashAuto reflexní `#D4F23A`, AgroCash sklizňová `#FFC738`, TechCash signální `#FF7A33`) a nese pohyb.
  Text na `--dyn` je vždy asfalt; `--dyn` se nikdy nepoužívá jako barva textu na papíře.
- **Písmo.** Titulky a čísla Archivo (variabilní, šířka 112 %, řez 800–900), text Inter. Obojí z Google Fonts, `display=swap`.
- **Pohyb** (jen `transform`/`opacity`, vše za `prefers-reduced-motion`, bez knihoven): titulek hera se setře zpoza lomítkové
  masky a dynamický blok vjede; částky se odvalují jako odometr (`AK.odo` v `app.js`); běžící pás a přerušované čáry
  (jen ve viewportu); odlesk na hlavních tlačítkách; scroll-reveal s postupným zpožděním; animované piktogramy kroků;
  mobilní CTA lišta a „zhutnění“ hlavičky přes IntersectionObserver (žádné posluchače scrollu); přechody mezi stránkami
  `@view-transition` a ukazatel průběhu čtení jako progresivní vylepšení.
- **Soubory.** Marketingové stránky načítají jen `assets/css/signal.css`. Demo portály (`portal`, `admin`, `aftersales`)
  mají původní `design-system.css` + `assets/css/signal-portal.css`, která jeho tokeny přemapuje na nový systém.
- **Grafika.** Fotografie v `assets/img/` (WebP ve dvou šířkách, `srcset`) vznikají skriptem `tools/gen-images.py`
  (sloty, prompty a export; klíč se čte z `.env`, surové soubory zůstávají mimo repozitář). OG obrázky sází
  `tools/make-og.py`. Piktogramy (mřížka 24, tah 2 px, výplň `.a`) jsou v objektu `P` v `assets/js/shell.js`;
  do HTML je staticky propisuje `tools/apply-pictograms.py`.

## SEO
Canonical, Open Graph, JSON-LD (Organization, WebSite, Service, FAQPage, Article, BreadcrumbList),
`sitemap.xml`, `robots.txt`, OG obrázky `assets/img/og-*.jpg` (generuje `tools/make-og.py`), demo portály noindex.

## Kontroly
```bash
node tools/check-links.js    # interní odkazy, kotvy, assety, sitemap, JS literály
node tools/check-seo.js      # title/description, canonical, OG, h1, JSON-LD vs. obsah, sitemap
node tools/check-terms.js    # terminologie & compliance (--strict = jen tvrdá porušení)
python tools/apply-pictograms.py --check   # piktogramy v HTML odpovídají sadě v shell.js
```
Pravidla pro texty a články: `tools/ARTICLE-BRIEF.md`, šablona článku `tools/article-template.html`.

## Technologie
Statický web — HTML5 + CSS + vanilla JS (`assets/js/data.js`, `shell.js`, `app.js`). Bez build kroku.
Fotky v `assets/img/`, starší zdrojové podklady v `Public/` (web je už nepoužívá). Odkazy v hlavičce/patičce jsou root-absolutní (kvůli `/blog/`).

## Lokální spuštění
```bash
npx serve .
```
Pozn.: `serve` při přesměrování na clean URL zahodí query string — žádost s vertikálou testujte jako `/zadost?typ=agro`.

## Připomínky z analýzy webu
Přehled zpracování a otevřených podkladů: `tools/CASHAUTO-PRIPOMINKY.md`.
Společné srovnání sazeb vykresluje `assets/js/shell.js` ze stejného `AK.verticals` jako kalkulačky.
WhatsApp se v mobilním menu a patičce zobrazí po doplnění ověřeného čísla do `WHATSAPP_NUMBER`
v `shell.js` (mezinárodní formát, např. `+420` následované číslem). Do té doby zůstává skrytý.
Demo upozornění v `portal.html#platby` obsluhuje `assets/js/portal-reminders.js`; nastavení ukládá
do localStorage pro konkrétní demo případ. E-mail, SMS ani push neodesílá. Ostrý provoz vyžaduje
autentizovaný backend, skutečné smluvní termíny, plánovač a poskytovatele zpráv.

---
*Demoprezentace. Nejedná se o závaznou nabídku ani o právní poradenství. Ukázková data.*
