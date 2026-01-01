"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, Calendar, Dumbbell, Flame, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui";
import { type Program } from "@/lib/api";
import {
  goalLabels,
  difficultyLabels,
  difficultyColors,
  getYouTubeVideoId,
  getYouTubeThumbnail,
} from "@/lib/utils";

interface ProgramCardProps {
  program: Program;
  index?: number;
}

export function ProgramCard({ program, index = 0 }: ProgramCardProps) {
  // Get thumbnail from YouTube video or use provided thumbnail
  const thumbnailUrl =
    program.thumbnail_url ||
    (program.thumbnail_url
      ? program.thumbnail_url
      : "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link href={`/programs/${program.id}`}>
        <div className="group relative rounded-2xl overflow-hidden glass-hover">
          {/* Thumbnail */}
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={thumbnailUrl}
              alt={program.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent" />

            {/* Featured Badge */}
            {program.is_featured && (
              <div className="absolute top-3 left-3">
                <Badge variant="primary" size="md">
                  <Flame className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              </div>
            )}

            {/* Goal Badge */}
            <div className="absolute top-3 right-3">
              <Badge variant="default" size="md">
                {goalLabels[program.goal] || program.goal}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Title & Difficulty */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-semibold text-lg text-dark-100 group-hover:text-primary-300 transition-colors line-clamp-2">
                {program.title}
              </h3>
              <span
                className={`text-sm font-medium flex-shrink-0 ${difficultyColors[program.difficulty]}`}
              >
                {difficultyLabels[program.difficulty]}
              </span>
            </div>

            {/* Description */}
            {program.description && (
              <p className="text-dark-400 text-sm line-clamp-2 mb-4">
                {program.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-dark-400 text-sm">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{program.duration_weeks} weeks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{program.minutes_per_session} min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4" />
                <span>{program.days_per_week}x/week</span>
              </div>
            </div>

            {/* Equipment */}
            {program.equipment_needed && program.equipment_needed.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {program.equipment_needed.slice(0, 3).map((equipment) => (
                  <span
                    key={equipment}
                    className="text-xs px-2 py-1 rounded-md bg-dark-700/50 text-dark-300"
                  >
                    {equipment}
                  </span>
                ))}
                {program.equipment_needed.length > 3 && (
                  <span className="text-xs px-2 py-1 rounded-md bg-dark-700/50 text-dark-400">
                    +{program.equipment_needed.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* CTA Arrow */}
            <div className="absolute bottom-5 right-5 w-10 h-10 rounded-full bg-primary-500/0 group-hover:bg-primary-500 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

