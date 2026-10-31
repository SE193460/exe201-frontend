import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { askAssistant, toAssistantLanguage, type AssistantMessage } from "../api/services/assistant";

const SUGGESTIONS = [
  "Làm sao để tìm phòng?",
  "Bộ lọc mềm hoạt động thế nào?",
  "Cách đăng tin cho thuê?",
  "Mua lượt xem hồ sơ lối sống ở đâu?",
];

/**
 * Floating AI assistant available on every page. Answers via the backend
 * assistant endpoint (LLM when configured, offline FAQ otherwise).
 */
export default function AssistantWidget() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending, open]);

  useEffect(() => {
    if (open) {
      // Focus the input once the panel is shown.
      const id = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || sending) return;

    const next: AssistantMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setError("");
    setSending(true);

    try {
      const { reply } = await askAssistant(next, toAssistantLanguage(i18n.language));
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setError(t("Không kết nối được trợ lý. Vui lòng thử lại."));
    } finally {
      setSending(false);
    }
  };

  // The admin area has its own workflow — keep the consumer assistant out of it.
  if (location.pathname.startsWith("/admin")) return null;

  return (
    <>
      <button
        type="button"
        aria-label={t("Mở trợ lý AI")}
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-lg transition hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary)]/40"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("Trợ lý Roomie")}
          className="fixed bottom-24 right-5 z-40 flex h-[min(560px,75vh)] w-[min(384px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <header className="flex items-center gap-3 bg-[var(--primary)] px-4 py-3 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{t("Trợ lý Roomie")}</p>
              <p className="truncate text-xs text-white/80">{t("Hỗ trợ sử dụng website")}</p>
            </div>
            <button
              type="button"
              aria-label={t("Đóng")}
              onClick={() => setOpen(false)}
              className="rounded-full p-1 transition hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            <div className="flex gap-2">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                <Bot className="h-4 w-4" />
              </span>
              <p className="rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                {t("Xin chào! Mình là trợ lý Roomie. Bạn cần hỗ trợ gì?")}
              </p>
            </div>

            {messages.map((message, index) => (
              <div
                key={index}
                className={message.role === "user" ? "flex justify-end" : "flex gap-2"}
              >
                {message.role === "assistant" && (
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                    <Bot className="h-4 w-4" />
                  </span>
                )}
                <p
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    message.role === "user"
                      ? "rounded-tr-sm bg-[var(--primary)] text-white"
                      : "rounded-tl-sm bg-white text-slate-700"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            ))}

            {messages.length === 0 && !sending && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    {t(suggestion)}
                  </button>
                ))}
              </div>
            )}

            {sending && (
              <div className="flex gap-2">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Bot className="h-4 w-4" />
                </span>
                <p className="rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-sm text-slate-400 shadow-sm">
                  {t("Đang trả lời...")}
                </p>
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t("Nhập câu hỏi của bạn...")}
              aria-label={t("Nhập câu hỏi của bạn...")}
              maxLength={2000}
              className="min-w-0 flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[var(--primary)]"
            />
            <button
              type="submit"
              aria-label={t("Gửi")}
              disabled={sending || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
