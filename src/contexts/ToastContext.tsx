import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from "react";

type ToastType = "success" | "error" | "warning";

type ToastPayload = {
  type: ToastType;
  message: string;
  durationMs?: number;
};

type ToastItem = ToastPayload & {
  id: number;
};

type ToastContextValue = {
  showToast: (payload: ToastPayload) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function toastClassName(type: ToastType) {
  if (type === "success") {
    return "border-green-200 text-green-700";
  }
  if (type === "error") {
    return "border-red-200 text-red-700";
  }
  return "border-amber-200 text-amber-700";
}

function toastLabel(type: ToastType) {
  if (type === "success") return "Thành công";
  if (type === "error") return "Lỗi";
  return "Cảnh báo";
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((payload: ToastPayload) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const nextToast: ToastItem = {
      id,
      type: payload.type,
      message: payload.message,
      durationMs: payload.durationMs,
    };

    setToasts((prev) => [...prev, nextToast]);

    const duration = payload.durationMs ?? 2800;
    window.setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-[200] flex w-[min(92vw,380px)] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl border bg-white px-4 py-3 shadow-lg ${toastClassName(toast.type)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide">{toastLabel(toast.type)}</p>
                <p className="mt-1 text-sm font-semibold leading-snug">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-lg leading-none opacity-60 transition hover:opacity-100"
                aria-label="Đóng thông báo"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
