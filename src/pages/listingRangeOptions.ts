export type RangeOption = { id: string; label: string };

export const PRICE_OPTIONS: RangeOption[] = [
  { id: "all", label: "Tất cả" },
  { id: "under_1m", label: "Dưới 1 triệu" },
  { id: "1m_2m", label: "Từ 1 - 2 triệu" },
  { id: "2m_3m", label: "Từ 2 - 3 triệu" },
  { id: "3m_5m", label: "Từ 3 - 5 triệu" },
  { id: "5m_7m", label: "Từ 5 - 7 triệu" },
  { id: "7m_10m", label: "Từ 7 - 10 triệu" },
  { id: "10m_15m", label: "Từ 10 - 15 triệu" },
  { id: "over_15m", label: "Trên 15 triệu" },
];

export const AREA_OPTIONS: RangeOption[] = [
  { id: "all", label: "Tất cả" },
  { id: "under_20", label: "Dưới 20 m2" },
  { id: "20_30", label: "Từ 20 - 30m2" },
  { id: "30_50", label: "Từ 30 - 50m2" },
  { id: "50_70", label: "Từ 50 - 70m2" },
  { id: "70_90", label: "Từ 70 - 90m2" },
  { id: "over_90", label: "Trên 90m2" },
];

export function matchPriceRange(price: number, range: string) {
  switch (range) {
    case "under_1m":
      return price < 1_000_000;
    case "1m_2m":
      return price >= 1_000_000 && price < 2_000_000;
    case "2m_3m":
      return price >= 2_000_000 && price < 3_000_000;
    case "3m_5m":
      return price >= 3_000_000 && price < 5_000_000;
    case "5m_7m":
      return price >= 5_000_000 && price < 7_000_000;
    case "7m_10m":
      return price >= 7_000_000 && price < 10_000_000;
    case "10m_15m":
      return price >= 10_000_000 && price < 15_000_000;
    case "over_15m":
      return price >= 15_000_000;
    default:
      return true;
  }
}

export function matchAreaRange(area: number | null | undefined, range: string) {
  if (range === "all") return true;
  if (!area) return false;

  switch (range) {
    case "under_20":
      return area < 20;
    case "20_30":
      return area >= 20 && area < 30;
    case "30_50":
      return area >= 30 && area < 50;
    case "50_70":
      return area >= 50 && area < 70;
    case "70_90":
      return area >= 70 && area < 90;
    case "over_90":
      return area >= 90;
    default:
      return true;
  }
}

export function priceRangeToBounds(range: string): { min: number | null; max: number | null } {
  switch (range) {
    case "under_1m":
      return { min: null, max: 1_000_000 };
    case "1m_2m":
      return { min: 1_000_000, max: 2_000_000 };
    case "2m_3m":
      return { min: 2_000_000, max: 3_000_000 };
    case "3m_5m":
      return { min: 3_000_000, max: 5_000_000 };
    case "5m_7m":
      return { min: 5_000_000, max: 7_000_000 };
    case "7m_10m":
      return { min: 7_000_000, max: 10_000_000 };
    case "10m_15m":
      return { min: 10_000_000, max: 15_000_000 };
    case "over_15m":
      return { min: 15_000_000, max: null };
    default:
      return { min: null, max: null };
  }
}

export function areaRangeToBounds(range: string): { min: number | null; max: number | null } {
  switch (range) {
    case "under_20":
      return { min: null, max: 20 };
    case "20_30":
      return { min: 20, max: 30 };
    case "30_50":
      return { min: 30, max: 50 };
    case "50_70":
      return { min: 50, max: 70 };
    case "70_90":
      return { min: 70, max: 90 };
    case "over_90":
      return { min: 90, max: null };
    default:
      return { min: null, max: null };
  }
}
