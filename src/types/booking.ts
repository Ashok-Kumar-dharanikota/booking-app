export interface Booking {
  id: string;
  title: string;
  startsAt: string;
  timezone: string;
}

export function isValidBooking(item: unknown): item is Booking {
  if (!item || typeof item !== 'object') {
    return false;
  }
  const candidate = item as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.trim().length > 0 &&
    typeof candidate.title === 'string' &&
    typeof candidate.startsAt === 'string' &&
    !isNaN(Date.parse(candidate.startsAt)) &&
    typeof candidate.timezone === 'string' &&
    candidate.timezone.trim().length > 0
  );
}
