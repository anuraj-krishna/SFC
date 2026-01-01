"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Target,
  Activity,
  Calendar,
  Dumbbell,
  MapPin,
  Heart,
  AlertTriangle,
} from "lucide-react";
import { Button, Card, Input, Checkbox } from "@/components/ui";
import { Logo } from "@/components/ui";
import { userApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const steps = [
  { id: "basics", title: "Basic Info", icon: Activity },
  { id: "goals", title: "Your Goals", icon: Target },
  { id: "availability", title: "Availability", icon: Calendar },
  { id: "equipment", title: "Equipment", icon: Dumbbell },
  { id: "preferences", title: "Preferences", icon: Heart },
  { id: "health", title: "Health", icon: AlertTriangle },
];

const ageRanges = ["18-29", "30-45", "46-65", "65+"];
const genders = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];
const fitnessLevels = [
  { value: "beginner", label: "Beginner", description: "New to exercise or returning after a long break" },
  { value: "intermediate", label: "Intermediate", description: "Exercise regularly, 1-3 times per week" },
  { value: "advanced", label: "Advanced", description: "Exercise 4+ times per week, familiar with various workouts" },
];
const goals = [
  { value: "weight_loss", label: "Weight Loss", emoji: "🔥" },
  { value: "muscle_gain", label: "Muscle Gain", emoji: "💪" },
  { value: "flexibility", label: "Flexibility", emoji: "🧘" },
  { value: "endurance", label: "Endurance", emoji: "🏃" },
  { value: "general_fitness", label: "General Fitness", emoji: "⚡" },
  { value: "rehab_mobility", label: "Rehab & Mobility", emoji: "🩹" },
];
const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const equipmentOptions = [
  { value: "none", label: "No Equipment" },
  { value: "dumbbells", label: "Dumbbells" },
  { value: "bands", label: "Resistance Bands" },
  { value: "gym", label: "Full Gym Access" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "pullup_bar", label: "Pull-up Bar" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { setProfile, setLoading } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    display_name: "",
    age_range: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    fitness_level: "",
    primary_goal: "",
    secondary_goals: [] as string[],
    days_per_week: 3,
    minutes_per_session: 30,
    preferred_days: [] as string[],
    injuries: "",
    equipment_available: [] as string[],
    workout_location: "",
    prefers_cardio: false,
    prefers_strength: false,
    interested_in_yoga: false,
    health_disclaimer_accepted: false,
  });

  const updateForm = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const toggleArrayItem = (field: "secondary_goals" | "preferred_days" | "equipment_available", item: string) => {
    const current = formData[field];
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    updateForm({ [field]: updated });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.health_disclaimer_accepted) {
      setError("Please accept the health disclaimer to continue");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const { data, error: apiError } = await userApi.completeOnboarding({
      display_name: formData.display_name || undefined,
      age_range: formData.age_range || undefined,
      gender: formData.gender || undefined,
      height_cm: formData.height_cm ? parseInt(formData.height_cm) : undefined,
      weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : undefined,
      fitness_level: formData.fitness_level || undefined,
      primary_goal: formData.primary_goal || undefined,
      secondary_goals: formData.secondary_goals.length > 0 ? formData.secondary_goals : undefined,
      days_per_week: formData.days_per_week,
      minutes_per_session: formData.minutes_per_session,
      preferred_days: formData.preferred_days.length > 0 ? formData.preferred_days : undefined,
      injuries: formData.injuries || undefined,
      equipment_available: formData.equipment_available.length > 0 ? formData.equipment_available : undefined,
      workout_location: formData.workout_location || undefined,
      prefers_cardio: formData.prefers_cardio,
      prefers_strength: formData.prefers_strength,
      interested_in_yoga: formData.interested_in_yoga,
      health_disclaimer_accepted: formData.health_disclaimer_accepted,
    });

    if (apiError) {
      setError(apiError.message);
    } else if (data) {
      setProfile(data);
      router.push("/dashboard");
    }

    setIsSubmitting(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div className="space-y-6">
            <Input
              label="Display Name (optional)"
              placeholder="What should we call you?"
              value={formData.display_name}
              onChange={(e) => updateForm({ display_name: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-3">Age Range</label>
              <div className="grid grid-cols-2 gap-3">
                {ageRanges.map((range) => (
                  <button
                    key={range}
                    onClick={() => updateForm({ age_range: range })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.age_range === range
                        ? "border-primary-500 bg-primary-500/10"
                        : "border-dark-600 hover:border-dark-500"
                    }`}
                  >
                    <span className="text-dark-100">{range}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-3">Gender</label>
              <div className="grid grid-cols-2 gap-3">
                {genders.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => updateForm({ gender: g.value })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.gender === g.value
                        ? "border-primary-500 bg-primary-500/10"
                        : "border-dark-600 hover:border-dark-500"
                    }`}
                  >
                    <span className="text-dark-100">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Height (cm)"
                type="number"
                placeholder="170"
                value={formData.height_cm}
                onChange={(e) => updateForm({ height_cm: e.target.value })}
              />
              <Input
                label="Weight (kg)"
                type="number"
                placeholder="70"
                value={formData.weight_kg}
                onChange={(e) => updateForm({ weight_kg: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-3">Fitness Level</label>
              <div className="space-y-3">
                {fitnessLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => updateForm({ fitness_level: level.value })}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      formData.fitness_level === level.value
                        ? "border-primary-500 bg-primary-500/10"
                        : "border-dark-600 hover:border-dark-500"
                    }`}
                  >
                    <span className="font-medium text-dark-100">{level.label}</span>
                    <p className="text-sm text-dark-400 mt-1">{level.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 1: // Goals
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-3">
                Primary Goal
              </label>
              <div className="grid grid-cols-2 gap-3">
                {goals.map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => updateForm({ primary_goal: goal.value })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.primary_goal === goal.value
                        ? "border-primary-500 bg-primary-500/10"
                        : "border-dark-600 hover:border-dark-500"
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{goal.emoji}</span>
                    <span className="font-medium text-dark-100">{goal.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-3">
                Secondary Goals (optional)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {goals
                  .filter((g) => g.value !== formData.primary_goal)
                  .map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => toggleArrayItem("secondary_goals", goal.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.secondary_goals.includes(goal.value)
                          ? "border-accent-cyan bg-accent-cyan/10"
                          : "border-dark-600 hover:border-dark-500"
                      }`}
                    >
                      <span className="text-xl mb-1 block">{goal.emoji}</span>
                      <span className="text-sm text-dark-100">{goal.label}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        );

      case 2: // Availability
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-3">
                How many days per week can you work out?
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={formData.days_per_week}
                  onChange={(e) => updateForm({ days_per_week: parseInt(e.target.value) })}
                  className="flex-1 accent-primary-500"
                />
                <span className="text-2xl font-bold text-primary-400 w-12 text-center">
                  {formData.days_per_week}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-3">
                Minutes per session
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => updateForm({ minutes_per_session: mins })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.minutes_per_session === mins
                        ? "border-primary-500 bg-primary-500/10"
                        : "border-dark-600 hover:border-dark-500"
                    }`}
                  >
                    <span className="font-medium text-dark-100">{mins} min</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-3">
                Preferred Days (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleArrayItem("preferred_days", day)}
                    className={`px-4 py-2 rounded-full border-2 capitalize transition-all ${
                      formData.preferred_days.includes(day)
                        ? "border-primary-500 bg-primary-500/10 text-primary-300"
                        : "border-dark-600 hover:border-dark-500 text-dark-300"
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3: // Equipment
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-3">
                What equipment do you have access to?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {equipmentOptions.map((eq) => (
                  <button
                    key={eq.value}
                    onClick={() => toggleArrayItem("equipment_available", eq.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.equipment_available.includes(eq.value)
                        ? "border-primary-500 bg-primary-500/10"
                        : "border-dark-600 hover:border-dark-500"
                    }`}
                  >
                    <span className="text-dark-100">{eq.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-3">
                Where will you work out?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "home", label: "Home", icon: "🏠" },
                  { value: "gym", label: "Gym", icon: "🏋️" },
                  { value: "both", label: "Both", icon: "🔄" },
                ].map((loc) => (
                  <button
                    key={loc.value}
                    onClick={() => updateForm({ workout_location: loc.value })}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      formData.workout_location === loc.value
                        ? "border-primary-500 bg-primary-500/10"
                        : "border-dark-600 hover:border-dark-500"
                    }`}
                  >
                    <span className="text-2xl block mb-1">{loc.icon}</span>
                    <span className="text-dark-100">{loc.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4: // Preferences
        return (
          <div className="space-y-6">
            <p className="text-dark-400">
              Help us personalize your experience. Select your workout preferences.
            </p>

            <div className="space-y-4">
              <Card
                variant="hover"
                padding="md"
                onClick={() => updateForm({ prefers_cardio: !formData.prefers_cardio })}
                className={formData.prefers_cardio ? "border-primary-500" : ""}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">🏃</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-dark-100">Cardio</h3>
                    <p className="text-sm text-dark-400">
                      Running, cycling, HIIT, and heart-pumping workouts
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      formData.prefers_cardio
                        ? "border-primary-500 bg-primary-500"
                        : "border-dark-500"
                    }`}
                  >
                    {formData.prefers_cardio && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </Card>

              <Card
                variant="hover"
                padding="md"
                onClick={() => updateForm({ prefers_strength: !formData.prefers_strength })}
                className={formData.prefers_strength ? "border-primary-500" : ""}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">💪</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-dark-100">Strength Training</h3>
                    <p className="text-sm text-dark-400">
                      Weight lifting, resistance training, muscle building
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      formData.prefers_strength
                        ? "border-primary-500 bg-primary-500"
                        : "border-dark-500"
                    }`}
                  >
                    {formData.prefers_strength && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </Card>

              <Card
                variant="hover"
                padding="md"
                onClick={() => updateForm({ interested_in_yoga: !formData.interested_in_yoga })}
                className={formData.interested_in_yoga ? "border-primary-500" : ""}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">🧘</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-dark-100">Yoga & Stretching</h3>
                    <p className="text-sm text-dark-400">
                      Flexibility, mindfulness, and recovery focused
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      formData.interested_in_yoga
                        ? "border-primary-500 bg-primary-500"
                        : "border-dark-500"
                    }`}
                  >
                    {formData.interested_in_yoga && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );

      case 5: // Health
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-accent-gold/10 border border-accent-gold/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-accent-gold flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-accent-gold">Health & Safety</h3>
                  <p className="text-sm text-dark-300 mt-1">
                    Please consult with a healthcare provider before starting any new exercise
                    program, especially if you have any medical conditions.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Any injuries or conditions we should know about? (optional)
              </label>
              <textarea
                value={formData.injuries}
                onChange={(e) => updateForm({ injuries: e.target.value })}
                placeholder="E.g., knee injury, back pain, etc."
                className="w-full px-4 py-3 rounded-xl bg-dark-800/50 border border-dark-600 text-dark-100 placeholder-dark-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none h-24"
              />
            </div>

            <Card padding="md" className="bg-dark-800/30">
              <Checkbox
                checked={formData.health_disclaimer_accepted}
                onChange={(e) =>
                  updateForm({ health_disclaimer_accepted: e.target.checked })
                }
                label={
                  <span className="text-sm text-dark-300">
                    I understand that SFC provides fitness guidance only, and I should
                    consult a healthcare professional before starting any exercise program. I
                    take full responsibility for my health and safety during workouts.
                  </span>
                }
              />
            </Card>

            {error && (
              <div className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20">
                <p className="text-sm text-accent-rose">{error}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <Logo size="md" />
        <span className="text-sm text-dark-400">
          Step {currentStep + 1} of {steps.length}
        </span>
      </header>

      {/* Progress Bar */}
      <div className="px-6">
        <div className="h-1 bg-dark-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-600 to-primary-400"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="px-6 py-4">
        <div className="flex justify-center gap-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => index <= currentStep && setCurrentStep(index)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                index === currentStep
                  ? "bg-primary-500/20 text-primary-300"
                  : index < currentStep
                    ? "text-dark-400 hover:text-dark-200"
                    : "text-dark-600 cursor-not-allowed"
              }`}
              disabled={index > currentStep}
            >
              <step.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{step.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="max-w-xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-2xl font-display font-bold text-dark-100 mb-2">
                {steps[currentStep].title}
              </h2>
              <p className="text-dark-400 mb-8">
                {currentStep === 0 && "Let's get to know you better."}
                {currentStep === 1 && "What do you want to achieve?"}
                {currentStep === 2 && "When can you work out?"}
                {currentStep === 3 && "What do you have to work with?"}
                {currentStep === 4 && "What types of workouts interest you?"}
                {currentStep === 5 && "Almost done! Just a few safety questions."}
              </p>

              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="p-6 border-t border-dark-800">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            leftIcon={<ArrowLeft className="w-5 h-5" />}
          >
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} rightIcon={<ArrowRight className="w-5 h-5" />}>
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              isLoading={isSubmitting}
              rightIcon={<Check className="w-5 h-5" />}
            >
              Complete Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

