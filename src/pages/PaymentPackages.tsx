import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation();
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
            <div className="min-h-screen bg-[var(--surface)] p-8">
                <div className="mx-auto max-w-[1200px]">
                    <h1 className="text-3xl font-extrabold text-[var(--on-surface)] mb-2" style={{ fontFamily: "var(--font-main)" }}>{t("Thanh toán đẩy bài đăng")}</h1>
                    <p className="text-slate-500 mb-8">{t("Chọn gói và chuyển khoản theo hướng dẫn")}</p>

                    {submitted ? (
                        <div className="rounded-[var(--radius-md)] border border-emerald-200 bg-white p-10 text-center">
                            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-emerald-700 mb-2">{t("Đã ghi nhận yêu cầu!")}</h2>
                            <p className="text-slate-500">{t("Vui lòng chờ admin xác nhận thanh toán. Bạn sẽ nhận được thông báo khi gói được kích hoạt.")}</p>
                            <button
                                onClick={() => navigate("/payment-history")}
                                className="mt-6 rounded-[var(--radius-md)] bg-[var(--primary)] px-8 py-3 text-white font-bold hover:opacity-90 transition"
                            >
                                {t("Xem lịch sử")}
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
                                            className={`cursor-pointer rounded-[var(--radius-md)] border-2 bg-white p-6 transition ${
                                                isSelected ? "border-[var(--primary)] shadow-[0_8px_30px_-8px_rgba(255,140,0,0.3)]" : "border-slate-200 hover:border-[var(--primary)]/40"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <Icon className={`h-6 w-6 ${isSelected ? "text-[var(--primary)]" : "text-slate-400"}`} />
                                                <h2 className="font-bold text-xl text-[var(--on-surface)]">{pkg.name}</h2>
                                            </div>
                                            <p className="text-3xl font-extrabold text-[var(--primary)]">{pkg.amount.toLocaleString()}đ</p>
                                            <p className="text-sm text-slate-500 mt-2">{t("Hiệu lực:")} {pkg.duration}</p>
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
                                    <div className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-8">
                                        <h3 className="text-lg font-bold text-[var(--on-surface)] mb-4 text-center">{t("Chuyển khoản đến")}</h3>

                                        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                                            <div className="rounded-[var(--radius-md)] border-2 border-[var(--primary-container)] p-2 bg-white">
                                                <img src={qrData.qrUrl} alt="QR chuyển khoản" className="w-56 h-56 object-contain" />
                                            </div>

                                            <div className="space-y-3 text-sm">
                                                <div>
                                                    <p className="font-semibold text-slate-500">{t("Người nhận")}</p>
                                                    <p className="font-bold text-[var(--on-surface)]">{qrData.recipientInfo.name}</p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-500">{t("Số điện thoại")}</p>
                                                    <p className="font-bold text-[var(--on-surface)]">{qrData.recipientInfo.phone}</p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-500">{t("Số tiền")}</p>
                                                    <p className="font-bold text-[var(--primary)] text-lg">{qrData.amount.toLocaleString()}đ</p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-500">{t("Nội dung chuyển khoản")}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="font-mono font-bold bg-[var(--primary-container)] px-3 py-1 rounded-[var(--radius-md)] border border-[var(--primary)]/30 text-sm text-[var(--on-surface)]">{qrData.content}</span>
                                                        <button onClick={handleCopyContent} className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--primary-container)] transition">
                                                            <Copy className={`h-4 w-4 ${copied ? "text-emerald-500" : "text-slate-400"}`} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 rounded-[var(--radius-md)] bg-[var(--primary-container)]/40 border border-[var(--primary)]/20 p-4 text-sm text-amber-800">
                                            <div className="flex items-center gap-2 font-semibold mb-3 text-[var(--primary)]">
                                                <AlertTriangle className="h-4 w-4" />
                                                <span>{t("Hướng dẫn:")}</span>
                                            </div>
                                            <ul className="mt-1 space-y-1 list-disc pl-4 text-slate-700">
                                                <li>{t("Mở ứng dụng")} <strong>{t("ngân hàng")}</strong> {t("hoặc")} <strong>Momo</strong> {t("trên điện thoại")}</li>
                                                <li>{t("Quét mã QR hoặc chuyển khoản đến số")} <strong>{qrData.recipientInfo.phone}</strong></li>
                                                <li>{t("Nhập nội dung chuyển khoản:")} <strong className="font-mono">{qrData.example}</strong></li>
                                                <li>{t("Sau khi chuyển, nhấn nút bên dưới để xác nhận")}</li>
                                            </ul>
                                        </div>

                                        <div className="mt-6 text-center">
                                            <button
                                                disabled={loading}
                                                onClick={handleConfirmTransfer}
                                                className="rounded-[var(--radius-md)] bg-[var(--primary)] px-10 py-3.5 text-white font-bold text-base hover:opacity-90 transition disabled:opacity-50"
                                            >
                                                {loading ? t("Đang xử lý...") : t("Tôi đã chuyển khoản")}
                                            </button>
                                        </div>
                                    </div>

                                    <aside className="lg:sticky lg:top-24 lg:self-start">
                                        <div className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-5 text-sm text-slate-700">
                                            <h4 className="text-base font-bold text-[var(--on-surface)]">{t("Lưu ý thanh toán")}</h4>
                                            <div className="mt-3 space-y-2 leading-relaxed text-slate-600">
                                                <p>- {t("Vui lòng không thay đổi số tiền và nội dung chuyển khoản.")}</p>
                                                <p>- {t("Sau khi thanh toán thành công, hệ thống sẽ được kích hoạt sau khi quản trị viên xác nhận giao dịch.")}</p>
                                                <p>- {t("Sau khi gói đã được kích hoạt, không hỗ trợ hoàn tiền, trừ trường hợp:")}</p>
                                                <p className="pl-4">+ {t("Lỗi từ hệ thống.")}</p>
                                                <p className="pl-4">+ {t("Quản trị viên xác nhận giao dịch sai.")}</p>
                                                <p>- {t("Nếu gặp vấn đề, vui lòng liên hệ:")}</p>
                                            </div>

                                            <div className="mt-4 flex flex-col gap-3">
                                                <a
                                                    href="tel:0842494586"
                                                    className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                                                >
                                                    <Phone className="h-4 w-4" />
                                                    {t("SĐT: 0842494586")}
                                                </a>
                                                <a
                                                    href="https://zalo.me/0704542270"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                                >
                                                    <MessageCircleMore className="h-4 w-4" />
                                                    {t("Zalo: 0704542270")}
                                                </a>
                                            </div>

                                            <div className="mt-4 space-y-1.5 leading-relaxed text-slate-600">
                                                <p>+ {t("Email:")} <a href="mailto:support.roomie@gmail.com" className="font-semibold text-slate-800 hover:text-[var(--primary)]">{t("support.roomie@gmail.com")}</a></p>
                                                <p>+ {t("Thời gian hỗ trợ: 8:00 - 20:00")}</p>
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