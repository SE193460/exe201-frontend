/**
 * Built-in localizations for fixed, DB/code-sourced values.
 *
 * Free-text listing content is translated on demand by the backend
 * (`/api/translations/listings`), but geography and fixed option values come
 * from here so the map and filters render correctly with no round-trip.
 */

export type ContentLocale = "vi" | "en" | "ja";

/** Province names (2025 reform) — VI is the key. */
export const PROVINCE_EN: Record<string, string> = {
  "An Giang": "An Giang",
  "Bắc Ninh": "Bac Ninh",
  "Cà Mau": "Ca Mau",
  "Cao Bằng": "Cao Bang",
  "Cần Thơ": "Can Tho",
  "Đà Nẵng": "Da Nang",
  "Đắk Lắk": "Dak Lak",
  "Điện Biên": "Dien Bien",
  "Đồng Nai": "Dong Nai",
  "Đồng Tháp": "Dong Thap",
  "Gia Lai": "Gia Lai",
  "Hà Nội": "Hanoi",
  "Hà Tĩnh": "Ha Tinh",
  "Hải Phòng": "Haiphong",
  "Hồ Chí Minh": "Ho Chi Minh",
  Huế: "Hue",
  "Hưng Yên": "Hung Yen",
  "Khánh Hòa": "Khanh Hoa",
  "Lai Châu": "Lai Chau",
  "Lạng Sơn": "Lang Son",
  "Lào Cai": "Lao Cai",
  "Lâm Đồng": "Lam Dong",
  "Nghệ An": "Nghe An",
  "Ninh Bình": "Ninh Binh",
  "Phú Thọ": "Phu Tho",
  "Quảng Ngãi": "Quang Ngai",
  "Quảng Ninh": "Quang Ninh",
  "Quảng Trị": "Quang Tri",
  "Sơn La": "Son La",
  "Tây Ninh": "Tay Ninh",
  "Thái Nguyên": "Thai Nguyen",
  "Thanh Hóa": "Thanh Hoa",
  "Tuyên Quang": "Tuyen Quang",
  "Vĩnh Long": "Vinh Long",
};

export const PROVINCE_JA: Record<string, string> = {
  "An Giang": "アンザン",
  "Bắc Ninh": "バクニン",
  "Cà Mau": "カマウ",
  "Cao Bằng": "カオバン",
  "Cần Thơ": "カントー",
  "Đà Nẵng": "ダナン",
  "Đắk Lắk": "ダクラク",
  "Điện Biên": "ディエンビエン",
  "Đồng Nai": "ドンナイ",
  "Đồng Tháp": "ドンタップ",
  "Gia Lai": "ザライ",
  "Hà Nội": "ハノイ",
  "Hà Tĩnh": "ハティン",
  "Hải Phòng": "ハイフォン",
  "Hồ Chí Minh": "ホーチミン",
  Huế: "フエ",
  "Hưng Yên": "フンイエン",
  "Khánh Hòa": "カインホア",
  "Lai Châu": "ライチャウ",
  "Lạng Sơn": "ランソン",
  "Lào Cai": "ラオカイ",
  "Lâm Đồng": "ラムドン",
  "Nghệ An": "ゲアン",
  "Ninh Bình": "ニンビン",
  "Phú Thọ": "フートー",
  "Quảng Ngãi": "クアンガイ",
  "Quảng Ninh": "クアンニン",
  "Quảng Trị": "クアンチ",
  "Sơn La": "ソンラ",
  "Tây Ninh": "タイニン",
  "Thái Nguyên": "タイグエン",
  "Thanh Hóa": "タインホア",
  "Tuyên Quang": "トゥエンクアン",
  "Vĩnh Long": "ヴィンロン",
};

/** Find the geographic label for a province in the requested locale. */
export function provinceLabel(name: string | null | undefined, locale: ContentLocale): string {
  if (!name) return "";
  if (locale === "en") return PROVINCE_EN[name] ?? name;
  if (locale === "ja") return PROVINCE_JA[name] ?? name;
  return name;
}
