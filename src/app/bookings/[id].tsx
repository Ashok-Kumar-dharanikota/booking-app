import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
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
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { fetchBookings } from '@/api/bookings';
import { Elevation, Palette, Radii, Typography } from '@/constants/theme';
import { canCheckIn } from '@/lib/check-in';
import { formatBookingDate, formatBookingTime } from '@/lib/date-format';
import {
  getBookingNote,
  saveBookingNote,
  validateNote,
} from '@/lib/notes';
import { Booking } from '@/types/booking';

function getCategoryGlyph(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('studio')) return '📸';
  if (lower.includes('walkthrough') || lower.includes('site')) return '📐';
  if (lower.includes('review') || lower.includes('plan')) return '📋';
  return '📅';
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = Palette[isDark ? 'dark' : 'light'];

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
  const [isNoteFocused, setIsNoteFocused] = useState<boolean>(false);

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

    Keyboard.dismiss();

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

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: palette.background }]}
        edges={['bottom', 'left', 'right']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={palette.text} />
          <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
            Loading booking details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: palette.background }]}
        edges={['bottom', 'left', 'right']}>
        <View style={styles.centerContainer}>
          <View style={[styles.errorIconCircle, { backgroundColor: palette.errorLight }]}>
            <Text style={styles.errorIconGlyph}>⚠️</Text>
          </View>
          <Text style={[styles.errorHeading, { color: palette.error }]}>
            {error || 'Booking not found'}
          </Text>
          <Text style={[styles.errorSubtext, { color: palette.textSecondary }]}>
            The requested appointment could not be loaded or may no longer exist.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: palette.primary },
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back to Bookings">
            <Text style={[styles.backButtonText, { color: palette.primaryText }]}>
              Back to Bookings
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const checkInEnabled = canCheckIn(new Date(), new Date(booking.startsAt));
  const formattedDate = formatBookingDate(booking.startsAt, booking.timezone);
  const formattedTime = formatBookingTime(booking.startsAt, booking.timezone);
  const glyph = getCategoryGlyph(booking.title);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: palette.background }]}
      edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={styles.innerContent}>
              {/* Hero Title Section */}
              <View style={styles.titleSection}>
                <View style={styles.titleRow}>
                  <View
                    style={[
                      styles.heroGlyphContainer,
                      { backgroundColor: palette.surfaceVariant },
                    ]}>
                    <Text style={styles.heroGlyphText}>{glyph}</Text>
                  </View>
                  <View style={styles.titleTextColumn}>
                    <Text style={[styles.bookingTitle, { color: palette.text }]}>
                      {booking.title}
                    </Text>
                    <View style={styles.idChipRow}>
                      <View
                        style={[
                          styles.idChip,
                          {
                            backgroundColor: palette.surfaceVariant,
                            borderColor: palette.border,
                          },
                        ]}>
                        <Text style={[styles.bookingId, { color: palette.textSecondary }]}>
                          ID: {booking.id}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusChip,
                          {
                            backgroundColor: isCheckedIn
                              ? palette.accentLight
                              : checkInEnabled
                                ? palette.surfaceVariant
                                : palette.surfaceVariant,
                            borderColor: isCheckedIn ? palette.accent : palette.border,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.statusChipText,
                            {
                              color: isCheckedIn
                                ? palette.accent
                                : palette.textSecondary,
                            },
                          ]}>
                          {isCheckedIn
                            ? '✓ Confirmed'
                            : checkInEnabled
                              ? '• Check-in Open'
                              : '• Scheduled'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Schedule & Timezone Information Card */}
              <View
                style={[
                  styles.detailCard,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                  },
                  Elevation.card,
                ]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.sectionHeading, { color: palette.text }]}>
                    Schedule & Timezone
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailLabelRow}>
                    <Text style={styles.rowIcon}>📅</Text>
                    <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>
                      Calendar Date
                    </Text>
                  </View>
                  <Text style={[styles.detailValue, { color: palette.text }]}>
                    {formattedDate}
                  </Text>
                </View>

                <View style={[styles.rowDivider, { backgroundColor: palette.border }]} />

                <View style={styles.detailRow}>
                  <View style={styles.detailLabelRow}>
                    <Text style={styles.rowIcon}>🕒</Text>
                    <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>
                      Local Time
                    </Text>
                  </View>
                  <Text style={[styles.detailValue, { color: palette.text }]}>
                    {formattedTime}
                  </Text>
                </View>

                <View style={[styles.rowDivider, { backgroundColor: palette.border }]} />

                <View style={styles.detailRow}>
                  <View style={styles.detailLabelRow}>
                    <Text style={styles.rowIcon}>🌐</Text>
                    <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>
                      IANA Timezone
                    </Text>
                  </View>
                  <Text style={[styles.detailValue, { color: palette.text }]}>
                    {booking.timezone}
                  </Text>
                </View>
              </View>

              {/* Check-In Section */}
              <View
                style={[
                  styles.detailCard,
                  {
                    backgroundColor: palette.surface,
                    borderColor: isCheckedIn ? palette.accent : palette.border,
                  },
                  Elevation.card,
                ]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.sectionHeading, { color: palette.text }]}>
                    Check-in
                  </Text>
                  {isCheckedIn && (
                    <View
                      style={[
                        styles.badgeConfirmed,
                        { backgroundColor: palette.accentLight },
                      ]}>
                      <Text style={[styles.badgeConfirmedText, { color: palette.accent }]}>
                        Verified
                      </Text>
                    </View>
                  )}
                </View>

                <Pressable
                  disabled={!checkInEnabled}
                  style={({ pressed }) => [
                    styles.checkInButton,
                    {
                      backgroundColor: isCheckedIn
                        ? palette.accent
                        : checkInEnabled
                          ? palette.primary
                          : palette.surfaceVariant,
                      borderColor: isCheckedIn
                        ? palette.accent
                        : checkInEnabled
                          ? palette.primary
                          : palette.border,
                    },
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
                      {
                        color: isCheckedIn
                          ? '#FFFFFF'
                          : checkInEnabled
                            ? palette.primaryText
                            : palette.textTertiary,
                      },
                    ]}>
                    {isCheckedIn ? '✓ Checked in' : 'Check in'}
                  </Text>
                </Pressable>

                {!checkInEnabled && (
                  <View style={styles.hintRow}>
                    <Text style={styles.hintIcon}>ℹ️</Text>
                    <Text style={[styles.hintText, { color: palette.textSecondary }]}>
                      Check-in opens 15 minutes before the start time.
                    </Text>
                  </View>
                )}
                {isCheckedIn && (
                  <View style={[styles.successBanner, { backgroundColor: palette.accentLight }]}>
                    <Text style={[styles.successText, { color: palette.accentText }]}>
                      You have successfully checked in for this booking.
                    </Text>
                  </View>
                )}
              </View>

              {/* Notes Section with Persistence and Validation */}
              <View
                style={[
                  styles.detailCard,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                  },
                  Elevation.card,
                ]}>
                <View style={styles.noteHeaderRow}>
                  <View style={styles.noteTitleWithIcon}>
                    <Text style={[styles.sectionHeading, { color: palette.text }]}>
                      Note
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.charCountBadge,
                      {
                        backgroundColor:
                          note.length > 140
                            ? palette.errorLight
                            : palette.surfaceVariant,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.charCount,
                        {
                          color:
                            note.length > 140
                              ? palette.error
                              : palette.textSecondary,
                        },
                      ]}>
                      {note.length}/140
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.noteInputWrapper,
                    {
                      backgroundColor: palette.surface,
                      borderColor:
                        note.length > 140
                          ? palette.error
                          : isNoteFocused
                            ? palette.borderFocused
                            : palette.border,
                    },
                  ]}>
                  <TextInput
                    style={[styles.noteInput, { color: palette.text }]}
                    placeholder="Add your note here..."
                    placeholderTextColor={palette.textTertiary}
                    value={note}
                    onChangeText={(text) => {
                      setNote(text);
                      if (noteFeedback) {
                        setNoteFeedback(null);
                      }
                    }}
                    onFocus={() => setIsNoteFocused(true)}
                    onBlur={() => setIsNoteFocused(false)}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    accessibilityLabel="Note"
                  />
                  {note.length > 0 && (
                    <Pressable
                      onPress={() => {
                        setNote('');
                        setNoteFeedback(null);
                      }}
                      hitSlop={8}
                      style={styles.clearNoteButton}
                      accessibilityRole="button"
                      accessibilityLabel="Clear note">
                      <Text style={[styles.clearNoteText, { color: palette.textTertiary }]}>
                        ✕ Clear
                      </Text>
                    </Pressable>
                  )}
                </View>

                {noteFeedback && (
                  <View
                    style={[
                      styles.feedbackBanner,
                      {
                        backgroundColor:
                          noteFeedback.type === 'error'
                            ? palette.errorLight
                            : palette.accentLight,
                      },
                    ]}>
                    <Text style={styles.feedbackIcon}>
                      {noteFeedback.type === 'error' ? '⚠️' : '✓'}
                    </Text>
                    <Text
                      style={[
                        styles.feedbackText,
                        {
                          color:
                            noteFeedback.type === 'error'
                              ? palette.errorText
                              : palette.accentText,
                        },
                      ]}>
                      {noteFeedback.message}
                    </Text>
                  </View>
                )}

                <Pressable
                  disabled={savingNote}
                  style={({ pressed }) => [
                    styles.saveNoteButton,
                    { backgroundColor: palette.primary },
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleSaveNote}
                  accessibilityRole="button"
                  accessibilityLabel="Save note">
                  {savingNote ? (
                    <ActivityIndicator size="small" color={palette.primaryText} />
                  ) : (
                    <Text style={[styles.saveNoteButtonText, { color: palette.primaryText }]}>
                      Save note
                    </Text>
                  )}
                </Pressable>
              </View>
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
      flexGrow: 1,
      padding: 16,
      paddingBottom: 48,
    },
  innerContent: {
    gap: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    ...Typography.caption,
  },
  errorIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  errorIconGlyph: {
    fontSize: 24,
  },
  errorHeading: {
    ...Typography.headline,
    textAlign: 'center',
  },
  errorSubtext: {
    ...Typography.body,
    textAlign: 'center',
    maxWidth: 280,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radii.button,
    marginTop: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    ...Typography.title,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  titleSection: {
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroGlyphContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGlyphText: {
    fontSize: 22,
  },
  titleTextColumn: {
    flex: 1,
  },
  bookingTitle: {
    ...Typography.display,
  },
  idChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  idChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.chip,
    borderWidth: 1,
  },
  bookingId: {
    ...Typography.micro,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.chip,
    borderWidth: 1,
  },
  statusChipText: {
    ...Typography.micro,
  },
  detailCard: {
    borderWidth: 1,
    borderRadius: Radii.card,
    padding: 16,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sectionHeading: {
    ...Typography.title,
  },
  badgeConfirmed: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  badgeConfirmedText: {
    ...Typography.micro,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowIcon: {
    fontSize: 14,
  },
  detailLabel: {
    ...Typography.body,
  },
  detailValue: {
    ...Typography.title,
  },
  rowDivider: {
    height: 1,
    width: '100%',
  },
  checkInButton: {
    borderRadius: Radii.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: 1,
  },
  checkInButtonText: {
    ...Typography.title,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  hintIcon: {
    fontSize: 12,
  },
  hintText: {
    ...Typography.caption,
    flex: 1,
  },
  successBanner: {
    padding: 10,
    borderRadius: Radii.chip,
    marginTop: 4,
  },
  successText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  noteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  charCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  charCount: {
    ...Typography.micro,
  },
  noteInputWrapper: {
    borderWidth: 1.5,
    borderRadius: Radii.input,
    padding: 12,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  noteInput: {
    ...Typography.body,
    paddingTop: 0,
    paddingBottom: 8,
    minHeight: 70,
  },
  clearNoteButton: {
    alignSelf: 'flex-end',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  clearNoteText: {
    ...Typography.micro,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.chip,
    gap: 8,
  },
  feedbackIcon: {
    fontSize: 14,
  },
  feedbackText: {
    ...Typography.caption,
    fontWeight: '600',
    flex: 1,
  },
  saveNoteButton: {
    borderRadius: Radii.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveNoteButtonText: {
    ...Typography.title,
  },
});
