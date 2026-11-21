import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  Globe,
  MapPin,
  Music2,
  Palette as PaletteIcon,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchBookings } from '@/api/bookings';
import { getBookingMeta } from '@/constants/booking-meta';
import { Elevation, Palette, Radii, Typography } from '@/constants/theme';
import { canCheckIn, getBookingCheckIn, saveBookingCheckIn } from '@/lib/check-in';
import { formatBookingDate, formatBookingTime } from '@/lib/date-format';
import {
  getBookingNote,
  saveBookingNote,
  validateNote,
} from '@/lib/notes';
import { Booking } from '@/types/booking';

function getCategoryIcon(id: string, title: string, color: string, size = 14) {
  const lower = (id + ' ' + title).toLowerCase();
  if (lower.includes('studio')) return <Camera size={size} color={color} />;
  if (lower.includes('site') || lower.includes('walkthrough')) return <Building2 size={size} color={color} />;
  if (lower.includes('review') || lower.includes('plan')) return <ClipboardCheck size={size} color={color} />;
  if (lower.includes('consult') || lower.includes('design')) return <PaletteIcon size={size} color={color} />;
  if (lower.includes('audit') || lower.includes('security')) return <ShieldCheck size={size} color={color} />;
  if (lower.includes('rehearsal') || lower.includes('sound')) return <Music2 size={size} color={color} />;
  if (lower.includes('strategy') || lower.includes('sync')) return <Users size={size} color={color} />;
  return <Calendar size={size} color={color} />;
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
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);

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
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        // Fetch bookings and note + check-in status in parallel
        const [allBookings, savedNote, savedCheckIn] = await Promise.all([
          fetchBookings(),
          getBookingNote(id),
          getBookingCheckIn(id),
        ]);

        if (ignore) return;

        const found = allBookings.find((b) => b.id === id);
        if (found) {
          setBooking(found);
          if (savedNote !== null) {
            setNote(savedNote);
          }
          if (savedCheckIn !== null) {
            setIsCheckedIn(true);
            setCheckedInAt(savedCheckIn);
          }
        } else {
          setError('Booking not found');
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

  const handleCheckIn = useCallback(async () => {
    if (!id) return;
    try {
      const timestamp = await saveBookingCheckIn(id);
      setIsCheckedIn(true);
      setCheckedInAt(timestamp);
    } catch {
      // Still set local state if storage has issue
      setIsCheckedIn(true);
    }
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
      // Explicitly display "Note saved successfully" so it cannot be misread as "Not saved"
      setNoteFeedback({ message: 'Note saved successfully', type: 'success' });
    } catch {
      setNoteFeedback({ message: 'Could not save note', type: 'error' });
    } finally {
      setSavingNote(false);
    }
  }, [id, note]);

  const handleClearNote = useCallback(async () => {
    setNote('');
    setNoteFeedback(null);
    Keyboard.dismiss();
    if (id) {
      try {
        await saveBookingNote(id, '');
      } catch {
        // Silently clear local
      }
    }
  }, [id]);

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
            <AlertCircle size={32} color={palette.errorText} />
          </View>
          <Text style={[styles.errorTitle, { color: palette.errorText }]}>
            {error || 'Booking not found'}
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
            <ArrowLeft size={16} color={palette.primaryText} />
            <Text style={[styles.backButtonText, { color: palette.primaryText }]}>
              Back to Bookings
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const meta = getBookingMeta(booking);
  const checkInEnabled = canCheckIn(new Date(), new Date(booking.startsAt));
  const formattedDate = formatBookingDate(booking.startsAt, booking.timezone);
  const formattedTime = formatBookingTime(booking.startsAt, booking.timezone);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: palette.background }]}
      edges={['bottom', 'left', 'right']}>
      <KeyboardAwareScrollView
        style={styles.keyboardAvoidingView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bottomOffset={24}
      >
        <View style={styles.innerContent}>
          {/* Hero Card with Banner Image & Details */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
              Elevation.card,
            ]}>
            <View style={styles.heroBannerContainer}>
              <Image
                source={{ uri: meta.imageUrl }}
                style={styles.heroBannerImage}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.heroBannerOverlay} />

              {/* Category Pill Floating */}
              <View style={styles.heroCategoryPill}>
                {getCategoryIcon(booking.id, booking.title, '#FFFFFF', 13)}
                <Text style={styles.heroCategoryText}>{meta.category}</Text>
              </View>

              {/* ID Tag Floating */}
              <View style={styles.heroIdPill}>
                <Text style={styles.heroIdText}>ID: #{booking.id}</Text>
              </View>
            </View>

            <View style={styles.heroBody}>
              <View style={styles.titleStatusRow}>
                <Text style={[styles.bookingTitle, { color: palette.text }]}>
                  {booking.title}
                </Text>
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
                  {isCheckedIn ? (
                    <View style={styles.badgeRow}>
                      <CheckCircle2 size={12} color={palette.accent} />
                      <Text style={[styles.statusChipText, { color: palette.accent }]}>
                        Confirmed
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.statusChipText,
                        {
                          color: checkInEnabled
                            ? palette.accent
                            : palette.textSecondary,
                        },
                      ]}>
                      {checkInEnabled ? '• Check-in Open' : '• Scheduled'}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Location & Host Information Card */}
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
                Location & Host
              </Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLabelRow}>
                <MapPin size={16} color={palette.textSecondary} />
                <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>
                  Venue & Address
                </Text>
              </View>
              <Text style={[styles.detailValue, { color: palette.text }]}>
                {meta.location}
              </Text>
            </View>

            <View style={[styles.rowDivider, { backgroundColor: palette.border }]} />

            <View style={styles.detailRow}>
              <View style={styles.detailLabelRow}>
                <User size={16} color={palette.textSecondary} />
                <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>
                  Organizer / Host
                </Text>
              </View>
              <Text style={[styles.detailValue, { color: palette.text }]}>
                {meta.host}
              </Text>
            </View>

            <View style={[styles.rowDivider, { backgroundColor: palette.border }]} />

            <View style={styles.detailRow}>
              <View style={styles.detailLabelRow}>
                <FileText size={16} color={palette.textSecondary} />
                <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>
                  Instructions
                </Text>
              </View>
              <Text style={[styles.detailValue, { color: palette.textSecondary, fontSize: 13, lineHeight: 18 }]}>
                {meta.instructions}
              </Text>
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
                <Calendar size={16} color={palette.textSecondary} />
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
                <Clock size={16} color={palette.textSecondary} />
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
                <Globe size={16} color={palette.textSecondary} />
                <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>
                  IANA Timezone
                </Text>
              </View>
              <Text style={[styles.detailValue, { color: palette.text }]}>
                {booking.timezone}
              </Text>
            </View>

            <View style={[styles.rowDivider, { backgroundColor: palette.border }]} />

            <View style={styles.detailRow}>
              <View style={styles.detailLabelRow}>
                <Clock size={16} color={palette.textSecondary} />
                <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>
                  Duration
                </Text>
              </View>
              <Text style={[styles.detailValue, { color: palette.text }]}>
                {meta.duration}
              </Text>
            </View>
          </View>

          {/* Check-in Action Card */}
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
                  <CheckCircle2 size={13} color={palette.accent} />
                  <Text style={[styles.badgeConfirmedText, { color: palette.accent }]}>
                    Verified
                  </Text>
                </View>
              )}
            </View>

            <Pressable
              disabled={!checkInEnabled || isCheckedIn}
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
                pressed && checkInEnabled && !isCheckedIn && styles.buttonPressed,
              ]}
              onPress={handleCheckIn}
              accessibilityRole="button"
              accessibilityLabel="Check in"
              accessibilityState={{ disabled: !checkInEnabled || isCheckedIn }}>
              <View style={styles.badgeRow}>
                {isCheckedIn ? <Check size={16} color="#FFFFFF" /> : null}
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
                  {isCheckedIn ? 'Checked in' : 'Check in'}
                </Text>
              </View>
            </Pressable>

            {isCheckedIn && (
              <View
                style={[
                  styles.confirmationCard,
                  { backgroundColor: palette.accentLight },
                ]}>
                <View style={styles.confirmHeaderRow}>
                  <CheckCircle2 size={16} color={palette.accent} />
                  <Text style={[styles.confirmationText, { color: palette.accentText }]}>
                    You have successfully checked in for this booking.
                  </Text>
                </View>
                {checkedInAt && (
                  <Text style={[styles.confirmationSubtext, { color: palette.accentText }]}>
                    Check-in recorded at {new Date(checkedInAt).toLocaleTimeString()}
                  </Text>
                )}
              </View>
            )}

            {!checkInEnabled && !isCheckedIn && (
              <View style={styles.hintRow}>
                <Clock size={14} color={palette.textSecondary} />
                <Text style={[styles.hintText, { color: palette.textSecondary }]}>
                  Check-in opens 15 minutes before the start time.
                </Text>
              </View>
            )}
          </View>

          {/* Note Persistence Card */}
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
              <Text style={[styles.sectionHeading, { color: palette.text }]}>
                Note
              </Text>
              <View style={[styles.charCountBadge, { backgroundColor: palette.surfaceVariant }]}>
                <Text
                  style={[
                    styles.charCountText,
                    {
                      color:
                        note.length > 140 ? palette.errorText : palette.textSecondary,
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
                  borderColor: isNoteFocused
                    ? palette.borderFocused
                    : palette.border,
                },
              ]}>
              <TextInput
                style={[styles.noteInput, { color: palette.text }]}
                placeholder="Add your note here..."
                placeholderTextColor={palette.textTertiary}
                value={note}
                onChangeText={(val) => {
                  setNote(val);
                  if (noteFeedback) {
                    setNoteFeedback(null);
                  }
                }}
                onFocus={() => setIsNoteFocused(true)}
                onBlur={() => setIsNoteFocused(false)}
                multiline
                numberOfLines={4}
                maxLength={200}
                textAlignVertical="top"
                accessibilityLabel="Note"
              />

              {note.length > 0 && (
                <View style={styles.noteInputFooter}>
                  <Pressable
                    style={styles.clearNoteButton}
                    onPress={handleClearNote}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel="Clear note">
                    <X size={12} color={palette.textSecondary} />
                    <Text style={[styles.clearNoteButtonText, { color: palette.textSecondary }]}>
                      Clear
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Feedback Banner */}
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
                {noteFeedback.type === 'error' ? (
                  <AlertCircle size={16} color={palette.errorText} />
                ) : (
                  <CheckCircle2 size={16} color={palette.accent} />
                )}
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
      </KeyboardAwareScrollView>
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
    ...Typography.body,
    marginTop: 8,
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  errorTitle: {
    ...Typography.title,
    textAlign: 'center',
    marginBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radii.pill,
    marginTop: 12,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: Radii.card,
    overflow: 'hidden',
  },
  heroBannerContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
  },
  heroBannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  heroCategoryPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    gap: 6,
  },
  heroCategoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  heroIdPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  heroIdText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  heroBody: {
    padding: 16,
  },
  titleStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingTitle: {
    ...Typography.hero,
    fontSize: 22,
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.chip,
    borderWidth: 1,
  },
  statusChipText: {
    ...Typography.micro,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
    marginBottom: 4,
  },
  sectionHeading: {
    ...Typography.title,
    fontSize: 16,
    fontWeight: '700',
  },
  badgeConfirmed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.chip,
  },
  badgeConfirmedText: {
    ...Typography.micro,
    fontWeight: '700',
  },
  detailRow: {
    gap: 4,
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    ...Typography.caption,
  },
  detailValue: {
    ...Typography.body,
    fontWeight: '600',
    paddingLeft: 24,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  checkInButton: {
    height: 48,
    borderRadius: Radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 4,
  },
  checkInButtonText: {
    ...Typography.button,
    fontSize: 15,
  },
  confirmationCard: {
    borderRadius: Radii.chip,
    padding: 12,
    gap: 4,
    marginTop: 4,
  },
  confirmHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmationText: {
    ...Typography.caption,
    fontWeight: '600',
    flex: 1,
  },
  confirmationSubtext: {
    ...Typography.micro,
    paddingLeft: 24,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  hintText: {
    ...Typography.caption,
    fontSize: 12,
  },
  noteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.chip,
  },
  charCountText: {
    ...Typography.micro,
    fontWeight: '600',
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
    minHeight: 80,
    paddingTop: 0,
    paddingBottom: 4,
  },
  noteInputFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 6,
    marginTop: 4,
  },
  clearNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  clearNoteButtonText: {
    ...Typography.micro,
    fontWeight: '600',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: Radii.chip,
    gap: 8,
  },
  feedbackText: {
    ...Typography.caption,
    fontWeight: '600',
    flex: 1,
  },
  saveNoteButton: {
    height: 48,
    borderRadius: Radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveNoteButtonText: {
    ...Typography.button,
  },
});
