// Sargotsav admin login.
// Checks that the email is on the admins list and that the password matches the shared
// ADMIN_PASSWORD secret (set in Supabase: Edge Functions → Secrets). The password never
// leaves the server. On success it returns a one-time token the panel exchanges for a session.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const MAX_FAILS = 5;          // per email or per IP
const WINDOW_MIN = 15;        // minutes

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function sha256(s: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
}
async function sameSecret(a: string, b: string) {
  const [x, y] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "method" });

  const secret = Deno.env.get("ADMIN_PASSWORD") ?? "";
  if (secret.length < 10) return json(503, { error: "password_not_set" });

  let email = "", password = "";
  try {
    const b = await req.json();
    email = String(b.email ?? "").trim().toLowerCase().slice(0, 200);
    password = String(b.password ?? "").slice(0, 200);
  } catch { return json(400, { error: "bad_request" }); }
  if (!email || !password) return json(400, { error: "bad_request" });

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const since = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();
  const [{ count: byEmail }, { count: byIp }] = await Promise.all([
    db.from("admin_login_attempts").select("id", { count: "exact", head: true }).eq("email", email).eq("ok", false).gte("at", since),
    db.from("admin_login_attempts").select("id", { count: "exact", head: true }).eq("ip", ip).eq("ok", false).gte("at", since),
  ]);
  if ((byEmail ?? 0) >= MAX_FAILS || (byIp ?? 0) >= MAX_FAILS * 2) return json(429, { error: "locked", minutes: WINDOW_MIN });

  const { data: adm } = await db.from("admins").select("email").eq("email", email).maybeSingle();
  const passOk = await sameSecret(password, secret);
  const ok = !!adm && passOk;
  await db.from("admin_login_attempts").insert({ email, ip, ok });
  if (!ok) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return json(401, { error: "invalid" });        // same answer for wrong email or wrong password
  }

  // Make sure an auth user exists for this admin, then issue a one-time sign-in token.
  const created = await db.auth.admin.createUser({ email, email_confirm: true });
  if (created.error && !/already|registered|exists/i.test(created.error.message)) return json(500, { error: "user" });
  const { data: link, error } = await db.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !link?.properties?.hashed_token) return json(500, { error: "token" });
  return json(200, { token_hash: link.properties.hashed_token });
});
