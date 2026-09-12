export const categories = ['Intellect', 'Strength', 'Spirit', 'Craft'] as const;
export const difficulties = { easy: { xp: 25, gold: 10, label: 'Small step' }, medium: { xp: 50, gold: 20, label: 'Steady effort' }, hard: { xp: 100, gold: 40, label: 'Brave challenge' } };
export const shop = [
  { id: 'first-light', name: 'First Light', description: 'A golden badge for a promising beginning.', price: 30, kind: 'badge', icon: 'sun' },
  { id: 'forest-keeper', name: 'Forest Keeper', description: 'Wear the mark of the emerald woods.', price: 100, kind: 'badge', icon: 'leaf' },
  { id: 'moonlit', name: 'Moonlit Realm', description: 'Give your quest journal a midnight palette.', price: 150, kind: 'theme', icon: 'moon' },
  { id: 'trailblazer', name: 'Trailblazer', description: 'A compass badge for those who keep going.', price: 250, kind: 'badge', icon: 'compass' },
];
export function progression(xp: number) {
  let level = 1, remaining = xp, threshold = 100;
  while (remaining >= threshold) { remaining -= threshold; level++; threshold = 100 * level * level; }
  return { level, current: remaining, required: threshold, percent: Math.round(remaining / threshold * 100) };
}
export function streakFromDays(days: string[], today: string) {
  const set = new Set(days); let d = new Date(today + 'T00:00:00Z');
  if (!set.has(today)) d.setUTCDate(d.getUTCDate() - 1);
  let count = 0;
  while (set.has(d.toISOString().slice(0, 10))) { count++; d.setUTCDate(d.getUTCDate() - 1); }
  return count;
}
