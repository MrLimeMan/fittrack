'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Play,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Loader2,
  X,
  AlertTriangle,
  Video,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type {
  Exercise,
  WorkoutPlan,
  WorkoutPlanExercise,
} from '@/lib/types';
import ExerciseBrowser from '@/components/ExerciseBrowser';

interface PlanExerciseItem extends WorkoutPlanExercise {
  exercise?: Exercise;
}

export default function PlanEditorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const planId = params.planId as string;

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [planExercises, setPlanExercises] = useState<PlanExerciseItem[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [addedExerciseIds, setAddedExerciseIds] = useState<Set<string>>(new Set());

  // Fetch plan
  useEffect(() => {
    if (!planId) return;
    async function loadPlan() {
      try {
        const { data, error: fetchError } = await supabase
          .from('workout_plans')
          .select('*')
          .eq('id', planId)
          .single();
        if (fetchError) {
          console.error('Error loading plan:', fetchError);
          setError('Could not load this workout plan. It may have been deleted or you may not have access.');
          setLoading(false);
          return;
        }
        if (data) {
          setPlan(data);
          setName(data.name);
          setDescription(data.description ?? '');
        } else {
          setError('Plan not found.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Unexpected error loading plan:', err);
        setError('An unexpected error occurred while loading the plan.');
        setLoading(false);
      }
    }
    loadPlan();
  }, [planId]);

  // Fetch all exercises for the browser
  useEffect(() => {
    async function loadExercises() {
      try {
        const { data, error: fetchError } = await supabase
          .from('exercises')
          .select('*')
          .order('name');
        if (fetchError) {
          console.error('Error loading exercises:', fetchError);
          return;
        }
        if (data) setAllExercises(data);
      } catch (err) {
        console.error('Unexpected error loading exercises:', err);
      }
    }
    loadExercises();
  }, []);

  // Fetch plan exercises with joined exercise data
  const loadPlanExercises = useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    try {
      // Try the join query first
      let { data: peRows, error: joinError } = await supabase
        .from('workout_plan_exercises')
        .select('*, exercises(name, muscle_groups, demo_url)')
        .eq('plan_id', planId)
        .order('order_index');

      // If the join fails, fall back to a simple query and fetch exercises separately
      if (joinError) {
        console.warn('Join query failed, falling back to separate fetches:', joinError);
        const { data: peSimple, error: simpleError } = await supabase
          .from('workout_plan_exercises')
          .select('*')
          .eq('plan_id', planId)
          .order('order_index');

        if (simpleError) {
          console.error('Error loading plan exercises:', simpleError);
          setPlanExercises([]);
          setLoading(false);
          return;
        }

        if (peSimple && peSimple.length > 0) {
          // Fetch exercise details for each
          const exerciseIds = [...new Set(peSimple.map((pe) => pe.exercise_id))];
          const { data: exData } = await supabase
            .from('exercises')
            .select('*')
            .in('id', exerciseIds);

          const exMap = new Map<string, Exercise>();
          if (exData) exData.forEach((ex) => exMap.set(ex.id, ex));

          const items: PlanExerciseItem[] = peSimple.map((row) => ({
            ...row,
            exercise: exMap.get(row.exercise_id) ?? undefined,
          }));
          setPlanExercises(items);
        } else {
          setPlanExercises([]);
        }
      } else if (peRows && peRows.length > 0) {
        const items: PlanExerciseItem[] = peRows.map((row) => ({
          ...row,
          exercise: (row as any).exercises ?? undefined,
        }));
        setPlanExercises(items);
      } else {
        setPlanExercises([]);
      }
    } catch (err) {
      console.error('Unexpected error loading plan exercises:', err);
      setPlanExercises([]);
    }
    setLoading(false);
  }, [planId]);

  useEffect(() => {
    loadPlanExercises();
  }, [loadPlanExercises]);

  async function savePlan() {
    if (!plan) return;
    setSaving(true);

    // Update plan metadata
    await supabase
      .from('workout_plans')
      .update({ name, description: description || null })
      .eq('id', plan.id);

    const newExercises: PlanExerciseItem[] = [];
    const existingExercises: PlanExerciseItem[] = [];

    for (const pe of planExercises) {
      if (pe.id.startsWith('temp-')) {
        newExercises.push(pe);
      } else {
        existingExercises.push(pe);
      }
    }

    // Insert new exercises into workout_plan_exercises
    if (newExercises.length > 0) {
      const insertRows = newExercises.map((pe) => ({
        plan_id: planId,
        exercise_id: pe.exercise_id,
        order_index: pe.order_index,
        target_sets: pe.target_sets != null ? Number(pe.target_sets) : null,
        target_reps: pe.target_reps != null ? String(pe.target_reps) : null,
        target_duration: pe.target_duration != null ? Number(pe.target_duration) : null,
        notes: pe.notes || null,
      }));

      const { data: inserted, error } = await supabase
        .from('workout_plan_exercises')
        .insert(insertRows)
        .select();

      if (error) {
        console.error('Error inserting exercises:', error);
      }

      // Update local state with real IDs from the DB
      if (inserted && inserted.length > 0) {
        setPlanExercises((prev) =>
          prev.map((pe) => {
            if (!pe.id.startsWith('temp-')) return pe;
            const matchIndex = newExercises.findIndex((ne) => ne.id === pe.id);
            if (matchIndex >= 0 && inserted[matchIndex]) {
              return { ...pe, id: inserted[matchIndex].id };
            }
            return pe;
          })
        );
      }
    }

    // Update existing exercises
    for (const pe of existingExercises) {
      await supabase
        .from('workout_plan_exercises')
        .update({
          order_index: pe.order_index,
          target_sets: pe.target_sets != null ? Number(pe.target_sets) : null,
          target_reps: pe.target_reps != null ? String(pe.target_reps) : null,
          target_duration: pe.target_duration != null ? Number(pe.target_duration) : null,
          notes: pe.notes || null,
        })
        .eq('id', pe.id);
    }

    setSaving(false);
  }

  function addExercise(exercise: Exercise) {
    const newItem: PlanExerciseItem = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      plan_id: planId,
      exercise_id: exercise.id,
      order_index: planExercises.length,
      target_sets: 3,
      target_reps: '10',
      target_weight: null,
      target_duration: null,
      notes: null,
      created_at: new Date().toISOString(),
      exercise,
    };
    setPlanExercises((prev) => [...prev, newItem]);
    setAddedExerciseIds((prev) => new Set(prev).add(exercise.id));
  }

  async function deleteExercise(index: number) {
    const item = planExercises[index];
    // If it's a persisted row (not temp), delete from DB
    if (!item.id.startsWith('temp-')) {
      await supabase
        .from('workout_plan_exercises')
        .delete()
        .eq('id', item.id);
    }
    setPlanExercises((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((pe, i) => ({ ...pe, order_index: i }))
    );
  }

  function moveExercise(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= planExercises.length) return;
    setPlanExercises((prev) => {
      const copy = [...prev];
      [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
      return copy.map((pe, i) => ({ ...pe, order_index: i }));
    });
  }

  function updateExerciseField(
    index: number,
    field: 'target_sets' | 'target_reps' | 'target_weight' | 'target_duration' | 'notes',
    value: number | string | null
  ) {
    setPlanExercises((prev) =>
      prev.map((pe, i) => (i === index ? { ...pe, [field]: value } : pe))
    );
  }

  if (loading && !plan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center max-w-md">
          {error || 'Plan not found'}
        </p>
        <button onClick={() => router.push('/planner')} className="btn-primary">
          Back to Planner
        </button>
      </div>
    );
  }

  async function deletePlan() {
    if (!plan) return;
    setDeleting(true);
    try {
      // Delete plan exercises first
      await supabase
        .from('workout_plan_exercises')
        .delete()
        .eq('plan_id', plan.id);
      // Delete the plan
      await supabase
        .from('workout_plans')
        .delete()
        .eq('id', plan.id);
      router.push('/planner');
    } catch (err) {
      console.error('Error deleting plan:', err);
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/planner')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={savePlan}
              disabled={saving}
              className="flex items-center gap-1.5 btn-primary text-sm"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Plan
            </button>
            <button
              type="button"
              onClick={() => router.push(`/log?planId=${planId}`)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary/15 text-primary rounded-lg text-sm font-medium hover:bg-primary/25 transition-colors"
            >
              <Play className="h-4 w-4" />
              Use Plan
            </button>
            <button
              type="button"
              onClick={deletePlan}
              disabled={deleting}
              className="flex items-center gap-1.5 px-4 py-2 bg-destructive/15 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/25 transition-colors"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Plan
            </button>
          </div>
        </div>

        {/* Plan header */}
        <div className="space-y-4 bg-card border border-border rounded-xl p-5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Plan name"
            className="w-full text-xl font-bold bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none border-b border-border pb-2"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            rows={2}
            className="w-full text-sm bg-transparent text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none"
          />
        </div>

        {/* Exercise list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Exercises ({planExercises.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowBrowser(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Add Exercise
            </button>
          </div>

          {planExercises.length === 0 && (
            <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center">
              <p className="text-muted-foreground text-sm">
                No exercises yet. Add some to build your plan!
              </p>
            </div>
          )}

          {planExercises.map((pe, index) => (
            <div
              key={pe.id}
              className="bg-card border border-border rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                {/* Order controls */}
                <div className="flex flex-col items-center gap-0.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => moveExercise(index, -1)}
                    disabled={index === 0}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                  <button
                    type="button"
                    onClick={() => moveExercise(index, 1)}
                    disabled={index === planExercises.length - 1}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                {/* Exercise info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <h3 className="font-semibold text-foreground truncate">
                      {pe.exercise?.name ?? 'Unknown Exercise'}
                    </h3>
                    {pe.exercise?.demo_url && (
                      <a
                        href={pe.exercise.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                        title="Watch Tutorial"
                      >
                        <Video className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  {pe.exercise && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pe.exercise.muscle_groups.slice(0, 3).map((m) => (
                        <span
                          key={m}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground"
                        >
                          {m.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => deleteExercise(index)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Sets / Reps / Duration / Weight inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pl-8">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Sets
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={pe.target_sets ?? ''}
                    onChange={(e) =>
                      updateExerciseField(
                        index,
                        'target_sets',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className="w-full px-2.5 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Reps
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8-12"
                    value={pe.target_reps ?? ''}
                    onChange={(e) =>
                      updateExerciseField(
                        index,
                        'target_reps',
                        e.target.value || null
                      )
                    }
                    className="w-full px-2.5 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Duration (s)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pe.target_duration ?? ''}
                    onChange={(e) =>
                      updateExerciseField(
                        index,
                        'target_duration',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className="w-full px-2.5 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Weight
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 135 lbs"
                    value={pe.target_weight ?? ''}
                    onChange={(e) =>
                      updateExerciseField(
                        index,
                        'target_weight',
                        e.target.value || null
                      )
                    }
                    className="w-full px-2.5 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="pl-8">
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={pe.notes ?? ''}
                  onChange={(e) =>
                    updateExerciseField(index, 'notes', e.target.value || null)
                  }
                  className="w-full px-2.5 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exercise browser slide-over modal */}
      {showBrowser && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowBrowser(false)}
          />
          {/* Slide-over panel */}
          <div className="relative ml-auto w-full max-w-xl bg-background border-l border-border overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center justify-between z-10">
              <h2 className="font-semibold text-foreground">Add Exercise</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBrowser(false)}
                  className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={() => setShowBrowser(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <ExerciseBrowser
                exercises={allExercises}
                onSelect={addExercise}
                showSelectButton={true}
                selectedExerciseIds={addedExerciseIds}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
