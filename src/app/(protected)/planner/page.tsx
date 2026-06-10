'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dumbbell, Plus, BookOpen, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { Exercise, WorkoutPlan } from '@/lib/types';
import ExerciseBrowser from '@/components/ExerciseBrowser';

type Tab = 'library' | 'plans';

const STARTER_TEMPLATES = [
  {
    name: 'Full Body Beginner',
    description: 'A balanced full-body routine perfect for getting started. Hits all major muscle groups.',
    group_id: null as string | null,
    is_public: true,
  },
  {
    name: 'Push Pull Legs',
    description: 'Classic 3-day split focusing on push, pull, and leg movements for balanced growth.',
    group_id: null as string | null,
    is_public: true,
  },
  {
    name: 'HIIT Cardio Blast',
    description: 'High-intensity interval training to burn calories and boost cardiovascular fitness.',
    group_id: null as string | null,
    is_public: true,
  },
  {
    name: 'Mobility & Recovery',
    description: 'Gentle stretching and mobility work to improve flexibility and aid recovery.',
    group_id: null as string | null,
    is_public: true,
  },
];

function difficultyColor(d: string): string {
  switch (d) {
    case 'beginner':
      return 'bg-success/15 text-success';
    case 'intermediate':
      return 'bg-warning/15 text-warning';
    case 'advanced':
      return 'bg-destructive/15 text-destructive';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default function PlannerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('library');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [planExerciseCounts, setPlanExerciseCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Fetch exercises
  useEffect(() => {
    async function loadExercises() {
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
      if (data) setExercises(data);
    }
    loadExercises();
  }, []);

  // Fetch user plans
  useEffect(() => {
    if (!user) return;
    async function loadPlans() {
      setLoading(true);
      const { data } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (data) {
        setPlans(data);
        // Fetch exercise counts per plan
        const counts: Record<string, number> = {};
        for (const plan of data) {
          const { count } = await supabase
            .from('workout_plan_exercises')
            .select('*', { count: 'exact', head: true })
            .eq('plan_id', plan.id);
          counts[plan.id] = count ?? 0;
        }
        setPlanExerciseCounts(counts);
      }
      setLoading(false);
    }
    loadPlans();
  }, [user]);

  async function createNewPlan() {
    if (!user) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('workout_plans')
      .insert({
        name: 'New Workout Plan',
        description: '',
        user_id: user.id,
        is_template: false,
        is_public: false,
      })
      .select()
      .single();
    setCreating(false);
    if (data && !error) {
      router.push(`/planner/${data.id}`);
    }
  }

  async function useTemplate(template: (typeof STARTER_TEMPLATES)[number]) {
    if (!user) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('workout_plans')
      .insert({
        name: template.name,
        description: template.description,
        user_id: user.id,
        is_template: false,
        is_public: false,
      })
      .select()
      .single();
    setCreating(false);
    if (data && !error) {
      router.push(`/planner/${data.id}`);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            Workout Planner
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse exercises and build your perfect workout plan
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-card border border-border rounded-xl p-1">
          <button
            type="button"
            onClick={() => setTab('library')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === 'library'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Exercise Library
          </button>
          <button
            type="button"
            onClick={() => setTab('plans')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === 'plans'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-4 w-4" />
            My Plans
          </button>
        </div>

        {/* Tab content */}
        {tab === 'library' && (
          <ExerciseBrowser exercises={exercises} showSelectButton={false} />
        )}

        {tab === 'plans' && (
          <div className="space-y-6">
            {/* Create new plan */}
            <button
              type="button"
              onClick={createNewPlan}
              disabled={creating}
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            >
              {creating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              <span className="font-medium">
                {creating ? 'Creating...' : 'Create New Plan'}
              </span>
            </button>

            {/* User plans */}
            {plans.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Your Plans
                </h2>
                {plans.map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/planner/${plan.id}`}
                    className="block bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {plan.name}
                        </h3>
                        {plan.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {plan.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs text-muted-foreground">
                            {planExerciseCounts[plan.id] ?? 0} exercises
                          </span>
                        </div>
                      </div>
                      <Dumbbell className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {plans.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No plans yet. Create one or use a template below!</p>
              </div>
            )}

            {/* Starter templates */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">
                Starter Templates
              </h2>
              <p className="text-sm text-muted-foreground">
                Jump-start your training with a pre-built plan. You can customize it after.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STARTER_TEMPLATES.map((template, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-xl p-4 space-y-2"
                  >
                    <h3 className="font-semibold text-foreground">
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Starter Template
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => useTemplate(template)}
                      disabled={creating}
                      className="w-full btn-primary text-sm mt-2"
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
