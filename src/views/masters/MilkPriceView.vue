<template>
  <div class="page-container table-page">
    <div class="page-header">
      <div>
        <h1 class="page-header-title">Milk Price &amp; Can Master</h1>
        <p class="page-header-subtitle">
          Decide master milk price per Kg, configure standard Can weight (1 Can = 50 Kg), and update pricing across all shops &amp; dispatches
        </p>
      </div>

      <v-btn
        color="success"
        variant="flat"
        prepend-icon="mdi-sync"
        class="text-capitalize rounded-lg font-weight-bold"
        :loading="syncingAll"
        @click="syncAllShopsToMaster"
      >
        Sync All Shops to Master ({{ formatCurrency(savedMasterPrice) }})
      </v-btn>
    </div>

    <!-- Summary Cards -->
    <v-row dense class="mb-3">
      <v-col cols="6" sm="4" md="4">
        <StatCard
          label="Master Milk Price"
          :value="`${formatCurrency(savedMasterPrice)} / Kg`"
          color="primary"
          subtitle="Global default rate across project"
        />
      </v-col>
      <v-col cols="6" sm="4" md="4">
        <StatCard
          label="Per Can Price"
          :value="formatCurrency(savedMasterPrice * savedCanWeightKg)"
          color="success"
          :subtitle="`1 Can (${savedCanWeightKg} Kg) × ${formatCurrency(savedMasterPrice)}`"
        />
      </v-col>
      <v-col cols="12" sm="4" md="4">
        <StatCard
          label="Standard Can Weight"
          :value="`${savedCanWeightKg} Kg`"
          color="info"
          subtitle="1 Can equals Kg milk"
        />
      </v-col>
    </v-row>

    <!-- Table Card -->
    <v-card class="modern-card pa-4 table-card-full" elevation="0">
      <!-- Master Rate Update Controls Bar -->
      <div class="master-rate-toolbar d-flex align-center justify-space-between flex-wrap gap-3 pa-3 mb-3 rounded-lg border bg-grey-lighten-5 flex-shrink-0">
        <div class="d-flex align-center flex-wrap gap-3">
          <v-text-field
            v-model.number="masterForm.defaultMilkPrice"
            type="number"
            min="0"
            label="Master Milk Price (Rs./Kg) *"
            variant="outlined"
            density="compact"
            hide-details
            bg-color="white"
            style="width: 210px;"
            prepend-inner-icon="mdi-currency-pkr"
          />

          <v-text-field
            v-model.number="masterForm.canWeightKg"
            type="number"
            min="1"
            label="1 Can = (Kg) *"
            variant="outlined"
            density="compact"
            hide-details
            bg-color="white"
            style="width: 150px;"
            prepend-inner-icon="mdi-pail-outline"
          />

          <div class="can-preview-pill px-3 py-2 rounded border bg-white text-caption font-weight-bold text-primary tabular-nums">
            1 Can ({{ masterForm.canWeightKg || 50 }} Kg) = {{ formatCurrency((Number(masterForm.defaultMilkPrice) || 0) * (Number(masterForm.canWeightKg) || 50)) }}
          </div>
        </div>

        <div class="d-flex align-center flex-wrap gap-3 ms-auto">
          <v-checkbox
            v-model="applyToAllShops"
            label="Update all shops with this price"
            color="primary"
            density="compact"
            hide-details
            class="font-weight-medium"
          />

          <v-btn
            v-if="authStore.isAdmin"
            color="primary"
            variant="flat"
            prepend-icon="mdi-content-save-check"
            class="text-capitalize font-weight-bold px-5"
            :loading="savingMaster"
            @click="saveMasterPrice"
          >
            Update Milk Price
          </v-btn>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div class="d-flex align-center justify-space-between mb-3 flex-wrap flex-shrink-0" style="gap: 16px;">
        <div class="d-flex align-center flex-wrap flex-grow-1" style="gap: 12px;">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Search shops, code, owner..."
            variant="outlined"
            density="compact"
            hide-details
            style="min-width: 240px; max-width: 320px;"
            clearable
          />
          <v-select
            v-model="selectedAreaFilter"
            :items="areaOptions"
            item-title="name"
            item-value="id"
            label="Filter by Area / Route"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-map-marker-path"
            hide-details
            style="min-width: 200px; max-width: 250px;"
            clearable
          />
        </div>
        <div class="d-flex align-center" style="gap: 10px;">
          <v-chip color="primary" variant="tonal" size="small" class="font-weight-bold">
            {{ filteredShops.length }} Shops
          </v-chip>
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      <BulkActionsBar
        v-if="authStore.isAdmin"
        :count="selectedIds.length"
        item-label="shop"
        @clear="selectedIds = []"
      >
        <template #actions>
          <v-btn
            size="small"
            variant="flat"
            color="success"
            class="text-capitalize font-weight-bold"
            prepend-icon="mdi-currency-pkr"
            :loading="bulkUpdating"
            @click="applyMasterToSelected"
          >
            Apply Master ({{ formatCurrency(savedMasterPrice) }})
          </v-btn>
          <v-btn
            size="small"
            variant="flat"
            color="primary"
            class="text-capitalize font-weight-bold"
            prepend-icon="mdi-pencil"
            @click="openCustomPriceModal(null)"
          >
            Set Custom Price
          </v-btn>
        </template>
      </BulkActionsBar>

      <!-- Per-Shop Rates Table -->
      <div class="table-responsive flex-grow-1">
        <v-table hover>
          <thead>
            <tr>
              <th v-if="authStore.isAdmin" class="table-checkbox-col">
                <v-checkbox-btn
                  :model-value="isAllSelected"
                  :indeterminate="isSomeSelected"
                  color="primary"
                  density="compact"
                  @update:model-value="toggleSelectAll"
                />
              </th>
              <th>Code</th>
              <th>Shop Name</th>
              <th>Area / Route</th>
              <th class="text-end">Price / Kg</th>
              <th class="text-end">Per Can ({{ savedCanWeightKg }} Kg)</th>
              <th>Sync Status</th>
              <th v-if="authStore.isAdmin" class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in paginatedShops"
              :key="item.id"
              :class="{ 'selected-row': selectedIds.includes(item.id) }"
            >
              <td v-if="authStore.isAdmin" class="table-checkbox-col">
                <v-checkbox-btn
                  :model-value="selectedIds.includes(item.id)"
                  color="primary"
                  density="compact"
                  @update:model-value="toggleSelectItem(item.id)"
                  @click.stop
                />
              </td>
              <td class="font-weight-bold text-blue-grey-darken-2">{{ item.code }}</td>
              <td>
                <div class="font-weight-bold text-primary">{{ item.name }}</div>
                <div class="text-caption text-grey">{{ item.ownerName || '-' }}</div>
              </td>
              <td>
                <v-chip size="x-small" color="info" variant="tonal" class="font-weight-medium">
                  {{ getAreaName(item.areaId) }}
                </v-chip>
              </td>
              <td class="text-end font-weight-black text-dark tabular-nums">
                {{ formatCurrency(item.defaultPrice) }}
              </td>
              <td class="text-end font-weight-bold text-primary tabular-nums">
                {{ formatCurrency((Number(item.defaultPrice) || 0) * savedCanWeightKg) }}
              </td>
              <td>
                <span
                  class="erp-tag"
                  :class="Number(item.defaultPrice) === savedMasterPrice ? 'erp-tag-green' : 'erp-tag-orange'"
                >
                  {{ Number(item.defaultPrice) === savedMasterPrice ? 'MASTER RATE' : 'CUSTOM RATE' }}
                </span>
              </td>
              <td v-if="authStore.isAdmin" class="text-end" style="white-space: nowrap;">
                <v-btn
                  v-if="Number(item.defaultPrice) !== savedMasterPrice"
                  size="x-small"
                  color="success"
                  variant="tonal"
                  class="text-capitalize font-weight-bold me-1"
                  prepend-icon="mdi-sync"
                  title="Sync Shop to Master Rate"
                  @click="syncSingleShop(item)"
                >
                  Sync
                </v-btn>
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  color="primary"
                  title="Edit Shop Price"
                  @click="openCustomPriceModal(item)"
                />
              </td>
            </tr>
            <tr v-if="filteredShops.length === 0">
              <td :colspan="authStore.isAdmin ? 8 : 6" class="text-center pa-8">
                <div class="empty-state-box">
                  <v-icon class="empty-state-icon">mdi-store-off</v-icon>
                  <div class="empty-state-title">No Customer Shops Found</div>
                  <div class="empty-state-subtitle">Add shops in Shops Master or clear filters to manage rates.</div>
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <!-- Pagination Footer -->
      <AppPagination
        v-model:page="page"
        v-model:itemsPerPage="itemsPerPage"
        :total-items="filteredShops.length"
      />
    </v-card>

    <!-- Custom Shop Price Dialog -->
    <v-dialog v-model="customPriceDialog" max-width="420">
      <v-card class="rounded-xl pa-4">
        <v-card-title class="font-weight-bold px-0 pt-0 text-primary">
          {{ targetShop ? `Update Rate: ${targetShop.name}` : `Set Custom Price (${selectedIds.length} Shops)` }}
        </v-card-title>
        <v-card-text class="px-0 py-2">
          <v-text-field
            v-model.number="customPriceValue"
            type="number"
            min="0"
            label="Milk Price (Rs./Kg) *"
            prepend-inner-icon="mdi-currency-pkr"
            variant="outlined"
            density="comfortable"
            hint="Will reflect on all future dispatches for selected shop(s)"
            persistent-hint
          />
          <div class="text-caption text-primary font-weight-bold mt-2">
            Per Can ({{ savedCanWeightKg }} Kg): {{ formatCurrency((Number(customPriceValue) || 0) * savedCanWeightKg) }}
          </div>
        </v-card-text>
        <v-card-actions class="px-0 pb-0 justify-end">
          <v-btn variant="text" class="text-capitalize" @click="customPriceDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="text-capitalize rounded-lg px-4 font-weight-bold"
            :loading="bulkUpdating"
            @click="saveCustomPrice"
          >
            Update Rate
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { useAuthStore } from '@/stores/auth';
import { mastersService } from '@/services/mastersService';
import { useSnackbarStore } from '@/stores/snackbar';
import { formatCurrency } from '@/utils/formatters';
import StatCard from '@/components/common/StatCard.vue';
import AppPagination from '@/components/common/AppPagination.vue';
import BulkActionsBar from '@/components/common/BulkActionsBar.vue';

const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const snackbar = useSnackbarStore();

const shops = ref([]);
const areas = ref([]);
const search = ref('');
const selectedAreaFilter = ref(null);
const page = ref(1);
const itemsPerPage = ref(10);
const selectedIds = ref([]);

const savingMaster = ref(false);
const syncingAll = ref(false);
const bulkUpdating = ref(false);
const applyToAllShops = ref(true);

const masterForm = ref({
  defaultMilkPrice: 180,
  canWeightKg: 50,
});

const customPriceDialog = ref(false);
const targetShop = ref(null);
const customPriceValue = ref(180);

const savedMasterPrice = computed(() => Number(settingsStore.settings.defaultMilkPrice) || 180);
const savedCanWeightKg = computed(() => Number(settingsStore.settings.canWeightKg) || 50);

const areaOptions = computed(() => areas.value.map((a) => ({ id: a.id, name: a.name })));

const areaMap = computed(() => {
  const map = {};
  for (const a of areas.value) {
    map[a.id] = a.name;
  }
  return map;
});

function getAreaName(areaId) {
  return areaMap.value[areaId] || '-';
}

const filteredShops = computed(() => {
  let list = shops.value;
  if (selectedAreaFilter.value) {
    list = list.filter((s) => s.areaId === selectedAreaFilter.value);
  }
  if (!search.value) return list;
  const term = search.value.toLowerCase();
  return list.filter(
    (s) =>
      s.code?.toLowerCase().includes(term) ||
      s.name?.toLowerCase().includes(term) ||
      s.ownerName?.toLowerCase().includes(term)
  );
});

const paginatedShops = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  return filteredShops.value.slice(start, start + itemsPerPage.value);
});

watch([search, selectedAreaFilter], () => {
  page.value = 1;
});

watch(filteredShops, () => {
  const validIds = new Set(filteredShops.value.map((s) => s.id));
  selectedIds.value = selectedIds.value.filter((id) => validIds.has(id));
});

const isAllSelected = computed(() => {
  return paginatedShops.value.length > 0 && paginatedShops.value.every((s) => selectedIds.value.includes(s.id));
});

const isSomeSelected = computed(() => {
  return selectedIds.value.length > 0 && !isAllSelected.value;
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = paginatedShops.value.map((s) => s.id);
  }
}

function toggleSelectItem(id) {
  const idx = selectedIds.value.indexOf(id);
  if (idx > -1) {
    selectedIds.value.splice(idx, 1);
  } else {
    selectedIds.value.push(id);
  }
}

async function loadData() {
  await settingsStore.loadSettings();
  masterForm.value = {
    defaultMilkPrice: Number(settingsStore.settings.defaultMilkPrice) || 180,
    canWeightKg: Number(settingsStore.settings.canWeightKg) || 50,
  };
  const [shopsList, areasList] = await Promise.all([
    mastersService.getShops(),
    mastersService.getAreas(),
  ]);
  shops.value = shopsList;
  areas.value = areasList;
}

async function saveMasterPrice() {
  const newPrice = Number(masterForm.value.defaultMilkPrice);
  const newCanKg = Number(masterForm.value.canWeightKg);

  if (isNaN(newPrice) || newPrice < 0) {
    snackbar.error('Please enter a valid milk price');
    return;
  }
  if (isNaN(newCanKg) || newCanKg <= 0) {
    snackbar.error('Can weight must be greater than 0 Kg');
    return;
  }

  savingMaster.value = true;
  try {
    await settingsStore.updateSettings({
      defaultMilkPrice: newPrice,
      canWeightKg: newCanKg,
    });

    if (applyToAllShops.value) {
      const updatedCount = await mastersService.updateAllShopsDefaultPrice(newPrice);
      shops.value = await mastersService.getShops();
      snackbar.success(
        `Master Milk Price updated to ${formatCurrency(newPrice)}/Kg (1 Can = ${newCanKg} Kg) across all ${updatedCount} shops!`
      );
    } else {
      snackbar.success(`Master Milk Price updated to ${formatCurrency(newPrice)}/Kg (1 Can = ${newCanKg} Kg)`);
    }
  } catch (err) {
    snackbar.error('Failed to update master milk price');
  } finally {
    savingMaster.value = false;
  }
}

async function syncAllShopsToMaster() {
  syncingAll.value = true;
  try {
    const count = await mastersService.updateAllShopsDefaultPrice(savedMasterPrice.value);
    shops.value = await mastersService.getShops();
    snackbar.success(`Synced all ${count} shops to ${formatCurrency(savedMasterPrice.value)}/Kg`);
  } catch (err) {
    snackbar.error('Failed to sync shops');
  } finally {
    syncingAll.value = false;
  }
}

async function syncSingleShop(shop) {
  try {
    await mastersService.updateShopsDefaultPrice([shop.id], savedMasterPrice.value);
    shops.value = await mastersService.getShops();
    snackbar.success(`${shop.name} updated to ${formatCurrency(savedMasterPrice.value)}/Kg`);
  } catch (err) {
    snackbar.error('Failed to update shop price');
  }
}

async function applyMasterToSelected() {
  if (selectedIds.value.length === 0) return;
  bulkUpdating.value = true;
  try {
    await mastersService.updateShopsDefaultPrice(selectedIds.value, savedMasterPrice.value);
    snackbar.success(`Applied Master Rate (${formatCurrency(savedMasterPrice.value)}) to ${selectedIds.value.length} shop(s)`);
    selectedIds.value = [];
    shops.value = await mastersService.getShops();
  } catch (err) {
    snackbar.error('Failed to update selected shops');
  } finally {
    bulkUpdating.value = false;
  }
}

function openCustomPriceModal(shop = null) {
  targetShop.value = shop;
  customPriceValue.value = shop ? (Number(shop.defaultPrice) || savedMasterPrice.value) : savedMasterPrice.value;
  customPriceDialog.value = true;
}

async function saveCustomPrice() {
  const val = Number(customPriceValue.value);
  if (isNaN(val) || val < 0) {
    snackbar.error('Enter a valid price');
    return;
  }
  bulkUpdating.value = true;
  try {
    const ids = targetShop.value ? [targetShop.value.id] : [...selectedIds.value];
    await mastersService.updateShopsDefaultPrice(ids, val);
    snackbar.success(`Updated rate to ${formatCurrency(val)}/Kg for ${ids.length} shop(s)`);
    customPriceDialog.value = false;
    selectedIds.value = [];
    shops.value = await mastersService.getShops();
  } catch (err) {
    snackbar.error('Failed to update custom price');
  } finally {
    bulkUpdating.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.master-rate-toolbar {
  border-color: #cbd5e1 !important;
}

.can-preview-pill {
  border-color: #90caf9 !important;
  white-space: nowrap;
}
</style>

