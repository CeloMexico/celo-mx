"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function ModuleProgress({
  courseSlug, moduleIndex
}:{ courseSlug:string; moduleIndex:number }) {
  // Simplified version without NFT connections
  const [done, setDone] = useState(false);

  function completeModule() {
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-emerald-600">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm font-medium">Módulo completado</span>
      </div>
    );
  }

  return (
    <Button onClick={completeModule} className="w-full md:w-auto">
      Completar módulo
    </Button>
  );
}