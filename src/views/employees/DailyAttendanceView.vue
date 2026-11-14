<template>
  <div :class="embedded ? 'embedded-master-view' : 'page-container table-page'">
    <div v-if="!embedded" class="page-header">
      <div>
        <h1 class="page-header-title">Daily Bulk Attendance</h1>
        <p class="page-header-subtitle">Record daily presence and absences for dairy farm staff (2 free absences/month rule)</p>
      </div>

      <div class="d-flex align-center flex-wrap" style="gap: 12px;">
        <v-btn
          color="success"
          variant="tonal"
          prepend-icon="mdi-check-all"
          class="text-capitalize rounded-lg font-weight-bold"
          @click="markAllPresent"
        >
          Mark All Present
        </v-btn>
        <v-btn
          color="error"
          variant="tonal"
          prepend-icon="mdi-close-octagon"
          class="text-capitalize rounded-lg font-weight-bold"
          @click="markAllAbsent"
        >
          Mark All Absent
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-content-save"
          class="text-capitalize font-weight-bold px-6"
          :loading="saving"
          @click="saveAttendance"
        >
          Save Attendance
        </v-btn>
      </div>
    </div>

    <!-- Attendance Policy Info Banner -->
    <v-alert
      color="primary"
      variant="tonal"
      density="compact"
      icon="mdi-information"
      class="mb-4 rounded-xl text-caption"
    >
      <strong>Dairy Attendance Policy:</strong> Each employee is entitled to <strong>2 free absences per month</strong> without deduction. Deductions only apply on absences beyond 2: <code>Deductible Days = max(0, Absences - 2)</code>.
    </v-alert>

    <!-- Table Card -->
    <v-card class="modern-card pa-4 table-card-full" elevation="0">
      <div class="d-flex align-center justify-space-between mb-4 flex-wrap" style="gap: 16px;">
        <div class="d-flex align-center flex-wrap" style="gap: 12px;">
          <div style="min-width: 260px; width: 280px;">
            <AppDatePicker
              v-model="selectedDate"
              label="Attendance Date"
              hide-details
              @change="loadAttendance"
            />
          </div>
        </div>

        <div class="d-flex align-center flex-wrap" style="gap: 12px;">
          <v-text-field
            v-model="searchStaff"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search staff..."
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 200px;"
            clearable
          />
          <v-chip color="success" size="small" variant="tonal" class="font-weight-bold">
            Present: {{ presentCount }}
          </v-chip>
          <v-chip color="error" size="small" variant="tonal" class="font-weight-bold">
            Absent: {{ absentCount }}
          </v-chip>
          <template v-if="embedded">
            <v-btn
              color="success"
              variant="tonal"
              size="small"
              prepend-icon="mdi-check-all"
              class="text-capitalize rounded-lg font-weight-bold"
              @click="markAllPresent"
            >
              Mark All Present
            </v-btn>
            <v-btn
              color="error"
              variant="tonal"
              size="small"
              prepend-icon="mdi-close-octagon"
              class="text-capitalize rounded-lg font-weight-bold"
              @click="markAllAbsent"
            >
              Mark All Absent
            </v-btn>
            <v-btn
              color="primary"
              variant="flat"
              size="small"
              prepend-icon="mdi-content-save"
              class="text-capitalize font-weight-bold px-5"
              :loading="saving"
              @click="saveAttendance"
            >
              Save Attendance
            </v-btn>
          </template>
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      <BulkActionsBar
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
            prepend-icon="mdi-check"
            @click="markSelectedPresent"
          >
            Mark Present
          </v-btn>
          <v-btn
            size="small"
            variant="flat"
            color="error"
            class="text-capitalize font-weight-bold"
            prepend-icon="mdi-close"
            @click="markSelectedAbsent"
          >
            Mark Absent
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
              <th>Employee Name</th>
              <th>Role</th>
              <th class="text-end">Monthly Salary</th>
              <th class="text-center" style="width: 240px;">Attendance Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="emp in paginatedAttendanceList"
              :key="emp.employeeId"
              :class="{ 'selected-row': selectedIds.includes(emp.employeeId) }"
            >
              <td class="table-checkbox-col">
                <v-checkbox-btn
                  :model-value="selectedIds.includes(emp.employeeId)"
                  color="primary"
                  density="compact"
                  @update:model-value="toggleSelectItem(emp.employeeId)"
                  @click.stop
                />
              </td>
              <td class="font-weight-bold text-dark">
                <v-icon size="18" color="primary" class="me-1">mdi-account</v-icon>
                {{ emp.employeeName }}
              </td>
              <td>
                <span class="erp-tag erp-tag-blue">
                  {{ emp.designation || 'Driver' }}
                </span>
              </td>
              <td class="text-end font-weight-medium tabular-nums">{{ formatCurrency(emp.salary) }}</td>
              <td class="text-center">
                <v-btn-toggle
                  v-model="emp.status"
                  mandatory
                  density="compact"
                  rounded="lg"
                  class="border"
                >
                  <v-btn
                    value="Present"
                    size="small"
                    class="text-capitalize px-4"
                    :color="emp.status === 'Present' ? 'success' : undefined"
                    :variant="emp.status === 'Present' ? 'flat' : 'text'"
                  >
                    <v-icon size="16" class="me-1">mdi-check</v-icon>
                    Present
                  </v-btn>
                  <v-btn
                    value="Absent"
                    size="small"
                    class="text-capitalize px-4"
                    :color="emp.status === 'Absent' ? 'error' : undefined"
                    :variant="emp.status === 'Absent' ? 'flat' : 'text'"
                  >
                    <v-icon size="16" class="me-1">mdi-close</v-icon>
                    Absent
                  </v-btn>
                </v-btn-toggle>
              </td>
              <td>
                <v-text-field
                  v-model="emp.notes"
                  density="compact"
                  variant="outlined"
                  placeholder="Optional leave note"
                  hide-details
                  style="max-width: 250px;"
                />
              </td>
            </tr>
            <tr v-if="attendanceList.length === 0">
              <td colspan="6" class="text-center pa-8">
                <div class="empty-state-box">
                  <v-icon class="empty-state-icon">mdi-account-off-outline</v-icon>
                  <div class="empty-state-title">No Active Employees Found</div>
                  <div class="empty-state-subtitle">Register farm staff in the Staff Directory to start recording attendance.</div>
                  <v-btn color="primary" variant="flat" size="small" class="mt-2 text-capitalize font-weight-bold px-5" prepend-icon="mdi-plus" @click="$router.push({ path: '/employees', query: { tab: 'directory' } })">
                    Go to Staff Directory
                  </v-btn>
                </div>
              </td>
            </tr>
            <tr v-else-if="displayedAttendanceList.length === 0">
              <td colspan="6" class="text-center py-6 text-grey">
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
        :total-items="displayedAttendanceList.length"
      />
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { employeeService } from '@/services/employeeService';
import { useBusinessDayStore } from '@/stores/businessDay';
import { useSnackbarStore } from '@/stores/snackbar';
import { formatCurrency, getOffsetDateString } from '@/utils/formatters';
import AppDatePicker from '@/components/common/AppDatePicker.vue';
import AppPagination from '@/components/common/AppPagination.vue';
import BulkActionsBar from '@/components/common/BulkActionsBar.vue';

defineProps({
  embedded: { type: Boolean, default: false },
});

const businessDayStore = useBusinessDayStore();
const snackbar = useSnackbarStore();

const selectedDate = ref(businessDayStore.activeBusinessDate);
const employees = ref([]);
const attendanceList = ref([]);
const saving = ref(false);
const searchStaff = ref('');
const page = ref(1);
const itemsPerPage = ref(10);
const selectedIds = ref([]);

const displayedAttendanceList = computed(() => {
  if (!searchStaff.value) return attendanceList.value;
  const q = searchStaff.value.toLowerCase().trim();
  return attendanceList.value.filter(
    (a) =>
      (a.employeeName && a.employeeName.toLowerCase().includes(q)) ||
      (a.designation && a.designation.toLowerCase().includes(q))
  );
});

const paginatedAttendanceList = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  return displayedAttendanceList.value.slice(start, start + itemsPerPage.value);
});

const isAllSelected = computed(() => {
  return paginatedAttendanceList.value.length > 0 && paginatedAttendanceList.value.every(a => selectedIds.value.includes(a.employeeId));
});

const isSomeSelected = computed(() => {
  return selectedIds.value.length > 0 && !isAllSelected.value;
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = paginatedAttendanceList.value.map(a => a.employeeId);
  }
}

watch(searchStaff, () => {
  page.value = 1;
  selectedIds.value = [];
});

function toggleSelectItem(id) {
  const idx = selectedIds.value.indexOf(id);
  if (idx > -1) {
    selectedIds.value.splice(idx, 1);
  } else {
    selectedIds.value.push(id);
  }
}

function markSelectedPresent() {
  attendanceList.value.forEach(a => {
    if (selectedIds.value.includes(a.employeeId)) {
      a.status = 'Present';
    }
  });
  snackbar.success(`Marked ${selectedIds.value.length} employee(s) as Present`);
}

function markSelectedAbsent() {
  attendanceList.value.forEach(a => {
    if (selectedIds.value.includes(a.employeeId)) {
      a.status = 'Absent';
    }
  });
  snackbar.info(`Marked ${selectedIds.value.length} employee(s) as Absent`);
}

const presentCount = computed(() => {
  return attendanceList.value.filter((a) => a.status === 'Present').length;
});

const absentCount = computed(() => {
  return attendanceList.value.filter((a) => a.status === 'Absent').length;
});

function markAllPresent() {
  attendanceList.value.forEach((a) => {
    a.status = 'Present';
  });
}

function markAllAbsent() {
  attendanceList.value.forEach((a) => {
    a.status = 'Absent';
  });
}

function setToday() {
  if (businessDayStore.isLockedOnPreviousDay) {
    snackbar.warning(businessDayStore.lockReason);
  }
  selectedDate.value = businessDayStore.activeBusinessDate;
  loadAttendance();
}

function setYesterday() {
  selectedDate.value = getOffsetDateString(businessDayStore.activeBusinessDate, -1);
  loadAttendance();
}

async function loadAttendance() {
  try {
    selectedIds.value = [];
    page.value = 1;
    const [allEmployees, savedAttendance] = await Promise.all([
      employeeService.getEmployees(),
      employeeService.getAttendanceByDate(selectedDate.value),
    ]);

    const activeOnly = allEmployees.filter((e) => e.active !== false);
    employees.value = activeOnly;

    const savedMap = new Map(savedAttendance.map((a) => [a.employeeId, a]));

    attendanceList.value = activeOnly.map((emp) => {
      const saved = savedMap.get(emp.id);
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        designation: emp.designation,
        salary: emp.salary,
        status: saved ? saved.status : 'Present',
        notes: saved ? saved.notes : '',
      };
    });
  } catch (err) {
    snackbar.error('Failed to load attendance');
  }
}

async function saveAttendance() {
  await businessDayStore.refreshBusinessDay();
  const dateCheck = businessDayStore.validateOperationDate(selectedDate.value);
  if (!dateCheck.valid) {
    snackbar.error(dateCheck.message);
    return;
  }

  if (attendanceList.value.length === 0) return;
  saving.value = true;
  try {
    await employeeService.saveDailyAttendance(selectedDate.value, attendanceList.value);
    await businessDayStore.refreshBusinessDay();
    snackbar.success(`Attendance for ${selectedDate.value} saved successfully!`);
  } catch (err) {
    snackbar.error(err.message || 'Failed to save attendance');
  } finally {
    saving.value = false;
  }
}

watch(
  () => businessDayStore.activeBusinessDate,
  (newDate, oldDate) => {
    if (selectedDate.value === oldDate || (businessDayStore.isLockedOnPreviousDay && selectedDate.value > newDate)) {
      selectedDate.value = newDate;
      loadAttendance();
    }
  }
);

onMounted(async () => {
  await businessDayStore.refreshBusinessDay();
  selectedDate.value = businessDayStore.activeBusinessDate;
  await loadAttendance();
});
</script>

