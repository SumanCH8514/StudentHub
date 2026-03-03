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
  ShieldAlert,
  ArrowRight
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
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-hidden relative font-sans p-4 sm:p-8">

      {/* Animated Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 sm:w-[500px] sm:h-[500px] bg-indigo-500/20 dark:bg-indigo-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 sm:w-[500px] sm:h-[500px] bg-purple-500/20 dark:bg-purple-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 sm:w-[500px] sm:h-[500px] bg-emerald-500/20 dark:bg-emerald-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row bg-white/70 dark:bg-slate-900/50 backdrop-blur-2xl rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl shadow-indigo-500/5 dark:shadow-none border border-white/50 dark:border-white/5 overflow-hidden">

        {/* Left Side: Brand & Visuals */}
        <div className="w-full lg:w-5/12 p-10 sm:p-14 md:p-16 flex flex-col justify-between relative overflow-hidden bg-indigo-600 dark:bg-indigo-950 text-white">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

          <div className="relative z-10 mt-4">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl mb-8 border border-white/20 shadow-xl">
              <LayoutDashboard size={28} className="text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter mb-6 leading-tight">
              Student<br className="hidden lg:block" />
              <span className="text-indigo-300">Hub</span>
            </h1>
            <p className="text-indigo-100/90 text-lg sm:text-xl font-medium leading-relaxed max-w-sm">
              The premium AI-driven academic companion. Sync routines, track resources, and absolutely dominate your semester.
            </p>
          </div>

          <div className="relative z-10 mt-16 lg:mt-32">
            <div className="flex animate-float items-center gap-4 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-2xl">
              <Sparkles className="text-indigo-200 shrink-0" size={24} />
              <p className="text-sm font-bold text-indigo-50">Intelligent scheduling that adapts perfectly to your workflow.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full lg:w-7/12 p-8 sm:p-14 md:px-20 lg:py-24 flex flex-col justify-center relative bg-white/40 dark:bg-transparent">

          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 w-full max-w-md mx-auto lg:max-w-none">
            <div className="mb-10 sm:mb-12 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
                {isLogin ? "Welcome back" : "Create an account"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
                {isLogin ? "Enter your details to access your dashboard." : "Join the next generation of top students."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
              {!isLogin && (
                <div className="space-y-2 group">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                      type="text"
                      placeholder="e.g. Suman Chakraborty"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 sm:py-5 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 group">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 sm:py-5 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 sm:py-5 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 sm:py-5 mt-6 sm:mt-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg sm:text-xl shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 overflow-hidden relative group"
              >
                <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-full group-hover:h-56 opacity-10"></span>
                <span className="relative flex items-center gap-2">
                  {loading ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <>
                      <span>{isLogin ? "Sign In to Dashboard" : "Complete Registration"}</span>
                      <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>

            {error && (
              <div className="mt-8 p-5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-start gap-4 animate-in fade-in zoom-in-95 backdrop-blur-sm shadow-lg shadow-rose-500/5">
                <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={24} />
                <p className="text-rose-700 dark:text-rose-400 text-sm font-bold leading-tight">{error}</p>
              </div>
            )}

            <div className="mt-12 pt-10 border-t border-slate-200/60 dark:border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {isLogin ? "Don't have an account?" : "Already managing your routine?"}
              </p>
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-95 shadow-sm text-sm"
              >
                {isLogin ? "Create account instead" : "Sign in to existing"}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Auth;
