import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { fetchBookings } from '@/api/bookings';
import { filterBookings } from '@/lib/filter';
import { Booking } from '@/types/booking';

export default function BookingListScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Debounce search query input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchBookings();
      setBookings(data);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError('Could not load bookings');
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const data = await fetchBookings();
        if (!ignore) {
          setBookings(data);
          setLastUpdated(new Date());
          setError(null);
        }
      } catch {
        if (!ignore) {
          setError('Could not load bookings');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void init();

    return () => {
      ignore = true;
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const onRetry = useCallback(async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
  }, [fetchData]);

  const filteredBookings = filterBookings(bookings, debouncedQuery);

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
    input: {
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      borderColor: isDark ? '#333333' : '#E5E7EB',
    },
    card: {
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderColor: isDark ? '#2D2D2D' : '#E5E7EB',
    },
    badge: {
      backgroundColor: isDark ? '#2A2A2A' : '#EFF6FF',
    },
    badgeText: {
      color: isDark ? '#93C5FD' : '#2563EB',
    },
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.safeArea, dynamicStyles.container]} edges={['top', 'left', 'right']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={[styles.statusText, dynamicStyles.subtext]}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, dynamicStyles.container]} edges={['top', 'left', 'right']}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Could not load bookings</Text>
          <Pressable
            style={({ pressed }) => [styles.retryButton, pressed && styles.buttonPressed]}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Try again">
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, dynamicStyles.container]} edges={['top', 'left', 'right']}>
      {/* Search Header placed outside FlatList so TextInput never unmounts or loses keyboard focus on typing */}
      <View style={styles.headerContainer}>
        <View style={styles.searchSection}>
          <Text style={[styles.fieldLabel, dynamicStyles.text]}>Search bookings</Text>
          <TextInput
            style={[styles.searchInput, dynamicStyles.input]}
            placeholder="Search bookings"
            placeholderTextColor={isDark ? '#777777' : '#9CA3AF'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            accessibilityLabel="Search bookings"
          />
        </View>

        {lastUpdated && (
          <View style={styles.updatedContainer}>
            <Text style={[styles.updatedLabel, dynamicStyles.subtext]}>
              Updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#FFFFFF' : '#2563EB'}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.bookingCard,
              dynamicStyles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => {
              router.push({
                pathname: '/bookings/[id]',
                params: { id: item.id },
              });
            }}
            accessibilityRole="button"
            accessibilityLabel={`Booking ${item.title}`}>
            <View style={styles.cardHeader}>
              <Text style={[styles.bookingTitle, dynamicStyles.text]}>{item.title}</Text>
              <View style={[styles.timezoneBadge, dynamicStyles.badge]}>
                <Text style={[styles.timezoneBadgeText, dynamicStyles.badgeText]}>
                  {item.timezone}
                </Text>
              </View>
            </View>
            <Text style={[styles.bookingSubtext, dynamicStyles.subtext]}>
              Tap to view details & check-in
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, dynamicStyles.subtext]}>
              {bookings.length === 0 ? 'No bookings' : 'No bookings match'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  searchSection: {
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  updatedContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  updatedLabel: {
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
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
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  bookingCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  timezoneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timezoneBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bookingSubtext: {
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
