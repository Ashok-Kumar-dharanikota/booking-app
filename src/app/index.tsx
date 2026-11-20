import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Search,
  X,
  Clock,
  Calendar,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Camera,
  Building2,
  ClipboardCheck,
  Palette as PaletteIcon,
  ShieldCheck,
  Music2,
  Users,
  AlertCircle,
  RefreshCw,
} from 'lucide-react-native';

import { fetchBookings } from '@/api/bookings';
import { getBookingMeta } from '@/constants/booking-meta';
import { Elevation, Palette, Radii, Typography } from '@/constants/theme';
import { canCheckIn, getAllCheckedInBookings } from '@/lib/check-in';
import { formatBookingDate, formatBookingTime } from '@/lib/date-format';
import { filterBookings } from '@/lib/filter';
import { Booking } from '@/types/booking';

function getCategoryIcon(id: string, title: string, color: string, size = 13) {
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
        Elevation.card,
      ]}>
      <View style={[styles.skeletonBanner, { backgroundColor: palette.surfaceVariant }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.skeletonBar,
              { width: 140, height: 18, backgroundColor: palette.surfaceVariant },
            ]}
          />
          <View
            style={[
              styles.skeletonPill,
              { width: 80, height: 20, backgroundColor: palette.surfaceVariant },
            ]}
          />
        </View>
        <View
          style={[
            styles.skeletonBar,
            { width: 200, height: 12, marginTop: 10, backgroundColor: palette.surfaceVariant },
          ]}
        />
        <View
          style={[
            styles.skeletonBar,
            { width: 160, height: 12, marginTop: 8, backgroundColor: palette.surfaceVariant },
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
  const [checkedInMap, setCheckedInMap] = useState<Record<string, string>>({});
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

  const loadCheckedInStatus = useCallback(async () => {
    try {
      const map = await getAllCheckedInBookings();
      setCheckedInMap(map);
    } catch {
      // Non-critical background read
    }
  }, []);

  // Refresh checked-in status whenever screen gains focus
  useFocusEffect(
    useCallback(() => {
      void loadCheckedInStatus();
    }, [loadCheckedInStatus])
  );

  const fetchData = useCallback(async () => {
    try {
      const [data, map] = await Promise.all([fetchBookings(), getAllCheckedInBookings()]);
      setError(null);
      setBookings(data);
      setCheckedInMap(map);
      setLastUpdated(new Date());
    } catch {
      setError('Could not load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function initialize() {
      try {
        const [data, map] = await Promise.all([fetchBookings(), getAllCheckedInBookings()]);
        if (!ignore) {
          setError(null);
          setBookings(data);
          setCheckedInMap(map);
          setLastUpdated(new Date());
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

    void initialize();

    return () => {
      ignore = true;
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, [fetchData]);

  // Apply 3-character threshold and debounced filtering
  const filteredBookings = filterBookings(bookings, debouncedQuery);

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const meta = getBookingMeta(item);
    const isCheckedIn = Boolean(checkedInMap[item.id]);
    const checkInOpen = canCheckIn(new Date(), new Date(item.startsAt));
    const formattedDate = formatBookingDate(item.startsAt, item.timezone);
    const formattedTime = formatBookingTime(item.startsAt, item.timezone);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.bookingCard,
          {
            backgroundColor: palette.surface,
            borderColor: isCheckedIn ? palette.accent : palette.border,
          },
          Elevation.card,
          pressed && styles.cardPressed,
        ]}
        onPress={() => router.push(`/bookings/${item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${meta.category}, ${formattedTime}`}>
        {/* Banner Image with Category & Status Overlay */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: meta.imageUrl }}
            style={styles.bannerImage}
            contentFit="cover"
            transition={200}
          />
          {/* Subtle Dark Gradient Overlay for Badges */}
          <View style={styles.imageOverlay} />

          {/* Floating Category Badge */}
          <View style={styles.floatingCategoryBadge}>
            {getCategoryIcon(item.id, item.title, '#FFFFFF', 12)}
            <Text style={styles.floatingCategoryText}>{meta.category}</Text>
          </View>

          {/* Floating Status Badge */}
          <View
            style={[
              styles.floatingStatusBadge,
              isCheckedIn
                ? { backgroundColor: palette.accent }
                : checkInOpen
                  ? { backgroundColor: 'rgba(15, 23, 42, 0.75)' }
                  : { backgroundColor: 'rgba(15, 23, 42, 0.65)' },
            ]}>
            {isCheckedIn ? (
              <View style={styles.badgeRow}>
                <CheckCircle2 size={11} color="#FFFFFF" />
                <Text style={styles.floatingStatusText}>Checked in</Text>
              </View>
            ) : (
              <Text style={styles.floatingStatusText}>
                {checkInOpen ? '• Check-in Open' : '• Scheduled'}
              </Text>
            )}
          </View>
        </View>

        {/* Card Content Details */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.bookingTitle, { color: palette.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <View
              style={[
                styles.timezoneBadge,
                {
                  backgroundColor: palette.surfaceVariant,
                  borderColor: palette.border,
                },
              ]}>
              <Text style={[styles.timezoneBadgeText, { color: palette.textSecondary }]}>
                {item.timezone}
              </Text>
            </View>
          </View>

          {/* Location row */}
          <View style={styles.metadataRow}>
            <MapPin size={13} color={palette.textSecondary} />
            <Text
              style={[styles.metadataText, { color: palette.textSecondary }]}
              numberOfLines={1}>
              {meta.location}
            </Text>
          </View>

          {/* Schedule Date & Local Time row */}
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <Calendar size={13} color={palette.textSecondary} />
              <Text style={[styles.scheduleText, { color: palette.text }]}>
                {formattedDate}
              </Text>
            </View>
            <Text style={[styles.scheduleDot, { color: palette.textTertiary }]}>•</Text>
            <View style={styles.scheduleItem}>
              <Clock size={13} color={palette.textSecondary} />
              <Text style={[styles.scheduleText, { color: palette.text }]}>
                {formattedTime}
              </Text>
            </View>
          </View>

          {/* Action Footer */}
          <View style={[styles.cardFooter, { borderTopColor: palette.border }]}>
            <Text style={[styles.cardFooterAction, { color: palette.textSecondary }]}>
              {isCheckedIn ? 'View booking details' : 'Tap to view details & check-in'}
            </Text>
            <ChevronRight size={15} color={palette.textTertiary} />
          </View>
        </View>
      </Pressable>
    );
  };

  const renderEmptyState = () => {
    if (loading) return null;

    if (debouncedQuery.trim().length >= 3 && filteredBookings.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: palette.surfaceVariant }]}>
            <Search size={28} color={palette.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>No bookings match</Text>
          <Text style={[styles.emptySubtitle, { color: palette.textSecondary }]}>
            No scheduled appointments match &ldquo;{debouncedQuery}&rdquo;
          </Text>
          <Pressable
            style={[styles.clearFilterButton, { borderColor: palette.border }]}
            onPress={() => setSearchQuery('')}>
            <Text style={[styles.clearFilterButtonText, { color: palette.text }]}>
              Clear search filter
            </Text>
          </Pressable>
        </View>
      );
    }

    if (bookings.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: palette.surfaceVariant }]}>
            <Calendar size={28} color={palette.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>No bookings</Text>
          <Text style={[styles.emptySubtitle, { color: palette.textSecondary }]}>
            You currently have no scheduled appointments.
          </Text>
        </View>
      );
    }

    return null;
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: palette.background }]}
        edges={['bottom', 'left', 'right']}>
        <View style={styles.skeletonContainer}>
          <SkeletonCard isDark={isDark} />
          <SkeletonCard isDark={isDark} />
          <SkeletonCard isDark={isDark} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: palette.background }]}
        edges={['bottom', 'left', 'right']}>
        <View style={styles.centerContainer}>
          <View style={[styles.errorIconCircle, { backgroundColor: palette.errorLight }]}>
            <AlertCircle size={32} color={palette.errorText} />
          </View>
          <Text style={[styles.errorTitle, { color: palette.errorText }]}>Could not load bookings</Text>
          <Text style={[styles.errorSubtitle, { color: palette.textSecondary }]}>
            Unable to connect to the scheduling service. Check your connection and try again.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              { backgroundColor: palette.primary },
              pressed && styles.buttonPressed,
            ]}
            onPress={fetchData}
            accessibilityRole="button"
            accessibilityLabel="Try again">
            <RefreshCw size={15} color={palette.primaryText} />
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
              <Clock size={11} color={palette.textSecondary} />
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
            <Search size={16} color={isSearchFocused ? palette.text : palette.textTertiary} style={styles.searchIcon} />
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
                hitSlop={10}
                style={styles.clearSearchButton}
                accessibilityRole="button"
                accessibilityLabel="Clear search">
                <X size={15} color={palette.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Main Virtualized List */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingCard}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={palette.primary}
            colors={[palette.primary]}
          />
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
  appSubtitle: {
    ...Typography.caption,
    fontWeight: '500',
  },
  updatedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    gap: 4,
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
    letterSpacing: 0.5,
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
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    ...Typography.body,
    paddingVertical: 0,
  },
  clearSearchButton: {
    padding: 6,
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
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  bannerContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  floatingCategoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    gap: 5,
  },
  floatingCategoryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  floatingStatusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  floatingStatusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  cardContent: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bookingTitle: {
    ...Typography.title,
    flex: 1,
    marginRight: 8,
  },
  timezoneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.chip,
    borderWidth: 1,
  },
  timezoneBadgeText: {
    ...Typography.micro,
    fontWeight: '500',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metadataText: {
    ...Typography.caption,
    flex: 1,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  scheduleText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  scheduleDot: {
    fontSize: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    marginTop: 2,
  },
  cardFooterAction: {
    ...Typography.micro,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  skeletonBanner: {
    width: '100%',
    height: 120,
  },
  skeletonBar: {
    borderRadius: 4,
  },
  skeletonPill: {
    borderRadius: 12,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    ...Typography.title,
  },
  emptySubtitle: {
    ...Typography.caption,
    textAlign: 'center',
    maxWidth: 260,
  },
  clearFilterButton: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.chip,
    borderWidth: 1,
  },
  clearFilterButtonText: {
    ...Typography.caption,
    fontWeight: '600',
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
  },
  errorSubtitle: {
    ...Typography.caption,
    textAlign: 'center',
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radii.pill,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
