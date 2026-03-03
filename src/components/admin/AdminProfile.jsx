import React from "react";
import {
    User,
    Mail,
    ShieldCheck,
    Calendar,
    Key,
    Edit3,
    Loader2,
    Save,
    X
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import defaultProfileImg from "../../assets/gojo-prof.jpg";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const AdminProfile = ({ userName, userEmail }) => {
    const [photoBase64, setPhotoBase64] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(userName || "Admin User");

    useEffect(() => {
        const fetchPhoto = async () => {
            const user = auth.currentUser;
            if (!user) return;
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists() && userDoc.data().photoBase64) {
                    setPhotoBase64(userDoc.data().photoBase64);
                }
            } catch (err) {
                console.error("Error fetching photo", err);
            }
        };
        fetchPhoto();
    }, []);

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 1024 * 1024) {
            alert("Image size exceeds 1 MB limit!");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result;
            setPhotoBase64(base64);

            // Save immediately
            const user = auth.currentUser;
            if (user) {
                setSaving(true);
                try {
                    await setDoc(doc(db, "users", user.uid), { photoBase64: base64 }, { merge: true });
                } catch (err) {
                    console.error("Error saving photo", err);
                } finally {
                    setSaving(false);
                }
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSaveName = async () => {
        const user = auth.currentUser;
        if (!user) return;
        setSaving(true);
        try {
            await updateProfile(user, { displayName: editName });
            await setDoc(doc(db, "users", user.uid), { fullName: editName, name: editName }, { merge: true });
            setIsEditing(false);
            window.location.reload();
        } catch (err) {
            console.error("Error saving profile", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

            {/* Title */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage your administrative details and security</p>
                </div>

                <div className="flex items-center gap-3">
                    {saving && <span className="text-sm text-indigo-500 font-medium animate-pulse">Saving...</span>}
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditName(userName || "Admin User");
                                }}
                                disabled={saving}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                            >
                                <X size={16} /> Cancel
                            </button>
                            <button
                                onClick={handleSaveName}
                                disabled={saving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md shadow-emerald-500/20 text-sm font-medium flex items-center gap-2"
                            >
                                <Save size={16} /> Save Profile
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md shadow-indigo-500/20 text-sm font-medium flex items-center gap-2"
                        >
                            <Edit3 size={16} /> Edit Profile
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Profile Card */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col items-center p-8">
                        <div className="relative mb-6 group/avatar">
                            <div className="w-28 h-28 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner border-4 border-white overflow-hidden relative">
                                <img
                                    src={photoBase64 || defaultProfileImg}
                                    alt="Admin Profile"
                                    className="w-full h-full object-cover"
                                />
                                {isEditing && (
                                    <label className="absolute inset-0 bg-slate-900/40 text-white flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer text-xs font-bold tracking-widest uppercase">
                                        Change
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                            <div className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full z-10"></div>
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 text-center">{isEditing ? editName : (userName || "Admin User")}</h3>
                        <p className="text-slate-500 text-sm mb-4 text-center">{userEmail || "admin@studenthub.com"}</p>

                        <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                            <ShieldCheck size={14} /> System Administrator
                        </div>

                        <div className="w-full flex justify-center gap-4 pt-6 border-t border-slate-100">
                            <div className="text-center">
                                <p className="font-bold text-slate-800 text-lg">152</p>
                                <p className="text-slate-500 text-xs">Actions</p>
                            </div>
                            <div className="w-px bg-slate-100"></div>
                            <div className="text-center">
                                <p className="font-bold text-slate-800 text-lg">45</p>
                                <p className="text-slate-500 text-xs">Logins</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800">Personal Information</h3>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                        <User size={14} /> Full Name
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full bg-white border border-indigo-300 px-4 py-2.5 rounded-lg text-slate-900 text-[15px] font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                        />
                                    ) : (
                                        <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-lg text-slate-700 text-[15px] font-medium">
                                            {userName || "Admin User"}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                        <Mail size={14} /> Email Address
                                    </label>
                                    <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-lg text-slate-700 text-[15px] font-medium">
                                        {userEmail || "admin@studenthub.com"}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                        <ShieldCheck size={14} /> Role
                                    </label>
                                    <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-lg text-slate-700 text-[15px] font-medium">
                                        Administrator
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                        <Calendar size={14} /> Account Created
                                    </label>
                                    <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-lg text-slate-700 text-[15px] font-medium">
                                        January 15, 2026
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><Key size={20} /></div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 leading-tight">Security Settings</h3>
                                <p className="text-slate-500 text-xs">Manage your password and authentication</p>
                            </div>
                        </div>

                        <div className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-slate-800 text-sm">Account Password</h4>
                                <p className="text-slate-500 text-xs mt-1">Last changed 3 months ago</p>
                            </div>
                            <button className="bg-white border border-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-slate-50 transition-colors">
                                Change Password
                            </button>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
};

export default AdminProfile;
