import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, TrendingUp, Crown, Search, SlidersHorizontal, Download, Eye } from "lucide-react";
import { fetchMyPaymentHistory, type PaymentTransaction } from "../api/services/payments";
import UserShell from "@/layouts/UserShell";

type StatusFilter = "all" | "COMPLETED" | "PENDING" | "FAILED";

export default function PaymentHistory() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  useEffect(() => {
    fetchMyPaymentHistory()
      .then((data) => setPayments(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = payments;
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.code && p.code.toLowerCase().includes(q)) ||
          (p.packageName && p.packageName.toLowerCase().includes(q)) ||
          (p.listingTitle && p.listingTitle.toLowerCase().includes(q))
      );
    }
    return result;
  }, [payments, statusFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalSpent = payments
    .filter((p) => p.status === "COMPLETED" && p.amount < 0)
    .reduce((sum, p) => sum + Math.abs(p.amount), 0);

  function statusBadge(status: string) {
    switch (status) {
      case "COMPLETED":
        return { text: "Thành công", cls: "bg-emerald-50 text-emerald-700" };
      case "PENDING":
        return { text: "Đang xử lý", cls: "bg-amber-50 text-amber-700" };
      case "FAILED":
        return { text: "Thất bại", cls: "bg-red-50 text-red-600" };
      default:
        return { text: status, cls: "bg-slate-100 text-slate-600" };
    }
  }

  function formatAmount(amount: number) {
    const abs = Math.abs(amount);
    const formatted = abs.toLocaleString("vi-VN") + " đ";
    return amount >= 0 ? `+ ${formatted}` : `- ${formatted}`;
  }

  function amountColor(amount: number) {
    return amount >= 0 ? "text-[var(--primary)]" : "text-[var(--primary)]";
  }

  return (
    <UserShell>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 md:px-6">
        {/* Header */}
        <header>
          <h1 className="text-2xl font-extrabold text-[var(--on-surface)] md:text-3xl" style={{ fontFamily: "var(--font-main)" }}>
            Lịch sử thanh toán
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý và theo dõi tất cả các giao dịch tài chính của bạn tại RoomieMatch.
          </p>
        </header>

        {/* Stats cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-slate-200 bg-white p-5">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--primary-container)]">
              <Wallet className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Số dư hiện tại</p>
              <p className="text-lg font-extrabold text-[var(--on-surface)]">0 đ</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-slate-200 bg-white p-5">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--primary-container)]">
              <TrendingUp className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Tổng chi tiêu tháng này</p>
              <p className="text-lg font-extrabold text-[var(--on-surface)]">{totalSpent.toLocaleString("vi-VN")} đ</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-slate-200 bg-white p-5">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--primary-container)]">
              <Crown className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Gói thành viên</p>
              <p className="text-lg font-extrabold text-[var(--on-surface)]">Free</p>
            </div>
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 sm:w-72">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã giao dịch..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              <SlidersHorizontal className="h-4 w-4" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
                className="bg-transparent text-sm outline-none"
              >
                <option value="all">Bộ lọc</option>
                <option value="COMPLETED">Thành công</option>
                <option value="PENDING">Đang xử lý</option>
                <option value="FAILED">Thất bại</option>
              </select>
            </div>
            <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
              <Download className="h-4 w-4" />
              Xuất file
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-slate-200 bg-white">
          {/* Desktop table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-[var(--surface)]">
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Ngày giao dịch</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Mã giao dịch</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Dịch vụ</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Số tiền</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Trạng thái</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-sm text-slate-400">
                      <span className="inline-block h-6 w-6 animate-spin rounded-full border-[3px] border-[var(--primary)] border-t-transparent" />
                      <p className="mt-2">Đang tải...</p>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-sm text-slate-400">
                      Không có giao dịch nào.
                    </td>
                  </tr>
                ) : (
                  paginated.map((item) => {
                    const badge = statusBadge(item.status);
                    const date = new Date(item.created_at);
                    return (
                      <tr key={item.id} className="border-b border-slate-50 transition hover:bg-slate-50/50">
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-700">{date.toLocaleDateString("vi-VN")}</p>
                          <p className="text-xs text-slate-400">{date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</p>
                        </td>
                        <td className="px-5 py-4 font-mono text-sm font-semibold text-slate-700">
                          #{item.code || item.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-700">{item.packageName}</p>
                          {item.listingTitle && (
                            <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">"{item.listingTitle}"</p>
                          )}
                        </td>
                        <td className={`px-5 py-4 font-bold ${amountColor(item.amount)}`}>
                          {formatAmount(item.amount)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${item.status === "COMPLETED" ? "bg-emerald-500" : item.status === "PENDING" ? "bg-amber-500" : "bg-red-500"}`} />
                            {badge.text}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => navigate(`/payment-history/${item.id}`)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[var(--primary-container)] hover:text-[var(--primary)]"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer: count + pagination */}
          {!loading && filtered.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
              <p className="text-xs text-slate-500">
                Hiển thị {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filtered.length)} của {filtered.length} giao dịch
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition ${
                      p === page
                        ? "bg-[var(--primary)] text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </UserShell>
  );
}
