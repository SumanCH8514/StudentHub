import React from "react";
import favLogo from "../assets/fav.png";

const Loader = ({
    message = "Starting StudentHub...",
    fullScreen = true,
    size = "md", // "sm", "md", "lg"
    inline = false
}) => {
    const sizeClasses = {
        sm: "w-6 h-6",
        md: "w-16 h-16",
        lg: "w-24 h-24"
    };

    const logoSizeClasses = {
        sm: "w-3 h-3",
        md: "w-8 h-8",
        lg: "w-12 h-12"
    };

    const containerClasses = inline
        ? "flex items-center justify-center"
        : `flex flex-col items-center justify-center ${fullScreen ? "min-h-screen w-full bg-slate-50 dark:bg-slate-900" : "p-8"} transition-colors duration-300`;

    return (
        <div className={containerClasses}>
            <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
                {/* Outer spinning ring */}
                <div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-800"></div>
                {/* Animated primary ring */}
                <div className="absolute inset-0 rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-500 dark:border-t-transparent animate-spin"></div>
                {/* Center Logo/Icon */}
                <div className={`absolute inset-0 m-auto ${logoSizeClasses[size]} flex items-center justify-center rounded bg-indigo-100 dark:bg-indigo-900/50 z-10 animate-pulse overflow-hidden`}>
                    <img src={favLogo} alt="Loading" className="w-[80%] h-[80%] object-contain" />
                </div>
            </div>
            {!inline && (
                <p className="mt-6 text-slate-500 dark:text-slate-400 font-medium tracking-wide animate-pulse">
                    {message}
                </p>
            )}
        </div>
    );
};

export default Loader;
