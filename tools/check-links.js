// Internal link + asset + anchor checker for the static site. Usage: node tools/check-links.js [--strict]
// Sources checked:
//   - HTML (incl. Public/): href/src/srcset, root-absolute content="/…" (og/twitter meta), and every own-domain
//     URL https://cashauto.cz/… anywhere in the file (canonical, og:image, JSON-LD image/url/logo/item…).
//   - sitemap.xml + robots.txt: own-domain URLs (<loc>, <image:loc>, Sitemap:).
//   - assets/js/*.js: root-absolute string literals ("/zadost.html", "/index.html#kalkulacka", covers in data.js),
//     template prefixes (`/blog/${…}` → directory must exist) and data.js article slugs → blog/<slug>.html.
// Root-absolute (/x) and relative hrefs are both resolved. Existence is checked with EXACT (case-sensitive) names:
// GitHub Pages is case-sensitive while Windows/macOS file systems are not (CASE = only the case differs).
// Targets that exist on disk but are not tracked by git are reported as UNTRACKED (they will not be deployed);
// that is a warning by default and fails the run with --strict. Exit 1 when broken references are found.
const fs = require("fs"), path = require("path"), cp = require("child_process");
const ROOT = path.resolve(__dirname, "..");
const strict = process.argv.includes("--strict");
const SITE_URL = /https?:\/\/(?:www\.)?cashauto\.cz(\/[^"'\s<>)]*)?/g;
const rel = f => path.relative(ROOT, f).replace(/\\/g, "/");

// ---- inventory --------------------------------------------------------------------------------------------
const htmlFiles = [], jsFiles = [];
const JS_DIR = path.join(ROOT, "assets", "js");
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (!["node_modules", ".git", "tools"].includes(f)) walk(p); } else if (f.endsWith(".html")) htmlFiles.push(p); else if (f.endsWith(".js") && p.startsWith(JS_DIR + path.sep)) jsFiles.push(p); } })(ROOT);
const ids = {};
for (const f of htmlFiles) { const s = fs.readFileSync(f, "utf8"); ids[f] = new Set([...s.matchAll(/\sid="([^"]+)"/g)].map(m => m[1])); }
// ids injected by shell.js at runtime
const shellIds = new Set(["site-header", "site-footer", "main", "mobileMenu", "navToggle"]);

// git-tracked files (exact, case-sensitive paths). null = git unavailable → untracked check skipped.
let tracked = null;
try { tracked = new Set(cp.execSync("git ls-files -z", { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\0").filter(Boolean)); } catch (e) { /* not a git checkout */ }

// case-sensitive existence check (segment by segment against readdir). Returns { ok, actual } where actual is the
// on-disk name when the reference differs only in letter case.
const dirCache = new Map();
const listDir = d => { if (!dirCache.has(d)) { let l = null; try { l = new Set(fs.readdirSync(d)); } catch (e) { } dirCache.set(d, l); } return dirCache.get(d); };
function existsExact(abs) {
  const r = path.relative(ROOT, abs);
  if (r === "") return { ok: true };
  if (r.startsWith("..") || path.isAbsolute(r)) return { ok: fs.existsSync(abs) };
  let dir = ROOT;
  for (const seg of r.split(path.sep)) {
    const list = listDir(dir);
    if (!list) return { ok: false };
    if (!list.has(seg)) { const alt = [...list].find(n => n.toLowerCase() === seg.toLowerCase()); return { ok: false, actual: alt ? rel(path.join(dir, alt)) : undefined }; }
    dir = path.join(dir, seg);
  }
  return { ok: true };
}

// ---- checking ---------------------------------------------------------------------------------------------
let broken = 0;
const seen = new Set(), untracked = new Set();
const EXTERNAL = /^(https?:|mailto:|tel:|data:|javascript:|\/\/)/;
// opts: ignoreHash (own-domain URLs: "#org" in JSON-LD @id is an identifier, not an anchor), dirOnly (template prefix)
function checkRef(r, from, baseDir, opts = {}) {
  const src = rel(from), key = src + "\0" + r + (opts.dirOnly ? "\0dir" : "");
  if (seen.has(key)) return; seen.add(key);
  if (r.startsWith("#")) {
    if (r.length > 1 && ids[from] && !ids[from].has(r.slice(1)) && !shellIds.has(r.slice(1))) { console.log(`ANCHOR    ${src} -> ${r}`); broken++; }
    return;
  }
  if (EXTERNAL.test(r)) return;
  const [p0, hash] = r.split("#");
  let clean = p0.split("?")[0];
  try { clean = decodeURIComponent(clean); } catch (e) { }
  let target = clean.startsWith("/") ? path.join(ROOT, clean) : path.join(baseDir, clean);
  if (!opts.dirOnly && (clean === "" || clean.endsWith("/"))) target = path.join(target, "index.html");
  const ex = existsExact(target);
  if (!ex.ok) { console.log(`${ex.actual ? "CASE     " : "MISSING  "} ${src} -> ${r}${ex.actual ? `  (on disk: ${ex.actual})` : ""}`); broken++; return; }
  if (opts.dirOnly) return;
  if (tracked) { const t = rel(target); if (!tracked.has(t) && !untracked.has(t)) { untracked.add(t); console.log(`UNTRACKED ${t}  (first ref: ${src} -> ${r})`); } }
  if (hash && !opts.ignoreHash && target.endsWith(".html") && ids[target] && !ids[target].has(hash) && !shellIds.has(hash)) { console.log(`ANCHOR    ${src} -> ${r}`); broken++; }
}
const checkSiteUrls = (s, f) => { for (const m of s.matchAll(SITE_URL)) checkRef(m[1] || "/", f, ROOT, { ignoreHash: true }); };

// HTML: attributes + own-domain absolute URLs
for (const f of htmlFiles) {
  const s = fs.readFileSync(f, "utf8"), dir = path.dirname(f);
  for (const m of s.matchAll(/\s(?:href|src)="([^"]+)"/g)) checkRef(m[1], f, dir);
  for (const m of s.matchAll(/\ssrcset="([^"]+)"/g)) for (const c of m[1].split(",")) { const u = c.trim().split(/\s+/)[0]; if (u) checkRef(u, f, dir); }
  for (const m of s.matchAll(/\scontent="(\/[^"]*)"/g)) checkRef(m[1], f, dir);
  checkSiteUrls(s, f);
}
// sitemap.xml + robots.txt: own-domain URLs
for (const name of ["sitemap.xml", "robots.txt"]) { const f = path.join(ROOT, name); if (fs.existsSync(f)) checkSiteUrls(fs.readFileSync(f, "utf8"), f); }
// JS: root-absolute string literals, template prefixes, article slugs
const JS_LITERAL = /["'`](\/[A-Za-z0-9_\-.\/]*(?:\?[^"'`\s#]*)?(?:#[A-Za-z0-9_\-]*)?)["'`]/g;
const JS_TEMPLATE_PREFIX = /["'`](\/[A-Za-z0-9_\-.\/]*)\$\{/g; // `/blog/${slug}.html` — usually inside href="…" of a bigger template
for (const f of jsFiles) {
  const s = fs.readFileSync(f, "utf8");
  for (const m of s.matchAll(JS_LITERAL)) checkRef(m[1], f, ROOT);
  for (const m of s.matchAll(JS_TEMPLATE_PREFIX)) checkRef(m[1].slice(0, m[1].lastIndexOf("/") + 1), f, ROOT, { dirOnly: true });
  if (path.basename(f) === "data.js") for (const m of s.matchAll(/\bslug:\s*"([^"]+)"/g)) checkRef(`/blog/${m[1]}.html`, f, ROOT);
}

const note = tracked ? `${untracked.size} untracked targets${untracked.size && !strict ? " (warning; fails with --strict)" : ""}` : "untracked check skipped (git unavailable)";
console.log(`${htmlFiles.length} html + ${jsFiles.length} js files checked · ${broken} broken references · ${note}`);
process.exit(broken || (strict && untracked.size) ? 1 : 0);
