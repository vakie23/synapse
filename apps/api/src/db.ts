import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import type { OrderStatus, PaymentMethod, Product } from "@hardware/shared";

export type DeliveryZone =
  | "Harare"
  | "Bulawayo"
  | "Manicaland"
  | "Mashonaland Central"
  | "Mashonaland East"
  | "Mashonaland West"
  | "Masvingo"
  | "Matabeleland North"
  | "Matabeleland South"
  | "Midlands"
  | "Marondera"
  | "Mutare"
  | "Other";

export type CatalogProduct = Product & {
  unit: string;
  weightKg: number;
  serviceTag: string;
  imageUrl?: string;
};

export type OrderRecord = {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  region: DeliveryZone;
  city: string;
  customerLocation: { lat: number; lng: number };
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  tracking: {
    stage: string;
    currentLocation: string;
    coordinates: { lat: number; lng: number };
    origin?: { lat: number; lng: number; label?: string };
    expectedArrivalAt?: string;
    updatedAt: string;
  };
};

export type DispatchSettings = {
  label: string;
  lat: number;
  lng: number;
};

export const defaultDispatchSettings: DispatchSettings = {
  label: "Synapse Engineering dispatch",
  lat: -17.8252,
  lng: 31.0335
};

export type QuotationRecord = {
  quotationId: string;
  customerName: string;
  phone: string;
  email: string;
  city: string;
  customerLocation: { lat: number; lng: number };
  physicalAddress: string;
  requiredDate: string;
  serviceArea: DeliveryZone;
  lines: Array<{
    productId: string;
    name: string;
    imageUrl?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  discountAmount?: number;
  total: number;
  adminAdjustedAt?: string;
  createdAt: string;
};

export type CustomerRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  createdAt: string;
};

const productImageUrls: Record<string, string> = {
  p1: "/images/product_p1.jpg",
  p2: "/images/product_p2.jpg",
  p3: "/images/product_p3.jpg",
  p4: "/images/product_p4.jpg",
  p5: "/images/product_p5.jpg",
  p6: "/images/product_p6.jpg",
  p7: "/images/product_p7.jpg",
  p8: "/images/product_p8.jpg",
  p9: "/images/product_p9.jpg",
  p10: "/images/product_p10.jpg",
  p11: "/images/product_p11.jpg",
  p13: "/images/product_p13.jpg",
  p14: "/images/product_p14.jpg",
  p15: "/images/product_p15.png",
  p16: "/images/product_p16.png",
  p17: "/images/product_p17.png",
  p18: "/images/product_p18.png",
  p19: "/images/product_p19.jpg",
  p20: "/images/product_p20.png",
  p21: "/images/product_p21.png",
  p22: "/images/product_p22.jpg",
  p24: "/images/product_p24.png",
  p25: "/images/product_p25.jpg",
  p26: "/images/product_p26.jpg"
};

const seedProducts: CatalogProduct[] = [
  { id: "p1", name: "19mm PVC Conduits", category: "Conduits and fittings", price: 1.2, stock: 1000, description: "PVC conduits for safe cable routing in buildings.", unit: "each", weightKg: 0.2, serviceTag: "installation", imageUrl: productImageUrls.p1 },
  { id: "p2", name: "19mm Round Box", category: "Conduits and fittings", price: 0.5, stock: 500, description: "Round electrical box for conduit terminations.", unit: "each", weightKg: 0.1, serviceTag: "installation", imageUrl: productImageUrls.p2 },
  { id: "p3", name: "19mm PVC Couplings", category: "Conduits and fittings", price: 0.1, stock: 2000, description: "Couplings for joining 19mm conduits.", unit: "each", weightKg: 0.05, serviceTag: "installation", imageUrl: productImageUrls.p3 },
  { id: "p4", name: "19mm PVC Nipples", category: "Conduits and fittings", price: 0.1, stock: 2000, description: "Nipples for conduit connection and cable passage.", unit: "each", weightKg: 0.05, serviceTag: "installation", imageUrl: productImageUrls.p4 },
  { id: "p5", name: "3x6 Flush Boxes", category: "Boxes and panels", price: 1, stock: 300, description: "Flush boxes for switch and socket installations.", unit: "each", weightKg: 0.2, serviceTag: "installation", imageUrl: productImageUrls.p5 },
  { id: "p6", name: "3x3 Flush Boxes", category: "Boxes and panels", price: 0.8, stock: 300, description: "Compact flush boxes for electrical accessories.", unit: "each", weightKg: 0.15, serviceTag: "installation", imageUrl: productImageUrls.p6 },
  { id: "p7", name: "24 Way DB Box", category: "Boxes and panels", price: 40, stock: 25, description: "24-way distribution board for breaker layout.", unit: "each", weightKg: 3, serviceTag: "distribution", imageUrl: productImageUrls.p7 },
  { id: "p8", name: "25mm PVC Conduits", category: "Conduits and fittings", price: 1.5, stock: 200, description: "Heavier-duty conduit for larger cable runs.", unit: "each", weightKg: 0.25, serviceTag: "installation", imageUrl: productImageUrls.p8 },
  { id: "p9", name: "25mm PVC Nipples", category: "Conduits and fittings", price: 0.5, stock: 500, description: "25mm nipples for conduit fittings.", unit: "each", weightKg: 0.08, serviceTag: "installation", imageUrl: productImageUrls.p9 },
  { id: "p10", name: "25mm PVC Couplings", category: "Conduits and fittings", price: 0.5, stock: 500, description: "Couplings for 25mm conduit runs.", unit: "each", weightKg: 0.08, serviceTag: "installation", imageUrl: productImageUrls.p10 },
  { id: "p11", name: "1.5mm Red Cable", category: "Cables", price: 35, stock: 100, description: "Single-core red cable for lighting circuits.", unit: "coil", weightKg: 4, serviceTag: "wiring", imageUrl: productImageUrls.p11 },
  { id: "p12", name: "1.5mm Black Cable", category: "Cables", price: 35, stock: 100, description: "Single-core black cable for lighting circuits.", unit: "coil", weightKg: 4, serviceTag: "wiring" },
  { id: "p13", name: "2.5mm Red Cable", category: "Cables", price: 40, stock: 100, description: "Socket circuit cable with durable insulation.", unit: "coil", weightKg: 5, serviceTag: "wiring", imageUrl: productImageUrls.p13 },
  { id: "p14", name: "2.5mm Black Cable", category: "Cables", price: 40, stock: 100, description: "Black insulated cable for socket wiring.", unit: "coil", weightKg: 5, serviceTag: "wiring", imageUrl: productImageUrls.p14 },
  { id: "p15", name: "2.5mm Earth Cable", category: "Cables", price: 40, stock: 100, description: "Earth cable for safe grounding installations.", unit: "coil", weightKg: 5, serviceTag: "wiring", imageUrl: productImageUrls.p15 },
  { id: "p16", name: "6mm Red Cable", category: "Cables", price: 1.2, stock: 500, description: "Heavy-duty red cable sold per meter.", unit: "meter", weightKg: 0.1, serviceTag: "power", imageUrl: productImageUrls.p16 },
  { id: "p17", name: "6mm Black Cable", category: "Cables", price: 1.2, stock: 500, description: "Heavy-duty black cable sold per meter.", unit: "meter", weightKg: 0.1, serviceTag: "power", imageUrl: productImageUrls.p17 },
  { id: "p18", name: "6mm Earth Cable", category: "Cables", price: 1.2, stock: 500, description: "Heavy-duty earth cable sold per meter.", unit: "meter", weightKg: 0.1, serviceTag: "power", imageUrl: productImageUrls.p18 },
  { id: "p19", name: "13A Double Socket", category: "Sockets and switches", price: 6, stock: 150, description: "Double socket outlet for domestic use.", unit: "each", weightKg: 0.25, serviceTag: "installation", imageUrl: productImageUrls.p19 },
  { id: "p20", name: "15A Double Socket", category: "Sockets and switches", price: 7, stock: 150, description: "15A socket for high-load appliance use.", unit: "each", weightKg: 0.25, serviceTag: "installation", imageUrl: productImageUrls.p20 },
  { id: "p21", name: "Single Socket Outlet", category: "Sockets and switches", price: 4, stock: 150, description: "Single socket outlet for standard domestic installations.", unit: "each", weightKg: 0.2, serviceTag: "installation", imageUrl: productImageUrls.p21 },
  { id: "p22", name: "Double Waterproof Socket", category: "Sockets and switches", price: 20, stock: 60, description: "Weather-resistant double socket for outdoor use.", unit: "each", weightKg: 0.35, serviceTag: "outdoor", imageUrl: productImageUrls.p22 },
  { id: "p23", name: "1 Gang 2 Way Switch", category: "Sockets and switches", price: 3, stock: 120, description: "Single-gang two-way switch.", unit: "each", weightKg: 0.12, serviceTag: "installation" },
  { id: "p24", name: "2 Gang 2 Way Switch", category: "Sockets and switches", price: 3.5, stock: 120, description: "Two-gang two-way wall switch.", unit: "each", weightKg: 0.14, serviceTag: "installation", imageUrl: productImageUrls.p24 },
  { id: "p25", name: "3 Gang 2 Way Switch", category: "Sockets and switches", price: 4, stock: 120, description: "Three-gang two-way switch.", unit: "each", weightKg: 0.16, serviceTag: "installation", imageUrl: productImageUrls.p25 },
  { id: "p26", name: "Cooker Control Unit", category: "Control units", price: 10, stock: 60, description: "Cooker control unit for kitchen power management.", unit: "each", weightKg: 0.5, serviceTag: "kitchen", imageUrl: productImageUrls.p26 }
];

export class HardwareDatabase {
  private db!: Database;
  private SQL!: SqlJsStatic;
  private moduleDir = path.dirname(fileURLToPath(import.meta.url));
  private dbPath = path.resolve(this.moduleDir, "../data/hardware.sqlite");
  private legacyDbPath = path.resolve(process.cwd(), "apps/api/data/hardware.sqlite");
  private dispatchSettingsPath = path.resolve(this.moduleDir, "../data/dispatch-settings.json");

  async init(): Promise<void> {
    await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
    this.SQL = await initSqlJs();

    try {
      const fileBuffer = await fs.readFile(this.dbPath);
      this.db = new this.SQL.Database(fileBuffer);
    } catch {
      try {
        const legacyBuffer = await fs.readFile(this.legacyDbPath);
        this.db = new this.SQL.Database(legacyBuffer);
        await fs.writeFile(this.dbPath, legacyBuffer);
      } catch {
        this.db = new this.SQL.Database();
      }
    }

    this.db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL,
        description TEXT NOT NULL,
        unit TEXT NOT NULL,
        weightKg REAL NOT NULL,
        serviceTag TEXT NOT NULL,
        imageUrl TEXT
      );
      CREATE TABLE IF NOT EXISTS quotations (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        phone TEXT,
        createdAt TEXT NOT NULL
      );
    `);

    const pragma = this.db.exec("PRAGMA table_info(products)");
    const productColumns = (pragma[0]?.values ?? []).map((row: unknown[]) => String(row[1]));
    if (!productColumns.includes("imageUrl")) {
      this.db.run("ALTER TABLE products ADD COLUMN imageUrl TEXT");
    }

    const count = this.scalar("SELECT COUNT(*) FROM products");
    if (count === 0) {
      const stmt = this.db.prepare(`
        INSERT INTO products (id, name, category, price, stock, description, unit, weightKg, serviceTag, imageUrl)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const product of seedProducts) {
        stmt.run([
          product.id,
          product.name,
          product.category,
          product.price,
          product.stock,
          product.description,
          product.unit,
          product.weightKg,
          product.serviceTag,
          product.imageUrl ?? null
        ]);
      }
      stmt.free();
      await this.persist();
    }

    // Remove temporary test products from existing databases.
    this.db.run(
      `DELETE FROM products WHERE LOWER(name) IN ('test item', 'test item 3', 'test item 4')`
    );

    const imageStmt = this.db.prepare("UPDATE products SET imageUrl = ? WHERE id = ?");
    for (const [id, imageUrl] of Object.entries(productImageUrls)) {
      imageStmt.run([imageUrl, id]);
    }
    imageStmt.free();

    this.db.run(
      "UPDATE products SET name = '24 Way DB Box', description = '24-way distribution board for breaker layout.' WHERE id = 'p7'"
    );

    await this.persist();
  }

  private scalar(query: string): number {
    const result = this.db.exec(query);
    return Number(result[0]?.values?.[0]?.[0] ?? 0);
  }

  private async persist(): Promise<void> {
    await fs.writeFile(this.dbPath, Buffer.from(this.db.export()));
  }

  listProducts(search = "", category = ""): CatalogProduct[] {
    const query = `
      SELECT * FROM products
      WHERE (? = '' OR LOWER(name) LIKE '%' || LOWER(?) || '%' OR LOWER(description) LIKE '%' || LOWER(?) || '%')
        AND (? = '' OR category = ?)
      ORDER BY name ASC
    `;
    const stmt = this.db.prepare(query);
    stmt.bind([search, search, search, category, category]);
    const rows: CatalogProduct[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as unknown as Record<string, string | number>;
      rows.push({
        id: String(row.id),
        name: String(row.name),
        category: String(row.category),
        price: Number(row.price),
        stock: Number(row.stock),
        description: String(row.description),
        unit: String(row.unit),
        weightKg: Number(row.weightKg),
        serviceTag: String(row.serviceTag),
        imageUrl: row.imageUrl ? String(row.imageUrl) : undefined
      });
    }
    stmt.free();
    return rows;
  }

  getCategories(): string[] {
    const result = this.db.exec("SELECT DISTINCT category FROM products ORDER BY category ASC");
    return (result[0]?.values ?? []).map((value: unknown[]) => String(value[0]));
  }

  getProduct(id: string): CatalogProduct | undefined {
    return this.listProducts().find((product) => product.id === id);
  }

  async createProduct(product: Omit<CatalogProduct, "id">): Promise<CatalogProduct> {
    const id = `p${Date.now()}`;
    this.db.run(
      `INSERT INTO products (id, name, category, price, stock, description, unit, weightKg, serviceTag, imageUrl)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, product.name, product.category, product.price, product.stock, product.description, product.unit, product.weightKg, product.serviceTag, product.imageUrl || null]
    );
    await this.persist();
    return { id, ...product };
  }

  async updateProduct(id: string, patch: Partial<Omit<CatalogProduct, "id">>): Promise<CatalogProduct | undefined> {
    const existing = this.getProduct(id);
    if (!existing) return undefined;
    const merged = { ...existing, ...patch };
    this.db.run(
      `UPDATE products
       SET name = ?, category = ?, price = ?, stock = ?, description = ?, unit = ?, weightKg = ?, serviceTag = ?, imageUrl = ?
       WHERE id = ?`,
      [merged.name, merged.category, merged.price, merged.stock, merged.description, merged.unit, merged.weightKg, merged.serviceTag, merged.imageUrl || null, id]
    );
    await this.persist();
    return merged;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const existing = this.getProduct(id);
    if (!existing) {
      return false;
    }
    this.db.run("DELETE FROM products WHERE id = ?", [id]);
    await this.persist();
    return true;
  }

  async adjustStock(productId: string, quantity: number): Promise<void> {
    this.db.run("UPDATE products SET stock = stock - ? WHERE id = ?", [quantity, productId]);
    await this.persist();
  }

  async saveQuotation(quotation: QuotationRecord): Promise<void> {
    this.db.run("INSERT INTO quotations (id, data) VALUES (?, ?)", [quotation.quotationId, JSON.stringify(quotation)]);
    await this.persist();
  }

  listQuotations(): QuotationRecord[] {
    const result = this.db.exec("SELECT data FROM quotations ORDER BY id DESC");
    return (result[0]?.values ?? []).map((row: unknown[]) => JSON.parse(String(row[0])) as QuotationRecord);
  }

  getQuotation(id: string): QuotationRecord | undefined {
    return this.listQuotations().find((quotation) => quotation.quotationId === id);
  }

  async updateQuotation(quotation: QuotationRecord): Promise<void> {
    this.db.run("UPDATE quotations SET data = ? WHERE id = ?", [JSON.stringify(quotation), quotation.quotationId]);
    await this.persist();
  }

  async deleteQuotation(id: string): Promise<boolean> {
    const existing = this.getQuotation(id);
    if (!existing) {
      return false;
    }
    this.db.run("DELETE FROM quotations WHERE id = ?", [id]);
    await this.persist();
    return true;
  }

  async saveOrder(order: OrderRecord): Promise<void> {
    this.db.run("INSERT INTO orders (id, data) VALUES (?, ?)", [order.id, JSON.stringify(order)]);
    await this.persist();
  }

  listOrders(): OrderRecord[] {
    const result = this.db.exec("SELECT data FROM orders ORDER BY id DESC");
    return (result[0]?.values ?? []).map((row: unknown[]) => JSON.parse(String(row[0])) as OrderRecord);
  }

  getOrder(id: string): OrderRecord | undefined {
    return this.listOrders().find((order) => order.id === id);
  }

  async updateOrder(order: OrderRecord): Promise<void> {
    this.db.run("UPDATE orders SET data = ? WHERE id = ?", [JSON.stringify(order), order.id]);
    await this.persist();
  }

  async getDispatchSettings(): Promise<DispatchSettings> {
    try {
      const raw = await fs.readFile(this.dispatchSettingsPath, "utf8");
      const parsed = JSON.parse(raw) as Partial<DispatchSettings>;
      if (
        typeof parsed.lat === "number" &&
        typeof parsed.lng === "number" &&
        typeof parsed.label === "string"
      ) {
        return { label: parsed.label, lat: parsed.lat, lng: parsed.lng };
      }
    } catch {
      /* use default */
    }
    return { ...defaultDispatchSettings };
  }

  async setDispatchSettings(settings: DispatchSettings): Promise<void> {
    await fs.mkdir(path.dirname(this.dispatchSettingsPath), { recursive: true });
    await fs.writeFile(this.dispatchSettingsPath, JSON.stringify(settings, null, 2), "utf8");
  }

  getCustomerByEmail(email: string): CustomerRecord | undefined {
    const stmt = this.db.prepare("SELECT * FROM customers WHERE LOWER(email) = LOWER(?) LIMIT 1");
    stmt.bind([email]);
    if (!stmt.step()) {
      stmt.free();
      return undefined;
    }
    const row = stmt.getAsObject() as unknown as Record<string, string | null>;
    stmt.free();
    return {
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      passwordHash: String(row.passwordHash),
      phone: row.phone ? String(row.phone) : undefined,
      createdAt: String(row.createdAt)
    };
  }

  getCustomerById(id: string): CustomerRecord | undefined {
    const stmt = this.db.prepare("SELECT * FROM customers WHERE id = ? LIMIT 1");
    stmt.bind([id]);
    if (!stmt.step()) {
      stmt.free();
      return undefined;
    }
    const row = stmt.getAsObject() as unknown as Record<string, string | null>;
    stmt.free();
    return {
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      passwordHash: String(row.passwordHash),
      phone: row.phone ? String(row.phone) : undefined,
      createdAt: String(row.createdAt)
    };
  }

  async createCustomer(input: { name: string; email: string; passwordHash: string; phone?: string }): Promise<CustomerRecord> {
    const id = `cus_${Date.now()}`;
    const createdAt = new Date().toISOString();
    this.db.run(
      "INSERT INTO customers (id, name, email, passwordHash, phone, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      [id, input.name, input.email, input.passwordHash, input.phone ?? null, createdAt]
    );
    await this.persist();
    return {
      id,
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      phone: input.phone,
      createdAt
    };
  }
}
