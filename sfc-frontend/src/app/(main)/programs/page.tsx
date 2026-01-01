"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Filter, X, Dumbbell } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import { ProgramCard } from "@/components/programs";
import { programsApi, type Program } from "@/lib/api";
import { goalLabels, difficultyLabels } from "@/lib/utils";

const goalOptions = [
  { value: "", label: "All Goals" },
  ...Object.entries(goalLabels).map(([value, label]) => ({ value, label })),
];

const difficultyOptions = [
  { value: "", label: "All Levels" },
  ...Object.entries(difficultyLabels).map(([value, label]) => ({ value, label })),
];

function ProgramsContent() {
  const searchParams = useSearchParams();
  const initialGoal = searchParams.get("goal") || "";
  const initialDifficulty = searchParams.get("difficulty") || "";

  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [goal, setGoal] = useState(initialGoal);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function loadPrograms() {
      setIsLoading(true);
      const { data } = await programsApi.list({
        goal: goal || undefined,
        difficulty: difficulty || undefined,
        limit: 50,
      });
      if (data) {
        setPrograms(data);
      }
      setIsLoading(false);
    }
    loadPrograms();
  }, [goal, difficulty]);

  const filteredPrograms = programs.filter((program) =>
    program.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clearFilters = () => {
    setGoal("");
    setDifficulty("");
    setSearchQuery("");
  };

  const hasActiveFilters = goal || difficulty || searchQuery;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-display font-bold text-dark-100">
          Explore <span className="gradient-text">Programs</span>
        </h1>
        <p className="mt-4 text-xl text-dark-400 max-w-2xl">
          Find the perfect workout program tailored to your goals and fitness level.
        </p>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-4 mb-8"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>

          {/* Desktop Filters */}
          <div className="hidden md:flex items-center gap-4">
            <Select
              options={goalOptions}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-40"
            />
            <Select
              options={difficultyOptions}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-40"
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Mobile Filter Toggle */}
          <div className="md:hidden">
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Filter className="w-4 h-4" />}
              className="w-full"
            >
              Filters
              {hasActiveFilters && (
                <span className="ml-2 w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center">
                  {(goal ? 1 : 0) + (difficulty ? 1 : 0)}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden pt-4 mt-4 border-t border-dark-700 space-y-4"
          >
            <Select
              label="Goal"
              options={goalOptions}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
            <Select
              label="Difficulty"
              options={difficultyOptions}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            />
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="w-full">
                Clear All Filters
              </Button>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Results Count */}
      <div className="mb-6 text-dark-400">
        {!isLoading && (
          <span>
            {filteredPrograms.length} program{filteredPrograms.length !== 1 ? "s" : ""} found
          </span>
        )}
      </div>

      {/* Programs Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl glass p-5 animate-pulse">
              <div className="aspect-video rounded-xl bg-dark-700 mb-4" />
              <div className="h-6 bg-dark-700 rounded w-3/4 mb-2" />
              <div className="h-4 bg-dark-700 rounded w-1/2 mb-4" />
              <div className="flex gap-4">
                <div className="h-4 bg-dark-700 rounded w-20" />
                <div className="h-4 bg-dark-700 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPrograms.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program, index) => (
            <ProgramCard key={program.id} program={program} index={index} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 glass rounded-2xl"
        >
          <Dumbbell className="w-16 h-16 text-dark-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-dark-200 mb-2">No Programs Found</h3>
          <p className="text-dark-400 mb-6">
            {hasActiveFilters
              ? "Try adjusting your filters to find more programs."
              : "No programs are available at the moment."}
          </p>
          {hasActiveFilters && (
            <Button variant="secondary" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function ProgramsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="h-12 bg-dark-700 rounded w-1/3 mb-4 animate-pulse" />
          <div className="h-6 bg-dark-700 rounded w-1/2 mb-8 animate-pulse" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl glass p-5 animate-pulse">
                <div className="aspect-video rounded-xl bg-dark-700 mb-4" />
                <div className="h-6 bg-dark-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-dark-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <ProgramsContent />
    </Suspense>
  );
}

