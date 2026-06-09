'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, PlusCircle, LayoutDashboard, Dumbbell, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const tabs = [
  { label: 'Feed', href: '/feed', icon: MessageSquare },
  { label: 'Log', href: '/log', icon: PlusCircle },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Planner', href: '/planner', icon: Dumbbell },
  { label: 'Profile', href: '/profile', icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full text-xs transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span className={`font-medium ${isActive ? 'text-primary' : ''}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
