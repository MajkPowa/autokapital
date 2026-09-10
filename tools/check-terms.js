// Terminology / compliance guardrail scanner. Prints every hit with context; a human/agent decides
// whether the context is allowed (e.g. "v leasingu nebo úvěru" = client's EXISTING encumbrance is OK;
// "úvěr" describing OUR product is NOT). Usage: node tools/check-terms.js [--strict]
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (!["node_modules", ".git", "Public", "tools"].includes(f)) walk(p); } else if (/\.(html|js)$/.test(f)) files.push(p); } })(ROOT);
// [regex, note, hardBan]
const RULES = [
  [/RPSN/g, "RPSN nikde v kalkulacích/textech", true],
  [/úrok/gi, "úrok/úroková sazba — jen v negaci (žádné úroky)", false],
  [/půjč/gi, "půjčka — jen v negaci (není to půjčka)", false],
  [/splátk|splác/gi, "splátka — poplatek není splátka; jen negace/cizí produkt", false],
  [/\búvěr/gi, "úvěr — jen stávající zatížení klienta, kontokorent/banka jako alternativa, nebo negace/compliance", false],
  [/úvěruschopnost/gi, "úvěruschopnost — zakázáno", true],
  [/reprezentativní příklad/gi, "reprezentativní příklad — zakázáno (spotřebitelský pojem)", true],
  [/zástav/gi, "zástava — jen stávající zatížení klienta", false],
  [/auto zůstává vaše|zůstává vaš/gi, "„auto zůstává vaše“ — zakázáno (vlastníkem je CashAuto)", true],
  [/bez registru|schválíme každ|100 ?% schválen|bez rizika|pro zadlužen|bez doložení příjm/gi, "predátorské fráze — jen v negačním seznamu compliance", false],
  [/hotovost dnes|peníze (ještě )?dnes|na účtu (ještě )?dnes/gi, "slib výplaty „dnes“ — zakázáno (zpravidla do 24 h od podpisu)", true],
  [/bez starostí|snadné řešení|minimum nákladů|nejlevněj|výhodn(á|é|ý|ě) (nabídk|řešen|cen)|levn(á|é|ý) (nabídk|řešen|služb)/gi, "rizikové claimy dle novely — zakázáno", true],
  [/financován/gi, "„financování“ jako název produktu — zakázáno (dočasný výkup)", false],
  [/Gemini|umělá inteligence|\bAI\b/g, "zmínka o AI/Gemini — nesmí být v deliverable", true],
  [/AutoKapit/gi, "starý název brandu", false],
  [/nevadí/gi, "„nevadí“ u dluhů/registrů — zakázáno", true],
  [/zdarma/gi, "zdarma — jen vázané na podstatné jméno (nezávazná žádost zdarma / nabídka zdarma)", false],
  [/\b(9\d|8\d) ?% (schválen|pravděpodobn)/gi, "procenta schválení klientům — zakázáno", true],
  [/spotřebitel(ům|e|é)?\b(?![^.]*neposkyt)/gi, "spotřebitel — mimo větu „spotřebitelům službu neposkytujeme“ zkontrolovat kontext", false],
];
const strict = process.argv.includes("--strict");
let hits = 0, hard = 0;
for (const f of files) {
  const lines = fs.readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const [re, note, hardBan] of RULES) {
      re.lastIndex = 0;
      if (re.test(line)) {
        // allowed contexts
        const allowed =
          /leasingu?,? (nebo|či|a) úvěr|úvěr(u|em)? (nebo|či) leasing|stávající (leasing|úvěr)|leasing či úvěr|úvěr na (stroj|vozidlo|vůz)|Není to úvěr|není úvěr|ani půjčk|žádné úroky|žádné RPSN|neúčtujeme|Co byste od nás nikdy|nikdy neměli slyšet|spotřebitelsk(ý|ého|ém|ým) úvěr|compliance|zákon/i.test(line);
        // compliance.html vysvětluje, co NEříkáme — negační seznam se hlásí jen jako "check"
        const negation = /compliance\.html$/.test(f) || /Nejde o|Nehovoříme|neříkáme|nesmí|neslibujeme|nikdy ne|Co byste od nás/i.test(line);
        const isHard = hardBan && !allowed && !negation;
        if (isHard) hard++;
        hits++;
        if (strict && !isHard) continue;
        console.log(`${isHard ? "HARD " : "check"} ${path.relative(ROOT, f)}:${i + 1} [${note}] ${line.trim().slice(0, 160)}`);
      }
    }
  });
}
console.log(`${files.length} files · ${hits} hits · ${hard} hard violations`);
process.exit(hard ? 1 : 0);
