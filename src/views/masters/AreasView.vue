<template>
  <div :class="embedded ? 'embedded-master-view' : 'page-container table-page'">
    <div v-if="!embedded" class="page-header">
      <div>
        <h1 class="page-header-title">Areas & Delivery Routes</h1>
        <p class="page-header-subtitle">Manage distribution sectors and delivery zones (e.g. Hayatabad, Jalalabad)</p>
      </div>

      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        class="text-capitalize font-weight-bold px-5"
        @click="openDialog()"
      >
        Add Area / Route
      </v-btn>
    </div>

    <!-- Table Card -->
    <v-card class="modern-card pa-4 table-card-full" elevation="0">
      <div class="d-flex align-center justify-space-between mb-3 flex-wrap" style="gap: 16px;">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search areas..."
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 320px;"
          clearable
        />
        <div class="d-flex align-center flex-wrap" style="gap: 10px;">
          <v-chip color="primary" variant="tonal" size="small">
            Total: {{ filteredAreas.length }} Routes
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
            Add Area / Route
          </v-btn>
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      <BulkActionsBar
        :count="selectedIds.length"
        item-label="route"
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
              <th>Area / Route Name</th>
              <th>Route Code</th>
              <th>Description</th>
              <th>Status</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in paginatedAreas"
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
                <v-icon size="18" class="me-1">mdi-map-marker</v-icon>
                {{ item.name }}
              </td>
              <td>
                <v-chip size="x-small" color="blue-grey" variant="flat" class="font-weight-bold">
                  {{ item.code || '-' }}
                </v-chip>
              </td>
              <td class="text-caption text-grey-darken-1">{{ item.description || '-' }}</td>
              <td>
                <v-chip
                  size="x-small"
                  :color="item.active !== false ? 'success' : 'grey'"
                  class="font-weight-bold"
                >
                  {{ item.active !== false ? 'Active' : 'Inactive' }}
                </v-chip>
              </td>
              <td class="text-end">
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
            <tr v-if="filteredAreas.length === 0">
              <td colspan="6" class="text-center pa-8">
                <div class="empty-state-box">
                  <v-icon class="empty-state-icon">mdi-map-marker-remove-outline</v-icon>
                  <div class="empty-state-title">No Delivery Routes Found</div>
                  <div class="empty-state-subtitle">Add delivery areas (e.g. Hayatabad, Jalalabad) to organize distribution routes and shops.</div>
                  <v-btn color="primary" variant="flat" size="small" class="mt-2 text-capitalize font-weight-bold" prepend-icon="mdi-plus" @click="openDialog()">
                    Add Area / Route
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
        :total-items="filteredAreas.length"
      />
    </v-card>

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card class="rounded-xl pa-3">
        <v-card-title class="font-weight-bold pt-3 px-4">
          {{ isEdit ? 'Edit Area / Route' : 'Add New Area / Route' }}
        </v-card-title>
        <v-card-text class="px-4 py-2">
          <v-form ref="formRef" v-model="formValid">
            <v-text-field
              v-model="form.name"
              label="Area / Route Name *"
              placeholder="e.g. Hayatabad, Jalalabad"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Area name is required']"
              class="mb-3"
            />
            <v-text-field
              v-model="form.code"
              label="Route Code (e.g. HYT, JLD)"
              placeholder="HYT"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-textarea
              v-model="form.description"
              label="Description / Sector details"
              placeholder="e.g. Sectors Phase 1 to 7, commercial markets"
              variant="outlined"
              rows="2"
              density="comfortable"
              class="mb-3"
            />
            <v-switch
              v-model="form.active"
              label="Route Active"
              color="primary"
              density="compact"
              hide-details
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
            @click="saveArea"
          >
            Save Area
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="deleteDialog"
      title="Delete Area"
      :message="`Are you sure you want to delete area ${targetArea?.name}?`"
      :loading="deleting"
      @confirm="executeDelete"
    />

    <!-- Bulk Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="bulkDeleteDialog"
      title="Bulk Delete Areas / Routes"
      :message="`Are you sure you want to delete ${selectedIds.length} selected area(s)? This action cannot be undone.`"
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
const areas = ref([]);
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
const targetArea = ref(null);

const form = ref({
  id: null,
  name: '',
  code: '',
  description: '',
  active: true,
});

const filteredAreas = computed(() => {
  if (!search.value) return areas.value;
  const term = search.value.toLowerCase();
  return areas.value.filter(
    (a) =>
      a.name?.toLowerCase().includes(term) ||
      a.code?.toLowerCase().includes(term) ||
      a.description?.toLowerCase().includes(term)
  );
});

const paginatedAreas = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  return filteredAreas.value.slice(start, start + itemsPerPage.value);
});

const isAllSelected = computed(() => {
  return paginatedAreas.value.length > 0 && paginatedAreas.value.every(item => selectedIds.value.includes(item.id));
});

const isSomeSelected = computed(() => {
  return selectedIds.value.length > 0 && !isAllSelected.value;
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = paginatedAreas.value.map(item => item.id);
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

async function loadAreas() {
  try {
    selectedIds.value = [];
    areas.value = await mastersService.getAreas();
  } catch (err) {
    snackbar.error('Failed to load areas');
  }
}

function openDialog(item = null) {
  if (item) {
    isEdit.value = true;
    form.value = { ...item, active: item.active !== false };
  } else {
    isEdit.value = false;
    form.value = {
      id: null,
      name: '',
      code: '',
      description: '',
      active: true,
    };
  }
  dialog.value = true;
}

async function saveArea() {
  if (!form.value.name) {
    snackbar.error('Please enter area name');
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await mastersService.updateArea(form.value.id, form.value);
      snackbar.success('Area updated successfully');
    } else {
      await mastersService.createArea(form.value);
      snackbar.success('Area created successfully');
    }
    dialog.value = false;
    await loadAreas();
  } catch (err) {
    snackbar.error(err.message || 'Failed to save area');
  } finally {
    saving.value = false;
  }
}

function confirmDelete(item) {
  targetArea.value = item;
  deleteDialog.value = true;
}

async function executeDelete() {
  if (!targetArea.value) return;
  deleting.value = true;
  try {
    await mastersService.deleteArea(targetArea.value.id);
    snackbar.success('Area deleted successfully');
    deleteDialog.value = false;
    await loadAreas();
  } catch (err) {
    snackbar.error('Failed to delete area');
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
      await mastersService.deleteArea(id);
    }
    snackbar.success(`${toDelete.length} area(s) deleted successfully`);
    selectedIds.value = [];
    bulkDeleteDialog.value = false;
    await loadAreas();
  } catch (err) {
    snackbar.error('Failed to delete some areas');
  } finally {
    bulkDeleting.value = false;
  }
}

onMounted(() => {
  loadAreas();
});
</script>

