
import * as SQLite from 'expo-sqlite';
import { sampleTrips } from '../data/sampleTrips';

// -------------------- TYPES --------------------

export type Trip = {
  id: number;
  destination: string;
  location: string;
  date: string;
  category: string;
  description: string;
};

export type JournalEntry = {
  id: number;
  trip_id: number;
  title: string;
  content: string;
  entry_date: string;
  destination: string;
};

export type Expense = {
  id: number;
  trip_id: number;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  destination: string;
};

export type Memory = {
  id: number;
  trip_id: number;
  image_uri: string;
  caption: string;
  created_at: string;
  destination: string;
};

// -------------------- DATABASE --------------------

let databasePromise: ReturnType<
  typeof SQLite.openDatabaseAsync
> | null = null;

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('triptales.db');
  }

  return databasePromise;
}

export async function initializeDatabase() {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      destination TEXT NOT NULL,
      location TEXT NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      FOREIGN KEY (trip_id)
        REFERENCES trips(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL CHECK (amount > 0),
      expense_date TEXT NOT NULL,
      FOREIGN KEY (trip_id)
        REFERENCES trips(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      image_uri TEXT NOT NULL,
      caption TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (trip_id)
        REFERENCES trips(id)
        ON DELETE CASCADE
    );
  `);

  console.log('TripTales database initialized');
}

// -------------------- TRIPS --------------------

export async function getTrips(): Promise<Trip[]> {
  const db = await getDatabase();

  return db.getAllAsync<Trip>(
    'SELECT * FROM trips ORDER BY id DESC'
  );
}

export async function addTrip(trip: Omit<Trip, 'id'>) {
  const db = await getDatabase();

  return db.runAsync(
    `INSERT INTO trips
     (destination, location, date, category, description)
     VALUES (?, ?, ?, ?, ?)`,
    [
      trip.destination,
      trip.location,
      trip.date,
      trip.category,
      trip.description,
    ]
  );
}

export async function getTripById(id: number) {
  const db = await getDatabase();

  return db.getFirstAsync<Trip>(
    'SELECT * FROM trips WHERE id = ?',
    [id]
  );
}

export async function updateTrip(trip: Trip) {
  const db = await getDatabase();

  return db.runAsync(
    `UPDATE trips
     SET destination = ?,
         location = ?,
         date = ?,
         category = ?,
         description = ?
     WHERE id = ?`,
    [
      trip.destination,
      trip.location,
      trip.date,
      trip.category,
      trip.description,
      trip.id,
    ]
  );
}

export async function deleteTrip(id: number) {
  const db = await getDatabase();

  return db.runAsync(
    'DELETE FROM trips WHERE id = ?',
    [id]
  );
}

// -------------------- SAMPLE TRIPS --------------------

export async function seedSampleTrips() {
  const db = await getDatabase();

  const seeded = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_metadata WHERE key = ?',
    ['sample_trips_seeded_v1']
  );

  if (seeded) return;

  await db.withTransactionAsync(async () => {
    const existing = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_metadata WHERE key = ?',
      ['sample_trips_seeded_v1']
    );

    if (existing) return;

    for (const trip of sampleTrips) {
      await db.runAsync(
        `INSERT INTO trips
         (destination, location, date, category, description)
         VALUES (?, ?, ?, ?, ?)`,
        [
          trip.destination,
          trip.location,
          trip.date,
          trip.category,
          trip.description,
        ]
      );
    }

    await db.runAsync(
      'INSERT INTO app_metadata (key, value) VALUES (?, ?)',
      ['sample_trips_seeded_v1', 'true']
    );
  });

  console.log('Sample trips added successfully');
}

// -------------------- JOURNAL --------------------

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const db = await getDatabase();

  return db.getAllAsync<JournalEntry>(
    `SELECT
       journal_entries.id,
       journal_entries.trip_id,
       journal_entries.title,
       journal_entries.content,
       journal_entries.entry_date,
       trips.destination
     FROM journal_entries
     INNER JOIN trips
       ON trips.id = journal_entries.trip_id
     ORDER BY journal_entries.id DESC`
  );
}

export async function addJournalEntry(
  tripId: number,
  title: string,
  content: string,
  entryDate: string
) {
  const db = await getDatabase();

  return db.runAsync(
    `INSERT INTO journal_entries
     (trip_id, title, content, entry_date)
     VALUES (?, ?, ?, ?)`,
    [tripId, title, content, entryDate]
  );
}

export async function deleteJournalEntry(id: number) {
  const db = await getDatabase();

  return db.runAsync(
    'DELETE FROM journal_entries WHERE id = ?',
    [id]
  );
}

// -------------------- EXPENSES --------------------

export async function getExpenses(): Promise<Expense[]> {
  const db = await getDatabase();

  return db.getAllAsync<Expense>(
    `SELECT
       expenses.id,
       expenses.trip_id,
       expenses.title,
       expenses.category,
       expenses.amount,
       expenses.expense_date,
       trips.destination
     FROM expenses
     INNER JOIN trips
       ON trips.id = expenses.trip_id
     ORDER BY expenses.id DESC`
  );
}

export async function addExpense(
  tripId: number,
  title: string,
  category: string,
  amount: number,
  expenseDate: string
) {
  const db = await getDatabase();

  return db.runAsync(
    `INSERT INTO expenses
     (trip_id, title, category, amount, expense_date)
     VALUES (?, ?, ?, ?, ?)`,
    [tripId, title, category, amount, expenseDate]
  );
}

export async function deleteExpense(id: number) {
  const db = await getDatabase();

  return db.runAsync(
    'DELETE FROM expenses WHERE id = ?',
    [id]
  );
}

// -------------------- MEMORIES --------------------

export async function getMemories(): Promise<Memory[]> {
  const db = await getDatabase();

  return db.getAllAsync<Memory>(
    `SELECT
       memories.id,
       memories.trip_id,
       memories.image_uri,
       memories.caption,
       memories.created_at,
       trips.destination
     FROM memories
     INNER JOIN trips
       ON trips.id = memories.trip_id
     ORDER BY memories.id DESC`
  );
}

export async function addMemory(
  tripId: number,
  imageUri: string,
  caption: string,
  createdAt: string
) {
  const db = await getDatabase();

  return db.runAsync(
    `INSERT INTO memories
     (trip_id, image_uri, caption, created_at)
     VALUES (?, ?, ?, ?)`,
    [tripId, imageUri, caption, createdAt]
  );
}

export async function deleteMemory(id: number) {
  const db = await getDatabase();

  return db.runAsync(
    'DELETE FROM memories WHERE id = ?',
    [id]
  );
}

// -------------------- DEMO JOURNAL & EXPENSE DATA --------------------

export async function seedDemoData() {
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    const seeded = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_metadata WHERE key = ?',
      ['demo_data_seeded_v1']
    );

    if (seeded) return;

    const demoTrips = [
      {
        destination: 'Ella',
        journalTitle: 'A Beautiful Day in Ella',
        journalContent:
          'We explored the Nine Arch Bridge and enjoyed the beautiful mountain scenery. The train journey was unforgettable.',
        expenses: [
          ['Train Tickets', 'Transport', 2500],
          ['Lunch', 'Food', 1800],
          ['Guesthouse', 'Accommodation', 6500],
        ],
      },
      {
        destination: 'Sigiriya',
        journalTitle: 'Climbing Sigiriya Rock',
        journalContent:
          'We climbed Sigiriya early in the morning and enjoyed the breathtaking view from the top.',
        expenses: [
          ['Entrance Tickets', 'Activities', 3000],
          ['Breakfast', 'Food', 1200],
          ['Bus Fare', 'Transport', 900],
        ],
      },
      {
        destination: 'Galle Fort',
        journalTitle: 'Exploring Galle Fort',
        journalContent:
          'We walked through the historic streets of Galle Fort, visited the lighthouse and watched the sunset.',
        expenses: [
          ['Travel Fare', 'Transport', 2200],
          ['Seafood Lunch', 'Food', 3500],
          ['Souvenirs', 'Shopping', 1500],
        ],
      },
    ];

    for (const demo of demoTrips) {
      const trip = await db.getFirstAsync<{
        id: number;
        date: string;
      }>(
        `SELECT id, date FROM trips
         WHERE destination = ?
         ORDER BY id ASC LIMIT 1`,
        [demo.destination]
      );

      if (!trip) continue;

      await db.runAsync(
        `INSERT INTO journal_entries
         (trip_id, title, content, entry_date)
         VALUES (?, ?, ?, ?)`,
        [
          trip.id,
          demo.journalTitle,
          demo.journalContent,
          trip.date,
        ]
      );

      for (const expense of demo.expenses) {
        await db.runAsync(
          `INSERT INTO expenses
           (trip_id, title, category, amount, expense_date)
           VALUES (?, ?, ?, ?, ?)`,
          [
            trip.id,
            String(expense[0]),
            String(expense[1]),
            Number(expense[2]),
            trip.date,
          ]
        );
      }
    }

    await db.runAsync(
      `INSERT INTO app_metadata (key, value)
       VALUES (?, ?)`,
      ['demo_data_seeded_v1', 'true']
    );
  });

  console.log('Demo journal and expense data initialized');
}

// -------------------- ALL TRIP EXPENSES --------------------

export async function seedAllTripExpenses() {
  const db = await getDatabase();

  const demoExpenses = [
    {
      destination: 'Nuwara Eliya',
      items: [
        ['Train Tickets', 'Transport', 3200],
        ['Hotel Stay', 'Accommodation', 8500],
        ['Lunch', 'Food', 2200],
      ],
    },
    {
      destination: 'Mirissa',
      items: [
        ['Bus Fare', 'Transport', 1800],
        ['Beachside Lunch', 'Food', 2800],
        ['Whale Watching', 'Activities', 6500],
      ],
    },
    {
      destination: 'Kandy',
      items: [
        ['Train Fare', 'Transport', 1500],
        ['Temple Visit', 'Activities', 2000],
        ['Dinner', 'Food', 1800],
      ],
    },
    {
      destination: 'Horton Plains',
      items: [
        ['Transport', 'Transport', 3500],
        ['Entrance Tickets', 'Activities', 2500],
        ['Breakfast', 'Food', 1200],
      ],
    },
    {
      destination: 'Arugam Bay',
      items: [
        ['Bus Fare', 'Transport', 3000],
        ['Surfing Lesson', 'Activities', 4500],
        ['Guesthouse', 'Accommodation', 6000],
      ],
    },
    {
      destination: 'Anuradhapura',
      items: [
        ['Travel Fare', 'Transport', 2200],
        ['Site Tickets', 'Activities', 2500],
        ['Lunch', 'Food', 1600],
      ],
    },
    {
      destination: 'Polonnaruwa',
      items: [
        ['Transport', 'Transport', 2600],
        ['Heritage Site Visit', 'Activities', 3000],
        ['Lunch', 'Food', 1800],
      ],
    },
    {
      destination: 'Trincomalee',
      items: [
        ['Bus Fare', 'Transport', 2800],
        ['Hotel Stay', 'Accommodation', 7500],
        ['Snorkeling', 'Activities', 4000],
      ],
    },
    {
      destination: 'Jaffna',
      items: [
        ['Train Tickets', 'Transport', 4200],
        ['Hotel Stay', 'Accommodation', 6500],
        ['Local Food', 'Food', 2000],
      ],
    },
    {
      destination: 'Bentota',
      items: [
        ['Travel Fare', 'Transport', 2000],
        ['Water Sports', 'Activities', 5500],
        ['Lunch', 'Food', 2500],
      ],
    },
    {
      destination: 'Yala National Park',
      items: [
        ['Jeep Safari', 'Activities', 9500],
        ['Park Tickets', 'Activities', 3000],
        ['Transport', 'Transport', 4000],
      ],
    },
    {
      destination: 'Dambulla',
      items: [
        ['Bus Fare', 'Transport', 1500],
        ['Cave Temple Visit', 'Activities', 1500],
        ['Lunch', 'Food', 1300],
      ],
    },
  ] satisfies Array<{
    destination: string;
    items: Array<[string, string, number]>;
  }>;

  await db.withTransactionAsync(async () => {
    const seeded = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_metadata WHERE key = ?',
      ['all_trip_expenses_seeded_v1']
    );

    if (seeded) return;

    for (const demo of demoExpenses) {
      const trip = await db.getFirstAsync<{
        id: number;
        date: string;
      }>(
        `SELECT id, date FROM trips
         WHERE LOWER(destination) = LOWER(?)
         ORDER BY id ASC LIMIT 1`,
        [demo.destination]
      );

      if (!trip) {
        throw new Error(
          `Missing demo trip: ${demo.destination}`
        );
      }

      for (const [title, category, amount] of demo.items) {
        await db.runAsync(
          `INSERT INTO expenses
           (trip_id, title, category, amount, expense_date)
           VALUES (?, ?, ?, ?, ?)`,
          [trip.id, title, category, amount, trip.date]
        );
      }
    }

    await db.runAsync(
      `INSERT INTO app_metadata (key, value)
       VALUES (?, ?)`,
      ['all_trip_expenses_seeded_v1', 'true']
    );
  });

  console.log('Additional demo trip expenses initialized');
}
