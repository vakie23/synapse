import assert from "node:assert/strict";
import test from "node:test";
import { priceOrderLines } from "./order-pricing.js";

const catalog = new Map([
  ["p1", { price: 1.2, weightKg: 0.2, stock: 10, name: "19mm PVC Conduits" }],
  ["p7", { price: 40, weightKg: 3, stock: 2, name: "24 Way DB Box" }]
]);

test("priceOrderLines calculates subtotal and weight-based delivery", () => {
  const result = priceOrderLines(
    [
      { productId: "p1", quantity: 2 },
      { productId: "p7", quantity: 1 }
    ],
    "Harare",
    (productId) => catalog.get(productId)
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.subtotal, 42.4);
  assert.equal(result.totalWeightKg, 3.4);
  assert.equal(result.deliveryFee, 7);
  assert.equal(result.total, 49.4);
});

test("priceOrderLines rejects unknown products", () => {
  const result = priceOrderLines([{ productId: "missing", quantity: 1 }], "Harare", (productId) => catalog.get(productId));
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.message, /Unknown product/);
});

test("priceOrderLines rejects insufficient stock", () => {
  const result = priceOrderLines([{ productId: "p7", quantity: 5 }], "Harare", (productId) => catalog.get(productId));
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.message, /Insufficient stock/);
});
