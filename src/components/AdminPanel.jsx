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
  updateDoc,
  arrayUnion,
  orderBy,
  serverTimestamp,
  where
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  CalendarDays,
  ClipboardList,
  Upload,
  Trash2,
  Activity,
  Files,
  Link as LinkIcon,
  Save,
  CheckCircle2 as CheckIcon,
  GraduationCap,
  BookOpen,
  Users as UsersIcon,
  Search,
  AlertTriangle,
  FileText
} from "lucide-react";

import Loader from "./Loader.jsx";
import AdminLayout from "./admin/AdminLayout.jsx";
import AdminDashboardHome from "./admin/AdminDashboardHome.jsx";
import AdminStudentDetails from "./admin/AdminStudentDetails.jsx";
import AdminResults from "./admin/AdminResults.jsx";
import AdminSettings from "./admin/AdminSettings.jsx";
import AdminProfile from "./admin/AdminProfile.jsx";
import AdminSystemStatus from "./admin/AdminSystemStatus.jsx";
import AdminUpdates from "./admin/AdminUpdates.jsx";
import AdminHolidaysManager from "./admin/AdminHolidaysManager.jsx";
import AdminRoutineUploader from "./admin/AdminRoutineUploader.jsx";
import AdminExamRoutineUploader from "./admin/AdminExamRoutineUploader.jsx";
import AdminSupportTickets from "./admin/AdminSupportTickets.jsx";
import AdminSupportSettings from "./admin/AdminSupportSettings.jsx";
import AdminAssistantQueries from "./admin/AdminAssistantQueries.jsx";
import AdminAssistantQA from "./admin/AdminAssistantQA.jsx";
import AdminAssistantHistory from "./admin/AdminAssistantHistory.jsx";
import AdminAssistantSettings from "./admin/AdminAssistantSettings.jsx";
import AdminAcademicConfig from "./admin/AdminAcademicConfig.jsx";
import AdminGlobalSystemReset from "./admin/AdminGlobalSystemReset.jsx";
import AdminHolidaysDelete from "./admin/AdminHolidaysDelete.jsx";
import AdminClassesPurge from "./admin/AdminClassesPurge.jsx";
import { useNavigate } from "react-router-dom";

const cn = (...inputs) => {
  return twMerge(clsx(inputs));
};

// --- Hash-Based Routing Logic for Admin Panel ---
const getAdminTabFromHash = () => {
  const hash = window.location.hash.replace("#", "");
  if (!hash.startsWith("admin-")) return null;
  const tab = hash.replace("admin-", "");
  return tab || "dashboard";
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const initialAdminTab = getAdminTabFromHash();
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
  const [deleteFilter, setDeleteFilter] = useState({
    university: "SVU",
    stream: "B.Tech",
    semester: "1",
    section: "1"
  });
  const [activeTab, setActiveTab] = useState(() => {
    if (initialAdminTab) return initialAdminTab;
    return localStorage.getItem("adminHub_activeTab") || "dashboard";
  });

  // Persist activeTab changes and sync hash
  useEffect(() => {
    localStorage.setItem("adminHub_activeTab", activeTab);

    // Sync hash without triggering hashchange event loop
    const newHash = `#admin-${activeTab}`;
    if (window.location.hash !== newHash) {
      // Use window.location.pathname to dynamically handle the base URL
      window.history.replaceState(null, "", window.location.pathname + newHash);
    }
  }, [activeTab]);

  // Handle hash changes for direct URL modification or back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const tab = getAdminTabFromHash();
      if (tab) {
        setActiveTab(tab);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const [notifications, setNotifications] = useState([]);
  const [formLinks, setFormLinks] = useState({});
  const [selectedFormId, setSelectedFormId] = useState("");
  const [customLink, setCustomLink] = useState("");
  const [isSavingLink, setIsSavingLink] = useState(false);

  const [qpLinks, setQpLinks] = useState({});
  const [smLinks, setSmLinks] = useState({});
  const [qpSelection, setQpSelection] = useState({ university: "SVU", stream: "B.Tech", semester: "1" });
  const [smSelection, setSmSelection] = useState({ university: "SVU", stream: "B.Tech", semester: "1" });
  const [qpSubjects, setQpSubjects] = useState([]);
  const [smSubjects, setSmSubjects] = useState([]);
  const [selectedQpSubject, setSelectedQpSubject] = useState("");
  const [selectedSmSubject, setSelectedSmSubject] = useState("");
  const [smMaterialType, setSmMaterialType] = useState("book"); // "book" or "notes"
  const [isFetchingSubjects, setIsFetchingSubjects] = useState(false);

  const availableForms = [
    { id: "bonafide", label: "Bonafide Certificate" },
    { id: "admission", label: "Admission Application Form" },
    { id: "library", label: "Library Membership Form" },
    { id: "scholarship", label: "Scholarship Application" },
    { id: "hostel", label: "Hostel Accommodation Form" },
    { id: "id-replacement", label: "ID Card Replacement" },
    { id: "no-due", label: "No Due Form" },
  ];

  useEffect(() => {
    // Fetch Users
    const q = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Fetch System Notifications
    const notifQuery = query(collection(db, "system_notifications"), orderBy("timestamp", "desc"));
    const unsubscribeNotifications = onSnapshot(notifQuery, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Question Paper and Study Material Links
    const fetchLinks = async () => {
      try {
        const qpRef = doc(db, "settings", "question_papers");
        const smRef = doc(db, "settings", "study_materials");

        const [qpDoc, smDoc] = await Promise.allSettled([
          getDoc(qpRef),
          getDoc(smRef)
        ]);

        if (qpDoc.status === 'fulfilled' && qpDoc.value.exists()) {
          setQpLinks(qpDoc.value.data());
        } else if (qpDoc.status === 'rejected') {
          console.warn("Could not fetch question paper links:", qpDoc.reason);
        }

        if (smDoc.status === 'fulfilled' && smDoc.value.exists()) {
          setSmLinks(smDoc.value.data());
        } else if (smDoc.status === 'rejected') {
          console.warn("Could not fetch study material links:", smDoc.reason);
        }
      } catch (err) {
        console.warn("General error fetching links:", err);
      }
    };
    fetchLinks();

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
              localStorage.setItem("studentHub_theme", "dark");
            } else {
              document.documentElement.classList.remove("dark");
              localStorage.setItem("studentHub_theme", "light");
            }
          }
        }

        // Fetch Form Links
        try {
          const formsDoc = await getDoc(doc(db, "settings", "forms"));
          if (formsDoc.exists()) {
            setFormLinks(formsDoc.data());
          }
        } catch (formsErr) {
          console.warn("Could not fetch form links (might be permissions):", formsErr);
        }
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
      }
    };
    fetchAdminData();

    return () => {
      unsubscribeUsers();
      unsubscribeNotifications();
    };
  }, []);

  const markNotificationAsRead = async (notifId) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, "system_notifications", notifId), {
        readBy: arrayUnion(auth.currentUser.uid)
      });
    } catch (err) {
      console.error("Failed to mark notification active:", err);
    }
  };

  const deleteUser = async (userId) => {
    if (
      window.confirm(
        "Are you sure? This will delete the user profile. (Note: Auth account must be deleted manually in Firebase Console)",
      )
    ) {
      await deleteDoc(doc(db, "users", userId));
    }
  };

  const handleAddStudent = async (studentData) => {
    try {
      const newUserRef = doc(collection(db, "users"));
      const newStudent = {
        uid: newUserRef.id,
        ...studentData,
        createdAt: serverTimestamp(),
        photoBase64: null,
      };

      await setDoc(newUserRef, newStudent);

      // Trigger System Alert if enabled
      if (systemSettings.newUserAlerts) {
        await setDoc(doc(collection(db, "system_notifications")), {
          type: "new_user",
          title: "New Student Added (Admin)",
          message: `${studentData.name} (${studentData.email}) was added by an administrator.`,
          timestamp: serverTimestamp(),
          readBy: []
        });
      }

      return { success: true };
    } catch (err) {
      console.error("Failed to add student:", err);
      return { success: false, error: err.message };
    }
  };

  const handleUpdateUser = async (userId, updatedData) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        ...updatedData,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (err) {
      console.error("Failed to update user:", err);
      return { success: false, error: err.message };
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

  const deleteFilteredClasses = async () => {
    if (!window.confirm(`Are you sure you want to delete classes for ${deleteFilter.university} ${deleteFilter.stream} Sem ${deleteFilter.semester} Sec ${deleteFilter.section}?`)) {
      return;
    }

    setIsWiping(true);
    try {
      const q = query(
        collection(db, "shared_routines"),
        where("university", "==", deleteFilter.university),
        where("stream", "==", deleteFilter.stream),
        where("semester", "==", deleteFilter.semester),
        where("section", "==", deleteFilter.section)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        alert("No classes found matching these criteria.");
        setIsWiping(false);
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      alert(`Successfully deleted ${snapshot.size} class entries.`);
    } catch (err) {
      console.error("Filtered delete failed:", err);
      alert("Error: " + err.message);
    } finally {
      setIsWiping(false);
    }
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


  useEffect(() => {
    if (activeTab !== 'upload-question-papers') return;
    const fetchQpSubjects = async () => {
      setIsFetchingSubjects(true);
      try {
        const q = query(
          collection(db, "shared_routines"),
          where("university", "==", qpSelection.university),
          where("stream", "==", qpSelection.stream),
          where("semester", "==", qpSelection.semester)
        );
        const snapshot = await getDocs(q);
        const subjects = [...new Set(snapshot.docs.map(d => d.data().subject))].filter(Boolean);
        setQpSubjects(subjects);
      } catch (err) {
        console.error("Failed to fetch QP subjects:", err);
      } finally {
        setIsFetchingSubjects(false);
      }
    };
    fetchQpSubjects();
  }, [qpSelection, activeTab]);

  useEffect(() => {
    if (activeTab !== 'upload-study-materials') return;
    const fetchSmSubjects = async () => {
      setIsFetchingSubjects(true);
      try {
        const q = query(
          collection(db, "shared_routines"),
          where("university", "==", smSelection.university),
          where("stream", "==", smSelection.stream),
          where("semester", "==", smSelection.semester)
        );
        const snapshot = await getDocs(q);
        const subjects = [...new Set(snapshot.docs.map(d => d.data().subject))].filter(Boolean);
        setSmSubjects(subjects);
      } catch (err) {
        console.error("Failed to fetch SM subjects:", err);
      } finally {
        setIsFetchingSubjects(false);
      }
    };
    fetchSmSubjects();
  }, [smSelection, activeTab]);

  const updateSystemSetting = async (key, value) => {

    setSystemSettings(prev => ({ ...prev, [key]: value }));
    try {
      await setDoc(doc(db, "settings", "system"), { [key]: value }, { merge: true });
    } catch (err) {
      console.error(`Failed to update system setting ${key}:`, err);

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
      notifications={notifications}
      onMarkNotificationRead={markNotificationAsRead}
      currentUserId={currentUser?.uid}
    >
      {activeTab === "dashboard" && (
        <AdminDashboardHome
          userName={adminName}
          usersCount={users.length}
          classesCount={classesCount}
          users={users}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === "students" && (
        <AdminStudentDetails
          users={users}
          loading={loading}
          deleteUser={deleteUser}
          addStudent={handleAddStudent}
          updateUser={handleUpdateUser}
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

      {activeTab === "academic-config" && (
        <AdminAcademicConfig />
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
        <AdminRoutineUploader />
      )}

      {activeTab === "upload-exam" && (
        <AdminExamRoutineUploader />
      )}

      {activeTab === "upload-forms" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1 tracking-tight">
                College Forms Link Manager
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Configure download URLs for official college documents.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Configuration Form */}
            <div className="lg:col-span-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm h-fit">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Files size={20} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">Update Link</h3>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    Select Form Type
                  </label>
                  <select
                    value={selectedFormId}
                    onChange={(e) => {
                      setSelectedFormId(e.target.value);
                      setCustomLink(formLinks[e.target.value] || "");
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Choose a form...</option>
                    {availableForms.map(form => (
                      <option key={form.id} value={form.id}>{form.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    Download Link (URL)
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LinkIcon size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                      type="url"
                      placeholder="https://sumanonline.com/..."
                      value={customLink}
                      onChange={(e) => setCustomLink(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200"
                    />
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (!selectedFormId || !customLink) return;
                    setIsSavingLink(true);
                    try {
                      const formsRef = doc(db, "settings", "forms");
                      await setDoc(formsRef, {
                        [selectedFormId]: customLink
                      }, { merge: true });

                      setFormLinks(prev => ({ ...prev, [selectedFormId]: customLink }));
                      alert("Form link updated!");
                    } catch (err) {
                      alert("Update failed: " + err.message);
                    } finally {
                      setIsSavingLink(false);
                    }
                  }}
                  disabled={isSavingLink || !selectedFormId || !customLink}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-70 disabled:grayscale"
                >
                  {isSavingLink ? (
                    <Loader inline size="sm" />
                  ) : (
                    <Save size={18} />
                  )}
                  <span>{isSavingLink ? "Updating..." : "Save Link"}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Live Links Summary */}
            <div className="lg:col-span-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="font-bold text-slate-800 dark:text-white">Active Form Links</h3>
              </div>

              <div className="p-6 flex-1 bg-slate-50/30 dark:bg-slate-900/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableForms.map(form => (
                    <div
                      key={form.id}
                      className="group flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-600/50 transition-all hover:shadow-md cursor-default"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-2.5 h-2.5 rounded-full relative ${formLinks[form.id] ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                          {formLinks[form.id] && (
                            <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500 opacity-40"></div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{form.label}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {formLinks[form.id] ? "Link Configured" : "Default Link Set"}
                          </span>
                        </div>
                      </div>
                      <div className={cn(
                        "p-2 rounded-xl transition-all",
                        formLinks[form.id]
                          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-slate-50 dark:bg-slate-900 text-slate-400"
                      )}>
                        {formLinks[form.id] ? <CheckIcon size={16} /> : <LinkIcon size={16} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "upload-question-papers" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1 tracking-tight">
                QuestionPapers Link Manager
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Configure download URLs for previous year question papers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm h-fit space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Search size={20} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">Filters</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">University</label>
                  <select
                    value={qpSelection.university}
                    onChange={(e) => setQpSelection({ ...qpSelection, university: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                  >
                    <option value="SVU">SVU</option>
                    <option value="Regent">Regent</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Stream</label>
                  <select
                    value={qpSelection.stream}
                    onChange={(e) => setQpSelection({ ...qpSelection, stream: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                  >
                    <option value="B.Tech">B.Tech</option>
                    <option value="BCA">BCA</option>
                    <option value="ANCS">ANCS</option>
                    <option value="DIPLOMA">DIPLOMA</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Semester</label>
                  <select
                    value={qpSelection.semester}
                    onChange={(e) => setQpSelection({ ...qpSelection, semester: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n.toString()}>Sem {n}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <FileText size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">Manage Link</h3>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Select Subject</label>
                    <select
                      value={selectedQpSubject}
                      onChange={(e) => {
                        setSelectedQpSubject(e.target.value);
                        const linkKey = `${qpSelection.university}_${qpSelection.stream}_${qpSelection.semester}_${e.target.value}`;
                        setCustomLink(qpLinks[linkKey] || "");
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                    >
                      <option value="" disabled>{isFetchingSubjects ? "Fetching subjects..." : "Choose a subject..."}</option>
                      {qpSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Download Link (URL)</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <LinkIcon size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={customLink}
                        onChange={(e) => setCustomLink(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200"
                      />
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!selectedQpSubject || !customLink) return;
                      setIsSavingLink(true);
                      const linkKey = `${qpSelection.university}_${qpSelection.stream}_${qpSelection.semester}_${selectedQpSubject}`;
                      try {
                        await setDoc(doc(db, "settings", "question_papers"), { [linkKey]: customLink }, { merge: true });
                        setQpLinks(prev => ({ ...prev, [linkKey]: customLink }));
                        alert("Link updated successfully!");
                      } catch (err) {
                        alert("Failed to save link: " + err.message);
                      } finally {
                        setIsSavingLink(false);
                      }
                    }}
                    disabled={isSavingLink || !selectedQpSubject || !customLink}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-70 disabled:grayscale"
                  >
                    {isSavingLink ? <Loader inline size="sm" /> : <Save size={18} />}
                    <span>{isSavingLink ? "Updating..." : "Save Link"}</span>
                  </button>
                </div>
                <div className="md:w-72 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Subject Status</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {qpSubjects.length > 0 ? qpSubjects.map(sub => {
                      const linkKey = `${qpSelection.university}_${qpSelection.stream}_${qpSelection.semester}_${sub}`;
                      return (
                        <div
                          key={sub}
                          onClick={() => {
                            setSelectedQpSubject(sub);
                            setCustomLink(qpLinks[linkKey] || "");
                          }}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl border transition-all shadow-sm cursor-pointer active:scale-95 group/sub",
                            selectedQpSubject === sub
                              ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 ring-1 ring-indigo-500/20"
                              : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800"
                          )}
                        >
                          <span className={cn(
                            "text-xs font-bold truncate pr-2",
                            selectedQpSubject === sub ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-200"
                          )}>{sub}</span>
                          {qpLinks[linkKey] ? (
                            <div className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center flex-shrink-0">
                              <CheckIcon size={12} />
                            </div>
                          ) : (
                            <div className="w-5 h-5 bg-slate-100 dark:bg-slate-900 text-slate-300 group-hover/sub:text-indigo-400 transition-colors rounded-full flex items-center justify-center flex-shrink-0">
                              <LinkIcon size={12} />
                            </div>
                          )}
                        </div>
                      );
                    }) : <p className="text-[10px] text-center text-slate-400 py-4 italic">No subjects found.</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "upload-study-materials" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1 tracking-tight">
                Study Materials Link Manager
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Configure download URLs for course specific study materials.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm h-fit space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Search size={20} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">Filters</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">University</label>
                  <select
                    value={smSelection.university}
                    onChange={(e) => setSmSelection({ ...smSelection, university: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                  >
                    <option value="SVU">SVU</option>
                    <option value="Regent">Regent</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Stream</label>
                  <select
                    value={smSelection.stream}
                    onChange={(e) => setSmSelection({ ...smSelection, stream: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                  >
                    <option value="B.Tech">B.Tech</option>
                    <option value="BCA">BCA</option>
                    <option value="ANCS">ANCS</option>
                    <option value="DIPLOMA">DIPLOMA</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Semester</label>
                  <select
                    value={smSelection.semester}
                    onChange={(e) => setSmSelection({ ...smSelection, semester: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n.toString()}>Sem {n}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <BookOpen size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">Manage Link</h3>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Select Subject</label>
                    <select
                      value={selectedSmSubject}
                      onChange={(e) => {
                        setSelectedSmSubject(e.target.value);
                        const linkKey = `${smSelection.university}_${smSelection.stream}_${smSelection.semester}_${e.target.value}_${smMaterialType}`;
                        setCustomLink(smLinks[linkKey] || "");
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                    >
                      <option value="" disabled>{isFetchingSubjects ? "Fetching subjects..." : "Choose a subject..."}</option>
                      {smSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Material Type</label>
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => {
                          setSmMaterialType("book");
                          const linkKey = `${smSelection.university}_${smSelection.stream}_${smSelection.semester}_${selectedSmSubject}_book`;
                          setCustomLink(smLinks[linkKey] || "");
                        }}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all",
                          smMaterialType === "book" ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500"
                        )}
                      >
                        <BookOpen size={14} />
                        Book Link
                      </button>
                      <button
                        onClick={() => {
                          setSmMaterialType("notes");
                          const linkKey = `${smSelection.university}_${smSelection.stream}_${smSelection.semester}_${selectedSmSubject}_notes`;
                          setCustomLink(smLinks[linkKey] || "");
                        }}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all",
                          smMaterialType === "notes" ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500"
                        )}
                      >
                        <FileText size={14} />
                        Notes Link
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                      {smMaterialType === "book" ? "Book" : "Notes"} Download Link (URL)
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <LinkIcon size={16} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      </div>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={customLink}
                        onChange={(e) => setCustomLink(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700 dark:text-slate-200"
                      />
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!selectedSmSubject || !customLink) return;
                      setIsSavingLink(true);
                      const linkKey = `${smSelection.university}_${smSelection.stream}_${smSelection.semester}_${selectedSmSubject}_${smMaterialType}`;
                      try {
                        await setDoc(doc(db, "settings", "study_materials"), { [linkKey]: customLink }, { merge: true });
                        setSmLinks(prev => ({ ...prev, [linkKey]: customLink }));
                        alert("Link updated successfully!");
                      } catch (err) {
                        alert("Failed to save link: " + err.message);
                      } finally {
                        setIsSavingLink(false);
                      }
                    }}
                    disabled={isSavingLink || !selectedSmSubject || !customLink}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-70 disabled:grayscale"
                  >
                    {isSavingLink ? <Loader inline size="sm" /> : <Save size={18} />}
                    <span>{isSavingLink ? "Updating..." : "Save Link"}</span>
                  </button>
                </div>
                <div className="md:w-72 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Subject Status</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {smSubjects.length > 0 ? smSubjects.map(sub => {
                      const baseKey = `${smSelection.university}_${smSelection.stream}_${smSelection.semester}_${sub}`;
                      const bookLink = smLinks[`${baseKey}_book`];
                      const notesLink = smLinks[`${baseKey}_notes`];
                      return (
                        <div
                          key={sub}
                          onClick={() => {
                            setSelectedSmSubject(sub);
                            const linkKey = `${baseKey}_${smMaterialType}`;
                            setCustomLink(smLinks[linkKey] || "");
                          }}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl border transition-all shadow-sm cursor-pointer active:scale-95 group/sm",
                            selectedSmSubject === sub
                              ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 ring-1 ring-emerald-500/20"
                              : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800"
                          )}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className={cn(
                              "text-xs font-bold truncate pr-2",
                              selectedSmSubject === sub ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200"
                            )}>{sub}</span>
                            <div className="flex gap-1.5 mt-1">
                              <div className={cn(
                                "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider",
                                bookLink ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-400 dark:bg-slate-900"
                              )}>
                                <BookOpen size={8} />
                                Book
                              </div>
                              <div className={cn(
                                "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider",
                                notesLink ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-slate-100 text-slate-400 dark:bg-slate-900"
                              )}>
                                <FileText size={8} />
                                Notes
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {bookLink && notesLink ? (
                              <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <CheckIcon size={12} />
                              </div>
                            ) : (bookLink || notesLink) ? (
                              <div className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                                <LinkIcon size={12} />
                              </div>
                            ) : (
                              <div className="w-5 h-5 bg-slate-100 dark:bg-slate-900 text-slate-300 group-hover/sm:text-emerald-400 transition-colors rounded-full flex items-center justify-center">
                                <LinkIcon size={12} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }) : <p className="text-[10px] text-center text-slate-400 py-4 italic">No subjects found.</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AI ASSISTANT ROUTES ── */}
      {activeTab === "ai-queries" && <AdminAssistantQueries />}
      {activeTab === "ai-qa" && <AdminAssistantQA />}
      {activeTab === "ai-history" && <AdminAssistantHistory />}
      {activeTab === "ai-settings" && <AdminAssistantSettings />}

      {activeTab === "db-reset" && (
        <AdminGlobalSystemReset
          initiateFullSystemReset={initiateFullSystemReset}
          isWiping={isWiping}
        />
      )}

      {activeTab === "db-del-holidays" && (
        <AdminHolidaysDelete />
      )}

      {activeTab === "db-del-classes" && (
        <AdminClassesPurge
          deleteFilter={deleteFilter}
          setDeleteFilter={setDeleteFilter}
          deleteFilteredClasses={deleteFilteredClasses}
          wipeGlobalClasses={wipeGlobalClasses}
          isWiping={isWiping}
        />
      )}

      {/* ── SUPPORT PORTAL ROUTES ── */}
      {activeTab === "support-tickets" && (
        <AdminSupportTickets />
      )}

      {activeTab === "support-settings" && (
        <AdminSupportSettings />
      )}
    </AdminLayout>
  );
};

export default AdminPanel;
