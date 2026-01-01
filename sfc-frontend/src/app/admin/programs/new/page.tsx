"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2, GripVertical, Save } from "lucide-react";
import { Button, Input, Select, Card, Checkbox } from "@/components/ui";
import { adminApi, type CreateWorkoutData } from "@/lib/api";
import { goalLabels, difficultyLabels, intensityLabels } from "@/lib/utils";

const goalOptions = Object.entries(goalLabels).map(([value, label]) => ({ value, label }));
const difficultyOptions = Object.entries(difficultyLabels).map(([value, label]) => ({
  value,
  label,
}));
const intensityOptions = Object.entries(intensityLabels).map(([value, label]) => ({
  value,
  label,
}));

interface WorkoutForm {
  id: string;
  week_number: number;
  day_number: number;
  title: string;
  description: string;
  intensity: string;
  duration_minutes: number;
  video_url: string;
  video_title: string;
  is_rest_day: boolean;
}

export default function NewProgramPage() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [programData, setProgramData] = useState({
    title: "",
    description: "",
    thumbnail_url: "",
    goal: "general_fitness",
    difficulty: "beginner",
    equipment_needed: "",
    duration_weeks: 4,
    days_per_week: 3,
    minutes_per_session: 30,
    is_featured: false,
  });

  const [workouts, setWorkouts] = useState<WorkoutForm[]>([]);

  const updateProgram = (updates: Partial<typeof programData>) => {
    setProgramData((prev) => ({ ...prev, ...updates }));
  };

  const addWorkout = () => {
    const nextDayNumber = workouts.length + 1;
    const weekNumber = Math.ceil(nextDayNumber / programData.days_per_week);

    setWorkouts((prev) => [
      ...prev,
      {
        id: `workout-${Date.now()}`,
        week_number: weekNumber,
        day_number: nextDayNumber,
        title: `Day ${nextDayNumber} Workout`,
        description: "",
        intensity: "medium",
        duration_minutes: programData.minutes_per_session,
        video_url: "",
        video_title: "",
        is_rest_day: false,
      },
    ]);
  };

  const updateWorkout = (id: string, updates: Partial<WorkoutForm>) => {
    setWorkouts((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  };

  const removeWorkout = (id: string) => {
    setWorkouts((prev) => {
      const filtered = prev.filter((w) => w.id !== id);
      // Renumber remaining workouts
      return filtered.map((w, index) => ({
        ...w,
        day_number: index + 1,
        week_number: Math.ceil((index + 1) / programData.days_per_week),
      }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!programData.title) {
      setError("Program title is required");
      return;
    }

    setIsSubmitting(true);

    const workoutsData: CreateWorkoutData[] = workouts.map((w) => ({
      week_number: w.week_number,
      day_number: w.day_number,
      title: w.title,
      description: w.description || undefined,
      intensity: w.intensity,
      duration_minutes: w.duration_minutes,
      video_url: w.video_url || "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Placeholder
      video_title: w.video_title || undefined,
      is_rest_day: w.is_rest_day,
    }));

    const { data, error: apiError } = await adminApi.createProgram({
      title: programData.title,
      description: programData.description || undefined,
      thumbnail_url: programData.thumbnail_url || undefined,
      goal: programData.goal,
      difficulty: programData.difficulty,
      equipment_needed: programData.equipment_needed
        ? programData.equipment_needed.split(",").map((e) => e.trim())
        : undefined,
      duration_weeks: programData.duration_weeks,
      days_per_week: programData.days_per_week,
      minutes_per_session: programData.minutes_per_session,
      is_featured: programData.is_featured,
      workouts: workoutsData.length > 0 ? workoutsData : undefined,
    });

    if (apiError) {
      setError(apiError.message);
    } else if (data) {
      router.push(`/admin/programs/${data.id}`);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          href="/admin/programs"
          className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Programs
        </Link>
        <h1 className="text-3xl font-display font-bold text-dark-100">
          Create New Program
        </h1>
        <p className="text-dark-400 mt-1">
          Set up a new fitness program with workouts
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20"
          >
            <p className="text-sm text-accent-rose">{error}</p>
          </motion.div>
        )}

        {/* Program Details */}
        <Card>
          <h2 className="text-lg font-semibold text-dark-100 mb-6">
            Program Details
          </h2>

          <div className="space-y-5">
            <Input
              label="Title"
              placeholder="e.g., 30-Day Fat Burn Challenge"
              value={programData.title}
              onChange={(e) => updateProgram({ title: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Description
              </label>
              <textarea
                value={programData.description}
                onChange={(e) => updateProgram({ description: e.target.value })}
                placeholder="Describe what participants will achieve..."
                className="w-full px-4 py-3 rounded-xl bg-dark-800/50 border border-dark-600 text-dark-100 placeholder-dark-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none h-24"
              />
            </div>

            <Input
              label="Thumbnail URL (optional)"
              placeholder="https://example.com/image.jpg"
              value={programData.thumbnail_url}
              onChange={(e) => updateProgram({ thumbnail_url: e.target.value })}
            />

            <div className="grid sm:grid-cols-2 gap-5">
              <Select
                label="Goal"
                options={goalOptions}
                value={programData.goal}
                onChange={(e) => updateProgram({ goal: e.target.value })}
              />
              <Select
                label="Difficulty"
                options={difficultyOptions}
                value={programData.difficulty}
                onChange={(e) => updateProgram({ difficulty: e.target.value })}
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
              <Input
                label="Duration (weeks)"
                type="number"
                min={1}
                max={52}
                value={programData.duration_weeks}
                onChange={(e) =>
                  updateProgram({ duration_weeks: parseInt(e.target.value) || 1 })
                }
              />
              <Input
                label="Days per Week"
                type="number"
                min={1}
                max={7}
                value={programData.days_per_week}
                onChange={(e) =>
                  updateProgram({ days_per_week: parseInt(e.target.value) || 1 })
                }
              />
              <Input
                label="Minutes per Session"
                type="number"
                min={5}
                max={180}
                value={programData.minutes_per_session}
                onChange={(e) =>
                  updateProgram({ minutes_per_session: parseInt(e.target.value) || 30 })
                }
              />
            </div>

            <Input
              label="Equipment Needed (comma-separated)"
              placeholder="e.g., Dumbbells, Resistance Bands, Mat"
              value={programData.equipment_needed}
              onChange={(e) => updateProgram({ equipment_needed: e.target.value })}
            />

            <Checkbox
              label="Mark as Featured"
              checked={programData.is_featured}
              onChange={(e) => updateProgram({ is_featured: e.target.checked })}
            />
          </div>
        </Card>

        {/* Workouts */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-dark-100">Workouts</h2>
              <p className="text-sm text-dark-400">
                Add workouts to this program
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={addWorkout}
            >
              Add Workout
            </Button>
          </div>

          {workouts.length > 0 ? (
            <div className="space-y-4">
              {workouts.map((workout, index) => (
                <motion.div
                  key={workout.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-dark-800/30 border border-dark-700"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <GripVertical className="w-5 h-5 text-dark-500 mt-2 cursor-grab" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-primary-400">
                          Week {workout.week_number} • Day {workout.day_number}
                        </span>
                        {workout.is_rest_day && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-dark-700 text-dark-400">
                            Rest Day
                          </span>
                        )}
                      </div>
                      <Input
                        placeholder="Workout title"
                        value={workout.title}
                        onChange={(e) =>
                          updateWorkout(workout.id, { title: e.target.value })
                        }
                        className="mb-3"
                      />
                      <div className="grid sm:grid-cols-3 gap-3 mb-3">
                        <Select
                          options={intensityOptions}
                          value={workout.intensity}
                          onChange={(e) =>
                            updateWorkout(workout.id, { intensity: e.target.value })
                          }
                        />
                        <Input
                          type="number"
                          placeholder="Duration (min)"
                          value={workout.duration_minutes}
                          onChange={(e) =>
                            updateWorkout(workout.id, {
                              duration_minutes: parseInt(e.target.value) || 30,
                            })
                          }
                        />
                        <Checkbox
                          label="Rest Day"
                          checked={workout.is_rest_day}
                          onChange={(e) =>
                            updateWorkout(workout.id, { is_rest_day: e.target.checked })
                          }
                        />
                      </div>
                      <Input
                        placeholder="YouTube Video URL"
                        value={workout.video_url}
                        onChange={(e) =>
                          updateWorkout(workout.id, { video_url: e.target.value })
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:text-accent-rose"
                      onClick={() => removeWorkout(workout.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-dark-400">
              <p>No workouts added yet.</p>
              <p className="text-sm">
                Click &quot;Add Workout&quot; to start building your program.
              </p>
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/admin/programs">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-5 h-5" />}
          >
            Create Program
          </Button>
        </div>
      </form>
    </div>
  );
}

