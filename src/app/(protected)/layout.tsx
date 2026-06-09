'use client';

import AuthGuard from '@/components/AuthGuard';
import { BottomNav } from '@/components/BottomNav';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen pb-20 bg-background text-foreground">
        {children}
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
