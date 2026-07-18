import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAmenity, deleteAmenity, fetchAdminAmenities, updateAmenity, type Amenity } from "../../api/services/amenities";
import { logout } from "../../api/services/auth";
import Pagination from "../../components/Pagination";
import Sidebar from "../../components/Sidebar";

export default function AdminAmenitiesPage() {
  const navigate = useNavigate();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const loadAmenities = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminAmenities();
      setAmenities(data);
    } catch {
      setError("Không thể tải danh sách tiện nghi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAmenities();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setActionLoading(true);
    setError("");
    try {
      await createAmenity(trimmed);
      setName("");
      setPage(1);
      await loadAmenities();
    } catch (err: any) {
      const status = err?.response?.status;
      setError(status === 409 ? "Tiện nghi đã tồn tại." : "Không thể tạo tiện nghi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartEdit = (amenity: Amenity) => {
    setEditingId(amenity.id);
    setEditingName(amenity.name);
  };

  const handleSaveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingId) return;
    const trimmed = editingName.trim();
    if (!trimmed) return;
    setActionLoading(true);
    setError("");
    try {
      await updateAmenity(editingId, trimmed);
      setEditingId(null);
      setEditingName("");
      await loadAmenities();
    } catch (err: any) {
      const status = err?.response?.status;
      setError(status === 409 ? "Tiện nghi đã tồn tại." : "Không thể cập nhật tiện nghi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (amenityId: string) => {
    const confirmed = window.confirm("Bạn chắc chắn muốn xóa tiện nghi này?");
    if (!confirmed) return;
    setActionLoading(true);
    setError("");
    try {
      await deleteAmenity(amenityId);
      await loadAmenities();
    } catch (err: any) {
      const status = err?.response?.status;
      setError(status === 409 ? "Không thể xóa: tiện nghi đang được sử dụng." : "Không thể xóa tiện nghi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      localStorage.removeItem("access_token");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] gap-6 px-6 py-8">
        <Sidebar activeKey="amenities" onLogout={handleLogout} />

        <main className="flex-1 space-y-6">
          <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--primary)]">Bảng điều khiển</p>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900" style={{ fontFamily: "var(--font-main)" }}>Quản lý tiện nghi</h1>
              <p className="mt-1 text-sm text-slate-500">Tạo, cập nhật và kiểm soát tiện nghi cho bài đăng.</p>
            </div>
          </section>

          {error && (
            <div className="rounded-lg border border-red-200 bg-white p-4 text-sm text-red-600">{error}</div>
          )}

          <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-bold text-slate-700">Thêm tiện nghi</h2>
              <form onSubmit={handleCreate} className="mt-4 space-y-3">
                <input value={name} onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--primary)] transition" placeholder="Ví dụ: Máy lạnh, Wifi" />
                <button disabled={actionLoading}
                  className="w-full rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-50">
                  {actionLoading ? "Đang lưu..." : "Thêm tiện nghi"}
                </button>
              </form>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700">Danh sách tiện nghi</h2>
                {loading && <span className="text-xs text-slate-400">Đang tải...</span>}
              </div>
              <div className="mt-4 space-y-2">
                {amenities.length === 0 ? (
                  <p className="text-sm text-slate-400">Chưa có tiện nghi nào.</p>
                ) : amenities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((amenity) => (
                  <div key={amenity.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 bg-white">
                    {editingId === amenity.id ? (
                      <form onSubmit={handleSaveEdit} className="flex w-full items-center gap-2">
                        <input value={editingName} onChange={(event) => setEditingName(event.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
                        <button type="submit" disabled={actionLoading}
                          className="rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-bold text-white hover:opacity-90 transition disabled:opacity-50">Lưu</button>
                        <button type="button" onClick={() => setEditingId(null)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition">Hủy</button>
                      </form>
                    ) : (
                      <>
                        <span className="text-sm font-semibold text-slate-800">{amenity.name}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleStartEdit(amenity)}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">Sửa</button>
                          <button onClick={() => handleDelete(amenity.id)}
                            className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition">Xóa</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <Pagination currentPage={page} totalPages={Math.ceil(amenities.length / PAGE_SIZE)} onPageChange={setPage} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
