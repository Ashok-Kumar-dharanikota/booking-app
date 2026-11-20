import AsyncStorage from '@react-native-async-storage/async-storage';

export const NOTE_STORAGE_PREFIX = '@booking_note_';

export function getNoteStorageKey(bookingId: string): string {
  return `${NOTE_STORAGE_PREFIX}${bookingId}`;
}

export type NoteValidationResult =
  | { isValid: true; message: 'Note saved' }
  | { isValid: false; message: 'Enter a note' | 'Keep the note under 140 characters' };

export function validateNote(input: string): NoteValidationResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { isValid: false, message: 'Enter a note' };
  }
  if (input.length > 140) {
    return { isValid: false, message: 'Keep the note under 140 characters' };
  }
  return { isValid: true, message: 'Note saved' };
}

export async function saveBookingNote(bookingId: string, note: string): Promise<void> {
  const key = getNoteStorageKey(bookingId);
  await AsyncStorage.setItem(key, note);
}

export async function getBookingNote(bookingId: string): Promise<string | null> {
  const key = getNoteStorageKey(bookingId);
  return await AsyncStorage.getItem(key);
}
