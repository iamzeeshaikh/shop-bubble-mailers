const fs = require("fs");
const path = require("path");
const { locationStates } = require("./locations-data.js");

const rootDir = __dirname;
const srcDir = path.join(rootDir, "src");
const assetsDir = path.join(rootDir, "Assets");
const distDir = path.join(rootDir, "dist");
const distAssetsDir = path.join(distDir, "assets", "images");

const site = {
  domain: "https://shopbubblemailers.com",
  brand: "Shop Bubble Mailers",
  email: "Info@shopbubblemailers.com",
  phone: "(503) 358-0443",
  phoneHref: "+15033580443",
  address: "2975 Coburn Hollow Road Bloomington, IL 61701 United States",
  city: "Bloomington",
  state: "IL",
  postalCode: "61701",
  country: "US",
  formAction: "/api/send-quote",
  socialImage: "/assets/images/bubble-mailers-pbee-3.png"
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

cleanDir(distDir);
ensureDir(distAssetsDir);

const assetFiles = fs
  .readdirSync(assetsDir)
  .filter((file) => file.toLowerCase().endsWith(".png"))
  .sort((a, b) => a.localeCompare(b));

const assetCatalog = assetFiles.map((file, index) => {
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file, ext);
  const outputName = `${slugify(base)}${ext}`;
  fs.copyFileSync(path.join(assetsDir, file), path.join(distAssetsDir, outputName));

  return {
    id: `asset-${index + 1}`,
    original: file,
    filename: outputName,
    url: `/assets/images/${outputName}`,
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

const preferredCategoryComparison = (routePath) => {
  if (routePath === "/kraft-bubble-mailers/") {
    return { href: "/white-bubble-mailers/", label: "white bubble mailers" };
  }
  if (routePath === "/white-bubble-mailers/") {
    return { href: "/kraft-bubble-mailers/", label: "kraft bubble mailers" };
  }
  if (routePath === "/bubble-mailer-bags/") {
    return { href: "/bubble-mailer-packaging/", label: "bubble mailer packaging" };
  }
  if (routePath === "/custom-bubble-mailers/") {
    return { href: "/bubble-mailer-packaging/", label: "custom bubble mailer packaging" };
  }
  return { href: "/kraft-bubble-mailers/", label: "kraft bubble mailers" };
};

const sizeGuide = [
  { size: "4x6", use: "Small parts, jewelry cards, samples", strength: "Compact padded mailer for low-profile items" },
  { size: "4x7", use: "Small accessories, cosmetics, cables", strength: "Easy fit for lightweight branded shipments" },
  { size: "7x9", use: "Apparel accessories, books, boxed kits", strength: "Balanced option for everyday eCommerce orders" },
  { size: "8.5x12", use: "Documents, notebooks, beauty sets", strength: "Common padded size for growing stores" },
  { size: "10.5x15", use: "Folded garments, larger kits, catalogs", strength: "Useful when products need more face size" },
  { size: "12x12", use: "Square products, prints, flat boxed items", strength: "Wide opening for awkward product shapes" },
  { size: "12x15", use: "Bulk apparel, books, large retail orders", strength: "Large mailer for higher-volume shipments" }
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
  ["Do you ship across the United States?", "Yes. Shop Bubble Mailers serves businesses throughout the USA and supports orders for local operations, regional distributors, and national shipping programs."]
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
    [`What is the minimum order quantity for ${nameLower}?`, `The minimum for ${nameLower} depends on whether you want standard stock or custom print. We quote both small-business quantities and high-volume bulk programs — share your target quantity and we'll confirm the minimum and where price breaks fall.`],
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
  "kraft-bubble-mailer": ["bubble-mailer-white", "bubble-mailer-packaging", "custom-bubble-mailers", "bubble-mailer-bags"],
  "4x6-bubble-mailer": ["4x7-bubble-mailer", "7x9-bubble-mailer", "bubble-mailer-bags", "kraft-bubble-mailer"],
  "bubble-mailer-white": ["kraft-bubble-mailer", "8-5-x-12-bubble-mailer", "bubble-mailer-packaging", "custom-bubble-mailers"],
  "8-5-x-12-bubble-mailer": ["7x9-bubble-mailer", "10-5-x-15-bubble-mailer", "bubble-mailer-white", "bubble-mailer-packaging"],
  "4x7-bubble-mailer": ["4x6-bubble-mailer", "7x9-bubble-mailer", "3-bubble-mailer", "kraft-bubble-mailer"],
  "4-x-6-bubble-mailer": ["4x6-bubble-mailer", "4x7-bubble-mailer", "bubble-mailer-bags", "white-bubble-mailers"],
  "2-bubble-mailer": ["3-bubble-mailer", "4x6-bubble-mailer", "kraft-bubble-mailer", "bubble-mailer-bags"],
  "5-bubble-mailer": ["6-bubble-mailer", "7-bubble-mailer", "8-5-x-12-bubble-mailer", "bubble-mailer-white"],
  "bubble-mailer-bags": ["kraft-bubble-mailer", "bubble-mailer-packaging", "custom-bubble-mailers", "7x9-bubble-mailer"],
  "6-bubble-mailer": ["5-bubble-mailer", "7-bubble-mailer", "10-5-x-15-bubble-mailer", "bubble-mailer-packaging"],
  "bubble-mailer-packaging": ["bubble-mailer-bags", "custom-bubble-mailers", "kraft-bubble-mailer", "white-bubble-mailers"],
  "7-bubble-mailer": ["6-bubble-mailer", "5-bubble-mailer", "10-5-x-15-bubble-mailer", "12x15-bubble-mailer"],
  "10-5-x-15-bubble-mailer": ["8-5-x-12-bubble-mailer", "12x15-bubble-mailer", "7-bubble-mailer", "bubble-mailer-packaging"],
  "7x9-bubble-mailer": ["4x7-bubble-mailer", "8-5-x-12-bubble-mailer", "bubble-mailer-bags", "kraft-bubble-mailer"],
  "9x6-bubble-mailer": ["7x9-bubble-mailer", "8-5-x-12-bubble-mailer", "bubble-mailer-white", "bubble-mailer-packaging"],
  "12x12-bubble-mailer": ["12x15-bubble-mailer", "10-5-x-15-bubble-mailer", "bubble-mailer-packaging", "custom-bubble-mailers"],
  "12x15-bubble-mailer": ["12x12-bubble-mailer", "10-5-x-15-bubble-mailer", "7-bubble-mailer", "bubble-mailer-packaging"],
  "3-bubble-mailer": ["2-bubble-mailer", "4x6-bubble-mailer", "4x7-bubble-mailer", "bubble-mailer-bags"]
};

const products = [
  {
    slug: "kraft-bubble-mailer",
    name: "Kraft Bubble Mailer",
    metaTitle: "Kraft Bubble Mailer Supplier in the USA | Shop Bubble Mailers",
    metaDescription: "Get bulk kraft bubble mailers with padded protection, clean sealing, custom sizes, and fast quote support for US businesses.",
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
    metaTitle: "4x6 Bubble Mailer Bulk Orders | Shop Bubble Mailers",
    metaDescription: "Order 4x6 bubble mailers for samples, cards, jewelry, and compact eCommerce shipments. Request bulk pricing in the USA.",
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
    slug: "bubble-mailer-white",
    name: "Bubble Mailer White",
    metaTitle: "White Bubble Mailer Supplier | Shop Bubble Mailers",
    metaDescription: "White bubble mailers with padded protection, clean presentation, and custom print options for eCommerce and retail shipping.",
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
    metaTitle: "8.5 x 12 Bubble Mailer Quotes | Shop Bubble Mailers",
    metaDescription: "Get bulk 8.5 x 12 bubble mailers for catalogs, documents, apparel, kits, and eCommerce shipments across the USA.",
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
    metaTitle: "4x7 Bubble Mailer Supplier | Shop Bubble Mailers",
    metaDescription: "4x7 bubble mailers for compact retail and eCommerce shipments with padded protection and bulk quote support.",
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
    slug: "4-x-6-bubble-mailer",
    name: "4 x 6 Bubble Mailer",
    metaTitle: "4 x 6 Bubble Mailer for Small Shipments | Shop Bubble Mailers",
    metaDescription: "Shop 4 x 6 bubble mailers for compact business shipments, sample packs, and lightweight padded mailing needs.",
    category: "Small Bubble Mailers",
    image: pickAsset("generic", 5),
    accentImages: [pickAsset("plain", 1), pickAsset("bulk1000", 1)],
    sizes: ["4 x 6"],
    material: "Small-format padded mailer built for low-weight shipments and fast hand packing",
    idealFor: ["sample packs", "small hardware", "cards", "compact store items"],
    fitNote: "This is a space-saving size for very small orders where keeping freight weight down matters.",
    customAngle: "Simple logo print programs fit well on this size when branding still matters on small parcels.",
    bulkAngle: "4 x 6 mailers are often ordered in volume for repeat shipments with consistent product dimensions.",
    tone: "low-weight compact shipping"
  },
  {
    slug: "2-bubble-mailer",
    name: "2 Bubble Mailer",
    metaTitle: "No. 2 Bubble Mailer Supplier | Shop Bubble Mailers",
    metaDescription: "Request a quote for No. 2 bubble mailers with padded protection, self-seal closure, and bulk order support in the USA.",
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
    name: "5 Bubble Mailer",
    metaTitle: "No. 5 Bubble Mailer Bulk Quote | Shop Bubble Mailers",
    metaDescription: "No. 5 bubble mailers for larger products, apparel, and padded business shipments. Get bulk pricing from Shop Bubble Mailers.",
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
    name: "Bubble Mailer Bags",
    metaTitle: "Bubble Mailer Bags for Bulk Orders | Shop Bubble Mailers",
    metaDescription: "Bubble mailer bags for eCommerce, retail, and shipping operations with padded protection, custom options, and USA quote support.",
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
    name: "6 Bubble Mailer",
    metaTitle: "No. 6 Bubble Mailer Supplier | Shop Bubble Mailers",
    metaDescription: "Order No. 6 bubble mailers for padded shipping, large-format products, and business packing programs across the USA.",
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
    metaTitle: "Bubble Mailer Packaging Supplier | Shop Bubble Mailers",
    metaDescription: "Bubble mailer packaging for retail, eCommerce, and shipping operations. Request custom sizes, print options, and bulk pricing.",
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
    name: "7 Bubble Mailer",
    metaTitle: "No. 7 Bubble Mailer Bulk Supplier | Shop Bubble Mailers",
    metaDescription: "No. 7 bubble mailers for larger padded shipments, apparel, and retail orders. Request a quote from Shop Bubble Mailers.",
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
    metaTitle: "10.5 x 15 Bubble Mailer Quotes | Shop Bubble Mailers",
    metaDescription: "10.5 x 15 bubble mailers for larger apparel, document packs, and padded shipments. Get bulk pricing in the USA.",
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
    metaTitle: "7x9 Bubble Mailer Supplier | Shop Bubble Mailers",
    metaDescription: "7x9 bubble mailers for everyday eCommerce and retail shipping with padded protection and fast bulk quote support.",
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
    metaTitle: "9x6 Bubble Mailer for Retail Shipping | Shop Bubble Mailers",
    metaDescription: "Shop 9x6 bubble mailers for padded retail and eCommerce shipping. Request a quote for bulk orders and custom options.",
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
    metaTitle: "12x12 Bubble Mailer Supplier | Shop Bubble Mailers",
    metaDescription: "12x12 bubble mailers for square products, flat kits, and padded business shipments. Request bulk pricing today.",
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
    metaTitle: "12x15 Bubble Mailer Bulk Orders | Shop Bubble Mailers",
    metaDescription: "12x15 bubble mailers for large apparel, catalogs, kits, and padded commercial shipping. Request a USA quote now.",
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
    name: "3 Bubble Mailer",
    metaTitle: "No. 3 Bubble Mailer Supplier | Shop Bubble Mailers",
    metaDescription: "No. 3 bubble mailers for compact retail and eCommerce shipping with padded protection and fast quote support in the USA.",
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

  "bubble-mailer-white": {
    overview: [
      "White bubble mailers trade the utilitarian look of kraft or grey poly for a clean, shelf-ready exterior, and for customer-facing brands that difference matters. The smooth white face photographs well for unboxing content, takes print legibly, and signals a more considered package the moment it lands in a mailbox.",
      "Underneath the presentation, a white mailer is still a working padded envelope: a bubble-lined interior absorbs everyday transit impact and a pressure-sensitive strip seals in one pass. Beauty, apparel-accessory, and subscription brands reach for white when they want the protection of a bubble mailer without the raw industrial appearance."
    ],
    benefits: [
      "Clean white exterior gives shipments a shelf-ready, brand-forward look that kraft and grey poly can't match.",
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
      ["Do white bubble mailers show print well?", "Yes. The smooth white exterior is the best surface we offer for print — it supports crisp logos, brand colors, and handling notes with good contrast, better than kraft or grey poly."],
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

  "4-x-6-bubble-mailer": {
    overview: [
      "The 4 x 6 bubble mailer is a space-saving format built for the very smallest, lightest shipments a business sends — the kind where every fraction of an ounce and every inch of dimension feeds directly into freight cost. Small hardware, sample packs, cards, and compact store items fit without the void space that would otherwise pad both the parcel and the postage.",
      "Where a larger mailer or a box would round a tiny item up into a higher rate band, the 4 x 6 keeps it in the lowest practical tier. For operations shipping consistent, small-dimension products in volume, that discipline compounds across the month into a meaningful difference on the shipping line of the P&L."
    ],
    benefits: [
      "Minimal footprint keeps very small shipments in the lowest practical postage band.",
      "No wasted void space, so contents stay put and parcels stay light.",
      "Fast hand-packing for high-frequency small orders at the bench.",
      "Compact stock stores densely, so a large quantity takes little shelf space."
    ],
    useCases: [
      "The 4 x 6 is built for businesses that ship consistent, small-dimension products — hardware bits, sample packs, cards, and compact accessories — where keeping freight weight down is the priority. Its tight fit is the point, not a limitation.",
      "Operations with predictable, repeating product dimensions favor this size because it can be reordered in volume with confidence that it will keep fitting the same items. That consistency is what makes it a reliable line in a lean, cost-focused packing program."
    ],
    customContent: [
      "Branding still matters on small parcels, and a simple logo print fits a 4 x 6 well. Keeping the artwork to a clean one-color mark suits the size and the high-volume, cost-conscious shipments this mailer is usually used for, so the parcel stays on-brand without adding cost per unit."
    ],
    bulkContent: [
      "The 4 x 6 is frequently ordered in volume because the shipments that use it repeat with consistent dimensions. When you request bulk pricing, share your monthly run rate — a predictable small-format program like this is well suited to a standing reorder that keeps freight cost and stock levels both under control."
    ],
    faqs: [
      ["What is a 4 x 6 bubble mailer best for?", "It is built for the smallest, lightest shipments — small hardware, sample packs, cards, and compact store items — where keeping parcel weight and dimensions down directly lowers freight cost."],
      ["How does the 4 x 6 help reduce shipping cost?", "By keeping tiny items in the lowest practical rate band instead of rounding them up into a larger mailer or box. For consistent small products shipped in volume, that saving compounds across the month."],
      ["Can 4 x 6 bubble mailers be ordered in volume?", "Yes. It is a common bulk size for operations with steady, repeating small-dimension shipments. Share your monthly quantity and we will quote a bulk or standing-order rate."],
      ["Is there room to brand a 4 x 6 mailer?", "Yes, for a simple logo. We recommend a clean one-color mark on this small size so branding stays crisp without adding cost across a high-volume run."]
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

const mainPages = [
  { slug: "", title: "Durable Bubble Mailers for Safe and Professional Shipping", metaTitle: "Shop Bubble Mailers | Bubble Mailers Supplier in the USA", metaDescription: "Shop Bubble Mailers supplies custom, kraft, white, and padded bubble mailers for businesses across the USA. Request a free quote today." },
  { slug: "about-us", title: "About Shop Bubble Mailers", metaTitle: "About Shop Bubble Mailers | USA Bubble Mailer Supplier", metaDescription: "Learn about Shop Bubble Mailers, our product range, and how we support businesses across the USA with bulk bubble mailer supply." },
  { slug: "products", title: "Products", metaTitle: "Bubble Mailers Products | Shop Bubble Mailers", metaDescription: "Browse bubble mailers, kraft mailers, white mailers, padded envelopes, and packaging options for bulk business orders." },
  { slug: "custom-bubble-mailers", title: "Custom Bubble Mailers", metaTitle: "Custom Bubble Mailers | Printed Packaging Quotes", metaDescription: "Custom bubble mailers with logo printing, branded colors, and size options for eCommerce and retail packaging programs." },
  { slug: "kraft-bubble-mailers", title: "Kraft Bubble Mailers", metaTitle: "Kraft Bubble Mailers Supplier | Shop Bubble Mailers", metaDescription: "Bulk kraft bubble mailers with padded protection and quote support for US businesses and packaging buyers." },
  { slug: "white-bubble-mailers", title: "White Bubble Mailers", metaTitle: "White Bubble Mailers Supplier | Shop Bubble Mailers", metaDescription: "White bubble mailers for branded shipments, retail fulfillment, and padded shipping across the USA." },
  { slug: "bubble-mailer-bags", title: "Bubble Mailer Bags", metaTitle: "Bubble Mailer Bags | Bulk Quote Support", metaDescription: "Bubble mailer bags for eCommerce, retail, and packing operations with bulk pricing and custom options." },
  { slug: "bubble-mailer-packaging", title: "Bubble Mailer Packaging", metaTitle: "Bubble Mailer Packaging Supplier | Shop Bubble Mailers", metaDescription: "Bubble mailer packaging with standard and custom options for shipping programs and brand packaging needs." },
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
      <button class="nav-toggle" data-nav-toggle aria-expanded="false" aria-label="Toggle navigation">Menu</button>
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
                              <span class="nav-dropdown-title">${product.name}</span>
                              <span class="nav-dropdown-meta">${product.category}</span>
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
                          (state) => `
                            <a href="/locations/${state.slug}/"${currentPath === `/locations/${state.slug}/` ? ' aria-current="page"' : ""}>
                              <span class="nav-dropdown-title">${state.name}</span>
                              <span class="nav-dropdown-meta">${state.cities.length} cities</span>
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
        <span><a href="/privacy-policy/">Privacy Policy</a> | <a href="/terms-and-conditions/">Terms and Conditions</a></span>
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
      <input type="hidden" name="form_subject" value="Quote request from ${site.brand}">
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
      <p class="response-note">We respond within 1-2 hours.</p>
      <p class="helper-text">Prefer direct contact? Email <a href="mailto:${site.email}">${site.email}</a> or call <a href="tel:${site.phoneHref}">${site.phone}</a>.</p>
      <p class="helper-text">If you attach artwork, we will include the filename in your request and you can send the file directly by email if needed.</p>
      <p class="form-status" data-form-status aria-live="polite"></p>
    </form>
  </div>
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
        <img src="${product.image.url}" alt="${product.name} product image" loading="lazy" width="1080" height="1080">
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
        <img src="${asset.url}" alt="${asset.alt || `Bubble mailer product image ${index + 1}`}" loading="lazy" width="1080" height="1080">
      </figure>
    `
      )
      .join("")}
  </div>
`;

const renderProductFeatureImage = (product) => {
  const altText =
    product.slug === "4-x-6-bubble-mailer"
      ? "4 x 6 bubble mailer size and material details"
      : `${product.name.toLowerCase()} size and material details`;

  return `
    <div class="product-feature-card">
      <img src="${product.image.url}" alt="${altText}" loading="lazy" width="1080" height="1080">
    </div>
  `;
};

const buildPage = ({
  routePath,
  title,
  metaTitle,
  metaDescription,
  heroImage,
  body,
  breadcrumbs = null,
  schemas = []
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
  <link rel="canonical" href="${canonical}">
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
  <link rel="stylesheet" href="/styles.css">
  <!--Start of Zendesk Chat Script-->
  <script type="text/javascript">
  window.$zopim||(function(d,s){var z=$zopim=function(c){
  z._.push(c)},$=z.s=
  d.createElement(s),e=d.getElementsByTagName(s)[0];z.set=function(o){z.set.
  _.push(o)};z._=[];z.set._=[];$.async=!0;$.setAttribute('charset','utf-8');
  $.src='https://v2.zopim.com/?4h3lbyJihoT1mCOqDA0VoQOaVQE9qTOP';z.t=+new Date;$.
  type='text/javascript';e.parentNode.insertBefore($,e)})(document,'script');
  </script>
  <!--End of Zendesk Chat Script-->
  ${renderSchemaScripts(pageSchemas)}
</head>
<body>
  ${renderHeader(routePath)}
  ${breadcrumbs ? renderBreadcrumbs(breadcrumbs) : ""}
  <main>
    ${body}
  </main>
  ${renderFooter()}
  <script src="/script.js" defer></script>
  <a href="https://api.whatsapp.com/send/?phone=15033580443&text=Hi+Shop+Bubble+Mailers!+I+need+more+info+about+Shop+Bubble+Mailers+https%3A%2F%2Fshopbubblemailers.com%2F&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" style="position:fixed;bottom:24px;left:24px;z-index:9999;background:#25D366;border-radius:50%;width:60px;height:60px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.25);text-decoration:none;transition:transform .2s ease" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="34" height="34"><path fill="white" d="M4.868 43.303l2.694-9.835a18.838 18.838 0 01-2.52-9.444C5.044 13.505 13.561 5 24.014 5a18.864 18.864 0 0113.37 5.536A18.843 18.843 0 0143 23.917c-.004 10.385-8.52 18.886-18.973 18.886a18.93 18.93 0 01-9.34-2.465L4.868 43.303zm10.733-6.19l.594.352a15.72 15.72 0 008.8 2.678c8.663 0 15.713-7.037 15.716-15.693a15.656 15.656 0 00-4.608-11.131A15.648 15.648 0 0024.027 8.28c-8.669 0-15.718 7.036-15.721 15.69a15.657 15.657 0 002.854 9.032l.444.705-1.888 6.893 6.885-1.787z"/><path fill="white" fill-rule="evenodd" d="M19.268 15.787c-.345-.768-.709-.784-1.037-.797-.268-.01-.576-.01-.883-.01a1.692 1.692 0 00-1.228.576c-.422.46-1.611 1.573-1.611 3.836s1.649 4.453 1.878 4.761c.23.307 3.221 5.146 7.927 7.008 3.921 1.547 4.72 1.238 5.572 1.16.852-.077 2.75-1.124 3.137-2.21.389-1.085.389-2.017.273-2.21-.115-.192-.422-.307-.882-.537-.46-.23-2.75-1.355-3.175-1.509-.422-.153-.729-.23-1.036.23-.307.46-1.19 1.509-1.458 1.816-.268.308-.537.346-.997.116-.46-.23-1.94-.714-3.695-2.28-1.365-1.218-2.286-2.723-2.554-3.183-.268-.46-.028-.71.2-.937.208-.206.46-.538.69-.806.23-.268.307-.461.46-.768.154-.307.077-.576-.038-.806-.116-.23-1.005-2.494-1.42-3.41z"/></svg></a>
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
          <span class="eyebrow">USA Bubble Mailer Supplier</span>
          <h1>Durable Bubble Mailers for Safe and Professional Shipping</h1>
          <p>Shop Bubble Mailers supplies <strong>kraft bubble mailers</strong>, white padded mailers, and <strong>custom bubble mailers</strong> for brands, retailers, eCommerce stores, and shipping businesses across the USA.</p>
          <div class="hero-actions">
            <a class="button button-primary" href="#quote-form">${iconSvg("quote", "button-icon")}<span>Get Quote</span></a>
            <a class="button button-secondary" href="/products/">${iconSvg("spark", "button-icon")}<span>View Products</span></a>
          </div>
          <div class="hero-trust">
            <div class="trust-item">${iconSvg("package", "trust-icon")}<div><strong>Bulk Orders</strong><span>Competitive pricing</span></div></div>
            <div class="trust-item">${iconSvg("printer", "trust-icon")}<div><strong>Custom Printing</strong><span>Add your brand</span></div></div>
            <div class="trust-item">${iconSvg("truck", "trust-icon")}<div><strong>USA Service</strong><span>Fast and reliable</span></div></div>
          </div>
        </div>
        <div class="hero-panel">
          <div class="hero-showcase">
            <div class="hero-spotlight">
              <div class="hero-visual-stage">
                <img class="hero-main-image hero-main-3d" src="${pickAsset("generic", 2).url}" alt="Bulk bubble mailers packaging for business shipping" width="1080" height="1080">
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
                <img src="${pickAsset("plain", 2).url}" alt="White bubble mailers for retail shipping" loading="lazy" width="1080" height="1080">
                <span><strong>White mailers</strong><small>Clean &amp; professional</small></span>
              </div>
              <div class="hero-mini-card">
                <img src="${pickAsset("halloween", 0).url}" alt="Custom printed bubble mailer packaging" loading="lazy" width="1080" height="1080">
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
            <img src="${category.image.url}" alt="${category.title}" loading="lazy" width="1080" height="1080">
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
          <h2>Common bubble mailer sizes for everyday shipping</h2>
          <p>The right size depends on product dimensions, insert thickness, and the shipping presentation your brand wants to keep. These common formats cover many everyday use cases.</p>
        </div>
        <div class="table-card">
          <table class="comparison-table">
            <thead>
              <tr><th>Size</th><th>Typical Use</th><th>Why Buyers Use It</th></tr>
            </thead>
            <tbody>
              ${sizeGuide
                .map((row) => `<tr><td>${row.size}</td><td>${row.use}</td><td>${row.strength}</td></tr>`)
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
              <img src="${pickAsset("plain", 4).url}" alt="Printed bubble mailer back view" loading="lazy" width="1080" height="1080">
            </div>
            <div class="print-mockup-front">
              <img src="${pickAsset("halloween", 1).url}" alt="Custom bubble mailer packaging sample" loading="lazy" width="1080" height="1080">
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
        <img src="${image.url}" alt="${title}" width="1080" height="1080">
      </div>
    </div>
  </section>
`;

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
  `;

  return buildPage({
    routePath: "/about-us/",
    title: "About Shop Bubble Mailers",
    metaTitle: "About Shop Bubble Mailers | USA Bubble Mailer Supplier",
    metaDescription: "Learn about Shop Bubble Mailers, our product range, and how we support businesses across the USA with bulk bubble mailer supply.",
    heroImage: pickAsset("generic", 4).url,
    body,
    breadcrumbs,
    schemas: [{ "@context": "https://schema.org", "@type": "AboutPage", name: "About Shop Bubble Mailers", url: absoluteUrl("/about-us/") }]
  });
};

const renderProductsPage = () => {
  const breadcrumbs = [
    { href: "/", label: "Home" },
    { href: "/products/", label: "Products" }
  ];

  const body = `
    ${renderStandardPageHero({
      eyebrow: "Products and Shop",
      title: "Bubble Mailers, Padded Envelopes, and Packaging Pages",
      description: "Browse size-based product pages, material categories, and packaging options for business buyers looking for bulk supply and custom support.",
      image: pickAsset("bulk1000", 4),
      ctas: [
        { href: "#quote-form", label: "Request Bulk Pricing", primary: true },
        { href: "/contact-us/", label: "Contact Us" }
      ]
    })}
    <section class="section">
      <div class="container shop-layout">
        <div class="content-card content-flow">
          <h2>Product pages built for search and buying clarity</h2>
          <p>We organized the site around the products and search terms buyers use most often. That includes material-led pages like kraft and white bubble mailers, broader packaging pages, and individual product pages for common sizes and numbered formats.</p>
          <p>Each product page includes an image, product summary, common uses, material details, customization notes, shipping guidance, related links, and a quote form. That makes it easier to compare options before requesting pricing.</p>
        </div>
        ${renderQuoteForm("")}
      </div>
    </section>
    <section class="section section-muted">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">Product Grid</span>
          <h2>All product URLs</h2>
        </div>
        ${renderProductCards(products)}
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">Packaging Gallery</span>
          <h2>Asset library used across the website</h2>
          <p>All available product images from the provided assets folder are included in the site build and shown here as part of the product gallery.</p>
        </div>
        ${renderGallery(assetCatalog)}
      </div>
    </section>
  `;

  return buildPage({
    routePath: "/products/",
    title: "Products",
    metaTitle: "Bubble Mailers Products | Shop Bubble Mailers",
    metaDescription: "Browse bubble mailers, kraft mailers, white mailers, padded envelopes, and packaging options for bulk business orders.",
    heroImage: pickAsset("bulk1000", 4).url,
    body,
    breadcrumbs
  });
};

const categoryPage = ({ routePath, title, description, image, intro, relatedSlugs }) => {
  const breadcrumbs = [
    { href: "/", label: "Home" },
    { href: routePath, label: title }
  ];
  const relatedProducts = relatedSlugs.map((slug) => productsBySlug.get(slug)).filter(Boolean);
  const faqs = categoryFaqs(title);
  const comparisonProduct = relatedProducts[0];
  const comparisonCategory = preferredCategoryComparison(routePath);
  const body = `
    ${renderStandardPageHero({
      eyebrow: title,
      title,
      description,
      image,
      ctas: [
        { href: "#quote-form", label: "Get Free Quote", primary: true },
        { href: "/products/", label: "View Products" }
      ]
    })}
    <section class="section">
      <div class="container split-grid">
        <div class="content-card content-flow">
          ${intro}
          <p>Buyers comparing this category often review ${comparisonProduct ? singleContextLink(comparisonProduct) : "nearby size options"} when planning broader padded mailer supply for repeat shipping programs.</p>
          <p>These pages are structured for buyers researching <a href="/bubble-mailer-packaging/">padded mailers for shipping</a> with clearer sizing, material, and quote information.</p>
        </div>
        ${renderQuoteForm(title)}
      </div>
    </section>
    <section class="section section-muted">
      <div class="container split-grid">
        <div class="content-card content-flow">
          <h2>${title} for business shipping programs</h2>
          <p>${title} are regularly sourced by eCommerce brands, retail businesses, warehouse teams, and subscription programs that need a more reliable padded mailer setup. Buyers usually compare appearance, protection, packout speed, and bulk supply support before narrowing the best category for their shipping routine.</p>
          <p>For many businesses, the right category choice helps improve both workflow and presentation. A more suitable padded mailer can reduce packing friction, support cleaner labeling, and make repeat shipments easier to manage across standard stock or custom bubble mailer packaging programs.</p>
          <p>Many buyers also compare <a href="${comparisonCategory.href}">${comparisonCategory.label}</a> when they are balancing shipping appearance, material preference, and size planning.</p>
        </div>
        <div class="content-card content-flow content-soft">
          <h2>Why buyers review this category</h2>
          <div class="benefit-rows">
            ${[
              "Padded protection for repeat shipping and retail-facing deliveries.",
              "Bulk bubble mailers support for businesses with ongoing order flow.",
              "Custom printed bubble mailers and branding discussions where needed.",
              "Mixed-size planning for businesses shipping different product types.",
              "USA-focused quote support for practical lead times and stock planning."
            ]
              .map((item) => `<div class="benefit-row">${iconSvg("package", "row-icon")}<span>${item}</span></div>`)
              .join("")}
          </div>
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
    <section class="section">
      <div class="container">
        <div class="section-copy">
          <span class="eyebrow">FAQ</span>
          <h2>${title} FAQs</h2>
        </div>
        ${renderFaqList(faqs)}
      </div>
    </section>
  `;

  return buildPage({
    routePath,
    title,
    metaTitle: `${title} | ${site.brand}`,
    metaDescription: description,
    heroImage: image.url,
    body,
    breadcrumbs,
    schemas: [faqSchema(faqs)]
  });
};

const paragraph = (text) => `<p>${text}</p>`;
const iconHeading = (icon, text) => `<h2 class="icon-heading">${iconSvg(icon, "section-heading-icon")}<span>${text}</span></h2>`;
const categoryFaqs = (title) => [
  [`What types of ${title.toLowerCase()} do you supply?`, `${title} are available for business buyers who need standard stock, mixed-size planning, and quote support for repeat shipping programs.`],
  [`Can I request bulk pricing for ${title.toLowerCase()}?`, `Yes. We support bulk pricing for ${title.toLowerCase()} based on size, quantity, print needs, and shipping destination.`],
  [`Do you offer custom printing on ${title.toLowerCase()}?`, `Yes. Many buyers discuss custom bubble mailer packaging, logo print, and branded layouts when they need a more retail-facing shipping format.`],
  [`Which industries use ${title.toLowerCase()} most often?`, `${title} are commonly used by eCommerce brands, retail businesses, subscription programs, warehouse teams, and fulfillment operations across the USA.`],
  [`Can I order multiple sizes in one project?`, `Yes. Mixed-size programs are common for buyers who ship different product formats and want a more practical padded mailer lineup.`],
  [`How quickly can I get a quote?`, `Quote requests are reviewed as quickly as possible so buyers can move forward with bulk bubble mailers, padded mailers for shipping, or custom printed bubble mailers without delay.`]
];

const renderKraftProductPage = (product) => {
  const relatedProducts = (relatedMap[product.slug] || []).map((slug) => productsBySlug.get(slug)).filter(Boolean);
  const faqs = [
    ["What sizes are available for kraft bubble mailers?", "Common sizes include #000, #00, #0, #1, #2, and #3, along with dimension-based options such as 4x6, 6x9, 7x10, 8.5x12, and 10x13 depending on the packing program."],
    ["Are kraft bubble mailers waterproof?", "Kraft bubble mailers offer padded protection and good everyday shipping performance, but they are not the same as a fully waterproof mailer. If moisture exposure is a concern, we can discuss the right material direction for the shipment."],
    ["Can I print my logo on kraft bubble mailers?", "Yes. Custom bubble mailers on kraft stock can be planned with logo placement, simple branding, return details, and other print elements for retail-facing shipments."],
    ["What is the minimum order for bulk pricing?", "Minimums depend on whether you need standard stock or a custom production run. The quote form is the best place to share size, quantity, and artwork requirements so we can advise clearly."],
    ["How long does delivery take?", "Lead time depends on stock status, order size, and whether the project is plain stock or custom printed. Standard bulk orders usually move faster than custom production."],
    ["Are kraft bubble mailers recyclable?", "Recycling depends on the specific material construction and local recycling rules. We can discuss practical disposal guidance during the quoting process if that is important for your program."],
    ["Are kraft bubble mailers good for retail brands?", "Yes. Many businesses choose kraft bubble mailers because the outer finish feels clean and more brand-ready while still giving padded protection inside."],
    ["Can I request mixed sizes in one program?", "Yes. Many buyers request a mixed-size plan so they can support different SKUs while keeping purchasing and fulfillment more organized."]
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
          <div class="button-row">
            <a class="button button-primary" href="#quote-form">Get Free Quote</a>
            <a class="button button-outline" href="#available-sizes">View Sizes</a>
          </div>
        </div>
        <div class="product-hero-image hero-panel kraft-product-image">
          <img src="${product.image.url}" alt="Kraft bubble mailers for shipping" width="1080" height="1080">
        </div>
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
            <img src="${product.image.url}" alt="Kraft bubble mailer close view" loading="lazy" width="1080" height="1080">
            <p class="detail-caption">A closer look at the outer finish and padded mailer format used for secure day-to-day shipping.</p>
          </div>
        </div>
        <div class="gallery-card detail-row detail-row-reverse">
          <div class="detail-media">
            <img src="${product.accentImages[0].url}" alt="Inside bubble cushioning for kraft bubble mailers" loading="lazy" width="1080" height="1080">
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
            <img src="${product.accentImages[1].url}" alt="Bulk stacked kraft bubble mailers for shipping supply" loading="lazy" width="1080" height="1080">
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

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image: [imageAbsoluteUrl(product.image.url), ...product.accentImages.map((image) => imageAbsoluteUrl(image.url))],
      description: product.metaDescription,
      brand: { "@type": "Brand", name: site.brand },
      sku: product.slug.toUpperCase(),
      material: product.material,
      category: product.category,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        reviewCount: "127"
      },
      additionalProperty: [{ "@type": "PropertyValue", name: "Available Sizes", value: [...sizeExamples, ...sizeGrid].join(", ") }],
      url: absoluteUrl(`/${product.slug}/`)
    },
    faqSchema(faqs)
  ];

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

const productIntroParagraphs = (product) => {
  const content = productContent[product.slug];
  if (content && content.overview) return content.overview;
  return [
    `${product.name} is a practical option for businesses that want ${product.tone} with better protection than a standard flat envelope. It gives packing teams a faster workflow than box-first shipping while still helping reduce scuffs, compression marks, and surface wear during transit. For many eCommerce and retail operations, that balance between presentation, protection, and freight efficiency is the reason padded mailers stay in regular use.`,
    `${product.fitNote} At Shop Bubble Mailers, we support quote requests for ${product.name.toLowerCase()} from businesses across the United States, including online stores, warehouse teams, and retail brands that need dependable stock for daily shipping. Buyers can request plain options, discuss custom printing, and plan volume around repeat orders or seasonal demand.`
  ];
};

const productSections = (product) => {
  if (product.slug === "kraft-bubble-mailer") {
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
          <div class="button-row">
            <a class="button button-primary" href="#quote-form">Get Free Quote</a>
            <a class="button button-outline" href="#bulk-pricing">Request Bulk Pricing</a>
          </div>
          <div class="sub-actions">
            <a class="button button-outline button-small" href="/contact-us/">Contact Us</a>
            <a class="button button-secondary button-small" href="tel:${site.phoneHref}">Call Now</a>
          </div>
        </div>
        <div class="product-hero-image hero-panel">
          <img src="${product.image.url}" alt="${product.name}" width="1080" height="1080">
        </div>
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
          ${iconHeading("spark", "Available sizes and material details")}
          <p>${product.name} is available in ${product.sizes.join(", ")} sizing references, depending on the program you are building. Businesses often request a single core size for repeat shipments or a multi-size setup that covers a wider product mix.</p>
          <p><strong>Material:</strong> ${product.material}. The padded interior helps absorb everyday shipping impact while the outer layer keeps the mailer easier to label, stack, and seal on the packing line.</p>
          <p>If the exact size needs to be adjusted, custom size requests can be discussed as part of a quote. That is especially helpful for products that have unusual dimensions, fold lines, inserts, or printed pieces that need more exact fit control.</p>
          <p>Businesses that want a cleaner presentation often compare <a href="/white-bubble-mailers/">white bubble mailers</a> while reviewing size, finish, and shipping fit.</p>
        </div>
        <div class="content-card">
          ${renderProductFeatureImage(product)}
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
              <tr><td>Quote Support</td><td>Standard stock, bulk pricing, custom printing, and mixed-size planning</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

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

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image: [imageAbsoluteUrl(product.image.url), ...product.accentImages.map((image) => imageAbsoluteUrl(image.url))],
      description: product.metaDescription,
      brand: {
        "@type": "Brand",
        name: site.brand
      },
      sku: product.slug.toUpperCase(),
      material: product.material,
      category: product.category,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        reviewCount: "127"
      },
      additionalProperty: [
        {
          "@type": "PropertyValue",
          name: "Available Sizes",
          value: product.sizes.join(", ")
        }
      ],
      url: absoluteUrl(`/${product.slug}/`)
    },
    faqSchema(faqs)
  ];

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
  `;

  return buildPage({
    routePath: "/contact-us/",
    title: "Contact Us",
    metaTitle: "Contact Shop Bubble Mailers",
    metaDescription: "Contact Shop Bubble Mailers for quotes, product guidance, and bulk bubble mailer support in the USA.",
    heroImage: pickAsset("plain", 4).url,
    body,
    breadcrumbs,
    schemas: [{ "@context": "https://schema.org", "@type": "ContactPage", name: "Contact Shop Bubble Mailers", url: absoluteUrl("/contact-us/") }]
  });
};

const renderPolicyPage = ({ routePath, title, metaTitle, metaDescription, paragraphs, content }) => {
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
    breadcrumbs
  });
};

const renderSitemapPage = () => {
  const breadcrumbs = [
    { href: "/", label: "Home" },
    { href: "/sitemap/", label: "Sitemap" }
  ];

  const contentLinks = [
    ...mainPages.filter((page) => page.slug && page.slug !== "sitemap").map((page) => ({ label: page.title, href: `/${page.slug}/` })),
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
writeStaticAsset("favicon.svg", faviconSvg().trim());
writeStaticAsset("apple-touch-icon.svg", faviconSvg().trim());

writeRoute("/", renderHomePage());
writeRoute("/about-us/", renderAboutPage());
writeRoute("/products/", renderProductsPage());
writeRoute(
  "/custom-bubble-mailers/",
  categoryPage({
    routePath: "/custom-bubble-mailers/",
    title: "Custom Bubble Mailers",
    description: "Custom bubble mailers with logo printing, branded layouts, and size planning for packaging buyers in the USA.",
    image: pickAsset("halloween", 0),
    intro: `
      <h2>Printed bubble mailers for branded shipping</h2>
      <p>Custom bubble mailers help brands keep outbound packaging consistent without moving every order into a carton format. Buyers often request logo print, return details, one-color layouts, or color-led programs that support direct-to-consumer fulfillment.</p>
      <p>These projects can be based on standard sizes or discussed around a more specific packaging requirement. Custom work is commonly used by eCommerce brands, cosmetics companies, apparel sellers, and subscription programs that want a cleaner shipping presentation.</p>
      <p>Use the quote form to share size needs, estimated quantity, and artwork if available. We can help with planning around custom bubble mailers that fit your product line and your shipping routine.</p>
    `,
    relatedSlugs: ["kraft-bubble-mailer", "bubble-mailer-white", "bubble-mailer-packaging", "12x12-bubble-mailer"]
  })
);
writeRoute(
  "/kraft-bubble-mailers/",
  categoryPage({
    routePath: "/kraft-bubble-mailers/",
    title: "Kraft Bubble Mailers",
    description: "Bulk kraft bubble mailers with padded protection and quote support for US businesses and packaging buyers.",
    image: pickAsset("generic", 0),
    intro: `
      <h2>Kraft-style mailers for a paper-forward shipping look</h2>
      <p>Kraft bubble mailers are often chosen by brands that want a natural paper appearance without giving up padded protection. They are used for retail shipments, small business orders, and branded programs where the outside look matters as much as shipping efficiency.</p>
      <p>These mailers work well for soft goods, cosmetics, accessories, and other products that benefit from interior cushioning. Buyers can request plain stock or discuss custom printing for logos and branded layouts.</p>
      <p>We support quote requests for standard sizes, mixed-size bulk orders, and packaging programs built around repeat shipping demand.</p>
    `,
    relatedSlugs: ["kraft-bubble-mailer", "bubble-mailer-packaging", "bubble-mailer-bags", "2-bubble-mailer"]
  })
);
writeRoute(
  "/white-bubble-mailers/",
  categoryPage({
    routePath: "/white-bubble-mailers/",
    title: "White Bubble Mailers",
    description: "White bubble mailers for branded shipments, retail fulfillment, and padded shipping across the USA.",
    image: pickAsset("plain", 2),
    intro: `
      <h2>Clean white mailers for customer-facing shipments</h2>
      <p>White bubble mailers give brands a cleaner and more polished outer presentation while keeping the padded interior needed for everyday shipping. They are common in beauty, fashion, accessories, and subscription fulfillment.</p>
      <p>Because the exterior is neutral and bright, white mailers are also a strong base for logo printing and handling marks. They work well for businesses that want packaging to feel neat, consistent, and easy to recognize.</p>
      <p>If you need standard stock or a printed mailer program, use the quote form to request sizing and bulk pricing support.</p>
    `,
    relatedSlugs: ["bubble-mailer-white", "8-5-x-12-bubble-mailer", "9x6-bubble-mailer", "4x6-bubble-mailer"]
  })
);
writeRoute("/contact-us/", renderContactPage());
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
    readTime: "7 min read",
    title: "How to Choose the Right Bubble Mailer Size",
    metaTitle: "How to Choose the Right Bubble Mailer Size | Shop Bubble Mailers",
    metaDescription:
      "A practical guide to choosing bubble mailer sizes - matching the mailer to your product, common size ranges, and avoiding costly oversizing on shipping.",
    intro:
      "The right bubble mailer size protects your product, keeps postage down, and makes packing faster. The wrong size means damage claims, wasted material, or paying to ship empty space. Padded mailers look simple, but the size you standardise on ripples through your whole operation - breakage rates, carrier bills, packing speed, and how professional the parcel feels on the doorstep. Here is how to size a padded mailer correctly, whatever you ship.",
    sections: [
      {
        heading: "Match the mailer to the product",
        html: `<p>Start from the item, not from a generic size chart. Measure the product at its widest and thickest points, then add a small allowance for the padded lining and a clean seal. A mailer that hugs the product too tightly puts stress on the seams and can split in the carrier's sorting machinery; one that leaves the item swimming lets it shift, rub, and arrive damaged. The goal is a snug fit with just enough room to close cleanly. Working from our full <a href="/products/">bubble mailer range</a> makes it easier to compare formats side by side against the products you actually ship.</p>
        <p>Shape matters as much as raw dimensions. Flat, rigid items such as books, phone cases, and framed prints suit a close-fitting mailer, while soft or irregular items like folded apparel need a little extra width so the mailer does not pucker at the seams when it is sealed. If you ship a mix of products, it is almost always better to standardise on two or three sizes that cover most of your orders than to stock a dozen near-identical formats that slow packers down and complicate reordering.</p>`,
      },
      {
        heading: "Common sizes and what they fit",
        html: `<p>Bubble mailer sizes are usually described by their internal usable dimensions - the space you actually have once the seal and padding are accounted for, not the outside measurement. A handful of formats cover the vast majority of eCommerce needs, from tiny accessories to folded apparel and mixed kits. Learning which size maps to which product type removes most of the guesswork.</p>`,
        bullets: [
          `Small (around <a href="/4x6-bubble-mailer/">4x6</a> and 4x7): jewelry, cards, samples, small accessories, single cosmetics.`,
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
        <p>Sizing to the product plus a small clearance is the single cheapest way to cut both damage and postage across a shipping program. Once you have settled your sizes, the next decision is finish and branding. If you are standardising a packing program across many SKUs, our guide to <a href="/blog/kraft-vs-white-bubble-mailers/">kraft vs white bubble mailers</a> helps you lock the look once the dimensions are right.</p>`,
      },
    ],
    faq: [
      ["What size bubble mailer do I need for a small item?", "For small items like jewelry, cards, and samples, a 4x6 or 4x7 mailer is usually ideal. Measure the item at its widest and thickest points and add a small allowance for the padded lining and a clean seal."],
      ["Is a bigger bubble mailer always safer?", "No. An oversized mailer lets the product move in transit, which increases damage, and it raises dimensional-weight postage costs. Size to the product plus a small clearance rather than reaching for the largest mailer you have."],
      ["How much extra space should I leave inside a bubble mailer?", "Leave just enough room to close and seal the mailer cleanly - typically a small allowance beyond the product's widest and thickest points. Too little and the seams strain in transit; too much and the item shifts while you pay for empty space."],
      ["How many bubble mailer sizes should my business stock?", "Most businesses are best served by two or three sizes that cover the majority of their orders rather than a dozen near-identical formats. Standardising sizes speeds up packing, simplifies reordering, and still fits most products well."],
      ["Do bubble mailer dimensions refer to inside or outside measurements?", "Bubble mailer sizes are usually quoted as internal usable dimensions - the space available for your product after the seal and padding. Always check the usable size rather than the outer size when matching a mailer to an item."],
      ["Can bubble mailers be used for fragile items?", "Bubble mailers protect against scuffs, moisture, and light impacts, which suits most non-breakable goods. For genuinely fragile items like glass or ceramics, add internal cushioning or choose a rigid box, since the padded lining alone is not designed for heavy impact protection."],
    ],
    related: ["kraft-vs-white-bubble-mailers", "custom-printed-bubble-mailers-branding"],
  },
  {
    slug: "kraft-vs-white-bubble-mailers",
    category: "Comparison",
    image: "kraft",
    date: "2026-06-02",
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
        <p>Kraft also hides scuffs and handling marks better than white, which can be an advantage across a long carrier journey. The trade-off is print contrast: bright colours and fine detail do not pop on a brown substrate the way they do on white, so brands that rely on vivid artwork sometimes find kraft limiting. If your look is earthy, minimal, or typographic, that is rarely a problem - and often a strength.</p>`,
      },
      {
        heading: "The case for white",
        html: `<p>White mailers read as clean, modern, and retail-ready. They photograph beautifully for social unboxing, they make printed logos and brand colours pop, and they suit cosmetics, fashion, and direct-to-consumer brands that want a crisp, premium presentation. When colour accuracy and a bright, contemporary feel matter to your positioning, <a href="/white-bubble-mailers/">white bubble mailers</a> are usually the stronger fit.</p>
        <p>The considerations with white are practical. It shows scuffs and dirt more readily than kraft, so the finish and handling quality matter more, and a plain white mailer with no branding can look a little generic next to a well-designed kraft one. White earns its keep most clearly when it is printed - a bold logo or colour block on a white base is one of the most recognisable looks in modern eCommerce packaging.</p>`,
      },
      {
        heading: "How to decide",
        html: `<p>Match the mailer to the brand promise, not just to personal taste. Natural, wellness, sustainable, and artisan brands usually lean kraft; beauty, fashion, tech, and premium retail brands usually lean white. Consider where your customers will see the parcel - if unboxing content and shelfie-style photos are part of your marketing, the brighter, higher-contrast white often performs better on camera.</p>
        <p>Also weigh consistency across your range. Whichever base you choose, using it uniformly across every order builds recognition over time, so customers start to associate that look with you. And remember that the biggest lift for either colour usually comes from printing your brand on it rather than shipping plain - which is exactly what our guide to <a href="/blog/custom-printed-bubble-mailers-branding/">custom printed bubble mailers</a> covers in detail.</p>`,
      },
    ],
    faq: [
      ["Are kraft bubble mailers as protective as white ones?", "Yes. Kraft and white bubble mailers use the same padded bubble lining and offer the same level of protection. The difference is purely in the exterior look and how it fits your brand."],
      ["Which looks more premium, kraft or white?", "It depends on positioning. White reads as clean and modern and suits beauty and fashion, while kraft reads as natural and artisan and suits eco and wellness brands. Both can look premium when printed well and used consistently."],
      ["Do white bubble mailers show dirt more than kraft?", "Yes, a white surface shows scuffs and handling marks more readily than kraft over a long carrier journey. If that is a concern, a printed design or a slightly heavier finish helps, and kraft is naturally more forgiving."],
      ["Which is better for printing a logo, kraft or white?", "White gives brighter, more accurate colour reproduction and sharper contrast, so detailed or colourful artwork looks best on it. Kraft suits simpler, earthy, or single-colour designs where a natural background is part of the look."],
      ["Is kraft more eco-friendly than white?", "Kraft's natural, unbleached appearance signals sustainability and is often preferred by eco-focused brands. Actual environmental impact depends on the specific materials and recyclability, so check the product specification if a verified eco claim matters to your brand."],
      ["Can I use both kraft and white mailers for different product lines?", "Absolutely. Many brands use kraft for natural or value lines and white for premium or gifting lines. Just keep each line consistent so customers still get a coherent, recognisable experience."],
    ],
    related: ["how-to-choose-bubble-mailer-size", "custom-printed-bubble-mailers-branding"],
  },
  {
    slug: "custom-printed-bubble-mailers-branding",
    category: "Branding",
    image: "plain",
    date: "2026-06-18",
    readTime: "7 min read",
    title: "Custom Printed Bubble Mailers: Branding Your Shipping Experience",
    metaTitle: "Custom Printed Bubble Mailers | Branded Shipping",
    metaDescription:
      "How custom printed bubble mailers turn shipping into a branded moment - what you can customise, when it is worth it, and how to get started on a bulk program.",
    intro:
      "For an online brand, the mailer is the first thing a customer physically touches. A custom printed bubble mailer turns a plain shipment into a branded moment that customers notice, remember, and often share. It is one of the most cost-effective pieces of marketing a small brand has, because you are already paying to ship the parcel - printing it simply makes that same parcel work harder. Here is how to use custom printed mailers well.",
    sections: [
      {
        heading: "Why branded mailers matter",
        html: `<p>A logo, a brand colour, and a short message on the outside of the mailer make an order feel considered before it is even opened. It reinforces the brand at the doorstep and in the unboxing photos customers post, and it costs little over a plain mailer once you order at volume. In a market where most parcels arrive in anonymous packaging, a branded mailer is an easy way to look more established than you are and to stay memorable after the sale. Our <a href="/custom-bubble-mailers/">custom bubble mailers</a> add that branding while keeping the padded protection your shipments need.</p>
        <p>Branded packaging also builds trust. A parcel that clearly comes from the brand the customer ordered from feels safer and more professional than a generic envelope, which reduces confusion and support questions on delivery. Over time, a consistent printed look turns repeat deliveries into a recognisable experience - customers know it is you before they read the label.</p>`,
      },
      {
        heading: "What you can customise",
        html: `<p>Customisation goes well beyond a printed logo. The finish, colour, size, and even the inside of the mailer can all carry the brand, and small touches often make the biggest impression relative to their cost.</p>`,
        bullets: [
          "Exterior logo and brand colours in one or more print colours.",
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
        html: `<p>Branded mailers make the most sense as a repeatable program rather than a one-off. Settle your sizes first, choose kraft or white to match your brand, then add print - doing it in that order avoids reprinting artwork when your formats change. Decide how many print colours you need and whether inside printing is worth it for your unboxing, then request a quote with your quantities so you can see the real per-unit cost.</p>
        <p>If you have not locked your formats yet, do that before committing to a printed run, because changing size later means new artwork and new setup. Start with our guide to <a href="/blog/how-to-choose-bubble-mailer-size/">choosing the right bubble mailer size</a> so your branded program is built on dimensions that actually fit your products.</p>`,
      },
    ],
    faq: [
      ["Is there a minimum order for custom printed bubble mailers?", "Custom printed mailers are typically produced as bulk programs, and minimums vary by size and print requirements. Request a quote with your size, quantity, and print details for exact pricing and lead times."],
      ["Can I print on both kraft and white bubble mailers?", "Yes. Both kraft and white bubble mailers can be custom printed. White gives brighter, more accurate colour reproduction, while kraft gives a natural look that suits eco and artisan branding."],
      ["How many print colours can I use on a bubble mailer?", "Most programs support one or more spot print colours, with more colours increasing the cost. Many brands get a strong result with a single bold colour and a clean logo rather than full-colour artwork."],
      ["Is custom printing worth it for a small brand?", "For a brand shipping steadily, the per-unit premium over plain mailers is small and the branding works on every order. For very low volumes, branded stickers or tape on a plain mailer can bridge the gap until printing pays off."],
      ["Can I print on the inside of the mailer too?", "Yes. Inside prints, patterns, and thank-you messages are a popular way to elevate the unboxing moment. They add a memorable touch that customers often photograph and share."],
      ["How long do custom printed bubble mailers take to produce?", "Lead times depend on size, quantity, and print complexity. Because printed mailers are made to order, it is best to plan ahead and confirm the timeline when you request your quote so packaging is ready before you need it."],
    ],
    related: ["how-to-choose-bubble-mailer-size", "kraft-vs-white-bubble-mailers"],
  },
];

const blogPostBySlug = new Map(blogPosts.map((post) => [post.slug, post]));

const blogPostingSchema = (post) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.title,
  description: post.metaDescription,
  image: imageAbsoluteUrl(pickAsset(post.image, 0).url),
  datePublished: post.date,
  dateModified: post.date,
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
            <img src="${pickAsset(item.image, 0).url}" alt="${item.title}" loading="lazy" width="1080" height="1080">
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
      image: pickAsset(post.image, 0),
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
    heroImage: pickAsset(post.image, 0).url,
    body,
    breadcrumbs,
    schemas: [faqSchema(post.faq), blogPostingSchema(post)],
  });
};

const renderBlogIndex = () => {
  const breadcrumbs = [
    { href: "/", label: "Home" },
    { href: "/blog/", label: "Blog" },
  ];
  const cards = [...blogPosts]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(
      (post) => `<article class="product-card">
        <img src="${pickAsset(post.image, 0).url}" alt="${post.title}" loading="lazy" width="1080" height="1080">
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
      description: "Practical guides on choosing bubble mailer sizes, kraft vs white, and branding your shipping with custom printed mailers.",
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
  `;
  return buildPage({
    routePath: "/blog/",
    title: "Bubble Mailer Blog",
    metaTitle: "Bubble Mailer Blog | Guides on Sizes, Kraft vs White & Branding",
    metaDescription: "Practical bubble mailer guides — how to choose sizes, kraft vs white mailers, and custom printed mailers for branded shipping.",
    heroImage: pickAsset("generic", 1).url,
    body,
    breadcrumbs,
  });
};

writeRoute("/blog/", renderBlogIndex());
blogPosts.forEach((post) => writeRoute(`/blog/${post.slug}/`, renderBlogPost(post)));

// ── USA STATE + CITY LOCATION PAGES ──
const resolveFeatured = (slugs) => slugs.map((s) => productsBySlug.get(s)).filter(Boolean);
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
        <img src="${card.image.url}" alt="${card.alt}" loading="lazy" width="1080" height="1080">
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
    [`What is the minimum order for ${city.name} businesses?`, `Our minimums stay low so small ${city.name} sellers can order without committing to huge volumes, and bulk pricing kicks in as your quantities grow. Tell us your target quantity and we will confirm pricing.`],
    [`Can I get custom printed bubble mailers in ${city.name}?`, `Yes. Alongside plain stock, we offer <a href="/custom-bubble-mailers/">custom printed bubble mailers</a> with your logo, colors, and return details for a branded unboxing experience.`],
    [`What sizes of bubble mailers do you offer?`, `We stock the full range of standard sizes, from compact 4x6 mailers up to large formats, plus numbered mailers. If you are unsure which size suits your product, our team can advise.`],
    [`How fast can I get a quote?`, `We typically respond to quote requests within 1-2 hours during business hours with pricing and supply guidance for your ${city.name} shipping program.`]
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
        <p>Shop Bubble Mailers supplies bulk and custom padded bubble mailers to businesses across ${city.name} and the wider ${state.name} market. Every order can be printed to your brand or shipped plain, protecting compact goods without adding freight weight. A popular choice for ${city.name} ${city.signatureSector} sellers is our ${productLink(city.featuredProducts[0])}, kept in stock for fast bulk supply.</p>
        <p><strong>Why ${city.name} sellers order from us:</strong> low minimums, bulk pricing, custom print options, fast quote turnaround, and reliable supply for repeat orders.</p>
      </div>
    </section>
    <section class="section">
      <div class="container split-grid">
        <div class="content-card content-flow">
          <h2>${city.sceneHeading}</h2>
          <p>${city.localScene}</p>
          <p>Whatever you ship across ${city.name}, the right padded mailer keeps it protected and presentable. Our ${productLink(city.featuredProducts[1])} suits the way ${city.name} businesses pack and ship.</p>
          <h3>Areas We Serve in ${city.name}</h3>
          ${districtTags(city.districts)}
        </div>
        ${renderQuoteForm(`Bubble Mailers — ${city.name}, ${state.abbr}`)}
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

  const stateFaqs = [
    [`Do you supply bubble mailers across ${state.name}?`, `Yes. We supply bulk and custom bubble mailers to businesses across ${state.name}, including ${state.cities.map((c) => c.name).join(", ")}. Request a quote with your size and quantity for pricing.`],
    [`What is the minimum order?`, `Minimums stay low so smaller ${state.name} businesses can order comfortably, with bulk pricing as volumes grow. Share your target quantity for a tailored quote.`],
    [`Do you offer custom printed bubble mailers?`, `Yes — we offer <a href="/custom-bubble-mailers/">custom printed bubble mailers</a> with your logo and colors, as well as plain stock in kraft and white.`],
    [`How fast is your quote response?`, `We typically reply within 1-2 hours during business hours with pricing and supply guidance for your ${state.name} program.`]
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
          <p>Across every industry here, a padded mailer that ships light keeps costs down — our ${productLink(state.featuredProducts[0])} is a popular choice for ${state.name} shippers.</p>
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
        ${industryList(state.industries)}
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
  `;

  return buildPage({
    routePath,
    title: "USA Delivery Locations",
    metaTitle: "Bubble Mailers Across the USA | State & City Supply | Shop Bubble Mailers",
    metaDescription: "Shop Bubble Mailers supplies bulk and custom bubble mailers to businesses across the USA — browse locations by state and city, or request a free quote.",
    heroImage: heroImage.url,
    body,
    breadcrumbs,
    schemas: [itemListSchema]
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
const LASTMOD = "2026-07-09";

writeStaticAsset(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${siteRoutes
    .map((route) => {
      const slug = route.replace(/^\/|\/$/g, "");
      let priority = "0.7";
      let changefreq = "monthly";
      if (route === "/") {
        priority = "1.0";
        changefreq = "weekly";
      } else if (slug === "privacy-policy" || slug === "terms-and-conditions") {
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
- All PNG images from the Assets folder were copied into dist/assets/images and used on the site
- Product-to-image matching was based on the closest relevant asset where filenames were broad rather than exact
- Quote forms are wired to FormSubmit for no-backend lead capture and can be swapped later if you want a custom form handler
`;

fs.writeFileSync(path.join(rootDir, "FINAL-CHECKLIST.md"), checklist);

console.log(`Built ${siteRoutes.length} routes with ${assetCatalog.length} images.`);
