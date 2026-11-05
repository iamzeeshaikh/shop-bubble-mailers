// Orders from /checkout/. Every line is re-priced here from order-data.js (the same per-product
// prices the product pages and their Offer schema print), so a tampered browser can never change
// what an order costs. The office gets the order (subject leads with the payment method); the buyer
// gets a confirmation copy. Spam signals only LABEL the email ("[Possible spam]"); they never refuse
// an order: no lead is ever dropped. Google's Storebot test orders are labelled the same way and go
// through like any other order. Same SMTP env vars as api/send-quote.js.
const nodemailer = require("nodemailer");
const {
  CATALOG, ORDER_PREFIX, UNIT, UNITS, money, unitPrice, normalizeQty, lineTotal,
  SHIP_COUNTRIES, COD_COUNTRIES, PAYMENT_METHODS,
} = require("../order-data.js");

const SITE = { name: "Shop Bubble Mailers", domain: "shopbubblemailers.com", url: "https://shopbubblemailers.com", phone: "(503) 461-4788", email: "Info@shopbubblemailers.com" };
const DEFAULT_TO = "dev@zeecustomboxes.com,shanimazhar82@gmail.com";
const HONEYPOT = "company_website";
const MAX_LINES = 30;
const MAX_TOTAL = 3.5 * 1024 * 1024;
const OK_TYPES = /^(image\/(png|jpe?g|gif|webp|svg\+xml)|application\/(pdf|postscript|illustrator|vnd\.adobe\.illustrator|zip|x-zip-compressed|octet-stream)|text\/plain)$/;

const env = (key, fallback = "") => { const v = process.env[key]; return typeof v === "string" ? v.trim() : fallback; };
const clean = (v, max = 500) => String(v ?? "").replace(/[\r\n]+/g, " ").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
const multi = (v, max = 3000) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || ""));
const n = (x) => x.toLocaleString("en-US");

const parseBody = (req) => {
  if (!req.body) return {};
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  return req.body;
};
const fail = (res, message, status) => res.status(status).json({ ok: false, error: message });

function orderRef() {
  const now = new Date();
  const ymd = `${String(now.getUTCFullYear()).slice(2)}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let tail = "";
  for (const byte of require("crypto").randomBytes(4)) tail += alphabet[byte % alphabet.length];
  return `${ORDER_PREFIX}-${ymd}-${tail}`;
}

// Soft per-instance rate limit: generous enough that a burst of Merchant Center test orders never trips it.
const hits = new Map();
const limited = (ip) => {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 40;
};

function attachments(files) {
  if (!Array.isArray(files)) return { list: [], note: "" };
  const list = []; let total = 0; const skipped = [];
  for (const f of files.slice(0, 5)) {
    const name = clean(f && f.name, 120).replace(/[^\w.\- ()]+/g, "_") || "artwork";
    const type = clean(f && f.type, 80) || "application/octet-stream";
    const data = String((f && f.data) || "").replace(/^data:[^,]*,/, "");
    const size = Math.floor((data.length * 3) / 4);
    if (!data || !OK_TYPES.test(type) || total + size > MAX_TOTAL) { skipped.push(name); continue; }
    total += size;
    list.push({ filename: name, content: data, encoding: "base64", contentType: type });
  }
  return { list, note: skipped.length ? `Files not attached (type or size): ${skipped.join(", ")}` : "" };
}

function transporter() {
  const host = env("SMTP_HOST"), user = env("SMTP_USER"), pass = env("SMTP_PASS");
  if (!host || !user || !pass) return null;
  const port = Number(env("SMTP_PORT", "587"));
  return nodemailer.createTransport({ host, port, secure: env("SMTP_SECURE").toLowerCase() === "true" || port === 465, auth: { user, pass } });
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ ok: false, error: "This endpoint accepts POST submissions from the checkout." }); }
  const d = parseBody(req);
  if (!d || typeof d !== "object" || !Object.keys(d).length) return fail(res, "We could not read the order. Please try again.", 400);

  const v = {
    name: clean(d.name, 120), company: clean(d.company, 140), email: clean(d.email, 160), phone: clean(d.phone, 40),
    country: clean(d.country, 2).toUpperCase(), address1: clean(d.address1, 200), address2: clean(d.address2, 200),
    city: clean(d.city, 100), region: clean(d.region, 60), postal: clean(d.postal, 20), payment: clean(d.payment, 12),
    notes: multi(d.notes), honeypot: clean(d[HONEYPOT], 200), submittedAt: Number(clean(d.submitted_at, 20)), page: clean(d.page, 300),
  };
  if (!v.name) return fail(res, "Please add your name.", 422);
  if (!isEmail(v.email)) return fail(res, "Please add a valid email address.", 422);
  if (!v.phone) return fail(res, "Please add a phone number.", 422);
  if (!v.address1 || !v.city || !v.postal) return fail(res, "Please fill in the delivery address.", 422);
  const country = SHIP_COUNTRIES.find((c) => c.code === v.country);
  if (!country) return fail(res, "Online orders ship to US addresses only. Send a quote request for other countries.", 422);
  const method = PAYMENT_METHODS.find((m) => m.id === v.payment) || PAYMENT_METHODS[0];
  if (method.id === "cod" && !COD_COUNTRIES.includes(country.code)) return fail(res, "Cash on delivery is available for US addresses. Choose PayPal invoice or bank transfer.", 422);

  // Never trust the browser's prices: rebuild every line from the catalog.
  let raw = d.items;
  if (typeof raw === "string") { try { raw = JSON.parse(raw || "[]"); } catch { raw = []; } }
  const lines = (Array.isArray(raw) ? raw : []).slice(0, MAX_LINES).map((e) => {
    const slug = clean(e && e.slug, 120), qty = normalizeQty(e && e.qty);
    return CATALOG[slug] && qty ? { slug, name: CATALOG[slug].name, unit: unitPrice(slug), url: `${SITE.url}/${slug}/`, qty, total: lineTotal(slug, qty) } : null;
  }).filter(Boolean);
  if (!lines.length) return fail(res, "Your order is empty. Choose a mailer first.", 422);
  const total = Math.round(lines.reduce((s, l) => s + l.total, 0) * 100) / 100;
  const units = lines.reduce((s, l) => s + l.qty, 0);

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return fail(res, `Too many orders from this connection. Please call ${SITE.phone}.`, 429);

  // Spam signals label the email; they never refuse the order.
  const ua = String(req.headers["user-agent"] || "");
  const spam = [];
  if (v.honeypot) spam.push("hidden field filled");
  if (v.submittedAt && Date.now() - v.submittedAt < 1500) spam.push("submitted under 1.5 seconds after the page loaded");
  if ((v.notes.match(/https?:\/\//gi) || []).length > 3) spam.push("more than three links in the notes");
  if (/storebot-google/i.test(ua) || /@(?:[\w-]+\.)*joonix\.net$/i.test(v.email) || /@storebotmail\./i.test(v.email)) spam.push("Google Merchant Center test order (Storebot)");
  const spamLine = spam.length ? `Spam check: ${spam.join("; ")}` : "";

  const att = attachments(d.files);
  const ref = orderRef();
  const address = [v.address1, v.address2, [v.city, v.region, v.postal].filter(Boolean).join(", "), country.name].filter(Boolean).join("\n");
  const payLine = method.id === "cod" ? "Cash on delivery: the customer pays when the mailers arrive" : `${method.name}: send the invoice after the customer approves the proof`;
  const itemText = lines.map((l) => `- ${l.name}: ${n(l.qty)} ${UNITS} at ${money(l.unit)} per ${UNIT}, ${money(l.total)}`).join("\n");

  const officeText = [
    `PAYMENT: ${payLine}`, spamLine, `Order ${ref}`, "", itemText,
    `Total: ${money(total)} for ${n(units)} ${UNITS}, free shipping`, "",
    `Name: ${v.name}`, v.company ? `Business: ${v.company}` : "", `Email: ${v.email}`, `Phone: ${v.phone}`, "", "Ship to:", address, "",
    v.notes ? `Notes: ${v.notes}` : "", att.note, att.list.length ? `Attached: ${att.list.map((f) => f.filename).join(", ")}` : "No artwork attached.",
    v.page ? `Submitted from: ${SITE.url}${v.page.startsWith("/") ? v.page : "/" + v.page}` : "", `Received: ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC`, `Site: ${SITE.domain}`,
  ].filter((x) => x !== "").join("\n");

  const steps = [
    "We check your order and artwork. Printed orders get a digital proof by email; nothing prints before you approve it.",
    method.detail,
    `Your order ships free to ${country.name} and we email the tracking number when it leaves. Errors, shortfalls and defects are made right under our custom order policy.`,
  ];
  const buyerText = [
    `Hi ${v.name},`, "", `Thank you for your order ${ref} with ${SITE.name}.`, "", itemText, "Shipping: free", `Total: ${money(total)}`, `Payment: ${method.name}`, "",
    "What happens next:", ...steps.map((s, i) => `${i + 1}. ${s}`), "", "Ship to:", address, "",
    `Questions? Call ${SITE.phone} or reply to this email and quote your order number.`, SITE.name, SITE.url,
  ].join("\n");

  // ORDER_DRY_RUN=1 (local QA only) skips the SMTP send and still returns a real order number.
  if (process.env.ORDER_DRY_RUN === "1") {
    console.log("[order] dry run", ref, money(total), method.id, country.code, spamLine || "clean");
    return res.status(200).json({ ok: true, ref, total, payment: method.id, dryRun: true });
  }
  const t = transporter();
  if (!t) {
    console.error("[order] SMTP not configured; order text follows\n" + officeText);
    return fail(res, `Our mail service is temporarily unavailable. Please call ${SITE.phone} or email ${SITE.email} and we will take the order by hand.`, 503);
  }
  const fromName = env("SMTP_FROM_NAME") || SITE.name;
  const fromEmail = env("SMTP_FROM_EMAIL") || env("SMTP_FROM") || env("SMTP_USER");
  const from = fromEmail.includes("<") ? fromEmail : `"${fromName}" <${fromEmail}>`;
  const to = env("SMTP_TO") || DEFAULT_TO;
  try {
    await t.sendMail({ from, to, replyTo: v.email, subject: `${spam.length ? "[Possible spam] " : ""}New order ${ref}: ${money(total)}, ${method.name} | ${SITE.domain}`, text: officeText, attachments: att.list });
  } catch (e) {
    console.error("[order] office send failed", ref, e);
    return fail(res, `We could not send your order just now. Please try again, or call ${SITE.phone}.`, 502);
  }
  // The buyer's copy is a courtesy; if it fails the order still stands.
  try { await t.sendMail({ from, to: v.email, subject: `Your order ${ref} with ${SITE.name}`, text: buyerText }); } catch (e) { console.error("[order] buyer copy failed", ref, e); }
  console.log("[order] accepted", ref, money(total), `${units} ${UNITS}`, method.id, country.code, spamLine || "clean");
  return res.status(200).json({ ok: true, ref, total, payment: method.id });
};
