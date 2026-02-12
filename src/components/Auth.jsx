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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-white p-3 sm:p-4 md:p-6 font-sans antialiased">
      {/* Animated background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-100/20 rounded-full blur-3xl" />
      </div>

      {/* Main card — fully responsive, perfect on all screens */}
      <div className="relative w-full max-w-[440px] lg:max-w-md bg-white/90 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-2xl border border-white/50 animate-in fade-in zoom-in-95 duration-500">
        {/* Gradient accent line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full" />

        {/* Header with refined spacing */}
        <div className="flex flex-col items-center mb-7 sm:mb-8 md:mb-10">
          <div className="relative mb-4 sm:mb-5">
            <div className="absolute inset-0 bg-indigo-600/20 blur-2xl rounded-full" />
            <div className="relative p-3.5 sm:p-4 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl sm:rounded-2xl text-white shadow-lg shadow-indigo-600/25">
              <LayoutDashboard size={28} className="sm:w-8 sm:h-8" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1">
            Student{" "}
            <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-xl -rotate-1 inline-block">
              Hub
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {isLogin
              ? "Welcome back! Sign in to continue"
              : "Create your account"}
          </p>
        </div>

        {/* Form with enhanced inputs */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {!isLogin && (
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                  size={18}
                  strokeWidth={1.8}
                />
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 sm:py-4 bg-slate-50/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm sm:text-base placeholder:text-slate-400"
                  required
                />
              </div>
            </div>
          )}

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                size={18}
                strokeWidth={1.8}
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 sm:py-4 bg-slate-50/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm sm:text-base placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                size={18}
                strokeWidth={1.8}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 sm:py-4 bg-slate-50/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm sm:text-base placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          {/* CTA button with icon */}
          <button
            type="submit"
            disabled={loading}
            className="relative w-full mt-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-3.5 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-600/30 hover:shadow-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm sm:text-base"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : isLogin ? (
              <>
                <LogIn size={18} strokeWidth={2.2} />
                <span>Sign in</span>
              </>
            ) : (
              <>
                <UserPlus size={18} strokeWidth={2.2} />
                <span>Create account</span>
              </>
            )}
          </button>
        </form>

        {/* Error message with animation */}
        {error && (
          <div className="mt-5 p-3.5 sm:p-4 bg-red-50/90 backdrop-blur-sm text-red-600 text-xs sm:text-sm font-medium rounded-xl border border-red-200/80 animate-in slide-in-from-top-2 fade-in">
            <span className="block truncate">{error}</span>
          </div>
        )}

        {/* Toggle between login/register */}
        <div className="mt-7 sm:mt-8 text-center">
          <p className="text-sm text-slate-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(""); // Clear error on toggle
            }}
            className="mt-2 text-sm sm:text-base font-bold text-indigo-600 hover:text-indigo-700 transition-colors relative group"
          >
            {isLogin ? "Create free account" : "Sign in"}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 group-hover:w-full transition-all duration-300" />
          </button>
        </div>

        {/* Decorative elements */}
        <div className="flex items-center justify-center gap-1.5 mt-8 text-slate-400">
          <Sparkles size={12} />
          <span className="text-[10px] sm:text-xs font-medium">
            Secure • Real-time sync
          </span>
          <Sparkles size={12} />
        </div>
      </div>
    </div>
  );
};

export default Auth;
