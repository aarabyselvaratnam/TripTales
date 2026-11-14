
import React, { useState, useCallback } from 'react';

import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { showAlert } from '../utils/alerts';

import {
  Trip,
  Memory,
  getTrips,
  getMemories,
  addMemory,
  deleteMemory,
} from '../database/database';

export default function MemoriesScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);

  const [selectedTrip, setSelectedTrip] =
    useState<number | null>(null);

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  const [viewingMemory, setViewingMemory] =
    useState<Memory | null>(null);

  const [caption, setCaption] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [savedTrips, savedMemories] =
        await Promise.all([
          getTrips(),
          getMemories(),
        ]);

      setTrips(savedTrips);
      setMemories(savedMemories);
    } catch (err) {
      console.error('Memories loading error:', err);
      setError('Unable to load memories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const pickImage = async () => {
    try {
      // The browser photo picker works from the button press and does not
      // require a separate media-library permission request.
      if (Platform.OS !== 'web') {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          showAlert('Permission Required', 'Please allow access to your photos.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        base64: Platform.OS === 'web',
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        if (Platform.OS === 'web') {
          // Save the image itself, not a temporary browser blob URL.
          if (!asset.base64) {
            throw new Error('Browser image data was unavailable.');
          }
          setSelectedImage(`data:image/jpeg;base64,${asset.base64}`);
        } else {
          setSelectedImage(asset.uri);
        }
      }
    } catch (err) {
      console.error('Image picker error:', err);
      showAlert('Error', 'Unable to select image.');
    }
  };

  const handleSave = async () => {
    if (!selectedTrip || !selectedImage) {
      showAlert(
        'Missing Information',
        'Please select a trip and photograph.'
      );
      return;
    }

    let savedFile: File | null = null;

    try {
      setSaving(true);

      let persistentUri = selectedImage;

      if (Platform.OS !== 'web') {
        const folder = new Directory(Paths.document, 'triptales_memories');
        folder.create({ idempotent: true, intermediates: true });

        const originalFile = new File(selectedImage);
        const extension = selectedImage
          .split('?')[0]
          .split('.')
          .pop()
          ?.toLowerCase() || 'jpg';
        const safeExtension = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(extension)
          ? extension
          : 'jpg';
        const fileName =
          `memory_${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${safeExtension}`;

        savedFile = new File(folder, fileName);
        await originalFile.copy(savedFile);
        persistentUri = savedFile.uri;
      }

      const today = new Date().toISOString().split('T')[0];

      await addMemory(
        selectedTrip,
        persistentUri,
        caption.trim(),
        today
      );

      setSelectedTrip(null);
      setSelectedImage(null);
      setCaption('');
      setShowForm(false);

      await loadData();

      showAlert(
        'Success',
        'Memory saved successfully!'
      );
    } catch (err) {
      console.error('Memory save error:', err);

      if (savedFile) {
        try {
          if (savedFile.exists) {
            savedFile.delete();
          }
        } catch {}
      }

      showAlert(
        'Error',
        'Unable to save memory.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (memory: Memory) => {
    showAlert(
      'Delete Memory',
      'Are you sure you want to delete this photograph?',
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
              await deleteMemory(memory.id);

              try {
                if (Platform.OS !== 'web' && memory.image_uri.startsWith('file:')) {
                  const imageFile = new File(memory.image_uri);
                  if (imageFile.exists) imageFile.delete();
                }
              } catch (fileError) {
                console.warn(
                  'Unable to remove photo file:',
                  fileError
                );
              }

              setViewingMemory(null);
              await loadData();
            } catch (err) {
              console.error('Memory delete error:', err);
              showAlert(
                'Error',
                'Unable to delete memory.'
              );
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
            name="images-outline"
            size={34}
            color="#245C4F"
          />

          <Text style={styles.heading}>
            Travel Memories
          </Text>

          <Text style={styles.subtitle}>
            Your favorite moments, saved forever offline.
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
            {showForm ? 'Close Form' : 'Add New Memory'}
          </Text>
        </TouchableOpacity>

        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              New Travel Memory
            </Text>

            <Text style={styles.label}>
              Select Trip *
            </Text>

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

            <TouchableOpacity
              style={styles.imagePicker}
              onPress={pickImage}
            >
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Ionicons
                    name="image-outline"
                    size={45}
                    color="#245C4F"
                  />

                  <Text style={styles.imagePickerText}>
                    Tap to Choose Photograph
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>
              Caption
            </Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. Beautiful sunset in Ella"
              value={caption}
              onChangeText={setCaption}
              multiline
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
                  Save Memory
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>
          My Memories ({memories.length})
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#245C4F"
          />
        ) : error ? (
          <Text style={styles.emptyText}>
            {error}
          </Text>
        ) : memories.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="images-outline"
              size={48}
              color="#9BAFA4"
            />

            <Text style={styles.emptyText}>
              No memories yet. Add your first travel photo!
            </Text>
          </View>
        ) : (
          <View style={styles.gallery}>
            {memories.map((memory) => (
              <View
                key={memory.id}
                style={styles.memoryCard}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setViewingMemory(memory)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    `View photo from ${memory.destination}`
                  }
                >
                  <Image
                    source={{
                      uri: memory.image_uri,
                    }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />

                  <View style={styles.viewImageHint}>
                    <Ionicons
                      name="expand-outline"
                      size={14}
                      color="white"
                    />

                    <Text style={styles.viewImageHintText}>
                      View Photo
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.memoryInfo}>
                  <Text style={styles.destination}>
                    {memory.destination}
                  </Text>

                  <Text
                    style={styles.caption}
                    numberOfLines={2}
                  >
                    {memory.caption || 'Travel memory'}
                  </Text>

                  <View style={styles.memoryFooter}>
                    <Text style={styles.date}>
                      {memory.created_at}
                    </Text>

                    <TouchableOpacity
                      onPress={() => handleDelete(memory)}
                      accessibilityLabel="Delete memory"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={19}
                        color="#B3261E"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FULL-SCREEN PHOTO VIEWER */}
      <Modal
        visible={viewingMemory !== null}
        transparent={false}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setViewingMemory(null)}
      >
        <View style={styles.viewerContainer}>
         

          <View style={styles.viewerHeader}>
            <Text style={styles.viewerTitle}>
              Travel Memory
            </Text>

            <TouchableOpacity
              style={styles.closeViewerButton}
              onPress={() => setViewingMemory(null)}
              accessibilityRole="button"
              accessibilityLabel="Close photo viewer"
            >
              <Ionicons
                name="close"
                size={28}
                color="white"
              />
            </TouchableOpacity>
          </View>

          {viewingMemory && (
            <>
              <View style={styles.viewerImageArea}>
                <Image
                  source={{
                    uri: viewingMemory.image_uri,
                  }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.viewerDetails}>
                <View style={styles.viewerDestinationRow}>
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color="#D4E6DC"
                  />

                  <Text style={styles.viewerDestination}>
                    {viewingMemory.destination}
                  </Text>
                </View>

                <ScrollView
                  style={styles.viewerCaptionScroll}
                  contentContainerStyle={{
                    paddingBottom: 10,
                  }}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.viewerCaption}>
                    {viewingMemory.caption ||
                      'Travel memory'}
                  </Text>
                </ScrollView>

                <Text style={styles.viewerDate}>
                  {viewingMemory.created_at}
                </Text>
              </View>
            </>
          )}
        </View>
      </Modal>
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

  imagePicker: {
    height: 180,
    backgroundColor: '#E8EEE9',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },

  imagePickerText: {
    color: '#245C4F',
    fontWeight: '600',
    marginTop: 10,
  },

  previewImage: {
    width: '100%',
    height: '100%',
  },

  input: {
    backgroundColor: '#F8F6F1',
    borderWidth: 1,
    borderColor: '#E2E8E3',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    minHeight: 48,
    textAlignVertical: 'top',
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

  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  memoryCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 14,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 2,
  },

  galleryImage: {
    width: '100%',
    height: 145,
  },

  viewImageHint: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },

  viewImageHintText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },

  memoryInfo: {
    padding: 11,
  },

  destination: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#253B34',
  },

  caption: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
  },

  memoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },

  date: {
    fontSize: 10,
    color: '#999',
  },

  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },

  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },

  viewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },

  viewerHeader: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  viewerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  closeViewerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#292929',
    justifyContent: 'center',
    alignItems: 'center',
  },

  viewerImageArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },

  fullScreenImage: {
    width: '100%',
    height: '100%',
  },

  viewerDetails: {
    backgroundColor: '#151515',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 35,
    maxHeight: '35%',
  },

  viewerDestinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  viewerDestination: {
    color: 'white',
    fontSize: 19,
    fontWeight: 'bold',
    marginLeft: 8,
    flexShrink: 1,
  },

  viewerCaptionScroll: {
    flexShrink: 1,
  },

  viewerCaption: {
    color: '#E0E0E0',
    fontSize: 14,
    lineHeight: 22,
  },

  viewerDate: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 12,
  },
});
