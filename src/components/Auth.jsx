import React, { useState } from "react";
import { auth, db } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  LayoutDashboard,
  User,
  Mail,
  Lock,
  Loader2,
  Sparkles,
  LogIn,
  UserPlus,
  BookOpen,
  ShieldAlert,
} from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans antialiased overflow-hidden">
      {/* --- LEFT SIDE: PREMIUM HERO (Hidden on Mobile/Tablet) --- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 items-center justify-center p-20 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -mr-40 -mt-40 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] -ml-20 -mb-20" />

        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 max-w-xl">
          <div className="mb-12 inline-flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-indigo-400">
            <Sparkles size={16} />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Next-Gen Routine Management</span>
          </div>

          <h2 className="text-6xl xl:text-7xl font-black text-white leading-[1.1] mb-8 tracking-tighter">
            Master your <span className="text-indigo-500">schedule</span> with AI precision.
          </h2>

          <p className="text-xl text-slate-400 font-medium leading-relaxed mb-12 max-w-lg">
            Join thousands of students optimizing their daily academic life with real-time sync and intelligent timeline management.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-sm">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-600/20">
                <LayoutDashboard size={24} />
              </div>
              <h4 className="text-white font-black mb-2 text-lg">Smart Dashboard</h4>
              <p className="text-sm text-slate-500 font-medium">Visualized timeline of your entire day at a glance.</p>
            </div>
            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-sm">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-500/20">
                <Sparkles size={24} />
              </div>
              <h4 className="text-white font-black mb-2 text-lg">Real-time Sync</h4>
              <p className="text-sm text-slate-500 font-medium">Instantly access your routine across all your devices.</p>
            </div>
          </div>
        </div>

        {/* Floating Book Decoration */}
        <BookOpen
          size={300}
          className="absolute -bottom-20 -right-20 text-white/5 rotate-12 pointer-events-none"
        />
      </div>

      {/* --- RIGHT SIDE: LOGIN FORM --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-[#F8FAFC]">
        {/* Mobile Background Decoration */}
        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-100/30 rounded-full blur-3xl -ml-20 -mb-20" />
        </div>

        <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Top Brand Logo (Mobile specific) */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="p-4 bg-slate-950 rounded-[1.8rem] text-white shadow-2xl mb-6 ring-4 ring-white">
              <LayoutDashboard size={32} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tighter mb-2">
              Student<span className="text-indigo-600">Hub</span>
            </h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest bg-slate-100 px-4 py-1.5 rounded-full">
              {isLogin ? "Sign in to Dashboard" : "Join the Community"}
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="e.g. Suman Chakraborty"
                      value={name}
                      autoComplete="name"
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none font-bold text-slate-900 placeholder:text-slate-300"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Your Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    autoComplete="email"
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none font-bold text-slate-900 placeholder:text-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Secure Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none font-bold text-slate-900 placeholder:text-slate-300"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-slate-950/20 hover:bg-slate-900 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    {isLogin ? <LogIn size={22} /> : <UserPlus size={22} />}
                    <span>{isLogin ? "Enter Dashboard" : "Register Now"}</span>
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in-95">
                <ShieldAlert className="text-rose-500 shrink-0" size={20} />
                <p className="text-rose-600 text-xs font-black uppercase tracking-tight leading-tight">{error}</p>
              </div>
            )}
          </div>

          {/* Footer Toggle */}
          <div className="mt-10 text-center">
            <p className="text-slate-400 font-bold mb-3">{isLogin ? "New to the system?" : "Already found your hub?"}</p>
            <button
              onClick={() => { setIsLogin(!isLogin); setError(""); }}
              className="px-8 py-3 bg-white border border-slate-200 rounded-full font-black text-slate-900 hover:bg-slate-50 hover:border-indigo-200 transition-all active:scale-95 shadow-sm"
            >
              {isLogin ? "Create Free Account" : "Back to Login"}
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col items-center gap-4">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] text-center">
              <span className="text-indigo-600">a SumanOnline Website</span><br />
              <span className="font-semibold">Secured by SVUnite Infrastructure</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
