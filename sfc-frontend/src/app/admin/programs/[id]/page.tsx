"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Eye,
  Globe,
  GlobeLock,
  Star,
  Edit,
} from "lucide-react";
import { Button, Input, Select, Card, Checkbox, Badge, Modal } from "@/components/ui";
import { adminApi, type Program, type Workout } from "@/lib/api";
import { goalLabels, difficultyLabels, intensityLabels, intensityColors, formatDuration } from "@/lib/utils";

const goalOptions = Object.entries(goalLabels).map(([value, label]) => ({ value, label }));
const difficultyOptions = Object.entries(difficultyLabels).map(([value, label]) => ({
  value,
  label,
}));
const intensityOptions = Object.entries(intensityLabels).map(([value, label]) => ({
  value,
  label,
}));

interface ProgramWithWorkouts extends Program {
  workouts: Workout[];
  total_workouts: number;
}

export default function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [program, setProgram] = useState<ProgramWithWorkouts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [editData, setEditData] = useState({
    title: "",
    description: "",
    thumbnail_url: "",
    goal: "",
    difficulty: "",
    equipment_needed: "",
    duration_weeks: 0,
    days_per_week: 0,
    minutes_per_session: 0,
    is_featured: false,
  });

  const [addWorkoutModal, setAddWorkoutModal] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    title: "",
    description: "",
    intensity: "medium",
    duration_minutes: 30,
    video_url: "",
    is_rest_day: false,
  });

  const [deleteWorkoutModal, setDeleteWorkoutModal] = useState<{
    isOpen: boolean;
    workout: Workout | null;
  }>({ isOpen: false, workout: null });

  useEffect(() => {
    loadProgram();
  }, [resolvedParams.id]);

  const loadProgram = async () => {
    const { data } = await adminApi.getProgram(resolvedParams.id);
    if (data) {
      setProgram(data);
      setEditData({
        title: data.title,
        description: data.description || "",
        thumbnail_url: data.thumbnail_url || "",
        goal: data.goal,
        difficulty: data.difficulty,
        equipment_needed: data.equipment_needed?.join(", ") || "",
        duration_weeks: data.duration_weeks,
        days_per_week: data.days_per_week,
        minutes_per_session: data.minutes_per_session,
        is_featured: data.is_featured,
      });
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError("");

    const { error: apiError } = await adminApi.updateProgram(resolvedParams.id, {
      title: editData.title,
      description: editData.description || undefined,
      thumbnail_url: editData.thumbnail_url || undefined,
      goal: editData.goal,
      difficulty: editData.difficulty,
      equipment_needed: editData.equipment_needed
        ? editData.equipment_needed.split(",").map((e) => e.trim())
        : undefined,
      duration_weeks: editData.duration_weeks,
      days_per_week: editData.days_per_week,
      minutes_per_session: editData.minutes_per_session,
      is_featured: editData.is_featured,
    });

    if (apiError) {
      setError(apiError.message);
    } else {
      await loadProgram();
    }

    setIsSubmitting(false);
  };

  const handlePublish = async () => {
    if (!program) return;

    if (program.is_published) {
      await adminApi.unpublishProgram(program.id);
    } else {
      await adminApi.publishProgram(program.id);
    }
    loadProgram();
  };

  const handleAddWorkout = async () => {
    if (!program) return;

    const nextDayNumber = program.workouts.length + 1;
    const weekNumber = Math.ceil(nextDayNumber / program.days_per_week);

    const { error } = await adminApi.addWorkout(program.id, {
      week_number: weekNumber,
      day_number: nextDayNumber,
      title: newWorkout.title || `Day ${nextDayNumber} Workout`,
      description: newWorkout.description || undefined,
      intensity: newWorkout.intensity,
      duration_minutes: newWorkout.duration_minutes,
      video_url: newWorkout.video_url || "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      is_rest_day: newWorkout.is_rest_day,
    });

    if (!error) {
      setAddWorkoutModal(false);
      setNewWorkout({
        title: "",
        description: "",
        intensity: "medium",
        duration_minutes: 30,
        video_url: "",
        is_rest_day: false,
      });
      loadProgram();
    }
  };

  const handleDeleteWorkout = async () => {
    if (!deleteWorkoutModal.workout) return;

    const { error } = await adminApi.deleteWorkout(deleteWorkoutModal.workout.id);
    if (!error) {
      setDeleteWorkoutModal({ isOpen: false, workout: null });
      loadProgram();
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-dark-700 rounded w-32" />
          <div className="h-12 bg-dark-700 rounded w-3/4" />
          <Card className="h-64" />
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="text-center py-16">
          <h2 className="text-2xl font-bold text-dark-100 mb-4">Program Not Found</h2>
          <Link href="/admin/programs">
            <Button>Back to Programs</Button>
          </Link>
        </Card>
      </div>
    );
  }

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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-display font-bold text-dark-100">
                {program.title}
              </h1>
              <Badge variant={program.is_published ? "success" : "default"}>
                {program.is_published ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="text-dark-400">
              {program.total_workouts} workouts • {program.duration_weeks} weeks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/programs/${program.id}`} target="_blank">
              <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                Preview
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePublish}
              leftIcon={
                program.is_published ? (
                  <GlobeLock className="w-4 h-4" />
                ) : (
                  <Globe className="w-4 h-4" />
                )
              }
            >
              {program.is_published ? "Unpublish" : "Publish"}
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="space-y-8">
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
          <h2 className="text-lg font-semibold text-dark-100 mb-6">Program Details</h2>

          <div className="space-y-5">
            <Input
              label="Title"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Description
              </label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-dark-800/50 border border-dark-600 text-dark-100 placeholder-dark-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none h-24"
              />
            </div>

            <Input
              label="Thumbnail URL"
              value={editData.thumbnail_url}
              onChange={(e) => setEditData({ ...editData, thumbnail_url: e.target.value })}
            />

            <div className="grid sm:grid-cols-2 gap-5">
              <Select
                label="Goal"
                options={goalOptions}
                value={editData.goal}
                onChange={(e) => setEditData({ ...editData, goal: e.target.value })}
              />
              <Select
                label="Difficulty"
                options={difficultyOptions}
                value={editData.difficulty}
                onChange={(e) => setEditData({ ...editData, difficulty: e.target.value })}
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
              <Input
                label="Duration (weeks)"
                type="number"
                value={editData.duration_weeks}
                onChange={(e) =>
                  setEditData({ ...editData, duration_weeks: parseInt(e.target.value) || 1 })
                }
              />
              <Input
                label="Days per Week"
                type="number"
                value={editData.days_per_week}
                onChange={(e) =>
                  setEditData({ ...editData, days_per_week: parseInt(e.target.value) || 1 })
                }
              />
              <Input
                label="Minutes per Session"
                type="number"
                value={editData.minutes_per_session}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    minutes_per_session: parseInt(e.target.value) || 30,
                  })
                }
              />
            </div>

            <Input
              label="Equipment (comma-separated)"
              value={editData.equipment_needed}
              onChange={(e) => setEditData({ ...editData, equipment_needed: e.target.value })}
            />

            <Checkbox
              label="Featured Program"
              checked={editData.is_featured}
              onChange={(e) => setEditData({ ...editData, is_featured: e.target.checked })}
            />

            <div className="flex justify-end">
              <Button
                isLoading={isSubmitting}
                onClick={handleSave}
                leftIcon={<Save className="w-5 h-5" />}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Card>

        {/* Workouts */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-dark-100">Workouts</h2>
              <p className="text-sm text-dark-400">{program.total_workouts} total workouts</p>
            </div>
            <Button
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setAddWorkoutModal(true)}
            >
              Add Workout
            </Button>
          </div>

          {program.workouts.length > 0 ? (
            <div className="space-y-3">
              {program.workouts.map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-dark-800/30 hover:bg-dark-800/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-primary-400">
                        Week {workout.week_number} • Day {workout.day_number}
                      </span>
                      <Badge size="sm" className={intensityColors[workout.intensity]}>
                        {intensityLabels[workout.intensity]}
                      </Badge>
                      {workout.is_rest_day && (
                        <Badge size="sm" variant="default">
                          Rest
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium text-dark-100 truncate">{workout.title}</p>
                    <p className="text-sm text-dark-400">
                      {formatDuration(workout.duration_minutes)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="p-2">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:text-accent-rose"
                      onClick={() => setDeleteWorkoutModal({ isOpen: true, workout })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-dark-400">
              <p>No workouts yet. Add your first workout!</p>
            </div>
          )}
        </Card>
      </div>

      {/* Add Workout Modal */}
      <Modal
        isOpen={addWorkoutModal}
        onClose={() => setAddWorkoutModal(false)}
        title="Add Workout"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder={`Day ${program.workouts.length + 1} Workout`}
            value={newWorkout.title}
            onChange={(e) => setNewWorkout({ ...newWorkout, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Intensity"
              options={intensityOptions}
              value={newWorkout.intensity}
              onChange={(e) => setNewWorkout({ ...newWorkout, intensity: e.target.value })}
            />
            <Input
              label="Duration (min)"
              type="number"
              value={newWorkout.duration_minutes}
              onChange={(e) =>
                setNewWorkout({
                  ...newWorkout,
                  duration_minutes: parseInt(e.target.value) || 30,
                })
              }
            />
          </div>
          <Input
            label="YouTube URL"
            placeholder="https://youtube.com/watch?v=..."
            value={newWorkout.video_url}
            onChange={(e) => setNewWorkout({ ...newWorkout, video_url: e.target.value })}
          />
          <Checkbox
            label="Rest Day"
            checked={newWorkout.is_rest_day}
            onChange={(e) => setNewWorkout({ ...newWorkout, is_rest_day: e.target.checked })}
          />
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setAddWorkoutModal(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleAddWorkout}>
              Add Workout
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Workout Modal */}
      <Modal
        isOpen={deleteWorkoutModal.isOpen}
        onClose={() => setDeleteWorkoutModal({ isOpen: false, workout: null })}
        title="Delete Workout"
        size="sm"
      >
        <p className="text-dark-400 mb-6">
          Are you sure you want to delete &quot;{deleteWorkoutModal.workout?.title}&quot;?
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setDeleteWorkoutModal({ isOpen: false, workout: null })}
          >
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleDeleteWorkout}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

