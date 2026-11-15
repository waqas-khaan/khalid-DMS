<template>
  <ExpensesMobileView v-if="display.smAndDown.value" />
  <div v-else class="page-container table-page">
    <div class="page-header">
      <div>
        <h1 class="page-header-title">Expenses Ledger</h1>
        <p class="page-header-subtitle">
          Record farm operating costs: Food, Home, Transport (Diesel & Maintenance), and custom categories
        </p>
      </div>

      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        class="text-capitalize font-weight-bold px-5"
        :disabled="businessDayStore.isLockedOnPreviousDay"
        :title="businessDayStore.isLockedOnPreviousDay ? businessDayStore.lockReason : 'Add Expense'"
        @click="openDialog()"
      >
        Add Expense
      </v-btn>
    </div>

    <!-- Summary Cards -->
    <v-row dense class="mb-3">
      <v-col cols="6" sm="6" md="3">
        <StatCard
          label="Overall Expenses"
          :value="formatCurrency(totals.overall)"
          color="error"
          subtitle="Selected period total"
        />
      </v-col>
      <v-col cols="6" sm="6" md="3">
        <StatCard
          label="Food Expenses"
          :value="formatCurrency(totals.food)"
          color="primary"
          subtitle="Staff mess & groceries"
        />
      </v-col>
      <v-col cols="6" sm="6" md="3">
        <StatCard
          label="Home Expenses"
          :value="formatCurrency(totals.home)"
          color="teal"
          subtitle="Farm utilities & sanitation"
        />
      </v-col>
      <v-col cols="6" sm="6" md="3">
        <StatCard
          label="Transport Total"
          :value="formatCurrency(totals.transport)"
          color="orange"
          :subtitle="`Diesel: ${formatCurrency(totals.diesel)} | Maint: ${formatCurrency(totals.maintenance)}`"
        />
      </v-col>
    </v-row>

    <!-- Table Card -->
    <v-card class="modern-card pa-4 table-card-full" elevation="0">
      <!-- Filter Bar -->
      <div class="d-flex align-center justify-space-between mb-3 flex-wrap" style="gap: 16px;">
        <div class="d-flex align-center flex-wrap flex-grow-1" style="gap: 12px;">
          <!-- View Preset Buttons -->
          <v-btn-toggle
            v-model="viewFilterMode"
            mandatory
            density="compact"
            color="primary"
            variant="outlined"
            rounded="lg"
            @update:model-value="onFilterModeChange"
          >
            <v-btn value="today" size="small" class="text-capitalize">Today</v-btn>
            <v-btn value="range" size="small" class="text-capitalize">Date Range</v-btn>
            <v-btn value="all" size="small" class="text-capitalize">All</v-btn>
          </v-btn-toggle>

          <div v-if="viewFilterMode === 'today'" style="min-width: 260px; width: 280px;">
            <AppDatePicker
              v-model="filterDate"
              label="Date"
              hide-details
              @change="loadExpenses"
            />
          </div>

          <template v-if="viewFilterMode === 'range'">
            <div style="min-width: 260px; width: 280px;">
              <AppDatePicker
                v-model="filterStartDate"
                label="From Date"
                hide-details
                @change="loadExpenses"
              />
            </div>
            <div style="min-width: 260px; width: 280px;">
              <AppDatePicker
                v-model="filterEndDate"
                label="To Date"
                hide-details
                @change="loadExpenses"
              />
            </div>
          </template>

          <v-select
            v-model="filterCategory"
            :items="categorySelectItems"
            label="Category"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 180px;"
            clearable
            @update:model-value="loadExpenses"
          />
        </div>

        <div class="text-caption text-grey font-weight-medium">
          {{ expenses.length }} transactions found
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      <BulkActionsBar
        v-if="authStore.isAdmin"
        :count="selectedIds.length"
        item-label="expense"
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
              <th>Category</th>
              <th>Sub-Category</th>
              <th>Linked Vehicle</th>
              <th class="text-end">Amount</th>
              <th>Notes</th>
              <th v-if="authStore.isAdmin" class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in paginatedExpenses"
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
              <td>
                <span
                  class="erp-tag"
                  :class="getCategoryTagClass(item.category)"
                >
                  {{ item.category }}
                </span>
              </td>
              <td>
                <span
                  v-if="item.subCategory"
                  class="erp-tag erp-tag-green"
                >
                  {{ item.subCategory }}
                </span>
                <span v-else class="text-grey">-</span>
              </td>
              <td>
                <span v-if="item.vehicleNumber" class="d-flex align-center text-caption font-weight-bold text-primary">
                  <v-icon size="14" class="me-1">mdi-truck</v-icon>
                  {{ item.vehicleNumber }}
                </span>
                <span v-else class="text-grey">-</span>
              </td>
              <td class="text-end font-weight-bold text-error tabular-nums">
                {{ formatCurrency(item.amount) }}
              </td>
              <td class="text-caption text-grey-darken-1">{{ item.notes || '-' }}</td>
              <td v-if="authStore.isAdmin" class="text-end">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  color="primary"
                  title="Edit Expense"
                  @click="openDialog(item)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  title="Delete Expense"
                  @click="confirmDelete(item)"
                />
              </td>
            </tr>
            <tr v-if="expenses.length === 0">
              <td :colspan="authStore.isAdmin ? 8 : 6" class="text-center pa-8">
                <div class="empty-state-box">
                  <v-icon class="empty-state-icon">mdi-currency-pkr</v-icon>
                  <div class="empty-state-title">No Expenses Recorded</div>
                  <div class="empty-state-subtitle">No operating expense records found for the selected date or category filter.</div>
                  <v-btn color="primary" variant="flat" size="small" class="mt-2 text-capitalize font-weight-bold" prepend-icon="mdi-plus" @click="openDialog()">
                    Add Expense
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
        :total-items="expenses.length"
      />
    </v-card>

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="dialog" max-width="520">
      <v-card class="rounded-xl pa-3">
        <v-card-title class="font-weight-bold pt-3 px-4">
          {{ isEdit ? 'Edit Expense' : 'Add New Expense' }}
        </v-card-title>
        <v-card-text class="px-4 py-2">
          <v-form ref="formRef" v-model="formValid">
            <AppDatePicker
              v-model="form.date"
              label="Expense Date *"
              density="comfortable"
              :rules="[v => !!v || 'Date is required']"
              class="mb-3"
            />

            <v-select
              v-model="form.category"
              :items="categories"
              item-title="name"
              item-value="name"
              label="Category *"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Category is required']"
              class="mb-3"
              @update:model-value="onCategoryChange"
            />

            <!-- Transport Sub-type (Diesel or Maintenance) -->
            <div v-if="isTransportCategory" class="mb-3">
              <v-select
                v-model="form.subCategory"
                :items="['Diesel', 'Maintenance', 'Toll/Tax', 'Other Transport']"
                label="Transport Sub-Type *"
                variant="outlined"
                density="comfortable"
                class="mb-3"
              />

              <v-select
                v-model="form.vehicleId"
                :items="vehicles"
                item-title="vehicleNumber"
                item-value="id"
                label="Optional Vehicle Link"
                placeholder="Select vehicle"
                variant="outlined"
                density="comfortable"
                clearable
                @update:model-value="onVehicleSelect"
              />
            </div>

            <v-combobox
              v-else-if="selectedCategorySubTypes.length > 0"
              v-model="form.subCategory"
              :items="selectedCategorySubTypes"
              label="Sub-Category / Description"
              placeholder="Select or enter sub-category"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />

            <v-text-field
              v-else
              v-model="form.subCategory"
              label="Sub-Category / Description"
              placeholder="e.g. Vegetables, Electricity bill, Cleaning"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />

            <v-text-field
              v-model.number="form.amount"
              type="number"
              label="Amount (Rs.) *"
              placeholder="e.g. 2500"
              prepend-inner-icon="mdi-currency-pkr"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v && v > 0 || 'Amount must be greater than 0']"
              class="mb-3"
            />

            <v-textarea
              v-model="form.notes"
              label="Notes"
              placeholder="Receipt details, vendor name or explanation"
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
            @click="saveExpense"
          >
            Save Expense
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="deleteDialog"
      title="Delete Expense"
      :message="`Are you sure you want to delete expense of ${formatCurrency(targetExpense?.amount)} (${targetExpense?.category})?`"
      :loading="deleting"
      @confirm="executeDelete"
    />

    <!-- Bulk Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="bulkDeleteDialog"
      title="Bulk Delete Expenses"
      :message="`Are you sure you want to delete ${selectedIds.length} selected expense(s)? This action cannot be undone.`"
      :loading="bulkDeleting"
      @confirm="executeBulkDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useDisplay } from 'vuetify';
import ExpensesMobileView from './ExpensesMobileView.vue';
import { expenseService } from '@/services/expenseService';
import { mastersService } from '@/services/mastersService';
import { useBusinessDayStore } from '@/stores/businessDay';
import { useAuthStore } from '@/stores/auth';
import { useSnackbarStore } from '@/stores/snackbar';
import { formatCurrency, formatDate } from '@/utils/formatters';
import StatCard from '@/components/common/StatCard.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import AppDatePicker from '@/components/common/AppDatePicker.vue';
import AppPagination from '@/components/common/AppPagination.vue';
import BulkActionsBar from '@/components/common/BulkActionsBar.vue';

const businessDayStore = useBusinessDayStore();
const authStore = useAuthStore();
const snackbar = useSnackbarStore();
const display = useDisplay();

const viewFilterMode = ref('today');
const filterDate = ref(businessDayStore.activeBusinessDate);
const filterStartDate = ref(businessDayStore.activeBusinessDate);
const filterEndDate = ref(businessDayStore.activeBusinessDate);
const filterCategory = ref(null);

const expenses = ref([]);
const categories = ref([]);
const vehicles = ref([]);

const page = ref(1);
const itemsPerPage = ref(10);
const selectedIds = ref([]);
const bulkDeleteDialog = ref(false);
const bulkDeleting = ref(false);

const paginatedExpenses = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  return expenses.value.slice(start, start + itemsPerPage.value);
});

const isAllSelected = computed(() => {
  return paginatedExpenses.value.length > 0 && paginatedExpenses.value.every(item => selectedIds.value.includes(item.id));
});

const isSomeSelected = computed(() => {
  return selectedIds.value.length > 0 && !isAllSelected.value;
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = paginatedExpenses.value.map(item => item.id);
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
const targetExpense = ref(null);

const form = ref({
  id: null,
  date: businessDayStore.activeBusinessDate,
  category: 'Food',
  subCategory: '',
  vehicleId: null,
  vehicleNumber: '',
  amount: 1000,
  notes: '',
});

const isTransportCategory = computed(() => {
  return form.value.category?.toLowerCase() === 'transport';
});

const selectedCategorySubTypes = computed(() => {
  const target = (form.value.category || '').trim().toLowerCase();
  const match = categories.value.find((c) => (c.name || '').trim().toLowerCase() === target);
  return Array.isArray(match?.subTypes) ? match.subTypes : [];
});

const categorySelectItems = computed(() => {
  return categories.value.map((c) => c.name);
});

const totals = computed(() => {
  return expenseService.calculateTotals(expenses.value);
});

function getCategoryTagClass(cat) {
  const c = (cat || '').toLowerCase();
  if (c === 'food') return 'erp-tag-blue';
  if (c === 'home') return 'erp-tag-teal';
  if (c === 'transport') return 'erp-tag-orange';
  return 'erp-tag-blue';
}

function getCategoryColor(cat) {
  const c = (cat || '').toLowerCase();
  if (c === 'food') return 'primary';
  if (c === 'home') return 'teal';
  if (c === 'transport') return 'orange-darken-2';
  return 'blue-grey';
}

function onCategoryChange(cat) {
  if (cat?.toLowerCase() === 'transport') {
    form.value.subCategory = 'Diesel';
  } else {
    form.value.subCategory = '';
    form.value.vehicleId = null;
    form.value.vehicleNumber = '';
  }
}

function onVehicleSelect(vId) {
  const match = vehicles.value.find((v) => v.id === vId);
  form.value.vehicleNumber = match ? match.vehicleNumber : '';
}

function onFilterModeChange(mode) {
  if (mode === 'today') {
    if (businessDayStore.isLockedOnPreviousDay) {
      snackbar.warning(businessDayStore.lockReason);
    }
    filterDate.value = businessDayStore.activeBusinessDate;
  }
  loadExpenses();
}

async function loadData() {
  try {
    await businessDayStore.refreshBusinessDay();
    filterDate.value = businessDayStore.activeBusinessDate;
    filterStartDate.value = businessDayStore.activeBusinessDate;
    filterEndDate.value = businessDayStore.activeBusinessDate;
    form.value.date = businessDayStore.activeBusinessDate;

    const [cats, vehs] = await Promise.all([
      expenseService.getCategories(),
      mastersService.getVehicles(),
    ]);
    categories.value = cats;
    vehicles.value = vehs.filter((v) => v.status === 'Active');
    await loadExpenses();
  } catch (err) {
    snackbar.error('Failed to load expense data');
  }
}

async function loadExpenses() {
  try {
    selectedIds.value = [];
    let params = { category: filterCategory.value };
    if (viewFilterMode.value === 'today') {
      params.date = filterDate.value || businessDayStore.activeBusinessDate;
    } else if (viewFilterMode.value === 'range') {
      params.startDate = filterStartDate.value;
      params.endDate = filterEndDate.value;
    }
    expenses.value = await expenseService.getExpenses(params);
    page.value = 1;
  } catch (err) {
    snackbar.error('Failed to load expenses');
  }
}

function openDialog(item = null) {
  if (item && !authStore.isAdmin) {
    snackbar.error('Staff members can only record new expenses, not edit existing records.');
    return;
  }
  if (!item && businessDayStore.isLockedOnPreviousDay) {
    snackbar.error(businessDayStore.lockReason);
    return;
  }
  if (item) {
    isEdit.value = true;
    form.value = { ...item };
  } else {
    isEdit.value = false;
    form.value = {
      id: null,
      date: businessDayStore.activeBusinessDate,
      category: categories.value.length > 0 ? categories.value[0].name : 'Food',
      subCategory: '',
      vehicleId: null,
      vehicleNumber: '',
      amount: 1500,
      notes: '',
    };
  }
  dialog.value = true;
}

async function saveExpense() {
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

  if (!form.value.category || !form.value.amount || form.value.amount <= 0) {
    snackbar.error('Please enter valid category and amount');
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await expenseService.updateExpense(form.value.id, form.value);
      snackbar.success('Expense updated');
    } else {
      await expenseService.addExpense(form.value);
      snackbar.success('Expense recorded successfully');
    }
    dialog.value = false;
    await Promise.all([loadExpenses(), businessDayStore.refreshBusinessDay()]);
  } catch (err) {
    snackbar.error(err.message || 'Failed to save expense');
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
  targetExpense.value = item;
  deleteDialog.value = true;
}

async function executeDelete() {
  if (!targetExpense.value) return;
  deleting.value = true;
  try {
    await expenseService.deleteExpense(targetExpense.value.id, targetExpense.value.date);
    snackbar.success('Expense deleted');
    deleteDialog.value = false;
    await Promise.all([loadExpenses(), businessDayStore.refreshBusinessDay()]);
  } catch (err) {
    snackbar.error('Failed to delete expense');
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
  const closedMatch = expenses.value.find(
    (e) => selectedIds.value.includes(e.id) && businessDayStore.closedDates.includes(e.date)
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
      const item = expenses.value.find(e => e.id === id);
      await expenseService.deleteExpense(id, item?.date);
    }
    snackbar.success(`${toDelete.length} expense(s) deleted`);
    selectedIds.value = [];
    bulkDeleteDialog.value = false;
    await Promise.all([loadExpenses(), businessDayStore.refreshBusinessDay()]);
  } catch (err) {
    snackbar.error('Failed to delete some records');
  } finally {
    bulkDeleting.value = false;
  }
}

watch(
  () => businessDayStore.activeBusinessDate,
  (newDate, oldDate) => {
    if (filterDate.value === oldDate || (businessDayStore.isLockedOnPreviousDay && filterDate.value > newDate)) {
      filterDate.value = newDate;
      loadExpenses();
    }
  }
);

onMounted(() => {
  loadData();
});
</script>

