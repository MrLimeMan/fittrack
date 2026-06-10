'use client';

import React, { useMemo } from 'react';

/* ─── types ────────────────────────────────────────────────────────── */

interface MuscleMapProps {
  /** Legacy: flat list of muscle groups (all treated as primary) */
  muscleGroups?: string[];
  /** Primary muscle groups (red) */
  primaryMuscles?: string[];
  /** Secondary muscle groups (amber) */
  secondaryMuscles?: string[];
  size?: 'xs' | 'sm' | 'md' | 'lg';
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
const PRIMARY_COLOR = '#EF4444';      // red-500
const SECONDARY_COLOR = '#F59E0B';    // amber-500
const STROKE = '#9CA3AF';             // gray-400 (body outline)
const STROKE_LIGHT = '#D1D5DB';       // gray-300 (untargeted regions)
const LABEL_BG = 'rgba(255,255,255,0.9)';

/* ──────────────────────────────────────────────────────────────────── */
/*  FRONT VIEW regions                                                  */
/* ──────────────────────────────────────────────────────────────────── */

const frontRegions: RegionDef[] = [
  /* ── CHEST (pectorals) ───────────────────────────── */
  {
    activationGroups: ['chest', 'full_body'],
    label: 'Chest',
    labelX: 100,
    labelY: 78,
    elements: (
      <>
        {/* left pectoral */}
        <path
          d="M65 62 C62 58 55 55 52 58 C48 62 46 68 48 74 C50 80 56 86 62 88 L65 88 C68 88 72 84 72 80 C72 74 70 66 65 62Z"
        />
        {/* right pectoral */}
        <path
          d="M135 62 C138 58 145 55 148 58 C152 62 154 68 152 74 C150 80 144 86 138 88 L135 88 C132 88 128 84 128 80 C128 74 130 66 135 62Z"
        />
      </>
    ),
  },

  /* ── ANTERIOR DELTS (front of shoulders) ─────────── */
  {
    activationGroups: ['shoulders', 'full_body'],
    label: 'Shoulders',
    labelX: 100,
    labelY: 58,
    elements: (
      <>
        {/* left anterior delt */}
        <path
          d="M48 52 C44 52 40 56 38 62 C36 68 38 74 42 78 C46 82 50 82 54 80 C56 76 56 68 54 62 C52 56 50 52 48 52Z"
        />
        {/* right anterior delt */}
        <path
          d="M152 52 C156 52 160 56 162 62 C164 68 162 74 158 78 C154 82 150 82 146 80 C144 76 144 68 146 62 C148 56 150 52 152 52Z"
        />
      </>
    ),
  },

  /* ── BICEPS (upper arm front) ────────────────────── */
  {
    activationGroups: ['biceps', 'full_body'],
    label: 'Biceps',
    labelX: 100,
    labelY: 108,
    elements: (
      <>
        {/* left bicep */}
        <path
          d="M42 82 C38 82 34 86 32 92 C30 98 32 108 34 114 C36 120 40 124 44 126 C48 128 50 124 50 118 C50 110 48 96 46 88 C44 82 42 82 42 82Z"
        />
        {/* right bicep */}
        <path
          d="M158 82 C162 82 166 86 168 92 C170 98 168 108 166 114 C164 120 160 124 156 126 C152 128 150 124 150 118 C150 110 152 96 154 88 C156 82 158 82 158 82Z"
        />
      </>
    ),
  },

  /* ── FOREARMS (lower arm front) ──────────────────── */
  {
    activationGroups: ['forearms', 'full_body'],
    label: 'Forearms',
    labelX: 100,
    labelY: 150,
    elements: (
      <>
        {/* left forearm */}
        <path
          d="M44 128 C40 130 36 136 34 142 C32 148 30 158 30 164 C30 170 32 176 36 178 C40 180 44 178 46 174 C48 168 48 158 46 150 C44 142 44 134 44 128Z"
        />
        {/* right forearm */}
        <path
          d="M156 128 C160 130 164 136 166 142 C168 148 170 158 170 164 C170 170 168 176 164 178 C160 180 156 178 154 174 C152 168 152 158 154 150 C156 142 156 134 156 128Z"
        />
      </>
    ),
  },

  /* ── ABS (central abdomen) ───────────────────────── */
  {
    activationGroups: ['core', 'full_body'],
    label: 'Abs',
    labelX: 100,
    labelY: 112,
    elements: (
      <>
        {/* main rectus abdominis */}
        <path
          d="M88 86 C86 86 84 90 84 94 L84 126 C84 132 88 136 92 136 L108 136 C112 136 116 132 116 126 L116 94 C116 90 114 86 112 86 Z"
        />
        {/* horizontal lines for six-pack appearance */}
        <line x1="86" y1="96" x2="114" y2="96" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        <line x1="86" y1="106" x2="114" y2="106" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        <line x1="86" y1="116" x2="114" y2="116" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        <line x1="100" y1="88" x2="100" y2="134" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      </>
    ),
  },

  /* ── OBLIques (side abdomen) ─────────────────────── */
  {
    activationGroups: ['obliques', 'core', 'full_body'],
    label: 'Obliques',
    labelX: 100,
    labelY: 142,
    elements: (
      <>
        {/* left oblique */}
        <path
          d="M68 86 C66 86 64 90 64 96 L64 128 C64 134 66 138 70 140 L82 140 C86 138 88 134 88 128 L88 94 C88 88 86 86 82 86 Z"
        />
        {/* right oblique */}
        <path
          d="M132 86 C134 86 136 90 136 96 L136 128 C136 134 134 138 130 140 L118 140 C114 138 112 134 112 128 L112 94 C112 88 114 86 118 86 Z"
        />
      </>
    ),
  },

  /* ── HIP FLEXORS (upper thigh near hip) ──────────── */
  {
    activationGroups: ['legs', 'full_body'],
    label: 'Hip Flexors',
    labelX: 100,
    labelY: 168,
    elements: (
      <>
        {/* left hip flexor */}
        <path
          d="M72 142 C68 142 64 146 64 152 L64 168 C64 172 66 176 70 178 L82 178 C86 176 88 172 88 168 L88 152 C88 146 86 142 82 142 Z"
        />
        {/* right hip flexor */}
        <path
          d="M128 142 C132 142 136 146 136 152 L136 168 C136 172 134 176 130 178 L118 178 C114 176 112 172 112 168 L112 152 C112 146 114 142 118 142 Z"
        />
      </>
    ),
  },

  /* ── QUADS (front thigh) ─────────────────────────── */
  {
    activationGroups: ['quads', 'legs', 'full_body'],
    label: 'Quads',
    labelX: 100,
    labelY: 228,
    elements: (
      <>
        {/* left quad */}
        <path
          d="M70 180 C64 180 58 186 56 194 C54 204 54 216 56 226 C58 236 62 244 68 248 C72 250 76 250 80 248 C84 244 86 236 86 226 C86 216 84 206 82 196 C80 186 78 180 70 180Z"
        />
        {/* right quad */}
        <path
          d="M130 180 C136 180 142 186 144 194 C146 204 146 216 144 226 C142 236 138 244 132 248 C128 250 124 250 120 248 C116 244 114 236 114 226 C114 216 116 206 118 196 C120 186 122 180 130 180Z"
        />
        {/* quad muscle definition lines */}
        <path d="M66 200 C64 210 62 220 64 234" stroke="currentColor" strokeWidth="0.5" opacity="0.3" fill="none" />
        <path d="M78 200 C80 210 82 220 80 234" stroke="currentColor" strokeWidth="0.5" opacity="0.3" fill="none" />
        <path d="M122 200 C120 210 118 220 120 234" stroke="currentColor" strokeWidth="0.5" opacity="0.3" fill="none" />
        <path d="M134 200 C136 210 138 220 136 234" stroke="currentColor" strokeWidth="0.5" opacity="0.3" fill="none" />
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
    activationGroups: ['back', 'traps', 'full_body'],
    label: 'Traps',
    labelX: 100,
    labelY: 58,
    elements: (
      <>
        {/* left trap */}
        <path
          d="M100 44 C92 44 82 48 76 54 C72 58 70 62 70 68 C70 72 72 76 76 78 L100 82 L100 44Z"
        />
        {/* right trap */}
        <path
          d="M100 44 C108 44 118 48 124 54 C128 58 130 62 130 68 C130 72 128 76 124 78 L100 82 L100 44Z"
        />
        {/* trap definition */}
        <path d="M100 48 L100 80" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        <path d="M86 54 L100 68" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        <path d="M114 54 L100 68" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      </>
    ),
  },

  /* ── REAR DELTS (back of shoulders) ──────────────── */
  {
    activationGroups: ['shoulders', 'full_body'],
    label: 'Rear Delts',
    labelX: 100,
    labelY: 72,
    elements: (
      <>
        {/* left rear delt */}
        <path
          d="M70 56 C66 56 62 60 60 66 C58 72 60 78 64 82 C68 86 72 86 76 84 C78 80 78 72 76 66 C74 60 72 56 70 56Z"
        />
        {/* right rear delt */}
        <path
          d="M130 56 C134 56 138 60 140 66 C142 72 140 78 136 82 C132 86 128 86 124 84 C122 80 122 72 124 66 C126 60 128 56 130 56Z"
        />
      </>
    ),
  },

  /* ── LATS (mid-back sides) ───────────────────────── */
  {
    activationGroups: ['back', 'lats', 'full_body'],
    label: 'Lats',
    labelX: 100,
    labelY: 108,
    elements: (
      <>
        {/* left lat */}
        <path
          d="M70 80 C66 80 60 86 56 94 C52 102 50 112 52 122 C54 132 58 136 64 138 L76 138 C80 136 84 130 84 122 C84 112 82 100 78 92 C74 84 72 80 70 80Z"
        />
        {/* right lat */}
        <path
          d="M130 80 C134 80 140 86 144 94 C148 102 150 112 148 122 C146 132 142 136 136 138 L124 138 C120 136 116 130 116 122 C116 112 118 100 122 92 C126 84 128 80 130 80Z"
        />
        {/* lat definition */}
        <path d="M62 100 C66 108 72 116 78 124" stroke="currentColor" strokeWidth="0.5" opacity="0.3" fill="none" />
        <path d="M138 100 C134 108 128 116 122 124" stroke="currentColor" strokeWidth="0.5" opacity="0.3" fill="none" />
      </>
    ),
  },

  /* ── TRICEPS (upper arm back) ────────────────────── */
  {
    activationGroups: ['triceps', 'full_body'],
    label: 'Triceps',
    labelX: 100,
    labelY: 118,
    elements: (
      <>
        {/* left tricep */}
        <path
          d="M54 84 C50 84 46 88 44 94 C42 100 42 108 44 114 C46 120 50 126 54 128 C58 130 62 128 62 122 C62 114 60 104 58 96 C56 88 54 84 54 84Z"
        />
        {/* right tricep */}
        <path
          d="M146 84 C150 84 154 88 156 94 C158 100 158 108 156 114 C154 120 150 126 146 128 C142 130 138 128 138 122 C138 114 140 104 142 96 C144 88 146 84 146 84Z"
        />
        {/* tricep horseshoe definition */}
        <path d="M50 92 C52 100 54 110 52 120" stroke="currentColor" strokeWidth="0.5" opacity="0.3" fill="none" />
        <path d="M150 92 C148 100 146 110 148 120" stroke="currentColor" strokeWidth="0.5" opacity="0.3" fill="none" />
      </>
    ),
  },

  /* ── FOREARMS (back view, lower arm) ─────────────── */
  {
    activationGroups: ['forearms', 'full_body'],
    label: 'Forearms',
    labelX: 100,
    labelY: 158,
    elements: (
      <>
        {/* left forearm */}
        <path
          d="M52 130 C48 132 44 138 42 144 C40 150 38 160 38 166 C38 172 40 178 44 180 C48 182 52 180 54 176 C56 170 56 160 54 152 C52 144 52 136 52 130Z"
        />
        {/* right forearm */}
        <path
          d="M148 130 C152 132 156 138 158 144 C160 150 162 160 162 166 C162 172 160 178 156 180 C152 182 148 180 146 176 C144 170 144 160 146 152 C148 144 148 136 148 130Z"
        />
      </>
    ),
  },

  /* ── GLUTES (buttocks) ──────────────────────────── */
  {
    activationGroups: ['glutes', 'full_body'],
    label: 'Glutes',
    labelX: 100,
    labelY: 148,
    elements: (
      <>
        {/* left glute */}
        <path
          d="M88 130 C82 130 74 134 70 140 C66 148 66 158 70 164 C74 170 82 174 88 174 C94 174 98 170 100 164 C102 158 100 148 96 140 C92 134 90 130 88 130Z"
        />
        {/* right glute */}
        <path
          d="M112 130 C118 130 126 134 130 140 C134 148 134 158 130 164 C126 170 118 174 112 174 C106 174 102 170 100 164 C98 158 100 148 104 140 C108 134 110 130 112 130Z"
        />
        {/* glute definition */}
        <path d="M80 148 C84 156 92 164 100 164" stroke="currentColor" strokeWidth="0.5" opacity="0.3" fill="none" />
        <path d="M120 148 C116 156 108 164 100 164" stroke="currentColor" strokeWidth="0.5" opacity="0.3" fill="none" />
      </>
    ),
  },

  /* ── HAMSTRINGS (back of thigh) ──────────────────── */
  {
    activationGroups: ['hamstrings', 'legs', 'full_body'],
    label: 'Hamstrings',
    labelX: 100,
    labelY: 228,
    elements: (
      <>
        {/* left hamstring */}
        <path
          d="M72 176 C66 176 60 182 58 190 C56 200 56 212 58 222 C60 232 64 240 70 244 C74 246 78 246 82 244 C86 240 88 232 88 222 C88 212 86 202 84 192 C82 182 78 176 72 176Z"
        />
        {/* right hamstring */}
        <path
          d="M128 176 C134 176 140 182 142 190 C144 200 144 212 142 222 C140 232 136 240 130 244 C126 246 122 246 118 244 C114 240 112 232 112 222 C112 212 114 202 116 192 C118 182 122 176 128 176Z"
        />
        {/* hamstring definition */}
        <path d="M66 200 C70 210 74 220 72 234" stroke="currentColor" strokeWidth="0.5" opacity="0.3" fill="none" />
        <path d="M80 200 C76 210 74 220 76 234" stroke="currentColor" strokeWidth="0.5" opacity="0.3" fill="none" />
        <path d="M120 200 C124 210 126 220 124 234" stroke="currentColor" strokeWidth="0.5" opacity="0.3" fill="none" />
        <path d="M134 200 C130 210 126 220 128 234" stroke="currentColor" strokeWidth="0.5" opacity="0.3" fill="none" />
      </>
    ),
  },

  /* ── CALVES (back of lower leg) ──────────────────── */
  {
    activationGroups: ['calves', 'full_body'],
    label: 'Calves',
    labelX: 100,
    labelY: 280,
    elements: (
      <>
        {/* left calf - gastrocnemius */}
        <path
          d="M68 246 C62 246 56 252 54 260 C52 268 52 278 54 286 C56 294 60 300 66 302 C70 304 74 304 78 302 C82 300 84 294 84 286 C84 278 82 268 80 260 C78 252 74 246 68 246Z"
        />
        {/* right calf - gastrocnemius */}
        <path
          d="M132 246 C138 246 144 252 146 260 C148 268 148 278 146 286 C144 294 140 300 134 302 C130 304 126 304 122 302 C118 300 116 294 116 286 C116 278 118 268 120 260 C122 252 126 246 132 246Z"
        />
        {/* calf definition */}
        <path d="M62 268 C66 276 72 284 74 294" stroke="currentColor" strokeWidth="0.5" opacity="0.3" fill="none" />
        <path d="M76 268 C72 276 68 284 66 294" stroke="currentColor" strokeWidth="0.5" opacity="0.3" fill="none" />
        <path d="M124 268 C128 276 132 284 134 294" stroke="currentColor" strokeWidth="0.5" opacity="0.3" fill="none" />
        <path d="M138 268 C134 276 130 284 128 294" stroke="currentColor" strokeWidth="0.5" opacity="0.3" fill="none" />
      </>
    ),
  },
];

/* ──────────────────────────────────────────────────────────────────── */
/*  Body outline paths (front + back views)                             */
/* ──────────────────────────────────────────────────────────────────── */

const BODY_OUTLINE_FRONT = (
  <g fill="none" stroke={STROKE} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
    {/* Head */}
    <path d="M92 20 C86 20 80 24 78 30 C76 36 76 42 78 46 L84 50 C86 48 90 46 100 46 C110 46 114 48 116 50 L122 46 C124 42 124 36 122 30 C120 24 114 20 108 20" />
    
    {/* Neck */}
    <path d="M94 50 L94 58 M106 50 L106 58" />
    
    {/* Shoulders and torso */}
    <path d="M94 58 C88 58 78 56 70 54 C62 52 56 54 50 58 L42 64 C38 68 36 74 36 80 L36 104 C36 110 40 116 44 118" />
    <path d="M106 58 C112 58 122 56 130 54 C138 52 144 54 150 58 L158 64 C162 68 164 74 164 80 L164 104 C164 110 160 116 156 118" />
    
    {/* Torso sides */}
    <path d="M44 118 C44 128 46 138 48 148 L50 156 C52 162 56 166 60 168" />
    <path d="M156 118 C156 128 154 138 152 148 L150 156 C148 162 144 166 140 168" />
    
    {/* Hips */}
    <path d="M60 168 C66 170 72 172 80 172 C88 172 94 172 100 172 C106 172 112 172 120 172 C128 172 134 170 140 168" />
    
    {/* Inner thigh separation */}
    <path d="M100 172 L100 186" strokeDasharray="2 2" opacity="0.4" />
    
    {/* Left leg outer */}
    <path d="M60 168 C54 178 50 190 48 204 C46 218 46 234 48 250 C50 266 54 280 60 290 C64 296 70 300 76 302" />
    <path d="M80 172 C78 186 76 200 76 216 C76 232 78 248 80 260 C82 272 84 284 86 292 C88 298 90 302 92 304" />
    
    {/* Right leg outer */}
    <path d="M140 168 C146 178 150 190 152 204 C154 218 154 234 152 250 C150 266 146 280 140 290 C136 296 130 300 124 302" />
    <path d="M120 172 C122 186 124 200 124 216 C124 232 122 248 120 260 C118 272 116 284 114 292 C112 298 110 302 108 304" />
    
    {/* Feet */}
    <path d="M76 302 C72 304 68 306 66 310 C64 314 66 318 70 320 L84 320 C88 318 90 314 88 310 L86 304" />
    <path d="M124 302 C128 304 132 306 134 310 C136 314 134 318 130 320 L116 320 C112 318 110 314 112 310 L114 304" />
    
    {/* Left arm */}
    <path d="M36 80 C32 84 28 90 26 98 C24 106 24 116 26 124 C28 132 30 140 34 148 C36 152 38 156 40 162 C42 168 42 174 40 178" />
    <path d="M50 82 C46 86 42 94 40 102 C38 110 38 120 40 128 C42 136 44 144 46 152 C48 158 48 164 48 170 C48 176 46 180 44 182" />
    
    {/* Right arm */}
    <path d="M164 80 C168 84 172 90 174 98 C176 106 176 116 174 124 C172 132 170 140 166 148 C164 152 162 156 160 162 C158 168 158 174 160 178" />
    <path d="M150 82 C154 86 158 94 160 102 C162 110 162 120 160 128 C158 136 156 144 154 152 C152 158 152 164 152 170 C152 176 154 180 156 182" />
    
    {/* Hands */}
    <path d="M40 178 C36 182 32 186 30 192 C28 196 30 200 34 202 L44 202 C48 200 50 196 48 192 L44 182" />
    <path d="M160 178 C164 182 168 186 170 192 C172 196 170 200 166 202 L156 202 C152 200 150 196 152 192 L156 182" />
    
    {/* Chest line */}
    <path d="M64 72 C72 78 84 82 100 82 C116 82 128 78 136 72" strokeDasharray="2 2" opacity="0.3" />
    
    {/* Collarbone */}
    <path d="M76 62 C84 64 92 66 100 66 C108 66 116 64 124 62" strokeDasharray="2 2" opacity="0.3" />
  </g>
);

const BODY_OUTLINE_BACK = (
  <g fill="none" stroke={STROKE} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
    {/* Head */}
    <path d="M92 20 C86 20 80 24 78 30 C76 36 76 42 78 46 L84 50 C86 48 90 46 100 46 C110 46 114 48 116 50 L122 46 C124 42 124 36 122 30 C120 24 114 20 108 20" />
    
    {/* Neck */}
    <path d="M94 50 L94 58 M106 50 L106 58" />
    
    {/* Shoulders and torso */}
    <path d="M94 58 C88 58 78 56 70 54 C62 52 56 54 50 58 L42 64 C38 68 36 74 36 80 L36 104 C36 110 40 116 44 118" />
    <path d="M106 58 C112 58 122 56 130 54 C138 52 144 54 150 58 L158 64 C162 68 164 74 164 80 L164 104 C164 110 160 116 156 118" />
    
    {/* Torso sides */}
    <path d="M44 118 C44 128 46 138 48 148 L50 156 C52 162 56 166 60 168" />
    <path d="M156 118 C156 128 154 138 152 148 L150 156 C148 162 144 166 140 168" />
    
    {/* Hips */}
    <path d="M60 168 C66 170 72 172 80 172 C88 172 94 172 100 172 C106 172 112 172 120 172 C128 172 134 170 140 168" />
    
    {/* Inner thigh separation */}
    <path d="M100 172 L100 186" strokeDasharray="2 2" opacity="0.4" />
    
    {/* Left leg outer */}
    <path d="M60 168 C54 178 50 190 48 204 C46 218 46 234 48 250 C50 266 54 280 60 290 C64 296 70 300 76 302" />
    <path d="M80 172 C78 186 76 200 76 216 C76 232 78 248 80 260 C82 272 84 284 86 292 C88 298 90 302 92 304" />
    
    {/* Right leg outer */}
    <path d="M140 168 C146 178 150 190 152 204 C154 218 154 234 152 250 C150 266 146 280 140 290 C136 296 130 300 124 302" />
    <path d="M120 172 C122 186 124 200 124 216 C124 232 122 248 120 260 C118 272 116 284 114 292 C112 298 110 302 108 304" />
    
    {/* Feet */}
    <path d="M76 302 C72 304 68 306 66 310 C64 314 66 318 70 320 L84 320 C88 318 90 314 88 310 L86 304" />
    <path d="M124 302 C128 304 132 306 134 310 C136 314 134 318 130 320 L116 320 C112 318 110 314 112 310 L114 304" />
    
    {/* Left arm */}
    <path d="M36 80 C32 84 28 90 26 98 C24 106 24 116 26 124 C28 132 30 140 34 148 C36 152 38 156 40 162 C42 168 42 174 40 178" />
    <path d="M50 82 C46 86 42 94 40 102 C38 110 38 120 40 128 C42 136 44 144 46 152 C48 158 48 164 48 170 C48 176 46 180 44 182" />
    
    {/* Right arm */}
    <path d="M164 80 C168 84 172 90 174 98 C176 106 176 116 174 124 C172 132 170 140 166 148 C164 152 162 156 160 162 C158 168 158 174 160 178" />
    <path d="M150 82 C154 86 158 94 160 102 C162 110 162 120 160 128 C158 136 156 144 154 152 C152 158 152 164 152 170 C152 176 154 180 156 182" />
    
    {/* Hands */}
    <path d="M40 178 C36 182 32 186 30 192 C28 196 30 200 34 202 L44 202 C48 200 50 196 48 192 L44 182" />
    <path d="M160 178 C164 182 168 186 170 192 C172 196 170 200 166 202 L156 202 C152 200 150 196 152 192 L156 182" />
    
    {/* Spine */}
    <path d="M100 50 L100 172" strokeDasharray="2 2" opacity="0.3" />
    
    {/* Shoulder blades */}
    <path d="M78 70 C76 74 76 80 78 84 C80 88 86 90 92 88" strokeDasharray="2 2" opacity="0.3" />
    <path d="M122 70 C124 74 124 80 122 84 C120 88 114 90 108 88" strokeDasharray="2 2" opacity="0.3" />
  </g>
);

/* ──────────────────────────────────────────────────────────────────── */
/*  Size scale map                                                     */
/* ──────────────────────────────────────────────────────────────────── */

const SIZE_MAP = {
  xs: { scale: 0.35, fontSize: 0, labelFontSize: 0, gap: 4 },
  sm: { scale: 0.5, fontSize: 7, labelFontSize: 6, gap: 6 },
  md: { scale: 1, fontSize: 9, labelFontSize: 7, gap: 12 },
  lg: { scale: 1.3, fontSize: 10, labelFontSize: 8, gap: 16 },
} as const;

/* ──────────────────────────────────────────────────────────────────── */
/*  Helpers                                                             */
/* ──────────────────────────────────────────────────────────────────── */

function getRegionColor(
  regionGroups: string[],
  primarySet: Set<string>,
  secondarySet: Set<string>
): { fill: string; fillOpacity: number; stroke: string } {
  const isPrimary = regionGroups.some((g) => primarySet.has(g));
  const isSecondary = regionGroups.some((g) => secondarySet.has(g));

  if (isPrimary) {
    return { fill: PRIMARY_COLOR, fillOpacity: 0.7, stroke: PRIMARY_COLOR };
  }
  if (isSecondary) {
    return { fill: SECONDARY_COLOR, fillOpacity: 0.6, stroke: SECONDARY_COLOR };
  }
  return { fill: 'transparent', fillOpacity: 0, stroke: STROKE_LIGHT };
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Single silhouette                                                   */
/* ──────────────────────────────────────────────────────────────────── */

function Silhouette({
  title,
  regions,
  bodyOutline,
  primarySet,
  secondarySet,
  fontSize,
  labelFontSize,
  showLabels,
}: {
  title: string;
  regions: RegionDef[];
  bodyOutline: React.ReactNode;
  primarySet: Set<string>;
  secondarySet: Set<string>;
  fontSize: number;
  labelFontSize: number;
  showLabels: boolean;
}) {
  return (
    <svg
      viewBox="0 0 200 330"
      width="200"
      height="330"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${title} muscle view`}
      className="select-none"
    >
      {/* Title */}
      <text
        x="100"
        y="12"
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="600"
        fill="#6B7280"
        fontFamily="system-ui, sans-serif"
      >
        {title}
      </text>

      {/* Body outline */}
      {bodyOutline}

      {/* Muscle regions */}
      {regions.map((region) => {
        const colors = getRegionColor(region.activationGroups, primarySet, secondarySet);
        return (
          <g key={region.label}>
            <g
              fill={colors.fill}
              fillOpacity={colors.fillOpacity}
              stroke={colors.stroke}
              strokeWidth={colors.fill !== 'transparent' ? 1 : 0.8}
              strokeOpacity={colors.fill !== 'transparent' ? 1 : 0.5}
              style={{ transition: 'all 0.3s ease' }}
            >
              {region.elements}
            </g>

            {/* Label */}
            {colors.fill !== 'transparent' && showLabels && (
              <g>
                <rect
                  x={region.labelX - 22}
                  y={region.labelY - 5}
                  width={44}
                  height={12}
                  rx={3}
                  fill={LABEL_BG}
                  stroke={colors.stroke}
                  strokeWidth={0.6}
                />
                <text
                  x={region.labelX}
                  y={region.labelY + 4}
                  textAnchor="middle"
                  fontSize={labelFontSize}
                  fontWeight="600"
                  fill={colors.stroke}
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

export default function MuscleMap({
  muscleGroups,
  primaryMuscles = [],
  secondaryMuscles = [],
  size = 'md',
}: MuscleMapProps) {
  const config = SIZE_MAP[size];
  const showLabels = size === 'md' || size === 'lg';

  // If only muscleGroups is provided (legacy usage), treat all as primary
  const effectivePrimary = useMemo(() => {
    if (primaryMuscles.length > 0) return primaryMuscles;
    return muscleGroups || [];
  }, [primaryMuscles, muscleGroups]);

  const primarySet = useMemo(() => new Set(effectivePrimary), [effectivePrimary]);
  const secondarySet = useMemo(() => new Set(secondaryMuscles), [secondaryMuscles]);

  const scaledWidth = Math.round(200 * config.scale);
  const scaledHeight = Math.round(330 * config.scale);
  const totalWidth = scaledWidth * 2 + config.gap * 3;

  return (
    <div className="flex flex-col items-center">
      <div
        className="flex items-start justify-center"
        style={{ width: totalWidth, gap: config.gap }}
      >
        <div style={{ width: scaledWidth, height: scaledHeight }}>
          <Silhouette
            title="Front"
            regions={frontRegions}
            bodyOutline={BODY_OUTLINE_FRONT}
            primarySet={primarySet}
            secondarySet={secondarySet}
            fontSize={config.fontSize}
            labelFontSize={config.labelFontSize}
            showLabels={showLabels}
          />
        </div>
        <div style={{ width: scaledWidth, height: scaledHeight }}>
          <Silhouette
            title="Back"
            regions={backRegions}
            bodyOutline={BODY_OUTLINE_BACK}
            primarySet={primarySet}
            secondarySet={secondarySet}
            fontSize={config.fontSize}
            labelFontSize={config.labelFontSize}
            showLabels={showLabels}
          />
        </div>
      </div>

      {/* Legend — hidden on xs/sm */}
      {showLabels && (
      <div className="flex items-center justify-center gap-4 mt-2" style={{ fontSize: config.fontSize }}>
        <div className="flex items-center gap-1">
          <div
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: PRIMARY_COLOR,
              opacity: 0.7,
            }}
          />
          <span className="text-gray-600">Primary</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: SECONDARY_COLOR,
              opacity: 0.6,
            }}
          />
          <span className="text-gray-600">Secondary</span>
        </div>
      </div>
      )}
    </div>
  );
}
