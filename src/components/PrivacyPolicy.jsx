import React from "react";
import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import StudentHubLogo from "../assets/StudentHub-logo1.png";
import { useTheme } from "../utils/theme";

const PrivacyPolicy = () => {
    const { isDarkMode } = useTheme();

    return (
        <div className="min-h-screen w-full flex bg-slate-50 dark:bg-[#0F172A] font-sans text-slate-800 dark:text-slate-200 py-12 px-6 sm:px-10 lg:px-20 relative overflow-hidden transition-colors duration-300">
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 dark:opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-indigo-200 via-slate-50 to-purple-200 dark:from-indigo-900 dark:via-[#0F172A] dark:to-purple-900 animate-mesh filter blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto w-full">
                <div className="flex flex-row items-center justify-between gap-3 sm:gap-6 mb-6 sm:mb-8 w-full">
                    <a href="/" className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors border border-slate-300 dark:border-white/10 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm shrink-0">
                        <ArrowLeft size={15} />
                        Back to Home
                    </a>

                    <a href="/" className="cursor-pointer hover:opacity-100 transition-opacity shrink-0">
                        <img
                            src={StudentHubLogo}
                            alt="StudentHub Logo"
                            className="w-28 sm:w-32 h-auto object-contain opacity-90 hover:scale-105 transition-transform duration-300"
                        />
                    </a>
                </div>

                <div className="bg-white/90 dark:bg-[#0F172A]/80 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 sm:p-12 shadow-xl transition-colors duration-300">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Privacy Policy</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Last updated: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base font-medium">
                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Introduction</h2>
                            <p>
                                Welcome to StudentHub. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. The Data We Collect</h2>
                            <p className="mb-2">We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
                            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                                <li><strong className="text-slate-900 dark:text-slate-200">Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                                <li><strong className="text-slate-900 dark:text-slate-200">Contact Data</strong> includes email address.</li>
                                <li><strong className="text-slate-900 dark:text-slate-200">Profile Data</strong> includes your username and password, your educational stream, semester, and university.</li>
                                <li><strong className="text-slate-900 dark:text-slate-200">Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. How We Use Your Data</h2>
                            <p className="mb-2">We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                                <li>Where we need to perform the contract we are about to enter into or have entered into with you (e.g., providing class schedules).</li>
                                <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                                <li>Where we need to comply with a legal obligation.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Data Security</h2>
                            <p>
                                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. Contact Us</h2>
                            <p>
                                If you have any questions about this privacy policy or our privacy practices, please contact us at our designated support email channel.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
