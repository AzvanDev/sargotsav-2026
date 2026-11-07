# Sargotsav 2026 · MSM Kochi Branch

Website for Sargotsav 2026, the arts festival of MSM Kochi Branch with CIER.
Saturday 14 November 2026, QLS Panayappilly. Entries close 10 November.

## Pages

| Page | What it is |
| --- | --- |
| `index.html` | Landing page: paint balloons hit the wall, a brush sweeps it clean, the logo's pencil writes the logo, doodles of the competition items appear. English / മലയാളം. |
| `register.html` | Artist Pass registration form (Supabase backend). Reads `?lang=en` or `?lang=ml`. |
| `admin.html` | Organiser desk: overview, contestants with their events and contact details, per-event lists, CSV downloads, and the admin list. |

It is a static site: no build step is needed to host it. Upload the folder to any static host (Vercel, Netlify, GitHub Pages) with `index.html` at the root.

## Folder layout

```
index.html            landing page (generated)
register.html         registration form (generated)
admin.html            admin panel (generated)
assets/intro/         landing page CSS, JS, logo data, icons, share image
source/               form + admin sources, item list
source/supabase/      database schema, admin setup SQL, admin-login Edge Function
source/intro/         landing page source and build script
```

## Editing

- **Landing page:** edit `source/intro/src.html`, then run `python source/intro/build_site.py source/intro .` from the repo root (needs Python 3 and Pillow). It rewrites `index.html` and `assets/intro/`.
- **Form and admin:** edit `source/form.src.html` / `source/admin.src.html`, then run `python source/build.py` from the repo root (or from anywhere; it needs only Python 3). It rewrites `register.html` and `admin.html` at the repo root. Don't hand-edit `register.html` or `admin.html`.

## Notes

- The landing page needs WebGL2 for the paint; without it, it shows a flat painted background.
- `?first` replays the full intro for returning visitors; `?lang=ml` opens in Malayalam.
- The Supabase URL and publishable key in `register.html` and `admin.html` are meant to be public. Row-level security blocks public reads; the public can only add an entry through the `register_entry` function, which re-checks age, items and duplicates.

## Admin sign-in

- Admins sign in with their own email plus one shared password. The password lives only in Supabase as the Edge Function secret `ADMIN_PASSWORD` (Edge Functions → Secrets, 10+ characters). It is never in this repo, the pages or the database.
- The `admin-login` Edge Function (`source/supabase/functions/admin-login/`) checks the email against the `admins` table and the password against the secret, then hands back a one-time sign-in token. After 5 wrong tries an email is locked for 15 minutes.
- `azvan2073@gmail.com` is the owner and can't be removed. Admins add or remove other emails on the Admins page. Removing an email stops that person seeing entries, even if they know the password.
- To change the password, edit the `ADMIN_PASSWORD` secret.

Contact: 92499 99743 (Sijad K.I), 8129090420 (Mayis Mahmood).
