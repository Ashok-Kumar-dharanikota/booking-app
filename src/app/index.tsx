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
import { Elevation, Palette, Radii, Typography } from '@/constants/theme';
import { filterBookings } from '@/lib/filter';
import { Booking } from '@/types/booking';

function getCategoryGlyph(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('studio')) return '📸';
  if (lower.includes('walkthrough') || lower.includes('site')) return '📐';
  if (lower.includes('review') || lower.includes('plan')) return '📋';
  return '📅';
}

function SkeletonCard({ isDark }: { isDark: boolean }) {
  const palette = Palette[isDark ? 'dark' : 'light'];
  return (
    <View
      style={[
        styles.bookingCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View
            style={[
              styles.glyphContainer,
              { backgroundColor: palette.surfaceVariant },
            ]}
          />
          <View style={styles.cardTitles}>
            <View
              style={[
                styles.skeletonBar,
                { width: 120, height: 16, backgroundColor: palette.surfaceVariant },
              ]}
            />
            <View
              style={[
                styles.skeletonBar,
                { width: 160, height: 12, marginTop: 6, backgroundColor: palette.surfaceVariant },
              ]}
            />
          </View>
        </View>
        <View
          style={[
            styles.skeletonPill,
            { width: 90, height: 22, backgroundColor: palette.surfaceVariant },
          ]}
        />
      </View>
    </View>
  );
}

export default function BookingListScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = Palette[isDark ? 'dark' : 'light'];

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

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

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: palette.background }]}
        edges={['top', 'left', 'right']}>
        <View style={styles.headerContainer}>
          <View style={styles.topBar}>
            <View>
              <Text style={[styles.appTitle, { color: palette.text }]}>Bookings</Text>
              <Text style={[styles.appSubtitle, { color: palette.textSecondary }]}>
                Loading schedule...
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.skeletonContainer}>
          <SkeletonCard isDark={isDark} />
          <SkeletonCard isDark={isDark} />
          <SkeletonCard isDark={isDark} />
          <View style={styles.loadingSpinnerRow}>
            <ActivityIndicator size="small" color={palette.textSecondary} />
            <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
              Loading bookings...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: palette.background }]}
        edges={['top', 'left', 'right']}>
        <View style={styles.headerContainer}>
          <Text style={[styles.appTitle, { color: palette.text }]}>Bookings</Text>
        </View>
        <View style={styles.centerContainer}>
          <View style={[styles.errorIconCircle, { backgroundColor: palette.errorLight }]}>
            <Text style={styles.errorIconGlyph}>⚠️</Text>
          </View>
          <Text style={[styles.errorText, { color: palette.error }]}>Could not load bookings</Text>
          <Text style={[styles.errorSubtext, { color: palette.textSecondary }]}>
            Unable to connect to the scheduling service. Check your connection and try again.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              { backgroundColor: palette.primary },
              pressed && styles.buttonPressed,
            ]}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Try again">
            <Text style={[styles.retryButtonText, { color: palette.primaryText }]}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: palette.background }]}
      edges={['bottom', 'left', 'right']}>
      {/* Search Header placed outside FlatList so TextInput never unmounts or loses keyboard focus on typing */}
      <View style={styles.headerContainer}>
        {/* Status / Count Bar */}
        <View style={styles.topBar}>
          <Text style={[styles.appSubtitle, { color: palette.textSecondary }]}>
            {bookings.length === 0
              ? 'No active appointments'
              : debouncedQuery.trim().length >= 3
                ? `${filteredBookings.length} matching appointment${filteredBookings.length === 1 ? '' : 's'}`
                : `${bookings.length} scheduled appointment${bookings.length === 1 ? '' : 's'}`}
          </Text>
          {lastUpdated && (
            <View style={[styles.updatedChip, { backgroundColor: palette.surfaceVariant }]}>
              <Text style={styles.clockIcon}>🕒</Text>
              <Text style={[styles.updatedLabel, { color: palette.textSecondary }]}>
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}
        </View>

        {/* Search Input Section */}
        <View style={styles.searchSection}>
          <Text style={[styles.fieldLabel, { color: palette.text }]}>Search bookings</Text>
          <View
            style={[
              styles.searchInputWrapper,
              {
                backgroundColor: palette.surface,
                borderColor: isSearchFocused ? palette.borderFocused : palette.border,
              },
            ]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: palette.text }]}
              placeholder="Search bookings"
              placeholderTextColor={palette.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Search bookings"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                hitSlop={8}
                style={styles.clearSearchButton}
                accessibilityRole="button"
                accessibilityLabel="Clear search input">
                <Text style={[styles.clearSearchIcon, { color: palette.textTertiary }]}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>
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
            tintColor={palette.text}
            colors={[palette.text]}
          />
        }
        renderItem={({ item }) => {
          const glyph = getCategoryGlyph(item.title);
          return (
            <Pressable
              style={({ pressed }) => [
                styles.bookingCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
                Elevation.card,
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
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[
                      styles.glyphContainer,
                      { backgroundColor: palette.surfaceVariant },
                    ]}>
                    <Text style={styles.glyphText}>{glyph}</Text>
                  </View>
                  <View style={styles.cardTitles}>
                    <Text style={[styles.bookingTitle, { color: palette.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.bookingSubtext, { color: palette.textSecondary }]}>
                      Tap to view details & check-in
                    </Text>
                  </View>
                </View>

                <View style={styles.cardHeaderRight}>
                  <View
                    style={[
                      styles.timezoneBadge,
                      {
                        backgroundColor: palette.surfaceVariant,
                        borderColor: palette.border,
                      },
                    ]}>
                    <Text style={[styles.timezoneBadgeText, { color: palette.text }]}>
                      {item.timezone}
                    </Text>
                  </View>
                  <Text style={[styles.chevronIcon, { color: palette.textTertiary }]}>›</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: palette.surfaceVariant }]}>
              <Text style={styles.emptyIconGlyph}>
                {bookings.length === 0 ? '📅' : '🔍'}
              </Text>
            </View>
            <Text style={[styles.emptyText, { color: palette.text }]}>
              {bookings.length === 0 ? 'No bookings' : 'No bookings match'}
            </Text>
            <Text style={[styles.emptySubtext, { color: palette.textSecondary }]}>
              {bookings.length === 0
                ? 'There are no appointments scheduled at this time.'
                : `No results found for "${debouncedQuery}". Try another title.`}
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
    paddingTop: 12,
    paddingBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  appTitle: {
    ...Typography.display,
  },
  appSubtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  updatedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    gap: 4,
  },
  clockIcon: {
    fontSize: 11,
  },
  updatedLabel: {
    ...Typography.micro,
  },
  searchSection: {
    marginBottom: 6,
  },
  fieldLabel: {
    ...Typography.micro,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1.5,
    borderRadius: Radii.input,
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    ...Typography.body,
    paddingVertical: 0,
  },
  clearSearchButton: {
    padding: 4,
  },
  clearSearchIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
    flexGrow: 1,
  },
  bookingCard: {
    borderWidth: 1,
    borderRadius: Radii.card,
    padding: 14,
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  glyphContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphText: {
    fontSize: 18,
  },
  cardTitles: {
    flex: 1,
  },
  bookingTitle: {
    ...Typography.title,
  },
  bookingSubtext: {
    ...Typography.caption,
    marginTop: 2,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  timezoneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.chip,
    borderWidth: 1,
  },
  timezoneBadgeText: {
    ...Typography.micro,
  },
  chevronIcon: {
    fontSize: 20,
    fontWeight: '300',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  skeletonBar: {
    borderRadius: 4,
  },
  skeletonPill: {
    borderRadius: Radii.chip,
  },
  loadingSpinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
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
  errorText: {
    ...Typography.headline,
    textAlign: 'center',
  },
  errorSubtext: {
    ...Typography.body,
    textAlign: 'center',
    maxWidth: 280,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radii.button,
    marginTop: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    ...Typography.title,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyIconGlyph: {
    fontSize: 26,
  },
  emptyText: {
    ...Typography.headline,
    textAlign: 'center',
  },
  emptySubtext: {
    ...Typography.body,
    textAlign: 'center',
    maxWidth: 280,
  },
});
