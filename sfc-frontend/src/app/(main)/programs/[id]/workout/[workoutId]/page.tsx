"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import YouTube, { type YouTubeEvent } from "react-youtube";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Flame,
  CheckCircle,
  Maximize2,
  Minimize2,
  Star,
  MessageSquare,
} from "lucide-react";
import { Button, Badge, Card, Select } from "@/components/ui";
import { programsApi, type Workout, type Program } from "@/lib/api";
import {
  intensityLabels,
  intensityColors,
  formatDuration,
  getYouTubeVideoId,
} from "@/lib/utils";

export default function WorkoutPlayerPage({
  params,
}: {
  params: Promise<{ id: string; workoutId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [program, setProgram] = useState<(Program & { workouts?: Workout[] }) | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Feedback form
  const [rating, setRating] = useState<number>(0);
  const [difficultyFelt, setDifficultyFelt] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function loadWorkout() {
      // Load program
      const { data: programData } = await programsApi.getById(resolvedParams.id);
      if (programData) {
        setProgram(programData);

        // Find workout
        const found = programData.workouts.find((w) => w.id === resolvedParams.workoutId);
        if (found) {
          setWorkout(found);
        }
      }
      setIsLoading(false);
    }
    loadWorkout();
  }, [resolvedParams.id, resolvedParams.workoutId]);

  const handleMarkComplete = async () => {
    if (!workout) return;

    setIsCompleting(true);

    const { data, error } = await programsApi.markWorkoutComplete(workout.id, {
      rating: rating || undefined,
      difficulty_felt: difficultyFelt || undefined,
      notes: notes || undefined,
    });

    if (data) {
      setCompleted(true);
      setShowFeedback(false);

      // Navigate to next workout if available
      if (data.next_workout_id) {
        setTimeout(() => {
          router.push(`/programs/${resolvedParams.id}/workout/${data.next_workout_id}`);
        }, 2000);
      } else if (data.program_completed) {
        setTimeout(() => {
          router.push(`/programs/${resolvedParams.id}`);
        }, 3000);
      }
    }

    setIsCompleting(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-dark-700 rounded w-32 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="aspect-video rounded-2xl bg-dark-700" />
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-dark-700 rounded-2xl" />
              <div className="h-48 bg-dark-700 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!program || !workout) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="text-center py-20">
          <h2 className="text-2xl font-bold text-dark-100 mb-4">Workout Not Found</h2>
          <p className="text-dark-400 mb-6">
            The workout you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/programs">
            <Button>Browse Programs</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const videoId = getYouTubeVideoId(workout.video_url);
  const currentIndex = program.workouts?.findIndex((w) => w.id === workout.id) ?? -1;
  const prevWorkout = currentIndex > 0 ? program.workouts?.[currentIndex - 1] : null;
  const nextWorkout =
    currentIndex < (program.workouts?.length ?? 0) - 1
      ? program.workouts?.[currentIndex + 1]
      : null;

  return (
    <div className={`min-h-screen ${isFullscreen ? "bg-black" : ""}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
        {/* Back Button */}
        {!isFullscreen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link
              href={`/programs/${program.id}`}
              className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to {program.title}
            </Link>
          </motion.div>
        )}

        <div className={`grid ${isFullscreen ? "" : "lg:grid-cols-3"} gap-6 lg:gap-8`}>
          {/* Video Player */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isFullscreen ? "fixed inset-0 z-50 bg-black flex items-center justify-center" : "lg:col-span-2"}`}
          >
            <div className={`relative ${isFullscreen ? "w-full h-full" : "aspect-video"} rounded-2xl overflow-hidden bg-dark-900`}>
              {videoId ? (
                <YouTube
                  videoId={videoId}
                  className="w-full h-full"
                  iframeClassName="w-full h-full"
                  opts={{
                    width: "100%",
                    height: "100%",
                    playerVars: {
                      autoplay: 0,
                      modestbranding: 1,
                      rel: 0,
                    },
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-dark-400">Video not available</p>
                </div>
              )}

              {/* Fullscreen toggle */}
              <button
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 p-2 rounded-lg bg-dark-950/80 text-white hover:bg-dark-800 transition-colors"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Navigation - below video on mobile, hidden in fullscreen */}
            {!isFullscreen && (
              <div className="flex items-center justify-between mt-4 lg:hidden">
                {prevWorkout ? (
                  <Link href={`/programs/${program.id}/workout/${prevWorkout.id}`}>
                    <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                      Previous
                    </Button>
                  </Link>
                ) : (
                  <div />
                )}
                {nextWorkout && (
                  <Link href={`/programs/${program.id}/workout/${nextWorkout.id}`}>
                    <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Next
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </motion.div>

          {/* Workout Details Sidebar */}
          {!isFullscreen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Workout Info */}
              <Card>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-dark-400">Day {workout.day_number}</span>
                  <Badge size="sm" className={intensityColors[workout.intensity]}>
                    {intensityLabels[workout.intensity]}
                  </Badge>
                </div>
                <h1 className="text-2xl font-display font-bold text-dark-100 mb-3">
                  {workout.title}
                </h1>
                {workout.description && (
                  <p className="text-dark-400 mb-4">{workout.description}</p>
                )}

                {/* Stats */}
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-dark-300">
                    <Clock className="w-4 h-4" />
                    {formatDuration(workout.duration_minutes)}
                  </div>
                  {workout.calories_estimate && (
                    <div className="flex items-center gap-1.5 text-dark-300">
                      <Flame className="w-4 h-4" />
                      ~{workout.calories_estimate} cal
                    </div>
                  )}
                </div>

                {/* Equipment */}
                {workout.equipment_needed && workout.equipment_needed.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-dark-700">
                    <p className="text-sm text-dark-400 mb-2">Equipment needed:</p>
                    <div className="flex flex-wrap gap-2">
                      {workout.equipment_needed.map((eq) => (
                        <Badge key={eq} variant="default" size="sm">
                          {eq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {workout.tags && workout.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {workout.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded-md bg-primary-500/10 text-primary-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </Card>

              {/* Mark Complete */}
              <Card>
                {completed ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-12 h-12 text-accent-emerald mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-dark-100 mb-1">
                      Workout Completed!
                    </h3>
                    <p className="text-dark-400 text-sm">
                      {nextWorkout ? "Loading next workout..." : "Great job! You finished all workouts."}
                    </p>
                  </div>
                ) : showFeedback ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-dark-100">
                      How was your workout?
                    </h3>

                    {/* Rating */}
                    <div>
                      <p className="text-sm text-dark-400 mb-2">Rate this workout</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-8 h-8 ${
                                star <= rating
                                  ? "fill-accent-gold text-accent-gold"
                                  : "text-dark-600"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Difficulty */}
                    <Select
                      label="How did it feel?"
                      options={[
                        { value: "", label: "Select..." },
                        { value: "easy", label: "Too Easy" },
                        { value: "just_right", label: "Just Right" },
                        { value: "hard", label: "Too Hard" },
                      ]}
                      value={difficultyFelt}
                      onChange={(e) => setDifficultyFelt(e.target.value)}
                    />

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-dark-200 mb-2">
                        Notes (optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="How did you feel? Any modifications?"
                        className="w-full px-4 py-3 rounded-xl bg-dark-800/50 border border-dark-600 text-dark-100 placeholder-dark-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none h-24"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setShowFeedback(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        isLoading={isCompleting}
                        onClick={handleMarkComplete}
                      >
                        Complete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button
                      className="w-full"
                      size="lg"
                      leftIcon={<CheckCircle className="w-5 h-5" />}
                      onClick={() => setShowFeedback(true)}
                    >
                      Mark as Complete
                    </Button>
                    <p className="text-xs text-dark-500 text-center">
                      You can mark this workout complete at any time
                    </p>
                  </div>
                )}
              </Card>

              {/* Navigation - Desktop */}
              <div className="hidden lg:flex items-center justify-between">
                {prevWorkout ? (
                  <Link href={`/programs/${program.id}/workout/${prevWorkout.id}`}>
                    <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                      Day {prevWorkout.day_number}
                    </Button>
                  </Link>
                ) : (
                  <div />
                )}
                {nextWorkout && (
                  <Link href={`/programs/${program.id}/workout/${nextWorkout.id}`}>
                    <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Day {nextWorkout.day_number}
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

