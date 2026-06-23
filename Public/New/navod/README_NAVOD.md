# AutoKapitál – grafické prvky bez textů + návod
Balíček obsahuje jednotlivé WEBP assety bez textových overlayů. Texty, nadpisy, CTA tlačítka a formulářové popisky doporučuji vkládat přímo ve webu přes HTML/CSS kvůli SEO, rychlosti úprav a responzivitě.
## Doporučené pořadí sekcí na homepage
### 01. Hero sekce
**Soubor:** `assets_webp/01_hero_visual_no_text.webp`  
**Kam dát:** Homepage úplně nahoře pod navigaci.  
**Použití:** Použít jako hlavní hero vizuál. Vlevo nechat text a CTA v HTML/CSS, vpravo je auto a abstraktní kalkulační karta.  
**Desktop:** width: 100%; max-width: 1440px; aspect-ratio: 16/9; object-fit: cover;  
**Mobile:** Oříznout na střed auta a UI kartu, případně použít jako background s gradientem. Text v mobilu vždy nad obrázkem.  

### 02. Výhody
**Soubor:** `assets_webp/02_benefit_cards_no_text.webp`  
**Kam dát:** Hned pod hero sekci.  
**Použití:** Grafický podklad pro 4 výhody. Nad/pod karty vložit skutečné texty přes HTML.  
**Desktop:** 4 sloupce; asset může být vložen jako ilustrační grafika nebo rozřezán na jednotlivé karty.  
**Mobile:** Karty skládat 2×2 nebo pod sebe.  

### 03. Jak to funguje
**Soubor:** `assets_webp/03_process_steps_no_text.webp`  
**Kam dát:** Pod sekci Výhody.  
**Použití:** Horizontální proces 4 kroků. Skutečné popisky vložit v HTML/CSS.  
**Desktop:** Použít přes celou šířku sekce.  
**Mobile:** Na mobilu převést do vertikální timeline, obrázek lze použít jako doplňkový vizuál.  

### 04. Pro koho je služba
**Soubor:** `assets_webp/04_audience_cards_no_text.webp`  
**Kam dát:** Pod proces nebo před kalkulačku.  
**Použití:** 4 segmenty cílových skupin. Doplnit titulky OSVČ, malé firmy, řemeslníci, podnikatelé v HTML.  
**Desktop:** 4 karty v jednom řádku.  
**Mobile:** 2×2 nebo jeden sloupec.  

### 05. Kalkulačka / orientační nabídka
**Soubor:** `assets_webp/05_calculator_ui_no_text.webp`  
**Kam dát:** Střed landing page jako hlavní konverzní blok.  
**Použití:** Vizuální podklad kalkulačky bez textů. Doporučuji skutečnou interaktivní kalkulačku kódovat v HTML/Reactu a tento asset použít jako referenční mockup nebo background.  
**Desktop:** 2 sloupce: vlevo vysvětlení, vpravo kalkulačka.  
**Mobile:** Kalkulačku skládat do jednoho sloupce.  

### 06. Proč AutoKapitál
**Soubor:** `assets_webp/06_benefits_split_car_no_text.webp`  
**Kam dát:** Pod kalkulačku.  
**Použití:** Split layout: vlevo benefit checklist, vpravo auto. Skutečný text vložit přes HTML.  
**Desktop:** 50/50 split layout.  
**Mobile:** Nejdřív text, potom obrázek auta.  

### 07. Klientský portál
**Soubor:** `assets_webp/07_client_portal_ui_no_text.webp`  
**Kam dát:** Pod sekci Proč AutoKapitál nebo jako samostatný produktový blok.  
**Použití:** Ukázka klientského dashboardu bez textů. Přes asset doplnit popisky okolo, samotný UI mockup může zůstat bez textu.  
**Desktop:** Vložit jako screenshot/mockup portálu.  
**Mobile:** Zmenšit, dát do carouselu nebo zobrazit jen hlavní část dashboardu.  

### 08. Finální CTA + footer
**Soubor:** `assets_webp/08_footer_cta_no_text.webp`  
**Kam dát:** Úplný spodek homepage.  
**Použití:** Závěrečný CTA banner s autem a abstraktní patičkou. Doplnit finální claim, CTA a odkazy v HTML.  
**Desktop:** Široký CTA banner nad footerem.  
**Mobile:** Nejdříve CTA text a tlačítko, potom auto/obrázek, footer pod sebe.  

## Doporučená struktura složek ve webu

```text
/public
  /images
    /autokapital
      01_hero_visual_no_text.webp
      02_benefit_cards_no_text.webp
      03_process_steps_no_text.webp
      04_audience_cards_no_text.webp
      05_calculator_ui_no_text.webp
      06_benefits_split_car_no_text.webp
      07_client_portal_ui_no_text.webp
      08_footer_cta_no_text.webp
```

## Ukázka vložení obrázku

```html
<picture>
  <source srcset="/images/autokapital/01_hero_visual_no_text.webp" type="image/webp">
  <img
    src="/images/autokapital/01_hero_visual_no_text.webp"
    alt="AutoKapitál – peníze z hodnoty vozu"
    loading="eager"
    width="1672"
    height="941"
  >
</picture>
```

## Doporučený CSS základ

```css
.section-visual {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  border-radius: 28px;
  overflow: hidden;
}

.section-visual img {
  display: block;
  width: 100%;
  height: auto;
}

.cta-primary {
  background: #00865A;
  color: #fff;
  border-radius: 999px;
  padding: 16px 28px;
  font-weight: 700;
}
```

## Důležité poznámky

- Obrázky nepoužívejte jako náhradu skutečných textů. Texty patří do HTML.
- Hero asset má vlevo volný prostor pro headline a CTA.
- Kalkulačku je lepší naprogramovat jako reálnou komponentu; obrázek slouží jako vizuální reference nebo statický podklad.
- Na mobilu dávejte sekce pod sebe ve stejném pořadí.
- CTA tlačítka držte jednotně zelená.
