<template>
  <div class="mobile-expenses-page pb-16">
    <!-- 1. Sticky Mobile App Header -->
    <header class="mobile-app-header px-4 py-3 bg-white border-b sticky-top">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center gap-2">
          <div class="header-icon-box">
            <v-icon color="error" size="20">mdi-cash-minus</v-icon>
          </div>
          <div>
            <h1 class="text-subtitle-1 font-weight-black text-slate-900 line-height-tight mb-0">
              Expenses
            </h1>
            <span class="text-caption text-grey-darken-1 font-weight-medium" style="font-size: 0.72rem !important;">
              Daily & Monthly Expense Log
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
          @click="loadExpenses"
        >
          <v-icon size="18">mdi-refresh</v-icon>
        </v-btn>
      </div>

      <!-- Quick Day Stepper -->
      <div class="mobile-date-stepper d-flex align-center justify-space-between gap-1 p-1 bg-slate-100 rounded-lg border">
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
            {{ filterDate ? formatDate(filterDate) : 'All Recorded Dates' }}
          </span>
          <v-chip
            v-if="filterDate === businessDayStore.activeBusinessDate"
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
        <!-- Card 1: Overall Expenses -->
        <div class="mobile-kpi-card expense-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Overall Total</span>
            <div class="kpi-icon-badge bg-rose-50 text-rose-600">
              <v-icon size="16">mdi-cash-minus</v-icon>
            </div>
          </div>
          <div class="kpi-value text-rose-600">
            {{ formatCurrency(totals.overall) }}
          </div>
          <div class="kpi-subtitle">
            {{ filteredExpenses.length }} transaction(s)
          </div>
        </div>

        <!-- Card 2: Food Expenses -->
        <div class="mobile-kpi-card pa-3 bg-white" style="border-top: 3px solid #f59e0b !important;">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Food & Staff</span>
            <div class="kpi-icon-badge bg-amber-50 text-amber-700">
              <v-icon size="16">mdi-food</v-icon>
            </div>
          </div>
          <div class="kpi-value text-amber-800">
            {{ formatCurrency(totals.food) }}
          </div>
          <div class="kpi-subtitle">
            Mess & tea supplies
          </div>
        </div>

        <!-- Card 3: Home & Farm -->
        <div class="mobile-kpi-card pa-3 bg-white" style="border-top: 3px solid #0d9488 !important;">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Home & Farm</span>
            <div class="kpi-icon-badge bg-teal-50 text-teal-700">
              <v-icon size="16">mdi-home</v-icon>
            </div>
          </div>
          <div class="kpi-value text-teal-700">
            {{ formatCurrency(totals.home) }}
          </div>
          <div class="kpi-subtitle">
            Maintenance & utilities
          </div>
        </div>

        <!-- Card 4: Transport Total -->
        <div class="mobile-kpi-card transport-kpi-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Transport Total</span>
            <div class="kpi-icon-badge bg-indigo-50 text-indigo-600">
              <v-icon size="16">mdi-gas-station</v-icon>
            </div>
          </div>
          <div class="kpi-value text-indigo-700">
            {{ formatCurrency(totals.transport) }}
          </div>
          <div class="kpi-subtitle">
            Fuel & repairs
          </div>
        </div>
      </div>

      <!-- 3. Category Filter Pills -->
      <div class="mb-3">
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search description, vehicle, notes..."
          variant="outlined"
          density="compact"
          hide-details
          class="bg-white rounded-lg mb-2"
          clearable
        />

        <div class="d-flex align-center gap-1-5 overflow-x-auto pb-1">
          <button
            type="button"
            class="filter-pill-btn"
            :class="{ active: selectedCategory === 'all' }"
            @click="selectedCategory = 'all'"
          >
            All ({{ expenses.length }})
          </button>
          <button
            type="button"
            class="filter-pill-btn"
            :class="{ active: selectedCategory === 'food' }"
            @click="selectedCategory = 'food'"
          >
            Food
          </button>
          <button
            type="button"
            class="filter-pill-btn"
            :class="{ active: selectedCategory === 'home' }"
            @click="selectedCategory = 'home'"
          >
            Home
          </button>
          <button
            type="button"
            class="filter-pill-btn"
            :class="{ active: selectedCategory === 'transport' }"
            @click="selectedCategory = 'transport'"
          >
            Transport
          </button>
          <button
            type="button"
            class="filter-pill-btn"
            :class="{ active: selectedCategory === 'other' }"
            @click="selectedCategory = 'other'"
          >
            Other
          </button>
        </div>
      </div>

      <!-- 4. Expense Cards List (Native Mobile Read-Only) -->
      <div class="mobile-section-header mb-2 d-flex align-center justify-space-between">
        <span class="text-caption font-weight-bold text-slate-800 text-uppercase">
          Expenses Ledger ({{ filteredExpenses.length }})
        </span>
        <button
          v-if="filterDate"
          type="button"
          class="text-caption text-primary font-weight-bold cursor-pointer"
          @click="filterDate = null; loadExpenses()"
        >
          View All Dates
        </button>
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredExpenses.length === 0"
        class="pa-6 bg-white rounded-xl border text-center text-grey-darken-1 shadow-xs mb-3"
      >
        <v-icon size="40" color="grey-lighten-1" class="mb-2">mdi-receipt-text-arrow-right-outline</v-icon>
        <div class="font-weight-bold text-body-2 text-slate-800">No Expenses Recorded</div>
        <div class="text-caption text-grey">
          {{ filterDate ? `No expenses logged for ${formatDate(filterDate)}.` : 'No expenses match the selected filters.' }}
        </div>
      </div>

      <!-- Expense Cards -->
      <div v-else class="d-flex flex-column gap-2-5">
        <div
          v-for="item in paginatedExpenses"
          :key="item.id"
          class="mobile-item-card bg-white border rounded-xl shadow-xs overflow-hidden"
        >
          <!-- Card Top Bar -->
          <div class="pa-3 bg-slate-50 border-b d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-2">
              <v-avatar size="24" :color="getCategoryColor(item.category)" variant="tonal">
                <v-icon size="13">{{ getCategoryIcon(item.category) }}</v-icon>
              </v-avatar>
              <div>
                <span class="font-weight-black text-body-2 text-slate-900 line-height-tight d-block">
                  {{ item.category }}
                  <span v-if="item.subCategory" class="text-caption text-grey font-weight-medium">({{ item.subCategory }})</span>
                </span>
                <span class="text-caption text-slate-600 font-weight-medium" style="font-size: 0.72rem !important;">
                  {{ formatDate(item.date) }}
                </span>
              </div>
            </div>

            <div class="text-end">
              <span class="text-h6 font-weight-black text-error line-height-tight">
                {{ formatCurrency(item.amount) }}
              </span>
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-3">
            <div v-if="item.vehicleNumber" class="d-flex align-center gap-1-5 mb-1-5">
              <v-chip size="x-small" color="orange-darken-3" variant="tonal" class="font-weight-bold">
                <v-icon start size="11">mdi-car</v-icon>
                {{ item.vehicleNumber }}
              </v-chip>
            </div>

            <div v-if="item.notes" class="text-caption text-slate-700 font-weight-medium">
              {{ item.notes }}
            </div>
            <div v-else class="text-caption text-grey fst-italic">
              No notes provided
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
          v-model="filterDate"
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
import { expenseService } from '@/services/expenseService';
import { useBusinessDayStore } from '@/stores/businessDay';
import { formatCurrency, formatDate, getOffsetDateString } from '@/utils/formatters';
import AppDatePicker from '@/components/common/AppDatePicker.vue';

const businessDayStore = useBusinessDayStore();

const loading = ref(false);
const datePickerModal = ref(false);
const filterDate = ref(businessDayStore.activeBusinessDate);
const expenses = ref([]);
const searchQuery = ref('');
const selectedCategory = ref('all');
const page = ref(1);
const itemsPerPage = 10;

const totals = computed(() => {
  let overall = 0;
  let food = 0;
  let home = 0;
  let transport = 0;

  for (const e of expenses.value) {
    const amt = Number(e.amount) || 0;
    overall += amt;
    const cat = (e.category || '').toLowerCase();
    if (cat.includes('food')) food += amt;
    else if (cat.includes('home')) home += amt;
    else if (cat.includes('transport')) transport += amt;
  }

  return { overall, food, home, transport };
});

const filteredExpenses = computed(() => {
  return expenses.value.filter((item) => {
    // Category filter
    if (selectedCategory.value !== 'all') {
      const cat = (item.category || '').toLowerCase();
      if (!cat.includes(selectedCategory.value)) return false;
    }

    // Search query
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const matchCat = item.category?.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      const matchVehicle = item.vehicleNumber?.toLowerCase().includes(q);
      if (!matchCat && !matchNotes && !matchVehicle) return false;
    }
    return true;
  });
});

const totalPages = computed(() => Math.ceil(filteredExpenses.value.length / itemsPerPage) || 1);

const paginatedExpenses = computed(() => {
  const start = (page.value - 1) * itemsPerPage;
  return filteredExpenses.value.slice(start, start + itemsPerPage);
});

function stepDay(offset) {
  if (!filterDate.value) {
    filterDate.value = businessDayStore.activeBusinessDate;
  }
  filterDate.value = getOffsetDateString(filterDate.value, offset);
  loadExpenses();
}

function onDateChanged() {
  datePickerModal.value = false;
  loadExpenses();
}

function getCategoryColor(cat = '') {
  const c = cat.toLowerCase();
  if (c.includes('food')) return 'primary';
  if (c.includes('home')) return 'teal';
  if (c.includes('transport')) return 'orange-darken-3';
  return 'secondary';
}

function getCategoryIcon(cat = '') {
  const c = cat.toLowerCase();
  if (c.includes('food')) return 'mdi-food';
  if (c.includes('home')) return 'mdi-home';
  if (c.includes('transport')) return 'mdi-gas-station';
  return 'mdi-shape';
}

async function loadExpenses() {
  loading.value = true;
  page.value = 1;
  try {
    expenses.value = await expenseService.getExpenses({
      date: filterDate.value || null,
    });
  } catch (err) {
    console.warn('Failed to load expenses on mobile:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await businessDayStore.refreshBusinessDay();
  if (!filterDate.value) {
    filterDate.value = businessDayStore.activeBusinessDate || businessDayStore.realToday;
  }
  await loadExpenses();
});
</script>

<style scoped>
.mobile-expenses-page {
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
  background-color: #fee2e2;
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
  background: #e11d48;
  color: #ffffff;
  border-color: #e11d48;
}

.mobile-item-card {
  border: 1px solid #e2e8f0 !important;
  border-radius: 12px !important;
}
</style>

