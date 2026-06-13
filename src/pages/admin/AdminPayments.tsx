import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../api/services/auth";
import {
    fetchAllPaymentHistory,
    fetchPendingPayments,
    adminConfirmPayment,
    type PaymentTransaction
} from "../../api/services/payments";
import Sidebar from "../../components/Sidebar";

export default function AdminPayments() {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [payments, setPayments] = useState<PaymentTransaction[]>([]);
    const [pending, setPending] = useState<(PaymentTransaction & { listing_id: string; user_id: string })[]>([]);

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
            setError("Không tải được dữ liệu");
        }
    };

    const handleConfirm = async (transactionId: string) => {
        try {
            await adminConfirmPayment(transactionId);
            loadData();
        } catch {
            alert("Xác nhận thất bại");
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

    const statusBadge = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-yellow-100 text-yellow-700";
            case "COMPLETED": return "bg-green-100 text-green-700";
            default: return "bg-slate-100 text-slate-500";
        }
    };

    return (
        <div className="min-h-screen bg-[#fff7f2] text-slate-800">
            <div className="mx-auto flex min-h-screen w-full max-w-[1400px] gap-6 px-6 py-8">
                <Sidebar activeKey="payments" onLogout={handleLogout} />

                <main className="flex-1 space-y-6">
                    <section className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-sm font-semibold text-orange-500">Quản lý thanh toán</p>
                                <h2 className="text-2xl font-bold">Lịch sử giao dịch</h2>
                            </div>
                            <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
                                {payments.length} giao dịch
                            </span>
                        </div>
                    </section>

                    {error && (
                        <section className="rounded-[24px] border border-red-100 bg-white p-4 text-sm text-red-600 shadow-sm">
                            {error}
                        </section>
                    )}

                    {/* Pending payments section */}
                    {pending.length > 0 && (
                        <section className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)] border-2 border-yellow-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-yellow-700">Chờ xác nhận ({pending.length})</h3>
                            </div>
                            <div className="overflow-x-auto rounded-[20px] border border-yellow-100">
                                <table className="w-full">
                                    <thead className="bg-yellow-50">
                                        <tr className="text-left">
                                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Người dùng</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Bài đăng</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Gói</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Tiền</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Ngày</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pending.map((item) => (
                                            <tr key={item.id} className="border-t border-yellow-50 hover:bg-yellow-50/40 transition">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium">{item.userName || "-"}</div>
                                                    <div className="text-xs text-slate-400">{item.userEmail || ""}</div>
                                                </td>
                                                <td className="px-6 py-4">{item.listingTitle || "-"}</td>
                                                <td className="px-6 py-4">
                                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">{item.packageName}</span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-[#ff6a3d]">{item.amount.toLocaleString()}đ</td>
                                                <td className="px-6 py-4 text-sm text-slate-500">{new Date(item.created_at).toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleConfirm(item.id)}
                                                        className="rounded-full bg-green-100 px-4 py-2 text-xs font-bold text-green-700 hover:bg-green-200 transition"
                                                    >
                                                        Xác nhận
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* All transactions */}
                    <section className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">
                        <div className="overflow-x-auto rounded-[20px] border border-orange-100">
                            <table className="w-full">
                                <thead className="bg-orange-50">
                                    <tr className="text-left">
                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Người dùng</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Bài đăng</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Gói</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Tiền</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Trạng thái</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Ngày</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((item) => (
                                        <tr key={item.id} className="border-t border-orange-50 hover:bg-orange-50/40 transition">
                                            <td className="px-6 py-4">
                                                <div className="font-medium">{item.userName || "-"}</div>
                                                <div className="text-xs text-slate-400">{item.userEmail || ""}</div>
                                            </td>
                                            <td className="px-6 py-4">{item.listingTitle || "-"}</td>
                                            <td className="px-6 py-4">
                                                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">{item.packageName}</span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-[#ff6a3d]">{item.amount.toLocaleString()}đ</td>
                                            <td className="px-6 py-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(item.status)}`}>{item.status}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{new Date(item.created_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    )
}
