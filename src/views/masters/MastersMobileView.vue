<template>
  <div class="mobile-masters-page pb-16">
    <!-- 1. Sticky Mobile App Header -->
    <header class="mobile-app-header px-4 py-3 bg-white border-b sticky-top">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center gap-2">
          <div class="header-icon-box">
            <v-icon color="primary" size="20">mdi-database-cog</v-icon>
          </div>
          <div>
            <h1 class="text-subtitle-1 font-weight-black text-slate-900 line-height-tight mb-0">
              Masters & Fleet
            </h1>
            <span class="text-caption text-grey-darken-1 font-weight-medium" style="font-size: 0.72rem !important;">
              Shops, Routes, Vehicles & Settings
            </span>
          </div>
        </div>

        <v-btn
          icon
          size="small"
          variant="tonal"
          color="primary"
          :loading="loading"
          class="refresh-icon-btn"
          @click="refreshActiveTab"
        >
          <v-icon size="18">mdi-refresh</v-icon>
        </v-btn>
      </div>

      <!-- Quick Scrollable Tab Pills -->
      <div class="d-flex align-center gap-1-5 overflow-x-auto pb-1 mt-1">
        <button
          type="button"
          class="mobile-nav-pill"
          :class="{ active: currentTab === 'shops' }"
          @click="switchTab('shops')"
        >
          <v-icon size="14" start>mdi-store</v-icon>
          Shops & Rates
        </button>
        <button
          type="button"
          class="mobile-nav-pill"
          :class="{ active: currentTab === 'vehicles' }"
          @click="switchTab('vehicles')"
        >
          <v-icon size="14" start>mdi-car</v-icon>
          Vehicles
        </button>
        <button
          type="button"
          class="mobile-nav-pill"
          :class="{ active: currentTab === 'areas' }"
          @click="switchTab('areas')"
        >
          <v-icon size="14" start>mdi-map-marker-path</v-icon>
          Routes
        </button>
        <button
          type="button"
          class="mobile-nav-pill"
          :class="{ active: currentTab === 'categories' }"
          @click="switchTab('categories')"
        >
          <v-icon size="14" start>mdi-shape-plus</v-icon>
          Categories
        </button>
      </div>
    </header>

    <div class="px-3 pt-3">
      <!-- ================= TAB 1: SHOPS & MILK PRICE ================= -->
      <div v-if="currentTab === 'shops'">
        <!-- Master Price Highlight Cards (2 in 1 row) -->
        <div class="mobile-kpi-grid mb-3">
          <div class="mobile-kpi-card milk-in-card pa-3 bg-white">
            <span class="kpi-label">Master Milk Rate</span>
            <div class="kpi-value text-sky-700">
              {{ formatCurrency(masterMilkPrice) }} <span class="kpi-unit">/ Kg</span>
            </div>
            <span class="kpi-subtitle">Global benchmark</span>
          </div>

          <div class="mobile-kpi-card milk-out-card pa-3 bg-white">
            <span class="kpi-label">Standard Can (50Kg)</span>
            <div class="kpi-value text-blue-700">
              {{ formatCurrency(masterMilkPrice * canWeightKg) }}
            </div>
            <span class="kpi-subtitle">Per full can value</span>
          </div>
        </div>

        <v-text-field
          v-model="shopSearch"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search shop by name, owner, or area..."
          variant="outlined"
          density="compact"
          hide-details
          class="bg-white rounded-lg mb-3"
          clearable
        />

        <div class="mobile-section-header mb-2 d-flex align-center justify-space-between">
          <span class="text-caption font-weight-bold text-slate-800 text-uppercase">
            Active Retail Shops ({{ filteredShops.length }})
          </span>
        </div>

        <div v-if="filteredShops.length === 0" class="pa-6 bg-white rounded-xl border text-center text-grey-darken-1 shadow-xs">
          <v-icon size="40" color="grey-lighten-1" class="mb-2">mdi-store-off</v-icon>
          <div class="font-weight-bold text-body-2 text-slate-800">No Shops Found</div>
        </div>

        <div v-else class="d-flex flex-column gap-2-5">
          <div
            v-for="s in filteredShops"
            :key="s.id"
            class="mobile-item-card bg-white border rounded-xl shadow-xs p-3"
          >
            <div class="d-flex align-center justify-space-between mb-1">
              <div>
                <span class="font-weight-black text-body-2 text-slate-900 d-block">{{ s.name }}</span>
                <span class="text-caption text-slate-600 font-weight-medium" style="font-size: 0.72rem !important;">
                  Owner: {{ s.ownerName || '-' }} • Route: <strong>{{ s.areaName || 'General' }}</strong>
                </span>
              </div>
              <div class="text-end">
                <span class="text-caption text-slate-600 font-weight-bold d-block" style="font-size: 0.68rem !important;">SELLING RATE</span>
                <span class="font-weight-black text-body-2 text-primary">
                  {{ formatCurrency(s.customRate || masterMilkPrice) }}/Kg
                </span>
              </div>
            </div>

            <div class="pt-2 border-t d-flex align-center justify-space-between text-caption">
              <div>
                <span class="text-grey me-1">Arrears Balance:</span>
                <strong :class="(s.arrears || 0) > 0 ? 'text-error font-weight-bold' : 'text-success'">
                  {{ formatCurrency(s.arrears) }}
                </strong>
              </div>

              <a v-if="s.phone" :href="'tel:' + s.phone" class="text-decoration-none text-primary font-weight-bold d-flex align-center gap-1">
                <v-icon size="14">mdi-phone</v-icon>
                {{ s.phone }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= TAB 2: VEHICLES ================= -->
      <div v-else-if="currentTab === 'vehicles'">
        <v-text-field
          v-model="vehicleSearch"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search vehicle number or model..."
          variant="outlined"
          density="compact"
          hide-details
          class="bg-white rounded-lg mb-3"
          clearable
        />

        <div class="mobile-section-header mb-2 d-flex align-center justify-space-between">
          <span class="text-caption font-weight-bold text-slate-800 text-uppercase">
            Fleet Vehicles ({{ filteredVehicles.length }})
          </span>
        </div>

        <div class="d-flex flex-column gap-2-5">
          <div
            v-for="v in filteredVehicles"
            :key="v.id"
            class="bg-white pa-3 rounded-xl border shadow-xs d-flex align-center justify-space-between"
          >
            <div class="d-flex align-center gap-2">
              <v-avatar size="32" color="primary" variant="tonal">
                <v-icon size="18">mdi-truck</v-icon>
              </v-avatar>
              <div>
                <span class="font-weight-black text-body-2 text-slate-900 d-block">{{ v.number || v.vehicleNumber }}</span>
                <span class="text-caption text-slate-600 font-weight-medium" style="font-size: 0.72rem !important;">
                  {{ v.model || v.type || 'Delivery Truck' }}
                </span>
              </div>
            </div>

            <v-chip size="small" color="success" variant="flat" class="font-weight-bold text-caption">
              {{ v.status || 'Active' }}
            </v-chip>
          </div>
        </div>
      </div>

      <!-- ================= TAB 3: ROUTES / AREAS ================= -->
      <div v-else-if="currentTab === 'areas'">
        <v-text-field
          v-model="areaSearch"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search route name or description..."
          variant="outlined"
          density="compact"
          hide-details
          class="bg-white rounded-lg mb-3"
          clearable
        />

        <div class="mobile-section-header mb-2 d-flex align-center justify-space-between">
          <span class="text-caption font-weight-bold text-slate-800 text-uppercase">
            Distribution Routes ({{ filteredAreas.length }})
          </span>
        </div>

        <div class="d-flex flex-column gap-2-5">
          <div
            v-for="a in filteredAreas"
            :key="a.id"
            class="bg-white pa-3 rounded-xl border shadow-xs"
          >
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="font-weight-black text-body-2 text-slate-900">{{ a.name }}</span>
              <v-chip size="x-small" color="primary" variant="flat" class="font-weight-bold">Route</v-chip>
            </div>
            <div class="text-caption text-grey">
              {{ a.description || 'Milk distribution zone' }}
            </div>
          </div>
        </div>
      </div>

      <!-- ================= TAB 4: CATEGORIES ================= -->
      <div v-else-if="currentTab === 'categories'">
        <div class="mobile-section-header mb-2 d-flex align-center justify-space-between">
          <span class="text-caption font-weight-bold text-slate-800 text-uppercase">
            Operating Expense Categories ({{ categories.length }})
          </span>
        </div>

        <div class="d-flex flex-column gap-2-5">
          <div
            v-for="c in categories"
            :key="c.id || c.name"
            class="bg-white pa-3 rounded-xl border shadow-xs"
          >
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="font-weight-black text-body-2 text-slate-900">{{ c.name }}</span>
              <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">
                {{ c.subTypes ? c.subTypes.length : 0 }} Subtypes
              </v-chip>
            </div>
            <div v-if="c.subTypes && c.subTypes.length > 0" class="d-flex flex-wrap gap-1 mt-1">
              <v-chip
                v-for="sub in c.subTypes"
                :key="sub"
                size="x-small"
                color="grey-darken-1"
                variant="tonal"
                class="font-weight-medium"
              >
                {{ sub }}
              </v-chip>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { mastersService } from '@/services/mastersService';
import { expenseService } from '@/services/expenseService';
import { useSettingsStore } from '@/stores/settings';
import { formatCurrency } from '@/utils/formatters';

const settingsStore = useSettingsStore();

const loading = ref(false);
const currentTab = ref('shops');

const shops = ref([]);
const vehicles = ref([]);
const areas = ref([]);
const categories = ref([]);

const shopSearch = ref('');
const vehicleSearch = ref('');
const areaSearch = ref('');

const masterMilkPrice = computed(() => Number(settingsStore.settings.defaultMilkPrice) || 180);
const canWeightKg = computed(() => Number(settingsStore.settings.canWeightKg) || 50);

const filteredShops = computed(() => {
  if (!shopSearch.value) return shops.value;
  const q = shopSearch.value.toLowerCase();
  return shops.value.filter(s =>
    s.name?.toLowerCase().includes(q) ||
    s.ownerName?.toLowerCase().includes(q) ||
    s.areaName?.toLowerCase().includes(q)
  );
});

const filteredVehicles = computed(() => {
  if (!vehicleSearch.value) return vehicles.value;
  const q = vehicleSearch.value.toLowerCase();
  return vehicles.value.filter(v =>
    (v.number || v.vehicleNumber)?.toLowerCase().includes(q) ||
    (v.model || v.type)?.toLowerCase().includes(q)
  );
});

const filteredAreas = computed(() => {
  if (!areaSearch.value) return areas.value;
  const q = areaSearch.value.toLowerCase();
  return areas.value.filter(a =>
    a.name?.toLowerCase().includes(q) ||
    a.description?.toLowerCase().includes(q)
  );
});

function switchTab(tab) {
  currentTab.value = tab;
  refreshActiveTab();
}

async function loadShops() {
  loading.value = true;
  try {
    const [shopList, areaList] = await Promise.all([
      mastersService.getShops(),
      mastersService.getAreas(),
    ]);
    const areaMap = new Map((areaList || []).map(a => [a.id, a.name]));
    shops.value = (shopList || []).map(s => ({
      ...s,
      areaName: areaMap.get(s.areaId) || 'General Route',
      rate: s.defaultPrice || masterMilkPrice.value,
      arrears: s.currentArrears || 0,
    }));
  } catch (err) {
    console.warn('Failed to load shops on mobile:', err);
  } finally {
    loading.value = false;
  }
}

async function loadVehicles() {
  loading.value = true;
  try {
    vehicles.value = await mastersService.getVehicles();
  } catch (err) {
    console.warn('Failed to load vehicles on mobile:', err);
  } finally {
    loading.value = false;
  }
}

async function loadAreas() {
  loading.value = true;
  try {
    areas.value = await mastersService.getAreas();
  } catch (err) {
    console.warn('Failed to load areas on mobile:', err);
  } finally {
    loading.value = false;
  }
}

async function loadCategories() {
  loading.value = true;
  try {
    categories.value = await expenseService.getCategories();
  } catch (err) {
    console.warn('Failed to load categories on mobile:', err);
  } finally {
    loading.value = false;
  }
}

function refreshActiveTab() {
  if (currentTab.value === 'shops') loadShops();
  else if (currentTab.value === 'vehicles') loadVehicles();
  else if (currentTab.value === 'areas') loadAreas();
  else if (currentTab.value === 'categories') loadCategories();
}

onMounted(async () => {
  await settingsStore.loadSettings();
  await Promise.all([
    loadShops(),
    loadVehicles(),
    loadAreas(),
    loadCategories(),
  ]);
});
</script>

<style scoped>
.mobile-masters-page {
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

.mobile-nav-pill {
  padding: 5px 12px;
  border-radius: 9999px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 0.74rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: all 0.15s ease;
}

.mobile-nav-pill.active {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
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

.mobile-item-card {
  border: 1px solid #e2e8f0 !important;
  border-radius: 12px !important;
}
</style>

