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

        <div class="d-flex align-center gap-2">
          <!-- Business Day Status Pill -->
          <v-chip
            size="small"
            :color="businessDayStore.isActiveDayClosed ? 'success' : 'primary'"
            variant="flat"
            class="font-weight-bold text-caption px-2-5 shadow-xs"
          >
            <v-icon start size="13">
              {{ businessDayStore.isActiveDayClosed ? 'mdi-check-circle' : 'mdi-clock-outline' }}
            </v-icon>
            {{ businessDayStore.isActiveDayClosed ? 'CLOSED' : 'OPEN' }}
          </v-chip>

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
      </div>

      <!-- Quick Day Stepper & Inspector -->
      <div class="mobile-date-stepper d-flex align-center justify-space-between gap-1 p-1 bg-slate-100 rounded-lg border mb-2">
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

      <!-- Period Shortcut Pills -->
      <div class="d-flex align-center gap-1 overflow-x-auto no-scrollbar pt-1">
        <button
          type="button"
          class="filter-pill-btn"
          :class="{ active: selectedDate === businessDayStore.activeBusinessDate }"
          @click="setDateActive"
        >
          Active Day
        </button>
        <button
          type="button"
          class="filter-pill-btn"
          :class="{ active: selectedDate === yesterdayDateStr }"
          @click="setDateYesterday"
        >
          Yesterday
        </button>
        <button
          type="button"
          class="filter-pill-btn"
          :class="{ active: selectedMonth === currentMonthStr }"
          @click="setThisMonth"
        >
          This Month
        </button>
        <button
          type="button"
          class="filter-pill-btn"
          :class="{ active: selectedMonth === lastMonthStr }"
          @click="setLastMonth"
        >
          Last Month
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
        <div class="mobile-kpi-card pa-3 bg-white border rounded-xl shadow-xs">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase" style="font-size: 0.68rem !important;">
              Today Income
            </span>
            <v-avatar color="success" size="26" variant="tonal">
              <v-icon size="14" color="success">mdi-cash-plus</v-icon>
            </v-avatar>
          </div>
          <div class="text-subtitle-1 font-weight-black text-success line-height-tight">
            {{ formatCurrency(dailyStats.totalIncome) }}
          </div>
          <div class="text-caption text-grey font-weight-medium mt-0-5 text-truncate" style="font-size: 0.68rem !important;">
            Cash collected from shops
          </div>
        </div>

        <!-- 2. Available Cash -->
        <div class="mobile-kpi-card pa-3 bg-white border rounded-xl shadow-xs">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase" style="font-size: 0.68rem !important;">
              Available Cash
            </span>
            <v-avatar :color="dailyStats.availableCashToday >= 0 ? 'teal' : 'error'" size="26" variant="tonal">
              <v-icon size="14" :color="dailyStats.availableCashToday >= 0 ? 'teal' : 'error'">mdi-cash-register</v-icon>
            </v-avatar>
          </div>
          <div
            class="text-subtitle-1 font-weight-black line-height-tight"
            :class="dailyStats.availableCashToday >= 0 ? 'text-teal' : 'text-error'"
          >
            {{ formatCurrency(dailyStats.availableCashToday) }}
          </div>
          <div class="text-caption text-grey font-weight-medium mt-0-5 text-truncate" style="font-size: 0.68rem !important;">
            Remaining cash on hand
          </div>
        </div>

        <!-- 3. Total Shop Arrears -->
        <div class="mobile-kpi-card pa-3 bg-white border rounded-xl shadow-xs">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase" style="font-size: 0.68rem !important;">
              Total Arrears
            </span>
            <v-avatar color="warning" size="26" variant="tonal">
              <v-icon size="14" color="warning">mdi-account-cash</v-icon>
            </v-avatar>
          </div>
          <div class="text-subtitle-1 font-weight-black text-amber-darken-4 line-height-tight">
            {{ formatCurrency(dailyStats.totalArrears) }}
          </div>
          <div class="text-caption text-grey font-weight-medium mt-0-5 text-truncate" style="font-size: 0.68rem !important;">
            Outstanding balance
          </div>
        </div>

        <!-- 4. Milk Received Today -->
        <div class="mobile-kpi-card pa-3 bg-white border rounded-xl shadow-xs">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase" style="font-size: 0.68rem !important;">
              Milk Received
            </span>
            <v-avatar color="info" size="26" variant="tonal">
              <v-icon size="14" color="info">mdi-water-outline</v-icon>
            </v-avatar>
          </div>
          <div class="text-subtitle-1 font-weight-black text-info line-height-tight">
            {{ formatNumber(dailyStats.milkReceivedToday) }} <span class="text-caption font-weight-bold">Kg</span>
          </div>
          <div class="text-caption text-grey font-weight-medium mt-0-5 text-truncate" style="font-size: 0.68rem !important;">
            {{ formatNumber(dailyStats.milkReceivedTodayLiters) }} Liters received
          </div>
        </div>

        <!-- 5. Milk Dispatched Today -->
        <div class="mobile-kpi-card pa-3 bg-white border rounded-xl shadow-xs">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase" style="font-size: 0.68rem !important;">
              Milk Dispatched
            </span>
            <v-avatar color="primary" size="26" variant="tonal">
              <v-icon size="14" color="primary">mdi-truck-fast</v-icon>
            </v-avatar>
          </div>
          <div class="text-subtitle-1 font-weight-black text-primary line-height-tight">
            {{ formatNumber(dailyStats.milkDispatchedToday) }} <span class="text-caption font-weight-bold">Kg</span>
          </div>
          <div class="text-caption text-grey font-weight-medium mt-0-5 text-truncate" style="font-size: 0.68rem !important;">
            Valued at {{ formatCurrency(dailyStats.todayDispatchAmount) }}
          </div>
        </div>

        <!-- 6. Total Expenses Today -->
        <div class="mobile-kpi-card pa-3 bg-white border rounded-xl shadow-xs">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase" style="font-size: 0.68rem !important;">
              Today Expenses
            </span>
            <v-avatar color="error" size="26" variant="tonal">
              <v-icon size="14" color="error">mdi-cash-minus</v-icon>
            </v-avatar>
          </div>
          <div class="text-subtitle-1 font-weight-black text-error line-height-tight">
            {{ formatCurrency(dailyStats.totalExpenseToday) }}
          </div>
          <div class="text-caption text-grey font-weight-medium mt-0-5 text-truncate" style="font-size: 0.68rem !important;">
            Expenses recorded today
          </div>
        </div>
      </div>

      <!-- 4. Section: Today's Expenses Breakdown (2 IN 1 ROW) -->
      <div class="d-flex align-center justify-space-between mb-2 px-1">
        <span class="text-caption font-weight-bold text-grey-darken-2 text-uppercase" style="font-size: 0.7rem !important;">
          Today's Expenses by Category
        </span>
      </div>

      <div class="mobile-kpi-grid mb-3">
        <!-- Food Expense -->
        <div class="mobile-kpi-card pa-3 bg-white border rounded-xl shadow-xs">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase" style="font-size: 0.68rem !important;">
              Food Expense
            </span>
            <v-icon size="16" color="amber-darken-3">mdi-food</v-icon>
          </div>
          <div class="text-subtitle-1 font-weight-black text-slate-800 line-height-tight">
            {{ formatCurrency(dailyStats.foodExpense) }}
          </div>
          <div class="text-caption text-grey font-weight-medium mt-0-5 text-truncate" style="font-size: 0.65rem !important;">
            Staff meals & tea
          </div>
        </div>

        <!-- Home Expense -->
        <div class="mobile-kpi-card pa-3 bg-white border rounded-xl shadow-xs">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase" style="font-size: 0.68rem !important;">
              Home Expense
            </span>
            <v-icon size="16" color="teal">mdi-home-outline</v-icon>
          </div>
          <div class="text-subtitle-1 font-weight-black text-slate-800 line-height-tight">
            {{ formatCurrency(dailyStats.homeExpense) }}
          </div>
          <div class="text-caption text-grey font-weight-medium mt-0-5 text-truncate" style="font-size: 0.65rem !important;">
            Farm maintenance
          </div>
        </div>

        <!-- Transport Total (Spans 2 columns) -->
        <div class="mobile-kpi-card pa-3 bg-white border rounded-xl shadow-xs" style="grid-column: 1 / -1;">
          <div class="d-flex align-center justify-space-between mb-1">
            <div class="d-flex align-center gap-1-5">
              <v-icon size="16" color="primary">mdi-truck</v-icon>
              <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase" style="font-size: 0.68rem !important;">
                Transport Total
              </span>
            </div>
            <span class="text-subtitle-1 font-weight-black text-primary line-height-tight">
              {{ formatCurrency(dailyStats.transportExpense) }}
            </span>
          </div>
          <div class="d-flex align-center justify-space-between text-caption text-grey-darken-2 pt-1 border-t mt-1" style="font-size: 0.68rem !important;">
            <span>Diesel: <strong>{{ formatCurrency(dailyStats.dieselExpense) }}</strong></span>
            <span>Maintenance: <strong>{{ formatCurrency(dailyStats.maintenanceExpense) }}</strong></span>
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
        <div class="mobile-kpi-card pa-3 bg-white border rounded-xl shadow-xs">
          <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase" style="font-size: 0.68rem !important;">
            Monthly Income
          </span>
          <div class="text-subtitle-1 font-weight-black text-success line-height-tight mt-1">
            {{ formatCurrency(monthlyStats.monthlyIncome) }}
          </div>
          <div class="text-caption text-grey font-weight-medium mt-0-5 text-truncate" style="font-size: 0.65rem !important;">
            Month collections
          </div>
        </div>

        <!-- Monthly Milk Received -->
        <div class="mobile-kpi-card pa-3 bg-white border rounded-xl shadow-xs">
          <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase" style="font-size: 0.68rem !important;">
            Milk Received
          </span>
          <div class="text-subtitle-1 font-weight-black text-info line-height-tight mt-1">
            {{ formatNumber(monthlyStats.monthlyReceivedKg) }} <span class="text-caption font-weight-bold">Kg</span>
          </div>
          <div class="text-caption text-grey font-weight-medium mt-0-5 text-truncate" style="font-size: 0.65rem !important;">
            {{ formatNumber(monthlyStats.monthlyReceivedLiters) }} L total
          </div>
        </div>

        <!-- Monthly Milk Dispatched -->
        <div class="mobile-kpi-card pa-3 bg-white border rounded-xl shadow-xs">
          <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase" style="font-size: 0.68rem !important;">
            Milk Dispatched
          </span>
          <div class="text-subtitle-1 font-weight-black text-primary line-height-tight mt-1">
            {{ formatNumber(monthlyStats.monthlyDispatched) }} <span class="text-caption font-weight-bold">Kg</span>
          </div>
          <div class="text-caption text-grey font-weight-medium mt-0-5 text-truncate" style="font-size: 0.65rem !important;">
            Dispatched to shops
          </div>
        </div>

        <!-- Monthly Total Expenses -->
        <div class="mobile-kpi-card pa-3 bg-white border rounded-xl shadow-xs">
          <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase" style="font-size: 0.68rem !important;">
            Total Expenses
          </span>
          <div class="text-subtitle-1 font-weight-black text-error line-height-tight mt-1">
            {{ formatCurrency(monthlyStats.totalMonthlyExpense) }}
          </div>
          <div class="text-caption text-grey font-weight-medium mt-0-5 text-truncate" style="font-size: 0.65rem !important;">
            All month expenses
          </div>
        </div>

        <!-- Salaries Paid -->
        <div class="mobile-kpi-card pa-3 bg-white border rounded-xl shadow-xs">
          <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase" style="font-size: 0.68rem !important;">
            Salaries Paid
          </span>
          <div class="text-subtitle-1 font-weight-black text-teal line-height-tight mt-1">
            {{ formatCurrency(monthlyStats.salariesPaid) }}
          </div>
          <div class="text-caption text-grey font-weight-medium mt-0-5 text-truncate" style="font-size: 0.65rem !important;">
            Staff salaries
          </div>
        </div>

        <!-- Advances Given -->
        <div class="mobile-kpi-card pa-3 bg-white border rounded-xl shadow-xs">
          <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase" style="font-size: 0.68rem !important;">
            Advances Given
          </span>
          <div class="text-subtitle-1 font-weight-black text-orange-darken-4 line-height-tight mt-1">
            {{ formatCurrency(monthlyStats.advancesGiven) }}
          </div>
          <div class="text-caption text-grey font-weight-medium mt-0-5 text-truncate" style="font-size: 0.65rem !important;">
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
  gap: 10px !important;
}

.mobile-kpi-card {
  transition: transform 0.12s ease;
  background: #ffffff;
  border: 1px solid #000000 !important;
  border-radius: 10px !important;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

