// SEO head checker: title/description lengths, canonical, OG, single h1, heading hierarchy, JSON-LD validity,
// FAQPage / BreadcrumbList vs. visible content, sitemap coverage.
// Usage: node tools/check-seo.js
// Hard issues (counted, exit 1): missing/too long title or description, canonical, og:title, h1 count, html lang,
//   display font, invalid JSON-LD, FAQPage question/answer not matching visible FAQ, breadcrumb URL/position errors,
//   sitemap coverage (indexable page missing, noindex page or non-existent file listed).
// Soft warnings (printed as "warn:", do not affect exit code): short title/description, heading level skips,
//   first heading not h1, breadcrumb names differing from visible crumbs, visible FAQ without FAQPage markup,
//   FAQPage answer shorter than the visible one.
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
// Public/ = design podklady (mockupy, návod) blokované v robots.txt, nejsou součástí webu → záměrně vynechány.
const SKIP_DIRS = ["node_modules", ".git", "Public", "tools"];
const LIMITS = { titleMax: 65, titleMin: 45, descMax: 160, descMin: 120 };
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (!SKIP_DIRS.includes(f)) walk(p); } else if (f.endsWith(".html")) files.push(p); } })(ROOT);
const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
let issues = 0, warnings = 0;
const rel = (f) => path.relative(ROOT, f).replace(/\\/g, "/");
const warn = (f, m) => { console.log(`${rel(f)}: ${m}`); issues++; };
const soft = (f, m) => { console.log(`${rel(f)}: warn: ${m}`); warnings++; };
const pageUrl = (r) => "https://cashauto.cz/" + (r === "index.html" ? "" : r === "blog/index.html" ? "blog/" : r);
// Visible text: strip tags, decode common entities, collapse whitespace (incl. nbsp) — same normalisation for HTML and JSON-LD.
const text = (html) => String(html).replace(/<[^>]+>/g, "").replace(/&nbsp;|\u00a0/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
const ldNodes = (j) => Array.isArray(j) ? j : Array.isArray(j["@graph"]) ? j["@graph"] : [j];
for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  const r = rel(f);
  // Body without comments / scripts / templates — headings, FAQ and breadcrumbs are read from here.
  const body = s.replace(/<!--[\s\S]*?-->/g, "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<template[\s\S]*?<\/template>/gi, "");
  const title = (s.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
  const desc = (s.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  const robots = (s.match(/<meta name="robots" content="([^"]*)"/) || [])[1] || "";
  const noindex = /noindex/.test(robots);
  if (!title) warn(f, "missing <title>");
  if (title.length > LIMITS.titleMax) warn(f, `title too long (${title.length} > ${LIMITS.titleMax}): ${title}`);
  else if (title && !noindex && title.length < LIMITS.titleMin) soft(f, `title short (${title.length} < ${LIMITS.titleMin}): ${title}`);
  if (!noindex && !desc) warn(f, "missing meta description");
  if (desc.length > LIMITS.descMax) warn(f, `description too long (${desc.length} > ${LIMITS.descMax})`);
  else if (desc && !noindex && desc.length < LIMITS.descMin) soft(f, `description short (${desc.length} < ${LIMITS.descMin})`);
  if (!/rel="canonical"/.test(s)) warn(f, "missing canonical");
  if (!noindex && !/property="og:title"/.test(s)) warn(f, "missing og:title");
  // Headings: exactly one h1, h1 first, no skipped levels (h2 → h4).
  const levels = [...body.matchAll(/<h([1-6])[\s>]/gi)].map((m) => +m[1]);
  const h1s = levels.filter((l) => l === 1).length;
  if (h1s !== 1) warn(f, `h1 count = ${h1s}`);
  if (levels.length && levels[0] !== 1) soft(f, `first heading is h${levels[0]}, not h1`);
  const skips = levels.map((l, i) => (i && l > levels[i - 1] + 1 ? `h${levels[i - 1]}>h${l}` : null)).filter(Boolean);
  if (skips.length) soft(f, `heading level skipped ${skips.length}×: ${[...new Set(skips)].join(", ")}`);
  if (!/<html lang="cs">/.test(s)) warn(f, "html lang != cs");
  if (/Barlow\+Condensed/.test(s)) warn(f, "unused display font (Barlow Condensed) still linked — v4 uses Inter only");
  // Visible FAQ and breadcrumbs (accordion markup from design-system: .faq-q button + .faq-a-inner; ol.breadcrumbs > li).
  const faqQ = [...body.matchAll(/<button class="faq-q"[^>]*>([\s\S]*?)<\/button>/g)].map((m) => text(m[1]));
  const faqA = [...body.matchAll(/<div class="faq-a-inner">([\s\S]*?)<\/div>/g)].map((m) => text(m[1]));
  const crumbsHtml = (body.match(/<ol class="breadcrumbs"[^>]*>([\s\S]*?)<\/ol>/) || [])[1] || "";
  const crumbs = [...crumbsHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => text(m[1]));
  const url = pageUrl(r);
  let hasFaqPage = false;
  for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let json;
    try { json = JSON.parse(m[1]); } catch (e) { warn(f, "invalid JSON-LD: " + e.message); continue; }
    for (const node of ldNodes(json)) {
      if (!node || typeof node !== "object") continue;
      if (node["@type"] === "FAQPage") {
        hasFaqPage = true;
        for (const q of node.mainEntity || []) {
          const name = text(q.name || ""), answer = text((q.acceptedAnswer || {}).text || "");
          const i = faqQ.indexOf(name);
          if (i < 0) { warn(f, `FAQPage question not visible on page (.faq-q): „${name}“`); continue; }
          if (faqA[i] === answer) continue;
          const prefix = !!faqA[i] && faqA[i].startsWith(answer); // JSON-LD answer is a visible prefix → soft, otherwise hard
          (prefix ? soft : warn)(f, `FAQPage answer ${prefix ? "shorter than" : "differs from"} visible .faq-a-inner: „${name}“`);
        }
      }
      if (node["@type"] === "BreadcrumbList") {
        const items = node.itemListElement || [];
        if (!items.length || !items.every((it, i) => it.position === i + 1)) warn(f, "BreadcrumbList positions are not 1..n in order");
        const last = items[items.length - 1] || {};
        if (last.item !== url) warn(f, `BreadcrumbList last item ${last.item} != page URL ${url}`);
        const names = items.map((it) => text(it.name || ""));
        if (crumbs.length && names.join(" › ") !== crumbs.join(" › ")) soft(f, `BreadcrumbList names differ from visible .breadcrumbs: [${names.join(" › ")}] vs [${crumbs.join(" › ")}]`);
      }
    }
  }
  if (faqQ.length && !hasFaqPage && !noindex) soft(f, `${faqQ.length} visible FAQ items without FAQPage JSON-LD`);
  if (faqQ.length !== faqA.length) warn(f, `FAQ markup mismatch: ${faqQ.length} .faq-q vs ${faqA.length} .faq-a-inner`);
  // Sitemap: every indexable page listed, no noindex page listed.
  const inSitemap = sitemap.includes(`<loc>${url}</loc>`);
  if (!noindex && !inSitemap) warn(f, `not in sitemap: ${url}`);
  if (noindex && inSitemap) warn(f, `noindex page listed in sitemap: ${url}`);
  const canonical = (s.match(/rel="canonical" href="([^"]*)"/) || [])[1];
  if (canonical && canonical !== url) warn(f, `canonical mismatch: ${canonical} vs ${url}`);
  const imgsNoAlt = (s.match(/<img(?![^>]*\balt=)[^>]*>/g) || []).length;
  if (imgsNoAlt) warn(f, `${imgsNoAlt} <img> without alt`);
}
// Sitemap entries must point to existing files.
for (const m of sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)) {
  const loc = m[1];
  if (!loc.startsWith("https://cashauto.cz/")) { console.log(`sitemap.xml: foreign loc ${loc}`); issues++; continue; }
  let p = loc.slice("https://cashauto.cz/".length);
  if (p === "" || p.endsWith("/")) p += "index.html";
  if (!fs.existsSync(path.join(ROOT, p))) { console.log(`sitemap.xml: loc without file: ${loc}`); issues++; }
}
console.log(`${files.length} files · ${issues} SEO issues · ${warnings} warnings`);
process.exit(issues ? 1 : 0);
