const fs = require("fs");
const path = require("path");
const { locationStates } = require("./locations-data.js");
const sharp = require("sharp");
const ORDER = require("./order-data.js");

/** Image conversions run in parallel and are awaited before the build ends. */
const imageJobs = [];

const rootDir = __dirname;
const srcDir = path.join(rootDir, "src");
const assetsDir = path.join(rootDir, "Assets");
const distDir = path.join(rootDir, "dist");
const distAssetsDir = path.join(distDir, "assets", "images");

const site = {
  domain: "https://shopbubblemailers.com",
  brand: "Shop Bubble Mailers",
  email: "Info@shopbubblemailers.com",
  phone: "(503) 461-4788",
  phoneHref: "+15034614788",
  address: "2975 Coburn Hollow Road Bloomington, IL 61701 United States",
  city: "Bloomington",
  state: "IL",
  postalCode: "61701",
  country: "US",
  formAction: "/api/send-quote",
  socialImage: "/assets/images/bubble-mailers-pbee-3.webp"
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const titleCase = (value) =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const ensureDir = (target) => {
  fs.mkdirSync(target, { recursive: true });
};

const cleanDir = (target) => {
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
};

const readText = (fileName) => fs.readFileSync(path.join(srcDir, fileName), "utf8");

// Short content hash appended to the stylesheet and script URLs. Vercel serves
// both with a four-hour cache, so without this a deploy that changes markup
// AND styles can leave a returning visitor with new HTML on old CSS.
const assetVersion = (fileName) =>
  require("crypto").createHash("sha1").update(readText(fileName)).digest("hex").slice(0, 8);
const STYLES_URL = `/styles.css?v=${assetVersion("styles.css")}`;
const SCRIPT_URL = `/script.js?v=${assetVersion("script.js")}`;

cleanDir(distDir);
ensureDir(distAssetsDir);

const assetFiles = fs
  .readdirSync(assetsDir)
  // exFAT drives grow AppleDouble "._foo.png" sidecars; they pass an extension
  // check but are not real images, so drop them before the sharp pipeline.
  .filter((file) => !file.startsWith("._") && !file.startsWith(".") && file.toLowerCase().endsWith(".png"))
  .sort((a, b) => a.localeCompare(b));

// Source art is PNG; the site ships WebP at two widths instead, which cuts the
// largest images by roughly 80% without a visible quality change.
const imagePipeline = [
  { suffix: "", width: 1000, quality: 76 },
  { suffix: "-400", width: 400, quality: 72 }
];

const assetCatalog = assetFiles.map((file, index) => {
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file, ext);
  const slug = slugify(base);
  const outputName = `${slug}.webp`;
  const source = path.join(assetsDir, file);

  for (const { suffix, width, quality } of imagePipeline) {
    const target = path.join(distAssetsDir, `${slug}${suffix}.webp`);
    imageJobs.push(
      sharp(source)
        .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
        .webp({ quality, effort: 5 })
        .toFile(target)
    );
  }

  return {
    id: `asset-${index + 1}`,
    original: file,
    filename: outputName,
    url: `/assets/images/${outputName}`,
    thumb: `/assets/images/${slug}-400.webp`,
    alt: titleCase(base).replace(/Pbee|Tpb/g, "").replace(/\s+/g, " ").trim()
  };
});

const assetsByPrefix = {
  plain: assetCatalog.filter((asset) => asset.original.toLowerCase().includes("plain")),
  halloween: assetCatalog.filter((asset) => asset.original.toLowerCase().includes("halloween")),
  bulk500: assetCatalog.filter((asset) => asset.original.toLowerCase().includes("500")),
  bulk1000: assetCatalog.filter((asset) => asset.original.toLowerCase().includes("1000")),
  generic: assetCatalog.filter(
    (asset) =>
      !asset.original.toLowerCase().includes("plain") &&
      !asset.original.toLowerCase().includes("halloween") &&
      !asset.original.toLowerCase().includes("500") &&
      !asset.original.toLowerCase().includes("1000")
  )
};

const pickAsset = (group, index = 0) => {
  const source = assetsByPrefix[group] || assetCatalog;
  return source[index % source.length] || assetCatalog[index % assetCatalog.length];
};

const singleContextLink = (product) => `<a href="/${product.slug}/">${product.name.toLowerCase()}</a>`;

const sizeGuide = [
  { size: "4x6", slug: "4x6-bubble-mailer", numbered: "below #000", use: "Small parts, jewelry cards, samples", strength: "Compact padded mailer for low-profile items" },
  { size: "4x7", slug: "4x7-bubble-mailer", numbered: "#000", use: "Small accessories, cosmetics, cables", strength: "Easy fit for lightweight branded shipments" },
  { size: "6x9", slug: "9x6-bubble-mailer", numbered: "#0", use: "Stationery, phone cases, small books", strength: "Wider opening at a low postage weight" },
  { size: "7x9", slug: "7x9-bubble-mailer", numbered: "#0 / #1", use: "Apparel accessories, books, boxed kits", strength: "Balanced option for everyday eCommerce orders" },
  { size: "8.5x12", slug: "8-5-x-12-bubble-mailer", numbered: "#2", use: "Documents, notebooks, beauty sets", strength: "Common padded size for growing stores" },
  { size: "8.5x14.5", slug: "3-bubble-mailer", numbered: "#3", use: "Legal documents, samples, beauty accessories", strength: "Longer than a #2 at the same width" },
  { size: "10.5x15", slug: "10-5-x-15-bubble-mailer", numbered: "#5", use: "Folded garments, larger kits, catalogs", strength: "Useful when products need more face size" },
  { size: "12x12", slug: "12x12-bubble-mailer", numbered: "square", use: "Prints, records, flat boxed items", strength: "Wide opening for awkward product shapes" },
  { size: "12x15", slug: "12x15-bubble-mailer", numbered: "#5 / #6", use: "Bulk apparel, books, large retail orders", strength: "Large mailer for higher-volume shipments" },
  { size: "12.5x19", slug: "6-bubble-mailer", numbered: "#6", use: "Larger apparel, document packs", strength: "Step up when #5 runs out of room" },
  { size: "14.25x20", slug: "7-bubble-mailer", numbered: "#7", use: "Oversized soft goods, magazines", strength: "The largest standard padded mailer" }
];

const homepageFaqs = [
  ["What types of bubble mailers do you supply?", "We supply kraft bubble mailers, white bubble mailers, padded mailing envelopes, bubble mailer bags, and custom printed mailers for brands and distributors in the USA."],
  ["Do you offer bulk pricing?", "Yes. Bulk pricing is available for businesses that need recurring stock, project-based quantities, or container-style volume planning. Quote pricing is adjusted around size, material, print needs, and order count."],
  ["Can I order custom printed bubble mailers?", "Yes. We support custom bubble mailers with logo printing, branded colors, and print layouts for brands that want a cleaner shipping presentation."],
  ["Do you work with small businesses?", "Yes. We work with small businesses, growing online stores, subscription programs, retail brands, and established distributors."],
  ["Which bubble mailer size should I choose?", "That depends on the item dimensions, the protection level you need, and whether the shipment includes folded goods or rigid inserts. Our quote team can help narrow the best size for your application."],
  ["Are your mailers suitable for lightweight shipping?", "Yes. Bubble mailers are a practical choice when businesses want padded protection without the weight and shipping cost of corrugated cartons."],
  ["Do you offer plain and kraft finishes?", "Yes. We offer both plain and kraft-style bubble mailers, along with white mailers and custom branded options."],
  ["Can I request a sample or quote before placing a large order?", "Yes. You can contact us for a quote and discuss sample availability, production details, and size guidance before moving into a larger order."],
  ["How fast do you respond to quote requests?", "We aim to respond quickly with practical information about size, quantity, printing options, and lead time so buyers can move forward without delay."],
  ["Do you ship across the United States?", "Yes, and shipping is free to any US address. Shop Bubble Mailers serves businesses throughout the USA and supports orders for local operations, regional distributors, and national shipping programs."]
];

// Six standard-topic FAQs contextualized with each product's real sizes,
// material, category, and use case so answers differ per product rather than
// being identical boilerplate. Appended after the hand-written product FAQs to
// give every product page at least 10 FAQs.
const supplementaryFaqs = (product) => {
  const material = product.material.toLowerCase();
  const sizes = product.sizes.join(", ");
  const primaryUse = product.idealFor[0];
  const category = product.category.toLowerCase();
  const nameLower = product.name.toLowerCase();
  return [
    [`What is the minimum order quantity for ${nameLower}?`, `The minimum order (MOQ) for ${nameLower} is 250 mailers, the smallest quantity the order box takes. Larger or custom runs are quoted per job — share your target quantity and we'll confirm where the price breaks fall.`],
    [`How quickly can I get ${nameLower} after ordering?`, `We respond to ${nameLower} quote requests quickly with size, quantity, print, and lead-time details. Standard stock moves faster than custom-printed orders; tell us your deadline and we'll confirm a realistic turnaround.`],
    [`Can I request a sample of ${nameLower} before a bulk order?`, `Yes. You can ask about sample availability for ${nameLower} before committing to a larger run, so you can check the fit and the ${material} against your own product first.`],
    [`Can ${nameLower} be custom printed with a logo?`, `Yes. ${product.name} can be quoted plain or custom printed with a logo, brand colors, and handling marks. As ${category}, it supports the branded packout many businesses want — send artwork with your quote for review.`],
    [`What sizes are available for ${nameLower}?`, `${product.name} is available in ${sizes} sizing. If your product needs a different fit, custom sizing can be discussed as part of a ${nameLower} quote.`],
    [`Does ${nameLower} help lower shipping cost?`, `Yes. ${product.name} uses ${material}, which is lighter and lower-profile than a corrugated box for products like ${primaryUse}, so it can reduce parcel weight and freight cost on repeat shipments.`]
  ];
};

const productFaqTemplates = (product) => {
  const content = productContent[product.slug];
  if (content && content.faqs) return [...content.faqs, ...supplementaryFaqs(product)];
  return [
  [`What is ${product.name.toLowerCase()} used for?`, `${product.name} is used for shipping products that need light padded protection, a clean outer presentation, and efficient storage in packing stations.`],
  [`Is ${product.name.toLowerCase()} available in bulk?`, `Yes. ${product.name} is available for bulk quote requests with pricing based on quantity, material choice, print requirements, and shipping destination.`],
  [`Can ${product.name.toLowerCase()} be custom printed?`, `Yes. Many customers request logo printing, brand colors, handling marks, return details, or simple one-color layouts for ${product.name.toLowerCase()}.`],
  [`What products fit inside ${product.name.toLowerCase()}?`, `${product.name} works well for ${product.idealFor.join(", ").toLowerCase()}, depending on the final packed dimensions and whether inserts are added.`],
  [`Does ${product.name.toLowerCase()} help reduce shipping weight?`, `Yes. Bubble mailers are lighter than boxes, so ${product.name.toLowerCase()} can help reduce parcel weight while still keeping fragile or presentation-sensitive items better protected.`],
  [`Can I request a size recommendation for ${product.name.toLowerCase()}?`, `Yes. If you share the packed product dimensions and order quantity, we can recommend a practical size range for ${product.name.toLowerCase()}.`],
  [`Is ${product.name.toLowerCase()} suitable for retail brands?`, `Yes. Retail brands, eCommerce sellers, subscription programs, and warehouse teams use ${product.name.toLowerCase()} when they need a tidy shipping format and reliable padding.`],
  [`What closure is used on ${product.name.toLowerCase()}?`, `${product.name} is commonly supplied with a pressure-sensitive self-seal closure so fulfillment teams can pack quickly without added tape on every order.`],
  [`How do I request pricing for ${product.name.toLowerCase()}?`, `Use the quote form, call us, or email us with the size, quantity, print requirements, and delivery details for ${product.name.toLowerCase()}.`],
  [`Do you supply ${product.name.toLowerCase()} in the USA?`, `Yes. Shop Bubble Mailers supplies ${product.name.toLowerCase()} for businesses across the United States.`]
  ];
};

const relatedMap = {
  "kraft-bubble-mailers": ["white-bubble-mailers", "bubble-mailer-packaging", "custom-bubble-mailers", "bubble-mailer-bags"],
  "4x6-bubble-mailer": ["4x7-bubble-mailer", "7x9-bubble-mailer", "bubble-mailer-bags", "kraft-bubble-mailers"],
  "white-bubble-mailers": ["kraft-bubble-mailers", "8-5-x-12-bubble-mailer", "bubble-mailer-packaging", "custom-bubble-mailers"],
  "8-5-x-12-bubble-mailer": ["7x9-bubble-mailer", "10-5-x-15-bubble-mailer", "white-bubble-mailers", "bubble-mailer-packaging"],
  "4x7-bubble-mailer": ["4x6-bubble-mailer", "7x9-bubble-mailer", "3-bubble-mailer", "kraft-bubble-mailers"],
  "2-bubble-mailer": ["3-bubble-mailer", "4x6-bubble-mailer", "kraft-bubble-mailers", "bubble-mailer-bags"],
  "5-bubble-mailer": ["6-bubble-mailer", "7-bubble-mailer", "8-5-x-12-bubble-mailer", "white-bubble-mailers"],
  "bubble-mailer-bags": ["kraft-bubble-mailers", "bubble-mailer-packaging", "custom-bubble-mailers", "7x9-bubble-mailer"],
  "6-bubble-mailer": ["5-bubble-mailer", "7-bubble-mailer", "10-5-x-15-bubble-mailer", "bubble-mailer-packaging"],
  "bubble-mailer-packaging": ["bubble-mailer-bags", "custom-bubble-mailers", "kraft-bubble-mailers", "white-bubble-mailers"],
  "7-bubble-mailer": ["6-bubble-mailer", "5-bubble-mailer", "10-5-x-15-bubble-mailer", "12x15-bubble-mailer"],
  "10-5-x-15-bubble-mailer": ["8-5-x-12-bubble-mailer", "12x15-bubble-mailer", "7-bubble-mailer", "bubble-mailer-packaging"],
  "7x9-bubble-mailer": ["4x7-bubble-mailer", "8-5-x-12-bubble-mailer", "bubble-mailer-bags", "kraft-bubble-mailers"],
  "9x6-bubble-mailer": ["7x9-bubble-mailer", "8-5-x-12-bubble-mailer", "white-bubble-mailers", "bubble-mailer-packaging"],
  "12x12-bubble-mailer": ["12x15-bubble-mailer", "10-5-x-15-bubble-mailer", "bubble-mailer-packaging", "custom-bubble-mailers"],
  "12x15-bubble-mailer": ["12x12-bubble-mailer", "10-5-x-15-bubble-mailer", "7-bubble-mailer", "bubble-mailer-packaging"],
  "3-bubble-mailer": ["2-bubble-mailer", "4x6-bubble-mailer", "4x7-bubble-mailer", "bubble-mailer-bags"]
};

const products = [
  {
    slug: "kraft-bubble-mailers",
    name: "Kraft Bubble Mailers",
    metaTitle: "Kraft Bubble Mailers Bulk & Wholesale (#000–#7) | Shop Bubble Mailers",
    metaDescription: "Kraft paper bubble mailers in every standard size, plain or logo printed. Bulk and wholesale pricing for US businesses, with samples and a quote in 1-2 hours.",
    price: "0.14",
    spec: {"usable":"4 x 7 in (#000) to 14.25 x 19 in (#7)","outer":"4 x 8 in to 14.25 x 20 in, ten standard sizes","equiv":"Numbered sizes #000, #00, #0, #1, #2, #3, #4, #5, #6, #7","bubble":"3/16 in bubble lining bonded to natural kraft paper","weight":"Up to about 2 lb per mailer depending on size","fits":"Cosmetics, books, apparel, boxed goods, retail orders","postage":"Ships as a flat or lightweight parcel; weight stays well under a box"},
    category: "Kraft Bubble Mailers",
    image: pickAsset("generic", 0),
    accentImages: [pickAsset("generic", 1), pickAsset("bulk500", 0)],
    sizes: ["#000", "#00", "#0", "#1", "#2", "#3", "#4", "#5", "#6", "#7"],
    material: "Kraft paper exterior with cushioned bubble lining and self-seal closure",
    idealFor: ["retail orders", "small boxed goods", "cosmetics", "light books"],
    fitNote: "Kraft bubble mailers are often chosen when buyers want a paper-forward appearance that still provides interior cushioning.",
    customAngle: "Custom printing on kraft stock works well for brands that want a natural packaging look without moving to a full carton format.",
    bulkAngle: "Large orders are common for operations that pack daily and want one size program or a mixed-size stocking plan.",
    tone: "paper-forward shipping"
  },
  {
    slug: "4x6-bubble-mailer",
    name: "4x6 Bubble Mailer",
    metaTitle: "4x6 Bubble Mailers Bulk | Small Padded Envelopes | Shop Bubble Mailers",
    metaDescription: "4x6 bubble mailers for jewelry, cards, samples and small parts. The smallest padded envelope we stock, by the case or pallet, plain or printed. Bulk pricing.",
    price: "0.12",
    spec: {"usable":"4 x 6 in","outer":"4.25 x 7 in including the seal flap","equiv":"Smaller than a #000 (4 x 8); the compact size most jewelry sellers use","bubble":"3/16 in bubble lining, self-seal strip","weight":"Up to about 8 oz","fits":"Jewelry cards, pins, SIM and memory cards, sample sachets, stickers","postage":"Usually ships at the lowest parcel or thick-letter tier when packed under 3/4 in"},
    category: "Small Bubble Mailers",
    image: pickAsset("plain", 0),
    accentImages: [pickAsset("plain", 1), pickAsset("generic", 2)],
    sizes: ["4x6"],
    material: "Lightweight poly or paper-style mailer with interior bubble padding",
    idealFor: ["jewelry cards", "small accessories", "sample packs", "compact parts"],
    fitNote: "The 4x6 format keeps small orders tight so contents do not shift more than needed during transit.",
    customAngle: "Smaller mailers still offer room for logo placement, return details, or a simple one-color print program.",
    bulkAngle: "This size is often restocked in volume because it supports frequent low-weight shipments.",
    tone: "small-format shipping"
  },
  {
    slug: "white-bubble-mailers",
    name: "White Bubble Mailers",
    metaTitle: "White Bubble Mailers Bulk & Wholesale | Shop Bubble Mailers",
    metaDescription: "White poly bubble mailers with a clean printable surface, in sizes #000 to #5. Bulk and wholesale pricing for beauty, apparel and subscription brands. Free quote.",
    price: "0.13",
    spec: {"usable":"4 x 7 in (#000) to 10.5 x 15 in (#5)","outer":"4 x 8 in to 10.5 x 16 in, eight standard sizes","equiv":"Numbered sizes #000, #00, #0, #1, #2, #3, #4, #5","bubble":"3/16 in bubble lining under a smooth white poly film","weight":"Up to about 2 lb per mailer depending on size","fits":"Beauty products, apparel accessories, subscription kits, retail orders","postage":"Water-resistant poly face; lighter than kraft at the same size"},
    category: "White Bubble Mailers",
    image: pickAsset("plain", 2),
    accentImages: [pickAsset("plain", 3), pickAsset("plain", 4)],
    sizes: ["#000", "#00", "#0", "#1", "#2", "#3", "#4", "#5"],
    material: "Smooth white outer layer with bubble-lined interior and pressure-sensitive seal",
    idealFor: ["beauty products", "retail orders", "apparel accessories", "subscription kits"],
    fitNote: "White bubble mailers give shipments a cleaner shelf-ready appearance for customer-facing brands.",
    customAngle: "White stock supports simple black print as well as more visible brand marks and handling notes.",
    bulkAngle: "Businesses often choose white mailers for consistent appearance across multiple fulfillment locations.",
    tone: "clean branded shipping"
  },
  {
    slug: "8-5-x-12-bubble-mailer",
    name: "8.5 x 12 Bubble Mailer",
    metaTitle: "8.5x12 Bubble Mailers (#2) Bulk Pricing | Shop Bubble Mailers",
    metaDescription: "8.5 x 12 bubble mailers, the #2 size, for documents, folded apparel, tablets and beauty sets. Case and pallet quantities, plain or custom printed, USA-wide.",
    price: "0.24",
    spec: {"usable":"8.5 x 11 in","outer":"8.5 x 12 in","equiv":"Industry size #2; fits a letter-size sheet flat","bubble":"3/16 in bubble lining, self-seal strip","weight":"Up to about 1.5 lb","fits":"Documents, notebooks, folded shirts, tablets, beauty sets","postage":"Most common mid-size for eCommerce; ships as a lightweight parcel"},
    category: "Mid-Size Bubble Mailers",
    image: pickAsset("bulk500", 1),
    accentImages: [pickAsset("bulk1000", 0), pickAsset("generic", 3)],
    sizes: ["8.5 x 12"],
    material: "Padded bubble mailer with larger face size for flat and medium-profile goods",
    idealFor: ["documents", "notebooks", "beauty sets", "folded garments"],
    fitNote: "The 8.5 x 12 size gives warehouse teams a flexible option for flat products that need more room than small mailers.",
    customAngle: "This format gives enough print surface for logo placement and simple campaign messaging.",
    bulkAngle: "It is a common core size in multi-size stocking plans because it handles many day-to-day orders.",
    tone: "mid-size flat shipping"
  },
  {
    slug: "4x7-bubble-mailer",
    name: "4x7 Bubble Mailer",
    metaTitle: "4x7 Bubble Mailers Bulk | Small Padded Mailers | Shop Bubble Mailers",
    metaDescription: "4x7 bubble mailers for phone accessories, cosmetics, trading cards and small gifts. An inch more room than a 4x6 at the same postage tier. Bulk pricing USA.",
    price: "0.13",
    spec: {"usable":"4 x 7 in","outer":"4.25 x 8 in including the seal flap","equiv":"Same usable size as a #000 bubble mailer","bubble":"3/16 in bubble lining, self-seal strip","weight":"Up to about 8 oz","fits":"Phone cases, cables, trading cards, lip products, giftable add-ons","postage":"Stays in the small-parcel tier; a hair longer than 4x6 for taller items"},
    category: "Small Bubble Mailers",
    image: pickAsset("generic", 4),
    accentImages: [pickAsset("plain", 0), pickAsset("bulk500", 2)],
    sizes: ["4x7"],
    material: "Compact bubble mailer with self-seal strip and lightweight protective lining",
    idealFor: ["small beauty items", "phone accessories", "trading cards", "giftable add-ons"],
    fitNote: "The 4x7 size adds a little extra height over 4x6 without moving into a much larger storage footprint.",
    customAngle: "This size works well for direct-to-consumer brands that want a tight branded packout.",
    bulkAngle: "Many businesses keep 4x7 mailers on hand for sample campaigns and add-on product orders.",
    tone: "compact accessory shipping"
  },
  {
    slug: "2-bubble-mailer",
    name: "#2 Bubble Mailer",
    metaTitle: "#2 Bubble Mailers 8.5x12 Bulk | Shop Bubble Mailers",
    metaDescription: "#2 bubble mailers (8.5 x 12 in) in kraft or white poly, by the case or pallet. The standard numbered size for folded apparel, media and small boxed goods.",
    price: "0.24",
    spec: {"usable":"8.5 x 11 in","outer":"8.5 x 12 in","equiv":"Industry size #2; the same mailer as our 8.5 x 12","bubble":"3/16 in bubble lining, self-seal strip","weight":"Up to about 1.5 lb","fits":"Small retail products, cosmetics sets, flat accessories, parts packs","postage":"Lightweight parcel; fits a letter-size insert without folding"},
    category: "Numbered Bubble Mailers",
    image: pickAsset("generic", 6),
    accentImages: [pickAsset("bulk500", 3), pickAsset("plain", 2)],
    sizes: ["No. 2"],
    material: "Standard numbered bubble mailer format with padded interior lining",
    idealFor: ["small retail products", "cosmetics", "flat accessories", "parts packs"],
    fitNote: "No. 2 mailers are widely used when teams prefer standard mailer sizing instead of inch-based labels.",
    customAngle: "Numbered programs are easy to manage in branded packaging setups with repeated reorder patterns.",
    bulkAngle: "This size is often added to long-term packing programs with scheduled replenishment.",
    tone: "standardized shipping programs"
  },
  {
    slug: "5-bubble-mailer",
    name: "#5 Bubble Mailer",
    metaTitle: "#5 Bubble Mailers 10.5x16 Bulk | Shop Bubble Mailers",
    metaDescription: "#5 bubble mailers (10.5 x 16 in) for folded apparel, soft goods and multi-item kits. Kraft or white, plain or printed, with bulk and pallet pricing across the USA.",
    price: "0.34",
    spec: {"usable":"10.5 x 15 in","outer":"10.5 x 16 in","equiv":"Industry size #5; the same mailer as our 10.5 x 15","bubble":"3/16 in bubble lining, self-seal strip","weight":"Up to about 2 lb","fits":"Folded apparel, soft goods, kits, retail replenishment orders","postage":"Still a lightweight parcel; well under the weight of a comparable box"},
    category: "Numbered Bubble Mailers",
    image: pickAsset("bulk1000", 2),
    accentImages: [pickAsset("generic", 7), pickAsset("bulk1000", 3)],
    sizes: ["No. 5"],
    material: "Larger padded mailer format with pressure-sensitive closure",
    idealFor: ["folded apparel", "soft goods", "kits", "retail replenishment orders"],
    fitNote: "No. 5 mailers suit businesses that need a roomier padded envelope without moving all the way into carton packaging.",
    customAngle: "The larger panel gives better visibility for logos and shipping instructions.",
    bulkAngle: "This size is often quoted for apparel and subscription programs that ship high weekly volume.",
    tone: "roomier daily fulfillment"
  },
  {
    slug: "bubble-mailer-bags",
    name: "Bulk Bubble Mailer Bags",
    metaTitle: "Bulk Bubble Mailers & Bubble Shipping Bags | Shop Bubble Mailers",
    metaDescription: "Bubble mailers in bulk: padded shipping bags from 4x6 to 12x15 by the case or pallet. Kraft, white or printed, with wholesale pricing for fulfillment teams.",
    price: "0.12",
    spec: {"usable":"4 x 6 in up to 12 x 15 in","outer":"Six core sizes: 4x6, 4x7, 7x9, 8.5x12, 10.5x15, 12x15","equiv":"Covers numbered sizes #000 through #5","bubble":"3/16 in bubble lining, self-seal flap","weight":"From 8 oz on the smallest size to about 2 lb on the largest","fits":"eCommerce orders, retail shipping, warehouse pack lines, subscription mailouts","postage":"Cases of 250-500; pallets for 10,000+ units"},
    category: "Bubble Mailer Bags",
    image: pickAsset("bulk500", 0),
    accentImages: [pickAsset("bulk1000", 4), pickAsset("generic", 1)],
    sizes: ["4x6", "4x7", "7x9", "8.5x12", "10.5x15", "12x15"],
    material: "Padded mailing bag construction with bubble cushioning and self-seal flap",
    idealFor: ["eCommerce orders", "retail shipping", "warehouse packing lines", "subscription mailouts"],
    fitNote: "Bubble mailer bags are used when businesses want quick packout and protection without a box-first workflow.",
    customAngle: "These bags are available in plain, white, kraft-style, and custom print programs.",
    bulkAngle: "Bulk bag orders are common for fulfillment centers and repeat monthly shipping programs.",
    tone: "high-throughput bag format"
  },
  {
    slug: "6-bubble-mailer",
    name: "#6 Bubble Mailer",
    metaTitle: "#6 Bubble Mailers 12.5x19 Bulk | Shop Bubble Mailers",
    metaDescription: "#6 bubble mailers (12.5 x 19 in) for larger apparel, document packs and flat boxed items. Bulk and pallet pricing, plain or custom printed, shipped across the USA.",
    price: "0.40",
    spec: {"usable":"12.5 x 18 in","outer":"12.5 x 19 in","equiv":"Industry size #6; one step up from #5","bubble":"3/16 in bubble lining, self-seal strip","weight":"Up to about 3 lb","fits":"Larger apparel, document packs, kits, flat boxed items","postage":"Large-format mailer; stays lighter than a flat carton"},
    category: "Numbered Bubble Mailers",
    image: pickAsset("bulk1000", 1),
    accentImages: [pickAsset("generic", 2), pickAsset("plain", 4)],
    sizes: ["No. 6"],
    material: "Large numbered bubble mailer with bubble lining and quick-seal flap",
    idealFor: ["larger apparel", "document packs", "kits", "flat boxed items"],
    fitNote: "No. 6 mailers are a useful step up when standard mid-size mailers no longer give enough room.",
    customAngle: "This size handles brand printing, shipping notices, and account-specific pack labels cleanly.",
    bulkAngle: "Operations teams often buy this size alongside No. 5 and No. 7 for broader product coverage.",
    tone: "large-format padded shipping"
  },
  {
    slug: "bubble-mailer-packaging",
    name: "Bubble Mailer Packaging",
    metaTitle: "Bubble Mailer Packaging Supplier – Wholesale | Shop Bubble Mailers",
    metaDescription: "Wholesale bubble mailer packaging for US brands: kraft, white, metallic and printed padded mailers in standard or custom sizes. Program pricing for repeat volume.",
    price: "0.12",
    spec: {"usable":"Standard sizes from 4 x 6 in to 12 x 15 in, or custom","outer":"Any of our standard sizes, plus custom dimensions on request","equiv":"Kraft, white poly, metallic and recyclable paper finishes","bubble":"3/16 in bubble lining; heavier lining available for program orders","weight":"Depends on size; from 8 oz to about 3 lb","fits":"Branded shipping, retail packaging, warehouse order programs, campaigns","postage":"Supplied by the case or pallet to one or several US locations"},
    category: "Bubble Mailer Packaging",
    image: pickAsset("generic", 3),
    accentImages: [pickAsset("halloween", 0), pickAsset("bulk500", 1)],
    sizes: ["Custom", "4x6", "7x9", "8.5x12", "10.5x15", "12x15"],
    material: "Protective mailer packaging in multiple exterior finishes and padded interior formats",
    idealFor: ["branded shipping", "retail packaging", "warehouse order programs", "custom campaigns"],
    fitNote: "Bubble mailer packaging is a broad category used by companies that want to standardize protection, branding, and shipping speed.",
    customAngle: "Custom sizes, branded print, and layout planning are common for packaging programs tied to repeat SKUs.",
    bulkAngle: "We support volume planning for both standard and custom packaging requirements.",
    tone: "program-based packaging"
  },
  {
    slug: "7-bubble-mailer",
    name: "#7 Bubble Mailer",
    metaTitle: "#7 Bubble Mailers 14.25x20 Bulk | Shop Bubble Mailers",
    metaDescription: "#7 bubble mailers (14.25 x 20 in), the largest standard padded mailer, for oversized soft goods, magazines and multi-item orders. Bulk pricing for US retailers.",
    price: "0.48",
    spec: {"usable":"14.25 x 19 in","outer":"14.25 x 20 in","equiv":"Industry size #7; the largest standard numbered size","bubble":"3/16 in bubble lining, self-seal strip","weight":"Up to about 3 lb","fits":"Oversized folded apparel, magazines, soft retail kits, multi-item orders","postage":"Large lightweight parcel; the box alternative for soft goods"},
    category: "Numbered Bubble Mailers",
    image: pickAsset("bulk500", 2),
    accentImages: [pickAsset("bulk1000", 2), pickAsset("generic", 5)],
    sizes: ["No. 7"],
    material: "Extra-room padded mailer for larger flat shipments and soft goods",
    idealFor: ["larger folded apparel", "magazines", "soft retail kits", "multi-item orders"],
    fitNote: "No. 7 mailers are chosen when businesses need a larger face size but still want the speed of padded envelopes.",
    customAngle: "Brands using large mailers often include bolder print zones and return information.",
    bulkAngle: "This size is frequently quoted for high-volume retail replenishment and apparel distribution.",
    tone: "large-panel fulfillment"
  },
  {
    slug: "10-5-x-15-bubble-mailer",
    name: "10.5 x 15 Bubble Mailer",
    metaTitle: "10.5x15 Bubble Mailers (#5) Bulk | Shop Bubble Mailers",
    metaDescription: "10.5 x 15 bubble mailers, the #5 size, for larger garments, catalogs and document packets. Case and pallet quantities in kraft or white, plain or printed.",
    price: "0.32",
    spec: {"usable":"10.5 x 15 in","outer":"10.5 x 16 in","equiv":"Industry size #5","bubble":"3/16 in bubble lining, self-seal strip","weight":"Up to about 2 lb","fits":"Larger garments, document packets, catalogs, flat boxed goods","postage":"Lightweight parcel; common for apparel that ships folded"},
    category: "Large Bubble Mailers",
    image: pickAsset("bulk1000", 3),
    accentImages: [pickAsset("bulk500", 3), pickAsset("generic", 6)],
    sizes: ["10.5 x 15"],
    material: "Large-format bubble mailer with generous face size and protective lining",
    idealFor: ["larger garments", "document packets", "catalogs", "flat boxed goods"],
    fitNote: "The 10.5 x 15 size works well for products that need a larger opening and more internal face area.",
    customAngle: "The front panel offers strong brand visibility and room for simple handling marks.",
    bulkAngle: "This format is common in apparel and catalog shipping where order dimensions are more consistent.",
    tone: "broad-face shipping"
  },
  {
    slug: "7x9-bubble-mailer",
    name: "7x9 Bubble Mailer",
    metaTitle: "7x9 Bubble Mailers Bulk | Padded Envelopes | Shop Bubble Mailers",
    metaDescription: "7x9 bubble mailers for accessories, small books, beauty packs and gifts. The everyday eCommerce size, by the case or pallet, plain or printed. Bulk pricing USA.",
    price: "0.19",
    spec: {"usable":"7 x 9 in","outer":"7.25 x 10 in including the seal flap","equiv":"Between a #0 (6 x 10) and a #1 (7.25 x 12)","bubble":"3/16 in bubble lining, self-seal strip","weight":"Up to about 1 lb","fits":"Accessories, small books, beauty packs, gift items, boxed kits","postage":"Lightweight parcel; the most-reordered mid-size for online stores"},
    category: "Mid-Size Bubble Mailers",
    image: pickAsset("generic", 7),
    accentImages: [pickAsset("plain", 3), pickAsset("bulk1000", 4)],
    sizes: ["7x9"],
    material: "Mid-size padded mailer for day-to-day online order fulfillment",
    idealFor: ["accessories", "small books", "beauty packs", "gift items"],
    fitNote: "7x9 is a common size because it balances storage efficiency, protection, and product flexibility.",
    customAngle: "This format supports brand print without overwhelming smaller shipments.",
    bulkAngle: "Many fulfillment teams treat 7x9 as one of the core sizes in their packing stations.",
    tone: "everyday order shipping"
  },
  {
    slug: "9x6-bubble-mailer",
    name: "9x6 Bubble Mailer",
    metaTitle: "9x6 Bubble Mailers (6x9, #0) Bulk | Shop Bubble Mailers",
    metaDescription: "9x6 bubble mailers (also sold as 6x9 or #0) for stationery, beauty orders and small books. A wider opening than 4x7 at a low postage weight. Bulk pricing.",
    price: "0.17",
    spec: {"usable":"6 x 9 in","outer":"6.25 x 10 in including the seal flap","equiv":"Industry size #0; listed as 6x9 or 9x6 depending on the supplier","bubble":"3/16 in bubble lining, self-seal strip","weight":"Up to about 1 lb","fits":"Retail accessories, beauty orders, stationery, small books, phone cases","postage":"Lightweight parcel; wide opening for flat items"},
    category: "Mid-Size Bubble Mailers",
    image: pickAsset("plain", 1),
    accentImages: [pickAsset("generic", 0), pickAsset("bulk500", 0)],
    sizes: ["9x6"],
    material: "Rectangular padded mailer for moderate-size flat products and branded shipments",
    idealFor: ["retail accessories", "beauty orders", "stationery", "small books"],
    fitNote: "A 9x6 bubble mailer suits products that need a wider opening than small mailers but not the length of larger catalog formats.",
    customAngle: "The front panel is useful for clean print layouts and order handling details.",
    bulkAngle: "This size is useful in mixed-size packing programs when product width matters more than length.",
    tone: "wide compact shipping"
  },
  {
    slug: "12x12-bubble-mailer",
    name: "12x12 Bubble Mailer",
    metaTitle: "12x12 Bubble Mailers Bulk – Square Mailers | Shop Bubble Mailers",
    metaDescription: "12x12 square bubble mailers for prints, vinyl records, flat gift kits and square apparel packs. Case and pallet quantities, plain or printed, shipped across the USA.",
    price: "0.36",
    spec: {"usable":"12 x 12 in","outer":"12.25 x 13 in including the seal flap","equiv":"Square format; no numbered equivalent","bubble":"3/16 in bubble lining, self-seal strip","weight":"Up to about 2 lb","fits":"Prints, vinyl records, flat gift kits, square apparel packs, marketing packs","postage":"Lightweight parcel; avoids the box a square item would otherwise need"},
    category: "Large Bubble Mailers",
    image: pickAsset("halloween", 1),
    accentImages: [pickAsset("bulk1000", 0), pickAsset("generic", 4)],
    sizes: ["12x12"],
    material: "Square padded mailer for flat products with wider dimensions",
    idealFor: ["prints", "flat gift kits", "square apparel packs", "marketing packs"],
    fitNote: "12x12 mailers serve products that do not sit naturally in narrow envelope shapes.",
    customAngle: "Square panels work well for centered logos and campaign-based printed packaging.",
    bulkAngle: "This size is useful for seasonal campaigns and brands shipping square-format items in volume.",
    tone: "square-format shipping"
  },
  {
    slug: "12x15-bubble-mailer",
    name: "12x15 Bubble Mailer",
    metaTitle: "12x15 Bubble Mailers Bulk – Large Padded | Shop Bubble Mailers",
    metaDescription: "12x15 bubble mailers for large apparel, catalogs, multi-item kits and soft retail replenishment. Kraft or white, plain or printed, by the case or pallet.",
    price: "0.42",
    spec: {"usable":"12 x 15 in","outer":"12.25 x 16 in including the seal flap","equiv":"Between a #5 (10.5 x 16) and a #6 (12.5 x 19)","bubble":"3/16 in bubble lining, self-seal strip","weight":"Up to about 3 lb","fits":"Large garments, catalog packs, multi-item kits, soft retail replenishment","postage":"Large lightweight parcel; common for hoodies and denim"},
    category: "Large Bubble Mailers",
    image: pickAsset("halloween", 2),
    accentImages: [pickAsset("bulk500", 2), pickAsset("generic", 6)],
    sizes: ["12x15"],
    material: "Large padded mailer with broad internal area and self-sealing closure",
    idealFor: ["large garments", "catalog packs", "multi-item kits", "soft retail replenishment"],
    fitNote: "12x15 bubble mailers are often used when products are too large for standard everyday mailers but still suited to an envelope format.",
    customAngle: "The large face size gives brands more room for print and shipping instructions.",
    bulkAngle: "This format is often purchased in bulk for apparel and seasonal campaign programs.",
    tone: "large-capacity shipping"
  },
  {
    slug: "3-bubble-mailer",
    name: "#3 Bubble Mailer",
    metaTitle: "#3 Bubble Mailers 8.5x14.5 Bulk | Shop Bubble Mailers",
    metaDescription: "#3 bubble mailers (8.5 x 14.5 in) for documents, beauty accessories, samples and small retail products. Kraft or white, bulk and pallet pricing across the USA.",
    price: "0.27",
    spec: {"usable":"8.5 x 13.5 in","outer":"8.5 x 14.5 in","equiv":"Industry size #3; longer than a #2 at the same width","bubble":"3/16 in bubble lining, self-seal strip","weight":"Up to about 1.5 lb","fits":"Small retail products, beauty accessories, legal documents, samples","postage":"Lightweight parcel; fits legal-size paper flat"},
    category: "Numbered Bubble Mailers",
    image: pickAsset("halloween", 3),
    accentImages: [pickAsset("plain", 0), pickAsset("generic", 1)],
    sizes: ["No. 3"],
    material: "Standard padded mailer with balanced size and practical storage footprint",
    idealFor: ["small retail products", "beauty accessories", "documents", "samples"],
    fitNote: "No. 3 mailers offer a middle ground between very small formats and more spacious daily-use options.",
    customAngle: "This format is common for simple branded shipping programs and repeat product lines.",
    bulkAngle: "No. 3 bubble mailers are often reordered by businesses with stable day-to-day shipping needs.",
    tone: "balanced repeat shipping"
  }
];

// Unique per-product body content. Replaces the shared productSections
// boilerplate so no two product pages share their primary prose. Anchored on
// each product's real size and use case. Kraft has its own dedicated page, so
// it is not included here. A slug with no entry falls back to the generic
// template text, but the goal is full coverage of the templated products.
const productContent = {
  "4x6-bubble-mailer": {
    overview: [
      "The 4x6 bubble mailer is the smallest padded envelope most stores keep on hand, and it earns its place at the packing bench by handling the high-frequency, low-weight shipments that make up a large share of eCommerce orders. Jewelry cards, enamel pins, sample sachets, SIM cards, and single accessories all fit a 4x6 without the wasted void space that forces you to add filler.",
      "Because it is small, a 4x6 mailer keeps parcel weight and dimensional footprint down, which is exactly where shipping costs are won on repeat orders. The interior bubble layer still cushions against the knocks and compression of automated mail sorting, so a delicate item arrives looking the way it left even though the package barely registers on the postal scale."
    ],
    benefits: [
      "Right-sized for tiny items so you skip void fill and keep each parcel at its lowest practical weight.",
      "Fits standard letter-mail and small-parcel rate bands, which is where a compact mailer saves the most per shipment.",
      "Self-seal strip lets a packer close dozens of small orders quickly during a batch pick-and-pack run.",
      "Stores flat in high quantity, so a full month of 4x6 stock takes up very little shelf space at the station."
    ],
    useCases: [
      "The 4x6 is the default for jewelry brands, sticker shops, and accessory sellers shipping one or two small pieces per order. Its size discourages over-packing and keeps the unboxing tidy for a customer opening a small, considered parcel.",
      "Subscription add-ons, replacement parts, trading cards, and free-sample campaigns also lean on this size because it moves in volume at the lowest freight tier. When an operation ships hundreds of small items a week, the 4x6 is usually the size that gets reordered most often."
    ],
    customContent: [
      "Even at 4x6 there is enough face area for a centered logo, a handle, or a short return address block. Small-format print works best kept to one or two colors on this size — a clean mark reads better than a busy layout on a compact panel, and it keeps the branded look consistent across a high-volume small-parcel program."
    ],
    bulkContent: [
      "4x6 mailers are among the most frequently reordered sizes because the shipments that use them repeat daily. When you request bulk pricing, tell us your monthly run rate and whether you want plain or printed stock — steady 4x6 demand is well suited to a standing reorder schedule that keeps the packing bench stocked without over-ordering."
    ],
    faqs: [
      ["What fits in a 4x6 bubble mailer?", "A 4x6 bubble mailer suits small, low-profile items — jewelry on a card, pins, sample packs, cards, SIM or memory cards, and single small accessories. Anything thicker than roughly an inch or wider than the flat opening is better in a 4x7 or 7x9."],
      ["Does a 4x6 bubble mailer ship at letter rates?", "Depending on total thickness and weight, a packed 4x6 can fall within small-parcel or thick-envelope rate bands. The compact size is specifically useful for keeping shipments in the lowest practical postage tier — confirm final dimensions with your carrier."],
      ["Can I order 4x6 bubble mailers in bulk?", "Yes. The 4x6 is one of our most common bulk sizes because the orders that use it repeat daily. Share your monthly quantity and whether you need plain or printed, and we will quote a bulk or standing-order rate."],
      ["Are 4x6 mailers available printed?", "Yes. A 4x6 has room for a centered logo or short return block. We recommend simple one or two-color print on this small size so the mark stays crisp across a high-volume run."]
    ]
  },

  "white-bubble-mailers": {
    overview: [
      "White bubble mailers trade the utilitarian look of kraft or gray poly for a clean, shelf-ready exterior, and for customer-facing brands that difference matters. The smooth white face photographs well for unboxing content, takes print legibly, and signals a more considered package the moment it lands in a mailbox.",
      "Underneath the presentation, a white mailer is still a working padded envelope: a bubble-lined interior absorbs everyday transit impact and a pressure-sensitive strip seals in one pass. Beauty, apparel-accessory, and subscription brands reach for white when they want the protection of a bubble mailer without the raw industrial appearance."
    ],
    benefits: [
      "Clean white exterior gives shipments a shelf-ready, brand-forward look that kraft and gray poly can't match.",
      "Smooth surface takes printed logos and handling notes clearly, including finer color work.",
      "Consistent appearance across multiple fulfillment sites keeps a brand looking uniform to every customer.",
      "Bubble-lined interior and self-seal closure keep the practical protection and packing speed intact."
    ],
    useCases: [
      "White mailers are the default for beauty, cosmetics, and self-care brands where the package is part of the product experience. A clean white parcel reads as premium and photographs well when customers share their orders.",
      "Subscription boxes, apparel accessories, and boutique retail also favor white because it holds brand consistency across every shipment. When the mailer is the first thing a customer touches, the tidier white presentation supports the brand rather than working against it."
    ],
    customContent: [
      "White stock is the best canvas we offer for print — it supports crisp black logos as well as more visible brand colors and handling marks. Brands building a recognizable unboxing moment often start with a printed white mailer because the contrast makes even a simple one-color logo look intentional and clean."
    ],
    bulkContent: [
      "Businesses usually buy white mailers in a small range of core sizes to cover their common shipments while keeping a uniform look. When quoting, let us know which sizes you run most and whether you want plain or printed white stock — a coordinated bulk order keeps presentation consistent across every parcel and fulfillment location."
    ],
    faqs: [
      ["Why choose a white bubble mailer over kraft?", "White mailers give a cleaner, more premium presentation and take printed branding more clearly, which matters for customer-facing brands. Kraft has a natural, paper-forward look. Choose white when the package appearance is part of your brand experience."],
      ["Do white bubble mailers show print well?", "Yes. The smooth white exterior is the best surface we offer for print — it supports crisp logos, brand colors, and handling notes with good contrast, better than kraft or gray poly."],
      ["What sizes do white bubble mailers come in?", "White mailers are available across the common size range from small (#000) up to larger formats. Most brands stock a few core sizes that cover their typical shipments — we can help you pick the right spread."],
      ["Are white bubble mailers good for beauty products?", "Yes. Beauty and self-care brands favor white for its clean, premium look and photogenic unboxing, combined with the padded protection cosmetics and small bottles need in transit."]
    ]
  },

  "8-5-x-12-bubble-mailer": {
    overview: [
      "The 8.5 x 12 bubble mailer is the mid-size workhorse that bridges the gap between small accessory envelopes and large apparel mailers. Its face is generous enough for documents, notebooks, folded garments, and boxed beauty sets, yet it still stores and ships far more efficiently than a corrugated carton for the same flat contents.",
      "For growing stores this size often becomes a core stocking item because it covers such a wide slice of everyday orders. A single 8.5 x 12 can take a paperback, a folded tee, or a small multi-item kit, which is why fulfillment teams frequently build a multi-size program around it as the flexible middle option."
    ],
    benefits: [
      "Mid-size face fits flat and medium-profile goods that are too big for small mailers but don't need a box.",
      "One flexible size covers a wide range of everyday orders, simplifying the packing station.",
      "Larger print surface gives room for a logo plus campaign or handling messaging.",
      "Still lighter and lower-profile than a carton, keeping freight cost down on flat shipments."
    ],
    useCases: [
      "This size is a staple for stores shipping documents, notebooks, and printed materials that need to stay flat and protected. It gives enough room to insert without forcing a fold, while the padding guards corners and edges through sorting.",
      "It is equally at home with folded apparel, beauty sets, and small kits. Because it handles so many order types, warehouse teams often treat the 8.5 x 12 as the default they reach for first and only step up or down when a specific product demands it."
    ],
    customContent: [
      "The 8.5 x 12 face gives real room for branding — enough for a logo alongside a short campaign line, seasonal message, or clear handling instructions. Growing brands often print this core size first because it appears in so many shipments, making it the most visible mailer in their program."
    ],
    bulkContent: [
      "Because the 8.5 x 12 covers such a broad range of orders, it is one of the most common sizes in a multi-size stocking plan and a frequent bulk line. Share your expected volume and whether it sits alongside smaller and larger sizes in your program, and we can help plan a balanced bulk order around your real order mix."
    ],
    faqs: [
      ["What fits in an 8.5 x 12 bubble mailer?", "The 8.5 x 12 suits flat and medium-profile goods — documents, notebooks, folded garments, beauty sets, and small kits. It is the flexible middle size for orders too large for small mailers but not needing a box."],
      ["Is 8.5 x 12 a good core stocking size?", "Yes. Because it covers such a wide range of everyday orders, many growing stores make the 8.5 x 12 a core size and build their smaller and larger stock around it."],
      ["Can 8.5 x 12 bubble mailers be printed?", "Yes. The larger face has room for a logo plus a short campaign or handling line, which is why brands often print this high-visibility core size first."],
      ["How does 8.5 x 12 compare to a box for flat items?", "For flat contents, the 8.5 x 12 mailer stores and ships lighter and lower-profile than a corrugated carton, which usually lowers freight cost while still cushioning the shipment."]
    ]
  },

  "4x7-bubble-mailer": {
    overview: [
      "The 4x7 bubble mailer adds a bit of height over the 4x6 without stepping up into a much larger storage footprint, which makes it the natural size for small items that are just slightly too long or too deep for the smallest envelope. Phone accessories, cable coils, slim cosmetics, and trading cards all settle into a 4x7 with a snug, protected fit.",
      "That extra inch of length is deceptively useful: it lets a packer close the flap cleanly over items that would strain a 4x6, avoiding the bulge that stresses a seal. For direct-to-consumer brands shipping compact add-ons, the 4x7 keeps the packout tight and branded while staying at a low freight weight."
    ],
    benefits: [
      "Slightly taller than a 4x6, fitting items that are just too long for the smallest mailer without oversizing.",
      "Snug fit reduces contents shifting, so small accessories arrive without rattling around.",
      "Keeps a compact storage footprint at the packing bench while broadening what you can ship.",
      "Low weight keeps compact accessory shipments in an economical postage band."
    ],
    useCases: [
      "The 4x7 is a favorite for phone and tech accessories, slim cosmetics, and trading or collectible cards — items that need a little more length than a 4x6 but are still small and light. The tighter fit keeps them from sliding around in transit.",
      "It is also a common choice for giftable add-ons and sample campaigns where a brand wants a neat, tight packout. Many stores keep 4x7 alongside 4x6 so they can match the mailer to the exact item without jumping to a mid-size envelope."
    ],
    customContent: [
      "The taller 4x7 panel gives a touch more room than a 4x6 for a branded packout — enough for a logo and a short return or handling line. For direct-to-consumer brands that want every small parcel to look considered, a simple print program on the 4x7 keeps the compact shipment on-brand."
    ],
    bulkContent: [
      "Many businesses stock 4x7 mailers in volume for sample runs, add-on products, and repeat small shipments. When requesting bulk pricing, note whether you pair it with 4x6 in your program — quoting the two compact sizes together often makes sense for operations shipping a steady stream of small items."
    ],
    faqs: [
      ["What is the difference between a 4x6 and 4x7 bubble mailer?", "The 4x7 adds about an inch of length over the 4x6, which fits items that are slightly too long or deep for the smallest mailer without moving up to a mid-size envelope. Many stores stock both to match the mailer to the item."],
      ["What items fit best in a 4x7 bubble mailer?", "Phone and tech accessories, cable coils, slim cosmetics, trading cards, and giftable add-ons — small items that need a little more height than a 4x6 but are still light and compact."],
      ["Can I order 4x7 bubble mailers in bulk?", "Yes. The 4x7 is often stocked in volume for sample campaigns and add-on shipments. Tell us your quantity and whether you also run 4x6, and we can quote the compact sizes together."],
      ["Is the 4x7 bubble mailer printable?", "Yes. The taller panel has room for a logo and a short return or handling line, keeping a compact direct-to-consumer packout on-brand."]
    ]
  },

  "2-bubble-mailer": {
    overview: [
      "The No. 2 bubble mailer follows the standard numbered sizing system that many buyers and fulfillment systems prefer over inch-based labels. As a compact numbered format, the No. 2 covers small retail products, cosmetics, and flat accessories with a padded interior and a familiar size reference that is easy to reorder against.",
      "For teams running structured packing programs, numbered sizing removes ambiguity: a No. 2 is a No. 2 whether it is on a purchase order, a shelf label, or a supplier quote. That consistency is why operations with scheduled replenishment often build their small-item packout around numbered mailers rather than tracking a mix of inch dimensions."
    ],
    benefits: [
      "Standard numbered sizing is easy to specify, reorder, and match across suppliers and systems.",
      "Compact padded format protects small retail products and cosmetics in transit.",
      "Predictable size reference simplifies shelf labeling and purchase orders.",
      "Fits neatly into scheduled replenishment programs with repeated reorder patterns."
    ],
    useCases: [
      "The No. 2 is used by businesses that prefer standardized mailer sizing over inch-based labels for small retail products, cosmetics, flat accessories, and parts packs. The numbered reference keeps ordering unambiguous across teams and locations.",
      "It fits especially well into long-term packing programs where the same small items ship repeatedly. Operations that plan stock around scheduled replenishment lean on numbered sizes like the No. 2 to keep the small-item packout consistent month to month."
    ],
    customContent: [
      "Numbered programs are straightforward to manage in branded packaging setups because the size is fixed and repeatable. A logo or return block prints cleanly on the No. 2 panel, and because the size recurs in scheduled reorders, a printed numbered mailer keeps branding consistent across every replenishment cycle."
    ],
    bulkContent: [
      "The No. 2 is often added to long-term packing programs with scheduled replenishment, which makes it a natural bulk and standing-order line. When quoting, tell us your reorder cadence and whether the No. 2 sits alongside other numbered sizes so we can plan a coordinated program around your real usage."
    ],
    faqs: [
      ["What size is a No. 2 bubble mailer?", "The No. 2 is a compact size in the standard numbered bubble mailer system, suited to small retail products, cosmetics, and flat accessories. Numbered sizing is a consistent reference used across suppliers and fulfillment systems."],
      ["Why use numbered bubble mailers instead of inch sizes?", "Numbered sizing removes ambiguity — a No. 2 is the same on a purchase order, shelf label, and quote. Teams running structured, repeatable packing programs often prefer it over tracking a mix of inch dimensions."],
      ["Can No. 2 bubble mailers be reordered on a schedule?", "Yes. The No. 2 fits well into scheduled replenishment programs. Share your reorder cadence and quantity and we can set up a coordinated standing order."],
      ["Are No. 2 bubble mailers available printed?", "Yes. A logo or return block prints cleanly on the No. 2 panel, and because the size recurs in reorders, printed numbered mailers keep branding consistent across cycles."]
    ]
  },

  "5-bubble-mailer": {
    overview: [
      "The No. 5 bubble mailer is a roomier numbered format for businesses that have outgrown small envelopes but do not want to move all the way into carton packaging. Folded apparel, soft goods, and multi-item kits fit a No. 5 comfortably, cushioned by the padded interior and closed in one pass with a pressure-sensitive seal.",
      "The larger panel is part of the appeal: it gives brands more visible real estate for logos and shipping instructions while keeping the speed and low weight of a padded envelope. For apparel and subscription operations shipping high weekly volume, the No. 5 hits a practical middle ground between protection, presentation, and freight efficiency."
    ],
    benefits: [
      "Roomier numbered size handles folded apparel and soft goods without stepping up to a box.",
      "Larger panel gives better visibility for logos and shipping instructions.",
      "Padded interior with self-seal closure keeps packing fast on high-volume runs.",
      "Lighter than a carton for the same soft contents, helping control freight on repeat orders."
    ],
    useCases: [
      "The No. 5 is a go-to for folded apparel, soft goods, and retail replenishment orders that need more room than mid-size mailers offer. Its padded interior protects soft items through sorting while the format keeps parcels light.",
      "Apparel brands and subscription programs shipping high weekly volume favor this size for its balance of capacity and speed. When the same soft-goods orders repeat at scale, the No. 5 often becomes a core numbered line in the packing program."
    ],
    customContent: [
      "The larger No. 5 panel is well suited to bolder branding — a logo with room to spare, plus clear shipping or handling instructions. Apparel and subscription brands that want their packout to feel branded at scale often print this size because it ships in high, visible volume."
    ],
    bulkContent: [
      "The No. 5 is frequently quoted for apparel and subscription programs that ship high weekly volume, which makes it a natural bulk line. Share your weekly run rate and whether it sits alongside other numbered sizes so we can plan a bulk or standing order that keeps your soft-goods packout stocked."
    ],
    faqs: [
      ["What fits in a No. 5 bubble mailer?", "The No. 5 is a roomier numbered size suited to folded apparel, soft goods, kits, and retail replenishment orders — items that need more room than mid-size mailers but don't require a box."],
      ["Is the No. 5 good for apparel shipping?", "Yes. Its capacity and padded interior make it a common choice for folded garments and soft goods, and its light weight helps control freight on high-volume apparel programs."],
      ["Can No. 5 bubble mailers be printed with a logo?", "Yes. The larger panel gives good visibility for logos and shipping instructions, which suits apparel and subscription brands wanting a branded packout at scale."],
      ["Do you offer bulk pricing on No. 5 bubble mailers?", "Yes. The No. 5 is often quoted for high-volume apparel and subscription programs. Share your weekly quantity and we will quote a bulk or standing-order rate."]
    ]
  },

  "bubble-mailer-bags": {
    overview: [
      "Bubble mailer bags are the format fulfillment operations reach for when they want padded protection without a box-first workflow. A packer grabs a bag, drops the item in, peels the self-seal flap, and the order is done — a motion measured in seconds that adds up to real throughput across a warehouse shift.",
      "The bag construction keeps the same bubble cushioning as a rigid-feeling mailer while flexing around soft and irregular contents. Available across a wide size range, in plain, white, kraft-style, and custom-print options, bubble mailer bags are built for operations that value packout speed and storage density as much as the protection itself."
    ],
    benefits: [
      "Grab-fill-seal workflow closes an order in seconds, maximizing packout speed across a shift.",
      "Flexible bag construction conforms to soft and irregular items that a rigid envelope wastes space on.",
      "Available across a wide size range so one bag family can cover a mixed product catalog.",
      "Plain, white, kraft-style, and custom-print options let you match presentation to the brand."
    ],
    useCases: [
      "Bubble mailer bags are built for eCommerce and warehouse packing lines shipping high daily volume. Their speed and storage density make them the default in fulfillment centers where every second and every inch of shelf space at the station matters.",
      "They also suit subscription mailouts and retail shipping where soft or irregular items ship in quantity. Because the format flexes around contents, a single bag size can handle a broader range of products than a fixed-dimension envelope, simplifying the packout."
    ],
    customContent: [
      "Because bubble mailer bags are used at high volume and are often the customer's first touchpoint, they are a strong candidate for custom print. Plain, white, and kraft-style options each take branding differently, and a printed bag turns a fast, functional packout into a branded shipping experience without slowing the line."
    ],
    bulkContent: [
      "Bulk bag orders are the norm for fulfillment centers and repeat monthly shipping programs where throughput is high and consistent. Share your monthly volume, the sizes you run, and whether you want plain or printed stock, and we can plan a bulk program that keeps every packing station supplied."
    ],
    faqs: [
      ["What is the difference between a bubble mailer and a bubble mailer bag?", "The terms overlap heavily — a bubble mailer bag emphasizes the flexible bag-style construction that flexes around soft or irregular contents and closes fast with a self-seal flap. Functionally both are padded mailing envelopes; bags are favored for high-throughput packout."],
      ["What sizes do bubble mailer bags come in?", "Bubble mailer bags are available across a wide range from 4x6 up to 12x15. A single bag family can cover a mixed catalog, which is why fulfillment teams often standardize on them."],
      ["Are bubble mailer bags good for high-volume fulfillment?", "Yes. Their grab-fill-seal workflow and storage density make them the default in warehouses and fulfillment centers shipping high daily volume."],
      ["Can bubble mailer bags be custom printed?", "Yes. They come in plain, white, kraft-style, and custom-print options. A printed bag adds branding to a fast packout without slowing the line."]
    ]
  },

  "6-bubble-mailer": {
    overview: [
      "The No. 6 bubble mailer is a large numbered format that steps in when standard mid-size mailers no longer give enough room. Larger apparel, document packs, kits, and flat boxed items fit the No. 6 comfortably, keeping the padded-envelope advantages of speed and low weight at a size that would otherwise push a business toward cartons.",
      "In a numbered stocking program the No. 6 usually sits alongside the No. 5 and No. 7, giving operations a stepped range that covers progressively larger products without gaps. That coverage is why teams shipping a spread of larger soft goods often carry all three sizes rather than forcing everything into one."
    ],
    benefits: [
      "Large numbered size handles bigger apparel and document packs without moving to a box.",
      "Clean panel space for brand print, shipping notices, and account-specific pack labels.",
      "Sits neatly between the No. 5 and No. 7 for stepped size coverage.",
      "Keeps padded-envelope speed and weight advantages at a larger capacity."
    ],
    useCases: [
      "The No. 6 is used for larger apparel, document packs, kits, and flat boxed items that have outgrown mid-size mailers. Its capacity handles bigger soft goods while the padded interior still protects through sorting.",
      "Operations teams often buy the No. 6 alongside the No. 5 and No. 7 so their numbered program covers a broad product range in defined steps. When larger orders are a regular part of the mix, having this size on the shelf avoids over-boxing shipments that a mailer can handle."
    ],
    customContent: [
      "The larger No. 6 panel handles brand printing, shipping notices, and account-specific pack labels cleanly, with room that smaller numbered sizes don't offer. For businesses shipping to retail or wholesale accounts, that space is useful for both branding and the practical handling information larger shipments often need."
    ],
    bulkContent: [
      "The No. 6 is commonly bought in bulk alongside the No. 5 and No. 7 as part of a stepped numbered program. When quoting, tell us which numbered sizes you run together and your volumes, so we can plan a coordinated bulk order that covers your full range of larger shipments."
    ],
    faqs: [
      ["What fits in a No. 6 bubble mailer?", "The No. 6 is a large numbered size suited to larger apparel, document packs, kits, and flat boxed items that have outgrown mid-size mailers but don't require a carton."],
      ["When should I step up from a No. 5 to a No. 6?", "When standard mid-size and No. 5 mailers no longer give enough room for the product. Many operations stock No. 5, No. 6, and No. 7 together to cover progressively larger items in defined steps."],
      ["Can No. 6 bubble mailers carry account pack labels?", "Yes. The larger panel has clean room for brand print, shipping notices, and account-specific handling labels, which is useful for retail and wholesale shipments."],
      ["Is bulk pricing available on No. 6 bubble mailers?", "Yes. The No. 6 is often bought in bulk alongside the No. 5 and No. 7. Share the sizes and volumes you run and we will quote a coordinated program."]
    ]
  },

  "bubble-mailer-packaging": {
    overview: [
      "Bubble mailer packaging is the broad, program-level category for companies that want to standardize protection, branding, and shipping speed across their whole operation rather than buying one size at a time. It spans multiple exterior finishes and padded interior formats, from a single core size to a full custom-sized, custom-printed packaging program tied to specific SKUs.",
      "Thinking at the packaging-program level changes the questions: not just which mailer, but how a coordinated set of sizes, finishes, and print treatments can make every outbound shipment faster to pack, cheaper to ship, and more consistent to the customer. That is where a supplier relationship matters more than a one-off order."
    ],
    benefits: [
      "Program-level approach standardizes protection, branding, and packout across the whole operation.",
      "Multiple exterior finishes and padded formats coordinated into one consistent system.",
      "Custom sizes and print planning tied to your specific repeat SKUs.",
      "Volume support for both standard and custom packaging requirements together."
    ],
    useCases: [
      "Bubble mailer packaging suits companies building a coordinated shipping system — branded shipping, retail packaging, warehouse order programs, and custom campaigns handled as one plan rather than scattered purchases. The goal is consistency across every parcel and location.",
      "It is especially relevant for brands with repeat SKUs that want packaging designed around their actual products: the right sizes, the right finish, and a print treatment that carries the brand. A packaging program turns shipping supplies from a commodity purchase into part of the customer experience."
    ],
    customContent: [
      "Custom sizes, branded print, and layout planning are the heart of a packaging program, especially for repeat SKUs where the same products ship over and over. Designing the mailer around the product — the right dimensions, finish, and print zones — is what separates a considered packaging program from ad-hoc supply buying, and it is where we can add the most value."
    ],
    bulkContent: [
      "We support volume planning for both standard and custom packaging requirements as part of a program. When you request a quote, describe your product range, the finishes you want, and whether custom sizing or print is involved, so we can plan coordinated bulk supply around your real packaging needs rather than a single line item."
    ],
    faqs: [
      ["What does 'bubble mailer packaging' cover?", "It is the program-level category for standardizing protection, branding, and shipping speed across an operation — spanning multiple finishes, padded formats, standard and custom sizes, and print, planned as one coordinated system rather than one-off orders."],
      ["Can you design packaging around my specific products?", "Yes. Custom sizes, branded print, and layout planning tied to your repeat SKUs are the core of a packaging program. Designing the mailer around the product is where a program adds the most value."],
      ["Do you support both standard and custom packaging in one program?", "Yes. We plan volume for standard stock and custom requirements together, so a business can run a coordinated program instead of separate purchases."],
      ["How do I start a bubble mailer packaging program?", "Share your product range, the finishes you want, and whether custom sizing or print is involved. We use that to plan coordinated bulk supply around your real packaging needs."]
    ]
  },

  "7-bubble-mailer": {
    overview: [
      "The No. 7 bubble mailer is one of the largest numbered formats, chosen when a business needs a big face size but still wants the speed and light weight of a padded envelope rather than a carton. Larger folded apparel, magazines, soft retail kits, and multi-item orders all fit the generous No. 7 opening.",
      "At this size the front panel becomes prime branding space, with room for bolder print zones and clear return information. For high-volume retail replenishment and apparel distribution, the No. 7 lets an operation ship larger soft goods at scale without giving up the packout advantages that make bubble mailers efficient in the first place."
    ],
    benefits: [
      "Large face size handles bigger folded apparel and multi-item orders in an envelope format.",
      "Generous panel supports bolder print zones and clear return information.",
      "Keeps padded-envelope speed and low weight at a large capacity.",
      "Well suited to high-volume retail replenishment and apparel distribution."
    ],
    useCases: [
      "The No. 7 is chosen for larger folded apparel, magazines, soft retail kits, and multi-item orders that need a big opening but suit an envelope rather than a box. The padded interior protects soft contents while the format keeps parcels lighter than cartons.",
      "It is frequently used in high-volume retail replenishment and apparel distribution, where the same larger soft-goods orders ship repeatedly. Brands using large mailers at this scale often treat the No. 7 as the top of their numbered range."
    ],
    customContent: [
      "Brands using large mailers like the No. 7 often include bolder print zones and prominent return information, taking advantage of the generous panel. When larger soft-goods orders ship in high volume, a well-printed No. 7 becomes a visible, repeated brand impression across a distribution program."
    ],
    bulkContent: [
      "The No. 7 is frequently quoted for high-volume retail replenishment and apparel distribution, which makes it a natural bulk line at the top of a numbered range. Share your volume and the other numbered sizes you run so we can plan a coordinated bulk order for your larger shipments."
    ],
    faqs: [
      ["What fits in a No. 7 bubble mailer?", "The No. 7 is one of the largest numbered sizes, suited to larger folded apparel, magazines, soft retail kits, and multi-item orders that need a big opening but suit an envelope rather than a box."],
      ["Is the No. 7 good for apparel distribution?", "Yes. Its large capacity, padded interior, and light weight make it a common choice for high-volume retail replenishment and apparel distribution."],
      ["Does the No. 7 have room for bold branding?", "Yes. The generous front panel supports bolder print zones and prominent return information, making it a visible brand impression at scale."],
      ["Can I get bulk pricing on No. 7 bubble mailers?", "Yes. The No. 7 is frequently quoted for high-volume programs. Share your volume and the other numbered sizes you run for a coordinated bulk quote."]
    ]
  },

  "10-5-x-15-bubble-mailer": {
    overview: [
      "The 10.5 x 15 bubble mailer is a large-format padded envelope built for products that need a generous opening and more internal face area than mid-size mailers provide. Larger garments, document packets, catalogs, and flat boxed goods slide into the 10.5 x 15 without folding or forcing, protected by the bubble lining through transit.",
      "This size is common in apparel and catalog shipping, where order dimensions tend to be more consistent and predictable. When a business regularly ships larger flat items, the 10.5 x 15 gives the room they need while keeping the weight and packout speed advantages that make a mailer preferable to a box for flat contents."
    ],
    benefits: [
      "Large face and generous opening fit bigger garments and catalogs without folding.",
      "More internal face area than mid-size mailers for larger flat products.",
      "Strong front-panel visibility for branding and simple handling marks.",
      "Keeps flat large shipments lighter and lower-profile than a carton."
    ],
    useCases: [
      "The 10.5 x 15 is a natural fit for larger garments, document packets, and catalogs that need a wide opening and flat protection. Its generous face area accommodates items that would have to be folded into a smaller mailer.",
      "It is common in apparel and catalog shipping programs where order dimensions are consistent. When larger flat items ship in predictable sizes and volumes, the 10.5 x 15 becomes a dependable core size that avoids over-boxing."
    ],
    customContent: [
      "The 10.5 x 15 front panel offers strong brand visibility and room for simple handling marks, taking advantage of the large flat face. For apparel and catalog brands shipping this size regularly, a printed panel turns a large, frequently-seen parcel into consistent brand exposure."
    ],
    bulkContent: [
      "The 10.5 x 15 is common in apparel and catalog shipping where dimensions are consistent, which suits bulk ordering. Share your volume and whether it sits alongside other large sizes in your program so we can plan a bulk order matched to your larger flat shipments."
    ],
    faqs: [
      ["What fits in a 10.5 x 15 bubble mailer?", "The 10.5 x 15 is a large-format mailer suited to larger garments, document packets, catalogs, and flat boxed goods that need a wide opening and more face area than mid-size mailers."],
      ["Is 10.5 x 15 good for apparel shipping?", "Yes. It is common in apparel and catalog shipping, where its generous face fits larger flat items without folding, and its light weight keeps freight lower than a box."],
      ["Can the 10.5 x 15 mailer be printed?", "Yes. The large front panel gives strong brand visibility and room for handling marks, useful for brands shipping this size regularly."],
      ["Do you offer bulk pricing on 10.5 x 15 bubble mailers?", "Yes. It suits bulk ordering for apparel and catalog programs. Share your volume and the other sizes you run for a coordinated quote."]
    ]
  },

  "7x9-bubble-mailer": {
    overview: [
      "The 7x9 bubble mailer is one of the most-used everyday sizes because it strikes a near-ideal balance between storage efficiency, protection, and product flexibility. Accessories, small books, beauty packs, and gift items all fit a 7x9 comfortably, which is why so many fulfillment teams treat it as a core packing-station size.",
      "Its versatility is the whole point: the 7x9 is large enough for a wide slice of common orders yet small enough to stay light and store densely. For an operation that wants to minimize the number of sizes it stocks while still covering most shipments, the 7x9 is often the single most valuable size to keep on hand."
    ],
    benefits: [
      "Balances storage efficiency, protection, and flexibility better than almost any other size.",
      "Fits a wide slice of everyday orders, reducing how many sizes you need to stock.",
      "Light and dense to store, keeping the packing station lean.",
      "Enough print surface for brand marks without overwhelming smaller shipments."
    ],
    useCases: [
      "The 7x9 is a default for accessories, small books, beauty packs, and gift items — the everyday orders that make up the bulk of many stores' shipments. Its balance of size and protection covers most of them without over- or under-sizing.",
      "Fulfillment teams often treat the 7x9 as one of the core sizes at every packing station because it handles so much of the daily mix. When an operation wants to keep its size range tight, the 7x9 is usually the anchor it builds around."
    ],
    customContent: [
      "The 7x9 supports brand print without overwhelming smaller shipments — enough face for a clean logo and short handling line while staying proportionate to the everyday orders it carries. Because this size appears in so many shipments, printing it gives a brand consistent, high-frequency exposure."
    ],
    bulkContent: [
      "Many fulfillment teams treat the 7x9 as a core size, which makes it one of the most common bulk lines. Share your volume and whether it anchors a multi-size program, and we can plan a bulk or standing order around what is often a business's highest-use mailer."
    ],
    faqs: [
      ["What is a 7x9 bubble mailer best for?", "The 7x9 is an everyday size suited to accessories, small books, beauty packs, and gift items. Its balance of storage efficiency, protection, and flexibility makes it a core packing-station size."],
      ["Why is 7x9 such a popular size?", "It balances size, protection, and storage better than most — large enough for a wide range of common orders yet small enough to stay light and store densely, so it covers much of the daily mix with one size."],
      ["Can 7x9 bubble mailers be printed?", "Yes. The 7x9 has enough face for a clean logo and short handling line without overwhelming smaller shipments, and because it ships so often, printing it gives high-frequency brand exposure."],
      ["Is bulk pricing available for 7x9 bubble mailers?", "Yes. As a core size for many fulfillment teams, the 7x9 is one of the most common bulk lines. Share your volume for a bulk or standing-order quote."]
    ]
  },

  "9x6-bubble-mailer": {
    overview: [
      "The 9x6 bubble mailer offers a wider opening relative to its length, which suits products that need more width than a small mailer but not the extra length of a catalog format. Retail accessories, beauty orders, stationery, and small books sit well in a 9x6 where product width, rather than length, is the constraint.",
      "That width-forward proportion makes the 9x6 a useful specialist in a mixed-size program. When an item is too wide for a narrow envelope but does not justify a larger format, the 9x6 fills the gap — giving packers a size that matches the product shape instead of forcing a compromise fit."
    ],
    benefits: [
      "Wider opening suits products where width, not length, is the limiting dimension.",
      "Fits the gap between narrow small mailers and longer catalog formats.",
      "Rectangular face gives clean room for print layouts and handling details.",
      "Useful specialist size in a mixed-size packing program."
    ],
    useCases: [
      "The 9x6 suits retail accessories, beauty orders, stationery, and small books where the product needs a wider opening than a narrow small mailer offers. Its proportion matches items that are more square or wide than long.",
      "It is most useful in mixed-size packing programs, where having a width-forward option prevents packers from forcing a wide item into an ill-fitting narrow envelope. When product width matters more than length, the 9x6 is the size that fits."
    ],
    customContent: [
      "The 9x6 front panel is a clean rectangular surface useful for print layouts and order handling details. For brands shipping wider retail and beauty items, printing this size keeps the branded look consistent even on the products that need a width-forward mailer rather than a standard narrow one."
    ],
    bulkContent: [
      "The 9x6 is useful in mixed-size packing programs when product width matters more than length, which makes it a targeted bulk line rather than a universal one. Tell us the products you use it for and your volume so we can quote it as part of a balanced multi-size order."
    ],
    faqs: [
      ["What is a 9x6 bubble mailer used for?", "The 9x6 suits products that need a wider opening than a narrow small mailer but not the extra length of a catalog format — retail accessories, beauty orders, stationery, and small books where width is the constraint."],
      ["How is a 9x6 different from a 7x9 bubble mailer?", "The 9x6 is proportioned wider relative to its length, suiting more square or wide items, while the 7x9 is a balanced everyday size. In a mixed-size program the 9x6 covers width-forward products specifically."],
      ["Can 9x6 bubble mailers be printed?", "Yes. The rectangular front panel gives clean room for print layouts and handling details, keeping branding consistent on wider retail and beauty shipments."],
      ["Is the 9x6 a good bulk size?", "It is a targeted size best bought as part of a mixed-size program for width-forward products. Share what you ship in it and your volume for a coordinated bulk quote."]
    ]
  },

  "12x12-bubble-mailer": {
    overview: [
      "The 12x12 bubble mailer solves a specific problem: square products that do not sit naturally in narrow, rectangular envelope shapes. Prints, flat gift kits, square apparel packs, and marketing packs all fit a 12x12's equal dimensions without the awkward diagonal fit or wasted corners a rectangular mailer would leave.",
      "Its square proportion also makes it a natural fit for centered, campaign-based branding. When a business ships square-format items — especially in seasonal or promotional runs — the 12x12 matches the product shape and gives print designers a balanced canvas that a rectangular mailer cannot offer."
    ],
    benefits: [
      "Square shape fits square products that sit awkwardly in rectangular mailers.",
      "Equal dimensions eliminate the wasted corners and diagonal fit of narrow envelopes.",
      "Balanced square panel is ideal for centered logos and campaign print.",
      "Well suited to seasonal and promotional runs of square-format items."
    ],
    useCases: [
      "The 12x12 serves prints, flat gift kits, square apparel packs, and marketing packs — products whose square footprint doesn't suit narrow envelope shapes. The matching proportions give a clean, protected fit without forcing the item.",
      "It is especially useful for seasonal campaigns and brands shipping square-format items in volume. When the product itself is square, the 12x12 is the size that fits naturally, and its balanced panel suits centered campaign branding."
    ],
    customContent: [
      "Square panels work well for centered logos and campaign-based printed packaging, giving designers a balanced canvas that rectangular mailers lack. For seasonal and promotional runs of square products, a printed 12x12 lets the packaging match both the shape of the item and the look of the campaign."
    ],
    bulkContent: [
      "The 12x12 is useful for seasonal campaigns and brands shipping square-format items in volume, which makes it a campaign- and run-based bulk line. Share the campaign timing and volume, and whether you want custom print, so we can plan a bulk order sized to your square-format shipments."
    ],
    faqs: [
      ["What is a 12x12 bubble mailer for?", "The 12x12 is a square mailer for square products — prints, flat gift kits, square apparel packs, and marketing packs — that sit awkwardly in narrow rectangular envelopes."],
      ["Why use a square mailer instead of a rectangular one?", "For square products, matching square dimensions gives a clean fit without the wasted corners or diagonal placement a rectangular mailer forces, and the balanced panel suits centered campaign print."],
      ["Is the 12x12 good for promotional campaigns?", "Yes. Its square shape and balanced panel suit seasonal and promotional runs of square-format items, where the packaging can match both the product shape and the campaign look."],
      ["Can I order 12x12 bubble mailers in bulk with print?", "Yes. It is often bought for campaign runs. Share your timing, volume, and whether you want custom print for a coordinated bulk quote."]
    ]
  },

  "12x15-bubble-mailer": {
    overview: [
      "The 12x15 bubble mailer is a large-capacity padded envelope for products that are too big for standard everyday mailers but still suit an envelope format rather than a box. Large garments, catalog packs, multi-item kits, and soft retail replenishment all fit the broad 12x15 internal area, cushioned by the bubble lining and closed with a self-sealing flap.",
      "The large face size does double duty: it gives products the room they need and gives brands more space for print and shipping instructions than any smaller mailer. For apparel and seasonal campaign programs shipping bigger soft goods in volume, the 12x15 is often the largest practical mailer before a shipment truly needs a carton."
    ],
    benefits: [
      "Large internal area handles big garments and multi-item kits in an envelope format.",
      "Broad face gives the most room of any mailer for print and shipping instructions.",
      "Self-sealing closure keeps packout fast even at the larger size.",
      "Lighter than a carton for large soft goods, controlling freight on volume programs."
    ],
    useCases: [
      "The 12x15 is used for large garments, catalog packs, multi-item kits, and soft retail replenishment — bigger items that suit an envelope rather than a box. Its broad internal area accommodates products that smaller mailers cannot.",
      "It is often purchased in bulk for apparel and seasonal campaign programs where larger soft goods ship in volume. When shipments are big but still flat and soft, the 12x15 is usually the largest mailer a program needs before moving to cartons."
    ],
    customContent: [
      "The large 12x15 face gives brands more room for print and shipping instructions than any smaller mailer, which suits apparel and campaign shipments where both branding and handling detail matter. A printed 12x15 makes a large, highly visible parcel work as brand exposure across a distribution or seasonal program."
    ],
    bulkContent: [
      "The 12x15 is often purchased in bulk for apparel and seasonal campaign programs shipping larger soft goods in volume. Share your campaign timing and volume, and whether custom print is involved, so we can plan a bulk order matched to your largest envelope-format shipments."
    ],
    faqs: [
      ["What fits in a 12x15 bubble mailer?", "The 12x15 is a large-capacity mailer for large garments, catalog packs, multi-item kits, and soft retail replenishment — bigger items that suit an envelope rather than a box."],
      ["When should I use a 12x15 instead of a box?", "For large but flat and soft contents, the 12x15 ships lighter and lower-profile than a carton while still cushioning the shipment. It is usually the largest mailer a program needs before moving to boxes."],
      ["Does the 12x15 have room for branding?", "Yes. Its broad face gives more room for print and shipping instructions than any smaller mailer, useful for apparel and campaign shipments."],
      ["Is bulk pricing available for 12x15 bubble mailers?", "Yes. It is often bought in bulk for apparel and seasonal campaigns. Share your timing, volume, and print needs for a coordinated quote."]
    ]
  },

  "3-bubble-mailer": {
    overview: [
      "The No. 3 bubble mailer occupies a practical middle ground in the numbered system — larger than the very small formats but more compact than the spacious daily-use sizes. Small retail products, beauty accessories, documents, and samples fit the No. 3 comfortably, making it a versatile everyday size for businesses that prefer numbered references.",
      "That middle position is what makes it useful: the No. 3 is roomy enough for a slightly larger item than the smallest mailers handle, yet compact enough to keep freight weight and storage footprint modest. For operations with stable, repeating day-to-day shipping, it is a dependable numbered size that rarely goes unused."
    ],
    benefits: [
      "Middle numbered size bridges very small formats and larger daily-use mailers.",
      "Compact enough to keep freight weight and storage footprint modest.",
      "Standard numbered reference is easy to reorder and match across systems.",
      "Versatile fit for small retail products, documents, and samples alike."
    ],
    useCases: [
      "The No. 3 suits small retail products, beauty accessories, documents, and samples that need a little more room than the smallest mailers but don't justify a larger size. Its middle proportions cover a broad set of everyday small shipments.",
      "It is often reordered by businesses with stable day-to-day shipping needs, where the same small items move consistently. As a dependable numbered size, the No. 3 tends to stay in steady rotation at the packing bench rather than being a specialist format."
    ],
    customContent: [
      "The No. 3 is common for simple branded shipping programs and repeat product lines, where a clean logo or return block on the panel keeps everyday small shipments on-brand. Because the size recurs in steady reorders, a printed No. 3 delivers consistent branding across a business's routine outbound orders."
    ],
    bulkContent: [
      "No. 3 bubble mailers are often reordered by businesses with stable day-to-day shipping needs, which makes them well suited to bulk and standing orders. Share your reorder cadence and whether the No. 3 sits alongside other numbered sizes so we can plan a coordinated program around your routine shipments."
    ],
    faqs: [
      ["What size is a No. 3 bubble mailer?", "The No. 3 is a middle size in the numbered system — larger than the smallest formats but more compact than spacious daily-use sizes. It suits small retail products, beauty accessories, documents, and samples."],
      ["When should I choose a No. 3 bubble mailer?", "When an item needs a little more room than the smallest mailers offer but doesn't justify a larger size, and you prefer numbered sizing. It is a versatile everyday middle size."],
      ["Can No. 3 bubble mailers be reordered on a schedule?", "Yes. They are often reordered by businesses with stable day-to-day shipping. Share your cadence and quantity for a standing or bulk order."],
      ["Are No. 3 bubble mailers available printed?", "Yes. A clean logo or return block prints well on the panel, and because the size recurs in steady reorders, printed No. 3 mailers keep routine shipments on-brand."]
    ]
  }
};

const productsBySlug = new Map(products.map((product) => [product.slug, product]));
// The checkout catalog (order-data.js) must carry exactly these products at exactly these prices.
for (const product of products) {
  const entry = ORDER.CATALOG[product.slug];
  if (!entry || entry.name !== product.name || Number(entry.price) !== Number(product.price)) throw new Error(`order-data.js is out of step with products: ${product.slug} (${product.name}, ${product.price})`);
}
for (const slug of Object.keys(ORDER.CATALOG)) if (!productsBySlug.has(slug)) throw new Error(`order-data.js lists an unknown product: ${slug}`);

const mainPages = [
  { slug: "", title: "Bubble Mailers in Bulk: Kraft, White and Custom Printed", metaTitle: "Bubble Mailers | Bulk & Wholesale Padded Mailers USA | Shop Bubble Mailers", metaDescription: "Bubble mailers in bulk for US businesses: kraft and white padded mailers from 4x6 to #7, plain or logo printed, by the case or pallet. Quote back in 1-2 hours." },
  { slug: "about-us", title: "About Shop Bubble Mailers", metaTitle: "About Shop Bubble Mailers | USA Bubble Mailer Supplier", metaDescription: "Learn about Shop Bubble Mailers, our product range, and how we support businesses across the USA with bulk bubble mailer supply." },
  { slug: "products", title: "Every Bubble Mailer Size We Stock", metaTitle: "Bubble Mailer Sizes & Types – Compare All Mailers | Shop Bubble Mailers", metaDescription: "Compare every bubble mailer size side by side: inch and numbered sizes, usable dimensions, what fits, and bulk starting prices. Kraft, white and printed." },
  { slug: "custom-bubble-mailers", title: "Custom Printed Bubble Mailers", metaTitle: "Custom Bubble Mailers – Logo Printed Padded Mailers | Shop Bubble Mailers", metaDescription: "Custom bubble mailers printed with your logo in 1, 2 or full color on kraft or white stock. Proofed before production, MOQ 250 mailers, shipped USA-wide." },
  { slug: "contact-us", title: "Contact Us", metaTitle: "Contact Shop Bubble Mailers", metaDescription: "Contact Shop Bubble Mailers for quotes, product guidance, and bulk bubble mailer support in the USA." },
  { slug: "privacy-policy", title: "Privacy Policy", metaTitle: "Privacy Policy | Shop Bubble Mailers", metaDescription: "Read the Shop Bubble Mailers privacy policy covering website inquiries, quote requests, and contact information use." },
  { slug: "terms-and-conditions", title: "Terms and Conditions", metaTitle: "Terms and Conditions | Shop Bubble Mailers", metaDescription: "Read the Shop Bubble Mailers terms and conditions for website use, quote requests, and business communications." },
  { slug: "sitemap", title: "Sitemap", metaTitle: "HTML Sitemap | Shop Bubble Mailers", metaDescription: "Browse the full HTML sitemap for Shop Bubble Mailers pages and product URLs." }
];

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products/", label: "Products" },
  { href: "/custom-bubble-mailers/", label: "Custom" },
  { href: "/kraft-bubble-mailers/", label: "Kraft" },
  { href: "/white-bubble-mailers/", label: "White" },
  { href: "/locations/", label: "Locations" }
];

/** Routes that carry a noindex tag and therefore stay out of the sitemap. */
const NOINDEX_ROUTES = new Set(["/thank-you/", "/checkout/", "/order-confirmed/"]);

const siteRoutes = [];
const registerRoute = (route) => {
  if (!siteRoutes.includes(route)) {
    siteRoutes.push(route);
  }
};

const absoluteUrl = (routePath) => `${site.domain}${routePath}`;
const imageAbsoluteUrl = (imagePath) => `${site.domain}${imagePath}`;

const buildBreadcrumbSchema = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.label,
    item: absoluteUrl(item.href)
  }))
});

const globalSchemas = () => [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.brand,
    url: site.domain,
    logo: { "@type": "ImageObject", url: `${site.domain}/apple-touch-icon.png` },
    image: imageAbsoluteUrl(site.socialImage),
    email: site.email,
    telephone: site.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "2975 Coburn Hollow Road",
      addressLocality: site.city,
      addressRegion: site.state,
      postalCode: site.postalCode,
      addressCountry: site.country
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: site.brand,
    image: imageAbsoluteUrl(site.socialImage),
    url: site.domain,
    telephone: site.phone,
    email: site.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "2975 Coburn Hollow Road",
      addressLocality: site.city,
      addressRegion: site.state,
      postalCode: site.postalCode,
      addressCountry: site.country
    },
    areaServed: "United States",
    priceRange: "$",
    description: "Bulk supplier of bubble mailers, kraft bubble mailers, white padded envelopes, and custom bubble mailer packaging."
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.brand,
    url: site.domain
  }
];

const faqSchema = (faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(([question, answer]) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer
    }
  }))
});

/**
 * Per-unit starting price at bulk quantity (5,000+). Each product carries its
 * own figure so a 12x15 is never priced like a 4x6; the same value feeds the
 * visible price block and the Offer schema.
 */
const productUnitPrice = (product) => product.price;

/**
 * Visible starting-price block for product pages. It reads productUnitPrice,
 * the SAME function Offer.price uses, so the figure a shopper sees and the
 * figure in the structured data cannot drift apart. Google reads the landing
 * page and the markup together: a priced Offer with no price anywhere on the
 * page is a Merchant Center misrepresentation risk.
 */
const renderProductPrice = (product) => `
          <div class="product-price">
            <p class="product-price-line"><span class="product-price-amount">Starting from $${productUnitPrice(product)}</span><span class="product-price-unit">per mailer</span></p>
            <p class="product-price-note">Starting unit price at bulk quantity, with free shipping to any US address. Your final price depends on size, quantity, material, and printing - request a quote for a firm figure.</p>
          </div>`;


/**
 * Payment marks and order seals under every submit button (owner 2026-11-05). Every order is paid
 * on a PayPal invoice, which takes PayPal, cards, Apple Pay and Google Pay; each seal restates a
 * fact printed on the site (HTTPS, digital proof, free US shipping).
 */
const PAY_CARDS = [["visa", "Visa"], ["mastercard", "Mastercard"], ["amex", "American Express"], ["discover", "Discover"], ["apple-pay", "Apple Pay"], ["google-pay", "Google Pay"]];
const renderPayBadges = () => `<div class="pay-badges"><span class="pay-badges-pp"><img src="/badges/paypal.svg" alt="" width="20" height="20" loading="lazy" decoding="async"><span>We accept <b>PayPal</b></span></span><span class="pay-badges-cards"><span class="pay-badges-logos">${PAY_CARDS.map(([file, name]) => `<img src="/badges/${file}.svg" alt="${name}" width="40" height="25" loading="lazy" decoding="async">`).join("")}</span><span>Pay by card through PayPal</span></span></div>`;
const SEAL_ICONS = {
  lock: '<rect x="4.5" y="10.5" width="15" height="10"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/><path d="M12 14.5v2.5"/>',
  proof: '<path d="M5.5 2.5h9l4 4v15h-13z"/><path d="M8.5 13.5l2.5 2.5 4.5-5"/>',
  truck: '<path d="M1.5 5.5h12v11h-12zM13.5 9.5h4.5l3.5 3.5v3.5h-8"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
};
const renderSeals = () => `<ul class="order-seals" aria-label="Ordering with ${site.brand}">${[["lock", "<b>SSL secure</b> checkout"], ["proof", "<b>Free digital</b> proof"], ["truck", "<b>Free shipping</b> any US address"]].map(([key, text]) => `<li><svg viewBox="0 0 24 24" aria-hidden="true">${SEAL_ICONS[key]}</svg><span>${text}</span></li>`).join("")}</ul>`;
const renderFormSeals = () => `<div class="form-trust">${renderSeals()}${renderPayBadges()}</div>`;

/**
 * Product-page order box: the product's own starting price, minimum order (MOQ) 250 mailers. "Add to order" keeps
 * the line in localStorage (src/script.js) and opens /checkout/; without JavaScript the form lands
 * on /checkout/?add=<slug>&qty=<n>. Only the unit price shows here (owner 2026-11-02); the real
 * total is on /checkout/. api/order.js re-prices every line from order-data.js.
 */
const renderOrderBox = (product) => {
  const price = ORDER.unitPrice(product.slug);
  const id = `order-${product.slug}`;
  return `
          <div class="order-box" id="order">
            <h2 id="${id}-h">Order ${product.name.toLowerCase()}s</h2>
            <p class="order-box-from"><strong>Starting from ${ORDER.money(price)} per ${ORDER.UNIT}</strong></p>
            <p class="order-box-lede">Plain stock at the starting price. Minimum order (MOQ) ${ORDER.PACK_QTY.toLocaleString("en-US")} ${ORDER.UNITS}. Free shipping to any US address. Printing is quoted on top; ask on the next page or in the quote form.</p>
            <form method="get" action="/checkout/" data-order-box data-slug="${product.slug}" data-unit="${price}" aria-labelledby="${id}-h">
              <input type="hidden" name="add" value="${product.slug}">
              <div class="order-box-row">
                <label>Quantity
                  <select name="qty" data-order-qty>${ORDER.QUANTITIES.map((qty) => `<option value="${qty}"${qty === ORDER.DEFAULT_QTY ? " selected" : ""}>${qty.toLocaleString("en-US")} ${ORDER.UNITS}</option>`).join("")}</select>
                </label>
                <button type="submit" class="button button-primary" data-order-add>Add to order</button>
              </div>
              <p class="order-box-hint">Review your order and add the delivery address on the next page. No payment is taken online.</p>
              <ol class="order-box-steps">
                <li>Add the mailers you need, then check out with your US delivery address.</li>
                <li>Printed orders get a digital proof by email. Nothing prints before you approve it.</li>
                <li>${ORDER.PAYMENT_LINE}</li>
                <li>Your order ships free and we email the tracking number when it leaves.</li>
              </ol>
              ${renderFormSeals()}
              <p class="order-box-note">Made to order: damage, defects, shortfalls and orders that do not match the approved proof are replaced or refunded under our <a href="/refund_returns/">returns and refunds policy</a>. Ships free in ${ORDER.HANDLING_DAYS.min}-${ORDER.HANDLING_DAYS.max} business days plus ${ORDER.TRANSIT_DAYS.min}-${ORDER.TRANSIT_DAYS.max} in transit (<a href="/shipping-policy/">shipping policy</a>). More than ${ORDER.MAX_QTY.toLocaleString("en-US")} mailers, mixed sizes or a pallet program? Use the quote form on this page.</p>
            </form>
          </div>`;
};

/**
 * priceValidUntil is computed as build date + 1 year so a rebuild always ships
 * a future date instead of a hard-coded one that quietly goes stale.
 */
const priceValidUntil = (() => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear() + 1, now.getUTCMonth(), now.getUTCDate())).toISOString().slice(0, 10);
})();

/**
 * Single shared Product JSON-LD builder used by every product page so each
 * page emits exactly one complete Product schema (Google Product snippets +
 * Merchant listing fields: brand, sku, image, offers with price/availability).
 */
const buildProductSchema = (product, sizesValue) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  image: [imageAbsoluteUrl(product.image.url), ...product.accentImages.map((image) => imageAbsoluteUrl(image.url))],
  description: product.metaDescription,
  brand: { "@type": "Brand", name: site.brand },
  sku: product.slug.toUpperCase(),
  material: product.material,
  category: product.category,
  additionalProperty: [{ "@type": "PropertyValue", name: "Available Sizes", value: sizesValue }],
  url: absoluteUrl(`/${product.slug}/`),
  offers: {
    "@type": "Offer",
    url: absoluteUrl(`/${product.slug}/`),
    priceCurrency: "USD",
    price: productUnitPrice(product),
    priceValidUntil,
    availability: "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@type": "Organization", name: site.brand },
    // Free shipping to any US address (owner decision 2026-10-06), stated on every product page,
    // /custom-order-policy/ and /shipping-policy/. Days come from order-data.js, the same figures
    // the shipping page and /merchant-feed.xml print.
    shippingDetails: ORDER.SHIP_COUNTRIES.map((country) => ({
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: String(ORDER.SHIPPING_COST), currency: "USD" },
      shippingDestination: { "@type": "DefinedRegion", addressCountry: country.code },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: { "@type": "QuantitativeValue", minValue: ORDER.HANDLING_DAYS.min, maxValue: ORDER.HANDLING_DAYS.max, unitCode: "DAY" },
        transitTime: { "@type": "QuantitativeValue", minValue: ORDER.TRANSIT_DAYS.min, maxValue: ORDER.TRANSIT_DAYS.max, unitCode: "DAY" }
      }
    })),
    // Made to order: no change-of-mind returns; an order that is defective, damaged, short or not
    // as approved is reported within RETURN_DAYS of delivery and replaced or refunded (/refund_returns/).
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: ORDER.SHIP_COUNTRIES.map((country) => country.code),
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: ORDER.RETURN_DAYS,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/FreeReturn",
      refundType: "https://schema.org/FullRefund",
      merchantReturnLink: absoluteUrl("/refund_returns/")
    }
  }
});

const renderSchemaScripts = (schemas) =>
  schemas
    .filter(Boolean)
    .map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`)
    .join("\n");

const iconSvg = (name, className = "") => {
  const cls = className ? ` class="${className}"` : "";

  if (name === "package") {
    return `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 20v-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4.5 8.5 12 13l7.5-4.5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
  }

  if (name === "quote") {
    return `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 3.5V8h4" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 12h6M9 16h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  }

  if (name === "phone") {
    return `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6.8 4.5h2.4l1.2 4.2-1.7 1.7a15.2 15.2 0 0 0 5 5l1.7-1.7 4.2 1.2v2.4c0 .9-.7 1.6-1.6 1.6A14.4 14.4 0 0 1 4.5 6.1c0-.9.7-1.6 1.6-1.6Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  }

  if (name === "printer") {
    return `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 8V4h10v4" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M7 14h10v6H7z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="17" cy="11.5" r="1" fill="currentColor"/></svg>`;
  }

  if (name === "truck") {
    return `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 7h11v8H3z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 10h3l3 3v2h-6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="7.5" cy="17.5" r="1.8" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="17.5" r="1.8" stroke="currentColor" stroke-width="1.8"/></svg>`;
  }

  if (name === "spark") {
    return `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
  }

  return "";
};

const logoSvg = () => `
  <svg class="brand-svg" viewBox="0 0 360 44" fill="none" role="img" aria-label="Shop Bubble Mailers">
    <g transform="translate(0 6)">
      <rect x="2" y="2" width="26" height="24" rx="5" stroke="#E8962E" stroke-width="2"/>
      <path d="M5 10 15 4l10 6v10L15 26 5 20V10Z" stroke="#E8962E" stroke-width="2" stroke-linejoin="round"/>
      <path d="M15 26v-9" stroke="#E8962E" stroke-width="2" stroke-linecap="round"/>
      <path d="M5.5 10 15 16l9.5-6" stroke="#E8962E" stroke-width="2" stroke-linejoin="round"/>
    </g>
    <text x="42" y="31" font-family="'Segoe UI', Arial, sans-serif" font-size="17.5" font-weight="800" font-style="italic" letter-spacing="-0.45">
      <tspan fill="#1F2C3B">Shop </tspan>
      <tspan fill="#E8962E">Bubble </tspan>
      <tspan fill="#1F2C3B">Mailers</tspan>
    </text>
  </svg>
`;

const faviconSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="18" fill="#ffffff"/>
  <rect x="10" y="12" width="44" height="40" rx="10" stroke="#E8962E" stroke-width="4"/>
  <path d="M15 25 32 15l17 10v17L32 52 15 42V25Z" stroke="#E8962E" stroke-width="4" stroke-linejoin="round"/>
  <path d="M32 52V35" stroke="#E8962E" stroke-width="4" stroke-linecap="round"/>
  <path d="M15.5 25 32 35l16.5-10" stroke="#E8962E" stroke-width="4" stroke-linejoin="round"/>
</svg>
`;

const renderHeader = (currentPath) => `
  <header class="site-header">
    <div class="container header-row">
      <a class="brand" href="/" aria-label="${site.brand} home">
        ${logoSvg()}
      </a>
      <button class="nav-toggle" data-nav-toggle aria-expanded="false">Menu</button>
      <nav class="site-nav" data-nav>
        ${navLinks
          .map((link) => {
            if (link.label === "Products") {
              return `
                <div class="nav-item nav-item-dropdown">
                  <button class="nav-dropdown-toggle" type="button" data-products-toggle aria-expanded="${currentPath === "/products/" ? "true" : "false"}" aria-haspopup="true">
                    <span>${link.label}</span>
                    ${iconSvg("spark", "nav-caret")}
                  </button>
                  <div class="nav-dropdown-menu" data-products-menu>
                    <a class="nav-dropdown-overview" href="/products/"${currentPath === "/products/" ? ' aria-current="page"' : ""}>All bubble mailer products</a>
                    <div class="nav-dropdown-grid">
                      ${products
                        .map(
                          (product) => `
                            <a href="/${product.slug}/"${currentPath === `/${product.slug}/` ? ' aria-current="page"' : ""}>
                              <img class="nav-dropdown-thumb" src="${product.image.thumb}" alt="" loading="lazy" decoding="async" width="400" height="400">
                              <span class="nav-dropdown-text">
                                <span class="nav-dropdown-title">${product.name}</span>
                                <span class="nav-dropdown-meta">${product.category} · starting from $${product.price} per mailer</span>
                              </span>
                            </a>
                          `
                        )
                        .join("")}
                    </div>
                  </div>
                </div>
              `;
            }
            if (link.label === "Locations") {
              return `
                <div class="nav-item nav-item-dropdown">
                  <button class="nav-dropdown-toggle" type="button" data-products-toggle aria-expanded="${currentPath === "/locations/" ? "true" : "false"}" aria-haspopup="true">
                    <span>${link.label}</span>
                    ${iconSvg("spark", "nav-caret")}
                  </button>
                  <div class="nav-dropdown-menu" data-products-menu>
                    <a class="nav-dropdown-overview" href="/locations/"${currentPath === "/locations/" ? ' aria-current="page"' : ""}>All USA locations</a>
                    <div class="nav-dropdown-grid">
                      ${locationStates
                        .map(
                          (state, index) => `
                            <a href="/locations/${state.slug}/"${currentPath === `/locations/${state.slug}/` ? ' aria-current="page"' : ""}>
                              <img class="nav-dropdown-thumb" src="${pickAsset("generic", index).thumb}" alt="" loading="lazy" decoding="async" width="400" height="400">
                              <span class="nav-dropdown-text">
                                <span class="nav-dropdown-title">${state.name}</span>
                                <span class="nav-dropdown-meta">${state.cities.map((c) => c.name).join(", ")}</span>
                              </span>
                            </a>
                          `
                        )
                        .join("")}
                    </div>
                  </div>
                </div>
              `;
            }
            return `<a href="${link.href}"${currentPath === link.href ? ' aria-current="page"' : ""}>${link.label}</a>`;
          })
          .join("")}
      </nav>
      <div class="header-actions">
        <a class="button button-primary button-small" href="#quote-form">${iconSvg("quote", "button-icon")}<span>Get Quote</span></a>
        <a class="button button-secondary button-small" href="tel:${site.phoneHref}">${iconSvg("phone", "button-icon")}<span>Call Now</span></a>
      </div>
    </div>
  </header>
`;

const renderFooter = () => `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <h3>${site.brand}</h3>
          <p>Shop Bubble Mailers supplies padded mailing envelopes, kraft bubble mailers, white mailers, and custom packaging support for businesses across the USA.</p>
        </div>
        <div>
          <h4>Products</h4>
          <ul>
            <li><a href="/kraft-bubble-mailers/">Kraft Bubble Mailers</a></li>
            <li><a href="/white-bubble-mailers/">White Bubble Mailers</a></li>
            <li><a href="/bubble-mailer-bags/">Bubble Mailer Bags</a></li>
            <li><a href="/bubble-mailer-packaging/">Bubble Mailer Packaging</a></li>
          </ul>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/about-us/">About Us</a></li>
            <li><a href="/products/">Products</a></li>
            <li><a href="/blog/">Blog</a></li>
            <li><a href="/locations/">USA Locations</a></li>
            <li><a href="/contact-us/">Contact Us</a></li>
            <li><a href="/sitemap/">Sitemap</a></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul>
            <li><a href="mailto:${site.email}">${site.email}</a></li>
            <li><a href="tel:${site.phoneHref}">${site.phone}</a></li>
            <li><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}" target="_blank" rel="noopener">${site.address}</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; <span data-current-year></span> ${site.brand}. All rights reserved.</span>
        <span><a href="/privacy-policy/">Privacy Policy</a> | <a href="/terms-and-conditions/">Terms and Conditions</a> | <a href="/shipping-policy/">Shipping Policy</a> | <a href="/refund_returns/">Returns &amp; Refunds</a> | <a href="/custom-order-policy/">Custom Order Policy</a></span>
      </div>
    </div>
  </footer>
  <a class="button button-primary sticky-quote" href="#quote-form">Get Quote</a>
`;

const renderBreadcrumbs = (items) => `
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <div class="container">
      <ol>
        ${items.map((item) => `<li><a href="${item.href}">${item.label}</a></li>`).join("")}
      </ol>
    </div>
  </nav>
`;

const renderQuoteForm = (productName = "") => `
  <div class="quote-card" id="quote-form">
    <h3>Request Bulk Pricing</h3>
    <p>Send your size, quantity, and product interest. We will reply with pricing and supply guidance for your shipment program.</p>
    <div class="quote-trust">
      <span>Fast quote response</span>
      <span>Bulk order support</span>
      <span>Artwork upload available</span>
    </div>
    <form class="quote-form" action="${site.formAction}" method="POST" data-quote-form>
      <input type="hidden" name="form_subject" value="Quote request — ${productName || "Bubble Mailers"} — shopbubblemailers.com">
      <div class="field-grid">
        <label>Name
          <input type="text" name="Name" required>
        </label>
        <label>Email
          <input type="email" name="Email" required>
        </label>
      </div>
      <div class="field-grid">
        <label>Phone
          <input type="tel" name="Phone">
        </label>
        <label>Product Interested In
          <input type="text" name="Product Interested In" value="${productName}">
        </label>
      </div>
      <div class="field-grid">
        <label>Quantity
          <input type="text" name="Quantity" placeholder="Example: 5,000 units">
        </label>
        <label>Size
          <input type="text" name="Size" placeholder="Example: 8.5 x 12">
        </label>
      </div>
      <label>Message
        <textarea name="Message" placeholder="Tell us about your shipping needs, print details, and delivery timeline."></textarea>
      </label>
      <label>Upload Artwork (Optional)
        <input type="file" name="attachment" accept=".jpg,.jpeg,.png,.pdf,.ai,.eps">
      </label>
      <button type="submit">${iconSvg("quote", "button-icon")}<span>Get Quote</span></button>
      ${renderFormSeals()}
      <p class="response-note">We respond within 1-2 hours.</p>
      <p class="helper-text">Prefer direct contact? Email <a href="mailto:${site.email}">${site.email}</a> or call <a href="tel:${site.phoneHref}">${site.phone}</a>.</p>
      <p class="helper-text">If you attach artwork, we will include the filename in your request and you can send the file directly by email if needed.</p>
      <p class="form-status" data-form-status aria-live="polite"></p>
    </form>
  </div>
`;


const configuratorOptions = {
  // Fourth value is a size factor applied to the per-unit estimate, so a 12x15
  // is never estimated at a 4x6 price.
  size: [
    ["4x6", "4 x 6 in", "Jewelry, cosmetics, small parts", 1],
    ["4x7", "4 x 7 in", "Phone cases, accessories", 1.1],
    ["6x9", "6 x 9 in", "Apparel singles, books", 1.4],
    ["7x9", "7 x 9 in", "Folded garments, kits", 1.6],
    ["8.5x12", "8.5 x 12 in", "Multi-item orders", 2],
    ["10.5x15", "10.5 x 15 in", "Bulky soft goods", 2.7],
    ["12x15", "12 x 15 in", "Large apparel packs", 3.5],
    ["custom", "Custom size", "Enter below", 2]
  ],
  material: [
    ["kraft", "Kraft padded", "Natural recyclable paper", 0.16],
    ["white", "White poly", "Clean printable surface", 0.14],
    ["metallic", "Metallic", "Retail-facing shine", 0.22],
    ["recyclable", "Recyclable paper", "Curbside recyclable", 0.19],
    ["biodegradable", "Compostable", "Plant-based film", 0.26]
  ],
  closure: [
    ["selfseal", "Self-seal strip", "Peel and press", 0],
    ["peelseal", "Peel &amp; seal", "Extra-strong adhesive", 0.02],
    ["tearstrip", "Tear strip", "Easy opening", 0.03],
    ["doubleseal", "Double seal", "Tamper resistant", 0.04]
  ],
  printing: [
    ["none", "Unprinted", "Plain stock", -0.02],
    ["one", "1 color", "Single ink logo", 0.04],
    ["two", "2 colors", "Two-ink brand print", 0.07],
    ["full", "Full color", "Photographic print", 0.11],
    ["both", "Both sides", "Front and back", 0.13]
  ],
  addOn: [
    ["returnpanel", "Return label panel", "Blank write-on area", 0.02],
    ["matte", "Matte finish", "Soft, non-reflective", 0.03],
    ["tamper", "Tamper-evident seal", "Void-on-open", 0.04],
    ["insideprint", "Inside printing", "Unboxing message", 0.05],
    ["bundled", "Bundled in 50s", "Counted packs", 0.01],
    ["express", "Express production", "Priority queue", 0.06]
  ]
};

const configuratorQuantities = [250, 500, 1000, 2500, 5000, 10000, 25000, 50000];

const renderOptionButtons = (group, options) =>
  options
    .map(
      ([value, label, hint, price]) => `
      <button type="button" class="cfg-option" data-group="${group}" data-value="${value}" data-label="${label}"${
        price === undefined ? "" : group === "size" ? ` data-factor="${price}"` : ` data-price="${price}"`
      } aria-pressed="false">
        <span class="cfg-option-label">${label}</span>
        <span class="cfg-option-hint">${hint}</span>
      </button>`
    )
    .join("");

const renderConfigurator = (productName) => `
  <section class="section section-muted" id="configurator">
    <div class="container">
      <div class="cfg-head">
        <span class="cfg-eyebrow">Design Your Custom Bubble Mailer</span>
        <h2>Design your ${productName.toLowerCase()} and get an instant estimate</h2>
        <p>Choose size, material, closure, printing and quantity to see a price range straight away, then send the details to our team for a firm quote.</p>
      </div>

      <form class="cfg-form" data-configurator data-quote-form action="${site.formAction}" method="POST">
        <input type="hidden" name="form_subject" value="Design request — ${productName} — shopbubblemailers.com">
        <input type="hidden" name="Product Interested In" value="${productName}">

        <div class="cfg-steps">
          <fieldset class="cfg-step" data-mode="single" data-group="size">
            <legend><span class="cfg-num">1</span> Mailer size</legend>
            <div class="cfg-options">${renderOptionButtons("size", configuratorOptions.size)}</div>
            <div class="cfg-custom" data-custom-size hidden>
              <label for="cfg-dims">Required dimensions</label>
              <input type="text" id="cfg-dims" data-dims placeholder="e.g. 9 x 11 in" maxlength="60">
            </div>
          </fieldset>

          <fieldset class="cfg-step" data-mode="single" data-group="material">
            <legend><span class="cfg-num">2</span> Material</legend>
            <div class="cfg-options">${renderOptionButtons("material", configuratorOptions.material)}</div>
          </fieldset>

          <fieldset class="cfg-step" data-mode="single" data-group="closure">
            <legend><span class="cfg-num">3</span> Closure</legend>
            <div class="cfg-options">${renderOptionButtons("closure", configuratorOptions.closure)}</div>
          </fieldset>

          <fieldset class="cfg-step" data-mode="multi" data-group="printing">
            <legend><span class="cfg-num">4</span> Printing <span class="cfg-note">Select all that apply</span></legend>
            <div class="cfg-options">${renderOptionButtons("printing", configuratorOptions.printing)}</div>
          </fieldset>

          <fieldset class="cfg-step" data-mode="single" data-group="quantity">
            <legend><span class="cfg-num">5</span> Quantity</legend>
            <div class="cfg-pills">
              ${configuratorQuantities
                .map(
                  (value) =>
                    `<button type="button" class="cfg-pill" data-group="quantity" data-value="${value}" data-label="${value.toLocaleString("en-US")} units" aria-pressed="false">${value.toLocaleString("en-US")}</button>`
                )
                .join("")}
            </div>
            <div class="cfg-custom">
              <label for="cfg-qty">Or enter your own quantity</label>
              <input type="text" inputmode="numeric" id="cfg-qty" data-custom-qty placeholder="e.g. 7,500" maxlength="9">
            </div>
          </fieldset>

          <fieldset class="cfg-step" data-mode="multi" data-group="addOn">
            <legend><span class="cfg-num">6</span> Add-ons <span class="cfg-note">Optional</span></legend>
            <div class="cfg-options">${renderOptionButtons("addOn", configuratorOptions.addOn)}</div>
          </fieldset>

          <fieldset class="cfg-step">
            <legend><span class="cfg-num">7</span> Artwork &amp; details</legend>
            <label class="cfg-upload" for="cfg-artwork">
              ${iconSvg("quote", "row-icon")}
              <span data-upload-label>Upload artwork (optional) — PDF, AI, EPS, PNG, JPG</span>
            </label>
            <input class="cfg-file" type="file" id="cfg-artwork" name="attachment" accept=".pdf,.ai,.eps,.png,.jpg,.jpeg">

            <div class="cfg-grid">
              <label>Name
                <input type="text" name="Name" required>
              </label>
              <label>Email
                <input type="email" name="Email" required>
              </label>
              <label>Phone
                <input type="tel" name="Phone">
              </label>
              <label>Company
                <input type="text" name="Company">
              </label>
            </div>
            <label>Message / instructions
              <textarea name="Notes" data-notes rows="3" placeholder="Deadline, delivery city, or anything else we should know."></textarea>
            </label>
          </fieldset>
        </div>

        <aside class="cfg-summary">
          <div class="cfg-summary-inner">
            <p class="cfg-summary-title">Your specification</p>
            <button type="button" class="cfg-summary-toggle" data-summary-toggle aria-expanded="false">
              <span data-summary-count>Nothing selected yet</span>
              <span data-summary-hint>Show</span>
            </button>
            <dl class="cfg-rows">
              <div><dt>Size</dt><dd data-summary="size">Not selected</dd></div>
              <div><dt>Material</dt><dd data-summary="material">Not selected</dd></div>
              <div><dt>Closure</dt><dd data-summary="closure">Not selected</dd></div>
              <div><dt>Printing</dt><dd data-summary="printing">Not selected</dd></div>
              <div><dt>Quantity</dt><dd data-summary="quantity">Not selected</dd></div>
              <div><dt>Add-ons</dt><dd data-summary="addOn">None</dd></div>
              <div><dt>Artwork</dt><dd data-summary="artwork">Not attached</dd></div>
            </dl>

            <div class="cfg-estimate">
              <p class="cfg-estimate-label">Estimated price range</p>
              <p class="cfg-estimate-value" data-estimate>Select material &amp; quantity</p>
              <p class="cfg-estimate-note">Indicative only. Final pricing is confirmed once our team reviews your spec.</p>
            </div>

            <input type="hidden" name="Configuration" data-spec-field>
            <input type="hidden" name="Quantity" data-qty-field>
            <input type="hidden" name="Size" data-size-field>

            <p class="form-status" data-form-status aria-live="polite"></p>
            <button type="submit" class="button button-primary cfg-submit">${iconSvg("quote", "button-icon")}<span>Send my spec</span></button>
            ${renderFormSeals()}
            <a class="cfg-call" href="tel:${site.phoneHref}">Talk to a packaging expert</a>
          </div>
        </aside>
      </form>
    </div>
  </section>
`;

const renderFaqList = (faqs) => `
  <div class="faq-list">
    ${faqs
      .map(
        ([question, answer]) => `
      <div class="faq-item">
        <button class="faq-question" type="button">
          <span>${question}</span>
          <span class="faq-icon">+</span>
        </button>
        <div class="faq-answer">
          <p>${answer}</p>
        </div>
      </div>
    `
      )
      .join("")}
  </div>
`;

const renderProductCards = (items) => `
  <div class="product-grid">
    ${items
      .map(
        (product) => `
      <article class="product-card">
        <img src="${product.image.url}" alt="${product.name} product image" loading="lazy" decoding="async" width="1080" height="1080">
        <div>
          <h3><a href="/${product.slug}/">${product.name}</a></h3>
          <p>${product.metaDescription}</p>
        </div>
        <div class="button-row">
          <a class="button button-primary button-small" href="/${product.slug}/">View Product</a>
          <a class="button button-outline button-small" href="#quote-form">Get Quote</a>
        </div>
      </article>
    `
      )
      .join("")}
  </div>
`;

const renderGallery = (items, className = "") => `
  <div class="gallery-grid${className ? ` ${className}` : ""}">
    ${items
      .map(
        (asset, index) => `
      <figure class="gallery-card">
        <img src="${asset.url}" alt="${asset.alt || `Bubble mailer product image ${index + 1}`}" loading="lazy" decoding="async" width="1080" height="1080">
      </figure>
    `
      )
      .join("")}
  </div>
`;

const renderProductFeatureImage = (product) => {
  const altText = `${product.name.toLowerCase()} size and material details`;

  return `
    <div class="product-feature-card">
      <img src="${product.image.url}" alt="${altText}" loading="lazy" decoding="async" width="1080" height="1080">
    </div>
  `;
};

/* Product-page gallery: the main image plus one thumbnail button per product
   image. Clicking a thumbnail swaps #main-img in place (see src/script.js) —
   no navigation, no dead click. The main image is the LCP element, so it loads
   eager/high-priority; thumbnails use the 400px renditions and lazy-load. */
const renderProductGallery = (product, mainAlt, extraClass = "") => {
  const seen = new Set();
  const images = [product.image, ...(product.accentImages || [])].filter((asset) => {
    if (!asset || seen.has(asset.url)) return false;
    seen.add(asset.url);
    return true;
  });
  const main = images[0];
  const thumbs = images.length > 1
    ? `
      <div class="thumb-row" role="group" aria-label="${product.name} image gallery">
        ${images
          .map(
            (asset, index) => `
          <button type="button" class="thumb-btn${index === 0 ? " active" : ""}" data-src="${asset.url}" aria-label="View image ${index + 1}">
            <img src="${asset.thumb}" alt="${product.name} image ${index + 1}" loading="lazy" decoding="async" width="400" height="400">
          </button>
        `
          )
          .join("")}
      </div>
    `
    : "";
  return `
    <div class="product-gallery">
      <div class="product-hero-image hero-panel${extraClass ? ` ${extraClass}` : ""}">
        <img id="main-img" src="${main.url}" alt="${mainAlt || `${product.name} product photo`}" width="1000" height="1000" loading="eager" fetchpriority="high" decoding="async">
      </div>
      ${thumbs}
    </div>
  `;
};

const buildPage = ({
  routePath,
  title,
  metaTitle,
  metaDescription,
  heroImage,
  heroImageThumb = null,
  body,
  breadcrumbs = null,
  schemas = [],
  noindex = false
}) => {
  const canonical = absoluteUrl(routePath);
  const pageSchemas = [...globalSchemas(), ...schemas];
  if (breadcrumbs) {
    pageSchemas.push(buildBreadcrumbSchema(breadcrumbs));
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${metaTitle}</title>
  <meta name="description" content="${metaDescription}">
  <meta name="google-site-verification" content="Yye2yzfBZUck9eU_lSGfv6b8-vShEzolCHPJprQ_HJo">
  <meta name="theme-color" content="#1f2c3b">
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XD9YYJSZQZ"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-XD9YYJSZQZ');</script>
  <script defer src="/ga4-events.js"></script>
  <!-- Microsoft Clarity -->
  <script type="text/javascript">
      (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "yk7d21q01g");
  </script>
  <link rel="canonical" href="${canonical}">
  ${noindex ? '<meta name="robots" content="noindex, follow">' : ""}
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="shortcut icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${metaTitle}">
  <meta property="og:description" content="${metaDescription}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="${site.brand}">
  <meta property="og:image" content="${imageAbsoluteUrl(heroImage || site.socialImage)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${metaTitle}">
  <meta name="twitter:description" content="${metaDescription}">
  <meta name="twitter:image" content="${imageAbsoluteUrl(heroImage || site.socialImage)}">
  <link rel="stylesheet" href="${STYLES_URL}">
  ${heroImage ? `<link rel="preload" as="image" href="${heroImage}"${heroImageThumb ? ` imagesrcset="${heroImageThumb} 400w, ${heroImage} 1000w" imagesizes="(max-width: 640px) 100vw, 420px"` : ""} fetchpriority="high">` : ""}
  ${renderSchemaScripts(pageSchemas)}
</head>
<body>
  ${renderHeader(routePath)}
  ${breadcrumbs ? renderBreadcrumbs(breadcrumbs) : ""}
  <main>
    ${body}
  </main>
  ${renderFooter()}
  <script src="${SCRIPT_URL}" defer></script>
  <!-- ZeeOps live chat (replaced Zendesk) — conversations land in the dashboard
       at chat.zeeops.dev under the shopbubblemailers site. -->
  <script>
    // The chat widget waits for the first interaction (or 6s of idle) so it
    // never competes with the page's own render.
    (function () {
      var loaded = false;
      function load() {
        if (loaded) return;
        loaded = true;
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://chat.zeeops.dev/widget.js?siteId=shopbubblemailers';
        document.head.appendChild(s);
      }
      ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(function (evt) {
        window.addEventListener(evt, load, { once: true, passive: true });
      });
      window.addEventListener('load', function () { setTimeout(load, 6000); });
    })();
  </script>
  <a href="https://api.whatsapp.com/send/?phone=15034614788&text=Hi+Shop+Bubble+Mailers!+I+need+more+info+about+Shop+Bubble+Mailers+https%3A%2F%2Fshopbubblemailers.com%2F&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" style="position:fixed;bottom:24px;left:24px;z-index:9999;background:#25D366;border-radius:50%;width:60px;height:60px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.25);text-decoration:none;transition:transform .2s ease" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="34" height="34"><path fill="white" d="M4.868 43.303l2.694-9.835a18.838 18.838 0 01-2.52-9.444C5.044 13.505 13.561 5 24.014 5a18.864 18.864 0 0113.37 5.536A18.843 18.843 0 0143 23.917c-.004 10.385-8.52 18.886-18.973 18.886a18.93 18.93 0 01-9.34-2.465L4.868 43.303zm10.733-6.19l.594.352a15.72 15.72 0 008.8 2.678c8.663 0 15.713-7.037 15.716-15.693a15.656 15.656 0 00-4.608-11.131A15.648 15.648 0 0024.027 8.28c-8.669 0-15.718 7.036-15.721 15.69a15.657 15.657 0 002.854 9.032l.444.705-1.888 6.893 6.885-1.787z"/><path fill="white" fill-rule="evenodd" d="M19.268 15.787c-.345-.768-.709-.784-1.037-.797-.268-.01-.576-.01-.883-.01a1.692 1.692 0 00-1.228.576c-.422.46-1.611 1.573-1.611 3.836s1.649 4.453 1.878 4.761c.23.307 3.221 5.146 7.927 7.008 3.921 1.547 4.72 1.238 5.572 1.16.852-.077 2.75-1.124 3.137-2.21.389-1.085.389-2.017.273-2.21-.115-.192-.422-.307-.882-.537-.46-.23-2.75-1.355-3.175-1.509-.422-.153-.729-.23-1.036.23-.307.46-1.19 1.509-1.458 1.816-.268.308-.537.346-.997.116-.46-.23-1.94-.714-3.695-2.28-1.365-1.218-2.286-2.723-2.554-3.183-.268-.46-.028-.71.2-.937.208-.206.46-.538.69-.806.23-.268.307-.461.46-.768.154-.307.077-.576-.038-.806-.116-.23-1.005-2.494-1.42-3.41z"/></svg></a>
</body>
</html>`;
};

const writeRoute = (routePath, html) => {
  const relative = routePath === "/" ? "" : routePath.replace(/^\/|\/$/g, "");
  const targetDir = relative ? path.join(distDir, relative) : distDir;
  ensureDir(targetDir);
  fs.writeFileSync(path.join(targetDir, "index.html"), html);
  registerRoute(routePath);
};

const writeStaticAsset = (name, contents) => {
  fs.writeFileSync(path.join(distDir, name), contents);
};

const HOME_GUIDES = [
  ["how-to-choose-bubble-mailer-size", "How to choose the right bubble mailer size", "Measure, add clearance, and pick between two or three core sizes instead of a dozen.", "generic", 1],
  ["kraft-vs-white-bubble-mailers", "Kraft vs white bubble mailers", "Look, print quality, moisture resistance and cost: which finish suits your brand.", "plain", 3],
  ["buying-bubble-mailers-in-bulk", "Buying bubble mailers in bulk", "Case and pallet quantities, price breaks, storage and how to avoid over-ordering.", "bulk1000", 2],
  ["bubble-mailers-vs-boxes", "Bubble mailers vs boxes", "When a padded mailer protects enough, and when a product really needs a carton.", "bulk500", 1]
];

const renderHomePage = () => {
  const featuredCategories = [
    { title: "Kraft Bubble Mailers", href: "/kraft-bubble-mailers/", image: pickAsset("generic", 0), text: "Paper-look padded mailers for brands that want a more natural shipping appearance." },
    { title: "White Bubble Mailers", href: "/white-bubble-mailers/", image: pickAsset("plain", 2), text: "Clean white mailers for retail fulfillment, cosmetics, and direct-to-consumer orders." },
    { title: "Small Bubble Mailers", href: "/4x6-bubble-mailer/", image: pickAsset("plain", 0), text: "Compact formats like 4x6 and 4x7 for samples, cards, jewelry, and accessories." },
    { title: "Large Bubble Mailers", href: "/10-5-x-15-bubble-mailer/", image: pickAsset("bulk1000", 3), text: "Larger padded mailers for apparel, kits, documents, and mixed retail orders." },
    { title: "Bubble Mailer Bags", href: "/bubble-mailer-bags/", image: pickAsset("bulk500", 0), text: "Fast-packing mailer bags for warehouse operations, eCommerce, and recurring order programs." },
    { title: "Custom Bubble Mailer Packaging", href: "/custom-bubble-mailers/", image: pickAsset("halloween", 0), text: "Branded mailers with logo printing, custom layouts, and project-based quote support." }
  ];

  const body = `
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">USA Bubble Mailer Supplier · Bulk &amp; Wholesale</span>
          <h1>${mainPages[0].title}</h1>
          <p>Shop Bubble Mailers supplies <strong>kraft bubble mailers</strong>, white poly padded mailers and <strong>custom printed bubble mailers</strong> in every standard size from 4x6 to #7, by the case or pallet. Plain stock or your logo, quoted within 1-2 hours for businesses across the USA.</p>
          <div class="hero-actions">
            <a class="button button-primary" href="#quote-form">${iconSvg("quote", "button-icon")}<span>Get Quote</span></a>
            <a class="button button-secondary" href="/products/">${iconSvg("spark", "button-icon")}<span>View Products</span></a>
          </div>
          <div class="hero-trust">
            <div class="trust-item">${iconSvg("package", "trust-icon")}<div><strong>Bulk Orders</strong><span>Competitive pricing</span></div></div>
            <div class="trust-item">${iconSvg("printer", "trust-icon")}<div><strong>Custom Printing</strong><span>Add your brand</span></div></div>
            <div class="trust-item">${iconSvg("truck", "trust-icon")}<div><strong>Free USA Shipping</strong><span>Every order, every state</span></div></div>
          </div>
        </div>
        <div class="hero-panel">
          <div class="hero-showcase">
            <div class="hero-spotlight">
              <div class="hero-visual-stage">
                <img class="hero-main-image hero-main-3d" src="${pickAsset("generic", 2).url}" srcset="${pickAsset("generic", 2).thumb} 400w, ${pickAsset("generic", 2).url} 1000w" sizes="(max-width: 640px) 100vw, 420px" alt="Bulk bubble mailers packaging for business shipping" width="1080" height="1080" loading="eager" fetchpriority="high" decoding="async">
              </div>
              <div class="hero-support-card">
                ${iconSvg("package", "support-icon")}
                <div>
                  <strong>Bulk stock and custom print support</strong>
                  <span>Multiple sizes &amp; colors available</span>
                </div>
              </div>
            </div>
            <div class="hero-side-stack">
              <div class="hero-mini-card">
                <img src="${pickAsset("plain", 2).url}" alt="White bubble mailers for retail shipping" loading="lazy" decoding="async" width="1080" height="1080">
                <span><strong>White mailers</strong><small>Clean &amp; professional</small></span>
              </div>
              <div class="hero-mini-card">
                <img src="${pickAsset("halloween", 0).url}" alt="Custom printed bubble mailer packaging" loading="lazy" decoding="async" width="1080" height="1080">
                <span><strong>Custom printed mailers</strong><small>Promote your brand</small></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container feature-block">
        <div class="section-copy">
          <span class="eyebrow">Featured Categories</span>
          <h2>Mailer options for standard stock and branded packaging</h2>
          <p>We built the product range around sizes and finishes that fit real packing lines. Whether you need compact padded envelopes or larger shipping mailers, the site covers standard options and custom projects for business buyers.</p>
        </div>
        ${renderQuoteForm("")}
      </div>
      <div class="container category-grid">
        ${featuredCategories
          .map(
            (category) => `
          <article class="category-card">
            <img src="${category.image.url}" alt="${category.title}" loading="lazy" decoding="async" width="1080" height="1080">
            <div>
              <h3><a href="${category.href}">${category.title}</a></h3>
              <p>${category.text}</p>
            </div>
            <a class="button button-outline button-small" href="${category.href}">View Options <span aria-hidden="true">→</span></a>
          </article>
        `
          )
          .join("")}
      </div>
    </section>

    <section class="section section-muted">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">Why Choose Shop Bubble Mailers</span>
          <h2>Built for packaging buyers, warehouse teams, and growing brands</h2>
        </div>
        <div class="benefit-grid">
          ${[
            ["package", "Bulk order support for repeat supply, seasonal projects, and high-volume packing needs."],
            ["spark", "Custom sizes and print programs for businesses that need mailers matched to their products."],
            ["package", "Strong padded protection that helps reduce scuffs, pressure marks, and transit handling damage."],
            ["quote", "Clean sealing for quick packout and a more consistent shipping appearance."],
            ["truck", "Lightweight shipping support to help keep parcel weight lower than box-based packing."],
            ["phone", "USA-focused service with practical lead-time discussion and fast quote response."]
          ]
            .map(([icon, item]) => `<div class="benefit-item"><div class="benefit-icon">${iconSvg(icon, "benefit-svg")}</div><p>${item}</p></div>`)
            .join("")}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">Size Guide</span>
          <h2>Bubble mailer sizes, numbered equivalents and bulk prices</h2>
          <p>Measure your product at its widest and thickest point, add about half an inch, and pick the closest size below. Prices are per mailer at 5,000 units for plain stock; printing, material and smaller quantities change the figure, so ask for a firm quote.</p>
        </div>
        <div class="table-card">
          <table class="comparison-table">
            <thead>
              <tr><th>Size (in)</th><th>Numbered</th><th>Typical Use</th><th>Why Buyers Use It</th><th>Bulk Price From</th></tr>
            </thead>
            <tbody>
              ${sizeGuide
                .map((row) => {
                  const product = productsBySlug.get(row.slug);
                  return `<tr><td><a href="/${row.slug}/">${row.size}</a></td><td>${row.numbered}</td><td>${row.use}</td><td>${row.strength}</td><td>$${product ? product.price : "—"}</td></tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="section section-muted">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">Industries Served</span>
          <h2>Used by a wide range of shipping and retail businesses</h2>
        </div>
        <div class="trust-row">
          ${["eCommerce brands", "Clothing stores", "Cosmetics brands", "Jewelry sellers", "Book sellers", "Small businesses", "Subscription box brands"]
            .map((industry) => `<span class="trust-badge">${industry}</span>`)
            .join("")}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container feature-block">
        <div class="content-card content-flow">
          <span class="eyebrow">Custom Printing</span>
          <h2>Custom mailers for logo-driven packaging programs</h2>
          <p>Brands often want more than a plain shipping envelope. We support requests for logo printed bubble mailers, kraft mailers, colored mailers, and branded packaging layouts that help shipments look consistent from warehouse to doorstep.</p>
          <p>Custom projects can be planned around standard sizes or a more specific packaging program. If you already have artwork, the quote form includes an upload field so we can review the layout requirements early.</p>
          <div class="button-row">
            <a class="button button-primary" href="/custom-bubble-mailers/">Custom Bubble Mailers</a>
            <a class="button button-outline" href="#quote-form">Request Bulk Pricing</a>
          </div>
        </div>
        <div class="content-card benefits-card">
          <div class="print-mockup">
            <div class="print-mockup-back">
              <img src="${pickAsset("plain", 4).url}" alt="Printed bubble mailer back view" loading="lazy" decoding="async" width="1080" height="1080">
            </div>
            <div class="print-mockup-front">
              <img src="${pickAsset("halloween", 1).url}" alt="Custom bubble mailer packaging sample" loading="lazy" decoding="async" width="1080" height="1080">
              <div class="mockup-brand-stamp">SHOP BUBBLE</div>
            </div>
            <span class="mockup-tag mockup-tag-one">Custom Print</span>
            <span class="mockup-tag mockup-tag-two">Custom Sizes</span>
            <span class="mockup-tag mockup-tag-four">Bulk Orders</span>
          </div>
          <ul>
            <li><span class="benefit-dot"></span><div><strong>Logo printing</strong><p>Clean brand placement for direct-to-consumer and retail shipping.</p></div></li>
            <li><span class="benefit-dot"></span><div><strong>Size planning</strong><p>Choose standard sizes or discuss custom dimensions around your products.</p></div></li>
            <li><span class="benefit-dot"></span><div><strong>Bulk production</strong><p>Built for repeat stock programs, launches, and seasonal order peaks.</p></div></li>
          </ul>
        </div>
      </div>
    </section>

    <section class="section section-muted">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">Buying Guides</span>
          <h2>Before you order: sizing, finish and packing guides</h2>
          <p>Short, practical reads from our team on the questions buyers ask most. The full list is on the <a href="/blog/">bubble mailer guides</a> page.</p>
        </div>
        <div class="product-grid">
          ${HOME_GUIDES.map(([slug, title, blurb, group, idx]) => `
          <article class="product-card">
            <img src="${pickAsset(group, idx).url}" alt="${title}" loading="lazy" decoding="async" width="1080" height="1080">
            <div>
              <h3><a href="/blog/${slug}/">${title}</a></h3>
              <p>${blurb}</p>
            </div>
          </article>`).join("")}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">Questions</span>
          <h2>Frequently asked questions</h2>
        </div>
        ${renderFaqList(homepageFaqs)}
      </div>
    </section>

    <section class="section">
      <div class="container cta-strip">
        <div class="cta-grid">
          <div>
            <h2>Need Bubble Mailers in Bulk?</h2>
            <p>Tell us what size, finish, and quantity you need. We will help you move from inquiry to supply planning quickly.</p>
          </div>
          <div class="button-row">
            <a class="button button-primary" href="#quote-form">${iconSvg("quote", "button-icon")}<span>Request a Quote</span></a>
            <a class="button button-outline" href="/contact-us/">${iconSvg("phone", "button-icon")}<span>Contact Us</span></a>
          </div>
        </div>
      </div>
    </section>
  `;

  return buildPage({
    routePath: "/",
    title: mainPages[0].title,
    metaTitle: mainPages[0].metaTitle,
    metaDescription: mainPages[0].metaDescription,
    heroImage: pickAsset("generic", 2).url,
    heroImageThumb: pickAsset("generic", 2).thumb,
    body,
    schemas: [faqSchema(homepageFaqs)]
  });
};

const renderStandardPageHero = ({ eyebrow, title, description, image, ctas }) => `
  <section class="page-hero">
    <div class="container page-hero-grid">
      <div>
        <span class="eyebrow">${eyebrow}</span>
        <h1>${title}</h1>
        <p>${description}</p>
        <div class="button-row">
          ${ctas
            .map((cta) => `<a class="button ${cta.primary ? "button-primary" : "button-secondary"}" href="${cta.href}">${cta.label}</a>`)
            .join("")}
        </div>
      </div>
      <div class="hero-panel">
        <img src="${image.url}" alt="${title}" width="1080" height="1080" loading="eager" fetchpriority="high" decoding="async">
      </div>
    </div>
  </section>
`;

const aboutFaqs = [
  ["Where is Shop Bubble Mailers based?", "We operate from Bloomington, Illinois, and supply businesses in every US state. Orders ship from US stock, and custom printed runs are produced to order and shipped direct to your warehouse or 3PL."],
  ["Who buys from Shop Bubble Mailers?", "Online stores, subscription brands, Amazon and Etsy sellers, 3PLs and fulfillment centers, and the purchasing teams of retail and apparel companies. Order sizes run from a single case to scheduled pallet programs."],
  ["Do you sell to individuals or only businesses?", "Our pricing and case quantities are set up for businesses, but anyone who needs a case or more can order. We do not sell single mailers."],
  ["What makes you different from a packaging marketplace?", "One product category, done properly. Every size has its own page with real dimensions and a starting price, a Design Your Bubble Mailer section for printed quotes, and a person who replies within 1-2 hours with a clear price instead of a catalog PDF."],
  ["How do I get a quote?", "Use the form on any page, call (503) 461-4788, or email Info@shopbubblemailers.com with the size, quantity and whether you want plain or printed stock. Quotes come back by email within 1-2 hours during US business hours."],
  ["Do you offer samples?", "Yes. Ask for the two or three sizes you are deciding between and pack your real products before committing to a case or a printed run."],
  ["Can you handle recurring orders?", "Yes. Many customers set a standing reorder for their core sizes, and pallet-quantity programs can be released on a schedule so you are not storing a full pallet at once."],
  ["Do you ship to multiple locations?", "Yes. Bulk and printed orders can be split across several US addresses, which 3PL clients and multi-warehouse brands use to keep every site stocked from one order."],
  ["How do I pay?", "Payment options are confirmed on your quote before you commit, so there are no surprises between the price you approve and the invoice you receive."],
  ["Who do I speak to if something arrives wrong?", "Reply to your order email or call us. We ask for a photo, log the issue against the batch, and replace or refund the affected mailers."]
];

const renderAboutPage = () => {
  const breadcrumbs = [
    { href: "/", label: "Home" },
    { href: "/about-us/", label: "About Us" }
  ];

  const body = `
    ${renderStandardPageHero({
      eyebrow: "About Shop Bubble Mailers",
      title: "About Shop Bubble Mailers",
      description: "Shop Bubble Mailers supports businesses that need practical, good-looking padded mailers for shipping throughout the United States. We focus on sizes, finishes, and quote support that make sense for real packing teams.",
      image: pickAsset("generic", 4),
      ctas: [
        { href: "#quote-form", label: "Get Free Quote", primary: true },
        { href: "/products/", label: "View Products" }
      ]
    })}
    <section class="section">
      <div class="container split-grid">
        <div class="content-card content-flow">
          <h2>A packaging site built for business buying</h2>
          <p>Our focus is simple: make it easier for companies to source bubble mailers that match their products, shipping volume, and brand requirements. Some buyers need a straightforward padded envelope program for day-to-day orders. Others need a custom printed mailer plan with more control over size, finish, and presentation. We support both.</p>
          <p>We built this site around categories buyers actually search for, including kraft bubble mailers, white bubble mailers, numbered mailers, and size-based products such as 4x6, 7x9, and 10.5 x 15 bubble mailers. That makes it easier to compare options and request pricing without digging through generic packaging pages.</p>
          <p>Because many customers buy in bulk, we pay close attention to quantity planning, order consistency, and shipping practicalities. We know a mailer has to do more than look good in a product photo. It has to pack quickly, seal cleanly, protect the contents, and keep freight weight under control.</p>
        </div>
        ${renderQuoteForm("")}
      </div>
    </section>
    <section class="section section-muted">
      <div class="container info-grid">
        <div class="info-card"><h3>Bulk supply support</h3><p>Quote support for repeat orders, mixed-size programs, and recurring fulfillment demand.</p></div>
        <div class="info-card"><h3>Custom options</h3><p>Logo print, branded colors, and packaging layouts for direct-to-consumer and retail brands.</p></div>
        <div class="info-card"><h3>Fast communication</h3><p>Simple quote requests by form, phone, or email with clear contact details.</p></div>
        <div class="info-card"><h3>USA-focused service</h3><p>We support bubble mailer buyers shipping throughout the United States.</p></div>
      </div>
    </section>
    <section class="section">
      <div class="container split-grid">
        <div class="content-card content-flow">
          <h2>Who we serve</h2>
          <p>We work with eCommerce brands, clothing stores, cosmetics companies, jewelry sellers, book sellers, small businesses, subscription box programs, and warehouse teams that need a padded mailer supply partner. Some customers want plain stock that is easy to reorder. Some want cleaner branding on every outbound package. The website is built to support both needs.</p>
          <p>For custom work, buyers can request artwork review, brand color discussion, and practical guidance around which sizes will give the best balance of fit and shipping cost. For standard stock, the focus is speed and clarity: clear page structure, direct quote forms, and product pages that explain what each size is used for.</p>
        </div>
        <div class="content-card">
          ${renderGallery([pickAsset("plain", 0), pickAsset("plain", 2), pickAsset("bulk500", 1), pickAsset("bulk1000", 0)])}
        </div>
      </div>
    </section>
    <section class="section section-muted">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">FAQ</span>
          <h2>Working with Shop Bubble Mailers</h2>
        </div>
        ${renderFaqList(aboutFaqs)}
      </div>
    </section>
  `;

  return buildPage({
    routePath: "/about-us/",
    title: "About Shop Bubble Mailers",
    metaTitle: "About Shop Bubble Mailers | USA Bubble Mailer Supplier",
    metaDescription: "Learn about Shop Bubble Mailers, our product range, and how we support businesses across the USA with bulk bubble mailer supply.",
    heroImage: pickAsset("generic", 4).url,
    body,
    breadcrumbs,
    schemas: [{ "@context": "https://schema.org", "@type": "AboutPage", name: "About Shop Bubble Mailers", url: absoluteUrl("/about-us/") }, faqSchema(aboutFaqs)]
  });
};

const productsFaqs = [
  ["What bubble mailer sizes do you stock?", "Every standard size: inch sizes 4x6, 4x7, 6x9 (9x6), 7x9, 8.5x12, 10.5x15, 12x12 and 12x15, and the numbered range #000 through #7. Each has its own page with usable dimensions, what fits and a bulk starting price."],
  ["What is the difference between numbered and inch bubble mailer sizes?", "They describe the same mailers two ways. A #2 is 8.5 x 12 in outside, a #5 is 10.5 x 16, a #7 is 14.25 x 20. Inch sizes are the outer dimension; usable inside space is about an inch shorter because of the seal flap. Our comparison table lists both so you can order by either name."],
  ["Which bubble mailer size should I start with?", "Most online stores cover 80% of orders with two sizes: a 4x7 or 6x9 for small items and an 8.5x12 (#2) for folded apparel and multi-item orders. Add a 10.5x15 (#5) if you ship hoodies, denim or kits. Send us three or four typical products and we will suggest the spread."],
  ["How are bubble mailers sold in bulk?", "By the case, typically 100 to 500 mailers depending on size, and by the pallet for 10,000 units and up. Both ship free to any US address; pallet programs are quoted with scheduled releases if you want them."],
  ["What are the starting prices on this page based on?", "Plain stock at 5,000 units in the standard material for that size, before printing. Smaller quantities cost more per unit and larger ones less; custom print and specialty materials add to the figure. Every quote is confirmed by email before anything ships."],
  ["Do kraft and white bubble mailers come in the same sizes?", "Kraft runs the full #000 to #7 range. White poly runs #000 to #5 as stock, with larger white sizes available on program orders. Both can be printed."],
  ["Can I mix sizes in one order?", "Yes. Mixed-size orders are the norm for stores shipping more than one product type. They ship together on one invoice, and the price break is based on the combined quantity on most programs."],
  ["Can I get samples before buying a case?", "Yes. Ask for samples of the two or three sizes you are considering and pack your real products before committing. It is the quickest way to avoid a case of mailers that is half an inch too small."],
  ["Are the mailers self-seal?", "All of our stock bubble mailers use a peel-and-seal adhesive strip. Tear strips, double seals and tamper-evident closures are available on custom runs."],
  ["How quickly do stock orders ship?", "Plain stock usually leaves within a few business days of payment; printed orders follow a digital proof. We confirm the lead time on your quote before you commit."]
];

const renderProductsPage = () => {
  const breadcrumbs = [
    { href: "/", label: "Home" },
    { href: "/products/", label: "Products" }
  ];
  const sized = products.filter((product) => product.sizes.length === 1 && !/custom/i.test(product.sizes[0]));
  const ranges = products.filter((product) => !sized.includes(product));

  const body = `
    ${renderStandardPageHero({
      eyebrow: "All Sizes and Finishes",
      title: mainPages.find((page) => page.slug === "products").title,
      description: "Eleven inch and numbered sizes, kraft and white finishes, plain or printed. Compare usable dimensions, what fits and bulk starting prices in one table, then open the size you need.",
      image: pickAsset("bulk1000", 4),
      ctas: [
        { href: "#quote-form", label: "Request Bulk Pricing", primary: true },
        { href: "#size-table", label: "Compare Sizes" }
      ]
    })}
    <section class="section" id="size-table">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">Size Comparison</span>
          <h2>Compare every bubble mailer size side by side</h2>
          <p>Outer size is what the mailer is sold as; the usable inside size is what your product actually has to fit. Prices are per mailer for plain stock at 5,000 units.</p>
        </div>
        <div class="table-card">
          <table class="comparison-table">
            <thead>
              <tr><th>Mailer</th><th>Usable inside</th><th>Equivalent</th><th>Typically holds</th><th>Bulk price from</th></tr>
            </thead>
            <tbody>
              ${sized
                .sort((a, b) => Number(a.price) - Number(b.price))
                .map((product) => `<tr><td><a href="/${product.slug}/">${product.name}</a></td><td>${product.spec.usable}</td><td>${product.spec.equiv}</td><td>${product.spec.fits}</td><td>$${product.price}</td></tr>`)
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </section>
    <section class="section section-muted">
      <div class="container shop-layout">
        <div class="content-card content-flow">
          <h2>Kraft, white, bulk and custom ranges</h2>
          <p>If you have not settled on a size yet, start from the finish. Kraft gives a natural paper look and prints well in one or two colors; white poly is water-resistant and the better base for full-color print. Both are bubble-lined with the same 3/16 in padding. Our <a href="/bubble-mailer-bags/">bulk bubble mailer bags</a> page covers case and pallet buying across the six most-ordered sizes.</p>
          <ul>
            ${ranges.map((product) => `<li><strong><a href="/${product.slug}/">${product.name}</a></strong> — ${product.spec.usable}. ${product.spec.fits}.</li>`).join("")}
          </ul>
          <p>Every size can be printed. Pricing for logo runs, artwork specifications and proofing are on the custom page, and the Design Your Bubble Mailer section on each product page gives an instant estimate for any combination.</p>
        </div>
        ${renderQuoteForm("")}
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">By Size</span>
          <h2>Individual bubble mailer pages</h2>
        </div>
        ${renderProductCards(products)}
      </div>
    </section>
    <section class="section section-muted">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">FAQ</span>
          <h2>Bubble mailer sizes and ordering FAQs</h2>
        </div>
        ${renderFaqList(productsFaqs)}
      </div>
    </section>
  `;

  const page = mainPages.find((item) => item.slug === "products");
  return buildPage({
    routePath: "/products/",
    title: page.title,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    heroImage: pickAsset("bulk1000", 4).url,
    body,
    breadcrumbs,
    schemas: [faqSchema(productsFaqs)]
  });
};

const paragraph = (text) => `<p>${text}</p>`;
const iconHeading = (icon, text) => `<h2 class="icon-heading">${iconSvg(icon, "section-heading-icon")}<span>${text}</span></h2>`;

const renderKraftProductPage = (product) => {
  const relatedProducts = (relatedMap[product.slug] || []).map((slug) => productsBySlug.get(slug)).filter(Boolean);
  const faqs = [
    ["What sizes are available for kraft bubble mailers?", "Common sizes include #000, #00, #0, #1, #2, and #3, along with dimension-based options such as 4x6, 6x9, 7x10, 8.5x12, and 10x13 depending on the packing program."],
    ["Are kraft bubble mailers waterproof?", "Kraft bubble mailers offer padded protection and good everyday shipping performance, but they are not the same as a fully waterproof mailer. If moisture exposure is a concern, we can discuss the right material direction for the shipment."],
    ["Can I print my logo on kraft bubble mailers?", "Yes. Custom bubble mailers on kraft stock can be planned with logo placement, simple branding, return details, and other print elements for retail-facing shipments."],
    ["What is the minimum order for bulk pricing?", "The minimum order (MOQ) is 250 mailers. Larger or custom runs are quoted per job, so use the quote form to share size, quantity, and artwork requirements and we will advise clearly."],
    ["How long does delivery take?", "Lead time depends on stock status, order size, and whether the project is plain stock or custom printed. Standard bulk orders usually move faster than custom production."],
    ["Are kraft bubble mailers recyclable?", "Recycling depends on the specific material construction and local recycling rules. We can discuss practical disposal guidance during the quoting process if that is important for your program."],
    ["Are kraft bubble mailers good for retail brands?", "Yes. Many businesses choose kraft bubble mailers because the outer finish feels clean and more brand-ready while still giving padded protection inside."],
    ["Can I request mixed sizes in one program?", "Yes. Many buyers request a mixed-size plan so they can support different SKUs while keeping purchasing and fulfillment more organized."],
    ["What do kraft bubble mailers cost in bulk?", "Plain kraft is starting from $0.14 per mailer in the smallest size and rises with size; a #2 (8.5 x 12) sits in the mid-twenties of cents and a #7 near fifty cents. Printing and smaller quantities add to the figure, and every quote is confirmed by email."],
    ["Kraft paper bubble mailers or white poly — which should I choose?", "Kraft for a natural, recycled look and dark one- or two-color logos; white poly for water resistance, full-color print and a clean retail finish. Both use the same 3/16 in bubble lining, so protection is equal."]
  ];

  const sizeExamples = ["#000", "#00", "#0", "#1", "#2", "#3"];
  const sizeGrid = ["4x6", "6x9", "7x10", "8.5x12", "10x13"];
  const customizationItems = ["Printing", "Colors", "Branding", "Finishes"];
  const trustItems = [
    ["quote", "Bulk pricing", "Quote support for repeat orders, warehouse replenishment, and seasonal buying."],
    ["printer", "Custom production", "Brand-ready kraft mailers with logo print planning and layout review."],
    ["truck", "Fast turnaround", "Practical response times for standard stock and scheduled bulk supply."],
    ["phone", "USA supply support", "Direct support for business buyers who need size guidance and delivery planning."]
  ];

  const seoCopy = [
    "Kraft bubble mailers are a strong option for businesses that want a cleaner shipping presentation without losing the padded protection that everyday orders need. The kraft outer finish gives the mailer a more natural appearance, while the bubble-lined interior helps protect products from light impact, rubbing, and surface wear during transit. For many retail brands, this balance makes kraft padded mailers a practical choice for regular fulfillment.",
    "When buyers search for kraft bubble mailers for shipping, they are usually comparing three things at once: appearance, shipping performance, and stocking efficiency. A kraft format works well for businesses that want a more organized-looking outbound package while still keeping packing fast and storage simple. It also helps teams reduce the bulk of box-first packing on products that do not require corrugated protection.",
    "Bulk kraft bubble mailers USA programs are common for eCommerce brands, apparel sellers, accessories businesses, subscription projects, and teams shipping lightweight products every day. Ordering in volume can help stabilize supply, simplify restocking, and keep a consistent size program across repeat shipments. Buyers often combine a few core sizes so packing stations can move faster with less guesswork.",
    "Custom kraft bubble mailer packaging is also a useful step for brands that want stronger presentation. Logo print, simple brand marks, return information, and layout planning can turn a plain padded mailer into a more branded shipping format without moving into a full custom box program. If you already have artwork or target dimensions, the quote form on this page can be used to start the conversation."
  ];
  const longDescription = `
    <p>Kraft bubble mailers are padded mailers designed for businesses that need a lighter, cleaner, and more efficient way to ship products safely. They combine a kraft-style outer face with an interior bubble lining, giving orders a more organized shipping appearance while also adding cushioning against rubbing, pressure, and everyday handling. For many brands, this makes kraft bubble mailers a practical choice when a standard flat envelope does not offer enough protection and a full corrugated box would add unnecessary bulk.</p>
    <p>These mailers are widely used because they support faster packing and easier storage. Fulfillment teams often prefer padded mailers for smaller or lower-profile products because they seal quickly, stack well, and can help keep parcel weight lower. That makes them useful for repeat daily shipping where speed, protection, and presentation all matter at the same time.</p>
    <p>Industries that regularly use kraft bubble mailers include eCommerce, apparel, accessories, beauty, publishing, and subscription packaging. They work well for shipments that need cushioned protection without a box-first packing approach. Businesses also compare them with <a href="/white-bubble-mailers/">white bubble mailers</a> when they want a cleaner presentation.</p>
    <p>For companies building a stronger brand presentation, custom bubble mailers can also be discussed with logo print, size planning, and branded layout support. If you are reviewing stock supply alongside more branded options, see our <a href="/custom-bubble-mailers/">custom bubble mailer packaging options</a>. Whether the need is plain stock for day-to-day shipping or a more branded format for retail-facing orders, kraft padded mailers remain a dependable choice for secure and efficient shipping across the USA.</p>
  `;

  const body = `
    <section class="page-hero kraft-hero">
      <div class="container product-hero kraft-product-hero">
        <div class="product-hero-copy kraft-hero-copy">
          <span class="eyebrow">${product.category}</span>
          <h1>Kraft Bubble Mailers</h1>
          <p class="product-subheading">Durable padded mailers for clean shipping and brand-ready packaging</p>
          <p>Kraft bubble mailers provide a durable and lightweight solution for secure shipping. Designed with padded protection and a clean outer finish, these mailers are widely used by eCommerce brands, retailers, and fulfillment teams across the USA for safe and professional deliveries.</p>
          <ul class="hero-check-list">
            <li>${iconSvg("package", "row-icon")}<span>Multiple sizes available</span></li>
            <li>${iconSvg("printer", "row-icon")}<span>Custom printing options</span></li>
            <li>${iconSvg("quote", "row-icon")}<span>Bulk pricing support</span></li>
            <li>${iconSvg("truck", "row-icon")}<span>Fast USA delivery</span></li>
          </ul>
${renderProductPrice(product)}
${renderOrderBox(product)}
          <div class="button-row">
            <a class="button button-primary" href="#quote-form">Get Free Quote</a>
            <a class="button button-outline" href="#available-sizes">View Sizes</a>
          </div>
        </div>
        ${renderProductGallery(product, "Kraft bubble mailers for shipping", "kraft-product-image")}
      </div>
    </section>

    <section class="section section-muted">
      <div class="container split-grid">
        <div class="content-card content-flow">
          <h2>Kraft Bubble Mailers for Secure and Efficient Shipping</h2>
          ${longDescription}
        </div>
        <div class="table-card">
          <h2>Specifications</h2>
          <table class="comparison-table">
            <thead>
              <tr><th>Detail</th><th>Information</th></tr>
            </thead>
            <tbody>
              <tr><td>Material</td><td>Kraft exterior with bubble lining</td></tr>
              <tr><td>Sizes</td><td>4x6, 6x9, 8.5x12, 10x13, custom</td></tr>
              <tr><td>Colors</td><td>Brown kraft, white, custom printed</td></tr>
              <tr><td>Closure</td><td>Self-seal adhesive strip</td></tr>
              <tr><td>Padding</td><td>Bubble cushioning interior</td></tr>
              <tr><td>Usage</td><td>Shipping, packaging, retail delivery</td></tr>
              <tr><td>Printing</td><td>Custom logo printing available</td></tr>
              <tr><td>Starting Price</td><td>From $${productUnitPrice(product)} per mailer at bulk quantity</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container shop-layout">
        <div class="content-card content-flow kraft-content-stack">
          ${iconHeading("package", "Why choose kraft bubble mailers")}
          <div class="benefit-rows">
            ${[
              "Clean outer finish for a more organized shipping appearance.",
              "Padded protection that helps reduce scuffs and surface wear.",
              "Lightweight shipping compared with box-heavy packing methods.",
              "Suitable for retail brands that want better presentation.",
              "Cost-effective bulk option for repeat fulfillment programs."
            ]
              .map((item) => `<div class="benefit-row">${iconSvg("package", "row-icon")}<span>${item}</span></div>`)
              .join("")}
          </div>
          ${iconHeading("truck", "Best uses")}
          <div class="benefit-rows compact-rows">
            ${[
              "eCommerce shipping",
              "clothing & accessories",
              "small electronics",
              "subscription packaging"
            ]
              .map((item) => `<div class="benefit-row">${iconSvg("spark", "row-icon")}<span>${item}</span></div>`)
              .join("")}
          </div>
        </div>
        <div class="quote-card kraft-quote-card" id="quote-form">
          <h3>Request Bulk Pricing</h3>
          <p>Share the size, quantity, and delivery details you need for your kraft bubble mailers order.</p>
          <div class="quote-trust">
            <span>Fast quote response</span>
            <span>Bulk order support</span>
            <span>Artwork upload available</span>
          </div>
          <form class="quote-form" action="${site.formAction}" method="POST" data-quote-form>
            <input type="hidden" name="form_subject" value="New quote request from ${site.brand}">
            <label>Name
              <input type="text" name="name" required>
            </label>
            <div class="field-grid">
              <label>Email
                <input type="email" name="email" required>
              </label>
              <label>Phone
                <input type="tel" name="phone">
              </label>
            </div>
            <div class="field-grid">
              <label>Product Interested In
                <input type="text" name="product" value="${product.name}">
              </label>
              <label>Quantity
                <input type="text" name="quantity" placeholder="e.g. 5,000 units">
              </label>
            </div>
            <div class="field-grid">
              <label>Size
                <input type="text" name="size" placeholder="e.g. #2 or 8.5x12">
              </label>
              <label>Upload Artwork
                <input type="file" name="attachment" accept=".pdf,.ai,.eps,.png,.jpg,.jpeg">
              </label>
            </div>
            <label>Message
              <textarea name="message" placeholder="Tell us the sizes, print needs, or delivery details you want us to review."></textarea>
            </label>
            <button type="submit">${iconSvg("quote", "button-icon")}<span>Get Quote</span></button>
            ${renderFormSeals()}
            <p class="response-note">We respond within 1-2 hours.</p>
            <p class="helper-text">If you attach artwork, we will include the filename in your request and you can send the file directly by email if needed.</p>
            <p class="form-status" data-form-status aria-live="polite"></p>
          </form>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container image-section-stack">
        <div class="gallery-card detail-row">
          <div class="detail-copy content-flow">
            <span class="eyebrow">Product Detail</span>
            <h2>Kraft Bubble Mailer Close View</h2>
            <p>Kraft bubble mailers are often selected because the outer finish looks cleaner and more organized than a plain plastic mailer while still keeping the shipment lightweight. This view helps buyers understand the overall exterior appearance before they choose stock for retail or eCommerce use.</p>
            <p>For fulfillment teams, the format is useful because it combines a customer-ready look with padded protection and a simple self-seal workflow. It works well for repeat shipments that need a more polished finish without adding the storage demands of a box-heavy packing program.</p>
          </div>
          <div class="detail-media">
            <img src="${product.image.url}" alt="Kraft bubble mailer close view" loading="lazy" decoding="async" width="1080" height="1080">
            <p class="detail-caption">A closer look at the outer finish and padded mailer format used for secure day-to-day shipping.</p>
          </div>
        </div>
        <div class="gallery-card detail-row detail-row-reverse">
          <div class="detail-media">
            <img src="${product.accentImages[0].url}" alt="Inside bubble cushioning for kraft bubble mailers" loading="lazy" decoding="async" width="1080" height="1080">
            <p class="detail-caption">The inner bubble layer helps reduce rubbing, pressure marks, and handling wear during transit.</p>
          </div>
          <div class="detail-copy content-flow">
            <span class="eyebrow">Interior Protection</span>
            <h2>Inside Cushion Protection</h2>
            <p>The bubble-lined interior is what gives padded mailers their day-to-day protective value. It helps soften light impact, reduce abrasion, and keep products from shifting too freely during normal parcel handling.</p>
            <p>This is one reason kraft bubble mailers are commonly used for accessories, folded garments, beauty items, printed materials, and other low-profile products that need more care than a flat envelope can provide.</p>
          </div>
        </div>
        <div class="gallery-card detail-row">
          <div class="detail-copy content-flow">
            <span class="eyebrow">Bulk Supply</span>
            <h2>Bulk Packaging and Stacked Mailers</h2>
            <p>Bulk supply matters for warehouse teams and business buyers who want consistent stock across repeat orders. Stacked mailers are easier to store at packing stations, simpler to replenish, and practical for size-based shipping programs.</p>
            <p>Businesses that ship daily often request bulk bubble mailers in core sizes so staff can move faster during fulfillment while maintaining a more consistent shipping presentation from one order to the next.</p>
          </div>
          <div class="detail-media">
            <img src="${product.accentImages[1].url}" alt="Bulk stacked kraft bubble mailers for shipping supply" loading="lazy" decoding="async" width="1080" height="1080">
            <p class="detail-caption">Bulk-packed mailers help fulfillment teams keep repeat sizes stocked and ready for outgoing orders.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-muted" id="available-sizes">
      <div class="container split-grid">
        <div class="content-card content-flow">
          <span class="eyebrow">Available Sizes</span>
          <h2>Kraft Bubble Mailers for Shipping</h2>
          <p>Kraft bubble mailers are commonly stocked in core numbered sizes and dimension-based formats so packing teams can match the mailer to the product without unnecessary extra space.</p>
          <div class="mini-size-grid">
            ${sizeGrid.map((size) => `<div class="mini-size-card"><strong>${size}</strong></div>`).join("")}
          </div>
        </div>
        <div class="content-card content-flow">
          <span class="eyebrow">Customization Options</span>
          <h2>Custom Kraft Bubble Mailer Packaging</h2>
          <p>Custom bubble mailers on kraft stock can be planned around your logo, color direction, return details, and finish requirements so the package looks cleaner when it reaches the customer.</p>
          <div class="mini-size-grid option-grid">
            ${customizationItems.map((item) => `<div class="mini-size-card option-card">${item}</div>`).join("")}
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container split-grid">
        <div class="content-card content-flow">
          <h2>Common Uses of Kraft Bubble Mailers</h2>
          <div class="benefit-rows compact-rows">
            ${[
              "eCommerce shipping",
              "clothing brands",
              "cosmetics packaging",
              "small electronics",
              "subscription boxes"
            ]
              .map((item) => `<div class="benefit-row">${iconSvg("spark", "row-icon")}<span>${item}</span></div>`)
              .join("")}
          </div>
        </div>
        <div class="content-card content-flow content-soft">
          <h2>Custom Kraft Bubble Mailers</h2>
          <p>Custom kraft bubble mailers can be planned around logo printing, brand colors, size adjustments, and layout details that make the shipment look more organized when it reaches the customer. This helps brands use padded mailers as part of the overall presentation instead of treating packaging as an afterthought.</p>
          <p>We can discuss standard sizes, mixed-size programs, custom dimensions, and artwork placement based on the product profile. Whether the goal is simple one-color branding or broader custom bubble mailers for retail-facing shipments, the page is built to support practical quote planning.</p>
        </div>
      </div>
    </section>

    <section class="section section-muted">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">Trust & Supply</span>
          <h2>Why businesses choose us</h2>
        </div>
        <div class="benefit-grid trust-card-grid">
          ${trustItems
            .map(([icon, title, text]) => `<div class="benefit-item trust-card"><div class="benefit-icon">${iconSvg(icon, "benefit-svg")}</div><h3>${title}</h3><p>${text}</p></div>`)
            .join("")}
        </div>
      </div>
    </section>

    <section class="section section-muted">
      <div class="container split-grid">
        <div class="content-card content-flow">
          <h2>Bulk Kraft Bubble Mailers USA</h2>
          ${seoCopy.slice(0, 2).map(paragraph).join("")}
        </div>
        <div class="content-card content-flow content-soft">
          <h2>Custom Kraft Bubble Mailer Packaging</h2>
          ${seoCopy.slice(2).map(paragraph).join("")}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">Sizes</span>
          <h2>Bulk size references buyers request most</h2>
          <p>Standard numbered sizes help buyers compare capacity quickly, while dimension-based sizes are useful when the shipment needs a more exact fit.</p>
        </div>
        <div class="mini-size-grid wide-size-grid">
          ${sizeExamples.map((size) => `<div class="mini-size-card"><strong>${size}</strong></div>`).join("")}
        </div>
      </div>
    </section>

    <section class="section section-muted">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">Related Products</span>
          <h2>Explore More Bubble Mailer Options</h2>
          <p>Browse related bubble mailer products including different sizes, materials, and custom packaging options designed for retail, eCommerce, and shipping use.</p>
        </div>
        ${renderProductCards(relatedProducts)}
      </div>
    </section>

    <section class="section section-muted">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">FAQ</span>
          <h2>Frequently Asked Questions</h2>
        </div>
        ${renderFaqList(faqs)}
      </div>
    </section>

    <section class="section">
      <div class="container cta-strip">
        <div class="cta-grid">
          <div>
            <span class="eyebrow">Bulk Orders</span>
            <h2>Need kraft bubble mailers in bulk?</h2>
            <p>Tell us the sizes, quantity, and print direction you need and we will help you plan the right order.</p>
          </div>
          <div class="button-row">
            <a class="button button-primary" href="#quote-form">${iconSvg("quote", "button-icon")}<span>Get Quote</span></a>
            <a class="button button-outline" href="/contact-us/">${iconSvg("phone", "button-icon")}<span>Contact Us</span></a>
          </div>
        </div>
      </div>
    </section>
  `;

  const breadcrumbs = [
    { href: "/", label: "Home" },
    { href: "/products/", label: "Products" },
    { href: `/${product.slug}/`, label: product.name }
  ];

  const schemas = [buildProductSchema(product, [...sizeExamples, ...sizeGrid].join(", ")), faqSchema(faqs)];

  return buildPage({
    routePath: `/${product.slug}/`,
    title: product.name,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    heroImage: product.image.url,
    body,
    breadcrumbs,
    schemas
  });
};


// Guides that answer the questions a buyer of this product usually has. Kept
// as a static map (slug + title) because product pages are written before the
// blogPosts array is declared further down this file.
const PRODUCT_GUIDES = {
  "kraft-bubble-mailers": [["kraft-vs-white-bubble-mailers", "Kraft vs white bubble mailers"], ["are-bubble-mailers-recyclable", "Are bubble mailers recyclable?"]],
  "white-bubble-mailers": [["kraft-vs-white-bubble-mailers", "Kraft vs white bubble mailers"], ["custom-printed-bubble-mailers-branding", "Custom printed bubble mailers"]],
  "4x6-bubble-mailer": [["how-to-choose-bubble-mailer-size", "How to choose a bubble mailer size"], ["bubble-mailer-shipping-costs", "How bubble mailers cut shipping costs"]],
  "4x7-bubble-mailer": [["how-to-choose-bubble-mailer-size", "How to choose a bubble mailer size"], ["shipping-electronics-in-bubble-mailers", "Shipping electronics in bubble mailers"]],
  "7x9-bubble-mailer": [["how-to-pack-a-bubble-mailer", "How to pack and seal a bubble mailer"], ["bubble-mailer-vs-poly-mailer", "Bubble mailer vs poly mailer"]],
  "9x6-bubble-mailer": [["how-to-choose-bubble-mailer-size", "How to choose a bubble mailer size"], ["how-to-pack-a-bubble-mailer", "How to pack and seal a bubble mailer"]],
  "8-5-x-12-bubble-mailer": [["bubble-mailers-vs-boxes", "Bubble mailers vs boxes"], ["best-bubble-mailers-for-clothing", "Best bubble mailers for clothing"]],
  "2-bubble-mailer": [["how-to-choose-bubble-mailer-size", "How to choose a bubble mailer size"], ["buying-bubble-mailers-in-bulk", "Buying bubble mailers in bulk"]],
  "3-bubble-mailer": [["how-to-pack-a-bubble-mailer", "How to pack and seal a bubble mailer"], ["buying-bubble-mailers-in-bulk", "Buying bubble mailers in bulk"]],
  "5-bubble-mailer": [["best-bubble-mailers-for-clothing", "Best bubble mailers for clothing"], ["reduce-shipping-damage-rates", "How to reduce shipping damage rates"]],
  "6-bubble-mailer": [["bubble-mailers-vs-boxes", "Bubble mailers vs boxes"], ["reduce-shipping-damage-rates", "How to reduce shipping damage rates"]],
  "7-bubble-mailer": [["best-bubble-mailers-for-clothing", "Best bubble mailers for clothing"], ["bubble-mailers-vs-boxes", "Bubble mailers vs boxes"]],
  "10-5-x-15-bubble-mailer": [["best-bubble-mailers-for-clothing", "Best bubble mailers for clothing"], ["bubble-mailer-shipping-costs", "How bubble mailers cut shipping costs"]],
  "12x12-bubble-mailer": [["how-to-pack-a-bubble-mailer", "How to pack and seal a bubble mailer"], ["reduce-shipping-damage-rates", "How to reduce shipping damage rates"]],
  "12x15-bubble-mailer": [["best-bubble-mailers-for-clothing", "Best bubble mailers for clothing"], ["bubble-mailers-vs-boxes", "Bubble mailers vs boxes"]],
  "bubble-mailer-bags": [["buying-bubble-mailers-in-bulk", "Buying bubble mailers in bulk"], ["bubble-mailer-vs-poly-mailer", "Bubble mailer vs poly mailer"]],
  "bubble-mailer-packaging": [["custom-printed-bubble-mailers-branding", "Custom printed bubble mailers"], ["buying-bubble-mailers-in-bulk", "Buying bubble mailers in bulk"]]
};

const renderProductGuides = (product) => {
  const guides = PRODUCT_GUIDES[product.slug];
  if (!guides) return "";
  return `
    <div class="guide-links">
      <h3>Guides for this size</h3>
      <ul>
        ${guides.map(([slug, title]) => `<li><a href="/blog/${slug}/">${title}</a></li>`).join("")}
      </ul>
    </div>`;
};

// One-sentence opener for the spec table, written from the product's own
// numbers so no two pages share it.
const specIntro = (product) => {
  const spec = product.spec;
  const single = product.sizes.length === 1 && !/custom/i.test(product.sizes[0]);
  if (single) {
    return `A ${product.name.toLowerCase()} gives you ${spec.usable} of usable space inside and measures ${spec.outer.replace(/ including the seal flap/, "")} outside, so it ${/parcel|tier|letter/i.test(spec.postage) ? "ships as a lightweight parcel" : "stays light on the scale"} while holding ${spec.fits.split(", ").slice(0, 3).join(", ").toLowerCase()}.`;
  }
  return `${product.name} run from ${spec.usable.toLowerCase()}, which covers ${spec.fits.split(", ").slice(0, 3).join(", ")} without moving to a box. The table shows the range we stock; tell us your packed product size and we will match it to the closest standard mailer.`;
};

// Each product points at ONE finish or sibling-size page from this section,
// chosen per product so the anchor and target differ across the catalog.
const specFinishLink = (product) => {
  const map = {
    "kraft-bubble-mailers": ["/white-bubble-mailers/", "white poly bubble mailers"],
    "white-bubble-mailers": ["/kraft-bubble-mailers/", "kraft paper bubble mailers"],
    "4x6-bubble-mailer": ["/kraft-bubble-mailers/", "kraft bubble mailers in this size"],
    "4x7-bubble-mailer": ["/white-bubble-mailers/", "white bubble mailers for cosmetics"],
    "7x9-bubble-mailer": ["/kraft-bubble-mailers/", "natural kraft finish"],
    "9x6-bubble-mailer": ["/white-bubble-mailers/", "clean white poly finish"],
    "8-5-x-12-bubble-mailer": ["/custom-bubble-mailers/", "logo printed #2 mailers"],
    "2-bubble-mailer": ["/8-5-x-12-bubble-mailer/", "8.5 x 12 inch-sized listing"],
    "3-bubble-mailer": ["/kraft-bubble-mailers/", "kraft #3 mailers"],
    "5-bubble-mailer": ["/10-5-x-15-bubble-mailer/", "10.5 x 15 inch-sized listing"],
    "6-bubble-mailer": ["/12x15-bubble-mailer/", "12x15 bubble mailers"],
    "7-bubble-mailer": ["/custom-bubble-mailers/", "custom printed large mailers"],
    "10-5-x-15-bubble-mailer": ["/white-bubble-mailers/", "white poly version"],
    "12x12-bubble-mailer": ["/custom-bubble-mailers/", "printed square mailers"],
    "12x15-bubble-mailer": ["/kraft-bubble-mailers/", "kraft 12x15 mailers"],
    "bubble-mailer-bags": ["/bubble-mailer-packaging/", "program packaging options"],
    "bubble-mailer-packaging": ["/custom-bubble-mailers/", "custom printed bubble mailers"]
  };
  const [href, text] = map[product.slug] || ["/custom-bubble-mailers/", "custom printed bubble mailers"];
  return `Available plain or printed; see our <a href="${href}">${text}</a> for the other finish.`;
};

const productIntroParagraphs = (product) => {
  const content = productContent[product.slug];
  if (content && content.overview) return content.overview;
  return [
    `${product.name} is a practical option for businesses that want ${product.tone} with better protection than a standard flat envelope. It gives packing teams a faster workflow than box-first shipping while still helping reduce scuffs, compression marks, and surface wear during transit. For many eCommerce and retail operations, that balance between presentation, protection, and freight efficiency is the reason padded mailers stay in regular use.`,
    `${product.fitNote} At Shop Bubble Mailers, we support quote requests for ${product.name.toLowerCase()} from businesses across the United States, including online stores, warehouse teams, and retail brands that need dependable stock for daily shipping. Buyers can request plain options, discuss custom printing, and plan volume around repeat orders or seasonal demand.`
  ];
};

const productSections = (product) => {
  if (product.slug === "kraft-bubble-mailers") {
    return renderKraftProductPage(product);
  }
  const relatedProducts = (relatedMap[product.slug] || []).map((slug) => productsBySlug.get(slug)).filter(Boolean);
  const comparisonProduct = relatedProducts[0];
  const content = productContent[product.slug];
  const faqs = productFaqTemplates(product);
  const benefits = (content && content.benefits) || [
    `Padded protection for ${product.idealFor.join(", ").toLowerCase()} when the shipment needs more care than a plain paper envelope can offer.`,
    `Quick self-seal closure that helps reduce packing time during daily order fulfillment.`,
    `A cleaner shipping format for businesses that want mailers to look more organized and customer-ready.`,
    `Flexible ordering for standard stock, bulk supply, and custom print planning.`
  ];
  const useCaseParas = (content && content.useCases) || [
    `${product.name} is commonly used for ${product.idealFor.join(", ").toLowerCase()}. Buyers choose it when they want a padded mailer that stores easily at the packing station, closes quickly, and helps products arrive with a more consistent appearance.`,
    `For eCommerce brands, the mailer often becomes part of the customer experience because it is the first package the buyer sees. For warehouse teams, the focus is usually speed, storage efficiency, and keeping material use simple across many daily orders. ${product.name} can support both goals when the size is selected carefully.`,
    `It also works well in packaging programs that need lighter outbound parcels. Bubble mailers usually weigh less than corrugated boxes, which can make a real difference for repeat shipments where parcel cost adds up across the month.`
  ];
  const customParas = (content && content.customContent) || [
    `${product.customAngle} Buyers can request logo print, basic brand colors, return information, or layout planning for retail-facing shipments. When artwork is ready, the quote form on this page can be used to send the file for review.`,
    `Custom projects are especially useful for businesses that want stronger brand consistency across packaging. A printed bubble mailer can help a shipment feel more organized without adding the material and storage demands of a full branded box program.`
  ];
  const bulkParas = (content && content.bulkContent) || [
    `${product.bulkAngle} When requesting pricing, it helps to include the target size, expected quantity, whether the order is standard stock or custom print, and where the shipment will be delivered. That lets us provide more useful guidance from the first response.`,
    `Bulk buying is often the best route for businesses that have steady order flow, want price stability on a repeat format, or need multiple sizes planned together. We can also support businesses that are preparing for seasonal traffic and need a practical padded mailer option before order volume rises.`,
    `Shop Bubble Mailers serves buyers across the USA. You can request pricing by phone, email, or the form on this page.`
  ];

  const body = `
    <section class="page-hero">
      <div class="container product-hero">
        <div class="product-hero-copy">
          <span class="eyebrow">${product.category}</span>
          <h1>${product.name}</h1>
          ${productIntroParagraphs(product).map(paragraph).join("")}
${renderProductPrice(product)}
${renderOrderBox(product)}
          <div class="button-row">
            <a class="button button-primary" href="#quote-form">Get Free Quote</a>
            <a class="button button-outline" href="#bulk-pricing">Request Bulk Pricing</a>
          </div>
          <div class="sub-actions">
            <a class="button button-outline button-small" href="/contact-us/">Contact Us</a>
            <a class="button button-secondary button-small" href="tel:${site.phoneHref}">Call Now</a>
          </div>
        </div>
        ${renderProductGallery(product, `${product.name} product photo showing the padded mailer exterior`)}
      </div>
    </section>

    <section class="section">
      <div class="container shop-layout">
        <div class="content-card content-flow">
          ${iconHeading("package", `Why businesses buy ${product.name.toLowerCase()}`)}
          ${benefits.map((benefit) => paragraph(benefit)).join("")}
          <div class="benefit-rows">
            ${["Bulk order support", "Custom sizes", "Strong padded protection", "Clean sealing", "Lightweight shipping", "USA-focused service", "Fast quote response"]
              .map((item) => `<div class="benefit-row">${iconSvg("package", "row-icon")}<span>${item}</span></div>`)
              .join("")}
          </div>
        </div>
        ${renderQuoteForm(product.name)}
      </div>
    </section>

    <section class="section section-muted">
      <div class="container split-grid">
        <div class="content-card content-flow">
          ${iconHeading("spark", `${product.name} size, material and weight`)}
          <p>${specIntro(product)}</p>
          <div class="table-card">
            <table class="comparison-table spec-table">
              <tbody>
                <tr><td>Usable inside size</td><td>${product.spec.usable}</td></tr>
                <tr><td>Outer size</td><td>${product.spec.outer}</td></tr>
                <tr><td>Size equivalent</td><td>${product.spec.equiv}</td></tr>
                <tr><td>Padding</td><td>${product.spec.bubble}</td></tr>
                <tr><td>Packed weight guide</td><td>${product.spec.weight}</td></tr>
                <tr><td>Typically holds</td><td>${product.spec.fits}</td></tr>
                <tr><td>Shipping note</td><td>${product.spec.postage}</td></tr>
              </tbody>
            </table>
          </div>
          <p><strong>Material:</strong> ${product.material}. ${specFinishLink(product)}</p>
        </div>
        <div class="content-card">
          ${renderProductFeatureImage(product)}
          ${renderProductGuides(product)}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container split-grid">
        <div class="content-card content-flow content-soft">
          ${iconHeading("truck", `Use cases for ${product.name.toLowerCase()}`)}
          ${useCaseParas.map(paragraph).join("")}
          ${comparisonProduct ? `<p>Buyers comparing a nearby size often review ${singleContextLink(comparisonProduct)} before settling on a repeat-order setup.</p>` : ""}
        </div>
        <div class="content-card content-flow">
          ${iconHeading("printer", "Customization options")}
          ${customParas.map(paragraph).join("")}
        </div>
      </div>
    </section>

    <section class="section section-muted" id="bulk-pricing">
      <div class="container split-grid">
        <div class="content-card content-flow content-soft">
          ${iconHeading("quote", "Shipping and bulk order information")}
          ${bulkParas.map(paragraph).join("")}
        </div>
        <div class="table-card">
          <table class="comparison-table">
            <thead>
              <tr><th>Detail</th><th>Information</th></tr>
            </thead>
            <tbody>
              <tr><td>Product</td><td>${product.name}</td></tr>
              <tr><td>Category</td><td>${product.category}</td></tr>
              <tr><td>Available Sizes</td><td>${product.sizes.join(", ")}</td></tr>
              <tr><td>Material</td><td>${product.material}</td></tr>
              <tr><td>Use Cases</td><td>${product.idealFor.join(", ")}</td></tr>
              <tr><td>Starting Price</td><td>From $${productUnitPrice(product)} per mailer at bulk quantity</td></tr>
              <tr><td>Shipping</td><td>Free shipping across the USA, ${ORDER.HANDLING_DAYS.min}-${ORDER.HANDLING_DAYS.max} business days to dispatch plus ${ORDER.TRANSIT_DAYS.min}-${ORDER.TRANSIT_DAYS.max} in transit</td></tr>
              <tr><td>Returns</td><td>Made to order; no change-of-mind returns, defects and errors reported within ${ORDER.RETURN_DAYS} days are replaced or refunded (<a href="/refund_returns/">returns policy</a>)</td></tr>
              <tr><td>Quote Support</td><td>Standard stock, bulk pricing, custom printing, and mixed-size planning</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    ${renderConfigurator(product.name)}

    <section class="section">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">Related Products</span>
          <h2>Compare with nearby sizes and categories</h2>
          <p>These pages are often reviewed together when buyers are comparing fit, stock planning, or different exterior finishes.</p>
        </div>
        ${renderProductCards(relatedProducts)}
      </div>
    </section>

    <section class="section section-muted">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">FAQ</span>
          <h2>${product.name} FAQs</h2>
        </div>
        ${renderFaqList(faqs)}
      </div>
    </section>
  `;

  const breadcrumbs = [
    { href: "/", label: "Home" },
    { href: "/products/", label: "Products" },
    { href: `/${product.slug}/`, label: product.name }
  ];

  const schemas = [buildProductSchema(product, product.sizes.join(", ")), faqSchema(faqs)];

  return buildPage({
    routePath: `/${product.slug}/`,
    title: product.name,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    heroImage: product.image.url,
    body,
    breadcrumbs,
    schemas
  });
};

const customFaqs = [
  ["What is the minimum order for custom printed bubble mailers?", "Printed runs are quoted from 250 units, the lowest quantity in Design Your Bubble Mailer. Most brands print 1,000 or more because the plate and setup cost is spread across the run and the per-unit price drops sharply between 500 and 2,500."],
  ["How much do custom bubble mailers cost?", "As a guide, a 7x9 kraft mailer with a one-color logo is starting from $0.29 per mailer at 10,000 units, before shipping. Size, material, number of colors and quantity all move the figure. The Design Your Bubble Mailer section on any product page gives an instant range; the emailed quote is firm."],
  ["How many colors can you print?", "One and two spot colors are the standard for logos and return panels. Full-color (CMYK) print is available for photographic or gradient artwork, and we can print both sides. Pantone references are matched as closely as the stock allows; white poly gives the truest color, kraft warms every ink slightly."],
  ["What artwork do you need?", "Vector files (PDF, AI or EPS) with text outlined are best. If you only have a PNG or JPG, send it at 300 dpi or higher at print size and we will tell you whether it is usable. Spot colors should be named as Pantone references; CMYK is fine for full-color work."],
  ["Will I see a proof before printing?", "Yes. Every custom order gets a digital proof showing the artwork positioned on the actual mailer size. Nothing prints until you approve it by email, and revisions before approval are free."],
  ["How long do custom bubble mailers take?", "Plain stock ships in a few business days. Because printed mailers are made to order, the lead time depends on quantity and the number of colors; as a planning figure allow a few weeks after proof approval. Express production is available as an add-on when a launch date is fixed, and we confirm the exact lead time on your quote."],
  ["Can I print on kraft and white bubble mailers?", "Both. Kraft takes dark one- and two-color print well and gives a natural, recycled look. White poly is the better base for light colors, fine detail and full-color print. Metallic and recyclable paper stocks can also be printed."],
  ["Can custom mailers be made in a non-standard size?", "Yes. If none of the eleven stock sizes fits, give us the packed dimensions of your product and we will quote a custom size. Custom sizes carry a higher minimum than printed stock sizes; we confirm it on the quote."],
  ["Do custom printed bubble mailers cost more to ship?", "No. Delivery of your order is free anywhere in the USA, printed or plain. And once you are shipping with them, printing adds nothing to the weight, so postage is the same as a plain mailer of that size."],
  ["Can you store my printed mailers and release them over time?", "For pallet-quantity programs, yes. Many brands print 10,000 or 25,000 at the lower unit price and take scheduled releases so they are not holding a full pallet in a small warehouse. Ask about release schedules when you request your quote."]
];

const renderCustomPage = () => {
  const routePath = "/custom-bubble-mailers/";
  const page = mainPages.find((item) => item.slug === "custom-bubble-mailers");
  const breadcrumbs = [
    { href: "/", label: "Home" },
    { href: routePath, label: "Custom Bubble Mailers" }
  ];
  const related = ["kraft-bubble-mailers", "white-bubble-mailers", "7x9-bubble-mailer", "12x15-bubble-mailer"].map((slug) => productsBySlug.get(slug)).filter(Boolean);
  // Indicative one-color kraft 7x9 ladder, derived from the same rates the
  // design tool uses (kraft 0.16 + one color 0.04, size factor 1.6).
  const ladder = [[500, 1.6], [1000, 1.35], [2500, 1.15], [5000, 1], [10000, 0.9], [25000, 0.8]].map(([qty, scale]) => [qty, ((0.16 + 0.04) * 1.6 * scale).toFixed(2)]);

  const body = `
    ${renderStandardPageHero({
      eyebrow: "Custom Printing",
      title: page.title,
      description: "Your logo, return panel or full-color artwork printed on kraft or white bubble mailers in any of our eleven sizes. Digital proof before production, minimum order 250 mailers, shipped to one or several US locations.",
      image: pickAsset("halloween", 0),
      ctas: [
        { href: "#quote-form", label: "Get a Printed Quote", primary: true },
        { href: "#print-pricing", label: "See Print Pricing" }
      ]
    })}
    <section class="section">
      <div class="container split-grid">
        <div class="content-card content-flow">
          <h2>What you can print on a bubble mailer</h2>
          <p>A padded mailer has one large flat panel on the front and another on the back, and both print cleanly. Most brands put a logo and a short line of text on the front, a return-address panel on the back, and leave the rest of the mailer plain so the courier label has room. Full-bleed color, patterns and inside-flap messages are all possible; they cost more because they use more ink and need tighter registration.</p>
          <ul>
            <li><strong>One color:</strong> a logo and a web address in a single spot color. The lowest-cost option and the one most small brands start with.</li>
            <li><strong>Two colors:</strong> a logo in brand color plus a second color for text or a return panel.</li>
            <li><strong>Full color:</strong> CMYK print for photographic artwork, gradients or busy patterns. Best on white poly.</li>
            <li><strong>Both sides:</strong> front branding plus a printed back, often used for care instructions or a reorder prompt.</li>
          </ul>
          <p>If you are deciding between finishes first, our <a href="/kraft-bubble-mailers/">kraft bubble mailers</a> page shows the ten numbered sizes the natural stock comes in.</p>
        </div>
        ${renderQuoteForm("Custom Printed Bubble Mailers")}
      </div>
    </section>
    <section class="section section-muted" id="print-pricing">
      <div class="container split-grid">
        <div class="content-card content-flow">
          <h2>Custom bubble mailer pricing by quantity</h2>
          <p>Printing is priced per unit on top of the plain mailer, and the per-unit figure falls as the run grows because plate and setup costs are fixed. The table shows an indicative ladder for a 7x9 kraft mailer with a one-color logo, taken from the same rates the Design Your Bubble Mailer section on each product page uses. Larger sizes, more colors and specialty stocks move the figures up; the emailed quote is the firm number.</p>
          <p>A useful rule: if you ship more than 300 orders a month, printing at 2,500 or 5,000 units almost always beats reordering 500 at a time, even after storage.</p>
        </div>
        <div class="table-card">
          <table class="comparison-table">
            <thead><tr><th>Quantity</th><th>Indicative price per mailer</th><th>Run total</th></tr></thead>
            <tbody>
              ${ladder.map(([qty, unit]) => `<tr><td>${qty.toLocaleString("en-US")}</td><td>${unit}</td><td>${Math.round(qty * Number(unit)).toLocaleString("en-US")}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container split-grid">
        <div class="content-card content-flow">
          <h2>Artwork, proofing and lead time</h2>
          <p>Send vector artwork (PDF, AI or EPS) with text outlined, or a 300 dpi raster file at print size if that is all you have. Name spot colors as Pantone references. We place the artwork on a template of the exact mailer size and send a digital proof; you approve it by email before anything prints, and revisions before approval are free.</p>
          <p>Plain stock leaves within a few business days. Printed runs are made to order, so allow a few weeks after proof approval as a planning figure, longer for full-color or custom sizes; an express production add-on is available when a launch date is fixed. We confirm the lead time on your quote so you can plan the launch around it.</p>
        </div>
        <div class="content-card content-flow content-soft">
          <h2>Which stock prints best</h2>
          <div class="benefit-rows">
            ${[
              "Kraft: natural brown paper face, best with dark one- or two-color logos; inks warm slightly on the stock.",
              "White poly: smooth, water-resistant, the truest color reproduction and the right base for full-color print.",
              "Metallic: reflective film for a retail-facing look; one-color print only.",
              "Recyclable paper: curbside-recyclable paper padding with a kraft face; prints like kraft.",
              "Custom sizes: any stock, quoted on request when none of the eleven standard sizes fits."
            ].map((item) => `<div class="benefit-row">${iconSvg("printer", "row-icon")}<span>${item}</span></div>`).join("")}
          </div>
        </div>
      </div>
    </section>
    <section class="section section-muted">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">Print-Ready Sizes</span>
          <h2>Popular sizes for printed runs</h2>
          <p>Any size can be printed. These four are the ones brands print most often.</p>
        </div>
        ${renderProductCards(related)}
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">FAQ</span>
          <h2>Custom printed bubble mailer FAQs</h2>
        </div>
        ${renderFaqList(customFaqs)}
      </div>
    </section>
  `;

  return buildPage({
    routePath,
    title: page.title,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    heroImage: pickAsset("halloween", 0).url,
    body,
    breadcrumbs,
    schemas: [faqSchema(customFaqs)]
  });
};

const contactFaqs = [
  ["How quickly will I hear back?", "Within 1-2 hours during US business hours. Requests sent in the evening or at the weekend are answered first thing the next business day."],
  ["What should I include in a quote request?", "Size (or the dimensions of your packed product), quantity, plain or printed, and the delivery ZIP code. If you want printing, attach your artwork or a rough sketch; we will tell you what is possible before quoting."],
  ["Can I call instead of using the form?", "Yes: (503) 461-4788. If you reach voicemail, leave the size and quantity and we will call back with a figure."],
  ["Do you reply by email or phone?", "By email with your quote unless you ask for a call. Emailed quotes make it easier to compare sizes and quantities and to forward to whoever approves purchasing."],
  ["Can I send artwork through the form?", "Yes. The form accepts PDF, AI, EPS, PNG and JPG. If the file is over 10 MB, send the form without it and reply to our confirmation email with the file attached."],
  ["Where do orders ship from?", "From US stock for plain mailers and from the printer for custom runs, delivered free to any US address, so the quoted mailer price is the delivered price."],
  ["Is there a minimum for a quote?", "No. We quote anything from the 250-mailer minimum order up to full pallets. Pricing simply improves as the quantity rises."],
  ["Can I visit or collect?", "We are a supply operation rather than a retail counter, so orders ship rather than being collected. Our business address is listed above for correspondence."],
  ["Do you quote for sizes not listed on the site?", "Yes. Give us the packed dimensions of your product and we will quote the closest stock size or a custom size if nothing standard fits."],
  ["What if I am not sure which size I need?", "Say so in the message and list two or three products with their dimensions. Recommending sizes is a normal part of the quote, and samples are available before you commit."]
];

const renderContactPage = () => {
  const breadcrumbs = [
    { href: "/", label: "Home" },
    { href: "/contact-us/", label: "Contact Us" }
  ];
  const body = `
    ${renderStandardPageHero({
      eyebrow: "Contact Shop Bubble Mailers",
      title: "Contact Us",
      description: "Reach out for product guidance, bulk pricing, custom bubble mailer projects, and standard stock availability.",
      image: pickAsset("plain", 4),
      ctas: [
        { href: "#quote-form", label: "Get Free Quote", primary: true },
        { href: "tel:" + site.phoneHref, label: "Call Now" }
      ]
    })}
    <section class="section">
      <div class="container shop-layout">
        ${renderQuoteForm("")}
        <div class="contact-panel content-flow">
          <h2>Direct contact details</h2>
          <p>Email, call, or send a quote request and tell us the product, quantity, and size you need.</p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:${site.email}">${site.email}</a></li>
            <li><strong>Phone:</strong> <a href="tel:${site.phoneHref}">${site.phone}</a></li>
            <li><strong>Address:</strong> ${site.address}</li>
          </ul>
          <div class="address-box">
            <strong>Shipping and business address</strong>
            <p>${site.address}</p>
            <a class="map-link" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}" target="_blank" rel="noopener">Open in Google Maps</a>
          </div>
        </div>
      </div>
    </section>
    <section class="section section-muted">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">FAQ</span>
          <h2>Contact and quote FAQs</h2>
        </div>
        ${renderFaqList(contactFaqs)}
      </div>
    </section>
  `;

  return buildPage({
    routePath: "/contact-us/",
    title: "Contact Us",
    metaTitle: "Contact Shop Bubble Mailers",
    metaDescription: "Contact Shop Bubble Mailers for quotes, product guidance, and bulk bubble mailer support in the USA.",
    heroImage: pickAsset("plain", 4).url,
    body,
    breadcrumbs,
    schemas: [{ "@context": "https://schema.org", "@type": "ContactPage", name: "Contact Shop Bubble Mailers", url: absoluteUrl("/contact-us/") }, faqSchema(contactFaqs)]
  });
};

const renderPolicyPage = ({ routePath, title, metaTitle, metaDescription, paragraphs, content }, schemas = []) => {
  const breadcrumbs = [
    { href: "/", label: "Home" },
    { href: routePath, label: title }
  ];
  const body = `
    ${renderStandardPageHero({
      eyebrow: title,
      title,
      description: metaDescription,
      image: pickAsset("generic", 0),
      ctas: [
        { href: "/contact-us/", label: "Contact Us", primary: true },
        { href: "/products/", label: "View Products" }
      ]
    })}
    <section class="section">
      <div class="container content-card content-flow">
        ${content || paragraphs.map(paragraph).join("")}
      </div>
    </section>
  `;

  return buildPage({
    routePath,
    title,
    metaTitle,
    metaDescription,
    heroImage: pickAsset("generic", 0).url,
    body,
    breadcrumbs,
    schemas
  });
};

const renderSitemapPage = () => {
  const breadcrumbs = [
    { href: "/", label: "Home" },
    { href: "/sitemap/", label: "Sitemap" }
  ];

  const contentLinks = [
    ...mainPages.filter((page) => page.slug && page.slug !== "sitemap").map((page) => ({ label: page.title, href: `/${page.slug}/` })),
    { label: "Shipping Policy", href: "/shipping-policy/" },
    { label: "Returns and Refunds", href: "/refund_returns/" },
    ...products.map((product) => ({ label: product.name, href: `/${product.slug}/` })),
    { label: "USA Locations", href: "/locations/" },
    ...locationStates.flatMap((state) => [
      { label: `Bubble Mailers in ${state.name}`, href: `/locations/${state.slug}/` },
      ...state.cities.map((city) => ({ label: `Bubble Mailers in ${city.name}, ${state.abbr}`, href: `/locations/${state.slug}/${city.slug}/` }))
    ])
  ];

  const body = `
    ${renderStandardPageHero({
      eyebrow: "HTML Sitemap",
      title: "Sitemap",
      description: "Use this page to browse all main site pages and product URLs.",
      image: pickAsset("bulk500", 0),
      ctas: [
        { href: "/sitemap.xml", label: "View XML Sitemap", primary: true },
        { href: "/products/", label: "Browse Products" }
      ]
    })}
    <section class="section">
      <div class="container content-card">
        <div class="text-columns">
          <ul>
            ${contentLinks.map((link) => `<li><a href="${link.href}">${link.label}</a></li>`).join("")}
          </ul>
        </div>
      </div>
    </section>
  `;

  return buildPage({
    routePath: "/sitemap/",
    title: "Sitemap",
    metaTitle: "HTML Sitemap | Shop Bubble Mailers",
    metaDescription: "Browse the full HTML sitemap for Shop Bubble Mailers pages and product URLs.",
    heroImage: pickAsset("bulk500", 0).url,
    body,
    breadcrumbs
  });
};

writeStaticAsset("styles.css", readText("styles.css"));
writeStaticAsset("script.js", readText("script.js"));
writeStaticAsset("checkout.js", readText("checkout.js"));
fs.cpSync(path.join(__dirname, "static", "badges"), path.join(distDir, "badges"), { recursive: true });
writeStaticAsset("favicon.svg", faviconSvg().trim());
writeStaticAsset("apple-touch-icon.svg", faviconSvg().trim());
// A PNG of the same mark, copied rather than generated: every mail client of
// consequence refuses to render SVG (Gmail drops it outright), so the email
// signature needs a raster version or it goes out with no logo at all. Copied
// here so a rebuild cannot quietly drop it — dist/ is committed, and a file
// that only ever existed in dist/ disappears the next time this runs.
fs.copyFileSync(path.join(__dirname, "static", "apple-touch-icon.png"), path.join(distDir, "apple-touch-icon.png"));
// Plain-text site summary for AI assistants and answer engines.
fs.copyFileSync(path.join(__dirname, "static", "llms.txt"), path.join(distDir, "llms.txt"));
// GA4 conversion-event listener, loaded after the gtag snippet in every head.
fs.copyFileSync(path.join(__dirname, "static", "ga4-events.js"), path.join(distDir, "ga4-events.js"));

writeRoute("/", renderHomePage());
writeRoute("/about-us/", renderAboutPage());
writeRoute("/products/", renderProductsPage());
const customOrderPolicyFaqs = [
  ["Can I return custom printed bubble mailers?", "Not as a change of mind, because printed material produced to your artwork cannot be resold or restocked. Where an order does not match the approved proof or the order specification, or has a manufacturing defect, we make it right with a free replacement or a refund. Report it within 14 days of delivery; our returns and refunds policy has the steps."],
  ["Can I return plain, unprinted bubble mailers?", "Plain stock is supplied to the specification on your order too, so change-of-mind returns are not accepted. If the size, finish or count is not what was specified, or the mailers are defective, we replace them free or refund them."],
  ["Is shipping really free?", "Yes. Every order ships free to any address in the United States, whether it is one case or several pallets, plain or printed. The quoted price is the delivered price."],
  ["What if I approve a proof and then spot a mistake?", "Tell us immediately. If production has not started, we reproof at no charge. Once material is committed the run cannot be recovered, which is why we ask you to approve the proof before production and encourage as many proof rounds as you want beforehand."],
  ["Will I receive exactly the quantity I ordered?", "Manufactured runs carry a tolerance either side of the ordered quantity, stated on your quotation along with how any variation is charged. If an exact count matters for your operation, tell us when you request the quote."],
  ["How quickly do I need to report a problem?", "Within 14 days of delivery, and while the stock is still available to inspect. Send photos with your order reference and we arrange a free replacement or a refund."],
  ["What happens if the carrier damages my order?", "We arrange every shipment, so transit damage is ours to sort out. Send photographs of the cartons and the affected mailers as they arrived and we replace the damaged quantity."],
  ["Can I cancel an order?", "Before the quotation is confirmed, freely. After confirmation and before the proof, yes, and the quotation is simply withdrawn. After proof approval, production is scheduled and material committed, so cancellation is treated as a change after production."],
  ["Can I change the quantity after confirming?", "Up to proof approval, yes; we reissue the quotation with the new quantity and price break. After approval the run is scheduled at the agreed quantity."],
  ["Do samples count toward the policy?", "Samples are supplied so you can check fit and finish before committing, and they are the step that prevents most of the problems on this page. Order them before a bulk or printed run rather than after."]
];

writeRoute("/custom-bubble-mailers/", renderCustomPage());
writeRoute(
  "/custom-order-policy/",
  renderPolicyPage({
    routePath: "/custom-order-policy/",
    title: "Custom Order Policy",
    metaTitle: "Custom Order Policy: Changes, Returns & Shipping | Shop Bubble Mailers",
    metaDescription: "What a bubble mailer order commits both sides to: where changes can be made, what we put right, what sits with you, free US shipping, and how to report a problem.",
    content: `
      <p>Made-to-order supply is not retail, and applying retail expectations to it causes most of the disputes in this industry. A printed run produced to your artwork cannot be restocked, resold or returned to a shelf, because there is no shelf it belongs on. This page sets out what that means in practice: what can be changed and at what point, what happens if an order is wrong, what shipping costs, and what a run of bubble mailers genuinely commits both sides to.</p>

      <h2>Where changes can be made, and where they cannot</h2>
      <p>An order passes through points after which a change costs a run rather than an email.</p>
      <ul>
        <li><strong>Before the quotation is confirmed.</strong> Anything can change: size, finish, print, quantity. This is the point to be undecided.</li>
        <li><strong>After confirmation, before the proof.</strong> Specification changes are still possible. The quotation is reissued so what is agreed stays unambiguous.</li>
        <li><strong>At proof stage.</strong> Artwork changes belong here. Ask for as many rounds as you need; a proof round costs far less than a reprint.</li>
        <li><strong>After proof approval.</strong> Production is scheduled against the approved proof. Changes from this point mean a new proof and, once material is committed, a new run.</li>
        <li><strong>After production.</strong> Custom printed mailers cannot be resold to anyone else. Changes at this point mean a fresh order.</li>
      </ul>

      <h2>What we are responsible for</h2>
      <p>If any of these happens, tell us and we will resolve it.</p>
      <ul>
        <li><strong>The order does not match the approved proof.</strong> Wrong color, wrong placement, wrong artwork. The proof is the reference and we are held to it.</li>
        <li><strong>The order does not match the order specification.</strong> Wrong size, wrong finish, wrong closure, wrong quantity band.</li>
        <li><strong>A manufacturing defect.</strong> Failed seals, adhesive that does not release cleanly, split seams or print defects across the run.</li>
        <li><strong>A short delivery.</strong> Counts are verified by carton before dispatch, and a genuine shortfall is ours to make good.</li>
        <li><strong>Damage in transit.</strong> We arrange every shipment, so report transit damage promptly with photographs of the cartons as they arrived.</li>
      </ul>

      <h2>What sits with you</h2>
      <p>These are the things we cannot check on your behalf, and they are why the proof and sample stages matter.</p>
      <ul>
        <li><strong>Errors in artwork you approved.</strong> A misspelled word, an old web address or a wrong handle on an approved proof cannot be caught by us, because we have no way to know what it should say.</li>
        <li><strong>Choosing a size that turns out not to fit.</strong> This is why samples exist. A sample before a run costs almost nothing; a run in the wrong size costs the run.</li>
        <li><strong>Ordering more than you can use.</strong> Particularly on seasonal work. We will quote a contingency quantity separately so you can see what it costs.</li>
        <li><strong>Rights in the artwork you supply.</strong> Confirming you may reproduce it commercially is your responsibility.</li>
      </ul>

      <h2>Returns</h2>
      <p>Because every order is supplied to an agreed specification, we do not accept change-of-mind returns on plain or printed stock. Where an order does not match the approved proof or the order specification, is short, or has a manufacturing defect, we make it right at our cost with a free replacement or a refund, paid within 10 business days to the original payment method. Report the problem within 14 days of delivery. Our <a href="/refund_returns/">returns and refunds policy</a> sets out each step. That commitment is the return policy, and it applies to every order shipped within the United States.</p>

      <h2>Shipping</h2>
      <p>Shipping is free to any address in the United States, for a single case or a full pallet, plain or printed. The price on your quotation is the delivered price. Pallet-quantity programs can be released on a schedule at no extra shipping cost, so you are not storing a full pallet at once.</p>

      <h2>Quantity variation on a manufactured run</h2>
      <p>Production runs do not stop at an exact unit, so a manufactured order may deliver slightly above or slightly below the quantity ordered. This is normal in the industry rather than a defect. The tolerance that applies to your order is stated on your quotation, along with how any variation is charged. If an exact quantity matters, a set number of units for a subscription drop for instance, say so when you ask for the quote so we can specify accordingly.</p>

      <h2>Reporting a problem</h2>
      <p>Contact us within 14 days of delivery, as soon as you find an issue, with the order reference, photographs of the cartons and the affected mailers as received, and the approximate proportion of the delivery affected. Keep the affected stock until the matter is resolved, because we may need to see it. The fastest route is the address and number on the <a href="/contact-us/">contact page</a>, and we confirm next steps by email so both sides have a record.</p>

      <h2>Questions about the custom order policy</h2>
      ${renderFaqList(customOrderPolicyFaqs)}
    `
  }, [faqSchema(customOrderPolicyFaqs)])
);

// /shipping-policy/ and /refund_returns/ (added 2026-11-11 for Merchant Center). Every figure comes
// from order-data.js, the same constants the Offer schema, the order box and /merchant-feed.xml use.
// They restate /custom-order-policy/ (free US shipping, no change-of-mind returns, errors made
// right) and add the days that page leaves to the quotation.
const H = ORDER.HANDLING_DAYS;
const T = ORDER.TRANSIT_DAYS;
const handlingText = `${H.min}-${H.max} business days`;
const transitText = `${T.min}-${T.max} business days`;
const contactBlock = `
      <ul>
        <li><strong>Email:</strong> <a href="mailto:${site.email}">${site.email}</a></li>
        <li><strong>Phone:</strong> <a href="tel:${site.phoneHref}">${site.phone}</a></li>
        <li><strong>Address:</strong> ${site.address}</li>
      </ul>`;

const shippingPolicyFaqs = [
  ["How much does shipping cost?", "Nothing. Shipping is free to any address in the United States, whether you order one case of 250 mailers or a full pallet, plain or printed. The total you see at checkout is the delivered total."],
  ["How long until my bubble mailers arrive?", `Plain stock orders leave us within ${handlingText} of the order, then spend ${transitText} in transit, so most US addresses receive them within ${H.min + T.min}-${H.max + T.max} business days of ordering.`],
  ["When does the clock start on a printed order?", `When you approve the digital proof. Printed runs are produced to your artwork, so the production time depends on quantity and colors and is confirmed on your quote; once the run is packed it ships free and arrives in ${transitText}.`],
  ["Do you ship outside the United States?", "No. Every order ships to a US address only. The checkout accepts United States delivery addresses and quotes are prepared for US delivery."],
  ["Will I get a tracking number?", "Yes. We email the tracking number as soon as the order leaves, to the address you gave at checkout."],
  ["Where do the mailers ship from?", "Plain mailers ship from US stock and custom printed runs ship from the printer once they are packed. Either way the delivery is free and arranged by us."],
  ["What counts as a business day?", "Monday to Friday, excluding US federal holidays. Orders placed after the end of a business day, or at the weekend, start on the next business day."],
  ["Can I split a pallet order into scheduled deliveries?", "Yes. Pallet-quantity programs can be released on a schedule at no extra shipping cost, so you do not have to store the whole run at once. Ask for the release plan on your quote."],
  ["Can I change the delivery address after ordering?", "Yes, until the order ships. Email or call us with the order number and the new US address. Once a carrier has the parcel we can only ask them to redirect it."],
  ["What if my order arrives damaged?", `Photograph the cartons as they arrived and the damaged mailers, then contact us within ${ORDER.RETURN_DAYS} days of delivery. Transit damage is ours to sort out, and we replace the damaged quantity or refund it under our <a href="/refund_returns/">returns and refunds policy</a>.`],
  ["Is there an extra charge for remote or rural US addresses?", "No. Free shipping covers any address in the United States. If a delivery needs a liftgate or an appointment for pallet freight, tell us when you order so we can book it."]
];

writeRoute(
  "/shipping-policy/",
  renderPolicyPage({
    routePath: "/shipping-policy/",
    title: "Shipping Policy",
    metaTitle: "Shipping Policy: Free US Delivery & Timelines | Shop Bubble Mailers",
    metaDescription: `Free shipping on every bubble mailer order to any US address. Plain stock leaves within ${handlingText} and arrives ${transitText} later, with tracking by email.`,
    content: `
      <p>A bubble mailer order is only useful once it is on your packing bench, so this page sets out exactly how it gets there: what shipping costs, where we deliver, how long each stage takes, and what happens if a carton arrives in poor shape. The same figures appear on every product page, at checkout and on your order confirmation.</p>

      <h2>What shipping costs</h2>
      <p>Shipping is free on every order to any address in the United States. That covers a single case of 250 mailers and a full pallet alike, plain stock and custom printed runs alike. The total at checkout is the delivered total, and nothing is added when the order ships.</p>

      <h2>Where we deliver</h2>
      <p>We ship to US addresses only. Businesses, warehouses, fulfillment centers and home offices are all fine. We do not ship outside the United States.</p>

      <h2>How long it takes</h2>
      <ul>
        <li><strong>Plain stock:</strong> leaves us within ${handlingText} of your order, then ${transitText} in transit. Shipping is free.</li>
        <li><strong>Custom printed:</strong> production time is confirmed on your quote and counted from proof approval; the packed run then ships free and spends ${transitText} in transit.</li>
      </ul>
      <p>Business days run Monday to Friday and exclude US federal holidays. An order placed at the weekend starts on the next business day.</p>

      <h2>Tracking</h2>
      <p>When the order leaves, we email the tracking number to the address you used at checkout. If it has not reached you within two business days of dispatch, reply to that email or call us and we will chase the carrier.</p>

      <h2>Pallet programs and scheduled releases</h2>
      <p>Large printed runs can be released on a schedule at no extra shipping cost, so you can buy at the pallet price without storing the pallet. Agree the release plan on your quote and each release ships free on the same transit time.</p>

      <h2>Address changes and missed deliveries</h2>
      <p>You can change the delivery address free of charge until the order ships. After that we can only ask the carrier to redirect it. If a delivery is missed, the carrier leaves a notice; if the parcel comes back to us, we resend it to a corrected US address at no cost.</p>

      <h2>Damaged or short deliveries</h2>
      <p>Check the cartons when they arrive. If anything is damaged or short, photograph it and contact us within ${ORDER.RETURN_DAYS} days of delivery. We arranged the shipment, so putting it right is our job: see our <a href="/refund_returns/">returns and refunds policy</a> for how replacements and refunds work.</p>

      <h2>Contact us about a delivery</h2>
      ${contactBlock}

      <h2>Shipping questions</h2>
      ${renderFaqList(shippingPolicyFaqs)}
    `
  }, [faqSchema(shippingPolicyFaqs)])
);

const refundReturnsFaqs = [
  ["Can I return bubble mailers I no longer need?", "No. Every order is made or picked to your specification, so we do not accept change-of-mind returns on plain or printed mailers. Returns cover orders that arrive damaged, defective, short or different from what you approved."],
  ["How long do I have to report a problem?", `${ORDER.RETURN_DAYS} days from the day the order is delivered. Report it as soon as you find it, while the cartons and the affected mailers are still available to inspect.`],
  ["What do I need to send?", "Your order number, photographs of the cartons as they arrived and of the affected mailers, and roughly how much of the delivery is affected. That is usually enough for us to approve a claim without seeing the stock."],
  ["Do I pay to send anything back?", "No. Most claims are settled from photographs. If we need the stock back, we arrange the collection or send a prepaid label, so a return costs you nothing."],
  ["How quickly will I get my money back?", `Within ${ORDER.REFUND_DAYS} business days of approving your claim, to the payment method you used. PayPal payments go back to PayPal and bank transfers to the account they came from.`],
  ["I paid cash on delivery. How is that refunded?", `By bank transfer or PayPal to the account you name, within ${ORDER.REFUND_DAYS} business days of approving the claim.`],
  ["Can I have a replacement instead of a refund?", "Yes. You choose: we remake or resend the affected quantity free of charge, shipping included, or refund it. Replacements ship on our standard free shipping."],
  ["What if the printing does not match my approved proof?", "That is our error. Wrong color, wrong position or wrong artwork against the approved proof is replaced or refunded in full for the affected mailers."],
  ["What is not covered?", "Mistakes in artwork you approved, a size that turns out not to fit your product, ordering more than you need, and quantity variation within the tolerance on your quote. Samples and proofs are there to catch these before a run."],
  ["The carrier damaged my order. Who handles it?", "We do. We arrange every shipment, so you report transit damage to us, not the carrier, and we replace or refund the damaged quantity."],
  ["Can I cancel an order?", "Yes, free of charge until you approve the proof, or for plain stock until the order ships. After proof approval a printed run is scheduled and the material is committed, so it can no longer be canceled."],
  ["Does this policy apply to every size and finish?", "Yes. Kraft, white, numbered and inch sizes, plain or printed, ordered online or through a quote, all follow the same policy for deliveries within the United States."]
];

writeRoute(
  "/refund_returns/",
  renderPolicyPage({
    routePath: "/refund_returns/",
    title: "Returns and Refunds",
    metaTitle: "Returns & Refunds Policy | Shop Bubble Mailers",
    metaDescription: `Damaged, defective, short or not as approved? Report it within ${ORDER.RETURN_DAYS} days of delivery for a free replacement or a refund within ${ORDER.REFUND_DAYS} business days.`,
    content: `
      <p>Bubble mailers are made or picked to your order, so we do not take back stock that was simply ordered by mistake. What we do take responsibility for is everything that is our fault: a run that arrives damaged, a defect in the mailers, a short count, or printing that does not match the proof you approved. This page explains how to report it and what we do about it.</p>

      <h2>What we put right</h2>
      <ul>
        <li><strong>Damage in transit.</strong> Crushed, torn or wet cartons and the mailers inside them.</li>
        <li><strong>Manufacturing defects.</strong> Failed seals, adhesive that does not release, split seams, bubble lining that is not bonded, or print defects across the run.</li>
        <li><strong>Not what you ordered or approved.</strong> Wrong size, wrong finish, or printing that differs from the approved digital proof.</li>
        <li><strong>A short delivery.</strong> Fewer mailers than ordered, beyond the tolerance on your quote.</li>
      </ul>

      <h2>The ${ORDER.RETURN_DAYS}-day window</h2>
      <p>Tell us within ${ORDER.RETURN_DAYS} days of delivery. Keep the affected mailers and their cartons until the claim is settled, because we may ask to see them.</p>

      <h2>How to make a claim</h2>
      <ol>
        <li>Email <a href="mailto:${site.email}">${site.email}</a> or call <a href="tel:${site.phoneHref}">${site.phone}</a> with your order number.</li>
        <li>Attach photographs of the cartons as they arrived and of the affected mailers.</li>
        <li>Tell us roughly what share of the delivery is affected and whether you would like a replacement or a refund.</li>
      </ol>
      <p>Most claims are settled from the photographs alone. If we need the stock back, we arrange collection or send a prepaid label, so returning it costs you nothing.</p>

      <h2>Replacement or refund</h2>
      <p>Once a claim is approved you choose the remedy. We remake or resend the affected quantity free of charge with free shipping, or we refund it. Refunds are paid within ${ORDER.REFUND_DAYS} business days of approval to the original payment method: PayPal back to PayPal, bank transfer back to the sending account, and cash on delivery by bank transfer or PayPal to the account you name.</p>

      <h2>What this policy does not cover</h2>
      <ul>
        <li>Change-of-mind returns on plain or printed mailers.</li>
        <li>Errors in artwork you approved on the proof, such as a misspelled word or an old web address.</li>
        <li>A size that turns out not to fit your product. Samples exist to settle this before a run.</li>
        <li>Quantity variation within the tolerance stated on your quote.</li>
      </ul>

      <h2>Canceling an order</h2>
      <p>You can cancel free of charge until you approve the proof, or for plain stock until the order ships. After proof approval a printed run is scheduled and its material committed, so it can no longer be canceled. Our <a href="/custom-order-policy/">custom order policy</a> walks through each stage of a printed order.</p>

      <h2>Who to contact</h2>
      ${contactBlock}
      <p>This policy applies to every order delivered within the United States. Delivery times and costs are on our <a href="/shipping-policy/">shipping policy</a>.</p>

      <h2>Returns and refunds questions</h2>
      ${renderFaqList(refundReturnsFaqs)}
    `
  }, [faqSchema(refundReturnsFaqs)])
);

const renderThankYouPage = () => {
  const body = `
    <section class="section">
      <div class="container">
        <div class="thankyou-card">
          <div class="thankyou-mark">${iconSvg("quote", "row-icon")}</div>
          <h1>Thank you — we have your request</h1>
          <p class="thankyou-lede">
            Your details are with our quote team. We reply with pricing, sizing guidance and lead
            time within 1-2 hours during US business hours.
          </p>
          <ol class="thankyou-steps">
            <li><span>1</span> We review your size, quantity and any artwork.</li>
            <li><span>2</span> You get a price with material and print options.</li>
            <li><span>3</span> We confirm lead time and shipping before anything runs.</li>
          </ol>
          <div class="thankyou-actions">
            <a class="button button-primary" href="/">Back to home</a>
            <a class="button button-outline" href="/products/">Browse bubble mailers</a>
          </div>
          <p class="thankyou-contact">
            Need it sooner? Call <a href="tel:${site.phoneHref}">${site.phone}</a> or email
            <a href="mailto:${site.email}">${site.email}</a>.
          </p>
        </div>
      </div>
    </section>
  `;

  return buildPage({
    // A confirmation page has no search value and reads badly in results.
    noindex: true,
    routePath: "/thank-you/",
    title: "Thank you — your request is with us",
    metaTitle: "Thank You | Shop Bubble Mailers",
    metaDescription: "Your bubble mailer quote request has been received. Our team replies with pricing within 1-2 hours.",
    body
  });
};

writeRoute("/contact-us/", renderContactPage());
writeRoute("/thank-you/", renderThankYouPage());

/**
 * Checkout and order confirmation (owner 2026-11-05). No card is taken here: the order is emailed
 * to the office and paid by PayPal invoice or bank transfer after the digital proof, or cash on
 * delivery at a US address. Lines live in localStorage (src/checkout.js); api/order.js re-prices
 * every line from order-data.js. Both pages are noindex,follow and stay out of the sitemap.
 */
const checkoutField = (id, label, inner) => `<label data-field>${label}${inner}<small class="field-error" data-err hidden></small></label>`;
const renderCheckoutPage = () => {
  const cfg = JSON.stringify({
    key: "sbm-cart", catalog: Object.fromEntries(Object.entries(ORDER.CATALOG).map(([slug, entry]) => [slug, entry.name])),
    prices: Object.fromEntries(Object.entries(ORDER.CATALOG).map(([slug, entry]) => [slug, entry.price])),
    unit: 0, pack: ORDER.PACK_QTY, max: ORDER.MAX_QTY, cod: ORDER.COD_COUNTRIES, unitName: ORDER.UNIT, unitsName: ORDER.UNITS,
    phone: site.phone, currency: "USD", allUrl: "/products/", confirmUrl: "/order-confirmed/",
  }).replace(/</g, "\\u003c");
  const body = `
    <section class="page-hero">
      <div class="container">
        <span class="eyebrow">Checkout</span>
        <h1>Your order</h1>
        <p>Plain stock at each size's starting price, with a minimum order (MOQ) of ${ORDER.PACK_QTY} ${ORDER.UNITS} and free shipping to any US address. Printed orders get a digital proof before anything prints, and nothing is paid before you approve it.</p>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <form class="checkout" id="checkout-form" method="post" action="/api/order/" novalidate data-checkout>
          <div class="checkout-main">
            <fieldset class="content-card checkout-card"><legend>Who is ordering</legend>
              <div class="field-grid">${checkoutField("co-name", "Full name", `<input id="co-name" type="text" name="name" required maxlength="120" autocomplete="name">`)}${checkoutField("co-business", "Business name", `<input id="co-business" type="text" name="company" maxlength="140" autocomplete="organization">`)}</div>
              <div class="field-grid">${checkoutField("co-email", "Email", `<input id="co-email" type="email" name="email" required maxlength="160" autocomplete="email">`)}${checkoutField("co-phone", "Phone", `<input id="co-phone" type="tel" name="phone" required maxlength="40" autocomplete="tel">`)}</div>
            </fieldset>
            <fieldset class="content-card checkout-card"><legend>Delivery address</legend>
              <p class="checkout-sub">We ship to US addresses only, free of charge, and email the tracking number when the order leaves.</p>
              ${checkoutField("co-country", "Country", `<select id="co-country" name="country" required autocomplete="country">${ORDER.SHIP_COUNTRIES.map((country) => `<option value="${country.code}">${country.name}</option>`).join("")}</select>`)}
              ${checkoutField("co-address1", "Street address", `<input id="co-address1" type="text" name="address1" required maxlength="200" autocomplete="address-line1">`)}
              ${checkoutField("co-address2", "Apartment, suite or unit", `<input id="co-address2" type="text" name="address2" maxlength="200" autocomplete="address-line2">`)}
              <div class="field-grid">${checkoutField("co-city", "City", `<input id="co-city" type="text" name="city" required maxlength="100" autocomplete="address-level2">`)}${checkoutField("co-region", "State", `<input id="co-region" type="text" name="region" maxlength="60" autocomplete="address-level1">`)}</div>
              <div class="field-grid">${checkoutField("co-postal", "ZIP code", `<input id="co-postal" type="text" name="postal" required maxlength="20" autocomplete="postal-code">`)}</div>
            </fieldset>
            <fieldset class="content-card checkout-card"><legend>How you will pay</legend>
              <p class="checkout-sub">No card is taken on this site. Choose how we invoice you after the proof is approved.</p>
              <div class="pay-choice">${ORDER.PAYMENT_METHODS.map((method, index) => `<label><input type="radio" name="payment" id="co-pay-${method.id}" value="${method.id}"${index ? "" : " checked"}><span><b>${method.name}</b><small>${method.detail}</small></span></label>`).join("")}</div>
              ${renderPayBadges()}
            </fieldset>
            <fieldset class="content-card checkout-card"><legend>Artwork and notes</legend>
              <p class="checkout-sub">Optional now. You can also email artwork after ordering; our team asks for anything missing before the proof.</p>
              <label>Upload artwork (optional)
                <input id="co-files" type="file" name="files" multiple accept=".pdf,.ai,.eps,.svg,.png,.jpg,.jpeg,.zip">
              </label>
              ${checkoutField("co-notes", "Size, plain or printed, print colors or deadline", `<textarea id="co-notes" name="notes" rows="4" maxlength="3000"></textarea>`)}
            </fieldset>
            <label class="checkout-trap" aria-hidden="true">Company website<input type="text" name="company_website" tabindex="-1" autocomplete="off"></label>
          </div>
          <aside class="checkout-side">
            <div class="content-card checkout-summary" data-order-summary>
              <h2>Order summary</h2>
              <p class="checkout-sub"><span data-order-count>0 ${ORDER.UNITS}</span> at each size's starting price</p>
              <table class="order-lines"><tbody data-lines><tr><td colspan="2" data-empty>Your order is empty. <a href="/products/">Choose a size</a> to add it here.</td></tr></tbody></table>
              <table class="order-sum"><tbody><tr><td>Shipping</td><td class="order-sum-free">Free</td></tr><tr><th scope="row">Total</th><td data-grand>$0.00</td></tr></tbody></table>
              <p class="order-box-hint">Prices in US dollars at the plain-stock starting price. Printing, specialty materials and pallet programs are quoted separately.</p>
              <p class="form-status checkout-status" data-status role="status" aria-live="polite"></p>
              <button type="submit" class="button button-primary" data-place disabled>Place order</button>
              ${renderFormSeals()}
              <p class="order-box-note">By placing the order you agree to our <a href="/terms-and-conditions/">terms</a>, <a href="/shipping-policy/">shipping policy</a>, <a href="/refund_returns/">returns and refunds policy</a> and <a href="/custom-order-policy/">custom order policy</a>. Questions? Call <a href="tel:${site.phoneHref}">${site.phone}</a> or email <a href="mailto:${site.email}">${site.email}</a>.</p>
            </div>
          </aside>
        </form>
      </div>
    </section>
    <script type="application/json" id="checkout-config">${cfg}</script>
    <script src="/checkout.js?v=${assetVersion("checkout.js")}" defer></script>
  `;
  return buildPage({
    noindex: true,
    routePath: "/checkout/",
    title: "Checkout",
    metaTitle: "Checkout | Shop Bubble Mailers",
    metaDescription: "Order bubble mailers from a minimum of 250 (MOQ) at each size's starting price, with free shipping to any US address. Pay by invoice after your digital proof, or cash on delivery.",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Checkout", href: "/checkout/" }],
    body
  });
};
const renderOrderConfirmedPage = () => {
  const pay = JSON.stringify(Object.fromEntries(ORDER.PAYMENT_METHODS.map((method) => [method.id, method.detail]))).replace(/</g, "\\u003c");
  const body = `
    <section class="page-hero">
      <div class="container">
        <span class="eyebrow">Order received</span>
        <h1>Thank you, your order is in</h1>
        <p>Your order is with our team and a copy is on its way to your inbox. Keep the order number below for any question about it.</p>
        <p class="order-ref" data-ref hidden><span>Your order number</span><strong data-ref-value></strong></p>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="content-card content-flow order-next">
          <h2>What happens next</h2>
          <ol class="order-box-steps order-next-steps">
            <li><b>We check your order and artwork.</b> Printed orders get a digital proof by email, usually within one business day. If a file is missing we ask for it first.</li>
            <li><b>You approve the proof, or ask for changes.</b> Nothing prints before you approve it.</li>
            <li><b>Payment.</b> <span data-pay>${ORDER.PAYMENT_METHODS[0].detail}</span></li>
            <li><b>Free shipping.</b> Your order ships free to your US address and we email the tracking number when it leaves. Damage, defects and shortfalls reported within ${ORDER.RETURN_DAYS} days of delivery are replaced or refunded under our <a href="/refund_returns/">returns and refunds policy</a>.</li>
          </ol>
          <p>Questions? Call <a href="tel:${site.phoneHref}">${site.phone}</a> or email <a href="mailto:${site.email}">${site.email}</a> and quote your order number.</p>
          <div class="button-row">
            <a class="button button-primary" href="/products/">Browse all sizes</a>
            <a class="button button-outline" href="/custom-bubble-mailers/">Custom printed mailers</a>
          </div>
        </div>
      </div>
    </section>
    <script type="application/json" id="pay-config">${pay}</script>
    <script>(function(){var q=new URLSearchParams(location.search),r=q.get("ref"),m=q.get("pay"),pay=JSON.parse(document.getElementById("pay-config").textContent);if(r&&/^[A-Z0-9-]{6,32}$/.test(r)){var el=document.querySelector("[data-ref]");el.querySelector("[data-ref-value]").textContent=r;el.hidden=false}if(m&&pay[m])document.querySelector("[data-pay]").textContent=pay[m];try{localStorage.removeItem("sbm-cart")}catch(e){}})();</script>
  `;
  return buildPage({
    noindex: true,
    routePath: "/order-confirmed/",
    title: "Order received",
    metaTitle: "Order Received | Shop Bubble Mailers",
    metaDescription: "Your bubble mailer order has reached Shop Bubble Mailers. Printed orders get a digital proof before anything prints, and every order ships free to any US address.",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Order received", href: "/order-confirmed/" }],
    body
  });
};
writeRoute("/checkout/", renderCheckoutPage());
writeRoute("/order-confirmed/", renderOrderConfirmedPage());
writeRoute(
  "/privacy-policy/",
  renderPolicyPage({
    routePath: "/privacy-policy/",
    title: "Privacy Policy",
    metaTitle: "Privacy Policy | Shop Bubble Mailers",
    metaDescription: "Read the Shop Bubble Mailers privacy policy covering website inquiries, quote requests, and contact information use.",
    content: `
      <h2>Overview</h2>
      <p>Shop Bubble Mailers respects your privacy and is committed to handling website inquiry and customer communication data responsibly. This Privacy Policy explains what information we may collect through this website, how we use it, and the choices available to visitors, customers, and business buyers who contact us.</p>

      <h2>Information We Collect</h2>
      <p>When you use our website, submit a quote request, email us, call us, or share artwork and order details, we may collect information such as your name, company name, email address, phone number, shipping details, product interest, size requirements, estimated quantities, and files you choose to upload.</p>
      <p>We may also collect standard technical information through website analytics, hosting logs, and security tools. This may include browser type, device information, page visits, referral source, approximate location based on IP address, and basic usage behavior used to understand site performance and improve the website over time.</p>

      <h2>How We Use Information</h2>
      <p>Information submitted through this website may be used to:</p>
      <ul>
        <li>Respond to quote requests, product questions, and customer service inquiries.</li>
        <li>Review size requirements, quantity needs, artwork files, and packaging specifications.</li>
        <li>Provide business communication related to stock availability, pricing, lead times, and order follow-up.</li>
        <li>Maintain internal records for quote history, project communication, and customer support.</li>
        <li>Monitor website performance, security, and usability.</li>
      </ul>

      <h2>Quote Requests and Uploaded Files</h2>
      <p>If you submit a quote request or upload artwork, specifications, or other project information, we may retain those materials as part of the quoting and support process. This helps us respond more accurately to packaging, printing, sizing, and production-related discussions.</p>

      <h2>Cookies and Analytics</h2>
      <p>This website may use standard cookies, analytics tools, or hosting-level logging to understand how pages are used, improve site speed and content structure, and monitor technical performance. These tools are generally used for website operation, reporting, and user experience improvement rather than for selling visitor data.</p>

      <h2>How We Share Information</h2>
      <p>We do not sell your personal information. We may share information only when reasonably necessary to operate the website, process communications, maintain hosting or form services, protect the website, comply with legal obligations, or support business operations connected to quote handling and customer service.</p>

      <h2>Data Retention</h2>
      <p>We may keep inquiry records, quote submissions, and related communication for as long as needed for follow-up, customer service, internal recordkeeping, business planning, and legal or operational requirements. Retention periods may vary depending on the nature of the inquiry or project.</p>

      <h2>Data Security</h2>
      <p>We use reasonable administrative and technical measures to protect information submitted through the website. However, no method of transmission or storage can be guaranteed to be completely secure, and users should avoid sending highly sensitive information unless necessary for the requested service.</p>

      <h2>Your Choices</h2>
      <p>You may contact us to ask about the information you have submitted through this website, request updates to inaccurate information, or request that we stop using certain contact information for business follow-up where applicable.</p>

      <h2>Third-Party Links</h2>
      <p>This website may include links to third-party websites such as map services or external resources. We are not responsible for the privacy practices or content of external websites once you leave our domain.</p>

      <h2>Children's Privacy</h2>
      <p>This website is intended for business buyers, commercial inquiry, and general product research. It is not intended for children, and we do not knowingly collect personal information from children through this website.</p>

      <h2>Policy Updates</h2>
      <p>We may update this Privacy Policy from time to time to reflect changes in business operations, website tools, legal requirements, or communication practices. Updated versions will be posted on this page.</p>

      <h2>Contact Us</h2>
      <p>If you have questions about this Privacy Policy or how information is handled through the Shop Bubble Mailers website, contact us at <a href="mailto:${site.email}">${site.email}</a>, call <a href="tel:${site.phoneHref}">${site.phone}</a>, or write to ${site.address}.</p>
    `
  })
);
writeRoute(
  "/terms-and-conditions/",
  renderPolicyPage({
    routePath: "/terms-and-conditions/",
    title: "Terms and Conditions",
    metaTitle: "Terms and Conditions | Shop Bubble Mailers",
    metaDescription: "Read the Shop Bubble Mailers terms and conditions for website use, quote requests, and business communications.",
    content: `
      <h2>Acceptance of Terms</h2>
      <p>By accessing or using the Shop Bubble Mailers website, you agree to these Terms and Conditions. If you do not agree with these terms, you should not use the website.</p>

      <h2>Website Purpose</h2>
      <p>This website is provided for lawful business inquiry, product research, contact communication, and quote request submission related to bubble mailers, padded mailers, custom packaging, and related products and services. Content is intended to help business buyers understand product categories, sizes, packaging options, and contact routes.</p>

      <h2>No Binding Sale Through Website Browsing Alone</h2>
      <p>Submitting a form, requesting a quote, or reviewing information on this website does not create a binding sale, supply agreement, or production commitment. Pricing, product availability, specifications, customization details, freight terms, lead times, and delivery schedules are confirmed separately through direct communication.</p>

      <h2>Product Information and Availability</h2>
      <p>We aim to keep product descriptions, page content, category details, and size references accurate and useful. However, product information, stock status, customization options, specifications, and packaging availability may change without prior notice. Buyers should confirm final details before relying on any page content for purchasing or operational decisions.</p>

      <h2>Quotes and Order Discussions</h2>
      <p>Quotes provided through website forms, email, or phone communication are subject to review, clarification, stock conditions, project scope, and any additional commercial terms discussed between the parties. Custom work, artwork review, and production planning may require additional confirmation before an order is accepted.</p>

      <h2>User Responsibilities</h2>
      <p>By using this website, you agree not to:</p>
      <ul>
        <li>Use the website for unlawful, misleading, fraudulent, or abusive activity.</li>
        <li>Attempt to interfere with website operation, security, or hosting infrastructure.</li>
        <li>Submit false inquiry information, unauthorized files, or harmful code.</li>
        <li>Misrepresent your identity, company, or business intent when contacting us.</li>
      </ul>

      <h2>Intellectual Property</h2>
      <p>All content on this website, including text, structure, page layout, graphics, branding elements, and written copy, is provided for Shop Bubble Mailers business use unless otherwise stated. Unauthorized copying, resale, republication, scraping, or misuse of site content is not permitted.</p>

      <h2>Third-Party Links and Services</h2>
      <p>This website may include links to third-party tools or websites, including map services and communication platforms. We do not control or guarantee the content, availability, or terms of third-party websites accessed through external links.</p>

      <h2>Disclaimer of Warranties</h2>
      <p>The website and its content are provided on an “as is” and “as available” basis. While we work to maintain useful and accurate information, we do not guarantee that the website will always be uninterrupted, error-free, complete, or suitable for every specific business use.</p>

      <h2>Limitation of Liability</h2>
      <p>To the fullest extent permitted by law, Shop Bubble Mailers will not be liable for indirect, incidental, special, or consequential damages arising from use of the website, reliance on website content, inability to access the website, or communication delays related to forms, email, or general inquiry.</p>

      <h2>Indemnification</h2>
      <p>You agree to indemnify and hold Shop Bubble Mailers harmless from claims, losses, liabilities, or expenses arising from your misuse of the website, your violation of these terms, or your submission of unauthorized or unlawful content.</p>

      <h2>Governing Use and Updates</h2>
      <p>We may update these Terms and Conditions from time to time to reflect changes in business operations, website features, or legal requirements. Continued use of the website after updates are posted constitutes acceptance of the revised terms.</p>

      <h2>Contact Information</h2>
      <p>If you have questions about these Terms and Conditions, contact us at <a href="mailto:${site.email}">${site.email}</a>, call <a href="tel:${site.phoneHref}">${site.phone}</a>, or write to ${site.address}.</p>
    `
  })
);
products.forEach((product) => writeRoute(`/${product.slug}/`, productSections(product)));

// ---------------------------------------------------------------------------
// Blog: three padded-mailer guides. Each section carries exactly one
// contextual internal link (site owner's one-link-per-heading rule).
// ---------------------------------------------------------------------------
const blogPosts = [
  {
    slug: "how-to-choose-bubble-mailer-size",
    category: "Buying Guide",
    image: "generic",
    date: "2026-05-19",
    updated: "2026-10-06",
    readTime: "7 min read",
    title: "How to Choose the Right Bubble Mailer Size",
    metaTitle: "How to Choose a Bubble Mailer Size | Shop Bubble Mailers",
    metaDescription:
      "A practical guide to choosing bubble mailer sizes - matching the mailer to your product, common size ranges, and avoiding costly oversizing on shipping.",
    intro:
      "The right bubble mailer size protects your product, keeps postage down, and makes packing faster. The wrong size means damage claims, wasted material, or paying to ship empty space. Padded mailers look simple, but the size you standardize on ripples through your whole operation - breakage rates, carrier bills, packing speed, and how professional the parcel feels on the doorstep. Here is how to size a padded mailer correctly, whatever you ship.",
    sections: [
      {
        heading: "Match the mailer to the product",
        html: `<p>Start from the item, not from a generic size chart. Measure the product at its widest and thickest points, then add a small allowance for the padded lining and a clean seal. A mailer that hugs the product too tightly puts stress on the seams and can split in the carrier's sorting machinery; one that leaves the item swimming lets it shift, rub, and arrive damaged. The goal is a snug fit with just enough room to close cleanly. Working from our full <a href="/products/">bubble mailer range</a> makes it easier to compare formats side by side against the products you actually ship.</p>
        <p>Shape matters as much as raw dimensions. Flat, rigid items such as books, phone cases, and framed prints suit a close-fitting mailer, while soft or irregular items like folded apparel need a little extra width so the mailer does not pucker at the seams when it is sealed. If you ship a mix of products, it is almost always better to standardize on two or three sizes that cover most of your orders than to stock a dozen near-identical formats that slow packers down and complicate reordering.</p>`,
      },
      {
        heading: "Common sizes and what they fit",
        html: `<p>Bubble mailer sizes are usually described by their internal usable dimensions - the space you actually have once the seal and padding are accounted for, not the outside measurement. A handful of formats cover the vast majority of eCommerce needs, from tiny accessories to folded apparel and mixed kits. Learning which size maps to which product type removes most of the guesswork.</p>`,
        bullets: [
          `Small: jewelry, cards, samples, and single cosmetics travel well in a <a href="/4x6-bubble-mailer/">4x6 bubble mailer sized for small accessories</a>.`,
          "Medium (7x9, 8.5x12): books, larger cosmetics, small apparel, electronics accessories, multi-item orders.",
          "Large (10.5x15 and up): folded apparel, kits, documents, and mixed retail orders.",
        ],
      },
      {
        heading: "Test before you commit to a bulk run",
        html: `<p>If you are unsure between two sizes, order a small quantity of each and pack your real products before buying in volume. A five-minute test with your actual inventory tells you far more than any size chart, and it prevents the expensive mistake of committing to ten thousand mailers that turn out to be half an inch too small or noticeably too big. Pay attention to how the mailer seals with the product inside, whether the contents move when you shake it gently, and how quickly your team can pack one.</p>
        <p>It also helps to think a season ahead. If you plan to add larger products or bundle items for promotions, choose a size range that has a little headroom rather than one that only fits today's smallest SKU. Locking your formats early - and testing them properly - is what lets you order confidently and negotiate better pricing on larger, repeatable runs.</p>`,
      },
      {
        heading: "Avoid the cost of oversizing",
        html: `<p>An oversized mailer feels like the safe choice, but it quietly costs money on every order. Extra space means you either add void fill to stop the product moving - more material and more packing time - or you accept a higher damage rate. It also raises dimensional-weight postage, where carriers charge based on the space a parcel occupies rather than its actual weight, so a light product in an oversized mailer can cost as much to ship as something far heavier.</p>
        <p>Sizing to the product plus a small clearance is the single cheapest way to cut both damage and postage across a shipping program. Once you have settled your sizes, the next decision is finish and branding. If you are standardizing a packing program across many SKUs, our guide to <a href="/blog/kraft-vs-white-bubble-mailers/">kraft vs white bubble mailers</a> helps you lock the look once the dimensions are right.</p>`,
      },
    ],
    faq: [
      ["What size bubble mailer do I need for a small item?", "For small items like jewelry, cards, and samples, a 4x6 or 4x7 mailer is usually ideal. Measure the item at its widest and thickest points and add a small allowance for the padded lining and a clean seal."],
      ["Is a bigger bubble mailer always safer?", "No. An oversized mailer lets the product move in transit, which increases damage, and it raises dimensional-weight postage costs. Size to the product plus a small clearance rather than reaching for the largest mailer you have."],
      ["How much extra space should I leave inside a bubble mailer?", "Leave just enough room to close and seal the mailer cleanly - typically a small allowance beyond the product's widest and thickest points. Too little and the seams strain in transit; too much and the item shifts while you pay for empty space."],
      ["How many bubble mailer sizes should my business stock?", "Most businesses are best served by two or three sizes that cover the majority of their orders rather than a dozen near-identical formats. Standardizing sizes speeds up packing, simplifies reordering, and still fits most products well."],
      ["Do bubble mailer dimensions refer to inside or outside measurements?", "Bubble mailer sizes are usually quoted as internal usable dimensions - the space available for your product after the seal and padding. Always check the usable size rather than the outer size when matching a mailer to an item."],
      ["Can bubble mailers be used for fragile items?", "Bubble mailers protect against scuffs, moisture, and light impacts, which suits most non-breakable goods. For genuinely fragile items like glass or ceramics, add internal cushioning or choose a rigid box, since the padded lining alone is not designed for heavy impact protection."],
      ["What size bubble mailer fits a book?", "A standard paperback fits a 7x9 (#0 or #1); a trade paperback or hardback needs an 8.5x12 (#2). Measure the spine thickness too: a 1.5 in thick hardback in an 8.5x12 seals cleanly, but a stack of two needs a #3 or #4."],
      ["What is the most popular bubble mailer size?", "The 8.5x12 (#2) is the most-ordered size across US online stores because it holds folded shirts, documents, tablets and most multi-item orders. For small-item sellers the 4x7 (#000) is the volume size."],
      ["Is 4x6 or 4x7 better for jewelry?", "A 4x6 for carded earrings, rings and pins where the item is under 3/4 in thick; a 4x7 if you add a gift box or a thank-you card. Both ship in the same postage tier, so choose by what fits, not by price."],
      ["Can one bubble mailer size work for a whole store?", "Only if every product is roughly the same size. Most stores settle on two: one small (4x7 or 6x9) and one mid (8.5x12). A single large size wastes postage on small orders and lets items shift."],
    ],
    related: ["kraft-vs-white-bubble-mailers", "custom-printed-bubble-mailers-branding"],
  },
  {
    slug: "kraft-vs-white-bubble-mailers",
    category: "Comparison",
    image: "kraft",
    date: "2026-06-02",
    updated: "2026-10-06",
    readTime: "7 min read",
    title: "Kraft vs White Bubble Mailers: Which Is Right for Your Brand?",
    metaTitle: "Kraft vs White Bubble Mailers | Which To Choose",
    metaDescription:
      "Compare kraft and white bubble mailers on look, branding, and cost so you can choose the padded mailer that fits your product, your brand, and your budget.",
    intro:
      "Kraft and white bubble mailers protect a product equally well - both use the same padded bubble lining. The real difference is how they look and what they signal about your brand before the parcel is even opened. That first impression matters more than most sellers expect, because the mailer is often the very first physical touchpoint a customer has with your business. Here is how to choose between them with confidence.",
    sections: [
      {
        heading: "The case for kraft",
        html: `<p>Kraft mailers have a natural, paper-look finish that reads as honest, eco-conscious, and handmade. They suit artisan producers, sustainable products, wellness brands, and anything where a warm, understated look fits the story better than bright white. On a doorstep and in unboxing photos, kraft feels grounded and considered rather than mass-produced. Our <a href="/kraft-bubble-mailers/">kraft bubble mailers</a> deliver that natural appearance while still providing full padded protection for the contents.</p>
        <p>Kraft also hides scuffs and handling marks better than white, which can be an advantage across a long carrier journey. The trade-off is print contrast: bright colors and fine detail do not pop on a brown substrate the way they do on white, so brands that rely on vivid artwork sometimes find kraft limiting. If your look is earthy, minimal, or typographic, that is rarely a problem - and often a strength.</p>`,
      },
      {
        heading: "The case for white",
        html: `<p>White mailers read as clean, modern, and retail-ready. They photograph beautifully for social unboxing, they make printed logos and brand colors pop, and they suit cosmetics, fashion, and direct-to-consumer brands that want a crisp, premium presentation. When color accuracy and a bright, contemporary feel matter to your positioning, <a href="/white-bubble-mailers/">white bubble mailers</a> are usually the stronger fit.</p>
        <p>The considerations with white are practical. It shows scuffs and dirt more readily than kraft, so the finish and handling quality matter more, and a plain white mailer with no branding can look a little generic next to a well-designed kraft one. White earns its keep most clearly when it is printed - a bold logo or color block on a white base is one of the most recognizable looks in modern eCommerce packaging.</p>`,
      },
      {
        heading: "How to decide",
        html: `<p>Match the mailer to the brand promise, not just to personal taste. Natural, wellness, sustainable, and artisan brands usually lean kraft; beauty, fashion, tech, and premium retail brands usually lean white. Consider where your customers will see the parcel - if unboxing content and shelfie-style photos are part of your marketing, the brighter, higher-contrast white often performs better on camera.</p>
        <p>Also weigh consistency across your range. Whichever base you choose, using it uniformly across every order builds recognition over time, so customers start to associate that look with you. And remember that the biggest lift for either color usually comes from printing your brand on it rather than shipping plain - which is exactly what our guide to <a href="/blog/custom-printed-bubble-mailers-branding/">custom printed bubble mailers</a> covers in detail.</p>`,
      },
    ],
    faq: [
      ["Are kraft bubble mailers as protective as white ones?", "Yes. Kraft and white bubble mailers use the same padded bubble lining and offer the same level of protection. The difference is purely in the exterior look and how it fits your brand."],
      ["Which looks more premium, kraft or white?", "It depends on positioning. White reads as clean and modern and suits beauty and fashion, while kraft reads as natural and artisan and suits eco and wellness brands. Both can look premium when printed well and used consistently."],
      ["Do white bubble mailers show dirt more than kraft?", "Yes, a white surface shows scuffs and handling marks more readily than kraft over a long carrier journey. If that is a concern, a printed design or a slightly heavier finish helps, and kraft is naturally more forgiving."],
      ["Which is better for printing a logo, kraft or white?", "White gives brighter, more accurate color reproduction and sharper contrast, so detailed or colorful artwork looks best on it. Kraft suits simpler, earthy, or single-color designs where a natural background is part of the look."],
      ["Is kraft more eco-friendly than white?", "Kraft's natural, unbleached appearance signals sustainability and is often preferred by eco-focused brands. Actual environmental impact depends on the specific materials and recyclability, so check the product specification if a verified eco claim matters to your brand."],
      ["Can I use both kraft and white mailers for different product lines?", "Absolutely. Many brands use kraft for natural or value lines and white for premium or gifting lines. Just keep each line consistent so customers still get a coherent, recognizable experience."],
      ["Is kraft or white cheaper?", "White poly is usually a cent or two cheaper per mailer at the same size because the film is lighter than paper-faced stock. The gap narrows at pallet quantity and reverses on recyclable paper-padded kraft, which costs more than either."],
      ["Are kraft bubble mailers water-resistant?", "The kraft face resists light damp but soaks through if a parcel sits in rain. White poly is water-resistant across the whole surface. For doorstep deliveries in wet regions, poly or an inner poly bag is the safer choice."],
      ["Which finish do beauty and cosmetics brands choose?", "White poly, almost always: it photographs cleanly, takes full-color print, and resists the moisture cosmetics sometimes leak. Kraft is more common for apparel, candles, books and brands selling a natural or handmade story."],
      ["Can I get kraft bubble mailers in white on the inside?", "Standard kraft mailers are kraft outside with clear bubble film inside. A white-lined kraft mailer is a custom construction quoted from 5,000 units; most brands instead print an inside-flap message on the standard mailer."],
    ],
    related: ["how-to-choose-bubble-mailer-size", "custom-printed-bubble-mailers-branding"],
  },
  {
    slug: "custom-printed-bubble-mailers-branding",
    category: "Branding",
    image: "plain",
    date: "2026-06-18",
    updated: "2026-10-06",
    readTime: "7 min read",
    title: "Custom Printed Bubble Mailers: Branding Your Shipping Experience",
    metaTitle: "Custom Printed Bubble Mailers | Branded Shipping",
    metaDescription:
      "How custom printed bubble mailers turn shipping into a branded moment - what you can customize, when it is worth it, and how to get started on a bulk program.",
    intro:
      "For an online brand, the mailer is the first thing a customer physically touches. A custom printed bubble mailer turns a plain shipment into a branded moment that customers notice, remember, and often share. It is one of the most cost-effective pieces of marketing a small brand has, because you are already paying to ship the parcel - printing it simply makes that same parcel work harder. Here is how to use custom printed mailers well.",
    sections: [
      {
        heading: "Why branded mailers matter",
        html: `<p>A logo, a brand color, and a short message on the outside of the mailer make an order feel considered before it is even opened. It reinforces the brand at the doorstep and in the unboxing photos customers post, and it costs little over a plain mailer once you order at volume. In a market where most parcels arrive in anonymous packaging, a branded mailer is an easy way to look more established than you are and to stay memorable after the sale. Our <a href="/custom-bubble-mailers/">custom bubble mailers</a> add that branding while keeping the padded protection your shipments need.</p>
        <p>Branded packaging also builds trust. A parcel that clearly comes from the brand the customer ordered from feels safer and more professional than a generic envelope, which reduces confusion and support questions on delivery. Over time, a consistent printed look turns repeat deliveries into a recognizable experience - customers know it is you before they read the label.</p>`,
      },
      {
        heading: "What you can customize",
        html: `<p>Customization goes well beyond a printed logo. The finish, color, size, and even the inside of the mailer can all carry the brand, and small touches often make the biggest impression relative to their cost.</p>`,
        bullets: [
          "Exterior logo and brand colors in one or more print colors.",
          "Kraft or white base to match your brand's overall look.",
          `Sizes and formats, including <a href="/bubble-mailer-bags/">bubble mailer bags</a> for fast-packing warehouse operations.`,
          "Inside prints, thank-you messages, or a repeating pattern for the unboxing moment.",
        ],
      },
      {
        heading: "Is custom printing worth it for your volume?",
        html: `<p>Custom printing has a setup cost, so it pays off best when spread across a reasonable order quantity rather than a handful of parcels. For a brand shipping steadily, the per-unit premium over plain mailers is small and the branding works on every single order for months. For very low volumes, a printed sticker or branded tape on a plain mailer can bridge the gap until your numbers justify a full printed run.</p>
        <p>Think of printed mailers as an investment in repeat business rather than a one-off cost. The parcel that arrives looking polished is the same parcel a customer photographs, remembers, and reorders from - and that lifetime value is what makes the modest print premium worthwhile for most growing brands.</p>`,
      },
      {
        heading: "Getting started on a bulk program",
        html: `<p>Branded mailers make the most sense as a repeatable program rather than a one-off. Settle your sizes first, choose kraft or white to match your brand, then add print - doing it in that order avoids reprinting artwork when your formats change. Decide how many print colors you need and whether inside printing is worth it for your unboxing, then request a quote with your quantities so you can see the real per-unit cost.</p>
        <p>If you have not locked your formats yet, do that before committing to a printed run, because changing size later means new artwork and new setup. Start with our guide to <a href="/blog/how-to-choose-bubble-mailer-size/">choosing the right bubble mailer size</a> so your branded program is built on dimensions that actually fit your products.</p>`,
      },
    ],
    faq: [
      ["Is there a minimum order for custom printed bubble mailers?", "Yes. The minimum order (MOQ) is 250 mailers. Larger or custom printed runs are quoted per job, so request a quote with your size, quantity, and print details for exact pricing and lead times."],
      ["Can I print on both kraft and white bubble mailers?", "Yes. Both kraft and white bubble mailers can be custom printed. White gives brighter, more accurate color reproduction, while kraft gives a natural look that suits eco and artisan branding."],
      ["How many print colors can I use on a bubble mailer?", "Most programs support one or more spot print colors, with more colors increasing the cost. Many brands get a strong result with a single bold color and a clean logo rather than full-color artwork."],
      ["Is custom printing worth it for a small brand?", "For a brand shipping steadily, the per-unit premium over plain mailers is small and the branding works on every order. For very low volumes, branded stickers or tape on a plain mailer can bridge the gap until printing pays off."],
      ["Can I print on the inside of the mailer too?", "Yes. Inside prints, patterns, and thank-you messages are a popular way to elevate the unboxing moment. They add a memorable touch that customers often photograph and share."],
      ["How long do custom printed bubble mailers take to produce?", "Lead times depend on size, quantity, and print complexity. Because printed mailers are made to order, it is best to plan ahead and confirm the timeline when you request your quote so packaging is ready before you need it."],
      ["What file format should I send for custom printed mailers?", "A vector PDF, AI or EPS with text outlined and spot colors named as Pantone references. A 300 dpi PNG or JPG at print size works for full-color artwork; low-resolution logos pulled from a website will print blurry and we will flag them at proof."],
      ["Do printed bubble mailers cost more to ship?", "No. Ink adds no measurable weight, so a printed mailer ships at the same postage as a plain one of the same size."],
      ["Can I print a return address on bubble mailers?", "Yes, and it is one of the most common requests: a return-address block on the back or top-left front saves a label on every order. Pair it with a logo on the front for a complete branded mailer in one or two colors."],
      ["Do I get a proof before the mailers are printed?", "Yes. A digital proof shows your artwork at scale on the actual mailer size, and nothing prints until you approve it by email. Revisions before approval are free."],
    ],
    related: ["how-to-choose-bubble-mailer-size", "kraft-vs-white-bubble-mailers"],
  },
  {
    slug: "bubble-mailers-vs-boxes",
    category: "Comparison",
    image: "generic",
    imageIndex: 1,
    date: "2026-07-02",
    updated: "2026-10-06",
    readTime: "7 min read",
    title: "Bubble Mailers vs Boxes: Which Should You Ship In?",
    metaTitle: "Bubble Mailers vs Boxes | Which To Ship In",
    metaDescription:
      "When a padded mailer beats a box and when it does not - compare protection, postage, packing speed, and storage to pick the right format for each product.",
    intro:
      "Most shipping programs use both mailers and boxes, but plenty of sellers default to boxes for everything and quietly overpay on every order. A padded mailer is lighter, cheaper, faster to pack, and takes up a fraction of the storage space - yet it is genuinely the wrong choice for some products. Here is how to decide which format belongs on which SKU.",
    sections: [
      {
        heading: "What each format is actually good at",
        html: `<p>A box protects by holding its shape. Rigid walls keep pressure off the contents, which is what breakable and oddly balanced items need. A padded mailer protects differently - it absorbs scuffs, moisture, and light impacts while flexing with the parcel rather than resisting it. For anything that is not fragile, that flexibility is an advantage, because a flexible parcel is less likely to be crushed than an empty-cornered box traveling through the same sorting equipment.</p>
        <p>The practical dividing line is whether your product can survive being pressed on. Books, apparel, phone cases, cosmetics in solid containers, documents, and most accessories can. Glassware, ceramics, loose electronics with exposed ports, and anything with a delicate protruding part cannot, and those belong in a box with internal cushioning. Comparing formats against your real catalog is easier from our full <a href="/products/">bubble mailer range</a> than from a spec sheet.</p>`,
      },
      {
        heading: "Cost, postage, and packing speed",
        html: `<p>Mailers win on almost every operational metric. The material itself costs less per unit, and because a mailer adds far less weight and volume than a box, it usually lands in a cheaper postage band. That matters most under dimensional-weight pricing, where carriers bill for the space a parcel occupies - a lightweight product in a box is charged as though it were heavy, while the same product in a snug mailer is not.</p>
        <p>Packing speed is the cost most sellers forget to measure. A mailer is one motion: insert, peel, seal. A box needs assembling, void fill, and taping, which can be three to four times longer per order. Across a few hundred orders a week that difference is real labor. Boxes also arrive flat but still consume shelf space, whereas mailers stack in a fraction of the footprint - a genuine advantage if you pack from a spare room or a small unit.</p>`,
      },
      {
        heading: "When a box is still the right call",
        html: `<p>Do not force a mailer onto a product that needs structure. Anything breakable, anything with sharp corners that will work through the lining, and anything heavy enough to strain the seams belongs in a box. Multi-item orders that need internal separation are usually better boxed too, since loose items rubbing together inside a mailer is a common and avoidable damage cause.</p>
        <p>Presentation can justify a box as well. For gifting, subscription boxes, and higher-priced items, the rigid unboxing moment is part of what the customer is paying for. That said, a well-printed mailer closes much of that gap at a fraction of the cost - the format matters less than whether it looks deliberate. Our guide to <a href="/blog/custom-printed-bubble-mailers-branding/">custom printed bubble mailers</a> covers how to get that polished look without moving to boxes.</p>`,
      },
      {
        heading: "Running both formats without complicating your operation",
        html: `<p>The efficient setup for most sellers is two or three mailer sizes covering the bulk of orders, plus one or two box sizes for the exceptions. Split the catalog once - mailer-safe versus box-only - and record the decision against each SKU so packers are not judging it order by order. That single piece of documentation removes most packing mistakes and most damage claims.</p>
        <p>Review the split every few months as your range changes, especially if you add heavier or more fragile lines. If mailers cover most of your volume, larger formats such as our <a href="/10-5-x-15-bubble-mailer/">10.5x15 bubble mailer</a> often absorb the orders you assumed needed a box, letting you shrink your box inventory to genuine exceptions only.</p>`,
      },
    ],
    faq: [
      ["Are bubble mailers safe for fragile items?", "Generally no. Bubble mailers protect against scuffs, moisture, and light impacts, but they do not resist crushing the way a rigid box does. Glass, ceramics, and delicate electronics should go in a box with internal cushioning."],
      ["Is it cheaper to ship in a bubble mailer or a box?", "A bubble mailer is almost always cheaper. It costs less per unit, adds less weight, and occupies less space, which often puts the parcel in a lower postage band under dimensional-weight pricing."],
      ["Can I ship books in a bubble mailer?", "Yes. Books are flat, rigid, and not easily crushed, which makes them one of the best-suited products for padded mailers. Choose a size that fits snugly so the book does not shift in transit."],
      ["Do bubble mailers protect as well as boxes?", "They protect differently. Mailers absorb scuffs, moisture, and light impacts while flexing with the parcel; boxes resist pressure with rigid walls. For non-breakable goods a mailer is usually sufficient and often handles better."],
      ["How much faster is packing a mailer than a box?", "Packing a mailer is typically three to four times faster, because it is a single insert-and-seal motion with no assembly, void fill, or taping. Across a few hundred orders a week that adds up to significant labor savings."],
      ["Should I use mailers or boxes for multi-item orders?", "It depends on whether the items need separating. Soft items that can sit together pack fine in a larger mailer, but mixed or hard items that would rub against each other are safer in a box with internal separation."],
      ["How much does a bubble mailer weigh compared to a box?", "A 8.5x12 bubble mailer weighs about 0.7 oz; the smallest comparable corrugated mailer box weighs 3 to 4 oz before tape. Across a thousand orders that is 150 to 200 lb of packaging you are not paying to ship."],
      ["Can I ship clothing in a box instead of a mailer?", "You can, but a folded shirt in a box ships at a higher dimensional weight and takes longer to pack. Boxes make sense for apparel only when the order is large enough to crush in a mailer or the brand wants a rigid unboxing."],
      ["Do bubble mailers stack and store better than boxes?", "Yes. A case of 250 flat mailers takes a shelf; the same number of flat-packed boxes takes a pallet position, and they still need assembling at the bench. Storage is one of the hidden costs that pushes small warehouses toward mailers."],
      ["Which items should never go in a bubble mailer?", "Glass, ceramics, framed art, liquids in glass, anything heavier than about 3 lb, and anything that cannot tolerate being bent in a sorting machine. Those belong in a box with internal cushioning."],
    ],
    related: ["how-to-choose-bubble-mailer-size", "custom-printed-bubble-mailers-branding"],
  },
  {
    slug: "how-to-pack-a-bubble-mailer",
    category: "How-To",
    image: "plain",
    imageIndex: 1,
    date: "2026-07-10",
    updated: "2026-10-06",
    readTime: "7 min read",
    title: "How to Pack and Seal a Bubble Mailer Properly",
    metaTitle: "How to Pack a Bubble Mailer | Packing Guide",
    metaDescription:
      "A step-by-step guide to packing and sealing bubble mailers - loading the product, getting a secure seal, placing the label, and the mistakes that cause damage.",
    intro:
      "Most bubble mailer damage is not a material failure - it is a packing failure. A mailer that is loaded badly, sealed carelessly, or labeled over a fold will fail in transit even when the product inside was well chosen. The good news is that packing one properly takes about fifteen seconds once the habit is set. Here is the routine worth teaching every packer on day one.",
    sections: [
      {
        heading: "Prepare the product before it goes in",
        html: `<p>Anything with a screen, a polished surface, or loose parts should get a thin protective layer before it enters the mailer - tissue, a poly bag, or a simple wrap is enough. The padded lining handles impact, not abrasion, and a product sliding against the interior over a multi-day journey is what produces most of the scuff complaints sellers blame on the mailer itself.</p>
        <p>If you are shipping more than one item, bundle them together so they travel as a single mass rather than as separate objects knocking into each other. Small accessories are worth bagging individually. For high-volume operations where every second counts, <a href="/bubble-mailer-bags/">bubble mailer bags</a> speed this stage up because the product goes straight in without any additional handling.</p>`,
      },
      {
        heading: "Load it without overfilling",
        html: `<p>Slide the product in flat and push it down to the sealed base so it sits against the bottom edge rather than floating near the opening. A product resting at the top puts all its weight on the seal, which is the weakest point of the whole mailer and the first thing to fail when a parcel is dropped.</p>
        <p>Leave enough room above the product to fold and seal cleanly. If the mailer bulges so much that the adhesive strip is under tension when closed, the size is wrong - the seal will peel open somewhere in the network. Equally, if the product slides freely from end to end, it needs a smaller mailer or a little padding. The target is snug, flat, and closable without force.</p>`,
        bullets: [
          "Push the product to the sealed base, not the opening.",
          "Keep at least a finger's width of clearance above it for the fold.",
          "If the adhesive strip is under tension when closed, go one size up.",
          `For small items, size down rather than padding out - a <a href="/4x6-bubble-mailer/">4x6 bubble mailer</a> beats a half-empty medium.`,
        ],
      },
      {
        heading: "Get a seal that actually holds",
        html: `<p>Wipe or brush any dust off the sealing area first, then peel the liner in one continuous motion rather than in sections. Fold the flap over evenly and press firmly along the entire strip, working from one end to the other so no air pockets are trapped. A partially pressed seal looks closed on the packing bench and opens in a sorting machine.</p>
        <p>For heavier contents or long-distance shipments, run a strip of tape across each end of the seal. This does not compensate for a bad seal, but it does protect the corners of the flap, which is where peeling usually starts. Never staple a padded mailer - a staple punctures the lining, creates a snag point, and can damage the product inside.</p>`,
      },
      {
        heading: "Label placement and final checks",
        html: `<p>Place the shipping label flat on the smoothest face of the mailer, avoiding folds, seams, and the sealed edge. A label creased over a fold will not scan reliably, and an unscannable label means a manually sorted parcel, a slower delivery, and sometimes a lost one. Keep the barcode area clear of tape unless your carrier specifically allows tape over it.</p>
        <p>Finish with a two-second check: shake the parcel gently and listen. If the contents shift audibly, the mailer is too big or the product is underprepared. If the parcel is flat, quiet, and the seal holds when you flex it, it is ready. Getting the size right at the start makes this check pass almost every time - our guide to <a href="/blog/how-to-choose-bubble-mailer-size/">choosing the right bubble mailer size</a> covers how to pick formats that pack cleanly.</p>`,
      },
    ],
    faq: [
      ["Do I need to wrap a product before putting it in a bubble mailer?", "For anything with a screen, polished surface, or loose parts, yes. The padded lining handles impact but not abrasion, so a thin layer of tissue or a poly bag prevents the scuffs that cause most complaints."],
      ["Should I tape a bubble mailer shut as well as sealing it?", "The adhesive strip is designed to hold on its own, but a strip of tape across each end of the seal protects the flap corners on heavier or long-distance shipments. Tape is a supplement, not a fix for a poorly pressed seal."],
      ["Can I staple a bubble mailer closed?", "No. A staple punctures the padded lining, creates a snag point in sorting machinery, and can damage the product inside. Use the adhesive strip and reinforce with tape if needed."],
      ["Where should the shipping label go on a bubble mailer?", "Place it flat on the smoothest face, away from folds, seams, and the sealed edge. A label creased over a fold may not scan, which leads to manual sorting and delays."],
      ["How full should a bubble mailer be?", "Full enough that the product does not slide from end to end, but not so full that the adhesive strip is under tension when closed. If the seal strains when you fold it, move up a size."],
      ["Can bubble mailers be resealed or reused?", "The original adhesive strip is single-use, so a reused mailer needs tape or a new seal and will not be as secure. Some sellers reuse mailers for internal transfers, but for customer orders a fresh mailer presents better and seals reliably."],
      ["Which way up should the product go in a bubble mailer?", "Slide it in with the flattest face against the back panel and the label side facing up, so the courier label sits over a flat surface and the barcode scans first time. Odd shapes go in with the heaviest point at the bottom, away from the seal."],
      ["How do I stop a bubble mailer bursting at the seams?", "Leave half an inch of clearance on each side and do not fold the flap over a thick item. If the mailer bulges, go up a size; a strained seam is the most common cause of a mailer splitting in automated sorting."],
      ["Should I put a packing slip inside a bubble mailer?", "Yes, folded against the back of the product so it does not add thickness at the seal. A slip inside, with a return address printed on the mailer, covers you if the outer label is damaged."],
      ["Can I use a bubble mailer for an order with several small items?", "Yes, if you bag or band them together first so they cannot slide and rub. Loose items in a padded mailer scuff each other more than they would in a box."],
    ],
    related: ["how-to-choose-bubble-mailer-size", "bubble-mailers-vs-boxes"],
  },
  {
    slug: "bubble-mailer-shipping-costs",
    category: "Shipping",
    image: "bulk500",
    imageIndex: 0,
    date: "2026-07-17",
    updated: "2026-10-06",
    readTime: "7 min read",
    title: "How Bubble Mailers Cut Your Shipping Costs",
    metaTitle: "Bubble Mailer Shipping Costs | Save On Postage",
    metaDescription:
      "Understand what actually drives your postage bill - weight, dimensions, and thickness bands - and how the right padded mailer lowers the cost of every order.",
    intro:
      "Packaging is usually a small line on the invoice and a large influence on the shipping bill underneath it. Carriers price on weight, dimensions, and sometimes thickness, and a padded mailer affects all three. Sellers who switch a portion of their orders from boxes to correctly sized mailers routinely cut postage per parcel without touching their carrier contract. Here is where that saving actually comes from.",
    sections: [
      {
        heading: "Understand what your carrier is charging for",
        html: `<p>Carriers bill on the greater of actual weight and dimensional weight - a figure calculated from the parcel's length, width, and depth. This is why a light product in an oversized box can cost the same as something several times heavier. A padded mailer collapses around its contents, so the dimensional figure stays close to the real product size instead of being inflated by empty space.</p>
        <p>Depth is the dimension that costs most sellers money, because it is the one a box adds and a mailer barely does. Many postal services also run thickness-based tiers, where a parcel under a certain depth ships at a noticeably lower rate. Products that only just miss that threshold in a box often fall comfortably inside it in a mailer, which is one of the largest single savings available.</p>`,
      },
      {
        heading: "Weight savings compound across a year",
        html: `<p>An empty padded mailer weighs a fraction of an equivalent box, and that difference travels on every parcel you send. On its own it looks trivial. Across a few thousand orders it moves a meaningful share of your volume into a lower weight band, and weight bands are where postage pricing steps rather than slides - crossing one costs real money.</p>
        <p>Void fill is the hidden weight most sellers do not count. A box that needs paper, air pillows, or foam to stop the product moving adds both weight and cost to every order, plus the expense of buying and storing the fill itself. A correctly sized mailer needs none, which removes a whole consumable from the operation. Buying in volume from our <a href="/products/">bubble mailer range</a> lowers the per-unit cost further on top of the postage saving.</p>`,
      },
      {
        heading: "Right-sizing beats bulk-buying the wrong size",
        html: `<p>The most common mistake is standardizing on one large mailer because it fits everything. It does fit everything, and it overcharges you on most orders - you pay for space you are not using and often add fill to stop the product moving inside it. Two or three sizes matched to your actual order profile will beat one universal size on cost every time.</p>
        <p>Work it out from your real data rather than intuition. Pull a month of orders, group them by what they contain, and find the two or three formats that cover the bulk of that volume. Most sellers discover that a mid-size format such as an <a href="/8-5-x-12-bubble-mailer/">8.5x12 bubble mailer</a> handles a far larger share of orders than they expected, and that their largest size is being used for a handful of parcels a week.</p>`,
      },
      {
        heading: "Do not save your way into damage claims",
        html: `<p>The cheapest parcel is the one that arrives intact. A mailer that is genuinely too small for the product, or a mailer used for something that needed a box, converts a small postage saving into a replacement, a return shipment, and a customer who does not order again. Damage is far more expensive than the packaging decision that caused it.</p>
        <p>Track your damage rate alongside your postage cost rather than looking at either in isolation, and treat a rising rate as a signal to revisit sizing before it becomes a pattern. If you are choosing between two formats, order a small quantity of each and pack real products before committing - our guide to <a href="/blog/how-to-choose-bubble-mailer-size/">choosing the right bubble mailer size</a> walks through that test in detail.</p>`,
      },
    ],
    faq: [
      ["Do bubble mailers really reduce shipping costs?", "Yes, in most cases. They weigh less than boxes, add far less depth, and need no void fill, which lowers both actual and dimensional weight. The saving is largest when the mailer is sized close to the product."],
      ["What is dimensional weight?", "Dimensional weight is a figure carriers calculate from a parcel's length, width, and depth. You are billed on whichever is greater, actual or dimensional weight, which is why an oversized parcel costs more even when it is light."],
      ["Does parcel thickness affect postage?", "Often, yes. Many postal services have thickness-based tiers where a parcel under a certain depth ships at a lower rate. A padded mailer frequently keeps a product inside a tier that a box would push it out of."],
      ["Is it cheaper to buy one large mailer size for everything?", "No. A universal large size means paying for unused space on most orders and often adding void fill. Two or three sizes matched to your real order profile costs less overall despite the smaller per-size volume."],
      ["How do I work out which mailer sizes to stock?", "Pull a month of real orders, group them by contents, and identify the two or three formats that cover most of that volume. Order small quantities of each and pack real products before committing to a bulk run."],
      ["Can undersizing a mailer cost me money?", "Yes. A mailer that is too small strains the seams and seal, and a mailer used for a product that needed a box leads to damage. A replacement, return postage, and a lost customer far outweigh the postage saved."],
      ["How much can switching from boxes to bubble mailers save?", "For a store shipping 500 small orders a month, moving from a small box to an 8.5x12 mailer typically saves $0.30 to $0.80 per order in postage and $0.25 or more in packaging, before packing time. That is $3,000 to $6,000 a year on a small operation."],
      ["Is USPS First Class or Ground Advantage cheaper for a bubble mailer?", "Under 16 oz, Ground Advantage is usually the cheapest service for a padded mailer and still gets tracking. A 4x6 or 4x7 packed under 3/4 in thick may qualify as a large envelope at a lower rate; weigh and measure a packed sample to check."],
      ["Do bubble mailers qualify for flat-rate shipping?", "USPS offers a padded flat-rate envelope, but it is the carrier's own mailer and only pays off above about 2 lb. Your own 8.5x12 or 10.5x15 mailer under a pound almost always ships cheaper by weight."],
      ["Does the color or finish of a mailer affect postage?", "No. Postage is set by weight, dimensions and service. Kraft and white poly of the same size weigh within a fraction of an ounce of each other, so finish is a branding decision, not a cost one."],
    ],
    related: ["how-to-choose-bubble-mailer-size", "buying-bubble-mailers-in-bulk"],
  },
  {
    slug: "are-bubble-mailers-recyclable",
    category: "Sustainability",
    image: "generic",
    imageIndex: 2,
    date: "2026-07-24",
    updated: "2026-10-06",
    readTime: "7 min read",
    title: "Are Bubble Mailers Recyclable? A Practical Guide",
    metaTitle: "Are Bubble Mailers Recyclable | Eco Guide",
    metaDescription:
      "What can and cannot be recycled in a padded mailer, why mixed materials complicate it, and how to ship more sustainably without losing protection.",
    intro:
      "Recyclability is one of the most common questions sellers get about padded mailers, and the honest answer is more nuanced than a yes or no. It depends on what the mailer is made of and on what your local facility accepts. Understanding the distinction lets you make a claim you can actually stand behind - and avoid the vague eco language that erodes trust when a customer looks into it.",
    sections: [
      {
        heading: "Why mixed materials complicate recycling",
        html: `<p>A traditional padded mailer combines a paper or poly outer with a plastic bubble lining bonded to it. Each material is recyclable in principle, but bonded together they are difficult to separate, and most curbside paper streams will reject a mailer with plastic film attached. That is the core of the issue - not that the materials are unrecyclable, but that the combination is hard to process.</p>
        <p>This is why blanket claims cause problems. A mailer described simply as recyclable may only be recyclable through a store drop-off scheme for soft plastics, or only after the customer separates the layers, which few will do. Being specific about which part goes where is more useful to customers and more defensible than a green label with nothing behind it.</p>`,
      },
      {
        heading: "What customers can realistically do",
        html: `<p>Give clear, short instructions rather than a general appeal to recycle. If your mailer has a paper outer with a plastic lining, tell customers whether the layers can be separated and where each part goes. If it is a poly mailer, point them to soft-plastic collection points rather than the curbside bin, where it will simply be filtered out.</p>
        <p>Reuse is worth mentioning too, and it is the option customers are most likely to act on. Padded mailers survive a second journey comfortably when the original seal is covered with tape, which makes them useful for returns and for customers who resell. A line on the mailer or the packing slip suggesting reuse costs nothing and lands better than a recycling symbol most people cannot act on.</p>`,
      },
      {
        heading: "Choosing a more sustainable padded mailer",
        html: `<p>If sustainability matters to your brand, the material decision is where it is settled - not the messaging. Paper-based padded mailers with a paper cushioning layer are the simplest for customers to recycle because there is no separation step, though they are typically less water-resistant than poly. Recycled-content mailers reduce virgin material without changing how the customer disposes of them.</p>
        <p>Appearance and material are not the same thing, and this trips up a lot of brands. A natural brown finish signals eco-consciousness but does not by itself mean a mailer is more recyclable. Our <a href="/kraft-bubble-mailers/">kraft bubble mailers</a> deliver that natural look, and if a verified environmental claim matters to you, check the specific construction and lining rather than relying on the color.</p>`,
      },
      {
        heading: "Making claims you can defend",
        html: `<p>Say what is true and be specific. Wording such as widely recyclable is easy to challenge and increasingly regulated in several markets. Naming the material and the disposal route - paper outer to curbside, film lining to soft-plastic collection - is more credible, more useful, and far safer than a broad eco claim you would struggle to evidence.</p>
        <p>Consistency also matters. If your mailer is sustainable but everything inside it is not, customers notice the gap. Aligning the mailer, the packing materials, and the messaging into one coherent choice is what actually reads as genuine, and the base you choose is part of that - our guide to <a href="/blog/kraft-vs-white-bubble-mailers/">kraft vs white bubble mailers</a> covers how each finish fits different brand positions.</p>`,
      },
    ],
    faq: [
      ["Can bubble mailers go in curbside recycling?", "Usually not as a whole. Most curbside paper streams reject mailers with a plastic bubble lining attached. Check whether your mailer is paper-based throughout, and otherwise direct customers to soft-plastic collection points."],
      ["Are kraft bubble mailers more recyclable than white ones?", "Not automatically. Color indicates appearance, not construction. What matters is whether the outer and the lining are the same material and whether the layers can be separated - check the product specification."],
      ["What makes a padded mailer hard to recycle?", "The bonding of two different materials. A paper outer with a plastic bubble lining is difficult to separate mechanically, so facilities that process one stream will typically reject the combined item."],
      ["Are paper-based padded mailers as protective as plastic-lined ones?", "They protect well against impact and scuffs, but they are generally less water-resistant than poly-lined mailers. If your goods are moisture-sensitive or ship in wet conditions, weigh that trade-off carefully."],
      ["Can customers reuse bubble mailers?", "Yes, and it is the option they are most likely to act on. A padded mailer handles a second journey comfortably if the original seal is covered with tape, which makes it useful for returns and resale."],
      ["How should I word an eco claim on my packaging?", "Be specific about the material and the disposal route rather than using broad terms like widely recyclable. Naming where each part goes is more credible with customers and safer as claim regulations tighten."],
      ["Are all-paper padded mailers available in the USA?", "Yes. Paper-padded kraft mailers with a macerated-paper or honeycomb cushion are curbside recyclable in most US programs. They cost more than bubble-lined mailers and are slightly heavier, but they let you make a straightforward recycling claim."],
      ["Can poly bubble mailers be recycled at store drop-off?", "Many #4 LDPE poly mailers can go in store drop-off bins for plastic film, but only if the paper label is removed and the mailer is a single material. Bubble mailers with a paper face and plastic lining are mixed-material and generally are not accepted."],
      ["Is a bubble mailer better for the environment than a box?", "By weight and transport footprint, usually yes: a mailer uses a fraction of the material and ships lighter. Recyclability favors the corrugated box. Which matters more depends on what your customers can actually recycle locally."],
      ["What recycling symbol can I print on my mailers?", "Only one that is true for the specific construction. A store drop-off mark for single-material poly; the recyclable paper mark for all-paper padded mailers; nothing for mixed kraft-and-bubble stock unless you have had it verified. The FTC Green Guides govern these claims in the US."],
    ],
    related: ["kraft-vs-white-bubble-mailers", "bubble-mailers-vs-boxes"],
  },
  {
    slug: "best-bubble-mailers-for-clothing",
    category: "Industry Guide",
    image: "generic",
    imageIndex: 3,
    date: "2026-07-31",
    updated: "2026-10-06",
    readTime: "7 min read",
    title: "The Best Bubble Mailers for Shipping Clothing and Apparel",
    metaTitle: "Bubble Mailers for Clothing | Apparel Shipping",
    metaDescription:
      "Which padded mailer sizes suit apparel, how folding affects the format you need, and how to ship clothing without creasing, bulging seams, or moisture damage.",
    intro:
      "Apparel is one of the best categories for padded mailers - soft, unbreakable, and happy to be compressed. But it is also the category where sizing goes wrong most often, because a folded garment behaves nothing like a rigid product. Fabric expands, seams bulge, and a mailer that looked right with a flat sample splits when a real order goes in. Here is how to get apparel shipping right.",
    sections: [
      {
        heading: "Fold first, then size",
        html: `<p>Never size an apparel mailer from a garment's flat dimensions. Fold the item exactly the way your packers will fold it, then measure the folded block at its widest and thickest points. A folded hoodie can be three or four times the depth of a folded t-shirt in the same size, and depth is what determines whether the mailer seals cleanly or strains at the flap.</p>
        <p>Standardize the fold as well as the mailer. If one packer folds in thirds and another in quarters, the same garment needs different formats on different days, and your sizing decisions stop being reliable. Document the fold per product type alongside the mailer size and the whole packing bench becomes consistent - our full <a href="/products/">bubble mailer range</a> makes it easy to match formats once your folds are settled.</p>`,
      },
      {
        heading: "Sizes that suit most apparel orders",
        html: `<p>Fabric compresses, so apparel usually needs width more than it needs depth - a mailer that is generous across but not overly deep gives the folded block room to settle without letting it slide. Most apparel businesses cover the large majority of orders with two formats, adding a third only for bulk or multi-item orders.</p>`,
        bullets: [
          "Accessories, socks, and underwear: small formats around 6x9 handle these comfortably.",
          "Single t-shirts and lightweight tops: mid-size formats in the 9x12 to 10x13 range.",
          `Hoodies, knitwear, and two-item orders: larger formats such as our <a href="/10-5-x-15-bubble-mailer/">10.5x15 bubble mailer</a>.`,
          "Multi-item and bulk apparel orders: the largest formats, or a box if items need separating.",
        ],
      },
      {
        heading: "Protecting fabric in transit",
        html: `<p>Apparel's risks are different from those of hard goods. Fabric does not break, but it stains, absorbs moisture, and picks up odours, and a damp parcel left on a doorstep can ruin an order that survived the journey perfectly well. A poly liner or an inner bag inside the mailer solves this cheaply and is standard practice for most apparel sellers.</p>
        <p>Watch for snagging with delicate fabrics. Knitwear, lace, and loose weaves can catch on a rough interior or on any staple or tape edge that intrudes into the mailer, so bag those items rather than placing them against the lining. Light-colored garments are also worth bagging, since the interior surface can transfer marks over a long journey.</p>`,
      },
      {
        heading: "Presentation for a category built on returns",
        html: `<p>Apparel has the highest return rate in eCommerce, which makes the mailer part of the returns experience rather than just the delivery. A mailer that opens cleanly and could plausibly be resealed makes a return easier for the customer and cheaper for you - a customer who has to find their own packaging is a customer more likely to contact support.</p>
        <p>Presentation earns its keep here too, because apparel customers photograph their orders more than most. A branded mailer turns an unboxing into visible marketing at almost no incremental cost, and for high-volume operations <a href="/bubble-mailer-bags/">bubble mailer bags</a> keep packing fast while still carrying your branding on every parcel.</p>`,
      },
    ],
    faq: [
      ["What size bubble mailer is best for a t-shirt?", "A mid-size format in the 9x12 to 10x13 range suits most single folded t-shirts. Measure your own folded garment rather than relying on the size chart, since fold style changes the block significantly."],
      ["What size bubble mailer do I need for a hoodie?", "Hoodies and knitwear generally need a larger format such as 10.5x15, because a folded hoodie can be three to four times the depth of a folded t-shirt. Measure the folded block before committing to a size."],
      ["Should I bag clothing before putting it in a bubble mailer?", "Yes, for most apparel. A poly liner or inner bag protects against moisture, prevents marks transferring from the lining, and stops delicate fabrics like knitwear and lace from snagging."],
      ["Do bubble mailers crease clothing?", "Some creasing from folding is unavoidable in any mailer, but it is not made worse by the padded lining. Consistent folding and a snug fit that stops the garment shifting keep creasing to a minimum."],
      ["Can I fit two garments in one bubble mailer?", "Often yes, if both are soft and can be bundled together. Size from the combined folded block, and use a box instead if the items are mixed or hard enough to rub against each other."],
      ["Are bubble mailers good for apparel returns?", "They work well for returns because they open cleanly and can be resealed with tape. Making the return easy reduces support contacts and improves the customer experience in a category with high return rates."],
      ["Can I ship jeans in a bubble mailer?", "A folded pair of jeans fits a 12x15 or #6 mailer comfortably. Two pairs push the weight and thickness toward a #7 or a box; denim is heavy, so check that the packed mailer stays under your carrier's weight tier."],
      ["Do poly or kraft bubble mailers suit clothing better?", "Poly, in most cases: it is water-resistant and the clothing is usually bagged anyway. Kraft suits brands with a natural or sustainable story and ships just as well when the garment is in an inner poly bag."],
      ["What size bubble mailer for a dress or a skirt?", "Most dresses fold to fit a 10.5x15 (#5); lightweight skirts and tops fit an 8.5x12 (#2). Structured or heavy garments go up one size so the folds are not crushed at the seal."],
      ["Should apparel brands print their mailers?", "If you ship more than a few hundred orders a month, a one-color logo on the mailer costs a few cents per order and is the only branded touchpoint many customers see before opening. It also cuts fraudulent 'never arrived' claims, because the parcel is recognizable on the doorstep."],
    ],
    related: ["how-to-choose-bubble-mailer-size", "how-to-pack-a-bubble-mailer"],
  },
  {
    slug: "shipping-electronics-in-bubble-mailers",
    category: "Industry Guide",
    image: "generic",
    imageIndex: 4,
    date: "2026-08-05",
    updated: "2026-10-06",
    readTime: "7 min read",
    title: "Shipping Electronics and Accessories in Bubble Mailers",
    metaTitle: "Bubble Mailers for Electronics | Shipping Guide",
    metaDescription:
      "Which electronics suit padded mailers and which need a box, plus how to handle static, moisture, and the sizing that keeps accessories safe in transit.",
    intro:
      "Electronics accessories are ideal padded-mailer cargo - small, flat, valuable relative to their size, and expensive to replace when they arrive damaged. But the category also contains items that should never go in a mailer, and the line between the two is not always obvious. Getting it right protects both your margin and your seller ratings.",
    sections: [
      {
        heading: "What belongs in a mailer and what does not",
        html: `<p>The test is whether the item can take pressure across its surface without harm. Phone cases, cables, chargers, adapters, memory cards, screen protectors in rigid sleeves, and most small accessories pass comfortably. Anything with an exposed screen, a delicate connector sticking out, or internal moving parts does not - those need a box with cushioning, regardless of how small they are.</p>
        <p>Value should influence the decision even when the item would technically survive. A high-value device in a padded mailer is a bigger loss when the exception happens, and a mailer also signals low value to anyone handling it, which is not always what you want. For small, sturdy accessories a snug format such as a <a href="/4x7-bubble-mailer/">4x7 bubble mailer</a> keeps the parcel tight and the postage low.</p>`,
      },
      {
        heading: "Static, moisture, and what padding does not cover",
        html: `<p>Bubble lining protects against impact and scuffs. It does not protect against static, and bare circuit boards, memory modules, and exposed components need an antistatic bag before they go anywhere near a padded mailer. This is a step sellers new to the category miss regularly, and the resulting failures look like faulty stock rather than a packing error.</p>
        <p>Moisture is the other gap. A padded mailer resists light damp but is not waterproof, and electronics are unforgiving about water. If parcels are left on doorsteps or shipped through wet conditions, add an inner poly bag - it costs very little and removes a failure mode that produces expensive, hard-to-diagnose returns. Seal the inner bag rather than just folding it closed.</p>`,
      },
      {
        heading: "Sizing for cables, chargers, and mixed accessories",
        html: `<p>Coiled cables and chargers are deceptive. Coiled tightly and secured with a tie, a cable is a compact block; loose, it sprawls and needs a much larger mailer while still shifting inside it. Secure the coil first, then size the mailer - this single habit removes most of the sizing inconsistency in accessory shipping.</p>
        <p>For mixed accessory orders, bag each item separately so hard edges do not press against one another. Connectors and metal casings can mark a plastic housing over a long journey, and a customer who receives a scratched item treats it as damaged even when it works perfectly. Mid-size formats such as a <a href="/7x9-bubble-mailer/">7x9 bubble mailer</a> handle most multi-accessory orders without leaving excess room.</p>`,
      },
      {
        heading: "Reducing disputes on higher-value parcels",
        html: `<p>Electronics attract more not-as-described and not-received disputes than most categories, so packing that looks deliberate is worth something on its own. A snug, well-sealed, cleanly labeled parcel signals a professional operation and gives you a stronger position if a claim is raised.</p>
        <p>Keep the mailer discreet as well. Printing the product type on the outside of a parcel containing electronics advertises its contents, which is worth avoiding on higher-value shipments - brand it without describing what is inside. If you are shipping a mix of accessories and larger items, our guide to <a href="/blog/bubble-mailers-vs-boxes/">bubble mailers vs boxes</a> covers where to draw the line between the two formats.</p>`,
      },
    ],
    faq: [
      ["Can I ship a phone in a bubble mailer?", "A phone in a rigid retail box may be acceptable, but a bare device with an exposed screen should go in a box with cushioning. Padded mailers resist scuffs and light impacts, not the crushing that cracks a screen."],
      ["Do bubble mailers protect against static?", "No. Bubble lining protects against impact and abrasion but offers no antistatic protection. Bare circuit boards, memory modules, and exposed components need an antistatic bag before going into a mailer."],
      ["Are bubble mailers waterproof?", "They resist light damp but are not waterproof. For electronics, add a sealed inner poly bag if parcels may be left outdoors or shipped through wet conditions."],
      ["What size mailer do I need for cables and chargers?", "Coil the cable and secure it with a tie first, then size to the resulting block. A secured coil is compact and predictable, while a loose cable needs a much larger mailer and still shifts in transit."],
      ["Should I write the contents on the outside of the mailer?", "Avoid naming electronics on the outside of a parcel, as it advertises the contents. Brand the mailer with your logo instead, and keep product details on the packing slip inside."],
      ["How do I pack a multi-accessory electronics order?", "Bag each item separately so hard edges and connectors do not press against other items, then place them flat in a mid-size mailer. This prevents the surface marks customers report as damage."],
      ["Can I ship a laptop in a bubble mailer?", "No. Laptops and tablets over 10 in need a rigid box with corner cushioning. A bubble mailer suits phones in retail boxes, cases, chargers, earbuds and small accessories under about 2 lb."],
      ["Do I need anti-static bubble mailers for electronics?", "For bare circuit boards, memory and components, yes: pink or metallic anti-static bubble mailers. Finished consumer devices in their retail packaging are already protected and ship fine in a standard mailer."],
      ["Will a bubble mailer protect a phone screen?", "Only if the phone is in its retail box or a hard case. Bubble lining absorbs scuffs and light shocks; it does not stop a direct point load on glass. Add a rigid insert or sleeve for unboxed screens."],
      ["What size bubble mailer fits a phone in its box?", "Most phone retail boxes fit a 6x9 (#0) with room to seal; larger boxes with accessories need a 7x9 or 8.5x12. Measure the box depth, since retail boxes are often 2 in thick."],
    ],
    related: ["bubble-mailers-vs-boxes", "how-to-pack-a-bubble-mailer"],
  },
  {
    slug: "buying-bubble-mailers-in-bulk",
    category: "Buying Guide",
    image: "generic",
    imageIndex: 5,
    date: "2026-08-08",
    updated: "2026-10-06",
    readTime: "7 min read",
    title: "Buying Bubble Mailers in Bulk: What to Know Before You Order",
    metaTitle: "Buying Bubble Mailers in Bulk | Order Guide",
    metaDescription:
      "How to work out the right bulk quantity, what affects per-unit pricing, how to store mailers properly, and the ordering mistakes that tie up cash in packaging.",
    intro:
      "Bulk pricing on padded mailers is genuinely worth having - per-unit costs drop sharply with volume, and packaging is one of the few costs you can lower without renegotiating anything. But a bulk order is also cash converted into stock sitting on a shelf, and ordering the wrong size in quantity is an expensive mistake to unwind. Here is how to buy volume sensibly.",
    sections: [
      {
        heading: "Work out your real usage first",
        html: `<p>Base the quantity on measured usage, not on a target you hope to hit. Take your last three months of orders, split them by the mailer size each one used, and project forward with a modest allowance for growth. A common approach is to hold three to six months of stock per size - enough to earn a meaningful price break without committing a large amount of cash to a format you might change.</p>
        <p>Seasonality is the adjustment most sellers miss. If a large share of your volume lands in a few weeks of the year, order against that peak rather than against your monthly average, and place it early enough that production and delivery are not competing with everyone else's peak orders. Running out of your core size in your busiest week costs far more than holding a few extra cases.</p>`,
      },
      {
        heading: "What actually moves the per-unit price",
        html: `<p>Quantity is the largest factor, but it is not the only one. Size, material, and whether the mailer is printed all affect the unit cost, and printed mailers carry a setup element that only makes sense spread across a reasonable run. Consolidating sizes matters more than most buyers expect - two sizes at higher volumes usually price better than four sizes at lower ones, even for the same total number of mailers.</p>
        <p>Consider timing and consolidation as levers too. Combining sizes into a single order, or committing to a scheduled repeat order, often prices better than placing scattered small orders through the year. If you are adding branding, our <a href="/custom-bubble-mailers/">custom bubble mailers</a> are worth quoting alongside plain stock so you can see the real premium at your quantity rather than guessing at it.</p>`,
      },
      {
        heading: "Storage is part of the decision",
        html: `<p>Padded mailers are light but bulky, and a bulk order takes real space. Work out where the cases will physically go before ordering, and keep them off the floor, away from damp, and out of direct sunlight - moisture affects the adhesive strip, and prolonged sun can weaken and discolour the outer, particularly on lighter finishes.</p>
        <p>Rotate stock so older mailers are used first. Adhesive performance degrades slowly over time, and a mailer that has sat at the back of a shelf for two years will not seal as reliably as fresh stock. First in, first out is a trivial habit that prevents seal failures nobody would otherwise think to diagnose.</p>`,
      },
      {
        heading: "Sample before you commit",
        html: `<p>Always test a small quantity before a large order, especially with a new supplier or a size you have not used. Pack your real products, seal them properly, and if you can, send a few through your actual carrier to see how they arrive. Specifications tell you the dimensions; only a real parcel tells you how the mailer performs in your operation.</p>
        <p>Check the finish against your branding at the same time, since a base that looks right on screen can read differently in hand. Whichever way you go, keeping it consistent across your range is what builds recognition - our guide to <a href="/blog/kraft-vs-white-bubble-mailers/">kraft vs white bubble mailers</a> covers how each finish fits different brand positions before you commit to volume.</p>`,
      },
    ],
    faq: [
      ["How many bubble mailers should I order at once?", "Most sellers hold three to six months of stock per size, based on measured usage from the last three months plus a modest growth allowance. That earns a meaningful price break without tying up excessive cash."],
      ["Do bubble mailers expire or degrade in storage?", "The mailer itself lasts, but the adhesive strip degrades slowly over time and with exposure to damp or heat. Rotate stock first in, first out so older mailers are used before their seal performance drops."],
      ["What affects the per-unit price of bulk bubble mailers?", "Quantity is the biggest factor, followed by size, material, and whether the mailer is printed. Consolidating into fewer sizes at higher volumes usually prices better than spreading the same total across many sizes."],
      ["How should I store bulk bubble mailers?", "Keep them off the floor, away from damp, and out of direct sunlight. Moisture affects the adhesive strip and prolonged sun can weaken and discolour the outer, particularly on lighter finishes."],
      ["Should I order samples before a bulk run?", "Yes, always - especially with a new supplier or an untested size. Pack your real products and, if possible, ship a few through your actual carrier to see how they perform before committing to volume."],
      ["Is it worth buying printed mailers in bulk?", "Printed mailers carry a setup cost that is best spread across a reasonable quantity. For a brand shipping steadily the per-unit premium is small, and the branding works on every order for months."],
      ["How many bubble mailers come in a case?", "It depends on size: roughly 500 for 4x6 and 4x7, 250 for 6x9 and 7x9, 100 to 200 for 8.5x12 through 12x15, and 50 to 100 for #6 and #7. Pallets hold 10,000 to 25,000 small mailers or 3,000 to 6,000 large ones."],
      ["Is wholesale pricing different from bulk pricing?", "In practice they overlap. Bulk pricing applies to case and pallet quantities for your own use; wholesale terms are for resellers and distributors buying to sell on, usually at pallet volume with scheduled releases. Both are quoted the same way, by size and quantity."],
      ["Can I split a pallet across two sizes?", "Yes. Mixed pallets are common, and the price break on most programs is based on the combined quantity, so a 5,000 and 5,000 split prices like a 10,000 run."],
      ["How far in advance should I order before peak season?", "Plain stock: two to three weeks before your volume rises. Printed stock: six to eight weeks, to leave room for proofing and production. Carriers and suppliers both get busy from October, so a September order avoids the squeeze."],
    ],
    related: ["bubble-mailer-shipping-costs", "custom-printed-bubble-mailers-branding"],
  },
  {
    slug: "bubble-mailer-vs-poly-mailer",
    category: "Comparison",
    image: "generic",
    imageIndex: 6,
    date: "2026-06-25",
    updated: "2026-10-06",
    readTime: "7 min read",
    title: "Bubble Mailer vs Poly Mailer: When Do You Need Padding?",
    metaTitle: "Bubble Mailer vs Poly Mailer | Which To Use",
    metaDescription:
      "Padded or unpadded? Compare bubble mailers and flat poly mailers on protection, cost, and weight so you only pay for cushioning where it earns its place.",
    intro:
      "A poly mailer is a flat plastic envelope with no cushioning. A bubble mailer is the same idea with a padded lining bonded inside. Poly costs less and weighs less; bubble protects more. Choosing between them for each product line is one of the quickest packaging wins available, because most sellers are using one format for everything and paying for it either in postage or in damage.",
    sections: [
      {
        heading: "What the padding is actually doing",
        html: `<p>The bubble lining does three jobs: it absorbs light impacts, it keeps the product away from the outer surface so knocks and pressure are spread rather than concentrated, and it adds a small amount of rigidity that stops thin items bending. A flat poly mailer does none of that. It is a barrier against dirt and moisture and nothing more.</p>
        <p>That makes the decision simpler than it first appears. If the only risk to your product is getting wet or dirty, padding is money spent on a problem you do not have. If there is any chance of a knock, a scuff, or a bend causing a complaint, the padding is the cheapest insurance in the parcel.</p>`,
      },
      {
        heading: "Products that are fine in a flat poly mailer",
        html: `<p>Soft, unbreakable, unbendable goods travel perfectly well without cushioning. Folded apparel, towels, bedding, fabric offcuts, and most textile products can be compressed, dropped, and stacked without harm, which is why so much of the clothing industry ships flat. Anything where the worst realistic outcome is a crease rather than damage is a poly candidate.</p>
        <p>The savings are real on those lines. Poly mailers cost less per unit, weigh less, and take up less depth, so they often sit in a cheaper postage band than the padded equivalent. Across a high-volume apparel operation that difference is significant, and it is the single most common place sellers overspend on padding they do not need.</p>`,
      },
      {
        heading: "Products that need the padded lining",
        html: `<p>Anything rigid, anything with a surface that scratches, and anything that bends is a bubble mailer product. Books and printed materials bend at the corners in a flat mailer. Cosmetics, phone cases, and hard accessories scuff against each other and against the outer film. Photographs, prints, and documents crease in ways that make them unsellable even though nothing broke.</p>
        <p>Value should tip a borderline call toward padding. If a damaged item means a replacement, return postage, and a refunded customer, the small premium for a padded mailer is recovered by preventing a single claim. Sellers shipping mixed catalogs usually find their protective formats concentrated in the mid-range sizes, where <a href="/bubble-mailer-packaging/">padded mailer packaging for mixed retail goods</a> covers the widest span of products.</p>`,
      },
      {
        heading: "Running both formats side by side",
        html: `<p>Most established operations use both, and that is the efficient answer rather than a compromise. Split the catalog once: soft and unbreakable goes poly, rigid or scratchable goes padded. Record the choice against each SKU so packers are not making a judgment call under time pressure, because that is where the expensive mistakes happen.</p>
        <p>Review the split when your range changes, particularly if you add rigid lines to a previously soft catalog. If you are also weighing whether some products should move up to a rigid format entirely, the trade-offs are set out in our comparison of <a href="/blog/bubble-mailers-vs-boxes/">when a padded mailer beats a box</a>.</p>`,
      },
    ],
    faq: [
      ["What is the difference between a poly mailer and a bubble mailer?", "A poly mailer is a flat plastic envelope with no cushioning, offering protection against dirt and moisture only. A bubble mailer adds a padded lining that absorbs light impacts and stops thin items bending."],
      ["Are poly mailers strong enough for shipping?", "For soft, unbreakable goods like folded apparel and textiles, yes. They resist tearing and keep contents dry, but they provide no cushioning, so anything rigid or scratchable needs a padded mailer instead."],
      ["Which is cheaper, a poly mailer or a bubble mailer?", "Poly mailers cost less per unit, weigh less, and add less depth, which often places the parcel in a lower postage band. The saving only makes sense if your product genuinely does not need cushioning."],
      ["Can I ship books in a poly mailer?", "It is not recommended. Books bend and scuff at the corners in a flat mailer with no cushioning. A padded mailer sized close to the book keeps the corners protected and the covers flat."],
      ["Should I use poly mailers for clothing?", "Usually yes. Folded apparel can be compressed and dropped without damage, so cushioning adds cost without adding protection. Add a padded mailer only if the order includes hard accessories or fragile items."],
      ["Is it worth stocking both poly and bubble mailers?", "For most sellers with a mixed catalog, yes. Splitting soft goods to poly and rigid goods to padded lowers cost on the lines that need no cushioning while protecting the ones that do."],
      ["Can I put a bubble mailer inside a poly mailer?", "Yes, and it is a common way to get padding plus water resistance for electronics or cosmetics in wet climates. It costs a few cents more than a single mailer and keeps the parcel lighter than a box."],
      ["Are poly mailers waterproof?", "Water-resistant rather than waterproof: the film sheds rain but the seal is not watertight. A poly mailer protects clothing on a wet doorstep far better than a kraft bubble mailer does."],
      ["Which is lighter, a poly mailer or a bubble mailer?", "A poly mailer, by roughly half at the same size. A 10x13 poly mailer weighs about 0.4 oz; a 10.5x15 bubble mailer about 1 oz. The difference rarely moves the postage tier on its own."],
      ["Do poly mailers print as well as bubble mailers?", "Both print well. Poly mailers are often full-bleed printed because the whole surface is smooth film; bubble mailers print cleanly on the flat panels, and kraft stock gives a warmer look that suits one- and two-color logos."],
    ],
    related: ["bubble-mailers-vs-boxes", "best-bubble-mailers-for-clothing"],
  },
  {
    slug: "reduce-shipping-damage-rates",
    category: "Operations",
    image: "generic",
    imageIndex: 7,
    date: "2026-08-09",
    updated: "2026-10-06",
    readTime: "7 min read",
    title: "How to Reduce Shipping Damage Rates With Better Packing",
    metaTitle: "Reduce Shipping Damage | Padded Mailer Tips",
    metaDescription:
      "Find out why parcels arrive damaged, how to measure your real damage rate, and the packing and sizing changes that cut claims without inflating packaging costs.",
    intro:
      "Damage is the most expensive packaging problem because you pay for it three times - the lost product, the return or replacement postage, and the customer who does not come back. Most sellers treat it as an unavoidable cost of shipping. It rarely is. A handful of measurable changes usually removes the majority of avoidable damage, and almost none of them involve spending more on materials.",
    sections: [
      {
        heading: "Measure before you change anything",
        html: `<p>You cannot fix a damage rate you are not tracking. Record every damage report against the product, the mailer size used, and the carrier, and within a few weeks the pattern usually announces itself. Damage is almost never evenly spread - it concentrates in one product line, one size, or one route, and that concentration is what tells you where the actual fault is.</p>
        <p>Include near misses in what you log. A customer who mentions the parcel arrived scuffed but the product was fine is reporting the same underlying problem as one requesting a refund, just earlier. Those reports are the cheapest diagnostic signal you will get, and most operations throw them away.</p>`,
      },
      {
        heading: "The three causes behind most avoidable damage",
        html: `<p>Oversizing is the biggest. A product with room to move inside its mailer builds momentum every time the parcel is handled, and it arrives having knocked against the inside of its own packaging for days. It looks like a material failure and it is a sizing failure.</p>`,
        bullets: [
          "Oversizing - the product shifts inside the mailer and damages itself in transit.",
          "Weak seals - a partially pressed adhesive strip opens in sorting machinery.",
          "Wrong format - a rigid or fragile item sent in a mailer when it needed a box.",
          "Unprepared contents - hard items packed together with nothing separating them.",
        ],
      },
      {
        heading: "Fix the sizing before you add material",
        html: `<p>The instinct when damage rises is to add padding or upgrade to a heavier material. That is usually the expensive way round. Sizing down so the product sits snugly removes the movement causing the damage, and it lowers your postage at the same time - the opposite of what adding fill does to your cost per parcel.</p>
        <p>Work from real orders rather than the size chart. Pack your actual products in two candidate sizes and shake each one gently; if the contents shift audibly, that parcel will arrive marked. Our walkthrough on <a href="/blog/how-to-choose-bubble-mailer-size/">matching bubble mailer sizes to your products</a> covers how to run that test properly before committing to a bulk order.</p>`,
      },
      {
        heading: "Make good packing repeatable",
        html: `<p>Most packing errors are consistency errors, not knowledge errors. If one packer presses the full length of the seal and another taps the middle, you have two different damage rates coming off the same bench. Write the routine down, keep it to a handful of steps, and make it part of training rather than something learned by watching.</p>
        <p>Give packers the right size within reach as well, because a packer who has to walk for the correct mailer will use the wrong one that is closer. Keeping your core formats stocked at the bench is a layout problem with a packing consequence, and holding sensible quantities of each size is part of that - our guide to <a href="/blog/buying-bubble-mailers-in-bulk/">ordering padded mailers in bulk sensibly</a> covers how much of each format to keep on hand.</p>`,
      },
    ],
    faq: [
      ["What causes most shipping damage in padded mailers?", "Oversizing is the most common cause. A product with room to move knocks against the inside of its own packaging throughout the journey, which looks like a material failure but is a sizing failure."],
      ["How do I measure my shipping damage rate?", "Log every damage report against the product, the mailer size used, and the carrier. Include near misses where the parcel was scuffed but the product survived, as they signal the same underlying problem earlier."],
      ["Will adding more padding reduce damage?", "Not usually, and it raises your cost per parcel. If the product is moving inside an oversized mailer, sizing down removes the cause and lowers postage at the same time."],
      ["What is a normal shipping damage rate?", "It varies widely by product category and carrier, which is why your own baseline matters more than a benchmark. Track your rate over time and treat any sustained rise as a signal to review sizing and packing."],
      ["How can I stop mailers opening in transit?", "Press the full length of the adhesive strip rather than tapping the middle, and reinforce each end of the seal with tape on heavier parcels. Inconsistent sealing between packers is a common hidden cause."],
      ["Should I switch to boxes if my damage rate is high?", "Only for products that genuinely need rigid protection, such as breakable or oddly shaped items. For everything else, correcting the mailer size and the sealing routine usually resolves the problem at lower cost."],
      ["Does a padded mailer protect against crushing?", "Against light compression, yes; the bubble layer rebounds. It does not protect against the heavy stacking a parcel may meet on a truck, so crushable items such as cosmetics compacts or boxed goods need a rigid insert or a box."],
      ["How do I protect items from moisture in a bubble mailer?", "Bag the product in a sealed poly bag first, or use a white poly bubble mailer rather than kraft. Moisture is the most common cause of damage that is blamed on the mailer when the real fault is an unsealed inner bag."],
      ["Should I use a bigger bubble size for more protection?", "For most products a standard 3/16 in bubble is enough; larger bubble adds thickness and postage without much extra protection on flat items. If a product needs more, a rigid insert or a box helps more than thicker bubble."],
      ["How do I handle a customer who reports a damaged mailer?", "Ask for a photo of the mailer and the item, log the carrier and the mailer size, and replace the order. After ten or so reports the pattern usually points to one product, one size or one carrier lane, which is the fix you actually need."],
    ],
    related: ["how-to-pack-a-bubble-mailer", "how-to-choose-bubble-mailer-size"],
  },
];

const blogPostBySlug = new Map(blogPosts.map((post) => [post.slug, post]));

const blogPostingSchema = (post) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.title,
  description: post.metaDescription,
  image: imageAbsoluteUrl(pickAsset(post.image, post.imageIndex ?? 0).url),
  datePublished: post.date,
  dateModified: post.updated || post.date,
  author: { "@type": "Organization", name: site.brand },
  publisher: { "@type": "Organization", name: site.brand, url: site.domain },
  mainEntityOfPage: absoluteUrl(`/blog/${post.slug}/`),
});

const renderBlogSectionBody = (section) => `
  ${section.html}
  ${section.bullets ? `<ul>${section.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>` : ""}
`;

const renderRelatedBlog = (post) => {
  const items = post.related.map((slug) => blogPostBySlug.get(slug)).filter(Boolean);
  if (!items.length) return "";
  return `
    <section class="section">
      <div class="container">
        <h2>Keep reading</h2>
        <div class="product-grid">
          ${items
            .map(
              (item) => `<article class="product-card">
            <img src="${pickAsset(item.image, item.imageIndex ?? 0).url}" alt="${item.title}" loading="lazy" decoding="async" width="1080" height="1080">
            <div>
              <span class="eyebrow">${item.category}</span>
              <h3><a href="/blog/${item.slug}/">${item.title}</a></h3>
              <p>${item.metaDescription}</p>
            </div>
            <div class="button-row">
              <a class="button button-primary button-small" href="/blog/${item.slug}/">Read Guide</a>
            </div>
          </article>`
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
};

const renderBlogPost = (post) => {
  const breadcrumbs = [
    { href: "/", label: "Home" },
    { href: "/blog/", label: "Blog" },
    { href: `/blog/${post.slug}/`, label: post.title },
  ];
  const body = `
    ${renderStandardPageHero({
      eyebrow: post.category,
      title: post.title,
      description: post.intro,
      image: pickAsset(post.image, post.imageIndex ?? 0),
      ctas: [
        { href: "/custom-bubble-mailers/", label: "Get Free Quote", primary: true },
        { href: "/products/", label: "View Products" },
      ],
    })}
    <section class="section">
      <div class="container">
        <div class="content-card content-flow blog-article">
          ${post.sections
            .map(
              (section) => `
          <h2>${section.heading}</h2>
          ${renderBlogSectionBody(section)}`
            )
            .join("")}
          <h2>Frequently asked questions</h2>
          ${renderFaqList(post.faq)}
        </div>
      </div>
    </section>
    ${renderRelatedBlog(post)}
  `;
  return buildPage({
    routePath: `/blog/${post.slug}/`,
    title: post.title,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    heroImage: pickAsset(post.image, post.imageIndex ?? 0).url,
    body,
    breadcrumbs,
    schemas: [faqSchema(post.faq), blogPostingSchema(post)],
  });
};

const blogIndexFaqs = [
  ["What is a bubble mailer?", "A padded shipping envelope: a paper or poly outer with a layer of air-bubble film bonded inside, closed with a self-seal strip. It protects small, non-fragile products from scuffs and light impact at a fraction of the weight of a box."],
  ["What is the difference between a bubble mailer and a padded envelope?", "Usually nothing; the terms are used interchangeably. Strictly, 'padded envelope' can also mean a paper-fiber-padded mailer, which is heavier and curbside recyclable, while 'bubble mailer' always means an air-bubble lining."],
  ["What sizes do bubble mailers come in?", "Inch sizes from 4x6 to 12x15 and numbered sizes #000 (4x8) to #7 (14.25x20). The number refers to a standard outer size; our size guide lists the usable inside dimensions for each."],
  ["How much weight can a bubble mailer hold?", "Small sizes carry up to about 8 oz comfortably, mid sizes 1 to 1.5 lb, and the largest around 3 lb. Beyond that the seams and the seal are under strain and a box is safer."],
  ["Are bubble mailers waterproof?", "Poly bubble mailers are water-resistant; kraft ones resist light damp only. Neither is sealed watertight, so moisture-sensitive products should go in an inner poly bag."],
  ["Can bubble mailers be recycled?", "Mixed kraft-and-bubble mailers generally cannot go in curbside recycling. Single-material poly mailers can often go to store drop-off; all-paper padded mailers are curbside recyclable. Our recycling guide covers how to word claims honestly."],
  ["Which is cheaper to ship, a bubble mailer or a box?", "A bubble mailer, almost always, because it weighs a few ounces less and avoids dimensional-weight pricing on small items. Our shipping-cost guide works through the numbers."],
  ["Can I print my logo on bubble mailers?", "Yes, in one, two or full color on kraft or white stock, with a digital proof before production. The minimum order (MOQ) is 250 mailers."],
  ["How many bubble mailers should a small business keep in stock?", "A month's worth of your two core sizes, reordered when you drop to two weeks' supply. A case of 250 to 500 covers most small stores; busier ones buy by the pallet with scheduled releases."],
  ["Where can I buy bubble mailers in bulk?", "Right here: every size on this site is sold by the case or pallet, plain or printed, with bulk pricing quoted by email within 1-2 hours."]
];

const renderBlogIndex = () => {
  const breadcrumbs = [
    { href: "/", label: "Home" },
    { href: "/blog/", label: "Blog" },
  ];
  const cards = [...blogPosts]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(
      (post) => `<article class="product-card">
        <img src="${pickAsset(post.image, post.imageIndex ?? 0).url}" alt="${post.title}" loading="lazy" decoding="async" width="1080" height="1080">
        <div>
          <span class="eyebrow">${post.category}</span>
          <h3><a href="/blog/${post.slug}/">${post.title}</a></h3>
          <p>${post.metaDescription}</p>
        </div>
        <div class="button-row">
          <a class="button button-primary button-small" href="/blog/${post.slug}/">Read Guide</a>
        </div>
      </article>`
    )
    .join("");
  const body = `
    ${renderStandardPageHero({
      eyebrow: "Bubble Mailer Blog",
      title: "Guides for packing and shipping smarter",
      description: "Practical guides on sizing, materials, packing, postage costs, and branding - so every parcel you send is protected and priced properly.",
      image: pickAsset("generic", 1),
      ctas: [
        { href: "/products/", label: "View Products", primary: true },
        { href: "/custom-bubble-mailers/", label: "Custom Mailers" },
      ],
    })}
    <section class="section">
      <div class="container">
        <div class="product-grid">${cards}</div>
      </div>
    </section>
    <section class="section section-muted">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">Bubble Mailer Basics</span>
          <h2>Quick answers before you read on</h2>
        </div>
        ${renderFaqList(blogIndexFaqs)}
      </div>
    </section>
  `;
  return buildPage({
    routePath: "/blog/",
    title: "Bubble Mailer Blog",
    metaTitle: "Bubble Mailer Guides: Sizes, Packing & Shipping Costs | Shop Bubble Mailers",
    metaDescription: "Practical bubble mailer guides — choosing sizes, kraft vs white, poly vs padded, packing, shipping costs, recycling, and custom printed mailers.",
    heroImage: pickAsset("generic", 1).url,
    body,
    breadcrumbs,
    schemas: [faqSchema(blogIndexFaqs)],
  });
};

writeRoute("/blog/", renderBlogIndex());
blogPosts.forEach((post) => writeRoute(`/blog/${post.slug}/`, renderBlogPost(post)));

// ── USA STATE + CITY LOCATION PAGES ──
const resolveFeatured = (slugs) => slugs.map((s) => productsBySlug.get(s)).filter(Boolean);

// ── Varied internal linking: unique target + anchor + sentence per page ──
const MAILER_LINKS = [
  { slug: "kraft-bubble-mailers", a: ["kraft bubble mailers", "natural kraft mailers", "recyclable kraft mailers"] },
  { slug: "white-bubble-mailers", a: ["white bubble mailers", "clean white mailers", "white padded mailers"] },
  { slug: "4x6-bubble-mailer", a: ["4x6 bubble mailers", "compact 4x6 mailers"] },
  { slug: "8-5-x-12-bubble-mailer", a: ["8.5 x 12 bubble mailers", "mid-size 8.5x12 mailers"] },
  { slug: "7x9-bubble-mailer", a: ["7x9 bubble mailers", "7x9 padded mailers"] },
  { slug: "12x15-bubble-mailer", a: ["12x15 bubble mailers", "large 12x15 mailers"] },
  { slug: "bubble-mailer-bags", a: ["bubble mailer bags", "padded mailer bags"] },
  { slug: "bubble-mailer-packaging", a: ["bubble mailer packaging", "padded mailer packaging"] },
  { slug: "custom-bubble-mailers", a: ["custom printed bubble mailers", "branded bubble mailers", "logo-printed bubble mailers"] },
];
const seedNum = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h | 0); };
const shufflePool = (pool, seedText) => {
  const arr = [...pool]; let a = seedNum(seedText) || 1;
  const rand = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1));[arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
};
// Returns { href, text } for slot `idx` of a page's shuffled link pool.
const varLink = (seedText, idx, off = 0) => {
  const pool = shufflePool(MAILER_LINKS, seedText);
  const e = pool[idx % pool.length];
  return { href: `/${e.slug}/`, text: e.a[(seedNum(seedText) + off) % e.a.length] };
};
const varPick = (seedText, arr, off = 0) => arr[(seedNum(seedText) + off) % arr.length];

const productLink = (slug, textOverride) => {
  const product = productsBySlug.get(slug);
  if (!product) return textOverride || slug;
  return `<a href="/${product.slug}/">${textOverride || product.name.toLowerCase()}</a>`;
};
const locationPick = (seedText, arr, offset = 0) => {
  const seed = seedText.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return arr[(seed + offset) % arr.length];
};
const locationCardGrid = (cards) => `
  <div class="product-grid">
    ${cards
      .map(
        (card) => `
      <article class="product-card">
        <img src="${card.image.url}" alt="${card.alt}" loading="lazy" decoding="async" width="1080" height="1080">
        <div>
          <h3><a href="${card.href}">${card.title}</a></h3>
          <p>${card.desc}</p>
        </div>
        <div class="button-row">
          <a class="button button-primary button-small" href="${card.href}">${card.cta}</a>
        </div>
      </article>
    `
      )
      .join("")}
  </div>
`;
const districtTags = (districts) => `
  <div class="button-row" style="flex-wrap:wrap;gap:8px">
    ${districts.map((d) => `<span class="button button-outline button-small" style="cursor:default">${d}</span>`).join("")}
  </div>
`;
const industryList = (industries) => `
  <ul class="text-columns">
    ${industries.map((item) => `<li>${item}</li>`).join("")}
  </ul>
`;

// Pool of 16 location FAQs. Each state/city page draws nine in a seeded order,
// so neighboring pages share some questions but never the same set or sequence.
const LOCATION_FAQ_POOL = [
  [(p) => `What is the minimum order for ${p} businesses?`, (p) => `The minimum order (MOQ) is 250 mailers. Bulk pricing applies from 5,000 units and pallet pricing from 10,000, so ${p} sellers can start small and scale without changing supplier.`],
  [(p) => `Can I get custom printed bubble mailers in ${p}?`, (p, sec) => `Yes. The minimum order (MOQ) is 250 mailers, printed in one, two or full color on kraft or white stock, proofed before production. ${p} ${sec} brands most often print a one-color logo and a return panel.`],
  [(p) => `Which bubble mailer sizes do ${p} sellers order most?`, (p, sec) => `The 8.5x12 (#2) and 4x7 (#000) lead almost everywhere; ${sec} sellers in ${p} also lean on the 10.5x15 (#5) for folded goods. Every size we stock is listed with usable dimensions on its own page.`],
  [(p) => `How long does delivery to ${p} take?`, (p) => `Plain stock usually reaches ${p} within a week of ordering; printed runs follow their production lead time, which we confirm with an estimated delivery date on the quote.`],
  [(p) => `Kraft or white bubble mailers for ${p} shipments?`, (p, sec) => `Kraft gives a natural paper look and prints well in dark colors; white poly is water-resistant and the better base for full-color print. For ${sec} products in ${p}, poly is the safer pick if parcels are left on doorsteps.`],
  [(p) => `Are bubble mailers strong enough for fragile ${p} orders?`, (p) => `For scuff-prone and lightly fragile goods, yes: the 3/16 in bubble lining absorbs knocks in sorting. Glass, ceramics and anything over 3 lb should go in a box. We advise on size and padding for heavier ${p} orders.`],
  [(p) => `Can I mix sizes in one ${p} order?`, (p) => `Yes. Mixed-size orders are the norm for ${p} stores shipping more than one product type; they ship together on one invoice and the price break is based on the combined quantity.`],
  [(p) => `Do you ship pallet quantities to ${p}?`, (p) => `Yes. Pallets of 10,000 to 25,000 mailers ship by freight to ${p} warehouses and 3PLs, and can be released on a schedule so you are not storing a full pallet at once.`],
  [(p) => `Do you provide a proof for custom orders shipped to ${p}?`, (p) => `Yes. Every printed order gets a digital proof at scale on the actual mailer size. Nothing prints until you approve it, so ${p} brands see exactly how the logo sits before committing.`],
  [(p) => `How fast do you quote for ${p} businesses?`, (p) => `Within 1-2 hours during US business hours, by email. Send the size, quantity, plain or printed, and your ${p} ZIP code and the quote comes back as a delivered price, shipping included free.`],
  [(p) => `Is pricing different for ${p} than elsewhere?`, (p) => `No. Mailer pricing is the same nationwide and shipping is free to any US address, so a ${p} order costs exactly what the quote says.`],
  [(p) => `Can a ${p} 3PL order for several brands at once?`, (p) => `Yes. Fulfillment centers in ${p} often stock printed mailers for one client and plain stock for another on a single invoice, with the quantity break applied across the whole order.`],
  [(p) => `Can I get samples before ordering in ${p}?`, (p) => `Yes. Ask for the two or three sizes you are considering, pack your real products, and then commit to a case or a printed run. It saves ${p} sellers from a case of mailers that is half an inch too small.`],
  [(p) => `Do bubble mailers lower shipping costs for ${p} sellers?`, (p, sec) => `Yes. A padded mailer weighs a few ounces less than the smallest box and avoids dimensional-weight pricing on small items, which for ${p} ${sec} orders typically saves $0.30 to $0.80 per parcel.`],
  [(p) => `How should ${p} businesses store bulk bubble mailers?`, (p) => `Flat, in the original cases, away from direct sun and damp. A case of 500 small mailers takes a single shelf; ${p} sellers with limited space often take scheduled pallet releases instead of a full pallet.`],
  [(p) => `Can I reorder the same printed mailers later in ${p}?`, (p) => `Yes. We keep your approved artwork and specification on file, so a repeat run for ${p} is a matter of confirming quantity and date; no new proof is needed unless the design changes.`]
];

// Seeded pool for the "why buy bulk" cards so neighboring location pages do
// not share the same four.
const BULK_CARD_POOL = [
  (p) => ["Lower cost per unit", `Per-mailer pricing drops as your volume rises, so daily packers in ${p} keep packaging spend under control.`],
  (p) => ["Never run out mid-season", `Stocking cartons or pallets means your ${p} fulfillment keeps moving through peak periods without last-minute reorders.`],
  (p) => ["Consistent brand look", `Order the same size and print every time so every ${p} shipment arrives looking identical and on-brand.`],
  (p) => ["One supplier, one invoice", `Mixed-size bulk orders ship together, simplifying purchasing for ${p} sellers and 3PLs alike.`],
  (p) => ["Scheduled releases", `Print a pallet at the low unit price and take it in releases, so ${p} teams with small storage still get pallet pricing.`],
  (p) => ["Free shipping, any quantity", `A case or a pallet ships free to ${p}, so the per-mailer price you are quoted is the price you pay.`],
  (p) => ["Fewer reorders to manage", `One bulk order covers months of ${p} shipping, which is one less supplier to chase every few weeks.`],
  (p) => ["Samples before you commit", `Test two or three sizes with real ${p} orders first, then buy the case or pallet with confidence.`]
];

// Size rows for location pages. Each page shows six of the eleven in a seeded
// order, with links to the product pages so cities feed the catalog.
const LOCATION_SIZE_ROWS = [
  ["4x6", "4x6-bubble-mailer", "Jewelry, cards, pins, samples"],
  ["4x7 (#000)", "4x7-bubble-mailer", "Cosmetics, phone accessories, cards"],
  ["6x9 (#0)", "9x6-bubble-mailer", "Books, phone cases, stationery"],
  ["7x9", "7x9-bubble-mailer", "Accessories, small books, gift items"],
  ["8.5x12 (#2)", "8-5-x-12-bubble-mailer", "Folded shirts, documents, tablets"],
  ["8.5x14.5 (#3)", "3-bubble-mailer", "Legal documents, samples, beauty sets"],
  ["10.5x15 (#5)", "10-5-x-15-bubble-mailer", "Hoodies, dresses, catalogs"],
  ["12x12", "12x12-bubble-mailer", "Prints, records, square kits"],
  ["12x15", "12x15-bubble-mailer", "Denim, multi-item kits, large apparel"],
  ["12.5x19 (#6)", "6-bubble-mailer", "Larger apparel, document packs"],
  ["14.25x20 (#7)", "7-bubble-mailer", "Oversized soft goods, magazines"]
];
const renderLocationSizeTable = (seedText) => `
        <table>
          <thead><tr><th>Size</th><th>Commonly used for</th><th>Bulk price from</th></tr></thead>
          <tbody>
            ${shufflePool(LOCATION_SIZE_ROWS, seedText).slice(0, 6).map(([label, slug, use]) => {
              const product = productsBySlug.get(slug);
              return `<tr><td><a href="/${slug}/">${label}</a></td><td>${use}</td><td>$${product ? product.price : "—"}</td></tr>`;
            }).join("")}
          </tbody>
        </table>`;

const renderCityPage = (state, city) => {
  const routePath = `/locations/${state.slug}/${city.slug}/`;
  const featured = resolveFeatured(city.featuredProducts);
  const heroImage = pickAsset("generic", city.slug.length);
  const breadcrumbs = [
    { href: "/", label: "Home" },
    { href: "/locations/", label: "Locations" },
    { href: `/locations/${state.slug}/`, label: state.name },
    { href: routePath, label: city.name }
  ];
  const siblingCities = state.cities.filter((c) => c.slug !== city.slug);

  // Varied internal links — unique target, anchor and sentence per city page.
  const cSeed = city.slug + state.slug;
  const cL0 = varLink(cSeed, 0, 0);
  const cL1 = varLink(cSeed, 1, 1);
  const cL2 = varLink(cSeed, 2, 2);
  const cAns = varPick(cSeed, [
    `A popular pick for ${city.name} ${city.signatureSector} sellers is our ${cL0.text ? `<a href="${cL0.href}">${cL0.text}</a>` : ""}, kept in stock for fast bulk supply.`,
    `${city.name} sellers often start with our <a href="${cL0.href}">${cL0.text}</a> and scale up from there.`,
    `For ${city.signatureSector} shipments, ${city.name} teams reach for our <a href="${cL0.href}">${cL0.text}</a>.`,
  ]);
  const cScene = varPick(cSeed, [
    `Whatever you ship across ${city.name}, the right padded mailer keeps it protected and presentable. Our <a href="${cL1.href}">${cL1.text}</a> suit the way ${city.name} businesses pack and ship.`,
    `To keep ${city.name} orders snug and light, sellers rely on our <a href="${cL1.href}">${cL1.text}</a>.`,
    `Our <a href="${cL1.href}">${cL1.text}</a> are a natural fit for the pace of ${city.name} fulfillment.`,
  ], 1);

  const answerHeading = locationPick(city.slug, [
    `Bubble Mailers in ${city.name}`,
    `Bulk & Custom Bubble Mailers for ${city.name}`,
    `${city.name} Bubble Mailer Supply`
  ]);
  const whyHeading = locationPick(city.slug, [
    `Delivery & Supply to ${city.name}`,
    `Getting Bubble Mailers to ${city.name}`,
    `Supplying ${city.name} Businesses`
  ], 1);

  const cityFaqs = [
    [`Do you supply bubble mailers to ${city.name}?`, city.faqCityAnswer],
    ...shufflePool(LOCATION_FAQ_POOL, cSeed).slice(0, 9).map(([q, a]) => [q(city.name), a(city.name, city.signatureSector)])
  ];

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Bubble Mailer Supply — ${city.name}, ${state.abbr}`,
    serviceType: "Bulk and custom bubble mailer supply",
    description: city.metaDescription,
    url: absoluteUrl(routePath),
    provider: { "@type": "Organization", name: site.brand, url: site.domain },
    areaServed: {
      "@type": "City",
      name: city.name,
      containedInPlace: { "@type": "State", name: `${state.name}, USA` }
    }
  };

  const body = `
    ${renderStandardPageHero({
      eyebrow: `${state.name} · USA`,
      title: city.h1,
      description: city.intro,
      image: heroImage,
      ctas: [
        { href: "#quote-form", label: "Get Free Quote", primary: true },
        { href: `/locations/${state.slug}/`, label: `All ${state.name} Locations` }
      ]
    })}
    <section class="section">
      <div class="container content-card content-flow">
        <h2>${answerHeading}</h2>
        <p>Shop Bubble Mailers supplies bulk and custom padded bubble mailers to businesses across ${city.name} and the wider ${state.name} market. Every order can be printed to your brand or shipped plain, protecting compact goods without adding freight weight. ${cAns}</p>
        <p><strong>Why ${city.name} sellers order from us:</strong> a 250-mailer minimum order (MOQ), bulk pricing, custom print options, fast quote turnaround, and reliable supply for repeat orders.</p>
      </div>
    </section>
    <section class="section">
      <div class="container split-grid">
        <div class="content-card content-flow">
          <h2>${city.sceneHeading}</h2>
          <p>${city.localScene}</p>
          <p>${cScene}</p>
          <h3>Areas We Serve in ${city.name}</h3>
          ${districtTags(city.districts)}
        </div>
        ${renderQuoteForm(`Bubble Mailers — ${city.name}, ${state.abbr}`)}
      </div>
    </section>
    <section class="section" style="background:var(--color-bg-alt)">
      <div class="container content-card content-flow">
        <div class="section-heading">
          <span class="eyebrow">Size Guide</span>
          <h2>Bubble Mailer Sizes for ${city.name} Shippers</h2>
        </div>
        <p>Six of the eleven sizes we stock, with the ones ${city.name} ${city.signatureSector} sellers reach for most. Prices are per mailer for plain stock at 5,000 units; every size has its own page with usable dimensions.</p>
${renderLocationSizeTable(cSeed)}
        <p>Need help choosing? We recommend the right size for your ${city.signatureSector} shipments — just ask when you request a quote for ${city.name}.</p>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="section-heading">
          <span class="eyebrow">Popular in ${city.name}</span>
          <h2>Bubble Mailers ${city.name} Businesses Order Most</h2>
        </div>
        ${renderProductCards(featured)}
      </div>
    </section>
    <section class="section" style="background:var(--color-bg-alt)">
      <div class="container">
        <div class="section-heading">
          <span class="eyebrow">Why Buy Bulk</span>
          <h2>Why ${city.name} Teams Order Bubble Mailers in Bulk</h2>
        </div>
        <div class="loc-value-grid">
          ${shufflePool(BULK_CARD_POOL, cSeed + "-bulk").slice(0, 4).map((card) => { const [h, p] = card(city.name); return `<div class="content-card content-flow" style="padding:22px"><h3>${h}</h3><p>${p}</p></div>`; }).join("")}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container content-card content-flow">
        <h2>${whyHeading}</h2>
        <p>${city.deliveryNote}</p>
        <p>Businesses right across ${state.name} rely on us for consistent supply — see our full ${`<a href="/locations/${state.slug}/">${state.name} bubble mailer page</a>`} for statewide coverage and other cities we serve.</p>
      </div>
    </section>
    ${
      siblingCities.length > 0
        ? `<section class="section">
      <div class="container">
        <div class="section-heading">
          <span class="eyebrow">Also Serving</span>
          <h2>Other ${state.name} Cities We Supply</h2>
        </div>
        ${locationCardGrid(
          siblingCities.map((c, i) => ({
            href: `/locations/${state.slug}/${c.slug}/`,
            title: `${c.name}, ${state.abbr}`,
            desc: c.intro.slice(0, 90) + "…",
            cta: `Bubble mailers in ${c.name}`,
            alt: `${c.name} bubble mailers`,
            image: pickAsset("plain", i + 1)
          }))
        )}
      </div>
    </section>`
        : ""
    }
    <section class="section">
      <div class="container content-card content-flow">
        <div class="section-heading">
          <span class="eyebrow">FAQs</span>
          <h2>${city.name} Bubble Mailers — FAQs</h2>
        </div>
        ${renderFaqList(cityFaqs)}
      </div>
    </section>
  `;

  return buildPage({
    routePath,
    title: city.h1,
    metaTitle: city.metaTitle,
    metaDescription: city.metaDescription,
    heroImage: heroImage.url,
    body,
    breadcrumbs,
    schemas: [serviceSchema, faqSchema(cityFaqs)]
  });
};

const renderStatePage = (state) => {
  const routePath = `/locations/${state.slug}/`;
  const featured = resolveFeatured(state.featuredProducts);
  const heroImage = pickAsset("bulk500", state.slug.length % 3);
  const breadcrumbs = [
    { href: "/", label: "Home" },
    { href: "/locations/", label: "Locations" },
    { href: routePath, label: state.name }
  ];

  // Varied internal links — unique targets, anchors and sentences per state page.
  const sL0 = varLink("state-" + state.slug, 0, 0);
  const sL1 = varLink("state-" + state.slug, 1, 1);
  const sScene = varPick("state-" + state.slug, [
    `Across every industry here, a padded mailer that ships light keeps costs down — our <a href="${sL0.href}">${sL0.text}</a> are a popular choice for ${state.name} shippers.`,
    `Whatever ${state.name} businesses send, our <a href="${sL0.href}">${sL0.text}</a> keep it protected without adding weight.`,
    `From small parcels to bulk runs, ${state.name} sellers reach for our <a href="${sL0.href}">${sL0.text}</a>.`,
  ]);
  const sWho = varPick("state-" + state.slug, [
    `We print for the full range of ${state.name} shippers — many start with our <a href="${sL1.href}">${sL1.text}</a> and add sizes as they grow.`,
    `From solo sellers to 3PLs, ${state.name} businesses of every size order from us, including our <a href="${sL1.href}">${sL1.text}</a>.`,
    `Whatever you pack in ${state.name}, there's a fit — our <a href="${sL1.href}">${sL1.text}</a> included.`,
  ], 2);

  const stateFaqs = [
    [`Do you supply bubble mailers across ${state.name}?`, `Yes. We supply bulk and custom bubble mailers to businesses across ${state.name}, including ${state.cities.map((c) => c.name).join(", ")} and surrounding areas. Request a quote with your size and quantity for pricing.`],
    ...shufflePool(LOCATION_FAQ_POOL, "state-" + state.slug).slice(0, 9).map(([q, a]) => [q(state.name), a(state.name, "eCommerce")])
  ];

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Bubble Mailers in ${state.name}`,
    url: absoluteUrl(routePath),
    description: state.metaDescription,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: state.cities.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `Bubble Mailers in ${c.name}`,
        url: absoluteUrl(`/locations/${state.slug}/${c.slug}/`)
      }))
    }
  };

  const body = `
    ${renderStandardPageHero({
      eyebrow: `USA · ${state.abbr}`,
      title: state.h1,
      description: state.intro,
      image: heroImage,
      ctas: [
        { href: "#quote-form", label: "Get Free Quote", primary: true },
        { href: "/locations/", label: "All USA Locations" }
      ]
    })}
    <section class="section">
      <div class="container split-grid">
        <div class="content-card content-flow">
          <h2>${state.sceneHeading}</h2>
          <p>${state.marketScene}</p>
          <p>${sScene}</p>
        </div>
        ${renderQuoteForm(`Bubble Mailers — ${state.name}`)}
      </div>
    </section>
    <section class="section">
      <div class="container content-card content-flow">
        <div class="section-heading">
          <span class="eyebrow">Who We Supply</span>
          <h2>${state.name} Businesses We Print For</h2>
        </div>
        <p>${sWho}</p>
        ${industryList(state.industries)}
      </div>
    </section>
    <section class="section" style="background:var(--color-bg-alt)">
      <div class="container content-card content-flow">
        <div class="section-heading">
          <span class="eyebrow">Size Guide</span>
          <h2>Bubble Mailer Sizes for ${state.name} Businesses</h2>
        </div>
        <p>Six of the eleven sizes we stock, chosen for what ${state.name} sellers ship most. Prices are per mailer for plain stock at 5,000 units; open any size for its usable dimensions and what it holds.</p>
${renderLocationSizeTable("state-" + state.slug)}
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="section-heading">
          <span class="eyebrow">Cities</span>
          <h2>Bubble Mailers by City in ${state.name}</h2>
        </div>
        ${locationCardGrid(
          state.cities.map((c, i) => ({
            href: `/locations/${state.slug}/${c.slug}/`,
            title: `${c.name}, ${state.abbr}`,
            desc: c.intro.slice(0, 90) + "…",
            cta: `Bubble mailers in ${c.name}`,
            alt: `${c.name} bubble mailers`,
            image: pickAsset("generic", i + 2)
          }))
        )}
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="section-heading">
          <span class="eyebrow">Popular Products</span>
          <h2>Bubble Mailers ${state.name} Businesses Order Most</h2>
        </div>
        ${renderProductCards(featured)}
      </div>
    </section>
    <section class="section">
      <div class="container content-card content-flow">
        <div class="section-heading">
          <span class="eyebrow">FAQs</span>
          <h2>${state.name} Bubble Mailers — FAQs</h2>
        </div>
        ${renderFaqList(stateFaqs)}
      </div>
    </section>
  `;

  return buildPage({
    routePath,
    title: state.h1,
    metaTitle: state.metaTitle,
    metaDescription: state.metaDescription,
    heroImage: heroImage.url,
    body,
    breadcrumbs,
    schemas: [collectionSchema, faqSchema(stateFaqs)]
  });
};

const locationsFaqs = [
  ["Do you ship bubble mailers to every US state?", "Yes, with free shipping to any US address. The state and city pages cover the markets we serve most, but delivery works the same way everywhere."],
  ["Why do you have pages for individual states and cities?", "Because what sells in each market differs: LA ships apparel and beauty, Houston ships industrial parts and samples, Chicago ships books and 3PL volume. Each page lists the sizes those sellers order most and local delivery notes."],
  ["Is pricing different by location?", "No. Mailer pricing is the same nationwide and shipping is free to every US address, so the quoted price is the delivered price."],
  ["How long does delivery take within the USA?", "Plain stock usually arrives within a week of ordering across the contiguous US; printed runs follow their production lead time. We confirm an estimated delivery date on every quote."],
  ["Can a 3PL or fulfillment center order on behalf of a brand?", "Yes. Many of our orders are placed by 3PLs stocking several client brands. We can ship printed stock for one client and plain stock for another on one invoice."],
  ["Do you supply businesses outside the listed cities?", "Yes. The city pages are a starting point. If your city is not listed, request a quote and tell us where you are; delivery works the same way."],
  ["Can I split one order across warehouses in different states?", "Yes. Bulk and printed orders can be delivered to several addresses, with the price break based on the combined quantity."],
  ["Do you offer local pickup anywhere?", "No. All orders ship free by freight or parcel carrier to your address, which keeps pricing consistent across the country."],
  ["Which sizes are most popular nationally?", "The 8.5x12 (#2) for apparel and multi-item orders, the 4x7 (#000) for small goods, and the 10.5x15 (#5) for folded garments. Coastal apparel markets lean larger; marketplace sellers lean smaller."],
  ["How do I get a quote for my city?", "Use the form on your state or city page, or call (503) 461-4788 with your size, quantity and ZIP code. Quotes are returned by email within 1-2 hours."]
];

const renderLocationsHub = () => {
  const routePath = "/locations/";
  const heroImage = pickAsset("bulk500", 0);
  const breadcrumbs = [
    { href: "/", label: "Home" },
    { href: "/locations/", label: "Locations" }
  ];
  const totalCities = locationStates.reduce((sum, s) => sum + s.cities.length, 0);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "USA Delivery Locations — Shop Bubble Mailers",
    itemListElement: locationStates.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `Bubble Mailers in ${s.name}`,
      url: absoluteUrl(`/locations/${s.slug}/`)
    }))
  };

  const body = `
    ${renderStandardPageHero({
      eyebrow: "USA Delivery",
      title: "Bubble Mailers Supplied Across the USA",
      description: `We supply bulk and custom bubble mailers to businesses in every corner of the country — from California DTC brands to New York resellers. Browse ${locationStates.length} states and ${totalCities} cities, or request a free quote to get started.`,
      image: heroImage,
      ctas: [
        { href: "#quote-form", label: "Get Free Quote", primary: true },
        { href: "/products/", label: "Browse Products" }
      ]
    })}
    <section class="section">
      <div class="container">
        <div class="section-heading">
          <span class="eyebrow">By State</span>
          <h2>Find Bubble Mailers in Your State</h2>
        </div>
        ${locationCardGrid(
          locationStates.map((s, i) => ({
            href: `/locations/${s.slug}/`,
            title: `${s.name} (${s.abbr})`,
            desc: `${s.stat}. Serving ${s.cities.map((c) => c.name).join(", ")}.`,
            cta: `Bubble mailers in ${s.name}`,
            alt: `${s.name} bubble mailers`,
            image: pickAsset("generic", i)
          }))
        )}
      </div>
    </section>
    <section class="section">
      <div class="container split-grid">
        <div class="content-card content-flow">
          <h2>Nationwide Bubble Mailer Supply</h2>
          <p>Wherever your business ships from, Shop Bubble Mailers keeps you stocked with padded mailers that seal fast, protect compact goods, and ship light. We supply plain kraft and white stock as well as ${`<a href="/custom-bubble-mailers/">custom printed bubble mailers</a>`} with your branding, all at bulk pricing.</p>
          <p>Don't see your city listed yet? We ship nationwide — tell us where you are and what you send, and we'll get you a quote.</p>
        </div>
        ${renderQuoteForm("Bubble Mailers — USA")}
      </div>
    </section>
    <section class="section">
      <div class="container content-card content-flow">
        <div class="section-heading">
          <span class="eyebrow">FAQs</span>
          <h2>Nationwide supply FAQs</h2>
        </div>
        ${renderFaqList(locationsFaqs)}
      </div>
    </section>
  `;

  return buildPage({
    routePath,
    title: "USA Delivery Locations",
    metaTitle: "Bubble Mailers Across the USA | Shop Bubble Mailers",
    metaDescription: "Shop Bubble Mailers supplies bulk and custom bubble mailers to businesses across the USA — browse locations by state and city, or request a free quote.",
    heroImage: heroImage.url,
    body,
    breadcrumbs,
    schemas: [itemListSchema, faqSchema(locationsFaqs)]
  });
};

writeRoute("/locations/", renderLocationsHub());
locationStates.forEach((state) => {
  writeRoute(`/locations/${state.slug}/`, renderStatePage(state));
  state.cities.forEach((city) => writeRoute(`/locations/${state.slug}/${city.slug}/`, renderCityPage(state, city)));
});

writeRoute("/sitemap/", renderSitemapPage());

writeStaticAsset(
  "robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${site.domain}/sitemap.xml\n`
);

// Stable last-modified date for the sitemap. Bump this when content is
// materially updated. A fixed date (rather than new Date() at build time) keeps
// lastmod from resetting on every deploy, which Google would learn to distrust.
const LASTMOD = "2026-11-11";

writeStaticAsset(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${siteRoutes
    .filter((route) => !NOINDEX_ROUTES.has(route))
    .map((route) => {
      const slug = route.replace(/^\/|\/$/g, "");
      let priority = "0.7";
      let changefreq = "monthly";
      if (route === "/") {
        priority = "1.0";
        changefreq = "weekly";
      } else if (slug === "privacy-policy" || slug === "terms-and-conditions" || slug === "custom-order-policy" || slug === "shipping-policy" || slug === "refund_returns") {
        priority = "0.3";
        changefreq = "yearly";
      } else if (productsBySlug.has(slug)) {
        priority = "0.8";
        changefreq = "weekly";
      }
      return `  <url><loc>${absoluteUrl(route)}</loc><lastmod>${LASTMOD}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
    })
    .join("\n")}\n</urlset>\n`
);

// Google Merchant Center feed (RSS 2.0 + g: namespace), built from the same products array and
// order-data.js facts as the product pages: one item per product page with an Offer, price = the
// page's per-mailer Offer price (never a pack total), free shipping + days per ship country.
// Not in the sitemap and not disallowed in robots.txt.
const FEED_EXCLUDED = new Set([]); // no restricted items (tobacco, vape, CBD, medical) on this site
const xmlEscape = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const feedProducts = products.filter((product) => !FEED_EXCLUDED.has(product.slug));
const feedItems = feedProducts.map((product) => {
  const price = Number(productUnitPrice(product));
  if (!(price > 0) || price !== Number(ORDER.unitPrice(product.slug))) throw new Error(`Feed price for ${product.slug} does not match its Offer/checkout price`);
  const shipping = ORDER.SHIP_COUNTRIES.map((country) => `<g:shipping><g:country>${country.code}</g:country><g:service>Free shipping</g:service><g:price>${ORDER.SHIPPING_COST.toFixed(2)} USD</g:price><g:min_handling_time>${ORDER.HANDLING_DAYS.min}</g:min_handling_time><g:max_handling_time>${ORDER.HANDLING_DAYS.max}</g:max_handling_time><g:min_transit_time>${ORDER.TRANSIT_DAYS.min}</g:min_transit_time><g:max_transit_time>${ORDER.TRANSIT_DAYS.max}</g:max_transit_time></g:shipping>`).join("");
  const description = `${product.metaDescription} Starting from ${ORDER.money(price)} per ${ORDER.UNIT}, minimum order (MOQ) ${ORDER.PACK_QTY.toLocaleString("en-US")} ${ORDER.UNITS}. Free shipping to any US address.`;
  return `    <item>
      <g:id>${xmlEscape(product.slug)}</g:id>
      <g:title>${xmlEscape(product.name)}</g:title>
      <g:description>${xmlEscape(description)}</g:description>
      <g:link>${xmlEscape(absoluteUrl(`/${product.slug}/`))}</g:link>
      <g:image_link>${xmlEscape(imageAbsoluteUrl(product.image.url))}</g:image_link>
${product.accentImages.slice(0, 2).map((image) => `      <g:additional_image_link>${xmlEscape(imageAbsoluteUrl(image.url))}</g:additional_image_link>\n`).join("")}      <g:condition>new</g:condition>
      <g:availability>in_stock</g:availability>
      <g:price>${price.toFixed(2)} USD</g:price>
      <g:brand>${xmlEscape(site.brand)}</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:product_type>${xmlEscape(`Bubble Mailers > ${product.category}`)}</g:product_type>
      <g:google_product_category>2636</g:google_product_category>
      ${shipping}
    </item>`;
});
// Build check: one feed item per product page (each carries an Offer) minus exclusions.
if (feedItems.length !== products.length - FEED_EXCLUDED.size) throw new Error(`merchant-feed.xml has ${feedItems.length} items, expected ${products.length - FEED_EXCLUDED.size}`);
for (const product of feedProducts) {
  const html = fs.readFileSync(path.join(distDir, product.slug, "index.html"), "utf8");
  if (!html.includes(`"price":"${productUnitPrice(product)}"`) || !html.includes("Add to order")) throw new Error(`Product page ${product.slug} lacks its Offer price or order box`);
}
writeStaticAsset(
  "merchant-feed.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n  <channel>\n    <title>${xmlEscape(site.brand)}</title>\n    <link>${site.domain}/</link>\n    <description>Bubble mailers for US businesses, starting from ${ORDER.money(Math.min(...feedProducts.map((p) => Number(productUnitPrice(p)))))} per ${ORDER.UNIT}, minimum order (MOQ) ${ORDER.PACK_QTY.toLocaleString("en-US")} ${ORDER.UNITS}, free shipping to any US address.</description>\n${feedItems.join("\n")}\n  </channel>\n</rss>\n`
);

const checklist = `# Shop Bubble Mailers Final Checklist

## 1. All Created Pages
- /
- /about-us/
- /products/
- /custom-bubble-mailers/
- /kraft-bubble-mailers/
- /white-bubble-mailers/
- /bubble-mailer-bags/
- /bubble-mailer-packaging/
- /contact-us/
- /privacy-policy/
- /terms-and-conditions/
- /sitemap/

## 2. All Product URLs
${products.map((product) => `- /${product.slug}/`).join("\n")}

## 3. Sitemap Status
- HTML sitemap created at /sitemap/
- XML sitemap created at /sitemap.xml

## 4. Robots.txt Status
- robots.txt created at /robots.txt
- Crawl allowed for all user agents
- Sitemap reference added

## 5. Schema Added
- Organization
- LocalBusiness
- WebSite
- BreadcrumbList
- Product schema on product pages
- FAQPage schema on pages with FAQs
- ContactPage schema on /contact-us/
- AboutPage schema on /about-us/

## 6. Meta Titles and Descriptions Added
- Unique meta title added for every page
- Unique meta description added for every page
- Canonical, Open Graph, and Twitter card tags included

## 7. Missing Images or Issues
- Assets folder PNGs are converted to WebP (1000px and 400px) during the build and used on the site
- Product-to-image matching was based on the closest relevant asset where filenames were broad rather than exact
- Quote forms are wired to FormSubmit for no-backend lead capture and can be swapped later if you want a custom form handler
`;

fs.writeFileSync(path.join(rootDir, "FINAL-CHECKLIST.md"), checklist);

Promise.all(imageJobs)
  .then(() => {
    console.log(`Built ${siteRoutes.length} routes with ${assetCatalog.length} images.`);
  })
  .catch((error) => {
    console.error("Image conversion failed:", error.message);
    process.exit(1);
  });
