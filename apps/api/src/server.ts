import crypto from "node:crypto";
import cors from "cors";
import express from "express";
import { z } from "zod";
import type { PaymentMethod } from "@hardware/shared";
import { HardwareDatabase, type DeliveryZone, type OrderRecord, type QuotationRecord } from "./db.js";
import fs from "node:fs";
import path from "node:path";
import busboy from "busboy";

const app = express();
const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : ["http://localhost:3000", "http://localhost:3200"];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Serve static images
const imagesDir = path.join(process.cwd(), "data", "images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}
app.use("/images", express.static(imagesDir));


const db = new HardwareDatabase();
const customerSessionCookieName = "synapse_customer_session";
const customerSessions = new Map<string, { customerId: string; createdAt: number }>();
const zimbabweRegions = [
  "Harare",
  "Bulawayo",
  "Manicaland",
  "Mashonaland Central",
  "Mashonaland East",
  "Mashonaland West",
  "Masvingo",
  "Matabeleland North",
  "Matabeleland South",
  "Midlands"
] as const;
type ZimbabweRegion = (typeof zimbabweRegions)[number];
const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
const sessionCookieName = "synapse_admin_session";
const sessionSecret = process.env.ADMIN_SESSION_SECRET ?? "synapse-admin-secret";

// Simple credentials file for persistence
const credentialsFile = path.join(process.cwd(), "..", "admin", "data", "admin-credentials.json");

function loadCredentials() {
  try {
    if (fs.existsSync(credentialsFile)) {
      return JSON.parse(fs.readFileSync(credentialsFile, "utf8"));
    }
  } catch {}
  return null;
}

function saveCredentials(username: string, password: string) {
  const dataDir = path.dirname(credentialsFile);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(credentialsFile, JSON.stringify({ username, password }, null, 2));
}

const savedCredentials = loadCredentials();
const getAdminUsername = () => savedCredentials?.username ?? adminUsername;
const getAdminPassword = () => savedCredentials?.password ?? process.env.ADMIN_PASSWORD ?? "Synapse@2026";

const companyProfile = {
  companyName: "Synapse Engineering",
  email: "synapseengineering@gmail.com",
  phone: "+263783944171",
  whatsapp: "+263783944171",
  services: [
    "Power line construction",
    "Heavy solar system construction",
    "Domestic and industrial power installation",
    "Electrical designing and consulting",
    "Electrical maintenance and auditing",
    "Backup power solutions"
  ]
};

const orderSchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(7),
  address: z.string().min(5),
  region: z.enum(zimbabweRegions),
  city: z.string().min(2),
  customerLocation: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  paymentMethod: z.enum(["CARD", "MOBILE_MONEY", "CASH_ON_DELIVERY"]),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1) })).min(1)
});

const deliverySchema = z.object({
  region: z.enum(zimbabweRegions),
  totalWeightKg: z.number().nonnegative(),
  express: z.boolean().default(false)
});

const regionBaseFee: Record<ZimbabweRegion, number> = {
  Harare: 4,
  Bulawayo: 7,
  Manicaland: 8,
  "Mashonaland Central": 7.5,
  "Mashonaland East": 6.5,
  "Mashonaland West": 7,
  Masvingo: 8.5,
  "Matabeleland North": 9,
  "Matabeleland South": 9,
  Midlands: 8
};

function computeDeliveryFee(region: ZimbabweRegion, totalWeightKg: number, express: boolean): number {
  const zoneBase = regionBaseFee[region];
  const weightBand = totalWeightKg <= 2 ? 0 : totalWeightKg <= 10 ? 3 : 8;
  const serviceFee = express ? 5 : 0;
  return zoneBase + weightBand + serviceFee;
}

function estimateZone(city: string): DeliveryZone {
  const normalized = city.toLowerCase();
  if (normalized.includes("marondera")) return "Marondera";
  if (normalized.includes("harare")) return "Harare";
  if (normalized.includes("bulawayo")) return "Bulawayo";
  if (normalized.includes("mutare")) return "Mutare";
  return "Other";
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((cookies, part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");
    cookies[rawKey] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});
}

function verifySessionToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 3) {
      return false;
    }

    const [username, timestamp, signature] = parts;
    const payload = `${username}:${timestamp}`;
    const expected = crypto.createHmac("sha256", sessionSecret).update(payload).digest("hex");
    return signature === expected && username === getAdminUsername();
  } catch {
    return false;
  }
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function getCurrentCustomer(req: express.Request) {
  const token = parseCookies(req.headers.cookie)[customerSessionCookieName];
  if (!token) return undefined;
  const session = customerSessions.get(token);
  if (!session) return undefined;
  return db.getCustomerById(session.customerId);
}

function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const token = parseCookies(req.headers.cookie)[sessionCookieName];
  if (!token || !verifySessionToken(token)) {
    res.status(401).json({ message: "Admin authentication required" });
    return;
  }

  next();
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "hardware-api" });
});

app.get("/", (_req, res) => {
  res.json({
    service: "hardware-api",
    status: "ok",
    message: "API is running. Use /health or /api/* endpoints.",
    endpoints: [
      "/health",
      "/api/products",
      "/api/categories",
      "/api/cart/price",
      "/api/quotation",
      "/api/orders/:id/tracking"
    ]
  });
});

app.get("/api/company", (_req, res) => {
  res.json(companyProfile);
});

app.post("/api/auth/signup", async (req, res) => {
  const parsed = z.object({
    name: z.string().min(2),
    email: z.email(),
    password: z.string().min(4),
    phone: z.string().min(7).optional()
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const existing = db.getCustomerByEmail(parsed.data.email);
  if (existing) return res.status(409).json({ message: "Email already exists" });

  const customer = await db.createCustomer({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    passwordHash: hashPassword(parsed.data.password)
  });

  const token = crypto.randomBytes(24).toString("hex");
  customerSessions.set(token, { customerId: customer.id, createdAt: Date.now() });
  res.setHeader("Set-Cookie", `${customerSessionCookieName}=${token}; HttpOnly; Path=/; SameSite=Lax`);
  res.status(201).json({ id: customer.id, name: customer.name, email: customer.email, phone: customer.phone });
});

app.post("/api/auth/signin", (req, res) => {
  const parsed = z.object({
    email: z.email(),
    password: z.string().min(4)
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const customer = db.getCustomerByEmail(parsed.data.email);
  if (!customer || customer.passwordHash !== hashPassword(parsed.data.password)) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = crypto.randomBytes(24).toString("hex");
  customerSessions.set(token, { customerId: customer.id, createdAt: Date.now() });
  res.setHeader("Set-Cookie", `${customerSessionCookieName}=${token}; HttpOnly; Path=/; SameSite=Lax`);
  res.json({ id: customer.id, name: customer.name, email: customer.email, phone: customer.phone });
});

app.post("/api/auth/signout", (req, res) => {
  const token = parseCookies(req.headers.cookie)[customerSessionCookieName];
  if (token) customerSessions.delete(token);
  res.setHeader("Set-Cookie", `${customerSessionCookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
  res.status(204).send();
});

app.get("/api/auth/me", (req, res) => {
  const customer = getCurrentCustomer(req);
  if (!customer) return res.status(401).json({ message: "Not signed in" });
  res.json({ id: customer.id, name: customer.name, email: customer.email, phone: customer.phone });
});

app.get("/api/products", (req, res) => {
  const search = String(req.query.search ?? "").toLowerCase();
  const category = String(req.query.category ?? "");
  res.json(db.listProducts(search, category));
});

app.get("/api/categories", (_req, res) => {
  res.json(db.getCategories());
});

app.get("/api/products/:id", (req, res) => {
  const product = db.getProduct(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

app.post("/api/cart/price", (req, res) => {
  const payload = z.object({
    lines: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1) })).min(1),
    delivery: deliverySchema
  }).safeParse(req.body);

  if (!payload.success) return res.status(400).json({ errors: payload.error.flatten() });

  const subtotal = payload.data.lines.reduce((sum, line) => {
    const product = db.getProduct(line.productId);
    return sum + (product ? product.price * line.quantity : 0);
  }, 0);

  const deliveryFee = computeDeliveryFee(payload.data.delivery.region, payload.data.delivery.totalWeightKg, payload.data.delivery.express);
  res.json({ subtotal, deliveryFee, total: subtotal + deliveryFee });
});

app.post("/api/quotation", async (req, res) => {
  const payload = z.object({
    customerName: z.string().min(2),
    phone: z.string().min(7),
    email: z.email(),
    city: z.string().min(2),
    customerLocation: z.object({
      lat: z.number(),
      lng: z.number()
    }),
    physicalAddress: z.string().min(5),
    requiredDate: z.string().min(4),
    lines: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1) })).min(1),
    delivery: deliverySchema
  }).safeParse(req.body);

  if (!payload.success) return res.status(400).json({ errors: payload.error.flatten() });

  const lines = payload.data.lines.map((line) => {
    const product = db.getProduct(line.productId);
    if (!product) {
      throw new Error(`Unknown product: ${line.productId}`);
    }
    return {
      productId: product.id,
      name: product.name,
      quantity: line.quantity,
      unit: product.unit,
      unitPrice: product.price,
      lineTotal: product.price * line.quantity
    };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const deliveryFee = computeDeliveryFee(
    payload.data.delivery.region,
    payload.data.delivery.totalWeightKg,
    payload.data.delivery.express
  );

  const quotation: QuotationRecord = {
    quotationId: `qt_${Date.now()}`,
    customerName: payload.data.customerName,
    phone: payload.data.phone,
    email: payload.data.email,
    city: payload.data.city,
    customerLocation: payload.data.customerLocation,
    physicalAddress: payload.data.physicalAddress,
    requiredDate: payload.data.requiredDate,
    serviceArea: payload.data.delivery.region,
    lines,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    createdAt: new Date().toISOString()
  };

  await db.saveQuotation(quotation);
  res.json({
    ...quotation,
    contact: {
      email: companyProfile.email,
      phone: companyProfile.phone
    }
  });
});

app.get("/api/quotation/:id", (req, res) => {
  const quotationId = String(req.params.id);
  const quotation = db.getQuotation(quotationId);
  if (!quotation) return res.status(404).json({ message: "Quotation not found" });
  res.json({
    ...quotation,
    contact: {
      email: companyProfile.email,
      phone: companyProfile.phone
    }
  });
});

app.post("/api/orders", async (req, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const pricedItems = parsed.data.items.map((line) => {
    const product = db.getProduct(line.productId);
    if (!product) throw new Error(`Unknown product: ${line.productId}`);
    if (product.stock < line.quantity) throw new Error(`Insufficient stock for ${product.name}`);
    return { productId: line.productId, quantity: line.quantity, unitPrice: product.price };
  });

  const subtotal = pricedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const deliveryFee = computeDeliveryFee(parsed.data.region, 3, false);
  const order: OrderRecord = {
    id: `ord_${Date.now()}`,
    customerName: parsed.data.customerName,
    phone: parsed.data.phone,
    address: parsed.data.address,
    region: parsed.data.region,
    city: parsed.data.city,
    customerLocation: parsed.data.customerLocation,
    paymentMethod: parsed.data.paymentMethod,
    status: parsed.data.paymentMethod === "CASH_ON_DELIVERY" ? "PLACED" : "PENDING_PAYMENT",
    items: pricedItems,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    tracking: {
      stage: "Order received",
      currentLocation: "Synapse Engineering dispatch center",
      coordinates: { lat: -18.1853, lng: 31.5519 },
      updatedAt: new Date().toISOString()
    }
  };

  for (const line of pricedItems) {
    await db.adjustStock(line.productId, line.quantity);
  }

  await db.saveOrder(order);
  res.status(201).json(order);
});

app.get("/api/orders/:id", (req, res) => {
  const orderId = String(req.params.id);
  const order = db.getOrder(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
});

app.get("/api/orders/:id/tracking", (req, res) => {
  const order = db.getOrder(String(req.params.id));
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json({
    orderId: order.id,
    customerLocation: order.customerLocation,
    tracking: order.tracking
  });
});

app.get("/api/admin/orders", requireAdminAuth, (_req, res) => {
  res.json(db.listOrders());
});

app.get("/api/admin/quotations", requireAdminAuth, (_req, res) => {
  res.json(db.listQuotations());
});

app.patch("/api/admin/quotations/:id", requireAdminAuth, async (req, res) => {
  const parsed = z.object({
    deliveryFee: z.number().nonnegative().optional(),
    discountAmount: z.number().nonnegative().optional()
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const quotation = db.getQuotation(String(req.params.id));
  if (!quotation) return res.status(404).json({ message: "Quotation not found" });

  const nextDeliveryFee = parsed.data.deliveryFee ?? quotation.deliveryFee;
  const nextDiscountAmount = parsed.data.discountAmount ?? quotation.discountAmount ?? 0;
  const maxDiscount = quotation.subtotal + nextDeliveryFee;
  const appliedDiscount = Math.min(nextDiscountAmount, maxDiscount);

  quotation.deliveryFee = nextDeliveryFee;
  quotation.discountAmount = appliedDiscount;
  quotation.total = Math.max(0, quotation.subtotal + nextDeliveryFee - appliedDiscount);
  quotation.adminAdjustedAt = new Date().toISOString();

  await db.updateQuotation(quotation);
  res.json(quotation);
});

app.delete("/api/admin/quotations/:id", requireAdminAuth, async (req, res) => {
  const quotationId = String(req.params.id);
  const deleted = await db.deleteQuotation(quotationId);
  if (!deleted) return res.status(404).json({ message: "Quotation not found" });
  res.status(204).send();
});

app.patch("/api/admin/orders/:id/status", requireAdminAuth, async (req, res) => {
  const parsed = z.object({
    status: z.enum(["PENDING_PAYMENT", "PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"]),
    stage: z.string().min(2).optional(),
    currentLocation: z.string().min(2).optional(),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional()
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const order = db.getOrder(String(req.params.id));
  if (!order) return res.status(404).json({ message: "Order not found" });
  order.status = parsed.data.status;
  order.tracking = {
    stage: parsed.data.stage ?? order.tracking.stage,
    currentLocation: parsed.data.currentLocation ?? order.tracking.currentLocation,
    coordinates: parsed.data.coordinates ?? order.tracking.coordinates,
    updatedAt: new Date().toISOString()
  };
  await db.updateOrder(order);
  res.json(order);
});

async function parseMultipartRequest(req: express.Request): Promise<{ fields: Record<string, string>; imageBuffer?: Buffer; imageMime?: string }> {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    const fields: Record<string, string> = {};
    let imageBuffer: Buffer | undefined;
    let imageMime: string | undefined;

    bb.on("field", (fieldname: string, val: string) => {
      fields[fieldname] = val;
      console.error("multipart field", fieldname, val);
    });

    bb.on("file", (fieldname: string, file: NodeJS.ReadableStream, filename: string, encoding: string, mimetype: string) => {
      console.error("multipart file event", fieldname, filename, mimetype);
      if (fieldname === "image" && filename) {
        const chunks: Buffer[] = [];
        file.on("data", (chunk: Buffer) => {
          console.error("multipart file chunk", chunk.length);
          chunks.push(chunk);
        });
        file.on("end", () => {
          imageBuffer = Buffer.concat(chunks);
          imageMime = mimetype;
          console.error("multipart file end", imageBuffer.length, imageMime);
        });
      } else {
        file.resume();
      }
    });

    bb.on("error", reject);
    bb.on("finish", () => {
      console.error("multipart finish", Object.keys(fields), imageBuffer?.length, imageMime);
      resolve({ fields, imageBuffer, imageMime });
    });

    req.pipe(bb);
  });
}

app.post("/api/admin/products", requireAdminAuth, async (req, res) => {
  try {
    const { fields, imageBuffer, imageMime } = await parseMultipartRequest(req);
    let imageUrl: string | undefined;

    if (imageBuffer && imageMime) {
      const ext = imageMime.split("/")[1] || "jpg";
      const filename = `product_${Date.now()}.${ext}`;
      const filepath = path.join(imagesDir, filename);
      fs.writeFileSync(filepath, imageBuffer);
      imageUrl = `/images/${filename}`;
    }

    const parsed = z.object({
      name: z.string().min(2),
      category: z.string().min(2),
      price: z.coerce.number().positive(),
      stock: z.coerce.number().int().nonnegative(),
      description: z.string().min(5)
    }).safeParse(fields);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const created = await db.createProduct({
      ...parsed.data,
      imageUrl,
      unit: "each",
      weightKg: 0.5,
      serviceTag: "general"
    });
    res.status(201).json(created);
  } catch (error) {
    console.error("create product error", error);
    res.status(400).json({ message: "Failed to create product", error: String(error) });
  }
});

app.patch("/api/admin/products/:id", requireAdminAuth, async (req, res) => {
  try {
    const { fields, imageBuffer, imageMime } = await parseMultipartRequest(req);
    let imageUrl: string | undefined;

    if (imageBuffer && imageMime) {
      const ext = imageMime.split("/")[1] || "jpg";
      const filename = `product_${Date.now()}.${ext}`;
      const filepath = path.join(imagesDir, filename);
      fs.writeFileSync(filepath, imageBuffer);
      imageUrl = `/images/${filename}`;
    }

    const parsed = z.object({
      name: z.string().min(2).optional(),
      category: z.string().min(2).optional(),
      price: z.coerce.number().positive().optional(),
      stock: z.coerce.number().int().nonnegative().optional(),
      description: z.string().min(5).optional()
    }).safeParse(fields);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const productId = String(req.params.id);
    const updateData: any = { ...parsed.data };
    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }
    const product = await db.updateProduct(productId, updateData);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error("update product error", error);
    res.status(400).json({ message: "Failed to update product", error: String(error) });
  }
});

app.post("/api/admin/credentials", requireAdminAuth, (req, res) => {
  const parsed = z.object({
    newUsername: z.string().min(2),
    newPassword: z.string().min(4)
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  saveCredentials(parsed.data.newUsername, parsed.data.newPassword);
  res.json({ success: true, message: "Credentials updated successfully" });
});

const port = Number(process.env.PORT ?? 4000);
db.init().then(() => {
  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
}).catch((error) => {
  console.error("Failed to initialize database", error);
  process.exit(1);
});
