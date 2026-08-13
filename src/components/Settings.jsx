import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import {
  Trash2,
  AlertTriangle,
  ArrowLeft,
  Settings as SettingsIcon,
  Shield,
  Database,
  User,
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  Hash,
  CheckCircle2,
  Camera,
  Search,
  Bell,
  Moon,
  Globe,
  Info,
  Sparkles,
  LayoutDashboard,
  LogOut,
  Lock,
  Home,
  X,
  AlignLeft,
  Activity,
  Users,
  FileSignature,
  Layers,
  Upload,
  ClipboardList,
  Film,
  Tv2,
  Gamepad2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  BookMarked,
  FileQuestion,
  ClipboardCheck,
  MessagesSquare,
  MessageCircle,
  Smartphone,
  Send,
  FileText,
  LifeBuoy,
  RefreshCw,
  Check,
  Music
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import defaultProfileImg from "../assets/gojo-prof.jpg";
import { compressAndResizeImage } from "../utils/imageCompressor";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://api.backend.studenthub.sumanonline.com";
import studentHubLogo from "../assets/StudentHub-logo1.png";
import favLogo from "../assets/fav.png";
import { onSnapshot, orderBy } from "firebase/firestore";
import Attendance from "./Attendance";
import CollegeForms from "./CollegeForms";
import StudentDashboard from "./StudentDashboard";
import Loader from "./Loader";
import { useAcademicConfig } from "../utils/academicConfig";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Reusable input wrapper                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */
const Field = ({ label, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-1">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      )}
      {children}
    </div>
  </div>
);

const CustomSelect = ({ value, onChange, options, name, icon: Icon, className = "", openUp = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => String(opt.value) === String(value)) || options[0];

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          inputCls(!!Icon),
          "flex items-center justify-between cursor-pointer text-left select-none pr-10",
          className
        )}
      >
        <span className="truncate">{selectedOption?.label || value}</span>
        <ChevronDown
          size={16}
          className={cn(
            "absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform duration-200",
            isOpen && "rotate-180 text-blue-500"
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute left-0 right-0 z-[100] bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150 max-h-52 overflow-y-auto select-scrollbar pr-1",
            openUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
          )}
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange({ target: { name, value: opt.value } });
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all text-left mb-0.5 last:mb-0",
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold shadow-sm"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-700/50"
                )}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} className="text-blue-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const inputCls = (hasIcon = true) =>
  cn(
    "w-full bg-[#f5f5f9] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pr-4 text-[14px] font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all",
    hasIcon ? "pl-11" : "pl-4",
  );

const Card = ({ children, className = "", delay = 0 }) => (
  <div
    className={cn(
      "bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col",
      className,
    )}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

const CardHeader = ({ icon: Icon, iconBg, iconColor, title, subtitle, children }) => (
  <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-700">
    <div className="flex items-center gap-3.5">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        <Icon size={20} className={iconColor} />
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 dark:text-white text-[15px] leading-tight">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-[12px] mt-0.5">{subtitle}</p>
      </div>
    </div>
    {children}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/* Main Component                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */
const Settings = ({ onBack, onSync, onTabChange, onNavigateView, initialTab = "dashboard", showMobileSidebar = false, classes = [] }) => {
  const { config: academicConfig } = useAcademicConfig();
  const accountItems = [
    { id: "dashboard", label: "Student Dashboard", icon: LayoutDashboard },
    { id: "profile", label: "My Profile", icon: User },
    { id: "academic", label: "Academic Info", icon: GraduationCap },
  ];

  const featureItems = [
    { id: "results", label: "Check Results", icon: ClipboardList },
    { id: "upload", label: "Upload Routine", icon: Upload },
    { id: "exam", label: "Exam Time Routine", icon: CalendarDays },
    { id: "holidays", label: "Holiday List", icon: CalendarDays },
    { id: "materials", label: "Study Materials", icon: BookMarked },
    { id: "papers", label: "Question Papers", icon: FileQuestion },
    { id: "attendance", label: "Attendance", icon: ClipboardCheck },
    { id: "chat", label: "Chat (personal/Group)", icon: MessagesSquare },
    { id: "forms", label: "College Forms", icon: FileText },
    { id: "support", label: "Support Portal", icon: LifeBuoy },
  ];

  const settingsItems = [
    { id: "preferences", label: "Preferences", icon: Database },
    { id: "security", label: "Security & Data", icon: Shield },
  ];

  const serviceItems = [
    {
      id: "frontpage",
      label: "FrontPageMaker",
      desc: "Create beautiful assignment front pages",
      icon: FileSignature,
      color: "bg-violet-50 dark:bg-violet-900/20",
      iconColor: "text-violet-600",
      href: "https://sumanonline.com/FrontPageMaker/",
    },
    {
      id: "movies",
      label: "Movie And Series Watch",
      desc: "Stream the latest movies and series online",
      icon: Film,
      color: "bg-rose-50 dark:bg-rose-900/20",
      iconColor: "text-rose-500",
      href: "https://cinema.sumanonline.com/",
    },
    {
      id: "anime",
      label: "Anime Watch",
      desc: "Browse and stream anime series",
      icon: Tv2,
      color: "bg-amber-50 dark:bg-amber-900/20",
      iconColor: "text-amber-500",
      href: "https://cinema.sumanonline.com/anime/",
    },
    {
      id: "games",
      label: "Games",
      desc: "Play browser games during breaks",
      icon: Gamepad2,
      color: "bg-sky-50 dark:bg-sky-900/20",
      iconColor: "text-sky-500",
      href: "https://games.sumanonline.com/",
    },
    {
      id: "pdfeditor",
      label: "PdfEditor",
      desc: "Edit, merge, and manage PDF documents",
      icon: FileText,
      color: "bg-emerald-50 dark:bg-emerald-900/20",
      iconColor: "text-emerald-600",
      href: "https://sumanpdf.sumanonline.com/",
    },
    {
      id: "sumanmusic",
      label: "SumanMusic",
      desc: "Listen to your favorite songs and music online",
      icon: Music,
      color: "bg-indigo-50 dark:bg-indigo-900/20",
      iconColor: "text-indigo-600",
      href: "https://songs.sumanonline.com/",
    },
  ];

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");

  const [saveStatus, setSaveStatus] = useState(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(showMobileSidebar);
  const [activeNav, setActiveNav] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveNav(initialTab);
    }
  }, [initialTab]);
  const [qpLinks, setQpLinks] = useState({});
  const [smLinks, setSmLinks] = useState({});

  // Dynamically extract unique subjects from the routine
  const routineSubjects = useMemo(() => {
    if (!classes || classes.length === 0) return [];
    const unique = [...new Set(classes.map(c => c.subject?.trim()).filter(Boolean))];
    return unique.sort();
  }, [classes]);

  // Expansion state for materials and papers
  const [expandedMaterials, setExpandedMaterials] = useState([]);
  const [expandedPapers, setExpandedPapers] = useState([]);

  const toggleMaterial = (subject) => {
    setExpandedMaterials(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const togglePaper = (subject) => {
    setExpandedPapers(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  // Notify parent of tab changes
  useEffect(() => {
    if (onTabChange) {
      onTabChange(activeNav);
    }
  }, [activeNav, onTabChange]);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [systemUpdates, setSystemUpdates] = useState([]);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Flatten all searchable items
  const allSearchableItems = useMemo(() => {
    const innerItems = [
      // Academic
      { id: "academic", label: "University / College", desc: "Select your institution", icon: BookOpen, type: 'nav' },
      { id: "academic", label: "Stream / Course", desc: "Your departmental path", icon: GraduationCap, type: 'nav' },
      { id: "academic", label: "Semester", desc: "Current academic term", icon: CalendarDays, type: 'nav' },
      { id: "academic", label: "Section", desc: "Class group assignment", icon: Users, type: 'nav' },
      { id: "academic", label: "Roll Number", desc: "Official student identifier", icon: Hash, type: 'nav' },

      // Preferences
      { id: "preferences", label: "Fetch Routine Online", desc: "Enable community schedule sync", icon: Database, type: 'nav' },
      { id: "preferences", label: "App Theme Default", desc: "System, Light or Dark mode", icon: Moon, type: 'nav' },

      // Security
      { id: "security", label: "Wipe All Routine Data", desc: "Permanently delete your local sync", icon: Trash2, type: 'nav' },

      // College Forms
      { id: "forms", label: "Bonafide Certificate", desc: "Student verification form", icon: FileText, type: 'nav' },
      { id: "forms", label: "Admission Application Form", desc: "New session entry form", icon: FileSignature, type: 'nav' },
      { id: "forms", label: "Library Membership Form", desc: "Register for book borrowing", icon: BookOpen, type: 'nav' },
      { id: "forms", label: "Scholarship Application", desc: "Financial aid opportunities", icon: ClipboardCheck, type: 'nav' },
      { id: "forms", label: "Hostel Accommodation Form", desc: "Campus housing request", icon: Home, type: 'nav' },
      { id: "forms", label: "ID Card Replacement", desc: "Apply for lost/damaged ID", icon: Shield, type: 'nav' },
      { id: "forms", label: "No Due Form", desc: "Departmental clearance certificate", icon: FileText, type: 'nav' },

      // Support Support
      { id: "support", label: "Report a Bug", desc: "Let developers know about an issue", icon: LifeBuoy, type: 'nav' },
      { id: "support", label: "Submit Feedback", desc: "Request new features", icon: LifeBuoy, type: 'nav' },
      { id: "support", label: "Help Center", desc: "Get platform assistance", icon: LifeBuoy, type: 'nav' },
    ];

    const items = [
      ...accountItems.map(item => ({ ...item, type: 'nav' })),
      ...featureItems.map(item => ({ ...item, type: 'nav' })),
      ...settingsItems.map(item => ({ ...item, type: 'nav' })),
      ...serviceItems.map(item => ({ ...item, type: 'service' })),
      ...innerItems
    ];
    return items;
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allSearchableItems.filter(item =>
      item.label.toLowerCase().includes(q) ||
      (item.desc && item.desc.toLowerCase().includes(q))
    ).slice(0, 6); // Limit to 6 results
  }, [searchQuery, allSearchableItems]);

  const handleSearchResultClick = (item) => {
    if (item.type === 'nav') {
      setActiveNav(item.id);
    } else if (item.type === 'service' && item.href) {
      window.open(item.href, "_blank");
    }
    setSearchQuery("");
  };

  // Mark as Read Tracking (now synced with Firestore)
  const [readUpdates, setReadUpdates] = useState([]);

  const markUpdateAsRead = async (id) => {
    const updated = [...readUpdates, id];
    setReadUpdates(updated); // Optimistic UI update

    // Sync to Firestore
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


  useEffect(() => {
    setActiveNav(initialTab);
    if (showMobileSidebar) setIsSidebarOpen(true);
  }, [initialTab, showMobileSidebar]);

  const ROLL_FORMAT = {
    "BCA":  { prefix: "006", code: "BCA" },
    "ANCS": { prefix: "001", code: "BANC" },
  };

  const buildFormattedRoll = (stream, admissionYear, numericPart) => {
    const fmt = ROLL_FORMAT[stream];
    if (!fmt || !numericPart) return numericPart || "";
    return `${fmt.prefix}-${fmt.code}-${admissionYear}-${numericPart}`;
  };

  const extractNumericPart = (stream, rollNumber) => {
    const fmt = ROLL_FORMAT[stream];
    if (!fmt || !rollNumber) return rollNumber || "";
    const prefix = `${fmt.prefix}-${fmt.code}-`;
    if (rollNumber.startsWith(prefix)) {
      const parts = rollNumber.split("-");
      return parts[parts.length - 1] || rollNumber;
    }
    return rollNumber;
  };

  const [rollNumericPart, setRollNumericPart] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    university: "SVU",
    customUniversity: "",
    stream: "B.Tech",
    customStream: "",
    semester: "1",
    section: "1",
    rollNumber: "",
    admissionYear: new Date().getFullYear().toString(),
    fetchShared: true,
    photoBase64: "",
    themePreference: "system",
  });

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [holidays, setHolidays] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [showPassedHolidays, setShowPassedHolidays] = useState(false);

  const [examRoutines, setExamRoutines] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);

  const parseExamTime = (timeStr) => {
    if (!timeStr) return 0;
    try {
      // Expecting format "10:00 AM - 1:00 PM"
      const startPart = timeStr.split('-')[0].trim();
      const parts = startPart.split(' ');
      const time = parts[0];
      const modifier = parts[1];
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + (minutes || 0);
    } catch (e) {
      return 0;
    }
  };

  const processedExams = useMemo(() => {
    if (!examRoutines.length) return [];

    // Get unique dates in sorted order to assign Day 1, Day 2, etc.
    const uniqueDates = [...new Set(examRoutines.map(e => e.date))].sort((a, b) => new Date(a) - new Date(b));
    const dateToDayMap = {};
    uniqueDates.forEach((date, index) => {
      dateToDayMap[date] = index + 1;
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const mapped = examRoutines.map(exam => {
      const eDate = new Date(exam.date);
      const examTime = new Date(eDate.getFullYear(), eDate.getMonth(), eDate.getDate()).getTime();

      let status = 'upcoming';
      if (examTime === today) {
        status = 'today';
      } else if (examTime < today) {
        status = 'passed';
      }

      return {
        ...exam,
        dayNumber: dateToDayMap[exam.date],
        status
      };
    });

    // Move passed exams to the end
    return [...mapped].sort((a, b) => {
      if (a.status === 'passed' && b.status !== 'passed') return 1;
      if (a.status !== 'passed' && b.status === 'passed') return -1;
      return 0; // Keep original chronological sort for others
    });
  }, [examRoutines]);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) { setFetching(false); return; }
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFormData((prev) => ({
            ...prev,
            fullName: data.fullName || data.name || user.displayName || "",
            email: data.email || user.email || "",
            phoneNumber: data.phoneNumber || "",
            university: data.university || "SVU",
            customUniversity: data.customUniversity || "",
            stream: data.stream || "B.Tech",
            customStream: data.customStream || "",
            semester: data.semester || "1",
            section: data.section || "1",
            rollNumber: data.rollNumber || "",
            admissionYear: data.admissionYear || new Date().getFullYear().toString(),
            fetchShared: data.fetchShared ?? true,
            photoBase64: data.photoBase64 || "",
            themePreference: data.themePreference || "system",
          }));
          setRollNumericPart(extractNumericPart(data.stream || "B.Tech", data.rollNumber || ""));

          if (data.readUpdates) {
            setReadUpdates(data.readUpdates);
          }

          // Default the theme to 'system' logic if not set
          if (!data.themePreference) {
            setFormData(prev => ({ ...prev, themePreference: 'system' }));
          }
        } else {
          console.error("User profile not found in database."); // Using console.error as toast is not imported
        }
      } catch (err) {
        console.error("Failed to fetch profile: " + err.message); // Using console.error as toast is not imported
      } finally {
        setFetching(false); // Changed from setFetchingUser to setFetching
      }
    };

    fetchUserData();

    // Fetch System Updates
    let unsubscribeUpdates = () => { };
    let unsubscribeExams = () => { };

    // We need to wait for userData to be available to fetch exams correctly,
    // but updates can be fetched immediately.
    const updatesRef = collection(db, "updates");
    const qUpdates = query(updatesRef, orderBy("createdAt", "desc"));
    unsubscribeUpdates = onSnapshot(
      qUpdates,
      (snapshot) => {
        const user = auth.currentUser;

        // Filter out read updates and updates meant for other specific users
        const updates = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(update => {
            // Remove already read updates
            if (readUpdates.includes(update.id)) return false;

            // If it's a targeted notification (like a support reply), only show it to the owner
            if (update.targetUserId && user) {
              return update.targetUserId === user.uid;
            }

            return true;
          });

        setSystemUpdates((prev) => {
          const examUpdates = prev.filter(u => u.isTodayExam);
          return [...examUpdates, ...updates].sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
          });
        });
      },
      (error) => {
        if (error.code === "permission-denied") {
          console.warn("Settings updates fetch: Permission denied. Please check Firestore rules.");
        } else {
          console.error("Error fetching updates:", error);
        }
      }
    );

    // Fetch Question Paper and Study Material Links for Consumer View
    const fetchLinks = async () => {
      try {
        const [qpDoc, smDoc] = await Promise.all([
          getDoc(doc(db, "settings", "question_papers")),
          getDoc(doc(db, "settings", "study_materials"))
        ]);
        if (qpDoc.exists()) setQpLinks(qpDoc.data());
        if (smDoc.exists()) setSmLinks(smDoc.data());
      } catch (err) {
        console.warn("Could not fetch links (permissions or missing):", err);
      }
    };
    fetchLinks();

    return () => {
      unsubscribeUpdates();
      unsubscribeExams();
    };

  }, []);

  // Separate effect to fetch exams once we have the user data mapped
  useEffect(() => {
    let unsubscribeExams = () => { };

    if (formData?.university && formData?.stream && formData?.semester) {
      const examsRef = collection(db, "exam_routines");
      const qExams = query(
        examsRef,
        where("university", "==", formData.university),
        where("stream", "==", formData.stream),
        where("semester", "==", formData.semester)
      );

      unsubscribeExams = onSnapshot(qExams, (snapshot) => {
        const todaysExams = [];

        snapshot.docs.forEach(docSnap => {
          const exam = docSnap.data();
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
          return [...todaysExams, ...nonExamUpdates];
        });

      }, (error) => {
        console.error("Error fetching exams for settings notifications:", error);
      });
    }

    return () => unsubscribeExams();
  }, [formData?.university, formData?.stream, formData?.semester]);

  useEffect(() => {
    const fetchHolidays = async () => {
      if (activeNav === "holidays" || activeNav === "all") {
        setLoadingHolidays(true);
        try {
          const snap = await getDocs(collection(db, "holidays"));
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Sort by date ideally
          list.sort((a, b) => new Date(a.date) - new Date(b.date));
          setHolidays(list);
        } catch (err) {
          console.error("Failed to fetch holidays", err);
        } finally {
          setLoadingHolidays(false);
        }
      }
    };
    fetchHolidays();
  }, [activeNav]);

  useEffect(() => {
    const fetchExams = async () => {
      if ((activeNav === "exam" || activeNav === "all") && !fetching) {
        setLoadingExams(true);
        try {
          const q = query(
            collection(db, "exam_routines"),
            where("university", "==", formData.university),
            where("stream", "==", formData.stream),
            where("semester", "==", formData.semester?.toString()),
            where("section", "==", formData.section?.toString())
          );
          const snap = await getDocs(q);
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Enhanced sort: Date first, then Time
          list.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA.getTime() !== dateB.getTime()) {
              return dateA - dateB;
            }
            return parseExamTime(a.time) - parseExamTime(b.time);
          });
          setExamRoutines(list);
        } catch (err) {
          console.error("Failed to fetch exam routines:", err);
        } finally {
          setLoadingExams(false);
        }
      }
    };
    fetchExams();
  }, [activeNav, fetching, formData.university, formData.stream, formData.semester, formData.section]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    if (name === "rollNumericInput") {
      setRollNumericPart(value);
      setFormData((prev) => ({
        ...prev,
        rollNumber: buildFormattedRoll(prev.stream, prev.admissionYear, value),
      }));
    } else if (name === "stream") {
      setFormData((prev) => {
        const newRoll = buildFormattedRoll(value, prev.admissionYear, rollNumericPart);
        return { ...prev, stream: value, rollNumber: newRoll };
      });
    } else if (name === "admissionYear") {
      setFormData((prev) => {
        const newRoll = buildFormattedRoll(prev.stream, value, rollNumericPart);
        return { ...prev, admissionYear: value, rollNumber: newRoll };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const user = auth.currentUser;
    try {
      setIsUploadingPhoto(true);
      setUploadSuccess(false);

      // Compress and resize image to <= 1MB and max 500x500 dimensions
      const compressedBase64 = await compressAndResizeImage(file, {
        maxWidth: 500,
        maxHeight: 500,
        maxSizeMB: 1.0,
      });

      // Show preview
      setFormData((prev) => ({ ...prev, photoBase64: compressedBase64 }));

      const response = await fetch(`${BACKEND_URL}/api/upload-avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: compressedBase64,
          userId: user ? user.uid : "user",
        }),
      });
      const result = await response.json();
      if (result.success && result.url) {
        setFormData((prev) => ({ ...prev, photoBase64: result.url }));
        if (user) {
          await setDoc(doc(db, "users", user.uid), { photoBase64: result.url }, { merge: true });
        }
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 2500);
      }
    } catch (uploadErr) {
      console.error("Failed to upload compressed profile picture to Cloudflare R2:", uploadErr);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true); setSaveStatus(null);
    try {
      let updatedData = { ...formData };
      // If photo is raw base64, ensure uploaded to R2 before saving
      if (formData.photoBase64 && (formData.photoBase64.startsWith("data:image") || formData.photoBase64.length > 300)) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/upload-avatar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: formData.photoBase64,
              userId: user.uid,
            }),
          });
          const result = await response.json();
          if (result.success && result.url) {
            updatedData.photoBase64 = result.url;
            setFormData((prev) => ({ ...prev, photoBase64: result.url }));
          }
        } catch (uploadErr) {
          console.error("Failed to upload avatar during save:", uploadErr);
        }
      }

      await setDoc(doc(db, "users", user.uid), { ...updatedData, updatedAt: new Date().toISOString() }, { merge: true });
      setSaveStatus("success");
      setHasSaved(true);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error("Save Error:", err);
      setSaveStatus("error");
      setMessage("Failed to save changes.");
    } finally {
      setLoading(false);
    }
  };

  const deleteAllRoutines = async () => {
    const user = auth.currentUser;
    if (!user) return;
    if (!window.confirm("Are you sure? This will permanently delete ALL your uploaded routines.")) return;
    setLoading(true);
    try {
      const q = query(collection(db, "shared_routines"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      setMessage("Your routine data has been cleared from the shared database.");
    } catch (err) {
      console.error("Delete Error:", err);
      setMessage("Failed to delete data.");
    } finally {
      setLoading(false);
    }
  };


  /* ── Loading ── */
  if (fetching) {
    return <Loader />;
  }

  /* ── Main ── */
  return (
    <div className="min-h-screen flex bg-[#f5f5f9] dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-100 selection:text-blue-700 transition-colors duration-300">

      {/* ── Mobile overlay ── */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 xl:hidden",
          isSidebarOpen ? "opacity-100 visible" : "opacity-0 invisible",
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          SIDEBAR — identical chrome to AdminLayout
      ══════════════════════════════════════════════════════════════════════ */}
      <aside
        className={cn(
          "fixed xl:sticky top-0 left-0 z-50 h-screen w-[260px] bg-[#282a42] dark:bg-[#1a1c2d] text-slate-300 flex flex-col transition-transform duration-300 shrink-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 h-[84px] shrink-0">
          <button
            type="button"
            onClick={() => {
              if (hasSaved) {
                localStorage.setItem("currentView", "dashboard");
                window.history.replaceState(null, "", "/routine/Dashboard");
                window.location.reload();
              } else {
                onBack();
              }
            }}
            className="flex-1 flex items-center h-full text-left focus:outline-none group cursor-pointer"
            title="Go to Dashboard"
          >
            <img
              src="https://cdn.photos.sumanonline.com/R29vZ2xl/AVvXsEhos0R2tOWxdN_BLuLURzfQuWfV7OGviJ2NCbpQIHYYGBEP8t8zMWc9ZOUEyz8KI2Cr_QX_qzaAGadXOiNoIFsH5P3VJ7I758LvbcutztjuDNI3FBw8_f2z1gkdB7fDmodQfVEPGXwUWR2slBjKcU4nHxyPX3ewLik7gCI-vfp0O9PtloDj2nPy0crvo1JX/s600/new-logo-removebg.png"
              alt="StudentHub Logo"
              className="h-16 w-auto max-w-[200px] object-contain transition-transform group-hover:scale-105"
            />
          </button>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="xl:hidden p-2 -mr-2 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 custom-scrollbar">
          <p className="px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Accounts & Profile Info
          </p>

          {accountItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeNav === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveNav(id); setIsSidebarOpen(false); }}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-[14px] w-full text-left",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20 font-medium"
                    : "text-slate-400 hover:text-white hover:bg-white/5",
                )}
              >
                <Icon size={19} className={cn("shrink-0", isActive ? "text-white" : "text-slate-400")} />
                {label}
              </button>
            );
          })}

          <div className="mt-6 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            StudentHub Features
          </div>
          {featureItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeNav === id;
            return (
              <button
                key={id}
                onClick={() => {
                  if (id === "support") {
                    if (onNavigateView) {
                      onNavigateView("support");
                    } else {
                      onBack();
                    }
                    return;
                  }
                  setActiveNav(id);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-[14px] w-full text-left",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20 font-medium"
                    : "text-slate-400 hover:text-white hover:bg-white/5",
                )}
              >
                <Icon size={19} className={cn("shrink-0", isActive ? "text-white" : "text-slate-400")} />
                {label}
              </button>
            );
          })}

          <div className="mt-6 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Settings
          </div>
          {settingsItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeNav === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveNav(id); setIsSidebarOpen(false); }}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-[14px] w-full text-left",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20 font-medium"
                    : "text-slate-400 hover:text-white hover:bg-white/5",
                )}
              >
                <Icon size={19} className={cn("shrink-0", isActive ? "text-white" : "text-slate-400")} />
                {label}
              </button>
            );
          })}

          <div className="mt-6 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Notifications
          </div>
          <button
            onClick={() => {
              setIsNotificationsOpen(true);
              setIsSidebarOpen(false);
            }}
            className="flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 text-[14px] w-full text-left text-slate-400 hover:text-white hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <Bell size={19} className="shrink-0 text-slate-400" />
              <span>Updates & Alerts</span>
            </div>
            {systemUpdates.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                {systemUpdates.length}
              </span>
            )}
          </button>

          <div className="mt-6 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Other
          </div>
          <button
            onClick={() => { setActiveNav("services"); setIsSidebarOpen(false); }}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-[14px] w-full text-left",
              activeNav === "services"
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20 font-medium"
                : "text-slate-400 hover:text-white hover:bg-white/5",
            )}
          >
            <Layers size={19} className={cn("shrink-0", activeNav === "services" ? "text-white" : "text-slate-400")} />
            Services
          </button>

          <div className="mt-6 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Navigation
          </div>
          <button
            onClick={() => { if (hasSaved) { localStorage.setItem("currentView", "dashboard"); window.history.replaceState(null, "", "/routine/Dashboard"); window.location.reload(); } else { onBack(); } }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-[14px] w-full text-left transition-all"
          >
            <ArrowLeft size={19} className="shrink-0" />
            Back to Homepage
          </button>
        </div>

        {/* Profile mini card at bottom */}
        <div className="px-4 py-4 border-t border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/10">
            <img
              src={formData.photoBase64 || defaultProfileImg}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-slate-300 text-[13px] font-semibold truncate">{formData.fullName || "User"}</p>
            <p className="text-slate-500 text-[11px] truncate">{formData.email}</p>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Top navbar bar — same as admin panel */}
        <header className="px-4 sm:px-6 py-3 sm:py-4 xl:px-8 mt-2 sm:mt-4 z-30 relative shrink-0">
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 px-4 py-2 h-[62px]">
            {/* Left: mobile toggle + search */}
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="xl:hidden p-2 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <AlignLeft size={22} />
              </button>
              <div className="relative flex items-center gap-2 text-slate-400 focus-within:text-slate-700 w-full max-w-sm">
                <Search size={18} className="shrink-0 ml-1" />
                <input
                  type="text"
                  placeholder="Search settings…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-[14px] placeholder:text-slate-400 text-slate-700 dark:text-slate-200 py-1"
                />

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-40 bg-slate-900/5 backdrop-blur-[2px] sm:hidden"
                      onClick={() => setSearchQuery("")}
                    />
                    <div className="fixed left-4 right-4 sm:absolute sm:left-0 sm:right-auto sm:top-full sm:mt-3 sm:w-[420px] top-[85px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-200/60 dark:shadow-slate-900/60 border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="p-2 space-y-1">
                        <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 dark:border-slate-700/50 mb-1">Search Results</p>
                        {searchResults.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleSearchResultClick(item)}
                            className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-all active:scale-[0.98]"
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                              item.type === 'service' ? (item.color || "bg-indigo-50 dark:bg-indigo-900/20") : "bg-slate-100 dark:bg-slate-700"
                            )}>
                              <item.icon size={18} className={item.type === 'service' ? (item.iconColor || "text-indigo-500") : "text-slate-500"} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13.5px] font-bold text-slate-800 dark:text-white truncate leading-tight">{item.label}</p>
                              {item.desc ? (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.desc}</p>
                              ) : (
                                <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-tight mt-0.5">Settings Section</p>
                              )}
                            </div>
                            <ChevronRight size={14} className="text-slate-300 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: icons + profile */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-all"
                title="Toggle theme"
                onClick={() => document.documentElement.classList.toggle("dark")}
              >
                <Moon size={20} />
              </button>
              <div className="relative">
                <button
                  onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileMenuOpen(false); }}
                  className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <Bell size={20} />
                  {systemUpdates.length > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isNotificationsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsNotificationsOpen(false)}
                    />
                    <div className="fixed left-4 right-4 sm:left-auto sm:right-4 top-[85px] sm:w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-200/60 dark:shadow-slate-900/60 border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-slide-in-down flex flex-col max-h-[400px]">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 dark:text-white text-[14px]">Notifications</h3>
                        <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">{systemUpdates.length} New</span>
                      </div>
                      <div className="overflow-y-auto custom-scrollbar flex-1 p-2">
                        {systemUpdates.length > 0 ? (
                          <div className="space-y-1">
                            {systemUpdates.map((update) => (
                              <div key={update.id} className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex gap-3 items-start">
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                  update.type === 'alert' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-500' :
                                    update.type === 'statement' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500' :
                                      'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500'
                                )}>
                                  <Bell size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-[13px] font-bold text-slate-800 dark:text-white leading-tight mb-0.5">{update.title}</p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation(); // prevent dropdown from closing if it has a click handler
                                        markUpdateAsRead(update.id);
                                        // Also filter it out from the current systemUpdates state immediately for snappy UI
                                        setSystemUpdates(prev => prev.filter(u => u.id !== update.id));
                                      }}
                                      className="p-1 -ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md transition-colors shrink-0"
                                      title="Mark as Read"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                  {update.description && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{update.description}</p>
                                  )}
                                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                                    {update.createdAt ? new Date(update.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 text-center flex flex-col items-center">
                            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-2">
                              <CheckCircle2 size={16} className="text-slate-400" />
                            </div>
                            <p className="text-[12px] font-bold text-slate-600 dark:text-slate-400">All caught up!</p>
                            <p className="text-[11px] text-slate-500">No new notifications</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Profile avatar — clickable dropdown */}
              <div className="relative ml-1">
                <button
                  onClick={() => { setIsProfileMenuOpen(!isProfileMenuOpen); setIsNotificationsOpen(false); }}
                  className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <img
                    src={formData.photoBase64 || defaultProfileImg}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </button>

                {isProfileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileMenuOpen(false)}
                    />
                    <div className="fixed left-4 right-4 sm:left-auto sm:right-4 sm:absolute sm:top-full sm:mt-2 top-[85px] sm:w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-200/60 dark:shadow-slate-900/60 border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-slide-in-down">
                      {/* Header */}
                      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-slate-700">
                        <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 border-slate-100 dark:border-slate-700">
                          <img src={formData.photoBase64 || defaultProfileImg} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-white text-[14px] truncate">{formData.fullName || "User"}</p>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">{formData.email}</p>
                        </div>
                      </div>
                      {/* Links */}
                      <div className="p-2 flex flex-col">
                        <button
                          onClick={() => { setActiveNav("profile"); setIsProfileMenuOpen(false); }}
                          className="flex items-center gap-3 px-3 py-2.5 text-[13px] text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors text-left"
                        >
                          <User size={16} />
                          My Profile
                        </button>
                        <button
                          onClick={() => { setActiveNav("preferences"); setIsProfileMenuOpen(false); }}
                          className="flex items-center gap-3 px-3 py-2.5 text-[13px] text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors text-left"
                        >
                          <SettingsIcon size={16} />
                          Settings
                        </button>
                      </div>
                      {/* Navigation & Logout */}
                      <div className="p-2 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-1">
                        <button
                          onClick={() => { if (hasSaved) { localStorage.setItem("currentView", "dashboard"); window.history.replaceState(null, "", "/routine/Dashboard"); window.location.reload(); } else { onBack(); } }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 rounded-xl transition-colors font-semibold"
                        >
                          <Home size={15} />
                          Back to Homepage
                        </button>

                        <button
                          onClick={() => auth.signOut()}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/10 dark:hover:bg-rose-900/20 rounded-xl transition-colors font-semibold"
                        >
                          <LogOut size={15} />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── Scrollable page content ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 xl:px-8 py-2.5 sm:py-3.5">

          {/* Page Title & Header */}
          <div className="mb-4 animate-in fade-in slide-in-from-top-4 duration-700 ease-out">
            {(() => {
              if (activeNav === "attendance" || activeNav === "forms") return null;

              const headerMap = {
                dashboard: {
                  title: "Student",
                  accent: "Dashboard",
                  desc: "Overview of your academic progress, live classes, and study tools",
                  icon: LayoutDashboard,
                  iconBg: "bg-indigo-50 dark:bg-indigo-900/30",
                  iconColor: "text-indigo-500"
                },
                profile: {
                  title: "My",
                  accent: "Profile",
                  desc: "Manage your personal information and contact details",
                  icon: User,
                  iconBg: "bg-blue-50 dark:bg-blue-900/30",
                  iconColor: "text-blue-500"
                },
                academic: {
                  title: "Academic",
                  accent: "Info",
                  desc: "Manage your education and university details",
                  icon: GraduationCap,
                  iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
                  iconColor: "text-emerald-500"
                },
                preferences: {
                  title: "Application",
                  accent: "Preferences",
                  desc: "Personalize your dashboard experience",
                  icon: Database,
                  iconBg: "bg-indigo-50 dark:bg-indigo-900/30",
                  iconColor: "text-indigo-500"
                },
                security: {
                  title: "Security &",
                  accent: "Data",
                  desc: "Manage sensitive account data and permissions",
                  icon: Shield,
                  iconBg: "bg-rose-50 dark:bg-rose-900/30",
                  iconColor: "text-rose-500"
                },
                results: {
                  title: "Check",
                  accent: "Results",
                  desc: "View your semester exam results",
                  icon: ClipboardList,
                  iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
                  iconColor: "text-emerald-500"
                },
                upload: {
                  title: "Upload",
                  accent: "Routine",
                  desc: "Share your class schedule with the community",
                  icon: Upload,
                  iconBg: "bg-blue-50 dark:bg-blue-900/30",
                  iconColor: "text-blue-500"
                },
                exam: {
                  title: "Exam Time",
                  accent: "Routine",
                  desc: "Check your upcoming examination schedule",
                  icon: CalendarDays,
                  iconBg: "bg-amber-50 dark:bg-amber-900/30",
                  iconColor: "text-amber-500"
                },
                holidays: {
                  title: "Holiday",
                  accent: "List",
                  desc: "View upcoming university holiday schedules",
                  icon: CalendarDays,
                  iconBg: "bg-rose-50 dark:bg-rose-900/30",
                  iconColor: "text-rose-500"
                },
                materials: {
                  title: "Study",
                  accent: "Materials",
                  desc: "Access notes, e-books, and resources",
                  icon: BookMarked,
                  iconBg: "bg-violet-50 dark:bg-violet-900/30",
                  iconColor: "text-violet-500"
                },
                papers: {
                  title: "Question",
                  accent: "Papers",
                  desc: "Browse previous year exam papers",
                  icon: FileQuestion,
                  iconBg: "bg-amber-50 dark:bg-amber-900/30",
                  iconColor: "text-amber-500"
                },
                attendance: {
                  title: "Attendance",
                  accent: "Details",
                  desc: "Your comprehensive attendance records",
                  icon: ClipboardCheck,
                  iconBg: "bg-indigo-50 dark:bg-indigo-900/30",
                  iconColor: "text-indigo-500"
                },
                chat: {
                  title: "Chat",
                  accent: "Messages",
                  desc: "Personal and group communication center",
                  icon: MessagesSquare,
                  iconBg: "bg-blue-50 dark:bg-blue-900/30",
                  iconColor: "text-blue-500"
                },
                forms: {
                  title: "College",
                  accent: "Forms",
                  desc: "Download and submit official university forms",
                  icon: FileText,
                  iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
                  iconColor: "text-emerald-500"
                },
                services: {
                  title: "Other",
                  accent: "Services",
                  desc: "Quick access to SumanOnline tools and entertainment",
                  icon: Layers,
                  iconBg: "bg-violet-50 dark:bg-violet-900/30",
                  iconColor: "text-violet-500"
                },
                all: {
                  title: "Account",
                  accent: "Settings",
                  desc: "Manage your academic profile and application preferences",
                  icon: SettingsIcon,
                  iconBg: "bg-slate-100 dark:bg-slate-800",
                  iconColor: "text-slate-500"
                }
              };

              const header = headerMap[activeNav] || headerMap.all;
              const Icon = header.icon;

              return (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-5">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-white/20 dark:border-slate-700/50", header.iconBg)}>
                      <Icon size={28} className={header.iconColor} />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1.5 flex items-baseline gap-2">
                        {header.title} <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{header.accent}</span>
                      </h1>
                      <p className="text-slate-500 dark:text-slate-400 text-[13px] font-medium leading-tight max-w-md">
                        {header.desc}
                      </p>
                    </div>
                  </div>

                  {/* Single Glance Quick Save Button at Top Header */}
                  {["profile", "academic", "preferences", "security", "all"].includes(activeNav) && (
                    <button
                      type="submit"
                      form="settings-form"
                      disabled={loading || isUploadingPhoto}
                      className="hidden sm:flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-50 shrink-0"
                    >
                      {loading ? <Loader inline size="sm" /> : <CheckCircle2 size={18} />}
                      <span>Save Changes</span>
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          {activeNav === "dashboard" && (
            <StudentDashboard
              userProfile={formData}
              classes={classes}
              onNavigate={(tab) => {
                if (tab === "routine" || tab === "home" || tab === "dashboard-home") {
                  onBack();
                } else {
                  setActiveNav(tab);
                }
              }}
              onOpenSettings={(tab) => setActiveNav(tab)}
            />
          )}

          <form id="settings-form" onSubmit={handleSaveProfile} className="space-y-5">

            {/* ── Personal Profile ── */}
            {(activeNav === "profile" || activeNav === "all") && (
              <Card delay={100}>
                <CardHeader
                  icon={User}
                  iconBg="bg-blue-50 dark:bg-blue-900/30"
                  iconColor="text-blue-500"
                  title="Personal Profile"
                  subtitle="Your identity and contact details"
                />
                <div className="p-6 space-y-6">
                  {/* Avatar picker - Premium Style with Upload Animation & Effects */}
                  <div className="relative p-5 sm:p-6 bg-slate-50/70 dark:bg-slate-900/60 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm group">
                    <div className="absolute top-0 right-0 p-6 text-blue-500/10 dark:text-blue-400/5 pointer-events-none transform translate-x-3 -translate-y-3 overflow-hidden">
                      <User size={110} />
                    </div>

                    <div className="relative flex flex-col sm:flex-row items-center gap-6">
                      <div className="relative group/avatar shrink-0">
                        {/* Animated glowing border ring when uploading */}
                        <div className={cn(
                          "relative w-24 h-24 rounded-full p-1 transition-all duration-500",
                          isUploadingPhoto
                            ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-spin shadow-lg shadow-indigo-500/30"
                            : uploadSuccess
                              ? "bg-emerald-500 ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/30 scale-105"
                              : "bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 shadow-xl"
                        )}>
                          <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                            <img
                              src={formData.photoBase64 || defaultProfileImg}
                              alt="Profile"
                              className={cn(
                                "w-full h-full object-cover transition-all duration-500",
                                isUploadingPhoto ? "scale-95 opacity-60 blur-[1px]" : "scale-100 hover:scale-105"
                              )}
                            />

                            {/* Uploading Loader Overlay */}
                            {isUploadingPhoto && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 text-white backdrop-blur-[2px] animate-in fade-in duration-200">
                                <RefreshCw size={20} className="animate-spin text-blue-400 mb-1" />
                                <span className="text-[8px] font-black uppercase tracking-wider text-blue-200">Optimizing...</span>
                              </div>
                            )}

                            {/* Upload Success Overlay Badge */}
                            {uploadSuccess && (
                              <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/40 text-white backdrop-blur-[1px] animate-in zoom-in duration-300">
                                <CheckCircle2 size={32} className="text-emerald-400 animate-bounce" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Hover Camera overlay label */}
                        {!isUploadingPhoto && (
                          <label className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/60 text-white opacity-0 group-hover/avatar:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]">
                            <div className="flex flex-col items-center gap-1">
                              <Camera size={20} className="text-blue-300" />
                              <span className="text-[9px] font-black uppercase tracking-wider">Change</span>
                            </div>
                            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                          </label>
                        )}
                      </div>

                      <div className="text-center sm:text-left min-w-0 flex-1">
                        <h4 className="font-bold text-slate-800 dark:text-white text-xl sm:text-2xl tracking-tight truncate">
                          {formData.fullName || "Your Name"}
                        </h4>
                        <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium truncate">{formData.email || "name@university.edu"}</p>
                        </div>

                        {/* Badges & Max 10MB Tooltip */}
                        <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                          <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-900/50 shadow-sm flex items-center gap-1.5">
                            <CheckCircle2 size={12} className="text-blue-500" />
                            Verified Student
                          </span>

                          {/* Max 10MB Tooltip Badge */}
                          <div className="relative group/tooltip inline-block">
                            <span className="px-3 py-1 bg-indigo-50/80 dark:bg-indigo-950/50 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1.5 cursor-pointer shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all hover:scale-105">
                              <Info size={12} className="text-indigo-500 shrink-0" />
                              <span>Max 10MB</span>
                            </span>

                            {/* Slick Floating Tooltip (Popping Downward) */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-72 p-3.5 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white text-[11px] font-medium rounded-2xl shadow-2xl border border-slate-700/80 opacity-0 group-hover/tooltip:opacity-100 group-hover/tooltip:translate-y-0 -translate-y-1 transition-all duration-200 pointer-events-none z-50 text-center leading-relaxed">
                              <p className="font-bold text-indigo-400 mb-1 flex items-center justify-center gap-1.5 text-[12px]">
                                <Sparkles size={14} className="text-indigo-400 animate-pulse" /> Smart AI Compression
                              </p>
                              <p className="text-slate-300">
                                Upload photos up to <strong className="text-white">10MB</strong>. Our system automatically resizes and compresses them to <strong className="text-indigo-300">under 1MB</strong> for instant loading!
                              </p>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-6 border-transparent border-b-slate-900/95 dark:border-b-slate-800/95"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Full Name" icon={User}>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleFieldChange} className={inputCls()} placeholder="Enter your full name" required />
                    </Field>

                    <Field label="Email Address" icon={Mail}>
                      <div className="relative">
                        <input type="email" name="email" value={formData.email} readOnly={true} className={cn(inputCls(true), "bg-slate-100/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed select-none pr-9")} placeholder="name@university.edu" />
                        <Lock size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </Field>

                    <Field label="Phone Number">
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 flex items-center gap-1.5 pointer-events-none select-none text-slate-700 dark:text-slate-200 font-semibold text-[13px]">
                          <span className="text-base leading-none">🇮🇳</span>
                          <span>+91</span>
                          <span className="text-slate-300 dark:text-slate-600 font-normal">|</span>
                        </div>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={(formData.phoneNumber || "").replace(/^\+91\s?/, "")}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setFormData((prev) => ({ ...prev, phoneNumber: digits ? `+91 ${digits}` : "" }));
                          }}
                          className={cn(inputCls(false), "pl-20")}
                          placeholder="98765 43210"
                        />
                      </div>
                    </Field>

                    <Field label="Roll Number" icon={Hash}>
                      <div className="relative">
                        <input type="text" value={formData.rollNumber || "Not Set"} readOnly={true} className={cn(inputCls(true), "bg-slate-100/80 dark:bg-slate-800/50 text-indigo-700 dark:text-indigo-300 font-extrabold cursor-not-allowed select-none pr-9")} placeholder="e.g. 006-BCA-2023-406" />
                        <Lock size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </Field>
                  </div>
                </div>
              </Card>
            )}

            {/* ── Academic Profile ── */}
            {(activeNav === "academic" || activeNav === "all") && (
              <Card>
                <CardHeader
                  icon={GraduationCap}
                  iconBg="bg-emerald-50 dark:bg-emerald-900/30"
                  iconColor="text-emerald-500"
                  title="Academic Profile"
                  subtitle="Your university and course details"
                />
                <div className="p-6">
                  {(() => {
                    const uniList = (academicConfig.universities || ["SVU", "Regent", "Others"]);
                    const uniOpts = uniList.map((u) => ({ value: u, label: u }));
                    if (!uniOpts.some((o) => o.value === "Others")) {
                      uniOpts.push({ value: "Others", label: "Others (Custom)" });
                    }

                    const streamList = (academicConfig.streams || []);
                    const streamOpts = streamList.map((st) => ({ value: st.name, label: st.name }));
                    if (!streamOpts.some((o) => o.value === "Other")) {
                      streamOpts.push({ value: "Other", label: "Other" });
                    }

                    const selectedStreamObj = streamList.find((s) => s.name === formData.stream);
                    const semCount = selectedStreamObj ? (selectedStreamObj.semestersCount || 8) : 8;
                    const semOpts = Array.from({ length: semCount }, (_, i) => ({
                      value: (i + 1).toString(),
                      label: `Sem ${i + 1}`,
                    }));

                    const secCount = selectedStreamObj?.sectionsPerSemester?.[formData.semester] || 4;
                    const secOpts = Array.from({ length: Number(secCount || 4) }, (_, i) => ({
                      value: (i + 1).toString(),
                      label: `Sec ${i + 1}`,
                    }));

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="University / College" icon={BookOpen}>
                          <CustomSelect
                            name="university"
                            value={formData.university}
                            onChange={handleFieldChange}
                            icon={BookOpen}
                            options={uniOpts}
                          />
                        </Field>

                        {formData.university === "Others" && (
                          <Field label="Custom Institution">
                            <input type="text" name="customUniversity" value={formData.customUniversity} onChange={handleFieldChange} className={inputCls(false)} placeholder="Enter college name" required />
                          </Field>
                        )}

                        <Field label="Stream / Course" icon={GraduationCap}>
                          <CustomSelect
                            name="stream"
                            value={formData.stream}
                            onChange={handleFieldChange}
                            icon={GraduationCap}
                            options={streamOpts}
                          />
                        </Field>

                        {formData.stream === "Other" && (
                          <Field label="Custom Stream">
                            <input type="text" name="customStream" value={formData.customStream} onChange={handleFieldChange} className={inputCls(false)} placeholder="Enter course name" required />
                          </Field>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Semester" icon={CalendarDays}>
                            <CustomSelect
                              name="semester"
                              value={formData.semester}
                              onChange={handleFieldChange}
                              icon={CalendarDays}
                              openUp={true}
                              options={semOpts}
                            />
                          </Field>
                          <Field label="Section" icon={Users}>
                            <CustomSelect
                              name="section"
                              value={formData.section}
                              onChange={handleFieldChange}
                              icon={Users}
                              openUp={true}
                              options={secOpts}
                            />
                          </Field>
                        </div>

                        <div className="grid grid-cols-12 gap-2.5 sm:gap-3">
                          <div className="col-span-5 sm:col-span-5">
                            <Field label="Admission Year" icon={CalendarDays}>
                              <CustomSelect
                                name="admissionYear"
                                value={formData.admissionYear || new Date().getFullYear().toString()}
                                onChange={handleFieldChange}
                                openUp={true}
                                className="!px-3 !pr-7 !text-xs font-bold"
                                options={Array.from({ length: 12 }, (_, i) => {
                                  const yr = (new Date().getFullYear() - i + 1).toString();
                                  return { value: yr, label: yr };
                                })}
                              />
                            </Field>
                          </div>

                          <div className="col-span-7 sm:col-span-7 space-y-1.5">
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-1">Roll Number</label>
                            {ROLL_FORMAT[formData.stream] ? (
                              <div className="flex items-stretch rounded-xl border border-slate-200 dark:border-slate-700 bg-[#f5f5f9] dark:bg-slate-900 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-400 transition-all shadow-sm">
                                <div className="shrink-0 flex items-center gap-1 px-2 sm:px-2.5 py-2.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border-r border-slate-200 dark:border-slate-700 select-none">
                                  <Hash size={11} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                                  <span className="text-[10px] xs:text-[11px] sm:text-xs font-black text-indigo-700 dark:text-indigo-300 tracking-wider whitespace-nowrap">
                                    {ROLL_FORMAT[formData.stream].prefix}-{ROLL_FORMAT[formData.stream].code}-{formData.admissionYear || new Date().getFullYear()}-
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  name="rollNumericInput"
                                  value={rollNumericPart}
                                  onChange={handleFieldChange}
                                  className="flex-1 min-w-0 bg-transparent py-2.5 px-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none"
                                  placeholder="406"
                                  maxLength={6}
                                />
                              </div>
                            ) : (
                              <div className="relative">
                                <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                  type="text"
                                  name="rollNumericInput"
                                  value={rollNumericPart}
                                  onChange={handleFieldChange}
                                  className={inputCls(true)}
                                  placeholder="Roll No."
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </Card>
            )}

            {/* ── Attendance View ── */}
            {activeNav === "attendance" && (
              <div className="pt-2 -mx-4 sm:-mx-6 xl:-mx-8">
                <Attendance onBack={() => setActiveNav("profile")} showBack={false} hideSpacing={true} classes={classes} />
              </div>
            )}

            {/* ── Community Chat ── */}
            {activeNav === "chat" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader
                    icon={MessagesSquare}
                    iconBg="bg-blue-50 dark:bg-blue-900/30"
                    iconColor="text-blue-500"
                    title="Communication Hub"
                    subtitle="Connect with your peers and the StudentHub team"
                  />
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* WhatsApp Group */}
                      <div className="bg-[#25D366]/5 dark:bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl p-5 group hover:shadow-lg transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#25D366] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#25D366]/20">
                              <Smartphone size={24} />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 dark:text-white">Official WhatsApp</h4>
                              <p className="text-[11px] text-[#25D366] font-black uppercase tracking-widest mt-0.5">Community Group</p>
                            </div>
                          </div>
                          <button
                            onClick={() => window.open("https://whatsapp.com/channel/0029VbAQjkP9WtC2Fa6Ggg2H", "_blank")}
                            className="p-2 bg-white dark:bg-slate-800 text-slate-400 hover:text-[#25D366] rounded-xl border border-slate-100 dark:border-slate-700 transition-all active:scale-90"
                          >
                            <ExternalLink size={18} />
                          </button>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
                          Join the official StudentHub community for instant updates and peer discussions.
                        </p>
                      </div>

                      {/* Telegram Channel */}
                      <div className="bg-[#0088cc]/5 dark:bg-[#0088cc]/10 border border-[#0088cc]/20 rounded-2xl p-5 group hover:shadow-lg transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#0088cc] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#0088cc]/20">
                              <Send size={24} />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 dark:text-white">Telegram Channel</h4>
                              <p className="text-[11px] text-[#0088cc] font-black uppercase tracking-widest mt-0.5">Global Updates</p>
                            </div>
                          </div>
                          <button
                            onClick={() => window.open("https://t.me/SumanOnline_Com", "_blank")}
                            className="p-2 bg-white dark:bg-slate-800 text-slate-400 hover:text-[#0088cc] rounded-xl border border-slate-100 dark:border-slate-700 transition-all active:scale-90"
                          >
                            <ExternalLink size={18} />
                          </button>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
                          The most secure way to stay informed about university routines and semester results.
                        </p>
                      </div>
                    </div>

                    {/* Support Feature */}
                    <div className="mt-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700 text-center relative overflow-hidden group">
                      <div className="relative z-10">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/5 border border-slate-100 dark:border-slate-700">
                          <MessageCircle size={32} className="text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Need Direct Assistance?</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mb-6"> Our support team is available mon-fri (10 AM - 6 PM) to resolve your technical issues.</p>
                        <button
                          onClick={() => setActiveNav("support")}
                          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[12px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                        >
                          Open Support Portal
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Upcoming Preview / Alpha */}
                <div className="relative group rounded-3xl overflow-hidden mt-8 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 group-hover:h-2 transition-all duration-300" />

                  {/* Background pattern */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />

                  <div className="relative p-6 sm:p-8 flex flex-col items-center md:items-start md:flex-row gap-6 sm:gap-8 z-10">
                    {/* Icon Container */}
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center border-4 border-white dark:border-slate-700 shadow-xl group-hover:scale-105 transition-transform duration-500">
                        <Users size={40} className="text-indigo-600 dark:text-indigo-400 sm:w-12 sm:h-12" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-center md:text-left flex flex-col justify-center">
                      <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2.5 mb-3">
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight break-words">
                          Native Messaging <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">(Alpha)</span>
                        </h3>
                        <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm whitespace-nowrap">
                          Coming Soon
                        </span>
                      </div>

                      <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-[15px] leading-relaxed max-w-xl mx-auto md:mx-0 mb-6 font-medium">
                        We are building a private, secure real-time chat architecture integrated directly into StudentHub. Soon you'll be able to message batch-mates without ever sharing your phone number.
                      </p>

                      {/* Feature Tags */}
                      <div className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 text-xs sm:text-[12px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <CheckCircle2 size={16} className="text-emerald-500" /> Privacy First
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-[12px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <CheckCircle2 size={16} className="text-emerald-500" /> Real-time Sync
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-[12px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <CheckCircle2 size={16} className="text-emerald-500" /> E2E Encryption
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── App Preferences ── */}
            {(activeNav === "preferences" || activeNav === "all") && (
              <Card>
                <CardHeader
                  icon={Database}
                  iconBg="bg-indigo-50 dark:bg-indigo-900/30"
                  iconColor="text-indigo-500"
                  title="App Preferences"
                  subtitle="Customize how the app fetches data"
                />
                <div className="p-6">
                  <div className="flex items-center justify-between p-4 bg-[#f5f5f9] dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white text-[13px] uppercase tracking-wider">Fetch Routine Online</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 max-w-xs">Fetch schedule data from community-uploaded routines.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, fetchShared: !prev.fetchShared }))}
                      className={cn(
                        "relative inline-flex h-6 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none",
                        formData.fetchShared ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600",
                      )}
                      style={{ width: "44px" }}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out",
                          formData.fetchShared ? "translate-x-[20px]" : "translate-x-0",
                        )}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 mt-3 bg-[#f5f5f9] dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white text-[13px] uppercase tracking-wider">App Theme Default</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 max-w-xs">Always start the app in your preferred visual style.</p>
                    </div>
                    <select
                      name="themePreference"
                      value={formData.themePreference}
                      onChange={(e) => {
                        handleFieldChange(e);
                        const val = e.target.value;
                        const isDark = val === "dark" || (val === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
                        if (isDark) document.documentElement.classList.add("dark");
                        else document.documentElement.classList.remove("dark");
                      }}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium py-1.5 px-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer min-w-[100px] text-center"
                    >
                      <option value="system">System</option>
                      <option value="light">Light mode</option>
                      <option value="dark">Dark mode</option>
                    </select>
                  </div>
                </div>
              </Card>
            )}

            {/* ── Check Results ── */}
            {(activeNav === "results" || activeNav === "all") && (
              <Card>
                <CardHeader
                  icon={ClipboardList}
                  iconBg="bg-emerald-50 dark:bg-emerald-900/30"
                  iconColor="text-emerald-500"
                  title="Check Results"
                  subtitle="View and download your semester results"
                />
                <div className="w-full relative min-h-[75vh] md:min-h-[85vh] rounded-b-[2rem] overflow-hidden bg-slate-50 dark:bg-slate-900/50">
                  <iframe
                    src={formData.rollNumber
                      ? `https://sumanonline.com/studentHub/result/index.php?roll=${encodeURIComponent(formData.rollNumber)}`
                      : "https://sumanonline.com/studentHub/result/"
                    }
                    title="StudentHub Results Portal"
                    className="absolute top-0 left-0 w-full h-full border-0"
                    allowFullScreen
                  />
                </div>
              </Card>
            )}

            {/* ── College Forms View ── */}
            {activeNav === "forms" && (
              <div className="-mt-8 -mx-4 sm:-mx-6 xl:-mx-8">
                <CollegeForms onBack={() => setActiveNav("profile")} showBack={false} hideSpacing={true} />
              </div>
            )}

            {/* ── Upload Routine ── */}
            {(activeNav === "upload" || activeNav === "all") && (
              <Card>
                <CardHeader
                  icon={Upload}
                  iconBg="bg-blue-50 dark:bg-blue-900/30"
                  iconColor="text-blue-500"
                  title="Upload Routine"
                  subtitle="Contribute to the StudentHub community"
                />
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload size={32} className="text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Routine Sync Terminal</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mb-6">You can upload your class routine directly from the Dashboard using the "Sync" button in the top bar.</p>
                  <button type="button" onClick={onSync} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all">Start Routine Sync</button>
                </div>
              </Card>
            )}

            {/* ── Exam Time Routine ── */}
            {(activeNav === "exam" || activeNav === "all") && (
              <Card>
                <CardHeader
                  icon={CalendarDays}
                  iconBg="bg-amber-50 dark:bg-amber-900/30"
                  iconColor="text-amber-500"
                  title="Exam Time Routine"
                  subtitle="Upcoming examination schedule"
                >
                  <button
                    type="button"
                    onClick={() => { setFetching(true); setTimeout(() => setFetching(false), 100); }}
                    className="p-2 text-slate-400 hover:text-amber-500 transition-colors"
                    title="Refresh Schedule"
                  >
                    <RefreshCw size={16} className={cn(loadingExams && "animate-spin")} />
                  </button>
                </CardHeader>
                <div className="p-5 sm:p-7 space-y-4">
                  {loadingExams ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader inline size="md" message="Securing your schedule..." />
                    </div>
                  ) : processedExams.length > 0 ? (
                    <div className="grid gap-4">
                      {processedExams.map((exam, idx) => (
                        <div
                          key={exam.id}
                          className={cn(
                            "group relative bg-white dark:bg-slate-900/40 border rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-[#404af9]/5 hover:-translate-y-0.5 overflow-hidden flex flex-col sm:flex-row",
                            exam.status === 'today'
                              ? "border-l-4 border-l-[#404af9] border-blue-100 dark:border-blue-900/30 ring-1 ring-[#404af9]/10"
                              : exam.status === 'passed'
                                ? "border-l-4 border-l-slate-300 dark:border-l-slate-700 border-slate-100 dark:border-slate-800 opacity-60 grayscale-[0.4]"
                                : "border-l-4 border-l-indigo-400 dark:border-l-indigo-600 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50"
                          )}
                        >
                          {/* Accent Background for Today */}
                          {exam.status === 'today' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#404af9]/5 to-transparent pointer-events-none" />
                          )}

                          {/* Status Badge - Floating */}
                          {exam.status === 'today' && (
                            <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#404af9] text-white text-[9px] sm:text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg shadow-[#404af9]/30 animate-pulse">
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                Today
                              </span>
                            </div>
                          )}

                          {/* Left Side: Day Indicator */}
                          <div className={cn(
                            "flex items-center justify-start sm:justify-center sm:flex-col gap-3 p-4 sm:w-20 shrink-0 border-b sm:border-b-0 sm:border-r transition-all",
                            exam.status === 'today'
                              ? "bg-[#404af9]/5 border-blue-100 dark:border-blue-900/20"
                              : "bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/50"
                          )}>
                            <span className={cn(
                              "text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em]",
                              exam.status === 'today' ? "text-[#404af9]" : "text-slate-400"
                            )}>Day</span>
                            <span className={cn(
                              "text-2xl sm:text-3xl font-black leading-none",
                              exam.status === 'today' ? "text-[#404af9]" : "text-slate-700 dark:text-slate-300"
                            )}>{exam.dayNumber}</span>
                          </div>

                          {/* Content Section */}
                          <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={cn(
                                  "px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md border",
                                  exam.status === 'today'
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-[#404af9] border-[#404af9]/20"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                                )}>
                                  {exam.examType || 'EXAM'}
                                </span>
                                {exam.status === 'passed' && (
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <CheckCircle2 size={10} /> Completed
                                  </span>
                                )}
                              </div>
                              <h4 className={cn(
                                "text-lg sm:text-xl font-black tracking-tight leading-tight",
                                exam.status === 'today' ? "text-slate-900 dark:text-white" : "text-slate-800 dark:text-slate-200"
                              )}>
                                {exam.subject}
                              </h4>
                            </div>

                            <div className="flex flex-wrap items-center gap-y-2 gap-x-5">
                              <div className="flex items-center gap-2 text-[11px] sm:text-[12px] font-bold text-slate-500 dark:text-slate-400">
                                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                  <CalendarDays size={14} />
                                </div>
                                <span className="hidden sm:inline">{exam.date}</span>
                                <span className="sm:hidden">{exam.date}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] sm:text-[12px] font-bold text-slate-500 dark:text-slate-400">
                                <div className={cn(
                                  "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                                  exam.status === 'today' ? "bg-blue-100 dark:bg-[#404af9]/20 text-[#404af9]" : "bg-slate-100 dark:bg-slate-800"
                                )}>
                                  <Activity size={14} />
                                </div>
                                {exam.time}
                              </div>
                            </div>
                          </div>

                          {/* Right Action/Indicator (Desktop only) */}
                          <div className="hidden sm:flex items-center px-6">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center border transition-all",
                              exam.status === 'today'
                                ? "bg-[#404af9] text-white border-[#404af9] shadow-lg shadow-[#404af9]/20"
                                : "bg-white dark:bg-slate-800 text-slate-300 border-slate-100 dark:border-slate-700 group-hover:border-indigo-200 group-hover:text-indigo-400"
                            )}>
                              <ChevronRight size={20} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                      <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CalendarDays size={40} className="text-indigo-500" />
                      </div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Schedule Awaiting Release</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">No examination dates have been logged for this semester yet.</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* ── Holiday List ── */}
            {(activeNav === "holidays" || activeNav === "all") && (
              <Card>
                <CardHeader
                  icon={CalendarDays}
                  iconBg="bg-rose-50 dark:bg-rose-900/30"
                  iconColor="text-rose-500"
                  title="Holiday List 2024-25"
                  subtitle="Official university holiday calendar"
                />
                <div className="p-6">
                  {loadingHolidays ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Loader inline size="md" message="Syncing calendar..." />
                    </div>
                  ) : holidays.length > 0 ? (
                    (() => {
                      const todayStart = new Date();
                      todayStart.setHours(0, 0, 0, 0);
                      const upcomingHolidays = holidays.filter(h => new Date(h.date).setHours(0, 0, 0, 0) >= todayStart.getTime());
                      const passedHolidays = holidays.filter(h => new Date(h.date).setHours(0, 0, 0, 0) < todayStart.getTime());
                      const renderHoliday = (h, isPast) => {
                        const dateObj = new Date(h.date);
                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                        const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
                        const dateNum = dateObj.getDate();
                        const isToday = dateObj.setHours(0, 0, 0, 0) === todayStart.getTime();
                        return (
                          <div key={h.id} className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl border transition-all relative overflow-hidden group",
                            isPast
                              ? "bg-slate-50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/50 opacity-70 cursor-default"
                              : isToday
                                ? "bg-gradient-to-r from-rose-50/80 to-orange-50/80 dark:from-rose-900/10 dark:to-orange-900/10 border-rose-200/60 dark:border-rose-800/50 shadow-sm hover:shadow-md transition-all"
                                : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:shadow-md transition-all"
                          )}>
                            {isToday && (
                              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden z-0">
                                <div className="absolute top-[10px] right-[-30px] w-[100px] bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[9px] font-bold py-1 text-center rotate-45 shadow-sm shadow-rose-500/30 tracking-widest uppercase">
                                  TODAY
                                </div>
                              </div>
                            )}
                            <div className={cn(
                              "w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border relative z-10 transition-transform group-hover:scale-105",
                              isPast
                                ? "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500"
                                : isToday
                                  ? "bg-gradient-to-br from-rose-500 to-orange-500 border-none text-white shadow-inner shadow-white/20"
                                  : "bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/30 text-rose-600 dark:text-rose-400"
                            )}>
                              <span className={cn("text-[10px] font-bold uppercase tracking-widest", isToday ? "opacity-90" : "")}>{monthName}</span>
                              <span className="text-lg font-black leading-none mt-0.5">{dateNum}</span>
                            </div>
                            <div className="min-w-0 flex-1 relative z-10 pr-6">
                              <h4 className={cn(
                                "font-bold text-[15px] line-clamp-2 break-words leading-tight mb-1",
                                isPast ? "text-slate-500 dark:text-slate-400" : isToday ? "text-rose-900 dark:text-rose-100" : "text-slate-800 dark:text-slate-200"
                              )}>{h.occasion}</h4>
                              <p className={cn(
                                "text-[12px] font-medium",
                                isPast ? "text-slate-400 dark:text-slate-500" : isToday ? "text-rose-600/80 dark:text-rose-300/80" : "text-slate-500 dark:text-slate-400"
                              )}>{dayName}, {dateObj.getFullYear()}</p>
                            </div>
                          </div>
                        );
                      };
                      return (
                        <div className="space-y-6">
                          {upcomingHolidays.length > 0 ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 px-1 mb-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Upcoming Holidays</h3>
                              </div>
                              {upcomingHolidays.map(h => renderHoliday(h, false))}
                            </div>
                          ) : (
                            <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No upcoming holidays scheduled.</p>
                            </div>
                          )}
                          {passedHolidays.length > 0 && (
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => setShowPassedHolidays(!showPassedHolidays)}
                                className="flex items-center gap-3 w-full py-2 px-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors group"
                              >
                                <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">Passed ({passedHolidays.length})</span>
                                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700/50 group-hover:bg-slate-300 dark:group-hover:bg-slate-600 transition-colors" />
                                {showPassedHolidays ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                              {showPassedHolidays && (
                                <div className="space-y-3 mt-4 animate-in slide-in-from-top-2 duration-300 opacity-80">
                                  {passedHolidays.map(h => renderHoliday(h, true))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CalendarDays size={32} className="text-rose-500" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No Holidays Announced</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">The administration hasn't uploaded the holiday list yet.</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* ── Study Materials View ── */}
            {
              (activeNav === "materials" || activeNav === "all") && (
                <Card>
                  <CardHeader
                    icon={BookMarked}
                    iconBg="bg-violet-50 dark:bg-violet-900/30"
                    iconColor="text-violet-500"
                    title="Study Materials"
                    subtitle="Collection of notes and academic resources"
                  />
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      {routineSubjects.length > 0 ? (
                        <>
                          {/* Column 1 */}
                          <div className="flex-1 flex flex-col gap-4 w-full">
                            {routineSubjects.filter((_, idx) => idx % 2 === 0).map((subject, idx) => {
                              const baseKey = `${formData.university}_${formData.stream}_${formData.semester}_${subject}`;
                              const bookLink = smLinks[`${baseKey}_book`];
                              const notesLink = smLinks[`${baseKey}_notes`];

                              const resources = [];
                              if (bookLink) resources.push({ title: `${subject} Reference Book`, type: "Book", url: bookLink, date: "Ready" });
                              if (notesLink) resources.push({ title: `${subject} Lecture Notes`, type: "Notes", url: notesLink, date: "Ready" });

                              const isExpanded = expandedMaterials.includes(subject);

                              return (
                                <div key={idx} className="group p-0 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl hover:border-violet-200 dark:hover:border-violet-900/50 transition-all hover:shadow-lg hover:shadow-violet-500/5">
                                  {/* Header Button */}
                                  <button
                                    type="button"
                                    onClick={() => toggleMaterial(subject)}
                                    className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 transition-transform group-hover:scale-110">
                                        <BookOpen size={20} />
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm tracking-tight">{subject}</h4>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight mt-0.5">{resources.length} Academic Files Available</p>
                                      </div>
                                    </div>
                                    <div className={cn("transition-transform duration-300", isExpanded ? "rotate-180" : "rotate-0")}>
                                      <ChevronDown size={20} className="text-slate-400 group-hover:text-violet-500" />
                                    </div>
                                  </button>

                                  {/* Collapsible Content */}
                                  <div className={cn(
                                    "overflow-hidden transition-all duration-300 ease-in-out px-5 pb-5",
                                    isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                                  )}>
                                    <div className="space-y-2 pt-1 border-t border-slate-50 dark:border-slate-700/50 mt-1">
                                      {resources.length > 0 ? resources.map((res, rIdx) => (
                                        <button
                                          key={rIdx}
                                          type="button"
                                          onClick={() => res.url && window.open(res.url, "_blank")}
                                          className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-violet-50 dark:hover:bg-violet-950/30 font-medium text-[12px] group/item transition-colors"
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <div className={cn(
                                              "px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0",
                                              res.type === 'Book' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                                            )}>
                                              {res.type}
                                            </div>
                                            <span className="text-slate-700 dark:text-slate-300 truncate">{res.title}</span>
                                          </div>
                                          <div className="flex items-center gap-3 shrink-0 ml-2">
                                            <span className="text-slate-400 text-[10px] font-medium">{res.date}</span>
                                            <ExternalLink size={14} className="text-slate-300 group-hover/item:text-violet-500" />
                                          </div>
                                        </button>
                                      )) : (
                                        <p className="text-[11px] text-slate-400 text-center py-2 italic">Awaiting materials...</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Column 2 */}
                          <div className="flex-1 flex flex-col gap-4 w-full">
                            {routineSubjects.filter((_, idx) => idx % 2 !== 0).map((subject, idx) => {
                              const baseKey = `${formData.university}_${formData.stream}_${formData.semester}_${subject}`;
                              const bookLink = smLinks[`${baseKey}_book`];
                              const notesLink = smLinks[`${baseKey}_notes`];

                              const resources = [];
                              if (bookLink) resources.push({ title: `${subject} Reference Book`, type: "Book", url: bookLink, date: "Ready" });
                              if (notesLink) resources.push({ title: `${subject} Lecture Notes`, type: "Notes", url: notesLink, date: "Ready" });

                              const isExpanded = expandedMaterials.includes(subject);

                              return (
                                <div key={idx} className="group p-0 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl hover:border-violet-200 dark:hover:border-violet-900/50 transition-all hover:shadow-lg hover:shadow-violet-500/5">
                                  {/* Header Button */}
                                  <button
                                    type="button"
                                    onClick={() => toggleMaterial(subject)}
                                    className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 transition-transform group-hover:scale-110">
                                        <BookOpen size={20} />
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm tracking-tight">{subject}</h4>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight mt-0.5">{resources.length} Academic Files Available</p>
                                      </div>
                                    </div>
                                    <div className={cn("transition-transform duration-300", isExpanded ? "rotate-180" : "rotate-0")}>
                                      <ChevronDown size={20} className="text-slate-400 group-hover:text-violet-500" />
                                    </div>
                                  </button>

                                  {/* Collapsible Content */}
                                  <div className={cn(
                                    "overflow-hidden transition-all duration-300 ease-in-out px-5 pb-5",
                                    isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                                  )}>
                                    <div className="space-y-2 pt-1 border-t border-slate-50 dark:border-slate-700/50 mt-1">
                                      {resources.length > 0 ? resources.map((res, rIdx) => (
                                        <button
                                          key={rIdx}
                                          type="button"
                                          onClick={() => res.url && window.open(res.url, "_blank")}
                                          className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-violet-50 dark:hover:bg-violet-950/30 font-medium text-[12px] group/item transition-colors"
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <div className={cn(
                                              "px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0",
                                              res.type === 'Book' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                                            )}>
                                              {res.type}
                                            </div>
                                            <span className="text-slate-700 dark:text-slate-300 truncate">{res.title}</span>
                                          </div>
                                          <div className="flex items-center gap-3 shrink-0 ml-2">
                                            <span className="text-slate-400 text-[10px] font-medium">{res.date}</span>
                                            <ExternalLink size={14} className="text-slate-300 group-hover/item:text-violet-500" />
                                          </div>
                                        </button>
                                      )) : (
                                        <p className="text-[11px] text-slate-400 text-center py-2 italic">Awaiting materials...</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="w-full p-12 text-center text-slate-400">
                          No subjects found in your routine.
                        </div>
                      )}
                    </div>

                    <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                      <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 italic">Knowledge base expanding</p>
                      <p className="text-[11px] text-slate-400">Our librarians are indexing more semester materials daily.</p>
                    </div>
                  </div>
                </Card>
              )
            }

            {/* ── Question Papers View ── */}
            {
              (activeNav === "papers" || activeNav === "all") && (
                <Card>
                  <CardHeader
                    icon={FileQuestion}
                    iconBg="bg-amber-50 dark:bg-amber-900/30"
                    iconColor="text-amber-500"
                    title="Previous Year Papers"
                    subtitle="Exam preparation resource bank"
                  />
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      {routineSubjects.length > 0 ? (
                        <>
                          {/* Column 1 */}
                          <div className="flex-1 flex flex-col gap-4 w-full">
                            {routineSubjects.filter((_, idx) => idx % 2 === 0).map((subject, idx) => {
                              const key = `${formData.university}_${formData.stream}_${formData.semester}_${subject}`;
                              const paperLink = qpLinks[key];
                              const papers = paperLink ? [{ year: "PYQ", type: "Question Paper", url: paperLink, size: "Ready" }] : [];

                              const isExpanded = expandedPapers.includes(subject);

                              return (
                                <div key={idx} className="group p-0 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl hover:border-amber-200 dark:hover:border-amber-900/50 transition-all hover:shadow-lg hover:shadow-amber-500/5">
                                  {/* Header Button */}
                                  <button
                                    type="button"
                                    onClick={() => togglePaper(subject)}
                                    className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110">
                                        <FileQuestion size={20} />
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm tracking-tight">{subject}</h4>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight mt-0.5">{papers.length} Past Papers Available</p>
                                      </div>
                                    </div>
                                    <div className={cn("transition-transform duration-300", isExpanded ? "rotate-180" : "rotate-0")}>
                                      <ChevronDown size={20} className="text-slate-400 group-hover:text-amber-500" />
                                    </div>
                                  </button>

                                  {/* Collapsible Content */}
                                  <div className={cn(
                                    "overflow-hidden transition-all duration-300 ease-in-out px-5 pb-5",
                                    isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                                  )}>
                                    <div className="space-y-2 pt-1 border-t border-slate-50 dark:border-slate-700/50 mt-1">
                                      {papers.length > 0 ? papers.map((paper, pIdx) => (
                                        <button
                                          key={pIdx}
                                          type="button"
                                          onClick={() => paper.url && window.open(paper.url, "_blank")}
                                          className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-medium text-[12px] group/item transition-colors"
                                        >
                                          <div className="flex items-center gap-2">
                                            <FileText size={14} className="text-slate-400 group-hover/item:text-amber-500" />
                                            <span className="text-slate-700 dark:text-slate-300">Previous Year Paper</span>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{paper.size}</span>
                                            <ExternalLink size={14} className="text-slate-300 group-hover/item:text-amber-500" />
                                          </div>
                                        </button>
                                      )) : (
                                        <p className="text-[11px] text-slate-400 text-center py-2 italic">Awaiting upload...</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Column 2 */}
                          <div className="flex-1 flex flex-col gap-4 w-full">
                            {routineSubjects.filter((_, idx) => idx % 2 !== 0).map((subject, idx) => {
                              const key = `${formData.university}_${formData.stream}_${formData.semester}_${subject}`;
                              const paperLink = qpLinks[key];
                              const papers = paperLink ? [{ year: "PYQ", type: "Question Paper", url: paperLink, size: "Ready" }] : [];

                              const isExpanded = expandedPapers.includes(subject);

                              return (
                                <div key={idx} className="group p-0 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl hover:border-amber-200 dark:hover:border-amber-900/50 transition-all hover:shadow-lg hover:shadow-amber-500/5">
                                  {/* Header Button */}
                                  <button
                                    type="button"
                                    onClick={() => togglePaper(subject)}
                                    className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110">
                                        <FileQuestion size={20} />
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm tracking-tight">{subject}</h4>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight mt-0.5">{papers.length} Past Papers Available</p>
                                      </div>
                                    </div>
                                    <div className={cn("transition-transform duration-300", isExpanded ? "rotate-180" : "rotate-0")}>
                                      <ChevronDown size={20} className="text-slate-400 group-hover:text-amber-500" />
                                    </div>
                                  </button>

                                  {/* Collapsible Content */}
                                  <div className={cn(
                                    "overflow-hidden transition-all duration-300 ease-in-out px-5 pb-5",
                                    isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                                  )}>
                                    <div className="space-y-2 pt-1 border-t border-slate-50 dark:border-slate-700/50 mt-1">
                                      {papers.length > 0 ? papers.map((paper, pIdx) => (
                                        <button
                                          key={pIdx}
                                          type="button"
                                          onClick={() => paper.url && window.open(paper.url, "_blank")}
                                          className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-medium text-[12px] group/item transition-colors"
                                        >
                                          <div className="flex items-center gap-2">
                                            <FileText size={14} className="text-slate-400 group-hover/item:text-amber-500" />
                                            <span className="text-slate-700 dark:text-slate-300">Previous Year Paper</span>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{paper.size}</span>
                                            <ExternalLink size={14} className="text-slate-300 group-hover/item:text-amber-500" />
                                          </div>
                                        </button>
                                      )) : (
                                        <p className="text-[11px] text-slate-400 text-center py-2 italic">Awaiting upload...</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="w-full p-12 text-center text-slate-400">
                          No subjects found in your routine.
                        </div>
                      )}
                    </div>

                    <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                      <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 italic">More subjects incoming</p>
                      <p className="text-[11px] text-slate-400">Request missing papers on our Support portal</p>
                    </div>
                  </div>
                </Card>
              )
            }




            {["profile", "academic", "preferences", "security", "all"].includes(activeNav) && (
              <div className="sm:hidden pt-4 pb-8 flex justify-center">
                <button
                  type="submit"
                  form="settings-form"
                  disabled={loading || isUploadingPhoto}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader inline size="sm" /> : <CheckCircle2 size={18} />}
                  <span>Save Changes</span>
                </button>
              </div>
            )}
          </form>

          {/* ── Services ── */}
          {
            (activeNav === "services") && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {serviceItems.map(({ id, label, desc, icon: Icon, color, iconColor, href }) => (
                    <button
                      key={id}
                      onClick={() => {
                        if (href) window.open(href, "_blank", "noopener");
                        else if (id === "upload") onBack();
                        else if (id === "results") onBack();
                      }}
                      className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all text-left group active:scale-[0.98]"
                    >
                      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", color)}>
                        <Icon size={22} className={iconColor} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 dark:text-white text-[14px] truncate">{label}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 truncate">{desc}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )
          }

          {/* ── Danger Zone ── */}
          {
            (activeNav === "security" || activeNav === "all") && (
              <div className={cn("space-y-5", activeNav !== "security" && "mt-8")}>
                {activeNav !== "security" && (
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={16} className="text-rose-400" />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Security &amp; Data Control</p>
                  </div>
                )}

                <Card className="border-rose-100 dark:border-rose-900/30">
                  <div className="p-6 flex flex-col sm:flex-row gap-6 items-start">
                    <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                      <AlertTriangle size={22} className="text-rose-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-rose-900 dark:text-rose-300 text-[15px] mb-1">Wipe All Routine Data</h3>
                      <p className="text-rose-700/60 dark:text-rose-400/60 text-[13px] mb-4 leading-relaxed max-w-lg">
                        This action is <strong>irreversible</strong>. All uploaded class schedules and routine mappings will be permanently erased from our system.
                      </p>
                      <button
                        onClick={deleteAllRoutines}
                        disabled={loading}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-rose-600 text-white px-6 py-2.5 rounded-xl font-semibold text-[12px] uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 shadow-md"
                      >
                        {loading ? <Loader inline size="sm" /> : <Trash2 size={15} />}
                        Clear Routine Data
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            )}



        </div>
      </main >

      {saveStatus === "success" && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-900/95 dark:bg-slate-800/95 text-white border border-emerald-500/40 rounded-2xl shadow-2xl shadow-emerald-950/20 backdrop-blur-md animate-in slide-in-from-right-5 fade-in duration-300">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white leading-none">Changes Saved!</p>
            <p className="text-[11px] font-medium text-emerald-300/90 mt-1">Your profile details have been updated.</p>
          </div>
        </div>
      )}

      {saveStatus === "error" && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-900/95 dark:bg-slate-800/95 text-white border border-rose-500/40 rounded-2xl shadow-2xl shadow-rose-950/20 backdrop-blur-md animate-in slide-in-from-right-5 fade-in duration-300">
          <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white leading-none">Save Failed</p>
            <p className="text-[11px] font-medium text-rose-300/90 mt-1">{message || "Failed to save changes."}</p>
          </div>
        </div>
      )}
    </div >
  );
};
export default Settings;
