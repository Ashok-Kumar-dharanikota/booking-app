import { describe, expect, it } from 'vitest';
import { formatBookingDate, formatBookingTime } from './date-format';

describe('Timezone date and time formatting', () => {
  it('formats Studio visit on 1 June 2026 to 11:00 AM America/New_York', () => {
    const startsAt = '2026-06-01T15:00:00.000Z';
    const timezone = 'America/New_York';

    expect(formatBookingDate(startsAt, timezone)).toBe('1 June 2026');
    expect(formatBookingTime(startsAt, timezone)).toBe('11:00 AM');
  });

  it('formats Site walkthrough on 1 June 2026 to 11:00 AM America/Los_Angeles', () => {
    const startsAt = '2026-06-01T18:00:00.000Z';
    const timezone = 'America/Los_Angeles';

    expect(formatBookingDate(startsAt, timezone)).toBe('1 June 2026');
    expect(formatBookingTime(startsAt, timezone)).toBe('11:00 AM');
  });

  it('formats Plan review on 1 June 2026 to 3:00 PM Europe/London', () => {
    const startsAt = '2026-06-01T14:00:00.000Z';
    const timezone = 'Europe/London';

    expect(formatBookingDate(startsAt, timezone)).toBe('1 June 2026');
    expect(formatBookingTime(startsAt, timezone)).toBe('3:00 PM');
  });
});
