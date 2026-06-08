export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
};

export const DISTRICT_OPTIONS = [
  "Quận 2",
  "Quận 9",
  "Thủ Đức",
];

export const PROFILE_OPTIONS = {
  cleanliness: [
    { value: 1, label: "Rất sạch" },
    { value: 2, label: "Khá sạch" },
    { value: 3, label: "Bình thường" },
    { value: 4, label: "Khá bừa bộn" },
  ],
  ac_usage: [
    { value: 1, label: "Hầu như không" },
    { value: 2, label: "Ít" },
    { value: 3, label: "Bình thường" },
    { value: 4, label: "Nhiều" },
    { value: 5, label: "Gần như luôn bật" },
  ],
  binary: [
    { value: 0, label: "Không" },
    { value: 1, label: "Có" },
  ],
  cooking: [
    { value: 1, label: "Thường xuyên" },
    { value: 2, label: "Thỉnh thoảng" },
    { value: 3, label: "Hiếm khi" },
  ],
  guest: [
    { value: 1, label: "Hiếm khi" },
    { value: 2, label: "Thỉnh thoảng" },
    { value: 3, label: "Thường xuyên" },
  ],
  home_frequency: [
    { value: 1, label: "Ít" },
    { value: 2, label: "Bình thường" },
    { value: 3, label: "Thường xuyên" },
  ],
  work_schedule: [
    { value: "DAY", label: "Ban ngày" },
    { value: "FLEXIBLE", label: "Không cố định" },
    { value: "NIGHT", label: "Ban đêm" },
  ],
  sharing: [
    { value: 1, label: "Thoải mái" },
    { value: 2, label: "Hỏi trước" },
    { value: 3, label: "Không thích" },
  ],
  noise: [
    { value: 1, label: "Yên tĩnh" },
    { value: 2, label: "Bình thường" },
    { value: 3, label: "Khá ồn ào" },
  ],
  call_frequency: [
    { value: 1, label: "Hiếm khi" },
    { value: 2, label: "Thỉnh thoảng" },
    { value: 3, label: "Khá thường xuyên" },
    { value: 4, label: "Thường xuyên" },
  ],
  game_mic: [
    { value: 1, label: "Hầu như không" },
    { value: 2, label: "Thỉnh thoảng" },
    { value: 3, label: "Khá thường xuyên" },
    { value: 4, label: "Thường xuyên" },
  ],
} as const;

export const PREF_OPTIONS = {
  intAny: { value: 99, label: "Cái nào cũng được" },
  pet: [
    { value: "LOVE", label: "Thích có thú cưng" },
    { value: "ANY", label: "Cái nào cũng được" },
    { value: "DISLIKE", label: "Không thích thú cưng" },
    { value: "NEVER", label: "Không chấp nhận nuôi" },
  ],
  smoking: [
    { value: "YES", label: "Có thể hút thuốc" },
    { value: "ANY", label: "Cái nào cũng được" },
    { value: "DISLIKE", label: "Không thích hút thuốc" },
    { value: "NEVER", label: "Bắt buộc không hút" },
  ],
  work_schedule: [
    { value: "DAY", label: "Ban ngày" },
    { value: "NIGHT", label: "Ban đêm" },
    { value: "ANY", label: "Cái nào cũng được" },
  ],
  sharing: [
    { value: "OPEN", label: "Thoải mái chia sẻ" },
    { value: "ASK", label: "Hỏi trước" },
    { value: "PRIVATE", label: "Không thích chia sẻ" },
    { value: "ANY", label: "Cái nào cũng được" },
  ],
} as const;
