/**
 * Formats calendar date in the booking's specific timezone (e.g. "1 June 2026")
 */
export function formatBookingDate(dateIso: string, timezone: string): string {
  const date = new Date(dateIso);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats local time in the booking's specific timezone (e.g. "11:00 AM", "3:00 PM")
 */
export function formatBookingTime(dateIso: string, timezone: string): string {
  const date = new Date(dateIso);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
