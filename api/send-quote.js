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
  const message = body.Message || body.message || "";
  const subject = body.form_subject || "Quote request from Shop Bubble Mailers";
  const attachmentName = body.attachmentName || "";

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required." });
  }

  const host = envValue("SMTP_HOST");
  const port = Number(envValue("SMTP_PORT", "587"));
  const smtpUser = envValue("SMTP_USER");
  const smtpPass = envValue("SMTP_PASS");
  const smtpFrom = envValue("SMTP_FROM") || smtpUser;
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
    ["Product Interested In", product],
    ["Quantity", quantity],
    ["Size", size],
    ["Artwork Filename", attachmentName || "No file attached"],
    ["Message", message || "No additional message provided"]
  ];

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
      ${
        attachmentName
          ? `<p style="margin-top:16px">Artwork file was selected in the form. Ask the customer to email the file directly if it was not included separately.</p>`
          : ""
      }
    </div>
  `;

  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");

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
      html
    });

    console.log("Quote request SMTP send success", {
      smtpTo,
      product,
      email
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
