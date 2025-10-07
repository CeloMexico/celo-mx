'use client';

import React from 'react';
import { CourseWithRels } from './LessonLayout';
import { ReadingProgress } from '@/components/course/ReadingProgress';

type LessonContentProps = {
  course: CourseWithRels;
  current: { moduleIndex: number; subIndex: number };
  currentModule: {
    id: string;
    index: number;
    title: string;
    summary?: string | null;
    lessons: Array<{
      id: string;
      index: number;
      title: string;
      contentMdx?: string;
      status: string;
      visibility?: string;
    }>;
  };
  currentLesson: {
    id: string;
    index: number;
    title: string;
    contentMdx?: string;
    status: string;
    visibility?: string;
  };
  children: React.ReactNode;
};

export default function LessonContent({ 
  course, 
  current, 
  currentModule, 
  currentLesson, 
  children 
}: LessonContentProps) {
  const requiresWallet = (currentLesson.visibility === 'WALLET' || course.visibility === 'WALLET');

  // Navigation helpers
  const getPrevHref = () => {
    const flat = flattenLessons(course);
    const idx = flat.findIndex(x => x.m === current.moduleIndex && x.s === current.subIndex);
    if (idx > 0) {
      const p = flat[idx - 1];
      return `/academy/${course.slug}?m=${p.m}&s=${p.s}`;
    }
    return null;
  };

  const getNextHref = () => {
    const flat = flattenLessons(course);
    const idx = flat.findIndex(x => x.m === current.moduleIndex && x.s === current.subIndex);
    if (idx >= 0 && idx < flat.length - 1) {
      const n = flat[idx + 1];
      return `/academy/${course.slug}?m=${n.m}&s=${n.s}`;
    }
    return null;
  };

  const prevHref = getPrevHref();
  const nextHref = getNextHref();

  return (
    <>
      <ReadingProgress />
      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Lesson Header */}
      <div className="border-b border-white/10 bg-black/30 px-6 py-4">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-celo-yellow" />
          <span className="font-gt italic text-sm text-celo-yellow">
            Módulo {currentModule.index}
          </span>
        </div>
        <h1 className="font-gt italic text-2xl md:text-3xl text-celo-yellow mb-2">
          {currentLesson.title}
        </h1>
        <p className="font-inter text-white/80">
          {currentModule.title}
        </p>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {requiresWallet ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-celo-yellow/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-celo-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-gt italic text-xl text-celo-yellow mb-2">
                  Wallet Requerida
                </h3>
                <p className="font-inter text-white/80 mb-6">
                  Esta lección requiere una wallet conectada para continuar.
                </p>
                <button className="inline-flex items-center px-6 py-3 rounded-xl border border-celo-yellow/30 bg-celo-yellow/10 text-celo-yellow hover:bg-celo-yellow/20 transition-colors">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Conectar Wallet
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 md:p-8">
              <div className="prose-course">
                {children}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="border-t border-white/10 bg-black/30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex-1">
            {prevHref ? (
              <a 
                href={prevHref}
                className="inline-flex items-center space-x-2 text-celo-yellow hover:text-celo-yellow/80 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-inter">Anterior</span>
              </a>
            ) : (
              <div />
            )}
          </div>
          
          <div className="flex-1 flex justify-end">
            {nextHref ? (
              <a 
                href={nextHref}
                className="inline-flex items-center space-x-2 text-celo-yellow hover:text-celo-yellow/80 transition-colors"
              >
                <span className="font-inter">Siguiente</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

// Helper function to flatten lessons for navigation
function flattenLessons(course: CourseWithRels) {
  const out: { m: number; s: number }[] = [];
  for (const courseModule of course.modules) {
    for (const lesson of courseModule.lessons) {
      out.push({ m: courseModule.index, s: lesson.index });
    }
  }
  return out.sort((a, b) => a.m === b.m ? a.s - b.s : a.m - b.m);
}
