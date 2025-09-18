"use client";

import { useState } from "react";
import { Heart, Share2, Check, Clock, Award, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Course } from "@/components/academy/types";

interface EnrollPanelProps {
  course: Course;
  onEnroll: (course: Course) => void;
}

export function EnrollPanel({ course, onEnroll }: EnrollPanelProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleEnroll = () => {
    onEnroll(course);
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    // You could add a toast notification here
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: course.title,
        text: course.subtitle,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
    }
  };

  return (
    <div className="space-y-6">
      {/* Pricing and Enroll */}
      <Card className="sticky top-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              {course.isFree ? (
                <div className="text-3xl font-bold text-green-600">Gratis</div>
              ) : (
                <div className="text-3xl font-bold">${course.priceUSD}</div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWishlist}
              className={`p-2 ${isWishlisted ? 'text-red-500' : 'text-muted-foreground'}`}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button 
            onClick={handleEnroll}
            className="w-full text-lg py-6"
            size="lg"
          >
            {course.isFree ? 'Inscribirse Gratis' : 'Inscribirse Ahora'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleShare}
            className="w-full flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Compartir Curso
          </Button>
        </CardContent>
      </Card>

      {/* What's Included */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lo que está incluido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium">Aprendizaje a tu ritmo</div>
                <div className="text-sm text-muted-foreground">Aprende a tu propia velocidad</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium">Acceso de por vida</div>
                <div className="text-sm text-muted-foreground">Accede al material del curso para siempre</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium">Certificado de finalización</div>
                <div className="text-sm text-muted-foreground">Obtén un certificado al terminar</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-600 rounded-full">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium">Móvil y escritorio</div>
                <div className="text-sm text-muted-foreground">Aprende en cualquier dispositivo</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Duración</span>
              <span className="font-medium">{course.durationHours} horas</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Lecciones</span>
              <span className="font-medium">{course.lessonsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nivel</span>
              <Badge variant="outline">{course.level}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estudiantes</span>
              <span className="font-medium">{course.learners.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
