export const zimbabweRegions = [
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

export type ZimbabweRegion = (typeof zimbabweRegions)[number];

export const regionBaseFee: Record<ZimbabweRegion, number> = {
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

export const regionArrivalHours: Record<ZimbabweRegion, number> = {
  Harare: 24,
  Bulawayo: 48,
  Manicaland: 72,
  "Mashonaland Central": 60,
  "Mashonaland East": 48,
  "Mashonaland West": 60,
  Masvingo: 72,
  "Matabeleland North": 72,
  "Matabeleland South": 72,
  Midlands: 60
};

export function computeDeliveryFee(region: ZimbabweRegion, totalWeightKg: number, express: boolean): number {
  const zoneBase = regionBaseFee[region];
  const weightBand = totalWeightKg <= 2 ? 0 : totalWeightKg <= 10 ? 3 : 8;
  const serviceFee = express ? 5 : 0;
  return zoneBase + weightBand + serviceFee;
}

export function estimateArrivalAt(region: ZimbabweRegion, now = Date.now()): string {
  const hours = regionArrivalHours[region] ?? 72;
  return new Date(now + hours * 60 * 60 * 1000).toISOString();
}
