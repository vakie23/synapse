import { computeDeliveryFee, type ZimbabweRegion } from "./delivery.js";

export type OrderProduct = {
  price: number;
  weightKg: number;
  stock: number;
  name: string;
};

export type OrderLineInput = {
  productId: string;
  quantity: number;
};

export type PricedOrderLine = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type OrderPricingResult =
  | {
      ok: true;
      lines: PricedOrderLine[];
      subtotal: number;
      totalWeightKg: number;
      deliveryFee: number;
      total: number;
    }
  | {
      ok: false;
      message: string;
    };

export function priceOrderLines(
  items: OrderLineInput[],
  region: ZimbabweRegion,
  getProduct: (productId: string) => OrderProduct | undefined,
  express = false
): OrderPricingResult {
  const lines: PricedOrderLine[] = [];

  for (const item of items) {
    const product = getProduct(item.productId);
    if (!product) {
      return { ok: false, message: `Unknown product: ${item.productId}` };
    }
    if (product.stock < item.quantity) {
      return { ok: false, message: `Insufficient stock for ${product.name}` };
    }
    lines.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.price
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const totalWeightKg = items.reduce((sum, item) => {
    const product = getProduct(item.productId)!;
    return sum + product.weightKg * item.quantity;
  }, 0);
  const deliveryFee = computeDeliveryFee(region, totalWeightKg, express);

  return {
    ok: true,
    lines,
    subtotal,
    totalWeightKg,
    deliveryFee,
    total: subtotal + deliveryFee
  };
}
