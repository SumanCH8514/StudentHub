import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { db } from "./firebaseConfig";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import Loader from "./components/Loader";
import favLogo from "./assets/fav.png";

// Lazy-load heavy route components
const Dashboard = React.lazy(() => import("./components/Dashboard"));
const Auth = React.lazy(() => import("./components/Auth"));
const AdminPanel = React.lazy(() => import("./components/AdminPanel"));
const MaintenancePage = React.lazy(() => import("./components/MaintenancePage"));
const PrivacyPolicy = React.lazy(() => import("./components/PrivacyPolicy"));
const TermsOfService = React.lazy(() => import("./components/TermsOfService"));
const AboutUs = React.lazy(() => import("./components/AboutUs"));

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    // Listen for Maintenance Mode
    const unsubMaintenance = onSnapshot(doc(db, "settings", "system"), (snapshot) => {
      if (snapshot.exists()) {
        setMaintenanceMode(snapshot.data().maintenanceMode || false);
      }
    });
    
    // Enforce trailing slash on base URL (/routine -> /routine/)
    // This is important for relative links and consistency.
    const path = window.location.pathname;
    if (path.endsWith("/routine")) {
      window.location.replace(path + "/" + window.location.search + window.location.hash);
    }

    // Immediate Theme Initialization
    const savedTheme = localStorage.getItem("studentHub_theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch Role
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setRole(data.role || "user");

            // Sync theme preference from Firestore to localStorage and DOM
            const pref = data.themePreference;
            if (pref) {
              const isDark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
              if (isDark) {
                document.documentElement.classList.add("dark");
              } else {
                document.documentElement.classList.remove("dark");
              }
              localStorage.setItem("studentHub_theme", pref === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : pref);
            }
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubMaintenance();
    };
  }, []);

  if (loading) {
    return <Loader />;
  }

  const isAdmin = role === "admin";
  const showMaintenance = maintenanceMode && !isAdmin;

  if (showMaintenance) {
    return <MaintenancePage onBackToLogin={user ? () => signOut(auth) : null} />;
  }

  return (
    <React.Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={user ? <Dashboard /> : <Auth />} />
        <Route path="/admin/*" element={isAdmin ? <AdminPanel /> : <Navigate to="/" replace />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
}

export default App;
