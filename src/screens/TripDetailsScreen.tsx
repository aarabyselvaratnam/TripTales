import { showAlert } from '../utils/alerts';

import React, { useState, useCallback } from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

import {
  getTripById,
  deleteTrip,
  Trip,
} from '../database/database';

import {
  getDestinationImage,
} from '../data/destinationImages';

export default function TripDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const tripId = Number(route.params?.tripId);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const loadTrip = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      if (!Number.isInteger(tripId) || tripId <= 0) {
        setError('Invalid trip ID.');
        setTrip(null);
        return;
      }

      const savedTrip = await getTripById(tripId);
      setTrip(savedTrip);
    } catch (err) {
      console.error('Error loading trip:', err);
      setError('Unable to load trip details.');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useFocusEffect(
    useCallback(() => {
      loadTrip();
    }, [loadTrip])
  );

  const handleDelete = () => {
    showAlert(
      'Delete Trip',
      'Are you sure you want to delete this trip? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteTrip(tripId);
              navigation.goBack();
            } catch (err) {
              console.error('Error deleting trip:', err);
              showAlert(
                'Error',
                'Unable to delete this trip.'
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#245C4F"
        />
      </View>
    );
  }

  if (error || !trip) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>
          {error || 'Trip not found.'}
        </Text>
      </View>
    );
  }

  const destinationImage =
    getDestinationImage(trip.destination);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {destinationImage ? (
        <Image
          source={destinationImage}
          style={styles.heroImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.hero}>
          <Ionicons
            name="airplane-outline"
            size={75}
            color="#245C4F"
          />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title}>
          {trip.destination}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons
            name="location-outline"
            size={22}
            color="#245C4F"
          />
          <Text style={styles.infoText}>
            {trip.location}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="calendar-outline"
            size={22}
            color="#245C4F"
          />
          <Text style={styles.infoText}>
            {trip.date}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="pricetag-outline"
            size={22}
            color="#245C4F"
          />
          <Text style={styles.infoText}>
            {trip.category}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          About This Trip
        </Text>

        <View style={styles.descriptionCard}>
          <Text style={styles.description}>
            {trip.description ||
              'No description added yet.'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() =>
            navigation.navigate('AddTrip', {
              tripId: trip.id,
            })
          }
        >
          <Ionicons
            name="create-outline"
            size={21}
            color="white"
          />
          <Text style={styles.buttonText}>
            Edit Trip
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator color="#B3261E" />
          ) : (
            <>
              <Ionicons
                name="trash-outline"
                size={21}
                color="#B3261E"
              />
              <Text style={styles.deleteButtonText}>
                Delete Trip
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F1',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F6F1',
    padding: 24,
  },

  hero: {
    height: 250,
    backgroundColor: '#E0EBE4',
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#E0EBE4',
  },

  content: {
    padding: 22,
    paddingBottom: 45,
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#245C4F',
    marginBottom: 22,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
  },

  infoText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 12,
    flex: 1,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#253B34',
    marginTop: 20,
    marginBottom: 14,
  },

  descriptionCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 18,
    marginBottom: 30,
    elevation: 2,
  },

  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555',
  },

  editButton: {
    backgroundColor: '#245C4F',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: '#B3261E',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  deleteButtonText: {
    color: '#B3261E',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  emptyText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  },
});
