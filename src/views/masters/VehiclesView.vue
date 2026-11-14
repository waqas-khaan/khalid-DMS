<template>
  <div :class="embedded ? 'embedded-master-view' : 'page-container table-page'">
    <div v-if="!embedded" class="page-header">
      <div>
        <h1 class="page-header-title">Vehicles Master</h1>
        <p class="page-header-subtitle">Manage delivery trucks, pickups, and milk transport fleet</p>
      </div>

      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        class="text-capitalize font-weight-bold px-5"
        @click="openDialog()"
      >
        Add Vehicle
      </v-btn>
    </div>

    <!-- Table Card -->
    <v-card class="modern-card pa-4 table-card-full" elevation="0">
      <div class="d-flex align-center justify-space-between mb-3 flex-wrap" style="gap: 16px;">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search vehicles..."
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 320px;"
          clearable
        />
        <div class="d-flex align-center flex-wrap" style="gap: 10px;">
          <v-chip color="primary" variant="tonal" size="small">
            Total: {{ filteredVehicles.length }} Vehicles
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
            Add Vehicle
          </v-btn>
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      <BulkActionsBar
        :count="selectedIds.length"
        item-label="vehicle"
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
              <th class="table-checkbox-col">
                <v-checkbox-btn
                  :model-value="isAllSelected"
                  :indeterminate="isSomeSelected"
                  color="primary"
                  density="compact"
                  @update:model-value="toggleSelectAll"
                />
              </th>
              <th>Vehicle Number</th>
              <th>Model / Type</th>
              <th>Capacity (Liters)</th>
              <th>Status</th>
              <th>Notes</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in paginatedVehicles"
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
              <td class="font-weight-bold text-primary">
                <v-icon size="18" class="me-1">mdi-truck</v-icon>
                {{ item.vehicleNumber }}
              </td>
              <td>{{ item.model || '-' }}</td>
              <td class="font-weight-medium tabular-nums">{{ formatNumber(item.capacityLiters) }} L</td>
              <td>
                <span
                  class="erp-tag"
                  :class="item.status === 'Active' ? 'erp-tag-green' : 'erp-tag-grey'"
                >
                  {{ item.status || 'ACTIVE' }}
                </span>
              </td>
              <td class="text-caption text-grey-darken-1">{{ item.notes || '-' }}</td>
              <td class="text-end">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  color="primary"
                  title="Edit Vehicle"
                  @click="openDialog(item)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  title="Delete Vehicle"
                  @click="confirmDelete(item)"
                />
              </td>
            </tr>
            <tr v-if="filteredVehicles.length === 0">
              <td colspan="7" class="text-center pa-8">
                <div class="empty-state-box">
                  <v-icon class="empty-state-icon">mdi-truck-remove-outline</v-icon>
                  <div class="empty-state-title">No Fleet Vehicles Found</div>
                  <div class="empty-state-subtitle">Register delivery vans, pickups, and trucks for milk dispatch operations.</div>
                  <v-btn color="primary" variant="flat" size="small" class="mt-2 text-capitalize font-weight-bold" prepend-icon="mdi-plus" @click="openDialog()">
                    Add Vehicle
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
        :total-items="filteredVehicles.length"
      />
    </v-card>

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card class="rounded-xl pa-3">
        <v-card-title class="font-weight-bold pt-3 px-4">
          {{ isEdit ? 'Edit Vehicle' : 'Add New Vehicle' }}
        </v-card-title>
        <v-card-text class="px-4 py-2">
          <v-form ref="formRef" v-model="formValid">
            <v-text-field
              v-model="form.vehicleNumber"
              label="Vehicle Registration Number *"
              placeholder="e.g. PES-4120"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Vehicle number is required']"
              class="mb-3"
            />
            <v-text-field
              v-model="form.model"
              label="Model / Description"
              placeholder="e.g. Toyota Hilux 4x4"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-text-field
              v-model.number="form.capacityLiters"
              type="number"
              label="Tank / Milk Capacity (Liters)"
              placeholder="1200"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-select
              v-model="form.status"
              :items="['Active', 'Inactive', 'Under Maintenance']"
              label="Status"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-textarea
              v-model="form.notes"
              label="Notes"
              placeholder="Driver assignment, route notes, or condition"
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
            @click="saveVehicle"
          >
            Save Vehicle
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="deleteDialog"
      title="Delete Vehicle"
      :message="`Are you sure you want to delete vehicle ${targetVehicle?.vehicleNumber}?`"
      :loading="deleting"
      @confirm="executeDelete"
    />

    <!-- Bulk Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="bulkDeleteDialog"
      title="Bulk Delete Vehicles"
      :message="`Are you sure you want to delete ${selectedIds.length} selected vehicle(s)? This action cannot be undone.`"
      :loading="bulkDeleting"
      @confirm="executeBulkDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { mastersService } from '@/services/mastersService';
import { useSnackbarStore } from '@/stores/snackbar';
import { formatNumber } from '@/utils/formatters';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import AppPagination from '@/components/common/AppPagination.vue';
import BulkActionsBar from '@/components/common/BulkActionsBar.vue';

defineProps({
  embedded: { type: Boolean, default: false },
});

const snackbar = useSnackbarStore();
const vehicles = ref([]);
const search = ref('');
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
const targetVehicle = ref(null);

const form = ref({
  id: null,
  vehicleNumber: '',
  model: '',
  capacityLiters: 1000,
  status: 'Active',
  notes: '',
});

const filteredVehicles = computed(() => {
  if (!search.value) return vehicles.value;
  const term = search.value.toLowerCase();
  return vehicles.value.filter(
    (v) =>
      v.vehicleNumber?.toLowerCase().includes(term) ||
      v.model?.toLowerCase().includes(term) ||
      v.notes?.toLowerCase().includes(term)
  );
});

const paginatedVehicles = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  return filteredVehicles.value.slice(start, start + itemsPerPage.value);
});

const isAllSelected = computed(() => {
  return paginatedVehicles.value.length > 0 && paginatedVehicles.value.every(item => selectedIds.value.includes(item.id));
});

const isSomeSelected = computed(() => {
  return selectedIds.value.length > 0 && !isAllSelected.value;
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = paginatedVehicles.value.map(item => item.id);
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

watch(search, () => {
  page.value = 1;
  selectedIds.value = [];
});

async function loadVehicles() {
  try {
    selectedIds.value = [];
    vehicles.value = await mastersService.getVehicles();
  } catch (err) {
    snackbar.error('Failed to load vehicles');
  }
}

function openDialog(item = null) {
  if (item) {
    isEdit.value = true;
    form.value = { ...item };
  } else {
    isEdit.value = false;
    form.value = {
      id: null,
      vehicleNumber: '',
      model: '',
      capacityLiters: 1000,
      status: 'Active',
      notes: '',
    };
  }
  dialog.value = true;
}

async function saveVehicle() {
  if (!form.value.vehicleNumber) {
    snackbar.error('Please enter a vehicle registration number');
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await mastersService.updateVehicle(form.value.id, form.value);
      snackbar.success('Vehicle updated successfully');
    } else {
      await mastersService.createVehicle(form.value);
      snackbar.success('Vehicle created successfully');
    }
    dialog.value = false;
    await loadVehicles();
  } catch (err) {
    snackbar.error(err.message || 'Failed to save vehicle');
  } finally {
    saving.value = false;
  }
}

function confirmDelete(item) {
  targetVehicle.value = item;
  deleteDialog.value = true;
}

async function executeDelete() {
  if (!targetVehicle.value) return;
  deleting.value = true;
  try {
    await mastersService.deleteVehicle(targetVehicle.value.id);
    snackbar.success('Vehicle deleted successfully');
    deleteDialog.value = false;
    await loadVehicles();
  } catch (err) {
    snackbar.error('Failed to delete vehicle');
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
      await mastersService.deleteVehicle(id);
    }
    snackbar.success(`${toDelete.length} vehicle(s) deleted successfully`);
    selectedIds.value = [];
    bulkDeleteDialog.value = false;
    await loadVehicles();
  } catch (err) {
    snackbar.error('Failed to delete some vehicles');
  } finally {
    bulkDeleting.value = false;
  }
}

onMounted(() => {
  loadVehicles();
});
</script>

