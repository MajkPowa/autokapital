/* =========================================================================
   CashAuto — nastavení ostrého provozu
   Dokud jsou obě hodnoty prázdné, web běží v UKÁZKOVÉM režimu: účty i případy
   existují jen v prohlížeči návštěvníka a nic se nikam neodesílá.

   Ostrý režim zapnete doplněním adresy projektu a veřejného (anon) klíče ze
   Supabase → Project Settings → API. Anon klíč je určený ke zveřejnění; data
   chrání pravidla v databázi (tools/supabase-schema.sql). NIKDY sem nedávejte
   service_role klíč. Postup: tools/OSTRY-PROVOZ.md
   ========================================================================= */
window.AK_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: ""
};
