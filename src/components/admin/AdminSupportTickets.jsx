import React, { useState, useEffect } from "react";
import {
    collection,
    query,
    onSnapshot,
    orderBy,
    addDoc,
    doc,
    updateDoc,
    serverTimestamp,
    deleteDoc
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {
    MessageSquareText,
    Clock,
    CheckCircle2,
    XCircle,
    User,
    Mail,
    Search,
    Filter,
    ChevronRight,
    Trash2,
    MessageCircle,
    ArrowLeft,
    Send
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Loader from "../Loader";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const AdminSupportTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'open' | 'resolved' | 'closed'
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyMessage, setReplyMessage] = useState("");
    const [isSendingReply, setIsSendingReply] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "support_tickets"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const updateTicketStatus = async (ticketId, newStatus) => {
        try {
            await updateDoc(doc(db, "support_tickets", ticketId), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
            if (selectedTicket?.id === ticketId) {
                setSelectedTicket(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            console.error("Failed to update ticket status:", err);
            alert("Error updating status: " + err.message);
        }
    };

    const sendReply = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim() || !selectedTicket) return;

        setIsSendingReply(true);
        try {
            const ticketRef = doc(db, "support_tickets", selectedTicket.id);
            const newReply = {
                sender: "admin",
                message: replyMessage.trim(),
                timestamp: new Date().toISOString()
            };

            const existingReplies = selectedTicket.replies || [];

            await updateDoc(ticketRef, {
                replies: [...existingReplies, newReply],
                status: "replied",
                updatedAt: serverTimestamp()
            });

            // Create a notification for the user
            try {
                await addDoc(collection(db, "updates"), {
                    title: "Support Ticket Reply",
                    description: `Admin replied to: "${selectedTicket.subject}"`,
                    type: "notification",
                    targetUserId: selectedTicket.userId,
                    createdAt: serverTimestamp(),
                    isSupportReply: true // Metadata to identify support replies
                });
            } catch (notifyErr) {
                console.error("Failed to create notification:", notifyErr);
                // We don't block the reply if notification fails, but we log it
            }

            setReplyMessage("");
            // The onSnapshot listener will update the list, but we update the selected ticket view immediately for smoothness
            setSelectedTicket(prev => ({
                ...prev,
                replies: [...existingReplies, newReply],
                status: "replied"
            }));
        } catch (err) {
            console.error("Failed to send reply:", err);
            alert("Error sending reply: " + err.message);
        } finally {
            setIsSendingReply(false);
        }
    };

    const deleteTicket = async (ticketId) => {
        if (!window.confirm("Are you sure you want to permanently delete this ticket?")) return;
        try {
            await deleteDoc(doc(db, "support_tickets", ticketId));
            if (selectedTicket?.id === ticketId) setSelectedTicket(null);
        } catch (err) {
            console.error("Failed to delete ticket:", err);
            alert("Error deleting ticket: " + err.message);
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
        const matchesSearch =
            ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.userEmail?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    if (loading) return <div className="h-[400px] flex items-center justify-center"><Loader /></div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1 tracking-tight">Support Tickets</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Manage and respond to user inquiries.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Tickets List */}
                <div className={cn("lg:col-span-12 transition-all duration-300", selectedTicket ? "lg:col-span-4" : "lg:col-span-12")}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        {/* List Filters */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-2">
                            {["all", "open", "replied", "resolved"].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all",
                                        filterStatus === status
                                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 shadow-sm"
                                            : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                    )}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        {/* List Items */}
                        <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {filteredTickets.length === 0 ? (
                                <div className="p-12 text-center">
                                    <MessageSquareText size={48} className="mx-auto text-slate-200 mb-4" />
                                    <p className="text-slate-400 font-medium">No tickets found.</p>
                                </div>
                            ) : (
                                filteredTickets.map(ticket => (
                                    <button
                                        key={ticket.id}
                                        onClick={() => setSelectedTicket(ticket)}
                                        className={cn(
                                            "w-full text-left p-5 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all group",
                                            selectedTicket?.id === ticket.id ? "bg-amber-50/50 dark:bg-amber-900/10 border-l-4 border-amber-500" : "border-l-4 border-transparent"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                            ticket.status === 'open' ? 'bg-amber-100 text-amber-600' :
                                                ticket.status === 'replied' ? 'bg-indigo-100 text-indigo-600' :
                                                    ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                                        )}>
                                            {ticket.status === 'open' ? <Clock size={20} /> :
                                                ticket.status === 'replied' ? <MessageCircle size={20} /> :
                                                    ticket.status === 'resolved' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-bold text-slate-800 dark:text-white truncate pr-4">{ticket.subject}</p>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter whitespace-nowrap">
                                                    {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleDateString() : 'New'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="truncate font-medium">{ticket.userName}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                <span className="truncate">{ticket.category}</span>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Ticket Details View */}
                {selectedTicket && (
                    <div className="lg:col-span-8 animate-in slide-in-from-right-4 duration-300">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col h-[750px]">
                            {/* Detail Header */}
                            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setSelectedTicket(null)}
                                        className="lg:hidden p-2 text-slate-500 hover:bg-slate-200 rounded-lg"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                                                selectedTicket.status === 'open' ? 'bg-amber-100 text-amber-700' :
                                                    selectedTicket.status === 'replied' ? 'bg-indigo-100 text-indigo-700' :
                                                        selectedTicket.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                                            )}>
                                                {selectedTicket.status}
                                            </span>
                                            <span className="text-slate-400 text-[10px] font-bold">#{selectedTicket.id.slice(-6).toUpperCase()}</span>
                                        </div>
                                        <h3 className="font-black text-slate-800 dark:text-white leading-tight">{selectedTicket.subject}</h3>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteTicket(selectedTicket.id)}
                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                    title="Delete Ticket"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            {/* Detail Content (Scrollable conversation) */}
                            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar space-y-8 bg-slate-50/30 dark:bg-slate-900/20">
                                {/* User Info Card */}
                                <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-indigo-500 border border-slate-100 dark:border-slate-700">
                                        <User size={24} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-slate-800 dark:text-white truncate">{selectedTicket.userName}</p>
                                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 truncate">
                                            <Mail size={12} /> {selectedTicket.userEmail}
                                        </p>
                                    </div>
                                </div>

                                {/* Converstation History */}
                                <div className="space-y-6">
                                    {/* Original Message */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                                            <MessageCircle size={14} className="text-indigo-400" /> User Inquiry
                                        </div>
                                        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm relative">
                                            <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed font-medium">
                                                {selectedTicket.message}
                                            </p>
                                            <div className="text-[9px] font-black text-slate-400 text-right mt-4 uppercase tracking-tighter">
                                                Sent {selectedTicket.createdAt?.toDate ? selectedTicket.createdAt.toDate().toLocaleString() : 'Just now'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Replies List */}
                                    {selectedTicket.replies?.map((reply, idx) => (
                                        <div key={idx} className={cn("flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2", reply.sender === 'admin' ? "items-start" : "items-end")}>
                                            <div className={cn(
                                                "p-5 rounded-3xl text-sm max-w-[90%] shadow-md font-medium leading-relaxed",
                                                reply.sender === 'admin'
                                                    ? "bg-amber-50 dark:bg-amber-900/30 text-slate-800 dark:text-slate-200 border border-amber-200/50 dark:border-amber-800/30 rounded-tl-none"
                                                    : "bg-indigo-600 text-white rounded-tr-none"
                                            )}>
                                                <p>{reply.message}</p>
                                            </div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mx-3">
                                                {reply.sender === 'admin' ? 'Support Admin' : 'User'} • {new Date(reply.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Reply Input Area */}
                            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/80 backdrop-blur-sm">
                                <form onSubmit={sendReply} className="space-y-4">
                                    <div className="relative group">
                                        <textarea
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            placeholder="Compose your response to the user..."
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[2rem] px-6 py-5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all resize-none h-32 custom-scrollbar shadow-inner"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    sendReply(e);
                                                }
                                            }}
                                        />
                                        <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-400 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                                            Press Enter to Send
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex gap-2">
                                            {selectedTicket.status !== 'resolved' && (
                                                <button
                                                    type="button"
                                                    onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}
                                                    className="px-6 py-3 text-xs font-black text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 transition-all active:scale-95 uppercase tracking-widest"
                                                >
                                                    Mark Resolved
                                                </button>
                                            )}
                                            {selectedTicket.status === 'resolved' && (
                                                <button
                                                    type="button"
                                                    onClick={() => updateTicketStatus(selectedTicket.id, 'open')}
                                                    className="px-6 py-3 text-xs font-black text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-900/30 transition-all active:scale-95 uppercase tracking-widest"
                                                >
                                                    Reopen Ticket
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSendingReply || !replyMessage.trim()}
                                            className="flex items-center gap-3 px-10 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-sm font-black shadow-xl shadow-amber-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                                        >
                                            {isSendingReply ? <Loader inline size="sm" /> : <Send size={18} />}
                                            <span>{isSendingReply ? "Responding..." : "Send Response"}</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSupportTickets;
