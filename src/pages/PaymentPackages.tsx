import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { generateQR, confirmTransfer } from "../api/services/payments";
import UserShell from "@/layouts/UserShell";
import { Sparkles, Crown, CheckCircle, Copy, Phone, MessageCircleMore, AlertTriangle } from "lucide-react";

const packages = [
    {
        name: "Gói 5.000đ",
        amount: 5000,
        duration: "1 ngày",
        icon: Sparkles,
        benefits: [
            "Đẩy bài lên trang đầu",
            "Hiệu lực 1 ngày"
        ]
    },
    {
        name: "Gói 15.000đ",
        amount: 15000,
        duration: "7 ngày",
        icon: Crown,
        benefits: [
            "Đẩy bài lên trang đầu",
            "Hiển thị ưu tiên 7 ngày"
        ]
    }
];

export default function PaymentPackages() {
    const { listingId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<any>(null);
    const [qrData, setQrData] = useState<any>(null);
    const [submitted, setSubmitted] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleSelectPackage = async (pkg: any) => {
        setSelected(pkg);
        setQrData(null);
        setSubmitted(false);
        try {
            const data = await generateQR({ listingId: listingId!, amount: pkg.amount });
            setQrData(data);
        } catch {
            alert("Không thể tạo mã QR");
        }
    };

    const handleCopyContent = () => {
        if (qrData?.content) {
            navigator.clipboard.writeText(qrData.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleConfirmTransfer = async () => {
        if (!selected) return;
        try {
            setLoading(true);
            await confirmTransfer({
                listingId: listingId!,
                amount: selected.amount,
                packageName: selected.name,
            });
            setSubmitted(true);
        } catch {
            alert("Xác nhận thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <UserShell>
            <div className="min-h-screen bg-white p-8">
                <div className="mx-auto max-w-[1200px]">
                    <h1 className="text-3xl font-black mb-2">Thanh toán đẩy bài đăng</h1>
                    <p className="text-slate-500 mb-8">Chọn gói và chuyển khoản theo hướng dẫn</p>

                    {submitted ? (
                        <div className="rounded-[24px] bg-white p-10 border-2 border-green-200 shadow-[0_20px_50px_-35px_rgba(34,197,94,0.3)] text-center">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-green-700 mb-2">Đã ghi nhận yêu cầu!</h2>
                            <p className="text-slate-500">Vui lòng chờ admin xác nhận thanh toán. Bạn sẽ nhận được thông báo khi gói được kích hoạt.</p>
                            <button
                                onClick={() => navigate("/payment-history")}
                                className="mt-6 rounded-full bg-[#ff6a3d] px-8 py-3 text-white font-bold"
                            >
                                Xem lịch sử
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                {packages.map(pkg => {
                                    const Icon = pkg.icon;
                                    const isSelected = selected?.name === pkg.name;
                                    return (
                                        <div
                                            key={pkg.name}
                                            onClick={() => handleSelectPackage(pkg)}
                                            className={`cursor-pointer rounded-[24px] bg-white p-6 border-2 transition ${
                                                isSelected ? "border-orange-500 shadow-[0_20px_50px_-20px_rgba(255,136,0,0.4)]" : "border-orange-100 shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)]"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <Icon className={`h-6 w-6 ${isSelected ? "text-orange-500" : "text-slate-400"}`} />
                                                <h2 className="font-black text-xl">{pkg.name}</h2>
                                            </div>
                                            <p className="text-3xl font-black text-[#ff6a3d]">{pkg.amount.toLocaleString()}đ</p>
                                            <p className="text-sm text-slate-500 mt-2">Hiệu lực: {pkg.duration}</p>
                                            <div className="mt-5 space-y-1">
                                                {pkg.benefits.map((item: string, i: number) => (
                                                    <p key={i} className="text-sm text-slate-600">✓ {item}</p>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {qrData && (
                                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                                    <div className="rounded-[24px] bg-white p-8 border border-orange-100 shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)]">
                                        <h3 className="text-lg font-bold mb-4 text-center">Chuyển khoản đến</h3>

                                        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                                            <div className="rounded-2xl border-2 border-orange-100 p-2 bg-white">
                                                <img src={qrData.qrUrl} alt="QR chuyển khoản" className="w-56 h-56 object-contain" />
                                            </div>

                                            <div className="space-y-3 text-sm">
                                                <div>
                                                    <p className="font-semibold text-slate-500">Người nhận</p>
                                                    <p className="font-bold">{qrData.recipientInfo.name}</p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-500">Số điện thoại</p>
                                                    <p className="font-bold">{qrData.recipientInfo.phone}</p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-500">Số tiền</p>
                                                    <p className="font-bold text-[#ff6a3d] text-lg">{qrData.amount.toLocaleString()}đ</p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-500">Nội dung chuyển khoản</p>
                                                    <div className="text-xs text-slate-400 mb-1">

                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold bg-orange-50 px-3 py-1 rounded-lg border border-orange-200 text-sm">{qrData.content}</span>
                                                        <button onClick={handleCopyContent} className="p-1.5 rounded-lg hover:bg-orange-50 transition">
                                                            <Copy className={`h-4 w-4 ${copied ? "text-green-500" : "text-slate-400"}`} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                                            <div className="flex items-center gap-2 font-semibold mb-3">
                                                <AlertTriangle className="h-4 w-4 text-amber-700" />
                                                <span>Hướng dẫn:</span>
                                            </div>
                                            <ul className="mt-1 space-y-1 list-disc pl-4">
                                                <li>Mở ứng dụng <strong>ngân hàng</strong> hoặc <strong>Momo</strong> trên điện thoại</li>
                                                <li>Quét mã QR hoặc chuyển khoản đến số <strong>{qrData.recipientInfo.phone}</strong></li>
                                                <li>Nhập nội dung chuyển khoản: <strong className="font-mono">{qrData.example}</strong></li>
                                                <li>Sau khi chuyển, nhấn nút bên dưới để xác nhận</li>
                                            </ul>
                                        </div>

                                        <div className="mt-6 text-center">
                                            <button
                                                disabled={loading}
                                                onClick={handleConfirmTransfer}
                                                className="rounded-full bg-[#ff6a3d] px-10 py-3.5 text-white font-bold text-base hover:bg-[#e55d35] transition disabled:opacity-50"
                                            >
                                                {loading ? "Đang xử lý..." : "Tôi đã chuyển khoản"}
                                            </button>
                                        </div>
                                    </div>

                                    <aside className="lg:sticky lg:top-24 lg:self-start">
                                        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 text-sm text-slate-700 shadow-[0_20px_50px_-35px_rgba(59,130,246,0.35)]">
                                            <h4 className="text-base font-bold text-slate-800">Lưu ý thanh toán</h4>
                                            <div className="mt-3 space-y-2 leading-relaxed">
                                                <p>- Vui lòng không thay đổi số tiền và nội dung chuyển khoản.</p>
                                                <p>- Sau khi thanh toán thành công, hệ thống sẽ được kích hoạt sau khi quản trị viên xác nhận giao dịch.</p>
                                                <p>- Sau khi gói đã được kích hoạt, không hỗ trợ hoàn tiền, trừ trường hợp:</p>
                                                <p className="pl-4">+ Lỗi từ hệ thống.</p>
                                                <p className="pl-4">+ Quản trị viên xác nhận giao dịch sai.</p>
                                                <p>- Nếu gặp vấn đề, vui lòng liên hệ:</p>
                                            </div>

                                            <div className="mt-4 flex flex-col gap-3">
                                                <a
                                                    href="tel:0842494586"
                                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff6a3d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e65a2f]"
                                                >
                                                    <Phone className="h-4 w-4" />
                                                    SĐT: 0842494586
                                                </a>
                                                <a
                                                    href="https://zalo.me/0704542270"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                                >
                                                    <MessageCircleMore className="h-4 w-4" />
                                                    Zalo: 0704542270
                                                </a>
                                            </div>

                                            <div className="mt-4 space-y-1.5 leading-relaxed">
                                                <p>+ Email: <a href="mailto:support.roomie@gmail.com" className="font-semibold text-slate-800 hover:text-orange-600">support.roomie@gmail.com</a></p>
                                                <p>+ Thời gian hỗ trợ: 8:00 - 20:00</p>
                                            </div>
                                        </div>
                                    </aside>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </UserShell>
    )
}