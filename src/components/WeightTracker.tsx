'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import {
  Scale,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WeightEntry {
  id: string;
  user_id: string;
  weight: number;
  unit: 'lbs' | 'kg';
  note: string | null;
  recorded_at: string; // YYYY-MM-DD
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDisplayDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function shortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function WeightTracker() {
  const { user } = useAuth();

  /* ---- state ---- */
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [weightInput, setWeightInput] = useState('');
  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs');
  const [noteInput, setNoteInput] = useState('');
  const [saving, setSaving] = useState(false);

  // edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editUnit, setEditUnit] = useState<'lbs' | 'kg'>('lbs');
  const [editNote, setEditNote] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  /* ---- today's entry ---- */
  const todayEntry = entries.find((e) => e.recorded_at === todayISO()) ?? null;

  /* ---- fetch entries ---- */
  const fetchEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
      .limit(30);
    setEntries((data as WeightEntry[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  /* ---- log / update today ---- */
  async function handleLogToday() {
    if (!user || !weightInput) return;
    setSaving(true);

    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      setSaving(false);
      return;
    }

    const today = todayISO();

    if (todayEntry) {
      // upsert on conflict
      const { error } = await supabase
        .from('weight_entries')
        .upsert(
          {
            user_id: user.id,
            weight,
            unit,
            note: noteInput || null,
            recorded_at: today,
          },
          { onConflict: 'user_id,recorded_at' },
        );
      if (error) console.error(error);
    } else {
      const { error } = await supabase.from('weight_entries').insert({
        user_id: user.id,
        weight,
        unit,
        note: noteInput || null,
        recorded_at: today,
      });
      if (error) console.error(error);
    }

    setSaving(false);
    setWeightInput('');
    setNoteInput('');
    fetchEntries();
  }

  /* ---- delete an entry ---- */
  async function handleDelete(id: string) {
    await supabase.from('weight_entries').delete().eq('id', id);
    fetchEntries();
  }

  /* ---- start editing ---- */
  function startEdit(entry: WeightEntry) {
    setEditingId(entry.id);
    setEditWeight(String(entry.weight));
    setEditUnit(entry.unit);
    setEditNote(entry.note ?? '');
  }

  /* ---- save edit ---- */
  async function saveEdit(entryId: string) {
    const weight = parseFloat(editWeight);
    if (isNaN(weight) || weight <= 0) return;
    setEditSaving(true);
    await supabase
      .from('weight_entries')
      .update({ weight, unit: editUnit, note: editNote || null })
      .eq('id', entryId);
    setEditSaving(false);
    setEditingId(null);
    fetchEntries();
  }

  /* ---- mini trend data ---- */
  const trendEntries = [...entries].reverse().slice(-7); // oldest-first, last 7
  const trendChange =
    trendEntries.length >= 2
      ? trendEntries[trendEntries.length - 1].weight - trendEntries[0].weight
      : 0;
  const trendUnit = trendEntries[0]?.unit ?? unit;
  const trendPositive = trendChange > 0;
  const trendZero = trendChange === 0;

  // normalise bar heights (min 12%, max 100%)
  const trendWeights = trendEntries.map((e) => e.weight);
  const minW = Math.min(...trendWeights);
  const maxW = Math.max(...trendWeights);
  const range = maxW - minW || 1;

  /* ---- render ---- */
  if (!user) return null;

  return (
    <div className="space-y-5">
      {/* ============================================================ */}
      {/*  LOG TODAY'S WEIGHT                                          */}
      {/* ============================================================ */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">
            {todayEntry ? "Today's Weight" : 'Log Weight'}
          </h2>
        </div>

        {/* Today already logged — show summary + edit/delete */}
        {todayEntry && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-bold text-primary">
                  {todayEntry.weight} {todayEntry.unit}
                </span>
                {todayEntry.note && (
                  <p className="text-sm text-foreground/60 mt-0.5">
                    {todayEntry.note}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => startEdit(todayEntry)}
                  className="p-1.5 rounded-lg hover:bg-foreground/10 text-foreground/50 hover:text-foreground transition-colors"
                  aria-label="Edit today's weight"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(todayEntry.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-foreground/50 hover:text-red-500 transition-colors"
                  aria-label="Delete today's weight"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-foreground/40 mt-1">
              Already logged today. Edit or delete above.
            </p>
          </div>
        )}

        {/* Inline edit form for today */}
        {editingId === todayEntry?.id && (
          <div className="mb-4 p-3 bg-background rounded-lg border border-border space-y-3">
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Weight"
              />
              <button
                onClick={() => setEditUnit(editUnit === 'lbs' ? 'kg' : 'lbs')}
                className="px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-foreground/5 transition-colors"
              >
                {editUnit}
              </button>
            </div>
            <input
              type="text"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Optional note"
            />
            <div className="flex gap-2">
              <button
                onClick={() => saveEdit(todayEntry!.id)}
                disabled={editSaving}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {editSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 rounded-lg border border-border text-sm text-foreground/60 hover:bg-foreground/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Input form (always visible unless editing today) */}
        {editingId !== todayEntry?.id && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Enter weight"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLogToday();
                }}
              />
              <button
                onClick={() => setUnit(unit === 'lbs' ? 'kg' : 'lbs')}
                className="px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-foreground/5 transition-colors"
              >
                {unit}
              </button>
            </div>
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Optional note"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLogToday();
              }}
            />
            <button
              onClick={handleLogToday}
              disabled={saving || !weightInput}
              className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              {saving ? 'Saving...' : 'Log Weight'}
            </button>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  MINI TREND                                                  */}
      {/* ============================================================ */}
      {trendEntries.length >= 2 && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Last 7 Entries</h3>
            <span
              className={`flex items-center gap-1 text-sm font-medium ${
                trendZero
                  ? 'text-foreground/50'
                  : trendPositive
                    ? 'text-red-500'
                    : 'text-green-500'
              }`}
            >
              {trendPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {trendPositive ? '+' : ''}
              {trendChange.toFixed(1)} {trendUnit}
            </span>
          </div>

          {/* Bars */}
          <div className="flex items-end gap-1.5 h-16">
            {trendEntries.map((entry, i) => {
              const pct = 12 + ((entry.weight - minW) / range) * 88; // 12% – 100%
              const isLast = i === trendEntries.length - 1;
              return (
                <div
                  key={entry.id}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      isLast ? 'bg-primary' : 'bg-primary/30'
                    }`}
                    style={{ height: `${pct}%` }}
                    title={`${entry.weight} ${entry.unit}`}
                  />
                  <span className="text-[10px] text-foreground/40 leading-none">
                    {shortDate(entry.recorded_at)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  WEIGHT HISTORY                                              */}
      {/* ============================================================ */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Weight History
        </h3>

        {loading && (
          <p className="text-sm text-foreground/40">Loading…</p>
        )}

        {!loading && entries.length === 0 && (
          <p className="text-sm text-foreground/40">
            No weight entries yet. Log your first weight above!
          </p>
        )}

        {!loading && entries.length > 0 && (
          <div className="space-y-1">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="group rounded-lg hover:bg-foreground/5 transition-colors"
              >
                {/* Display mode */}
                {editingId !== entry.id && (
                  <div className="flex items-center gap-3 px-3 py-2">
                    <span className="text-xs text-foreground/40 w-20 shrink-0">
                      {formatDisplayDate(entry.recorded_at)}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {entry.weight} {entry.unit}
                    </span>
                    {entry.note && (
                      <span className="text-xs text-foreground/40 truncate flex-1 min-w-0">
                        — {entry.note}
                      </span>
                    )}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(entry)}
                        className="p-1 rounded hover:bg-foreground/10 text-foreground/40 hover:text-foreground transition-colors"
                        aria-label="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1 rounded hover:bg-red-500/10 text-foreground/40 hover:text-red-500 transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline edit mode */}
                {editingId === entry.id && (
                  <div className="p-3 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={editWeight}
                        onChange={(e) => setEditWeight(e.target.value)}
                        className="flex-1 min-w-0 px-3 py-1.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <button
                        onClick={() =>
                          setEditUnit(editUnit === 'lbs' ? 'kg' : 'lbs')
                        }
                        className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-foreground/5 transition-colors"
                      >
                        {editUnit}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Optional note"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(entry.id)}
                        disabled={editSaving}
                        className="flex-1 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {editSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-1.5 rounded-lg border border-border text-sm text-foreground/60 hover:bg-foreground/5 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
