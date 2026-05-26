import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPublicListings, resolveListingImageUrl } from "../api/services/listings";
import type { Listing } from "../api/services/listings";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function PublicListingsPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPublicListings()
      .then((data) => {
        setListings(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Không thể tải danh sách phòng ở ghép.");
        setLoading(false);
      });
  }, []);

  const filteredListings = listings.filter((item) => {
    const text = `${item.title} ${item.description} ${item.city} ${item.district} ${item.ward} ${item.address}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#fff7f2] text-slate-800 flex flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-8 px-6 pb-16 pt-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
              🔥 Danh sách phòng
            </span>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Phòng ở ghép nổi bật</h1>
            <p className="mt-1 text-sm text-slate-500">Khám phá các phòng ở ghép đã qua duyệt uy tín trên toàn quốc.</p>
          </div>
          <div className="w-full max-w-sm">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm khu vực, quận huyện, tên phòng..."
              className="w-full rounded-full border border-orange-100 bg-white px-5 py-2.5 text-sm shadow-sm outline-none focus:border-orange-300 transition-all"
            />
          </div>
        </header>

        {loading && (
          <div className="flex h-64 items-center justify-center rounded-[24px] border border-orange-100 bg-white shadow-sm">
            <div className="text-center">
              <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></span>
              <p className="mt-2 text-sm text-slate-500 font-semibold">Đang tải danh sách phòng...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-[24px] border border-red-100 bg-white px-6 py-6 text-center text-red-600 shadow-sm">
            {error}
          </div>
        )}

        {!loading && !error && filteredListings.length === 0 && (
          <div className="rounded-[24px] border border-orange-100 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
            ❌ Không tìm thấy phòng phù hợp với tìm kiếm của bạn.
          </div>
        )}

        {!loading && !error && filteredListings.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => {
              const thumbnail = resolveListingImageUrl(listing.images?.[0]?.imageUrl || "");
              const location = [listing.ward, listing.district, listing.city].filter(Boolean).join(", ");
              return (
                <article
                  key={listing.id}
                  onClick={() => navigate(`/listings/${listing.id}`)}
                  className="group cursor-pointer overflow-hidden rounded-[24px] border border-orange-100 bg-white shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)] transition hover:-translate-y-1 hover:shadow-[0_30px_60px_-25px_rgba(255,115,0,0.45)]"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-orange-50">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={listing.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-orange-300">
                        Chưa cập nhật hình ảnh
                      </div>
                    )}
                    <span className="absolute left-4 top-4 rounded-full bg-slate-900/75 backdrop-blur px-3 py-1 text-xs font-semibold text-white">
                      {listing.roomType || "Phòng ở ghép"}
                    </span>
                    <span className="absolute right-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                      {listing.rentPrice.toLocaleString("vi-VN")} đ/tháng
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-[#ff6a3d] transition">
                      {listing.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                      {listing.description}
                    </p>

                    <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                      <span>📍</span>
                      <span className="line-clamp-1">{location || "Chưa cập nhật địa chỉ"}</span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-orange-50 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        👥 {listing.currentOccupants || 0}/{listing.maxOccupants || 4} thành viên
                      </span>
                      <span className="flex items-center gap-1">
                        📐 {listing.roomAreaSqm ? `${listing.roomAreaSqm} m²` : "Chưa rõ diện tích"}
                      </span>
                      <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-semibold text-orange-700">
                        {listing.preferredGender || "Mọi giới tính"}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
