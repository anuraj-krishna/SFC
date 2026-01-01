"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Dumbbell,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Eye,
  UserPlus,
  Calendar,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { adminApi, type Program } from "@/lib/api";

export default function AdminDashboardPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data } = await adminApi.listPrograms({ limit: 5 });
      if (data) {
        setPrograms(data);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const publishedCount = programs.filter((p) => p.is_published).length;
  const featuredCount = programs.filter((p) => p.is_featured).length;

  // Mock stats - in a real app, these would come from an API
  const stats = [
    {
      label: "Total Users",
      value: "1,248",
      change: "+12%",
      icon: Users,
      color: "from-primary-500 to-primary-600",
    },
    {
      label: "Active Programs",
      value: publishedCount.toString(),
      change: `${programs.length} total`,
      icon: Dumbbell,
      color: "from-accent-cyan to-blue-500",
    },
    {
      label: "Enrollments",
      value: "3,421",
      change: "+8%",
      icon: TrendingUp,
      color: "from-accent-emerald to-green-500",
    },
    {
      label: "Active Today",
      value: "342",
      change: "27%",
      icon: Activity,
      color: "from-accent-gold to-orange-500",
    },
  ];

  const recentActivity = [
    { type: "signup", user: "john@example.com", time: "2 min ago", icon: UserPlus },
    { type: "enrollment", user: "sarah@example.com", time: "5 min ago", icon: Dumbbell },
    { type: "completion", user: "mike@example.com", time: "12 min ago", icon: Activity },
    { type: "signup", user: "emma@example.com", time: "25 min ago", icon: UserPlus },
    { type: "enrollment", user: "james@example.com", time: "1 hour ago", icon: Dumbbell },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-display font-bold text-dark-100">Dashboard</h1>
        <p className="text-dark-400 mt-1">
          Welcome back! Here&apos;s what&apos;s happening.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card padding="md" className="relative overflow-hidden">
              <div
                className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} opacity-10 -translate-y-1/2 translate-x-1/2`}
              />
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}
                >
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-3xl font-bold text-dark-100">{stat.value}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-dark-400">{stat.label}</p>
                  <span className="text-xs text-accent-emerald">{stat.change}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Programs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-dark-100">Recent Programs</h2>
              <Link href="/admin/programs">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-dark-800/30 animate-pulse">
                    <div className="w-12 h-12 rounded-lg bg-dark-700" />
                    <div className="flex-1">
                      <div className="h-4 bg-dark-700 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-dark-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {programs.map((program) => (
                  <Link
                    key={program.id}
                    href={`/admin/programs/${program.id}`}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-dark-800/30 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-cyan/20 flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-dark-100 truncate group-hover:text-primary-300 transition-colors">
                        {program.title}
                      </p>
                      <p className="text-sm text-dark-400">
                        {program.duration_weeks} weeks • {program.days_per_week}x/week
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {program.is_published ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-accent-emerald/20 text-accent-emerald">
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-dark-700 text-dark-400">
                          Draft
                        </span>
                      )}
                      <Eye className="w-4 h-4 text-dark-500 group-hover:text-dark-300" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <h2 className="text-lg font-semibold text-dark-100 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === "signup"
                        ? "bg-accent-emerald/20 text-accent-emerald"
                        : activity.type === "enrollment"
                          ? "bg-primary-500/20 text-primary-400"
                          : "bg-accent-gold/20 text-accent-gold"
                    }`}
                  >
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-dark-200 truncate">{activity.user}</p>
                    <p className="text-xs text-dark-500">
                      {activity.type === "signup" && "New registration"}
                      {activity.type === "enrollment" && "Enrolled in program"}
                      {activity.type === "completion" && "Completed workout"}
                    </p>
                  </div>
                  <span className="text-xs text-dark-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-6">
            <h2 className="text-lg font-semibold text-dark-100 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/admin/programs/new">
                <Button variant="secondary" className="w-full justify-start" leftIcon={<Dumbbell className="w-4 h-4" />}>
                  Create Program
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="secondary" className="w-full justify-start" leftIcon={<Users className="w-4 h-4" />}>
                  Manage Users
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

