import React, { useState } from "react";
import { auth, db } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, onSnapshot, collection } from "firebase/firestore";
import {
  User,
  Mail,
  Lock,
  Loader2,
  ShieldAlert,
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
  Cpu
} from "lucide-react";
import favLogo from "../assets/fav.png";
import StudentHubLogo from "../assets/StudentHub-logo1.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [systemSettings, setSystemSettings] = useState({
    allowPublicRegistration: true,
    newUserAlerts: true
  });

  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "system"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSystemSettings({
          allowPublicRegistration: data.allowPublicRegistration ?? true,
          newUserAlerts: data.newUserAlerts ?? true
        });
      }
    });
    return () => unsub();
  }, []);

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

        // Trigger System Alert if enabled
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen w-full flex bg-[#0F172A] font-sans overflow-x-hidden lg:overflow-hidden text-slate-200 selection:bg-indigo-500/30">

      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-indigo-900 via-[#0F172A] to-purple-900 animate-mesh filter blur-[80px]" />
      </div>

      {/* --- LEFT PANEL: AUTH FORM --- */}
      <div className="w-full lg:w-[40%] xl:w-[35%] flex flex-col pt-12 pb-8 px-6 sm:px-10 lg:px-12 relative z-20 bg-[#0F172A]/80 backdrop-blur-3xl border-r border-white/5 overflow-y-auto lg:overflow-visible min-h-screen lg:h-full">

        {/* Fixed Top Branded Logo */}
        <div className="w-full max-w-sm mx-auto flex flex-col items-center mb-4 shrink-0">
          <img
            src={StudentHubLogo}
            alt="StudentHub Logo"
            className="w-44 h-auto object-contain drop-shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Center-Aligned Form Section */}
        <div className="w-full max-sm:max-w-xs max-w-sm mx-auto my-auto animate-in fade-in slide-in-from-left-10 duration-1000">

          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              {isLogin ? "Welcome back" : "Get started"}
            </h1>
            <p className="text-slate-400 text-[13px] font-medium tracking-wide mx-auto max-w-[280px]">
              {isLogin ? "Enter your credentials to continue your journey." : "Join the most advanced student community."}
            </p>
          </div>

          {(!isLogin && !systemSettings.allowPublicRegistration) ? (
            <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/10 text-center backdrop-blur-md">
              <ShieldAlert className="mx-auto mb-3 text-amber-500 animate-pulse" size={40} />
              <h3 className="text-lg font-bold text-white mb-1">Registration Closed</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                We are not accepting new students at this time. Please contact your coordinator for access.
              </p>
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="mt-6 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-white/5"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!isLogin && (
                <div className="space-y-1 group">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
                    <input
                      type="text"
                      placeholder="e.g. SumanOnline"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl focus:bg-indigo-500/5 transition-all outline-none font-bold text-white text-[13px] placeholder:text-slate-600"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1 group">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl focus:bg-indigo-500/5 transition-all outline-none font-bold text-white text-[13px] placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 group">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Password</label>
                  {isLogin && <a href="#" className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Forgot Password?</a>}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl focus:bg-indigo-500/5 transition-all outline-none font-bold text-white text-[13px] placeholder:text-slate-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 animate-in fade-in zoom-in-95">
                  <ShieldAlert className="text-rose-500 shrink-0" size={14} />
                  <p className="text-rose-400 text-[10px] font-bold leading-tight">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-48 mx-auto py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2.5 group relative overflow-hidden"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : (
                  <>
                    <span>{isLogin ? "Sign In" : "Register Now"}</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>

              <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <p className="text-slate-500 font-medium text-xs mb-2">
                  {isLogin ? "New to the StudetHub?" : "Already part of the StudentHub?"}
                </p>
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(""); }}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[11px] font-bold transition-all border border-white/5 active:scale-95"
                >
                  {isLogin ? "Create an account" : "Back to login"}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Fixed Bottom Footer */}
        <footer className="mt-auto py-6 text-center space-y-1.5 opacity-40 hover:opacity-100 transition-opacity duration-300 w-full shrink-0">
          <p className="text-[10px] font-medium tracking-[0.05em] text-slate-400 uppercase">
            &copy; 2023 - 2026 <b className="text-indigo-400 font-bold">STUDENTHUB</b> | All Rights Reserved
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-px bg-white/10" />
            <p className="text-[10px] font-semibold tracking-wider flex items-center gap-1.5 text-slate-500">
              <Cpu size={12} className="text-indigo-500/70" />
              <span>Maintained by <b className="text-slate-300 font-bold">SumanOnline.Com</b></span>
            </p>
            <div className="w-4 h-px bg-white/10" />
          </div>
        </footer>

      </div>

      {/* --- RIGHT PANEL: VISUAL EXPERIENCE --- */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-indigo-800 to-purple-900 items-center justify-center p-10 xl:p-16 overflow-hidden">

        {/* Abstract Motion Background */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-500 rounded-full mix-blend-screen filter blur-[120px] animate-blob" />
          <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-purple-500 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
        </div>

        <div className="relative z-10 w-full max-w-3xl animate-in fade-in slide-in-from-right-12 duration-1000">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 mb-4 font-sans">
            <Sparkles size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Premium Academic Ecosystem</span>
          </div>

          <h2 className="text-[44px] xl:text-[56px] font-black text-white leading-[1.1] tracking-tighter mb-4">
            Elevate your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">Learning Path.</span>
          </h2>

          <p className="text-white/60 text-[15px] xl:text-base font-medium max-w-lg mb-8 leading-relaxed font-sans">
            Organize your classes, sync with global university schedules, and unlock AI-powered insights for every course you take.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4 mb-10 max-w-2xl">
            {[
              { icon: Layout, title: "Smart Dashboard", desc: "Automated routine sync." },
              { icon: BookOpen, title: "Resource Hub", desc: "Global academic sync." },
              { icon: Zap, title: "AI Assistant", desc: "Instant academic guidance." },
              { icon: Bell, title: "Live Alerts", desc: "Schedule & holiday pings." },
            ].map((feat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl p-4 rounded-[1.5rem] border border-white/10 hover:bg-white/10 transition-all group animate-float" style={{ animationDelay: `${i * 0.5}s` }}>
                <div className="w-9 h-9 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <feat.icon className="text-indigo-400" size={16} />
                </div>
                <h4 className="text-white text-[13px] font-bold mb-1">{feat.title}</h4>
                <p className="text-slate-400 text-[9px] font-medium leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>

          {/* Why Sign Up Section */}
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-500">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Award className="text-amber-400" size={18} />
              Why join StudentHub?
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                "Personalized course routines & holiday trackers.",
                "Cloud synchronization across all your devices.",
                "Exclusive access to the AI Academic Assistant.",
                "Seamless integration with university resources."
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                  <span className="text-slate-300 text-[13px] font-medium leading-tight">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Small status tag */}
          <div className="mt-10 flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30 w-max">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">System Online</span>
          </div>

        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 border-2 border-white/5 rounded-full animate-pulse" />
        <div className="absolute bottom-40 left-10 w-64 h-64 border-2 border-white/5 rounded-full animate-float" />
      </div>

    </div>
  );
};

export default Auth;
