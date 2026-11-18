<template>
  <div :class="embedded ? 'embedded-master-view' : 'page-container table-page'">
    <div v-if="!embedded" class="page-header">
      <div>
        <h1 class="page-header-title">Monthly Employee Record</h1>
        <p class="page-header-subtitle">
          Complete monthly profile: daily attendance register, salary advances, and paid/pending salary status
        </p>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="record-metrics-grid mb-3">
      <StatCard
        label="Net Payable Salary"
        :value="formatCurrency(record ? record.netPayable : 0)"
        color="primary"
        :subtitle="record ? `Base: ${formatCurrency(record.baseSalary)} | Cut: -${formatCurrency(record.payCut)}` : 'Select an employee'"
      />
      <StatCard
        label="Monthly Salary Status"
        :value="record ? (record.status === 'Paid' ? 'PAID' : 'PENDING') : '-'"
        :color="record && record.status === 'Paid' ? 'success' : 'warning'"
        :subtitle="salaryStatusSubtitle"
      />
      <StatCard
        label="Advances This Month"
        :value="formatCurrency(record ? record.advancesTotal : 0)"
        color="warning"
        :subtitle="record ? `${record.advancesList.length} advance record(s)` : '0 advance records'"
      />
      <StatCard
        label="Daily Attendance"
        :value="record ? `${record.presentCount} P / ${record.absents} A` : '0 P / 0 A'"
        color="info"
        :subtitle="record ? `${record.deductibleDays} deductible day(s) (> 2 free)` : 'No attendance data'"
      />
    </div>

    <!-- Main Content Card -->
    <v-card class="modern-card pa-4 table-card-full" elevation="0">
      <!-- Filter & Action Toolbar -->
      <div class="d-flex align-center justify-space-between mb-3 flex-wrap flex-shrink-0" style="gap: 12px;">
        <div class="d-flex align-center flex-wrap" style="gap: 12px;">
          <v-select
            v-model="selectedEmployeeId"
            :items="employees"
            item-title="name"
            item-value="id"
            label="Select Employee"
            placeholder="Choose staff member"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-account-search"
            hide-details
            style="min-width: 240px; width: 270px;"
            no-data-text="No employees found"
            @update:model-value="loadRecord"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="item.raw.designation || 'Worker'" />
            </template>
          </v-select>

          <div style="min-width: 210px; width: 230px;">
            <AppMonthPicker
              v-model="selectedMonth"
              label="Month"
              hide-details
              @change="loadRecord"
            />
          </div>

          <v-btn-toggle
            v-if="record"
            v-model="attendanceFilter"
            mandatory
            density="compact"
            color="primary"
            variant="outlined"
            rounded="lg"
          >
            <v-btn value="all" size="small" class="text-capitalize">All Days</v-btn>
            <v-btn value="Present" size="small" class="text-capitalize">Present ({{ record.presentCount }})</v-btn>
            <v-btn value="Absent" size="small" class="text-capitalize">Absent ({{ record.absents }})</v-btn>
          </v-btn-toggle>
        </div>

        <div class="d-flex align-center flex-wrap" style="gap: 10px;">
          <v-btn
            v-if="record"
            color="primary"
            variant="tonal"
            size="small"
            prepend-icon="mdi-receipt"
            class="text-capitalize rounded-lg font-weight-bold"
            @click="slipDialog = true"
          >
            View / Print Slip
          </v-btn>
          <v-btn
            v-if="record && record.status !== 'Paid'"
            color="success"
            variant="flat"
            size="small"
            prepend-icon="mdi-currency-pkr"
            class="text-capitalize rounded-lg font-weight-bold"
            @click="openPayDialog"
          >
            Mark Salary Paid
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            size="small"
            prepend-icon="mdi-refresh"
            class="text-capitalize font-weight-bold px-4"
            :loading="loading"
            @click="loadEmployeesAndRecord"
          >
            Refresh
          </v-btn>
        </div>
      </div>

      <!-- Employee Monthly Record 2-Column Split (Always shows table headers even when empty) -->
      <div class="record-split-grid flex-grow-1">
        <!-- LEFT COLUMN: Daily Attendance Register for Selected Month -->
        <div class="record-panel record-attendance-panel">
          <div class="record-panel-header d-flex align-center justify-space-between px-4 py-2 border-b bg-grey-lighten-5">
            <div class="font-weight-bold text-subtitle-2 text-primary d-flex align-center gap-2">
              <v-icon size="18" color="primary">mdi-calendar-check</v-icon>
              <span>Daily Attendance — {{ formatMonthTitle(selectedMonth) }}</span>
            </div>
            <div class="text-caption text-grey-darken-1 font-weight-medium">
              {{ record ? `${record.presentCount} Present • ${record.absents} Absent • ${record.unmarkedCount} Unmarked` : '0 Present • 0 Absent' }}
            </div>
          </div>

          <div class="record-panel-scroll">
            <v-table hover density="compact">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th class="text-center">Attendance Status</th>
                  <th>Notes</th>
                  <th class="text-end" style="width: 80px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="record">
                  <tr v-for="day in filteredDailyAttendance" :key="day.date">
                    <td class="font-weight-bold text-dark" style="white-space: nowrap;">
                      {{ formatDate(day.date) }}
                    </td>
                    <td class="text-caption font-weight-medium text-grey-darken-2">
                      {{ day.dayName }}
                    </td>
                    <td>
                      <span
                        class="erp-tag"
                        :class="getAttendanceTagClass(day.status)"
                      >
                        {{ day.status }}
                      </span>
                    </td>
                    <td class="text-caption text-grey-darken-1">{{ day.notes || '-' }}</td>
                    <td class="text-end" style="white-space: nowrap;">
                      <v-btn
                        icon="mdi-pencil"
                        size="x-small"
                        variant="text"
                        color="primary"
                        title="Edit Attendance in Master"
                        @click="openMonthlyRecordEditModal(day)"
                      />
                    </td>
                  </tr>
                  <tr v-if="filteredDailyAttendance.length === 0">
                    <td colspan="5" class="text-center py-6 text-grey">
                      No {{ attendanceFilter.toLowerCase() }} days recorded for {{ formatMonthTitle(selectedMonth) }}.
                    </td>
                  </tr>
                </template>
                <tr v-else>
                  <td colspan="5" class="text-center pa-8">
                    <div class="empty-state-box">
                      <v-icon class="empty-state-icon">mdi-account-off-outline</v-icon>
                      <div class="empty-state-title">No Employees Registered</div>
                      <div class="empty-state-subtitle">
                        Add staff members in the Staff Directory to inspect their monthly attendance, advances, and salary records.
                      </div>
                      <v-btn
                        color="primary"
                        variant="flat"
                        size="small"
                        class="mt-2 text-capitalize font-weight-bold px-5"
                        prepend-icon="mdi-plus"
                        @click="$router.push({ path: '/employees', query: { tab: 'directory' } })"
                      >
                        Go to Staff Directory
                      </v-btn>
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </div>

        <!-- RIGHT COLUMN: Salary Status + Advances Breakdown -->
        <div class="record-panel record-finance-panel">
          <!-- Monthly Salary Status Box -->
          <div class="record-salary-card pa-4 border-b">
            <div class="d-flex align-center justify-space-between mb-3">
              <div>
                <div class="text-subtitle-2 font-weight-bold text-primary d-flex align-center gap-2">
                  <v-icon size="18" color="primary">mdi-currency-pkr</v-icon>
                  <span>Monthly Salary Settlement</span>
                </div>
                <div class="text-caption text-grey-darken-1">
                  {{ record ? `${record.employeeName} (${record.designation || 'Driver'})` : 'Select an employee to view salary breakdown' }}
                </div>
              </div>
              <span
                class="erp-tag"
                :class="record && record.status === 'Paid' ? 'erp-tag-green' : 'erp-tag-orange'"
              >
                {{ record && record.status === 'Paid' ? 'PAID' : 'PENDING' }}
              </span>
            </div>

            <div class="salary-breakdown-rows text-body-2">
              <div class="d-flex justify-space-between py-1">
                <span class="text-grey-darken-2">Base Monthly Salary</span>
                <span class="font-weight-bold tabular-nums">{{ formatCurrency(record ? record.baseSalary : 0) }}</span>
              </div>
              <div class="d-flex justify-space-between py-1">
                <span class="text-grey-darken-2">
                  Attendance Cut ({{ record ? record.deductibleDays : 0 }} extra day(s) × {{ formatCurrency(record ? record.perDayRate : 0) }})
                </span>
                <span class="font-weight-bold text-error tabular-nums">- {{ formatCurrency(record ? record.payCut : 0) }}</span>
              </div>
              <div class="d-flex justify-space-between py-1">
                <span class="text-grey-darken-2">Advances Deducted ({{ record ? record.advancesList.length : 0 }})</span>
                <span class="font-weight-bold text-warning tabular-nums">- {{ formatCurrency(record ? record.advancesTotal : 0) }}</span>
              </div>
              <div class="d-flex justify-space-between pt-2 mt-1 border-t">
                <span class="font-weight-bold text-dark">Net Payable Salary</span>
                <span class="text-subtitle-1 font-weight-black text-success tabular-nums">
                  {{ formatCurrency(record ? record.netPayable : 0) }}
                </span>
              </div>
            </div>

            <div
              v-if="record && record.status === 'Paid'"
              class="mt-3 pa-2 rounded-lg bg-green-lighten-5 border text-caption text-green-darken-4"
            >
              <strong>Paid:</strong> {{ formatDate(record.paidDate) }} via <strong>{{ record.paymentMethod || 'Cash' }}</strong>
              <span v-if="record.notes"> — {{ record.notes }}</span>
            </div>
            <div
              v-else-if="record"
              class="mt-3 pa-2 rounded-lg bg-orange-lighten-5 border text-caption text-orange-darken-4"
            >
              <strong>Pending:</strong> Salary for {{ formatMonthTitle(selectedMonth) }} has not been marked as paid yet.
            </div>
          </div>

          <!-- Advances Ledger for Selected Month -->
          <div class="record-panel-header d-flex align-center justify-space-between px-4 py-2 border-b bg-grey-lighten-5">
            <div class="font-weight-bold text-subtitle-2 text-primary d-flex align-center gap-2">
              <v-icon size="18" color="warning">mdi-cash-minus</v-icon>
              <span>Advances Taken — {{ formatMonthTitle(selectedMonth) }}</span>
            </div>
            <div class="text-caption font-weight-bold text-error tabular-nums">
              Total: {{ formatCurrency(record ? record.advancesTotal : 0) }}
            </div>
          </div>

          <div class="record-panel-scroll">
            <v-table hover density="compact">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reason (Kis Kaam Ke Liye)</th>
                  <th class="text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="record">
                  <tr v-for="adv in record.advancesList" :key="adv.id">
                    <td class="font-weight-medium" style="white-space: nowrap;">
                      {{ formatDate(adv.date) }}
                    </td>
                    <td class="text-caption text-grey-darken-2">{{ adv.reason || 'General advance' }}</td>
                    <td class="text-end font-weight-bold text-error tabular-nums">
                      {{ formatCurrency(adv.amount) }}
                    </td>
                  </tr>
                  <tr v-if="record.advancesList.length === 0">
                    <td colspan="3" class="text-center py-6 text-grey">
                      No advances taken by {{ record.employeeName }} in {{ formatMonthTitle(selectedMonth) }}.
                    </td>
                  </tr>
                </template>
                <tr v-else>
                  <td colspan="3" class="text-center py-8 text-grey">
                    Select an employee to view advances for {{ formatMonthTitle(selectedMonth) }}.
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </div>
      </div>
    </v-card>

    <!-- Salary Slip Modal -->
    <SalarySlipDialog
      v-model="slipDialog"
      :salary="record"
      :paying="payingSalary"
      @pay-now="executeSalaryPayment"
    />

    <!-- Quick Mark Paid Dialog -->
    <v-dialog v-model="payDialog" max-width="450">
      <v-card v-if="record" class="rounded-xl pa-4">
        <v-card-title class="font-weight-bold px-0 pt-0">
          Confirm Salary Payment
        </v-card-title>
        <v-card-text class="px-0 py-2">
          <p class="text-body-2 mb-3">
            Record salary payment of <strong>{{ formatCurrency(record.netPayable) }}</strong> for
            <strong>{{ record.employeeName }}</strong> ({{ formatMonthTitle(selectedMonth) }}).
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
            Confirm &amp; Pay
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Master Record Edit Attendance Dialog -->
    <v-dialog v-model="editAttendanceModal" max-width="460" persistent>
      <v-card class="rounded-xl overflow-hidden" elevation="4">
        <div class="px-5 py-4 bg-primary text-white d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-2">
            <v-icon color="white" size="20">mdi-pencil-lock</v-icon>
            <div class="text-subtitle-1 font-weight-bold">Edit Attendance (Master)</div>
          </div>
          <v-btn icon size="small" variant="text" color="white" @click="editAttendanceModal = false">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-card-text class="pa-5 bg-white">
          <div class="pa-3 rounded-lg bg-slate-50 border mb-4 text-caption">
            <div class="d-flex justify-space-between mb-1">
              <span class="text-slate-500">Employee:</span>
              <strong class="text-slate-900">{{ record?.employeeName }}</strong>
            </div>
            <div class="d-flex justify-space-between mb-1">
              <span class="text-slate-500">Date:</span>
              <strong class="text-slate-900">{{ formatDate(editingDay?.date) }}</strong>
            </div>
            <div class="d-flex justify-space-between">
              <span class="text-slate-500">Day:</span>
              <span class="font-weight-medium text-slate-700">{{ editingDay?.dayName }}</span>
            </div>
          </div>

          <label class="text-caption font-weight-bold text-slate-700 mb-1 d-block">
            Attendance Status *
          </label>
          <v-btn-toggle
            v-model="editAttendanceForm.status"
            mandatory
            density="compact"
            rounded="lg"
            class="border w-100 mb-4"
          >
            <v-btn
              value="Present"
              class="flex-grow-1 text-capitalize font-weight-bold"
              :color="editAttendanceForm.status === 'Present' ? 'success' : undefined"
              :variant="editAttendanceForm.status === 'Present' ? 'flat' : 'text'"
            >
              <v-icon size="16" class="me-1">mdi-check</v-icon>
              Present
            </v-btn>
            <v-btn
              value="Absent"
              class="flex-grow-1 text-capitalize font-weight-bold"
              :color="editAttendanceForm.status === 'Absent' ? 'error' : undefined"
              :variant="editAttendanceForm.status === 'Absent' ? 'flat' : 'text'"
            >
              <v-icon size="16" class="me-1">mdi-close</v-icon>
              Absent
            </v-btn>
          </v-btn-toggle>

          <label class="text-caption font-weight-bold text-slate-700 mb-1 d-block">
            Leave / Attendance Note
          </label>
          <v-text-field
            v-model="editAttendanceForm.notes"
            density="compact"
            variant="outlined"
            placeholder="e.g. Approved leave / Sick leave"
            hide-details
            class="rounded-lg"
          />
        </v-card-text>

        <v-card-actions class="px-5 py-3 bg-slate-50 border-t d-flex justify-end gap-2">
          <v-btn
            variant="text"
            color="slate-600"
            class="text-capitalize font-weight-medium"
            @click="editAttendanceModal = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="text-capitalize font-weight-bold px-4"
            :loading="savingAttendanceModal"
            @click="saveMonthlyRecordEdit"
          >
            Update in Master
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { employeeService, SALARY_PAYMENT_METHODS } from '@/services/employeeService';
import { useSnackbarStore } from '@/stores/snackbar';
import { formatCurrency, formatDate, getCurrentMonthString } from '@/utils/formatters';
import StatCard from '@/components/common/StatCard.vue';
import AppMonthPicker from '@/components/common/AppMonthPicker.vue';
import SalarySlipDialog from '@/components/salary/SalarySlipDialog.vue';

defineProps({
  embedded: { type: Boolean, default: false },
});

const route = useRoute();
const snackbar = useSnackbarStore();

const employees = ref([]);
const selectedEmployeeId = ref(null);
const selectedMonth = ref(
  typeof route.query.month === 'string' && /^\d{4}-\d{2}$/.test(route.query.month)
    ? route.query.month
    : getCurrentMonthString()
);
const attendanceFilter = ref('all');
const record = ref(null);
const loading = ref(false);
const slipDialog = ref(false);
const payDialog = ref(false);
const payingSalary = ref(false);
const paymentMethod = ref('Cash');
const paymentNotes = ref('');

// Master Attendance Edit Modal State
const editAttendanceModal = ref(false);
const editingDay = ref(null);
const savingAttendanceModal = ref(false);
const editAttendanceForm = ref({
  status: 'Present',
  notes: '',
});

const salaryStatusSubtitle = computed(() => {
  if (!record.value) return 'No employee selected';
  if (record.value.status === 'Paid') {
    return `Paid on ${formatDate(record.value.paidDate)} (${record.value.paymentMethod || 'Cash'})`;
  }
  return `Pending disbursement for ${formatMonthTitle(selectedMonth.value)}`;
});

const filteredDailyAttendance = computed(() => {
  if (!record.value) return [];
  if (attendanceFilter.value === 'all') return record.value.dailyAttendance;
  return record.value.dailyAttendance.filter((d) => d.status === attendanceFilter.value);
});

function formatMonthTitle(mStr) {
  if (!mStr) return '';
  const [year, month] = mStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getAttendanceTagClass(status) {
  if (status === 'Present') return 'erp-tag-green';
  if (status === 'Absent') return 'erp-tag-red';
  return 'erp-tag-grey';
}

async function loadEmployeesAndRecord() {
  loading.value = true;
  try {
    const list = await employeeService.getEmployees();
    employees.value = list;

    const queryEmpId = typeof route.query.employeeId === 'string' ? route.query.employeeId : '';
    if (queryEmpId && list.some((e) => e.id === queryEmpId)) {
      selectedEmployeeId.value = queryEmpId;
    } else if (!selectedEmployeeId.value || !list.some((e) => e.id === selectedEmployeeId.value)) {
      const preferred = list.find((e) => e.active !== false) || list[0];
      selectedEmployeeId.value = preferred ? preferred.id : null;
    }

    await loadRecord();
  } catch (err) {
    snackbar.error('Failed to load employee list');
  } finally {
    loading.value = false;
  }
}

async function loadRecord() {
  if (!selectedEmployeeId.value || !selectedMonth.value) {
    record.value = null;
    return;
  }
  loading.value = true;
  try {
    record.value = await employeeService.getEmployeeMonthlyRecord(selectedEmployeeId.value, selectedMonth.value);
  } catch (err) {
    snackbar.error('Failed to load monthly employee record');
  } finally {
    loading.value = false;
  }
}

function openPayDialog() {
  paymentMethod.value = 'Cash';
  paymentNotes.value = '';
  payDialog.value = true;
}

async function confirmPaySalary() {
  if (!record.value) return;
  payingSalary.value = true;
  try {
    await employeeService.recordSalaryPayment({
      ...record.value,
      paymentMethod: paymentMethod.value,
      notes: paymentNotes.value,
    });
    snackbar.success(`Salary marked as paid for ${record.value.employeeName}`);
    payDialog.value = false;
    await loadRecord();
  } catch (err) {
    snackbar.error(err.message || 'Payment failed');
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
    await loadRecord();
  } catch (err) {
    snackbar.error(err.message || 'Payment failed');
  } finally {
    payingSalary.value = false;
  }
}

function openMonthlyRecordEditModal(day) {
  editingDay.value = day;
  editAttendanceForm.value = {
    status: day.status === 'Absent' ? 'Absent' : 'Present',
    notes: day.notes || '',
  };
  editAttendanceModal.value = true;
}

async function saveMonthlyRecordEdit() {
  if (!editingDay.value || !selectedEmployeeId.value) return;
  savingAttendanceModal.value = true;
  try {
    await employeeService.updateSingleAttendance(
      editingDay.value.date,
      selectedEmployeeId.value,
      {
        status: editAttendanceForm.value.status,
        notes: editAttendanceForm.value.notes,
      }
    );
    snackbar.success(`Attendance updated in Master for ${formatDate(editingDay.value.date)}`);
    editAttendanceModal.value = false;
    await loadRecord();
  } catch (err) {
    snackbar.error(err.message || 'Failed to update attendance in Master');
  } finally {
    savingAttendanceModal.value = false;
  }
}

watch(
  () => [route.query.employeeId, route.query.month],
  ([empId, mStr]) => {
    let changed = false;
    if (typeof empId === 'string' && empId && employees.value.some((e) => e.id === empId) && selectedEmployeeId.value !== empId) {
      selectedEmployeeId.value = empId;
      changed = true;
    }
    if (typeof mStr === 'string' && /^\d{4}-\d{2}$/.test(mStr) && selectedMonth.value !== mStr) {
      selectedMonth.value = mStr;
      changed = true;
    }
    if (changed) {
      loadRecord();
    }
  }
);

onMounted(() => {
  loadEmployeesAndRecord();
});
</script>

<style scoped>
.record-metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1100px) {
  .record-metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .record-metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }
}

.record-split-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  min-height: 0;
  margin-left: -28px;
  margin-right: -28px;
  width: calc(100% + 56px);
  border-top: 1px solid #cbd5e1;
}

.record-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #ffffff;
}

.record-attendance-panel {
  border-right: 1px solid #cbd5e1;
}

.record-panel-scroll {
  flex: 1 1 0%;
  min-height: 220px;
  overflow-y: auto;
  overflow-x: auto;
}

@media (max-width: 1050px) {
  .record-split-grid {
    grid-template-columns: 1fr;
  }

  .record-attendance-panel {
    border-right: none;
    border-bottom: 1px solid #cbd5e1;
  }

  .record-panel-scroll {
    max-height: 360px;
  }
}

@media (max-width: 960px) {
  .record-split-grid {
    margin-left: -14px;
    margin-right: -14px;
    width: calc(100% + 28px);
  }
}
</style>

