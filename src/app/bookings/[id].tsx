import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { fetchBookings } from '@/api/bookings';
import { canCheckIn } from '@/lib/check-in';
import { formatBookingDate, formatBookingTime } from '@/lib/date-format';
import { Booking } from '@/types/booking';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);

  useEffect(() => {
    let ignore = false;

    async function loadBooking() {
      try {
        const bookings = await fetchBookings();
        if (!ignore) {
          const match = bookings.find((b) => b.id === id);
          if (match) {
            setBooking(match);
          } else {
            setError('Booking not found');
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

    void loadBooking();

    return () => {
      ignore = true;
    };
  }, [id]);

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
});
