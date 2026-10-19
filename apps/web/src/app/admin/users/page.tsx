"use client";

import React, { useEffect, useState } from "react";
import { fetchApi } from "../../../lib/api";
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New user form
  const [schoolId, setSchoolId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [department, setDepartment] = useState("College of Information and Communication Technology");
  const [yearLevel, setYearLevel] = useState("1st Year");

  const loadUsers = async () => {
    try {
      const res = await fetchApi("/users");
      if (res.success && res.data) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error("Users load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi("/users", {
        method: "POST",
        body: JSON.stringify({
          schoolId,
          email,
          password,
          firstName,
          lastName,
          role,
          department,
          yearLevel,
        }),
      });

      if (res.success) {
        setShowCreateModal(false);
        setSchoolId("");
        setEmail("");
        setPassword("");
        setFirstName("");
        setLastName("");
        loadUsers();
      }
    } catch (err: any) {
      alert(`User creation failed: ${err.message}`);
    }
  };

  const toggleUserActive = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetchApi(`/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.success) {
        loadUsers();
      }
    } catch (err: any) {
      alert(`Failed to update user status: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">System Account Management</h1>
          <p className="text-xs text-navy-400 mt-1">
            Manage administrative privileges, COMELEC officer assignments, and student access policies.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New User</span>
        </button>
      </div>

      <div className="rounded-2xl bg-white border border-line shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-navy-600">
            <thead className="bg-paper text-navy-400 font-semibold border-b border-line uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">School ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-navy-400">
                    Loading accounts...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-paper transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-navy">{u.schoolId}</td>
                    <td className="py-3 px-4 font-semibold text-navy-600">
                      {u.lastName}, {u.firstName}
                    </td>
                    <td className="py-3 px-4 text-navy-400">{u.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          u.role === "SYSTEM_ADMIN"
                            ? "bg-navy-100 text-navy-800 border border-navy-200"
                            : u.role === "COMELEC_OFFICER"
                            ? "bg-leaf-50 text-leaf-700 border border-leaf-200"
                            : "bg-paper text-navy-500 border border-line"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-navy-400">{u.department}</td>
                    <td className="py-3 px-4">
                      {u.isActive ? (
                        <span className="text-leaf-600 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center space-x-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => toggleUserActive(u.id, u.isActive)}
                        className="text-[11px] font-medium text-navy-600 hover:text-brand-700 px-2 py-1 rounded-lg bg-paper hover:bg-brand-50 border border-line hover:border-brand-300 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50">
          <div className="max-w-md w-full bg-white border border-line rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-navy">Create System User</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-navy-500 font-semibold mb-1">School ID</label>
                <input
                  type="text"
                  required
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  placeholder="e.g. 2024-00999"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-line text-navy placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-navy-500 font-semibold mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-line text-navy placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-navy-500 font-semibold mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-line text-navy placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-navy-500 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-line text-navy placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-navy-500 font-semibold mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-line text-navy placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-navy-500 font-semibold mb-1">System Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-line text-navy placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="COMELEC_OFFICER">COMELEC_OFFICER</option>
                  <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-paper text-navy-600 border border-line hover:bg-brand-50 hover:border-brand-300 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 text-white font-semibold transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
