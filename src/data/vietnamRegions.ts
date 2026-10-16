// Helpers for working with the 34 provincial units (2025 reform) in filters and
// on the map. The heavy data lives in the auto-generated files next to this one.

import { VIETNAM_PROVINCES, type VietnamProvince } from "./vietnamProvinces";
import { VIETNAM_WARDS_2025 } from "./vietnamWards";

export { VIETNAM_PROVINCES };
export type { VietnamProvince };

/** Simplified 34-province boundary overlay used by the region map. */
export const PROVINCE_GEOJSON_URL = "/data/vietnam-provinces-34.geojson";

/** Lowercase, strip diacritics and common "Tỉnh/Thành phố/TP" prefixes. */
export function normalizeRegionText(value: string | null | undefined): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^(thanh pho|tinh|tp)\s+/, "");
}

/**
 * Legacy (pre-2025) province/city names mapped onto the merged 2025 province.
 * Keys are already normalised with `normalizeRegionText`.
 */
const PROVINCE_ALIASES: Record<string, string> = {
  // HCMC absorbed Bình Dương + Bà Rịa - Vũng Tàu
  hcm: "Hồ Chí Minh",
  "sai gon": "Hồ Chí Minh",
  "binh duong": "Hồ Chí Minh",
  "ba ria vung tau": "Hồ Chí Minh",
  "ba ria": "Hồ Chí Minh",
  "vung tau": "Hồ Chí Minh",
  "thu dau mot": "Hồ Chí Minh",
  "di an": "Hồ Chí Minh",
  "thuan an": "Hồ Chí Minh",
  // Hải Phòng absorbed Hải Dương
  "hai duong": "Hải Phòng",
  // Đà Nẵng absorbed Quảng Nam
  "quang nam": "Đà Nẵng",
  // Huế (was Thừa Thiên Huế)
  "thua thien hue": "Huế",
  "thua thien": "Huế",
  // Cần Thơ absorbed Sóc Trăng + Hậu Giang
  "soc trang": "Cần Thơ",
  "hau giang": "Cần Thơ",
  // An Giang absorbed Kiên Giang
  "kien giang": "An Giang",
  // Bắc Ninh absorbed Bắc Giang
  "bac giang": "Bắc Ninh",
  // Cà Mau absorbed Bạc Liêu
  "bac lieu": "Cà Mau",
  // Đắk Lắk absorbed Phú Yên
  "phu yen": "Đắk Lắk",
  // Đồng Nai absorbed Bình Phước
  "binh phuoc": "Đồng Nai",
  // Đồng Tháp absorbed Tiền Giang
  "tien giang": "Đồng Tháp",
  // Gia Lai absorbed Bình Định
  "binh dinh": "Gia Lai",
  // Hưng Yên absorbed Thái Bình
  "thai binh": "Hưng Yên",
  // Khánh Hòa absorbed Ninh Thuận
  "ninh thuan": "Khánh Hòa",
  // Lào Cai absorbed Yên Bái
  "yen bai": "Lào Cai",
  // Lâm Đồng absorbed Đắk Nông + Bình Thuận
  "dak nong": "Lâm Đồng",
  "binh thuan": "Lâm Đồng",
  // Ninh Bình absorbed Hà Nam + Nam Định
  "ha nam": "Ninh Bình",
  "nam dinh": "Ninh Bình",
  // Phú Thọ absorbed Vĩnh Phúc + Hòa Bình
  "vinh phuc": "Phú Thọ",
  "hoa binh": "Phú Thọ",
  // Quảng Ngãi absorbed Kon Tum
  "kon tum": "Quảng Ngãi",
  // Quảng Trị absorbed Quảng Bình
  "quang binh": "Quảng Trị",
  // Tây Ninh absorbed Long An
  "long an": "Tây Ninh",
  // Thái Nguyên absorbed Bắc Kạn
  "bac kan": "Thái Nguyên",
  // Tuyên Quang absorbed Hà Giang
  "ha giang": "Tuyên Quang",
  // Vĩnh Long absorbed Bến Tre + Trà Vinh
  "ben tre": "Vĩnh Long",
  "tra vinh": "Vĩnh Long",
};

const BY_NORMALIZED = new Map<string, VietnamProvince>();
for (const province of VIETNAM_PROVINCES) {
  BY_NORMALIZED.set(normalizeRegionText(province.name), province);
  if (province.nameEn) BY_NORMALIZED.set(normalizeRegionText(province.nameEn), province);
  if (province.fullName) BY_NORMALIZED.set(normalizeRegionText(province.fullName), province);
}

export function findProvince(name: string | null | undefined): VietnamProvince | undefined {
  if (!name) return undefined;
  const key = normalizeRegionText(name);
  const direct = BY_NORMALIZED.get(key);
  if (direct) return direct;
  const alias = PROVINCE_ALIASES[key];
  return alias ? BY_NORMALIZED.get(normalizeRegionText(alias)) : undefined;
}

/**
 * Best-effort resolution of a free-text location (city, address) to a canonical
 * 2025 province name. Falls back to substring matching so legacy addresses still
 * resolve to the right merged province.
 */
export function resolveProvinceName(input: string | null | undefined): string | null {
  if (!input) return null;
  const key = normalizeRegionText(input);
  if (!key) return null;

  const direct = BY_NORMALIZED.get(key);
  if (direct) return direct.name;

  const alias = PROVINCE_ALIASES[key];
  if (alias) return alias;

  // Substring scan (longest first so "ba ria vung tau" wins over "vung tau").
  const candidates = [
    ...VIETNAM_PROVINCES.map((p) => [normalizeRegionText(p.name), p.name] as const),
    ...Object.entries(PROVINCE_ALIASES),
  ].sort((a, b) => b[0].length - a[0].length);

  for (const [needle, province] of candidates) {
    if (needle.length >= 3 && key.includes(needle)) return province;
  }

  return null;
}

/** Ward/commune names for a province (canonical name), sorted A→Z. */
export function getWardsForProvince(provinceName: string | null | undefined): string[] {
  const province = findProvince(provinceName);
  if (!province) return [];
  return VIETNAM_WARDS_2025[province.name] ?? [];
}

/** True when `needle` appears inside `haystack`, accent/space-insensitively. */
export function regionTextIncludes(
  haystack: string | null | undefined,
  needle: string | null | undefined,
): boolean {
  if (!needle) return true;
  const hay = normalizeRegionText(haystack);
  const nee = normalizeRegionText(needle);
  return nee.length > 0 && hay.includes(nee);
}
