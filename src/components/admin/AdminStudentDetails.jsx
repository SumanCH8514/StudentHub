import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  UserMinus,
  Mail,
  User,
  MoreVertical,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Plus,
  Save
} from "lucide-react";
import Loader from "../Loader";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const AdminStudentDetails = ({ users = [], loading, deleteUser, addStudent, updateUser }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", email: "", role: "user" });
  const [editingUser, setEditingUser] = useState(null);
  const usersPerPage = 8;

  const filteredAndSortedUsers = useMemo(() => {
    let result = users.filter((u) => {
      const nameMatch = (u.fullName || u.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = (u.email || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch || emailMatch;

      const matchesRole =
        roleFilter === "All Roles" ||
        (u.role || "user").toLowerCase() === roleFilter.toLowerCase();

      return matchesSearch && matchesRole;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === "createdAt" && aValue?.seconds) {
          aValue = aValue.seconds;
          bValue = bValue?.seconds || 0;
        } else if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue?.toString().toLowerCase() || "";
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [users, searchTerm, roleFilter, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedUsers.length / usersPerPage);
  const currentUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await addStudent(newStudent);
    setIsSubmitting(false);
    if (result.success) {
      setIsAddModalOpen(false);
      setNewStudent({ name: "", email: "", role: "user" });
    } else {
      alert("Error: " + result.error);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser({ ...user });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await updateUser(editingUser.id || editingUser.uid, {
      name: editingUser.fullName || editingUser.name,
      fullName: editingUser.fullName || editingUser.name,
      role: editingUser.role
    });
    setIsSubmitting(false);
    if (result.success) {
      setIsEditModalOpen(false);
      setEditingUser(null);
    } else {
      alert("Error: " + result.error);
    }
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={12} className="ml-1 opacity-50" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp size={12} className="ml-1 text-blue-600 dark:text-blue-400" />
    ) : (
      <ArrowDown size={12} className="ml-1 text-blue-600 dark:text-blue-400" />
    );
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6 w-full max-w-7xl mx-auto pb-10 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Student Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage and audit registered student accounts
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <div className="bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-slate-700 dark:text-slate-200 font-bold text-xs">Total: {users.length}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Users size={14} /> <span>Add New Student</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/80 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs font-medium outline-none"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <select
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 px-3 py-2 outline-none w-full sm:w-auto cursor-pointer"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="All Roles">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User / Student</option>
            </select>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
            <thead className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700/80">
              <tr>
                <th
                  scope="col"
                  className="px-5 py-3.5 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    User <SortIcon columnKey="name" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-5 py-3.5 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition-colors"
                  onClick={() => handleSort("role")}
                >
                  <div className="flex items-center">
                    Role <SortIcon columnKey="role" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-5 py-3.5 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition-colors"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center">
                    Joined <SortIcon columnKey="createdAt" />
                  </div>
                </th>
                <th scope="col" className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <Loader inline size="md" message="Loading records..." />
                  </td>
                </tr>
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400 text-xs">
                    No matching student records found.
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => {
                  const initial = (user.fullName || user.name || user.email || "S")[0].toUpperCase();
                  const dateStr = user.createdAt?.toDate
                    ? user.createdAt.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : user.createdAt?.seconds
                    ? new Date(user.createdAt.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "Recent";

                  return (
                    <tr
                      key={user.id || user.uid}
                      className="bg-white dark:bg-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {user.photoBase64 ? (
                            <img
                              src={user.photoBase64}
                              alt=""
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs",
                              user.role === "admin"
                                ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                                : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            )}>
                              {initial}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                              {user.fullName || user.name || "Student"}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5 text-[11px] truncate">
                              <Mail size={11} className="shrink-0 text-slate-400" /> {user.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={cn(
                          "px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider inline-flex items-center gap-1",
                          user.role === "admin"
                            ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        )}>
                          {user.role === "admin" && <ShieldAlert size={11} className="shrink-0" />}
                          <span>{user.role || "user"}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                          {dateStr}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditClick(user)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <MoreVertical size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteUser(user.id || user.uid)}
                            disabled={user.role === "admin"}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
                            title="Delete User"
                          >
                            <UserMinus size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:px-6 border-t border-slate-100 dark:border-slate-700/80 bg-white dark:bg-slate-800 gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Showing <span className="font-bold text-slate-800 dark:text-slate-200">{filteredAndSortedUsers.length === 0 ? 0 : (currentPage - 1) * usersPerPage + 1}</span> to <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(currentPage * usersPerPage, filteredAndSortedUsers.length)}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{filteredAndSortedUsers.length}</span> records
          </span>
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={15} />
            </button>
            <div className="px-3 py-1 flex items-center justify-center text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-lg">
              {currentPage} / {totalPages || 1}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Add New Student</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Create a student registration record</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Student Name</label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs font-semibold outline-none"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                  <input
                    type="email"
                    required
                    placeholder="email@university.edu"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs font-semibold outline-none"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Assigned Role</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs font-semibold outline-none cursor-pointer"
                  value={newStudent.role}
                  onChange={(e) => setNewStudent({ ...newStudent, role: e.target.value })}
                >
                  <option value="user">Standard User (Student)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader inline size="sm" /> : <Plus size={15} />}
                  <span>{isSubmitting ? "Adding..." : "Add Student"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                  <MoreVertical size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Edit Student</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium truncate max-w-xs">{editingUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingUser(null);
                }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Student Name</label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs font-semibold outline-none"
                    value={editingUser.fullName || editingUser.name || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1 opacity-70">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address (Read-only)</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    disabled
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed"
                    value={editingUser.email || ""}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Assigned Role</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs font-semibold outline-none cursor-pointer"
                  value={editingUser.role || "user"}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <option value="user">Standard User (Student)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader inline size="sm" /> : <Save size={15} />}
                  <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentDetails;
