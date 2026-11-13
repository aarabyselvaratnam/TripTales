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
  Image,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import {
  Trip,
  Expense,
  getTrips,
  getExpenses,
  addExpense,
  deleteExpense,
} from '../database/database';

import { getDestinationImage } from '../data/destinationImages';

const GREEN = '#245C4F';
const CREAM = '#F8F6F1';

const categories = [
  'Transport',
  'Food',
  'Accommodation',
  'Activities',
  'Shopping',
  'Other',
];

const categoryIcons: Record<
  string,
  keyof typeof Ionicons.glyphMap
> = {
  Transport: 'car-outline',
  Food: 'restaurant-outline',
  Accommodation: 'bed-outline',
  Activities: 'ticket-outline',
  Shopping: 'bag-outline',
  Other: 'receipt-outline',
};

const formatCurrency = (value: number) =>
  `LKR ${value.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function ExpensesScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [expandedTrip, setExpandedTrip] =
    useState<number | null>(null);

  const [selectedTrip, setSelectedTrip] =
    useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Transport');
  const [amount, setAmount] = useState('');

  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [savedTrips, savedExpenses] =
        await Promise.all([
          getTrips(),
          getExpenses(),
        ]);

      setTrips(savedTrips);
      setExpenses(savedExpenses);
    } catch (err) {
      console.error('Expense loading error:', err);
      setError('Unable to load expenses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const totalExpenses = expenses.reduce(
    (sum, expense) =>
      sum + Number(expense.amount || 0),
    0
  );

  const tripsWithExpenses = trips.filter((trip) =>
    expenses.some(
      (expense) => expense.trip_id === trip.id
    )
  ).length;

  const getTripExpenses = (tripId: number) =>
    expenses
      .filter((expense) => expense.trip_id === tripId)
      .sort((a, b) =>
        b.expense_date.localeCompare(a.expense_date)
      );

  const getTripTotal = (tripId: number) =>
    getTripExpenses(tripId).reduce(
      (sum, expense) =>
        sum + Number(expense.amount || 0),
      0
    );

  const openExpenseForm = (tripId: number) => {
    setSelectedTrip(tripId);
    setTitle('');
    setCategory('Transport');
    setAmount('');
    setExpenseDate(
      new Date().toISOString().split('T')[0]
    );
    setShowForm(true);
  };

  const closeExpenseForm = () => {
    setShowForm(false);
    setSelectedTrip(null);
  };

  const handleSave = async () => {
    if (
      !selectedTrip ||
      !title.trim() ||
      !amount.trim()
    ) {
      showAlert(
        'Missing Information',
        'Please select a trip, title and amount.'
      );
      return;
    }

    if (!trips.some((trip) => trip.id === selectedTrip)) {
      showAlert(
        'Invalid Trip',
        'Please select an existing trip.'
      );
      return;
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      showAlert(
        'Invalid Amount',
        'Enter an amount greater than zero.'
      );
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
      showAlert(
        'Invalid Date',
        'Use YYYY-MM-DD format.'
      );
      return;
    }

    const [year, month, day] =
      expenseDate.split('-').map(Number);

    const parsedDate = new Date(
      Date.UTC(year, month - 1, day)
    );

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

      await addExpense(
        selectedTrip,
        title.trim(),
        category,
        numericAmount,
        expenseDate
      );

      const savedTripId = selectedTrip;

      closeExpenseForm();
      setExpandedTrip(savedTripId);

      await loadData();

      showAlert(
        'Success',
        'Expense added successfully!'
      );
    } catch (err) {
      console.error('Expense save error:', err);
      showAlert(
        'Error',
        'Unable to save expense.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    showAlert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
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
              await deleteExpense(id);
              await loadData();
            } catch (err) {
              console.error(
                'Expense delete error:',
                err
              );
              showAlert(
                'Error',
                'Unable to delete expense.'
              );
            }
          },
        },
      ]
    );
  };

  const selectedTripData = trips.find(
    (trip) => trip.id === selectedTrip
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="wallet-outline"
              size={29}
              color={GREEN}
            />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.heading}>
              Trip Expenses
            </Text>

            <Text style={styles.subtitle}>
              Your travel spending, organized.
            </Text>
          </View>
        </View>

        {/* OVERALL SUMMARY */}

        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <Text style={styles.summaryLabel}>
              TOTAL TRAVEL SPENDING
            </Text>

            <Ionicons
              name="wallet-outline"
              size={25}
              color="#DCE9E2"
            />
          </View>

          <Text
            style={styles.summaryAmount}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {formatCurrency(totalExpenses)}
          </Text>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryStats}>
            <View>
              <Text style={styles.summaryStatValue}>
                {trips.length}
              </Text>

              <Text style={styles.summaryStatLabel}>
                Total Trips
              </Text>
            </View>

            <View>
              <Text style={styles.summaryStatValue}>
                {tripsWithExpenses}
              </Text>

              <Text style={styles.summaryStatLabel}>
                Trips With Expenses
              </Text>
            </View>

            <View>
              <Text style={styles.summaryStatValue}>
                {expenses.length}
              </Text>

              <Text style={styles.summaryStatLabel}>
                Records
              </Text>
            </View>
          </View>
        </View>

        {/* ADD EXPENSE BUTTON */}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            if (showForm) {
              closeExpenseForm();
            } else {
              setSelectedTrip(null);
              setShowForm(true);
            }
          }}
        >
          <Ionicons
            name={showForm ? 'close' : 'add-circle-outline'}
            size={22}
            color="#FFFFFF"
          />

          <Text style={styles.addButtonText}>
            {showForm
              ? 'Close Expense Form'
              : 'Add New Expense'}
          </Text>
        </TouchableOpacity>

        {/* ADD EXPENSE FORM */}

        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              New Expense
            </Text>

            {selectedTripData && (
              <Text style={styles.formHint}>
                Adding expense for {selectedTripData.destination}
              </Text>
            )}

            <Text style={styles.label}>
              Select Trip *
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalSelector}
            >
              {trips.map((trip) => (
                <TouchableOpacity
                  key={trip.id}
                  style={[
                    styles.chip,
                    selectedTrip === trip.id &&
                      styles.activeChip,
                  ]}
                  onPress={() =>
                    setSelectedTrip(trip.id)
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedTrip === trip.id &&
                        styles.activeChipText,
                    ]}
                  >
                    {trip.destination}
                    {' • '}
                    {trip.date}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {trips.length === 0 && (
              <Text style={styles.emptyText}>
                Add a trip before recording expenses.
              </Text>
            )}

            <Text style={styles.label}>
              Expense Title *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. Train Tickets"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>
              Category
            </Text>

            <View style={styles.categoryContainer}>
              {categories.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chip,
                    category === item &&
                      styles.activeChip,
                  ]}
                  onPress={() =>
                    setCategory(item)
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === item &&
                        styles.activeChipText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>
              Amount (LKR) *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. 2500"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.label}>
              Expense Date *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={expenseDate}
              onChangeText={setExpenseDate}
              maxLength={10}
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                (saving || trips.length === 0) &&
                  styles.disabledButton,
              ]}
              onPress={handleSave}
              disabled={
                saving || trips.length === 0
              }
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  Save Expense
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* TRIP GROUPS */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Expenses by Trip
            </Text>

            <Text style={styles.sectionSubtitle}>
              Tap a trip to view its spending
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={GREEN}
            style={{ marginVertical: 30 }}
          />
        ) : error ? (
          <View style={styles.emptyCard}>
            <Text style={styles.errorText}>
              {error}
            </Text>

            <TouchableOpacity onPress={loadData}>
              <Text style={styles.retryText}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="map-outline"
              size={42}
              color="#9BAFA4"
            />

            <Text style={styles.emptyText}>
              No trips found. Add your first trip
              to start tracking expenses.
            </Text>
          </View>
        ) : (
          trips.map((trip) => {
            const tripExpenses =
              getTripExpenses(trip.id);

            const tripTotal =
              getTripTotal(trip.id);

            const isExpanded =
              expandedTrip === trip.id;

            const destinationImage =
              getDestinationImage(
                trip.destination
              );

            return (
              <View
                key={trip.id}
                style={styles.tripGroup}
              >
                {/* TRIP HEADER */}

                <TouchableOpacity
                  style={styles.tripHeader}
                  activeOpacity={0.8}
                  onPress={() =>
                    setExpandedTrip(
                      isExpanded ? null : trip.id
                    )
                  }
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
                        size={26}
                        color={GREEN}
                      />
                    </View>
                  )}

                  <View style={styles.tripInfo}>
                    <Text
                      style={styles.tripName}
                      numberOfLines={1}
                    >
                      {trip.destination}
                    </Text>

                    <Text style={styles.tripDate}>
                      {trip.date}
                    </Text>

                    <Text style={styles.tripCount}>
                      {tripExpenses.length}
                      {' '}
                      {tripExpenses.length === 1
                        ? 'expense'
                        : 'expenses'}
                    </Text>
                  </View>

                  <View style={styles.tripRight}>
                    <Text
                      style={styles.tripTotal}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                    >
                      {formatCurrency(tripTotal)}
                    </Text>

                    <Ionicons
                      name={
                        isExpanded
                          ? 'chevron-up'
                          : 'chevron-down'
                      }
                      size={20}
                      color={GREEN}
                    />
                  </View>
                </TouchableOpacity>

                {/* EXPANDED DETAILS */}

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={styles.tripSummary}>
                      <Text style={styles.tripSummaryLabel}>
                        Total spent on this trip
                      </Text>

                      <Text style={styles.tripSummaryAmount}>
                        {formatCurrency(tripTotal)}
                      </Text>
                    </View>

                    {tripExpenses.length === 0 ? (
                      <View style={styles.noExpenseBox}>
                        <Ionicons
                          name="receipt-outline"
                          size={29}
                          color="#9BAFA4"
                        />

                        <Text style={styles.emptyText}>
                          No expenses for this trip yet.
                        </Text>
                      </View>
                    ) : (
                      categories.map((item) => {
                        const categoryExpenses =
                          tripExpenses.filter(
                            (expense) =>
                              expense.category === item
                          );

                        if (
                          categoryExpenses.length === 0
                        ) {
                          return null;
                        }

                        const categoryTotal =
                          categoryExpenses.reduce(
                            (sum, expense) =>
                              sum +
                              Number(
                                expense.amount || 0
                              ),
                            0
                          );

                        return (
                          <View
                            key={item}
                            style={styles.categorySection}
                          >
                            <View
                              style={styles.categoryHeader}
                            >
                              <View
                                style={styles.categoryHeadingLeft}
                              >
                                <Ionicons
                                  name={
                                    categoryIcons[item]
                                  }
                                  size={19}
                                  color={GREEN}
                                />

                                <Text
                                  style={styles.categoryHeading}
                                >
                                  {item}
                                </Text>
                              </View>

                              <Text
                                style={styles.categoryTotal}
                              >
                                {formatCurrency(
                                  categoryTotal
                                )}
                              </Text>
                            </View>

                            {categoryExpenses.map(
                              (expense) => (
                                <View
                                  key={expense.id}
                                  style={styles.expenseRow}
                                >
                                  <View
                                    style={styles.expenseInfo}
                                  >
                                    <Text
                                      style={styles.expenseTitle}
                                    >
                                      {expense.title}
                                    </Text>

                                    <Text
                                      style={styles.expenseDate}
                                    >
                                      {
                                        expense.expense_date
                                      }
                                    </Text>
                                  </View>

                                  <Text
                                    style={styles.expenseAmount}
                                  >
                                    {formatCurrency(
                                      Number(
                                        expense.amount
                                      )
                                    )}
                                  </Text>

                                  <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() =>
                                      handleDelete(
                                        expense.id
                                      )
                                    }
                                  >
                                    <Ionicons
                                      name="trash-outline"
                                      size={19}
                                      color="#B3261E"
                                    />
                                  </TouchableOpacity>
                                </View>
                              )
                            )}
                          </View>
                        );
                      })
                    )}

                    <TouchableOpacity
                      style={styles.tripAddButton}
                      onPress={() =>
                        openExpenseForm(trip.id)
                      }
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={20}
                        color={GREEN}
                      />

                      <Text
                        style={styles.tripAddButtonText}
                      >
                        Add Expense to {trip.destination}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={styles.footer}>
          <Ionicons
            name="leaf-outline"
            size={16}
            color="#8BA398"
          />

          <Text style={styles.footerText}>
            Every journey has its own story.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },

  content: {
    padding: 20,
    paddingTop: 45,
    paddingBottom: 60,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#E5EEE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  headerText: {
    flex: 1,
  },

  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: GREEN,
  },

  subtitle: {
    fontSize: 13,
    color: '#777',
    marginTop: 5,
  },

  summaryCard: {
    backgroundColor: GREEN,
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
  },

  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  summaryLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: '#DCE9E2',
  },

  summaryAmount: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: 'bold',
    marginTop: 12,
  },

  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 19,
  },

  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  summaryStatValue: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  summaryStatLabel: {
    fontSize: 10,
    color: '#DCE9E2',
    marginTop: 5,
  },

  addButton: {
    backgroundColor: GREEN,
    borderRadius: 14,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 9,
  },

  sectionHeader: {
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#253B34',
  },

  sectionSubtitle: {
    fontSize: 12,
    color: '#89958C',
    marginTop: 5,
  },

  tripGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 2,
  },

  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },

  tripImage: {
    width: 75,
    height: 75,
    borderRadius: 12,
    marginRight: 12,
  },

  tripPlaceholder: {
    width: 75,
    height: 75,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#E8EEE9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tripInfo: {
    flex: 1,
    minWidth: 0,
  },

  tripName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#253B34',
  },

  tripDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },

  tripCount: {
    fontSize: 11,
    color: '#8BA398',
    marginTop: 5,
  },

  tripRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 7,
    maxWidth: '40%',
  },

  tripTotal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: GREEN,
    textAlign: 'right',
    marginBottom: 10,
  },

  expandedContent: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEF0EC',
  },

  tripSummary: {
    backgroundColor: '#E8EEE9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 18,
  },

  tripSummaryLabel: {
    fontSize: 12,
    color: GREEN,
  },

  tripSummaryAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: GREEN,
    marginTop: 5,
  },

  categorySection: {
    marginBottom: 19,
  },

  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0EC',
  },

  categoryHeadingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  categoryHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#253B34',
    marginLeft: 8,
  },

  categoryTotal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: GREEN,
    marginLeft: 8,
  },

  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2EF',
  },

  expenseInfo: {
    flex: 1,
  },

  expenseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#253B34',
  },

  expenseDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 5,
  },

  expenseAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: GREEN,
    marginLeft: 6,
  },

  deleteButton: {
    padding: 9,
    marginLeft: 5,
  },

  noExpenseBox: {
    padding: 20,
    alignItems: 'center',
  },

  tripAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EEE9',
    borderRadius: 12,
    padding: 14,
    marginTop: 5,
  },

  tripAddButtonText: {
    color: GREEN,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 18,
    marginBottom: 27,
    elevation: 2,
  },

  formHint: {
    fontSize: 13,
    color: GREEN,
    marginTop: 8,
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#253B34',
    marginTop: 15,
    marginBottom: 10,
  },

  horizontalSelector: {
    flexGrow: 0,
    marginBottom: 6,
  },

  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#E8EEE9',
    marginRight: 8,
    marginBottom: 9,
  },

  activeChip: {
    backgroundColor: GREEN,
  },

  chipText: {
    color: GREEN,
    fontWeight: '600',
    fontSize: 12,
  },

  activeChipText: {
    color: '#FFFFFF',
  },

  input: {
    backgroundColor: CREAM,
    borderWidth: 1,
    borderColor: '#E2E8E3',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },

  saveButton: {
    backgroundColor: GREEN,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 22,
  },

  disabledButton: {
    opacity: 0.5,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },

  emptyText: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },

  errorText: {
    color: '#B3261E',
    textAlign: 'center',
  },

  retryText: {
    color: GREEN,
    fontWeight: 'bold',
    marginTop: 14,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },

  footerText: {
    color: '#8BA398',
    fontSize: 12,
    marginLeft: 7,
  },
});
