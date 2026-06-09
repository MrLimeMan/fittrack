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

  // Fetch plan
  useEffect(() => {
    if (!planId) return;
    async function loadPlan() {
      const { data } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('id', planId)
        .single();
      if (data) {
        setPlan(data);
        setName(data.name);
        setDescription(data.description ?? '');
      }
    }
    loadPlan();
  }, [planId]);

  // Fetch all exercises for the browser
  useEffect(() => {
    async function loadExercises() {
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
      if (data) setAllExercises(data);
    }
    loadExercises();
  }, []);

  // Fetch plan exercises with joined exercise data
  const loadPlanExercises = useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    const { data: peRows } = await supabase
      .from('workout_plan_exercises')
      .select('*')
      .eq('plan_id', planId)
      .order('order_index');

    if (peRows && peRows.length > 0) {
      const exerciseIds = peRows.map((r) => r.exercise_id);
      const { data: exercises } = await supabase
        .from('exercises')
        .select('*')
        .in('id', exerciseIds);

      const exMap = new Map<string, Exercise>();
      if (exercises) exercises.forEach((e) => exMap.set(e.id, e));

      const items: PlanExerciseItem[] = peRows.map((row) => ({
        ...row,
        exercise: exMap.get(row.exercise_id),
      }));
      setPlanExercises(items);
    } else {
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
      .update({ name, description: description || null, updated_at: new Date().toISOString() })
      .eq('id', plan.id);

    // Update exercise details (sets/reps/etc)
    for (const pe of planExercises) {
      await supabase
        .from('workout_plan_exercises')
        .update({
          order_index: pe.order_index,
          sets: pe.sets,
          reps: pe.reps,
          duration_seconds: pe.duration_seconds,
          rest_seconds: pe.rest_seconds,
          notes: pe.notes,
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
      sets: 3,
      reps: 10,
      duration_seconds: null,
      rest_seconds: 60,
      notes: null,
      created_at: new Date().toISOString(),
      exercise,
    };
    setPlanExercises((prev) => [...prev, newItem]);
    setShowBrowser(false);
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
    field: 'sets' | 'reps' | 'duration_seconds' | 'rest_seconds' | 'notes',
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

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Plan not found</p>
        <button onClick={() => router.push('/planner')} className="btn-primary">
          Back to Planner
        </button>
      </div>
    );
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

              {/* Sets / Reps / Rest inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pl-8">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Sets
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={pe.sets ?? ''}
                    onChange={(e) =>
                      updateExerciseField(
                        index,
                        'sets',
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
                    type="number"
                    min={1}
                    value={pe.reps ?? ''}
                    onChange={(e) =>
                      updateExerciseField(
                        index,
                        'reps',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className="w-full px-2.5 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Duration (s)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pe.duration_seconds ?? ''}
                    onChange={(e) =>
                      updateExerciseField(
                        index,
                        'duration_seconds',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className="w-full px-2.5 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Rest (s)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pe.rest_seconds ?? ''}
                    onChange={(e) =>
                      updateExerciseField(
                        index,
                        'rest_seconds',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className="w-full px-2.5 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
              <button
                type="button"
                onClick={() => setShowBrowser(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <ExerciseBrowser
                exercises={allExercises}
                onSelect={addExercise}
                showSelectButton={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
