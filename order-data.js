// One set of order facts for every surface that sells: the product-page order box (build.js),
// /checkout/, /order-confirmed/ and api/order.js, which re-prices every line from here and never
// trusts the browser. Prices are the per-product Offer prices printed on each product page
// ("From $X per mailer", plain stock at bulk quantity); build.js fails if a product's price here
// ever differs from the one in its products array. Runs of 250 (the smallest printed run the site
// states) up to 12,500 online; free shipping to any US address (owner decision 2026-10-06); no
// change-of-mind returns, errors made right (/custom-order-policy/). Payment is a PayPal invoice
// or a bank transfer invoice after the digital proof, or cash on delivery for US addresses.
const CATALOG = {
  "kraft-bubble-mailers": { name: "Kraft Bubble Mailers", price: 0.14 },
  "4x6-bubble-mailer": { name: "4x6 Bubble Mailer", price: 0.12 },
  "white-bubble-mailers": { name: "White Bubble Mailers", price: 0.13 },
  "8-5-x-12-bubble-mailer": { name: "8.5 x 12 Bubble Mailer", price: 0.24 },
  "4x7-bubble-mailer": { name: "4x7 Bubble Mailer", price: 0.13 },
  "2-bubble-mailer": { name: "#2 Bubble Mailer", price: 0.24 },
  "5-bubble-mailer": { name: "#5 Bubble Mailer", price: 0.34 },
  "bubble-mailer-bags": { name: "Bulk Bubble Mailer Bags", price: 0.12 },
  "6-bubble-mailer": { name: "#6 Bubble Mailer", price: 0.4 },
  "bubble-mailer-packaging": { name: "Bubble Mailer Packaging", price: 0.12 },
  "7-bubble-mailer": { name: "#7 Bubble Mailer", price: 0.48 },
  "10-5-x-15-bubble-mailer": { name: "10.5 x 15 Bubble Mailer", price: 0.32 },
  "7x9-bubble-mailer": { name: "7x9 Bubble Mailer", price: 0.19 },
  "9x6-bubble-mailer": { name: "9x6 Bubble Mailer", price: 0.17 },
  "12x12-bubble-mailer": { name: "12x12 Bubble Mailer", price: 0.36 },
  "12x15-bubble-mailer": { name: "12x15 Bubble Mailer", price: 0.42 },
  "3-bubble-mailer": { name: "#3 Bubble Mailer", price: 0.27 },
};

const ORDER_PREFIX = "SBM";
const CURRENCY = "USD";
const UNIT = "mailer";
const UNITS = "mailers";
const PACK_QTY = 250;
const MIN_QTY = PACK_QTY;
const MAX_QTY = PACK_QTY * 50; // 12,500 online; pallet programs go through a quote
const DEFAULT_QTY = 1000;
const QUANTITIES = Array.from({ length: MAX_QTY / PACK_QTY }, (_, i) => (i + 1) * PACK_QTY);

const money = (n) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const unitPrice = (slug) => (CATALOG[slug] ? CATALOG[slug].price : 0);
const normalizeQty = (raw) => {
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(MAX_QTY, Math.max(MIN_QTY, Math.round(n / PACK_QTY) * PACK_QTY));
};
const lineTotal = (slug, qty) => Math.round(qty * unitPrice(slug) * 100) / 100;

const SHIP_COUNTRIES = [{ code: "US", name: "United States" }];
const SHIP_LINE = "Free shipping to any US address";
const COD_COUNTRIES = ["US"];
const PAYMENT_METHODS = [
  { id: "paypal", name: "PayPal invoice", detail: "We email a PayPal invoice once you approve your digital proof (or your plain-stock order details). Pay with your PayPal balance or by card through PayPal. Production starts when it is paid." },
  { id: "bank", name: "Bank transfer", detail: "We email an invoice with our bank details once you approve your digital proof. Production starts when the transfer arrives." },
  { id: "cod", name: "Cash on delivery", detail: "Nothing is paid up front. You pay the order total when the mailers are delivered. Available for addresses in the United States." },
];
const PAYMENT_LINE = "Pay by PayPal invoice or bank transfer after you approve your digital proof, or cash on delivery at any US address.";

module.exports = {
  CATALOG, ORDER_PREFIX, CURRENCY, UNIT, UNITS, PACK_QTY, MIN_QTY, MAX_QTY, DEFAULT_QTY, QUANTITIES,
  money, unitPrice, normalizeQty, lineTotal, SHIP_COUNTRIES, SHIP_LINE, COD_COUNTRIES, PAYMENT_METHODS, PAYMENT_LINE,
};
