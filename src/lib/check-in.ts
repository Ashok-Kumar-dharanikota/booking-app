export function canCheckIn(
  now: Date,
  startsAt: Date
): boolean {
  const diffMs = startsAt.getTime() - now.getTime();
  const fifteenMinutesMs = 15 * 60 * 1000;
  return diffMs <= fifteenMinutesMs;
}
