'use client';

import React, { useMemo } from 'react';

/* ─── types ────────────────────────────────────────────────────────── */

interface MuscleMapProps {
  muscleGroups: string[];
  size?: 'sm' | 'md' | 'lg';
}

/* ─── region definitions ───────────────────────────────────────────── */

interface RegionDef {
  /** Which muscle-group key(s) activate this region */
  activationGroups: string[];
  /** Label shown beside the region when active */
  label: string;
  /** The SVG element(s) – each is a React fragment */
  elements: React.ReactNode;
  /** Label anchor position */
  labelX: number;
  labelY: number;
}

/* Color tokens */
const FILLED = '#10b981';       // emerald-500
const FILLED_LIGHT = 'rgba(16,185,129,0.30)';
const STROKE = '#6b7280';       // gray-500
const STROKE_LIGHT = '#d1d5db'; // gray-300
const LABEL_COLOR = '#065f46';  // emerald-800
const LABEL_BG = 'rgba(255,255,255,0.85)';

/* ──────────────────────────────────────────────────────────────────── */
/*  FRONT VIEW regions                                                  */
/* ──────────────────────────────────────────────────────────────────── */

const frontRegions: RegionDef[] = [
  /* ── CHEST (pectorals) ───────────────────────────── */
  {
    activationGroups: ['chest', 'full_body'],
    label: 'Chest',
    labelX: 75,
    labelY: 72,
    elements: (
      <>
        {/* left pectoral */}
        <path
          d="M50 60 Q48 56 55 54 L73 54 Q73 58 73 75 Q73 85 65 88 L52 88 Q46 88 46 80 Q46 70 50 60Z"
        />
        {/* right pectoral */}
        <path
          d="M100 60 Q102 56 95 54 L77 54 Q77 58 77 75 Q77 85 85 88 L98 88 Q104 88 104 80 Q104 70 100 60Z"
        />
      </>
    ),
  },

  /* ── ANTERIOR DELTS (front of shoulders) ─────────── */
  {
    activationGroups: ['shoulders', 'full_body'],
    label: 'Shoulders',
    labelX: 75,
    labelY: 56,
    elements: (
      <>
        <ellipse cx="38" cy="62" rx="14" ry="11" />
        <ellipse cx="112" cy="62" rx="14" ry="11" />
      </>
    ),
  },

  /* ── BICEPS (upper arm front) ────────────────────── */
  {
    activationGroups: ['biceps', 'full_body'],
    label: 'Biceps',
    labelX: 75,
    labelY: 88,
    elements: (
      <>
        <ellipse cx="30" cy="92" rx="8" ry="15" />
        <ellipse cx="120" cy="92" rx="8" ry="15" />
      </>
    ),
  },

  /* ── FOREARMS (lower arm front) ──────────────────── */
  {
    activationGroups: ['forearms', 'full_body'],
    label: 'Forearms',
    labelX: 75,
    labelY: 130,
    elements: (
      <>
        <rect x="24" y="112" width="10" height="36" rx="5" />
        <rect x="116" y="112" width="10" height="36" rx="5" />
      </>
    ),
  },

  /* ── ABS (central abdomen) ───────────────────────── */
  {
    activationGroups: ['core', 'full_body'],
    label: 'Abs',
    labelX: 75,
    labelY: 106,
    elements: (
      <rect x="62" y="95" width="26" height="42" rx="5" />
    ),
  },

  /* ── OBLIQUES (side abdomen) ─────────────────────── */
  {
    activationGroups: ['core', 'full_body'],
    label: 'Obliques',
    labelX: 75,
    labelY: 142,
    elements: (
      <>
        <rect x="49" y="98" width="13" height="32" rx="4" />
        <rect x="88" y="98" width="13" height="32" rx="4" />
      </>
    ),
  },

  /* ── HIP FLEXORS (upper thigh near hip) ──────────── */
  {
    activationGroups: ['legs', 'full_body'],
    label: 'Hip Flexors',
    labelX: 75,
    labelY: 158,
    elements: (
      <>
        <rect x="52" y="148" width="18" height="22" rx="5" />
        <rect x="80" y="148" width="18" height="22" rx="5" />
      </>
    ),
  },

  /* ── QUADS (front thigh) ─────────────────────────── */
  {
    activationGroups: ['legs', 'full_body'],
    label: 'Quads',
    labelX: 75,
    labelY: 200,
    elements: (
      <>
        <rect x="50" y="170" width="22" height="55" rx="7" />
        <rect x="78" y="170" width="22" height="55" rx="7" />
      </>
    ),
  },
];

/* ──────────────────────────────────────────────────────────────────── */
/*  BACK VIEW regions                                                   */
/* ──────────────────────────────────────────────────────────────────── */

const backRegions: RegionDef[] = [
  /* ── TRAPS (upper back / neck) ───────────────────── */
  {
    activationGroups: ['back', 'full_body'],
    label: 'Traps',
    labelX: 75,
    labelY: 56,
    elements: (
      <path d="M58 52 Q55 52 48 60 L38 72 L50 78 L75 82 L100 78 L112 72 L102 60 Q95 52 92 52 Z" />
    ),
  },

  /* ── REAR DELTS (back of shoulders) ──────────────── */
  {
    activationGroups: ['shoulders', 'full_body'],
    label: 'Rear Delts',
    labelX: 75,
    labelY: 68,
    elements: (
      <>
        <ellipse cx="38" cy="66" rx="12" ry="10" />
        <ellipse cx="112" cy="66" rx="12" ry="10" />
      </>
    ),
  },

  /* ── LATS (mid-back sides) ───────────────────────── */
  {
    activationGroups: ['back', 'full_body'],
    label: 'Lats',
    labelX: 75,
    labelY: 100,
    elements: (
      <>
        <path d="M50 78 L42 90 L40 110 L44 125 L55 125 L60 110 L62 85 Z" />
        <path d="M100 78 L108 90 L110 110 L106 125 L95 125 L90 110 L88 85 Z" />
      </>
    ),
  },

  /* ── TRICEPS (upper arm back) ────────────────────── */
  {
    activationGroups: ['triceps', 'full_body'],
    label: 'Triceps',
    labelX: 75,
    labelY: 86,
    elements: (
      <>
        <ellipse cx="30" cy="92" rx="8" ry="14" />
        <ellipse cx="120" cy="92" rx="8" ry="14" />
      </>
    ),
  },

  /* ── FOREARMS (back view, lower arm) ─────────────── */
  {
    activationGroups: ['forearms', 'full_body'],
    label: 'Forearms',
    labelX: 75,
    labelY: 130,
    elements: (
      <>
        <rect x="24" y="112" width="10" height="36" rx="5" />
        <rect x="116" y="112" width="10" height="36" rx="5" />
      </>
    ),
  },

  /* ── GLUTES (buttocks) ──────────────────────────── */
  {
    activationGroups: ['glutes', 'full_body'],
    label: 'Glutes',
    labelX: 75,
    labelY: 138,
    elements: (
      <>
        <ellipse cx="63" cy="140" rx="14" ry="12" />
        <ellipse cx="87" cy="140" rx="14" ry="12" />
      </>
    ),
  },

  /* ── HAMSTRINGS (back of thigh) ──────────────────── */
  {
    activationGroups: ['legs', 'full_body'],
    label: 'Hamstrings',
    labelX: 75,
    labelY: 200,
    elements: (
      <>
        <rect x="50" y="155" width="22" height="55" rx="7" />
        <rect x="78" y="155" width="22" height="55" rx="7" />
      </>
    ),
  },

  /* ── CALVES (back of lower leg) ──────────────────── */
  {
    activationGroups: ['calves', 'full_body'],
    label: 'Calves',
    labelX: 75,
    labelY: 248,
    elements: (
      <>
        <path d="M52 215 Q48 215 48 225 L48 258 Q48 270 56 272 L62 272 Q68 272 68 262 L68 225 Q68 215 64 215 Z" />
        <path d="M88 215 Q92 215 92 225 L92 258 Q92 270 84 272 L78 272 Q72 272 72 262 L72 225 Q72 215 76 215 Z" />
      </>
    ),
  },
];

/* ──────────────────────────────────────────────────────────────────── */
/*  Body outline path (shared between views)                           */
/* ──────────────────────────────────────────────────────────────────── */

const BODY_OUTLINE = (
  <g fill="none" stroke={STROKE_LIGHT} strokeWidth="1.5" strokeLinejoin="round">
    {/* head */}
    <ellipse cx="75" cy="25" rx="14" ry="17" />
    {/* neck */}
    <rect x="69" y="40" width="12" height="10" rx="3" fill="none" />
    {/* torso + legs as a single path for a clean outline */}
    <path
      d={`
        M55 50
        Q50 50 40 58
        L30 70
        Q24 76 24 82
        L24 108
        Q24 114 28 118
        L28 142
        Q28 148 32 150
        L36 152
        Q40 154 42 158
        L44 180
        L44 252
        Q44 264 50 268
        L52 282
        Q52 288 56 290
        L66 290
        Q70 290 70 286
        L70 252
        Q70 248 72 248
        L78 248
        Q80 248 80 252
        L80 286
        Q80 290 84 290
        L94 290
        Q98 290 98 282
        L100 268
        Q106 264 106 252
        L106 180
        L108 158
        Q110 154 114 152
        L118 150
        Q122 148 122 142
        L122 118
        Q126 114 126 108
        L126 82
        Q126 76 120 70
        L110 58
        Q100 50 95 50
        Z
      `}
    />
    {/* feet hints */}
    <path d="M52 286 L52 292 Q52 296 56 296 L64 296 Q66 296 66 292 L66 290" />
    <path d="M84 286 L84 292 Q84 296 88 296 L96 296 Q98 296 98 292 L98 290" />
    {/* inner leg separation */}
    <path d="M70 180 L72 252" strokeDasharray="2 2" opacity="0.4" />
  </g>
);

/* ──────────────────────────────────────────────────────────────────── */
/*  Size scale map                                                     */
/* ──────────────────────────────────────────────────────────────────── */

const SIZE_MAP = {
  sm: { scale: 0.65, fontSize: 7, labelFontSize: 6, gap: 4 },
  md: { scale: 1, fontSize: 8, labelFontSize: 7, gap: 8 },
  lg: { scale: 1.4, fontSize: 9, labelFontSize: 8, gap: 12 },
} as const;

/* ──────────────────────────────────────────────────────────────────── */
/*  Helpers                                                             */
/* ──────────────────────────────────────────────────────────────────── */

function isHighlighted(regionGroups: string[], activeSet: Set<string>): boolean {
  return regionGroups.some((g) => activeSet.has(g));
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Single silhouette                                                   */
/* ──────────────────────────────────────────────────────────────────── */

function Silhouette({
  title,
  regions,
  activeSet,
  fontSize,
  labelFontSize,
  showLabels,
}: {
  title: string;
  regions: RegionDef[];
  activeSet: Set<string>;
  fontSize: number;
  labelFontSize: number;
  showLabels: boolean;
}) {
  return (
    <svg
      viewBox="0 0 150 300"
      width="150"
      height="300"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${title} muscle view`}
      className="select-none"
    >
      {/* title */}
      <text
        x="75"
        y="7"
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="600"
        fill={STROKE}
        fontFamily="system-ui, sans-serif"
      >
        {title}
      </text>

      {/* body outline */}
      {BODY_OUTLINE}

      {/* muscle regions */}
      {regions.map((region) => {
        const active = isHighlighted(region.activationGroups, activeSet);
        return (
          <g key={region.label}>
            <g
              fill={active ? FILLED : 'transparent'}
              fillOpacity={active ? 0.75 : 0}
              stroke={active ? FILLED : STROKE_LIGHT}
              strokeWidth={active ? 1.2 : 0.8}
              strokeOpacity={active ? 1 : 0.5}
              style={{ transition: 'all 0.3s ease' }}
            >
              {region.elements}
            </g>

            {/* label */}
            {active && showLabels && (
              <g>
                <rect
                  x={region.labelX - 20}
                  y={region.labelY - 5}
                  width={40}
                  height={11}
                  rx={3}
                  fill={LABEL_BG}
                  stroke={FILLED}
                  strokeWidth={0.6}
                />
                <text
                  x={region.labelX}
                  y={region.labelY + 3}
                  textAnchor="middle"
                  fontSize={labelFontSize}
                  fontWeight="600"
                  fill={LABEL_COLOR}
                  fontFamily="system-ui, sans-serif"
                >
                  {region.label}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Main component                                                      */
/* ──────────────────────────────────────────────────────────────────── */

export default function MuscleMap({ muscleGroups, size = 'md' }: MuscleMapProps) {
  const config = SIZE_MAP[size];
  const showLabels = size !== 'sm';

  const activeSet = useMemo(() => new Set(muscleGroups), [muscleGroups]);

  const scaledWidth = Math.round(150 * config.scale);
  const scaledHeight = Math.round(300 * config.scale);
  const totalWidth = scaledWidth * 2 + config.gap * 3;

  return (
    <div
      className="flex items-start justify-center gap-0"
      style={{ width: totalWidth }}
    >
      <div style={{ width: scaledWidth, height: scaledHeight }}>
        <Silhouette
          title="Front"
          regions={frontRegions}
          activeSet={activeSet}
          fontSize={config.fontSize}
          labelFontSize={config.labelFontSize}
          showLabels={showLabels}
        />
      </div>
      <div style={{ width: scaledWidth, height: scaledHeight }}>
        <Silhouette
          title="Back"
          regions={backRegions}
          activeSet={activeSet}
          fontSize={config.fontSize}
          labelFontSize={config.labelFontSize}
          showLabels={showLabels}
        />
      </div>
    </div>
  );
}
