
import React, { useState, useCallback } from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ImageBackground,
  StatusBar,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import {
  Trip,
  getTrips,
  getMemories,
  getExpenses,
} from '../database/database';

import {
  getDestinationImage,
} from '../data/destinationImages';

// Hero banner uses an existing local image.
const heroImage = require('../../assets/destinations/ella.jpg');

type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  accent: string;
  background: string;
};

function StatCard({
  icon,
  label,
  value,
  accent,
  background,
}: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View
        style={[
          styles.statIconContainer,
          { backgroundColor: background },
        ]}
      >
        <Ionicons
          name={icon}
          size={23}
          color={accent}
        />
      </View>

      <Text
        style={styles.statValue}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.65}
      >
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [memoryCount, setMemoryCount] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [
        savedTrips,
        savedMemories,
        savedExpenses,
      ] = await Promise.all([
        getTrips(),
        getMemories(),
        getExpenses(),
      ]);

      setTrips(savedTrips);
      setMemoryCount(savedMemories.length);

      const total = savedExpenses.reduce(
        (sum, expense) =>
          sum + Number(expense.amount || 0),
        0
      );

      setTotalExpenses(total);
    } catch (err) {
      console.error(
        'Dashboard loading error:',
        err
      );

      setError(
        'Unable to load dashboard information.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const destinationCount = new Set(
    trips.map((trip) =>
      trip.destination.trim().toLowerCase()
    )
  ).size;

  const recentTrips = [...trips]
    .sort((a, b) => {
      const dateComparison =
        b.date.localeCompare(a.date);

      return dateComparison !== 0
        ? dateComparison
        : b.id - a.id;
    })
    .slice(0, 3);

  const formatCurrency = (value: number) =>
    `LKR ${value.toLocaleString('en-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const openTab = (screen: string) => {
    navigation.navigate(screen);
  };

  const openTrip = (tripId: number) => {
    navigation.navigate('TripDetails', {
      tripId,
    });
  };

  const QuickAction = ({
    icon,
    title,
    subtitle,
    onPress,
    background,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    onPress: () => void;
    background: string;
  }) => (
    <TouchableOpacity
      style={styles.quickCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.quickIcon,
          { backgroundColor: background },
        ]}
      >
        <Ionicons
          name={icon}
          size={25}
          color="#245C4F"
        />
      </View>

      <Text style={styles.quickTitle}>
        {title}
      </Text>

      <Text style={styles.quickSubtitle}>
        {subtitle}
      </Text>

      <Ionicons
        name="arrow-forward-outline"
        size={17}
        color="#8BA398"
        style={styles.quickArrow}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.welcomeText}>
              YOUR PERSONAL TRAVEL SPACE
            </Text>

            <Text style={styles.appTitle}>
              TripTales
            </Text>

            <Text style={styles.tagline}>
              Your journeys. Your stories.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="compass-outline"
              size={32}
              color="#245C4F"
            />
          </View>
        </View>

        {/* HERO BANNER */}

        <ImageBackground
          source={heroImage}
          style={styles.heroCard}
          imageStyle={styles.heroImage}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay}>
            <View style={styles.heroBadge}>
              <Ionicons
                name="sparkles-outline"
                size={14}
                color="#FFFFFF"
              />

              <Text style={styles.heroBadgeText}>
                YOUR ADVENTURE STARTS HERE
              </Text>
            </View>

            <Text style={styles.heroHeading}>
              Every Journey{"\n"}
              Has a Story
            </Text>

            <Text style={styles.heroDescription}>
              Explore places, collect memories,
              and keep every adventure close.
            </Text>

            <TouchableOpacity
              style={styles.heroButton}
              onPress={() =>
                navigation.navigate('AddTrip')
              }
              activeOpacity={0.85}
            >
              <Ionicons
                name="add-circle-outline"
                size={21}
                color="#245C4F"
              />

              <Text style={styles.heroButtonText}>
                Plan a New Trip
              </Text>

              <Ionicons
                name="arrow-forward"
                size={17}
                color="#245C4F"
              />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* TRAVEL OVERVIEW */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Travel Overview
            </Text>

            <Text style={styles.sectionSubtitle}>
              Your adventures at a glance
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#245C4F"
            style={styles.loader}
          />
        ) : error ? (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={30}
              color="#B3261E"
            />

            <Text style={styles.errorText}>
              {error}
            </Text>

            <TouchableOpacity
              onPress={loadDashboard}
            >
              <Text style={styles.retryText}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatCard
                icon="airplane-outline"
                label="Total Trips"
                value={String(trips.length)}
                accent="#245C4F"
                background="#E4F0E9"
              />

              <StatCard
                icon="location-outline"
                label="Destinations"
                value={String(destinationCount)}
                accent="#A26C32"
                background="#FFF0D9"
              />

              <StatCard
                icon="images-outline"
                label="Memories Saved"
                value={String(memoryCount)}
                accent="#7556A5"
                background="#F0E9FA"
              />

              <StatCard
                icon="wallet-outline"
                label="Total Spending"
                value={formatCurrency(totalExpenses)}
                accent="#356A8A"
                background="#E5F1F8"
              />
            </View>

            {/* RECENT TRIPS */}

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Recent Adventures
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Places you've explored
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => openTab('Trips')}
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllText}>
                  View All
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color="#245C4F"
                />
              </TouchableOpacity>
            </View>

            {recentTrips.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="map-outline"
                  size={40}
                  color="#9BAFA4"
                />

                <Text style={styles.emptyText}>
                  No trips yet. Add your first
                  adventure!
                </Text>
              </View>
            ) : (
              recentTrips.map((trip) => {
                const destinationImage =
                  getDestinationImage(
                    trip.destination
                  );

                return (
                  <TouchableOpacity
                    key={trip.id}
                    style={styles.tripCard}
                    onPress={() =>
                      openTrip(trip.id)
                    }
                    activeOpacity={0.85}
                  >
                    {destinationImage ? (
                      <Image
                        source={destinationImage}
                        style={styles.tripImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={styles.tripPlaceholder}
                      >
                        <Ionicons
                          name="airplane-outline"
                          size={28}
                          color="#245C4F"
                        />
                      </View>
                    )}

                    <View
                      style={styles.tripInformation}
                    >
                      <Text
                        style={styles.tripDestination}
                        numberOfLines={1}
                      >
                        {trip.destination}
                      </Text>

                      <View
                        style={styles.tripLocationRow}
                      >
                        <Ionicons
                          name="location-outline"
                          size={13}
                          color="#7B8F84"
                        />

                        <Text
                          style={styles.tripLocation}
                          numberOfLines={1}
                        >
                          {trip.location}
                        </Text>
                      </View>

                      <Text style={styles.tripDate}>
                        {trip.date} • {trip.category}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#8BA398"
                    />
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}

        {/* QUICK ACCESS */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Quick Access
            </Text>

            <Text style={styles.sectionSubtitle}>
              Everything you need for your trips
            </Text>
          </View>
        </View>

        <View style={styles.quickGrid}>
          <QuickAction
            icon="map-outline"
            title="My Trips"
            subtitle="Explore journeys"
            background="#E2EFE6"
            onPress={() => openTab('Trips')}
          />

          <QuickAction
            icon="book-outline"
            title="Journal"
            subtitle="Write your stories"
            background="#FFF0DA"
            onPress={() => openTab('Journal')}
          />

          <QuickAction
            icon="wallet-outline"
            title="Expenses"
            subtitle="Track your spending"
            background="#E5F1F8"
            onPress={() => openTab('Expenses')}
          />

          <QuickAction
            icon="images-outline"
            title="Memories"
            subtitle="Relive the moments"
            background="#F0E9FA"
            onPress={() => openTab('Memories')}
          />
        </View>

        {/* FOOTER */}

        <View style={styles.footer}>
          <Ionicons
            name="leaf-outline"
            size={16}
            color="#8BA398"
          />

          <Text style={styles.footerText}>
            Explore more. Remember forever.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F1',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 55,
  },

  // HEADER

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  headerText: {
    flex: 1,
  },

  welcomeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#84968B',
    letterSpacing: 1.5,
    marginBottom: 7,
  },

  appTitle: {
    fontSize: 37,
    fontWeight: 'bold',
    color: '#245C4F',
    letterSpacing: -1,
  },

  tagline: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },

  headerIcon: {
    width: 57,
    height: 57,
    borderRadius: 19,
    backgroundColor: '#E5EEE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  // HERO BANNER

  heroCard: {
    minHeight: 275,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 30,
    backgroundColor: '#245C4F',
  },

  heroImage: {
    borderRadius: 22,
  },

  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 41, 32, 0.68)',
    padding: 23,
    justifyContent: 'center',
  },

  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 15,
  },

  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.7,
    marginLeft: 6,
  },

  heroHeading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 35,
  },

  heroDescription: {
    fontSize: 13,
    color: '#E5F0E9',
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 19,
    maxWidth: 260,
  },

  heroButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },

  heroButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#245C4F',
    marginLeft: 8,
    marginRight: 13,
  },

  // SECTIONS

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#253B34',
  },

  sectionSubtitle: {
    fontSize: 12,
    color: '#8A948D',
    marginTop: 5,
  },

  // STATISTICS

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  statCard: {
    width: '48%',
    minHeight: 145,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 13,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  statIconContainer: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#253B34',
  },

  statLabel: {
    fontSize: 12,
    color: '#7D8980',
    marginTop: 6,
  },

  loader: {
    marginVertical: 35,
  },

  // RECENT TRIPS

  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },

  viewAllText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#245C4F',
    marginRight: 5,
  },

  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 11,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  tripImage: {
    width: 82,
    height: 82,
    borderRadius: 12,
    marginRight: 13,
  },

  tripPlaceholder: {
    width: 82,
    height: 82,
    borderRadius: 12,
    marginRight: 13,
    backgroundColor: '#E8EEE9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tripInformation: {
    flex: 1,
    justifyContent: 'center',
  },

  tripDestination: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#253B34',
    marginBottom: 7,
  },

  tripLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  tripLocation: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    flexShrink: 1,
  },

  tripDate: {
    fontSize: 11,
    color: '#999',
  },

  // QUICK ACCESS

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 20,
  },

  quickCard: {
    width: '48%',
    minHeight: 145,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    marginBottom: 13,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  quickIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  quickTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#253B34',
  },

  quickSubtitle: {
    fontSize: 11,
    color: '#89958C',
    marginTop: 5,
  },

  quickArrow: {
    position: 'absolute',
    right: 15,
    top: 22,
  },

  // EMPTY AND ERROR STATES

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 30,
    alignItems: 'center',
    marginBottom: 25,
  },

  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 12,
  },

  errorCard: {
    backgroundColor: '#FFF0EE',
    padding: 22,
    borderRadius: 15,
    marginBottom: 22,
    alignItems: 'center',
  },

  errorText: {
    color: '#B3261E',
    textAlign: 'center',
    marginTop: 10,
  },

  retryText: {
    color: '#245C4F',
    fontWeight: 'bold',
    marginTop: 15,
  },

  // FOOTER

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },

  footerText: {
    color: '#8BA398',
    fontSize: 12,
    marginLeft: 7,
  },
});
