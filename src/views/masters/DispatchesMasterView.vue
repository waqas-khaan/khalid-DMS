<template>
  <div class="dispatches-master-view">
    <v-card class="modern-card pa-4 table-card-full" elevation="0">
      <!-- Master Action Permission Controls (Admin) -->
      <div v-if="authStore.isAdmin" class="d-flex align-center justify-space-between flex-wrap gap-2 px-3 py-2 mb-3 rounded-lg bg-blue-grey-lighten-5 border">
        <div class="d-flex align-center gap-2">
          <v-icon size="20" color="primary">mdi-shield-lock-outline</v-icon>
          <div>
            <div class="text-caption font-weight-bold text-grey-darken-4" style="line-height: 1.2;">
              Master Action Controls
            </div>
            <div class="text-caption text-grey-darken-1" style="font-size: 0.72rem;">
              Control visibility of Edit and Delete buttons across Milk Dispatch history &amp; records
            </div>
          </div>
        </div>
        <div class="d-flex align-center gap-4 flex-wrap">
          <v-switch
            :model-value="settingsStore.settings.allowEditDispatch !== false"
            color="primary"
            density="compact"
            hide-details
            label="Enable Edit Dispatch"
            class="ma-0 text-caption font-weight-bold"
            @update:model-value="toggleActionSetting('allowEditDispatch', $event)"
          />
          <v-switch
            :model-value="settingsStore.settings.allowDeleteDispatch !== false"
            color="error"
            density="compact"
            hide-details
            label="Enable Delete Dispatch"
            class="ma-0 text-caption font-weight-bold"
            @update:model-value="toggleActionSetting('allowDeleteDispatch', $event)"
          />
        </div>
      </div>

      <!-- Search & Date Filter Bar -->
      <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-3 flex-shrink-0">
        <div class="d-flex align-center flex-wrap gap-2 flex-grow-1">
          <div style="min-width: 240px; width: 260px;">
            <AppDatePicker
              v-model="dateFilter"
              label="Filter by Date"
              clearable
              hide-details
              @change="loadDispatches"
            />
          </div>
          <v-btn
            v-if="dateFilter"
            variant="flat"
            size="small"
            class="text-capitalize accent-orange-btn"
            prepend-icon="mdi-calendar-range"
            @click="dateFilter = null; loadDispatches()"
          >
            Show All Dates
          </v-btn>
          <v-text-field
            v-model="searchQuery"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search route, vehicle, driver..."
            variant="outlined"
            density="compact"
            hide-details
            style="min-width: 220px; max-width: 320px;"
            clearable
          />
        </div>

        <div class="d-flex align-center gap-2">
          <v-chip color="primary" variant="tonal" size="small" class="font-weight-bold">
            {{ filteredDispatches.length }} Dispatches
          </v-chip>
          <v-btn
            color="primary"
            variant="flat"
            size="small"
            prepend-icon="mdi-plus"
            class="text-capitalize font-weight-bold px-4"
            to="/milk-dispatch"
          >
            New Dispatch
          </v-btn>
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      <BulkActionsBar
        v-if="authStore.isAdmin && settingsStore.settings.allowDeleteDispatch !== false"
        :count="selectedIds.length"
        item-label="dispatch"
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

      <!-- Dispatches Master Table -->
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
              <th>Area / Route</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Calander</th>
              <th>Status</th>
              <th class="text-end">Milk (Kg)</th>
              <th class="text-end">Today Amount</th>
              <th class="text-end">Prev Arrears</th>
              <th class="text-end">Total Payable</th>
              <th class="text-end">Today Collection</th>
              <th class="text-end">New Arrears</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="d in paginatedDispatches"
              :key="d.id"
              :class="{ 'selected-row': selectedIds.includes(d.id) }"
            >
              <td v-if="authStore.isAdmin" class="table-checkbox-col">
                <v-checkbox-btn
                  :model-value="selectedIds.includes(d.id)"
                  color="primary"
                  density="compact"
                  @update:model-value="toggleSelectItem(d.id)"
                  @click.stop
                />
              </td>
              <td class="font-weight-bold text-dark" style="white-space: nowrap;">
                <v-icon size="16" color="primary" class="me-1">mdi-calendar</v-icon>
                {{ formatDate(d.date) }}
              </td>
              <td class="font-weight-bold text-primary">{{ d.areaName }}</td>
              <td>{{ d.vehicleNumber }}</td>
              <td>{{ d.driverName }}</td>
              <td>{{ d.calanderName || '-' }}</td>
              <td>
                <span
                  class="erp-tag"
                  :class="d.status === 'Dispatched' ? 'erp-tag-orange' : 'erp-tag-green'"
                >
                  {{ d.status === 'Dispatched' ? 'DISPATCHED' : 'RETURNED' }}
                </span>
              </td>
              <td class="text-end font-weight-bold text-info" style="white-space: nowrap;">
                {{ formatNumber(d.totalMilk) }} Kg
                <div v-if="d.totalReturnMilk > 0" class="text-caption text-orange-darken-3 font-weight-medium">
                  Ret: {{ formatNumber(d.totalReturnMilk) }} Kg
                </div>
              </td>
              <td class="text-end font-weight-bold text-dark" style="white-space: nowrap;">
                {{ formatCurrency(d.totalAmount) }}
              </td>
              <td class="text-end text-grey-darken-2" style="white-space: nowrap;">
                {{ formatCurrency(d.totalPreviousArrears) }}
              </td>
              <td class="text-end font-weight-bold text-dark" style="white-space: nowrap;">
                {{ formatCurrency((d.totalAmount || 0) + (d.totalPreviousArrears || 0)) }}
              </td>
              <td class="text-end font-weight-bold text-success" style="white-space: nowrap;">
                {{ formatCurrency(d.totalCollection) }}
              </td>
              <td class="text-end font-weight-bold" :class="(d.totalNewArrears || 0) > 0 ? 'text-error' : 'text-success'" style="white-space: nowrap;">
                {{ formatCurrency(d.totalNewArrears) }}
              </td>
              <td class="text-end" style="white-space: nowrap;">
                <v-btn
                  icon="mdi-eye"
                  size="small"
                  variant="text"
                  color="blue-grey"
                  title="View Dispatch Breakdown"
                  @click="viewDispatch(d)"
                />
                <v-btn
                  v-if="canEditDispatch(d)"
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  color="primary"
                  title="Edit Dispatch"
                  @click="goToEditDispatch(d)"
                />
                <v-btn
                  v-if="canDeleteDispatch(d)"
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  title="Delete Dispatch (Admin)"
                  @click="promptDelete(d)"
                />
              </td>
            </tr>
            <tr v-if="filteredDispatches.length === 0">
              <td :colspan="authStore.isAdmin ? 14 : 13" class="text-center pa-8">
                <div class="empty-state-box">
                  <v-icon class="empty-state-icon">mdi-clipboard-text-off-outline</v-icon>
                  <div class="empty-state-title">No Dispatches Found</div>
                  <div class="empty-state-subtitle">There are no dispatch records matching the selected filter.</div>
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <AppPagination
        v-model:page="page"
        v-model:itemsPerPage="itemsPerPage"
        :total-items="filteredDispatches.length"
      />
    </v-card>

    <!-- Dispatch Summary / Breakdown Dialog -->
    <v-dialog v-model="summaryDialog" max-width="1000" width="92vw">
      <v-card v-if="selectedDispatch" class="rounded-xl pa-4">
        <div class="d-flex align-center justify-space-between pb-3 border-b">
          <div>
            <h2 class="text-h6 font-weight-bold text-primary mb-0">Dispatch Receipt &amp; Breakdown</h2>
            <div class="text-caption text-grey">
              {{ selectedDispatch.areaName }} Route | Date: {{ formatDate(selectedDispatch.date) }}
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="summaryDialog = false" />
        </div>

        <div class="my-3">
          <v-row dense class="align-center">
            <v-col cols="3"><span class="text-caption text-grey">Vehicle:</span> <strong>{{ selectedDispatch.vehicleNumber }}</strong></v-col>
            <v-col cols="3"><span class="text-caption text-grey">Driver:</span> <strong>{{ selectedDispatch.driverName }}</strong></v-col>
            <v-col cols="3"><span class="text-caption text-grey">Calander:</span> <strong>{{ selectedDispatch.calanderName || '-' }}</strong></v-col>
            <v-col cols="3" class="text-end">
              <span class="text-caption text-grey me-2">Status:</span>
              <span class="erp-tag" :class="selectedDispatch.status === 'Dispatched' ? 'erp-tag-orange' : 'erp-tag-green'">
                {{ selectedDispatch.status === 'Dispatched' ? 'DISPATCHED' : 'RETURNED' }}
              </span>
            </v-col>
          </v-row>
        </div>

        <v-table density="compact" class="border rounded-lg mb-4">
          <thead>
            <tr class="bg-grey-lighten-4">
              <th>Shop</th>
              <th class="text-end">Price</th>
              <th class="text-end">Sent (Kg)</th>
              <th v-if="selectedDispatch.totalReturnMilk > 0" class="text-end">Return (Kg)</th>
              <th class="text-end">Net Milk</th>
              <th class="text-end">Today Amount</th>
              <th class="text-end">Prev Arrears</th>
              <th class="text-end">Total Payable</th>
              <th class="text-end">Today Collection</th>
              <th class="text-end">New Arrears</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in (selectedDispatch.items || [])" :key="it.shopId || it.id">
              <td><strong>{{ it.shopCode }}</strong> - {{ it.shopName }}</td>
              <td class="text-end">{{ formatCurrency(it.price) }}</td>
              <td class="text-end font-weight-medium">{{ formatNumber(it.kgs ?? it.todayMilk) }} Kg</td>
              <td v-if="selectedDispatch.totalReturnMilk > 0" class="text-end text-orange-darken-3 font-weight-bold">
                {{ formatNumber(it.returnKgs || 0) }} Kg
              </td>
              <td class="text-end font-weight-bold">{{ formatNumber(it.todayMilk) }} Kg</td>
              <td class="text-end">{{ formatCurrency(it.todayAmount) }}</td>
              <td class="text-end">{{ formatCurrency(it.previousArrears) }}</td>
              <td class="text-end font-weight-bold">{{ formatCurrency(it.totalPayable) }}</td>
              <td class="text-end text-success font-weight-bold">{{ formatCurrency(it.todayCollection) }}</td>
              <td class="text-end text-error font-weight-bold">{{ formatCurrency(it.newArrears) }}</td>
            </tr>
          </tbody>
        </v-table>

        <v-card-actions class="px-0 pt-2 justify-end">
          <v-btn variant="text" class="text-capitalize" @click="summaryDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Single Dispatch Confirmation -->
    <ConfirmDialog
      v-model="deleteDialog"
      title="Delete Dispatch Record"
      :message="`Are you sure you want to delete dispatch for ${targetDispatch?.areaName} (${targetDispatch?.vehicleNumber}) on ${formatDate(targetDispatch?.date)}? Shop arrears will be rolled back.`"
      confirm-text="Delete Dispatch"
      confirm-color="error"
      :loading="deleting"
      @confirm="executeDelete"
    />

    <!-- Bulk Delete Confirmation -->
    <ConfirmDialog
      v-model="bulkDeleteDialog"
      title="Bulk Delete Dispatches"
      :message="`Are you sure you want to delete ${selectedIds.length} selected dispatch(es)? Associated shop arrears will be rolled back.`"
      confirm-text="Delete Selected"
      confirm-color="error"
      :loading="bulkDeleting"
      @confirm="executeBulkDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { dispatchService } from '@/services/dispatchService';
import { useAuthStore } from '@/stores/auth';
import { useBusinessDayStore } from '@/stores/businessDay';
import { useSnackbarStore } from '@/stores/snackbar';
import { useSettingsStore } from '@/stores/settings';
import { formatDate, formatCurrency, formatNumber } from '@/utils/formatters';
import AppDatePicker from '@/components/common/AppDatePicker.vue';
import AppPagination from '@/components/common/AppPagination.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import BulkActionsBar from '@/components/common/BulkActionsBar.vue';

const router = useRouter();
const authStore = useAuthStore();
const businessDayStore = useBusinessDayStore();
const snackbar = useSnackbarStore();
const settingsStore = useSettingsStore();

const dispatches = ref([]);
const dateFilter = ref(null);
const searchQuery = ref('');
const page = ref(1);
const itemsPerPage = ref(10);
const selectedIds = ref([]);

const summaryDialog = ref(false);
const selectedDispatch = ref(null);
const deleteDialog = ref(false);
const targetDispatch = ref(null);
const deleting = ref(false);
const bulkDeleteDialog = ref(false);
const bulkDeleting = ref(false);

async function toggleActionSetting(key, val) {
  try {
    await settingsStore.updateSettings({ [key]: val });
    snackbar.success(`Dispatch ${key === 'allowEditDispatch' ? 'Edit' : 'Delete'} action ${val ? 'enabled' : 'disabled'}`);
  } catch (err) {
    snackbar.error('Failed to update action settings');
  }
}

function canEditDispatch(d) {
  if (!d) return false;
  if (settingsStore.settings.allowEditDispatch === false) return false;
  return authStore.isAdmin;
}

function canDeleteDispatch(d) {
  if (!d) return false;
  if (settingsStore.settings.allowDeleteDispatch === false) return false;
  return authStore.isAdmin;
}

const filteredDispatches = computed(() => {
  let list = dispatches.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(
      (d) =>
        (d.areaName || '').toLowerCase().includes(q) ||
        (d.vehicleNumber || '').toLowerCase().includes(q) ||
        (d.driverName || '').toLowerCase().includes(q) ||
        (d.calanderName || '').toLowerCase().includes(q)
    );
  }
  return list;
});

const paginatedDispatches = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  return filteredDispatches.value.slice(start, start + itemsPerPage.value);
});

const isAllSelected = computed(() => {
  return (
    paginatedDispatches.value.length > 0 &&
    paginatedDispatches.value.every((d) => selectedIds.value.includes(d.id))
  );
});

const isSomeSelected = computed(() => {
  return selectedIds.value.length > 0 && !isAllSelected.value;
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    const pageIds = new Set(paginatedDispatches.value.map((d) => d.id));
    selectedIds.value = selectedIds.value.filter((id) => !pageIds.has(id));
  } else {
    const combined = new Set([...selectedIds.value, ...paginatedDispatches.value.map((d) => d.id)]);
    selectedIds.value = Array.from(combined);
  }
}

function toggleSelectItem(id) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((x) => x !== id);
  } else {
    selectedIds.value.push(id);
  }
}

async function loadDispatches() {
  try {
    dispatches.value = await dispatchService.getDispatches(dateFilter.value);
  } catch (err) {
    snackbar.error('Failed to load dispatches');
  }
}

async function viewDispatch(d) {
  try {
    selectedDispatch.value = await dispatchService.getDispatchById(d.id);
    summaryDialog.value = true;
  } catch (err) {
    snackbar.error('Failed to load dispatch details');
  }
}

function goToEditDispatch(d) {
  router.push({
    path: '/milk-dispatch',
    query: { tab: 'history', editId: d.id },
  });
}

function promptDelete(d) {
  if (businessDayStore.closedDates.includes(d.date)) {
    snackbar.error(`${formatDate(d.date)} is closed. Reopen day before deleting dispatch.`);
    return;
  }
  targetDispatch.value = d;
  deleteDialog.value = true;
}

async function executeDelete() {
  if (!targetDispatch.value) return;
  deleting.value = true;
  try {
    await dispatchService.deleteDispatch(targetDispatch.value.id, targetDispatch.value.date);
    snackbar.success('Dispatch deleted and shop arrears rolled back.');
    deleteDialog.value = false;
    targetDispatch.value = null;
    await Promise.all([loadDispatches(), businessDayStore.refreshBusinessDay()]);
  } catch (err) {
    snackbar.error(err.message || 'Failed to delete dispatch');
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
      const d = dispatches.value.find((item) => item.id === id);
      await dispatchService.deleteDispatch(id, d?.date);
    }
    snackbar.success(`${toDelete.length} dispatch(es) deleted and shop arrears rolled back.`);
    selectedIds.value = [];
    bulkDeleteDialog.value = false;
    await Promise.all([loadDispatches(), businessDayStore.refreshBusinessDay()]);
  } catch (err) {
    snackbar.error(err.message || 'Failed to delete dispatches');
  } finally {
    bulkDeleting.value = false;
  }
}

onMounted(async () => {
  await Promise.all([settingsStore.loadSettings(), loadDispatches(), businessDayStore.refreshBusinessDay()]);
});
</script>

<style scoped>
.dispatches-master-view {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}
</style>

