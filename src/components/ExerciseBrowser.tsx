'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import type {
  Exercise,
  ExerciseCategory,
  MuscleGroup,
  EquipmentType,
  Difficulty,
} from '@/lib/types';

export interface FilterState {
  category: ExerciseCategory | '';
  muscleGroup: MuscleGroup | '';
  equipment: EquipmentType | '';
  difficulty: Difficulty | '';
}

interface ExerciseBrowserProps {
  exercises: Exercise[];
  filters?: Partial<FilterState>;
  onSelect?: (exercise: Exercise) => void;
  showSelectButton?: boolean;
}

const CATEGORY_OPTIONS: { value: ExerciseCategory; label: string }[] = [
  { value: 'strength', label: 'Strength' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'flexibility', label: 'Flexibility' },
];

const MUSCLE_OPTIONS: { value: MuscleGroup; label: string }[] = [
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'triceps', label: 'Triceps' },
  { value: 'forearms', label: 'Forearms' },
  { value: 'core', label: 'Core' },
  { value: 'legs', label: 'Legs' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'calves', label: 'Calves' },
  { value: 'full_body', label: 'Full Body' },
];

const EQUIPMENT_OPTIONS: { value: EquipmentType; label: string }[] = [
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'cable', label: 'Cable' },
  { value: 'machine', label: 'Machine' },
  { value: 'resistance_band', label: 'Resistance Band' },
  { value: 'pull_up_bar', label: 'Pull Up Bar' },
  { value: 'bench', label: 'Bench' },
  { value: 'cardio_machine', label: 'Cardio Machine' },
  { value: 'jump_rope', label: 'Jump Rope' },
  { value: 'battle_ropes', label: 'Battle Ropes' },
  { value: 'foam_roller', label: 'Foam Roller' },
  { value: 'plyo_box', label: 'Plyo Box' },
  { value: 'pool', label: 'Pool' },
  { value: 'none', label: 'None' },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

function categoryColor(category: ExerciseCategory): string {
  switch (category) {
    case 'strength':
      return 'bg-info/15 text-info';
    case 'cardio':
      return 'bg-destructive/15 text-destructive';
    case 'flexibility':
      return 'bg-success/15 text-success';
  }
}

function difficultyColor(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'beginner':
      return 'bg-success/15 text-success';
    case 'intermediate':
      return 'bg-warning/15 text-warning';
    case 'advanced':
      return 'bg-destructive/15 text-destructive';
  }
}

function formatMuscle(m: MuscleGroup): string {
  return m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEquipment(e: EquipmentType): string {
  return e.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ExerciseBrowser({
  exercises,
  filters: initialFilters,
  onSelect,
  showSelectButton = true,
}: ExerciseBrowserProps) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    category: initialFilters?.category ?? '',
    muscleGroup: initialFilters?.muscleGroup ?? '',
    equipment: initialFilters?.equipment ?? '',
    difficulty: initialFilters?.difficulty ?? '',
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (search) {
        const q = search.toLowerCase();
        if (!ex.name.toLowerCase().includes(q)) return false;
      }
      if (filters.category && ex.category !== filters.category) return false;
      if (filters.muscleGroup && !ex.muscle_groups.includes(filters.muscleGroup))
        return false;
      if (filters.equipment && !ex.equipment.includes(filters.equipment))
        return false;
      if (filters.difficulty && ex.difficulty !== filters.difficulty) return false;
      return true;
    });
  }, [exercises, search, filters]);

  const hasActiveFilters =
    filters.category || filters.muscleGroup || filters.equipment || filters.difficulty;

  function clearFilters() {
    setFilters({ category: '', muscleGroup: '', equipment: '', difficulty: '' });
    setSearch('');
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2">
        <SelectFilter
          label="Category"
          value={filters.category}
          options={CATEGORY_OPTIONS}
          onChange={(v) => setFilters((f) => ({ ...f, category: v as ExerciseCategory | '' }))}
        />
        <SelectFilter
          label="Muscle"
          value={filters.muscleGroup}
          options={MUSCLE_OPTIONS}
          onChange={(v) => setFilters((f) => ({ ...f, muscleGroup: v as MuscleGroup | '' }))}
        />
        <SelectFilter
          label="Equipment"
          value={filters.equipment}
          options={EQUIPMENT_OPTIONS}
          onChange={(v) => setFilters((f) => ({ ...f, equipment: v as EquipmentType | '' }))}
        />
        <SelectFilter
          label="Difficulty"
          value={filters.difficulty}
          options={DIFFICULTY_OPTIONS}
          onChange={(v) => setFilters((f) => ({ ...f, difficulty: v as Difficulty | '' }))}
        />
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} exercise{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((exercise) => {
          const isExpanded = expandedId === exercise.id;
          return (
            <div
              key={exercise.id}
              className="bg-card border border-border rounded-xl overflow-hidden transition-shadow hover:shadow-md"
            >
              {/* Card header — clickable */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : exercise.id)}
                className="w-full text-left p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground leading-tight">
                    {exercise.name}
                  </h3>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${categoryColor(exercise.category)}`}
                  >
                    {exercise.category}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${difficultyColor(exercise.difficulty)}`}
                  >
                    {exercise.difficulty}
                  </span>
                </div>

                {/* Muscle tags */}
                <div className="flex flex-wrap gap-1">
                  {exercise.muscle_groups.slice(0, 3).map((m) => (
                    <span
                      key={m}
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-muted text-muted-foreground"
                    >
                      {formatMuscle(m)}
                    </span>
                  ))}
                  {exercise.muscle_groups.length > 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-muted text-muted-foreground">
                      +{exercise.muscle_groups.length - 3}
                    </span>
                  )}
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                  {exercise.description && (
                    <p className="text-sm text-muted-foreground">
                      {exercise.description}
                    </p>
                  )}

                  {/* All equipment */}
                  {exercise.equipment.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Equipment
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {exercise.equipment.map((e) => (
                          <span
                            key={e}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-muted text-muted-foreground"
                          >
                            {formatEquipment(e)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All muscle groups */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Muscles
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {exercise.muscle_groups.map((m) => (
                        <span
                          key={m}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-muted text-muted-foreground"
                        >
                          {formatMuscle(m)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {showSelectButton && onSelect && (
                    <button
                      type="button"
                      onClick={() => onSelect(exercise)}
                      className="w-full btn-primary text-sm mt-1"
                    >
                      Add to Plan
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No exercises found</p>
          <p className="text-sm mt-1">Try adjusting your filters or search</p>
        </div>
      )}
    </div>
  );
}

/* ── Internal select filter ── */

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1.5 text-xs font-medium bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
      style={{ backgroundImage: 'none' }}
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
