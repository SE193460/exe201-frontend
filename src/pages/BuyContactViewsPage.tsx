import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosConfig";
import { purchaseContactViews } from "../api/services/contactViews";
import UserShell from "@/layouts/UserShell";
import { CheckCircle, Copy, Phone, MessageCircle, AlertTriangle, ShoppingCart, Crown } from "lucide-react";

const MOMO_PHONE = "0704542270";
const MOMO_NAME = "Luong Anh Mai";

const packages = [
  { views: 5, amount: 5000, label: "Gói 5 lượt xem hồ sơ lối sống - 5.000đ", pkgName: "Xem_lien_he_5", icon: ShoppingCart },
  { views: 20, amount: 15000, label: "Gói 20 lượt xem hồ sơ lối sống - 15.000đ", pkgName: "Xem_lien_he_20", icon: Crown },
];

export default function BuyContactViewsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [qrData, setQrData] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  const handleSelectPackage = async (pkg: any) => {
    setSelected(pkg);
    setQrData(null);
    setSubmitted(false);

    try {
      const data = await purchaseContactViews(pkg.amount, pkg.label);
      setQrData({
        qrUrl: data.qrUrl,
        content: data.content,
        amount: data.amount,
        recipientInfo: data.recipientInfo,
        example: data.example || data.content,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Không thể tạo mã QR";
      alert(msg);
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
      await axiosInstance.post("/api/contact-views/confirm-purchase", {
        amount: selected.amount,
        packageName: selected.label,
      });
      setSubmitted(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Vui lòng thử lại.";
      alert(`Xác nhận thất bại. ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserShell>
      <div className="min-h-screen bg-[var(--surface)] p-8">
        <div className="mx-auto max-w-[1200px]">
          <h1 className="text-3xl font-extrabold text-[var(--on-surface)] mb-2" style={{ fontFamily: "var(--font-main)" }}>Mua lượt xem hồ sơ lối sống</h1>
          <p className="text-slate-500 mb-8">Chọn gói và chuyển khoản theo hướng dẫn để mở hồ sơ lối sống của chủ bài đăng</p>

          {submitted ? (
            <div className="rounded-[var(--radius-md)] border border-emerald-200 bg-white p-10 text-center">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-emerald-700 mb-2">Đã ghi nhận yêu cầu!</h2>
              <p className="text-slate-500">Vui lòng chờ admin xác nhận thanh toán. Bạn sẽ nhận được thông báo khi gói được kích hoạt.</p>
              <button
                onClick={() => navigate("/payment-history")}
                className="mt-6 rounded-[var(--radius-md)] bg-[var(--primary)] px-8 py-3 text-white font-bold hover:opacity-90 transition"
              >
                Xem lịch sử
              </button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {packages.map((pkg) => {
                  const Icon = pkg.icon;
                  const isSelected = selected?.label === pkg.label;
                  return (
                    <div
                      key={pkg.label}
                      onClick={() => handleSelectPackage(pkg)}
                      className={`cursor-pointer rounded-[var(--radius-md)] border-2 bg-white p-6 transition ${
                        isSelected ? "border-[var(--primary)] shadow-[0_8px_30px_-8px_rgba(255,140,0,0.3)]" : "border-slate-200 hover:border-[var(--primary)]/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Icon className={`h-6 w-6 ${isSelected ? "text-[var(--primary)]" : "text-slate-400"}`} />
                        <h2 className="font-bold text-xl text-[var(--on-surface)]">{pkg.label}</h2>
                      </div>
                      <p className="text-3xl font-extrabold text-[var(--primary)]">{pkg.amount.toLocaleString()}đ</p>
                      <p className="text-sm text-slate-500 mt-2">{pkg.views} lượt xem</p>
                      <div className="mt-5 space-y-1">
                        <p className="text-sm text-slate-600">✓ Mở hồ sơ lối sống của chủ phòng</p>
                        <p className="text-sm text-slate-600">✓ Dùng cho từng bài đăng cần xem thêm</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {qrData && (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-8">
                    <h3 className="text-lg font-bold text-[var(--on-surface)] mb-4 text-center">Chuyển khoản đến</h3>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                      <div className="rounded-[var(--radius-md)] border-2 border-[var(--primary-container)] p-2 bg-white">
                        <img src={qrData.qrUrl} alt="QR chuyển khoản" className="w-56 h-56 object-contain" />
                      </div>

                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="font-semibold text-slate-500">Người nhận</p>
                          <p className="font-bold text-[var(--on-surface)]">{qrData.recipientInfo?.name || MOMO_NAME}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-500">Số điện thoại</p>
                          <p className="font-bold text-[var(--on-surface)]">{qrData.recipientInfo?.phone || MOMO_PHONE}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-500">Số tiền</p>
                          <p className="font-bold text-[var(--primary)] text-lg">{qrData.amount.toLocaleString()}đ</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-500">Nội dung chuyển khoản</p>
                          <div className="mt-1 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--primary)]/30 bg-[var(--primary-container)]/70 px-3 py-2">
                            <span className="font-mono text-sm font-bold text-[var(--on-surface)]">{qrData.content}</span>
                            <button onClick={handleCopyContent} className="ml-auto rounded-[var(--radius-md)] p-1.5 transition hover:bg-[var(--primary-container)]">
                              <Copy className={`h-4 w-4 ${copied ? "text-emerald-500" : "text-slate-400"}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--primary)]/20 bg-[var(--primary-container)]/40 p-4 text-sm text-amber-800">
                      <div className="mb-3 flex items-center gap-2 font-semibold text-[var(--primary)]">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Hướng dẫn:</span>
                      </div>
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-slate-700">
                        <li>Mở ứng dụng <strong>ngân hàng</strong> hoặc <strong>Momo</strong> trên điện thoại</li>
                        <li>Quét mã QR hoặc chuyển khoản đến số <strong>{qrData.recipientInfo?.phone || MOMO_PHONE}</strong></li>
                        <li>Nhập nội dung chuyển khoản: <strong className="font-mono">{qrData.example || qrData.content}</strong></li>
                        <li>Sau khi chuyển, nhấn nút bên dưới để xác nhận</li>
                      </ul>
                    </div>

                    <div className="mt-6 text-center">
                      <button
                        disabled={loading}
                        onClick={handleConfirmTransfer}
                        className="rounded-[var(--radius-md)] bg-[var(--primary)] px-10 py-3.5 text-white font-bold text-base hover:opacity-90 transition disabled:opacity-50"
                      >
                        {loading ? "Đang xử lý..." : "Tôi đã chuyển khoản"}
                      </button>
                    </div>
                  </div>

                  <aside className="lg:sticky lg:top-24 lg:self-start">
                    <div className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-5 text-sm text-slate-700">
                      <h4 className="text-base font-bold text-[var(--on-surface)]">Lưu ý thanh toán</h4>
                      <div className="mt-3 space-y-2 leading-relaxed text-slate-600">
                        <p>- Vui lòng không thay đổi số tiền và nội dung chuyển khoản.</p>
                        <p>- Sau khi thanh toán thành công, hệ thống sẽ được kích hoạt sau khi quản trị viên xác nhận giao dịch.</p>
                        <p>- Sau khi gói đã được kích hoạt, không hỗ trợ hoàn tiền, trừ trường hợp:</p>
                        <p className="pl-4">+ Lỗi từ hệ thống.</p>
                        <p className="pl-4">+ Quản trị viên xác nhận giao dịch sai.</p>
                        <p>- Nếu gặp vấn đề, vui lòng liên hệ:</p>
                      </div>

                      <div className="mt-4 flex flex-col gap-3">
                        <a href="tel:0842494586" className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
                          <Phone className="h-4 w-4" /> SĐT: 0842494586
                        </a>
                        <a href="https://zalo.me/0704542270" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                          <MessageCircle className="h-4 w-4" /> Zalo: 0704542270
                        </a>
                      </div>

                      <div className="mt-4 space-y-1.5 leading-relaxed text-slate-600">
                        <p>+ Email: <a href="mailto:support.roomie@gmail.com" className="font-semibold text-slate-800 hover:text-[var(--primary)]">support.roomie@gmail.com</a></p>
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
  );
}
