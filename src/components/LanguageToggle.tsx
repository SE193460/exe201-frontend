import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

const LANGS = ["vi", "en", "ja"] as const;
type Lang = (typeof LANGS)[number];

const NATIVE_NAME: Record<Lang, string> = {
  vi: "Tiếng Việt",
  en: "English",
  ja: "日本語",
};

const SHORT: Record<Lang, string> = { vi: "VI", en: "EN", ja: "JA" };

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const current: Lang = LANGS.find((l) => i18n.language?.startsWith(l)) ?? "vi";
  const next: Lang = LANGS[(LANGS.indexOf(current) + 1) % LANGS.length];

  const toggle = () => {
    i18n.changeLanguage(next);
  };

  const label = NATIVE_NAME[next];

  return (
    <button
      onClick={toggle}
      aria-label={label}
      className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
      title={label}
    >
      <Globe className="h-3.5 w-3.5" />
      {SHORT[next]}
    </button>
  );
}
