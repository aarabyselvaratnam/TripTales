import { showAlert } from '../utils/alerts';

import React, { useState, useCallback } from 'react';

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
import { useFocusEffect } from '@react-navigation/native';

import {
  Trip,
  JournalEntry,
  getTrips,
  getJournalEntries,
  addJournalEntry,
  deleteJournalEntry,
} from '../database/database';

export default function JournalScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  const [selectedTrip, setSelectedTrip] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [savedTrips, savedEntries] = await Promise.all([
        getTrips(),
        getJournalEntries(),
      ]);

      setTrips(savedTrips);
      setEntries(savedEntries);
    } catch (err) {
      console.error('Journal loading error:', err);
      setError('Unable to load journal entries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSave = async () => {
    if (!selectedTrip || !title.trim() || !content.trim()) {
      showAlert(
        'Missing Information',
        'Please select a trip and enter a title and journal description.'
      );
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
      showAlert('Invalid Date', 'Use YYYY-MM-DD format.');
      return;
    }

    const [year, month, day] = entryDate.split('-').map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      showAlert('Invalid Date', 'Enter a valid calendar date.');
      return;
    }

    try {
      setSaving(true);

      await addJournalEntry(
        selectedTrip,
        title.trim(),
        content.trim(),
        entryDate
      );

      setTitle('');
      setContent('');
      setSelectedTrip(null);
      setShowForm(false);

      await loadData();

      showAlert('Success', 'Journal entry saved successfully!');
    } catch (err) {
      console.error('Journal save error:', err);
      showAlert('Error', 'Unable to save journal entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    showAlert(
      'Delete Journal Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteJournalEntry(id);
              await loadData();
            } catch (err) {
              console.error('Journal delete error:', err);
              showAlert('Error', 'Unable to delete entry.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Ionicons
            name="book-outline"
            size={34}
            color="#245C4F"
          />

          <Text style={styles.heading}>Travel Journal</Text>

          <Text style={styles.subtitle}>
            Every journey has a story worth remembering.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm(!showForm)}
        >
          <Ionicons
            name={showForm ? 'close' : 'add'}
            size={22}
            color="white"
          />

          <Text style={styles.addButtonText}>
            {showForm ? 'Close Form' : 'Write New Entry'}
          </Text>
        </TouchableOpacity>

        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              New Journal Entry
            </Text>

            <Text style={styles.label}>Select Trip *</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tripSelector}
            >
              {trips.map((trip) => (
                <TouchableOpacity
                  key={trip.id}
                  style={[
                    styles.tripChip,
                    selectedTrip === trip.id &&
                      styles.selectedChip,
                  ]}
                  onPress={() => setSelectedTrip(trip.id)}
                >
                  <Text
                    style={[
                      styles.tripChipText,
                      selectedTrip === trip.id &&
                        styles.selectedChipText,
                    ]}
                  >
                    {trip.destination}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {trips.length === 0 && (
              <Text style={styles.emptyText}>
                Add a trip before writing a journal entry.
              </Text>
            )}

            <Text style={styles.label}>Entry Title *</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. A beautiful day in Ella"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Entry Date *</Text>

            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={entryDate}
              onChangeText={setEntryDate}
              maxLength={10}
            />

            <Text style={styles.label}>Your Experience *</Text>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Write about your journey..."
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving || trips.length === 0}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveButtonText}>
                  Save Journal Entry
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>
          My Journal Entries ({entries.length})
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#245C4F"
          />
        ) : error ? (
          <Text style={styles.emptyText}>{error}</Text>
        ) : entries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="book-outline"
              size={48}
              color="#9BAFA4"
            />
            <Text style={styles.emptyText}>
              No journal entries yet. Start writing your travel story!
            </Text>
          </View>
        ) : (
          entries.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View style={styles.entryTitleContainer}>
                  <Text style={styles.entryTitle}>
                    {entry.title}
                  </Text>
                  <Text style={styles.destinationText}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                    />{' '}
                    {entry.destination}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleDelete(entry.id)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={22}
                    color="#B3261E"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.dateText}>
                {entry.entry_date}
              </Text>

              <Text style={styles.entryContent}>
                {entry.content}
              </Text>
            </View>
          ))
        )}
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
    padding: 20,
    paddingTop: 45,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#245C4F',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#245C4F',
    padding: 15,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginBottom: 25,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#253B34',
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#253B34',
    marginBottom: 9,
  },
  tripSelector: {
    marginBottom: 20,
    flexGrow: 0,
  },
  tripChip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#E8EEE9',
    marginRight: 9,
  },
  selectedChip: {
    backgroundColor: '#245C4F',
  },
  tripChipText: {
    color: '#245C4F',
    fontWeight: '600',
  },
  selectedChipText: {
    color: 'white',
  },
  input: {
    backgroundColor: '#F8F6F1',
    borderWidth: 1,
    borderColor: '#E2E8E3',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    fontSize: 15,
  },
  textArea: {
    height: 140,
  },
  saveButton: {
    backgroundColor: '#245C4F',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  entryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entryTitleContainer: {
    flex: 1,
    paddingRight: 12,
  },
  entryTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#253B34',
  },
  destinationText: {
    fontSize: 13,
    color: '#245C4F',
    marginTop: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
  },
  entryContent: {
    fontSize: 15,
    color: '#555',
    lineHeight: 23,
    marginTop: 12,
  },
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
});
