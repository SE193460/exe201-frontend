import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { logout } from "../../api/services/auth";
import {
    fetchAllPaymentHistory,
    fetchPendingPayments,
    adminConfirmPayment,
    type PaymentTransaction
} from "../../api/services/payments";
import Sidebar from "../../components/Sidebar";
import Pagination from "../../components/Pagination";

const PACKAGE_OPTIONS = [
    { value: "", label: "Tất cả gói" },
    { value: "Gói 5.000đ", label: "Gói 5.000đ" },
    { value: "Gói 15.000đ", label: "Gói 15.000đ" },
];

export default function AdminPayments() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [error, setError] = useState("");
    const [payments, setPayments] = useState<PaymentTransaction[]>([]);
    const [pending, setPending] = useState<(PaymentTransaction & { listing_id: string; user_id: string })[]>([]);
    const [searchCode, setSearchCode] = useState("");
    const [filterPackage, setFilterPackage] = useState("");
    const [pendingPage, setPendingPage] = useState(1);
    const [paymentsPage, setPaymentsPage] = useState(1);
    const PAGE_SIZE = 10;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [data, pendingData] = await Promise.all([
                fetchAllPaymentHistory(),
                fetchPendingPayments(),
            ]);
            setPayments(data);
            setPending(pendingData);
        } catch {
            setError(t("Không tải được dữ liệu"));
        }
    };

    const handleConfirm = async (transactionId: string) => {
        try {
            await adminConfirmPayment(transactionId);
            loadData();
        } catch {
            alert(t("Xác nhận thất bại"));
        }
    };

    const handleViewListing = (listingId?: string | null) => {
        if (!listingId) {
            alert(t("Giao dịch này không có bài đăng liên kết."));
            return;
        }
        navigate(`/listings/${listingId}`);
    };

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            localStorage.removeItem("access_token");
            navigate("/");
        }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-yellow-100 text-yellow-700";
            case "COMPLETED": return "bg-green-100 text-green-700";
            default: return "bg-slate-100 text-slate-500";
        }
    };

    const statusLabel = (status: string) => {
        switch (status) {
            case "PENDING": return t("Chờ duyệt");
            case "COMPLETED": return t("Hoàn thành");
            default: return status;
        }
    };

    const filteredPayments = useMemo(() => {
        return payments.filter((item) => {
            const matchCode = !searchCode || (item.code ?? "").toLowerCase().includes(searchCode.toLowerCase().trim());
            const matchPackage = !filterPackage || item.packageName === filterPackage;
            return matchCode && matchPackage;
        });
    }, [payments, searchCode, filterPackage]);

    const filteredPending = useMemo(() => {
        return pending.filter((item) => {
            const matchCode = !searchCode || (item.code ?? "").toLowerCase().includes(searchCode.toLowerCase().trim());
            const matchPackage = !filterPackage || item.packageName === filterPackage;
            return matchCode && matchPackage;
        });
    }, [pending, searchCode, filterPackage]);

    useEffect(() => {
        setPendingPage(1);
        setPaymentsPage(1);
    }, [searchCode, filterPackage]);

    const pendingTotalPages = Math.max(1, Math.ceil(filteredPending.length / PAGE_SIZE));
    const paymentsTotalPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
    const pagedPending = filteredPending.slice((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE);
    const pagedPayments = filteredPayments.slice((paymentsPage - 1) * PAGE_SIZE, paymentsPage * PAGE_SIZE);

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto flex min-h-screen w-full max-w-[1400px] gap-6 px-6 py-8">
                <Sidebar activeKey="payments" onLogout={handleLogout} />

                <main className="flex-1 space-y-6">
                    <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--primary)]">{t("Quản lý thanh toán")}</p>
                            <h1 className="mt-1 text-2xl font-extrabold text-slate-900" style={{ fontFamily: "var(--font-main)" }}>{t("Lịch sử giao dịch")}</h1>
                        </div>
                        <span className="self-start rounded-full bg-orange-50 px-4 py-2 text-xs font-bold text-[var(--primary)] border border-orange-200">{filteredPayments.length} / {payments.length} {t("giao dịch")}</span>
                    </section>

                    <div className="flex flex-wrap gap-3">
                        <input type="text" value={searchCode} onChange={(e) => setSearchCode(e.target.value)}
                            placeholder={t("Tìm theo mã (VD: RM260001)")}
                            className="w-56 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--primary)]" />
                        <select value={filterPackage} onChange={(e) => setFilterPackage(e.target.value)}
                            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--primary)]">
                            {PACKAGE_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                        </select>
                        {(searchCode || filterPackage) && (
                            <button onClick={() => { setSearchCode(""); setFilterPackage(""); }}
                                className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">{t("Xóa bộ lọc")}</button>
                        )}
                    </div>

                    {error && (
                        <div className="rounded-lg border border-red-200 bg-white p-4 text-sm text-red-600">{error}</div>
                    )}

                    {filteredPending.length > 0 && (
                        <section className="rounded-lg border border-amber-200 bg-white p-6">
                            <h3 className="mb-4 text-sm font-bold text-amber-700 uppercase tracking-wider">{t("Chờ xác nhận")} ({filteredPending.length})</h3>
                            <div className="overflow-x-auto rounded-lg border border-slate-100">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-amber-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                            <th className="px-4 py-3 text-left">{t("Mã GD")}</th>
                                            <th className="px-4 py-3 text-left">{t("Người dùng")}</th>
                                            <th className="px-4 py-3 text-left">{t("Gói")}</th>
                                            <th className="px-4 py-3 text-left">{t("Tiền")}</th>
                                            <th className="px-4 py-3 text-left">{t("Ngày")}</th>
                                            <th className="px-4 py-3 text-left">{t("Thao tác")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagedPending.map((item) => (
                                            <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                                                <td className="px-4 py-3"><span className="font-mono font-bold text-[var(--primary)] text-sm">{item.code ?? "-"}</span></td>
                                                <td className="px-4 py-3"><div className="font-medium text-sm">{item.userName || "-"}</div><div className="text-xs text-slate-400">{item.userEmail || ""}</div></td>
                                                <td className="px-4 py-3"><span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">{item.packageName}</span></td>
                                                <td className="px-4 py-3 font-bold text-[var(--primary)] text-sm">{Math.abs(item.amount).toLocaleString()}đ</td>
                                                <td className="px-4 py-3 text-sm text-slate-500">{new Date(item.created_at).toLocaleString("vi-VN")}</td>
                                                <td className="px-4 py-3 space-x-2">
                                                    <button onClick={() => handleViewListing(item.listingId || item.listing_id)}
                                                        className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition">{t("Xem bài đăng")}</button>
                                                    <button onClick={() => handleConfirm(item.id)}
                                                        className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 border border-green-200 hover:bg-green-100 transition">{t("Xác nhận")}</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-3"><Pagination currentPage={pendingPage} totalPages={pendingTotalPages} onPageChange={setPendingPage} /></div>
                        </section>
                    )}

                    <section className="rounded-lg border border-slate-200 bg-white p-6">
                        <h3 className="mb-4 text-sm font-bold text-slate-700 uppercase tracking-wider">{t("Tất cả giao dịch")}</h3>
                        <div className="overflow-x-auto rounded-lg border border-slate-100">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        <th className="px-4 py-3 text-left">{t("Mã GD")}</th>
                                        <th className="px-4 py-3 text-left">{t("Người dùng")}</th>
                                        <th className="px-4 py-3 text-left">{t("Gói")}</th>
                                        <th className="px-4 py-3 text-left">{t("Tiền")}</th>
                                        <th className="px-4 py-3 text-left">{t("Trạng thái")}</th>
                                        <th className="px-4 py-3 text-left">{t("Ngày")}</th>
                                        <th className="px-4 py-3 text-left">{t("Thao tác")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayments.length === 0 ? (
                                        <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-400">{t("Không tìm thấy giao dịch phù hợp.")}</td></tr>
                                    ) : pagedPayments.map((item) => (
                                        <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                                            <td className="px-4 py-3"><span className="font-mono font-bold text-[var(--primary)] text-sm">{item.code ?? "-"}</span></td>
                                            <td className="px-4 py-3"><div className="font-medium text-sm">{item.userName || "-"}</div><div className="text-xs text-slate-400">{item.userEmail || ""}</div></td>
                                            <td className="px-4 py-3"><span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">{item.packageName}</span></td>
                                            <td className="px-4 py-3 font-bold text-[var(--primary)] text-sm">{Math.abs(item.amount).toLocaleString()}đ</td>
                                            <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusBadge(item.status)}`}>{statusLabel(item.status)}</span></td>
                                            <td className="px-4 py-3 text-sm text-slate-500">{new Date(item.created_at).toLocaleString("vi-VN")}</td>
                                            <td className="px-4 py-3"><button onClick={() => handleViewListing(item.listingId)}
                                                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition">{t("Xem bài đăng")}</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-3"><Pagination currentPage={paymentsPage} totalPages={paymentsTotalPages} onPageChange={setPaymentsPage} /></div>
                    </section>
                </main>
            </div>
        </div>
    );
}
