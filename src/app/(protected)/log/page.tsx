'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Zap,
  ClipboardList,
  LayoutList,
  Plus,
  X,
  Search,
  Dumbbell,
  Check,
  Loader2,
  Trash2,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  ExternalLink,
  Users,
} from 'lucide-react';
import MuscleMap from '@/components/MuscleMap';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { Exercise, WorkoutPlan, WorkoutPlanExercise } from '@/lib/types';

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */

type LogTab = 'quick' | 'detailed' | 'plan';

type WorkoutType = 'strength' | 'cardio' | 'flexibility' | 'other';

interface DetailedExercise {
  exercise_id: string;
  exercise_name: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
}

interface PlanExerciseItem {
  workout_plan_exercise_id: string;
  exercise_id: string;
  exercise_name: string;
  target_sets: number | null;
  target_reps: string | null;
  actual_sets: string;
  actual_reps: string;
  actual_weight: string;
}

interface UserGroup {
  group_id: string;
  group_name: string;
}

/* ──────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────── */

const WORKOUT_TYPES: { value: WorkoutType; label: string; color: string; activeColor: string }[] = [
  { value: 'strength', label: 'Strength', color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', activeColor: 'bg-red-500 text-white border-red-500 dark:bg-red-500 dark:text-white dark:border-red-500' },
  { value: 'cardio', label: 'Cardio', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', activeColor: 'bg-blue-500 text-white border-blue-500 dark:bg-blue-500 dark:text-white dark:border-blue-500' },
  { value: 'flexibility', label: 'Flexibility', color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800', activeColor: 'bg-purple-500 text-white border-purple-500 dark:bg-purple-500 dark:text-white dark:border-purple-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700', activeColor: 'bg-gray-500 text-white border-gray-500 dark:bg-gray-500 dark:text-white dark:border-gray-500' },
];

const TABS: { value: LogTab; label: string; icon: typeof Zap }[] = [
  { value: 'quick', label: 'Quick Log', icon: Zap },
  { value: 'detailed', label: 'Detailed Log', icon: ClipboardList },
  { value: 'plan', label: 'From Plan', icon: LayoutList },
];

/* ──────────────────────────────────────────────
   WorkoutTypeSelector (shared)
   ────────────────────────────────────────────── */

function WorkoutTypeSelector({
  value,
  onChange,
}: {
  value: WorkoutType;
  onChange: (v: WorkoutType) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {WORKOUT_TYPES.map((wt) => {
        const isActive = value === wt.value;
        return (
          <button
            key={wt.value}
            type="button"
            onClick={() => onChange(wt.value)}
            className={`py-2.5 px-2 rounded-lg border text-sm font-medium transition-all ${
              isActive ? wt.activeColor : wt.color + ' hover:opacity-80'
            }`}
          >
            {wt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Post To Group Selector (shared)
   ────────────────────────────────────────────── */

function PostToSelector({
  groups,
  selectedGroupIds,
  onToggleGroup,
  onSelectAll,
  onDeselectAll,
}: {
  groups: UserGroup[];
  selectedGroupIds: string[];
  onToggleGroup: (groupId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}) {
  if (groups.length === 0) return null;

  // Single group: auto-select, no UI needed
  if (groups.length === 1) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Post to
        </label>
        <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-lg">
          <Check className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm text-foreground font-medium">{groups[0].group_name}</span>
          <span className="text-xs text-muted-foreground ml-auto">auto-selected</span>
        </div>
      </div>
    );
  }

  // Multiple groups: checkboxes
  const allSelected = selectedGroupIds.length === groups.length;
  const someSelected = selectedGroupIds.length > 0 && !allSelected;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        Post to
      </label>
      <div className="space-y-1 bg-card border border-border rounded-lg overflow-hidden">
        {/* All Groups toggle */}
        <label className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border">
          <div className="relative shrink-0">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={() => (allSelected ? onDeselectAll() : onSelectAll())}
              className="sr-only peer"
            />
            <div className="h-4.5 w-4.5 rounded border-2 border-border peer-checked:border-primary peer-checked:bg-primary transition-colors flex items-center justify-center">
              {allSelected && <Check className="h-3 w-3 text-white" />}
            </div>
          </div>
          <span className="text-sm font-medium text-foreground">All Groups</span>
          <span className="text-xs text-muted-foreground ml-auto">{groups.length} groups</span>
        </label>

        {/* Individual groups */}
        {groups.map((group) => {
          const isSelected = selectedGroupIds.includes(group.group_id);
          return (
            <label
              key={group.group_id}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="relative shrink-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleGroup(group.group_id)}
                  className="sr-only peer"
                />
                <div className="h-4.5 w-4.5 rounded border-2 border-border peer-checked:border-primary peer-checked:bg-primary transition-colors flex items-center justify-center">
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>
              </div>
              <span className="text-sm text-foreground">{group.group_name}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Exercise Picker Modal
   ────────────────────────────────────────────── */

function ExercisePicker({
  exercises,
  selectedIds,
  onSelect,
  onClose,
}: {
  exercises: Exercise[];
  selectedIds: string[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return exercises;
    const q = search.toLowerCase();
    return exercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(q) ||
        ex.muscle_groups.some((m) => m.replace(/_/g, ' ').includes(q))
    );
  }, [exercises, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative w-full sm:max-w-lg max-h-[80vh] bg-card border border-border rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Select Exercise</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No exercises found
            </div>
          )}
          {filtered.map((exercise) => {
            const isSelected = selectedIds.includes(exercise.id);
            return (
              <button
                key={exercise.id}
                type="button"
                onClick={() => onSelect(exercise)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? 'bg-primary/10'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {exercise.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {exercise.category}
                    {exercise.muscle_groups.length > 0 &&
                      ` · ${exercise.muscle_groups[0].replace(/_/g, ' ')}`}
                  </p>
                </div>
                {isSelected ? (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Quick Log Tab
   ────────────────────────────────────────────── */

function QuickLogTab({
  onSaved,
  user,
  groups,
}: {
  onSaved: () => void;
  user: NonNullable<ReturnType<typeof useAuth>['user']>;
  groups: UserGroup[];
}) {
  const [workoutType, setWorkoutType] = useState<WorkoutType>('strength');
  const [note, setNote] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    () => groups.map((g) => g.group_id)
  );

  const handleToggleGroup = useCallback((groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  }, []);

  const handleSelectAllGroups = useCallback(() => {
    setSelectedGroupIds(groups.map((g) => g.group_id));
  }, [groups]);

  const handleDeselectAllGroups = useCallback(() => {
    setSelectedGroupIds([]);
  }, []);

  async function handleSubmit() {
    if (saving) return;
    setSaving(true);
    setError(null);

    try {
      const totalDuration = (durationHours || durationMinutes)
        ? (durationHours ? parseInt(durationHours, 10) : 0) * 60 +
          (durationMinutes ? parseInt(durationMinutes, 10) : 0)
        : null;

      // Build workout payload
      const baseWorkout = {
        user_id: user.id,
        workout_type: workoutType,
        log_mode: 'quick' as const,
        note: note.trim() || null,
        duration_minutes: totalDuration,
        exercises: [] as Record<string, unknown>[],
        performed_at: new Date().toISOString(),
      };

      // Insert one row per selected group
      const insertPromises = selectedGroupIds.map((gid) =>
        supabase.from('workouts').insert({ ...baseWorkout, group_id: gid })
      );

      const results = await Promise.all(insertPromises);
      const insertError = results.find((r) => r.error)?.error;

      if (insertError) {
        setError(insertError.message);
        return;
      }

      onSaved();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Workout Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Workout Type
        </label>
        <WorkoutTypeSelector value={workoutType} onChange={setWorkoutType} />
      </div>

      {/* Duration (optional) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Duration <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <div className="flex items-center justify-center gap-3">
          <input
            type="number"
            placeholder="00"
            min={0}
            max={23}
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
            className="w-20 px-3 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm text-center"
          />
          <span className="text-2xl font-bold text-foreground">:</span>
          <input
            type="number"
            placeholder="00"
            min={0}
            max={59}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="w-20 px-3 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm text-center"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Notes <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          placeholder="How was your workout? Any notes..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
        />
      </div>

      {/* Post To */}
      <PostToSelector
        groups={groups}
        selectedGroupIds={selectedGroupIds}
        onToggleGroup={handleToggleGroup}
        onSelectAll={handleSelectAllGroups}
        onDeselectAll={handleDeselectAllGroups}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50"
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Posting...
          </span>
        ) : (
          'Post Workout'
        )}
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Detailed Log Tab
   ────────────────────────────────────────────── */

function DetailedLogTab({
  exercises,
  onSaved,
  user,
  groups,
}: {
  exercises: Exercise[];
  onSaved: () => void;
  user: NonNullable<ReturnType<typeof useAuth>['user']>;
  groups: UserGroup[];
}) {
  const [workoutType, setWorkoutType] = useState<WorkoutType>('strength');
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [note, setNote] = useState('');
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');
  const [exerciseList, setExerciseList] = useState<DetailedExercise[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedInstructions, setExpandedInstructions] = useState<Set<number>>(new Set());
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    () => groups.map((g) => g.group_id)
  );

  const handleToggleGroup = useCallback((groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  }, []);

  const handleSelectAllGroups = useCallback(() => {
    setSelectedGroupIds(groups.map((g) => g.group_id));
  }, [groups]);

  const handleDeselectAllGroups = useCallback(() => {
    setSelectedGroupIds([]);
  }, []);

  const toggleInstructions = useCallback((index: number) => {
    setExpandedInstructions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const parseInstructions = useCallback((instructions: string): string[] => {
    return instructions
      .split(/\n|\d+\.\s/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, []);

  const selectedExerciseIds = useMemo(
    () => exerciseList.map((e) => e.exercise_id),
    [exerciseList]
  );

  const handleAddExercise = useCallback(
    (exercise: Exercise) => {
      setExerciseList((prev) => [
        ...prev,
        {
          exercise_id: exercise.id,
          exercise_name: exercise.name,
          sets: '',
          reps: '',
          weight: '',
          notes: '',
        },
      ]);
    },
    []
  );

  const handleRemoveExercise = useCallback((index: number) => {
    setExerciseList((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleExerciseChange = useCallback(
    (index: number, field: keyof DetailedExercise, value: string) => {
      setExerciseList((prev) =>
        prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
      );
    },
    []
  );

  async function handleSubmit() {
    if (saving) return;
    setSaving(true);
    setError(null);

    try {
      const exercisesData = exerciseList.map((ex) => ({
        name: ex.exercise_name,
        exercise_id: ex.exercise_id,
        sets: ex.sets ? parseInt(ex.sets, 10) : undefined,
        reps: ex.reps ? parseInt(ex.reps, 10) : undefined,
        weight: ex.weight || undefined,
        notes: ex.notes || undefined,
      }));

      const totalDuration = (durationHours || durationMinutes)
        ? (durationHours ? parseInt(durationHours, 10) : 0) * 60 +
          (durationMinutes ? parseInt(durationMinutes, 10) : 0)
        : null;

      // Build workout payload
      const baseWorkout = {
        user_id: user.id,
        workout_type: workoutType,
        log_mode: 'detailed' as const,
        note: note.trim() || null,
        duration_minutes: totalDuration,
        exercises: exercisesData,
        performed_at: new Date().toISOString(),
      };

      // Insert one row per selected group
      const insertPromises = selectedGroupIds.map((gid) =>
        supabase.from('workouts').insert({ ...baseWorkout, group_id: gid })
      );

      const results = await Promise.all(insertPromises);
      const insertError = results.find((r) => r.error)?.error;

      if (insertError) {
        setError(insertError.message);
        return;
      }

      onSaved();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Workout Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Workout Type
        </label>
        <WorkoutTypeSelector value={workoutType} onChange={setWorkoutType} />
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Duration <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <div className="flex items-center justify-center gap-3">
          <input
            type="number"
            placeholder="00"
            min={0}
            max={23}
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
            className="w-20 px-3 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm text-center"
          />
          <span className="text-2xl font-bold text-foreground">:</span>
          <input
            type="number"
            placeholder="00"
            min={0}
            max={59}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="w-20 px-3 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm text-center"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Notes <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          placeholder="How did it feel?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
        />
      </div>

      {/* Exercise List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Exercises {exerciseList.length > 0 && `(${exerciseList.length})`}
          </label>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Exercise
          </button>
        </div>

        {exerciseList.length === 0 && (
          <div className="py-8 text-center border-2 border-dashed border-border rounded-xl">
            <Dumbbell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No exercises added yet
            </p>
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="mt-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Add your first exercise
            </button>
          </div>
        )}

        <div className="space-y-3">
          {exerciseList.map((ex, index) => {
            const fullExercise = exercises.find((e) => e.id === ex.exercise_id);
            return (
            <div
              key={`${ex.exercise_id}-${index}`}
              className="bg-card border border-border rounded-xl p-3 space-y-3"
            >
              {/* Exercise name header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-foreground truncate">
                    {ex.exercise_name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveExercise(index)}
                  className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Collapsible Instructions */}
              {fullExercise?.instructions && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleInstructions(index)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    <span>Form Cues</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        expandedInstructions.has(index) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedInstructions.has(index) && (
                    <div className="px-3 pb-3 space-y-1.5">
                      {parseInstructions(fullExercise.instructions).map(
                        (step, stepIdx) => (
                          <div key={stepIdx} className="flex gap-2 text-xs text-foreground/80">
                            <span className="font-semibold text-primary shrink-0">
                              {stepIdx + 1}.
                            </span>
                            <span>{step}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Muscle map + tutorial */}
              {fullExercise && (
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <MuscleMap primaryMuscles={fullExercise.primary_muscles || fullExercise.muscle_groups} secondaryMuscles={fullExercise.secondary_muscles || []} size="xs" />
                  </div>
                  {fullExercise.demo_url && (
                    <a
                      href={fullExercise.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Watch Tutorial
                    </a>
                  )}
                </div>
              )}

              {/* Inputs */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                    Sets
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    min={0}
                    value={ex.sets}
                    onChange={(e) =>
                      handleExerciseChange(index, 'sets', e.target.value)
                    }
                    className="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                    Reps
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    min={0}
                    value={ex.reps}
                    onChange={(e) =>
                      handleExerciseChange(index, 'reps', e.target.value)
                    }
                    className="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label
                    className="text-[11px] font-medium text-muted-foreground mb-1 block cursor-pointer hover:text-primary transition-colors select-none"
                    onClick={() => setWeightUnit(u => u === 'lbs' ? 'kg' : 'lbs')}
                  >
                    Weight ({weightUnit})
                  </label>
                  <input
                    type="text"
                    placeholder={weightUnit}
                    value={ex.weight}
                    onChange={(e) =>
                      handleExerciseChange(index, 'weight', e.target.value)
                    }
                    className="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Notes */}
              <input
                type="text"
                placeholder="Exercise notes..."
                value={ex.notes}
                onChange={(e) =>
                  handleExerciseChange(index, 'notes', e.target.value)
                }
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          );
          })}
        </div>
      </div>

      {/* Post To */}
      <PostToSelector
        groups={groups}
        selectedGroupIds={selectedGroupIds}
        onToggleGroup={handleToggleGroup}
        onSelectAll={handleSelectAllGroups}
        onDeselectAll={handleDeselectAllGroups}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50"
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Posting...
          </span>
        ) : (
          'Post Workout'
        )}
      </button>

      {/* Exercise Picker Modal */}
      {showPicker && (
        <ExercisePicker
          exercises={exercises}
          selectedIds={selectedExerciseIds}
          onSelect={handleAddExercise}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   From Plan Tab
   ────────────────────────────────────────────── */

function FromPlanTab({
  plans,
  exercises,
  onSaved,
  user,
  groups,
  initialPlanId,
}: {
  plans: WorkoutPlan[];
  exercises: Exercise[];
  onSaved: () => void;
  user: NonNullable<ReturnType<typeof useAuth>['user']>;
  groups: UserGroup[];
  initialPlanId: string | null;
}) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    initialPlanId
  );
  const [planExercises, setPlanExercises] = useState<PlanExerciseItem[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [note, setNote] = useState('');
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedInstructions, setExpandedInstructions] = useState<Set<number>>(new Set());
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    () => groups.map((g) => g.group_id)
  );

  const handleToggleGroup = useCallback((groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  }, []);

  const handleSelectAllGroups = useCallback(() => {
    setSelectedGroupIds(groups.map((g) => g.group_id));
  }, [groups]);

  const handleDeselectAllGroups = useCallback(() => {
    setSelectedGroupIds([]);
  }, []);

  const toggleInstructions = useCallback((index: number) => {
    setExpandedInstructions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const parseInstructions = useCallback((instructions: string): string[] => {
    return instructions
      .split(/\n|\d+\.\s/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, []);

  // Load plan exercises when a plan is selected
  useEffect(() => {
    if (!selectedPlanId) {
      setPlanExercises([]);
      return;
    }

    async function loadPlanExercises() {
      setLoadingPlan(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('workout_plan_exercises')
          .select('*, exercises(name)')
          .eq('plan_id', selectedPlanId!)
          .order('order_index');

        if (fetchError) {
          setError(fetchError.message);
          setLoadingPlan(false);
          return;
        }

        if (data) {
          const items: PlanExerciseItem[] = data.map(
            (wpe: WorkoutPlanExercise & { exercises?: { name: string } }) => ({
              workout_plan_exercise_id: wpe.id,
              exercise_id: wpe.exercise_id,
              exercise_name: wpe.exercises?.name ?? 'Unknown Exercise',
              target_sets: wpe.target_sets,
              target_reps: wpe.target_reps,
              actual_sets: '',
              actual_reps: '',
              actual_weight: '',
            })
          );
          setPlanExercises(items);
        }
      } catch {
        setError('Failed to load plan exercises');
      } finally {
        setLoadingPlan(false);
      }
    }

    loadPlanExercises();
  }, [selectedPlanId, exercises]);

  // Auto-select from searchParams
  useEffect(() => {
    if (initialPlanId && plans.length > 0) {
      const exists = plans.some((p) => p.id === initialPlanId);
      if (exists) {
        setSelectedPlanId(initialPlanId);
      }
    }
  }, [initialPlanId, plans]);

  function handlePlanExerciseChange(
    index: number,
    field: 'actual_sets' | 'actual_reps' | 'actual_weight',
    value: string
  ) {
    setPlanExercises((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  async function handleSubmit() {
    if (saving || !selectedPlanId) return;
    setSaving(true);
    setError(null);

    try {
      const exercisesData = planExercises.map((item) => ({
        name: item.exercise_name,
        exercise_id: item.exercise_id,
        sets: item.actual_sets ? parseInt(item.actual_sets, 10) : undefined,
        reps: item.actual_reps ? parseInt(item.actual_reps, 10) : undefined,
        weight: item.actual_weight || undefined,
      }));

      const totalDuration = (durationHours || durationMinutes)
        ? (durationHours ? parseInt(durationHours, 10) : 0) * 60 +
          (durationMinutes ? parseInt(durationMinutes, 10) : 0)
        : null;

      // Build workout payload
      const baseWorkout = {
        user_id: user.id,
        workout_type: 'strength' as const,
        log_mode: 'detailed' as const,
        note: note.trim() || null,
        duration_minutes: totalDuration,
        exercises: exercisesData,
        plan_id: selectedPlanId,
        performed_at: new Date().toISOString(),
      };

      // Insert one row per selected group
      const insertPromises = selectedGroupIds.map((gid) =>
        supabase.from('workouts').insert({ ...baseWorkout, group_id: gid })
      );

      const results = await Promise.all(insertPromises);
      const insertError = results.find((r) => r.error)?.error;

      if (insertError) {
        setError(insertError.message);
        return;
      }

      onSaved();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // Plan selection view
  if (!selectedPlanId) {
    return (
      <div className="space-y-5">
        {plans.length === 0 ? (
          <div className="py-12 text-center">
            <LayoutList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">No workout plans yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a plan in the Planner tab first, then log a workout from it.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Choose a plan to base your workout on:
            </p>
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl text-left hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {plan.name}
                  </p>
                  {plan.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {plan.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] font-medium text-muted-foreground capitalize">
                      {plan.difficulty}
                    </span>
                    <span className="text-[11px] text-muted-foreground">·</span>
                    <span className="text-[11px] text-muted-foreground capitalize">
                      {plan.workout_type}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 ml-2" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Plan exercise editing view
  return (
    <div className="space-y-5">
      {/* Selected plan header */}
      <button
        type="button"
        onClick={() => {
          setSelectedPlanId(null);
          setPlanExercises([]);
        }}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
        Change plan
      </button>

      {selectedPlan && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
          <p className="font-semibold text-foreground">{selectedPlan.name}</p>
          {selectedPlan.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedPlan.description}
            </p>
          )}
        </div>
      )}

      {/* Duration */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Duration <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <div className="flex items-center justify-center gap-3">
          <input
            type="number"
            placeholder="00"
            min={0}
            max={23}
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
            className="w-20 px-3 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm text-center"
          />
          <span className="text-2xl font-bold text-foreground">:</span>
          <input
            type="number"
            placeholder="00"
            min={0}
            max={59}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="w-20 px-3 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm text-center"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Notes <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          placeholder="How did it feel?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
        />
      </div>

      {/* Exercises */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Exercises
        </label>

        {loadingPlan && (
          <div className="py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">
              Loading exercises...
            </p>
          </div>
        )}

        {!loadingPlan && planExercises.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-sm">
            This plan has no exercises yet.
          </div>
        )}

        <div className="space-y-3">
          {planExercises.map((item, index) => {
            const fullExercise = exercises.find((e) => e.id === item.exercise_id);
            return (
            <div
              key={item.workout_plan_exercise_id}
              className="bg-card border border-border rounded-xl p-3 space-y-3"
            >
              {/* Exercise header */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {item.exercise_name}
                </span>
              </div>

              {/* Collapsible Instructions */}
              {fullExercise?.instructions && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleInstructions(index)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    <span>Form Cues</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        expandedInstructions.has(index) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedInstructions.has(index) && (
                    <div className="px-3 pb-3 space-y-1.5">
                      {parseInstructions(fullExercise.instructions).map(
                        (step, stepIdx) => (
                          <div key={stepIdx} className="flex gap-2 text-xs text-foreground/80">
                            <span className="font-semibold text-primary shrink-0">
                              {stepIdx + 1}.
                            </span>
                            <span>{step}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Muscle map + tutorial */}
              {fullExercise && (
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <MuscleMap primaryMuscles={fullExercise.primary_muscles || fullExercise.muscle_groups} secondaryMuscles={fullExercise.secondary_muscles || []} size="xs" />
                  </div>
                  {fullExercise.demo_url && (
                    <a
                      href={fullExercise.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Watch Tutorial
                    </a>
                  )}
                </div>
              )}

              {/* Target info */}
              {(item.target_sets || item.target_reps) && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Target:</span>
                  {item.target_sets && item.target_reps && (
                    <span className="font-medium">
                      {item.target_sets} sets × {item.target_reps} reps
                    </span>
                  )}
                  {item.target_sets && !item.target_reps && (
                    <span className="font-medium">
                      {item.target_sets} sets
                    </span>
                  )}
                  {!item.target_sets && item.target_reps && (
                    <span className="font-medium">
                      {item.target_reps} reps
                    </span>
                  )}
                </div>
              )}

              {/* Actual inputs */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                    Actual Sets
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    min={0}
                    value={item.actual_sets}
                    onChange={(e) =>
                      handlePlanExerciseChange(
                        index,
                        'actual_sets',
                        e.target.value
                      )
                    }
                    className="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                    Actual Reps
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    min={0}
                    value={item.actual_reps}
                    onChange={(e) =>
                      handlePlanExerciseChange(
                        index,
                        'actual_reps',
                        e.target.value
                      )
                    }
                    className="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label
                    className="text-[11px] font-medium text-muted-foreground mb-1 block cursor-pointer hover:text-primary transition-colors select-none"
                    onClick={() => setWeightUnit(u => u === 'lbs' ? 'kg' : 'lbs')}
                  >
                    Weight ({weightUnit})
                  </label>
                  <input
                    type="text"
                    placeholder={weightUnit}
                    value={item.actual_weight}
                    onChange={(e) =>
                      handlePlanExerciseChange(
                        index,
                        'actual_weight',
                        e.target.value
                      )
                    }
                    className="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          );
          })}
        </div>
      </div>

      {/* Post To */}
      <PostToSelector
        groups={groups}
        selectedGroupIds={selectedGroupIds}
        onToggleGroup={handleToggleGroup}
        onSelectAll={handleSelectAllGroups}
        onDeselectAll={handleDeselectAllGroups}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving || loadingPlan || planExercises.length === 0}
        className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50"
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Posting...
          </span>
        ) : (
          'Post Workout'
        )}
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Success Toast
   ────────────────────────────────────────────── */

function SuccessToast({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 2000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 px-4 py-3 bg-success/10 border border-success/30 rounded-xl shadow-lg text-success text-sm font-medium">
        <Check className="h-4 w-4" />
        Workout posted!
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main Page
   ────────────────────────────────────────────── */

export default function LogWorkoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<LogTab>('quick');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const initialPlanId = searchParams.get('planId');

  // If planId is in URL, start on the plan tab
  useEffect(() => {
    if (initialPlanId) {
      setTab('plan');
    }
  }, [initialPlanId]);

  // Fetch exercises, plans, and group membership
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      setLoading(true);

      // Fetch all exercises
      const exercisesPromise = supabase
        .from('exercises')
        .select('*')
        .order('name');

      // Fetch user's plans
      const plansPromise = supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_template', false)
        .order('created_at', { ascending: false });

      // Fetch user's group memberships with group names
      const groupPromise = supabase
        .from('group_members')
        .select('group_id, groups(name)')
        .eq('user_id', user!.id);

      const [exercisesResult, plansResult, groupResult] = await Promise.all([
        exercisesPromise,
        plansPromise,
        groupPromise,
      ]);

      if (exercisesResult.data) setExercises(exercisesResult.data);
      if (plansResult.data) setPlans(plansResult.data);
      if (groupResult.data) {
        const userGroups: UserGroup[] = groupResult.data.map(
          (gm: Record<string, unknown>) => {
            const groups = gm.groups as { name: string } | { name: string }[] | null;
            const name = Array.isArray(groups) ? groups[0]?.name : groups?.name;
            return {
              group_id: gm.group_id as string,
              group_name: name ?? 'Unknown Group',
            };
          }
        );
        setGroups(userGroups);
      }

      setLoading(false);
    }

    loadData();
  }, [user]);

  const handleSaved = useCallback(() => {
    setShowSuccess(true);
    setTimeout(() => {
      router.push('/feed');
    }, 1200);
  }, [router]);

  if (!user) return null;

  return (
    <div className="min-h-screen">
      {showSuccess && (
        <SuccessToast onDismiss={() => setShowSuccess(false)} />
      )}

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            Log Workout
          </h1>
          <p className="text-sm text-muted-foreground">
            Record what you crushed today
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-card border border-border rounded-xl p-1">
          {TABS.map((t) => {
            const isActive = tab === t.value;
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Loading...</p>
          </div>
        )}

        {/* Tab Content */}
        {!loading && (
          <div className="bg-card border border-border rounded-xl p-4">
            {tab === 'quick' && (
              <QuickLogTab
                onSaved={handleSaved}
                user={user}
                groups={groups}
              />
            )}
            {tab === 'detailed' && (
              <DetailedLogTab
                exercises={exercises}
                onSaved={handleSaved}
                user={user}
                groups={groups}
              />
            )}
            {tab === 'plan' && (
              <FromPlanTab
                plans={plans}
                exercises={exercises}
                onSaved={handleSaved}
                user={user}
                groups={groups}
                initialPlanId={initialPlanId}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
