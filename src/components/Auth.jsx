import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import { auth, db, googleProvider, facebookProvider } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, onSnapshot, getDoc } from "firebase/firestore";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  ShieldCheck,
  GraduationCap
} from "lucide-react";
import { useTheme } from "../utils/theme";
import { LanguageSwitcher } from "../utils/language.jsx";
import Loader from "./Loader";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [systemSettings, setSystemSettings] = useState({
    allowPublicRegistration: true,
    newUserAlerts: true
  });

  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "system"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSystemSettings({
          allowPublicRegistration: data.allowPublicRegistration ?? true,
          newUserAlerts: data.newUserAlerts ?? true
        });
      }
    });

    const currentPath = window.location.pathname;
    if ((currentPath === "/" || currentPath === "/routine" || currentPath === "/routine/") && window.location.hash !== "#auth") {
      window.history.replaceState(null, "", currentPath + "#auth");
    }

    return () => unsub();
  }, []);

  const formatFirebaseError = (errorMsg) => {
    if (!errorMsg) return "";

    const codeMatch = errorMsg.match(/\((auth\/[^)]+)\)/);
    const code = codeMatch ? codeMatch[1] : errorMsg;

    const errorMap = {
      "auth/popup-closed-by-user": "Sign-in popup was closed before completing.",
      "auth/user-not-found": "No account found with this email address.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/email-already-in-use": "This email is already registered.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/too-many-requests": "Too many attempts. Please wait a few minutes.",
      "auth/network-request-failed": "Network error. Please check your connection.",
      "auth/internal-error": "An internal error occurred. Please try again.",
      "auth/invalid-credential": "Invalid login credentials.",
      "auth/operation-not-allowed": "Facebook login is not enabled in Firebase Console. Please enable Facebook in Firebase Console > Authentication > Sign-in method.",
      "auth/account-exists-with-different-credential": "An account already exists with the same email address using Google or Email."
    };

    if (errorMap[code]) return errorMap[code];

    return errorMsg.replace("Firebase: Error (", "").replace(").", "").replace("Firebase: ", "").trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    if (!isLogin && !systemSettings.allowPublicRegistration) {
      setError("Registration is currently restricted to authorized students.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: name,
          email: user.email,
          createdAt: serverTimestamp(),
          role: "user",
          university: "SVU",
          stream: "B.Tech",
          semester: "1",
          section: "1"
        });
      }
    } catch (err) {
      setError(formatFirebaseError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address to receive password reset instructions.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset email sent. Please check your inbox.");
      setError("");
    } catch (err) {
      setError(formatFirebaseError(err.message));
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        if (!systemSettings.allowPublicRegistration) {
          await auth.signOut();
          setError("New user registrations are currently disabled by administration.");
          setLoading(false);
          return;
        }

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: user.displayName || "Student",
          email: user.email,
          photoURL: user.photoURL || "",
          createdAt: serverTimestamp(),
          role: "user",
          university: "SVU",
          stream: "B.Tech",
          semester: "1",
          section: "1"
        });
      }
    } catch (err) {
      setError(formatFirebaseError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        if (!systemSettings.allowPublicRegistration) {
          await auth.signOut();
          setError("New user registrations are currently disabled by administration.");
          setLoading(false);
          return;
        }

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: user.displayName || "Student",
          email: user.email || "",
          photoURL: user.photoURL || "",
          createdAt: serverTimestamp(),
          role: "user",
          university: "SVU",
          stream: "B.Tech",
          semester: "1",
          section: "1"
        });
      }
    } catch (err) {
      setError(formatFirebaseError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

  const FacebookIcon = () => (
    <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row-reverse bg-[#f8fafc] dark:bg-[#0b0f19] font-sans text-slate-800 dark:text-slate-200 overflow-y-auto lg:overflow-hidden transition-colors duration-300">
      <div className="w-full lg:w-[430px] xl:w-[470px] min-h-screen lg:min-h-0 lg:h-full flex flex-col justify-between pt-3 px-5 pb-5 sm:p-6 lg:p-7 xl:p-8 bg-white dark:bg-[#111827] border-l border-slate-200 dark:border-slate-800 shadow-xs shrink-0 overflow-y-auto lg:overflow-y-auto custom-scrollbar">
        <div className="w-full py-1">
          <div className="w-full flex items-center justify-between gap-3 mb-3 sm:mb-4">
            <a href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <img
                src="https://cdn.photos.sumanonline.com/R29vZ2xl/AVvXsEhos0R2tOWxdN_BLuLURzfQuWfV7OGviJ2NCbpQIHYYGBEP8t8zMWc9ZOUEyz8KI2Cr_QX_qzaAGadXOiNoIFsH5P3VJ7I758LvbcutztjuDNI3FBw8_f2z1gkdB7fDmodQfVEPGXwUWR2slBjKcU4nHxyPX3ewLik7gCI-vfp0O9PtloDj2nPy0crvo1JX/s600/new-logo-removebg.png"
                alt="StudentHub"
                className="h-12 sm:h-14 md:h-16 w-auto max-w-[210px] sm:max-w-[240px] object-contain"
              />
            </a>

            <div className="flex items-center gap-2">
              <LanguageSwitcher variant="pill" align="right" />
              <button
                onClick={toggleTheme}
                type="button"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                title={isDarkMode ? "Light Mode" : "Dark Mode"}
              >
                {isDarkMode ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-700" />}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isLogin ? "Sign In to StudentHub" : "Create Student Account"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isLogin
                ? "Enter your academic credentials to access your class schedule."
                : "Register with your student profile to access timetable synchronization."}
            </p>
          </div>

          {!isLogin && !systemSettings.allowPublicRegistration ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 text-center space-y-2.5">
              <AlertCircle className="mx-auto text-amber-600 dark:text-amber-400" size={24} />
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white">Registration Closed</h2>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Self-registration is currently restricted. Please contact your department coordinator.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="w-full py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                Return to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="e.g. Suman Chakraborty"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="email"
                    placeholder="student_name@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-2 text-xs font-medium text-rose-700 dark:text-rose-400">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader inline size="sm" />
                ) : (
                  <>
                    <span>{isLogin ? "Sign In" : "Create Account"}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <div className="relative my-2.5 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <span className="relative bg-white dark:bg-[#111827] px-3 text-[10px] font-medium text-slate-400 uppercase">
                  or
                </span>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleFacebookLogin}
                  disabled={loading}
                  className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <FacebookIcon />
                  <span>Continue with Facebook</span>
                </button>
              </div>

              <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError("");
                    }}
                    className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-1"
                  >
                    {isLogin ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>

        <div className="pt-2 shrink-0">
          <Footer />
        </div>
      </div>

      <div className="hidden lg:flex flex-1 h-full flex-col justify-between p-8 xl:p-12 bg-gradient-to-br from-indigo-50/60 via-slate-50 to-blue-50/50 dark:from-[#080d1a] dark:via-[#0c1222] dark:to-[#070b14] border-l border-slate-200/80 dark:border-slate-800/80 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-xl space-y-2.5 shrink-0 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-indigo-200/80 dark:border-indigo-800/80 rounded-full text-indigo-700 dark:text-indigo-300 text-xs font-bold shadow-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Institutional Academic Operating System</span>
          </div>

          <h2 className="text-2xl xl:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
            Your University Timetable, <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
              Synchronized &amp; Real-Time.
            </span>
          </h2>

          <p className="text-xs xl:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            Centralized digital platform for university students and departments to track live lecture timelines, attendance compliance, and examination dates.
          </p>
        </div>

        <div className="max-w-xl w-full my-auto space-y-4 relative z-10">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-lg shadow-indigo-500/5 dark:shadow-none space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Calendar size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">Computer Science &amp; Engineering</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Semester 4 • Section A</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Live Schedule
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/70 border border-indigo-100 dark:border-indigo-900/40 relative overflow-hidden">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-100/70 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                      10:30 AM - 12:30 PM
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Operating Systems Laboratory (CS401P)</h4>
                  </div>
                  <span className="text-[10.5px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                    <MapPin size={11} /> Lab 402
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Prof. A. Sharma • Faculty of Computing</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">In Progress (45m left)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full w-[65%]"></div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                      02:00 PM - 03:00 PM
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Database Management Systems</h4>
                  </div>
                  <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                    <MapPin size={11} /> Lecture Hall 3
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Dr. S. Mukherjee • Department of CSE</span>
                  <span className="text-slate-400 font-semibold">Upcoming Lecture</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 p-2.5 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Attendance Ratio</span>
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">88.5%</span>
                </div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  Above 75% exam criteria
                </p>
              </div>

              <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 p-2.5 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Next Mid-Term</span>
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">March 16</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  DBMS &amp; OS Practicals
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 shadow-xs transition-all hover:border-indigo-400">
              <div className="text-indigo-600 dark:text-indigo-400 mb-1.5">
                <BookOpen size={16} />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Routine Sync</h4>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Instant schedule synchronization</p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 shadow-xs transition-all hover:border-indigo-400">
              <div className="text-indigo-600 dark:text-indigo-400 mb-1.5">
                <Calendar size={16} />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Academic Calendar</h4>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">University holidays &amp; events</p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 shadow-xs transition-all hover:border-indigo-400">
              <div className="text-indigo-600 dark:text-indigo-400 mb-1.5">
                <ShieldCheck size={16} />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Verified Records</h4>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Department-approved rosters</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-200/80 dark:border-slate-800 shrink-0 relative z-10">
          <span className="font-semibold tracking-wider text-[11px]">© 2023 - 2026 STUDENTHUB | ALL RIGHTS RESERVED</span>
          <div className="flex items-center gap-4 font-semibold text-[11px]">
            <Link to="/privacy-policy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
