
import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';

import {
  getTrips,
  getMemories,
  addMemory,
  getDatabase,
} from '../database/database';

import { getDestinationImage } from './destinationImages';

const demoMemories = [
  {
    destination: 'Ella',
    caption: 'Beautiful mountain views during our Ella adventure.',
  },
  {
    destination: 'Sigiriya',
    caption: 'An unforgettable visit to the historic Sigiriya Rock.',
  },
  {
    destination: 'Galle Fort',
    caption: 'Exploring the beautiful streets of Galle Fort.',
  },
  {
    destination: 'Nuwara Eliya',
    caption: 'Enjoying the cool weather and green tea plantations.',
  },
  {
    destination: 'Mirissa',
    caption: 'A peaceful day beside the ocean in Mirissa.',
  },
];

export async function seedDemoMemories() {
  const db = await getDatabase();

  const seeded = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_metadata WHERE key = ?',
    ['demo_memories_seeded_v1']
  );

  if (seeded) return;

  const trips = await getTrips();
  const existingMemories = await getMemories();

  
  const folder = Platform.OS === 'web'
    ? null
    : new Directory(Paths.document, 'triptales_memories');

  folder?.create({
    idempotent: true,
    intermediates: true,
  });

  for (const demo of demoMemories) {
    const trip = trips.find(
      (item) =>
        item.destination.toLowerCase() ===
        demo.destination.toLowerCase()
    );

    if (!trip) continue;

    const alreadyExists = existingMemories.some(
      (memory) =>
        memory.trip_id === trip.id &&
        memory.caption === demo.caption
    );

    if (alreadyExists) continue;

    const imageSource = getDestinationImage(
      demo.destination
    );

    if (!imageSource) continue;


    const asset = Asset.fromModule(imageSource as number);
    let imageUri = asset.uri;

    if (!imageUri) continue;

    if (folder) {
      await asset.downloadAsync();

      if (!asset.localUri) continue;

      const originalFile = new File(asset.localUri);
      const fileName =
        `demo_${trip.id}_${demo.destination
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')}.jpg`;
      const savedFile = new File(folder, fileName);

      if (!savedFile.exists) {
        await originalFile.copy(savedFile);
      }

      imageUri = savedFile.uri;
    }

    await addMemory(
      trip.id,
      imageUri,
      demo.caption,
      trip.date
    );
  }

  await db.runAsync(
    `INSERT OR IGNORE INTO app_metadata (key, value)
     VALUES (?, ?)`,
    ['demo_memories_seeded_v1', 'true']
  );

  console.log('Demo memories initialized once');
}
