'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Dumbbell, Users, BarChart3, Calendar, Trophy } from 'lucide-react';

const features = [
  {
    icon: Dumbbell,
    title: 'Workout Logging',
    description: 'Log sets, reps, and weights with ease. Track every rep of your fitness journey.',
  },
  {
    icon: Users,
    title: 'Shared Feed',
    description: 'See your friends\' workouts in real-time. Stay motivated together.',
  },
  {
    icon: BarChart3,
    title: 'Exercise Library',
    description: 'Browse hundreds of exercises with instructions and muscle group targeting.',
  },
  {
    icon: Calendar,
    title: 'Workout Plans',
    description: 'Create and follow custom workout plans. Never skip leg day again.',
  },
  {
    icon: Trophy,
    title: 'Group Challenges',
    description: 'Compete with friends in weekly challenges. Who can lift the most?',
  },
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/feed');
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // If authenticated, show nothing (redirect is happening)
  if (user) {
    return null;
  }

  // Landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Dumbbell className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">FitTrack</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Dumbbell className="h-4 w-4" />
              <span>Built for friend groups</span>
            </div>

            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Track workouts with friends.{' '}
              <span className="text-primary">Stay accountable.</span>{' '}
              Get stronger together.
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              The workout tracker designed for groups. Log exercises, share progress,
              and push each other to new personal records.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:opacity-90 active:scale-[0.98]"
              >
                Get Started — It&apos;s Free
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-lg border border-border bg-card px-8 text-base font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Everything you need to train together
            </h2>
            <p className="mt-3 text-muted-foreground">
              Powerful features designed for group fitness
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof / CTA Section */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="rounded-2xl bg-primary/5 border border-primary/10 p-8 sm:p-12 text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Ready to level up your training?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Join your friends on FitTrack and start building better habits together.
              Your next PR is one click away.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:opacity-90 active:scale-[0.98]"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-lg border border-border bg-card px-8 text-base font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                <Dumbbell className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">FitTrack</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with 💪 for friend groups everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
