"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Play,
  Flame,
  Target,
  Clock,
  ChevronRight,
  Sparkles,
  Dumbbell,
} from "lucide-react";
import { Button, Card, Badge, ProgressBar } from "@/components/ui";
import { ProgramCard } from "@/components/programs";
import { programsApi, type Program, type EnrollmentProgress } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { goalLabels, formatDuration, getYouTubeVideoId, getYouTubeThumbnail } from "@/lib/utils";

export default function DashboardPage() {
  const { user, profile } = useAuthStore();

  const [enrolledPrograms, setEnrolledPrograms] = useState<EnrollmentProgress[]>([]);
  const [recommendedPrograms, setRecommendedPrograms] = useState<Program[]>([]);
  const [recommendationReason, setRecommendationReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      // Load enrolled programs
      const { data: continueData } = await programsApi.getContinue();
      if (continueData) {
        setEnrolledPrograms(continueData.enrollments);
      }

      // Load recommendations
      const { data: recommendedData } = await programsApi.getRecommended(4);
      if (recommendedData) {
        setRecommendedPrograms(recommendedData.programs);
        setRecommendationReason(recommendedData.reason);
      }

      setIsLoading(false);
    }
    loadDashboard();
  }, []);

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "there";

  // Calculate stats
  const totalWorkouts = enrolledPrograms.reduce((sum, e) => sum + e.workouts_completed, 0);
  const totalMinutes = enrolledPrograms.reduce((sum, e) => sum + e.total_minutes_completed, 0);
  const maxStreak = Math.max(...enrolledPrograms.map((e) => e.streak_days), 0);
  const activePrograms = enrolledPrograms.filter((e) => e.is_active).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-display font-bold text-dark-100">
          Welcome back, <span className="gradient-text">{displayName}</span>!
        </h1>
        <p className="text-dark-400 mt-2">
          {enrolledPrograms.length > 0
            ? "Ready to continue your fitness journey?"
            : "Let's find the perfect program for you."}
        </p>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        {[
          { icon: Dumbbell, label: "Workouts", value: totalWorkouts.toString(), color: "text-primary-400" },
          { icon: Clock, label: "Total Time", value: formatDuration(totalMinutes), color: "text-accent-cyan" },
          { icon: Flame, label: "Day Streak", value: maxStreak.toString(), color: "text-accent-gold" },
          { icon: Target, label: "Active Programs", value: activePrograms.toString(), color: "text-accent-emerald" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <Card padding="md">
              <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-dark-100">{stat.value}</p>
              <p className="text-sm text-dark-400">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Continue Section */}
      {enrolledPrograms.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-dark-100">
              Continue Training
            </h2>
            <Link href="/programs" className="text-primary-400 hover:text-primary-300 text-sm">
              View All
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledPrograms.slice(0, 3).map((enrollment, index) => {
              const nextWorkout = enrollment.next_workout;
              const videoId = nextWorkout ? getYouTubeVideoId(nextWorkout.video_url) : null;
              const thumbnailUrl = videoId
                ? getYouTubeThumbnail(videoId, "high")
                : enrollment.program.thumbnail_url ||
                  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80";

              return (
                <motion.div
                  key={enrollment.enrollment_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Card variant="hover" padding="none" className="overflow-hidden">
                    {/* Thumbnail */}
                    <div className="relative aspect-video">
                      <Image
                        src={thumbnailUrl}
                        alt={enrollment.program.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/30 to-transparent" />

                      {/* Play Button Overlay */}
                      {nextWorkout && (
                        <Link
                          href={`/programs/${enrollment.program.id}/workout/${nextWorkout.id}`}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="w-16 h-16 rounded-full bg-primary-500/90 flex items-center justify-center hover:scale-110 transition-transform">
                            <Play className="w-8 h-8 text-white ml-1" />
                          </div>
                        </Link>
                      )}

                      {/* Day Badge */}
                      <div className="absolute top-3 left-3">
                        <Badge variant="primary" size="md">
                          Day {enrollment.current_day}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-semibold text-dark-100 mb-1 line-clamp-1">
                        {enrollment.program.title}
                      </h3>
                      {nextWorkout && (
                        <p className="text-sm text-dark-400 mb-3">
                          Next: {nextWorkout.title}
                        </p>
                      )}

                      {/* Progress */}
                      <ProgressBar
                        value={enrollment.progress_percent}
                        size="sm"
                        className="mb-2"
                      />
                      <div className="flex items-center justify-between text-xs text-dark-400">
                        <span>
                          {enrollment.workouts_completed} / {enrollment.total_days} workouts
                        </span>
                        <span>{Math.round(enrollment.progress_percent)}%</span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-dark-700 text-sm text-dark-400">
                        <div className="flex items-center gap-1">
                          <Flame className="w-4 h-4 text-accent-gold" />
                          {enrollment.streak_days} day streak
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(enrollment.total_minutes_completed)}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Recommendations */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-dark-100 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary-400" />
              Recommended For You
            </h2>
            {recommendationReason && (
              <p className="text-sm text-dark-400 mt-1">{recommendationReason}</p>
            )}
          </div>
          <Link href="/programs">
            <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
              Browse All
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl glass p-5 animate-pulse">
                <div className="aspect-video rounded-xl bg-dark-700 mb-4" />
                <div className="h-6 bg-dark-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-dark-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : recommendedPrograms.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedPrograms.map((program, index) => (
              <ProgramCard key={program.id} program={program} index={index} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <Dumbbell className="w-12 h-12 text-dark-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-200 mb-2">No Recommendations Yet</h3>
            <p className="text-dark-400 mb-6">
              Complete your profile to get personalized program recommendations.
            </p>
            <Link href="/profile">
              <Button>Update Profile</Button>
            </Link>
          </Card>
        )}
      </motion.section>

      {/* Empty State - No Enrollments */}
      {enrolledPrograms.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <Card className="text-center py-16 bg-gradient-to-br from-primary-950/50 to-dark-900">
            <div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-6">
              <Target className="w-10 h-10 text-primary-400" />
            </div>
            <h2 className="text-2xl font-display font-bold text-dark-100 mb-3">
              Ready to Start Your Journey?
            </h2>
            <p className="text-dark-400 max-w-md mx-auto mb-8">
              Browse our curated fitness programs and find the perfect one that matches your
              goals and fitness level.
            </p>
            <Link href="/programs">
              <Button size="lg">Explore Programs</Button>
            </Link>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

