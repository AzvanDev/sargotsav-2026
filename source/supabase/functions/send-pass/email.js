// Builds the Artist Pass email (HTML + plain text) in English or Malayalam.
// Plain JS so it runs in the Edge Function (Deno) and in Node for previews.
// Email clients ignore most CSS, so this is table layout with inline styles, and the
// QR and logo are inline (cid:) images: Gmail blocks data: images and strips SVG.

const CAT = {
  en: { kids: "Kids", children: "Children", subjunior: "Sub-Junior", junior: "Junior", teens: "Teens" },
  ml: { kids: "കിഡ്‌സ്", children: "ചിൽഡ്രൻ", subjunior: "സബ്ജൂനിയർ", junior: "ജൂനിയർ", teens: "ടീൻസ്" },
};
const TXT = {
  en: {
    subject: (reg) => `Your Sargotsav 2026 Artist Pass · ${reg}`,
    pre: (n) => `${n} is registered. Show the QR code at the registration desk on 14 November.`,
    hello: (n) => `See you on stage, ${n}!`,
    intro: "Your registration for Sargotsav 2026 is confirmed. This is your Artist Pass.",
    passev: "SARGOTSAV 2026 · ARTIST PASS",
    regno: "Reg. no.", items: "Items",
    boys: "Boys", girls: "Girls",
    when: "Saturday 14 November 2026", where: "QLS Panayappilly",
    scan: "Show this QR code at the registration desk. An organiser scans it to mark you present.",
    open: "Open my pass", openHint: "Opens your pass in the browser, where you can save it as an image.",
    keep: "Keep this email. You don't need to print it; the QR on your phone screen is enough.",
    change: "To change items or for group items, call or WhatsApp 92499 99743 (Sijad K.I) or 81290 90420 (Mayis Mahmood).",
    foot: "Sargotsav · MSM Kochi Branch · CIER",
    why: "You got this email because this address was used to register for Sargotsav 2026.",
  },
  ml: {
    subject: (reg) => `സർഗോത്സവ് 2026 ആർട്ടിസ്റ്റ് പാസ് · ${reg}`,
    pre: (n) => `${n} രജിസ്റ്റർ ചെയ്തു. നവംബർ 14-ന് രജിസ്ട്രേഷൻ ഡെസ്കിൽ QR കോഡ് കാണിക്കുക.`,
    hello: (n) => `വേദിയിൽ കാണാം, ${n}!`,
    intro: "സർഗോത്സവ് 2026-ലെ നിങ്ങളുടെ രജിസ്ട്രേഷൻ ഉറപ്പായി. ഇതാണ് നിങ്ങളുടെ ആർട്ടിസ്റ്റ് പാസ്.",
    passev: "സർഗോത്സവ് 2026 · ആർട്ടിസ്റ്റ് പാസ്",
    regno: "രജി. നമ്പർ", items: "ഇനങ്ങൾ",
    boys: "ആൺ", girls: "പെൺ",
    when: "2026 നവംബർ 14 ശനി", where: "QLS പനയപ്പിള്ളി",
    scan: "രജിസ്ട്രേഷൻ ഡെസ്കിൽ ഈ QR കോഡ് കാണിക്കുക. സംഘാടകർ സ്കാൻ ചെയ്ത് ഹാജർ രേഖപ്പെടുത്തും.",
    open: "എന്റെ പാസ് തുറക്കുക", openHint: "ബ്രൗസറിൽ പാസ് തുറക്കും, അവിടെ ചിത്രമായി സേവ് ചെയ്യാം.",
    keep: "ഈ ഇമെയിൽ സൂക്ഷിക്കുക. പ്രിന്റ് എടുക്കേണ്ടതില്ല; ഫോണിലെ QR മതി.",
    change: "ഇനങ്ങൾ മാറ്റാനോ ഗ്രൂപ്പിനങ്ങൾക്കോ 92499 99743 (സിജാദ് കെ.ഐ), 81290 90420 (മായിസ് മഹമൂദ്) എന്നീ നമ്പറുകളിൽ വിളിക്കുക / വാട്‌സ്ആപ്പ് ചെയ്യുക.",
    foot: "സർഗോത്സവ് · MSM കൊച്ചി ശാഖ · CIER",
    why: "സർഗോത്സവ് 2026 രജിസ്ട്രേഷന് ഈ ഇമെയിൽ വിലാസം നൽകിയതുകൊണ്ടാണ് ഈ ഇമെയിൽ ലഭിച്ചത്.",
  },
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function catLabel(cat, gender, lang) {
  let s = CAT[lang][cat] || cat;
  if ((cat === "junior" || cat === "teens") && gender) s += " · " + TXT[lang][gender === "boy" ? "boys" : "girls"];
  return s;
}

/**
 * r: { name, reg_no, category, gender, lang }
 * items: [{ name, color }]
 * opts: { passUrl, qrSrc, logoSrc, logoW, logoH }  (qrSrc/logoSrc are "cid:qr" in real mail)
 */
export function buildEmail(r, items, opts) {
  const L = r.lang === "ml" ? "ml" : "en";
  const t = TXT[L];
  const first = r.name.split(" ")[0];
  const ml = L === "ml";
  const body = ml
    ? "'Baloo Chettan 2','Noto Sans Malayalam','Nirmala UI',Kartika,Arial,sans-serif"
    : "'Bricolage Grotesque','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const hand = ml ? body : "Caveat,'Segoe Print','Comic Sans MS',cursive";
  const cat = catLabel(r.category, r.gender, L);
  const stripe = ["#F57A22", "#308E40", "#4581CB", "#4F5BA3", "#E2246E"]
    .map((c) => `<td height="8" style="background:${c};font-size:0;line-height:0">&nbsp;</td>`).join("");

  const itemRows = items.map((it) => `
              <tr><td style="padding:3px 0;font-family:${body};font-size:16px;line-height:22px;color:#ffffff">
                <span style="display:inline-block;width:12px;height:12px;border-radius:6px;background:${it.color};margin-right:10px;vertical-align:-1px">&nbsp;</span>${esc(it.name)}
              </td></tr>`).join("");

  const html = `<!doctype html>
<html lang="${L}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light">
<title>${esc(t.subject(r.reg_no))}</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Caveat:wght@700&family=Baloo+Chettan+2:wght@600;800&display=swap" rel="stylesheet">
<style>
  body{margin:0;padding:0;background:#FFF8EC}
  a{color:#141414}
  @media (max-width:520px){ .wrap{width:100%!important} .pad{padding-left:18px!important;padding-right:18px!important} .nm{font-size:38px!important;line-height:40px!important} }
</style></head>
<body style="margin:0;padding:0;background:#FFF8EC">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#FFF8EC">${esc(t.pre(first))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFF8EC" style="background:#FFF8EC">
<tr><td align="center" style="padding:24px 12px 32px">
  <table role="presentation" class="wrap" width="520" cellpadding="0" cellspacing="0" border="0" style="width:520px;max-width:520px">

    <tr><td align="center" style="padding:4px 0 14px">
      <img src="${opts.logoSrc}" width="150" height="${Math.round(150 * opts.logoH / opts.logoW)}" alt="Sargotsav 2026" style="display:block;border:0;width:150px;height:auto">
    </td></tr>

    <tr><td class="pad" align="center" style="padding:0 24px 18px;font-family:${hand};font-size:${ml ? 26 : 36}px;line-height:${ml ? 34 : 38}px;font-weight:700;color:#141414">${esc(t.hello(first))}</td></tr>
    <tr><td class="pad" align="center" style="padding:0 30px 22px;font-family:${body};font-size:16px;line-height:24px;color:#4a443c">${esc(t.intro)}</td></tr>

    <!-- the pass -->
    <tr><td>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#141414" style="background:#141414;border-radius:20px;overflow:hidden;border-collapse:separate">
        <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${stripe}</tr></table></td></tr>
        <tr><td class="pad" style="padding:20px 26px 0">
          <div style="font-family:${body};font-size:12px;line-height:16px;letter-spacing:${ml ? 0 : 2}px;color:#d9d4cc;font-weight:600">${esc(t.passev)}</div>
          <div class="nm" style="font-family:${hand};font-size:${ml ? 30 : 46}px;line-height:${ml ? 40 : 48}px;font-weight:700;color:#ffffff;padding:8px 0 10px">${esc(r.name)}</div>
          <span style="display:inline-block;border:2px solid #FFC23A;color:#FFC23A;border-radius:7px;padding:2px 10px;font-family:${body};font-size:14px;line-height:20px;font-weight:800;${ml ? "" : "letter-spacing:1px;text-transform:uppercase;"}">${esc(cat)}</span>
        </td></tr>
        <tr><td class="pad" style="padding:16px 26px 6px">
          <div style="font-family:${body};font-size:12px;line-height:16px;color:#bdb6aa;font-weight:600;padding-bottom:4px">${esc(t.items)}</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">${itemRows}
          </table>
        </td></tr>
        <tr><td style="padding:14px 0 0"><div style="border-top:2px dashed #4d4d4d;font-size:0;line-height:0">&nbsp;</div></td></tr>
        <tr><td class="pad" style="padding:18px 26px 22px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="middle" style="font-family:${body};color:#ffffff">
              <div style="font-size:12px;line-height:16px;color:#bdb6aa;font-weight:600">${esc(t.regno)}</div>
              <div style="font-family:'Bricolage Grotesque','Segoe UI',Roboto,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;letter-spacing:1px;color:#ffffff;white-space:nowrap">${esc(r.reg_no)}</div>
              <div style="font-size:13px;line-height:19px;color:#d9d4cc;padding-top:10px">${esc(t.when)}<br>${esc(t.where)}</div>
            </td>
            <td valign="middle" align="right" width="150" style="width:150px">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background:#ffffff;border-radius:12px"><tr><td style="padding:6px">
                <img src="${opts.qrSrc}" width="132" height="132" alt="QR ${esc(r.reg_no)}" style="display:block;border:0;width:132px;height:132px;image-rendering:pixelated">
              </td></tr></table>
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>

    <tr><td class="pad" align="center" style="padding:20px 30px 6px;font-family:${body};font-size:15px;line-height:23px;color:#141414;font-weight:600">${esc(t.scan)}</td></tr>
    ${opts.passUrl ? `<tr><td align="center" style="padding:14px 0 4px">
      <a href="${esc(opts.passUrl)}" style="display:inline-block;background:#F57A22;color:#141414;border:2px solid #141414;border-radius:14px;padding:12px 26px;font-family:${body};font-size:16px;font-weight:800;text-decoration:none">${esc(t.open)}</a>
    </td></tr>
    <tr><td class="pad" align="center" style="padding:4px 30px 0;font-family:${body};font-size:13px;line-height:19px;color:#6b6358">${esc(t.openHint)}</td></tr>` : ""}
    <tr><td class="pad" align="center" style="padding:22px 30px 0;font-family:${body};font-size:14px;line-height:21px;color:#4a443c">${esc(t.keep)}<br><br>${esc(t.change)}</td></tr>
    <tr><td align="center" style="padding:26px 0 0"><table role="presentation" width="120" cellpadding="0" cellspacing="0" border="0"><tr>${stripe.replaceAll('height="8"', 'height="4"')}</tr></table></td></tr>
    <tr><td class="pad" align="center" style="padding:12px 30px 0;font-family:${body};font-size:13px;line-height:19px;color:#6b6358;font-weight:600">${esc(t.foot)}</td></tr>
    <tr><td class="pad" align="center" style="padding:6px 30px 0;font-family:${body};font-size:11px;line-height:16px;color:#9a9083">${esc(t.why)}</td></tr>
  </table>
</td></tr></table>
</body></html>`;

  const text = [
    t.hello(first), "", t.intro, "",
    `${t.passev}`, r.name, cat,
    `${t.regno}: ${r.reg_no}`,
    `${t.items}: ${items.map((i) => i.name).join(", ")}`,
    `${t.when} · ${t.where}`, "",
    t.scan, opts.passUrl ? `${t.open}: ${opts.passUrl}` : "", "",
    t.change, "", t.foot,
  ].join("\n");

  return { subject: t.subject(r.reg_no), html, text };
}
