# Sargotsav 2026 · MSM Kochi Branch

Website for Sargotsav 2026, the arts festival of MSM Kochi Branch with CIER.
Saturday 14 November 2026, QLS Panayappilly. Entries close 10 November.

## Pages

| Page | What it is |
| --- | --- |
| `index.html` | Landing page: paint balloons hit the wall, a brush sweeps it clean, the logo's pencil writes the logo, doodles of the competition items appear. English / മലയാളം. |
| `register.html` | Artist Pass registration form (Supabase backend). Reads `?lang=en` or `?lang=ml`. |
| `admin.html` | Organiser panel (login, counts, filters, CSV export). |

It is a static site: no build step is needed to host it. Upload the folder to any static host (Vercel, Netlify, GitHub Pages) with `index.html` at the root.

## Folder layout

```
index.html            landing page (generated)
register.html         registration form (generated)
admin.html            admin panel (generated)
assets/intro/         landing page CSS, JS, logo data, icons, share image
source/               form + admin sources, item list, database migration
source/intro/         landing page source and build script
```

## Editing

- **Landing page:** edit `source/intro/src.html`, then run `python source/intro/build_site.py source/intro .` from the repo root (needs Python 3 and Pillow). It rewrites `index.html` and `assets/intro/`.
- **Form and admin:** edit `source/form.src.html` / `source/admin.src.html`, then run `python source/build.py` from the repo root (or from anywhere; it needs only Python 3). It rewrites `register.html` and `admin.html` at the repo root. Don't hand-edit `register.html` or `admin.html`.

## Notes

- The landing page needs WebGL2 for the paint; without it, it shows a flat painted background.
- `?first` replays the full intro for returning visitors; `?lang=ml` opens in Malayalam.
- The Supabase URL and publishable key in `register.html` are meant to be public. Row-level security blocks public reads.

Contact: 92499 99743 (Sijad K.I), 8129090420 (Mayis Mahmood).
