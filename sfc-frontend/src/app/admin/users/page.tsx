"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  MoreVertical,
  Mail,
  Shield,
  ShieldCheck,
  Calendar,
  User,
} from "lucide-react";
import { Button, Input, Card, Badge, Select } from "@/components/ui";
import { formatDate } from "@/lib/utils";

// Mock users data - in a real app, this would come from an API
const mockUsers = [
  {
    id: "1",
    email: "john@example.com",
    role: "member",
    is_verified: true,
    created_at: "2024-01-15T10:00:00Z",
    onboarding_completed: true,
    enrollments: 2,
  },
  {
    id: "2",
    email: "sarah@example.com",
    role: "member",
    is_verified: true,
    created_at: "2024-02-20T14:30:00Z",
    onboarding_completed: true,
    enrollments: 3,
  },
  {
    id: "3",
    email: "mike@example.com",
    role: "member",
    is_verified: true,
    created_at: "2024-03-10T09:15:00Z",
    onboarding_completed: false,
    enrollments: 0,
  },
  {
    id: "4",
    email: "admin@sfcfitness.com",
    role: "admin",
    is_verified: true,
    created_at: "2024-01-01T00:00:00Z",
    onboarding_completed: true,
    enrollments: 0,
  },
  {
    id: "5",
    email: "emma@example.com",
    role: "member",
    is_verified: false,
    created_at: "2024-03-25T16:45:00Z",
    onboarding_completed: false,
    enrollments: 0,
  },
  {
    id: "6",
    email: "james@example.com",
    role: "member",
    is_verified: true,
    created_at: "2024-03-28T11:20:00Z",
    onboarding_completed: true,
    enrollments: 1,
  },
];

const roleOptions = [
  { value: "", label: "All Roles" },
  { value: "member", label: "Members" },
  { value: "admin", label: "Admins" },
];

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Unverified" },
];

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "verified" && user.is_verified) ||
      (statusFilter === "unverified" && !user.is_verified);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: mockUsers.length,
    verified: mockUsers.filter((u) => u.is_verified).length,
    admins: mockUsers.filter((u) => u.role === "admin").length,
    newThisMonth: mockUsers.filter((u) => {
      const created = new Date(u.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length,
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-display font-bold text-dark-100">Users</h1>
        <p className="text-dark-400 mt-1">Manage user accounts and permissions</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <Card padding="md">
          <p className="text-2xl font-bold text-dark-100">{stats.total}</p>
          <p className="text-sm text-dark-400">Total Users</p>
        </Card>
        <Card padding="md">
          <p className="text-2xl font-bold text-accent-emerald">{stats.verified}</p>
          <p className="text-sm text-dark-400">Verified</p>
        </Card>
        <Card padding="md">
          <p className="text-2xl font-bold text-primary-400">{stats.admins}</p>
          <p className="text-sm text-dark-400">Admins</p>
        </Card>
        <Card padding="md">
          <p className="text-2xl font-bold text-accent-cyan">{stats.newThisMonth}</p>
          <p className="text-sm text-dark-400">New This Month</p>
        </Card>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 mb-6"
      >
        <div className="flex-1">
          <Input
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>
        <div className="flex gap-4">
          <Select
            options={roleOptions}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-32"
          />
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36"
          />
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card padding="none">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-4 px-6 text-sm font-medium text-dark-400">
                    User
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-dark-400">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-dark-400">
                    Role
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-dark-400">
                    Enrollments
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-dark-400">
                    Joined
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-dark-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-dark-800 hover:bg-dark-800/30 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-dark-100">{user.email}</p>
                          {user.onboarding_completed ? (
                            <p className="text-xs text-dark-500">Onboarding complete</p>
                          ) : (
                            <p className="text-xs text-accent-gold">Pending onboarding</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={user.is_verified ? "success" : "warning"}>
                        {user.is_verified ? "Verified" : "Unverified"}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={user.role === "admin" ? "primary" : "default"}>
                        {user.role === "admin" ? (
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Admin
                          </span>
                        ) : (
                          "Member"
                        )}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-dark-200">{user.enrollments}</span>
                    </td>
                    <td className="py-4 px-6 text-dark-400 text-sm">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button variant="ghost" size="sm" className="p-2">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-dark-800">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-dark-100 text-sm">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={user.is_verified ? "success" : "warning"}
                          size="sm"
                        >
                          {user.is_verified ? "Verified" : "Unverified"}
                        </Badge>
                        <Badge
                          variant={user.role === "admin" ? "primary" : "default"}
                          size="sm"
                        >
                          {user.role === "admin" ? "Admin" : "Member"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="p-2">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-xs text-dark-400">
                  <span>{user.enrollments} enrollments</span>
                  <span>Joined {formatDate(user.created_at)}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-dark-400">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No users found matching your criteria</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Pagination placeholder */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-dark-500">
          Showing {filteredUsers.length} of {mockUsers.length} users
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" disabled>
            Previous
          </Button>
          <Button variant="secondary" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

