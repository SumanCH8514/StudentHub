import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import Dashboard from "./components/Dashboard";
import Auth from "./components/Auth";
import AdminPanel from "./components/AdminPanel";
import MaintenancePage from "./components/MaintenancePage";
import favLogo from "./assets/fav.png";
import { db } from "./firebaseConfig";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";

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

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch Role
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role || "user");
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
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="relative flex items-center justify-center w-16 h-16">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
          {/* Animated primary ring */}
          <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent dark:border-indigo-500 dark:border-t-transparent animate-spin"></div>
          {/* Center Logo/Icon */}
          <div className="absolute inset-0 m-auto w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/50 z-10 animate-pulse overflow-hidden">
            <img src={favLogo} alt="Loading" className="w-[80%] h-[80%] object-contain" />
          </div>
        </div>
        <p className="mt-6 text-slate-500 dark:text-slate-400 font-medium tracking-wide animate-pulse">
          Starting StudentHub...
        </p>
      </div>
    );
  }

  const isAdmin = role === "admin";
  const showMaintenance = maintenanceMode && !isAdmin;

  if (showMaintenance) {
    return <MaintenancePage onBackToLogin={user ? () => signOut(auth) : null} />;
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Dashboard /> : <Auth />} />
      <Route
        path="/admin/*"
        element={isAdmin ? <AdminPanel /> : <Navigate to="/" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
