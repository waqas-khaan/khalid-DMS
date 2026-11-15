<template>
  <div class="mobile-dispatch-page pb-16">
    <!-- 1. Sticky Mobile App Header -->
    <header class="mobile-app-header px-4 py-3 bg-white border-b sticky-top">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center gap-2">
          <div class="header-icon-box">
            <v-icon color="primary" size="20">mdi-truck-fast</v-icon>
          </div>
          <div>
            <h1 class="text-subtitle-1 font-weight-black text-slate-900 line-height-tight mb-0">
              Milk Dispatch
            </h1>
            <span class="text-caption text-grey-darken-1 font-weight-medium" style="font-size: 0.72rem !important;">
              Route Delivery & Shop Distributions
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
          @click="loadDispatches"
        >
          <v-icon size="18">mdi-refresh</v-icon>
        </v-btn>
      </div>

      <!-- Quick Day Stepper -->
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
        <!-- Card 1: Milk Sent -->
        <div class="mobile-kpi-card milk-out-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Milk Sent</span>
            <div class="kpi-icon-badge bg-blue-50 text-blue-600">
              <v-icon size="16">mdi-bottle-tonic-plus</v-icon>
            </div>
          </div>
          <div class="kpi-value text-blue-700">
            {{ formatNumber(totals.milkSent) }} <span class="kpi-unit">Kg</span>
          </div>
          <div class="kpi-subtitle">
            {{ dateDispatches.length }} routes dispatched
          </div>
        </div>

        <!-- Card 2: Return Milk -->
        <div class="mobile-kpi-card arrears-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Return Milk</span>
            <div class="kpi-icon-badge bg-amber-50 text-amber-700">
              <v-icon size="16">mdi-keyboard-return</v-icon>
            </div>
          </div>
          <div class="kpi-value text-orange-700">
            {{ formatNumber(totals.returns) }} <span class="kpi-unit">Kg</span>
          </div>
          <div class="kpi-subtitle">
            Net: {{ formatNumber(totals.milkSent - totals.returns) }} Kg
          </div>
        </div>

        <!-- Card 3: Cash Collected -->
        <div class="mobile-kpi-card income-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Shop Collections</span>
            <div class="kpi-icon-badge bg-emerald-50 text-emerald-600">
              <v-icon size="16">mdi-cash-check</v-icon>
            </div>
          </div>
          <div class="kpi-value text-emerald-600">
            {{ formatCurrency(totals.collection) }}
          </div>
          <div class="kpi-subtitle">
            Collected from shops
          </div>
        </div>

        <!-- Card 4: New Arrears -->
        <div class="mobile-kpi-card pa-3 bg-white" :class="totals.arrears > 0 ? 'expense-card' : 'cash-card'">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">New Arrears</span>
            <div
              class="kpi-icon-badge"
              :class="totals.arrears > 0 ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600'"
            >
              <v-icon size="16">mdi-alert-circle-outline</v-icon>
            </div>
          </div>
          <div
            class="kpi-value"
            :class="totals.arrears > 0 ? 'text-rose-600' : 'text-teal-700'"
          >
            {{ formatCurrency(totals.arrears) }}
          </div>
          <div class="kpi-subtitle">
            Balance additions
          </div>
        </div>
      </div>

      <!-- 3. Search & Route Status Filter Pills -->
      <div class="mb-3">
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search by area, driver, or vehicle..."
          variant="outlined"
          density="compact"
          hide-details
          class="bg-white rounded-lg mb-2"
          clearable
        />

        <div class="d-flex align-center gap-1-5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            class="filter-pill-btn"
            :class="{ active: statusFilter === 'all' }"
            @click="statusFilter = 'all'"
          >
            All Routes ({{ dateDispatches.length }})
          </button>
          <button
            type="button"
            class="filter-pill-btn"
            :class="{ active: statusFilter === 'dispatched' }"
            @click="statusFilter = 'dispatched'"
          >
            In Route
          </button>
          <button
            type="button"
            class="filter-pill-btn"
            :class="{ active: statusFilter === 'returned' }"
            @click="statusFilter = 'returned'"
          >
            Settled / Returned
          </button>
        </div>
      </div>

      <!-- 4. Delivery Routes List (Native Mobile Read-Only) -->
      <div class="mobile-section-header mb-2 d-flex align-center justify-space-between">
        <span class="text-caption font-weight-bold text-slate-800 text-uppercase">
          Dispatched Delivery Routes ({{ filteredDispatches.length }})
        </span>
        <button
          v-if="selectedDate"
          type="button"
          class="text-caption text-primary font-weight-bold cursor-pointer"
          @click="selectedDate = null; loadDispatches()"
        >
          View All Dates
        </button>
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredDispatches.length === 0"
        class="pa-6 bg-white rounded-xl border text-center text-grey-darken-1 shadow-xs mb-3"
      >
        <v-icon size="40" color="grey-lighten-1" class="mb-2">mdi-truck-outline</v-icon>
        <div class="font-weight-bold text-body-2 text-slate-800">No Dispatches Found</div>
        <div class="text-caption text-grey">
          {{ selectedDate ? `No delivery routes recorded for ${formatDate(selectedDate)}.` : 'No routes match your search filters.' }}
        </div>
      </div>

      <!-- Routes Content (with Route Stepper & Prev/Next Navigation) -->
      <div v-else>
        <!-- Stepper Navigation Header (when multiple routes exist) -->
        <div v-if="filteredDispatches.length > 1" class="route-navigation-card bg-white border rounded-xl pa-3 shadow-xs mb-3">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="d-flex align-center gap-1-5">
              <v-chip size="x-small" color="primary" variant="flat" class="font-weight-black">
                R{{ currentRouteIndex + 1 }}
              </v-chip>
              <span class="text-caption font-weight-black text-slate-900 text-uppercase">
                Route {{ currentRouteIndex + 1 }} of {{ filteredDispatches.length }}
              </span>
            </div>

            <!-- Toggle View Mode: Single Focused Route vs All Routes -->
            <button
              type="button"
              class="text-caption text-primary font-weight-bold"
              @click="viewMode = viewMode === 'stepper' ? 'list' : 'stepper'"
            >
              {{ viewMode === 'stepper' ? 'Show All (' + filteredDispatches.length + ')' : 'Single Route View' }}
            </button>
          </div>

          <!-- Stepper Buttons (Previous & Next Route) -->
          <div class="d-flex align-center gap-2">
            <v-btn
              size="small"
              variant="outlined"
              color="primary"
              :disabled="currentRouteIndex === 0"
              class="flex-grow-1 font-weight-bold text-caption text-capitalize rounded-lg"
              @click="prevRoute"
            >
              <v-icon start size="18">mdi-chevron-left</v-icon>
              Previous Route
            </v-btn>

            <v-btn
              size="small"
              variant="flat"
              color="primary"
              :disabled="currentRouteIndex >= filteredDispatches.length - 1"
              class="flex-grow-1 font-weight-bold text-caption text-capitalize rounded-lg"
              @click="nextRoute"
            >
              Next Route
              <v-icon end size="18">mdi-chevron-right</v-icon>
            </v-btn>
          </div>

          <!-- Route Quick Selection Chips -->
          <div class="d-flex align-center gap-1-5 mt-2-5 overflow-x-auto no-scrollbar pt-1">
            <button
              v-for="(r, idx) in filteredDispatches"
              :key="r.id"
              type="button"
              class="route-select-pill text-caption font-weight-bold"
              :class="{ active: idx === currentRouteIndex }"
              @click="setRouteIndex(idx)"
            >
              R{{ idx + 1 }}: {{ r.areaName || 'Route' }}
            </button>
          </div>
        </div>

        <!-- Render Route Cards -->
        <div class="d-flex flex-column gap-3">
          <div
            v-for="(d, loopIdx) in (viewMode === 'stepper' && filteredDispatches.length > 1 ? (activeRoute ? [activeRoute] : []) : filteredDispatches)"
            :key="d.id"
            class="mobile-route-card bg-white border rounded-xl shadow-xs overflow-hidden"
          >
            <!-- Route Header -->
            <div class="pa-3 bg-slate-50 border-b d-flex align-center justify-space-between">
              <div>
                <div class="d-flex align-center">
                  <v-chip size="x-small" color="primary" variant="flat" class="font-weight-bold me-2">
                    R{{ (viewMode === 'stepper' && filteredDispatches.length > 1 ? currentRouteIndex : loopIdx) + 1 }}
                  </v-chip>
                  <span class="font-weight-black text-body-1 text-slate-900">
                    {{ d.areaName }}
                  </span>
                </div>
                <div class="text-caption text-grey-darken-1 mt-1 font-weight-medium">
                  Driver: <strong>{{ d.driverName }}</strong> • {{ d.vehicleNumber }}
                </div>
              </div>

              <div>
                <v-chip
                  size="small"
                  :color="d.status === 'Dispatched' ? 'warning' : 'success'"
                  variant="flat"
                  class="font-weight-bold text-caption px-2-5"
                >
                  <v-icon start size="13">
                    {{ d.status === 'Dispatched' ? 'mdi-truck-fast' : 'mdi-check-circle' }}
                  </v-icon>
                  {{ d.status === 'Dispatched' ? 'IN ROUTE' : 'SETTLED' }}
                </v-chip>
              </div>
            </div>

            <!-- Key Stats Ribbon -->
            <div class="px-3 py-2-5 bg-white d-flex align-center justify-space-between text-caption border-b">
              <div>
                <span class="text-grey-darken-1 d-block font-weight-bold text-uppercase" style="font-size: 0.65rem !important;">MILK SENT</span>
                <strong class="text-primary font-weight-black text-no-wrap">{{ formatNumber(d.totalMilk) }} Kg</strong>
              </div>
              <div v-if="(d.totalReturnMilk || 0) > 0">
                <span class="text-grey-darken-1 d-block font-weight-bold text-uppercase" style="font-size: 0.65rem !important;">RETURN</span>
                <strong class="text-orange-darken-4 font-weight-black text-no-wrap">{{ formatNumber(d.totalReturnMilk) }} Kg</strong>
              </div>
              <div>
                <span class="text-grey-darken-1 d-block font-weight-bold text-uppercase" style="font-size: 0.65rem !important;">COLLECTION</span>
                <strong class="text-success font-weight-black text-no-wrap">{{ formatCurrency(d.totalCollection) }}</strong>
              </div>
              <div class="text-end">
                <span class="text-grey-darken-1 d-block font-weight-bold text-uppercase" style="font-size: 0.65rem !important;">NEW ARREARS</span>
                <strong :class="(d.totalNewArrears || 0) > 0 ? 'text-error font-weight-black text-no-wrap' : 'text-success font-weight-black text-no-wrap'">
                  {{ formatCurrency(d.totalNewArrears) }}
                </strong>
              </div>
            </div>

            <!-- Shop Accordion Toggle -->
            <div
              class="d-flex align-center justify-space-between px-3 py-2-5 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
              @click="toggleRouteExpand(d.id)"
            >
              <div class="d-flex align-center">
                <v-icon size="16" color="primary" class="me-2">mdi-storefront-outline</v-icon>
                <span class="text-caption font-weight-bold text-slate-800">
                  {{ (d.items || d.shopDispatches || []).length === 1 ? '1 Shop in Route' : ((d.items || d.shopDispatches || []).length + ' Shops in Route') }}
                </span>
              </div>
              <div class="d-flex align-center gap-1 text-primary font-weight-bold text-caption">
                <span>{{ expandedRouteId === d.id ? 'Hide' : 'View' }}</span>
                <v-icon size="16" class="ms-1">{{ expandedRouteId === d.id ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
              </div>
            </div>

            <!-- Expanded Shop Items (Redesigned Sophisticated Mobile Cards) -->
            <div v-if="expandedRouteId === d.id" class="pa-3 bg-slate-50 border-t">
              <div v-if="loadingItems && !(d.items || d.shopDispatches)" class="text-center pa-4 text-caption text-grey">
                <v-progress-circular indeterminate size="20" color="primary" class="me-2" />
                Loading shop breakdown...
              </div>
              <div v-else-if="!(d.items || d.shopDispatches) || (d.items || d.shopDispatches).length === 0" class="text-center pa-3 text-caption text-grey">
                No shop items recorded for this route.
              </div>
              <div v-else class="d-flex flex-column gap-2">
                <div
                  v-for="s in (d.items || d.shopDispatches)"
                  :key="s.shopId || s.shopName"
                  class="shop-card-native pa-3 rounded-xl border bg-white shadow-xs"
                >
                  <!-- Shop Header: Name, Rate & Balance Due Status -->
                  <div class="d-flex align-center justify-space-between pb-2 mb-2-5 border-b">
                    <div class="d-flex align-center gap-2">
                      <div class="shop-avatar">
                        <v-icon size="16" color="primary">mdi-storefront</v-icon>
                      </div>
                      <div>
                        <div class="font-weight-black text-body-2 text-slate-900 leading-tight">
                          {{ s.shopName }}
                        </div>
                        <div class="text-caption text-slate-500 font-weight-medium mt-0-5" style="font-size: 0.72rem !important;">
                          Rate: <strong class="text-slate-800">{{ formatCurrency(s.price || s.rate) }}</strong>/Kg
                        </div>
                      </div>
                    </div>

                    <!-- Right Header: Prominent Balance Due or Cleared Status -->
                    <div class="text-end">
                      <div v-if="(s.newArrears || 0) > 0">
                        <span class="text-caption text-slate-500 font-weight-bold d-block text-uppercase" style="font-size: 0.62rem !important;">
                          BALANCE DUE
                        </span>
                        <span class="text-body-2 font-weight-black text-error line-height-tight text-no-wrap">
                          {{ formatCurrency(s.newArrears) }}
                        </span>
                      </div>
                      <div v-else>
                        <v-chip size="x-small" color="success" variant="flat" class="font-weight-black text-caption px-2" style="height: 20px;">
                          CLEARED
                        </v-chip>
                      </div>
                    </div>
                  </div>

                  <!-- Key Metrics 2-Card Row -->
                  <div class="shop-metrics-grid mb-2">
                    <!-- Box 1: Milk Sent & Returns -->
                    <div class="pa-2 rounded-lg bg-slate-50 border">
                      <span class="shop-kpi-label d-block text-slate-500">MILK SENT</span>
                      <div class="font-weight-black text-body-2 text-primary line-height-tight text-no-wrap my-0-5">
                        {{ formatNumber(s.todayMilk || s.todaySupplyMilk || s.kgs) }} <span class="text-caption font-weight-bold">Kg</span>
                      </div>
                      <div v-if="(s.returnKgs || 0) > 0" class="text-caption text-orange-darken-4 font-weight-bold text-no-wrap" style="font-size: 0.68rem !important;">
                        -{{ formatNumber(s.returnKgs) }} Kg ret
                      </div>
                      <div v-else class="text-caption text-slate-400 font-weight-medium" style="font-size: 0.68rem !important;">
                        0 Kg return
                      </div>
                    </div>

                    <!-- Box 2: Collection Today -->
                    <div class="pa-2 rounded-lg bg-slate-50 border">
                      <span class="shop-kpi-label d-block text-slate-500">COLLECTED</span>
                      <div class="font-weight-black text-body-2 text-success line-height-tight text-no-wrap my-0-5">
                        {{ formatCurrency(s.todayCollection) }}
                      </div>
                      <div class="text-caption text-slate-500 font-weight-medium text-no-wrap" style="font-size: 0.68rem !important;">
                        {{ (s.todayCollection || 0) > 0 ? 'Cash received' : 'No collection' }}
                      </div>
                    </div>
                  </div>

                  <!-- Financial Summary Strip -->
                  <div class="px-2-5 py-2 rounded-lg bg-slate-50 border text-caption">
                    <div class="d-flex align-center justify-space-between mb-1">
                      <span class="text-slate-600 font-weight-medium" style="font-size: 0.72rem !important;">Today's Total Bill:</span>
                      <strong class="text-slate-900 font-weight-black text-no-wrap" style="font-size: 0.78rem !important;">
                        {{ formatCurrency(s.todayAmount || s.todayBill || s.totalPayable) }}
                      </strong>
                    </div>
                    <div v-if="(s.previousArrears || 0) > 0" class="d-flex align-center justify-space-between text-slate-500 pt-1 border-t" style="font-size: 0.70rem !important;">
                      <span>Includes Prev Arrears:</span>
                      <strong class="text-slate-700 text-no-wrap">{{ formatCurrency(s.previousArrears) }}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Date Picker Modal -->
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
import { ref, computed, watch, onMounted } from 'vue';
import { dispatchService } from '@/services/dispatchService';
import { useBusinessDayStore } from '@/stores/businessDay';
import { formatCurrency, formatNumber, formatDate, getOffsetDateString } from '@/utils/formatters';
import AppDatePicker from '@/components/common/AppDatePicker.vue';

const businessDayStore = useBusinessDayStore();

const loading = ref(false);
const datePickerModal = ref(false);
const selectedDate = ref(businessDayStore.activeBusinessDate);
const dateDispatches = ref([]);
const expandedRouteId = ref(null);
const searchQuery = ref('');
const statusFilter = ref('all');
const currentRouteIndex = ref(0);
const viewMode = ref('stepper'); // 'stepper' or 'list'
const loadingItems = ref(false);

const filteredDispatches = computed(() => {
  let list = dateDispatches.value || [];
  if (statusFilter.value === 'dispatched') {
    list = list.filter((d) => d.status === 'Dispatched');
  } else if (statusFilter.value === 'returned') {
    list = list.filter((d) => d.status === 'Returned');
  }
  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter((d) =>
      (d.areaName || '').toLowerCase().includes(q) ||
      (d.driverName || '').toLowerCase().includes(q) ||
      (d.vehicleNumber || '').toLowerCase().includes(q)
    );
  }
  return list;
});

const activeRoute = computed(() => {
  if (!filteredDispatches.value || filteredDispatches.value.length === 0) return null;
  const idx = Math.min(Math.max(0, currentRouteIndex.value), filteredDispatches.value.length - 1);
  return filteredDispatches.value[idx];
});

watch([filteredDispatches, selectedDate], () => {
  if (currentRouteIndex.value >= filteredDispatches.value.length) {
    currentRouteIndex.value = Math.max(0, filteredDispatches.value.length - 1);
  }
});

watch(activeRoute, async (newRoute) => {
  if (newRoute) {
    expandedRouteId.value = newRoute.id;
    await ensureRouteItems(newRoute);
  }
}, { immediate: true });

async function ensureRouteItems(d) {
  if (!d || d.items) return;
  try {
    loadingItems.value = true;
    const full = await dispatchService.getDispatchById(d.id);
    if (full?.items) {
      d.items = full.items;
    }
  } catch (e) {
    console.warn('Failed to load shop items:', e);
  } finally {
    loadingItems.value = false;
  }
}

function prevRoute() {
  if (currentRouteIndex.value > 0) {
    currentRouteIndex.value--;
  }
}

function nextRoute() {
  if (currentRouteIndex.value < filteredDispatches.value.length - 1) {
    currentRouteIndex.value++;
  }
}

function setRouteIndex(idx) {
  currentRouteIndex.value = idx;
}

const totals = computed(() => {
  let milkSent = 0;
  let returns = 0;
  let collection = 0;
  let arrears = 0;

  for (const d of dateDispatches.value) {
    milkSent += Number(d.totalMilk) || 0;
    returns += Number(d.totalReturnMilk) || 0;
    collection += Number(d.totalCollection) || 0;
    arrears += Number(d.totalNewArrears) || 0;
  }

  return { milkSent, returns, collection, arrears };
});

async function toggleRouteExpand(id) {
  if (expandedRouteId.value === id) {
    expandedRouteId.value = null;
    return;
  }
  expandedRouteId.value = id;
  const target = dateDispatches.value.find(d => d.id === id);
  if (target && !target.items) {
    await ensureRouteItems(target);
  }
}

function stepDay(offset) {
  selectedDate.value = getOffsetDateString(selectedDate.value, offset);
  loadDispatches();
}

function onDateChanged() {
  datePickerModal.value = false;
  loadDispatches();
}

async function loadDispatches() {
  loading.value = true;
  expandedRouteId.value = null;
  currentRouteIndex.value = 0;
  try {
    dateDispatches.value = await dispatchService.getDispatches(selectedDate.value);
    if (filteredDispatches.value.length > 0) {
      const first = filteredDispatches.value[0];
      expandedRouteId.value = first.id;
      await ensureRouteItems(first);
    }
  } catch (err) {
    console.warn('Failed to load dispatches on mobile:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await businessDayStore.refreshBusinessDay();
  if (!selectedDate.value) {
    selectedDate.value = businessDayStore.activeBusinessDate || businessDayStore.realToday;
  }
  await loadDispatches();
});
</script>

<style scoped>
.mobile-dispatch-page {
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
}

.income-card { border-top: 3px solid #10b981 !important; }
.cash-card { border-top: 3px solid #0d9488 !important; }
.arrears-card { border-top: 3px solid #f59e0b !important; }
.milk-in-card { border-top: 3px solid #0284c7 !important; }
.milk-out-card { border-top: 3px solid #3b82f6 !important; }
.expense-card { border-top: 3px solid #ef4444 !important; }

.mobile-route-card {
  border: 1px solid #e2e8f0 !important;
  border-radius: 12px !important;
}

.route-navigation-card {
  background: #ffffff;
  border: 1px solid #e2e8f0 !important;
  border-radius: 12px !important;
}

.route-select-pill {
  padding: 4px 10px;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
}

.route-select-pill.active {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

.shop-card-native {
  background: #ffffff;
  border: 1px solid #e2e8f0 !important;
  border-radius: 12px !important;
}

.shop-avatar {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background-color: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shop-metrics-grid {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 8px !important;
}

.shop-kpi-label {
  font-size: 0.62rem !important;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.3px;
  margin-bottom: 2px;
}

.shop-kpi-val {
  font-size: 0.85rem !important;
  line-height: 1.25;
  white-space: nowrap !important;
}

.shop-kpi-sub {
  font-size: 0.65rem !important;
  margin-top: 2px;
  white-space: nowrap !important;
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

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

