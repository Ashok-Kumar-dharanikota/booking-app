import AsyncStorage from '@react-native-async-storage/async-storage';

export const CHECKIN_STORAGE_PREFIX = '@booking_checkin_';

export function getCheckInStorageKey(bookingId: string): string {
  return `${CHECKIN_STORAGE_PREFIX}${bookingId}`;
}

export function canCheckIn(
  now: Date,
  startsAt: Date
): boolean {
  const diffMs = startsAt.getTime() - now.getTime();
  const fifteenMinutesMs = 15 * 60 * 1000;
  return diffMs <= fifteenMinutesMs;
}

export async function saveBookingCheckIn(bookingId: string, timestamp?: string): Promise<string> {
  const key = getCheckInStorageKey(bookingId);
  const time = timestamp ?? new Date().toISOString();
  await AsyncStorage.setItem(key, time);
  return time;
}

export async function getBookingCheckIn(bookingId: string): Promise<string | null> {
  const key = getCheckInStorageKey(bookingId);
  return await AsyncStorage.getItem(key);
}

export async function getAllCheckedInBookings(): Promise<Record<string, string>> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const checkInKeys = keys.filter((k) => k.startsWith(CHECKIN_STORAGE_PREFIX));
    if (checkInKeys.length === 0) return {};
    const pairs = await AsyncStorage.multiGet(checkInKeys);
    const result: Record<string, string> = {};
    for (const [key, val] of pairs) {
      if (val) {
        const id = key.replace(CHECKIN_STORAGE_PREFIX, '');
        result[id] = val;
      }
    }
    return result;
  } catch {
    return {};
  }
}
