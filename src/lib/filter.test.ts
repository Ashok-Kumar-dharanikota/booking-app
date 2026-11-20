import { describe, expect, it } from 'vitest';
import { Booking } from '@/types/booking';
import { filterBookings } from './filter';

describe('filterBookings', () => {
  const sampleBookings: Booking[] = [
    {
      id: 'studio',
      title: 'Studio visit',
      startsAt: '2026-06-01T15:00:00.000Z',
      timezone: 'America/New_York',
    },
    {
      id: 'site',
      title: 'Site walkthrough',
      startsAt: '2026-06-01T18:00:00.000Z',
      timezone: 'America/Los_Angeles',
    },
    {
      id: 'review',
      title: 'Plan review',
      startsAt: '2026-06-01T14:00:00.000Z',
      timezone: 'Europe/London',
    },
  ];

  it('returns all bookings when query is empty', () => {
    expect(filterBookings(sampleBookings, '')).toEqual(sampleBookings);
    expect(filterBookings(sampleBookings, '   ')).toEqual(sampleBookings);
  });

  it('filters titles case-insensitively', () => {
    // "rev" should match "Plan review"
    const results = filterBookings(sampleBookings, 'rev');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('review');
    expect(results[0].title).toBe('Plan review');
  });

  it('matches uppercase or mixed case search queries', () => {
    const results = filterBookings(sampleBookings, 'STUDIO');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('studio');
  });

  it('returns empty array when query does not match any booking', () => {
    const results = filterBookings(sampleBookings, 'nonexistent');
    expect(results).toEqual([]);
  });
});
