<template>
  <div class="mobile-employees-page pb-16">
    <!-- 1. Sticky Mobile App Header -->
    <header class="mobile-app-header px-4 py-3 bg-white border-b sticky-top">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center gap-2">
          <div class="header-icon-box">
            <v-icon color="primary" size="20">mdi-account-group</v-icon>
          </div>
          <div>
            <h1 class="text-subtitle-1 font-weight-black text-slate-900 line-height-tight mb-0">
              Staff & Payroll
            </h1>
            <span class="text-caption text-grey-darken-1 font-weight-medium" style="font-size: 0.72rem !important;">
              Executive Staff Directory & Payroll
            </span>
          </div>
        </div>

        <v-btn
          icon
          size="small"
          variant="tonal"
          color="primary"
          :loading="loading"
          class="refresh-icon-btn"
          @click="refreshActiveTab"
        >
          <v-icon size="18">mdi-refresh</v-icon>
        </v-btn>
      </div>

      <!-- Quick Segmented Tab Navigation Bar -->
      <div class="mobile-nav-tabs-bar no-scrollbar mt-2">
        <button
          type="button"
          class="mobile-nav-tab"
          :class="{ active: currentTab === 'salaries' }"
          @click="switchTab('salaries')"
        >
          <v-icon size="15" class="tab-icon">mdi-currency-pkr</v-icon>
          <span>Salaries</span>
        </button>
        <button
          type="button"
          class="mobile-nav-tab"
          :class="{ active: currentTab === 'attendance' }"
          @click="switchTab('attendance')"
        >
          <v-icon size="15" class="tab-icon">mdi-calendar-check</v-icon>
          <span>Attendance</span>
        </button>
        <button
          type="button"
          class="mobile-nav-tab"
          :class="{ active: currentTab === 'advances' }"
          @click="switchTab('advances')"
        >
          <v-icon size="15" class="tab-icon">mdi-cash-fast</v-icon>
          <span>Advances</span>
        </button>
        <button
          type="button"
          class="mobile-nav-tab"
          :class="{ active: currentTab === 'directory' }"
          @click="switchTab('directory')"
        >
          <v-icon size="15" class="tab-icon">mdi-badge-account</v-icon>
          <span>Directory</span>
        </button>
      </div>
    </header>

    <div class="px-3 pt-3">
      <!-- ================= TAB 1: MONTHLY SALARIES ================= -->
      <div v-if="currentTab === 'salaries'">
        <!-- Month Stepper -->
        <div class="mobile-date-stepper d-flex align-center justify-space-between gap-1 pa-1 bg-slate-100 rounded-lg border mb-3">
          <button type="button" class="stepper-arrow-btn" @click="stepMonth(-1)">
            <v-icon size="20">mdi-chevron-left</v-icon>
          </button>
          <div class="d-flex align-center gap-2 flex-grow-1 justify-center cursor-pointer py-1" @click="monthPickerModal = true">
            <v-icon size="16" color="primary">mdi-calendar-month</v-icon>
            <span class="font-weight-black text-body-2 text-slate-800">{{ formatMonthTitle(selectedMonth) }}</span>
          </div>
          <button type="button" class="stepper-arrow-btn" @click="stepMonth(1)">
            <v-icon size="20">mdi-chevron-right</v-icon>
          </button>
        </div>

        <!-- 4 KPI Cards (2x2 Grid) -->
        <div class="mobile-kpi-grid mb-3">
          <div class="mobile-kpi-card milk-out-card pa-3 bg-white">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="kpi-label">Gross Payroll</span>
              <div class="kpi-icon-badge bg-blue-50 text-blue-600">
                <v-icon size="16">mdi-cash-multiple</v-icon>
              </div>
            </div>
            <div class="kpi-value text-blue-700">
              {{ formatCurrency(payrollTotals.gross) }}
            </div>
            <span class="kpi-subtitle">Base salary pool</span>
          </div>

          <div class="mobile-kpi-card income-card pa-3 bg-white">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="kpi-label">Net Payable</span>
              <div class="kpi-icon-badge bg-emerald-50 text-emerald-600">
                <v-icon size="16">mdi-cash-check</v-icon>
              </div>
            </div>
            <div class="kpi-value text-emerald-600">
              {{ formatCurrency(payrollTotals.net) }}
            </div>
            <span class="kpi-subtitle">After all deductions</span>
          </div>

          <div class="mobile-kpi-card expense-card pa-3 bg-white">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="kpi-label">Attendance Cuts</span>
              <div class="kpi-icon-badge bg-rose-50 text-rose-600">
                <v-icon size="16">mdi-account-minus</v-icon>
              </div>
            </div>
            <div class="kpi-value text-rose-600">
              {{ formatCurrency(payrollTotals.payCut) }}
            </div>
            <span class="kpi-subtitle">Absence penalties</span>
          </div>

          <div class="mobile-kpi-card arrears-card pa-3 bg-white">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="kpi-label">Advances Cleared</span>
              <div class="kpi-icon-badge bg-amber-50 text-amber-700">
                <v-icon size="16">mdi-hand-coin</v-icon>
              </div>
            </div>
            <div class="kpi-value text-orange-700">
              {{ formatCurrency(payrollTotals.advances) }}
            </div>
            <span class="kpi-subtitle">Deducted mid-month</span>
          </div>
        </div>

        <!-- Search Field for Salaries -->
        <v-text-field
          v-model="salarySearch"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search staff payroll by name..."
          variant="outlined"
          density="compact"
          hide-details
          class="bg-white rounded-lg mb-3"
          clearable
        />

        <!-- Salaries Card List -->
        <div class="mobile-section-header mb-2 d-flex align-center justify-space-between">
          <span class="text-caption font-weight-bold text-slate-800 text-uppercase">
            Staff Payroll Breakdown ({{ filteredSalaries.length }})
          </span>
        </div>

        <div v-if="filteredSalaries.length === 0" class="pa-6 bg-white rounded-xl border text-center text-grey-darken-1 shadow-xs">
          <v-icon size="40" color="grey-lighten-1" class="mb-2">mdi-cash-off</v-icon>
          <div class="font-weight-bold text-body-2 text-slate-800">No Payroll Records</div>
          <div class="text-caption text-grey">No salaries recorded for {{ formatMonthTitle(selectedMonth) }}.</div>
        </div>

        <div v-else class="d-flex flex-column gap-2-5">
          <div
            v-for="s in filteredSalaries"
            :key="s.employeeId"
            class="mobile-item-card bg-white border rounded-xl shadow-xs overflow-hidden"
          >
            <div class="pa-3 bg-slate-50 border-b d-flex align-center justify-space-between">
              <div>
                <span class="font-weight-black text-body-2 text-slate-900 d-block">{{ s.employeeName }}</span>
                <span class="text-caption text-grey font-weight-medium" style="font-size: 0.68rem !important;">
                  Role: {{ getEmployeeRole(s) }} • Phone: {{ s.phone || '-' }}
                </span>
              </div>
              <div class="text-end">
                <span class="text-caption text-grey d-block" style="font-size: 0.62rem !important;">NET DISBURSAL</span>
                <span class="font-weight-black text-body-1 text-success">{{ formatCurrency(s.netPayable || s.netSalary) }}</span>
              </div>
            </div>

            <div class="px-3 py-2 bg-white d-flex align-center justify-space-between text-caption">
              <div>
                <span class="text-grey d-block" style="font-size: 0.65rem !important;">BASE SALARY</span>
                <strong class="text-slate-800">{{ formatCurrency(s.baseSalary) }}</strong>
              </div>
              <div>
                <span class="text-grey d-block" style="font-size: 0.65rem !important;">ABSENCES</span>
                <strong :class="(s.deductibleDays || s.deductibleAbsents || 0) > 0 ? 'text-error font-weight-bold' : 'text-slate-700'">
                  {{ s.absents !== undefined ? s.absents : (s.totalAbsents || 0) }} ({{ s.deductibleDays || s.deductibleAbsents || 0 }} cut)
                </strong>
              </div>
              <div>
                <span class="text-grey d-block" style="font-size: 0.65rem !important;">ADVANCES</span>
                <strong class="text-orange-darken-4 font-weight-bold">{{ formatCurrency(s.advancesTotal || s.advancesAmount) }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= TAB 2: DAILY ATTENDANCE ================= -->
      <div v-else-if="currentTab === 'attendance'">
        <!-- Date Stepper -->
        <div class="mobile-date-stepper d-flex align-center justify-space-between gap-1 pa-1 bg-slate-100 rounded-lg border mb-3">
          <button type="button" class="stepper-arrow-btn" @click="stepDay(-1)">
            <v-icon size="20">mdi-chevron-left</v-icon>
          </button>
          <div class="d-flex align-center gap-2 flex-grow-1 justify-center cursor-pointer py-1" @click="attendanceDatePickerModal = true">
            <v-icon size="16" color="primary">mdi-calendar-check</v-icon>
            <span class="font-weight-black text-body-2 text-slate-800">{{ formatDate(attendanceDate) }}</span>
          </div>
          <button type="button" class="stepper-arrow-btn" @click="stepDay(1)">
            <v-icon size="20">mdi-chevron-right</v-icon>
          </button>
        </div>

        <!-- Attendance Stats (2x2 Grid) -->
        <div class="mobile-kpi-grid mb-3">
          <div class="mobile-kpi-card income-card pa-3 bg-white">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="kpi-label">Present Staff</span>
              <div class="kpi-icon-badge bg-emerald-50 text-emerald-600">
                <v-icon size="16">mdi-account-check</v-icon>
              </div>
            </div>
            <div class="kpi-value text-emerald-600">
              {{ attendancePresentCount }} <span class="kpi-unit">Present</span>
            </div>
            <span class="kpi-subtitle">On duty today</span>
          </div>

          <div class="mobile-kpi-card expense-card pa-3 bg-white">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="kpi-label">Absent Staff</span>
              <div class="kpi-icon-badge bg-rose-50 text-rose-600">
                <v-icon size="16">mdi-account-remove</v-icon>
              </div>
            </div>
            <div class="kpi-value text-rose-600">
              {{ attendanceAbsentCount }} <span class="kpi-unit">Absent</span>
            </div>
            <span class="kpi-subtitle">Out of office</span>
          </div>
        </div>

        <!-- Search Field for Attendance -->
        <v-text-field
          v-model="attendanceSearch"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search staff attendance by name..."
          variant="outlined"
          density="compact"
          hide-details
          class="bg-white rounded-lg mb-3"
          clearable
        />

        <!-- Attendance List -->
        <div class="mobile-section-header mb-2 d-flex align-center justify-space-between">
          <span class="text-caption font-weight-bold text-slate-800 text-uppercase">
            Staff Daily Presence ({{ filteredAttendance.length }})
          </span>
        </div>

        <div v-if="filteredAttendance.length === 0" class="pa-6 bg-white rounded-xl border text-center text-grey-darken-1 shadow-xs">
          <v-icon size="40" color="grey-lighten-1" class="mb-2">mdi-account-off-outline</v-icon>
          <div class="font-weight-bold text-body-2 text-slate-800">No Staff Found</div>
          <div class="text-caption text-grey">No attendance records match your search query.</div>
        </div>

        <div v-else class="d-flex flex-column gap-2">
          <div
            v-for="item in filteredAttendance"
            :key="item.employeeId"
            class="bg-white pa-3 rounded-xl border shadow-xs d-flex align-center justify-space-between"
          >
            <div class="d-flex align-center gap-2">
              <v-avatar size="32" :color="item.status === 'Present' ? 'success' : 'error'" variant="tonal">
                <v-icon size="16">{{ item.status === 'Present' ? 'mdi-account-check' : 'mdi-account-remove' }}</v-icon>
              </v-avatar>
              <div>
                <span class="font-weight-black text-body-2 text-slate-900 d-block">{{ item.employeeName }}</span>
                <span class="text-caption text-grey font-weight-medium" style="font-size: 0.68rem !important;">
                  {{ getEmployeeRole(item) }}
                </span>
              </div>
            </div>

            <v-chip
              size="small"
              :color="item.status === 'Present' ? 'success' : 'error'"
              variant="flat"
              class="font-weight-bold text-caption"
            >
              {{ item.status || 'Present' }}
            </v-chip>
          </div>
        </div>
      </div>

      <!-- ================= TAB 3: ADVANCES ================= -->
      <div v-else-if="currentTab === 'advances'">
        <!-- Month Stepper -->
        <div class="mobile-date-stepper d-flex align-center justify-space-between gap-1 pa-1 bg-slate-100 rounded-lg border mb-3">
          <button type="button" class="stepper-arrow-btn" @click="stepMonth(-1)">
            <v-icon size="20">mdi-chevron-left</v-icon>
          </button>
          <div class="d-flex align-center gap-2 flex-grow-1 justify-center cursor-pointer py-1" @click="monthPickerModal = true">
            <v-icon size="16" color="primary">mdi-calendar-month</v-icon>
            <span class="font-weight-black text-body-2 text-slate-800">{{ formatMonthTitle(selectedMonth) }}</span>
          </div>
          <button type="button" class="stepper-arrow-btn" @click="stepMonth(1)">
            <v-icon size="20">mdi-chevron-right</v-icon>
          </button>
        </div>

        <!-- 2 KPI Cards (2 in 1 row) -->
        <div class="mobile-kpi-grid mb-3">
          <div class="mobile-kpi-card arrears-card pa-3 bg-white">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="kpi-label">Total Advances</span>
              <div class="kpi-icon-badge bg-amber-50 text-amber-700">
                <v-icon size="16">mdi-cash-minus</v-icon>
              </div>
            </div>
            <div class="kpi-value text-orange-700">
              {{ formatCurrency(totalAdvancesAmount) }}
            </div>
            <span class="kpi-subtitle">This month</span>
          </div>

          <div class="mobile-kpi-card milk-out-card pa-3 bg-white">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="kpi-label">Advances Count</span>
              <div class="kpi-icon-badge bg-blue-50 text-blue-600">
                <v-icon size="16">mdi-format-list-numbered</v-icon>
              </div>
            </div>
            <div class="kpi-value text-blue-700">
              {{ advancesList.length }} <span class="kpi-unit">Trans</span>
            </div>
            <span class="kpi-subtitle">Disbursements</span>
          </div>
        </div>

        <!-- Search Field for Advances -->
        <v-text-field
          v-model="advancesSearch"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search advances by employee..."
          variant="outlined"
          density="compact"
          hide-details
          class="bg-white rounded-lg mb-3"
          clearable
        />

        <!-- Advances List -->
        <div class="mobile-section-header mb-2 d-flex align-center justify-space-between">
          <span class="text-caption font-weight-bold text-slate-800 text-uppercase">
            Advances Ledger ({{ filteredAdvances.length }})
          </span>
        </div>

        <div v-if="filteredAdvances.length === 0" class="pa-6 bg-white rounded-xl border text-center text-grey-darken-1 shadow-xs">
          <v-icon size="40" color="grey-lighten-1" class="mb-2">mdi-cash-remove</v-icon>
          <div class="font-weight-bold text-body-2 text-slate-800">No Advances Found</div>
          <div class="text-caption text-grey">No advances match your search query for {{ formatMonthTitle(selectedMonth) }}.</div>
        </div>

        <div v-else class="d-flex flex-column gap-2">
          <div
            v-for="a in filteredAdvances"
            :key="a.id"
            class="bg-white pa-3 rounded-xl border shadow-xs d-flex align-center justify-space-between"
          >
            <div>
              <span class="font-weight-black text-body-2 text-slate-900 d-block">{{ a.employeeName }}</span>
              <span class="text-caption text-grey font-weight-medium" style="font-size: 0.68rem !important;">
                {{ formatDate(a.date) }} • {{ a.notes || 'Salary Advance' }}
              </span>
            </div>

            <span class="text-subtitle-1 font-weight-black text-orange-darken-4">
              {{ formatCurrency(a.amount) }}
            </span>
          </div>
        </div>
      </div>

      <!-- ================= TAB 4: STAFF DIRECTORY ================= -->
      <div v-else-if="currentTab === 'directory'">
        <v-text-field
          v-model="directorySearch"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search staff by name or phone..."
          variant="outlined"
          density="compact"
          hide-details
          class="bg-white rounded-lg mb-3"
          clearable
        />

        <div class="mobile-section-header mb-2 d-flex align-center justify-space-between">
          <span class="text-caption font-weight-bold text-slate-800 text-uppercase">
            Staff Members ({{ filteredDirectory.length }})
          </span>
        </div>

        <div class="d-flex flex-column gap-2-5">
          <div
            v-for="emp in filteredDirectory"
            :key="emp.id"
            class="bg-white pa-3 rounded-xl border shadow-xs"
          >
            <div class="d-flex align-center justify-space-between mb-1-5">
              <div>
                <span class="font-weight-black text-body-2 text-slate-900 d-block">{{ emp.name }}</span>
                <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold mt-0-5">
                  {{ getEmployeeRole(emp) }}
                </v-chip>
              </div>

              <div class="text-end">
                <span class="text-caption text-grey d-block" style="font-size: 0.65rem !important;">FIXED SALARY</span>
                <strong class="text-primary font-weight-black">{{ formatCurrency(emp.salary) }}</strong>
              </div>
            </div>

            <div class="pt-2 border-t d-flex align-center justify-space-between text-caption">
              <a v-if="emp.phone" :href="'tel:' + emp.phone" class="text-decoration-none text-primary font-weight-bold d-flex align-center gap-1">
                <v-icon size="14">mdi-phone</v-icon>
                {{ emp.phone }}
              </a>
              <span v-else class="text-grey">No phone</span>

              <v-chip size="x-small" color="success" variant="flat" class="font-weight-bold">
                {{ emp.status || 'Active' }}
              </v-chip>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Month Picker Dialog -->
    <v-dialog v-model="monthPickerModal" max-width="320">
      <v-card class="pa-3 rounded-xl">
        <AppMonthPicker
          v-model="selectedMonth"
          label="Select Month"
          hide-details
          @change="onMonthChanged"
        />
        <v-card-actions class="px-0 pt-2 justify-end">
          <v-btn variant="text" size="small" color="primary" class="text-capitalize font-weight-bold" @click="monthPickerModal = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Attendance Date Picker Dialog -->
    <v-dialog v-model="attendanceDatePickerModal" max-width="320">
      <v-card class="pa-3 rounded-xl">
        <AppDatePicker
          v-model="attendanceDate"
          label="Select Attendance Date"
          hide-details
          @change="onAttendanceDateChanged"
        />
        <v-card-actions class="px-0 pt-2 justify-end">
          <v-btn variant="text" size="small" color="primary" class="text-capitalize font-weight-bold" @click="attendanceDatePickerModal = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { mastersService } from '@/services/mastersService';
import { employeeService } from '@/services/employeeService';
import { useBusinessDayStore } from '@/stores/businessDay';
import { formatCurrency, formatDate, getCurrentMonthString, getOffsetDateString } from '@/utils/formatters';
import AppDatePicker from '@/components/common/AppDatePicker.vue';
import AppMonthPicker from '@/components/common/AppMonthPicker.vue';

const businessDayStore = useBusinessDayStore();

const loading = ref(false);
const currentTab = ref('salaries');
const monthPickerModal = ref(false);
const attendanceDatePickerModal = ref(false);

const selectedMonth = ref(getCurrentMonthString());
const attendanceDate = ref(businessDayStore.activeBusinessDate);

const salariesList = ref([]);
const attendanceList = ref([]);
const advancesList = ref([]);
const employeesDirectory = ref([]);
const directorySearch = ref('');
function getEmployeeRole(empOrItem) {
  const val = empOrItem?.designation || empOrItem?.role;
  if (!val || val === 'Staff' || val === 'Staff Worker') {
    return 'Driver';
  }
  return val;
}

const salarySearch = ref('');
const attendanceSearch = ref('');
const advancesSearch = ref('');

const filteredSalaries = computed(() => {
  if (!salarySearch.value || !salarySearch.value.trim()) return salariesList.value;
  const q = salarySearch.value.toLowerCase().trim();
  return salariesList.value.filter(s =>
    (s.employeeName || '').toLowerCase().includes(q) ||
    getEmployeeRole(s).toLowerCase().includes(q)
  );
});

const filteredAttendance = computed(() => {
  if (!attendanceSearch.value || !attendanceSearch.value.trim()) return attendanceList.value;
  const q = attendanceSearch.value.toLowerCase().trim();
  return attendanceList.value.filter(a =>
    (a.employeeName || '').toLowerCase().includes(q) ||
    getEmployeeRole(a).toLowerCase().includes(q)
  );
});

const filteredAdvances = computed(() => {
  if (!advancesSearch.value || !advancesSearch.value.trim()) return advancesList.value;
  const q = advancesSearch.value.toLowerCase().trim();
  return advancesList.value.filter(a =>
    (a.employeeName || '').toLowerCase().includes(q) ||
    (a.notes || '').toLowerCase().includes(q)
  );
});

const payrollTotals = computed(() => {
  let gross = 0;
  let payCut = 0;
  let advances = 0;
  let net = 0;

  for (const s of salariesList.value) {
    gross += Number(s.baseSalary) || 0;
    payCut += Number(s.payCut || s.absentDeduction) || 0;
    advances += Number(s.advancesTotal || s.advancesAmount) || 0;
    net += Number(s.netPayable || s.netSalary) || 0;
  }

  return { gross, payCut, advances, net };
});

const attendancePresentCount = computed(() => {
  return attendanceList.value.filter(a => a.status === 'Present').length;
});

const attendanceAbsentCount = computed(() => {
  return attendanceList.value.filter(a => a.status === 'Absent').length;
});

const totalAdvancesAmount = computed(() => {
  return advancesList.value.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
});

const filteredDirectory = computed(() => {
  if (!directorySearch.value) return employeesDirectory.value;
  const q = directorySearch.value.toLowerCase().trim();
  return employeesDirectory.value.filter(e => 
    (e.name || '').toLowerCase().includes(q) ||
    (e.phone || '').toLowerCase().includes(q) ||
    getEmployeeRole(e).toLowerCase().includes(q)
  );
});

function formatMonthTitle(mStr) {
  if (!mStr) return '';
  const [y, m] = mStr.split('-');
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${monthNames[Number(m) - 1]} ${y}`;
}

function stepMonth(offset) {
  const [y, m] = selectedMonth.value.split('-').map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  selectedMonth.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  loadSalaries();
  loadAdvances();
}

function stepDay(offset) {
  attendanceDate.value = getOffsetDateString(attendanceDate.value, offset);
  loadAttendance();
}

function onMonthChanged() {
  monthPickerModal.value = false;
  loadSalaries();
  loadAdvances();
}

function onAttendanceDateChanged() {
  attendanceDatePickerModal.value = false;
  loadAttendance();
}

function switchTab(tab) {
  currentTab.value = tab;
  refreshActiveTab();
}

async function loadSalaries() {
  loading.value = true;
  try {
    const res = await employeeService.computeMonthlySalaries(selectedMonth.value);
    salariesList.value = res || [];
  } catch (err) {
    console.warn('Failed to load salaries on mobile:', err);
  } finally {
    loading.value = false;
  }
}

async function loadAttendance() {
  loading.value = true;
  try {
    const records = await employeeService.getAttendanceByDate(attendanceDate.value);
    const emps = await employeeService.getEmployees();
    attendanceList.value = emps.map(emp => {
      const rec = records.find(r => r.employeeId === emp.id);
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        designation: emp.designation,
        role: getEmployeeRole(emp),
        status: rec?.status || 'Present',
      };
    });
  } catch (err) {
    console.warn('Failed to load attendance on mobile:', err);
  } finally {
    loading.value = false;
  }
}

async function loadAdvances() {
  loading.value = true;
  try {
    advancesList.value = await employeeService.getAdvances(selectedMonth.value);
  } catch (err) {
    console.warn('Failed to load advances on mobile:', err);
  } finally {
    loading.value = false;
  }
}

async function loadDirectory() {
  loading.value = true;
  try {
    employeesDirectory.value = await employeeService.getEmployees();
  } catch (err) {
    console.warn('Failed to load directory on mobile:', err);
  } finally {
    loading.value = false;
  }
}

function refreshActiveTab() {
  if (currentTab.value === 'salaries') loadSalaries();
  else if (currentTab.value === 'attendance') loadAttendance();
  else if (currentTab.value === 'advances') loadAdvances();
  else if (currentTab.value === 'directory') loadDirectory();
}

onMounted(async () => {
  await businessDayStore.refreshBusinessDay();
  if (businessDayStore.activeBusinessDate) {
    attendanceDate.value = businessDayStore.activeBusinessDate;
  }
  await Promise.all([
    loadSalaries(),
    loadAttendance(),
    loadAdvances(),
    loadDirectory(),
  ]);
});
</script>

<style scoped>
.mobile-employees-page {
  background-color: #f8fafc;
  min-height: 100vh;
}

.sticky-top {
  position: sticky;
  top: 56px;
  z-index: 30;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: #e0f2fe;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-icon-btn {
  width: 32px;
  height: 32px;
}

.mobile-nav-tabs-bar {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 4px;
  gap: 3px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.mobile-nav-tab {
  flex: 1 1 0;
  min-width: max-content;
  padding: 7px 10px;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.mobile-nav-tab .tab-icon {
  opacity: 0.85;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.mobile-nav-tab:hover {
  color: #1e293b;
}

.mobile-nav-tab.active {
  background: #063F78;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(6, 63, 120, 0.28);
}

.mobile-nav-tab.active .tab-icon {
  opacity: 1;
}

.no-scrollbar::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.no-scrollbar {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}

.mobile-nav-pill {
  padding: 5px 12px;
  border-radius: 9999px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 0.74rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: all 0.15s ease;
}

.mobile-nav-pill.active {
  background: #063F78;
  color: #ffffff;
  border-color: #063F78;
}

.mobile-kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 10px !important;
}

.mobile-kpi-card {
  background: #ffffff;
  border: 1px solid #e2e8f0 !important;
  border-radius: 14px !important;
}

.income-card { border-top: 3px solid #10b981 !important; }
.cash-card { border-top: 3px solid #0d9488 !important; }
.arrears-card { border-top: 3px solid #f59e0b !important; }
.milk-in-card { border-top: 3px solid #0284c7 !important; }
.milk-out-card { border-top: 3px solid #3b82f6 !important; }
.expense-card { border-top: 3px solid #ef4444 !important; }

.stepper-arrow-btn {
  width: 34px;
  height: 34px;
  border-radius: 6px;
  border: none;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.mobile-item-card {
  border: 1px solid #e2e8f0 !important;
  border-radius: 12px !important;
}
</style>
