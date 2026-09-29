# Zpracování připomínek k webu CashAuto

Implementační přehled k 29. 9. 2026. Podklad: CashAuto_Analyza_webu.docx. Stávající rozpracované změny byly zachovány. Web se publikuje na cashauto.cz přes GitHub Pages z kořene větve main.

| Připomínka | Zpracování | Stav |
| --- | --- | --- |
| A1 Cenové parametry | Na všech třech landing pages přibylo srovnání CashAuto 70 % / 4 %, AgroCash 65 % / 3 %, TechCash 65 % / 3,5 %. Vysvětlen společný základ obou procent: odhadní hodnota majetku. Tabulka čerpá z týchž dat jako kalkulačky; sazby se neměnily. | Hotovo |
| A2 CTA | Texty tlačítek odpovídají kontextu žádosti, kalkulace a závěrečné sekce. Jde o nové autorské varianty; samostatný dokument TOP Headlines nebyl dodán. | Hotovo v dostupném rozsahu |
| A3 B2B a IČO | Určení výhradně pro podnikatele a firmy s IČO je viditelné v úvodu všech řad. Žádost dál obsahuje ověření IČO. Nový článek vysvětluje, že samotné IČO neurčuje právní povahu vztahu. | Hotovo |
| B1 Statistiky a reference | Nebyly dodány ověřené statistiky ani skutečné klientské citace. Na web nebyla doplněna vymyšlená čísla nebo doporučení. | Čeká na podklady |
| B2 Pojišťovací partner | Nebyl dodán potvrzený název partnera ani logo k použití. | Čeká na podklady |
| B3 Edukační témata | Přidány články o Euro 7 a hodnotě vozidel, dočasném výkupu a spotřebitelském úvěru, insolvenci odběratele a cash flow. Celkem 11 článků; doplněn index, metadata a sitemap. Nová témata obsahují odkazy na oficiální zdroje. | Hotovo |
| B4 WhatsApp | Připraven odkaz v mobilním menu a patičce, předvyplněný dotaz a kontrola formátu čísla. Bez skutečného WhatsApp čísla se odkaz nezobrazuje. Aktivace přes WHATSAPP_NUMBER v assets/js/shell.js. | Připraveno, čeká na číslo |
| B5 Odvětvová FAQ | AgroCash: pojištění práce v terénu. TechCash: podmínky zahraničního provozu a potřebné podklady. Viditelné odpovědi i FAQPage JSON-LD jsou shodné. | Hotovo |
| C1 Rodina značek | Společná navigace CashAuto / AgroCash / TechCash viditelná i na mobilu, označení aktuální řady a motto „Provoz se nezastaví.“ v hlavičce a patičce. | Hotovo |
| C2 Emoční přínos | Upraveny úvody a závěrečná CTA: klid při rozhodování, přehled a kontrola nad plánováním provozu. Bez fiktivních citací a nových záruk výsledku. | Hotovo |
| C3 Upozornění klientům | V portálu lze zvolit e-mail/SMS/push a předstih, zobrazit náhled a nastavení místně uložit nebo smazat. Demo nic neodesílá. Konec smlouvy není ve zdrojových datech, proto se ukázka odkupu váže na další platbu, nikoliv na vymyšlený konečný termín. | Demo hotovo, produkční napojení zbývá |

Analýza vycházela ze staršího stavu: projekt už před úpravami obsahoval osm článků, navigaci mezi řadami a odvětvová FAQ. Tyto prvky byly rozšířeny. Nedoložené tvrzení „jediný na trhu s okamžitou online kalkulačkou“ nebylo převzato.

## Ověření

- Kontrola interních odkazů, SEO a terminologie pomocí existujících nástrojů projektu: 0 rozbitých odkazů, 0 SEO chyb, 0 tvrdých terminologických porušení. SEO checker hlásí 30 měkkých upozornění na nadpisy, délku titulku a drobečkovou navigaci (24 původních, 6 převzatých ze šablony do nových článků). Nasazení zahrnuje také tři nové články a assets/js/portal-reminders.js.
- Ověření zobrazení všech tří landing pages při šířkách 390 a 1440 px, shody sazeb a výchozích kalkulací, aktivní řady a mobilního menu.
- Ověření WhatsApp odkazu s testovacím číslem pouze v testovacím prohlížeči; číslo nebylo uloženo do projektu.
- Ověření náhledu termínů, uložení, obnovení a smazání nastavení upozornění v prohlížeči na mobilní i desktopové šířce.
- Ověření tří nových článků na mobilu, jejich tabulek, indexu s 11 položkami a souvisejících článků. Bez chyb JavaScriptu při kontrolovaných průchodech.
- Jednotkové kontroly datumů, neplatných vstupů a blokovaného úložiště pro upozornění.

## Co zbývá dodat

Ověřené provozní statistiky včetně období a metodiky, odsouhlasené klientské reference, potvrzeného pojišťovacího partnera a logo, skutečné WhatsApp Business číslo a případně přesný dokument TOP Headlines. Pro automatická upozornění je potřeba produkční backend, skutečné smluvní termíny a připojené služby odesílání.
