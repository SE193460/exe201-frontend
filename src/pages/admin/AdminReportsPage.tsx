import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../api/services/auth";
import {
    fetchAllReports,
    type Report
}
    from "../../api/services/reports";

export default function AdminReportsPage() {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [reports, setReports] = useState<Report[]>([]);

    useEffect(() => {

        loadReports();

    }, []);

    const loadReports = async () => {

        try {

            const data =
                await fetchAllReports();

            setReports(data);

        }
        catch {

            setError(
                "Không tải được báo cáo"
            );

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
                                    Quản lý báo cáo
                                </p>

                                <h2 className="text-2xl font-bold">
                                    Lịch sử báo cáo
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
                                {reports.length} báo cáo
                            </span>

                        </div>
                    </section>

                    {error && (
                        <section className="rounded-[24px] border border-red-100 bg-white p-4 text-sm text-red-600 shadow-sm">
                            {error}
                        </section>
                    )}


                    <div className="rounded-[24px] border border-orange-100 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)] overflow-x-auto">

                        <table className="w-full table-auto">

                            <thead
                                className="bg-orange-50"
                            >

                                <tr>

                                    <th>Người báo cáo</th>

                                    <th>Email</th>

                                    <th>Bài đăng</th>

                                    <th>Chủ bài</th>

                                    <th>Lý do</th>

                                    <th>Ngày</th>

                                    <th>Trạng thái</th>

                                </tr>

                            </thead>

                            <tbody>

                                {reports.map(item => (

                                    <tr
                                        key={item.id}
                                        className="
border-b
hover:bg-orange-50
"
                                    >

                                        <td>{item.reporterName}</td>

                                        <td>{item.reporterEmail}</td>

                                        <td>{item.listingTitle}</td>

                                        <td>{item.listingOwner}</td>

                                        <td>{item.reason}</td>

                                        <td>

                                            {new Date(
                                                    item.created_at
                                                ).toLocaleString()}

                                        </td>

                                        <td>

                                            <span
                                                className="
rounded-full
bg-yellow-100
px-3
py-1
text-xs
font-semibold
text-yellow-700
"
                                            >

                                                {item.status}

                                            </span>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                </main>
            </div>
        </div>

    )

}