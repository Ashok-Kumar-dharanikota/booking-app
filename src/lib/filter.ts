import { Booking } from '@/types/booking';

export function filterBookings(bookings: Booking[], query: string): Booking[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return bookings;
  }
  return bookings.filter((booking) =>
    booking.title.toLowerCase().includes(normalizedQuery)
  );
}
