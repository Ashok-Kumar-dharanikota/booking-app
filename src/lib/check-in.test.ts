import { describe, expect, it } from 'vitest';
import { canCheckIn } from './check-in';

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
