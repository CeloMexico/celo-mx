import React from "react";

export default function RenderMdx({ source }: { source: string }) {
  if (!source) return null;
  
  // Temporary fallback to avoid React version conflicts
  return (
    <article className="prose prose-invert max-w-none prose-strong:text-celo-yellow prose-a:text-celo-yellow">
      <div 
        className="font-inter text-base md:text-lg leading-7 text-white/90"
        dangerouslySetInnerHTML={{ __html: source.replace(/\n/g, '<br/>') }}
      />
    </article>
  );
}


