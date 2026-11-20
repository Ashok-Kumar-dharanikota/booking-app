import { Booking } from '@/types/booking';

export function filterBookings(bookings: Booking[], query: string): Booking[] {
  const normalizedQuery = query.trim().toLowerCase();
  // Filter is only initiated when at least 3 letters are entered
  if (normalizedQuery.length < 3) {
    return bookings;
  }
  return bookings.filter((booking) =>
    booking.title.toLowerCase().includes(normalizedQuery)
  );
}
