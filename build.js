const fs = require("fs");
const path = require("path");

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
  formAction: "https://formsubmit.co/Info@shopbubblemailers.com",
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

const productFaqTemplates = (product) => [
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
  { href: "/bubble-mailer-packaging/", label: "Packaging" }
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
          .map((link) => `<a href="${link.href}"${currentPath === link.href ? ' aria-current="page"' : ""}>${link.label}</a>`)
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
    <form class="quote-form" action="${site.formAction}" method="POST" enctype="multipart/form-data">
      <input type="hidden" name="_subject" value="Quote request from ${site.brand}">
      <input type="hidden" name="_captcha" value="false">
      <input type="hidden" name="_template" value="table">
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

const renderGallery = (items) => `
  <div class="gallery-grid">
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
  const relatedLinks = relatedProducts
    .slice(0, 4)
    .map((product) => `<a href="/${product.slug}/">${product.name.toLowerCase()}</a>`)
    .join(", ");
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
          <p>Buyers comparing this category also review ${relatedLinks} when planning <a href="/bubble-mailer-bags/">bubble mailer bags</a>, <a href="/white-bubble-mailers/">white bubble mailers</a>, or <a href="/custom-bubble-mailers/">custom bubble mailer packaging</a> for broader shipping programs.</p>
          <p>These pages are structured for buyers researching <a href="/products/">bulk bubble mailers</a>, <a href="/bubble-mailer-packaging/">padded mailers for shipping</a>, and <a href="/custom-bubble-mailers/">custom printed bubble mailers</a> with clearer sizing, material, and quote information.</p>
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
          <p>It also helps to compare nearby options such as <a href="/kraft-bubble-mailers/">kraft bubble mailers</a>, <a href="/white-bubble-mailers/">white bubble mailers</a>, <a href="/bubble-mailer-bags/">bubble mailer bags</a>, and <a href="/bubble-mailer-packaging/">bubble mailer packaging</a> when you are balancing shipping appearance, material preference, and size planning.</p>
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
    <p>Industries that regularly use kraft bubble mailers include eCommerce, apparel, accessories, beauty, publishing, and subscription packaging. They work well for shipments that need cushioned protection without a box-first packing approach. Businesses also compare them with <a href="/white-bubble-mailers/">white bubble mailers</a> when they want a cleaner presentation, or review <a href="/bubble-mailer-bags/">bubble mailer bags</a> when they need flexible packaging for faster packout.</p>
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
          <form class="quote-form" action="${site.formAction}" method="POST" enctype="multipart/form-data">
            <input type="hidden" name="_subject" value="New quote request from ${site.brand}">
            <input type="hidden" name="_template" value="table">
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

const productIntroParagraphs = (product) => [
  `${product.name} is a practical option for businesses that want ${product.tone} with better protection than a standard flat envelope. It gives packing teams a faster workflow than box-first shipping while still helping reduce scuffs, compression marks, and surface wear during transit. For many eCommerce and retail operations, that balance between presentation, protection, and freight efficiency is the reason padded mailers stay in regular use.`,
  `${product.fitNote} At Shop Bubble Mailers, we support quote requests for ${product.name.toLowerCase()} from businesses across the United States, including online stores, warehouse teams, and retail brands that need dependable stock for daily shipping. Buyers can request plain options, discuss custom printing, and plan volume around repeat orders or seasonal demand.`
];

const productSections = (product) => {
  if (product.slug === "kraft-bubble-mailer") {
    return renderKraftProductPage(product);
  }
  const relatedProducts = (relatedMap[product.slug] || []).map((slug) => productsBySlug.get(slug)).filter(Boolean);
  const contextualLinks = relatedProducts
    .slice(0, 4)
    .map((item) => `<a href="/${item.slug}/">${item.name.toLowerCase()}</a>`)
    .join(", ");
  const faqs = productFaqTemplates(product);
  const benefits = [
    `Padded protection for ${product.idealFor.join(", ").toLowerCase()} when the shipment needs more care than a plain paper envelope can offer.`,
    `Quick self-seal closure that helps reduce packing time during daily order fulfillment.`,
    `A cleaner shipping format for businesses that want mailers to look more organized and customer-ready.`,
    `Flexible ordering for standard stock, bulk supply, and custom print planning.`
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
          <p>Businesses also compare ${contextualLinks} when they are reviewing <a href="/white-bubble-mailers/">white bubble mailers</a>, <a href="/bubble-mailer-bags/">bubble mailer bags</a>, <a href="/bubble-mailer-packaging/">bulk bubble mailers packaging options</a>, or <a href="/custom-bubble-mailers/">custom printed bubble mailers</a> for related shipping needs.</p>
        </div>
        <div class="content-card">
          ${renderGallery([product.image, ...product.accentImages])}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container split-grid">
        <div class="content-card content-flow content-soft">
          ${iconHeading("truck", `Use cases for ${product.name.toLowerCase()}`)}
          <p>${product.name} is commonly used for ${product.idealFor.join(", ").toLowerCase()}. Buyers choose it when they want a padded mailer that stores easily at the packing station, closes quickly, and helps products arrive with a more consistent appearance.</p>
          <p>For eCommerce brands, the mailer often becomes part of the customer experience because it is the first package the buyer sees. For warehouse teams, the focus is usually speed, storage efficiency, and keeping material use simple across many daily orders. ${product.name} can support both goals when the size is selected carefully.</p>
          <p>It also works well in packaging programs that need lighter outbound parcels. Bubble mailers usually weigh less than corrugated boxes, which can make a real difference for repeat shipments where parcel cost adds up across the month.</p>
        </div>
        <div class="content-card content-flow">
          ${iconHeading("printer", "Customization options")}
          <p>${product.customAngle} Buyers can request logo print, basic brand colors, return information, or layout planning for retail-facing shipments. When artwork is ready, the quote form on this page can be used to send the file for review.</p>
          <p>Custom projects are especially useful for businesses that want stronger brand consistency across packaging. A printed bubble mailer can help a shipment feel more organized without adding the material and storage demands of a full branded box program.</p>
        </div>
      </div>
    </section>

    <section class="section section-muted" id="bulk-pricing">
      <div class="container split-grid">
        <div class="content-card content-flow content-soft">
          ${iconHeading("quote", "Shipping and bulk order information")}
          <p>${product.bulkAngle} When requesting pricing, it helps to include the target size, expected quantity, whether the order is standard stock or custom print, and where the shipment will be delivered. That lets us provide more useful guidance from the first response.</p>
          <p>Bulk buying is often the best route for businesses that have steady order flow, want price stability on a repeat format, or need multiple sizes planned together. We can also support businesses that are preparing for seasonal traffic and need a practical padded mailer option before order volume rises.</p>
          <p>Shop Bubble Mailers serves buyers across the USA. You can request pricing by phone, email, or the form on this page.</p>
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
    ...products.map((product) => ({ label: product.name, href: `/${product.slug}/` }))
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
writeRoute("/sitemap/", renderSitemapPage());

const sitemapUrls = siteRoutes.map((route) => absoluteUrl(route));

writeStaticAsset(
  "robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${site.domain}/sitemap.xml\n`
);

writeStaticAsset(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls
    .map((url) => `  <url><loc>${url}</loc></url>`)
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
