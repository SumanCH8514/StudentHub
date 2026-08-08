import React, { useState, useEffect, useCallback } from "react";
import favLogo from "../assets/fav.png";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  where,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db, auth, messaging } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import { onMessage } from "firebase/messaging";
import { notificationService } from "../utils/NotificationService";
import {
  LayoutDashboard,
  LogOut,
  PlusCircle,
  BookOpen,
  Clock,
  User,
  LifeBuoy,
  ArrowRight,
  Hash,
  Settings as SettingsIcon,
  X,
  ShieldAlert,
  CheckCircle2,
  Menu,
  Bell,
  ChevronDown,
  Search,
  Mic,
  Sun,
  Moon,
  Sparkles,
  School,
  GraduationCap,
  Users,
  Mail,
  ClipboardCheck,
  MessagesSquare,
  Download,
  CalendarX,
  Coffee,
} from "lucide-react";
import Uploader from "./Uploader.jsx";
import AdminPanel from "./AdminPanel.jsx";
import Settings from "./Settings.jsx";
import Support from "./Support.jsx";
import Assistant from "./Assistant.jsx";
import Loader from "./Loader.jsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useNavigate } from "react-router-dom";
import defaultProfileImg from "../assets/gojo-prof.jpg";

// Utility for cleaner conditional classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Helper: Converts a time string like "02:50 P.M" into a real Date object for comparison
const parseTimeStr = (timeStr, baseDate) => {
  if (!timeStr) return null;

  // Try standard AM/PM format first
  let match = timeStr.match(/(\d+):(\d+)\s*([ap]\.?\s*m\.?)/i);
  let hours, minutes;

  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const modifier = match[3].replace(/[\s.]/g, "").toUpperCase();

    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
  } else {
    // Fallback: Try 24-hour format "HH:MM"
    match = timeStr.match(/(\d+):(\d+)/);
    if (!match) return null;

    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
  }

  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// --- Hash-Based Routing Logic ---
const getRouteFromHash = () => {
  const hash = window.location.hash.replace("#", "");
  if (!hash) return { view: "dashboard" };

  const validViews = ["dashboard", "admin", "assistant", "uploader", "support"];
  if (hash === "user-dashboard") return { view: "dashboard" }; // Keep for backward compatibility
  if (hash === "admin-") return { view: "admin" };
  if (hash === "ai-assistant") return { view: "assistant" };
  if (hash === "support-history") return { view: "support", tab: "history" };

  const tabMap = {
    "my-profile": "profile",
    "academic-info": "academic",
    "preferences": "preferences",
    "security-data": "security",
    "check-results": "results",
    "upload-routine": "upload",
    "exam-time-routine": "exam",
    "holiday-list": "holidays",
    "study-materials": "materials",
    "question-papers": "papers",
    "attendance": "attendance",
    "chat": "chat",
    "college-forms": "forms",
  };

  if (tabMap[hash]) {
    return { view: "settings", tab: tabMap[hash] };
  }

  if (validViews.includes(hash)) return { view: hash };
  return null;
};

const getHashFromRoute = (currentView, currentTab) => {
  if (currentView === "dashboard") return "";
  if (currentView === "admin") return window.location.hash;
  if (currentView === "assistant") return "#ai-assistant";
  if (currentView === "uploader") return "#uploader";
  if (currentView === "support") {
    return currentTab === "history" ? "#support-history" : "#support";
  }
  if (currentView === "settings") {
    const reverseTabMap = {
      profile: "my-profile",
      academic: "academic-info",
      preferences: "preferences",
      security: "security-data",
      results: "check-results",
      upload: "upload-routine",
      exam: "exam-time-routine",
      holidays: "holiday-list",
      materials: "study-materials",
      papers: "question-papers",
      attendance: "attendance",
      chat: "chat",
      forms: "college-forms",
    };
    return `#${reverseTabMap[currentTab] || currentTab}`;
  }
  return "";
};

const Dashboard = () => {
  const navigate = useNavigate();
  const initialRoute = getRouteFromHash();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [view, setView] = useState(() => {
    if (initialRoute) return initialRoute.view;
    return localStorage.getItem("currentView") || "dashboard";
  });
  const [userRole, setUserRole] = useState("user");
  const [userName, setUserName] = useState("Student");
  const [userPhoto, setUserPhoto] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [fetchShared, setFetchShared] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("studentHub_theme");
    if (savedTheme) return savedTheme === "dark";
    return document.documentElement.classList.contains("dark");
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [supportTab, setSupportTab] = useState("submit");
  const [isListening, setIsListening] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [systemUpdates, setSystemUpdates] = useState([]);
  const [readUpdates, setReadUpdates] = useState([]);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [scheduledNotifyIds, setScheduledNotifyIds] = useState(new Set());

  useEffect(() => {
    if (showUploader) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showUploader]);

  // PWA Install Prompt Logic
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      // Fallback: Just open the download page if prompt not available
      window.open("https://studenthub.sumanonline.com/", "_blank");
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  // Deep linking for settings
  const [settingsConfig, setSettingsConfig] = useState(() => {
    if (initialRoute && initialRoute.view === "settings" && initialRoute.tab) {
      return { tab: initialRoute.tab, forceSidebar: false };
    }
    const saved = localStorage.getItem("currentSettingsConfig");
    return saved ? JSON.parse(saved) : { tab: "profile", forceSidebar: false };
  });

  // Persist view changes and sync hash
  useEffect(() => {
    localStorage.setItem("currentView", view);

    const hash = getHashFromRoute(view, view === "support" ? supportTab : settingsConfig.tab);
    if (window.location.hash !== hash) {
      if (hash === "") {
        // Use replaceState to clear hash without leaving a trailing "#"
        window.history.replaceState(null, "", window.location.pathname);
      } else {
        window.location.hash = hash;
      }
    }
  }, [view, settingsConfig.tab, supportTab]);

  // Handle hash changes (e.g., back/forward buttons or manual hash edit)
  useEffect(() => {
    const handleHashChange = () => {
      const route = getRouteFromHash();
      if (route) {
        if (route.tab) {
          if (route.view === "settings") setSettingsConfig({ tab: route.tab, forceSidebar: false });
          if (route.view === "support") setSupportTab(route.tab);
        }
        setView(route.view);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Persist settingsConfig changes (localStorage sync only)
  useEffect(() => {
    localStorage.setItem("currentSettingsConfig", JSON.stringify(settingsConfig));
  }, [settingsConfig]);

  const handleOpenSettings = (tab = "profile", forceSidebar = false) => {
    setSettingsConfig({ tab, forceSidebar });
    setView("settings");
    setIsSidebarOpen(false);
  };

  const markUpdateAsRead = async (id) => {
    const updated = [...readUpdates, id];
    setReadUpdates(updated);

    const user = auth.currentUser;
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          readUpdates: updated,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error("Failed to save read status to database", error);
      }
    }
  };

  const markAllUpdatesAsRead = async () => {
    const allIds = systemUpdates.map(u => u.id);
    const updated = Array.from(new Set([...readUpdates, ...allIds]));
    setReadUpdates(updated);

    const user = auth.currentUser;
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          readUpdates: updated,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error("Failed to save read status to database", error);
      }
    }
  };

  const unreadCount = systemUpdates.filter(u => !readUpdates.includes(u.id)).length;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getDayName = (date) =>
    new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
  const getFormattedDate = (date) =>
    new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(
      date,
    );

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const isSelectedToday =
    selectedDate.toDateString() === new Date().toDateString();
  const selectedDayName = getDayName(selectedDate);
  const toggleTheme = async () => {
    const newIsDark = !isDarkMode;
    setIsDarkMode(newIsDark);
    const themeStr = newIsDark ? "dark" : "light";
    localStorage.setItem("studentHub_theme", themeStr);

    if (newIsDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    const user = auth.currentUser;
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          themePreference: newIsDark ? "dark" : "light"
        }, { merge: true });
      } catch (err) {
        console.error("Failed to save theme preference:", err);
      }
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    let unsubscribeClasses = null;
    let unsubscribeHolidays = null;
    let unsubscribeUpdates = null;
    let unsubscribeExams = null;

    const fetchUserAndClasses = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setUserRole(data.role || "user");
          setUserName(
            data.fullName || data.name || user.displayName || "Student",
          );
          setUserPhoto(data.photoBase64 || null);
          setFetchShared(data.fetchShared ?? false);

          // Apply user theme preference
          const isDark =
            data.themePreference === "dark" ||
            (data.themePreference === "system" &&
              window.matchMedia("(prefers-color-scheme: dark)").matches);

          setIsDarkMode(isDark);
          if (isDark) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }

          // Shared Routing logic: Fetch from shared_routines filtered by profile
          const { university, stream, semester, section } = data;

          if (university && stream && semester && section) {
            const sharedRoutinesRef = collection(db, "shared_routines");
            let q = query(
              sharedRoutinesRef,
              where("university", "==", university),
              where("stream", "==", stream),
              where("semester", "==", semester),
              where("section", "==", section),
            );

            // If fetchShared is false, only fetch the user's own uploads
            if (!(data.fetchShared ?? false)) {
              q = query(q, where("userId", "==", user.uid));
            }

            unsubscribeClasses = onSnapshot(
              q,
              (snapshot) => {
                setClasses(
                  snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
                );
                setLoading(false);
              },
              (error) => {
                console.error("Error fetching shared routines:", error);
                setLoading(false);
              },
            );
          } else {
            setLoading(false);
          }

          // Fetch Holidays
          const holidaysRef = collection(db, "holidays");
          const qHolidays = query(holidaysRef, orderBy("date", "asc"));
          unsubscribeHolidays = onSnapshot(
            qHolidays,
            (snapshot) => {
              setHolidays(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            },
            (error) => {
              if (error.code === "permission-denied") {
                console.warn("Holidays fetch: Permission denied. Please check Firestore rules.");
              } else {
                console.error("Error fetching holidays:", error);
              }
            }
          );

          if (data.readUpdates) {
            setReadUpdates(data.readUpdates);
          }

          // Fetch System Updates (Targeted)
          const updatesRef = collection(db, "updates");
          const qUpdates = query(updatesRef, orderBy("createdAt", "desc"));
          unsubscribeUpdates = onSnapshot(
            qUpdates,
            (snapshot) => {
              const allUpdates = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
              // Filter logic: Match university, stream, and semester
              const filtered = allUpdates.filter(update => {
                // Personal notifications for specific user - MUST match uid
                if (update.targetUserId) {
                  return update.targetUserId === user.uid;
                }

                const targetUni = update.targetUniversity || "All";
                const targetStream = update.targetStream || "All";
                const targetSem = update.targetSemester || "All";

                const matchesUni = targetUni === "All" || targetUni === data.university;
                const matchesStream = targetStream === "All" || targetStream === data.stream;
                const matchesSem = targetSem === "All" || targetSem === data.semester;

                return matchesUni && matchesStream && matchesSem;
              });
              setSystemUpdates((prev) => {
                // Keep only the today's exam updates (which we preserve) and replace the rest with new fetched
                const examUpdates = prev.filter(u => u.isTodayExam);
                // Also sort nicely
                return [...examUpdates, ...filtered].sort((a, b) => {
                  const timeA = a.createdAt?.seconds || 0;
                  const timeB = b.createdAt?.seconds || 0;
                  return timeB - timeA;
                });
              });
            },
            (error) => {
              if (error.code === "permission-denied") {
                console.warn("System updates fetch: Permission denied. Please check Firestore rules.");
              } else {
                console.error("Error fetching updates:", error);
              }
            }
          );

          // Fetch Exam Routines for "Today's Exam" Notifications
          if (data.university && data.stream && data.semester) {
            const examsRef = collection(db, "exam_routines");
            const qExams = query(
              examsRef,
              where("university", "==", data.university),
              where("stream", "==", data.stream),
              where("semester", "==", data.semester)
            );

            unsubscribeExams = onSnapshot(qExams, (snapshot) => {
              const todayStr = new Date().toISOString().split('T')[0];
              const todaysExams = [];

              snapshot.docs.forEach(docSnap => {
                const exam = docSnap.data();
                // Convert exam string date like "2024-05-20" or similar to standard format if needed
                // We assume string dates like "24-05-2024" or standard "YYYY-MM-DD"
                // For robust checking we format today
                const y = new Date().getFullYear();
                const m = String(new Date().getMonth() + 1).padStart(2, '0');
                const d = String(new Date().getDate()).padStart(2, '0');
                const ymdStr = `${y}-${m}-${d}`;
                const reversemdy = `${d}-${m}-${y}`;
                const shortmdy = `${d}/${m}/${y}`;

                if (exam.date === ymdStr || exam.date === reversemdy || exam.date === shortmdy ||
                  new Date(exam.date).toDateString() === new Date().toDateString()) {

                  todaysExams.push({
                    id: `exam-${docSnap.id}`,
                    title: `Exam Alert: ${exam.subject}`,
                    description: `You have a ${exam.examType || 'Exam'} today for ${exam.subject} at ${exam.time}. Best of luck!`,
                    type: "alert",
                    isTodayExam: true,
                    createdAt: { seconds: Math.floor(Date.now() / 1000) } // force to top
                  });
                }
              });

              setSystemUpdates(prev => {
                const nonExamUpdates = prev.filter(u => !u.isTodayExam);
                // Push exams to top
                return [...todaysExams, ...nonExamUpdates];
              });

            }, (error) => {
              console.error("Error fetching exams for notifications:", error);
            });
          }
        } else {
          setUserName(user.displayName || "Student");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchUserAndClasses();

    // Refresh current time every 30 seconds for higher accuracy
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);

    return () => {
      if (unsubscribeClasses) unsubscribeClasses();
      if (unsubscribeHolidays) unsubscribeHolidays();
      if (unsubscribeUpdates) unsubscribeUpdates();
      if (unsubscribeExams) unsubscribeExams();
      clearInterval(timer);
    };
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsProfileMenuOpen(false);
      setIsNotificationsOpen(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- Derived Data for UI & Notifications ---
  // 1. Compute active holidays for the currently selected date
  const activeHolidays = holidays.filter((h) => {
    if (!h.date) return false;
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    const selectedDateStr = `${y}-${m}-${d}`;
    return h.date === selectedDateStr;
  }).map(h => ({
    ...h,
    isHoliday: true,
    type: 'holiday',
    displayTitle: (selectedDate.toDateString() === new Date().toDateString())
      ? `Today is a Holiday: ${h.occasion}`
      : `${getFormattedDate(selectedDate)} is a Holiday: ${h.occasion}`
  }));

  // 2. Process selected day's classes
  const filteredClasses = activeHolidays.length > 0
    ? []
    : classes
      .filter((c) => c.day?.toLowerCase() === selectedDayName.toLowerCase())
      .map((c) => {
        const timeStr = c.time || (c.startTime && c.endTime ? `${c.startTime} - ${c.endTime}` : c.startTime || "");
        const parts = timeStr ? timeStr.split("-") : [];
        const startTimeStr = parts[0]?.trim() || "";
        const endTimeStr = parts.length > 1 ? parts[1].trim() : startTimeStr;
        const startTime = parseTimeStr(startTimeStr, currentTime);
        const endTime = parseTimeStr(endTimeStr, currentTime);

        let status = "future";
        if (!isSelectedToday) {
          status = "future";
        } else if (endTime && currentTime > endTime) {
          status = "past";
        } else if (startTime && endTime && currentTime >= startTime && currentTime <= endTime) {
          status = "current";
        }
        return { ...c, time: timeStr, status, startTime };
      })
      .sort((a, b) => {
        if (!a.startTime || !b.startTime) return 0;
        return a.startTime - b.startTime;
      });

  const currentClass = isSelectedToday ? filteredClasses.find((c) => c.status === "current") : null;
  const upcomingClasses = isSelectedToday ? filteredClasses.filter((c) => c.status === "future") : filteredClasses;
  const nextClass = upcomingClasses[0];
  const pastClasses = isSelectedToday ? filteredClasses.filter((c) => c.status === "past") : [];
  const timelineClasses = isSelectedToday ? [...(currentClass ? [currentClass] : []), ...upcomingClasses, ...pastClasses] : filteredClasses;
  const isAllClassesDone = isSelectedToday && filteredClasses.length > 0 && filteredClasses.every(c => c.status === "past");

  // --- Notification System Initialization ---
  useEffect(() => {
    // Request permission on first load if not already prompted
    const initNotifications = async () => {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'default') {
        await notificationService.requestPermission();
      }
    };
    initNotifications();

    // Foreground message listener
    let unsubscribeFCM = () => { };
    if (messaging) {
      unsubscribeFCM = onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        notificationService.showLocalNotification(
          payload.notification.title,
          payload.notification.body,
          { data: payload.data?.url || '/' }
        );
      });
    }

    return () => unsubscribeFCM();
  }, []);

  // --- Notification Triggers: Classes, Holidays, Updates ---
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    // 1. Holiday Notification (Once per day)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayHoliday = holidays.find(h => h.date === todayStr);
    if (todayHoliday && !scheduledNotifyIds.has(`holiday_${todayStr}`)) {
      notificationService.showLocalNotification(
        "Today is a Holiday!",
        `Occasion: ${todayHoliday.occasion}`
      );
      setScheduledNotifyIds(prev => new Set(prev).add(`holiday_${todayStr}`));
    }

    // 2. Class Reminders (Upcoming & Started)
    if (isSelectedToday && filteredClasses.length > 0) {
      filteredClasses.forEach(c => {
        if (c.status === "past") return;

        const startTime = parseTimeStr((c.time || "").split("-")[0]?.trim() || "", currentTime);
        if (!startTime) return;

        const timeDiff = startTime.getTime() - currentTime.getTime();
        const minutesDiff = Math.floor(timeDiff / 1000 / 60);

        // Upcoming Class (5-10m before)
        if (minutesDiff > 4 && minutesDiff <= 10 && !scheduledNotifyIds.has(`upcoming_${c.id}_${c.subject}`)) {
          notificationService.showLocalNotification(
            "Upcoming Class",
            `${c.subject} starts in ${minutesDiff} minutes.`
          );
          setScheduledNotifyIds(prev => new Set(prev).add(`upcoming_${c.id}_${c.subject}`));
        }

        // Class Started
        if (currentTime >= startTime && !scheduledNotifyIds.has(`started_${c.id}_${c.subject}`)) {
          notificationService.showLocalNotification(
            "Class Started",
            `${c.subject} is starting now.`
          );
          setScheduledNotifyIds(prev => new Set(prev).add(`started_${c.id}_${c.subject}`));
        }

        // Class Ended
        const endTime = parseTimeStr((c.time || "").split("-")[1]?.trim(), currentTime);
        if (endTime && currentTime >= endTime && !scheduledNotifyIds.has(`ended_${c.id}_${c.subject}`)) {
          notificationService.showLocalNotification(
            "Class Ended",
            `${c.subject} has ended.`
          );
          setScheduledNotifyIds(prev => new Set(prev).add(`ended_${c.id}_${c.subject}`));
        }
      });
    }

    // 3. System Updates / Real-time Notifications
    if (systemUpdates.length > 0) {
      systemUpdates.forEach(update => {
        if (!readUpdates.includes(update.id) && !scheduledNotifyIds.has(`update_${update.id}`)) {
          notificationService.showLocalNotification(
            update.displayTitle || update.title || "New Update",
            update.occasion || update.message || "Check your notifications for details."
          );
          setScheduledNotifyIds(prev => new Set(prev).add(`update_${update.id}`));
        }
      });
    }

  }, [holidays, filteredClasses, systemUpdates, readUpdates, currentTime, isSelectedToday]);

  const clearAllRoutineData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (
      !window.confirm(
        "Are you ABSOLUTELY sure? This will permanently delete your entire routine.",
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const sharedRef = collection(db, "shared_routines");
      const q = query(sharedRef, where("userId", "==", user.uid));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        alert("You haven't uploaded any routine data to the shared database!");
        setLoading(false);
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((document) => {
        batch.delete(document.ref);
      });

      await batch.commit();
      alert("Your routine data has been cleared from the shared database!");
      setView("dashboard");
    } catch (error) {
      console.error("Error clearing routine:", error);
      alert("Failed to clear routine. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };


  // Auto-scroll hero slider to current or next class
  useEffect(() => {
    const slider = document.getElementById("hero-slider");
    if (!slider || filteredClasses.length === 0) return;

    let targetIndex = 0;
    if (currentClass) {
      targetIndex = filteredClasses.findIndex(
        (c) => c.subject === currentClass.subject && c.time === currentClass.time
      );
    } else if (nextClass) {
      targetIndex = filteredClasses.findIndex(
        (c) => c.subject === nextClass.subject && c.time === nextClass.time
      );
    }

    if (targetIndex > 0) {
      const timeoutId = setTimeout(() => {
        const targetCard = slider.children[targetIndex];
        if (targetCard) {
          // Scroll exactly to the specific child's offset, handling any CSS gaps perfectly
          slider.scrollTo({
            left: targetCard.offsetLeft - slider.offsetLeft,
            behavior: "smooth"
          });
        } else {
          slider.scrollTo({
            left: slider.clientWidth * targetIndex,
            behavior: "smooth"
          });
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [filteredClasses.length, currentClass?.subject, nextClass?.subject]);

  // Handle notification click
  const handleNotificationClick = (update) => {
    if (update.isSupportReply) {
      setSupportTab("history");
      setView("support");
    } else if (update.type === 'alert' || update.type === 'notification') {
      // General notifications can just stay on dashboard or go to a relevant section
    }

    setIsNotificationsOpen(false);
    markUpdateAsRead(update.id);
  };

  // Combine holidays and system updates into one feed
  // Then filter out any updates the user has marked as read
  const allUpdates = [
    ...activeHolidays,
    ...systemUpdates.map(u => ({ ...u, type: u.type || 'alert' }))
  ].filter(update => !readUpdates.includes(update.id));

  // Stabilize the onTabChange callback to prevent infinite render loops
  const handleSettingsTabChange = useCallback((tab) => {
    setSettingsConfig(prev => {
      // Only update if something actually changed to prevent redundant re-renders
      if (prev.tab === tab && prev.forceSidebar === false) return prev;
      return { tab, forceSidebar: false };
    });
  }, []);

  if (view === "settings") {
    return (
      <Settings
        onBack={() => setView("dashboard")}
        onSync={() => {
          setView("dashboard");
          setShowUploader(true);
        }}
        initialTab={settingsConfig.tab}
        showMobileSidebar={settingsConfig.forceSidebar}
        onTabChange={handleSettingsTabChange}
        classes={classes}
      />
    );
  }


  if (view === "admin") {
    return <AdminPanel />;
  }

  if (view === "uploader") {
    return <Uploader onUploadSuccess={() => setView("dashboard")} />;
  }

  if (view === "support") {
    return <Support onBack={() => setView("dashboard")} initialTab={supportTab} />;
  }

  if (view === "assistant") {
    return <Assistant classes={classes} holidays={holidays} userData={userData} systemUpdates={systemUpdates} readUpdates={readUpdates} onBack={() => setView("dashboard")} />;
  }



  return (
    <div className="min-h-screen w-full bg-[#f4f7fc] dark:bg-slate-900 text-slate-800 dark:text-slate-200 overflow-x-hidden font-sans transition-colors duration-500 relative">
      {/* Soft Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-[#e8ecf8] to-transparent dark:from-indigo-950/20" />
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#e0e7ff]/40 dark:bg-indigo-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#fdf2f8]/40 dark:bg-pink-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px]" />
      </div>

      {/* --- MOBILE SIDEBAR --- */}
      <div
        className={cn(
          "fixed inset-0 z-[100] transition-all duration-500",
          isSidebarOpen ? "visible" : "invisible",
        )}
      >
        {/* Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity duration-500",
            isSidebarOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Sidebar Content */}
        <aside
          className={cn(
            "absolute top-0 right-0 w-[320px] h-full flex flex-col transform transition-transform duration-500 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-white/60 dark:border-slate-800 shadow-[-20px_0_60px_rgba(99,102,241,0.12)]",
            isSidebarOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          {/* Mesh background decoration */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-20%] left-[-20%] w-[280px] h-[280px] bg-indigo-300/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[200px] h-[200px] bg-purple-300/20 rounded-full blur-[60px]" />
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-8 pt-10 pb-6">
            <div className="flex-1 text-center">
              <h2 className="text-2xl font-black tracking-tight text-[#1e1b4b] dark:text-white">
                Student <span className="text-indigo-600 dark:text-indigo-400">Hub</span>
              </h2>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1 ml-4"
            >
              <X size={22} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-4">

            {/* MY ACCOUNT */}
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-10 pl-1">My Account</p>

            {/* Profile Card with overlapping avatar */}
            <div className="relative bg-white/60 dark:bg-slate-800/60 rounded-[1.75rem] border border-white/80 dark:border-slate-700 shadow-[0_4px_24px_rgba(99,102,241,0.08)] px-6 pb-6 pt-10 mb-8 flex flex-col items-center text-center group/card">
              {/* Avatar — overlaps top */}
              <div className="absolute -top-12 w-24 h-24 rounded-full border-[5px] border-white dark:border-slate-800 shadow-xl bg-indigo-100 overflow-hidden z-20 transition-transform duration-500 group-hover/card:scale-105">
                {userPhoto ? (
                  <img src={userPhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <img src={defaultProfileImg} alt="Default Profile" className="w-full h-full object-cover" />
                )}
              </div>

              {/* Gear icon */}
              <button
                onClick={() => { setView("settings"); setIsSidebarOpen(false); }}
                className="absolute top-3 right-4 text-slate-300 hover:text-indigo-500 transition-colors"
                title="Settings"
              >
                <SettingsIcon size={20} />
              </button>

              {/* Profile info */}
              <div className="flex flex-col mb-6 mt-6">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <User size={14} className="text-indigo-500" />
                    <h3 className="text-[15px] font-black text-[#1e1b4b] dark:text-white leading-tight">
                      {userName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Mail size={12} className="text-slate-400" />
                    <p className="text-[10px] font-medium text-slate-400 max-w-[180px] break-words italic">
                      {auth.currentUser?.email}
                    </p>
                  </div>
                </div>
                {/* Mobile Sidebar: Detailed Profile Info */}
                <div className="flex flex-col gap-1.5 items-center">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <School size={12} className="text-indigo-500" />
                    <span>{userData?.university || "N/A"}</span>
                    <span className="text-slate-300 mx-0.5">•</span>
                    <GraduationCap size={12} className="text-purple-500" />
                    <span>{userData?.stream || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <Users size={12} className="text-blue-500" />
                    <span>Sec {userData?.section || "N/A"}</span>
                    <span className="text-slate-300 mx-0.5">•</span>
                    <Hash size={12} className="text-amber-500" />
                    <span>Roll: {userData?.rollNumber || "N/A"}</span>
                  </div>
                </div>


              </div>
            </div>

            {/* MAIN NAVIGATION */}
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4 pl-1 mt-6">Mobile Main Menu</p>
            <nav className="flex flex-col gap-1 mb-10 w-full">
              {userRole === "admin" && (
                <button
                  onClick={() => { navigate("/admin"); setIsSidebarOpen(false); }}
                  className="flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-white/60 transition-all active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                    <ShieldAlert size={18} className="text-rose-500" />
                  </div>
                  <span className="text-[16px] font-black text-rose-500 tracking-tight">Admin Panel</span>
                </button>
              )}

              <button
                onClick={() => handleOpenSettings("profile", true)}
                className="flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-white/60 transition-all active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <LayoutDashboard size={18} className="text-indigo-600" />
                </div>
                <span className="text-[16px] font-black text-indigo-600 tracking-tight">Student Dashboard</span>
              </button>

              <button
                onClick={() => { setView("assistant"); setIsSidebarOpen(false); }}
                className="flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-white/60 transition-all active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <Sparkles size={18} className="text-purple-600" />
                </div>
                <span className="text-[16px] font-black text-purple-600 tracking-tight">AI Assistant</span>
              </button>

              <button
                onClick={() => handleOpenSettings("attendance")}
                className="flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-white/60 transition-all active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <ClipboardCheck size={18} className="text-blue-500" />
                </div>
                <span className="text-[16px] font-black text-blue-500 tracking-tight">Attendance</span>
              </button>

              <button
                onClick={() => handleOpenSettings("chat")}
                className="flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-white/60 transition-all active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                  <MessagesSquare size={18} className="text-pink-500" />
                </div>
                <span className="text-[16px] font-black text-pink-500 tracking-tight">Chat (personal/Group)</span>
              </button>



              <button
                onClick={() => handleOpenSettings("preferences")}
                className="flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-white/60 transition-all active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                  <SettingsIcon size={18} className="text-slate-600 dark:text-slate-400" />
                </div>
                <span className="text-[16px] font-black text-[#1e1b4b] dark:text-slate-200 tracking-tight">My Settings</span>
              </button>

              {!fetchShared && (
                <button
                  onClick={() => { setShowUploader(true); setIsSidebarOpen(false); }}
                  className="flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-white/60 transition-all active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                    <PlusCircle size={18} className="text-sky-500" />
                  </div>
                  <span className="text-[16px] font-black text-sky-500 tracking-tight">Sync Schedule</span>
                </button>
              )}

              <button
                onClick={() => handleOpenSettings("materials")}
                className="flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-white/60 transition-all active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <BookOpen size={18} className="text-emerald-500" />
                </div>
                <span className="text-[16px] font-black text-emerald-500 tracking-tight">Course Materials</span>
              </button>

              <button
                onClick={() => signOut(auth)}
                className="flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-white/60 transition-all active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <LogOut size={18} className="text-amber-500" />
                </div>
                <span className="text-[16px] font-black text-amber-500 tracking-tight">Logout</span>
              </button>
            </nav>

            {/* QUICK ACTIONS */}
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4 pl-1">Quick Actions</p>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => handleOpenSettings("holidays")}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800/50 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all active:scale-95"
              >
                <div className="w-5 h-5 bg-rose-400 rounded-md flex items-center justify-center">
                  <Clock size={11} className="text-white" />
                </div>
                <span className="text-[12px] font-black text-[#1e1b4b] dark:text-slate-200">Calendar</span>
              </button>
              <button
                onClick={() => handleOpenSettings("results")}
                className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800/50 rounded-full hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-all active:scale-95"
              >
                <div className="w-5 h-5 bg-sky-400 rounded-md flex items-center justify-center">
                  <BookOpen size={11} className="text-white" />
                </div>
                <span className="text-[12px] font-black text-[#1e1b4b] dark:text-slate-200">Grades</span>
              </button>
              <button
                onClick={() => handleOpenSettings("chat")}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all active:scale-95"
              >
                <div className="w-5 h-5 bg-amber-400 rounded-md flex items-center justify-center">
                  <Hash size={11} className="text-white" />
                </div>
                <span className="text-[12px] font-black text-[#1e1b4b] dark:text-slate-200">Messages</span>
              </button>
              <button
                onClick={handleInstallApp}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all active:scale-95"
              >
                <div className="w-5 h-5 bg-indigo-500 rounded-md flex items-center justify-center">
                  <Download size={11} className="text-white" />
                </div>
                <span className="text-[12px] font-black text-[#1e1b4b] dark:text-slate-200">App Download</span>
              </button>
            </div>
          </div>

          {/* Footer
          <div className="relative z-10 py-6 text-center border-t border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
              A SumanOnline Website
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-slate-300 mt-0.5">
              AI Routine System V1.2
            </p>
          </div> */}
        </aside>
      </div>

      <div className="relative z-10 w-full px-4 py-6 sm:px-6 md:px-10 lg:px-16 xl:px-24">
        {/* Floating Pill Header */}
        <header className="relative z-50 flex items-center justify-between gap-2 sm:gap-4 mb-6 sm:mb-10 bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl p-2.5 sm:p-4 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-white/80 dark:border-slate-700">
          {/* Left: Branding */}
          <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-4 shrink-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[0.85rem] sm:rounded-[1.25rem] overflow-hidden shadow-md shrink-0">
              <img src={favLogo} alt="StudentHub Logo" className="w-full h-full object-cover" />
            </div>
            <div className="text-[24px] sm:text-[28px] font-black tracking-tighter text-[#1e1b4b] dark:text-white leading-none flex items-baseline">
              Student
              <span className="text-indigo-600 dark:text-indigo-400">Hub</span>
            </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-8 shrink">
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search size={20} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" strokeWidth={2.5} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-20 py-4 bg-indigo-50/40 dark:bg-indigo-950/20 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white dark:focus:bg-slate-900 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 shadow-[inset_0_2px_8px_rgba(79,70,229,0.05)] text-slate-700 dark:text-slate-200 font-bold placeholder-slate-400 text-[13px] transition-all"
                placeholder="Search for classes, teachers or ask any Questions related to StudentHub"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-all active:scale-90"
                    title="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}
                <button
                  onClick={handleVoiceSearch}
                  className={cn(
                    "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-500 transition-all active:scale-90",
                    isListening && "text-rose-500 bg-rose-50 dark:bg-rose-900/20 animate-pulse"
                  )}
                  title={isListening ? "Listening..." : "Voice Search"}
                >
                  <Mic size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-4 pr-1 sm:pr-2">
            {userRole === "admin" && (
              <button
                onClick={() => navigate("/admin")}
                className="hidden sm:flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-5 py-3 rounded-full hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all font-black uppercase tracking-widest text-[10px]"
              >
                <ShieldAlert size={16} />
                <span>Admin Panel</span>
              </button>
            )}
            {!fetchShared && (
              <button
                onClick={() => setShowUploader(true)}
                className="hidden sm:flex items-center gap-2 bg-[#0f172a] hover:bg-indigo-600 text-white px-6 py-3 rounded-full font-black text-sm transition-all shadow-md active:scale-95"
              >
                <PlusCircle size={18} />
                <span className="hidden sm:inline">Sync</span>
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileMenuOpen(false); }}
                className="p-2 sm:p-3 bg-white dark:bg-slate-700 text-slate-400 hover:text-indigo-600 rounded-full transition-all shadow-sm active:scale-95 border border-slate-100 dark:border-slate-600 shrink-0 relative"
                title="Notifications"
              >
                <Bell size={20} className="w-5 h-5 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-slate-700 rounded-full animate-pulse" />
                )}
              </button>

              {isNotificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setIsNotificationsOpen(false)}
                  />
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[18px] sm:w-84 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100 dark:border-slate-700 z-[9999] overflow-hidden animate-slide-in-down flex flex-col max-h-[420px]">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 dark:text-white text-[14px]">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                            {unreadCount} New
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllUpdatesAsRead}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline active:scale-95"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-1">
                      {systemUpdates.length > 0 ? (
                        systemUpdates.map((update) => {
                          const isRead = readUpdates.includes(update.id);
                          const isExam = update.type === "alert" || update.isTodayExam;
                          return (
                            <div
                              key={update.id}
                              onClick={() => {
                                markUpdateAsRead(update.id);
                                if (isExam) handleOpenSettings("exam");
                                else if (update.type === "support") setView("support");
                              }}
                              className={cn(
                                "p-3 rounded-xl transition-all border cursor-pointer",
                                !isRead
                                  ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40"
                                  : "bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50"
                              )}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className={cn(
                                  "w-2 h-2 rounded-full mt-1.5 shrink-0",
                                  !isRead ? (isExam ? "bg-rose-500 animate-pulse" : "bg-indigo-500 animate-pulse") : "bg-slate-300 dark:bg-slate-600"
                                )} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <p className={cn(
                                      "text-xs leading-snug truncate",
                                      !isRead ? "font-black text-slate-900 dark:text-white" : "font-bold text-slate-700 dark:text-slate-300"
                                    )}>
                                      {update.title}
                                    </p>
                                    {!isRead && (
                                      <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 px-1.5 py-0.2 rounded">
                                        Unread
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                    {update.description}
                                  </p>
                                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-1 block">
                                    {update.createdAt?.seconds ? new Date(update.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-8 text-center">
                          <Bell size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                          <p className="text-xs font-medium text-slate-400">No notifications available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="flex p-2 sm:p-3 bg-white dark:bg-slate-700 text-slate-400 hover:text-indigo-600 rounded-full transition-all shadow-sm active:scale-95 border border-slate-100 dark:border-slate-600 shrink-0"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={20} className="w-5 h-5 sm:w-5 sm:h-5" /> : <Moon size={20} className="w-5 h-5 sm:w-5 sm:h-5" />}
            </button>
            <button
              onClick={() => { setView("settings"); setIsNotificationsOpen(false); setIsProfileMenuOpen(false); }}
              className="hidden sm:block p-3 bg-white dark:bg-slate-700 text-slate-400 hover:text-indigo-600 rounded-full transition-all shadow-sm active:scale-95 border border-slate-100 dark:border-slate-600"
            >
              <SettingsIcon size={20} />
            </button>

            <div className="relative hidden sm:block ml-2 group">
              <button
                onClick={() => { setIsProfileMenuOpen(!isProfileMenuOpen); setIsNotificationsOpen(false); }}
                className={cn(
                  "flex items-center gap-2 pl-1 pr-1 sm:pr-3 py-1 rounded-full border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all active:scale-95 group-hover:border-indigo-200 dark:group-hover:border-indigo-900",
                  isProfileMenuOpen && "shadow-inner border-indigo-200 dark:border-indigo-900 bg-slate-50 dark:bg-slate-900"
                )}
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden bg-indigo-100 shrink-0">
                  <img
                    src={userPhoto || defaultProfileImg}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <ChevronDown
                  size={16}
                  className={cn(
                    "text-slate-400 group-hover:text-indigo-500 transition-transform duration-200",
                    isProfileMenuOpen && "rotate-180 text-indigo-500"
                  )}
                />
              </button>

              {isProfileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setIsProfileMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-[14px] w-64 sm:w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-200/60 dark:shadow-slate-900/80 border border-slate-100 dark:border-slate-700 z-[9999] overflow-hidden animate-slide-in-down flex flex-col">
                    <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-indigo-100 dark:border-indigo-900 shadow-sm bg-white dark:bg-slate-800">
                        <img src={userPhoto || defaultProfileImg} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 dark:text-white text-[15px] truncate leading-tight mb-1">{userName}</p>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                          <School size={10} className="text-indigo-500" />
                          <span>{userData?.university || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 flex flex-col">
                      <button
                        onClick={() => { setView("settings"); setIsProfileMenuOpen(false); }}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all text-left w-full group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 flex items-center justify-center transition-colors">
                          <User size={16} />
                        </div>
                        My Profile
                      </button>
                      <button
                        onClick={() => { setView("assistant"); setIsProfileMenuOpen(false); }}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-xl transition-all text-left w-full group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 flex items-center justify-center transition-colors">
                          <Sparkles size={16} className="text-purple-500" />
                        </div>
                        AI Assistant
                      </button>
                      <button
                        onClick={() => { setView("support"); setIsProfileMenuOpen(false); }}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all text-left w-full group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 flex items-center justify-center transition-colors">
                          <LifeBuoy size={16} className="text-indigo-500" />
                        </div>
                        Support Portal
                      </button>
                      <button
                        onClick={() => { setView("settings"); setIsProfileMenuOpen(false); }}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all text-left w-full group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 flex items-center justify-center transition-colors">
                          <SettingsIcon size={16} />
                        </div>
                        Settings
                      </button>
                    </div>

                    <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/10">
                      <button
                        onClick={() => signOut(auth)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-xl transition-all font-bold shadow-sm shadow-rose-100 dark:shadow-none border border-rose-100 dark:border-rose-900/30 active:scale-95"
                      >
                        <LogOut size={16} />
                        Logout Account
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {showUploader && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden">
            {/* Backdrop with premium blur */}
            <div
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-500"
              onClick={() => setShowUploader(false)}
            />

            {/* Modal Content container */}
            <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 border border-slate-100/50 animate-in zoom-in-95 fade-in duration-500 overflow-hidden max-h-[90vh] flex flex-col">
              {/* Close Button Inside Modal */}
              <button
                onClick={() => setShowUploader(false)}
                className="absolute top-6 right-6 p-3 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all active:scale-95 z-20"
              >
                <X size={20} />
              </button>

              <div className="overflow-y-auto w-full">
                <Uploader onUploadSuccess={() => setShowUploader(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Two-column grid: Left content + Right widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Main Content Column (Left) */}
          <div className="lg:col-span-8 flex flex-col gap-6 sm:gap-10 order-1 lg:order-1">
            {/* UPCOMING HIGHLIGHTS HEADER */}
            <h2 className="text-slate-800 dark:text-white font-black text-sm sm:text-base uppercase tracking-widest px-2">
              Upcoming Highlights
            </h2>

            {/* SLIDER HERO CARDS */}
            <div className="relative w-full overflow-hidden rounded-[3rem] shadow-2xl shadow-indigo-500/20 group">

              {/* Left Arrow (Absolute positioning over the slider container) */}
              <button
                className="flex absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full items-center justify-center shrink-0 shadow-lg hover:scale-105 transition-transform"
                onClick={() => {
                  const slider = document.getElementById('hero-slider');
                  if (slider) slider.scrollBy({ left: -slider.clientWidth, behavior: 'smooth' });
                }}
              >
                <ArrowRight className="rotate-180 text-slate-400" size={20} />
              </button>

              <div
                id="hero-slider"
                className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 sm:gap-6 pb-4 -mb-4 px-1 items-stretch"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {isAllClassesDone ? (
                  <div className="group bg-[#3e3488] dark:bg-indigo-950 rounded-[3rem] p-6 sm:p-10 min-w-full flex-shrink-0 snap-center relative flex items-center justify-between transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.3)] min-h-[220px]">
                    <div className="relative z-10 w-full bg-[#bce4f5] dark:bg-indigo-900/60 rounded-[2.5rem] flex-1 p-8 sm:p-12 overflow-hidden backdrop-blur-sm border border-white/40 dark:border-white/10 text-center shadow-inner group-hover:bg-white/90 dark:group-hover:bg-slate-800/80 transition-colors duration-500">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise-pattern-with-subtle-cross-lines.png')] opacity-[0.05] mix-blend-overlay"></div>
                      <h2 className="text-xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-tight relative z-10 bg-clip-text text-transparent bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-400 dark:from-emerald-400 dark:via-emerald-300 dark:to-emerald-200 transition-colors duration-500">
                        Mission Completed 🎉
                      </h2>
                      <p className="mt-4 text-[9px] md:text-sm font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 opacity-100 transform translate-y-0 transition-all duration-500">
                        All classes are Done for today.
                      </p>
                    </div>
                  </div>
                ) : filteredClasses.length > 0 ? (
                  filteredClasses.map((cls, idx) => {
                    const isLive = cls.status === "current";
                    return (
                      <div
                        key={idx}
                        className="group bg-[#3e3488] dark:bg-indigo-950 rounded-[3rem] p-4 sm:p-5 md:p-8 lg:p-10 min-w-full flex-shrink-0 snap-center relative flex flex-col items-stretch h-full transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.3)]"
                      >
                        {/* Live Class Dynamic Background Glow on the dark outer box */}
                        {isLive && (
                          <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-30 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient-xy transition-opacity duration-500 group-hover:opacity-40 rounded-[3rem]"></div>
                        )}

                        <div className="relative z-10 w-full h-full bg-[#bce4f5] dark:bg-indigo-900/60 rounded-[2.5rem] flex-1 flex flex-col justify-center min-w-0 p-6 sm:p-8 md:p-10 lg:p-12 overflow-hidden backdrop-blur-sm border border-white/40 dark:border-white/10 shadow-inner group-hover:bg-white/90 dark:group-hover:bg-slate-800/80 transition-colors duration-500">
                          {/* Subtle texture for inner card */}
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise-pattern-with-subtle-cross-lines.png')] opacity-[0.05] mix-blend-overlay"></div>

                          {/* Extra horizontal padding so arrows don't cover text */}
                          <div className="relative z-10 w-full sm:px-6 md:px-10 lg:px-14 flex flex-col min-w-0">

                            {/* Top Badge Row */}
                            <div className="flex items-center gap-3 mb-4 md:mb-5">
                              {isLive ? (
                                <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-full shadow-sm">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                  </span>
                                  <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
                                    Live Now
                                  </span>
                                </div>
                              ) : (
                                <h3 className="font-bold text-[10px] md:text-[11px] uppercase tracking-widest text-slate-800 dark:text-indigo-200 bg-white/50 dark:bg-slate-800/50 px-3 py-1 border border-white/50 dark:border-slate-700/50 rounded-full h-[22px] flex items-center shrink-0">
                                  {cls.status === "past" ? "Past Class" : "Upcoming Next"}
                                </h3>
                              )}
                            </div>

                            {/* Subject Title with Gradient Text / Size explicitly requested as 18px mobile */}
                            <h2 className="text-[18px] leading-[1.3] sm:text-[22px] md:text-[34px] lg:text-[42px] font-black tracking-tighter mb-4 md:mb-8 whitespace-normal line-clamp-3 md:line-clamp-none break-words bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 transition-all duration-500">
                              {cls.subject}
                            </h2>

                            {/* Details Row (Time & Teacher) */}
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8">
                              <div className="flex items-center gap-3 group-hover:translate-x-1 transition-transform duration-500 ease-out">
                                <div className={`p-2 rounded-[0.6rem] transition-colors duration-500 ${isLive ? 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/30' : 'bg-white/50 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400 group-hover:bg-white/80 dark:group-hover:text-indigo-400'}`}>
                                  <Clock size={16} className="shrink-0 md:w-5 md:h-5" />
                                </div>
                                <span className="font-extrabold tracking-tight text-sm md:text-base text-slate-700 dark:text-indigo-100 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-500">
                                  {cls.time || (cls.startTime && cls.endTime ? `${cls.startTime} - ${cls.endTime}` : cls.startTime || "")}
                                </span>
                              </div>

                              <div className="hidden sm:block w-[1px] h-8 bg-slate-800/20 dark:bg-white/20 transition-colors duration-500 group-hover:bg-slate-300 dark:group-hover:bg-slate-600"></div>

                              <div className="flex items-center gap-3 min-w-0 group-hover:translate-x-1 transition-transform duration-500 ease-out delay-75">
                                <div className={`p-2 rounded-[0.6rem] transition-colors duration-500 ${isLive ? 'bg-purple-50 text-purple-500 dark:bg-purple-500/20 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-500/30' : 'bg-white/50 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400 group-hover:bg-white/80 dark:group-hover:text-purple-400'}`}>
                                  <User size={16} className="shrink-0 md:w-5 md:h-5" />
                                </div>
                                <span className="font-bold text-sm md:text-base break-words whitespace-normal text-slate-700 dark:text-indigo-100 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-500">
                                  {cls.teacher}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="group bg-[#3e3488] dark:bg-indigo-950 rounded-[3rem] p-6 sm:p-10 min-w-full flex-shrink-0 snap-center relative flex items-center justify-between transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.3)] min-h-[220px]">
                    <div className="relative z-10 w-full bg-[#bce4f5] dark:bg-indigo-900/60 rounded-[2.5rem] flex-1 p-8 sm:p-12 overflow-hidden backdrop-blur-sm border border-white/40 dark:border-white/10 text-center shadow-inner group-hover:bg-white/90 dark:group-hover:bg-slate-800/80 transition-colors duration-500">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise-pattern-with-subtle-cross-lines.png')] opacity-[0.05] mix-blend-overlay"></div>
                      {activeHolidays.length > 0 ? (
                        <>
                          <h2 className="text-xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-tight relative z-10 bg-clip-text text-transparent bg-gradient-to-br from-rose-600 via-rose-500 to-rose-400 dark:from-rose-400 dark:via-rose-300 dark:to-rose-200 transition-colors duration-500">
                            No Class Today
                          </h2>
                          <p className="mt-4 text-[9px] md:text-sm font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400 opacity-100 transform translate-y-0 transition-all duration-500">
                            Due to {activeHolidays[0]?.occasion || "Holiday"}
                          </p>
                        </>
                      ) : loading ? (
                        <Loader inline size="lg" message="Loading..." />
                      ) : (
                        <>
                          <h2 className="text-xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-tight relative z-10 bg-clip-text text-transparent bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-400 dark:from-indigo-400 dark:via-indigo-300 dark:to-indigo-200 transition-colors duration-500">
                            Enjoy your day!
                          </h2>
                          <p className="mt-4 text-[9px] md:text-sm font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 opacity-100 transform translate-y-0 transition-all duration-500">
                            No classes are scheduled today
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Arrow */}
              <button
                className="flex absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full items-center justify-center shrink-0 shadow-lg hover:scale-105 transition-transform"
                onClick={() => {
                  const slider = document.getElementById('hero-slider');
                  if (slider) slider.scrollBy({ left: slider.clientWidth, behavior: 'smooth' });
                }}
              >
                <ArrowRight className="text-slate-400" size={20} />
              </button>
            </div>

            {/* DAILY TIMELINE CONTAINER */}
            <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-white/60 dark:border-slate-800 mt-2">
              {/* Timeline Header */}
              <div className="flex flex-col items-center sm:flex-row sm:items-center justify-between gap-6 mb-8 sm:mb-12">
                <div className="flex flex-col gap-1 items-center sm:items-start text-center sm:text-left">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
                    Daily Timeline
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 font-bold text-sm sm:text-base">
                    {selectedDayName}, {getFormattedDate(selectedDate)}
                  </p>
                </div>

                <div className="flex flex-row items-center justify-center gap-4 w-full sm:w-auto">
                  <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <button
                      onClick={handlePrevDay}
                      className="p-2 sm:p-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 rounded-xl transition-all active:scale-95"
                    >
                      <ArrowRight className="rotate-180" size={18} />
                    </button>
                    {!isSelectedToday && (
                      <button
                        onClick={handleToday}
                        className="px-3 py-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400"
                      >
                        Today
                      </button>
                    )}
                    <button
                      onClick={handleNextDay}
                      className="p-2 sm:p-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 rounded-xl transition-all active:scale-95"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>

                  <div className="bg-[#f8f9fc] dark:bg-slate-800 px-5 py-3 rounded-2xl flex items-center gap-2 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <Hash size={16} className="text-indigo-400" />
                    <span className="font-bold text-[#1e1b4b] dark:text-slate-300 text-sm">
                      {filteredClasses.length} Classes Total
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4 relative z-10 w-full">
                {loading ? (
                  <Loader fullScreen={false} message="Loading your day..." />
                ) : timelineClasses.length > 0 ? (
                  timelineClasses.map((item, index) => {
                    const isPast = item.status === "past";
                    const isCurrent = item.status === "current";

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 px-5 py-4 sm:px-8 sm:py-6 rounded-3xl bg-white dark:bg-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none border border-slate-100 dark:border-slate-700 transition-all duration-300 ease-out w-full group animate-in slide-in-from-bottom-4 fade-in hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-none hover:border-indigo-100/50 dark:hover:border-slate-600 cursor-default",
                          isPast &&
                          "opacity-60 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800",
                          isCurrent &&
                          "ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20",
                        )}
                        style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'both' }}
                      >
                        {/* Time Block */}
                        <div className="flex items-center gap-3 sm:gap-4 sm:w-48 shrink-0">
                          <div
                            className={cn(
                              "p-2 rounded-full border transition-all duration-300 group-hover:scale-110",
                              isCurrent
                                ? "text-indigo-600 border-indigo-200 bg-indigo-50 group-hover:bg-indigo-100 group-hover:border-indigo-300"
                                : "text-slate-400 border-slate-200 bg-slate-50 group-hover:bg-white group-hover:text-indigo-500 group-hover:border-indigo-200 dark:bg-slate-700 dark:border-slate-600 dark:group-hover:bg-slate-600",
                            )}
                          >
                            <Clock size={16} />
                          </div>
                          <div className="flex flex-col sm:block">
                            <div className="flex items-center gap-2 sm:block">
                              <span className="font-black text-slate-800 dark:text-slate-200 text-sm tracking-tight">
                                {(item.time || "").split("-")[0]?.trim() || ""}
                              </span>
                              {(item.time || "").split("-")[1] && (
                                <span className="sm:hidden text-slate-400 text-xs">
                                  <ArrowRight size={12} />
                                </span>
                              )}
                              <span className="font-bold text-slate-600 dark:text-slate-400 sm:text-slate-400 text-sm sm:text-xs sm:block">
                                {(item.time || "").split("-")[1]?.trim() || ""}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="hidden sm:block w-[1px] h-10 bg-slate-200 dark:bg-slate-700"></div>

                        {/* Class Info */}
                        <div className="flex-1 min-w-0 pr-4 w-full sm:w-auto">
                          <h4
                            className={cn(
                              "font-black text-base sm:text-lg tracking-tight leading-tight mb-1 break-words whitespace-normal",
                              isPast
                                ? "text-slate-500"
                                : "text-[#1e1b4b] dark:text-white",
                            )}
                          >
                            {item.subject}
                          </h4>
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <User size={12} className="shrink-0" />
                            <span className="text-xs font-bold break-words whitespace-normal">
                              {item.teacher}
                            </span>
                          </div>
                        </div>

                        {/* Status Label */}
                        <div className="sm:ml-auto">
                          {isSelectedToday && (
                            <div
                              className={cn(
                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                isCurrent
                                  ? "bg-indigo-600 text-white"
                                  : isPast
                                    ? "bg-slate-100 text-slate-400"
                                    : "bg-slate-50 text-indigo-400 border border-slate-100 dark:bg-slate-700 dark:border-slate-600",
                              )}
                            >
                              {isCurrent
                                ? "Live Now"
                                : isPast
                                  ? "Done"
                                  : "Next Up"}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-16 sm:py-20 text-center flex flex-col items-center justify-center min-h-[220px] bg-slate-50/50 dark:bg-slate-800/30 rounded-[2.5rem] border-2 border-slate-100/80 dark:border-slate-800/80 border-dashed mt-2 group hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors duration-500">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-500/10 blur-xl rounded-full scale-150 animate-pulse group-hover:bg-indigo-500/30 transition-all duration-500" />
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-slate-800 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-indigo-500/10 group-hover:-translate-y-2 group-hover:scale-105 transition-all duration-500 ease-out z-10 relative border border-slate-100 dark:border-slate-700">
                        {activeHolidays.length > 0 ? (
                          <Coffee size={32} className="text-rose-500 sm:w-10 sm:h-10 animate-[bounce_3s_ease-in-out_infinite] origin-bottom group-hover:text-rose-600 transition-colors" strokeWidth={1.5} />
                        ) : (
                          <CalendarX size={32} className="text-indigo-400 sm:w-10 sm:h-10 group-hover:text-indigo-500 group-hover:rotate-[15deg] transition-all duration-500" strokeWidth={1.5} />
                        )}
                      </div>
                    </div>

                    <h3 className="text-slate-800 dark:text-white font-black text-xl sm:text-2xl tracking-tight mb-2 group-hover:text-indigo-950 dark:group-hover:text-indigo-100 transition-colors">
                      {activeHolidays.length > 0 ? "Holiday Today 🎉" : "No classes found"}
                    </h3>

                    <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium max-w-[280px] leading-relaxed">
                      {activeHolidays.length > 0 ? (
                        <>Take a break! Today is <strong>{activeHolidays[0]?.occasion || "a Holiday"}</strong>.</>
                      ) : (
                        "Looks like your schedule is completely clear for the day."
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (Widgets) */}
          <div className="lg:col-span-4 flex flex-col gap-6 sm:gap-8 order-2">

            {/* Updates / Holidays Card */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-white/80 dark:border-slate-700 flex flex-col relative overflow-hidden group">
              {/* Top Accent line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-rose-400 opacity-50"></div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-500">
                    <ShieldAlert size={20} />
                  </div>
                  <h3 className="font-black text-[#1e1b4b] dark:text-white text-lg tracking-tight">Updates</h3>
                </div>
                <div className="px-3 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                  {allUpdates.length} New
                </div>
              </div>

              <div className="flex-1 w-full flex flex-col overflow-y-auto custom-scrollbar max-h-[220px] pr-2">
                {allUpdates.length > 0 ? (
                  <div className="flex flex-col gap-3 mt-2">
                    {allUpdates.map((update) => (
                      <div key={update.id} className={cn(
                        "border rounded-2xl p-4 transition-all",
                        update.isHoliday ? "bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-900/20" :
                          update.type === 'alert' ? "bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-900/20" :
                            update.type === 'statement' ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 hover:bg-amber-50 dark:hover:bg-amber-900/20" :
                              "bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      )}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <div className={cn(
                                "w-2 h-2 rounded-full animate-pulse",
                                (update.isHoliday || update.type === 'alert') ? "bg-rose-500" :
                                  update.type === 'statement' ? "bg-amber-500" : "bg-indigo-500"
                              )}></div>
                            </div>
                            <div>
                              {update.isHoliday ? (
                                <p className="text-sm font-bold text-rose-700 dark:text-rose-400 leading-tight mb-1">
                                  {update.displayTitle}
                                </p>
                              ) : (
                                <p className={cn(
                                  "text-sm font-bold leading-tight mb-1 pr-6",
                                  update.type === 'alert' ? "text-rose-700 dark:text-rose-400" :
                                    update.type === 'statement' ? "text-amber-700 dark:text-amber-400" :
                                      "text-indigo-700 dark:text-indigo-400"
                                )}>
                                  {update.title}
                                </p>
                              )}
                              {update.description && (
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  {update.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Mark as Read Button */}
                          {!update.isHoliday && (
                            <button
                              onClick={() => markUpdateAsRead(update.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors shrink-0"
                              title="Mark as Read"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-slate-400 space-y-2">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-full items-center justify-center flex mb-2 border border-slate-100 dark:border-slate-700">
                      <CheckCircle2 size={20} className="text-slate-300" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest">No Updates</p>
                    <p className="text-[11px] font-medium max-w-[150px]">All regular classes are scheduled today.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Classes Today Card */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-white/80 dark:border-slate-700 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-sky-50 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center text-sky-600 dark:text-sky-400 mb-6">
                <BookOpen size={32} />
              </div>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
                Classes Today
              </p>
              <h2 className="text-6xl sm:text-7xl font-black text-[#1e1b4b] dark:text-white tracking-tighter leading-none mb-3">
                {filteredClasses.length}
              </h2>
              <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mb-6">
                Scheduled for Today
              </p>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-700">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Database Active
                </span>
              </div>
            </div>

            {/* Total Classes Card (Replaces System Status) */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-white/80 dark:border-slate-700 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                <LayoutDashboard size={32} />
              </div>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
                Total Classes
              </p>
              <h2 className="text-6xl sm:text-7xl font-black text-[#1e1b4b] dark:text-white tracking-tighter leading-none mb-3">
                {classes.length}
              </h2>
              <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mb-6">
                Classes / Week
              </p>
              <button
                onClick={() => setView("settings")}
                className="w-full py-3 bg-[#0f172a] hover:bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
              >
                Manage Routine
              </button>
            </div>


          </div>
        </div>

        {/* Footer Section */}
        <footer className="mt-12 sm:mt-16 pb-2">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] px-8 sm:px-12 pt-8 sm:pt-10 pb-6 sm:pb-8 shadow-2xl shadow-slate-900/5 dark:shadow-none mb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">

              <div className="lg:col-span-2 flex flex-col items-start gap-4">
                <div className="transition-transform hover:scale-105 duration-300">
                  <img
                    src="https://cdn.photos.sumanonline.com/R29vZ2xl/AVvXsEhos0R2tOWxdN_BLuLURzfQuWfV7OGviJ2NCbpQIHYYGBEP8t8zMWc9ZOUEyz8KI2Cr_QX_qzaAGadXOiNoIFsH5P3VJ7I758LvbcutztjuDNI3FBw8_f2z1gkdB7fDmodQfVEPGXwUWR2slBjKcU4nHxyPX3ewLik7gCI-vfp0O9PtloDj2nPy0crvo1JX/s600/new-logo-removebg.png"
                    alt="StudentHub Logo"
                    className="h-16 sm:h-20 max-w-[280px] sm:max-w-[340px] w-auto object-contain"
                  />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-sm">
                  StudentHub is your all-in-one AI academic companion, streamlining class schedules, study resources, and exam routines to elevate your learning journey.
                </p>
              </div>

              <div className="flex flex-col items-start gap-3">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">Navigation</h4>
                <button onClick={() => setView("dashboard")} className="group text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:translate-x-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-500 transition-colors shrink-0" />
                  <span>Dashboard</span>
                </button>
                <button onClick={() => setView("assistant")} className="group text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-all hover:translate-x-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-purple-500 transition-colors shrink-0" />
                  <span>AI Assistant</span>
                </button>
                <button onClick={() => handleOpenSettings("upload")} className="group text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:translate-x-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-500 transition-colors shrink-0" />
                  <span>Class Schedule</span>
                </button>
                <button onClick={() => handleOpenSettings("exam")} className="group text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:translate-x-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-500 transition-colors shrink-0" />
                  <span>Exam Routines</span>
                </button>
              </div>

              <div className="flex flex-col items-start gap-3">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">Resources</h4>
                <button onClick={() => handleOpenSettings("profile")} className="group text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:translate-x-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-500 transition-colors shrink-0" />
                  <span>My Profile</span>
                </button>
                <button onClick={() => setView("support")} className="group text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:translate-x-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-500 transition-colors shrink-0" />
                  <span>Help Center</span>
                </button>
                <button onClick={() => handleOpenSettings("materials")} className="group text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:translate-x-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-500 transition-colors shrink-0" />
                  <span>Study Materials</span>
                </button>
                <button onClick={() => handleOpenSettings("papers")} className="group text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:translate-x-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-500 transition-colors shrink-0" />
                  <span>Question Papers</span>
                </button>
              </div>

              <div className="flex flex-col items-start gap-3">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">Legal & Policies</h4>
                <button onClick={() => window.open("/privacy-policy", "_blank")} className="group text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:translate-x-1 text-left flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-500 transition-colors shrink-0" />
                  <span>Privacy Policy</span>
                </button>
                <button onClick={() => window.open("/terms-of-service", "_blank")} className="group text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:translate-x-1 text-left flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-500 transition-colors shrink-0" />
                  <span>Terms of Service</span>
                </button>
              </div>

            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent my-6" />

            <div className="flex flex-wrap items-center justify-center text-center gap-2 pt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="font-black uppercase tracking-wider">&copy; {new Date().getFullYear()} StudentHub Platform</span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
              <span>
                Designed & Developed with ❤️ for Students by{" "}
                <a
                  href="https://sumanonline.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  SumanOnline.Com
                </a>
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
