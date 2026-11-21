<template>
  <div class="mobile-arrivals-page pb-16">
    <!-- 1. Sticky Mobile App Header (Executive Style) -->
    <header class="mobile-app-header px-4 py-3 bg-white border-b sticky-top">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center gap-2">
          <div class="header-icon-box">
            <v-icon color="primary" size="20">mdi-truck-delivery</v-icon>
          </div>
          <div>
            <h1 class="text-subtitle-1 font-weight-black text-slate-900 line-height-tight mb-0">
              Milk Arrivals
            </h1>
            <span class="text-caption text-grey-darken-1 font-weight-medium" style="font-size: 0.72rem !important;">
              Daily Inbound Milk Log
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
          @click="loadArrivals"
        >
          <v-icon size="18">mdi-refresh</v-icon>
        </v-btn>
      </div>

      <!-- Quick Day Stepper & Inspector -->
      <div class="mobile-date-stepper d-flex align-center justify-space-between gap-1 pa-1 bg-slate-100 rounded-lg border">
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
            {{ selectedDate ? formatDate(selectedDate) : 'All Recorded Dates' }}
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
        </div>

        <button
          type="button"
          class="stepper-arrow-btn"
          title="Next Day"
          @click="stepDay(1)"
        >
          <v-icon size="20">mdi-chevron-right</v-icon>
        </button>
      </div>
    </header>

    <div class="px-3 pt-3">
      <!-- 2. Daily Summary Metric Cards (2x2 Grid) -->
      <div class="mobile-kpi-grid mb-3">
        <!-- Card 1: Milk Kg -->
        <div class="mobile-kpi-card milk-in-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Total Milk (Kg)</span>
            <div class="kpi-icon-badge bg-sky-50 text-sky-600">
              <v-icon size="16">mdi-water-outline</v-icon>
            </div>
          </div>
          <div class="kpi-value text-sky-700">
            {{ formatNumber(dailyTotals.totalKg) }} <span class="kpi-unit">Kg</span>
          </div>
          <div class="kpi-subtitle">
            Est: {{ formatCurrency(dailyTotals.totalKg * masterMilkPrice) }}
          </div>
        </div>

        <!-- Card 2: Milk Liters -->
        <div class="mobile-kpi-card milk-out-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Total Liters</span>
            <div class="kpi-icon-badge bg-blue-50 text-blue-600">
              <v-icon size="16">mdi-cup-water</v-icon>
            </div>
          </div>
          <div class="kpi-value text-blue-700">
            {{ formatNumber(dailyTotals.totalLiters) }} <span class="kpi-unit">L</span>
          </div>
          <div class="kpi-subtitle">
            Factor: {{ factor }} Kg/L
          </div>
        </div>

        <!-- Card 3: Available Cash -->
        <div class="mobile-kpi-card cash-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Available Cash</span>
            <div class="kpi-icon-badge bg-teal-50 text-teal-700">
              <v-icon size="16">mdi-cash</v-icon>
            </div>
          </div>
          <div class="kpi-value text-teal-700">
            {{ formatCurrency(dailyTotals.totalAvailableCash) }}
          </div>
          <div class="kpi-subtitle">
            Arrival cash pool
          </div>
        </div>

        <!-- Card 4: Total Entries -->
        <div class="mobile-kpi-card income-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Batches Recorded</span>
            <div class="kpi-icon-badge bg-emerald-50 text-emerald-600">
              <v-icon size="16">mdi-check-decagram</v-icon>
            </div>
          </div>
          <div class="kpi-value text-emerald-600">
            {{ dailyTotals.count }} <span class="kpi-unit">Batches</span>
          </div>
          <div class="kpi-subtitle">
            Recorded on farm
          </div>
        </div>
      </div>

      <!-- 3. Search Bar -->
      <div class="mb-3">
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search by source or notes..."
          variant="outlined"
          density="compact"
          hide-details
          class="bg-white rounded-lg"
          clearable
        />
      </div>

      <!-- 4. Inbound Arrivals Card List (Native Mobile Read-Only) -->
      <div class="mobile-section-header mb-2 d-flex align-center justify-space-between">
        <span class="text-caption font-weight-bold text-slate-800 text-uppercase">
          Inbound Milk Records ({{ filteredArrivals.length }})
        </span>
        <button
          v-if="selectedDate"
          type="button"
          class="text-caption text-primary font-weight-bold cursor-pointer"
          @click="selectedDate = null; loadArrivals()"
        >
          View All Dates
        </button>
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredArrivals.length === 0"
        class="pa-6 bg-white rounded-xl border text-center text-grey-darken-1 shadow-xs mb-3"
      >
        <v-icon size="40" color="grey-lighten-1" class="mb-2">mdi-cup-off-outline</v-icon>
        <div class="font-weight-bold text-body-2 text-slate-800">No Milk Arrivals Found</div>
        <div class="text-caption text-grey">
          {{ selectedDate ? `No batches recorded for ${formatDate(selectedDate)}.` : 'No arrival records matching your criteria.' }}
        </div>
      </div>

      <!-- Arrivals Cards -->
      <div v-else class="d-flex flex-column gap-2-5">
        <div
          v-for="item in paginatedArrivals"
          :key="item.id"
          class="mobile-item-card bg-white border rounded-xl shadow-xs overflow-hidden"
        >
          <!-- Card Top Bar -->
          <div class="pa-3 bg-slate-50 border-b d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-2">
              <v-avatar size="26" :color="getSourceColor(item.source)" variant="tonal" class="rounded-lg">
                <v-icon size="14">{{ getSourceIcon(item.source) }}</v-icon>
              </v-avatar>
              <div>
                <span class="font-weight-black text-body-2 text-slate-900 line-height-tight d-block">
                  {{ item.source || 'Farm Collection' }}
                </span>
                <span class="text-caption text-slate-600 font-weight-medium" style="font-size: 0.72rem !important;">
                  {{ formatDate(item.date) }}
                </span>
              </div>
            </div>

            <v-chip size="x-small" :color="getSourceColor(item.source)" variant="flat" class="font-weight-bold">
              {{ item.unit || 'Liter' }}
            </v-chip>
          </div>

          <!-- Card Content Ribbon -->
          <div class="pa-3 bg-white">
            <div class="mobile-stats-row d-flex align-center justify-space-between">
              <div>
                <span class="stat-mini-label text-slate-600 text-uppercase">MILK QUANTITY</span>
                <div class="font-weight-black text-body-1 text-sky-700 my-0-5">
                  {{ formatNumber(item.quantityKg) }} <span class="text-caption font-weight-bold text-sky-800">Kg</span>
                </div>
                <span class="text-caption text-slate-600 font-weight-medium d-block" style="font-size: 0.72rem !important;">
                  {{ formatNumber(item.quantityLiters) }} Liters<span v-if="item.unit && item.unit !== 'Liter'"> ({{ formatNumber(item.quantity) }} {{ item.unit }})</span>
                </span>
              </div>

              <div class="text-end">
                <span class="stat-mini-label text-slate-600 text-uppercase">AVAILABLE CASH</span>
                <div class="font-weight-black text-body-1 text-teal-700 my-0-5">
                  {{ formatCurrency(item.availableCash || 0) }}
                </div>
                <span class="text-caption text-slate-600 font-weight-medium d-block" style="font-size: 0.72rem !important;">
                  Arrival Cash Pool
                </span>
              </div>
            </div>

            <div v-if="item.notes" class="mt-2-5 pt-2 border-t d-flex align-center gap-1-5 text-caption text-slate-600">
              <v-icon size="13" color="grey-darken-1">mdi-note-text-outline</v-icon>
              <span class="fst-italic">{{ item.notes }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Pagination -->
      <div v-if="totalPages > 1" class="d-flex align-center justify-space-between mt-3 px-1">
        <v-btn
          size="small"
          variant="tonal"
          color="primary"
          :disabled="page === 1"
          class="text-capitalize font-weight-bold rounded-lg"
          @click="page--"
        >
          Previous
        </v-btn>
        <span class="text-caption text-grey-darken-2 font-weight-bold">
          Page {{ page }} of {{ totalPages }}
        </span>
        <v-btn
          size="small"
          variant="tonal"
          color="primary"
          :disabled="page >= totalPages"
          class="text-capitalize font-weight-bold rounded-lg"
          @click="page++"
        >
          Next
        </v-btn>
      </div>
    </div>

    <!-- Date Picker Dialog -->
    <v-dialog v-model="datePickerModal" max-width="320">
      <v-card class="pa-3 rounded-xl">
        <AppDatePicker
          v-model="selectedDate"
          label="Select Inspection Date"
          hide-details
          @change="onDateChanged"
        />
        <v-card-actions class="px-0 pt-2 justify-end">
          <v-btn
            variant="text"
            size="small"
            color="primary"
            class="text-capitalize font-weight-bold"
            @click="datePickerModal = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { milkService } from '@/services/milkService';
import { useSettingsStore } from '@/stores/settings';
import { useBusinessDayStore } from '@/stores/businessDay';
import { formatCurrency, formatNumber, formatDate, getOffsetDateString } from '@/utils/formatters';
import AppDatePicker from '@/components/common/AppDatePicker.vue';

const settingsStore = useSettingsStore();
const businessDayStore = useBusinessDayStore();

const loading = ref(false);
const datePickerModal = ref(false);
const selectedDate = ref(businessDayStore.activeBusinessDate);
const arrivals = ref([]);
const searchQuery = ref('');
const sourceFilter = ref('all');
const page = ref(1);
const itemsPerPage = 10;

const factor = computed(() => Number(settingsStore.settings.literToKgFactor) || 1.03);
const masterMilkPrice = computed(() => Number(settingsStore.settings.defaultMilkPrice) || 180);

const filteredArrivals = computed(() => {
  return arrivals.value.filter((item) => {
    // Search query
    if (searchQuery.value && searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const matchSource = (item.source || '').toLowerCase().includes(q);
      const matchNotes = (item.notes || '').toLowerCase().includes(q);
      if (!matchSource && !matchNotes) return false;
    }
    return true;
  });
});

const totalPages = computed(() => Math.ceil(filteredArrivals.value.length / itemsPerPage) || 1);

const paginatedArrivals = computed(() => {
  const start = (page.value - 1) * itemsPerPage;
  return filteredArrivals.value.slice(start, start + itemsPerPage);
});

const dailyTotals = computed(() => {
  let totalKg = 0;
  let totalLiters = 0;
  let totalAvailableCash = 0;

  for (const a of arrivals.value) {
    totalKg += Number(a.quantityKg) || 0;
    totalLiters += Number(a.quantityLiters) || 0;
    totalAvailableCash += Number(a.availableCash) || 0;
  }

  return {
    count: arrivals.value.length,
    totalKg,
    totalLiters,
    totalAvailableCash,
  };
});

function stepDay(offset) {
  if (!selectedDate.value) {
    selectedDate.value = businessDayStore.activeBusinessDate;
  }
  selectedDate.value = getOffsetDateString(selectedDate.value, offset);
  loadArrivals();
}

function onDateChanged() {
  datePickerModal.value = false;
  loadArrivals();
}

function getSourceColor(source = '') {
  const s = source.toLowerCase();
  if (s.includes('morning')) return 'primary';
  if (s.includes('evening')) return 'warning';
  if (s.includes('supplier')) return 'secondary';
  return 'info';
}

function getSourceIcon(source = '') {
  const s = source.toLowerCase();
  if (s.includes('morning')) return 'mdi-weather-sunny';
  if (s.includes('evening')) return 'mdi-weather-night';
  if (s.includes('supplier')) return 'mdi-factory';
  return 'mdi-cow';
}

async function loadArrivals() {
  loading.value = true;
  page.value = 1;
  try {
    arrivals.value = await milkService.getMilkArrivals(selectedDate.value || null);
  } catch (err) {
    console.warn('Failed to load arrivals on mobile:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await Promise.all([settingsStore.loadSettings(), businessDayStore.refreshBusinessDay()]);
  if (!selectedDate.value) {
    selectedDate.value = businessDayStore.activeBusinessDate || businessDayStore.realToday;
  }
  await loadArrivals();
});
</script>

<style scoped>
.mobile-arrivals-page {
  background-color: #f8fafc;
  min-height: 100vh;
}

.sticky-top {
  position: sticky;
  top: 56px;
  z-index: 30;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
  width: 32px;
  height: 32px;
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

.mobile-kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 10px !important;
}

.mobile-kpi-card {
  background: #ffffff;
  border: 1px solid #e2e8f0 !important;
  border-radius: 14px !important;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04) !important;
}

.income-card { border-top: 3px solid #10b981 !important; }
.cash-card { border-top: 3px solid #0d9488 !important; }
.arrears-card { border-top: 3px solid #f59e0b !important; }
.milk-in-card { border-top: 3px solid #0284c7 !important; }
.milk-out-card { border-top: 3px solid #3b82f6 !important; }
.expense-card { border-top: 3px solid #ef4444 !important; }

.mobile-item-card {
  border: 1px solid #cbd5e1 !important;
  border-radius: 12px !important;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05) !important;
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

.stat-mini-label {
  font-size: 0.65rem !important;
  font-weight: 700;
  letter-spacing: 0.03em;
  display: block;
}
</style>

