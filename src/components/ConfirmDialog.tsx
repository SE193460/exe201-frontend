import { useCallback, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ConfirmState = ConfirmOptions & { resolve: (value: boolean) => void };

/**
 * Promise-based replacement for window.confirm.
 *
 * Usage:
 *   const { confirm, dialog } = useConfirm();
 *   if (await confirm("Delete this?")) { ... }
 *   return <>{dialog}...</>;
 */
export function useConfirm() {
  const { t } = useTranslation();
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions | string) => {
    const opts: ConfirmOptions = typeof options === "string" ? { message: options } : options;
    return new Promise<boolean>((resolve) => {
      setState({ ...opts, resolve });
    });
  }, []);

  const close = useCallback(
    (value: boolean) => {
      setState((current) => {
        current?.resolve(value);
        return null;
      });
    },
    []
  );

  const dialog: ReactNode = state ? (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => close(false)}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-[var(--on-surface)]">
          {state.title ?? t("Xác nhận")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{state.message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => close(false)}
            className="rounded-[var(--radius-md)] border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {state.cancelLabel ?? t("Hủy")}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => close(true)}
            className={`rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 ${
              state.danger ? "bg-red-600" : "bg-[var(--primary)]"
            }`}
          >
            {state.confirmLabel ?? t("Đồng ý")}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, dialog };
}
