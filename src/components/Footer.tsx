import { useState } from "react";
import { Link } from "react-router-dom";
import { submitFeedback } from "../api/services/feedback";
import { useToast } from "../contexts/ToastContext";
// Social icons as inline SVGs (lucide-react doesn't ship brand icons)

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
        message: "Đã gửi feedback thành công. Cảm ơn bạn đã góp ý!",
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
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-10">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            {/* Left: Logo + Copyright */}
            <div>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="text-xl font-extrabold italic text-[#c17a2f]"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                RoomieMatch
              </button>
              <p className="mt-2 text-sm text-slate-500">
                © {new Date().getFullYear()} RoomieMatch Inc. All rights reserved.
              </p>
            </div>

            {/* Center: Links */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
              <button className="hover:text-slate-700 transition">About Us</button>
              <button
                onClick={() => setOpenFeedback(true)}
                className="hover:text-slate-700 transition"
              >
                Contact
              </button>
              <button className="hover:text-slate-700 transition">Privacy Policy</button>
              <button className="hover:text-slate-700 transition">Terms of Service</button>
              <Link to="/support" className="hover:text-slate-700 transition">
                Help Center
              </Link>
            </div>

            {/* Right: Social icons */}
            <div className="flex items-center gap-3">
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition hover:bg-[#c17a2f] hover:text-white">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition hover:bg-[#c17a2f] hover:text-white">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition hover:bg-[#c17a2f] hover:text-white">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {openFeedback && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-xl rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-800">Góp ý cho RoomieMatch</h3>
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
                className="rounded-full bg-[#c17a2f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#a5681f] disabled:opacity-60"
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
