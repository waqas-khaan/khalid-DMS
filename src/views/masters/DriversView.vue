<template>
  <div :class="embedded ? 'embedded-master-view' : 'page-container table-page'">
    <div v-if="!embedded" class="page-header">
      <div>
        <h1 class="page-header-title">Drivers Master</h1>
        <p class="page-header-subtitle">Manage milk delivery drivers, contact numbers, and licenses</p>
      </div>

      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        class="text-capitalize rounded-lg font-weight-bold"
        @click="openDialog()"
      >
        Add Driver
      </v-btn>
    </div>

    <!-- Table Card -->
    <v-card class="modern-card pa-4 table-card-full" elevation="0">
      <div class="d-flex align-center justify-space-between mb-3 flex-wrap" style="gap: 16px;">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search drivers..."
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 320px;"
          clearable
        />
        <div class="d-flex align-center flex-wrap" style="gap: 10px;">
          <v-chip color="info" variant="tonal" size="small" prepend-icon="mdi-sync">
            Synced with Staff Directory
          </v-chip>
          <v-chip color="primary" variant="tonal" size="small">
            Total: {{ filteredDrivers.length }} Drivers
          </v-chip>
          <v-btn
            v-if="embedded"
            color="primary"
            size="small"
            prepend-icon="mdi-plus"
            class="text-capitalize rounded-lg font-weight-bold"
            @click="openDialog()"
          >
            Add Driver
          </v-btn>
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      <BulkActionsBar
        :count="selectedIds.length"
        item-label="driver"
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
              <th>Driver Name</th>
              <th>Phone</th>
              <th>License Number</th>
              <th>Status</th>
              <th>Notes</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in paginatedDrivers"
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
                <v-icon size="18" class="me-1">mdi-account-tie</v-icon>
                {{ item.name }}
              </td>
              <td>
                <a v-if="item.phone" :href="'tel:' + item.phone" class="d-flex align-center text-caption text-decoration-none text-primary">
                  <v-icon size="14" color="primary" class="me-1">mdi-phone</v-icon>
                  {{ item.phone }}
                </a>
                <span v-else class="text-grey">-</span>
              </td>
              <td>{{ item.licenseNumber || '-' }}</td>
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
                  title="Edit Driver"
                  @click="openDialog(item)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  title="Delete Driver"
                  @click="confirmDelete(item)"
                />
              </td>
            </tr>
            <tr v-if="filteredDrivers.length === 0">
              <td colspan="7" class="text-center pa-8">
                <div class="empty-state-box">
                  <v-icon class="empty-state-icon">mdi-card-account-details-outline</v-icon>
                  <div class="empty-state-title">No Drivers Found</div>
                  <div class="empty-state-subtitle">Register delivery drivers to assign them to milk dispatch routes.</div>
                  <v-btn color="primary" variant="flat" size="small" class="mt-2 text-capitalize font-weight-bold" prepend-icon="mdi-plus" @click="openDialog()">
                    Add Driver
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
        :total-items="filteredDrivers.length"
      />
    </v-card>

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card class="rounded-xl pa-3">
        <v-card-title class="font-weight-bold pt-3 px-4">
          {{ isEdit ? 'Edit Driver' : 'Add New Driver' }}
        </v-card-title>
        <v-card-text class="px-4 py-2">
          <v-form ref="formRef" v-model="formValid">
            <v-text-field
              v-model="form.name"
              label="Full Name *"
              placeholder="e.g. Gul Muhammad"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Driver name is required']"
              class="mb-3"
            />
            <v-text-field
              v-model="form.phone"
              label="Phone Number"
              placeholder="e.g. 0300-1234567"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-text-field
              v-model="form.licenseNumber"
              label="Driving License Number"
              placeholder="e.g. PK-NWFP-9921"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-text-field
              v-model.number="form.salary"
              type="number"
              label="Monthly Salary (Rs.)"
              placeholder="35000"
              prepend-inner-icon="mdi-currency-pkr"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-select
              v-model="form.status"
              :items="['Active', 'Inactive', 'On Leave']"
              label="Status"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-textarea
              v-model="form.notes"
              label="Notes"
              placeholder="Route preferences or additional info"
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
            @click="saveDriver"
          >
            Save Driver
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="deleteDialog"
      title="Delete Driver"
      :message="`Are you sure you want to delete driver ${targetDriver?.name}?`"
      :loading="deleting"
      @confirm="executeDelete"
    />

    <!-- Bulk Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="bulkDeleteDialog"
      title="Bulk Delete Drivers"
      :message="`Are you sure you want to delete ${selectedIds.length} selected driver(s)? This action cannot be undone.`"
      :loading="bulkDeleting"
      @confirm="executeBulkDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { mastersService } from '@/services/mastersService';
import { useSnackbarStore } from '@/stores/snackbar';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import AppPagination from '@/components/common/AppPagination.vue';
import BulkActionsBar from '@/components/common/BulkActionsBar.vue';

defineProps({
  embedded: { type: Boolean, default: false },
});

const snackbar = useSnackbarStore();
const drivers = ref([]);
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
const targetDriver = ref(null);

const form = ref({
  id: null,
  name: '',
  phone: '',
  licenseNumber: '',
  salary: 35000,
  status: 'Active',
  notes: '',
});

const filteredDrivers = computed(() => {
  if (!search.value) return drivers.value;
  const term = search.value.toLowerCase();
  return drivers.value.filter(
    (d) =>
      d.name?.toLowerCase().includes(term) ||
      d.phone?.toLowerCase().includes(term) ||
      d.licenseNumber?.toLowerCase().includes(term)
  );
});

const paginatedDrivers = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  return filteredDrivers.value.slice(start, start + itemsPerPage.value);
});

const isAllSelected = computed(() => {
  return paginatedDrivers.value.length > 0 && paginatedDrivers.value.every(item => selectedIds.value.includes(item.id));
});

const isSomeSelected = computed(() => {
  return selectedIds.value.length > 0 && !isAllSelected.value;
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = paginatedDrivers.value.map(item => item.id);
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

async function loadDrivers() {
  try {
    selectedIds.value = [];
    drivers.value = await mastersService.getDrivers();
  } catch (err) {
    snackbar.error('Failed to load drivers');
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
      name: '',
      phone: '',
      licenseNumber: '',
      salary: 35000,
      status: 'Active',
      notes: '',
    };
  }
  dialog.value = true;
}

async function saveDriver() {
  if (!form.value.name) {
    snackbar.error('Please enter driver name');
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await mastersService.updateDriver(form.value.id, form.value);
      snackbar.success('Driver updated successfully');
    } else {
      await mastersService.createDriver(form.value);
      snackbar.success('Driver created successfully');
    }
    dialog.value = false;
    await loadDrivers();
  } catch (err) {
    snackbar.error(err.message || 'Failed to save driver');
  } finally {
    saving.value = false;
  }
}

function confirmDelete(item) {
  targetDriver.value = item;
  deleteDialog.value = true;
}

async function executeDelete() {
  if (!targetDriver.value) return;
  deleting.value = true;
  try {
    await mastersService.deleteDriver(targetDriver.value.id);
    snackbar.success('Driver deleted successfully');
    deleteDialog.value = false;
    await loadDrivers();
  } catch (err) {
    snackbar.error('Failed to delete driver');
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
      await mastersService.deleteDriver(id);
    }
    snackbar.success(`${toDelete.length} driver(s) deleted successfully`);
    selectedIds.value = [];
    bulkDeleteDialog.value = false;
    await loadDrivers();
  } catch (err) {
    snackbar.error('Failed to delete some drivers');
  } finally {
    bulkDeleting.value = false;
  }
}

onMounted(() => {
  loadDrivers();
});
</script>

