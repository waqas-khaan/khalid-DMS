<template>
  <div :class="embedded ? 'embedded-master-view' : 'page-container table-page'">
    <div v-if="!embedded" class="page-header">
      <div>
        <h1 class="page-header-title">Monthly Staff Salaries & Payroll</h1>
        <p class="page-header-subtitle">
          Formula: Net = Salary - Pay Cut [max(0, Absences - 2) × (Salary / Days)] - Advances
        </p>
      </div>

      <div class="d-flex align-center flex-wrap" style="gap: 12px;">
        <div style="min-width: 230px; width: 250px;">
          <AppMonthPicker
            v-model="selectedMonth"
            label="Payroll Month"
            hide-details
            @change="loadSalaries"
          />
        </div>
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-refresh"
          class="text-capitalize rounded-lg font-weight-bold"
          height="40"
          :loading="loading"
          @click="loadSalaries"
        >
          Recalculate
        </v-btn>
      </div>
    </div>

    <!-- Payroll Summary Cards -->
    <v-row dense class="mb-3">
      <v-col cols="6" sm="6" md="3">
        <StatCard
          label="Total Gross Salary"
          :value="formatCurrency(payrollTotals.gross)"
          color="primary"
          subtitle="Fixed base payroll"
        />
      </v-col>
      <v-col cols="6" sm="6" md="3">
        <StatCard
          label="Total Attendance Cuts"
          :value="formatCurrency(payrollTotals.payCut)"
          color="error"
          subtitle="Absences exceeding 2 days"
        />
      </v-col>
      <v-col cols="6" sm="6" md="3">
        <StatCard
          label="Total Advances Deducted"
          :value="formatCurrency(payrollTotals.advances)"
          color="warning"
          subtitle="Mid-month salary advances"
        />
      </v-col>
      <v-col cols="6" sm="6" md="3">
        <StatCard
          label="Net Payable Payroll"
          :value="formatCurrency(payrollTotals.net)"
          color="success"
          subtitle="Final amount to disburse"
        />
      </v-col>
    </v-row>

    <!-- Table Card -->
    <v-card class="modern-card pa-4 table-card-full" elevation="0">
      <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-2">
        <div class="d-flex align-center flex-wrap gap-3">
          <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-3">
            Payroll Ledger for {{ formatMonthTitle(selectedMonth) }} ({{ daysInCurrentMonth }} days)
          </h3>
          <template v-if="embedded">
            <div style="min-width: 210px; width: 230px;">
              <AppMonthPicker
                v-model="selectedMonth"
                label="Payroll Month"
                hide-details
                @change="loadSalaries"
              />
            </div>
            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              prepend-icon="mdi-refresh"
              class="text-capitalize rounded-lg font-weight-bold"
              :loading="loading"
              @click="loadSalaries"
            >
              Recalculate
            </v-btn>
          </template>
        </div>
        <div class="d-flex align-center gap-2 flex-wrap">
          <v-text-field
            v-model="searchStaff"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search employee..."
            variant="outlined"
            density="compact"
            hide-details
            style="min-width: 190px; width: 220px;"
            clearable
          />
          <v-chip color="info" size="small" variant="tonal" class="font-weight-medium">
            Policy: 2 Free Absences Per Month
          </v-chip>
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      <BulkActionsBar
        v-if="authStore.isAdmin"
        :count="selectedIds.length"
        item-label="staff member"
        @clear="selectedIds = []"
      >
        <template #actions>
          <v-btn
            size="small"
            variant="flat"
            color="success"
            class="text-capitalize font-weight-bold"
            prepend-icon="mdi-currency-pkr"
            @click="confirmBulkPay"
          >
            Pay Selected ({{ selectedIds.length }})
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
              <th>Employee Name</th>
              <th class="text-end">Base Salary</th>
              <th class="text-center">Absences</th>
              <th class="text-center">Deductible Days</th>
              <th class="text-end">Per-Day Rate</th>
              <th class="text-end">Pay Cut</th>
              <th class="text-end">Advances</th>
              <th class="text-end font-weight-black">Net Payable</th>
              <th class="text-center">Status</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="emp in paginatedSalaryRecords"
              :key="emp.employeeId"
              :class="{ 'selected-row': selectedIds.includes(emp.employeeId) }"
            >
              <td v-if="authStore.isAdmin" class="table-checkbox-col">
                <v-checkbox-btn
                  :model-value="selectedIds.includes(emp.employeeId)"
                  color="primary"
                  density="compact"
                  @update:model-value="toggleSelectItem(emp.employeeId)"
                  @click.stop
                />
              </td>
              <td>
                <div class="font-weight-bold text-primary">{{ emp.employeeName }}</div>
                <div class="text-caption text-grey">{{ emp.designation || 'Driver' }}</div>
              </td>
              <td class="text-end font-weight-medium tabular-nums">
                {{ formatCurrency(emp.baseSalary) }}
              </td>
              <td class="text-center">
                <v-chip
                  size="x-small"
                  :color="emp.absents > 2 ? 'error' : 'grey'"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  {{ emp.absents }} / 2 free
                </v-chip>
              </td>
              <td class="text-center font-weight-bold" :class="emp.deductibleDays > 0 ? 'text-error' : 'text-grey'">
                {{ emp.deductibleDays }} days
              </td>
              <td class="text-end text-caption font-weight-medium tabular-nums">
                {{ formatCurrency(emp.perDayRate) }}
              </td>
              <td class="text-end font-weight-bold text-error tabular-nums">
                - {{ formatCurrency(emp.payCut) }}
              </td>
              <td class="text-end font-weight-bold text-warning tabular-nums">
                - {{ formatCurrency(emp.advancesTotal) }}
              </td>
              <td class="text-end font-weight-black text-subtitle-1 text-success tabular-nums">
                {{ formatCurrency(emp.netPayable) }}
              </td>
              <td class="text-center">
                <span
                  class="erp-tag"
                  :class="emp.status === 'Paid' ? 'erp-tag-green' : 'erp-tag-orange'"
                >
                  {{ emp.status || 'UNPAID' }}
                </span>
              </td>
              <td class="text-end" style="white-space: nowrap;">
                <v-btn
                  size="small"
                  variant="tonal"
                  color="info"
                  class="text-capitalize me-1 font-weight-bold"
                  prepend-icon="mdi-file-account-outline"
                  title="Inspect Monthly Attendance & Advances Record"
                  :to="{ path: '/employees', query: { tab: 'record', employeeId: emp.employeeId, month: selectedMonth } }"
                >
                  Record
                </v-btn>
                <v-btn
                  size="small"
                  variant="tonal"
                  color="primary"
                  class="text-capitalize me-1 font-weight-bold"
                  prepend-icon="mdi-receipt"
                  @click="openSlipDialog(emp)"
                >
                  Slip
                </v-btn>
                <v-btn
                  v-if="emp.status !== 'Paid' && authStore.isAdmin"
                  size="small"
                  variant="flat"
                  color="success"
                  class="text-capitalize font-weight-bold"
                  prepend-icon="mdi-currency-pkr"
                  @click="promptPaySalary(emp)"
                >
                  Pay
                </v-btn>
              </td>
            </tr>
            <tr v-if="salaryRecords.length === 0">
              <td :colspan="authStore.isAdmin ? 11 : 10" class="text-center pa-8">
                <div class="empty-state-box">
                  <v-icon class="empty-state-icon">mdi-currency-pkr</v-icon>
                  <div class="empty-state-title">No Active Staff Found</div>
                  <div class="empty-state-subtitle">Register active staff in the Staff Directory to generate monthly payroll.</div>
                  <v-btn color="primary" variant="flat" size="small" class="mt-2 text-capitalize font-weight-bold px-5" prepend-icon="mdi-plus" @click="$router.push({ path: '/employees', query: { tab: 'directory' } })">
                    Go to Staff Directory
                  </v-btn>
                </div>
              </td>
            </tr>
            <tr v-else-if="displayedSalaryRecords.length === 0">
              <td :colspan="authStore.isAdmin ? 11 : 10" class="text-center py-6 text-grey">
                No staff members match "{{ searchStaff }}".
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <!-- Pagination Footer -->
      <AppPagination
        v-model:page="page"
        v-model:itemsPerPage="itemsPerPage"
        :total-items="displayedSalaryRecords.length"
      />
    </v-card>

    <!-- Detailed Salary Slip Dialog -->
    <SalarySlipDialog
      v-model="slipDialog"
      :salary="selectedEmployeeSlip"
      :paying="payingSalary"
      @pay-now="executeSalaryPayment"
    />

    <!-- Pay Salary Quick Dialog -->
    <v-dialog v-model="payDialog" max-width="450">
      <v-card v-if="payingEmployee" class="rounded-xl pa-4">
        <v-card-title class="font-weight-bold px-0 pt-0">
          Confirm Salary Payment
        </v-card-title>
        <v-card-text class="px-0 py-2">
          <p class="text-body-2 mb-3">
            You are recording a salary payment of <strong>{{ formatCurrency(payingEmployee.netPayable) }}</strong> for <strong>{{ payingEmployee.employeeName }}</strong> for the month of <strong>{{ selectedMonth }}</strong>.
          </p>

          <v-select
            v-model="paymentMethod"
            :items="SALARY_PAYMENT_METHODS"
            label="Payment Method"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />

          <v-text-field
            v-model="paymentNotes"
            label="Payment Notes"
            placeholder="e.g. Cash disbursed by manager"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions class="px-0 pb-0 justify-end">
          <v-btn variant="text" class="text-capitalize" @click="payDialog = false">Cancel</v-btn>
          <v-btn
            color="success"
            variant="flat"
            class="text-capitalize rounded-lg px-4 font-weight-bold"
            :loading="payingSalary"
            @click="confirmPaySalary"
          >
            Confirm & Pay
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Bulk Pay Confirmation Dialog -->
    <v-dialog v-model="bulkPayDialog" max-width="450">
      <v-card class="rounded-xl pa-4">
        <v-card-title class="font-weight-bold px-0 pt-0 text-success">
          <v-icon color="success" class="me-1">mdi-currency-pkr</v-icon>
          Pay Selected Salaries
        </v-card-title>
        <v-card-text class="px-0 py-2">
          <p class="text-body-2 mb-3">
            Mark monthly salary as paid for <strong>{{ selectedIds.length }}</strong> selected employee(s) for <strong>{{ selectedMonth }}</strong>?
          </p>
          <v-select
            v-model="bulkPaymentMethod"
            :items="SALARY_PAYMENT_METHODS"
            label="Payment Method"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model="bulkPaymentNotes"
            label="Payment Notes"
            placeholder="e.g. Disbursed by manager"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions class="px-0 pb-0 justify-end">
          <v-btn variant="text" class="text-capitalize" @click="bulkPayDialog = false">Cancel</v-btn>
          <v-btn
            color="success"
            variant="flat"
            class="text-capitalize rounded-lg px-4 font-weight-bold"
            :loading="bulkPaying"
            @click="executeBulkPay"
          >
            Confirm & Pay All
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { employeeService, SALARY_PAYMENT_METHODS } from '@/services/employeeService';
import { useSnackbarStore } from '@/stores/snackbar';
import { formatCurrency, getCurrentMonthString, getMonthDaysCount } from '@/utils/formatters';
import StatCard from '@/components/common/StatCard.vue';
import SalarySlipDialog from '@/components/salary/SalarySlipDialog.vue';
import AppMonthPicker from '@/components/common/AppMonthPicker.vue';
import AppPagination from '@/components/common/AppPagination.vue';
import BulkActionsBar from '@/components/common/BulkActionsBar.vue';

defineProps({
  embedded: { type: Boolean, default: false },
});

const authStore = useAuthStore();
const snackbar = useSnackbarStore();

const selectedMonth = ref(getCurrentMonthString());
const salaryRecords = ref([]);
const loading = ref(false);
const searchStaff = ref('');
const page = ref(1);
const itemsPerPage = ref(10);
const selectedIds = ref([]);
const bulkPayDialog = ref(false);
const bulkPaying = ref(false);
const bulkPaymentMethod = ref('Cash');
const bulkPaymentNotes = ref('');

const displayedSalaryRecords = computed(() => {
  if (!searchStaff.value) return salaryRecords.value;
  const q = searchStaff.value.toLowerCase().trim();
  return salaryRecords.value.filter(
    (s) =>
      (s.employeeName && s.employeeName.toLowerCase().includes(q)) ||
      (s.designation && s.designation.toLowerCase().includes(q))
  );
});

const paginatedSalaryRecords = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  return displayedSalaryRecords.value.slice(start, start + itemsPerPage.value);
});

const isAllSelected = computed(() => {
  return paginatedSalaryRecords.value.length > 0 && paginatedSalaryRecords.value.every(emp => selectedIds.value.includes(emp.employeeId));
});

const isSomeSelected = computed(() => {
  return selectedIds.value.length > 0 && !isAllSelected.value;
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = paginatedSalaryRecords.value.map(emp => emp.employeeId);
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

watch([selectedMonth, searchStaff], () => {
  page.value = 1;
  selectedIds.value = [];
});

function changeMonth(delta) {
  const [year, month] = selectedMonth.value.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  selectedMonth.value = `${y}-${m}`;
  loadSalaries();
}

const slipDialog = ref(false);
const selectedEmployeeSlip = ref(null);

const payDialog = ref(false);
const payingEmployee = ref(null);
const paymentMethod = ref('Cash');
const paymentNotes = ref('');
const payingSalary = ref(false);

const daysInCurrentMonth = computed(() => {
  return getMonthDaysCount(selectedMonth.value);
});

const payrollTotals = computed(() => {
  let gross = 0;
  let payCut = 0;
  let advances = 0;
  let net = 0;

  for (const s of salaryRecords.value) {
    gross += Number(s.baseSalary) || 0;
    payCut += Number(s.payCut) || 0;
    advances += Number(s.advancesTotal) || 0;
    net += Number(s.netPayable) || 0;
  }

  return { gross, payCut, advances, net };
});

function formatMonthTitle(mStr) {
  if (!mStr) return '';
  const [year, month] = mStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

async function loadSalaries() {
  loading.value = true;
  try {
    selectedIds.value = [];
    salaryRecords.value = await employeeService.computeMonthlySalaries(selectedMonth.value);
  } catch (err) {
    snackbar.error('Failed to compute monthly payroll');
  } finally {
    loading.value = false;
  }
}

function openSlipDialog(emp) {
  selectedEmployeeSlip.value = emp;
  slipDialog.value = true;
}

function promptPaySalary(emp) {
  if (!authStore.isAdmin) {
    snackbar.error('Staff cannot disburse salaries. Only administrators have permission.');
    return;
  }
  payingEmployee.value = emp;
  paymentMethod.value = 'Cash';
  paymentNotes.value = '';
  payDialog.value = true;
}

async function confirmPaySalary() {
  if (!payingEmployee.value) return;
  payingSalary.value = true;
  try {
    await employeeService.recordSalaryPayment({
      ...payingEmployee.value,
      paymentMethod: paymentMethod.value,
      notes: paymentNotes.value,
    });
    snackbar.success(`Salary paid successfully to ${payingEmployee.value.employeeName}`);
    payDialog.value = false;
    await loadSalaries();
  } catch (err) {
    snackbar.error(err.message || 'Payment recording failed');
  } finally {
    payingSalary.value = false;
  }
}

async function executeSalaryPayment(salary) {
  payingSalary.value = true;
  try {
    await employeeService.recordSalaryPayment(salary);
    snackbar.success(`Salary marked as paid for ${salary.employeeName}`);
    slipDialog.value = false;
    await loadSalaries();
  } catch (err) {
    snackbar.error(err.message || 'Payment failed');
  } finally {
    payingSalary.value = false;
  }
}

function confirmBulkPay() {
  if (!authStore.isAdmin) {
    snackbar.error('Staff cannot disburse salaries. Only administrators have permission.');
    return;
  }
  if (selectedIds.value.length === 0) return;
  bulkPaymentMethod.value = 'Cash';
  bulkPaymentNotes.value = 'Bulk payroll disbursement';
  bulkPayDialog.value = true;
}

async function executeBulkPay() {
  bulkPaying.value = true;
  try {
    const toPay = salaryRecords.value.filter(
      (s) => selectedIds.value.includes(s.employeeId) && s.status !== 'Paid'
    );
    for (const emp of toPay) {
      await employeeService.recordSalaryPayment({
        ...emp,
        paymentMethod: bulkPaymentMethod.value,
        notes: bulkPaymentNotes.value,
      });
    }
    snackbar.success(`Salaries marked as paid for ${toPay.length} employee(s)`);
    selectedIds.value = [];
    bulkPayDialog.value = false;
    await loadSalaries();
  } catch (err) {
    snackbar.error(err.message || 'Bulk payment failed');
  } finally {
    bulkPaying.value = false;
  }
}

onMounted(() => {
  loadSalaries();
});
</script>

