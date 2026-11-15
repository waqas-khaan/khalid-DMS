<template>
  <div :class="embedded ? 'embedded-master-view' : 'page-container table-page'">
    <div v-if="!embedded" class="page-header">
      <div>
        <h1 class="page-header-title">Calander Master</h1>
        <p class="page-header-subtitle">Manage delivery helpers (Calanders) assigned with drivers on milk dispatch routes</p>
      </div>

      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        class="text-capitalize rounded-lg font-weight-bold"
        @click="openDialog()"
      >
        Add Calander
      </v-btn>
    </div>

    <!-- Table Card -->
    <v-card class="modern-card pa-4 table-card-full" elevation="0">
      <div class="d-flex align-center justify-space-between mb-3 flex-wrap" style="gap: 16px;">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search calanders..."
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
            Total: {{ filteredCalanders.length }} Calanders
          </v-chip>
          <v-btn
            v-if="embedded"
            color="primary"
            size="small"
            prepend-icon="mdi-plus"
            class="text-capitalize rounded-lg font-weight-bold"
            @click="openDialog()"
          >
            Add Calander
          </v-btn>
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      <BulkActionsBar
        v-if="authStore.isAdmin"
        :count="selectedIds.length"
        item-label="calander"
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
              <th>Calander Name</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Notes</th>
              <th v-if="authStore.isAdmin" class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in paginatedCalanders"
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
              <td class="font-weight-bold text-primary">
                <v-icon size="18" class="me-1">mdi-account-outline</v-icon>
                {{ item.name }}
              </td>
              <td>
                <a v-if="item.phone" :href="'tel:' + item.phone" class="d-flex align-center text-caption text-decoration-none text-primary">
                  <v-icon size="14" color="primary" class="me-1">mdi-phone</v-icon>
                  {{ item.phone }}
                </a>
                <span v-else class="text-grey">-</span>
              </td>
              <td>
                <span
                  class="erp-tag"
                  :class="item.status === 'Active' ? 'erp-tag-green' : 'erp-tag-grey'"
                >
                  {{ item.status || 'Active' }}
                </span>
              </td>
              <td class="text-caption text-grey-darken-1">{{ item.notes || '-' }}</td>
              <td v-if="authStore.isAdmin" class="text-end">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  color="primary"
                  title="Edit Calander"
                  @click="openDialog(item)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  title="Delete Calander"
                  @click="confirmDelete(item)"
                />
              </td>
            </tr>
            <tr v-if="filteredCalanders.length === 0">
              <td :colspan="authStore.isAdmin ? 6 : 4" class="text-center pa-8">
                <div class="empty-state-box">
                  <v-icon class="empty-state-icon">mdi-account-outline</v-icon>
                  <div class="empty-state-title">No Calanders Found</div>
                  <div class="empty-state-subtitle">Register delivery helpers (Calanders) to assign them to milk dispatch routes.</div>
                  <v-btn color="primary" variant="flat" size="small" class="mt-2 text-capitalize font-weight-bold" prepend-icon="mdi-plus" @click="openDialog()">
                    Add Calander
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
        :total-items="filteredCalanders.length"
      />
    </v-card>

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card class="rounded-xl pa-3">
        <v-card-title class="font-weight-bold pt-3 px-4">
          {{ isEdit ? 'Edit Calander' : 'Add New Calander' }}
        </v-card-title>
        <v-card-text class="px-4 py-2">
          <v-form ref="formRef" v-model="formValid">
            <v-text-field
              v-model="form.name"
              label="Full Name *"
              placeholder="e.g. Afzal khan"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Calander name is required']"
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
              v-model.number="form.salary"
              type="number"
              label="Monthly Salary (Rs.)"
              placeholder="28000"
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
              placeholder="Route notes or additional details"
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
            @click="saveCalander"
          >
            Save Calander
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="deleteDialog"
      title="Delete Calander"
      :message="`Are you sure you want to delete calander ${targetCalander?.name}?`"
      :loading="deleting"
      @confirm="executeDelete"
    />

    <!-- Bulk Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="bulkDeleteDialog"
      title="Bulk Delete Calanders"
      :message="`Are you sure you want to delete ${selectedIds.length} selected calander(s)? This action cannot be undone.`"
      :loading="bulkDeleting"
      @confirm="executeBulkDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { mastersService } from '@/services/mastersService';
import { useSnackbarStore } from '@/stores/snackbar';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import AppPagination from '@/components/common/AppPagination.vue';
import BulkActionsBar from '@/components/common/BulkActionsBar.vue';

defineProps({
  embedded: { type: Boolean, default: false },
});

const authStore = useAuthStore();
const snackbar = useSnackbarStore();
const calanders = ref([]);
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
const targetCalander = ref(null);

const form = ref({
  id: null,
  name: '',
  phone: '',
  salary: 28000,
  status: 'Active',
  notes: '',
});

const filteredCalanders = computed(() => {
  if (!search.value) return calanders.value;
  const term = search.value.toLowerCase();
  return calanders.value.filter(
    (c) =>
      c.name?.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term) ||
      c.notes?.toLowerCase().includes(term)
  );
});

const paginatedCalanders = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  return filteredCalanders.value.slice(start, start + itemsPerPage.value);
});

const isAllSelected = computed(() => {
  return paginatedCalanders.value.length > 0 && paginatedCalanders.value.every((item) => selectedIds.value.includes(item.id));
});

const isSomeSelected = computed(() => {
  return selectedIds.value.length > 0 && !isAllSelected.value;
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = paginatedCalanders.value.map((item) => item.id);
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

async function loadCalanders() {
  try {
    selectedIds.value = [];
    calanders.value = await mastersService.getCalanders();
  } catch (err) {
    snackbar.error('Failed to load calanders');
  }
}

function openDialog(item = null) {
  if (item && !authStore.isAdmin) {
    snackbar.error('Staff cannot edit calanders. Only administrators have permission.');
    return;
  }
  if (item) {
    isEdit.value = true;
    form.value = { ...item };
  } else {
    isEdit.value = false;
    form.value = {
      id: null,
      name: '',
      phone: '',
      salary: 28000,
      status: 'Active',
      notes: '',
    };
  }
  dialog.value = true;
}

async function saveCalander() {
  if (isEdit.value && !authStore.isAdmin) {
    snackbar.error('Staff cannot edit calanders. Only administrators have permission.');
    return;
  }
  if (!form.value.name?.trim()) {
    snackbar.error('Please enter calander name');
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await mastersService.updateCalander(form.value.id, form.value);
      snackbar.success('Calander updated successfully');
    } else {
      await mastersService.createCalander(form.value);
      snackbar.success('Calander created successfully');
    }
    dialog.value = false;
    await loadCalanders();
  } catch (err) {
    snackbar.error(err.message || 'Failed to save calander');
  } finally {
    saving.value = false;
  }
}

function confirmDelete(item) {
  if (!authStore.isAdmin) {
    snackbar.error('Staff cannot delete calanders. Only administrators have permission.');
    return;
  }
  targetCalander.value = item;
  deleteDialog.value = true;
}

async function executeDelete() {
  if (!authStore.isAdmin) return;
  if (!targetCalander.value) return;
  deleting.value = true;
  try {
    await mastersService.deleteCalander(targetCalander.value.id);
    snackbar.success('Calander deleted successfully');
    deleteDialog.value = false;
    await loadCalanders();
  } catch (err) {
    snackbar.error('Failed to delete calander');
  } finally {
    deleting.value = false;
  }
}

function confirmBulkDelete() {
  if (!authStore.isAdmin) {
    snackbar.error('Staff cannot delete calanders. Only administrators have permission.');
    return;
  }
  if (selectedIds.value.length === 0) return;
  bulkDeleteDialog.value = true;
}

async function executeBulkDelete() {
  if (!authStore.isAdmin) return;
  bulkDeleting.value = true;
  try {
    const toDelete = [...selectedIds.value];
    for (const id of toDelete) {
      await mastersService.deleteCalander(id);
    }
    snackbar.success(`${toDelete.length} calander(s) deleted successfully`);
    selectedIds.value = [];
    bulkDeleteDialog.value = false;
    await loadCalanders();
  } catch (err) {
    snackbar.error('Failed to delete some calanders');
  } finally {
    bulkDeleting.value = false;
  }
}

onMounted(() => {
  loadCalanders();
});
</script>

