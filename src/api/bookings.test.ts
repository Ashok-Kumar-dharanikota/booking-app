import { describe, expect, it } from 'vitest';
import { fetchBookings } from './bookings';
import { DEFAULT_BOOKINGS_FIXTURE } from './fake-server';

describe('fetchBookings', () => {
  it('returns valid bookings and excludes broken from the fixture', async () => {
    const stubFetch: typeof fetch = async () => {
      return new Response(JSON.stringify(DEFAULT_BOOKINGS_FIXTURE), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const bookings = await fetchBookings(stubFetch);

    expect(bookings).toHaveLength(7);
    expect(bookings.map((b) => b.id)).toEqual([
      'studio',
      'site',
      'review',
      'consult',
      'audit',
      'rehearsal',
      'strategy',
    ]);
    expect(bookings.find((b) => b.id === 'broken')).toBeUndefined();
  });

  it('rejects/throws when the API returns an HTTP 500 error', async () => {
    const errorFetch: typeof fetch = async () => {
      return new Response(JSON.stringify({ error: 'unavailable' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    await expect(fetchBookings(errorFetch)).rejects.toThrow();
  });

  it('uses the in-app fake server when EXPO_PUBLIC_API_URL is unset', async () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    delete process.env.EXPO_PUBLIC_BOOKINGS;

    const bookings = await fetchBookings();
    expect(bookings).toHaveLength(7);
    expect(bookings.map((b) => b.id)).toEqual([
      'studio',
      'site',
      'review',
      'consult',
      'audit',
      'rehearsal',
      'strategy',
    ]);
  });

  it('returns empty array when EXPO_PUBLIC_BOOKINGS=empty', async () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    process.env.EXPO_PUBLIC_BOOKINGS = 'empty';

    const bookings = await fetchBookings();
    expect(bookings).toEqual([]);

    delete process.env.EXPO_PUBLIC_BOOKINGS;
  });

  it('throws when EXPO_PUBLIC_BOOKINGS=error', async () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    process.env.EXPO_PUBLIC_BOOKINGS = 'error';

    await expect(fetchBookings()).rejects.toThrow();

    delete process.env.EXPO_PUBLIC_BOOKINGS;
  });
});
