<template>
  <div :class="embedded ? 'embedded-master-view' : 'page-container table-page'">
    <div v-if="!embedded" class="page-header">
      <div>
        <h1 class="page-header-title">Shops &amp; Milk Price Master</h1>
        <p class="page-header-subtitle">
          Manage client dairy shops, master milk rate (Rs./Kg), standard Can weight (1 Can = {{ savedCanWeightKg }} Kg), routes, and arrears
        </p>
      </div>

      <div class="d-flex align-center flex-wrap" style="gap: 10px;">
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          class="text-capitalize font-weight-bold px-5"
          @click="openDialog()"
        >
          Add Shop
        </v-btn>
      </div>
    </div>

    <!-- Master Milk & Can Stat Cards Grid -->
    <div class="shops-metrics-grid mb-3">
      <StatCard
        label="Master Milk Price"
        :value="`${formatCurrency(masterMilkPrice)} / Kg`"
        color="primary"
        subtitle="Global default rate across project"
      />
      <StatCard
        label="Per Can Price"
        :value="formatCurrency(masterMilkPrice * savedCanWeightKg)"
        color="info"
        :subtitle="`1 Can (${savedCanWeightKg} Kg) × ${formatCurrency(masterMilkPrice)}`"
      />
      <StatCard
        label="Standard Can Weight"
        :value="`${savedCanWeightKg} Kg`"
        color="teal"
        subtitle="1 Can equals Kg milk"
      />
    </div>

    <!-- Unified Master Price + Shops Table Card -->
    <v-card class="modern-card pa-4 table-card-full" elevation="0">
      <!-- Master Milk Price & Can Weight Control Bar -->
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
          <v-btn
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
            label="Search shops, code, owner, phones..."
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
        <div class="d-flex align-center flex-wrap" style="gap: 10px;">
          <v-chip color="warning" variant="tonal" size="small" class="font-weight-bold">
            Total Arrears: {{ formatCurrency(totalFilteredArrears) }}
          </v-chip>
          <v-chip color="primary" variant="tonal" size="small" class="font-weight-bold">
            {{ filteredShops.length }} Shops
          </v-chip>
          <v-btn
            v-if="embedded"
            color="primary"
            variant="flat"
            size="small"
            prepend-icon="mdi-plus"
            class="text-capitalize font-weight-bold px-4"
            @click="openDialog()"
          >
            Add Shop
          </v-btn>
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      <BulkActionsBar
        :count="selectedIds.length"
        item-label="shop"
        @clear="selectedIds = []"
      >
        <template #actions>
          <v-btn
            v-if="authStore.isAdmin"
            size="small"
            variant="flat"
            color="success"
            class="text-capitalize font-weight-bold"
            prepend-icon="mdi-currency-pkr"
            :loading="bulkUpdating"
            @click="applyMasterPriceToSelected"
          >
            Apply Master Rate ({{ formatCurrency(masterMilkPrice) }})
          </v-btn>
          <v-btn
            v-if="authStore.isAdmin"
            size="small"
            variant="flat"
            color="primary"
            class="text-capitalize font-weight-bold"
            prepend-icon="mdi-pencil"
            @click="openCustomPriceModal(null)"
          >
            Set Custom Price
          </v-btn>
          <v-btn
            v-if="authStore.isAdmin"
            size="small"
            variant="flat"
            color="error"
            class="text-capitalize font-weight-bold"
            prepend-icon="mdi-delete-sweep"
            @click="confirmBulkDelete"
          >
            Delete Selected ({{ selectedIds.length }})
          </v-btn>
        </template>
      </BulkActionsBar>

      <div class="table-responsive flex-grow-1">
        <v-table hover>
          <thead>
            <tr>
              <th class="table-checkbox-col">
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
              <th>Owner Name</th>
              <th>Area / Route</th>
              <th>Phone</th>
              <th class="text-end">Price / Kg (Can Rate)</th>
              <th>Rate Status</th>
              <th class="text-end">Current Arrears</th>
              <th>Status</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in paginatedShops"
              :key="item.id"
              :class="{ 'selected-row': selectedIds.includes(item.id) }"
            >
              <td class="table-checkbox-col">
                <v-checkbox-btn
                  :model-value="selectedIds.includes(item.id)"
                  color="primary"
                  density="compact"
                  @update:model-value="toggleSelectItem(item.id)"
                  @click.stop
                />
              </td>
              <td class="font-weight-bold text-blue-grey-darken-2">
                {{ item.code }}
              </td>
              <td class="font-weight-bold text-primary">
                <v-icon size="18" class="me-1">mdi-store</v-icon>
                {{ item.name }}
              </td>
              <td>{{ item.ownerName || '-' }}</td>
              <td>
                <v-chip size="x-small" color="primary" variant="outlined">
                  {{ getAreaName(item.areaId) }}
                </v-chip>
              </td>
              <td>
                <a v-if="item.phone" :href="'tel:' + item.phone" class="d-flex align-center text-caption text-decoration-none text-primary">
                  <v-icon size="14" color="primary" class="me-1">mdi-phone</v-icon>
                  {{ item.phone }}
                </a>
                <span v-else class="text-grey">-</span>
              </td>
              <td class="text-end tabular-nums" style="white-space: nowrap;">
                <div class="font-weight-bold text-dark">{{ formatCurrency(item.defaultPrice) }}</div>
                <div class="text-caption text-primary">
                  Can: {{ formatCurrency((Number(item.defaultPrice) || 0) * savedCanWeightKg) }}
                </div>
              </td>
              <td>
                <span
                  class="erp-tag"
                  :class="Number(item.defaultPrice) === masterMilkPrice ? 'erp-tag-green' : 'erp-tag-orange'"
                >
                  {{ Number(item.defaultPrice) === masterMilkPrice ? 'MASTER RATE' : 'CUSTOM RATE' }}
                </span>
              </td>
              <td class="text-end font-weight-bold tabular-nums" :class="item.currentArrears > 0 ? 'text-error' : 'text-success'">
                {{ formatCurrency(item.currentArrears) }}
              </td>
              <td>
                <span
                  class="erp-tag"
                  :class="item.active !== false ? 'erp-tag-green' : 'erp-tag-grey'"
                >
                  {{ item.active !== false ? 'ACTIVE' : 'INACTIVE' }}
                </span>
              </td>
              <td class="text-end" style="white-space: nowrap;">
                <v-btn
                  v-if="Number(item.defaultPrice) !== masterMilkPrice"
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
                  v-if="authStore.isAdmin"
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  color="primary"
                  title="Edit Shop"
                  @click="openDialog(item)"
                />
                <v-btn
                  v-if="authStore.isAdmin"
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  title="Delete Shop (Admin)"
                  @click="confirmDelete(item)"
                />
              </td>
            </tr>
            <tr v-if="filteredShops.length === 0">
              <td colspan="11" class="text-center pa-8">
                <div class="empty-state-box">
                  <v-icon class="empty-state-icon">mdi-store-off-outline</v-icon>
                  <div class="empty-state-title">No Customer Shops Found</div>
                  <div class="empty-state-subtitle">Register shops to assign them to delivery routes and track arrears.</div>
                  <v-btn color="primary" variant="flat" size="small" class="mt-2 text-capitalize font-weight-bold" prepend-icon="mdi-plus" @click="openDialog()">
                    Add Shop
                  </v-btn>
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

    <!-- Create / Edit Shop Dialog -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card class="rounded-xl pa-3">
        <v-card-title class="font-weight-bold pt-3 px-4">
          {{ isEdit ? 'Edit Shop' : 'Add New Customer Shop' }}
        </v-card-title>
        <v-card-text class="px-4 py-2">
          <v-form ref="formRef" v-model="formValid">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.code"
                  label="Shop Code *"
                  placeholder="e.g. SHP-101"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Code is required']"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.name"
                  label="Shop Name *"
                  placeholder="e.g. Al-Madina Milk & Sweets"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Shop name is required']"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.ownerName"
                  label="Owner Name"
                  placeholder="e.g. Haji Rafiq"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.phone"
                  label="Phone Number"
                  placeholder="e.g. 0300-1112233"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="form.areaId"
                  :items="areas"
                  item-title="name"
                  item-value="id"
                  label="Area / Route *"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Area is required']"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.defaultPrice"
                  type="number"
                  label="Default Milk Price (per Kg/L) *"
                  placeholder="180"
                  prepend-inner-icon="mdi-currency-pkr"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => v !== undefined && v >= 0 || 'Price is required']"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.openingArrears"
                  type="number"
                  label="Opening Arrears (Rs.)"
                  placeholder="0"
                  prepend-inner-icon="mdi-currency-pkr"
                  variant="outlined"
                  density="comfortable"
                  :disabled="isEdit"
                  hint="Initial starting arrears balance"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" sm="6" v-if="isEdit">
                <v-text-field
                  v-model.number="form.currentArrears"
                  type="number"
                  label="Current Arrears (Rs.)"
                  prepend-inner-icon="mdi-currency-pkr"
                  variant="outlined"
                  density="comfortable"
                  hint="Live balance adjusted by dispatches"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="form.active"
                  label="Shop Active"
                  color="primary"
                  density="compact"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-4 pb-3 justify-end">
          <v-btn variant="text" class="text-capitalize" @click="dialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="text-capitalize rounded-lg px-4"
            :loading="saving"
            @click="saveShop"
          >
            Save Shop
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Custom Shop Price Dialog -->
    <v-dialog v-model="customPriceDialog" max-width="420">
      <v-card class="rounded-xl pa-4">
        <v-card-title class="font-weight-bold px-0 pt-0 text-primary">
          Set Custom Price ({{ selectedIds.length }} Shops)
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

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="deleteDialog"
      title="Delete Shop"
      :message="`Are you sure you want to delete shop ${targetShop?.name} (${targetShop?.code})?`"
      :loading="deleting"
      @confirm="executeDelete"
    />

    <!-- Bulk Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="bulkDeleteDialog"
      title="Bulk Delete Shops"
      :message="`Are you sure you want to delete ${selectedIds.length} selected customer shop(s)? This action cannot be undone.`"
      :loading="bulkDeleting"
      @confirm="executeBulkDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { mastersService } from '@/services/mastersService';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import { useSnackbarStore } from '@/stores/snackbar';
import { formatCurrency } from '@/utils/formatters';
import StatCard from '@/components/common/StatCard.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import AppPagination from '@/components/common/AppPagination.vue';
import BulkActionsBar from '@/components/common/BulkActionsBar.vue';

defineProps({
  embedded: { type: Boolean, default: false },
});

const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const snackbar = useSnackbarStore();

const masterMilkPrice = computed(() => Number(settingsStore.settings.defaultMilkPrice) || 180);
const savedCanWeightKg = computed(() => Number(settingsStore.settings.canWeightKg) || 50);

const shops = ref([]);
const areas = ref([]);
const search = ref('');
const selectedAreaFilter = ref(null);
const page = ref(1);
const itemsPerPage = ref(10);
const selectedIds = ref([]);
const bulkDeleteDialog = ref(false);
const bulkDeleting = ref(false);
const dialog = ref(false);
const deleteDialog = ref(false);
const isEdit = ref(false);
const formValid = ref(true);
const saving = ref(false);
const deleting = ref(false);
const targetShop = ref(null);

// Master Milk Price & Can Controls
const savingMaster = ref(false);
const bulkUpdating = ref(false);
const masterForm = ref({
  defaultMilkPrice: 180,
  canWeightKg: 50,
});
const customPriceDialog = ref(false);
const customPriceValue = ref(180);

const form = ref({
  id: null,
  code: '',
  name: '',
  ownerName: '',
  phone: '',
  areaId: '',
  defaultPrice: 180,
  openingArrears: 0,
  currentArrears: 0,
  active: true,
});

const areaOptions = computed(() => {
  return areas.value.map((a) => ({ id: a.id, name: a.name }));
});

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
      s.ownerName?.toLowerCase().includes(term) ||
      s.phone?.toLowerCase().includes(term)
  );
});

const paginatedShops = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  return filteredShops.value.slice(start, start + itemsPerPage.value);
});

const isAllSelected = computed(() => {
  return paginatedShops.value.length > 0 && paginatedShops.value.every(item => selectedIds.value.includes(item.id));
});

const isSomeSelected = computed(() => {
  return selectedIds.value.length > 0 && !isAllSelected.value;
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = paginatedShops.value.map(item => item.id);
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

watch([search, selectedAreaFilter], () => {
  page.value = 1;
  selectedIds.value = [];
});

const totalFilteredArrears = computed(() => {
  return filteredShops.value.reduce((sum, s) => sum + (Number(s.currentArrears) || 0), 0);
});

async function loadData() {
  try {
    selectedIds.value = [];
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
  } catch (err) {
    snackbar.error('Failed to load shops & milk price master');
  }
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
    snackbar.success(`Master Milk Price updated to ${formatCurrency(newPrice)}/Kg (1 Can = ${newCanKg} Kg)`);
  } catch (err) {
    snackbar.error('Failed to update master milk price');
  } finally {
    savingMaster.value = false;
  }
}

async function syncSingleShop(shop) {
  try {
    await mastersService.updateShopsDefaultPrice([shop.id], masterMilkPrice.value);
    shops.value = await mastersService.getShops();
    snackbar.success(`${shop.name} updated to ${formatCurrency(masterMilkPrice.value)}/Kg`);
  } catch (err) {
    snackbar.error('Failed to update shop price');
  }
}

async function applyMasterPriceToSelected() {
  if (selectedIds.value.length === 0) return;
  bulkUpdating.value = true;
  try {
    await mastersService.updateShopsDefaultPrice(selectedIds.value, masterMilkPrice.value);
    snackbar.success(`Updated milk price to ${formatCurrency(masterMilkPrice.value)}/Kg for ${selectedIds.value.length} shop(s)`);
    await loadData();
  } catch (err) {
    snackbar.error('Failed to apply master price');
  } finally {
    bulkUpdating.value = false;
  }
}

function openCustomPriceModal() {
  if (selectedIds.value.length === 0) return;
  customPriceValue.value = masterMilkPrice.value;
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
    const ids = [...selectedIds.value];
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

function openDialog(item = null) {
  if (item && !authStore.isAdmin) {
    snackbar.error('Staff members can only register new shops, not edit existing records.');
    return;
  }
  if (item) {
    isEdit.value = true;
    form.value = {
      ...item,
      active: item.active !== false,
      openingArrears: item.openingArrears || 0,
      currentArrears: item.currentArrears || 0,
    };
  } else {
    isEdit.value = false;
    form.value = {
      id: null,
      code: `SHP-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      ownerName: '',
      phone: '',
      areaId: areas.value.length > 0 ? areas.value[0].id : '',
      defaultPrice: masterMilkPrice.value,
      openingArrears: 0,
      currentArrears: 0,
      active: true,
    };
  }
  dialog.value = true;
}

async function saveShop() {
  if (!form.value.name || !form.value.code || !form.value.areaId) {
    snackbar.error('Please fill required fields (Name, Code, Area)');
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await mastersService.updateShop(form.value.id, form.value);
      snackbar.success('Shop updated successfully');
    } else {
      await mastersService.createShop(form.value);
      snackbar.success('Shop created successfully');
    }
    dialog.value = false;
    await loadData();
  } catch (err) {
    snackbar.error(err.message || 'Failed to save shop');
  } finally {
    saving.value = false;
  }
}

function confirmDelete(item) {
  targetShop.value = item;
  deleteDialog.value = true;
}

async function executeDelete() {
  if (!targetShop.value) return;
  deleting.value = true;
  try {
    await mastersService.deleteShop(targetShop.value.id);
    snackbar.success('Shop deleted successfully');
    deleteDialog.value = false;
    await loadData();
  } catch (err) {
    snackbar.error('Failed to delete shop');
  } finally {
    deleting.value = false;
  }
}

function confirmBulkDelete() {
  if (selectedIds.value.length === 0) return;
  bulkDeleteDialog.value = true;
}

async function executeBulkDelete() {
  bulkDeleting.value = true;
  try {
    const toDelete = [...selectedIds.value];
    for (const id of toDelete) {
      await mastersService.deleteShop(id);
    }
    snackbar.success(`${toDelete.length} shop(s) deleted successfully`);
    selectedIds.value = [];
    bulkDeleteDialog.value = false;
    await loadData();
  } catch (err) {
    snackbar.error('Failed to delete some shops');
  } finally {
    bulkDeleting.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.shops-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1100px) {
  .shops-metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .shops-metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }
}

.master-rate-toolbar {
  border-color: #cbd5e1 !important;
}

.can-preview-pill {
  border-color: #90caf9 !important;
  white-space: nowrap;
}
</style>
