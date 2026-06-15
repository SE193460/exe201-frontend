import { useState } from "react";
import { Link } from "react-router-dom";
import { submitFeedback } from "../api/services/feedback";
import { useToast } from "../contexts/ToastContext";

export default function Footer() {
  const { showToast } = useToast();
  const [openFeedback, setOpenFeedback] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setOpenFeedback(false);
    setContent("");
    setError("");
  };

  const handleSubmit = async () => {
    const message = content.trim();
    if (!message) {
      setError("Vui lòng nhập nội dung góp ý.");
      showToast({ type: "warning", message: "Vui lòng nhập nội dung góp ý." });
      return;
    }

    try {
      setSubmitting(true);
      await submitFeedback(message);
      showToast({
        type: "success",
        message: "Đã gửi feedback thành công. Cảm ơn bạn đã góp ý cho ROOMIE!",
      });
      handleClose();
    } catch {
      setError("Không thể gửi góp ý, vui lòng thử lại.");
      showToast({ type: "error", message: "Không thể gửi góp ý, vui lòng thử lại." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <footer className="border-t border-orange-100 bg-white/80">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-slate-500">
          <div>
            <p className="text-base font-semibold text-slate-700">ROOMIE</p>
            <p className="mt-1">Kết nối bạn ở ghép phù hợp và an toàn.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/my-listings" className="text-slate-500 hover:text-slate-700">
              Bài đăng của tôi
            </Link>
            <button
              onClick={() => setOpenFeedback(true)}
              className="text-slate-500 hover:text-slate-700"
            >
              Feedback
            </button>
            <Link to="/support" className="text-slate-500 hover:text-slate-700">
              Hỗ trợ
            </Link>
          </div>
        </div>
      </footer>

      {openFeedback && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-xl rounded-[24px] border border-orange-100 bg-white p-6 shadow-[0_24px_60px_-35px_rgba(255,115,0,0.45)]">
            <h3 className="text-2xl font-bold text-slate-800">Góp ý cho Roomie</h3>
            <p className="mt-1 text-sm text-slate-500">Bạn nghĩ gì về hệ thống?</p>

            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (error) setError("");
              }}
              className="mt-4 h-44 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-orange-300"

            />

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={submitting}
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-full bg-[#ff6a3d] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e55d35] disabled:opacity-60"
              >
                {submitting ? "Đang gửi..." : "Gửi"}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
