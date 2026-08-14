import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" }
];

const LanguageContext = createContext({
  currentLang: "en",
  changeLanguage: () => {},
  languages: SUPPORTED_LANGUAGES,
  isTranslating: false
});

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem("preferred_language") || "en";
  });
  const [isTranslating, setIsTranslating] = useState(false);

  const initGoogleTranslate = () => {
    if (!document.getElementById("google-translate-hidden-container")) {
      const container = document.createElement("div");
      container.id = "google-translate-hidden-container";
      container.style.display = "none";
      container.innerHTML = '<div id="google_translate_element_hidden"></div>';
      document.body.appendChild(container);
    }

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        if (window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: "en,bn,hi,es,fr,de",
              autoDisplay: false
            },
            "google_translate_element_hidden"
          );
        }
      };
    }
  };

  const applyGoogleTranslate = (langCode) => {
    setIsTranslating(true);
    const domain = window.location.hostname;
    const path = "/";

    document.cookie = `googtrans=/auto/${langCode}; path=${path};`;
    document.cookie = `googtrans=/auto/${langCode}; path=${path}; domain=${domain};`;

    if (langCode === "en") {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
    }

    const tryDispatch = (attemptsLeft = 10) => {
      const select = document.querySelector(".goog-te-combo");
      if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event("change"));
        setTimeout(() => setIsTranslating(false), 400);
      } else if (attemptsLeft > 0) {
        setTimeout(() => tryDispatch(attemptsLeft - 1), 250);
      } else {
        setIsTranslating(false);
      }
    };

    initGoogleTranslate();
    tryDispatch();
  };

  const changeLanguage = (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem("preferred_language", langCode);
    applyGoogleTranslate(langCode);
  };

  useEffect(() => {
    initGoogleTranslate();
    const saved = localStorage.getItem("preferred_language");
    if (saved && saved !== "en") {
      setTimeout(() => applyGoogleTranslate(saved), 500);
    }
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        changeLanguage,
        languages: SUPPORTED_LANGUAGES,
        isTranslating
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

export const LanguageSwitcher = ({
  variant = "pill",
  className = "",
  align = "right",
  direction = "down"
}) => {
  const { currentLang, changeLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeLangObj = languages.find((l) => l.code === currentLang) || languages[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={
          variant === "compact"
            ? "flex items-center gap-1.5 p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            : "flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200/80 dark:border-slate-700/80 shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap"
        }
      >
        <Globe size={15} className="text-blue-500 shrink-0" />
        <span className="truncate">{activeLangObj.nativeName}</span>
        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            align === "left" ? "left-0" : "right-0"
          } ${
            direction === "up" ? "bottom-full mb-2" : "top-full mt-2"
          } w-48 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200/80 dark:border-slate-700/80 py-1.5 z-[100] animate-in fade-in zoom-in-95 duration-150 overflow-hidden`}
        >
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Select Language
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {languages.map((lang) => {
              const isSelected = lang.code === currentLang;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    changeLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors text-left cursor-pointer ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm shrink-0">{lang.flag}</span>
                    <span className="truncate">{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400 font-normal truncate">
                      ({lang.name})
                    </span>
                  </div>
                  {isSelected && <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
