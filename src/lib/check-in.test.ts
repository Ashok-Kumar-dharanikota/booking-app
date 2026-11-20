import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  canCheckIn,
  getCheckInStorageKey,
  saveBookingCheckIn,
  getBookingCheckIn,
  getAllCheckedInBookings,
} from './check-in';

const store = new Map<string, string>();

vi.mock('@react-native-async-storage/async-storage', () => {
  return {
    default: {
      getItem: vi.fn(async (key: string) => store.get(key) ?? null),
      setItem: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: vi.fn(async (key: string) => {
        store.delete(key);
      }),
      getAllKeys: vi.fn(async () => Array.from(store.keys())),
      multiGet: vi.fn(async (keys: string[]) => keys.map((k) => [k, store.get(k) ?? null])),
      clear: vi.fn(async () => {
        store.clear();
      }),
    },
  };
});

describe('canCheckIn', () => {
  const startsAt = new Date('2026-06-01T15:00:00.000Z');

  it('returns false when more than 15 minutes remain before the booking starts (14:44)', () => {
    const now = new Date('2026-06-01T14:44:00.000Z');
    expect(canCheckIn(now, startsAt)).toBe(false);
  });

  it('returns true when 15 minutes or less remain before the booking starts (14:45)', () => {
    const now = new Date('2026-06-01T14:45:00.000Z');
    expect(canCheckIn(now, startsAt)).toBe(true);
  });

  it('returns true at the booking start time (15:00)', () => {
    const now = new Date('2026-06-01T15:00:00.000Z');
    expect(canCheckIn(now, startsAt)).toBe(true);
  });

  it('returns true after the booking start time (15:30)', () => {
    const now = new Date('2026-06-01T15:30:00.000Z');
    expect(canCheckIn(now, startsAt)).toBe(true);
  });
});

describe('Check-in Persistence via AsyncStorage', () => {
  beforeEach(() => {
    store.clear();
  });

  it('generates correct storage key with prefix', () => {
    expect(getCheckInStorageKey('studio')).toBe('@booking_checkin_studio');
    expect(getCheckInStorageKey('review')).toBe('@booking_checkin_review');
  });

  it('persists and retrieves check-in timestamp', async () => {
    expect(await getBookingCheckIn('studio')).toBeNull();

    const timestamp = '2026-06-01T14:50:00.000Z';
    await saveBookingCheckIn('studio', timestamp);

    expect(await getBookingCheckIn('studio')).toBe(timestamp);
  });

  it('retrieves all checked-in bookings map', async () => {
    await saveBookingCheckIn('studio', '2026-06-01T14:50:00.000Z');
    await saveBookingCheckIn('site', '2026-06-01T17:50:00.000Z');

    const all = await getAllCheckedInBookings();
    expect(all).toEqual({
      studio: '2026-06-01T14:50:00.000Z',
      site: '2026-06-01T17:50:00.000Z',
    });
  });
});
