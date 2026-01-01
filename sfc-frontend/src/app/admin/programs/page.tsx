"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Globe,
  GlobeLock,
  Star,
} from "lucide-react";
import { Button, Input, Card, Badge, Modal } from "@/components/ui";
import { adminApi, type Program } from "@/lib/api";
import { goalLabels, difficultyLabels, difficultyColors } from "@/lib/utils";

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; program: Program | null }>({
    isOpen: false,
    program: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPrograms = async () => {
    setIsLoading(true);
    const { data } = await adminApi.listPrograms({ include_unpublished: true, limit: 100 });
    if (data) {
      setPrograms(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const handlePublish = async (program: Program) => {
    if (program.is_published) {
      await adminApi.unpublishProgram(program.id);
    } else {
      await adminApi.publishProgram(program.id);
    }
    loadPrograms();
  };

  const handleDelete = async () => {
    if (!deleteModal.program) return;

    setIsDeleting(true);
    const { error } = await adminApi.deleteProgram(deleteModal.program.id);
    if (!error) {
      setDeleteModal({ isOpen: false, program: null });
      loadPrograms();
    }
    setIsDeleting(false);
  };

  const filteredPrograms = programs.filter((program) =>
    program.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-dark-100">Programs</h1>
          <p className="text-dark-400 mt-1">
            Manage your fitness programs and workouts
          </p>
        </div>
        <Link href="/admin/programs/new">
          <Button leftIcon={<Plus className="w-5 h-5" />}>Create Program</Button>
        </Link>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Input
          placeholder="Search programs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-5 h-5" />}
          className="max-w-md"
        />
      </motion.div>

      {/* Programs List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg bg-dark-700" />
                <div className="flex-1">
                  <div className="h-5 bg-dark-700 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-dark-700 rounded w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredPrograms.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {filteredPrograms.map((program, index) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className="hover:border-dark-600 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-full sm:w-32 h-20 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-cyan/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl">
                      {program.goal === "weight_loss" && "🔥"}
                      {program.goal === "muscle_gain" && "💪"}
                      {program.goal === "flexibility" && "🧘"}
                      {program.goal === "endurance" && "🏃"}
                      {program.goal === "general_fitness" && "⚡"}
                      {program.goal === "rehab_mobility" && "🩹"}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className="font-semibold text-dark-100 truncate">
                        {program.title}
                      </h3>
                      {program.is_featured && (
                        <Star className="w-4 h-4 text-accent-gold fill-accent-gold flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-dark-400">
                      <span>{goalLabels[program.goal]}</span>
                      <span>•</span>
                      <span className={difficultyColors[program.difficulty]}>
                        {difficultyLabels[program.difficulty]}
                      </span>
                      <span>•</span>
                      <span>{program.duration_weeks} weeks</span>
                      <span>•</span>
                      <span>{program.days_per_week}x/week</span>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge
                      variant={program.is_published ? "success" : "default"}
                      size="md"
                    >
                      {program.is_published ? "Published" : "Draft"}
                    </Badge>

                    <div className="flex items-center gap-1">
                      <Link href={`/programs/${program.id}`} target="_blank">
                        <Button variant="ghost" size="sm" className="p-2">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/programs/${program.id}`}>
                        <Button variant="ghost" size="sm" className="p-2">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2"
                        onClick={() => handlePublish(program)}
                      >
                        {program.is_published ? (
                          <GlobeLock className="w-4 h-4" />
                        ) : (
                          <Globe className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 hover:text-accent-rose"
                        onClick={() => setDeleteModal({ isOpen: true, program })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <Card className="text-center py-16">
          <p className="text-dark-400 mb-4">
            {searchQuery ? "No programs match your search" : "No programs yet"}
          </p>
          <Link href="/admin/programs/new">
            <Button leftIcon={<Plus className="w-5 h-5" />}>Create Your First Program</Button>
          </Link>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, program: null })}
        title="Delete Program"
        description="Are you sure you want to delete this program? This action cannot be undone."
        size="sm"
      >
        <div className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20 mb-6">
          <p className="font-medium text-dark-100">{deleteModal.program?.title}</p>
          <p className="text-sm text-dark-400">
            All workouts and enrollment data will be permanently deleted.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setDeleteModal({ isOpen: false, program: null })}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            isLoading={isDeleting}
            onClick={handleDelete}
          >
            Delete Program
          </Button>
        </div>
      </Modal>
    </div>
  );
}

