const nodemailer = require("nodemailer");

const requiredEnv = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "SMTP_TO"
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

  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
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
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_TO,
      replyTo: email,
      subject,
      text,
      html
    });

    return res.status(200).json({
      ok: true,
      message: "Your quote request has been sent. We will reply shortly."
    });
  } catch (error) {
    return res.status(500).json({
      error: "We could not send your request right now. Please try again or contact us directly."
    });
  }
};
