# Sargotsav 2026 · MSM Kochi Branch

Website for Sargotsav 2026, the arts festival of MSM Kochi Branch with CIER.
Saturday 14 November 2026, QLS Panayappilly. Entries close 14 November.

## Pages

| Page | What it is |
| --- | --- |
| `index.html` | Landing page: paint balloons hit the wall, a brush sweeps it clean, the logo's pencil writes the logo, doodles of the competition items appear. English / മലയാളം. |
| `register.html` | Artist Pass registration form (Supabase backend). Reads `?lang=en` or `?lang=ml`. |
| `admin.html` | Organiser desk: overview, contestants with their events and contact details, per-event lists, CSV downloads, and the admin list. |
| `checkin.html` | Check-in desk for the day: admins sign in, scan the QR on each Artist Pass with their phone camera (or type a reg. no.) and mark the contestant present. |

It is a static site: no build step is needed to host it. Upload the folder to any static host (Vercel, Netlify, GitHub Pages) with `index.html` at the root.

## Folder layout

```
index.html            landing page (generated)
register.html         registration form (generated)
admin.html            admin panel (generated)
assets/intro/         landing page CSS, JS, logo data, icons, share image
source/               form + admin sources, item list
source/supabase/      database schema, admin setup SQL, check-in SQL, admin-login and send-pass Edge Functions
source/intro/         landing page source and build script
```

## Editing

- **Landing page:** edit `source/intro/src.html`, then run `python source/intro/build_site.py source/intro .` from the repo root (needs Python 3 and Pillow). It rewrites `index.html` and `assets/intro/`.
- **Form, admin and check-in:** edit `source/form.src.html` / `source/admin.src.html` / `source/checkin.src.html`, then run `python source/build.py` from the repo root (or from anywhere; it needs only Python 3). It rewrites `register.html`, `admin.html` and `checkin.html` at the repo root. Don't hand-edit those three.

## Notes

- The landing page needs WebGL2 for the paint; without it, it shows a flat painted background.
- `?first` replays the full intro for returning visitors; `?lang=ml` opens in Malayalam.
- Live site: https://sargotsav-2026-kochi.vercel.app. `vercel.json` turns on clean URLs, so `/register`, `/admin` and `/checkin` work and the `.html` links forward to them. `.vercelignore` keeps `source/` and this README off the site.
- The Supabase URL and publishable key in `register.html` and `admin.html` are meant to be public. Row-level security blocks public reads; the public can only add an entry through the `register_entry` function, which re-checks age, items and duplicates.

## Admin sign-in

- Admins sign in with their own email plus one shared password. The password lives only in Supabase as the Edge Function secret `ADMIN_PASSWORD` (Edge Functions → Secrets, 10+ characters). It is never in this repo, the pages or the database.
- The `admin-login` Edge Function (`source/supabase/functions/admin-login/`) checks the email against the `admins` table and the password against the secret, then hands back a one-time sign-in token. After 5 wrong tries an email is locked for 15 minutes.
- `azvan2073@gmail.com` is the owner and can't be removed. Admins add or remove other emails on the Admins page. Removing an email stops that person seeing entries, even if they know the password.
- To change the password, edit the `ADMIN_PASSWORD` secret.

## Emailed pass and check-in

- After a successful registration the form calls the `send-pass` Edge Function, which emails the Artist Pass (English or Malayalam, whichever the form was in) with a QR code to the address on the registration. The pass on the thank-you screen and the saved image carry the same QR.
- The QR holds only a random 24-character token (`registrations.checkin_token`) inside a link to `checkin.html`, never the name, phone or date of birth. The email's "Open my pass" button opens `register.html?pass=<token>`.
- Organisers open `checkin.html` on their phones, sign in like on the admin desk, tap **Start scanning**, and press **Mark present**. Scanning the same pass again shows **Already checked in** with the time and who did it. Mistakes can be undone. A phone's own camera app also works: the QR link opens the check-in page directly.
- Setup, once: run `source/supabase/checkin.sql` in the SQL Editor, deploy `source/supabase/functions/send-pass`, and add the Edge Function secrets `GMAIL_USER` (the sending Gmail address) and `GMAIL_APP_PASSWORD` (a Google app password for it; needs 2-Step Verification on that account). Optional: `SITE_URL`, the site's address, e.g. `https://sargotsav.vercel.app`; without it links use the address of the page that registered.
- Each pass can be emailed at most 5 times, at least a minute apart. A failed send is recorded in `registrations.email_error`.

Contact: 92499 99743 (Sijad K.I), 8129090420 (Mayis Mahmood).
