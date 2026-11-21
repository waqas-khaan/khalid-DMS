<template>
  <!-- Mobile Native View (Auto-switched on mobile devices / viewports) -->
  <DashboardMobileView v-if="display.smAndDown.value" />

  <!-- Desktop View (Modern & Sophisticated Executive Redesign) -->
  <div v-else class="page-container dashboard-desktop-page">
    <!-- 1. Executive Top Header & Filter Toolbar -->
    <div class="desktop-header-wrapper mb-4">
      <div class="d-flex align-center justify-space-between flex-wrap gap-3">
        <!-- Title & Live Status -->
        <div>
          <div class="d-flex align-center gap-2-5">
            <h1 class="page-header-title mb-0">Dairy Operations Dashboard</h1>
            <span class="live-status-pill d-flex align-center gap-1-5">
              <span class="live-dot"></span>
              Live Operations
            </span>
          </div>
          <p class="page-header-subtitle mb-0 mt-1">
            Real-time daily metrics, milk movement, finances, and monthly statistics
          </p>
        </div>

        <!-- Integrated Filter Controls -->
        <div class="desktop-filter-toolbar d-flex align-center gap-2 flex-wrap">
          <!-- Quick Day Buttons -->
          <div class="quick-nav-pill-group">
            <button
              type="button"
              class="quick-pill-btn"
              :class="{ active: selectedDate === businessDayStore.activeBusinessDate }"
              @click="setDateToday"
            >
              Today
            </button>
            <button
              type="button"
              class="quick-pill-btn"
              :class="{ active: selectedDate === getOffsetDateString(businessDayStore.activeBusinessDate, -1) }"
              @click="setDateYesterday"
            >
              Yesterday
            </button>
          </div>

          <!-- Date Picker -->
          <div class="filter-picker-wrap date-wrap">
            <AppDatePicker
              v-model="selectedDate"
              label="Filter Date"
              density="compact"
              variant="outlined"
              hide-details
              @change="loadDailyStats"
            />
          </div>

          <!-- Month Picker -->
          <div class="filter-picker-wrap month-wrap">
            <AppMonthPicker
              v-model="selectedMonth"
              label="Filter Month"
              density="compact"
              variant="outlined"
              hide-details
              @change="loadMonthlyStats"
            />
          </div>

          <!-- Refresh Button -->
          <v-btn
            color="primary"
            variant="flat"
            class="desktop-refresh-btn font-weight-bold text-capitalize rounded-lg px-4"
            height="40"
            prepend-icon="mdi-refresh"
            :loading="loading"
            @click="refreshAll"
          >
            Refresh
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Working Day Lock Alert Banner (if locked on previous day) -->
    <div
      v-if="businessDayStore.isLockedOnPreviousDay"
      class="desktop-lock-alert mb-4 pa-3 px-4 rounded-xl border d-flex align-center justify-space-between bg-amber-50"
    >
      <div class="d-flex align-center gap-2-5">
        <v-icon color="amber-darken-3" size="20">mdi-lock-alert-outline</v-icon>
        <div>
          <strong class="text-amber-900 text-body-2">Business Day Closing Required:</strong>
          <span class="text-amber-800 text-body-2 ms-1">{{ businessDayStore.lockReason }}</span>
        </div>
      </div>
      <v-chip size="small" color="amber-darken-3" variant="flat" class="font-weight-bold">
        Previous Day Pending
      </v-chip>
    </div>

    <!-- Loading Indicator -->
    <v-progress-linear
      v-if="loading"
      indeterminate
      color="primary"
      height="3"
      class="mb-4 rounded"
    />

    <!-- SECTION 1: DAILY OVERVIEW -->
    <div class="mb-4">
      <div class="section-title-strip d-flex align-center justify-space-between mb-3">
        <div class="d-flex align-center gap-2">
          <div class="section-icon-dot bg-primary"></div>
          <h2 class="text-subtitle-1 font-weight-bold text-slate-800 mb-0">
            Daily Overview
          </h2>
          <span class="date-badge text-caption font-weight-bold">
            {{ formatDate(selectedDate) }}
          </span>
        </div>
        <div class="d-flex align-center gap-2">
          <span class="text-caption text-slate-500 font-weight-medium">
            Active Day: {{ formatDate(businessDayStore.activeBusinessDate) }}
          </span>
        </div>
      </div>

      <!-- 6 Daily Metrics Cards -->
      <div class="dashboard-metrics-grid">
        <!-- 1. Today Income -->
        <div class="desktop-kpi-card">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-tag">Today Income</span>
            <div class="kpi-icon-wrap icon-emerald">
              <v-icon size="18">mdi-cash-plus</v-icon>
            </div>
          </div>
          <div class="kpi-main-val text-emerald-600">
            {{ formatCurrency(dailyStats.totalIncome) }}
          </div>
          <div class="kpi-footer-sub">
            Cash collected from shops today
          </div>
        </div>

        <!-- 2. Available Cash -->
        <div class="desktop-kpi-card">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-tag">Available Cash</span>
            <div
              class="kpi-icon-wrap"
              :class="dailyStats.availableCashToday >= 0 ? 'icon-teal' : 'icon-rose'"
            >
              <v-icon size="18">
                {{ dailyStats.availableCashToday >= 0 ? 'mdi-cash-register' : 'mdi-alert-circle-outline' }}
              </v-icon>
            </div>
          </div>
          <div
            class="kpi-main-val"
            :class="dailyStats.availableCashToday >= 0 ? 'text-teal-700' : 'text-rose-600'"
          >
            {{ formatCurrency(dailyStats.availableCashToday) }}
          </div>
          <div class="kpi-footer-sub">
            Remaining cash in counter
          </div>
        </div>

        <!-- 3. Shop Arrears -->
        <div class="desktop-kpi-card">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-tag">Total Shop Arrears</span>
            <div class="kpi-icon-wrap icon-amber">
              <v-icon size="18">mdi-account-cash-outline</v-icon>
            </div>
          </div>
          <div class="kpi-main-val text-amber-700">
            {{ formatCurrency(dailyStats.totalArrears) }}
          </div>
          <div class="kpi-footer-sub">
            Outstanding balance across all shops
          </div>
        </div>

        <!-- 4. Milk Received Today -->
        <div class="desktop-kpi-card">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-tag">Milk Received</span>
            <div class="kpi-icon-wrap icon-sky">
              <v-icon size="18">mdi-water-check-outline</v-icon>
            </div>
          </div>
          <div class="kpi-main-val text-sky-700">
            {{ formatNumber(dailyStats.milkReceivedToday) }} <span class="text-caption font-weight-bold text-slate-500">Kg</span>
          </div>
          <div class="kpi-footer-sub">
            {{ formatNumber(dailyStats.milkReceivedTodayLiters) }} Liters received
          </div>
        </div>

        <!-- 5. Milk Dispatched Today -->
        <div class="desktop-kpi-card">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-tag">Milk Dispatched</span>
            <div class="kpi-icon-wrap icon-blue">
              <v-icon size="18">mdi-truck-delivery-outline</v-icon>
            </div>
          </div>
          <div class="kpi-main-val text-blue-700">
            {{ formatNumber(dailyStats.milkDispatchedToday) }} <span class="text-caption font-weight-bold text-slate-500">Kg</span>
          </div>
          <div class="kpi-footer-sub">
            Valued at {{ formatCurrency(dailyStats.todayDispatchAmount) }}
          </div>
        </div>

        <!-- 6. Total Expense Today -->
        <div class="desktop-kpi-card">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-tag">Total Expenses</span>
            <div class="kpi-icon-wrap icon-rose">
              <v-icon size="18">mdi-receipt-text-minus-outline</v-icon>
            </div>
          </div>
          <div class="kpi-main-val text-rose-600">
            {{ formatCurrency(dailyStats.totalExpenseToday) }}
          </div>
          <div class="kpi-footer-sub">
            Recorded daily operations cost
          </div>
        </div>
      </div>

      <!-- Integrated Expense Breakdown Widget -->
      <div class="expense-breakdown-card pa-4 rounded-xl border bg-white mb-2">
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="d-flex align-center gap-2">
            <v-icon size="18" color="slate-700">mdi-format-list-bulleted-type</v-icon>
            <span class="text-caption font-weight-black text-slate-800 text-uppercase tracking-wider">
              Today's Expenses by Category
            </span>
          </div>
          <span class="text-caption font-weight-bold text-rose-600">
            Total Today: {{ formatCurrency(dailyStats.totalExpenseToday) }}
          </span>
        </div>

        <div class="expense-mini-grid">
          <!-- Food Expense -->
          <div class="expense-mini-tile">
            <div class="d-flex align-center gap-2-5">
              <div class="mini-icon-circle icon-orange">
                <v-icon size="16">mdi-food-fork-drink</v-icon>
              </div>
              <div>
                <div class="mini-label">Food &amp; Meals</div>
                <div class="mini-sub">Staff meals &amp; tea</div>
              </div>
            </div>
            <div class="mini-value text-slate-900">
              {{ formatCurrency(dailyStats.foodExpense) }}
            </div>
          </div>

          <!-- Home Expense -->
          <div class="expense-mini-tile">
            <div class="d-flex align-center gap-2-5">
              <div class="mini-icon-circle icon-teal">
                <v-icon size="16">mdi-home-outline</v-icon>
              </div>
              <div>
                <div class="mini-label">Home &amp; Farm</div>
                <div class="mini-sub">Farm maintenance</div>
              </div>
            </div>
            <div class="mini-value text-slate-900">
              {{ formatCurrency(dailyStats.homeExpense) }}
            </div>
          </div>

          <!-- Transport Total -->
          <div class="expense-mini-tile">
            <div class="d-flex align-center gap-2-5">
              <div class="mini-icon-circle icon-blue">
                <v-icon size="16">mdi-truck-outline</v-icon>
              </div>
              <div>
                <div class="mini-label">Transport &amp; Fuel</div>
                <div class="mini-sub">
                  Diesel: <strong class="text-slate-700">{{ formatCurrency(dailyStats.dieselExpense) }}</strong> &bull;
                  Maint: <strong class="text-slate-700">{{ formatCurrency(dailyStats.maintenanceExpense) }}</strong>
                </div>
              </div>
            </div>
            <div class="mini-value text-slate-900">
              {{ formatCurrency(dailyStats.transportExpense) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 2: CHARTS -->
    <v-row class="mb-4" dense>
      <!-- Milk Trend Analysis -->
      <v-col cols="12" md="6">
        <div class="chart-container-card pa-4 rounded-xl border bg-white h-100">
          <div class="d-flex align-center justify-space-between mb-3">
            <div>
              <div class="d-flex align-center gap-2">
                <v-icon size="18" color="primary">mdi-chart-bar</v-icon>
                <h3 class="text-subtitle-1 font-weight-bold text-slate-800 mb-0">Milk Volume Comparison</h3>
              </div>
              <div class="text-caption text-slate-500 mt-0-5">Today arrivals &amp; dispatches volume (Kg)</div>
            </div>
            <span class="chart-tag-pill tag-blue">
              Milk Volume (Kg)
            </span>
          </div>

          <div style="height: 240px; position: relative;">
            <canvas ref="milkChartRef"></canvas>
          </div>
        </div>
      </v-col>

      <!-- Income vs Expense Chart -->
      <v-col cols="12" md="6">
        <div class="chart-container-card pa-4 rounded-xl border bg-white h-100">
          <div class="d-flex align-center justify-space-between mb-3">
            <div>
              <div class="d-flex align-center gap-2">
                <v-icon size="18" color="success">mdi-chart-donut</v-icon>
                <h3 class="text-subtitle-1 font-weight-bold text-slate-800 mb-0">Financial Performance</h3>
              </div>
              <div class="text-caption text-slate-500 mt-0-5">Income collections vs. expenses for {{ selectedMonth }}</div>
            </div>
            <span class="chart-tag-pill tag-green">
              Financial Breakdown
            </span>
          </div>

          <div style="height: 240px; position: relative;">
            <canvas ref="financialChartRef"></canvas>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- SECTION 3: MONTHLY SUMMARY -->
    <div class="mt-2">
      <div class="section-title-strip d-flex align-center justify-space-between mb-3">
        <div class="d-flex align-center gap-2">
          <div class="section-icon-dot bg-indigo-600"></div>
          <h2 class="text-subtitle-1 font-weight-bold text-slate-800 mb-0">
            Monthly Performance Summary
          </h2>
          <span class="month-badge text-caption font-weight-bold">
            {{ selectedMonth }}
          </span>
        </div>
        <div class="quick-month-nav d-flex align-center gap-1">
          <button
            type="button"
            class="month-pill-btn"
            :class="{ active: selectedMonth === getCurrentMonthString() }"
            @click="setThisMonth"
          >
            This Month
          </button>
          <button
            type="button"
            class="month-pill-btn"
            @click="setLastMonth"
          >
            Last Month
          </button>
        </div>
      </div>

      <!-- 6 Monthly KPI Cards -->
      <div class="dashboard-metrics-grid">
        <!-- Monthly Income -->
        <div class="desktop-kpi-card">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-tag">Monthly Income</span>
            <div class="kpi-icon-wrap icon-emerald">
              <v-icon size="18">mdi-cash-register</v-icon>
            </div>
          </div>
          <div class="kpi-main-val text-emerald-600">
            {{ formatCurrency(monthlyStats.monthlyIncome) }}
          </div>
          <div class="kpi-footer-sub">
            Collections this month
          </div>
        </div>

        <!-- Monthly Milk Received -->
        <div class="desktop-kpi-card">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-tag">Milk Received</span>
            <div class="kpi-icon-wrap icon-sky">
              <v-icon size="18">mdi-water-outline</v-icon>
            </div>
          </div>
          <div class="kpi-main-val text-sky-700">
            {{ formatNumber(monthlyStats.monthlyReceivedKg) }} <span class="text-caption font-weight-bold text-slate-500">Kg</span>
          </div>
          <div class="kpi-footer-sub">
            {{ formatNumber(monthlyStats.monthlyReceivedLiters) }} Liters total
          </div>
        </div>

        <!-- Monthly Milk Dispatched -->
        <div class="desktop-kpi-card">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-tag">Milk Dispatched</span>
            <div class="kpi-icon-wrap icon-blue">
              <v-icon size="18">mdi-truck-fast-outline</v-icon>
            </div>
          </div>
          <div class="kpi-main-val text-blue-700">
            {{ formatNumber(monthlyStats.monthlyDispatched) }} <span class="text-caption font-weight-bold text-slate-500">Kg</span>
          </div>
          <div class="kpi-footer-sub">
            Total distributed this month
          </div>
        </div>

        <!-- Monthly Total Expense -->
        <div class="desktop-kpi-card">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-tag">Total Expenses</span>
            <div class="kpi-icon-wrap icon-rose">
              <v-icon size="18">mdi-receipt-text-outline</v-icon>
            </div>
          </div>
          <div class="kpi-main-val text-rose-600">
            {{ formatCurrency(monthlyStats.totalMonthlyExpense) }}
          </div>
          <div class="kpi-footer-sub">
            Operating costs recorded
          </div>
        </div>

        <!-- Salaries Paid -->
        <div class="desktop-kpi-card">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-tag">Salaries Paid</span>
            <div class="kpi-icon-wrap icon-teal">
              <v-icon size="18">mdi-account-group-outline</v-icon>
            </div>
          </div>
          <div class="kpi-main-val text-teal-700">
            {{ formatCurrency(monthlyStats.salariesPaid) }}
          </div>
          <div class="kpi-footer-sub">
            Staff payroll cleared
          </div>
        </div>

        <!-- Advances Given -->
        <div class="desktop-kpi-card">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-tag">Staff Advances</span>
            <div class="kpi-icon-wrap icon-amber">
              <v-icon size="18">mdi-hand-coin-outline</v-icon>
            </div>
          </div>
          <div class="kpi-main-val text-amber-700">
            {{ formatCurrency(monthlyStats.advancesGiven) }}
          </div>
          <div class="kpi-footer-sub">
            Staff loan advances issued
          </div>
        </div>
      </div>
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
          labels: ['Today Received', 'Today Dispatched'],
          datasets: [
            {
              label: 'Milk (Kg)',
              data: [
                dailyStats.value.milkReceivedToday || 0,
                dailyStats.value.milkDispatchedToday || 0,
              ],
              backgroundColor: ['#0284C7', '#063F78'],
              borderRadius: 8,
              borderSkipped: false,
              barPercentage: 0.5,
              maxBarThickness: 64,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0F172A',
              titleColor: '#F8FAFC',
              bodyColor: '#F8FAFC',
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => ` ${ctx.parsed.y.toLocaleString()} Kg`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#64748B', font: { weight: '600', size: 11 } },
            },
            y: {
              beginAtZero: true,
              grid: { color: '#F1F5F9' },
              ticks: { color: '#64748B', font: { size: 11 } },
            },
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
              backgroundColor: ['#10B981', '#F43F5E', '#0D9488', '#F59E0B'],
              borderWidth: 2,
              borderColor: '#FFFFFF',
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                boxHeight: 12,
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 16,
                color: '#334155',
                font: { size: 11.5, weight: '600' },
              },
            },
            tooltip: {
              backgroundColor: '#0F172A',
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => ` ${ctx.label}: Rs. ${Number(ctx.raw).toLocaleString()}`,
              },
            },
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
.dashboard-desktop-page {
  padding-bottom: 32px;
}

/* Header & Filter Deck */
.desktop-header-wrapper {
  background: transparent;
}

.live-status-pill {
  font-size: 0.72rem;
  font-weight: 700;
  color: #059669;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 20px;
  padding: 3px 10px;
  letter-spacing: 0.3px;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
  70% { transform: scale(1); box-shadow: 0 0 0 5px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.quick-nav-pill-group {
  display: flex;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 2px;
}

.quick-pill-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.quick-pill-btn:hover {
  color: #0f172a;
}

.quick-pill-btn.active {
  background: linear-gradient(135deg, #063F78 0%, #0284c7 100%) !important;
  color: #ffffff !important;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(6, 63, 120, 0.3) !important;
}

.filter-picker-wrap.date-wrap {
  min-width: 215px;
  width: 220px;
}

.filter-picker-wrap.month-wrap {
  min-width: 195px;
  width: 200px;
}

.desktop-refresh-btn {
  background: #063F78 !important;
  color: #ffffff !important;
  box-shadow: 0 2px 6px rgba(6, 63, 120, 0.2);
}

.desktop-refresh-btn:hover {
  background: #053361 !important;
}

/* Operational Lock Alert */
.desktop-lock-alert {
  border-color: #fde68a;
}

/* Section Title Strips */
.section-icon-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.date-badge,
.month-badge {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 2px 8px;
}

.quick-month-nav {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 2px;
}

.month-pill-btn {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.month-pill-btn:hover {
  color: #0f172a;
}

.month-pill-btn.active {
  background: linear-gradient(135deg, #063F78 0%, #0284c7 100%) !important;
  color: #ffffff !important;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(6, 63, 120, 0.3) !important;
}

/* Metrics Grid (6 Columns) */
.dashboard-metrics-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

@media (max-width: 1440px) {
  .dashboard-metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 960px) {
  .dashboard-metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop KPI Card */
.desktop-kpi-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 118px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 25px -4px rgba(15, 23, 42, 0.12), 0 4px 10px -2px rgba(15, 23, 42, 0.06);
}

.desktop-kpi-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 36px -4px rgba(15, 23, 42, 0.18), 0 8px 16px -2px rgba(15, 23, 42, 0.08);
  border-color: #cbd5e1;
}

/* Accent Borders on Top of Cards */
.desktop-kpi-card:has(.icon-emerald) { border-top: 3px solid #10b981; }
.desktop-kpi-card:has(.icon-teal)    { border-top: 3px solid #0d9488; }
.desktop-kpi-card:has(.icon-amber)   { border-top: 3px solid #f59e0b; }
.desktop-kpi-card:has(.icon-sky)     { border-top: 3px solid #0284c7; }
.desktop-kpi-card:has(.icon-blue)    { border-top: 3px solid #063F78; }
.desktop-kpi-card:has(.icon-rose)    { border-top: 3px solid #ef4444; }
.desktop-kpi-card:has(.icon-purple)  { border-top: 3px solid #8b5cf6; }
.desktop-kpi-card:has(.icon-orange)  { border-top: 3px solid #f97316; }

.kpi-tag {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.kpi-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-emerald { background: #ecfdf5; color: #059669; }
.icon-teal    { background: #f0fdfa; color: #0d9488; }
.icon-amber   { background: #fffbeb; color: #d97706; }
.icon-sky     { background: #f0f9ff; color: #0284c7; }
.icon-blue    { background: #eff6ff; color: #063F78; }
.icon-rose    { background: #fff1f2; color: #e11d48; }
.icon-purple  { background: #f5f3ff; color: #7c3aed; }
.icon-orange  { background: #fff7ed; color: #ea580c; }

.kpi-main-val {
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.25;
  color: #0f172a;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  margin: 4px 0;
}

.kpi-footer-sub {
  font-size: 0.72rem;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Expense Breakdown Card */
.expense-breakdown-card {
  border-color: #e2e8f0;
  box-shadow: 0 10px 25px -4px rgba(15, 23, 42, 0.1), 0 4px 10px -2px rgba(15, 23, 42, 0.05);
}

.expense-mini-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 960px) {
  .expense-mini-grid {
    grid-template-columns: 1fr;
  }
}

.expense-mini-tile {
  background: #f8fafc;
  border: 1.5px solid #000000;
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.06);
  transition: all 0.2s ease;
}

.expense-mini-tile:hover {
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
  transform: translateY(-2px);
  border-color: #000000;
}

.mini-icon-circle {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mini-label {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.mini-sub {
  font-size: 0.68rem;
  color: #64748b;
  margin-top: 2px;
}

.mini-value {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* Charts Card */
.chart-container-card {
  border-color: #e2e8f0;
  box-shadow: 0 10px 25px -4px rgba(15, 23, 42, 0.1), 0 4px 10px -2px rgba(15, 23, 42, 0.05);
  transition: all 0.2s ease;
}

.chart-container-card:hover {
  box-shadow: 0 16px 32px -4px rgba(15, 23, 42, 0.14);
}

.chart-tag-pill {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 0.3px;
}

.tag-blue {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.tag-green {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}
</style>
