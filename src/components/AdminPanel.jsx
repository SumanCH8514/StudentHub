import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import {
  CalendarDays,
  ClipboardList,
  Upload,
  Trash2,
  Activity
} from "lucide-react";

import AdminLayout from "./admin/AdminLayout.jsx";
import AdminDashboardHome from "./admin/AdminDashboardHome.jsx";
import AdminStudentDetails from "./admin/AdminStudentDetails.jsx";
import AdminResults from "./admin/AdminResults.jsx";
import AdminSettings from "./admin/AdminSettings.jsx";
import AdminProfile from "./admin/AdminProfile.jsx";
import AdminSystemStatus from "./admin/AdminSystemStatus.jsx";
import AdminUpdates from "./admin/AdminUpdates.jsx";
import AdminHolidaysManager from "./admin/AdminHolidaysManager.jsx";
import { useNavigate } from "react-router-dom";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [classesCount, setClassesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userPhoto, setUserPhoto] = useState(null);
  const [adminName, setAdminName] = useState("Admin User");
  const [isWiping, setIsWiping] = useState(false);
  const [systemSettings, setSystemSettings] = useState({
    geminiAssistantEnabled: false,
    allowPublicRegistration: true,
    automatedScheduleSync: true,
    maintenanceMode: false,
    newUserAlerts: true
  });
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    // Fetch Users
    const q = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Fetch Classes count
    const fetchClasses = async () => {
      try {
        const classesSnapshot = await getDocs(collection(db, "shared_routines"));
        setClassesCount(classesSnapshot.size);
      } catch (err) {
        console.error("Failed to fetch classes count:", err);
      }
    };
    fetchClasses();

    // Fetch Admin Data (Photo & Name)
    const fetchAdminData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      setAdminName(currentUser.displayName || "Admin User");

      try {
        // Fetch System Settings
        const systemDoc = await getDoc(doc(db, "settings", "system"));
        if (systemDoc.exists()) {
          const data = systemDoc.data();
          setSystemSettings({
            geminiAssistantEnabled: data.geminiAssistantEnabled ?? false,
            allowPublicRegistration: data.allowPublicRegistration ?? true,
            automatedScheduleSync: data.automatedScheduleSync ?? true,
            maintenanceMode: data.maintenanceMode ?? false,
            newUserAlerts: data.newUserAlerts ?? true
          });
        }

        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.photoBase64) {
            setUserPhoto(data.photoBase64);
          }
          if (data.fullName || data.name) {
            setAdminName(data.fullName || data.name);
          }
          if (data.themePreference) {
            const isDark =
              data.themePreference === "dark" ||
              (data.themePreference === "system" &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);
            if (isDark) {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
      }
    };
    fetchAdminData();

    return () => unsubscribeUsers();
  }, []);

  const deleteUser = async (userId) => {
    if (
      window.confirm(
        "Are you sure? This will delete the user profile. (Note: Auth account must be deleted manually in Firebase Console)",
      )
    ) {
      await deleteDoc(doc(db, "users", userId));
    }
  };

  const wipeGlobalClasses = async () => {
    if (
      !window.confirm(
        "🚨 CRITICAL ACTION: This will delete EVERY CLASS from EVERY USER in the database. Proceed?",
      )
    )
      return;
    setIsWiping(true);
    try {
      const snapshot = await getDocs(collection(db, "shared_routines"));
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      alert("Database wiped successfully.");
      setClassesCount(0);
    } catch (e) {
      alert(e.message);
    }
    setIsWiping(false);
  };

  const initiateFullSystemReset = async () => {
    if (!window.confirm("🔴 FINAL WARNING: This will PERMANENTLY WIPE EVERYTHING (Routines, Holidays, and ALL Students). This is irreversible. Are you absolutely certain?")) {
      return;
    }

    const authCode = prompt("To confirm, type THE NAMES OF ALL TABLES TO BE PURGED: 'ROUTINES, HOLIDAYS, USERS'");
    if (authCode !== "ROUTINES, HOLIDAYS, USERS") {
      alert("Incorrect confirmation code. Reset aborted.");
      return;
    }

    setIsWiping(true);
    try {
      const batch = writeBatch(db);

      // 1. Wipe Routines
      const routineSnap = await getDocs(collection(db, "shared_routines"));
      routineSnap.docs.forEach(d => batch.delete(d.ref));

      // 2. Wipe Holidays
      const holidaySnap = await getDocs(collection(db, "holidays"));
      holidaySnap.docs.forEach(d => batch.delete(d.ref));

      // 3. Wipe Non-Admin Users
      const usersSnap = await getDocs(collection(db, "users"));
      usersSnap.docs.forEach(d => {
        if (d.data().role !== "admin") {
          batch.delete(d.ref);
        }
      });

      // 4. Reset System Settings
      const settingsRef = doc(db, "settings", "system");
      batch.set(settingsRef, {
        allowPublicRegistration: true,
        automatedScheduleSync: true,
        maintenanceMode: false,
        newUserAlerts: true,
        geminiAssistantEnabled: false
      });

      await batch.commit();
      alert("System has been restored to factory settings. All non-admin data has been purged.");
      setClassesCount(0);
      setUsers([]);
    } catch (err) {
      console.error("System Reset Failed:", err);
      alert("Reset failed: " + err.message);
    } finally {
      setIsWiping(false);
    }
  };

  const updateSystemSetting = async (key, value) => {
    // Optimistic update
    setSystemSettings(prev => ({ ...prev, [key]: value }));
    try {
      await setDoc(doc(db, "settings", "system"), { [key]: value }, { merge: true });
    } catch (err) {
      console.error(`Failed to update system setting ${key}:`, err);
      // Rollback
      const systemDoc = await getDoc(doc(db, "settings", "system"));
      if (systemDoc.exists()) {
        const data = systemDoc.data();
        setSystemSettings(prev => ({ ...prev, [key]: data[key] }));
      }
    }
  };

  const currentUser = auth.currentUser;
  const userEmail = currentUser?.email || "";

  return (
    <AdminLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      userName={adminName}
      userEmail={userEmail}
      userPhoto={userPhoto}
      onLogout={() => signOut(auth)}
      onBack={() => navigate("/")}
    >
      {activeTab === "dashboard" && (
        <AdminDashboardHome
          userName={adminName}
          usersCount={users.length}
          classesCount={classesCount}
        />
      )}

      {activeTab === "students" && (
        <AdminStudentDetails
          users={users}
          loading={loading}
          deleteUser={deleteUser}
        />
      )}

      {activeTab === "results" && (
        <AdminResults />
      )}

      {activeTab === "settings" && (
        <AdminSettings
          isWiping={isWiping}
          wipeGlobalClasses={wipeGlobalClasses}
          settings={systemSettings}
          updateSetting={updateSystemSetting}
        />
      )}

      {activeTab === "profile" && (
        <AdminProfile
          userName={adminName}
          userEmail={userEmail}
        />
      )}

      {activeTab === "system-status" && (
        <AdminSystemStatus />
      )}

      {activeTab === "updates" && (
        <AdminUpdates />
      )}

      {activeTab === "upload-holidays" && (
        <AdminHolidaysManager />
      )}

      {activeTab === "upload-routine" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm text-center">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={32} className="text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Class Routine Manager</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
              Publish or update global class routines. This will overwrite existing shared routines for the selected stream.
            </p>
            <button className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all mx-auto shadow-lg shadow-blue-600/20 active:scale-95">
              <Upload size={18} />
              Upload New Routine
            </button>
          </div>
        </div>
      )}

      {/* ── DATABASE: Global System Reset ── */}
      {activeTab === "db-reset" && (
        <div className="space-y-6">
          <div className="bg-red-50 dark:bg-rose-900/10 border border-red-200 dark:border-rose-900/30 rounded-3xl p-8 xl:p-12 text-center max-w-4xl mx-auto shadow-sm">
            <div className="w-20 h-20 bg-red-100 dark:bg-rose-900/30 rounded-full flex flex-col items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-white dark:ring-slate-800">
              <Activity size={36} className="text-red-500" />
            </div>
            <h2 className="text-3xl font-black text-red-600 dark:text-rose-500 mb-3 tracking-tight">GLOBAL SYSTEM RESET</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-8 font-medium leading-relaxed">
              WARNING: This will completely wipe all critical system data, restoring the platform to a blank slate. This action <span className="text-red-600 font-bold underline">cannot be undone</span>.
            </p>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-left max-w-lg mx-auto mb-8 border border-red-100 dark:border-slate-700 shadow-sm">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3">Items deleted during reset:</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 font-medium list-disc pl-5">
                <li>All User Profiles & Data</li>
                <li>All Uploaded Class Routines</li>
                <li>Global Holiday Calendar</li>
                <li>System Logs & Analytics</li>
              </ul>
            </div>

            <button
              onClick={initiateFullSystemReset}
              disabled={isWiping}
              className="flex flex-col items-center gap-1.5 px-10 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-lg transition-all mx-auto shadow-xl shadow-red-500/20 active:scale-95 group w-full sm:w-auto"
            >
              {isWiping ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <span>CONFIRM SYSTEM RESET</span>
                  <span className="text-xs font-medium text-red-200 uppercase tracking-widest">Wipes All Global Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── DATABASE: Delete Holiday List ── */}
      {activeTab === "db-del-holidays" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 xl:p-12 text-center max-w-2xl mx-auto border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CalendarDays size={32} className="text-rose-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Wipe Holiday Calendar</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
              This action will permanently delete all parsed holiday events from the global database. Students will see an empty calendar until a new list is uploaded.
            </p>
            <button
              onClick={async () => {
                if (window.confirm("Are you absolutely sure you want to delete the entire Holiday List?")) {
                  try {
                    const snapshot = await getDocs(collection(db, "holidays"));
                    const batch = writeBatch(db);
                    snapshot.docs.forEach((d) => batch.delete(d.ref));
                    await batch.commit();
                    alert("Holiday list deleted.");
                  } catch (err) {
                    alert("Error deleting holidays: " + err.message);
                  }
                }
              }}
              className="flex items-center gap-2 px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-all mx-auto shadow-md shadow-rose-600/20 active:scale-95"
            >
              <Trash2 size={18} />
              Delete All Holidays
            </button>
          </div>
        </div>
      )}

      {/* ── DATABASE: Delete Classes ── */}
      {activeTab === "db-del-classes" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 xl:p-12 text-center max-w-2xl mx-auto border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ClipboardList size={32} className="text-rose-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Wipe Synced Classes</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
              This action will permanently delete all shared class routines across all universities and streams. Use this only at the end of an academic semester.
            </p>
            <button
              onClick={wipeGlobalClasses}
              disabled={isWiping}
              className="flex items-center gap-2 px-8 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all mx-auto shadow-md shadow-rose-600/20 active:scale-95"
            >
              {isWiping ? "Deleting..." : <><Trash2 size={18} /> Delete All Classes</>}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPanel;
