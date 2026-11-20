import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { fetchBookings } from '@/api/bookings';
import { canCheckIn } from '@/lib/check-in';
import { formatBookingDate, formatBookingTime } from '@/lib/date-format';
import {
  getBookingNote,
  saveBookingNote,
  validateNote,
} from '@/lib/notes';
import { Booking } from '@/types/booking';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);

  // Notes state
  const [note, setNote] = useState<string>('');
  const [noteFeedback, setNoteFeedback] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [savingNote, setSavingNote] = useState<boolean>(false);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [bookings, savedNote] = await Promise.all([
          fetchBookings(),
          id ? getBookingNote(id) : Promise.resolve(null),
        ]);

        if (!ignore) {
          const match = bookings.find((b) => b.id === id);
          if (match) {
            setBooking(match);
          } else {
            setError('Booking not found');
          }
          if (savedNote !== null) {
            setNote(savedNote);
          }
        }
      } catch {
        if (!ignore) {
          setError('Could not load booking details');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, [id]);

  const handleSaveNote = useCallback(async () => {
    if (!id) return;

    const validation = validateNote(note);
    if (!validation.isValid) {
      setNoteFeedback({ message: validation.message, type: 'error' });
      return;
    }

    setSavingNote(true);
    try {
      await saveBookingNote(id, note.trim());
      setNoteFeedback({ message: 'Note saved', type: 'success' });
    } catch {
      setNoteFeedback({ message: 'Could not save note', type: 'error' });
    } finally {
      setSavingNote(false);
    }
  }, [id, note]);

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? '#121212' : '#F7F8FA',
    },
    text: {
      color: isDark ? '#FFFFFF' : '#1A1A1A',
    },
    subtext: {
      color: isDark ? '#A0A0A0' : '#6B7280',
    },
    card: {
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderColor: isDark ? '#2D2D2D' : '#E5E7EB',
    },
    divider: {
      backgroundColor: isDark ? '#2D2D2D' : '#E5E7EB',
    },
    input: {
      backgroundColor: isDark ? '#262626' : '#FAFAFA',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      borderColor: isDark ? '#3D3D3D' : '#D1D5DB',
    },
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, dynamicStyles.container]} edges={['bottom', 'left', 'right']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={[styles.statusText, dynamicStyles.subtext]}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView style={[styles.safeArea, dynamicStyles.container]} edges={['bottom', 'left', 'right']}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error || 'Booking not found'}</Text>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back to Bookings">
            <Text style={styles.backButtonText}>Back to Bookings</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const checkInEnabled = canCheckIn(new Date(), new Date(booking.startsAt));
  const formattedDate = formatBookingDate(booking.startsAt, booking.timezone);
  const formattedTime = formatBookingTime(booking.startsAt, booking.timezone);

  return (
    <SafeAreaView style={[styles.safeArea, dynamicStyles.container]} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* Title Header */}
          <View style={styles.titleSection}>
            <Text style={[styles.bookingTitle, dynamicStyles.text]}>{booking.title}</Text>
            <Text style={[styles.bookingId, dynamicStyles.subtext]}>ID: {booking.id}</Text>
          </View>

          {/* Schedule & Timezone Information Card */}
          <View style={[styles.detailCard, dynamicStyles.card]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, dynamicStyles.subtext]}>Calendar Date</Text>
              <Text style={[styles.detailValue, dynamicStyles.text]}>{formattedDate}</Text>
            </View>

            <View style={[styles.rowDivider, dynamicStyles.divider]} />

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, dynamicStyles.subtext]}>Local Time</Text>
              <Text style={[styles.detailValue, dynamicStyles.text]}>{formattedTime}</Text>
            </View>

            <View style={[styles.rowDivider, dynamicStyles.divider]} />

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, dynamicStyles.subtext]}>IANA Timezone</Text>
              <Text style={[styles.detailValue, dynamicStyles.text]}>{booking.timezone}</Text>
            </View>
          </View>

          {/* Check-In Section */}
          <View style={[styles.detailCard, dynamicStyles.card]}>
            <Text style={[styles.sectionHeading, dynamicStyles.text]}>Check-in</Text>
            <Pressable
              disabled={!checkInEnabled}
              style={({ pressed }) => [
                styles.checkInButton,
                checkInEnabled ? styles.checkInButtonEnabled : styles.checkInButtonDisabled,
                isCheckedIn && styles.checkInButtonSuccess,
                pressed && checkInEnabled && styles.buttonPressed,
              ]}
              onPress={() => {
                if (checkInEnabled) {
                  setIsCheckedIn(true);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Check in"
              accessibilityState={{ disabled: !checkInEnabled }}>
              <Text
                style={[
                  styles.checkInButtonText,
                  checkInEnabled ? styles.checkInButtonTextEnabled : styles.checkInButtonTextDisabled,
                ]}>
                {isCheckedIn ? 'Checked in' : 'Check in'}
              </Text>
            </Pressable>

            {!checkInEnabled && (
              <Text style={[styles.hintText, dynamicStyles.subtext]}>
                Check-in opens 15 minutes before the start time.
              </Text>
            )}
            {isCheckedIn && (
              <Text style={styles.successText}>
                You have successfully checked in for this booking.
              </Text>
            )}
          </View>

          {/* Notes Section with Persistence and Validation */}
          <View style={[styles.detailCard, dynamicStyles.card]}>
            <View style={styles.noteHeaderRow}>
              <Text style={[styles.sectionHeading, dynamicStyles.text]}>Note</Text>
              <Text
                style={[
                  styles.charCount,
                  note.length > 140 ? styles.charCountOver : dynamicStyles.subtext,
                ]}>
                {note.length}/140
              </Text>
            </View>

            <TextInput
              style={[styles.noteInput, dynamicStyles.input]}
              placeholder="Add your note here..."
              placeholderTextColor={isDark ? '#777777' : '#9CA3AF'}
              value={note}
              onChangeText={(text) => {
                setNote(text);
                if (noteFeedback) {
                  setNoteFeedback(null);
                }
              }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              accessibilityLabel="Note"
            />

            {noteFeedback && (
              <Text
                style={[
                  styles.feedbackText,
                  noteFeedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess,
                ]}>
                {noteFeedback.message}
              </Text>
            )}

            <Pressable
              disabled={savingNote}
              style={({ pressed }) => [
                styles.saveNoteButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleSaveNote}
              accessibilityRole="button"
              accessibilityLabel="Save note">
              {savingNote ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveNoteButtonText}>Save note</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  statusText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  titleSection: {
    marginBottom: 4,
  },
  bookingTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  bookingId: {
    fontSize: 14,
  },
  detailCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowDivider: {
    height: 1,
  },
  checkInButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInButtonEnabled: {
    backgroundColor: '#2563EB',
  },
  checkInButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  checkInButtonSuccess: {
    backgroundColor: '#16A34A',
  },
  checkInButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  checkInButtonTextEnabled: {
    color: '#FFFFFF',
  },
  checkInButtonTextDisabled: {
    color: '#9CA3AF',
  },
  hintText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 2,
  },
  successText: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  noteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 13,
  },
  charCountOver: {
    color: '#DC2626',
    fontWeight: '600',
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 90,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: -4,
  },
  feedbackError: {
    color: '#DC2626',
  },
  feedbackSuccess: {
    color: '#16A34A',
  },
  saveNoteButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveNoteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
