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
    { value: 1, label: "Rất sạch: Dọn dẹp thường xuyên, khó chịu khi phòng bừa bộn" },
    { value: 2, label: "Khá sạch: Giữ phòng gọn gàng, dọn dẹp định kỳ" },
    { value: 3, label: "Bình thường: Dọn dẹp khi cần thiết, không quá khắt khe nhưng vẫn muốn không gian sạch sẽ" },
    { value: 4, label: "Ít quan tâm: Không đặt nặng việc dọn dẹp thường xuyên, ưu tiên sự thoải mái trong sinh hoạt" },
  ],
  ac_usage: [
    { value: 1, label: "Hầu như không dùng: Chỉ bật trong những ngày rất nóng" },
    { value: 2, label: "Ít: Thỉnh thoảng bật khi cảm thấy nóng" },
    { value: 3, label: "Bình thường: Bật khi thời tiết nóng hoặc lúc ngủ" },
    { value: 4, label: "Nhiều: Bật thường xuyên khi ở trong phòng" },
    { value: 5, label: "Gần như luôn bật: Bật gần như toàn bộ thời gian ở phòng" },
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
    { value: 1, label: "Hiếm khi: Chỉ trong những dịp đặc biệt." },
    { value: 2, label: "Thỉnh thoảng: Đôi khi có bạn bè ghé chơi hoặc trò chuyện." },
    { value: 3, label: "Thường xuyên: Khá thường xuyên có bạn bè tới phòng." },
  ],
  home_frequency: [
    { value: 3, label: "Thường xuyên: Dành phần lớn thời gian trong ngày ở phòng" },
    { value: 2, label: "Bình thường" },
    { value: 1, label: "Ít: Phần lớn thời gian trong ngày ở bên ngoài" },
  ],
  work_schedule: [
    { value: "DAY", label: "Chủ yếu ban ngày: Học tập hoặc làm việc chủ yếu vào ban ngày" },
    { value: "FLEXIBLE", label: "Không cố định: Lịch sinh hoạt thay đổi hoặc không cố định" },
    { value: "NIGHT", label: "Chủ yếu ban đêm: Học tập hoặc làm việc chủ yếu vào buổi tối hoặc ban đêm" },
  ],
  sharing: [
    { value: 1, label: "Thoải mái: Không quá để ý việc roommate sử dụng các đồ dùng chung hoặc mượn những vật dụng nhỏ." },
    { value: 2, label: "Hỏi trước: Thoải mái chia sẻ nhưng muốn được hỏi hoặc báo trước." },
    { value: 3, label: "Không thích: Ưu tiên sử dụng đồ dùng riêng, không thích việc dùng chung đồ cá nhân." },
  ],
  noise: [
    { value: 1, label: "Yên tĩnh: Thường đeo tai nghe, hạn chế tạo tiếng ồn ảnh hưởng tới người khác." },
    { value: 2, label: "Bình thường: Có tạo tiếng ồn trong sinh hoạt nhưng ở mức hợp lý." },
    { value: 3, label: "Khá ồn ào: Thường xuyên mở loa ngoài, hát, chơi nhạc hoặc tạo tiếng ồn trong phòng." },
  ],
  call_frequency: [
    { value: 1, label: "Hiếm khi" },
    { value: 2, label: "Thỉnh thoảng" },
    { value: 3, label: "Khá thường xuyên" },
    { value: 4, label: "Thường xuyên" },
  ],
  game_mic: [
    { value: 1, label: "Hầu như không: Ít hoặc không chơi game có sử dụng mic" },
    { value: 2, label: "Thỉnh thoảng: Đôi khi chơi game có sử dụng mic hoặc voice chat" },
    { value: 3, label: "Khá thường xuyên: Chơi game có sử dụng mic tương đối đều đặn" },
    { value: 4, label: "Thường xuyên: Dành khá nhiều thời gian chơi game có sử dụng mic hoặc voice chat" },
  ],
} as const;

export const FILTER_LINEAR_OPTIONS = {
  cleanliness: [
    { value: 1, label: "Rất sạch: Ưu tiên người dọn dẹp thường xuyên, thích phòng luôn gọn gàng" },
    { value: 2, label: "Khá sạch: Ưu tiên người giữ phòng gọn gàng và dọn dẹp định kỳ" },
    { value: 3, label: "Bình thường: Dọn dẹp khi cần thiết, không quá khắt khe nhưng vẫn muốn không gian sạch sẽ" },
    { value: 4, label: "Ít quan tâm: Không đặt nặng việc dọn dẹp thường xuyên, ưu tiên sự thoải mái trong sinh hoạt" },
  ],
  ac_usage: [
    { value: 1, label: "Hầu như không dùng: Ưu tiên roommate chỉ bật điều hòa trong những ngày rất nóng" },
    { value: 2, label: "Ít: Ưu tiên roommate thỉnh thoảng bật điều hòa khi cảm thấy nóng" },
    { value: 3, label: "Bình thường: Ưu tiên roommate bật điều hòa khi thời tiết nóng hoặc lúc ngủ" },
    { value: 4, label: "Nhiều: Ưu tiên roommate thường xuyên bật điều hòa khi ở trong phòng" },
    { value: 5, label: "Gần như luôn bật: Ưu tiên roommate bật điều hòa gần như toàn bộ thời gian ở phòng" },
  ],
  cooking: [
    { value: 1, label: "Thường xuyên" },
    { value: 2, label: "Thỉnh thoảng" },
    { value: 3, label: "Hiếm khi" },
  ],
  guest: [
    { value: 1, label: "Hiếm khi: Ưu tiên roommate chỉ dẫn bạn về phòng trong những dịp đặc biệt." },
    { value: 2, label: "Thỉnh thoảng: Ưu tiên roommate đôi khi có bạn bè ghé chơi hoặc trò chuyện." },
    { value: 3, label: "Thường xuyên: Ưu tiên roommate thường xuyên có bạn bè tới phòng." },
  ],
  home_frequency: [
    { value: 3, label: "Thường xuyên: Ưu tiên roommate dành phần lớn thời gian trong ngày ở phòng" },
    { value: 2, label: "Bình thường: Ưu tiên roommate cân bằng giữa thời gian ở phòng và bên ngoài" },
    { value: 1, label: "Ít: Ưu tiên roommate dành phần lớn thời gian trong ngày ở bên ngoài" },
  ],
  noise: [
    { value: 1, label: "Yên tĩnh: Thường đeo tai nghe, hạn chế tạo tiếng ồn ảnh hưởng tới người khác." },
    { value: 2, label: "Bình thường: Có tạo tiếng ồn trong sinh hoạt nhưng ở mức hợp lý." },
    { value: 3, label: "Khá ồn ào: Thường xuyên mở loa ngoài, hát, chơi nhạc hoặc tạo tiếng ồn trong phòng." },
  ],
  call_frequency: [
    { value: 1, label: "Hiếm khi" },
    { value: 2, label: "Thỉnh thoảng" },
    { value: 3, label: "Khá thường xuyên" },
    { value: 4, label: "Thường xuyên" },
  ],
  game_mic: [
    { value: 1, label: "Hầu như không: Ít hoặc không chơi game có sử dụng mic" },
    { value: 2, label: "Thỉnh thoảng: Đôi khi chơi game có sử dụng mic hoặc voice chat" },
    { value: 3, label: "Khá thường xuyên: Chơi game có sử dụng mic tương đối đều đặn" },
    { value: 4, label: "Thường xuyên: Dành khá nhiều thời gian chơi game có sử dụng mic hoặc voice chat" },
  ],
} as const;

export const PREF_OPTIONS = {
  intAny: { value: 99, label: "Cái nào cũng được" },
  pet: [
    { value: "LOVE", label: "Có, tôi rất thích thú cưng" },
    { value: "ANY", label: "Cái nào cũng được" },
    { value: "DISLIKE", label: "Không thích" },
    { value: "NEVER", label: "Bắt buộc không được nuôi thú cưng" },
  ],
  smoking: [
    { value: "YES", label: "Có" },
    { value: "ANY", label: "Cái nào cũng được" },
    { value: "DISLIKE", label: "Không thích" },
    { value: "NEVER", label: "Bắt buộc không hút thuốc" },
  ],
  work_schedule: [
    { value: "DAY", label: "Chủ yếu ban ngày: Ưu tiên roommate học tập hoặc làm việc chủ yếu vào ban ngày" },
    { value: "NIGHT", label: "Chủ yếu ban đêm: Ưu tiên roommate học tập hoặc làm việc chủ yếu vào buổi tối hoặc ban đêm" },
    { value: "ANY", label: "Cái nào cũng được" },
  ],
  sharing: [
    { value: "OPEN", label: "Thoải mái: Không quá để ý việc roommate sử dụng các đồ dùng chung hoặc mượn những vật dụng nhỏ." },
    { value: "ASK", label: "Hỏi trước: Thoải mái chia sẻ nhưng muốn được hỏi hoặc báo trước." },
    { value: "PRIVATE", label: "Không thích: Ưu tiên sử dụng đồ dùng riêng, không thích việc dùng chung đồ cá nhân." },
    { value: "ANY", label: "Cái nào cũng được" },
  ],
} as const;
