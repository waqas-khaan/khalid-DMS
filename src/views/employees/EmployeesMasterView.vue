<template>
  <div :class="embedded ? 'embedded-master-view' : 'page-container table-page'">
    <div v-if="!embedded" class="page-header">
      <div>
        <h1 class="page-header-title">Employee Staff Master</h1>
        <p class="page-header-subtitle">Manage dairy workers, drivers, farm caretakers, and monthly salaries</p>
      </div>

      <v-btn
        v-if="!readonly"
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        class="text-capitalize font-weight-bold px-5"
        @click="openDialog()"
      >
        Add Employee
      </v-btn>
    </div>

    <!-- Table Card -->
    <v-card class="modern-card pa-4 table-card-full" elevation="0">
      <div class="d-flex align-center justify-space-between mb-3 flex-wrap" style="gap: 12px;">
        <div class="d-flex align-center flex-wrap" style="gap: 12px;">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Search employees..."
            variant="outlined"
            density="compact"
            hide-details
            style="min-width: 220px; width: 260px;"
            clearable
          />
          <v-btn-toggle
            v-model="roleFilter"
            mandatory
            density="compact"
            color="primary"
            variant="outlined"
            rounded="lg"
          >
            <v-btn value="all" size="small" class="text-capitalize">All</v-btn>
            <v-btn value="driver" size="small" class="text-capitalize">Drivers</v-btn>
            <v-btn value="calander" size="small" class="text-capitalize">Calanders</v-btn>
            <v-btn value="other" size="small" class="text-capitalize">Other Staff</v-btn>
          </v-btn-toggle>
        </div>
        <div class="d-flex align-center flex-wrap" style="gap: 10px;">
          <v-chip color="primary" variant="tonal" size="small">
            Total: {{ filteredEmployees.length }} Employees
          </v-chip>
          <v-btn
            v-if="!readonly && embedded"
            color="primary"
            variant="flat"
            size="small"
            prepend-icon="mdi-plus"
            class="text-capitalize font-weight-bold px-4"
            @click="openDialog()"
          >
            Add Employee
          </v-btn>
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      <BulkActionsBar
        v-if="!readonly && authStore.isAdmin"
        :count="selectedIds.length"
        item-label="staff member"
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
              <th v-if="!readonly && authStore.isAdmin" class="table-checkbox-col">
                <v-checkbox-btn
                  :model-value="isAllSelected"
                  :indeterminate="isSomeSelected"
                  color="primary"
                  density="compact"
                  @update:model-value="toggleSelectAll"
                />
              </th>
              <th>Employee Name</th>
              <th>Designation</th>
              <th>Phone</th>
              <th class="text-end">Monthly Salary</th>
              <th>Joining Date</th>
              <th>Status</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in paginatedEmployees"
              :key="item.id"
              :class="{ 'selected-row': !readonly && selectedIds.includes(item.id) }"
            >
              <td v-if="!readonly && authStore.isAdmin" class="table-checkbox-col">
                <v-checkbox-btn
                  :model-value="selectedIds.includes(item.id)"
                  color="primary"
                  density="compact"
                  @update:model-value="toggleSelectItem(item.id)"
                  @click.stop
                />
              </td>
              <td class="font-weight-bold text-primary">
                <v-icon size="18" class="me-1">mdi-badge-account-horizontal</v-icon>
                {{ item.name }}
              </td>
              <td>
                <span class="erp-tag" :class="getDesignationTagClass(item.designation)">
                  {{ item.designation || 'Worker' }}
                </span>
              </td>
              <td>
                <a v-if="item.phone" :href="'tel:' + item.phone" class="d-flex align-center text-caption text-decoration-none text-primary">
                  <v-icon size="14" color="primary" class="me-1">mdi-phone</v-icon>
                  {{ item.phone }}
                </a>
                <span v-else class="text-grey">-</span>
              </td>
              <td class="text-end font-weight-bold text-success tabular-nums">
                {{ formatCurrency(item.salary) }}
              </td>
              <td class="text-caption text-grey-darken-1">{{ formatDate(item.joinDate) }}</td>
              <td>
                <span
                  class="erp-tag"
                  :class="getStatusTagClass(item)"
                >
                  {{ getStatusLabel(item) }}
                </span>
              </td>
              <td class="text-end" style="white-space: nowrap;">
                <v-btn
                  icon="mdi-file-account-outline"
                  size="small"
                  variant="text"
                  color="info"
                  title="Monthly Record (Attendance, Advances & Salary)"
                  :to="{ path: '/employees', query: { tab: 'record', employeeId: item.id } }"
                />
                <template v-if="!readonly && authStore.isAdmin">
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    color="primary"
                    title="Edit Employee"
                    @click="openDialog(item)"
                  />
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    title="Delete Employee"
                    @click="confirmDelete(item)"
                  />
                </template>
              </td>
            </tr>
            <tr v-if="filteredEmployees.length === 0">
              <td :colspan="!readonly && authStore.isAdmin ? 8 : 7" class="text-center pa-8">
                <div class="empty-state-box">
                  <v-icon class="empty-state-icon">mdi-account-multiple-remove-outline</v-icon>
                  <div class="empty-state-title">No Staff Members Found</div>
                  <div class="empty-state-subtitle">
                    {{ readonly ? 'Add staff, drivers, and calanders in Masters to display them here.' : 'Register farm staff, drivers, calanders, and caretakers to use across dispatch, attendance, and payroll.' }}
                  </div>
                  <v-btn
                    v-if="readonly && authStore.isAdmin"
                    color="primary"
                    variant="flat"
                    size="small"
                    class="mt-2 text-capitalize font-weight-bold"
                    prepend-icon="mdi-database-edit"
                    :to="{ path: '/masters', query: { tab: 'employees' } }"
                  >
                    Go to Masters → Employees
                  </v-btn>
                  <v-btn
                    v-else
                    color="primary"
                    variant="flat"
                    size="small"
                    class="mt-2 text-capitalize font-weight-bold"
                    prepend-icon="mdi-plus"
                    @click="openDialog()"
                  >
                    Add Employee
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
        :total-items="filteredEmployees.length"
      />
    </v-card>

    <!-- Create / Edit Dialog -->
    <v-dialog v-if="!readonly" v-model="dialog" max-width="500">
      <v-card class="rounded-xl pa-3">
        <v-card-title class="font-weight-bold pt-3 px-4">
          {{ isEdit ? 'Edit Employee' : 'Add New Employee' }}
        </v-card-title>
        <v-card-text class="px-4 py-2">
          <v-form ref="formRef" v-model="formValid">
            <v-text-field
              v-model="form.name"
              label="Full Name *"
              placeholder="e.g. Ahmad Ali"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Name is required']"
              class="mb-3"
            />
            <v-select
              v-model="form.designation"
              :items="designationOptions"
              label="Role / Designation"
              placeholder="Select role or Custom"
              hint="Drivers and Calanders automatically sync to Milk Dispatch & Staff Directory"
              persistent-hint
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-text-field
              v-if="form.designation === 'Custom'"
              v-model="customDesignation"
              label="Custom Role / Designation *"
              placeholder="e.g. Accountant, Security Guard, Feeder"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v && !!v.trim() || 'Custom role is required']"
              autofocus
              class="mb-3"
            />
            <v-text-field
              v-model="form.phone"
              label="Phone Number"
              placeholder="e.g. 0311-1234567"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-text-field
              v-if="isDriverFormRole"
              v-model="form.licenseNumber"
              label="Driving License Number"
              placeholder="e.g. PK-NWFP-9921"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-text-field
              v-model.number="form.salary"
              type="number"
              label="Monthly Fixed Salary (Rs.) *"
              placeholder="35000"
              prepend-inner-icon="mdi-currency-pkr"
              variant="outlined"
              density="comfortable"
              :rules="[v => v !== undefined && v >= 0 || 'Salary is required']"
              class="mb-3"
            />
            <AppDatePicker
              v-model="form.joinDate"
              label="Joining Date"
              :enforce-business-day="false"
              density="comfortable"
              class="mb-3"
            />
            <v-select
              v-model="form.status"
              :items="['Active', 'On Leave', 'Inactive']"
              label="Status"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-textarea
              v-model="form.notes"
              label="Notes"
              placeholder="Optional role or route details"
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
            @click="saveEmployee"
          >
            Save Employee
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-if="!readonly"
      v-model="deleteDialog"
      title="Delete Employee"
      :message="`Are you sure you want to delete employee ${targetEmployee?.name}?`"
      :loading="deleting"
      @confirm="executeDelete"
    />

    <!-- Bulk Delete Confirmation Dialog -->
    <ConfirmDialog
      v-if="!readonly"
      v-model="bulkDeleteDialog"
      title="Bulk Delete Employees"
      :message="`Are you sure you want to delete ${selectedIds.length} selected employee(s)? This action cannot be undone.`"
      :loading="bulkDeleting"
      @confirm="executeBulkDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { employeeService } from '@/services/employeeService';
import { useSnackbarStore } from '@/stores/snackbar';
import { formatCurrency, formatDate, getCurrentDateString } from '@/utils/formatters';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import AppDatePicker from '@/components/common/AppDatePicker.vue';
import AppPagination from '@/components/common/AppPagination.vue';
import BulkActionsBar from '@/components/common/BulkActionsBar.vue';

const props = defineProps({
  embedded: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
});

const route = useRoute();
const authStore = useAuthStore();
const snackbar = useSnackbarStore();
const employees = ref([]);
const search = ref('');
const roleFilter = ref(
  ['driver', 'calander', 'other'].includes(String(route.query.role || '').toLowerCase())
    ? String(route.query.role).toLowerCase()
    : 'all'
);
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
const targetEmployee = ref(null);

const form = ref({
  id: null,
  name: '',
  designation: '',
  phone: '',
  licenseNumber: '',
  salary: 35000,
  joinDate: getCurrentDateString(),
  status: 'Active',
  notes: '',
});
const customDesignation = ref('');

const PRESET_DESIGNATIONS = ['Driver', 'Calander', 'Milking Staff', 'Farm Supervisor', 'Worker'];

const designationOptions = computed(() => {
  const seen = new Set(PRESET_DESIGNATIONS.map((d) => d.toLowerCase()));
  const customSaved = [];
  for (const emp of employees.value) {
    const role = (emp.designation || '').trim();
    if (role && role.toLowerCase() !== 'custom' && !seen.has(role.toLowerCase())) {
      seen.add(role.toLowerCase());
      customSaved.push(role);
    }
  }
  return [...PRESET_DESIGNATIONS, ...customSaved, 'Custom'];
});

function isDriverRole(designation) {
  return (designation || '').toLowerCase().includes('driver');
}

function isCalanderRole(designation) {
  const lower = (designation || '').toLowerCase();
  return lower.includes('calander') || lower.includes('calender') || lower.includes('helper');
}

const isDriverFormRole = computed(() =>
  isDriverRole(form.value.designation === 'Custom' ? customDesignation.value : form.value.designation)
);

function getDesignationTagClass(designation) {
  if (isDriverRole(designation)) return 'erp-tag-blue';
  if (isCalanderRole(designation)) return 'erp-tag-purple';
  if ((designation || '').toLowerCase().includes('supervisor')) return 'erp-tag-teal';
  return 'erp-tag-blue';
}

function getStatusLabel(item) {
  if (item.active === false) return 'INACTIVE';
  return (item.status || 'Active').toUpperCase();
}

function getStatusTagClass(item) {
  const label = getStatusLabel(item);
  if (label === 'ACTIVE') return 'erp-tag-green';
  if (label === 'ON LEAVE') return 'erp-tag-orange';
  return 'erp-tag-grey';
}

const filteredEmployees = computed(() => {
  let list = employees.value;
  if (roleFilter.value === 'driver') {
    list = list.filter((e) => isDriverRole(e.designation));
  } else if (roleFilter.value === 'calander') {
    list = list.filter((e) => isCalanderRole(e.designation));
  } else if (roleFilter.value === 'other') {
    list = list.filter((e) => !isDriverRole(e.designation) && !isCalanderRole(e.designation));
  }
  if (!search.value) return list;
  const term = search.value.toLowerCase();
  return list.filter(
    (e) =>
      e.name?.toLowerCase().includes(term) ||
      e.designation?.toLowerCase().includes(term) ||
      e.phone?.toLowerCase().includes(term)
  );
});

const paginatedEmployees = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  return filteredEmployees.value.slice(start, start + itemsPerPage.value);
});

const isAllSelected = computed(() => {
  return paginatedEmployees.value.length > 0 && paginatedEmployees.value.every(item => selectedIds.value.includes(item.id));
});

const isSomeSelected = computed(() => {
  return selectedIds.value.length > 0 && !isAllSelected.value;
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = paginatedEmployees.value.map(item => item.id);
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

watch([search, roleFilter], () => {
  page.value = 1;
  selectedIds.value = [];
});

watch(
  () => route.query.role,
  (nextRole) => {
    const val = String(nextRole || '').toLowerCase();
    if (['driver', 'calander', 'other'].includes(val)) {
      roleFilter.value = val;
    }
  }
);

async function loadEmployees() {
  try {
    selectedIds.value = [];
    employees.value = await employeeService.getEmployees();
  } catch (err) {
    snackbar.error('Failed to load employees');
  }
}

function openDialog(item = null) {
  if (props.readonly) return;
  if (item && !authStore.isAdmin) {
    snackbar.error('Staff members can only add new employees, not edit existing records.');
    return;
  }
  customDesignation.value = '';
  if (item) {
    isEdit.value = true;
    form.value = {
      ...item,
      licenseNumber: item.licenseNumber || '',
      notes: item.notes || '',
      status: item.active === false ? 'Inactive' : (item.status || 'Active'),
    };
  } else {
    isEdit.value = false;
    const defaultRole =
      roleFilter.value === 'driver'
        ? 'Driver'
        : roleFilter.value === 'calander'
          ? 'Calander'
          : '';
    form.value = {
      id: null,
      name: '',
      designation: defaultRole,
      phone: '',
      licenseNumber: '',
      salary: 35000,
      joinDate: getCurrentDateString(),
      status: 'Active',
      notes: '',
    };
  }
  dialog.value = true;
}

async function saveEmployee() {
  if (!form.value.name?.trim()) {
    snackbar.error('Please enter employee name');
    return;
  }
  const resolvedDesignation =
    form.value.designation === 'Custom'
      ? customDesignation.value.trim()
      : (form.value.designation || '').trim();
  if (form.value.designation === 'Custom' && !resolvedDesignation) {
    snackbar.error('Please enter custom role / designation');
    return;
  }
  const payload = {
    ...form.value,
    designation: resolvedDesignation || 'Worker',
  };
  saving.value = true;
  try {
    if (isEdit.value) {
      await employeeService.updateEmployee(form.value.id, payload);
      snackbar.success('Employee updated successfully');
    } else {
      await employeeService.createEmployee(payload);
      snackbar.success('Employee created successfully');
    }
    dialog.value = false;
    await loadEmployees();
  } catch (err) {
    snackbar.error(err.message || 'Failed to save employee');
  } finally {
    saving.value = false;
  }
}

function confirmDelete(item) {
  if (!authStore.isAdmin) {
    snackbar.error('Staff members are not permitted to delete records.');
    return;
  }
  targetEmployee.value = item;
  deleteDialog.value = true;
}

async function executeDelete() {
  if (!targetEmployee.value) return;
  deleting.value = true;
  try {
    await employeeService.deleteEmployee(targetEmployee.value.id);
    snackbar.success('Employee deleted');
    deleteDialog.value = false;
    await loadEmployees();
  } catch (err) {
    snackbar.error('Failed to delete employee');
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
  bulkDeleteDialog.value = true;
}

async function executeBulkDelete() {
  bulkDeleting.value = true;
  try {
    const toDelete = [...selectedIds.value];
    for (const id of toDelete) {
      await employeeService.deleteEmployee(id);
    }
    snackbar.success(`${toDelete.length} employee(s) deleted successfully`);
    selectedIds.value = [];
    bulkDeleteDialog.value = false;
    await loadEmployees();
  } catch (err) {
    snackbar.error('Failed to delete some employees');
  } finally {
    bulkDeleting.value = false;
  }
}

onMounted(() => {
  loadEmployees();
});
</script>

