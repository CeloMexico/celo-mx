"use client";
import { Progress } from "@/components/ui/progress"; // shadcn
import { courseProgressPercent } from "@/lib/progress";

export default function CourseProgress({ courseSlug, totalModules }:{ courseSlug:string; totalModules:number }) {
  const percent = courseProgressPercent(courseSlug, totalModules);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Progreso del curso</span>
        <span>{percent}%</span>
      </div>
      <Progress value={percent} className="h-2" />
    </div>
  );
}
