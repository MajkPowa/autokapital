#!/usr/bin/env python3
"""Sjednotí piktogramy v HTML stránkách se sadou v6 „Signál“.

Zdroj tvarů je objekt `P` v assets/js/shell.js (mřížka 24, tah 2 px, třída .a = barevná výplň).
Skript najde ikony v dlaždicích (.ts-ico, .ico-img, .uc-ico, .vc-ico, .mt-ico), pozná původní
tvar podle signatury cesty a nahradí ho piktogramem ze sady. Je idempotentní — už převedené
piktogramy (svg.pic s data-pic) jen přegeneruje z aktuální sady.

Použití:  python tools/apply-pictograms.py [--check]
"""
import re, sys, glob
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
shell = (ROOT / "assets/js/shell.js").read_text(encoding="utf8")
block = shell[shell.index("const P = {"):shell.index("};", shell.index("const P = {"))]
P = dict(re.findall(r"^\s+(\w+): '(.*)',\s*$", block, re.M))
assert len(P) > 20, "sada piktogramů v shell.js nenalezena"

# signatura původní ikony → název piktogramu (pořadí: konkrétnější dřív)
SIG = [
    ("M13 2L4.5 13.5H11", "bolt"),
    ('V5z"/><path d="M9 12l2 2 4-4', "shield"),
    ("M12 2l8 3v6c0 5-3.5 8.5-8 11", "cover"),
    ("M3 11l9-7 9 7", "visit"),
    ('<rect x="3" y="4" width="18" height="13" rx="2"/>', "screen"),
    ("M3 13l2-5a3 3 0 0 1 2.8-2h8.4", "van"),
    ("M4 15V9h6l2-5h4v11", "tractor"),
    ("M2 6h12v10H2z", "truck"),
    ("M14 2H6a2 2 0 0 0-2 2v16", "doc"),
    ("M3.5 12a8.5 8.5 0 1 0 2.5-6", "back"),
    ("M12 7v5l3", "clock"),
    ("M12 12c-4 0-7-3-7-7", "seed"),
    ("M4 20V6a2 2 0 0 1 2-2h8", "fuel"),
    ("M14.7 6.3a1 1 0", "wrench"),
    ('<circle cx="9" cy="8" r="3.2"/>', "users"),
    ('<rect x="3" y="4" width="18" height="18" rx="2"/>', "calendar"),
    ("M7 9h10l1.5 11h-13z", "bag"),
    ("M4 20V10M10 20V4", "chart"),
    ("M9 4L3 6v14l6-2 6 2 6-2V4", "map"),
    ('<circle cx="12" cy="12" r="4"/><path d="M12 3v2', "tyre"),
    ("M4 7h16v13H4z", "case"),
    ("M4 12.5l5 5L20 6.5", "tick"),
    ("icon-auto.webp", "van"), ("icon-zpetny-odkup.webp", "back"), ("icon-stitek-ochrana.webp", "shield"),
    ("icon-dokumenty.webp", "doc"), ("icon-handshake.webp", "seal"), ("icon-kalkulacka.webp", "calc"),
    ("icon-portal.webp", "screen"), ("icon-uzivatel.webp", "user"),
]
HOSTS = r"(?:ts-ico|ico-img|uc-ico|vc-ico|mt-ico)"
pat = re.compile(r'(<(?:span|div) class="[^"]*\b' + HOSTS + r'\b[^"]*"[^>]*>)\s*(<svg\b.*?</svg>|<img\b[^>]*>)', re.S)


def svg(name):
    return f'<svg class="pic" data-pic="{name}" viewBox="0 0 24 24" aria-hidden="true">{P[name]}</svg>'


def convert(m):
    host, inner = m.group(1), m.group(2)
    known = re.search(r'data-pic="(\w+)"', inner)
    if known and known.group(1) in P:
        return host + svg(known.group(1))
    for sig, name in SIG:
        if sig in inner:
            return host + svg(name)
    unknown.append(inner[:90])
    return m.group(0)


files = [p for p in list(ROOT.glob("*.html")) + list((ROOT / "blog").glob("*.html")) + [ROOT / "tools/article-template.html"]]
check = "--check" in sys.argv
changed = 0
for f in files:
    unknown = []
    src = f.read_text(encoding="utf8")
    out = pat.sub(convert, src)
    for u in unknown:
        print(f"? {f.name}: neznámá ikona {u}")
    if out != src:
        changed += 1
        if not check:
            f.write_text(out, encoding="utf8", newline="\n")
        print(("would update " if check else "updated ") + str(f.relative_to(ROOT)))
print(f"{len(P)} piktogramů v sadě · {changed} souborů {'k úpravě' if check else 'upraveno'}")
sys.exit(1 if check and changed else 0)
