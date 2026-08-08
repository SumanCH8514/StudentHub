import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { auth, db, googleProvider } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, onSnapshot, collection, getDoc } from "firebase/firestore";
import {
  User,
  Mail,
  Lock,
  Shield,
  ShieldAlert,
  FileText,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  BookOpen,
  Layout,
  CheckCircle2,
  Zap,
  Bell,
  Award,
  Cpu,
  Sun,
  Moon
} from "lucide-react";
import Loader from "./Loader";
import StudentHubLogo from "../assets/StudentHub-logo2.png";

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

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("studentHub_theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("studentHub_theme", "dark");
    }
    setIsDarkMode(!isDarkMode);
  };

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

    if (window.location.hash !== "#auth") {
      window.history.replaceState(null, "", window.location.pathname + "#auth");
    }

    return () => unsub();
  }, []);

  const formatFirebaseError = (errorMsg) => {
    if (!errorMsg) return "";

    const codeMatch = errorMsg.match(/\((auth\/[^)]+)\)/);
    const code = codeMatch ? codeMatch[1] : errorMsg;

    const errorMap = {
      "auth/popup-closed-by-user": "Error: PopUp Closed by User",
      "auth/user-not-found": "Error: User Not Found",
      "auth/wrong-password": "Error: Incorrect Password",
      "auth/email-already-in-use": "Error: Email Already Registered",
      "auth/invalid-email": "Error: Invalid Email Address",
      "auth/weak-password": "Error: Password is too weak",
      "auth/too-many-requests": "Error: Account temporarily locked. Try later.",
      "auth/network-request-failed": "Error: Network Error. Check connection.",
      "auth/internal-error": "Error: Internal System Error",
      "auth/invalid-credential": "Error: Invalid Login Credentials",
      "auth/operation-not-allowed": "Error: Authentication Method Disabled"
    };

    if (errorMap[code]) return errorMap[code];

    return errorMsg.replace("Firebase: Error (", "").replace(").", "").replace("Firebase: ", "").trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await updateProfile(userCred.user, { displayName: name });

        await setDoc(doc(db, "users", userCred.user.uid), {
          uid: userCred.user.uid,
          name: name,
          email: email,
          role: "user",
          createdAt: serverTimestamp(),
        });

        if (systemSettings.newUserAlerts) {
          await setDoc(doc(collection(db, "system_notifications")), {
            type: "new_user",
            title: "New Student Registered",
            message: `${name} (${email}) has joined StudentHub.`,
            timestamp: serverTimestamp(),
            readBy: []
          });
        }
      }
    } catch (err) {
      setError(formatFirebaseError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || "Google User",
          email: user.email,
          photoBase64: null,
          role: "user",
          createdAt: serverTimestamp(),
        });

        if (systemSettings.newUserAlerts) {
          await setDoc(doc(collection(db, "system_notifications")), {
            type: "new_user",
            title: "New Student (Google)",
            message: `${user.displayName || user.email} has joined StudentHub.`,
            timestamp: serverTimestamp(),
            readBy: []
          });
        }
      }
    } catch (err) {
      console.error("Google Auth Error:", err);
      setError(formatFirebaseError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Error: Please enter your email address first");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Success: Password reset link sent to your email!");
    } catch (err) {
      setError(formatFirebaseError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

  return (
    <div className="min-h-screen lg:h-screen w-full flex bg-slate-50 dark:bg-[#0F172A] font-sans overflow-x-hidden lg:overflow-hidden text-slate-800 dark:text-slate-200 selection:bg-indigo-500/30 transition-colors duration-300">

      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-indigo-200 via-slate-50 to-purple-200 dark:from-indigo-900 dark:via-[#0F172A] dark:to-purple-900 animate-mesh filter blur-[80px]" />
      </div>

      <div className="w-full lg:w-[40%] xl:w-[35%] flex flex-col pt-6 pb-8 px-6 sm:px-10 lg:px-12 relative z-20 bg-white/90 dark:bg-[#0F172A]/80 backdrop-blur-3xl border-r border-slate-200 dark:border-white/5 overflow-y-auto lg:overflow-y-auto min-h-screen lg:h-full custom-scrollbar transition-colors duration-300">

        <button
          onClick={toggleTheme}
          type="button"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 p-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/10 hover:scale-105 active:scale-95 transition-all shadow-sm"
          title="Toggle Light/Dark Theme"
        >
          {isDarkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-600" />}
        </button>

        <div className="w-full max-sm:max-w-xs max-w-sm mx-auto flex flex-col items-center justify-center mb-2 shrink-0">
          <a href="/" className="cursor-pointer hover:opacity-90 transition-opacity">
            <img
              src={StudentHubLogo}
              alt="StudentHub Logo"
              className="w-56 sm:w-64 h-auto object-contain drop-shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:scale-105 transition-transform duration-500 mx-auto"
            />
          </a>
        </div>

        <div className="w-full max-sm:max-w-xs max-w-sm mx-auto animate-in fade-in slide-in-from-left-10 duration-1000">

          <div className="mb-4 text-center">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-1.5 tracking-tight">
              {isLogin ? "Welcome back" : "Get started"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-[12px] font-medium tracking-wide mx-auto max-w-[280px]">
              {isLogin ? "Enter your credentials to continue your journey." : "Join the most advanced student community."}
            </p>
          </div>

          {(!isLogin && !systemSettings.allowPublicRegistration) ? (
            <div className="p-6 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-300 dark:border-white/10 text-center backdrop-blur-md">
              <ShieldAlert className="mx-auto mb-3 text-amber-500 animate-pulse" size={40} />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Registration Closed</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                We are not accepting new students at this time. Please contact your coordinator for access.
              </p>
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="mt-6 w-full py-3 bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-white/5"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!isLogin && (
                <div className="space-y-1 group">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={14} />
                    <input
                      type="text"
                      placeholder="e.g. SumanOnline"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 focus:border-indigo-500/50 rounded-xl focus:bg-indigo-500/5 transition-all outline-none font-bold text-slate-900 dark:text-white text-[13px] placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1 group">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={14} />
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 focus:border-indigo-500/50 rounded-xl focus:bg-indigo-500/5 transition-all outline-none font-bold text-slate-900 dark:text-white text-[13px] placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 group">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">Password</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={14} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 focus:border-indigo-500/50 rounded-xl focus:bg-indigo-500/5 transition-all outline-none font-bold text-slate-900 dark:text-white text-[13px] placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-indigo-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && (
                <div key={error} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 animate-shake">
                  <ShieldAlert className="text-rose-500 shrink-0" size={14} />
                  <p className="text-rose-600 dark:text-rose-400 text-[10px] font-bold leading-tight">{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 animate-in fade-in zoom-in-95">
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={14} />
                  <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold leading-tight">{successMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-48 mx-auto py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-sm shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-[0.98] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2.5 group relative overflow-hidden"
              >
                {loading ? <Loader inline size="sm" /> : (
                  <>
                    <span className="relative z-10">{isLogin ? "Sign In" : "Register Now"}</span>
                    <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />
              </button>

              <div className="flex items-center gap-4 my-2.5 py-0.5">
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/5" />
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">OR</span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/5" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl font-bold text-[13px] border border-slate-300 dark:border-white/10 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 shadow-sm"
              >
                <GoogleIcon />
                <span>{isLogin ? "Continue with Google" : "Join with Google"}</span>
              </button>

              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/5 text-center">
                <p className="text-slate-500 dark:text-slate-500 font-medium text-[10px] mb-1.5">
                  {isLogin ? "New to the StudetHub?" : "Already part of the StudentHub?"}
                </p>
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(""); }}
                  className="w-full py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-lg text-px font-bold transition-all border border-slate-300 dark:border-white/5 active:scale-95 shadow-sm"
                >
                  {isLogin ? "Create an account" : "Back to login"}
                </button>
              </div>
            </form>
          )}

        </div>

        <footer className="mt-auto py-4 text-center space-y-1 opacity-70 hover:opacity-100 transition-opacity duration-300 w-full shrink-0">
          <p className="text-[10px] font-medium tracking-[0.05em] text-slate-500 dark:text-slate-400 uppercase">
            &copy; 2023 - 2026 <b className="text-indigo-600 dark:text-indigo-400 font-bold">STUDENTHUB</b> | All Rights Reserved
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-px bg-slate-300 dark:bg-white/10" />
            <p className="text-[10px] font-semibold tracking-wider flex items-center gap-1.5 text-slate-500 dark:text-slate-500">
              <Cpu size={12} className="text-indigo-600 dark:text-indigo-500/70" />
              <span>Maintained by <b className="text-slate-700 dark:text-slate-300 font-bold">SumanOnline.Com</b></span>
            </p>
            <div className="w-4 h-px bg-slate-300 dark:bg-white/10" />
          </div>

          <div className="flex items-center justify-center gap-4 mt-3">
            <Link to="/privacy-policy" className="text-[10px] text-slate-500 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium tracking-wide transition-colors">Privacy Policy</Link>
            <div className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-700" />
            <Link to="/terms-of-service" className="text-[10px] text-slate-500 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium tracking-wide transition-colors">Terms of Service</Link>
          </div>
        </footer>

      </div>

      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-slate-100 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 flex-col items-center justify-between p-5 xl:p-7 overflow-hidden border-l border-slate-200 dark:border-white/10 h-full transition-colors duration-300">

        <div className="absolute inset-0 opacity-40 dark:opacity-50 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[10%] w-[550px] h-[550px] bg-indigo-300/40 dark:bg-indigo-600/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] animate-blob" />
          <div className="absolute bottom-[-10%] right-[10%] w-[450px] h-[450px] bg-purple-300/40 dark:bg-purple-600/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[110px] animate-blob animation-delay-2000" />
          <div className="absolute top-[40%] right-[30%] w-[350px] h-[350px] bg-cyan-200/40 dark:bg-cyan-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[90px] animate-blob animation-delay-4000" />
        </div>

        <div className="relative z-10 w-full max-w-2xl my-auto flex flex-col justify-between h-full py-1 animate-in fade-in slide-in-from-right-12 duration-1000">

          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-indigo-500/10 dark:bg-indigo-500/10 backdrop-blur-md rounded-full border border-indigo-300 dark:border-indigo-500/30 mb-2 shadow-sm dark:shadow-[0_0_15px_rgba(99,102,241,0.2)] w-max">
              <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
              <span className="text-[9.5px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-200">Premium Academic Ecosystem</span>
            </div>

            <h2 className="text-[28px] xl:text-[36px] font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter mb-1.5">
              Elevate your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400">Learning Path.</span>
            </h2>

            <p className="text-slate-600 dark:text-slate-300 text-[12px] xl:text-[13px] font-medium max-w-lg mb-3 leading-relaxed">
              Organize your classes, sync with global university schedules, and unlock AI-powered insights for every course you take.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3 w-full">
            {[
              { icon: Layout, title: "Smart Dashboard", desc: "Automated routine sync.", gradient: "from-indigo-500 to-blue-600" },
              { icon: BookOpen, title: "Resource Hub", desc: "Global academic sync.", gradient: "from-purple-500 to-pink-600" },
              { icon: Zap, title: "AI Assistant", desc: "Instant academic guidance.", gradient: "from-cyan-500 to-blue-600" },
              { icon: Bell, title: "Live Alerts", desc: "Schedule & holiday pings.", gradient: "from-amber-500 to-orange-600" },
            ].map((feat, i) => (
              <div
                key={i}
                className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 hover:border-indigo-500/40 hover:bg-white dark:hover:bg-slate-900/90 shadow-md dark:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 group hover:-translate-y-0.5"
              >
                <div className={`w-9 h-9 bg-gradient-to-tr ${feat.gradient} rounded-xl flex items-center justify-center mb-2 shadow-md group-hover:scale-110 transition-transform`}>
                  <feat.icon className="text-white" size={17} />
                </div>
                <h4 className="text-slate-900 dark:text-white text-[13px] xl:text-[14px] font-bold mb-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{feat.title}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] xl:text-[11px] font-medium leading-tight">{feat.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 w-full animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
            <div className="space-y-2">
              <h3 className="text-[13px] xl:text-[14px] font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                <Award className="text-amber-500 dark:text-amber-400" size={16} />
                Why join StudentHub?
              </h3>
              <div className="flex flex-col gap-1.5">
                {[
                  "Personalized routines & holiday trackers.",
                  "Cloud sync across all your devices.",
                  "Exclusive AI Academic Assistant.",
                  "Seamless university integrations."
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2.5 bg-white/70 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] backdrop-blur-md p-1.5 px-3 rounded-xl border border-slate-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/30 transition-all group shadow-sm">
                    <div className="w-4.5 h-4.5 rounded-md bg-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-[0_0_8px_rgba(99,102,241,0.3)]">
                      <CheckCircle2 size={11} />
                    </div>
                    <span className="text-slate-800 dark:text-slate-200 text-[11px] xl:text-[12px] font-semibold leading-tight">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-[13px] xl:text-[14px] font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                <ShieldAlert className="text-emerald-600 dark:text-emerald-400" size={16} />
                Legal Hub
              </h3>
              <div className="flex flex-col gap-2">
                <Link to="/terms-of-service" className="group flex items-center justify-between bg-gradient-to-r from-white to-indigo-50/80 dark:from-slate-900/90 dark:to-indigo-950/80 hover:from-white hover:to-indigo-100 dark:hover:from-slate-900 dark:hover:to-indigo-900 backdrop-blur-md p-2.5 px-3.5 rounded-xl border border-slate-200/80 dark:border-indigo-500/20 hover:border-indigo-400/50 transition-all hover:scale-[1.01] shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0 border border-emerald-500/30">
                      <FileText size={15} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-900 dark:text-white text-[12.5px] xl:text-[13px] font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">Terms of Service</span>
                      <span className="text-slate-500 dark:text-slate-400 text-[9.5px] font-medium">Rules & guidelines</span>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link to="/privacy-policy" className="group flex items-center justify-between bg-gradient-to-r from-white to-indigo-50/80 dark:from-slate-900/90 dark:to-indigo-950/80 hover:from-white hover:to-indigo-100 dark:hover:from-slate-900 dark:hover:to-indigo-900 backdrop-blur-md p-2.5 px-3.5 rounded-xl border border-slate-200/80 dark:border-indigo-500/20 hover:border-indigo-400/50 transition-all hover:scale-[1.01] shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform shrink-0 border border-purple-500/30">
                      <Shield size={15} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-900 dark:text-white text-[12.5px] xl:text-[13px] font-bold group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">Privacy Policy</span>
                      <span className="text-slate-500 dark:text-slate-400 text-[9.5px] font-medium">Data protection</span>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-400/40 dark:border-emerald-500/30 w-max shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[8.5px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">System Online</span>
          </div>

        </div>

        <div className="absolute top-10 right-10 w-24 h-24 border border-slate-300/40 dark:border-white/10 rounded-full animate-pulse pointer-events-none" />
        <div className="absolute bottom-20 left-6 w-48 h-48 border border-slate-300/40 dark:border-white/10 rounded-full animate-float pointer-events-none" />
      </div>

    </div>
  );
};

export default Auth;
