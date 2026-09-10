# Brief pro články Rádce CashAuto (blog/*.html)

## Produkt (jediná pravda)
- **CashAuto** = „dočasný výkup vozu se zpětným odkupem“ pro **podnikatele a firmy s IČO** (OSVČ, s.r.o., družstva). **Spotřebitelům službu neposkytujeme.**
- Mechanika: CashAuto a.s. vůz/stroj **koupí** (kupní smlouva) a vyplatí **výkupní cenu**. Klient zůstává **provozovatelem** a věc dál používá pro podnikání podle **smlouvy o užívání**. Klient má smluvní **možnost zpětného odkupu** za **cenu zpětného odkupu** (= výkupní cena) — drží si ji úhradou **měsíčního rezervačního poplatku**. Při neuhrazení právo na odkup zaniká v okamžiku uvedeném ve smlouvě. Smluvní balík: kupní smlouva, předávací protokol, smlouva o užívání, smlouva o zpětném odkupu (opce / výhrada zpětné koupě), ceník poplatku, informační dokument pro klienta.
- **Tři čísla** vždy pohromadě: výkupní cena · měsíční rezervační poplatek (v Kč) · cena zpětného odkupu. Doba rezervace 1–12 měsíců. Odkup možný kdykoliv dřív, bez penalizace.
- Orientační sazby (prototyp): **CashAuto (firemní vozy)** výkup 70 % odhadní hodnoty, poplatek 4 %/měs; **AgroCash (zemědělská technika)** výkup 65 %, poplatek 3 %/měs; **TechCash (autodopravci)** výkup 65 %, poplatek 3,5 %/měs. Ukázkový příklad auto: hodnota 300 000 Kč → výkup 210 000 Kč → poplatek 12 000 Kč/měs → za 3 měsíce 36 000 Kč → odkup 210 000 Kč. Agro: 1 500 000 → 975 000 → 45 000/měs. Tech: 1 800 000 → 1 170 000 → 63 000/měs.
- Proces (7 kroků): 1 formulář (IČO + vůz, 2 min) → 2 telefonát → 3 nabídka (scoring) → 4 návštěva technika u klienta → 5 schválení → 6 pojištění (převod zařídíme) → 7 podpis a výplata (zpravidla do 24 h od podpisu). Ověřujeme IČO v ARES, oprávnění jednat, vlastnictví, zatížení (KYC/AML).
- Firma: CashAuto a.s. (demo), tel. 800 123 456, info@cashauto.cz, Po–Pá 8–18. Web https://cashauto.cz. Klientská zóna /portal.html. Žádost /zadost.html (agro: /zadost.html?typ=agro, tech: ?typ=tech). Vertikály: /agrocash.html, /techcash.html. Compliance: /compliance.html.

## Tvrdé zákazy (novela zákona o spotřebitelském úvěru — dodržujeme dobrovolně, B2B)
- NIKDY nepopisovat NÁŠ produkt slovy: úvěr, půjčka, splátka, úrok, RPSN, úvěruschopnost, reprezentativní příklad, „financování“ (jako název produktu), zástava, „auto zůstává vaše“. Povoleno: „Není to úvěr ani půjčka“ (negace), „stávající leasing/úvěr na vozidle“ (zatížení klienta), banka/kontokorent/faktoring jako **cizí alternativy** ve srovnání (věcně, bez hodnocení „lepší/levnější“).
- NIKDY: „bez registru“, „schválíme každého“, „100 % schválení“, „bez rizika“, „pro zadlužené“, „bez doložení příjmů“, „nevadí“ (u dluhů), „hotovost dnes“, „peníze dnes“, „bez starostí“, „levné/výhodné řešení“, „snadné řešení“, „minimum nákladů“, procenta pravděpodobnosti schválení, sliby zlepšení finanční situace / náhrady úspor / zvýšení životní úrovně.
- „zdarma“ jen vázané na podstatné jméno (nezávazná žádost zdarma, orientační nabídka zdarma). Služba **není** zdarma.
- Každý článek, který ukazuje čísla nabídky, obsahuje tučné varování (je v šabloně): „Pozor! Tato služba není zdarma — za rezervaci možnosti zpětného odkupu platíte měsíční poplatek.“
- Žádná zmínka o AI, Gemini, generování obrázků, o tom, že web je prototyp/demo (mimo patičku, kterou nepíšeš).
- Nesmí být oslovováni spotřebitelé, domácnosti, rodiny, zranitelné skupiny. Účely jen podnikatelské: provoz, materiál, DPH, mzdy, faktury po splatnosti, nafta, osivo, díly, mýto, zálohy na zakázky.
- Neslibovat: schválení, výkup všem, konkrétní výkupní cenu bez prohlídky, daňové důsledky (vždy „posuďte s účetním/daňovým poradcem“), právní důsledky (vždy „podmínky ve smlouvě“).

## Styl
- Česky, spisovně, přímočaře, konkrétně (čísla v Kč, ne procenta bez Kč). Tón: zkušený parťák z branže, ne banka, ne reklama. Krátké odstavce, seznamy, mezititulky.
- Typografie: české uvozovky „takto“, pomlčka —, nezlomitelné mezery v částkách `300&nbsp;000&nbsp;Kč` a po jednopísmenných předložkách (`v&nbsp;`, `s&nbsp;`, `k&nbsp;`, `o&nbsp;`, `u&nbsp;`, `a&nbsp;`, `i&nbsp;`) v běžném textu.
- Rozsah 700–1 100 slov těla. 4–6 sekcí `<h2 id="...">` (id = slug bez diakritiky). Použij komponenty šablony: `.callout` (Shrnutí / Tip z praxe), `blockquote` (1×), `.example` s 3× `.ex` (val + cap) tam, kde jsou čísla, tabulku pro srovnání, `.warn` je už v šabloně (nepřidávej druhé).
- Interní odkazy (min. 3): /zadost.html (CTA), související článek (/blog/<slug>.html z indexu níže), vertikála (/agrocash.html nebo /techcash.html) nebo /index.html#kalkulacka, /compliance.html.
- Na konci těla krátký odstavec „Co dál“ s CTA odkazem na žádost.

## Index článků (slug → titulek · tag · vertikála · cover)
1. docasny-vykup-vozu-jak-to-funguje · Dočasný výkup vozu se zpětným odkupem: jak to funguje krok za krokem · Průvodce · auto · /assets/img/story-technik.webp
2. kolik-stoji-docasny-vykup-rezervacni-poplatek · Kolik stojí dočasný výkup? Rezervační poplatek srozumitelně (příklad v Kč) · Ceny & poplatky · auto · /assets/img/blog-ucetni.webp
3. cash-flow-osvc-faktury-po-splatnosti · Cash flow OSVČ: 7 způsobů, jak překlenout faktury po splatnosti · Cash flow · auto · /assets/img/blog-cashflow.webp
4. prodat-firemni-auto-nebo-docasny-vykup · Prodat firemní auto, nebo ho dočasně vykoupit? Srovnání pro podnikatele · Rozhodování · auto · /assets/img/blog-srovnani.webp
5. jak-se-ocenuje-firemni-vuz-vykupni-cena · Jak se oceňuje firemní vůz: co ovlivňuje výkupní cenu · Oceňování · auto · /assets/img/blog-oceneni.webp
6. agrocash-penize-ze-zemedelske-techniky-pred-sezonou · Peníze ze zemědělské techniky před sezónou: jak AgroCash funguje pro farmy · AgroCash · agro · /assets/img/blog-agro-sezona.webp
7. techcash-splatnost-faktur-dopravci · Splatnost faktur 60–90 dní: jak dopravci udrží kamiony v pohybu · TechCash · tech · /assets/img/blog-tech-faktury.webp
8. danove-souvislosti-docasneho-vykupu-osvc-sro · Daňové a účetní souvislosti dočasného výkupu pro OSVČ a s.r.o. · Účetnictví · auto · /assets/img/blog-ucetni.webp

Datum publikace: použij hodnotu z data.js (`AK.articles[].date`), `DATE_CS` ve formátu „10. 9. 2026“. `READ` = minuty z data.js. `ZADOST_QUERY` = "" pro auto, "?typ=agro" / "?typ=tech" pro vertikály. `VERTICAL` = auto|agro|tech.

## Šablona
Zkopíruj `tools/article-template.html` 1:1 a nahraď všechny `{{PLACEHOLDERY}}`. Nic ze struktury (head, aside, related, footer, skripty) neměň. `{{TOC}}` = `<li><a href="#id">Nadpis</a></li>` pro každé h2. `{{BODY}}` vlož místo komentáře. `{{TITLE_SEO}}` ≤ 55 znaků (zkrácená verze titulku), `{{DESCRIPTION}}` 130–160 znaků, `{{COVER_ALT}}` popis fotky česky (bez slova „ilustrační“).
