"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Save, Target, Calendar, Dumbbell, MapPin } from "lucide-react";
import { Button, Input, Select, Card, Badge } from "@/components/ui";
import { useAuthStore } from "@/store/auth";
import { userApi } from "@/lib/api";
import { goalLabels, difficultyLabels } from "@/lib/utils";

const fitnessLevelOptions = Object.entries(difficultyLabels).map(([value, label]) => ({
  value,
  label,
}));

const goalOptions = Object.entries(goalLabels).map(([value, label]) => ({ value, label }));

export default function ProfilePage() {
  const { user, profile, setProfile } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    display_name: profile?.display_name || "",
    height_cm: profile?.height_cm?.toString() || "",
    weight_kg: profile?.weight_kg?.toString() || "",
    fitness_level: profile?.fitness_level || "",
    primary_goal: profile?.primary_goal || "",
    days_per_week: profile?.days_per_week || 3,
    minutes_per_session: profile?.minutes_per_session || 30,
  });

  const handleSave = async () => {
    setIsSaving(true);

    const { data, error } = await userApi.updateProfile({
      display_name: editData.display_name || undefined,
      height_cm: editData.height_cm ? parseInt(editData.height_cm) : undefined,
      weight_kg: editData.weight_kg ? parseFloat(editData.weight_kg) : undefined,
      fitness_level: editData.fitness_level || undefined,
      primary_goal: editData.primary_goal || undefined,
      days_per_week: editData.days_per_week,
      minutes_per_session: editData.minutes_per_session,
    });

    if (data) {
      setProfile(data);
      setIsEditing(false);
    }

    setIsSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-display font-bold text-dark-100">Your Profile</h1>
        <p className="text-dark-400 mt-2">Manage your account and preferences</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <Card className="text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-accent-cyan mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {(profile?.display_name?.[0] || user?.email?.[0] || "U").toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-dark-100">
              {profile?.display_name || user?.email?.split("@")[0]}
            </h2>
            <p className="text-dark-400 text-sm">{user?.email}</p>

            <div className="mt-6 space-y-3">
              {profile?.primary_goal && (
                <div className="flex items-center justify-center gap-2">
                  <Target className="w-4 h-4 text-primary-400" />
                  <span className="text-sm text-dark-300">
                    {goalLabels[profile.primary_goal]}
                  </span>
                </div>
              )}
              {profile?.fitness_level && (
                <div className="flex items-center justify-center gap-2">
                  <Dumbbell className="w-4 h-4 text-primary-400" />
                  <span className="text-sm text-dark-300">
                    {difficultyLabels[profile.fitness_level]}
                  </span>
                </div>
              )}
              {profile?.workout_location && (
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-400" />
                  <span className="text-sm text-dark-300 capitalize">
                    {profile.workout_location}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-dark-700">
              <p className="text-xs text-dark-500">
                Member since{" "}
                {new Date(user?.created_at || "").toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })}
              </p>
            </div>
          </Card>

          {/* Stats */}
          <Card className="mt-6">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Your Schedule</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-dark-400">
                  <Calendar className="w-4 h-4" />
                  <span>Days per week</span>
                </div>
                <span className="font-semibold text-dark-100">
                  {profile?.days_per_week || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-dark-400">
                  <Dumbbell className="w-4 h-4" />
                  <span>Minutes per session</span>
                </div>
                <span className="font-semibold text-dark-100">
                  {profile?.minutes_per_session || 0}
                </span>
              </div>
            </div>

            {profile?.preferred_days && profile.preferred_days.length > 0 && (
              <div className="mt-4 pt-4 border-t border-dark-700">
                <p className="text-sm text-dark-400 mb-2">Preferred days</p>
                <div className="flex flex-wrap gap-2">
                  {profile.preferred_days.map((day) => (
                    <Badge key={day} variant="default" size="sm" className="capitalize">
                      {day.slice(0, 3)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Edit Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-dark-100">Profile Details</h2>
              {!isEditing ? (
                <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    isLoading={isSaving}
                    onClick={handleSave}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Account Info */}
              <div>
                <h3 className="text-sm font-medium text-dark-400 mb-4">Account</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-dark-400 mb-1">Email</label>
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-dark-800/30 border border-dark-700">
                      <Mail className="w-5 h-5 text-dark-500" />
                      <span className="text-dark-300">{user?.email}</span>
                    </div>
                  </div>
                  <Input
                    label="Display Name"
                    value={editData.display_name}
                    onChange={(e) =>
                      setEditData({ ...editData, display_name: e.target.value })
                    }
                    disabled={!isEditing}
                    placeholder="Your name"
                  />
                </div>
              </div>

              {/* Physical Info */}
              <div>
                <h3 className="text-sm font-medium text-dark-400 mb-4">Physical</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Height (cm)"
                    type="number"
                    value={editData.height_cm}
                    onChange={(e) => setEditData({ ...editData, height_cm: e.target.value })}
                    disabled={!isEditing}
                    placeholder="170"
                  />
                  <Input
                    label="Weight (kg)"
                    type="number"
                    value={editData.weight_kg}
                    onChange={(e) => setEditData({ ...editData, weight_kg: e.target.value })}
                    disabled={!isEditing}
                    placeholder="70"
                  />
                </div>
              </div>

              {/* Fitness Info */}
              <div>
                <h3 className="text-sm font-medium text-dark-400 mb-4">Fitness</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Select
                    label="Fitness Level"
                    options={[{ value: "", label: "Select..." }, ...fitnessLevelOptions]}
                    value={editData.fitness_level}
                    onChange={(e) =>
                      setEditData({ ...editData, fitness_level: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                  <Select
                    label="Primary Goal"
                    options={[{ value: "", label: "Select..." }, ...goalOptions]}
                    value={editData.primary_goal}
                    onChange={(e) =>
                      setEditData({ ...editData, primary_goal: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Schedule */}
              <div>
                <h3 className="text-sm font-medium text-dark-400 mb-4">Schedule</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Days per Week"
                    type="number"
                    min={1}
                    max={7}
                    value={editData.days_per_week}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        days_per_week: parseInt(e.target.value) || 1,
                      })
                    }
                    disabled={!isEditing}
                  />
                  <Input
                    label="Minutes per Session"
                    type="number"
                    min={10}
                    max={180}
                    value={editData.minutes_per_session}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        minutes_per_session: parseInt(e.target.value) || 30,
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Preferences */}
          <Card className="mt-6">
            <h2 className="text-lg font-semibold text-dark-100 mb-6">Preferences</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {profile?.prefers_cardio !== undefined && (
                <div className="p-4 rounded-xl bg-dark-800/30 border border-dark-700">
                  <p className="text-sm text-dark-400">Cardio</p>
                  <p className="font-medium text-dark-100">
                    {profile.prefers_cardio ? "Yes" : "No"}
                  </p>
                </div>
              )}
              {profile?.prefers_strength !== undefined && (
                <div className="p-4 rounded-xl bg-dark-800/30 border border-dark-700">
                  <p className="text-sm text-dark-400">Strength</p>
                  <p className="font-medium text-dark-100">
                    {profile.prefers_strength ? "Yes" : "No"}
                  </p>
                </div>
              )}
              {profile?.interested_in_yoga !== undefined && (
                <div className="p-4 rounded-xl bg-dark-800/30 border border-dark-700">
                  <p className="text-sm text-dark-400">Yoga</p>
                  <p className="font-medium text-dark-100">
                    {profile.interested_in_yoga ? "Yes" : "No"}
                  </p>
                </div>
              )}
            </div>

            {profile?.equipment_available && profile.equipment_available.length > 0 && (
              <div className="mt-4 pt-4 border-t border-dark-700">
                <p className="text-sm text-dark-400 mb-2">Equipment Available</p>
                <div className="flex flex-wrap gap-2">
                  {profile.equipment_available.map((eq) => (
                    <Badge key={eq} variant="default">
                      {eq}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

