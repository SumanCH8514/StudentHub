import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    ArrowLeft,
    LifeBuoy,
    MessageCircle,
    ShieldCheck,
    HelpCircle,
    ExternalLink,
    ChevronRight,
    Mail,
    Smartphone,
    Send,
    AlertCircle,
    CheckCircle2,
    FileText,
    Cpu,
    Search,
    ChevronDown,
    Filter,
    Clock,
    RefreshCw
} from "lucide-react";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { Link } from "react-router-dom";
import Loader from "./Loader.jsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const FAQ_ITEMS = [
    {
        category: "Technical Support",
        question: "Why is my AI routine extraction failing?",
        answer: "Ensure your timetable image is clear, well-lit, and uncropped. Standard formats like JPG, PNG, and PDF work best. If rate limits occur, wait 60 seconds before retrying."
    },
    {
        category: "Technical Support",
        question: "How do I trigger live Firestore cloud sync?",
        answer: "Cloud sync happens automatically whenever you edit your routine or update your profile. Click the 'Sync' button in the top navigation header for manual refresh."
    },
    {
        category: "Account & Privacy",
        question: "Is my personal student schedule kept private?",
        answer: "Yes! All schedules are encrypted in Cloudflare R2 and Firebase Firestore using strict security rules scoped to your university and section."
    },
    {
        category: "Account & Privacy",
        question: "How do I update my section or semester info?",
        answer: "Navigate to Dashboard > Settings > Academic Info to update your university, stream, semester, or section at any time."
    },
    {
        category: "General Inquiries",
        question: "Can I export my routine to Google Calendar?",
        answer: "We are actively developing calendar export integration. Stay tuned for version 2.5 release updates."
    }
];

const useSupportTickets = (activeTab) => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user || activeTab !== "history") {
            setTickets([]);
            return;
        }

        setLoading(true);
        setError(null);

        const q = query(
            collection(db, "support_tickets"),
            where("userId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                fetched.sort((a, b) => {
                    const timeA = a.createdAt?.toMillis?.() || 0;
                    const timeB = b.createdAt?.toMillis?.() || 0;
                    return timeB - timeA;
                });
                setTickets(fetched);
                setLoading(false);
            },
            (err) => {
                console.error("Support ticket listener error:", err);
                setError("Unable to sync tickets. Check connection.");
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [activeTab]);

    return { tickets, loading, error };
};

const Support = ({ onBack, initialTab }) => {
    const supportCategories = [
        {
            title: "Technical Support",
            description: "Issues with AI scans, data sync, or platform performance.",
            icon: LifeBuoy,
            color: "bg-indigo-50 text-indigo-600 border-indigo-100",
        },
        {
            title: "Account & Privacy",
            description: "Managing your profile, data deletion, and secure login.",
            icon: ShieldCheck,
            color: "bg-emerald-50 text-emerald-600 border-emerald-100",
        },
        {
            title: "General Inquiries",
            description: "Questions about features, usage, or upcoming updates.",
            icon: HelpCircle,
            color: "bg-blue-50 text-blue-600 border-blue-100",
        },
    ];

    const [formData, setFormData] = useState({
        category: "Technical Support",
        subject: "",
        message: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [activeTab, setActiveTab] = useState("submit");
    const [statusFilter, setStatusFilter] = useState("all");
    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const [userReplies, setUserReplies] = useState({});
    const [isReplying, setIsReplying] = useState({});
    const [portalSettings, setPortalSettings] = useState({
        supportEmail: "support@sumanonline.com",
        whatsappNumber: "+91",
        categories: ["Technical Support", "Account & Privacy", "General Inquiries"]
    });

    const { tickets: userTickets, loading: isLoadingTickets } = useSupportTickets(activeTab);

    useEffect(() => {
        const settingsRef = doc(db, "settings", "support_portal");
        const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                setPortalSettings((prev) => ({ ...prev, ...docSnap.data() }));
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const handleSendReply = useCallback(async (ticketId, ticket) => {
        const message = userReplies[ticketId];
        if (!message || !message.trim()) return;

        try {
            setIsReplying((prev) => ({ ...prev, [ticketId]: true }));

            const replyObj = {
                sender: "user",
                message: message.trim(),
                timestamp: new Date().toISOString()
            };

            const ticketRef = doc(db, "support_tickets", ticketId);
            const existingReplies = ticket.replies || [];

            await updateDoc(ticketRef, {
                replies: [...existingReplies, replyObj],
                status: "open",
                updatedAt: serverTimestamp()
            });

            setUserReplies((prev) => ({ ...prev, [ticketId]: "" }));
        } catch (error) {
            console.error("Error sending reply:", error);
            alert("Failed to send reply. Please try again.");
        } finally {
            setIsReplying((prev) => ({ ...prev, [ticketId]: false }));
        }
    }, [userReplies]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.subject.trim() || !formData.message.trim()) {
            setSubmitStatus("error");
            setErrorMessage("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus("idle");

        try {
            const user = auth.currentUser;

            await addDoc(collection(db, "support_tickets"), {
                userId: user?.uid || "anonymous",
                userEmail: user?.email || "unknown",
                userName: user?.displayName || "Student",
                category: formData.category,
                subject: formData.subject.trim(),
                message: formData.message.trim(),
                status: "open",
                createdAt: serverTimestamp()
            });

            setSubmitStatus("success");
            setFormData({ category: "Technical Support", subject: "", message: "" });
            setTimeout(() => setSubmitStatus("idle"), 5000);
        } catch (error) {
            console.error("Error submitting ticket:", error);
            setSubmitStatus("error");
            setErrorMessage(`Failed to send message: ${error.message || "Unknown error"}. Please try again later.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredTickets = userTickets.filter((t) => {
        if (statusFilter === "all") return true;
        return t.status === statusFilter;
    });

    return (
        <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-slate-950 font-sans antialiased">
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 sm:px-12 sm:py-6">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="group flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold transition-all active:scale-95"
                    >
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
                            <ArrowLeft size={18} />
                        </div>
                        <span className="hidden sm:inline">Dashboard</span>
                    </button>

                    <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-sm">
                        <LifeBuoy size={16} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300">Support Portal</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 sm:py-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col mb-12">
                    <h1 className="text-4xl sm:text-6xl font-black text-slate-950 dark:text-white tracking-tighter mb-4">
                        How can we <span className="text-indigo-600 dark:text-indigo-400">help you?</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm sm:text-lg max-w-2xl leading-relaxed">
                        Get expert assistance with your StudentHub experience. From technical glitches to feature requests, our support engine is here for you.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    {supportCategories.map((cat, i) => (
                        <div
                            key={i}
                            onClick={() => {
                                setFormData((prev) => ({ ...prev, category: cat.title }));
                                setActiveTab("submit");
                            }}
                            className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all group flex flex-col items-center text-center cursor-pointer"
                        >
                            <div className={`p-6 rounded-[2rem] mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform ${cat.color} ${cat.color.replace('bg-', 'dark:bg-').replace('text-', 'dark:text-').replace('border-', 'dark:border-')} border`}>
                                <cat.icon size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 truncate w-full">{cat.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold leading-relaxed mb-6">{cat.description}</p>
                            <div className="mt-auto flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest">
                                Select Category <ChevronRight size={14} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 dark:border-slate-800 mb-12 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <HelpCircle size={20} className="text-indigo-600 dark:text-indigo-400" />
                        <span>Frequently Asked Questions</span>
                    </h3>
                    <div className="space-y-3">
                        {FAQ_ITEMS.map((faq, idx) => {
                            const isOpen = openFaqIndex === idx;
                            return (
                                <div key={idx} className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors">
                                    <button
                                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                                        className="w-full p-4 text-left font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        <span>{faq.question}</span>
                                        <ChevronDown size={18} className={cn("transition-transform text-slate-400", isOpen && "rotate-180")} />
                                    </button>
                                    {isOpen && (
                                        <div className="px-4 pb-4 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-50 dark:border-slate-800/50 pt-3 bg-slate-50/30 dark:bg-slate-900/30">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl w-fit">
                        <button
                            onClick={() => setActiveTab("submit")}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                activeTab === "submit"
                                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            Submit Ticket
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                activeTab === "history"
                                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            <span>My Tickets</span>
                            {userTickets.length > 0 && (
                                <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold">
                                    {userTickets.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {activeTab === "history" && (
                        <div className="flex items-center gap-2">
                            <Filter size={14} className="text-slate-400" />
                            {["all", "open", "replied", "resolved"].map((st) => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border",
                                        statusFilter === st
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                            : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                    )}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {activeTab === "submit" && (
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 sm:p-12 shadow-2xl shadow-indigo-500/5 dark:shadow-none border border-slate-100 dark:border-slate-800 mb-16 relative overflow-hidden animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl -z-10 opacity-50 translate-x-1/2 -translate-y-1/2" />

                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-950 rounded-2xl text-indigo-600 dark:text-indigo-400">
                                <Send size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Submit a Ticket</h2>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">We'll get back to you as soon as possible.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500/20 transition-all appearance-none cursor-pointer"
                                    >
                                        {portalSettings.categories.map((cat, idx) => (
                                            <option key={idx} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        maxLength={100}
                                        placeholder="Brief summary of your issue"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Message</label>
                                    <span className="text-[10px] font-bold text-slate-400">{formData.message.length} / 1000</span>
                                </div>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    maxLength={1000}
                                    rows="5"
                                    placeholder="Please describe your issue in detail..."
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all resize-none font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                ></textarea>
                            </div>

                            {submitStatus === "error" && (
                                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-4 py-3 rounded-xl border border-rose-100 dark:border-rose-900/30 text-sm font-bold animate-in fade-in slide-in-from-bottom-2">
                                    <AlertCircle size={16} />
                                    {errorMessage}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 w-full sm:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-8 py-4 rounded-2xl font-black transition-all disabled:opacity-70 disabled:pointer-events-none shadow-lg shadow-indigo-600/20"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader inline size="sm" /> Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} /> Send Ticket
                                        </>
                                    )}
                                </button>

                                {submitStatus === "success" && (
                                    <div className="fixed top-6 left-1/2 -translate-x-1/2 sm:top-auto sm:bottom-8 sm:right-8 sm:left-auto sm:translate-x-0 z-[100] flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/90 text-emerald-600 dark:text-emerald-400 px-4 sm:px-5 py-3 rounded-2xl font-bold text-[13px] sm:text-[14px] whitespace-nowrap animate-in slide-in-from-top-8 sm:slide-in-from-bottom-8 zoom-in-95 fade-in duration-500 shadow-xl shadow-emerald-500/10 border border-emerald-200 dark:border-emerald-800/50 backdrop-blur-md">
                                        <CheckCircle2 size={20} className="animate-[bounce_2s_ease-in-out_infinite] text-emerald-500 shrink-0" />
                                        Your ticket has been submitted!
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === "history" && (
                    <div className="space-y-8 mb-16 animate-in fade-in slide-in-from-right-4 duration-500">
                        {isLoadingTickets ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-4 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800">
                                <Loader />
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Syncing History...</p>
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-indigo-500/5">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                                    <FileText size={40} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No tickets found</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold max-w-xs mx-auto">No tickets match the selected status filter.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {filteredTickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-indigo-500/5 hover:shadow-2xl transition-all group overflow-hidden"
                                    >
                                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
                                            <div className="flex items-start gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                                                    ticket.status === "open" ? "bg-amber-50 text-amber-600" :
                                                        ticket.status === "replied" ? "bg-indigo-50 text-indigo-600" :
                                                            "bg-emerald-50 text-emerald-600"
                                                )}>
                                                    {ticket.status === "replied" ? <MessageCircle size={24} /> :
                                                        ticket.status === "resolved" ? <CheckCircle2 size={24} /> : <FileText size={24} />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                            ticket.status === "open" ? "bg-amber-100 text-amber-700" :
                                                                ticket.status === "replied" ? "bg-indigo-100 text-indigo-700" :
                                                                    "bg-emerald-100 text-emerald-700"
                                                        )}>
                                                            {ticket.status}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400">#{ticket.id.slice(-6).toUpperCase()}</span>
                                                    </div>
                                                    <h3 className="text-lg font-black text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">{ticket.subject}</h3>
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter sm:text-right">
                                                {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Just now"}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">"{ticket.message}"</p>
                                            </div>

                                            {ticket.replies && ticket.replies.length > 0 && (
                                                <div className="pt-4 space-y-4">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest px-2">
                                                        <Cpu size={14} /> Official Response
                                                    </div>
                                                    {ticket.replies.map((reply, idx) => (
                                                        <div key={idx} className={cn(
                                                            "flex flex-col gap-2 animate-in slide-in-from-bottom-2",
                                                            reply.sender === "admin" ? "items-start" : "items-end"
                                                        )}>
                                                            <div className={cn(
                                                                "p-5 rounded-[2rem] text-sm font-bold leading-relaxed max-w-[90%] shadow-sm",
                                                                reply.sender === "admin"
                                                                    ? "bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800/30 text-slate-800 dark:text-slate-200 rounded-tl-none"
                                                                    : "bg-indigo-600 text-white rounded-tr-none"
                                                            )}>
                                                                <p>{reply.message}</p>
                                                            </div>
                                                            <div className={cn(
                                                                "flex items-center gap-2 px-2 text-[9px] font-black uppercase tracking-widest",
                                                                reply.sender === "admin" ? "text-indigo-400" : "text-slate-400 text-right"
                                                            )}>
                                                                <span>{reply.sender === "admin" ? "Support Agent" : "You"}</span>
                                                                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                                                                <span className="font-bold lowercase tracking-normal">
                                                                    {new Date(reply.timestamp).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {ticket.status !== "resolved" ? (
                                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                                    <div className="flex gap-3">
                                                        <div className="relative flex-1 group/reply">
                                                            <input
                                                                type="text"
                                                                placeholder="Type your reply here..."
                                                                value={userReplies[ticket.id] || ""}
                                                                onChange={(e) => setUserReplies((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                                                                disabled={isReplying[ticket.id]}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter" && !e.shiftKey) {
                                                                        e.preventDefault();
                                                                        handleSendReply(ticket.id, ticket);
                                                                    }
                                                                }}
                                                                className="w-full bg-slate-50 dark:bg-slate-950/40 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white dark:focus:bg-slate-900 rounded-[1.5rem] px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-200 placeholder-slate-400 transition-all outline-none"
                                                            />
                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                                <button
                                                                    onClick={() => handleSendReply(ticket.id, ticket)}
                                                                    disabled={!userReplies[ticket.id]?.trim() || isReplying[ticket.id]}
                                                                    className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white flex items-center justify-center transition-all active:scale-90 shadow-md shadow-indigo-500/20 disabled:shadow-none"
                                                                >
                                                                    {isReplying[ticket.id] ? (
                                                                        <Loader inline size="xs" color="white" />
                                                                    ) : (
                                                                        <Send size={16} />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="mt-2 ml-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                        {ticket.status === "replied" ? "Reply to the support team" : "Send an additional message"}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center">
                                                    <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-6 py-3 rounded-full border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                                                        <CheckCircle2 size={16} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Ticket Resolved • Closed</span>
                                                    </div>
                                                </div>
                                            )}

                                            {ticket.status === "open" && !ticket.replies?.length && (
                                                <div className="pt-4 flex items-center gap-2 text-amber-500 px-2 transition-pulse">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Waiting for Review</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-slate-950 dark:bg-slate-900 rounded-[3rem] p-8 sm:p-12 text-white relative overflow-hidden group border border-white/5 dark:border-slate-800">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-500/10 blur-[100px]" />

                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                                    <MessageCircle size={24} className="text-indigo-400" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400">Direct Contact</span>
                            </div>
                            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">Still need answers?</h2>
                            <p className="text-slate-400 font-medium text-sm sm:text-lg max-w-lg mb-8">
                                Our team usually responds within 24 hours. Connect with us via email or official channels.
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <a
                                    href={`mailto:${portalSettings.supportEmail}`}
                                    className="flex items-center gap-3 bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white px-8 py-4 rounded-2xl font-black transition-all hover:bg-amber-600 dark:hover:bg-amber-500 hover:text-white active:scale-95 shadow-xl shadow-amber-500/10 border border-white/10"
                                >
                                    <Mail size={18} />
                                    Email Support
                                </a>
                                <a
                                    href={`https://wa.me/${portalSettings.whatsappNumber.replace(/[^0-9]/g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 bg-white/5 border border-white/10 dark:border-slate-700 px-8 py-4 rounded-2xl font-black text-white transition-all hover:bg-white/10 active:scale-95 group/call"
                                >
                                    <Smartphone size={18} className="text-slate-400 group-hover/call:text-white transition-colors" />
                                    Call Us
                                </a>
                            </div>
                        </div>

                        <div className="hidden lg:flex flex-col items-center gap-4 bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 min-w-[300px]">
                            <div className="text-center mb-6">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Developer Hub</p>
                                <p className="text-xs font-bold text-white">Suman Chakraborty</p>
                            </div>
                            <div className="w-full h-px bg-white/10" />
                            <div className="flex items-center gap-3 text-emerald-400 mt-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Engineering Status: OK</span>
                            </div>
                            <a
                                href="https://SumanOnline.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-6 flex items-center gap-2 text-indigo-400 font-black text-xs hover:text-white transition-colors"
                            >
                                Visit SumanOnline <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="mt-8 py-10 w-full shrink-0 flex flex-col items-center justify-center relative">
                <div className="absolute top-0 w-full max-w-xl h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />

                <div className="flex items-center gap-3 mb-6 mt-4">
                    <div className="w-12 h-px bg-slate-200 dark:bg-slate-700/50" />
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Cpu size={14} className="text-indigo-500" />
                    </div>
                    <div className="w-12 h-px bg-slate-200 dark:bg-slate-700/50" />
                </div>

                <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2">
                    &copy; 2023 - 2026 <span className="text-indigo-600 dark:text-indigo-400">STUDENTHUB</span>
                </p>

                <div className="flex items-center justify-center gap-2 mb-8">
                    <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">System Maintained By</span>
                    <a
                        href="https://SumanOnline.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-black tracking-wider text-slate-800 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase"
                    >
                        SumanOnline.Com
                    </a>
                </div>

                <div className="flex items-center gap-6">
                    <Link to="/privacy-policy" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest">Privacy Policy</Link>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <Link to="/terms-of-service" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest">Terms of Service</Link>
                </div>
            </footer>
        </div>
    );
};

export default Support;
