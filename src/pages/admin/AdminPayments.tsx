import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../api/services/auth";

import {
    fetchAllPaymentHistory,
    type PaymentTransaction
}
    from "../../api/services/payments";

export default function AdminPayments() {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [payments, setPayments] =
        useState<PaymentTransaction[]>([]);

    useEffect(() => {

        loadData();

    }, []);

    const loadData = async () => {

        try {

            const data =
                await fetchAllPaymentHistory();

            setPayments(data);

        }
        catch {

            setError("Không tải được lịch sử giao dịch");

        }

    }

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            localStorage.removeItem("access_token");
            navigate("/");
        }
    };
    return (

        <div className="min-h-screen bg-[#fff7f2] text-slate-800">
            <div className="mx-auto flex min-h-screen w-full max-w-[1400px] gap-6 px-6 py-8">
                <aside className="w-full max-w-[250px] rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)] flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-lg font-semibold">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ff6a3d] text-white">🏠</span>
                            RoomMate Admin
                        </div>
                        <div className="mt-8 space-y-2 text-sm font-semibold">
                            <button
                                onClick={() => navigate("/home")}
                                className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50"
                            >
                                Trang chủ
                            </button>
                            <button
                                className="w-full rounded-full bg-orange-100 px-4 py-2 text-left text-orange-700"
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => navigate("/admin/users")}
                                className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50"
                            >
                                Quản lý người dùng
                            </button>
                            <button
                                onClick={() => navigate("/admin/listings")}
                                className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50"
                            >
                                Quản lý bài đăng
                            </button>
                            <button
                                onClick={() => navigate("/admin/imported-listings")}
                                className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50"
                            >
                                Quản lý nguồn bài đăng
                            </button>
                            <button
                                onClick={() => navigate("/admin/amenities")}
                                className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50"
                            >
                                Quản lý tiện nghi
                            </button>
                            <button
                                onClick={() => navigate("/admin/payments")}
                                className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50"
                            >
                                Quản lý thanh toán
                            </button>

                            <button
                                onClick={() => navigate("/admin/reports")}
                                className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50"
                            >
                                Báo cáo
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-orange-50"
                    >
                        Đăng xuất
                    </button>
                </aside>

                <main className="flex-1 space-y-6">
                    <section className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">

                        <div className="flex items-center justify-between mb-6">

                            <div>
                                <p className="text-sm font-semibold text-orange-500">
                                    Quản lý thanh toán
                                </p>

                                <h2 className="text-2xl font-bold">
                                    Lịch sử giao dịch
                                </h2>
                            </div>

                            <span className="
        rounded-full
        bg-orange-100
        px-4
        py-2
        text-sm
        font-semibold
        text-orange-700
        ">
                                {payments.length} giao dịch
                            </span>

                        </div>
                    </section>

                    {error && (
                        <section className="rounded-[24px] border border-red-100 bg-white p-4 text-sm text-red-600 shadow-sm">
                            {error}
                        </section>
                    )}
                    <section className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">

                        <div className="overflow-x-auto rounded-[20px] border border-orange-100">

                            <table className="w-full">

                                <thead className="bg-orange-50">

                                    <tr className="text-left">

                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                                            User
                                        </th>

                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                                            Email
                                        </th>

                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                                            Bài đăng
                                        </th>

                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                                            Gói
                                        </th>

                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                                            Tiền
                                        </th>

                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                                            Trạng thái
                                        </th>

                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                                            Ngày
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {payments.map((item) => (

                                        <tr
                                            key={item.id}
                                            className="
                        border-t
                        border-orange-50
                        hover:bg-orange-50/40
                        transition
                        "
                                        >

                                            <td className="px-6 py-4 font-medium">
                                                {item.userName || "-"}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {item.userEmail || "-"}
                                            </td>

                                            <td className="px-6 py-4">
                                                {item.listingTitle || "-"}
                                            </td>

                                            <td className="px-6 py-4">

                                                <span
                                                    className="
                                rounded-full
                                bg-blue-100
                                px-3
                                py-1
                                text-xs
                                font-semibold
                                text-blue-700
                                "
                                                >
                                                    {item.packageName}
                                                </span>

                                            </td>

                                            <td className="
                        px-6
                        py-4
                        font-bold
                        text-[#ff6a3d]
                        ">

                                                {item.amount.toLocaleString()}đ

                                            </td>

                                            <td className="px-6 py-4">

                                                <span
                                                    className="
                                rounded-full
                                bg-green-100
                                px-3
                                py-1
                                text-xs
                                font-semibold
                                text-green-700
                                "
                                                >
                                                    {item.status}
                                                </span>

                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-500">

                                                {new Date(
                                                    item.created_at
                                                ).toLocaleString()}


                                            </td>

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