const nodemailer = require("nodemailer");

const requiredEnv = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS"
];

const parseBody = (req) => {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
};

const envValue = (key, fallback = "") => {
  const value = process.env[key];
  if (typeof value !== "string") return fallback;
  return value.trim();
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const MAX_ARTWORK_BYTES = 3.5 * 1024 * 1024;
const ARTWORK_TYPES = /^(image\/(png|jpe?g|gif|webp|svg\+xml|tiff)|application\/(pdf|postscript|illustrator|vnd\.adobe\.illustrator|zip|x-zip-compressed|octet-stream)|text\/plain)$/;

// Turns the base64 file the form sends into a nodemailer attachment.
// Returns null when there is no usable file, so the email can say why.
const artworkAttachment = (file, fallbackName) => {
  if (!file || typeof file !== "object") return null;
  const data = String(file.data || "").replace(/^data:[^,]*,/, "");
  if (!data) return null;
  const size = Math.floor((data.length * 3) / 4);
  const type = String(file.type || "application/octet-stream").slice(0, 80);
  if (size > MAX_ARTWORK_BYTES || !ARTWORK_TYPES.test(type)) return null;
  const filename =
    String(file.name || fallbackName || "artwork")
      .slice(0, 120)
      .replace(/[^\w.\- ()]+/g, "_") || "artwork";
  return { filename, content: data, encoding: "base64", contentType: type };
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error("SMTP config missing", { missing });
    return res.status(500).json({
      error: `SMTP is not configured. Missing environment variables: ${missing.join(", ")}`
    });
  }

  const body = parseBody(req);
  const name = body.Name || body.name || "";
  const email = body.Email || body.email || "";
  const phone = body.Phone || body.phone || "";
  const product = body["Product Interested In"] || body.product || "";
  const quantity = body.Quantity || body.quantity || "";
  const size = body.Size || body.size || "";
  const message = body.Message || body.message || body.Notes || "";
  const company = body.Company || body.company || "";
  const configuration = body.Configuration || body.configuration || "";
  const page = body.Page || body.page || "https://shopbubblemailers.com/";
  const rawSubject = body.form_subject || "Quote request — Bubble Mailers";
  // Always name the domain in the subject so the lead inbox can attribute it.
  const subject = /shopbubblemailers\.com/i.test(rawSubject) ? rawSubject : `${rawSubject} — shopbubblemailers.com`;
  const attachmentName = String(body.attachmentName || "").slice(0, 160);
  const attachmentSize = Number(body.attachmentSize) || 0;
  const artwork = artworkAttachment(body.attachment, attachmentName);

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required." });
  }

  const host = envValue("SMTP_HOST");
  const port = Number(envValue("SMTP_PORT", "587"));
  const smtpUser = envValue("SMTP_USER");
  const smtpPass = envValue("SMTP_PASS");
  const fromName = envValue("SMTP_FROM_NAME") || "Shop Bubble Mailers";
  const fromEmail = envValue("SMTP_FROM_EMAIL") || envValue("SMTP_FROM") || smtpUser;
  const smtpFrom = fromEmail.includes("<") ? fromEmail : `"${fromName}" <${fromEmail}>`;
  const smtpTo = envValue("SMTP_TO") || smtpUser;
  const secure =
    String(envValue("SMTP_SECURE")).toLowerCase() === "true" || port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  const rows = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone],
    ["Company", company],
    ["Product Interested In", product],
    ["Quantity", quantity],
    ["Size", size],
    ["Configuration", configuration],
    ["Submitted from", page],
    ["Website", "shopbubblemailers.com"],
    ["Artwork Filename", attachmentName || "No file attached"],
    ["Message", message || "No additional message provided"]
  ].filter(([, value]) => String(value ?? "").trim() !== "");

  const artworkNote = !attachmentName
    ? ""
    : artwork
      ? "The customer's artwork is attached to this email."
      : `The customer selected an artwork file (${attachmentName}${attachmentSize ? `, ${(attachmentSize / 1048576).toFixed(1)} MB` : ""}) but it was too large or not a supported type to attach. Ask the customer to email it.`;

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1f2c3b;line-height:1.6">
      <h2 style="margin:0 0 16px">New Quote Request</h2>
      <table style="width:100%;border-collapse:collapse">
        <tbody>
          ${rows
            .map(
              ([label, value]) => `
                <tr>
                  <td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:700;background:#f8fafc;width:220px">${escapeHtml(label)}</td>
                  <td style="padding:10px 12px;border:1px solid #e5e7eb">${escapeHtml(value)}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
      ${artworkNote ? `<p style="margin-top:16px">${escapeHtml(artworkNote)}</p>` : ""}
    </div>
  `;

  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n") + (artworkNote ? `\n\n${artworkNote}` : "");

  try {
    console.log("Quote request SMTP verify start", {
      host,
      port,
      secure,
      smtpUser,
      smtpFrom,
      smtpTo
    });

    await transporter.verify();

    await transporter.sendMail({
      from: smtpFrom,
      to: smtpTo,
      replyTo: email,
      subject,
      text,
      html,
      attachments: artwork ? [artwork] : []
    });

    console.log("Quote request SMTP send success", {
      smtpTo,
      product,
      email,
      artworkAttached: Boolean(artwork)
    });

    return res.status(200).json({
      ok: true,
      message: "Your quote request has been sent. We will reply shortly."
    });
  } catch (error) {
    console.error("Quote request SMTP send failed", {
      message: error?.message,
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode
    });

    return res.status(500).json({
      error: "We could not send your request right now. Please try again or contact us directly."
    });
  }
};
