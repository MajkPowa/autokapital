#!/usr/bin/env python3
"""OG obrázky 1200×630 (assets/img/og-*.jpg) v designu v6 „Signál“.

Titulek sází prohlížeč (Archivo z Google Fonts), fotografie se bere z assets/img.
Vyžaduje Python balíčky playwright + pillow a nainstalovaný Chromium pro Playwright.

Použití:  python tools/make-og.py
"""
import io
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "assets" / "img"
CARDS = {
    "og-home": dict(dyn="#D4F23A", brand=("Cash", "Auto"), l1="Peníze z auta.", l2="Jezdíte dál.",
                    sub="Dočasný výkup firemního vozu se zpětným odkupem · pro OSVČ a firmy s IČO", photo="hero-auto.webp", pos="62% 50%"),
    "og-agro": dict(dyn="#FFC738", brand=("Agro", "Cash"), l1="Peníze ze stroje.", l2="Sezóna jede dál.",
                    sub="Dočasný výkup zemědělské techniky se zpětným odkupem · pro farmy s IČO", photo="hero-agro.webp", pos="88% 50%"),
    "og-tech": dict(dyn="#FF7A33", brand=("Tech", "Cash"), l1="Peníze z tahače.", l2="Kamiony jedou dál.",
                    sub="Dočasný výkup tahačů a návěsů se zpětným odkupem · pro dopravce s IČO", photo="hero-tech.webp", pos="80% 50%"),
    "og-blog": dict(dyn="#D4F23A", brand=("Cash", "Auto"), l1="Rádce pro podnikatele.", l2="Bez omáčky.",
                    sub="Cash flow, ceny a oceňování srozumitelně · pro OSVČ a firmy s IČO", photo="blog-ucetni.webp", pos="50% 50%"),
}
HTML = """<!doctype html><html lang="cs"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,600..900&family=Inter:wght@500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;background:#0F1512;color:#F4F1EA;font-family:Inter,sans-serif;position:relative}
.copy{position:absolute;left:64px;top:56px;width:640px;height:518px;display:flex;flex-direction:column}
.brand{display:flex;align-items:center;gap:14px;font:800 34px/1 Archivo;font-stretch:112%;letter-spacing:-.035em}
.brand i{font-style:normal;font-weight:600}
.mark{width:52px;height:43px;border-radius:11px;background:VAR_DYN;position:relative}
.mark::before,.mark::after{content:"";position:absolute;top:9px;bottom:9px;width:9px;background:#0F1512;transform:skewX(-14deg)}
.mark::before{left:14px}.mark::after{left:29px}
h1{margin-top:auto;font:900 SIZEpx/1 Archivo;font-stretch:112%;letter-spacing:-.035em}
h1 span{display:block;width:fit-content}
h1 .d{margin-top:12px;margin-left:-8px;padding:4px 22px 10px 18px;background:VAR_DYN;color:#0F1512;border-radius:8px;transform:skewX(-12deg)}
h1 .d b{display:block;font-weight:900;transform:skewX(12deg)}
p{margin-top:30px;font:500 23px/1.4 Inter;color:#A9B0AA;max-width:600px}
.s{position:absolute;top:-40px;bottom:-40px;transform:skewX(-12deg);overflow:hidden;border-radius:28px}
.s.a{left:742px;width:86px;background:VAR_DYN}
.s.a::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(15,21,18,.14) 0 3px,transparent 3px 18px)}
.s.b{left:860px;width:520px}
.s.b img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:VAR_POS;transform:skewX(12deg) scale(1.28)}
</style></head><body>
<div class="copy"><div class="brand"><span class="mark"></span><span>B1<i>B2</i></span></div>
<h1><span>L1</span><span class="d"><b>L2</b></span></h1><p>SUB</p></div>
<div class="s a"></div><div class="s b"><img src="PHOTO"></div>
</body></html>"""


def main():
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        pg = b.new_page(viewport={"width": 1200, "height": 630})
        for name, c in CARDS.items():
            longest = max(len(c["l1"]), len(c["l2"]))
            size = min(76, 1060 // longest)  # delší titulek = menší písmo, aby se řádek nezalomil
            b1, b2 = c["brand"]
            # AgroCash / TechCash: první část tenčí, „Cash“ tučně (stejně jako ve wordmarku na webu)
            brand = (f"{b1}<i>{b2}</i>" if b1 == "Cash" else f"<i>{b1}</i>{b2}")
            html = (HTML.replace("VAR_DYN", c["dyn"]).replace("VAR_POS", c["pos"]).replace("SIZE", str(size))
                    .replace("B1<i>B2</i>", brand).replace("L1", c["l1"]).replace("L2", c["l2"]).replace("SUB", c["sub"])
                    .replace("PHOTO", (IMG / c["photo"]).as_uri()))
            tmp = ROOT / "tools" / "_og_tmp.html"
            tmp.write_text(html, encoding="utf8")
            pg.goto(tmp.as_uri(), wait_until="networkidle")
            pg.evaluate("document.fonts.ready")
            pg.wait_for_timeout(400)
            im = Image.open(io.BytesIO(pg.screenshot(type="png"))).convert("RGB")
            im.save(IMG / f"{name}.jpg", "JPEG", quality=86, optimize=True, progressive=True)
            print(f"{name}.jpg {im.size} {(IMG / (name + '.jpg')).stat().st_size // 1024} kB")
            tmp.unlink()
        b.close()


if __name__ == "__main__":
    main()
