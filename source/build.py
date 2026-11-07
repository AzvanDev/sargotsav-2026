"""Build the registration form and admin panel.

Run from anywhere:  python source/build.py
Reads form.src.html, admin.src.html, checkin.src.html, items.json and logo.webp from this folder (source/)
and writes register.html, admin.html and checkin.html to the site root (the parent folder).
"""
import base64
from pathlib import Path

SRC = Path(__file__).resolve().parent
ROOT = SRC.parent

logo = base64.b64encode((SRC / "logo.webp").read_bytes()).decode()
items = (SRC / "items.json").read_text(encoding="utf-8")

for src, out in [("form.src.html", "register.html"), ("admin.src.html", "admin.html"), ("checkin.src.html", "checkin.html")]:
    html = (SRC / src).read_text(encoding="utf-8")
    (ROOT / out).write_text(html.replace("__LOGO__", logo).replace("__ITEMS__", items), encoding="utf-8")
    print("built", ROOT / out)
