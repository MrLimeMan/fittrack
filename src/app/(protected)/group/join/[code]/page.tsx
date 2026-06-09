'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Users, ArrowLeft, Check, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Group } from '@/lib/types';

interface GroupWithInvite extends Group {
  invite_code: string;
}

interface MemberCount {
  count: number;
}

export default function JoinGroupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [group, setGroup] = useState<GroupWithInvite | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    async function fetchGroup() {
      if (!user || !code) return;

      setLoading(true);

      // Look up group by invite_code
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('invite_code', code)
        .single();

      if (groupError || !groupData) {
        setError('Group not found. Check your invite link.');
        setLoading(false);
        return;
      }

      setGroup(groupData as GroupWithInvite);

      // Get member count
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupData.id);

      setMemberCount(count || 0);

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupData.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        setAlreadyMember(true);
      }

      setLoading(false);
    }

    fetchGroup();
  }, [user, code]);

  const handleJoin = async () => {
    if (!user || !group || alreadyMember) return;

    setJoining(true);
    setError(null);

    try {
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'member',
        });

      if (memberError) {
        setError(memberError.message);
        setJoining(false);
        return;
      }

      setJoined(true);
      setMemberCount((prev) => prev + 1);

      // Redirect after a brief moment
      setTimeout(() => {
        router.push('/feed');
      }, 1500);
    } catch {
      setError('An unexpected error occurred');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/feed"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Join Group</h1>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Group Not Found
            </h2>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              Back to Feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/feed"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Join Group</h1>
        </div>

        {group && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{group.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {memberCount} {memberCount === 1 ? 'member' : 'members'}
                </p>
              </div>
            </div>

            {joined ? (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
                <Check className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="font-medium text-foreground">
                  Welcome to {group.name}!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Redirecting to feed...
                </p>
              </div>
            ) : alreadyMember ? (
              <div className="space-y-4">
                <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
                  <p className="text-sm text-info font-medium">
                    You are already a member of this group.
                  </p>
                </div>
                <Link
                  href="/feed"
                  className="block w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-center hover:bg-primary/90 transition-colors"
                >
                  Go to Feed
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {joining ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
