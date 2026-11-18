<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    width="96vw"
    max-width="1520"
    scrollable
  >
    <v-card class="rounded-xl overflow-hidden">
      <!-- Dialog Top Bar -->
      <div class="closing-modal-header px-5 py-3 d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-3">
          <v-icon color="white" size="24">mdi-lock-check</v-icon>
          <div>
            <h2 class="text-subtitle-1 font-weight-bold text-white mb-0">
              Day Closing &amp; Previous Records
            </h2>
            <div class="text-caption text-blue-lighten-4">
              Inspect previous day records, settle pending dispatches, and close each day before moving forward
            </div>
          </div>
        </div>
        <div class="d-flex align-center gap-2">
          <v-btn
            icon="mdi-refresh"
            variant="text"
            size="small"
            color="white"
            title="Refresh Records"
            :loading="loading"
            @click="refreshAll"
          />
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            color="white"
            @click="$emit('update:modelValue', false)"
          />
        </div>
      </div>

      <v-card-text class="pa-4 bg-grey-lighten-5">
        <!-- Lock Status Banner -->
        <div
          v-if="businessDayStore.isLockedOnPreviousDay"
          class="closing-status-banner banner-warning mb-3"
        >
          <div class="d-flex align-center gap-2">
            <v-icon size="20" color="amber-darken-4" class="flex-shrink-0">mdi-alert-circle</v-icon>
            <div class="text-body-2">
              <strong>Working Day Held at {{ formatDate(businessDayStore.activeBusinessDate) }}:</strong>
              {{ businessDayStore.lockReason }}
            </div>
          </div>
          <div class="d-flex align-center gap-2 flex-wrap">
            <v-btn
              v-if="selectedDate !== businessDayStore.activeBusinessDate"
              size="small"
              color="warning"
              variant="flat"
              class="text-capitalize font-weight-bold"
              @click="selectDate(businessDayStore.activeBusinessDate)"
            >
              Jump to {{ formatDate(businessDayStore.activeBusinessDate) }}
            </v-btn>
            <v-btn
              v-if="inspection && inspection.pendingDispatches.length > 0"
              size="small"
              color="primary"
              variant="flat"
              class="text-capitalize font-weight-bold"
              prepend-icon="mdi-truck-check"
              @click="goToHistoryMarkBack(selectedDate)"
            >
              Mark Back ({{ inspection.pendingDispatches.length }})
            </v-btn>
          </div>
        </div>

        <div
          v-else-if="inspection?.isClosed"
          class="closing-status-banner banner-success mb-3"
        >
          <div class="d-flex align-center gap-2 text-body-2">
            <v-icon size="20" color="success" class="flex-shrink-0">mdi-check-circle</v-icon>
            <span>
              <strong>Day Closed:</strong> {{ formatDate(selectedDate) }} was closed by
              <strong>{{ inspection.closing?.closedBy || 'Admin' }}</strong>
              on {{ formatDateTime(inspection.closing?.closedAt) }}.
            </span>
          </div>
        </div>

        <!-- Selected Date Summary Cards (5 Columns) -->
        <div class="closing-metrics-grid mb-3">
          <StatCard
            label="Milk Received"
            :value="`${formatNumber(summary.milkReceivedKg)} Kg`"
            color="info"
            :subtitle="`${formatNumber(summary.milkReceivedLiters)} L (${summary.arrivalsCount} arrivals)`"
          />
          <StatCard
            label="Milk Dispatched"
            :value="`${formatNumber(summary.milkDispatchedKg)} Kg`"
            color="primary"
            :subtitle="`${summary.returnedDispatchCount}/${summary.dispatchesCount} routes returned`"
          />
          <StatCard
            label="Today Collection"
            :value="formatCurrency(summary.totalCollection)"
            color="success"
            :subtitle="`Sales: ${formatCurrency(summary.totalDispatchAmount)}`"
          />
          <StatCard
            label="Net Cash Flow"
            :value="formatCurrency(summary.netCashFlow)"
            color="teal"
            :subtitle="`Expenses: ${formatCurrency(summary.totalExpenses)}`"
          />
          <StatCard
            label="Pending Dispatches"
            :value="String(summary.pendingDispatchCount)"
            color="warning"
            :subtitle="summary.pendingDispatchCount > 0 ? 'Mark Back to close' : 'All deliveries returned'"
          />
        </div>

        <!-- Close Action & Controls Card -->
        <v-card class="modern-card pa-3 mb-3" elevation="0">
          <div class="d-flex align-center justify-space-between flex-wrap gap-3">
            <div class="d-flex align-center flex-wrap gap-3">
              <div style="min-width: 240px; width: 250px;">
                <AppDatePicker
                  v-model="selectedDate"
                  label="Inspect Day"
                  :enforce-business-day="false"
                  hide-details
                  @change="loadInspection"
                />
              </div>
              <div>
                <div class="d-flex align-center gap-2 mb-1">
                  <span class="font-weight-bold text-subtitle-2 text-grey-darken-4">
                    {{ formatDate(selectedDate) }}
                  </span>
                  <span
                    class="erp-tag"
                    :class="inspection?.isClosed ? 'erp-tag-green' : (!inspection?.isDayOpened && summary.arrivalsCount === 0 ? 'erp-tag-grey' : (summary.pendingDispatchCount > 0 ? 'erp-tag-orange' : 'erp-tag-blue'))"
                  >
                    {{ inspection?.isClosed ? 'CLOSED' : (!inspection?.isDayOpened && summary.arrivalsCount === 0 ? 'NOT OPEN' : (summary.pendingDispatchCount > 0 ? 'PENDING RETURNS' : 'READY TO CLOSE')) }}
                  </span>
                </div>
                <div class="text-caption text-grey-darken-1">
                  <template v-if="!inspection?.isClosed && summary.arrivalsCount === 0">
                    <span class="text-amber-darken-4 font-weight-medium">
                      Day not open yet — Record milk arrival in Milk Arrival to open day
                    </span>
                  </template>
                  <template v-else>
                    Total Arrears: <strong>{{ formatCurrency(summary.totalShopArrears) }}</strong>
                    &nbsp;•&nbsp;
                    Attendance: <strong>{{ summary.presentCount }}P / {{ summary.absentCount }}A</strong>
                  </template>
                </div>
              </div>
            </div>

            <div class="d-flex align-center flex-wrap gap-2 ms-auto">
              <v-text-field
                v-if="!inspection?.isClosed"
                v-model="closingRemarks"
                placeholder="Handover remarks (optional)"
                variant="outlined"
                density="compact"
                hide-details
                style="min-width: 220px;"
              />
              <v-btn
                v-if="!inspection?.isClosed"
                color="primary"
                variant="flat"
                class="preserved-close-day-btn text-capitalize font-weight-bold px-5"
                prepend-icon="mdi-lock-check"
                :disabled="!inspection?.canClose"
                :title="!inspection?.canClose ? (summary.arrivalsCount === 0 ? 'Day not open — record milk arrival first' : 'Mark back all dispatches before closing') : `Close Day (${formatDate(selectedDate)})`"
                :loading="closingDay"
                @click="confirmCloseDialog = true"
              >
                Close Day ({{ formatDate(selectedDate) }})
              </v-btn>
              <v-btn
                v-else-if="authStore.isAdmin"
                color="warning"
                variant="tonal"
                class="reopen-day-admin-btn text-capitalize font-weight-bold px-4"
                prepend-icon="mdi-lock-open-variant"
                :loading="reopening"
                @click="confirmReopen(selectedDate)"
              >
                Reopen Day (Admin)
              </v-btn>
            </div>
          </div>
        </v-card>

        <!-- Previous Day Records & Closing Ledger Table -->
        <v-card class="modern-card overflow-hidden" elevation="0">
          <div class="d-flex align-center justify-space-between px-4 py-3 flex-wrap gap-2 bg-white border-b">
            <div class="d-flex align-center gap-3 flex-wrap">
              <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
                Previous Records &amp; Day Closing Ledger
              </h3>
              <v-btn-toggle
                v-model="ledgerFilter"
                mandatory
                density="compact"
                color="primary"
                variant="outlined"
                class="rounded-lg"
              >
                <v-btn value="all" size="x-small" class="text-capitalize font-weight-bold">
                  All ({{ allLedgerRows.length }})
                </v-btn>
                <v-btn value="pending" size="x-small" class="text-capitalize font-weight-bold">
                  Pending ({{ pendingLedgerCount }})
                </v-btn>
                <v-btn value="closed" size="x-small" class="text-capitalize font-weight-bold">
                  Closed ({{ closedLedgerCount }})
                </v-btn>
              </v-btn-toggle>
            </div>
            <span class="text-caption text-grey">{{ filteredLedgerRows.length }} record(s)</span>
          </div>

          <div style="max-height: 290px; overflow-y: auto; overflow-x: auto;">
            <v-table hover density="compact">
              <thead>
                <tr>
                  <th>Business Date</th>
                  <th>Status</th>
                  <th class="text-end">Dispatches</th>
                  <th class="text-end">Milk In (Kg)</th>
                  <th class="text-end">Milk Out (Kg)</th>
                  <th class="text-end">Collection</th>
                  <th class="text-end">Expenses</th>
                  <th>Closed By / State</th>
                  <th>Notes / Reason</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in filteredLedgerRows"
                  :key="row.date"
                  :class="{
                    'row-pending-unclosed': row.isPreviousUnclosed,
                    'row-selected-inspect': row.date === selectedDate && !row.isPreviousUnclosed,
                  }"
                >
                  <td class="font-weight-bold text-dark" style="white-space: nowrap;">
                    <v-icon
                      size="15"
                      :color="row.isClosed ? 'success' : (row.isPreviousUnclosed ? 'warning' : 'primary')"
                      class="me-1"
                    >
                      {{ row.isClosed ? 'mdi-calendar-check' : 'mdi-calendar-clock' }}
                    </v-icon>
                    {{ formatDate(row.date) }}
                  </td>
                  <td>
                    <span class="erp-tag" :class="getLedgerStatusTagClass(row)">
                      {{ getLedgerStatusLabel(row) }}
                    </span>
                  </td>
                  <td class="text-end font-weight-medium" style="white-space: nowrap;">
                    {{ row.summary.dispatchesCount }}
                    <span
                      v-if="row.summary.pendingDispatchCount > 0"
                      class="text-caption font-weight-bold text-orange-darken-4"
                    >
                      ({{ row.summary.pendingDispatchCount }} out)
                    </span>
                  </td>
                  <td class="text-end font-weight-bold text-info" style="white-space: nowrap;">
                    {{ formatNumber(row.summary.milkReceivedKg) }} Kg
                  </td>
                  <td class="text-end font-weight-bold text-primary" style="white-space: nowrap;">
                    {{ formatNumber(row.summary.milkDispatchedKg) }} Kg
                  </td>
                  <td class="text-end font-weight-bold text-success" style="white-space: nowrap;">
                    {{ formatCurrency(row.summary.totalCollection) }}
                  </td>
                  <td class="text-end font-weight-medium text-error" style="white-space: nowrap;">
                    {{ formatCurrency(row.summary.totalExpenses) }}
                  </td>
                  <td>
                    <template v-if="row.isClosed && row.closing">
                      <div class="font-weight-medium">{{ row.closing.closedBy || 'Admin' }}</div>
                      <div class="text-caption text-grey">{{ formatDateTime(row.closing.closedAt) }}</div>
                    </template>
                    <template v-else>
                      <div class="font-weight-bold text-orange-darken-4">Pending Closing</div>
                    </template>
                  </td>
                  <td class="text-caption text-grey-darken-2">
                    <template v-if="row.isClosed">
                      {{ row.closing?.remarks || '-' }}
                    </template>
                    <template v-else-if="row.summary.pendingDispatchCount > 0">
                      <span class="text-orange-darken-4 font-weight-bold">
                        Mark Back pending dispatch(es) first
                      </span>
                    </template>
                    <template v-else-if="row.isPreviousUnclosed">
                      <span class="text-red-darken-2 font-weight-bold">
                        Previous day open — close to unlock {{ formatDate(businessDayStore.realToday) }}
                      </span>
                    </template>
                    <template v-else>
                      Active working day
                    </template>
                  </td>
                  <td class="text-end" style="white-space: nowrap;">
                    <v-btn
                      v-if="!row.isClosed && row.summary.pendingDispatchCount > 0"
                      size="x-small"
                      color="warning"
                      variant="flat"
                      class="text-capitalize font-weight-bold me-1"
                      prepend-icon="mdi-truck-check"
                      @click="goToHistoryMarkBack(row.date)"
                    >
                      Mark Back ({{ row.summary.pendingDispatchCount }})
                    </v-btn>
                    <v-btn
                      v-else-if="!row.isClosed && row.canClose"
                      size="x-small"
                      color="primary"
                      variant="flat"
                      class="text-capitalize font-weight-bold me-1"
                      prepend-icon="mdi-lock-check"
                      @click="promptCloseRow(row.date)"
                    >
                      Close Day
                    </v-btn>
                    <v-btn
                      icon="mdi-eye"
                      size="x-small"
                      variant="text"
                      color="primary"
                      title="Inspect Day Summary"
                      @click="selectDate(row.date)"
                    />
                    <v-btn
                      v-if="authStore.isAdmin && row.isClosed"
                      icon="mdi-lock-open-variant"
                      size="x-small"
                      variant="text"
                      color="warning"
                      title="Reopen Day (Admin)"
                      @click="confirmReopen(row.date)"
                    />
                  </td>
                </tr>
                <tr v-if="filteredLedgerRows.length === 0">
                  <td colspan="10" class="text-center pa-6 text-grey">
                    No day records matching selected filter. Days appear automatically once opened from Milk Arrival.
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card>
      </v-card-text>
    </v-card>

    <!-- Close Day Confirmation Dialog -->
    <ConfirmDialog
      v-model="confirmCloseDialog"
      title="Confirm End-of-Day Closing"
      :message="`Are you sure you want to close ${formatDate(selectedDate)}? All totals will be locked and closed dates cannot be modified unless reopened by an Admin.`"
      confirm-text="Close Day"
      confirm-color="primary"
      :loading="closingDay"
      @confirm="executeCloseDay"
    />

    <!-- Reopen Day Confirmation Dialog -->
    <ConfirmDialog
      v-model="reopenDialog"
      title="Reopen Closed Day"
      :message="`Reopening ${formatDate(reopenTargetDate)} unlocks its records and shifts the active working day back to ${formatDate(reopenTargetDate)} if earlier than calendar today. Continue?`"
      confirm-text="Reopen Day"
      confirm-color="warning"
      :loading="reopening"
      @confirm="executeReopenDay"
    />
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { dayClosingService } from '@/services/dayClosingService';
import { useBusinessDayStore } from '@/stores/businessDay';
import { useAuthStore } from '@/stores/auth';
import { useSnackbarStore } from '@/stores/snackbar';
import { formatCurrency, formatNumber, formatDate, formatDateTime } from '@/utils/formatters';
import StatCard from '@/components/common/StatCard.vue';
import AppDatePicker from '@/components/common/AppDatePicker.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'mark-back-date', 'day-closed']);

const businessDayStore = useBusinessDayStore();
const authStore = useAuthStore();
const snackbar = useSnackbarStore();

const loading = ref(false);
const closingDay = ref(false);
const reopening = ref(false);
const selectedDate = ref(businessDayStore.activeBusinessDate);
const inspection = ref(null);
const closingRemarks = ref('');
const ledgerFilter = ref('all');
const confirmCloseDialog = ref(false);
const reopenDialog = ref(false);
const reopenTargetDate = ref('');

const defaultSummary = {
  milkReceivedKg: 0,
  milkReceivedLiters: 0,
  arrivalsCount: 0,
  milkDispatchedKg: 0,
  dispatchesCount: 0,
  returnedDispatchCount: 0,
  pendingDispatchCount: 0,
  totalDispatchAmount: 0,
  totalCollection: 0,
  totalExpenses: 0,
  netCashFlow: 0,
  totalShopArrears: 0,
  presentCount: 0,
  absentCount: 0,
};

const summary = computed(() => inspection.value?.summary || defaultSummary);
const allLedgerRows = computed(() => businessDayStore.ledgerRows || []);
const pendingLedgerCount = computed(() => allLedgerRows.value.filter((r) => !r.isClosed).length);
const closedLedgerCount = computed(() => allLedgerRows.value.filter((r) => r.isClosed).length);

const filteredLedgerRows = computed(() => {
  if (ledgerFilter.value === 'pending') {
    return allLedgerRows.value.filter((r) => !r.isClosed);
  }
  if (ledgerFilter.value === 'closed') {
    return allLedgerRows.value.filter((r) => r.isClosed);
  }
  return allLedgerRows.value;
});

function getLedgerStatusTagClass(row) {
  if (row.ledgerStatus === 'Closed') return 'erp-tag-green';
  if (row.ledgerStatus === 'PendingReturn') return 'erp-tag-orange';
  if (row.ledgerStatus === 'PendingClose') return 'erp-tag-red';
  return 'erp-tag-blue';
}

function getLedgerStatusLabel(row) {
  if (row.ledgerStatus === 'Closed') return 'CLOSED';
  if (row.ledgerStatus === 'PendingReturn') {
    return `PENDING RETURN (${row.summary.pendingDispatchCount})`;
  }
  if (row.ledgerStatus === 'PendingClose') return 'PENDING CLOSE';
  return 'OPEN';
}

async function loadInspection() {
  if (!selectedDate.value) return;
  loading.value = true;
  try {
    inspection.value = await dayClosingService.inspectDayStatus(selectedDate.value);
  } catch (err) {
    snackbar.error('Failed to inspect day closing status');
  } finally {
    loading.value = false;
  }
}

async function refreshAll() {
  loading.value = true;
  try {
    await businessDayStore.refreshBusinessDay();
    if (!selectedDate.value) {
      selectedDate.value = businessDayStore.activeBusinessDate;
    }
    await loadInspection();
  } finally {
    loading.value = false;
  }
}

async function selectDate(dateStr) {
  selectedDate.value = dateStr;
  await loadInspection();
}

function goToHistoryMarkBack(dateStr) {
  emit('mark-back-date', dateStr);
  emit('update:modelValue', false);
}

async function promptCloseRow(dateStr) {
  selectedDate.value = dateStr;
  await loadInspection();
  confirmCloseDialog.value = true;
}

async function executeCloseDay() {
  closingDay.value = true;
  try {
    await businessDayStore.closeDay(selectedDate.value, {
      closedBy: authStore.userName || 'Admin',
      remarks: closingRemarks.value,
    });
    confirmCloseDialog.value = false;
    closingRemarks.value = '';
    const nextDate = businessDayStore.activeBusinessDate;
    snackbar.success(
      businessDayStore.isLockedOnPreviousDay
        ? `Day closed! Next unclosed previous day is ${formatDate(nextDate)}.`
        : `Day closed! Working day is now ${formatDate(nextDate)}.`
    );
    selectedDate.value = nextDate;
    await loadInspection();
    emit('day-closed', nextDate);
  } catch (err) {
    snackbar.error(err.message || 'Failed to close day');
  } finally {
    closingDay.value = false;
  }
}

function confirmReopen(dateStr) {
  reopenTargetDate.value = dateStr;
  reopenDialog.value = true;
}

async function executeReopenDay() {
  if (!reopenTargetDate.value) return;
  reopening.value = true;
  try {
    await businessDayStore.reopenDay(reopenTargetDate.value, {
      reopenedBy: authStore.userName || 'Admin',
    });
    reopenDialog.value = false;
    snackbar.warning(`Reopened ${formatDate(reopenTargetDate.value)} for editing.`);
    selectedDate.value = businessDayStore.activeBusinessDate;
    await loadInspection();
    emit('day-closed', businessDayStore.activeBusinessDate);
  } catch (err) {
    snackbar.error(err.message || 'Failed to reopen day');
  } finally {
    reopening.value = false;
  }
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      await businessDayStore.refreshBusinessDay();
      selectedDate.value = businessDayStore.activeBusinessDate;
      await loadInspection();
    }
  }
);
</script>

<style scoped>
.closing-modal-header {
  background-color: #063f78 !important;
  color: #ffffff !important;
}

.closing-status-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  border-left-width: 4px;
}

.banner-warning {
  background: #fef3c7;
  border-left-color: #d97706;
  color: #78350f;
}

.banner-success {
  background: #e8f5e9;
  border-left-color: #2e7d32;
  color: #1b5e20;
}

.closing-metrics-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

@media (max-width: 1000px) {
  .closing-metrics-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .closing-metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.pending-dispatch-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  background: #fff8e1;
  border: 1px solid #f59e0b;
  border-radius: 6px;
}

.v-table tbody tr.row-pending-unclosed {
  background-color: #fffbeb !important;
  box-shadow: inset 4px 0 0 #d97706 !important;
}

.v-table tbody tr.row-selected-inspect:not(.row-pending-unclosed) {
  background-color: rgba(25, 118, 210, 0.06) !important;
}

.closing-metrics-grid :deep(.stat-card-value) {
  font-size: 1.28rem !important;
  white-space: nowrap !important;
}

:deep(.v-table thead tr th),
:deep(.v-table tbody tr td:not(:has(> .erp-tag))) {
  padding-left: 10px !important;
  padding-right: 10px !important;
}

/* Reopen Day (Admin) Button */
.reopen-day-admin-btn,
:deep(.reopen-day-admin-btn) {
  background-color: #fffbeb !important;
  color: #000000 !important;
  border: 1.5px solid #eab308 !important;
  border-radius: 8px !important;
  transition: all 0.2s ease !important;
}

.reopen-day-admin-btn :deep(.v-btn__content),
:deep(.reopen-day-admin-btn .v-btn__content) {
  color: #000000 !important;
}

.reopen-day-admin-btn :deep(.v-icon),
:deep(.reopen-day-admin-btn .v-icon) {
  color: #eab308 !important;
}

.reopen-day-admin-btn:hover:not(:disabled),
:deep(.reopen-day-admin-btn:hover:not(:disabled)) {
  background-color: #fef9c3 !important;
  border-color: #ca8a04 !important;
  color: #000000 !important;
  box-shadow: 0 2px 6px rgba(234, 179, 8, 0.25) !important;
}
</style>

