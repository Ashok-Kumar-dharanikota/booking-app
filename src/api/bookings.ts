import { Booking, isValidBooking } from '../types/booking';
import { createFakeFetch } from './fake-server';

export async function fetchBookings(
  fetchFn: typeof fetch = fetch
): Promise<Booking[]> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const isEnvUnset = !apiUrl;

  // When environment variable is unset and fetchFn is the default fetch, inject fake server
  const resolvedFetch = isEnvUnset && fetchFn === fetch ? createFakeFetch() : fetchFn;
  const baseUrl = apiUrl || 'https://in-app.fake-api';

  const response = await resolvedFetch(`${baseUrl}/bookings`);

  if (!response.ok) {
    throw new Error(`Failed to fetch bookings: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Invalid bookings response: expected an array');
  }

  return data.filter(isValidBooking);
}
