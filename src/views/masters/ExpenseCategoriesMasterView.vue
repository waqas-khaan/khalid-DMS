<template>
  <div :class="embedded ? 'embedded-master-view' : 'page-container table-page'">
    <div v-if="!embedded" class="page-header">
      <div>
        <h1 class="page-header-title">Expense Categories</h1>
        <p class="page-header-subtitle">Manage expense categories available in the Expenses Ledger</p>
      </div>

      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-shape-plus"
        class="text-capitalize font-weight-bold px-5"
        @click="openDialog()"
      >
        Add Category
      </v-btn>
    </div>

    <!-- Table Card -->
    <v-card class="modern-card pa-4 table-card-full" elevation="0">
      <div class="d-flex align-center justify-space-between mb-3 flex-wrap" style="gap: 16px;">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search categories..."
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 320px;"
          clearable
        />
        <div class="d-flex align-center flex-wrap" style="gap: 10px;">
          <v-chip color="primary" variant="tonal" size="small">
            Total: {{ filteredCategories.length }} Categories
          </v-chip>
          <v-btn
            v-if="embedded"
            color="primary"
            variant="flat"
            size="small"
            prepend-icon="mdi-shape-plus"
            class="text-capitalize font-weight-bold px-4"
            @click="openDialog()"
          >
            Add Category
          </v-btn>
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      <BulkActionsBar
        v-if="authStore.isAdmin"
        :count="selectedIds.length"
        item-label="category"
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
                  :disabled="selectablePageItems.length === 0"
                  color="primary"
                  density="compact"
                  @update:model-value="toggleSelectAll"
                />
              </th>
              <th>Category Name</th>
              <th>Sub-Types</th>
              <th>Source</th>
              <th v-if="authStore.isAdmin" class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in paginatedCategories"
              :key="item.id"
              :class="{ 'selected-row': selectedIds.includes(item.id) }"
            >
              <td v-if="authStore.isAdmin" class="table-checkbox-col">
                <v-checkbox-btn
                  :model-value="selectedIds.includes(item.id)"
                  :disabled="item.isDefault"
                  color="primary"
                  density="compact"
                  @update:model-value="toggleSelectItem(item.id)"
                  @click.stop
                />
              </td>
              <td class="font-weight-bold text-dark">
                <v-icon size="16" color="primary" class="me-1">mdi-shape-outline</v-icon>
                {{ item.name }}
              </td>
              <td class="text-caption text-grey-darken-2">
                {{ Array.isArray(item.subTypes) && item.subTypes.length ? item.subTypes.join(', ') : '-' }}
              </td>
              <td>
                <span :class="['erp-tag', item.isDefault ? 'erp-tag-grey' : 'erp-tag-blue']">
                  {{ item.isDefault ? 'System Default' : 'Custom' }}
                </span>
              </td>
              <td v-if="authStore.isAdmin" class="text-end">
                <template v-if="!item.isDefault">
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    color="primary"
                    title="Edit Category"
                    @click="openDialog(item)"
                  />
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    title="Delete Category"
                    @click="confirmDelete(item)"
                  />
                </template>
                <span v-else class="text-caption text-grey font-weight-medium px-2">Built-in</span>
              </td>
            </tr>
            <tr v-if="filteredCategories.length === 0">
              <td :colspan="authStore.isAdmin ? 5 : 3" class="text-center pa-8">
                <div class="empty-state-box">
                  <v-icon class="empty-state-icon">mdi-shape-plus-outline</v-icon>
                  <div class="empty-state-title">No Expense Categories Found</div>
                  <div class="empty-state-subtitle">Add a custom expense category for the Expenses Ledger.</div>
                  <v-btn color="primary" variant="flat" size="small" class="mt-2 text-capitalize font-weight-bold" prepend-icon="mdi-shape-plus" @click="openDialog()">
                    Add Category
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
        :total-items="filteredCategories.length"
      />
    </v-card>

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="dialog" max-width="460">
      <v-card class="rounded-xl pa-3">
        <v-card-title class="font-weight-bold pt-3 px-4">
          {{ isEdit ? 'Edit Expense Category' : 'Add Expense Category' }}
        </v-card-title>
        <v-card-text class="px-4 py-2">
          <v-form ref="formRef" v-model="formValid">
            <v-text-field
              v-model="form.name"
              label="Category Name *"
              placeholder="e.g. Veterinary & Medicine, Machinery, Utilities"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v?.trim() || 'Category name is required']"
              class="mb-3"
            />
            <v-text-field
              v-model="form.subTypesText"
              label="Sub-Types (optional)"
              placeholder="Comma-separated, e.g. Vaccines, Checkup"
              hint="Optional sub-categories separated by commas"
              persistent-hint
              variant="outlined"
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
            @click="saveCategory"
          >
            {{ isEdit ? 'Update Category' : 'Create Category' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="deleteDialog"
      title="Delete Expense Category"
      :message="`Are you sure you want to remove category '${targetCategory?.name}'? Existing expense records will keep their text label.`"
      :loading="deleting"
      @confirm="executeDelete"
    />

    <!-- Bulk Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="bulkDeleteDialog"
      title="Bulk Delete Categories"
      :message="`Are you sure you want to delete ${selectedIds.length} selected custom category(s)?`"
      :loading="bulkDeleting"
      @confirm="executeBulkDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { expenseService } from '@/services/expenseService';
import { useSnackbarStore } from '@/stores/snackbar';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import BulkActionsBar from '@/components/common/BulkActionsBar.vue';
import AppPagination from '@/components/common/AppPagination.vue';

defineProps({
  embedded: { type: Boolean, default: false },
});

const authStore = useAuthStore();
const snackbar = useSnackbarStore();

const categories = ref([]);
const search = ref('');
const page = ref(1);
const itemsPerPage = ref(10);
const selectedIds = ref([]);
const dialog = ref(false);
const deleteDialog = ref(false);
const bulkDeleteDialog = ref(false);
const isEdit = ref(false);
const formValid = ref(true);
const saving = ref(false);
const deleting = ref(false);
const bulkDeleting = ref(false);
const targetCategory = ref(null);

const form = ref({
  id: null,
  name: '',
  subTypesText: '',
});

const filteredCategories = computed(() => {
  if (!search.value) return categories.value;
  const q = search.value.toLowerCase();
  return categories.value.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(q) ||
      (Array.isArray(c.subTypes) && c.subTypes.some((s) => s.toLowerCase().includes(q)))
  );
});

const paginatedCategories = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  return filteredCategories.value.slice(start, start + itemsPerPage.value);
});

const selectablePageItems = computed(() => paginatedCategories.value.filter((item) => !item.isDefault));

const isAllSelected = computed(() => {
  return (
    selectablePageItems.value.length > 0 &&
    selectablePageItems.value.every((item) => selectedIds.value.includes(item.id))
  );
});

const isSomeSelected = computed(() => {
  return selectedIds.value.length > 0 && !isAllSelected.value;
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = selectablePageItems.value.map((item) => item.id);
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

async function loadCategories() {
  try {
    selectedIds.value = [];
    categories.value = await expenseService.getCategories();
  } catch (err) {
    snackbar.error('Failed to load expense categories');
  }
}

function parseSubTypes(text) {
  return (text || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function openDialog(item = null) {
  if (item && !authStore.isAdmin) {
    snackbar.error('Staff cannot edit expense categories. Only administrators have permission.');
    return;
  }
  if (item) {
    isEdit.value = true;
    form.value = {
      id: item.id,
      name: item.name || '',
      subTypesText: Array.isArray(item.subTypes) ? item.subTypes.join(', ') : '',
    };
  } else {
    isEdit.value = false;
    form.value = {
      id: null,
      name: '',
      subTypesText: '',
    };
  }
  dialog.value = true;
}

async function saveCategory() {
  if (isEdit.value && !authStore.isAdmin) {
    snackbar.error('Staff cannot edit expense categories. Only administrators have permission.');
    return;
  }
  const cleanName = form.value.name?.trim();
  if (!cleanName) {
    snackbar.error('Please enter category name');
    return;
  }
  const subTypes = parseSubTypes(form.value.subTypesText);
  saving.value = true;
  try {
    if (isEdit.value) {
      await expenseService.updateCategory(form.value.id, { name: cleanName, subTypes });
      snackbar.success('Category updated successfully');
    } else {
      await expenseService.addCategory(cleanName, subTypes);
      snackbar.success('Category created successfully');
    }
    dialog.value = false;
    await loadCategories();
  } catch (err) {
    snackbar.error(err.message || 'Failed to save category');
  } finally {
    saving.value = false;
  }
}

function confirmDelete(item) {
  if (!authStore.isAdmin) {
    snackbar.error('Staff cannot delete expense categories. Only administrators have permission.');
    return;
  }
  if (item.isDefault) return;
  targetCategory.value = item;
  deleteDialog.value = true;
}

async function executeDelete() {
  if (!authStore.isAdmin) return;
  if (!targetCategory.value) return;
  deleting.value = true;
  try {
    await expenseService.deleteCategory(targetCategory.value.id);
    snackbar.success('Category deleted successfully');
    deleteDialog.value = false;
    await loadCategories();
  } catch (err) {
    snackbar.error('Failed to delete category');
  } finally {
    deleting.value = false;
  }
}

function confirmBulkDelete() {
  if (!authStore.isAdmin) {
    snackbar.error('Staff cannot delete expense categories. Only administrators have permission.');
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
      await expenseService.deleteCategory(id);
    }
    snackbar.success(`${toDelete.length} category(s) deleted successfully`);
    selectedIds.value = [];
    bulkDeleteDialog.value = false;
    await loadCategories();
  } catch (err) {
    snackbar.error('Failed to delete some categories');
  } finally {
    bulkDeleting.value = false;
  }
}

onMounted(() => {
  loadCategories();
});
</script>

