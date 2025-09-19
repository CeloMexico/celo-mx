"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Search } from "lucide-react";
import Link from "next/link";
import { COURSES } from "@/data/academy";
import { FilterState } from "@/components/academy/types";

function AcademyContent() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({
    q: "",
    level: "Todos",
    category: "Todos",
    sort: "Más Popular"
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Apply URL parameters to filters on component mount
  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setFilters(prev => ({
        ...prev,
        category: category
      }));
    }
  }, [searchParams]);

  // Get unique categories from courses
  const categories = useMemo(() => {
    const cats = Array.from(new Set(COURSES.map(course => course.category)));
    return cats.sort();
  }, []);

  // Separate available and coming soon courses
  const { availableCourses, comingSoonCourses } = useMemo(() => {
    // First course is available, rest are coming soon
    const available = [COURSES[0]]; // Reputación On-Chain course
    const comingSoon = COURSES.slice(1); // All other courses

    return {
      availableCourses: available,
      comingSoonCourses: comingSoon
    };
  }, []);

  // Filter and sort courses (for search functionality)
  const filteredCourses = useMemo(() => {
    let filtered = COURSES.filter(course => {
      // Search filter
      if (filters.q) {
        const query = filters.q.toLowerCase();
        const matchesSearch = 
          course.title.toLowerCase().includes(query) ||
          course.subtitle.toLowerCase().includes(query) ||
          course.tags.some(tag => tag.toLowerCase().includes(query)) ||
          course.instructor.name.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Level filter
      if (filters.level !== "Todos" && course.level !== filters.level) {
        return false;
      }

      // Category filter
      if (filters.category !== "Todos" && course.category !== filters.category) {
        return false;
      }

      return true;
    });

    // Sort courses
    switch (filters.sort) {
      case "Más Popular":
        filtered.sort((a, b) => b.learners - a.learners);
        break;
      case "Mejor Valorado":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "Más Reciente":
        // Sort by createdAt date
        filtered.sort((a, b) => {
          const dateA = new Date(a.createdAt || "2025-01-01");
          const dateB = new Date(b.createdAt || "2025-01-01");
          return dateB.getTime() - dateA.getTime();
        });
        break;
    }

    return filtered;
  }, [filters]);

  const handleEnroll = (course: any) => {
    console.log("Enrolling in course:", course.title);
    alert("¡La función de inscripción estará disponible pronto! Se integrará con la wallet Privy y rampas de pago.");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              <h1 className="text-4xl lg:text-5xl font-bold">Academia Celo</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Domina el desarrollo blockchain en Celo. Aprende contratos inteligentes, protocolos DeFi y DApps mobile-first.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Filtros</h2>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar cursos..."
                    value={filters.q}
                    onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Level filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Nivel</label>
                  <select
                    value={filters.level}
                    onChange={(e) => setFilters({ ...filters, level: e.target.value as "Principiante" | "Intermedio" | "Avanzado" | "Todos" })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Todos">Todos los Niveles</option>
                    <option value="Principiante">Principiante</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                  </select>
                </div>

                {/* Category filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Categoría</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Todos">Todas las Categorías</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Ordenar por</label>
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilters({ ...filters, sort: e.target.value as FilterState["sort"] })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Más Popular">Más Popular</option>
                    <option value="Mejor Valorado">Mejor Valorado</option>
                    <option value="Más Reciente">Más Reciente</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Available Courses Section */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 bg-green-500 rounded-full"></div>
                <h2 className="text-2xl font-bold">Disponible Ahora</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {availableCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <Link href={`/academy/${course.slug}`} className="block">
                      <div className="border rounded-lg p-4 bg-card hover:shadow-lg transition-all duration-300 cursor-pointer h-full relative">
                        <div className="absolute top-3 right-3">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                            Disponible
                          </span>
                        </div>
                        <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-4 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg text-center px-4">{course.title}</span>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.subtitle}</p>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">{course.level}</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">{course.category}</span>
                        </div>
                        <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
                          <span>⭐ {course.rating} ({course.ratingCount})</span>
                          <span>{course.learners.toLocaleString()} estudiantes</span>
                          <span>{course.durationHours}h</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold">
                            {course.isFree ? "Gratis" : `$${course.priceUSD}`}
                          </span>
                          <span className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors">
                            Ver Curso
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Coming Soon Courses Section */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 bg-orange-500 rounded-full"></div>
                <h2 className="text-2xl font-bold">Próximamente</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {comingSoonCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="border rounded-lg p-4 bg-card hover:shadow-lg transition-all duration-300 cursor-pointer h-full relative opacity-75">
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                          Próximamente
                        </span>
                      </div>
                      <div className="aspect-video bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg mb-4 flex items-center justify-center">
                        <span className="text-white font-semibold text-lg text-center px-4">{course.title}</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.subtitle}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">{course.level}</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">{course.category}</span>
                      </div>
                      <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
                        <span>⭐ {course.rating} ({course.ratingCount})</span>
                        <span>{course.learners.toLocaleString()} estudiantes</span>
                        <span>{course.durationHours}h</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">
                          {course.isFree ? "Gratis" : `$${course.priceUSD}`}
                        </span>
                        <span className="px-4 py-2 bg-gray-300 text-gray-600 rounded-md text-sm cursor-not-allowed">
                          Próximamente
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AcademyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando academia...</p>
        </div>
      </div>
    }>
      <AcademyContent />
    </Suspense>
  );
}