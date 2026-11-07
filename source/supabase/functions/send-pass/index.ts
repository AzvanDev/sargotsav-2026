// Sargotsav: email the Artist Pass with its check-in QR.
// The form calls this right after register_entry succeeds, with the new pass token.
// The token is the only key: the email always goes to the address stored with that registration,
// so nobody can use this to send mail to an address of their choosing.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   GMAIL_USER          the Gmail address that sends the passes, e.g. msm.sargotsav@gmail.com
//   GMAIL_APP_PASSWORD  a 16-letter Google app password for that account (not its normal password)
//   SITE_URL            optional, the site's address, e.g. https://sargotsav.vercel.app
//                       (without it, links use the address of the page that called this)
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import nodemailer from "npm:nodemailer@6.9.16";
import qrcode from "npm:qrcode-generator@1.4.4";
import { buildEmail } from "./email.js";
import { LOGO_PNG_B64, LOGO_W, LOGO_H } from "./logo.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const COLORS = ["#FFC23A", "#9DD1C0", "#F57A22", "#E2246E", "#4581CB", "#308E40", "#F14F3A", "#4F5BA3", "#2B7D60"];
const MAX_SENDS = 5;      // per registration, ever
const GAP_SECONDS = 60;   // between two sends of the same pass

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

function siteBase(req: Request) {
  const env = (Deno.env.get("SITE_URL") ?? "").trim().replace(/\/+$/, "");
  if (env) return env;
  const o = req.headers.get("origin") ?? "";
  if (/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(o)) return o;
  const ref = req.headers.get("referer") ?? "";
  const m = ref.match(/^(https?:\/\/[^?#]+\/)/i);
  return m ? m[1].replace(/\/+$/, "") : "";
}

// What the QR says. Any phone camera opens the check-in page; the scanner page also reads it.
const checkinUrl = (base: string, token: string) => base ? `${base}/checkin.html?t=${token}` : `SARGOTSAV:${token}`;

function qrGifBase64(text: string) {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const cell = Math.max(4, Math.floor(264 / (n + 8)));
  return qr.createDataURL(cell, cell * 4).split(",")[1]; // GIF with a white quiet zone
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "method" });

  let token = "";
  try { token = String((await req.json()).token ?? "").trim(); } catch { return json(400, { error: "bad_request" }); }
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return json(400, { error: "bad_request" });

  const user = Deno.env.get("GMAIL_USER") ?? "";
  const pass = (Deno.env.get("GMAIL_APP_PASSWORD") ?? "").replace(/\s+/g, "");
  if (!user || pass.length < 16) return json(503, { error: "email_not_set" });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: r } = await db.from("registrations")
    .select("id, reg_no, name, email, category, gender, items, lang, email_sent_at, email_sends")
    .eq("checkin_token", token).maybeSingle();
  if (!r) return json(404, { error: "not_found" });
  if ((r.email_sends ?? 0) >= MAX_SENDS) return json(429, { error: "too_many" });
  if (r.email_sent_at && Date.now() - new Date(r.email_sent_at).getTime() < GAP_SECONDS * 1000) {
    return json(429, { error: "too_soon" });
  }

  const { data: catItems } = await db.from("items").select("code, name_en, name_ml, sort")
    .eq("category", r.category).order("sort");
  const list = (catItems ?? []);
  const items = (r.items as string[]).map((code) => {
    const i = list.findIndex((x) => x.code === code);
    const it = list[i];
    return { name: it ? (r.lang === "ml" ? it.name_ml : it.name_en) : code, color: COLORS[(i < 0 ? 0 : i) % COLORS.length] };
  });

  const base = siteBase(req);
  const passUrl = base ? `${base}/register.html?pass=${token}${r.lang === "ml" ? "&lang=ml" : ""}` : "";
  const mail = buildEmail(r, items, { passUrl, qrSrc: "cid:qr", logoSrc: "cid:logo", logoW: LOGO_W, logoH: LOGO_H });

  // claim the send first so two quick calls can't both send
  await db.from("registrations").update({ email_sent_at: new Date().toISOString(), email_sends: (r.email_sends ?? 0) + 1 }).eq("id", r.id);

  try {
    const tx = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass } });
    await tx.sendMail({
      from: { name: r.lang === "ml" ? "സർഗോത്സവ് 2026" : "Sargotsav 2026", address: user },
      to: r.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      attachments: [
        { filename: `Sargotsav-${r.reg_no}-QR.gif`, content: qrGifBase64(checkinUrl(base, token)), encoding: "base64", cid: "qr" },
        { filename: "sargotsav.png", content: LOGO_PNG_B64, encoding: "base64", cid: "logo" },
      ],
    });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e).slice(0, 300);
    // keep the try counted, but let the family retry straight away
    await db.from("registrations").update({ email_error: msg, email_sent_at: r.email_sent_at }).eq("id", r.id);
    return json(502, { error: "send_failed" });
  }
  await db.from("registrations").update({ email_error: null }).eq("id", r.id);

  const [u, d] = String(r.email).split("@");
  return json(200, { ok: true, to: `${u.slice(0, 2)}${"•".repeat(Math.max(1, u.length - 2))}@${d}` });
});
