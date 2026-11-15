<template>
  <div :class="embedded ? 'embedded-master-view' : 'page-container table-page'">
    <div v-if="!embedded" class="page-header">
      <div>
        <h1 class="page-header-title">Staff Salary Advances</h1>
        <p class="page-header-subtitle">Record and track salary advances ("kis kaam ke liye") deducted from monthly payroll</p>
      </div>

      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        class="text-capitalize font-weight-bold px-5"
        :disabled="businessDayStore.isLockedOnPreviousDay"
        :title="businessDayStore.isLockedOnPreviousDay ? businessDayStore.lockReason : 'Record Advance'"
        @click="openDialog"
      >
        Record Advance
      </v-btn>
    </div>

    <!-- Summary Banner -->
    <v-row dense class="mb-3">
      <v-col cols="6" sm="6" md="4">
        <StatCard
          label="Total Advances"
          :value="formatCurrency(totalAdvancesAmount)"
          color="warning"
          :subtitle="`Month: ${selectedMonth}`"
        />
      </v-col>
      <v-col cols="6" sm="6" md="4">
        <StatCard
          label="Advances Count"
          :value="filteredAdvances.length"
          color="info"
          subtitle="Transactions recorded"
        />
      </v-col>
    </v-row>

    <!-- Table Card -->
    <v-card class="modern-card pa-4 table-card-full" elevation="0">
      <div class="d-flex align-center justify-space-between mb-3 flex-wrap" style="gap: 16px;">
        <div class="d-flex align-center flex-wrap" style="gap: 12px;">
          <div style="min-width: 230px; width: 250px;">
            <AppMonthPicker
              v-model="selectedMonth"
              label="Filter Month"
              hide-details
              @change="loadAdvances"
            />
          </div>
          <v-select
            v-model="selectedEmployeeFilter"
            :items="employeeOptions"
            item-title="name"
            item-value="id"
            label="Filter by Employee"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-account"
            hide-details
            style="min-width: 200px; max-width: 240px;"
            clearable
            @update:model-value="loadAdvances"
          />
          <v-btn
            v-if="selectedEmployeeFilter"
            variant="tonal"
            size="small"
            color="primary"
            prepend-icon="mdi-filter-remove-outline"
            class="text-capitalize rounded-lg font-weight-bold"
            @click="clearFilters"
          >
            Clear Filter
          </v-btn>
        </div>

        <div class="d-flex align-center flex-wrap" style="gap: 10px;">
          <div class="text-caption text-grey">
            Total: {{ formatCurrency(totalAdvancesAmount) }}
          </div>
          <v-btn
            v-if="embedded"
            color="primary"
            variant="flat"
            size="small"
            prepend-icon="mdi-plus"
            class="text-capitalize font-weight-bold px-4"
            :disabled="businessDayStore.isLockedOnPreviousDay"
            :title="businessDayStore.isLockedOnPreviousDay ? businessDayStore.lockReason : 'Record Advance'"
            @click="openDialog"
          >
            Record Advance
          </v-btn>
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      <BulkActionsBar
        v-if="authStore.isAdmin"
        :count="selectedIds.length"
        item-label="advance record"
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
              <th>Employee Name</th>
              <th class="text-end">Advance Amount</th>
              <th>Reason / Kis Kaam Ke Liye</th>
              <th>Month Applied</th>
              <th v-if="authStore.isAdmin" class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in paginatedAdvances"
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
              <td class="font-weight-bold text-primary">
                <v-icon size="18" class="me-1">mdi-account</v-icon>
                {{ item.employeeName }}
              </td>
              <td class="text-end font-weight-bold text-error">
                {{ formatCurrency(item.amount) }}
              </td>
              <td>
                <span class="font-weight-medium text-dark">{{ item.reason || 'General advance' }}</span>
              </td>
              <td>
                <span class="erp-tag erp-tag-blue">
                  {{ item.month }}
                </span>
              </td>
              <td v-if="authStore.isAdmin" class="text-end">
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="confirmDelete(item)"
                />
              </td>
            </tr>
            <tr v-if="filteredAdvances.length === 0">
              <td :colspan="authStore.isAdmin ? 7 : 5" class="text-center pa-8">
                <div class="empty-state-box">
                  <v-icon class="empty-state-icon">mdi-currency-pkr</v-icon>
                  <div class="empty-state-title">No Advances Recorded</div>
                  <div class="empty-state-subtitle">No salary advance deductions recorded for the selected month or employee.</div>
                  <v-btn color="primary" variant="flat" size="small" class="mt-2 text-capitalize font-weight-bold" prepend-icon="mdi-plus" @click="openDialog">
                    Record Advance
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
        :total-items="filteredAdvances.length"
      />
    </v-card>

    <!-- Record Advance Dialog -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card class="rounded-xl pa-3">
        <v-card-title class="font-weight-bold pt-3 px-4">
          Record Staff Advance
        </v-card-title>
        <v-card-text class="px-4 py-2">
          <v-form ref="formRef" v-model="formValid">
            <v-select
              v-model="form.employeeId"
              :items="employees"
              item-title="name"
              item-value="id"
              label="Select Employee *"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Employee is required']"
              class="mb-3"
              @update:model-value="onSelectEmployee"
            />

            <AppDatePicker
              v-model="form.date"
              label="Advance Date *"
              density="comfortable"
              :rules="[v => !!v || 'Date is required']"
              class="mb-3"
            />

            <v-text-field
              v-model.number="form.amount"
              type="number"
              label="Advance Amount (Rs.) *"
              placeholder="e.g. 5000"
              prepend-inner-icon="mdi-currency-pkr"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v && v > 0 || 'Amount must be greater than 0']"
              class="mb-3"
            />

            <v-textarea
              v-model="form.reason"
              label="Reason (Kis Kaam Ke Liye) *"
              placeholder="e.g. Emergency family medical treatment, home rent, bike repair"
              variant="outlined"
              rows="3"
              density="comfortable"
              :rules="[v => !!v || 'Please specify the reason']"
              hint="Specify the purpose of this cash advance"
              persistent-hint
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
            @click="saveAdvance"
          >
            Save Advance
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      v-model="deleteDialog"
      title="Delete Advance"
      :message="`Are you sure you want to delete advance of ${formatCurrency(targetAdvance?.amount)} for ${targetAdvance?.employeeName}?`"
      :loading="deleting"
      @confirm="executeDelete"
    />

    <!-- Bulk Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="bulkDeleteDialog"
      title="Bulk Delete Advances"
      :message="`Are you sure you want to delete ${selectedIds.length} selected advance record(s)? This action cannot be undone.`"
      :loading="bulkDeleting"
      @confirm="executeBulkDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { employeeService } from '@/services/employeeService';
import { useBusinessDayStore } from '@/stores/businessDay';
import { useSnackbarStore } from '@/stores/snackbar';
import { formatCurrency, formatDate, getCurrentMonthString } from '@/utils/formatters';
import StatCard from '@/components/common/StatCard.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import AppDatePicker from '@/components/common/AppDatePicker.vue';
import AppMonthPicker from '@/components/common/AppMonthPicker.vue';
import AppPagination from '@/components/common/AppPagination.vue';
import BulkActionsBar from '@/components/common/BulkActionsBar.vue';

defineProps({
  embedded: { type: Boolean, default: false },
});

const authStore = useAuthStore();
const businessDayStore = useBusinessDayStore();
const snackbar = useSnackbarStore();

const selectedMonth = ref(getCurrentMonthString());
const selectedEmployeeFilter = ref(null);
const advances = ref([]);
const employees = ref([]);
const page = ref(1);
const itemsPerPage = ref(10);
const selectedIds = ref([]);
const bulkDeleteDialog = ref(false);
const bulkDeleting = ref(false);
const dialog = ref(false);
const deleteDialog = ref(false);
const formValid = ref(true);
const saving = ref(false);
const deleting = ref(false);
const targetAdvance = ref(null);

const form = ref({
  employeeId: '',
  employeeName: '',
  date: businessDayStore.activeBusinessDate,
  amount: 2000,
  reason: '',
});

const employeeOptions = computed(() => {
  return employees.value.map((e) => ({ id: e.id, name: e.name }));
});

const filteredAdvances = computed(() => {
  return advances.value;
});

const paginatedAdvances = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  return filteredAdvances.value.slice(start, start + itemsPerPage.value);
});

const isAllSelected = computed(() => {
  return paginatedAdvances.value.length > 0 && paginatedAdvances.value.every(item => selectedIds.value.includes(item.id));
});

const isSomeSelected = computed(() => {
  return selectedIds.value.length > 0 && !isAllSelected.value;
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = paginatedAdvances.value.map(item => item.id);
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

const totalAdvancesAmount = computed(() => {
  return advances.value.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
});

function onSelectEmployee(empId) {
  const match = employees.value.find((e) => e.id === empId);
  form.value.employeeName = match ? match.name : '';
}

async function loadData() {
  try {
    await businessDayStore.refreshBusinessDay();
    form.value.date = businessDayStore.activeBusinessDate;
    selectedMonth.value = businessDayStore.activeBusinessDate.substring(0, 7);
    employees.value = await employeeService.getEmployees();
    await loadAdvances();
  } catch (err) {
    snackbar.error('Failed to load advances data');
  }
}

async function loadAdvances() {
  try {
    selectedIds.value = [];
    advances.value = await employeeService.getAdvances(
      selectedMonth.value,
      selectedEmployeeFilter.value
    );
    page.value = 1;
  } catch (err) {
    snackbar.error('Failed to load advances');
  }
}

function clearFilters() {
  selectedMonth.value = null;
  selectedEmployeeFilter.value = null;
  loadAdvances();
}

function openDialog() {
  if (businessDayStore.isLockedOnPreviousDay) {
    snackbar.error(businessDayStore.lockReason);
    return;
  }
  form.value = {
    employeeId: employees.value.length > 0 ? employees.value[0].id : '',
    employeeName: employees.value.length > 0 ? employees.value[0].name : '',
    date: businessDayStore.activeBusinessDate,
    amount: 3000,
    reason: '',
  };
  dialog.value = true;
}

async function saveAdvance() {
  await businessDayStore.refreshBusinessDay();
  if (businessDayStore.isLockedOnPreviousDay) {
    snackbar.error(businessDayStore.lockReason);
    return;
  }
  const dateCheck = businessDayStore.validateOperationDate(form.value.date);
  if (!dateCheck.valid) {
    snackbar.error(dateCheck.message);
    return;
  }

  if (!form.value.employeeId || !form.value.amount || !form.value.reason) {
    snackbar.error('Please fill required fields (Employee, Amount, Reason)');
    return;
  }
  saving.value = true;
  try {
    await employeeService.addAdvance(form.value);
    snackbar.success('Advance recorded successfully');
    dialog.value = false;
    await loadAdvances();
  } catch (err) {
    snackbar.error(err.message || 'Failed to save advance');
  } finally {
    saving.value = false;
  }
}

function confirmDelete(item) {
  if (!authStore.isAdmin) {
    snackbar.error('Staff cannot delete advances. Only administrators have permission.');
    return;
  }
  targetAdvance.value = item;
  deleteDialog.value = true;
}

async function executeDelete() {
  if (!targetAdvance.value) return;
  deleting.value = true;
  try {
    await employeeService.deleteAdvance(targetAdvance.value.id, targetAdvance.value.month);
    snackbar.success('Advance deleted');
    deleteDialog.value = false;
    await loadAdvances();
  } catch (err) {
    snackbar.error('Failed to delete advance');
  } finally {
    deleting.value = false;
  }
}

function confirmBulkDelete() {
  if (!authStore.isAdmin) {
    snackbar.error('Staff cannot delete advances. Only administrators have permission.');
    return;
  }
  if (selectedIds.value.length === 0) return;
  bulkDeleteDialog.value = true;
}

async function executeBulkDelete() {
  bulkDeleting.value = true;
  try {
    const toDelete = [...selectedIds.value];
    for (const id of toDelete) {
      const item = advances.value.find(a => a.id === id);
      await employeeService.deleteAdvance(id, item?.month);
    }
    snackbar.success(`${toDelete.length} advance(s) deleted successfully`);
    selectedIds.value = [];
    bulkDeleteDialog.value = false;
    await loadAdvances();
  } catch (err) {
    snackbar.error('Failed to delete some advances');
  } finally {
    bulkDeleting.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

