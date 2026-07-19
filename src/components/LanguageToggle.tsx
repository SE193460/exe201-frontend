import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("en") ? "en" : "vi";

  const toggle = () => {
    const next = current === "vi" ? "en" : "vi";
    i18n.changeLanguage(next);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
      title={current === "vi" ? "Switch to English" : "Chuyển sang tiếng Việt"}
    >
      <Globe className="h-3.5 w-3.5" />
      {current === "vi" ? "EN" : "VI"}
    </button>
  );
}
