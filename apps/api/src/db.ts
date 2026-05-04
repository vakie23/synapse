import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import type { OrderStatus, PaymentMethod, Product } from "../../packages/shared/src/index.js";

export type DeliveryZone = "Marondera" | "Harare" | "Bulawayo" | "Mutare" | "Other";

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
  region: "A" | "B" | "C";
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
    updatedAt: string;
  };
};

export type QuotationRecord = {
  quotationId: string;
  customerName: string;
  phone: string;
  email: string;
  city: string;
  physicalAddress: string;
  requiredDate: string;
  serviceArea: DeliveryZone;
  lines: Array<{
    productId: string;
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
};

const seedProducts: CatalogProduct[] = [
  { id: "p1", name: "19mm PVC Conduits", category: "Conduits and fittings", price: 1.2, stock: 1000, description: "PVC conduits for safe cable routing in buildings.", unit: "each", weightKg: 0.2, serviceTag: "installation" },
  { id: "p2", name: "19mm Round Box", category: "Conduits and fittings", price: 0.5, stock: 500, description: "Round electrical box for conduit terminations.", unit: "each", weightKg: 0.1, serviceTag: "installation" },
  { id: "p3", name: "19mm PVC Couplings", category: "Conduits and fittings", price: 0.1, stock: 2000, description: "Couplings for joining 19mm conduits.", unit: "each", weightKg: 0.05, serviceTag: "installation" },
  { id: "p4", name: "19mm PVC Nipples", category: "Conduits and fittings", price: 0.1, stock: 2000, description: "Nipples for conduit connection and cable passage.", unit: "each", weightKg: 0.05, serviceTag: "installation" },
  { id: "p5", name: "3x6 Flush Boxes", category: "Boxes and panels", price: 1, stock: 300, description: "Flush boxes for switch and socket installations.", unit: "each", weightKg: 0.2, serviceTag: "installation" },
  { id: "p6", name: "3x3 Flush Boxes", category: "Boxes and panels", price: 0.8, stock: 300, description: "Compact flush boxes for electrical accessories.", unit: "each", weightKg: 0.15, serviceTag: "installation" },
  { id: "p7", name: "24 Way DP Box", category: "Boxes and panels", price: 40, stock: 25, description: "Distribution protection box for breaker layout.", unit: "each", weightKg: 3, serviceTag: "distribution" },
  { id: "p8", name: "25mm PVC Conduits", category: "Conduits and fittings", price: 1.5, stock: 200, description: "Heavier-duty conduit for larger cable runs.", unit: "each", weightKg: 0.25, serviceTag: "installation" },
  { id: "p9", name: "25mm PVC Nipples", category: "Conduits and fittings", price: 0.5, stock: 500, description: "25mm nipples for conduit fittings.", unit: "each", weightKg: 0.08, serviceTag: "installation" },
  { id: "p10", name: "25mm PVC Couplings", category: "Conduits and fittings", price: 0.5, stock: 500, description: "Couplings for 25mm conduit runs.", unit: "each", weightKg: 0.08, serviceTag: "installation" },
  { id: "p11", name: "1.5mm Red Cable", category: "Cables", price: 35, stock: 100, description: "Single-core red cable for lighting circuits.", unit: "coil", weightKg: 4, serviceTag: "wiring" },
  { id: "p12", name: "1.5mm Black Cable", category: "Cables", price: 35, stock: 100, description: "Single-core black cable for lighting circuits.", unit: "coil", weightKg: 4, serviceTag: "wiring" },
  { id: "p13", name: "2.5mm Red Cable", category: "Cables", price: 40, stock: 100, description: "Socket circuit cable with durable insulation.", unit: "coil", weightKg: 5, serviceTag: "wiring" },
  { id: "p14", name: "2.5mm Black Cable", category: "Cables", price: 40, stock: 100, description: "Black insulated cable for socket wiring.", unit: "coil", weightKg: 5, serviceTag: "wiring" },
  { id: "p15", name: "2.5mm Earth Cable", category: "Cables", price: 40, stock: 100, description: "Earth cable for safe grounding installations.", unit: "coil", weightKg: 5, serviceTag: "wiring" },
  { id: "p16", name: "6mm Red Cable", category: "Cables", price: 1.2, stock: 500, description: "Heavy-duty red cable sold per meter.", unit: "meter", weightKg: 0.1, serviceTag: "power" },
  { id: "p17", name: "6mm Black Cable", category: "Cables", price: 1.2, stock: 500, description: "Heavy-duty black cable sold per meter.", unit: "meter", weightKg: 0.1, serviceTag: "power" },
  { id: "p18", name: "6mm Earth Cable", category: "Cables", price: 1.2, stock: 500, description: "Heavy-duty earth cable sold per meter.", unit: "meter", weightKg: 0.1, serviceTag: "power" },
  { id: "p19", name: "13A Double Socket", category: "Sockets and switches", price: 6, stock: 150, description: "Double socket outlet for domestic use.", unit: "each", weightKg: 0.25, serviceTag: "installation" },
  { id: "p20", name: "15A Double Socket", category: "Sockets and switches", price: 7, stock: 150, description: "15A socket for high-load appliance use.", unit: "each", weightKg: 0.25, serviceTag: "installation" },
  { id: "p21", name: "Single Socket Outlet", category: "Sockets and switches", price: 4, stock: 150, description: "Single socket outlet for standard domestic installations.", unit: "each", weightKg: 0.2, serviceTag: "installation" },
  { id: "p22", name: "Double Waterproof Socket", category: "Sockets and switches", price: 20, stock: 60, description: "Weather-resistant double socket for outdoor use.", unit: "each", weightKg: 0.35, serviceTag: "outdoor" },
  { id: "p23", name: "1 Gang 2 Way Switch", category: "Sockets and switches", price: 3, stock: 120, description: "Single-gang two-way switch.", unit: "each", weightKg: 0.12, serviceTag: "installation" },
  { id: "p24", name: "2 Gang 2 Way Switch", category: "Sockets and switches", price: 3.5, stock: 120, description: "Two-gang two-way wall switch.", unit: "each", weightKg: 0.14, serviceTag: "installation" },
  { id: "p25", name: "3 Gang 2 Way Switch", category: "Sockets and switches", price: 4, stock: 120, description: "Three-gang two-way switch.", unit: "each", weightKg: 0.16, serviceTag: "installation" },
  { id: "p26", name: "Cooker Control Unit", category: "Control units", price: 10, stock: 60, description: "Cooker control unit for kitchen power management.", unit: "each", weightKg: 0.5, serviceTag: "kitchen" }
];

export class HardwareDatabase {
  private db!: Database;
  private SQL!: SqlJsStatic;
  private moduleDir = path.dirname(fileURLToPath(import.meta.url));
  private dbPath = path.resolve(this.moduleDir, "../data/hardware.sqlite");
  private legacyDbPath = path.resolve(process.cwd(), "apps/api/data/hardware.sqlite");

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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
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
          product.serviceTag
        ]);
      }
      stmt.free();
      await this.persist();
    }
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
}
