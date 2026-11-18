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
          :disabled="isAllMarked || unmarkedCount === 0"
          @click="markAllPresent"
        >
          Mark All Present
        </v-btn>
        <v-btn
          color="error"
          variant="tonal"
          prepend-icon="mdi-close-octagon"
          class="text-capitalize rounded-lg font-weight-bold"
          :disabled="isAllMarked || unmarkedCount === 0"
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
          :disabled="isAllMarked || unmarkedCount === 0"
          @click="saveAttendance"
        >
          {{ isAllMarked ? 'Attendance Saved' : 'Save Attendance' }}
        </v-btn>
      </div>
    </div>

    <!-- Attendance Policy Info Banner -->
    <v-alert
      color="primary"
      variant="tonal"
      density="compact"
      icon="mdi-information"
      class="mb-3 rounded-xl text-caption"
    >
      <strong>Dairy Attendance Policy:</strong> Each employee is entitled to <strong>2 free absences per month</strong> without deduction. Deductions only apply on absences beyond 2: <code>Deductible Days = max(0, Absences - 2)</code>.
    </v-alert>

    <!-- Marked Attendance Lock Banner -->
    <v-alert
      v-if="markedCount > 0"
      color="info"
      variant="tonal"
      density="compact"
      icon="mdi-lock-check"
      class="mb-4 rounded-xl text-caption d-flex align-center flex-wrap gap-2"
    >
      <span>
        Attendance for <strong>{{ markedCount }} / {{ attendanceList.length }} employee{{ attendanceList.length === 1 ? '' : 's' }}</strong> is already marked and locked. To change previously recorded attendance, click <strong>Edit in Master</strong> on the row.
      </span>
      <v-btn
        variant="text"
        size="x-small"
        color="primary"
        class="font-weight-bold ms-auto text-capitalize"
        :to="{ path: '/employees', query: { tab: 'record', month: selectedDate.slice(0, 7) } }"
      >
        View Master Monthly Record →
      </v-btn>
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
          <v-chip v-if="markedCount > 0" color="info" size="small" variant="tonal" class="font-weight-bold">
            Marked: {{ markedCount }} / {{ attendanceList.length }}
          </v-chip>
          <template v-if="embedded">
            <v-btn
              color="success"
              variant="tonal"
              size="small"
              prepend-icon="mdi-check-all"
              class="text-capitalize rounded-lg font-weight-bold"
              :disabled="isAllMarked || unmarkedCount === 0"
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
              :disabled="isAllMarked || unmarkedCount === 0"
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
              :disabled="isAllMarked || unmarkedCount === 0"
              @click="saveAttendance"
            >
              {{ isAllMarked ? 'Attendance Saved' : 'Save Attendance' }}
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
              <th class="text-center" style="width: 250px;">Attendance Status</th>
              <th>Notes</th>
              <th class="text-end" style="width: 150px;">Actions</th>
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
                  :disabled="emp.isMarked"
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
                <div class="d-inline-flex align-center gap-1">
                  <v-btn-toggle
                    v-model="emp.status"
                    mandatory
                    density="compact"
                    rounded="lg"
                    class="border"
                    :disabled="emp.isMarked"
                  >
                    <v-btn
                      value="Present"
                      size="small"
                      class="text-capitalize px-3"
                      :color="emp.status === 'Present' ? 'success' : undefined"
                      :variant="emp.status === 'Present' ? 'flat' : 'text'"
                    >
                      <v-icon size="16" class="me-1">mdi-check</v-icon>
                      Present
                    </v-btn>
                    <v-btn
                      value="Absent"
                      size="small"
                      class="text-capitalize px-3"
                      :color="emp.status === 'Absent' ? 'error' : undefined"
                      :variant="emp.status === 'Absent' ? 'flat' : 'text'"
                    >
                      <v-icon size="16" class="me-1">mdi-close</v-icon>
                      Absent
                    </v-btn>
                  </v-btn-toggle>
                  <v-chip
                    v-if="emp.isMarked"
                    size="x-small"
                    color="grey-darken-1"
                    variant="tonal"
                    class="font-weight-bold ms-1"
                    title="Attendance is marked and locked here. Use Edit in Master to modify."
                  >
                    <v-icon start size="11">mdi-lock</v-icon>
                    Marked
                  </v-chip>
                </div>
              </td>
              <td>
                <v-text-field
                  v-model="emp.notes"
                  density="compact"
                  variant="outlined"
                  placeholder="Optional leave note"
                  hide-details
                  :disabled="emp.isMarked"
                  style="max-width: 250px;"
                />
              </td>
              <td class="text-end" style="white-space: nowrap;">
                <v-btn
                  v-if="emp.isMarked"
                  size="small"
                  variant="outlined"
                  color="primary"
                  class="text-capitalize font-weight-bold px-3 rounded-lg"
                  prepend-icon="mdi-pencil-lock"
                  title="Edit marked attendance in Master"
                  @click="openMasterEditDialog(emp)"
                >
                  Edit in Master
                </v-btn>
                <span v-else class="text-caption text-grey font-weight-medium">
                  Not Saved
                </span>
              </td>
            </tr>
            <tr v-if="attendanceList.length === 0">
              <td colspan="7" class="text-center pa-8">
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
              <td colspan="7" class="text-center py-6 text-grey">
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

    <!-- Master Attendance Edit Dialog -->
    <v-dialog v-model="masterEditDialogOpen" max-width="480" persistent>
      <v-card class="rounded-xl overflow-hidden" elevation="4">
        <div class="px-5 py-4 bg-primary text-white d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-2">
            <v-icon color="white" size="20">mdi-pencil-lock</v-icon>
            <div class="text-subtitle-1 font-weight-bold">Edit Attendance (Master)</div>
          </div>
          <v-btn icon size="small" variant="text" color="white" @click="masterEditDialogOpen = false">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-card-text class="pa-5 bg-white">
          <div class="pa-3 rounded-lg bg-slate-50 border mb-4 text-caption">
            <div class="d-flex justify-space-between mb-1">
              <span class="text-slate-500">Employee:</span>
              <strong class="text-slate-900">{{ editingStaff?.employeeName }}</strong>
            </div>
            <div class="d-flex justify-space-between mb-1">
              <span class="text-slate-500">Date:</span>
              <strong class="text-slate-900">{{ formatDate(selectedDate) }}</strong>
            </div>
            <div class="d-flex justify-space-between">
              <span class="text-slate-500">Role:</span>
              <span class="font-weight-medium text-slate-700">{{ editingStaff?.designation || 'Staff' }}</span>
            </div>
          </div>

          <label class="text-caption font-weight-bold text-slate-700 mb-1 d-block">
            Attendance Status *
          </label>
          <v-btn-toggle
            v-model="editForm.status"
            mandatory
            density="compact"
            rounded="lg"
            class="border w-100 mb-4"
          >
            <v-btn
              value="Present"
              class="flex-grow-1 text-capitalize font-weight-bold"
              :color="editForm.status === 'Present' ? 'success' : undefined"
              :variant="editForm.status === 'Present' ? 'flat' : 'text'"
            >
              <v-icon size="16" class="me-1">mdi-check</v-icon>
              Present
            </v-btn>
            <v-btn
              value="Absent"
              class="flex-grow-1 text-capitalize font-weight-bold"
              :color="editForm.status === 'Absent' ? 'error' : undefined"
              :variant="editForm.status === 'Absent' ? 'flat' : 'text'"
            >
              <v-icon size="16" class="me-1">mdi-close</v-icon>
              Absent
            </v-btn>
          </v-btn-toggle>

          <label class="text-caption font-weight-bold text-slate-700 mb-1 d-block">
            Leave / Attendance Note
          </label>
          <v-text-field
            v-model="editForm.notes"
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
            @click="masterEditDialogOpen = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="text-capitalize font-weight-bold px-4"
            :loading="savingMasterEdit"
            @click="saveMasterEdit"
          >
            Update Attendance
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { employeeService } from '@/services/employeeService';
import { useBusinessDayStore } from '@/stores/businessDay';
import { useSnackbarStore } from '@/stores/snackbar';
import { formatCurrency, formatDate, getOffsetDateString } from '@/utils/formatters';
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
  let count = 0;
  attendanceList.value.forEach(a => {
    if (selectedIds.value.includes(a.employeeId) && !a.isMarked) {
      a.status = 'Present';
      count++;
    }
  });
  if (count > 0) {
    snackbar.success(`Marked ${count} employee(s) as Present`);
  }
}

function markSelectedAbsent() {
  let count = 0;
  attendanceList.value.forEach(a => {
    if (selectedIds.value.includes(a.employeeId) && !a.isMarked) {
      a.status = 'Absent';
      count++;
    }
  });
  if (count > 0) {
    snackbar.info(`Marked ${count} employee(s) as Absent`);
  }
}

const presentCount = computed(() => {
  return attendanceList.value.filter((a) => a.status === 'Present').length;
});

const absentCount = computed(() => {
  return attendanceList.value.filter((a) => a.status === 'Absent').length;
});

const markedCount = computed(() => {
  return attendanceList.value.filter((a) => a.isMarked).length;
});

const unmarkedCount = computed(() => {
  return attendanceList.value.filter((a) => !a.isMarked).length;
});

const isAllMarked = computed(() => {
  return attendanceList.value.length > 0 && attendanceList.value.every((a) => a.isMarked);
});

// Master Edit Modal state
const masterEditDialogOpen = ref(false);
const editingStaff = ref(null);
const savingMasterEdit = ref(false);
const editForm = ref({
  status: 'Present',
  notes: '',
});

function openMasterEditDialog(emp) {
  editingStaff.value = emp;
  editForm.value = {
    status: emp.status || 'Present',
    notes: emp.notes || '',
  };
  masterEditDialogOpen.value = true;
}

async function saveMasterEdit() {
  if (!editingStaff.value) return;
  savingMasterEdit.value = true;
  try {
    await employeeService.updateSingleAttendance(
      selectedDate.value,
      editingStaff.value.employeeId,
      {
        status: editForm.value.status,
        notes: editForm.value.notes,
      }
    );
    snackbar.success(`Attendance updated in Master for ${editingStaff.value.employeeName}`);
    masterEditDialogOpen.value = false;
    await loadAttendance();
  } catch (err) {
    snackbar.error(err.message || 'Failed to update attendance in Master');
  } finally {
    savingMasterEdit.value = false;
  }
}

function markAllPresent() {
  let count = 0;
  attendanceList.value.forEach((a) => {
    if (!a.isMarked) {
      a.status = 'Present';
      count++;
    }
  });
  if (count > 0) {
    snackbar.success(`Marked ${count} unmarked employee(s) as Present`);
  }
}

function markAllAbsent() {
  let count = 0;
  attendanceList.value.forEach((a) => {
    if (!a.isMarked) {
      a.status = 'Absent';
      count++;
    }
  });
  if (count > 0) {
    snackbar.info(`Marked ${count} unmarked employee(s) as Absent`);
  }
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
        isMarked: !!saved,
        savedId: saved ? saved.id : null,
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
  const toSave = attendanceList.value.filter((a) => !a.isMarked);
  if (toSave.length === 0) {
    snackbar.info('All attendance records for this date are already saved and locked. Use Edit in Master to modify.');
    return;
  }

  saving.value = true;
  try {
    await employeeService.saveDailyAttendance(selectedDate.value, attendanceList.value);
    await businessDayStore.refreshBusinessDay();
    snackbar.success(`Attendance for ${selectedDate.value} saved successfully!`);
    await loadAttendance();
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

