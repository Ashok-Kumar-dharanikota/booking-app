import { describe, expect, it, vi } from 'vitest';
import {
  getBookingNote,
  getNoteStorageKey,
  saveBookingNote,
  validateNote,
} from './notes';

vi.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    default: {
      getItem: vi.fn(async (key: string) => store.get(key) ?? null),
      setItem: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: vi.fn(async (key: string) => {
        store.delete(key);
      }),
      clear: vi.fn(async () => {
        store.clear();
      }),
    },
  };
});

describe('Note validation and persistence', () => {
  describe('getNoteStorageKey', () => {
    it('creates key that includes the booking ID', () => {
      expect(getNoteStorageKey('studio')).toBe('@booking_note_studio');
      expect(getNoteStorageKey('review')).toBe('@booking_note_review');
    });
  });

  describe('validateNote', () => {
    it('returns "Enter a note" when input is empty or whitespace', () => {
      expect(validateNote('')).toEqual({
        isValid: false,
        message: 'Enter a note',
      });
      expect(validateNote('   ')).toEqual({
        isValid: false,
        message: 'Enter a note',
      });
    });

    it('returns "Keep the note under 140 characters" when input exceeds 140 characters', () => {
      const longText = 'a'.repeat(141);
      expect(validateNote(longText)).toEqual({
        isValid: false,
        message: 'Keep the note under 140 characters',
      });
    });

    it('returns "Note saved" when input is exactly 140 characters', () => {
      const maxText = 'a'.repeat(140);
      expect(validateNote(maxText)).toEqual({
        isValid: true,
        message: 'Note saved',
      });
    });

    it('returns "Note saved" for standard valid note', () => {
      expect(validateNote('Review blueprints before meeting')).toEqual({
        isValid: true,
        message: 'Note saved',
      });
    });
  });

  describe('AsyncStorage persistence', () => {
    it('saves and retrieves note for specific booking ID', async () => {
      await saveBookingNote('studio', 'Remember keycard');
      const retrieved = await getBookingNote('studio');
      expect(retrieved).toBe('Remember keycard');
    });

    it('returns null when no note exists for booking', async () => {
      const empty = await getBookingNote('nonexistent');
      expect(empty).toBeNull();
    });
  });
});
