<template>
  <MilkArrivalMobileView v-if="display.smAndDown.value" />
  <div v-else class="page-container table-page">
    <div class="page-header">
      <div>
        <h1 class="page-header-title">Milk Arrival Register</h1>
        <p class="page-header-subtitle">Daily recording of raw milk received from farm milking and village suppliers</p>
      </div>

      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        class="text-capitalize font-weight-bold px-5"
        :disabled="businessDayStore.isLockedOnPreviousDay"
        :title="businessDayStore.isLockedOnPreviousDay ? businessDayStore.lockReason : 'Record Milk Arrival'"
        @click="openDialog()"
      >
        Record Milk Arrival
      </v-btn>
    </div>

    <!-- Summary Cards -->
    <v-row dense class="mb-3">
      <v-col cols="6" sm="6" md="3">
        <StatCard
          label="Total Milk (Kg)"
          :value="`${formatNumber(dailyTotals.totalKg)} Kg`"
          color="info"
          :subtitle="`Est. Value: ${formatCurrency(dailyTotals.totalKg * masterMilkPrice)} (@ ${formatCurrency(masterMilkPrice)}/Kg)`"
        />
      </v-col>
      <v-col cols="6" sm="6" md="3">
        <StatCard
          label="Total Milk (Liters)"
          :value="`${formatNumber(dailyTotals.totalLiters)} L`"
          color="primary"
          :subtitle="`Factor: ${settingsStore.settings.literToKgFactor || 1.03} Kg/Liter`"
        />
      </v-col>
      <v-col cols="6" sm="6" md="3">
        <StatCard
          label="Available Cash"
          :value="formatCurrency(dailyTotals.totalAvailableCash)"
          color="teal"
          subtitle="Recorded across arrivals"
        />
      </v-col>
      <v-col cols="6" sm="6" md="3">
        <StatCard
          label="Total Entries"
          :value="dailyTotals.count"
          color="success"
          subtitle="Batches recorded today"
        />
      </v-col>
    </v-row>

    <!-- Table Card -->
    <v-card class="modern-card pa-4 table-card-full" elevation="0">
      <div class="d-flex align-center justify-space-between mb-3 flex-wrap" style="gap: 16px;">
        <div class="d-flex align-center flex-wrap" style="gap: 12px;">
          <div style="min-width: 260px; width: 280px;">
            <AppDatePicker
              v-model="selectedDate"
              label="Filter Date"
              clearable
              hide-details
              @change="loadArrivals"
            />
          </div>
          <v-btn
            v-if="selectedDate"
            variant="flat"
            size="small"
            prepend-icon="mdi-calendar-range"
            class="text-capitalize accent-orange-btn"
            @click="clearDateFilter"
          >
            Show All Dates
          </v-btn>
        </div>

        <div class="text-caption text-grey font-weight-medium">
          Showing {{ arrivals.length }} records
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      <BulkActionsBar
        v-if="authStore.isAdmin"
        :count="selectedIds.length"
        item-label="record"
        @clear="selectedIds = []"
      >
        <template #actions>
          <v-btn
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
              <th v-if="authStore.isAdmin" class="table-checkbox-col">
                <v-checkbox-btn
                  :model-value="isAllSelected"
                  :indeterminate="isSomeSelected"
                  color="primary"
                  density="compact"
                  @update:model-value="toggleSelectAll"
                />
              </th>
              <th>Date</th>
              <th>Source / Batch</th>
              <th class="text-end">Original Qty</th>
              <th>Unit</th>
              <th class="text-end">Quantity (Kg)</th>
              <th class="text-end">Quantity (Liters)</th>
              <th class="text-end">Available Cash</th>
              <th>Notes</th>
              <th v-if="authStore.isAdmin" class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in paginatedArrivals"
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
              <td class="font-weight-bold text-dark">
                <v-icon size="16" color="primary" class="me-1">mdi-calendar</v-icon>
                {{ formatDate(item.date) }}
              </td>
              <td class="font-weight-medium text-primary">
                <span class="erp-tag erp-tag-blue">
                  {{ item.source || 'Farm Collection' }}
                </span>
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(item.quantity) }}
              </td>
              <td>
                <span class="erp-tag erp-tag-green">
                  {{ item.unit }}
                </span>
              </td>
              <td class="text-end font-weight-bold text-info">
                {{ formatNumber(item.quantityKg) }} Kg
              </td>
              <td class="text-end font-weight-medium text-grey-darken-2">
                {{ formatNumber(item.quantityLiters) }} L
              </td>
              <td class="text-end font-weight-bold text-success">
                {{ formatCurrency(item.availableCash || 0) }}
              </td>
              <td class="text-caption text-grey-darken-1">{{ item.notes || '-' }}</td>
              <td v-if="authStore.isAdmin" class="text-end">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  color="primary"
                  @click="openDialog(item)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="confirmDelete(item)"
                />
              </td>
            </tr>
            <tr v-if="arrivals.length === 0">
              <td :colspan="authStore.isAdmin ? 10 : 8" class="text-center pa-8">
                <div class="empty-state-box">
                  <v-icon class="empty-state-icon">mdi-bucket-outline</v-icon>
                  <div class="empty-state-title">No Milk Arrivals Found</div>
                  <div class="empty-state-subtitle">No milk arrivals recorded for {{ selectedDate ? formatDate(selectedDate) : 'the selected filter' }}.</div>
                  <v-btn color="primary" variant="flat" size="small" class="mt-2 text-capitalize font-weight-bold" prepend-icon="mdi-plus" @click="openDialog()">
                    Record Milk Arrival
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
        :total-items="arrivals.length"
      />
    </v-card>

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card class="rounded-xl pa-3">
        <v-card-title class="font-weight-bold pt-3 px-4">
          {{ isEdit ? 'Edit Milk Arrival' : 'Record Milk Arrival' }}
        </v-card-title>
        <v-card-text class="px-4 py-2">
          <v-form ref="formRef" v-model="formValid">
            <AppDatePicker
              v-model="form.date"
              label="Arrival Date *"
              density="comfortable"
              :rules="[v => !!v || 'Date is required']"
              class="mb-3"
            />

            <v-row dense class="mb-1">
              <v-col cols="7">
                <v-text-field
                  v-model.number="form.quantity"
                  type="number"
                  label="Milk Quantity *"
                  placeholder="e.g. 500"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v && v > 0 || 'Quantity must be greater than 0']"
                />
              </v-col>
              <v-col cols="5">
                <v-select
                  v-model="form.unit"
                  :items="['Liter', 'Kg', 'Can']"
                  label="Unit *"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </v-row>

            <!-- Conversion Preview Pill -->
            <v-alert
              type="info"
              variant="tonal"
              density="compact"
              class="mb-3 rounded-lg text-caption"
            >
              <template v-if="form.unit === 'Can'">
                <strong>Equivalent:</strong>
                {{ formatNumber(computedEquivalentKg) }} Kg ({{ formatNumber(computedEquivalentLiters) }} Liters)
                <span class="text-grey-darken-1">&bull; 1 Can = {{ kgPerCan }} Kg &bull; Est. {{ formatCurrency(computedEquivalentKg * masterMilkPrice) }}</span>
              </template>
              <template v-else>
                <strong>Equivalent:</strong>
                {{ form.unit === 'Liter' ? `${formatNumber(computedEquivalentKg)} Kg` : `${formatNumber(computedEquivalentLiters)} Liters` }}
                <span class="text-grey-darken-1">(factor: {{ factor }} kg/liter)</span>
              </template>
            </v-alert>

            <v-combobox
              v-model="form.source"
              :items="sourceOptions"
              label="Source / Supplier *"
              placeholder="Select or enter source"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />

            <v-text-field
              v-model.number="form.availableCash"
              type="number"
              label="Available Cash"
              placeholder="e.g. 5000"
              prepend-inner-icon="mdi-currency-pkr"
              min="0"
              variant="outlined"
              density="comfortable"
              :rules="[v => v === '' || v === null || v === undefined || Number(v) >= 0 || 'Available Cash cannot be negative']"
              class="mb-3"
            />

            <v-textarea
              v-model="form.notes"
              label="Notes"
              placeholder="Fat content, temperature, batch or collection notes"
              variant="outlined"
              rows="2"
              density="comfortable"
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="px-4 pb-3 justify-end">
          <v-btn variant="text" class="text-capitalize" @click="dialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="text-capitalize rounded-lg px-4"
            :loading="saving"
            @click="saveArrival"
          >
            Save Record
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="deleteDialog"
      title="Delete Milk Arrival"
      :message="`Are you sure you want to delete this arrival of ${targetArrival?.quantity} ${targetArrival?.unit}?`"
      :loading="deleting"
      @confirm="executeDelete"
    />

    <!-- Bulk Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="bulkDeleteDialog"
      title="Bulk Delete Milk Arrivals"
      :message="`Are you sure you want to delete ${selectedIds.length} selected milk arrival record(s)? This action cannot be undone.`"
      :loading="bulkDeleting"
      @confirm="executeBulkDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useDisplay } from 'vuetify';
import MilkArrivalMobileView from './MilkArrivalMobileView.vue';
import { milkService } from '@/services/milkService';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import { useBusinessDayStore } from '@/stores/businessDay';
import { useSnackbarStore } from '@/stores/snackbar';
import { formatCurrency, formatNumber, formatDate, getOffsetDateString } from '@/utils/formatters';
import { convertLiterToKg, convertKgToLiter, convertCanToKg } from '@/utils/calculations';
import StatCard from '@/components/common/StatCard.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import AppDatePicker from '@/components/common/AppDatePicker.vue';
import BulkActionsBar from '@/components/common/BulkActionsBar.vue';
import AppPagination from '@/components/common/AppPagination.vue';

const snackbar = useSnackbarStore();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const businessDayStore = useBusinessDayStore();
const display = useDisplay();

const selectedDate = ref(businessDayStore.activeBusinessDate);
const arrivals = ref([]);
const page = ref(1);
const itemsPerPage = ref(10);
const selectedIds = ref([]);
const bulkDeleteDialog = ref(false);
const bulkDeleting = ref(false);

const paginatedArrivals = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  return arrivals.value.slice(start, start + itemsPerPage.value);
});

const isAllSelected = computed(() => {
  return paginatedArrivals.value.length > 0 && paginatedArrivals.value.every(item => selectedIds.value.includes(item.id));
});

const isSomeSelected = computed(() => {
  return selectedIds.value.length > 0 && !isAllSelected.value;
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = paginatedArrivals.value.map(item => item.id);
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
const dialog = ref(false);
const deleteDialog = ref(false);
const isEdit = ref(false);
const formValid = ref(true);
const saving = ref(false);
const deleting = ref(false);
const targetArrival = ref(null);

const sourceOptions = [
  'Morning Farm Milking',
  'Evening Farm Milking',
  'Village Collection Center',
  'External Dairy Supplier',
  'Bulk Tanker Transfer',
];

const form = ref({
  id: null,
  date: businessDayStore.activeBusinessDate,
  quantity: 500,
  unit: 'Liter',
  availableCash: 0,
  source: 'Morning Farm Milking',
  notes: '',
});

const factor = computed(() => {
  return Number(settingsStore.settings.literToKgFactor) || 1.03;
});

const kgPerCan = computed(() => {
  return Number(settingsStore.settings.canWeightKg) || 50;
});

const masterMilkPrice = computed(() => {
  return Number(settingsStore.settings.defaultMilkPrice) || 180;
});

const computedEquivalentKg = computed(() => {
  const q = Number(form.value.quantity) || 0;
  if (form.value.unit === 'Can') {
    return convertCanToKg(q, kgPerCan.value);
  }
  return convertLiterToKg(q, factor.value);
});

const computedEquivalentLiters = computed(() => {
  const q = Number(form.value.quantity) || 0;
  if (form.value.unit === 'Can') {
    return convertKgToLiter(computedEquivalentKg.value, factor.value);
  }
  return convertKgToLiter(q, factor.value);
});

const dailyTotals = computed(() => {
  return arrivals.value.reduce(
    (acc, curr) => {
      acc.totalLiters += Number(curr.quantityLiters) || 0;
      acc.totalKg += Number(curr.quantityKg) || 0;
      acc.totalAvailableCash += Number(curr.availableCash) || 0;
      acc.count += 1;
      return acc;
    },
    { totalLiters: 0, totalKg: 0, totalAvailableCash: 0, count: 0 }
  );
});

async function loadArrivals() {
  try {
    selectedIds.value = [];
    arrivals.value = await milkService.getMilkArrivals(selectedDate.value);
    page.value = 1;
  } catch (err) {
    snackbar.error('Failed to load milk arrivals');
  }
}

function setToday() {
  if (businessDayStore.isLockedOnPreviousDay) {
    snackbar.warning(businessDayStore.lockReason);
  }
  selectedDate.value = businessDayStore.activeBusinessDate;
  loadArrivals();
}

function setYesterday() {
  selectedDate.value = getOffsetDateString(businessDayStore.activeBusinessDate, -1);
  loadArrivals();
}

function clearDateFilter() {
  selectedDate.value = null;
  loadArrivals();
}

function openDialog(item = null) {
  if (item && !authStore.isAdmin) {
    snackbar.error('Staff members can only add new records, not edit existing records.');
    return;
  }
  if (!item && businessDayStore.isLockedOnPreviousDay) {
    snackbar.error(businessDayStore.lockReason);
    return;
  }
  if (item) {
    isEdit.value = true;
    form.value = {
      ...item,
      availableCash: Number(item.availableCash) || 0,
    };
  } else {
    isEdit.value = false;
    form.value = {
      id: null,
      date: selectedDate.value || businessDayStore.activeBusinessDate,
      quantity: 500,
      unit: 'Liter',
      availableCash: 0,
      source: 'Morning Farm Milking',
      notes: '',
    };
  }
  dialog.value = true;
}

async function saveArrival() {
  await businessDayStore.refreshBusinessDay();
  if (!isEdit.value && businessDayStore.isLockedOnPreviousDay) {
    snackbar.error(businessDayStore.lockReason);
    return;
  }
  const dateCheck = businessDayStore.validateOperationDate(form.value.date);
  if (!dateCheck.valid) {
    snackbar.error(dateCheck.message);
    return;
  }

  if (!form.value.quantity || form.value.quantity <= 0) {
    snackbar.error('Please enter a valid milk quantity');
    return;
  }
  if (Number(form.value.availableCash) < 0) {
    snackbar.error('Available Cash cannot be negative');
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await milkService.updateMilkArrival(form.value.id, form.value);
      snackbar.success('Milk arrival updated successfully');
    } else {
      await milkService.addMilkArrival(form.value);
      snackbar.success('Milk arrival recorded successfully');
    }
    dialog.value = false;
    await Promise.all([loadArrivals(), businessDayStore.refreshBusinessDay()]);
  } catch (err) {
    snackbar.error(err.message || 'Failed to save record');
  } finally {
    saving.value = false;
  }
}

function confirmDelete(item) {
  if (!authStore.isAdmin) {
    snackbar.error('Staff members are not permitted to delete records.');
    return;
  }
  if (businessDayStore.closedDates.includes(item.date)) {
    snackbar.error(`${formatDate(item.date)} is closed. Reopen it in Day Closing before deleting.`);
    return;
  }
  targetArrival.value = item;
  deleteDialog.value = true;
}

async function executeDelete() {
  if (!authStore.isAdmin) return;
  if (!targetArrival.value) return;
  deleting.value = true;
  try {
    await milkService.deleteMilkArrival(targetArrival.value.id, targetArrival.value.date);
    snackbar.success('Milk arrival deleted');
    deleteDialog.value = false;
    await Promise.all([loadArrivals(), businessDayStore.refreshBusinessDay()]);
  } catch (err) {
    snackbar.error('Failed to delete milk arrival');
  } finally {
    deleting.value = false;
  }
}

function confirmBulkDelete() {
  if (!authStore.isAdmin) {
    snackbar.error('Staff members are not permitted to delete records.');
    return;
  }
  if (selectedIds.value.length === 0) return;
  const closedMatch = arrivals.value.find(
    (a) => selectedIds.value.includes(a.id) && businessDayStore.closedDates.includes(a.date)
  );
  if (closedMatch) {
    snackbar.error(`Cannot delete entries from closed date ${formatDate(closedMatch.date)}. Reopen day first.`);
    return;
  }
  bulkDeleteDialog.value = true;
}

async function executeBulkDelete() {
  bulkDeleting.value = true;
  try {
    const toDelete = [...selectedIds.value];
    for (const id of toDelete) {
      const item = arrivals.value.find(a => a.id === id);
      await milkService.deleteMilkArrival(id, item?.date);
    }
    snackbar.success(`${toDelete.length} milk arrival(s) deleted`);
    selectedIds.value = [];
    bulkDeleteDialog.value = false;
    await Promise.all([loadArrivals(), businessDayStore.refreshBusinessDay()]);
  } catch (err) {
    snackbar.error('Failed to delete some records');
  } finally {
    bulkDeleting.value = false;
  }
}

watch(
  () => businessDayStore.activeBusinessDate,
  (newDate, oldDate) => {
    if (selectedDate.value === oldDate || (businessDayStore.isLockedOnPreviousDay && selectedDate.value > newDate)) {
      selectedDate.value = newDate;
      loadArrivals();
    }
  }
);

onMounted(async () => {
  await Promise.all([settingsStore.loadSettings(), businessDayStore.refreshBusinessDay()]);
  selectedDate.value = businessDayStore.activeBusinessDate;
  form.value.date = businessDayStore.activeBusinessDate;
  await loadArrivals();
});
</script>

