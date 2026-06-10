'use client';

import React from 'react';
import SVG_PATHS from '@/lib/muscle-paths.json';

/* ─── types ────────────────────────────────────────────────────────── */

interface MuscleMapProps {
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  muscleGroups?: string[];
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

/* ─── mapping: exercise data → SVG CSS class names ─────────────────── */

const MUSCLE_TO_EXERCISE: Record<string, string[]> = {
  chest: ['pecs'],
  back: ['lats', 'traps', 'lower-back'],
  shoulders: ['front-side-delts', 'rear-delts'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearms-top', 'forearms-underside'],
  core: ['abs', 'obliques'],
  legs: ['quads', 'hamstrings', 'adductors-back', 'abductors-back', 'adductors-abductors-front'],
  glutes: ['glutes'],
  calves: ['calves'],
  neck: ['neck'],
  full_body: [
    'pecs', 'lats', 'traps', 'lower-back', 'front-side-delts', 'rear-delts',
    'biceps', 'triceps', 'forearms-top', 'forearms-underside',
    'abs', 'obliques', 'quads', 'hamstrings', 'glutes', 'calves',
    'adductors-back', 'abductors-back', 'adductors-abductors-front', 'neck',
  ],
};

/* ─── size config ──────────────────────────────────────────────────── */

const SIZE_CONFIG = {
  xs: { width: 130, height: 102 },
  sm: { width: 190, height: 148 },
  md: { width: 300, height: 234 },
  lg: { width: 400, height: 312 },
} as const;

/* ─── colors ───────────────────────────────────────────────────────── */

const COLORS = {
  primary: { fill: '#EF4444', opacity: 0.8, stroke: '#DC2626', strokeWidth: 0.5 },
  secondary: { fill: '#F59E0B', opacity: 0.65, stroke: '#D97706', strokeWidth: 0.5 },
  inactive: { fill: 'rgba(150,150,150,0.08)', opacity: 1, stroke: 'rgba(150,150,150,0.2)', strokeWidth: 0.3 },
};

/* ─── component ────────────────────────────────────────────────────── */

export default function MuscleMap({
  primaryMuscles = [],
  secondaryMuscles = [],
  muscleGroups,
  size = 'md',
}: MuscleMapProps) {
  // Legacy fallback
  const effectivePrimary = primaryMuscles.length > 0 ? primaryMuscles : (muscleGroups || []);
  const effectiveSecondary = primaryMuscles.length > 0 ? secondaryMuscles : [];

  // Resolve exercise muscle names → SVG CSS class names
  const primaryClasses = new Set<string>();
  const secondaryClasses = new Set<string>();

  effectivePrimary.forEach((m) => {
    (MUSCLE_TO_EXERCISE[m] || []).forEach((c) => primaryClasses.add(c));
  });
  effectiveSecondary.forEach((m) => {
    (MUSCLE_TO_EXERCISE[m] || []).forEach((c) => {
      if (!primaryClasses.has(c)) secondaryClasses.add(c);
    });
  });

  const config = SIZE_CONFIG[size];
  const showLegend = size === 'md' || size === 'lg';
  const hasAnyActive = primaryClasses.size > 0 || secondaryClasses.size > 0;

  return (
    <div className="inline-flex flex-col items-center">
      <div style={{ width: config.width, height: config.height }}>
        <svg
          viewBox="0 0 768.41 607.66"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          {Object.entries(SVG_PATHS).map(([cssClass, paths]) => {
            const isPrimary = primaryClasses.has(cssClass);
            const isSecondary = secondaryClasses.has(cssClass);
            const colors = isPrimary ? COLORS.primary : isSecondary ? COLORS.secondary : COLORS.inactive;

            return (
              <g key={cssClass}>
                {(paths as string[]).map((d, i) => (
                  <path
                    key={`${cssClass}-${i}`}
                    d={d}
                    fill={colors.fill}
                    fillOpacity={colors.opacity}
                    stroke={colors.stroke}
                    strokeWidth={colors.strokeWidth}
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {showLegend && hasAnyActive && (
        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
          {primaryClasses.size > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 opacity-80" />
              Primary
            </span>
          )}
          {secondaryClasses.size > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 opacity-70" />
              Secondary
            </span>
          )}
        </div>
      )}
    </div>
  );
}
