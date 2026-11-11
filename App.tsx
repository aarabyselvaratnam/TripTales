
import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';

import {
  initializeDatabase,
  seedSampleTrips,
  seedDemoData,
  seedAllTripExpenses,
} from './src/database/database';

import { seedDemoMemories } from './src/data/seedDemoMemories';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function setupDatabase() {
      try {
        // Step 1: Create database tables
        await initializeDatabase();

        // Step 2: Insert sample trips once
        await seedSampleTrips();

        // Step 3: Insert demo journal entries
        // and expenses once
        await seedDemoData();

        await seedAllTripExpenses();

        await seedDemoMemories();

        console.log('TripTales database ready');

        setReady(true);
      } catch (err) {
        console.error('Database setup failed:', err);

        const message =
          err instanceof Error
            ? err.message
            : String(err);

        setError(message);
      }
    }

    setupDatabase();
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          Database Error
        </Text>

        <Text style={styles.errorMessage}>
          {error}
        </Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#245C4F"
        />

        <Text style={styles.message}>
          Preparing TripTales...
        </Text>
      </View>
    );
  }

  return <AppNavigator />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F6F1',
    padding: 24,
  },

  message: {
    marginTop: 12,
    color: '#245C4F',
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#B3261E',
    marginBottom: 12,
    textAlign: 'center',
  },

  errorMessage: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
});
