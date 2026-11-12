#!/usr/bin/env python3
"""Fotografie webu CashAuto (design v6 „Signál“) — generátor a export.

Použití:
  python tools/gen-images.py --list                 # vypíše sloty
  python tools/gen-images.py hero-auto story-keys   # vygeneruje vybrané sloty
  python tools/gen-images.py --all                  # vygeneruje vše, co ještě nemá surový soubor
  python tools/gen-images.py --export               # ze surových souborů udělá responzivní WebP do assets/img
  python tools/gen-images.py --force hero-auto      # přegeneruje i existující surový soubor

Klíč se čte z proměnné prostředí GEMINI_API_KEY nebo ze souboru .env v kořeni projektu
(soubor .env se necommituje). Klíč se posílá jen v hlavičce požadavku, nikdy v URL.
Surové výstupy (PNG/JPEG) se ukládají MIMO repozitář (--raw-dir, výchozí systémový temp).
"""
import argparse, base64, json, os, sys, tempfile, time, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "img"
MODEL = os.environ.get("IMG_MODEL", "gemini-nano-banana-2.1")
API = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

STYLE = (
    "Documentary editorial photograph, 35mm lens, natural available light, candid un-posed moment, "
    "real-looking people with natural skin texture, Czech small-town or countryside setting, "
    "slightly desaturated muted earthy colour grade with ONE vivid accent colour physically present in the scene: {accent}. "
    "Shallow depth of field, subtle film grain, honest working atmosphere. "
    "Strictly no text, no lettering, no logos, no brand badges, no signage, no watermarks; "
    "vehicles are plain and unbranded with no visible number plates (plate out of frame, hidden or turned away). "
    "Adults at work only."
)
ACCENT = {
    "auto": "fluorescent yellow-green (hi-vis lime, like a reflective safety vest)",
    "agro": "warm harvest gold-yellow (ripe grain, mustard-yellow workwear)",
    "tech": "signal orange (orange hi-vis vest, traffic cones, orange straps)",
}

# slot: (vertical, aspect, export widths, prompt)
SLOTS = {
    # ---------- CashAuto (reflexní žlutozelená) ----------
    "hero-auto": ("auto", "4:3", (1600, 800),
        "A Czech tradesman in his forties wearing a fluorescent yellow-green hi-vis vest over a grey work hoodie, "
        "lifting a toolbox into the open sliding side door of a tidy, well-kept, recent-model plain white panel van parked in a clean "
        "cobbled workshop yard with a brick wall and a wooden workshop door, soft warm early-morning sun. He looks at his tools, not at "
        "the camera. The van is seen exactly side-on and the frame is cropped to its middle section: the cab door and the open sliding "
        "door only - the front grille and the rear doors are both outside the frame. Generous calm space on the left of the frame."),
    "story-phone": ("auto", "3:4", (900, 540),
        "Vertical close candid shot in a joinery workshop: a carpenter's sawdust-dusted hands holding a smartphone seen from behind "
        "and slightly from the side so the screen is not readable, a workbench with paper invoices, a pencil and van keys, "
        "a fluorescent yellow-green hi-vis vest hanging on a hook in the soft-focus background, window light."),
    "story-technik": ("auto", "3:4", (900, 540),
        "Vertical shot in a workshop yard: a vehicle inspector in a dark work jacket and a fluorescent yellow-green hi-vis vest "
        "crouching by the front wheel of a plain white panel van, holding a tablet turned away from camera and checking the tyre, "
        "while the van's owner, a tradesman in work trousers, stands nearby holding a mug. Overcast daylight."),
    "story-keys": ("auto", "3:4", (900, 540),
        "Vertical portrait: a woman in her thirties, a painter-decorator in white paint-flecked work overalls, leaning relaxed against "
        "the driver's door of a plain white panel van and holding the van keys, a ladder on the roof rack tied with a "
        "fluorescent yellow-green ratchet strap, quiet small-town street behind her, soft afternoon light, natural half-smile, "
        "looking off-camera."),
    "cta-auto": ("auto", "4:3", (1200, 640),
        "End of the working day on a small construction site: a tradesman in a fluorescent yellow-green hi-vis vest closing the rear "
        "doors of a plain white panel van, keys in his hand, warm low golden-hour sun, scaffolding softly blurred behind, relaxed posture."),
    "blog-ucetni": ("auto", "16:9", (1280, 640),
        "Over-the-shoulder view at an office desk: an accountant and a tradesman in a work fleece going through paper invoices, "
        "a calculator, a closed folder and a laptop seen from behind; a fluorescent yellow-green highlighter marker and matching "
        "sticky notes on the desk; natural window light."),
    "blog-cashflow": ("auto", "16:9", (1280, 640),
        "Close shot of a workbench in a tradesman's workshop: a stack of paper invoices held by a bulldog clip, a wall calendar page "
        "without readable writing, van keys and a cordless drill; a hand holding a fluorescent yellow-green highlighter marking the paper. "
        "Shallow depth of field, daylight from a window."),
    "blog-srovnani": ("auto", "16:9", (1280, 640),
        "A plain white work van seen exactly side-on in profile, parked in front of a small workshop with an open roller door; "
        "the frame crops off the very front and very rear of the van. A tradesman in a fluorescent yellow-green hi-vis vest stands "
        "beside it with arms crossed, looking thoughtfully at the van. Wide shot, bright overcast morning, cobbled yard."),
    "blog-oceneni": ("auto", "16:9", (1280, 640),
        "Close-up of an inspector's hands measuring tyre tread depth with a small metal gauge on the wheel of a white van; "
        "the cuff of a fluorescent yellow-green hi-vis jacket visible on the wrist; a clipboard resting on the ground. Shallow depth of field."),
    # ---------- AgroCash (sklizňová zlatá) ----------
    "hero-agro": ("agro", "4:3", (1600, 800),
        "A Czech farmer in his fifties in a worn mustard-yellow work jacket standing at the edge of a ripe golden barley field next to "
        "a large modern dark-grey tractor with no badges, one hand on the tractor's step, looking out across the field at sunrise, "
        "low warm sun and light mist. Generous empty sky on the left of the frame."),
    "agro-story-osivo": ("agro", "3:4", (900, 540),
        "Vertical close shot in a barn: a farmer's weathered hands scooping golden wheat seed from an open plain paper sack, "
        "grain running through the fingers, shaft of warm light with dust in the air, mustard-yellow sleeve cuffs."),
    "agro-story-seti": ("agro", "3:4", (900, 540),
        "Vertical shot of a dark-grey unbranded tractor pulling a seed drill across a tilled spring field at low sun, a plume of golden "
        "backlit dust behind it, a line of bare trees on the horizon."),
    "agro-story-stul": ("agro", "3:4", (900, 540),
        "Vertical shot: a farmer in a checked shirt sitting at a plain wooden table in a farm office with a laptop seen from behind, "
        "paper invoices and a mug, planning the season with a pencil in hand; a mustard-yellow work jacket hangs on the chair; "
        "window with a view of a farmyard softly blurred."),
    "agro-machines": ("agro", "4:3", (1200, 640),
        "A dark-grey unbranded combine harvester cutting a golden wheat field with a tractor and grain trailer driving alongside, "
        "dust glowing in late-afternoon sun, wide documentary shot from the stubble."),
    "blog-agro-sezona": ("agro", "16:9", (1280, 640),
        "Wide shot at dawn: a dark-grey unbranded tractor standing on a farm track beside a farmyard barn before the season starts, "
        "golden first light across frosty stubble, a farmer in a mustard-yellow jacket walking towards it carrying a toolbox."),
    # ---------- TechCash (signální oranžová) ----------
    "hero-tech": ("tech", "4:3", (1600, 800),
        "A haulage company owner in his forties wearing a signal-orange hi-vis vest over a dark jacket, standing beside the cab of a "
        "plain white unbranded articulated lorry tractor unit in a depot yard at dawn, holding a clipboard, trailers lined up behind, "
        "wet asphalt with painted lane markings reflecting the light. Generous empty space on the left of the frame."),
    "tech-story-dalnice": ("tech", "3:4", (900, 540),
        "Vertical shot of a plain white articulated lorry driving away from camera on a motorway at dusk, orange sunset glow on the "
        "horizon and reflecting off the trailer, white dashed lane markings leading into the distance, slight motion blur on the road."),
    "tech-story-dispecer": ("tech", "3:4", (900, 540),
        "Vertical shot in a small haulage office: a dispatcher wearing a headset at a desk with two monitors seen from behind and "
        "out of focus, a signal-orange hi-vis vest hanging over the chair, a wall map with coloured pins softly blurred, morning light "
        "through blinds."),
    "tech-story-nafta": ("tech", "3:4", (900, 540),
        "Vertical shot at a depot fuel pump at dawn: a lorry driver in a signal-orange hi-vis vest and work gloves refuelling the tank of "
        "a white unbranded tractor unit, breath visible in the cold air, wet ground."),
    "tech-fleet": ("tech", "4:3", (1200, 640),
        "A row of plain white articulated lorry box trailers seen from behind at a three-quarter angle, rear doors closed and blank, "
        "parked in a line in a depot yard in morning mist; no cab fronts visible. A line of signal-orange traffic cones in the "
        "foreground on wet asphalt with painted lane markings, low sun flaring between the trailers."),
    "blog-tech-faktury": ("tech", "16:9", (1280, 640),
        "A haulage office desk by a window: a stack of paper consignment notes and invoices with no readable writing, lorry keys, "
        "a signal-orange highlighter pen and a mug; through the window, heavily blurred plain white box trailers seen side-on in the yard."),
}


def api_key():
    k = os.environ.get("GEMINI_API_KEY")
    if k:
        return k.strip()
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf8").splitlines():
            if line.strip().startswith("GEMINI_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"')
    sys.exit("Chybí GEMINI_API_KEY (proměnná prostředí nebo .env).")


def generate(slot, raw_dir, force=False, extra=""):
    vertical, aspect, _, prompt = SLOTS[slot]
    existing = sorted(raw_dir.glob(slot + ".*"))
    if existing and not force:
        print(f"= {slot}: surový soubor už existuje ({existing[0].name})")
        return existing[0]
    text = STYLE.format(accent=ACCENT[vertical]) + " Scene: " + prompt + (" " + extra if extra else "")
    body = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": aspect, "imageSize": "2K"}},
    }
    req = urllib.request.Request(
        API.format(model=MODEL), data=json.dumps(body).encode("utf8"),
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key()}, method="POST")
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.load(r)
    except urllib.error.HTTPError as e:
        print(f"! {slot}: HTTP {e.code} {e.read().decode('utf8', 'replace')[:600]}")
        return None
    for cand in data.get("candidates", []):
        for part in (cand.get("content") or {}).get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                ext = ".png" if "png" in inline.get("mimeType", inline.get("mime_type", "")) else ".jpg"
                for old in existing:
                    old.unlink()
                path = raw_dir / (slot + ext)
                path.write_bytes(base64.b64decode(inline["data"]))
                print(f"+ {slot}: {path.name} ({path.stat().st_size // 1024} kB, {time.time() - t0:.0f} s)")
                return path
    print(f"! {slot}: odpověď bez obrázku: {json.dumps(data)[:500]}")
    return None


def export(raw_dir, only=None):
    from PIL import Image
    OUT.mkdir(parents=True, exist_ok=True)
    for slot, (_, _, widths, _) in SLOTS.items():
        if only and slot not in only:
            continue
        src = sorted(raw_dir.glob(slot + ".*"))
        if not src:
            print(f"- {slot}: chybí surový soubor")
            continue
        im = Image.open(src[0]).convert("RGB")
        for i, w in enumerate(widths):
            h = round(im.height * w / im.width)
            name = slot + (".webp" if i == 0 else f"-{w}.webp")
            im.resize((w, h), Image.LANCZOS).save(OUT / name, "WEBP", quality=78 if i == 0 else 74, method=6)
            print(f"  {name}: {w}x{h}, {(OUT / name).stat().st_size // 1024} kB")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("slots", nargs="*")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--export", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--extra", default="", help="doplněk promptu pro přegenerování")
    ap.add_argument("--raw-dir", default=str(Path(tempfile.gettempdir()) / "cashauto-img-raw"))
    a = ap.parse_args()
    raw = Path(a.raw_dir)
    raw.mkdir(parents=True, exist_ok=True)
    if a.list:
        for s, (v, asp, w, _) in SLOTS.items():
            print(f"{s:22} {v:5} {asp:5} {w}")
        sys.exit()
    todo = list(SLOTS) if a.all else a.slots
    for s in todo:
        if s not in SLOTS:
            sys.exit(f"Neznámý slot: {s}")
        generate(s, raw, a.force, a.extra)
    if a.export:
        export(raw, set(a.slots) if a.slots else None)
