import React, { useState, useEffect } from "react";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import Dashboard from "./components/Dashboard";
import Auth from "./components/Auth";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="text-indigo-600 font-black animate-pulse tracking-tighter text-xl">
          STUDENT HUB...
        </div>
      </div>
    );

  return user ? <Dashboard /> : <Auth />;
}

export default App;
