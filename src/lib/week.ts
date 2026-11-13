// Pure TypeScript, no React imports.

/** Time left until the week closes (next Monday 00:00 local), e.g. "2d 6h" or "5h 40m". */
export function weekEndsIn(now: Date = new Date()): string {
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  const daysToMonday = (8 - end.getDay()) % 7 || 7;
  end.setDate(end.getDate() + daysToMonday);
  const mins = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 60000));
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
}
