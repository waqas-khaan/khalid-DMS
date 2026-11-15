<template>
  <div class="mobile-dashboard-page pb-16">
    <!-- 1. Sticky Mobile App Header (Executive Style) -->
    <header class="mobile-app-header px-4 py-3 bg-white border-b sticky-top">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center gap-2">
          <div class="header-icon-box">
            <v-icon color="primary" size="20">mdi-view-dashboard</v-icon>
          </div>
          <div>
            <h1 class="text-subtitle-1 font-weight-black text-slate-900 line-height-tight mb-0">
              Dashboard
            </h1>
            <span class="text-caption text-grey-darken-1 font-weight-medium" style="font-size: 0.72rem !important;">
              Executive Dairy Operations
            </span>
          </div>
        </div>

        <!-- Refresh Button -->
        <v-btn
          icon
          size="small"
          variant="tonal"
          color="primary"
          :loading="loading"
          class="refresh-icon-btn"
          @click="refreshAll"
        >
          <v-icon size="18">mdi-refresh</v-icon>
        </v-btn>
      </div>

      <!-- Quick Day Stepper & Inspector -->
      <div class="mobile-date-stepper d-flex align-center justify-space-between gap-1 pa-1 bg-slate-100 rounded-lg border mb-2">
        <button
          type="button"
          class="stepper-arrow-btn"
          title="Previous Day"
          @click="stepDay(-1)"
        >
          <v-icon size="20">mdi-chevron-left</v-icon>
        </button>

        <div
          class="d-flex align-center gap-2 flex-grow-1 justify-center cursor-pointer py-1"
          @click="datePickerModal = true"
        >
          <v-icon size="16" color="primary">mdi-calendar-month</v-icon>
          <span class="font-weight-black text-body-2 text-slate-800">
            {{ formatDate(selectedDate) }}
          </span>
          <v-chip
            v-if="selectedDate === businessDayStore.activeBusinessDate"
            size="x-small"
            color="primary"
            variant="flat"
            class="font-weight-bold"
            style="height: 18px; font-size: 0.62rem !important;"
          >
            Active
          </v-chip>
          <v-chip
            v-else-if="selectedDate === businessDayStore.realToday"
            size="x-small"
            color="info"
            variant="tonal"
            class="font-weight-bold"
            style="height: 18px; font-size: 0.62rem !important;"
          >
            Today
          </v-chip>
        </div>

        <button
          type="button"
          class="stepper-arrow-btn"
          title="Next Day"
          :disabled="isNextDayDisabled"
          @click="stepDay(1)"
        >
          <v-icon size="20" :color="isNextDayDisabled ? 'grey-lighten-1' : 'default'">mdi-chevron-right</v-icon>
        </button>
      </div>
    </header>

    <div class="px-3 pt-3">
      <!-- 2. Working Day Lock Alert (if locked) -->
      <div
        v-if="businessDayStore.isLockedOnPreviousDay"
        class="mobile-lock-alert mb-3 pa-3 rounded-xl border shadow-xs"
      >
        <div class="d-flex align-center justify-space-between mb-1">
          <div class="d-flex align-center gap-2">
            <v-icon size="18" color="amber-darken-4">mdi-lock-alert</v-icon>
            <span class="text-subtitle-2 font-weight-black text-amber-darken-4">
              Operational Lock Active
            </span>
          </div>
          <v-chip size="x-small" color="amber-darken-4" variant="flat" class="font-weight-bold">
            Locked
          </v-chip>
        </div>
        <p class="text-caption text-grey-darken-3 mb-1 font-weight-medium">
          {{ businessDayStore.lockReason }}
        </p>
      </div>

      <!-- 3. Section: Daily Key Performance Indicators (STRICTLY 2 IN 1 ROW) -->
      <div class="d-flex align-center justify-space-between mb-2 px-1">
        <div class="d-flex align-center gap-1-5">
          <v-icon color="primary" size="18">mdi-calendar-today</v-icon>
          <span class="text-subtitle-2 font-weight-black text-slate-900 text-uppercase">
            Daily Metrics ({{ formatDate(selectedDate) }})
          </span>
        </div>
        <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-black">
          Daily
        </v-chip>
      </div>

      <div class="mobile-kpi-grid mb-3">
        <!-- 1. Today Income (Collection) -->
        <div class="mobile-kpi-card income-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Today Income</span>
            <div class="kpi-icon-badge bg-emerald-50 text-emerald-600">
              <v-icon size="16">mdi-cash-plus</v-icon>
            </div>
          </div>
          <div class="kpi-value text-emerald-600">
            {{ formatCurrency(dailyStats.totalIncome) }}
          </div>
          <div class="kpi-subtitle">
            Cash collected from shops
          </div>
        </div>

        <!-- 2. Available Cash -->
        <div class="mobile-kpi-card cash-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Available Cash</span>
            <div
              class="kpi-icon-badge"
              :class="dailyStats.availableCashToday >= 0 ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'"
            >
              <v-icon size="16">
                {{ dailyStats.availableCashToday >= 0 ? 'mdi-cash-register' : 'mdi-alert-circle-outline' }}
              </v-icon>
            </div>
          </div>
          <div
            class="kpi-value"
            :class="dailyStats.availableCashToday >= 0 ? 'text-teal-700' : 'text-rose-600'"
          >
            {{ formatCurrency(dailyStats.availableCashToday) }}
          </div>
          <div class="kpi-subtitle">
            Remaining cash on hand
          </div>
        </div>

        <!-- 3. Total Shop Arrears -->
        <div class="mobile-kpi-card arrears-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Total Arrears</span>
            <div class="kpi-icon-badge bg-amber-50 text-amber-700">
              <v-icon size="16">mdi-account-cash</v-icon>
            </div>
          </div>
          <div class="kpi-value text-amber-800">
            {{ formatCurrency(dailyStats.totalArrears) }}
          </div>
          <div class="kpi-subtitle">
            Outstanding balance
          </div>
        </div>

        <!-- 4. Milk Received Today -->
        <div class="mobile-kpi-card milk-in-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Milk Received</span>
            <div class="kpi-icon-badge bg-sky-50 text-sky-600">
              <v-icon size="16">mdi-water-outline</v-icon>
            </div>
          </div>
          <div class="kpi-value text-sky-700">
            {{ formatNumber(dailyStats.milkReceivedToday) }} <span class="kpi-unit">Kg</span>
          </div>
          <div class="kpi-subtitle">
            {{ formatNumber(dailyStats.milkReceivedTodayLiters) }} Liters received
          </div>
        </div>

        <!-- 5. Milk Dispatched Today -->
        <div class="mobile-kpi-card milk-out-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Milk Dispatched</span>
            <div class="kpi-icon-badge bg-blue-50 text-blue-600">
              <v-icon size="16">mdi-truck-fast</v-icon>
            </div>
          </div>
          <div class="kpi-value text-blue-700">
            {{ formatNumber(dailyStats.milkDispatchedToday) }} <span class="kpi-unit">Kg</span>
          </div>
          <div class="kpi-subtitle">
            Valued at {{ formatCurrency(dailyStats.todayDispatchAmount) }}
          </div>
        </div>

        <!-- 6. Total Expenses Today -->
        <div class="mobile-kpi-card expense-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Today Expenses</span>
            <div class="kpi-icon-badge bg-rose-50 text-rose-600">
              <v-icon size="16">mdi-cash-minus</v-icon>
            </div>
          </div>
          <div class="kpi-value text-rose-600">
            {{ formatCurrency(dailyStats.totalExpenseToday) }}
          </div>
          <div class="kpi-subtitle">
            Expenses recorded today
          </div>
        </div>
      </div>

      <!-- 4. Section: Today's Expenses Breakdown (2 IN 1 ROW) -->
      <div class="d-flex align-center justify-space-between mb-2 px-1 pt-1">
        <div class="d-flex align-center gap-1-5">
          <v-icon color="orange-darken-3" size="18">mdi-shape</v-icon>
          <span class="text-subtitle-2 font-weight-black text-slate-900 text-uppercase">
            Today's Expenses by Category
          </span>
        </div>
        <v-chip size="x-small" color="orange-darken-3" variant="tonal" class="font-weight-black">
          Categories
        </v-chip>
      </div>

      <div class="mobile-kpi-grid mb-3">
        <!-- Food Expense -->
        <div class="mobile-kpi-card arrears-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Food Expense</span>
            <div class="kpi-icon-badge bg-amber-50 text-amber-700">
              <v-icon size="16">mdi-food</v-icon>
            </div>
          </div>
          <div class="kpi-value text-amber-800">
            {{ formatCurrency(dailyStats.foodExpense) }}
          </div>
          <div class="kpi-subtitle">
            Staff meals & tea
          </div>
        </div>

        <!-- Home Expense -->
        <div class="mobile-kpi-card cash-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Home Expense</span>
            <div class="kpi-icon-badge bg-teal-50 text-teal-700">
              <v-icon size="16">mdi-home-outline</v-icon>
            </div>
          </div>
          <div class="kpi-value text-teal-700">
            {{ formatCurrency(dailyStats.homeExpense) }}
          </div>
          <div class="kpi-subtitle">
            Farm maintenance
          </div>
        </div>

        <!-- Transport Total (Spans 2 columns) -->
        <div class="mobile-kpi-card transport-kpi-card pa-3 bg-white" style="grid-column: 1 / -1;">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="d-flex align-center gap-1-5">
              <div class="kpi-icon-badge bg-indigo-50 text-indigo-600">
                <v-icon size="16">mdi-truck</v-icon>
              </div>
              <span class="kpi-label font-weight-bold">Transport Total</span>
            </div>
            <span class="kpi-value text-indigo-700 mb-0">
              {{ formatCurrency(dailyStats.transportExpense) }}
            </span>
          </div>
          <div class="transport-sub-grid pt-2 border-t d-flex align-center gap-2">
            <div class="transport-sub-pill flex-grow-1">
              <span class="sub-pill-label">⛽ Diesel:</span>
              <span class="sub-pill-val">{{ formatCurrency(dailyStats.dieselExpense) }}</span>
            </div>
            <div class="transport-sub-pill flex-grow-1">
              <span class="sub-pill-label">🔧 Maint:</span>
              <span class="sub-pill-val">{{ formatCurrency(dailyStats.maintenanceExpense) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Section: Monthly Performance Summary (STRICTLY 2 IN 1 ROW) -->
      <div class="d-flex align-center justify-space-between mb-2 px-1 pt-1">
        <div class="d-flex align-center gap-1-5">
          <v-icon color="purple-darken-2" size="18">mdi-calendar-month</v-icon>
          <span class="text-subtitle-2 font-weight-black text-slate-900 text-uppercase">
            Monthly Summary ({{ selectedMonth }})
          </span>
        </div>
        <v-chip size="x-small" color="purple-darken-2" variant="tonal" class="font-weight-black">
          Monthly
        </v-chip>
      </div>

      <div class="mobile-kpi-grid mb-4">
        <!-- Monthly Income -->
        <div class="mobile-kpi-card income-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Monthly Income</span>
            <div class="kpi-icon-badge bg-emerald-50 text-emerald-600">
              <v-icon size="16">mdi-cash-multiple</v-icon>
            </div>
          </div>
          <div class="kpi-value text-emerald-600">
            {{ formatCurrency(monthlyStats.monthlyIncome) }}
          </div>
          <div class="kpi-subtitle">
            Month collections
          </div>
        </div>

        <!-- Monthly Milk Received -->
        <div class="mobile-kpi-card milk-in-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Milk Received</span>
            <div class="kpi-icon-badge bg-sky-50 text-sky-600">
              <v-icon size="16">mdi-water-check</v-icon>
            </div>
          </div>
          <div class="kpi-value text-sky-700">
            {{ formatNumber(monthlyStats.monthlyReceivedKg) }} <span class="kpi-unit">Kg</span>
          </div>
          <div class="kpi-subtitle">
            {{ formatNumber(monthlyStats.monthlyReceivedLiters) }} L total
          </div>
        </div>

        <!-- Monthly Milk Dispatched -->
        <div class="mobile-kpi-card milk-out-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Milk Dispatched</span>
            <div class="kpi-icon-badge bg-blue-50 text-blue-600">
              <v-icon size="16">mdi-truck-check</v-icon>
            </div>
          </div>
          <div class="kpi-value text-blue-700">
            {{ formatNumber(monthlyStats.monthlyDispatched) }} <span class="kpi-unit">Kg</span>
          </div>
          <div class="kpi-subtitle">
            Dispatched to shops
          </div>
        </div>

        <!-- Monthly Total Expenses -->
        <div class="mobile-kpi-card expense-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Total Expenses</span>
            <div class="kpi-icon-badge bg-rose-50 text-rose-600">
              <v-icon size="16">mdi-cash-remove</v-icon>
            </div>
          </div>
          <div class="kpi-value text-rose-600">
            {{ formatCurrency(monthlyStats.totalMonthlyExpense) }}
          </div>
          <div class="kpi-subtitle">
            All month expenses
          </div>
        </div>

        <!-- Salaries Paid -->
        <div class="mobile-kpi-card cash-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Salaries Paid</span>
            <div class="kpi-icon-badge bg-teal-50 text-teal-700">
              <v-icon size="16">mdi-account-cash</v-icon>
            </div>
          </div>
          <div class="kpi-value text-teal-700">
            {{ formatCurrency(monthlyStats.salariesPaid) }}
          </div>
          <div class="kpi-subtitle">
            Staff salaries
          </div>
        </div>

        <!-- Advances Given -->
        <div class="mobile-kpi-card arrears-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Advances Given</span>
            <div class="kpi-icon-badge bg-orange-50 text-orange-700">
              <v-icon size="16">mdi-hand-coin</v-icon>
            </div>
          </div>
          <div class="kpi-value text-orange-800">
            {{ formatCurrency(monthlyStats.advancesGiven) }}
          </div>
          <div class="kpi-subtitle">
            Advances issued
          </div>
        </div>
      </div>
    </div>

    <!-- Date Picker Bottom Sheet Modal -->
    <v-dialog v-model="datePickerModal" max-width="360" rounded="xl">
      <v-card class="pa-4 rounded-xl">
        <div class="d-flex align-center justify-space-between mb-3">
          <span class="text-subtitle-2 font-weight-black text-slate-800">Select Date</span>
          <v-btn icon size="x-small" variant="text" @click="datePickerModal = false">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </div>
        <AppDatePicker
          v-model="selectedDate"
          label="Filter Date"
          hide-details
          @change="onDateSelected"
        />
        <v-btn
          block
          color="primary"
          variant="flat"
          class="mt-3 font-weight-bold rounded-lg text-capitalize"
          @click="datePickerModal = false"
        >
          Done
        </v-btn>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useBusinessDayStore } from '@/stores/businessDay';
import { useSnackbarStore } from '@/stores/snackbar';
import { statsService } from '@/services/statsService';
import { formatCurrency, formatNumber, formatDate, getCurrentMonthString, getOffsetDateString } from '@/utils/formatters';
import AppDatePicker from '@/components/common/AppDatePicker.vue';

const businessDayStore = useBusinessDayStore();
const snackbar = useSnackbarStore();

const loading = ref(false);
const datePickerModal = ref(false);

const selectedDate = ref(businessDayStore.activeBusinessDate || businessDayStore.realToday);
const selectedMonth = ref((businessDayStore.activeBusinessDate || businessDayStore.realToday).substring(0, 7) || getCurrentMonthString());

const currentMonthStr = computed(() => getCurrentMonthString());
const yesterdayDateStr = computed(() => getOffsetDateString(businessDayStore.activeBusinessDate || businessDayStore.realToday, -1));
const lastMonthStr = computed(() => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
});

const isNextDayDisabled = computed(() => {
  if (businessDayStore.isLockedOnPreviousDay && selectedDate.value >= businessDayStore.activeBusinessDate) {
    return true;
  }
  return selectedDate.value >= businessDayStore.realToday;
});

const dailyStats = ref({
  totalIncome: 0,
  openingCashToday: 0,
  advancesToday: 0,
  salariesPaidToday: 0,
  availableCashToday: 0,
  todayDispatchAmount: 0,
  totalArrears: 0,
  milkReceivedToday: 0,
  milkReceivedTodayLiters: 0,
  milkDispatchedToday: 0,
  totalExpenseToday: 0,
  foodExpense: 0,
  homeExpense: 0,
  transportExpense: 0,
  dieselExpense: 0,
  maintenanceExpense: 0,
});

const monthlyStats = ref({
  monthlyIncome: 0,
  monthlyDispatched: 0,
  monthlyReceivedKg: 0,
  monthlyReceivedLiters: 0,
  totalMonthlyExpense: 0,
  salariesPaid: 0,
  advancesGiven: 0,
});

async function loadDailyStats() {
  try {
    const data = await statsService.getDailyStats(selectedDate.value);
    if (data) {
      dailyStats.value = { ...dailyStats.value, ...data };
    }
  } catch (err) {
    console.error('Failed to load daily stats in mobile dashboard:', err);
  }
}

async function loadMonthlyStats() {
  try {
    const data = await statsService.getMonthlyStats(selectedMonth.value);
    if (data) {
      monthlyStats.value = { ...monthlyStats.value, ...data };
    }
  } catch (err) {
    console.error('Failed to load monthly stats in mobile dashboard:', err);
  }
}

async function refreshAll() {
  loading.value = true;
  try {
    await businessDayStore.refreshBusinessDay();
    if (!selectedDate.value) {
      selectedDate.value = businessDayStore.activeBusinessDate;
    }
    await Promise.all([
      statsService.refreshDailyStats(selectedDate.value),
      statsService.refreshMonthlyStats(selectedMonth.value),
    ]);
    await Promise.all([loadDailyStats(), loadMonthlyStats()]);
  } finally {
    loading.value = false;
  }
}

function stepDay(delta) {
  const nextDate = getOffsetDateString(selectedDate.value, delta);
  if (delta > 0 && isNextDayDisabled.value) {
    if (businessDayStore.isLockedOnPreviousDay) {
      snackbar.warning(businessDayStore.lockReason);
    }
    return;
  }
  selectedDate.value = nextDate;
  selectedMonth.value = nextDate.substring(0, 7);
  loadDailyStats();
  loadMonthlyStats();
}

function setDateActive() {
  selectedDate.value = businessDayStore.activeBusinessDate;
  selectedMonth.value = businessDayStore.activeBusinessDate.substring(0, 7);
  loadDailyStats();
}

function setDateYesterday() {
  selectedDate.value = yesterdayDateStr.value;
  selectedMonth.value = yesterdayDateStr.value.substring(0, 7);
  loadDailyStats();
}

function setThisMonth() {
  selectedMonth.value = currentMonthStr.value;
  loadMonthlyStats();
}

function setLastMonth() {
  selectedMonth.value = lastMonthStr.value;
  loadMonthlyStats();
}

function onDateSelected() {
  datePickerModal.value = false;
  selectedMonth.value = selectedDate.value.substring(0, 7);
  loadDailyStats();
  loadMonthlyStats();
}

watch(
  () => businessDayStore.activeBusinessDate,
  (newDate) => {
    if (newDate && !selectedDate.value) {
      selectedDate.value = newDate;
      selectedMonth.value = newDate.substring(0, 7);
      loadDailyStats();
      loadMonthlyStats();
    }
  }
);

onMounted(async () => {
  await businessDayStore.refreshBusinessDay();
  if (businessDayStore.activeBusinessDate) {
    selectedDate.value = businessDayStore.activeBusinessDate;
    selectedMonth.value = businessDayStore.activeBusinessDate.substring(0, 7);
  }
  await Promise.all([loadDailyStats(), loadMonthlyStats()]);
});
</script>

<style scoped>
.mobile-dashboard-page {
  background-color: #f8fafc;
  min-height: 100vh;
}

.sticky-top {
  position: sticky;
  top: 56px;
  z-index: 20;
}

.header-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: #e0f2fe;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-icon-btn {
  width: 32px !important;
  height: 32px !important;
}

.mobile-date-stepper {
  height: 42px;
}

.stepper-arrow-btn {
  width: 34px;
  height: 34px;
  border-radius: 6px;
  border: none;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.filter-pill-btn {
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-pill-btn.active {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

.mobile-lock-alert {
  background: #fffbeb;
  border-color: #fcd34d !important;
}

.mobile-kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 12px !important;
}

.mobile-kpi-card {
  position: relative;
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 14px !important;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04) !important;
  padding: 13px 13px !important;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 104px;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.mobile-kpi-card:active {
  transform: scale(0.99);
}

.kpi-label {
  font-size: 0.76rem !important;
  font-weight: 700 !important;
  color: #334155 !important;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-icon-badge {
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-value {
  font-size: 1.18rem !important;
  font-weight: 800 !important;
  line-height: 1.25 !important;
  margin-top: 5px;
  margin-bottom: 3px;
  letter-spacing: -0.01em;
  word-break: break-word;
}

.kpi-unit {
  font-size: 0.78rem !important;
  font-weight: 700 !important;
  opacity: 0.85;
}

.kpi-subtitle {
  font-size: 0.72rem !important;
  font-weight: 500 !important;
  color: #64748b !important;
  line-height: 1.25 !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Subtle accent tints for top border */
.income-card { border-top: 3px solid #10b981 !important; }
.cash-card { border-top: 3px solid #0d9488 !important; }
.arrears-card { border-top: 3px solid #f59e0b !important; }
.milk-in-card { border-top: 3px solid #0284c7 !important; }
.milk-out-card { border-top: 3px solid #3b82f6 !important; }
.expense-card { border-top: 3px solid #ef4444 !important; }
.transport-kpi-card { border-top: 3px solid #6366f1 !important; }

/* Transport Sub-pills */
.transport-sub-grid {
  border-top-color: #f1f5f9 !important;
}

.transport-sub-pill {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.sub-pill-label {
  font-size: 0.72rem !important;
  font-weight: 600 !important;
  color: #64748b !important;
}

.sub-pill-val {
  font-size: 0.78rem !important;
  font-weight: 800 !important;
  color: #1e293b !important;
}

/* Utility badge backgrounds */
.bg-emerald-50 { background-color: #ecfdf5 !important; }
.text-emerald-600 { color: #059669 !important; }
.bg-teal-50 { background-color: #f0fdfa !important; }
.text-teal-600 { color: #0d9488 !important; }
.text-teal-700 { color: #0f766e !important; }
.bg-amber-50 { background-color: #fffbeb !important; }
.text-amber-700 { color: #b45309 !important; }
.text-amber-800 { color: #92400e !important; }
.bg-sky-50 { background-color: #f0f9ff !important; }
.text-sky-600 { color: #0284c7 !important; }
.text-sky-700 { color: #0369a1 !important; }
.bg-blue-50 { background-color: #eff6ff !important; }
.text-blue-600 { color: #2563eb !important; }
.text-blue-700 { color: #1d4ed8 !important; }
.bg-rose-50 { background-color: #fff1f2 !important; }
.text-rose-600 { color: #e11d48 !important; }
.bg-indigo-50 { background-color: #eef2ff !important; }
.text-indigo-600 { color: #4f46e5 !important; }
.text-indigo-700 { color: #4338ca !important; }
.bg-orange-50 { background-color: #fff7ed !important; }
.text-orange-700 { color: #c2410c !important; }
.text-orange-800 { color: #9a3412 !important; }

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

