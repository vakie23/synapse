import assert from "node:assert/strict";
import test from "node:test";
import { computeDeliveryFee, estimateArrivalAt } from "./delivery.js";

test("computeDeliveryFee uses region base fee for light orders", () => {
  assert.equal(computeDeliveryFee("Harare", 1.5, false), 4);
  assert.equal(computeDeliveryFee("Bulawayo", 2, false), 7);
});

test("computeDeliveryFee adds weight band above 2kg", () => {
  assert.equal(computeDeliveryFee("Harare", 5, false), 7);
  assert.equal(computeDeliveryFee("Harare", 12, false), 12);
});

test("computeDeliveryFee adds express surcharge", () => {
  assert.equal(computeDeliveryFee("Harare", 1, true), 9);
});

test("estimateArrivalAt returns ISO timestamp in the future", () => {
  const now = Date.parse("2026-06-04T12:00:00.000Z");
  const arrival = estimateArrivalAt("Harare", now);
  assert.equal(arrival, "2026-06-05T12:00:00.000Z");
});
