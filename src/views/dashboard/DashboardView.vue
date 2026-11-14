<template>
  <!-- Mobile Native View (Auto-switched on mobile devices / viewports) -->
  <DashboardMobileView v-if="display.smAndDown.value" />

  <!-- Desktop View (Preserved 100% intact, no changes) -->
  <div v-else class="page-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-header-title">Dairy Operations Dashboard</h1>
        <p class="page-header-subtitle">Real-time daily metrics, milk movement, finances, and monthly statistics</p>
      </div>

      <div class="dashboard-filter-group d-flex align-center flex-wrap">
        <div class="dashboard-filter-item">
          <AppDatePicker
            v-model="selectedDate"
            label="Filter Date"
            hide-details
            @change="loadDailyStats"
          />
        </div>
        <div class="dashboard-filter-item">
          <AppMonthPicker
            v-model="selectedMonth"
            label="Filter Month"
            hide-details
            @change="loadMonthlyStats"
          />
        </div>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-refresh"
          class="dashboard-refresh-btn text-capitalize font-weight-bold px-5"
          height="40"
          :loading="loading"
          @click="refreshAll"
        >
          Refresh
        </v-btn>
      </div>
    </div>

    <!-- Loading Indicator -->
    <v-progress-linear
      v-if="loading"
      indeterminate
      color="primary"
      height="3"
      class="mb-4 rounded"
    />


    <!-- SECTION 1: DAILY CARDS -->
    <div class="mb-2">
      <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-2">
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-3 d-flex align-center">
          <v-icon color="primary" class="me-2" size="20">mdi-calendar-today</v-icon>
          Daily Overview ({{ formatDate(selectedDate) }})
        </h2>
        <v-chip
          size="small"
          color="#1565C0"
          variant="flat"
          prepend-icon="mdi-calendar-check-outline"
          class="font-weight-bold text-white px-3"
        >
          Daily Aggregation
        </v-chip>
      </div>

      <div class="dashboard-metrics-grid">
        <!-- Today Collection (Income) -->
        <StatCard
          label="Today Income"
          :value="formatCurrency(dailyStats.totalIncome)"
          color="success"
          subtitle="Cash collected from shops today"
        />

        <!-- Available Cash -->
        <StatCard
          label="Available Cash"
          :value="formatCurrency(dailyStats.availableCashToday)"
          :color="dailyStats.availableCashToday >= 0 ? 'teal' : 'error'"
          subtitle="Remaining cash on hand"
        />

        <!-- Total Arrears -->
        <StatCard
          label="Total Shop Arrears"
          :value="formatCurrency(dailyStats.totalArrears)"
          color="warning"
          subtitle="Outstanding balance across all shops"
        />

        <!-- Milk Received Today -->
        <StatCard
          label="Milk Received Today"
          :value="`${formatNumber(dailyStats.milkReceivedToday)} Kg`"
          color="info"
          :subtitle="`${formatNumber(dailyStats.milkReceivedTodayLiters)} Liters received`"
        />

        <!-- Milk Dispatched Today -->
        <StatCard
          label="Milk Dispatched Today"
          :value="`${formatNumber(dailyStats.milkDispatchedToday)} Kg`"
          color="primary"
          :subtitle="`Valued at ${formatCurrency(dailyStats.todayDispatchAmount)}`"
        />

        <!-- Total Expense Today -->
        <StatCard
          label="Total Expense Today"
          :value="formatCurrency(dailyStats.totalExpenseToday)"
          color="error"
          subtitle="Expenses recorded for today"
        />
      </div>

      <!-- Category Expense Cards for Today -->
      <div class="text-caption text-grey-darken-1 font-weight-bold mt-2 mb-2">Today's Expenses by Category:</div>
      <v-row dense>
        <v-col cols="6" sm="6" md="4">
          <v-card class="modern-card pa-3 h-100" elevation="0">
            <div>
              <div class="text-caption text-grey font-weight-bold uppercase" style="font-size: 0.68rem !important;">Food Expense</div>
              <div class="text-subtitle-1 font-weight-bold text-dark mt-1">{{ formatCurrency(dailyStats.foodExpense) }}</div>
              <div class="text-caption text-grey text-truncate" style="font-size: 0.68rem !important;">Staff meals & tea</div>
            </div>
          </v-card>
        </v-col>

        <v-col cols="6" sm="6" md="4">
          <v-card class="modern-card pa-3 h-100" elevation="0">
            <div>
              <div class="text-caption text-grey font-weight-bold uppercase" style="font-size: 0.68rem !important;">Home Expense</div>
              <div class="text-subtitle-1 font-weight-bold text-dark mt-1">{{ formatCurrency(dailyStats.homeExpense) }}</div>
              <div class="text-caption text-grey text-truncate" style="font-size: 0.68rem !important;">Farm maintenance</div>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="12" md="4">
          <v-card class="modern-card pa-3 h-100" elevation="0">
            <div>
              <div class="text-caption text-grey font-weight-bold uppercase" style="font-size: 0.68rem !important;">Transport Total</div>
              <div class="text-subtitle-1 font-weight-bold text-dark mt-1">{{ formatCurrency(dailyStats.transportExpense) }}</div>
              <div class="text-caption text-grey" style="font-size: 0.68rem !important;">
                Diesel: <strong>{{ formatCurrency(dailyStats.dieselExpense) }}</strong> | Maint: <strong>{{ formatCurrency(dailyStats.maintenanceExpense) }}</strong>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- SECTION 2: CHARTS -->
    <v-row class="my-3">
      <!-- Milk Movement Chart -->
      <v-col cols="12" md="6">
        <v-card class="modern-card pa-4 h-100" elevation="0">
          <div class="d-flex align-center justify-space-between mb-4">
            <div>
              <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-3">Milk Trend Analysis</h3>
              <div class="text-caption text-grey">Arrivals vs Dispatches (Kg)</div>
            </div>
            <v-chip
              color="#0277BD"
              size="small"
              variant="flat"
              prepend-icon="mdi-water-outline"
              class="font-weight-bold text-white px-3"
            >
              Milk Flow
            </v-chip>
          </div>

          <div style="height: 220px; position: relative;">
            <canvas ref="milkChartRef"></canvas>
          </div>
        </v-card>
      </v-col>

      <!-- Income vs Expense Chart -->
      <v-col cols="12" md="6">
        <v-card class="modern-card pa-4 h-100" elevation="0">
          <div class="d-flex align-center justify-space-between mb-4">
            <div>
              <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-3">Income vs Expense</h3>
              <div class="text-caption text-grey">Financial performance for {{ selectedMonth }}</div>
            </div>
            <v-chip
              color="#2E7D32"
              size="small"
              variant="flat"
              prepend-icon="mdi-finance"
              class="font-weight-bold text-white px-3"
            >
              Financial
            </v-chip>
          </div>

          <div style="height: 220px; position: relative;">
            <canvas ref="financialChartRef"></canvas>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- SECTION 3: MONTHLY CARDS -->
    <div class="mt-4">
      <div class="d-flex align-center justify-space-between mb-3">
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-3 d-flex align-center">
          <v-icon color="primary" class="me-2" size="20">mdi-calendar-month</v-icon>
          Monthly Summary ({{ selectedMonth }})
        </h2>
        <v-chip
          size="small"
          color="#6A1B9A"
          variant="flat"
          prepend-icon="mdi-calendar-month-outline"
          class="font-weight-bold text-white px-3"
        >
          Monthly Aggregation
        </v-chip>
      </div>

      <v-row dense>
        <!-- Monthly Income -->
        <v-col cols="6" sm="6" md="4" lg="2">
          <StatCard
            label="Monthly Income"
            :value="formatCurrency(monthlyStats.monthlyIncome)"
            color="success"
            subtitle="Collections this month"
          />
        </v-col>

        <!-- Monthly Milk Received -->
        <v-col cols="6" sm="6" md="4" lg="2">
          <StatCard
            label="Milk Received"
            :value="`${formatNumber(monthlyStats.monthlyReceivedKg)} Kg`"
            color="info"
            :subtitle="`${formatNumber(monthlyStats.monthlyReceivedLiters)} L`"
          />
        </v-col>

        <!-- Monthly Milk Dispatched -->
        <v-col cols="6" sm="6" md="4" lg="2">
          <StatCard
            label="Milk Dispatched"
            :value="`${formatNumber(monthlyStats.monthlyDispatched)} Kg`"
            color="primary"
            subtitle="Total distributed"
          />
        </v-col>

        <!-- Monthly Total Expense -->
        <v-col cols="6" sm="6" md="4" lg="2">
          <StatCard
            label="Total Expenses"
            :value="formatCurrency(monthlyStats.totalMonthlyExpense)"
            color="error"
            subtitle="Operating expenses"
          />
        </v-col>

        <!-- Salaries Paid -->
        <v-col cols="6" sm="6" md="4" lg="2">
          <StatCard
            label="Salaries Paid"
            :value="formatCurrency(monthlyStats.salariesPaid)"
            color="teal"
            subtitle="Staff payroll cleared"
          />
        </v-col>

        <!-- Advances -->
        <v-col cols="6" sm="6" md="4" lg="2">
          <StatCard
            label="Advances Given"
            :value="formatCurrency(monthlyStats.advancesGiven)"
            color="warning"
            subtitle="Staff loan advances"
          />
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import { useDisplay } from 'vuetify';
import { statsService } from '@/services/statsService';
import { useBusinessDayStore } from '@/stores/businessDay';
import { useSnackbarStore } from '@/stores/snackbar';
import { formatCurrency, formatNumber, formatDate, getCurrentMonthString, getOffsetDateString } from '@/utils/formatters';
import StatCard from '@/components/common/StatCard.vue';
import AppDatePicker from '@/components/common/AppDatePicker.vue';
import AppMonthPicker from '@/components/common/AppMonthPicker.vue';
import DashboardMobileView from './DashboardMobileView.vue';

const display = useDisplay();
const businessDayStore = useBusinessDayStore();
const snackbar = useSnackbarStore();

const selectedDate = ref(businessDayStore.activeBusinessDate);
const selectedMonth = ref(businessDayStore.activeBusinessDate.substring(0, 7) || getCurrentMonthString());
const loading = ref(false);

function setDateToday() {
  if (businessDayStore.isLockedOnPreviousDay) {
    snackbar.warning(businessDayStore.lockReason);
  }
  selectedDate.value = businessDayStore.activeBusinessDate;
  loadDailyStats();
}

function setDateYesterday() {
  selectedDate.value = getOffsetDateString(businessDayStore.activeBusinessDate, -1);
  loadDailyStats();
}

function setThisMonth() {
  selectedMonth.value = getCurrentMonthString();
  loadMonthlyStats();
}

function setLastMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  selectedMonth.value = `${year}-${month}`;
  loadMonthlyStats();
}

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

const milkChartRef = ref(null);
const financialChartRef = ref(null);
let milkChartInstance = null;
let financialChartInstance = null;
let ChartClass = null;

async function loadDailyStats() {
  try {
    const data = await statsService.getDailyStats(selectedDate.value);
    if (data) {
      dailyStats.value = { ...dailyStats.value, ...data };
    }
    renderCharts();
  } catch (err) {
    console.error('Failed to load daily stats:', err);
  }
}

async function loadMonthlyStats() {
  try {
    const data = await statsService.getMonthlyStats(selectedMonth.value);
    if (data) {
      monthlyStats.value = { ...monthlyStats.value, ...data };
    }
    renderCharts();
  } catch (err) {
    console.error('Failed to load monthly stats:', err);
  }
}

async function refreshAll() {
  loading.value = true;
  try {
    await businessDayStore.refreshBusinessDay();
    selectedDate.value = businessDayStore.activeBusinessDate;
    await statsService.refreshDailyStats(selectedDate.value);
    await statsService.refreshMonthlyStats(selectedMonth.value);
    await loadDailyStats();
    await loadMonthlyStats();
  } finally {
    loading.value = false;
  }
}

async function renderCharts() {
  await nextTick();
  try {
    if (!ChartClass) {
      const chartModule = await import('chart.js');
      ChartClass = chartModule.Chart;
      ChartClass.register(...chartModule.registerables);
    }

    // 1. Milk Trend Chart
    if (milkChartRef.value) {
      if (milkChartInstance) milkChartInstance.destroy();
      const ctx = milkChartRef.value.getContext('2d');
      milkChartInstance = new ChartClass(ctx, {
        type: 'bar',
        data: {
          labels: ['Today Received', 'Today Dispatched', 'Monthly Avg Recv', 'Monthly Avg Disp'],
          datasets: [
            {
              label: 'Milk (Kg)',
              data: [
                dailyStats.value.milkReceivedToday || 0,
                dailyStats.value.milkDispatchedToday || 0,
                Math.round((monthlyStats.value.monthlyReceivedKg || 0) / 30),
                Math.round((monthlyStats.value.monthlyDispatched || 0) / 30),
              ],
              backgroundColor: ['#2196F3', '#063F78', '#90CAF9', '#1565C0'],
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { beginAtZero: true },
          },
        },
      });
    }

    // 2. Financial Chart
    if (financialChartRef.value) {
      if (financialChartInstance) financialChartInstance.destroy();
      const ctx2 = financialChartRef.value.getContext('2d');
      financialChartInstance = new ChartClass(ctx2, {
        type: 'doughnut',
        data: {
          labels: ['Income (Collection)', 'Expenses', 'Salaries Paid', 'Advances'],
          datasets: [
            {
              data: [
                monthlyStats.value.monthlyIncome || 0,
                monthlyStats.value.totalMonthlyExpense || 0,
                monthlyStats.value.salariesPaid || 0,
                monthlyStats.value.advancesGiven || 0,
              ],
              backgroundColor: ['#4CAF50', '#FF5252', '#009688', '#FF9800'],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
          },
        },
      });
    }
  } catch (err) {
    console.warn('Chart render delayed:', err);
  }
}

watch(
  () => businessDayStore.activeBusinessDate,
  (newDate, oldDate) => {
    if (selectedDate.value === oldDate || (businessDayStore.isLockedOnPreviousDay && selectedDate.value > newDate)) {
      selectedDate.value = newDate;
      selectedMonth.value = newDate.substring(0, 7);
      loadDailyStats();
    }
  }
);

onMounted(async () => {
  await businessDayStore.refreshBusinessDay();
  selectedDate.value = businessDayStore.activeBusinessDate;
  selectedMonth.value = businessDayStore.activeBusinessDate.substring(0, 7);

  // Load data immediately in parallel
  loadDailyStats();
  loadMonthlyStats();
});
</script>

<style scoped>
.dashboard-filter-group {
  gap: 12px;
}

.dashboard-filter-item {
  min-width: 240px;
  width: 260px;
}

.dashboard-metrics-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

@media (max-width: 1400px) {
  .dashboard-metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 960px) {
  .dashboard-metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .dashboard-filter-group {
    width: 100% !important;
    gap: 8px !important;
  }

  .dashboard-filter-item {
    width: 100% !important;
    min-width: 0 !important;
    flex: 1 1 100% !important;
  }

  .dashboard-refresh-btn {
    width: 100% !important;
  }

  .dashboard-metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px !important;
    margin-bottom: 16px !important;
  }
}
</style>

