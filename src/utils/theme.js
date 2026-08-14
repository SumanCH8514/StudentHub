import { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

export const THEME_KEY = "studentHub_theme";

export const getInitialTheme = () => {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

export const applyTheme = (theme) => {
  if (typeof document === "undefined") return;
  const isDark = theme === "dark";
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  try {
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  } catch (e) {}

  const user = auth.currentUser;
  if (user) {
    setDoc(doc(db, "users", user.uid), {
      themePreference: isDark ? "dark" : "light"
    }, { merge: true }).catch(() => {});
  }
};

export const toggleGlobalTheme = () => {
  const isDark = document.documentElement.classList.contains("dark");
  const nextTheme = isDark ? "light" : "dark";
  applyTheme(nextTheme);
  return nextTheme;
};

export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const syncState = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    syncState();

    const observer = new MutationObserver(syncState);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    });

    const handleStorage = (e) => {
      if (e.key === THEME_KEY && e.newValue) {
        applyTheme(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return {
    isDarkMode,
    theme: isDarkMode ? "dark" : "light",
    toggleTheme: toggleGlobalTheme,
    setTheme: applyTheme
  };
};
