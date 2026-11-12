import { showAlert } from '../utils/alerts';

import React, {
  useState,
  useCallback,
} from 'react';

import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

import {
  addTrip,
  updateTrip,
  getTripById,
} from '../database/database';

const categories = [
  'Nature',
  'Historical',
  'Adventure',
  'Beach',
  'City',
  'Other',
];

export default function AddTripScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const tripId = route.params?.tripId;
  const isEditing = tripId !== undefined;

  const [destination, setDestination] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Nature');
  const [description, setDescription] = useState('');

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState('');

  const loadTrip = useCallback(async () => {
    if (!isEditing) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLoadError('');

      const savedTrip = await getTripById(Number(tripId));

      if (!savedTrip) {
        setLoadError('Trip not found.');
        return;
      }

      setDestination(savedTrip.destination);
      setLocation(savedTrip.location);
      setDate(savedTrip.date);
      setCategory(savedTrip.category);
      setDescription(savedTrip.description);
    } catch (error) {
      console.error('Error loading trip:', error);
      setLoadError('Unable to load trip details.');
    } finally {
      setLoading(false);
    }
  }, [tripId, isEditing]);

  useFocusEffect(
    useCallback(() => {
      loadTrip();
    }, [loadTrip])
  );

  const handleSave = async () => {
    if (
      !destination.trim() ||
      !location.trim() ||
      !date.trim()
    ) {
      showAlert(
        'Missing Information',
        'Please enter destination, location and travel date.'
      );
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      showAlert(
        'Invalid Date',
        'Please use YYYY-MM-DD format.'
      );
      return;
    }

    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      showAlert(
        'Invalid Date',
        'Please enter a valid calendar date.'
      );
      return;
    }

    try {
      setSaving(true);

      const tripData = {
        destination: destination.trim(),
        location: location.trim(),
        date,
        category,
        description: description.trim(),
      };

      if (isEditing) {
        await updateTrip({
          id: Number(tripId),
          ...tripData,
        });

        showAlert(
          'Success',
          'Trip updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        await addTrip(tripData);

        showAlert(
          'Success',
          'Trip added successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error saving trip:', error);

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      showAlert('Database Error', message);
    } finally {
      setSaving(false);
    }
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

  if (loadError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{loadError}</Text>
        <TouchableOpacity onPress={loadTrip}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.heading}>
        <Ionicons
          name={
            isEditing
              ? 'create-outline'
              : 'airplane-outline'
          }
          size={32}
          color="#245C4F"
        />

        <Text style={styles.title}>
          {isEditing
            ? 'Edit Your Journey'
            : 'Plan a New Journey'}
        </Text>

        <Text style={styles.subtitle}>
          {isEditing
            ? 'Update your travel memories.'
            : 'Every adventure begins with a destination.'}
        </Text>
      </View>

      <Text style={styles.label}>Destination *</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. Ella"
        value={destination}
        onChangeText={setDestination}
      />

      <Text style={styles.label}>Location *</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. Badulla, Sri Lanka"
        value={location}
        onChangeText={setLocation}
      />

      <Text style={styles.label}>Travel Date *</Text>

      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={date}
        onChangeText={setDate}
        maxLength={10}
      />

      <Text style={styles.label}>Trip Category</Text>

      <View style={styles.categoryContainer}>
        {categories.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.categoryButton,
              category === item && styles.activeCategory,
            ]}
            onPress={() => setCategory(item)}
          >
            <Text
              style={[
                styles.categoryText,
                category === item && styles.activeCategoryText,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Travel Description</Text>

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Write about your travel experience..."
        value={description}
        onChangeText={setDescription}
        multiline
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[
          styles.saveButton,
          saving && styles.disabledButton,
        ]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons
              name={
                isEditing
                  ? 'checkmark-circle-outline'
                  : 'save-outline'
              }
              size={22}
              color="white"
            />

            <Text style={styles.saveButtonText}>
              {isEditing
                ? 'Update Trip'
                : 'Save Trip'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F1',
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F6F1',
    padding: 24,
  },
  heading: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#245C4F',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 8,
    textAlign: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#253B34',
    marginBottom: 9,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#E2E8E3',
  },
  textArea: {
    height: 130,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 22,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#E8EEE9',
    marginRight: 8,
    marginBottom: 9,
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
  saveButton: {
    backgroundColor: '#245C4F',
    borderRadius: 14,
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  errorText: {
    color: '#B3261E',
    textAlign: 'center',
    fontSize: 15,
  },
  retryText: {
    color: '#245C4F',
    fontWeight: 'bold',
    marginTop: 15,
  },
});
