"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Play,
  Target,
  Users,
  Trophy,
  Zap,
  Star,
} from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { Button } from "@/components/ui";
import { ProgramCard } from "@/components/programs";
import { programsApi, type Program } from "@/lib/api";

const heroImages = [
  "/images/anastase-maragos-7kEpUPB8vNk-unsplash.jpg",
  "/images/edgar-chaparro-sHfo3WOgGTU-unsplash.jpg",
  "/images/spencer-davis-0ShTs8iPY28-unsplash.jpg",
  "/images/sushil-ghimire-5UbIqV58CW8-unsplash.jpg",
  "/images/victor-freitas-WvDYdXDzkhs-unsplash.jpg",
];

const features = [
  {
    icon: Target,
    title: "Personalized Plans",
    description: "Programs tailored to your fitness level, goals, and available equipment.",
  },
  {
    icon: Play,
    title: "Video Guidance",
    description: "Follow along with expert-led workout videos for every exercise.",
  },
  {
    icon: Trophy,
    title: "Track Progress",
    description: "Monitor your journey with detailed progress tracking and milestones.",
  },
  {
    icon: Zap,
    title: "Stay Motivated",
    description: "Maintain streaks, earn achievements, and celebrate your wins.",
  },
];

const stats = [
  { value: "10K+", label: "Active Members" },
  { value: "50+", label: "Programs" },
  { value: "500+", label: "Workouts" },
  { value: "95%", label: "Success Rate" },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Lost 25 lbs",
    content:
      "SFC transformed my approach to fitness. The programs are easy to follow and the progress tracking keeps me motivated!",
    rating: 5,
  },
  {
    name: "Mike Chen",
    role: "Gained 15 lbs muscle",
    content:
      "The muscle gain program is incredible. Clear instructions, great videos, and real results in just 12 weeks.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Improved flexibility",
    content:
      "Finally found a program that fits my busy schedule. 30 minutes a day and I feel stronger than ever.",
    rating: 5,
  },
];

export default function HomePage() {
  const [featuredPrograms, setFeaturedPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    async function loadFeaturedPrograms() {
      const { data } = await programsApi.getFeatured(3);
      if (data) {
        setFeaturedPrograms(data);
      }
      setIsLoading(false);
    }
    loadFeaturedPrograms();
  }, []);

  // Auto-scroll background images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentImageIndex(index);
  }, []);

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Image Slideshow */}
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src={heroImages[currentImageIndex]}
                alt="Fitness background"
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-dark-950/90 via-dark-950/70 to-dark-950/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-dark-950/30" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Subtle animated accent */}
        <motion.div
          className="absolute top-1/3 left-0 w-[600px] h-[600px] rounded-full bg-primary-600/10 blur-[120px] pointer-events-none"
          animate={{
            x: [0, 30, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
              <span className="text-sm text-white/90">
                Join 10,000+ fitness enthusiasts
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-tight">
              <span className="text-white">Transform Your</span>
              <br />
              <span className="bg-gradient-to-r from-primary-400 via-accent-cyan to-primary-400 bg-clip-text text-transparent">
                Body & Mind
              </span>
            </h1>

            <p className="mt-6 text-xl text-white/80 max-w-lg leading-relaxed">
              Achieve your fitness goals with personalized workout programs, expert video
              guidance, and progress tracking that keeps you motivated.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/programs">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  leftIcon={<Play className="w-5 h-5" />}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  Browse Programs
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Slide Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-8 right-8 flex items-center gap-3"
          >
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold
                  transition-all duration-300 backdrop-blur-md
                  ${
                    index === currentImageIndex
                      ? "bg-white text-dark-950 scale-110"
                      : "bg-white/20 text-white hover:bg-white/30 border border-white/20"
                  }
                `}
              >
                {index + 1}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl md:text-5xl font-display font-bold gradient-text">
                  {stat.value}
                </p>
                <p className="text-dark-400 mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-dark-100">
              Everything You Need to{" "}
              <span className="gradient-text">Succeed</span>
            </h2>
            <p className="mt-4 text-xl text-dark-400 max-w-2xl mx-auto">
              Our platform provides all the tools and guidance you need to achieve your
              fitness goals.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group glass-hover rounded-2xl p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-cyan/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-dark-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-dark-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Programs Section */}
      <section className="py-24 bg-dark-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-12"
          >
            <div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-dark-100">
                Featured <span className="gradient-text">Programs</span>
              </h2>
              <p className="mt-4 text-xl text-dark-400 max-w-xl">
                Start your fitness journey with our most popular programs.
              </p>
            </div>
            <Link href="/programs" className="mt-4 md:mt-0">
              <Button variant="ghost" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View All Programs
              </Button>
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl glass p-5 animate-pulse"
                >
                  <div className="aspect-video rounded-xl bg-dark-700 mb-4" />
                  <div className="h-6 bg-dark-700 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-dark-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : featuredPrograms.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPrograms.map((program, index) => (
                <ProgramCard key={program.id} program={program} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass rounded-2xl">
              <Users className="w-12 h-12 text-dark-500 mx-auto mb-4" />
              <p className="text-dark-400">
                No featured programs available yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-dark-100">
              Loved by <span className="gradient-text">Thousands</span>
            </h2>
            <p className="mt-4 text-xl text-dark-400 max-w-2xl mx-auto">
              See what our members are saying about their transformation journey.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-accent-gold text-accent-gold"
                    />
                  ))}
                </div>
                <p className="text-dark-300 mb-6">&ldquo;{testimonial.content}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-cyan" />
                  <div>
                    <p className="font-semibold text-dark-100">{testimonial.name}</p>
                    <p className="text-sm text-dark-400">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-800" />
            <div className="absolute inset-0 bg-mesh opacity-30" />

            {/* Content */}
            <div className="relative px-8 py-16 md:px-16 md:py-24 text-center">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                Ready to Transform?
              </h2>
              <p className="text-xl text-primary-100 max-w-2xl mx-auto mb-8">
                Join thousands of people who have already started their fitness journey
                with SFC. Your transformation starts today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-white text-primary-700 hover:bg-dark-100"
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                  >
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/programs">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="text-white border-white/30 hover:bg-white/10"
                  >
                    Explore Programs
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

