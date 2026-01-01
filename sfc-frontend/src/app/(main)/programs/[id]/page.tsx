"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Clock,
  Calendar,
  Dumbbell,
  Play,
  ArrowLeft,
  Target,
  CheckCircle,
  Lock,
  ChevronRight,
} from "lucide-react";
import { Button, Badge, ProgressBar, Card } from "@/components/ui";
import { programsApi, type Program, type Workout, type EnrollmentProgress } from "@/lib/api";
import {
  goalLabels,
  difficultyLabels,
  difficultyColors,
  intensityLabels,
  intensityColors,
  formatDuration,
  getYouTubeVideoId,
  getYouTubeThumbnail,
} from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

interface ProgramWithWorkouts extends Program {
  workouts: Workout[];
  total_workouts: number;
}

export default function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [program, setProgram] = useState<ProgramWithWorkouts | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState("");

  useEffect(() => {
    async function loadProgram() {
      const { data } = await programsApi.getById(resolvedParams.id);
      if (data) {
        setProgram(data);
      }

      // Check if user is enrolled
      if (isAuthenticated) {
        const { data: progressData } = await programsApi.getProgress(resolvedParams.id);
        if (progressData) {
          setEnrollment(progressData);
        }
      }

      setIsLoading(false);
    }
    loadProgram();
  }, [resolvedParams.id, isAuthenticated]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/programs/${resolvedParams.id}`);
      return;
    }

    setIsEnrolling(true);
    setEnrollError("");

    const { data, error } = await programsApi.enroll(resolvedParams.id);

    if (error) {
      setEnrollError(error.message);
    } else if (data) {
      // Reload enrollment data
      const { data: progressData } = await programsApi.getProgress(resolvedParams.id);
      if (progressData) {
        setEnrollment(progressData);
      }
    }

    setIsEnrolling(false);
  };

  const handleUnenroll = async () => {
    const { error } = await programsApi.unenroll(resolvedParams.id);
    if (!error) {
      setEnrollment(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-dark-700 rounded w-32 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="aspect-video rounded-2xl bg-dark-700" />
              <div className="h-10 bg-dark-700 rounded w-3/4" />
              <div className="h-24 bg-dark-700 rounded" />
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-dark-700 rounded-2xl" />
              <div className="h-32 bg-dark-700 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="text-center py-20">
          <h2 className="text-2xl font-bold text-dark-100 mb-4">Program Not Found</h2>
          <p className="text-dark-400 mb-6">
            The program you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/programs">
            <Button>Browse Programs</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Group workouts by week
  const workoutsByWeek = program.workouts.reduce(
    (acc, workout) => {
      const week = workout.week_number;
      if (!acc[week]) acc[week] = [];
      acc[week].push(workout);
      return acc;
    },
    {} as Record<number, Workout[]>
  );

  const thumbnailUrl =
    program.thumbnail_url ||
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8"
      >
        <Link
          href="/programs"
          className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Programs
        </Link>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative aspect-video rounded-2xl overflow-hidden"
          >
            <Image
              src={thumbnailUrl}
              alt={program.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-dark-950/20 to-transparent" />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="primary" size="md">
                {goalLabels[program.goal]}
              </Badge>
              {program.is_featured && <Badge variant="warning" size="md">Featured</Badge>}
            </div>
          </motion.div>

          {/* Title & Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-dark-100">
                {program.title}
              </h1>
              <span className={`text-lg font-medium ${difficultyColors[program.difficulty]}`}>
                {difficultyLabels[program.difficulty]}
              </span>
            </div>
            {program.description && (
              <p className="text-lg text-dark-300">{program.description}</p>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { icon: Calendar, label: "Duration", value: `${program.duration_weeks} weeks` },
              { icon: Dumbbell, label: "Frequency", value: `${program.days_per_week}x/week` },
              { icon: Clock, label: "Per Session", value: formatDuration(program.minutes_per_session) },
              { icon: Target, label: "Total Workouts", value: program.total_workouts.toString() },
            ].map((stat) => (
              <Card key={stat.label} padding="sm" className="text-center">
                <stat.icon className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-dark-100">{stat.value}</p>
                <p className="text-sm text-dark-400">{stat.label}</p>
              </Card>
            ))}
          </motion.div>

          {/* Equipment Needed */}
          {program.equipment_needed && program.equipment_needed.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-xl font-semibold text-dark-100 mb-4">Equipment Needed</h2>
              <div className="flex flex-wrap gap-2">
                {program.equipment_needed.map((equipment) => (
                  <Badge key={equipment} variant="default" size="md">
                    {equipment}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}

          {/* Workout Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-xl font-semibold text-dark-100 mb-4">Workout Schedule</h2>
            <div className="space-y-6">
              {Object.entries(workoutsByWeek).map(([week, workouts]) => (
                <div key={week}>
                  <h3 className="text-lg font-medium text-dark-200 mb-3">Week {week}</h3>
                  <div className="space-y-3">
                    {workouts.map((workout, index) => {
                      const videoId = getYouTubeVideoId(workout.video_url);
                      const isLocked = enrollment
                        ? workout.day_number > enrollment.current_day
                        : !isAuthenticated || !enrollment;

                      return (
                        <Link
                          key={workout.id}
                          href={
                            enrollment && !isLocked
                              ? `/programs/${program.id}/workout/${workout.id}`
                              : "#"
                          }
                          className={isLocked ? "cursor-not-allowed" : ""}
                        >
                          <Card
                            variant={isLocked ? "default" : "hover"}
                            padding="sm"
                            className={`flex items-center gap-4 ${isLocked ? "opacity-60" : ""}`}
                          >
                            {/* Thumbnail */}
                            <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
                              {workout.is_rest_day ? (
                                <div className="w-full h-full bg-dark-700 flex items-center justify-center">
                                  <span className="text-xs text-dark-400">Rest</span>
                                </div>
                              ) : videoId ? (
                                <Image
                                  src={getYouTubeThumbnail(videoId, "medium")}
                                  alt={workout.title}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-dark-700 flex items-center justify-center">
                                  <Play className="w-6 h-6 text-dark-500" />
                                </div>
                              )}
                              {!workout.is_rest_day && !isLocked && (
                                <div className="absolute inset-0 bg-dark-950/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                  <Play className="w-8 h-8 text-white" />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-dark-400">Day {workout.day_number}</span>
                                {workout.is_rest_day ? (
                                  <Badge variant="default" size="sm">
                                    Rest Day
                                  </Badge>
                                ) : (
                                  <Badge
                                    size="sm"
                                    className={intensityColors[workout.intensity]}
                                  >
                                    {intensityLabels[workout.intensity]}
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-medium text-dark-100 truncate">
                                {workout.title}
                              </h4>
                              {!workout.is_rest_day && (
                                <p className="text-sm text-dark-400">
                                  {formatDuration(workout.duration_minutes)}
                                  {workout.calories_estimate &&
                                    ` • ~${workout.calories_estimate} cal`}
                                </p>
                              )}
                            </div>

                            {/* Status Icon */}
                            <div className="flex-shrink-0">
                              {isLocked ? (
                                <Lock className="w-5 h-5 text-dark-500" />
                              ) : enrollment ? (
                                workout.day_number < enrollment.current_day ? (
                                  <CheckCircle className="w-5 h-5 text-accent-emerald" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-dark-400" />
                                )
                              ) : (
                                <ChevronRight className="w-5 h-5 text-dark-400" />
                              )}
                            </div>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Enrollment Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="sticky top-24"
          >
            <Card className="p-6">
              {enrollment ? (
                <>
                  <h3 className="text-lg font-semibold text-dark-100 mb-4">Your Progress</h3>
                  <ProgressBar
                    value={enrollment.progress_percent}
                    showLabel
                    variant="gradient"
                    className="mb-4"
                  />
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 rounded-xl bg-dark-800/50">
                      <p className="text-2xl font-bold text-dark-100">
                        {enrollment.workouts_completed}
                      </p>
                      <p className="text-xs text-dark-400">Workouts Done</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-dark-800/50">
                      <p className="text-2xl font-bold text-dark-100">
                        {enrollment.streak_days}
                      </p>
                      <p className="text-xs text-dark-400">Day Streak</p>
                    </div>
                  </div>

                  {enrollment.next_workout ? (
                    <Link
                      href={`/programs/${program.id}/workout/${enrollment.next_workout.id}`}
                    >
                      <Button className="w-full" leftIcon={<Play className="w-5 h-5" />}>
                        Continue: Day {enrollment.current_day}
                      </Button>
                    </Link>
                  ) : (
                    <div className="text-center p-4 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20">
                      <CheckCircle className="w-8 h-8 text-accent-emerald mx-auto mb-2" />
                      <p className="text-accent-emerald font-medium">Program Completed!</p>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full mt-3"
                    onClick={handleUnenroll}
                  >
                    Leave Program
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-dark-100 mb-2">
                    Ready to Start?
                  </h3>
                  <p className="text-dark-400 text-sm mb-6">
                    Enroll now to track your progress and unlock all workouts.
                  </p>

                  {enrollError && (
                    <div className="p-3 rounded-lg bg-accent-rose/10 border border-accent-rose/20 mb-4">
                      <p className="text-sm text-accent-rose">{enrollError}</p>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    size="lg"
                    isLoading={isEnrolling}
                    onClick={handleEnroll}
                  >
                    {isAuthenticated ? "Enroll Now" : "Sign In to Enroll"}
                  </Button>

                  <p className="text-xs text-dark-500 text-center mt-4">
                    Free to enroll • Cancel anytime
                  </p>
                </>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

