# CashAuto — zapnutí ostrého provozu

Web je statický (GitHub Pages), takže přihlášení a data potřebují službu, která běží na serveru.
Vše je připravené pro **Supabase** (ověřování účtů + databáze s pravidly přístupu, servery v EU).
Dokud ji nepropojíte, web běží v **ukázkovém režimu**: účty i žádosti existují jen v prohlížeči návštěvníka.

## Co se zapnutím změní

| | Ukázkový režim (teď) | Ostrý režim |
| --- | --- | --- |
| Účty a hesla | jen v prohlížeči, bez skutečné ochrany | spravuje Supabase, hesla jen jako otisk na serveru |
| Administrace | „ukázkový správce“ jedním klikem | jen účty s rolí správce; roli nejde nastavit z webu |
| Žádost z formuláře | uloží se do prohlížeče | uloží se do databáze, objeví se v pipeline jako Nový lead |
| CRM pipeline | ukázkové případy | skutečné případy, společné pro všechny správce |
| Klientská zóna | ukázkový případ Jana Nováka | klient vidí jen své žádosti (podle potvrzeného e-mailu) |

## Postup (asi 20 minut)

1. **Založte projekt** na supabase.com (region EU, např. Frankfurt). Heslo k databázi si uložte do správce hesel.
2. **Databáze:** SQL Editor → vložte celý soubor `tools/supabase-schema.sql` → Run.
3. **Přihlašování** (Authentication → Sign In / Providers → Email):
   - Confirm email: **zapnuto** (bez potvrzeného e-mailu klient své případy neuvidí),
   - minimální délka hesla **10**, zapněte kontrolu uniklých hesel, pokud ji tarif nabízí.
4. **Adresy** (Authentication → URL Configuration):
   - Site URL: `https://cashauto.cz`
   - Redirect URLs: `https://cashauto.cz/prihlaseni.html`
5. **Odesílání e-mailů** (Authentication → Emails → SMTP): nastavte vlastní SMTP (např. poštu na doméně cashauto.cz).
   Vestavěné odesílání Supabase je jen na zkoušku a má nízký limit. Texty e-mailů (potvrzení, obnova hesla) si přeložte do češtiny.
6. **Klíče** (Project Settings → API): zkopírujte *Project URL* a *anon public* klíč do `assets/js/config.js`:
   ```js
   window.AK_CONFIG = {
     supabaseUrl: "https://xxxxxxxx.supabase.co",
     supabaseAnonKey: "eyJ..."
   };
   ```
   Anon klíč je veřejný a do repozitáře patří. **Klíč `service_role` nikdy nikam nevkládejte.**
7. **Nasazení:** commit + push na `main`.
8. **První správce:** na webu si založte účet (Přihlásit se → Nový účet), potvrďte e-mail a v SQL Editoru spusťte
   `update public.profiles set role = 'staff' where email = 'vas@email.cz';`
9. **Zkouška:** odešlete žádost z formuláře → přihlaste se jako správce → žádost je v pipeline ve fázi Nový lead.
   Přihlaste se e-mailem ze žádosti jako klient → v klientské zóně vidíte její průběh.

Pokud používáte vlastní doménu pro Supabase, doplňte ji do `connect-src` v hlavičce `prihlaseni.html`.

## Přístupy pro další správce (pozvánky)

Správci si účet nezakládají sami – pozvete je, aby heslo znali jen oni:

1. Supabase → Authentication → Users → **Invite user** → zadejte e-mail správce. Opakujte pro každého.
   (Vyžaduje nastavené vlastní SMTP z kroku 5; vestavěné odesílání posílá jen členům projektu.)
2. V SQL Editoru jim přidělte roli (e-maily nahraďte skutečnými):
   ```sql
   update public.profiles set role = 'staff'
   where lower(email) in ('prvni@firma.cz', 'druhy@firma.cz');
   ```
3. Pozvaný klikne na odkaz v e-mailu, na stránce Přihlášení si nastaví vlastní heslo (aspoň 10 znaků)
   a systém ho pustí do administrace.
4. Odebrání přístupu: `update public.profiles set role = 'client' where lower(email) = 'kdo@firma.cz';`
   a v Authentication → Users účet zablokujte nebo smažte.

Seznam e-mailů správců do veřejného repozitáře nepatří – SQL s konkrétními adresami si nechte jen u sebe
(soubory `tools/*.local.sql` git ignoruje).

Videomanuál k administraci je na `manual.html` (odkaz je i v nabídce administrace).

## Co ostrý režim neřeší (zatím)

- **Odesílání e-mailů z administrace:** šablony se otevírají v poštovním programu správce. Automatické odesílání vyžaduje e-mailovou službu a serverovou funkci.
- **Reklamní účty:** dashboard ukazuje ukázková čísla. Skutečné napojení Meta / Google / TikTok / Sklik vyžaduje serverovou funkci s přístupovými tokeny.
- **Platby, dokumenty a vozidlo v klientské zóně:** zobrazují se jen ukázkovému klientovi; skutečným klientům se ukazuje průběh žádosti a tři čísla.
- **Ostatní sekce administrace** (Přehled, Měsíční report, Segmenty, Scoring, Vozidla, Platby, Rizika): stále ukázková data.
- **Ochrana formuláře proti robotům:** je tam jen jednoduchá past. Při spamu zapněte CAPTCHA (Supabase → Authentication → Attack Protection) nebo omezení počtu žádostí.
- **Soubory:** nahrávání dokladů v žádosti je vypnuté.

## Než pustíte reklamu

- [ ] Právník schválil smluvní vzory v administraci a texty webu (dočasný výkup jen pro podnikatele).
- [ ] Skutečné telefonní číslo a e-mail místo `800 123 456` a `info@cashauto.cz` (pokud neplatí).
- [ ] Zásady zpracování osobních údajů a souhlasy (formulář žádosti, registrace, cookies / měřicí kódy).
- [ ] Zpracovatelská smlouva se Supabase (DPA) a záznam o zpracování.
- [ ] Měřicí kódy a souhlasová lišta, pokud chcete vyhodnocovat kampaně.
- [ ] Po přejmenování společnosti upravit patičku (`assets/js/shell.js`), stránku Férovost a `AK.operator` v `assets/js/data.js`.
