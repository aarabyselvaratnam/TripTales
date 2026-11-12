
import React, { useState, useCallback } from 'react';

import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';

import {
  getTrips,
  Trip,
} from '../database/database';

import {
  getDestinationImage,
} from '../data/destinationImages';

const categories = [
  'All',
  'Nature',
  'Historical',
  'Adventure',
  'Beach',
  'City',
  'Other',
];

export default function TripsScreen() {
  const navigation = useNavigation<any>();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState('All');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');

      const savedTrips = await getTrips();
      setTrips(savedTrips);
    } catch (error) {
      console.error('Error loading trips:', error);
      setLoadError('Unable to load saved trips.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  const filteredTrips = trips.filter((trip) => {
    const keyword = search.trim().toLowerCase();

    const matchesSearch =
      trip.destination.toLowerCase().includes(keyword) ||
      trip.location.toLowerCase().includes(keyword);

    const matchesCategory =
      selectedCategory === 'All' ||
      trip.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          My Trips ✈️
        </Text>

        <Text style={styles.subtitle}>
          Explore your saved travel adventures.
        </Text>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={22}
            color="#777"
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search destinations..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category &&
                  styles.activeCategory,
              ]}
              onPress={() =>
                setSelectedCategory(category)
              }
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category &&
                    styles.activeCategoryText,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#245C4F"
            style={{ marginTop: 35 }}
          />
        ) : loadError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loadError}
            </Text>

            <TouchableOpacity onPress={loadTrips}>
              <Text style={styles.retryText}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.resultText}>
              {filteredTrips.length} trips found
            </Text>

            {filteredTrips.map((trip) => {
              const destinationImage =
                getDestinationImage(trip.destination);

              return (
                <TouchableOpacity
                  key={trip.id}
                  style={styles.tripCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate('TripDetails', {
                      tripId: trip.id,
                    })
                  }
                >
                  {destinationImage ? (
                    <Image
                      source={destinationImage}
                      style={styles.tripImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons
                        name="airplane-outline"
                        size={44}
                        color="#245C4F"
                      />
                    </View>
                  )}

                  <View style={styles.tripInfo}>
                    <Text style={styles.tripTitle}>
                      {trip.destination}
                    </Text>

                    <Text style={styles.tripLocation}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                      />{' '}
                      {trip.location}
                    </Text>

                    <View style={styles.tripFooter}>
                      <Text style={styles.tripDate}>
                        {trip.date}
                      </Text>

                      <Text style={styles.tripCategory}>
                        {trip.category}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {filteredTrips.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="map-outline"
                  size={55}
                  color="#9BAFA4"
                />

                <Text style={styles.emptyText}>
                  {trips.length === 0
                    ? 'No saved trips yet. Add your first adventure!'
                    : 'No trips match your search.'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() =>
          navigation.navigate('AddTrip')
        }
        accessibilityRole="button"
        accessibilityLabel="Add new trip"
      >
        <Ionicons
          name="add"
          size={30}
          color="white"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F1',
  },

  content: {
    padding: 20,
    paddingTop: 45,
    paddingBottom: 100,
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#245C4F',
  },

  subtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 6,
    marginBottom: 24,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 52,
    marginBottom: 20,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },

  categoryContainer: {
    marginBottom: 20,
    flexGrow: 0,
  },

  categoryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#E8EEE9',
    marginRight: 10,
  },

  activeCategory: {
    backgroundColor: '#245C4F',
  },

  categoryText: {
    color: '#245C4F',
    fontWeight: '600',
  },

  activeCategoryText: {
    color: 'white',
  },

  resultText: {
    fontSize: 14,
    color: '#777',
    marginBottom: 15,
  },

  tripCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 18,
    elevation: 3,
  },

  tripImage: {
    width: '100%',
    height: 175,
    backgroundColor: '#E0EBE4',
  },

  imagePlaceholder: {
    height: 175,
    backgroundColor: '#E0EBE4',
    justifyContent: 'center',
    alignItems: 'center',
  },

  tripInfo: {
    padding: 16,
  },

  tripTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#253B34',
  },

  tripLocation: {
    color: '#777',
    marginTop: 6,
    fontSize: 14,
  },

  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    alignItems: 'center',
  },

  tripDate: {
    color: '#999',
    fontSize: 12,
  },

  tripCategory: {
    color: '#245C4F',
    backgroundColor: '#E8EEE9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
    padding: 20,
  },

  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 15,
  },

  retryText: {
    color: '#245C4F',
    fontWeight: 'bold',
    marginTop: 15,
  },

  floatingButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#245C4F',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
});
