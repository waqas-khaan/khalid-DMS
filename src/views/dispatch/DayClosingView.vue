<template>
  <!-- Mobile Responsive View (Auto-switched on mobile devices / viewports) -->
  <DayClosingMobileView v-if="display.smAndDown.value" />

  <!-- Desktop View (Preserved 100% intact, no changes) -->
  <div v-else class="page-container table-page">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-header-title">
          Daily Closing & Working Day Lock
        </h1>
        <p class="page-header-subtitle">
          Verify deliveries returned, daily cash collection, expenses, and close each day before advancing to the next calendar day
        </p>
      </div>

      <div class="d-flex align-center flex-wrap" style="gap: 12px;">
        <div style="min-width: 240px; width: 250px;">
          <AppDatePicker
            v-model="selectedDate"
            label="Inspect Closing Date"
            :enforce-business-day="false"
            hide-details
            @change="loadInspection"
          />
        </div>
        
        <v-btn
          variant="flat"
          color="primary"
          class="text-capitalize font-weight-bold px-5"
          prepend-icon="mdi-refresh"
          :loading="loading"
          @click="refreshAll"
        >
          Refresh
        </v-btn>
      </div>
    </div>

    <!-- Lock Status Banner (clean flex-safe card, never collapses) -->
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
          @click="selectPendingCloseDate"
        >
          Jump to {{ formatDate(businessDayStore.activeBusinessDate) }}
        </v-btn>
        <v-btn
          v-if="inspection && inspection.pendingDispatches.length > 0"
          size="small"
          color="primary"
          variant="flat"
          class="text-capitalize font-weight-bold"
          prepend-icon="mdi-cash-register"
          @click="openRouteSettlementsDialog"
        >
          Settle Pending Dispatches ({{ inspection.pendingDispatches.length }})
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

    <!-- Top Stat Cards Grid for Selected Day -->
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
        :subtitle="`Sales Value: ${formatCurrency(summary.totalDispatchAmount)}`"
      />
      <StatCard
        label="Net Cash Flow"
        :value="formatCurrency(summary.netCashFlow)"
        :color="summary.netCashFlow >= 0 ? 'teal' : 'error'"
        :subtitle="`Expenses: ${formatCurrency(summary.totalExpenses)}`"
      />
      <StatCard
        label="Pending Dispatches"
        :value="String(summary.pendingDispatchCount)"
        :color="summary.pendingDispatchCount > 0 ? 'warning' : 'success'"
        :subtitle="summary.pendingDispatchCount > 0 ? 'Click to open settlement & Mark Back' : 'All deliveries returned'"
        :class="{ 'cursor-pointer': summary.pendingDispatchCount > 0 }"
        @click="summary.pendingDispatchCount > 0 ? openRouteSettlementsDialog() : null"
      />
    </div>

    <!-- Day Closing Action & Pending Blocker Check Card -->
    <v-card class="modern-card pa-3 px-4 mb-3 flex-shrink-0" elevation="0">
      <div class="d-flex align-center justify-space-between flex-wrap gap-3">
        <div>
          <div class="d-flex align-center gap-2 mb-1">
            <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
              End-of-Day Settlement — {{ formatDate(selectedDate) }}
            </h3>
            <span
              class="settlement-status-badge"
              :class="inspection?.isClosed ? 'badge-closed' : (!inspection?.isDayOpened && summary.arrivalsCount === 0 ? 'badge-not-open' : (summary.pendingDispatchCount > 0 ? 'badge-pending' : 'badge-ready'))"
            >
              <span class="status-live-dot"></span>
              <v-icon size="13" class="me-1">
                {{ inspection?.isClosed ? 'mdi-lock-check' : (!inspection?.isDayOpened && summary.arrivalsCount === 0 ? 'mdi-calendar-clock' : (summary.pendingDispatchCount > 0 ? 'mdi-truck-fast' : 'mdi-check-decagram')) }}
              </v-icon>
              <span>{{ inspection?.isClosed ? 'Closed & Finalized' : (!inspection?.isDayOpened && summary.arrivalsCount === 0 ? 'Day Not Open' : (summary.pendingDispatchCount > 0 ? `Pending Returns (${summary.pendingDispatchCount})` : 'Ready to Close')) }}</span>
            </span>
          </div>
          <p v-if="!inspection?.isClosed && summary.arrivalsCount === 0" class="text-caption text-grey-darken-1 mb-0">
            <span class="text-amber-darken-4 font-weight-medium">
              <v-icon size="14" color="amber-darken-4" class="me-1">mdi-alert-circle-outline</v-icon>
              Working day not open yet. Record milk arrival in Milk Arrival to open this day.
            </span>
          </p>
        </div>

        <div class="d-flex align-center flex-wrap gap-2">
          <v-btn
            color="teal-darken-1"
            variant="tonal"
            size="large"
            class="preserved-settlements-btn text-capitalize font-weight-bold px-4"
            prepend-icon="mdi-cash-register"
            @click="openRouteSettlementsDialog"
          >
            Route Collections &amp; Settlements ({{ dateDispatches.length }})
          </v-btn>
          <v-btn
            v-if="!inspection?.isClosed"
            color="primary"
            variant="flat"
            size="large"
            class="preserved-close-day-btn text-capitalize font-weight-bold px-6"
            prepend-icon="mdi-lock-check"
            :disabled="!inspection?.canClose"
            :title="!inspection?.canClose ? (summary.arrivalsCount === 0 ? 'Day not open — record milk arrival first' : 'Mark back all dispatches before closing') : `Close Day (${formatDate(selectedDate)})`"
            :loading="closingDay"
            @click="openCloseDayAllocationDialog"
          >
            Close Day ({{ formatDate(selectedDate) }})
          </v-btn>
          <v-btn
            v-else-if="authStore.isAdmin"
            color="warning"
            variant="tonal"
            size="large"
            class="reopen-day-admin-btn text-capitalize font-weight-bold px-5"
            prepend-icon="mdi-lock-open-variant"
            :loading="reopening"
            @click="confirmReopen(selectedDate)"
          >
            Reopen Day (Admin)
          </v-btn>
        </div>
      </div>
    </v-card>

    <!-- View Switcher Tabs: Daily Closing Ledger vs. Cash & Bank Handover Register -->
    <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-2">
      <v-btn-toggle
        v-model="activeClosingTab"
        mandatory
        color="primary"
        variant="outlined"
        density="compact"
        class="rounded-lg bg-white shadow-sm"
      >
        <v-btn value="ledger" class="text-capitalize font-weight-bold px-4" prepend-icon="mdi-calendar-check">
          Daily Closing Ledger ({{ allLedgerRows.length }})
        </v-btn>
        <v-btn value="allocation" class="text-capitalize font-weight-bold px-4" prepend-icon="mdi-bank-transfer">
          Cash &amp; Bank Handover Register ({{ closedAllocationRows.length }})
        </v-btn>
      </v-btn-toggle>
    </div>

    <!-- Day Closing Ledger Table (Shows Pending + Closed Days) -->
    <v-card v-if="activeClosingTab === 'ledger'" class="modern-card pa-4 table-card-full" elevation="0">
      <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-2">
        <div class="d-flex align-center gap-3 flex-wrap">
          <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-3 mb-0">
            Day Closing & Pending Days Ledger
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

          <!-- Unified Date Filter (From / To or Single Date in 1 picker) -->
          <div style="min-width: 280px; width: 310px;" class="flex-shrink-0">
            <AppDateRangePicker
              v-model="ledgerDateFilter"
              placeholder="Filter Date / Range"
              density="compact"
              hide-details
              clearable
              @change="onLedgerDateFilterChange"
            />
          </div>
        </div>
        <span class="text-caption text-grey">{{ filteredLedgerRows.length }} day record(s)</span>
      </div>

      <!-- Bulk Actions Bar -->
      <BulkActionsBar
        :count="selectedDates.length"
        item-label="closing record"
        @clear="selectedDates = []"
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
            Delete Selected ({{ selectedDates.length }})
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
                  :disabled="selectablePageRows.length === 0"
                  color="primary"
                  density="compact"
                  @update:model-value="toggleSelectAll"
                />
              </th>
              <th>Business Date</th>
              <th>Status</th>
              <th class="text-end">Dispatches</th>
              <th class="text-end">Milk In (Kg)</th>
              <th class="text-end">Milk Out (Kg)</th>
              <th class="text-end">Today Collection</th>
              <th class="text-end">Expenses</th>
              <th>Closed By / At</th>
              <th>Allocation Method</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in paginatedLedgerRows"
              :key="row.date"
              :class="{
                'row-pending-unclosed': row.isPreviousUnclosed,
                'row-selected-inspect': row.date === selectedDate,
                'selected-row': selectedDates.includes(row.date),
              }"
              style="cursor: pointer;"
              @click="selectedDate = row.date; loadInspection()"
            >
              <td v-if="authStore.isAdmin" class="table-checkbox-col">
                <v-checkbox-btn
                  :model-value="selectedDates.includes(row.date)"
                  :disabled="!canDeleteRow(row)"
                  color="primary"
                  density="compact"
                  @update:model-value="toggleSelectDate(row.date)"
                  @click.stop
                />
              </td>
              <td class="font-weight-bold text-dark" style="white-space: nowrap;">
                <v-icon
                  size="16"
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
                  <div class="text-caption text-grey-darken-1">
                    {{ row.summary.pendingDispatchCount > 0
                      ? `${row.summary.pendingDispatchCount} delivery still DISPATCHED`
                      : (row.hasActivity ? 'All returns settled' : 'Current calendar day')
                    }}
                  </div>
                </template>
              </td>
              <td>
                <span
                  class="erp-tag"
                  :class="getLedgerRowAllocationTagClass(row)"
                  :title="row.closing?.allocation?.bankName ? `Bank: ${row.closing.allocation.bankName}` : (row.closing?.remarks || '')"
                >
                  {{ getLedgerRowAllocationLabel(row) }}
                </span>
              </td>
              <td class="text-end" style="white-space: nowrap;">
                <div class="table-actions-cluster d-inline-flex align-center justify-end">
                  <!-- Mark Back button if dispatches still out -->
                  <button
                    v-if="!row.isClosed && row.summary.pendingDispatchCount > 0"
                    type="button"
                    class="action-btn-mark-back"
                    title="Open Route Collections & Settlements to Mark Back"
                    @click.stop="openRouteSettlementsDialog(row.date)"
                  >
                    <v-icon size="14">mdi-truck-check</v-icon>
                    <span>Mark Back ({{ row.summary.pendingDispatchCount }})</span>
                  </button>

                  <!-- Close Day Action Button -->
                  <button
                    v-else-if="!row.isClosed && row.canClose"
                    type="button"
                    class="action-btn-close-day"
                    title="Close Day and Advance Business Date"
                    @click.stop="promptCloseRow(row.date)"
                  >
                    <v-icon size="14">mdi-lock-check</v-icon>
                    <span>Close Day</span>
                  </button>

                  <!-- Reopen Button (Admin only) -->
                  <v-btn
                    v-if="authStore.isAdmin && row.isClosed"
                    icon="mdi-lock-open-variant-outline"
                    size="small"
                    variant="text"
                    color="warning"
                    title="Reopen Day (Admin)"
                    @click.stop="confirmReopen(row.date)"
                  />

                  <!-- Delete Button (Admin only) -->
                  <v-btn
                    v-if="canDeleteRow(row)"
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    title="Delete Day Closing Record (Admin)"
                    @click.stop="confirmDeleteClosing(row)"
                  />
                </div>
              </td>
            </tr>
            <tr v-if="filteredLedgerRows.length === 0">
              <td :colspan="authStore.isAdmin ? 11 : 10" class="text-center pa-8">
                <div class="empty-state-box">
                  <v-icon class="empty-state-icon">mdi-lock-check-outline</v-icon>
                  <div class="empty-state-title">No Matching Day Records</div>
                  <div class="empty-state-subtitle">
                    Working days opened from Milk Arrival and finalized closed days appear here automatically.
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <AppPagination
        v-model:page="page"
        v-model:itemsPerPage="itemsPerPage"
        :total-items="filteredLedgerRows.length"
      />
    </v-card>

    <!-- Tab 2: Cash & Bank Handover Register (Separated Record Table for Bank/Cash Allocation) -->
    <v-card v-if="activeClosingTab === 'allocation'" class="modern-card pa-4 table-card-full" elevation="0">
      <!-- Toolbar -->
      <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-3">
        <div class="d-flex align-center gap-3 flex-wrap">
          <div>
            <h3 class="text-subtitle-1 font-weight-bold text-slate-800 mb-0 d-flex align-center gap-2">
              <v-icon color="primary" size="20">mdi-bank-transfer</v-icon>
              Cash &amp; Bank Handover Register
            </h3>
            <div class="text-caption text-grey">
              Dedicated records of finalized day closing allocations: Bank deposits, Drawer Cash, and Split handovers
            </div>
          </div>

          <!-- Method Filter Toggle -->
          <v-btn-toggle
            v-model="allocationTypeFilter"
            mandatory
            density="compact"
            color="primary"
            variant="outlined"
            class="rounded-lg"
          >
            <v-btn value="all" size="x-small" class="text-capitalize font-weight-bold">
              All ({{ closedAllocationRows.length }})
            </v-btn>
            <v-btn value="bank" size="x-small" class="text-capitalize font-weight-bold">
              Bank Deposit ({{ allocationBankCount }})
            </v-btn>
            <v-btn value="cash" size="x-small" class="text-capitalize font-weight-bold">
              Cash in Hand ({{ allocationCashCount }})
            </v-btn>
            <v-btn value="split" size="x-small" class="text-capitalize font-weight-bold">
              Split ({{ allocationSplitCount }})
            </v-btn>
          </v-btn-toggle>

          <!-- Date Picker -->
          <div style="min-width: 280px; width: 310px;" class="flex-shrink-0">
            <AppDateRangePicker
              v-model="ledgerDateFilter"
              placeholder="Filter Date / Range"
              density="compact"
              hide-details
              clearable
              @change="onLedgerDateFilterChange"
            />
          </div>
        </div>

        <span class="text-caption text-grey font-weight-medium">
          Showing {{ filteredAllocationRows.length }} handover record(s)
        </span>
      </div>

      <!-- Financial Metric Highlights for the Filtered Allocation Period -->
      <div class="handover-metrics-grid mb-4">
        <div class="pa-3 rounded-lg d-flex align-center gap-3 handover-stat-card card-bank">
          <v-avatar color="primary" size="38" variant="tonal">
            <v-icon color="primary" size="22">mdi-bank</v-icon>
          </v-avatar>
          <div>
            <div class="text-caption font-weight-bold text-primary text-uppercase" style="font-size: 0.7rem !important;">
              Total Allocated to Bank
            </div>
            <div class="text-subtitle-1 font-weight-black text-primary">
              {{ formatCurrency(totalBankAllocated) }}
            </div>
          </div>
        </div>

        <div class="pa-3 rounded-lg d-flex align-center gap-3 handover-stat-card card-cash">
          <v-avatar color="success" size="38" variant="tonal">
            <v-icon color="success" size="22">mdi-cash-multiple</v-icon>
          </v-avatar>
          <div>
            <div class="text-caption font-weight-bold text-success text-uppercase" style="font-size: 0.7rem !important;">
              Total Retained in Cash
            </div>
            <div class="text-subtitle-1 font-weight-black text-success">
              {{ formatCurrency(totalCashAllocated) }}
            </div>
          </div>
        </div>

        <div class="pa-3 rounded-lg d-flex align-center gap-3 handover-stat-card card-net">
          <v-avatar color="indigo-darken-3" size="38" variant="tonal">
            <v-icon color="indigo-darken-3" size="22">mdi-check-decagram</v-icon>
          </v-avatar>
          <div>
            <div class="text-caption font-weight-bold text-indigo-darken-3 text-uppercase" style="font-size: 0.7rem !important;">
              Total Cash Flow Finalized
            </div>
            <div class="text-subtitle-1 font-weight-black text-indigo-darken-3">
              {{ formatCurrency(totalNetAllocated) }}
            </div>
          </div>
        </div>
      </div>

      <!-- The Separated Table -->
      <div class="table-responsive flex-grow-1">
        <v-table hover>
          <thead>
            <tr>
              <th>Business Date</th>
              <th class="text-end">Collections</th>
              <th class="text-end">Expenses</th>
              <th class="text-end">Net Cash Flow</th>
              <th>Allocation Method</th>
              <th class="text-end">Bank Deposit</th>
              <th>Bank Account &amp; Ref</th>
              <th class="text-end">Cash in Hand</th>
              <th>Handed Over / Closed By</th>
              <th>Remarks</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in paginatedAllocationRows"
              :key="row.date"
              style="cursor: pointer;"
              @click="selectedDate = row.date; loadInspection()"
            >
              <td class="font-weight-bold text-slate-800" style="white-space: nowrap;">
                <v-icon size="16" color="success" class="me-1">mdi-calendar-check</v-icon>
                {{ formatDate(row.date) }}
              </td>
              <td class="text-end font-weight-bold text-success" style="white-space: nowrap;">
                {{ formatCurrency(row.summary.totalCollection) }}
              </td>
              <td class="text-end font-weight-medium text-error" style="white-space: nowrap;">
                {{ formatCurrency(row.summary.totalExpenses) }}
              </td>
              <td class="text-end font-weight-black text-primary tabular-nums" style="white-space: nowrap;">
                {{ formatCurrency(row.remainingAmount) }}
              </td>
              <td>
                <span
                  class="erp-tag"
                  :class="getAllocationTagClass(row.type)"
                >
                  {{ getAllocationLabel(row.type) }}
                </span>
              </td>
              <td class="text-end font-weight-bold text-primary tabular-nums" style="white-space: nowrap;">
                {{ row.bankAmount > 0 ? formatCurrency(row.bankAmount) : '-' }}
              </td>
              <td>
                <div v-if="row.bankName" class="font-weight-bold text-slate-800">{{ row.bankName }}</div>
                <div v-if="row.bankRef" class="text-caption text-grey">Ref: {{ row.bankRef }}</div>
                <div v-if="!row.bankName && !row.bankRef" class="text-caption text-grey">-</div>
              </td>
              <td class="text-end font-weight-bold text-success tabular-nums" style="white-space: nowrap;">
                {{ row.cashAmount > 0 ? formatCurrency(row.cashAmount) : '-' }}
              </td>
              <td>
                <div class="font-weight-medium text-slate-800">{{ row.closedBy }}</div>
                <div class="text-caption text-grey">{{ formatDateTime(row.closedAt) }}</div>
              </td>
              <td class="text-caption text-grey-darken-2" style="max-width: 200px;">
                {{ row.remarks || '-' }}
              </td>
              <td class="text-end" style="white-space: nowrap;">
                <div class="table-actions-cluster d-inline-flex align-center justify-end">
                  <v-btn
                    v-if="authStore.isAdmin"
                    icon="mdi-lock-open-variant-outline"
                    size="small"
                    variant="text"
                    color="warning"
                    title="Reopen Day (Admin)"
                    @click.stop="confirmReopen(row.date)"
                  />
                </div>
              </td>
            </tr>
            <tr v-if="filteredAllocationRows.length === 0">
              <td colspan="11" class="text-center pa-8">
                <div class="empty-state-box">
                  <v-icon class="empty-state-icon" color="primary">mdi-bank-transfer</v-icon>
                  <div class="empty-state-title">No Cash &amp; Bank Handover Records</div>
                  <div class="empty-state-subtitle">
                    Finalized day closings with bank deposit or cash in hand allocations will appear here in this dedicated register.
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <AppPagination
        v-model:page="allocationPage"
        v-model:itemsPerPage="allocationItemsPerPage"
        :total-items="filteredAllocationRows.length"
      />
    </v-card>

    <!-- Save & Close Day with Bank/Cash Allocation Dialog -->
    <v-dialog v-model="closeDayAllocationDialog" max-width="640" persistent>
      <v-card class="rounded-xl pa-5">
        <!-- Header -->
        <div class="d-flex align-center justify-space-between pb-3 border-b mb-4">
          <div class="d-flex align-center gap-3">
            <v-avatar color="primary" size="38" variant="tonal">
              <v-icon color="primary" size="22">mdi-lock-check</v-icon>
            </v-avatar>
            <div>
              <h3 class="text-subtitle-1 font-weight-bold text-slate-800 mb-0">
                Save &amp; Close Day — {{ formatDate(selectedDate) }}
              </h3>
              <div class="text-caption text-grey">
                Finalize daily operations and allocate the net remaining cash flow
              </div>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="closeDayAllocationDialog = false" />
        </div>

        <!-- Financial Summary Stat Cards -->
        <div class="handover-metrics-grid mb-4">
          <div class="pa-3 rounded-lg border bg-green-lighten-5 text-center">
            <div class="text-caption font-weight-bold text-success text-uppercase" style="font-size: 0.7rem !important;">Today Collections</div>
            <div class="text-subtitle-1 font-weight-black text-success">{{ formatCurrency(summary.totalCollection) }}</div>
          </div>
          <div class="pa-3 rounded-lg border bg-orange-lighten-5 text-center">
            <div class="text-caption font-weight-bold text-orange-darken-4 text-uppercase" style="font-size: 0.7rem !important;">Daily Expenses</div>
            <div class="text-subtitle-1 font-weight-black text-orange-darken-4">{{ formatCurrency(summary.totalExpenses) }}</div>
          </div>
          <div class="pa-3 rounded-lg border bg-blue-lighten-5 text-center">
            <div class="text-caption font-weight-bold text-primary text-uppercase" style="font-size: 0.7rem !important;">Remaining Cash Flow</div>
            <div class="text-subtitle-1 font-weight-black text-primary">{{ formatCurrency(summary.netCashFlow) }}</div>
          </div>
        </div>

        <!-- Allocation Method Selection -->
        <div class="mb-3">
          <label class="text-subtitle-2 font-weight-bold text-slate-700 d-block mb-2">
            Add Remaining Amount ({{ formatCurrency(summary.netCashFlow) }}) To:
          </label>

          <v-radio-group v-model="allocationForm.type" hide-details class="mb-3">
            <v-row dense>
              <!-- Option 1: Cash in Hand -->
              <v-col cols="6" sm="4">
                <div
                  class="allocation-choice-card pa-3 rounded-lg border cursor-pointer h-100"
                  :class="{ 'border-primary bg-blue-lighten-5': allocationForm.type === 'cash' }"
                  @click="allocationForm.type = 'cash'"
                >
                  <v-radio value="cash" density="compact" hide-details class="mb-1" color="primary">
                    <template v-slot:label>
                      <span class="font-weight-bold text-body-2">Cash in Hand</span>
                    </template>
                  </v-radio>
                  <div class="text-caption text-grey ps-6">Retain in cash drawer</div>
                </div>
              </v-col>

              <!-- Option 2: Bank Deposit -->
              <v-col cols="6" sm="4">
                <div
                  class="allocation-choice-card pa-3 rounded-lg border cursor-pointer h-100"
                  :class="{ 'border-primary bg-blue-lighten-5': allocationForm.type === 'bank' }"
                  @click="allocationForm.type = 'bank'"
                >
                  <v-radio value="bank" density="compact" hide-details class="mb-1" color="primary">
                    <template v-slot:label>
                      <span class="font-weight-bold text-body-2">Deposit to Bank</span>
                    </template>
                  </v-radio>
                  <div class="text-caption text-grey ps-6">Transfer to bank account</div>
                </div>
              </v-col>

              <!-- Option 3: Split -->
              <v-col cols="12" sm="4">
                <div
                  class="allocation-choice-card pa-3 rounded-lg border cursor-pointer h-100"
                  :class="{ 'border-primary bg-blue-lighten-5': allocationForm.type === 'split' }"
                  @click="allocationForm.type = 'split'"
                >
                  <v-radio value="split" density="compact" hide-details class="mb-1" color="primary">
                    <template v-slot:label>
                      <span class="font-weight-bold text-body-2">Split Bank &amp; Cash</span>
                    </template>
                  </v-radio>
                  <div class="text-caption text-grey ps-6">Custom split</div>
                </div>
              </v-col>
            </v-row>
          </v-radio-group>
        </div>

        <!-- Dynamic Destination Details -->
        <div class="pa-3 rounded-lg bg-grey-lighten-5 border mb-4">
          <!-- If Bank -->
          <template v-if="allocationForm.type === 'bank'">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="allocationForm.bankName"
                  label="Bank Name / Account *"
                  placeholder="e.g. Meezan Bank, HBL"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="allocationForm.bankRef"
                  label="Deposit Slip / Ref # (Optional)"
                  placeholder="e.g. DEP-4089"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <div class="text-caption text-grey-darken-2 mt-1">
                  Full remaining cash flow of <strong class="text-primary">{{ formatCurrency(summary.netCashFlow) }}</strong> will be allocated to Bank.
                </div>
              </v-col>
            </v-row>
          </template>

          <!-- If Cash -->
          <template v-else-if="allocationForm.type === 'cash'">
            <div class="d-flex align-center gap-2 text-body-2 text-grey-darken-3">
              <v-icon color="success" size="20">mdi-cash-check</v-icon>
              <span>Full remaining cash flow of <strong class="text-success">{{ formatCurrency(summary.netCashFlow) }}</strong> will be retained in Cash in Hand (Main Drawer).</span>
            </div>
          </template>

          <!-- If Split -->
          <template v-else-if="allocationForm.type === 'split'">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="allocationForm.bankAmount"
                  type="number"
                  min="0"
                  :max="summary.netCashFlow"
                  label="Amount to Bank *"
                  density="compact"
                  variant="outlined"
                  hide-details
                  @update:model-value="onBankAmountChange"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="allocationForm.cashAmount"
                  type="number"
                  min="0"
                  :max="summary.netCashFlow"
                  label="Amount to Cash in Hand *"
                  density="compact"
                  variant="outlined"
                  hide-details
                  @update:model-value="onCashAmountChange"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="allocationForm.bankName"
                  label="Bank Name / Account"
                  placeholder="e.g. Meezan Bank"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
            </v-row>
          </template>
        </div>

        <!-- Closing Remarks -->
        <v-text-field
          v-model="closingRemarks"
          label="Closing Handover Remarks (Optional)"
          placeholder="e.g. Handed over cash to manager, bank deposit slip attached"
          variant="outlined"
          density="compact"
          hide-details
          class="mb-4"
        />

        <!-- Actions -->
        <div class="d-flex align-center justify-end gap-2 pt-2 border-t">
          <v-btn variant="text" class="text-capitalize" @click="closeDayAllocationDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="text-capitalize font-weight-bold px-5"
            prepend-icon="mdi-lock-check"
            :loading="closingDay"
            @click="executeCloseDayWithAllocation"
          >
            Confirm &amp; Finalize Day Closing
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Reopen Day Confirmation Dialog -->
    <ConfirmDialog
      v-model="reopenDialog"
      title="Reopen Closed Day"
      :message="`Reopening ${formatDate(reopenTargetDate)} will unlock its operational entries and set the working day back to ${formatDate(reopenTargetDate)} if earlier than calendar today. Continue?`"
      confirm-text="Reopen Day"
      confirm-color="warning"
      :loading="reopening"
      @confirm="executeReopenDay"
    />

    <!-- Step 1: First Delete Permission Dialog -->
    <ConfirmDialog
      v-model="deleteStep1Dialog"
      title="Delete Day Closing (Step 1 of 2)"
      :message="deleteStep1Message"
      confirm-text="Continue"
      confirm-color="primary"
      @confirm="proceedToSecondDeleteConfirm"
    />

    <!-- Step 2: Second Final Delete Permission Dialog -->
    <ConfirmDialog
      v-model="deleteStep2Dialog"
      title="Final Confirmation (Step 2 of 2)"
      :message="deleteStep2Message"
      confirm-text="Yes, Permanently Delete"
      confirm-color="error"
      icon="mdi-shield-alert-outline"
      :loading="deletingClosings"
      @confirm="executeDeleteClosings"
    />

    <!-- Full-page Route Collections & Settlements Dialog -->
    <v-dialog
      v-model="routeSettlementsDialog"
      fullscreen
      scrollable
      transition="dialog-bottom-transition"
    >
      <v-card class="d-flex flex-column bg-white rounded-0" elevation="0">
        <!-- Dialog Header Toolbar -->
        <!-- Executive Luxury Dialog Header Toolbar (Single Row flex-nowrap) -->
        <div class="closing-modal-header px-6 py-3 d-flex align-center justify-space-between flex-nowrap gap-3 flex-shrink-0">
          <!-- Left: Branding, Title, Date Badge & Subtitle (Gracefully truncates on narrow viewports) -->
          <div class="d-flex align-center gap-3 overflow-hidden" style="min-width: 0; flex: 1 1 auto;">
            <div class="header-icon-box flex-shrink-0">
              <v-icon color="#38bdf8" size="24">mdi-cash-register</v-icon>
            </div>
            <div class="overflow-hidden" style="min-width: 0; flex: 1 1 auto;">
              <div class="d-flex align-center gap-2 flex-nowrap overflow-hidden">
                <h2 class="header-main-title mb-0 text-truncate">
                  Route Collections &amp; Settlements
                </h2>
                <div class="header-date-badge flex-shrink-0">
                  <v-icon size="13" color="#38bdf8">mdi-calendar-check</v-icon>
                  <span>{{ settlementFilterDisplayTitle }}</span>
                </div>
              </div>
              <div class="header-subtitle text-truncate">
                Verify returned milk cans, record shop collections, and settle accounts before closing the day
              </div>
            </div>
          </div>

          <!-- Right: Search Box + Status Badges + Clean Close Button (Always visible on one row) -->
          <div class="d-flex align-center gap-3 flex-nowrap flex-shrink-0 ms-auto">
            <!-- Glassmorphic Search Shop Field -->
            <div class="header-search-box">
              <v-text-field
                v-model="routeShopSearch"
                density="compact"
                variant="solo"
                flat
                placeholder="Search shop name, code..."
                hide-details
                prepend-inner-icon="mdi-magnify"
                clearable
                class="header-search-input"
              />
            </div>

            <!-- Status Badges (Pure Solid Color, No Gradient) -->
            <div
              v-if="inspection?.isClosed"
              class="header-badge-closed-yellow"
            >
              <v-icon size="16">mdi-lock-check</v-icon>
              <span>Day Closed</span>
            </div>
            <div
              v-else-if="regularSettlementDispatches.some(r => r.status === 'Dispatched')"
              class="header-badge-pending-amber"
            >
              <v-icon size="16">mdi-truck-fast</v-icon>
              <span>{{ regularSettlementDispatches.filter(r => r.status === 'Dispatched').length }} Route(s) Pending</span>
            </div>
            <div
              v-else
              class="header-badge-settled-emerald"
            >
              <v-icon size="16">mdi-check-all</v-icon>
              <span>All Routes Settled</span>
            </div>

            <!-- Plain, clean X close button -->
            <button
              type="button"
              class="header-close-btn"
              title="Close (Esc)"
              @click="routeSettlementsDialog = false"
            >
              <v-icon size="22">mdi-close</v-icon>
            </button>
          </div>
        </div>

        <!-- Dedicated Period & Datepicker Filter Sub-Header Bar (Month or From - To Date) -->
        <div class="settlement-filter-toolbar px-6 py-3 border-b d-flex align-center justify-space-between flex-wrap gap-3 flex-shrink-0">
          <div class="d-flex align-center gap-3 flex-wrap">
            <!-- Prominent Visual Filter Badge -->
            <div class="filter-header-badge">
              <v-icon color="white" size="15">mdi-calendar-range</v-icon>
              <span>FILTER PERIOD:</span>
            </div>

            <!-- Unified 1 Date Picker (Month, From - To Range, or Single Date) -->
            <div class="settlement-datepicker-box d-flex align-center flex-shrink-0">
              <AppDateRangePicker
                v-model="settlementDateFilter"
                placeholder="Month or From – To Date"
                :clearable="true"
                :hide-details="true"
                @change="onSettlementFilterChange"
              />
            </div>

            <!-- Quick Filter Preset Pills -->
            <div class="d-flex align-center gap-2 flex-wrap">
              <button
                type="button"
                class="filter-preset-pill"
                :class="{ 'pill-active': isSettlementPresetActive('working_day') }"
                @click="applySettlementPreset('working_day')"
              >
                <v-icon size="14">mdi-calendar-check</v-icon>
                Working Day ({{ formatDate(selectedDate) }})
              </button>
              <button
                type="button"
                class="filter-preset-pill"
                :class="{ 'pill-active': isSettlementPresetActive('today') }"
                @click="applySettlementPreset('today')"
              >
                <v-icon size="14">mdi-calendar-today</v-icon>
                Today
              </button>
              <button
                type="button"
                class="filter-preset-pill"
                :class="{ 'pill-active': isSettlementPresetActive('this_month') }"
                @click="applySettlementPreset('this_month')"
              >
                <v-icon size="14">mdi-calendar-month</v-icon>
                This Month ({{ currentMonthLabel }})
              </button>
              <button
                type="button"
                class="filter-preset-pill"
                :class="{ 'pill-active': isSettlementPresetActive('all') }"
                @click="applySettlementPreset('all')"
              >
                <v-icon size="14">mdi-history</v-icon>
                All Routes
              </button>
              <button
                v-if="!isSettlementPresetActive('working_day')"
                type="button"
                class="filter-preset-pill pill-reset"
                title="Reset back to working day"
                @click="applySettlementPreset('working_day')"
              >
                <v-icon size="14">mdi-restore</v-icon>
                Reset
              </button>
            </div>
          </div>
        </div>

        <!-- Segmented Category Switcher (Delivery Routes vs Walk-in Counter Sales) -->
        <div
          v-if="guestSettlementDispatches.length > 0 && regularSettlementDispatches.length > 0"
          class="settlement-category-strip px-6 py-2 bg-white border-b d-flex align-center justify-space-between flex-wrap gap-2 flex-shrink-0"
        >
          <div class="d-flex align-center gap-2">
            <button
              type="button"
              class="category-tab-pill"
              :class="{ 'tab-pill-active': settlementActiveTab === 'routes' }"
              @click="settlementActiveTab = 'routes'"
            >
              <v-icon size="16">mdi-truck-fast</v-icon>
              <span>Delivery Routes</span>
              <span class="tab-pill-count">{{ regularSettlementDispatches.length }}</span>
              <span
                v-if="regularSettlementDispatches.some(r => r.status === 'Dispatched')"
                class="tab-pill-status pill-status-pending"
              >
                {{ regularSettlementDispatches.filter(r => r.status === 'Dispatched').length }} Pending
              </span>
              <span v-else class="tab-pill-status pill-status-settled">✓ All Settled</span>
            </button>

            <button
              type="button"
              class="category-tab-pill"
              :class="{ 'tab-pill-active': settlementActiveTab === 'guest' }"
              @click="settlementActiveTab = 'guest'"
            >
              <v-icon size="16">mdi-account-cash</v-icon>
              <span>Counter &amp; Walk-in Sales</span>
              <span class="tab-pill-count">{{ guestSettlementDispatches.length }}</span>
              <span class="tab-pill-status pill-status-settled">✓ Auto-Settled</span>
            </button>
          </div>

          <div class="text-caption text-slate-500 font-weight-medium">
            <span v-if="settlementActiveTab === 'routes'">
              🚚 Focus Mode: Settle live shop collections &amp; returns for delivery routes
            </span>
            <span v-else>
              🏪 Retail Mode: Review cash/bank walk-in counter sales
            </span>
          </div>
        </div>

        <!-- Dialog Scrollable Body (Edge-to-edge, full width, no outer card border) -->
        <v-card-text ref="settlementDialogBody" class="pa-0 flex-grow-1 overflow-y-auto bg-white rounded-0">
          <!-- If no dispatches for selected filter -->
          <div v-if="settlementDispatches.length === 0" class="text-center pa-10 bg-white">
            <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-truck-outline</v-icon>
            <div class="text-subtitle-1 font-weight-bold text-grey-darken-3">No milk dispatches found for {{ settlementFilterDisplayTitle }}</div>
            <div class="text-caption text-grey">Dispatches created in Shop Milk Dispatch for this period will appear here for return and cash collection settlement.</div>
          </div>

          <!-- Dispatches Full-Width List -->
          <div v-else class="w-100">
            <!-- 1. Single Unified Guest Customer Sales Table Section (Placed Above Other Routes) -->
            <section
              v-if="guestSettlementDispatches.length > 0 && settlementActiveTab === 'guest'"
              class="route-settlement-section w-100 bg-white border-b"
            >
              <!-- Route Section Header for Guest Sales -->
              <div
                class="route-section-separator px-5 py-2-5 bg-blue-grey-lighten-5 border-b d-flex align-center justify-space-between flex-wrap gap-2 w-100"
              >
                <div class="d-flex align-center gap-2">
                  <v-icon color="teal-darken-2" size="20">mdi-account-cash</v-icon>
                  <span class="text-caption font-weight-black text-uppercase text-blue-grey-darken-4 tracking-wide">
                    Counter Retail &amp; Guest Sales
                  </span>
                  <v-chip size="x-small" color="teal-darken-2" variant="tonal" class="font-weight-bold ms-1">
                    <v-icon start size="12">mdi-ticket-account</v-icon>
                    {{ guestSettlementDispatches.length }} Walk-in Sale{{ guestSettlementDispatches.length === 1 ? '' : 's' }}
                  </v-chip>
                </div>
                <div class="text-caption font-weight-medium text-grey-darken-2">
                  Unified Counter Sales (All walk-in retail records in 1 table)
                </div>
              </div>

              <!-- Executive Sophisticated Guest Section Card (No redundant Image 5 per-sale header bar) -->
              <div class="route-executive-card w-100">
                <!-- Tier 2: Connected Financial Ribbon for All Guest Sales (Image 4) -->
                <div class="metrics-ribbon-wrapper px-6 pb-4 pt-4">
                  <div class="metrics-ribbon">
                    <!-- 1. Volume: Milk Dispatched -->
                    <div class="ribbon-segment segment-milk">
                      <div class="segment-label">
                        <span class="segment-badge badge-sky">
                          <v-icon size="13" color="#0284c7">mdi-water-outline</v-icon>
                        </span>
                        <span>Milk Dispatched</span>
                      </div>
                      <div class="segment-value text-sky-darken-3 font-weight-black">
                        {{ formatNumber(guestSettlementTotals.milkDispatchedKg) }} <span class="segment-unit">Kg</span>
                      </div>
                      <div class="segment-sub">
                        <span v-if="guestSettlementTotals.returnMilkKg > 0" class="sub-pill pill-amber">
                          <v-icon size="11" class="me-0.5">mdi-arrow-u-left-bottom</v-icon>
                          {{ formatNumber(guestSettlementTotals.returnMilkKg) }} Kg Returned
                        </span>
                        <span v-else class="text-slate-400 font-weight-medium">0.00 Kg Returns</span>
                      </div>
                    </div>

                    <!-- 2. Today Sales Amount -->
                    <div class="ribbon-segment segment-sales">
                      <div class="segment-label">
                        <span class="segment-badge badge-primary">
                          <v-icon size="13" color="#063F78">mdi-cash-multiple</v-icon>
                        </span>
                        <span>Route Sales</span>
                      </div>
                      <div class="segment-value text-slate-900 font-weight-black">
                        {{ formatCurrency(guestSettlementTotals.totalAmount) }}
                      </div>
                      <div class="segment-sub text-slate-400 font-weight-medium">
                        Current Day Revenue
                      </div>
                    </div>

                    <!-- 3. Previous Arrears -->
                    <div class="ribbon-segment segment-prev">
                      <div class="segment-label">
                        <span class="segment-badge badge-neutral">
                          <v-icon size="13" color="#64748b">mdi-history</v-icon>
                        </span>
                        <span>Prev. Arrears</span>
                      </div>
                      <div class="segment-value text-slate-800 font-weight-bold">
                        {{ formatCurrency(guestSettlementTotals.totalPreviousArrears) }}
                      </div>
                      <div class="segment-sub text-slate-400 font-weight-medium">
                        Opening Balance
                      </div>
                    </div>

                    <!-- 4. Total Payable (Sales + Prev) -->
                    <div class="ribbon-segment segment-payable">
                      <div class="segment-label">
                        <span class="segment-badge badge-indigo">
                          <v-icon size="13" color="#4338ca">mdi-calculator-variant-outline</v-icon>
                        </span>
                        <span>Total Payable</span>
                      </div>
                      <div class="segment-value text-indigo-darken-3 font-weight-black">
                        {{ formatCurrency(guestSettlementTotals.totalPayable) }}
                      </div>
                      <div class="segment-sub text-slate-400 font-weight-medium">
                        Sales + Opening Due
                      </div>
                    </div>

                    <!-- 5. Today Collection (Hero Accent) -->
                    <div class="ribbon-segment segment-hero-collection">
                      <div class="segment-label text-emerald-800">
                        <span class="segment-badge badge-emerald">
                          <v-icon size="13" color="#059669">mdi-check-decagram</v-icon>
                        </span>
                        <span>Today Collected</span>
                      </div>
                      <div class="segment-value text-emerald-700 font-weight-black">
                        {{ formatCurrency(guestSettlementTotals.totalCollection) }}
                      </div>
                      <div class="segment-sub">
                        <span class="sub-pill pill-emerald">
                          {{ guestSettlementTotals.recoveredPct }}
                        </span>
                      </div>
                    </div>

                    <!-- 6. New Arrears (Balance Outcome) -->
                    <div
                      class="ribbon-segment"
                      :class="guestSettlementTotals.totalNewArrears > 0 ? 'segment-outcome-arrears' : 'segment-outcome-cleared'"
                    >
                      <div class="segment-label" :class="guestSettlementTotals.totalNewArrears > 0 ? 'text-rose-800' : 'text-emerald-800'">
                        <span
                          class="segment-badge"
                          :class="guestSettlementTotals.totalNewArrears > 0 ? 'badge-rose' : 'badge-emerald'"
                        >
                          <v-icon size="13" :color="guestSettlementTotals.totalNewArrears > 0 ? '#e11d48' : '#059669'">
                            {{ guestSettlementTotals.totalNewArrears > 0 ? 'mdi-alert-circle-outline' : 'mdi-shield-check' }}
                          </v-icon>
                        </span>
                        <span>Closing Arrears</span>
                      </div>
                      <div
                        class="segment-value font-weight-black"
                        :class="guestSettlementTotals.totalNewArrears > 0 ? 'text-rose-600' : 'text-emerald-700'"
                      >
                        {{ formatCurrency(guestSettlementTotals.totalNewArrears) }}
                      </div>
                      <div class="segment-sub">
                        <span
                          class="sub-pill"
                          :class="guestSettlementTotals.totalNewArrears > 0 ? 'pill-rose' : 'pill-emerald'"
                        >
                          {{ guestSettlementTotals.totalNewArrears > 0 ? 'Uncollected Balance' : 'Fully Settled' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Single Unified 1 Table for ALL Guest Customers (Image 3 & 4) -->
              <div class="w-100 overflow-x-auto border-t">
                <v-table density="compact" class="dispatch-table settlement-table w-100 border-0 rounded-0">
                  <thead>
                    <tr class="settlement-th-row">
                      <th style="min-width: 190px;">SHOP / OWNER</th>
                      <th style="min-width: 105px;" class="text-end">PRICE</th>
                      <th style="min-width: 115px;" class="text-end">SENT (KG)</th>
                      <th style="min-width: 115px;" class="text-end">RETURN (KG)</th>
                      <th style="min-width: 110px;" class="text-end">NET MILK</th>
                      <th style="min-width: 130px;" class="text-end">TODAY AMOUNT</th>
                      <th style="min-width: 120px;" class="text-end">PREV ARREARS</th>
                      <th style="min-width: 130px;" class="text-end">TOTAL PAYABLE</th>
                      <th style="min-width: 180px;" class="text-end th-collection">TODAY COLLECTION</th>
                      <th style="min-width: 125px;" class="text-end">NEW ARREARS</th>
                      <th style="min-width: 130px;" class="text-center">COLLECTION STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="d in guestSettlementDispatches"
                      :key="d.id"
                    >
                      <template v-for="it in (d.items && d.items.length > 0 ? d.items : [d])" :key="it.shopId || d.id">
                        <td>
                          <div class="font-weight-bold text-primary shop-title">
                            GUEST — {{ d.customerName || it.shopName || 'Guest Customer' }}
                          </div>
                          <div class="text-caption text-grey-darken-1 d-flex align-center gap-1">
                            <span v-if="d.token" class="font-mono font-weight-bold">#{{ d.token }}</span>
                            <span v-if="d.token && (d.customerPhone || d.paymentMethod)">•</span>
                            <span v-if="d.customerPhone">{{ d.customerPhone }}</span>
                            <span v-if="d.customerPhone && d.paymentMethod">•</span>
                            <span>{{ d.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash in Hand' }}</span>
                          </div>
                        </td>
                        <td class="text-end font-weight-medium text-slate-800 tabular-nums" style="white-space: nowrap;">
                          Rs. {{ it.price || d.rate || 0 }}
                        </td>
                        <td class="text-end font-weight-bold text-slate-900 tabular-nums" style="white-space: nowrap;">
                          <div>{{ formatNumber(it.kgs !== undefined ? it.kgs : d.totalMilk) }} Kg</div>
                        </td>
                        <td
                          class="text-end font-weight-medium tabular-nums"
                          :class="Number(it.returnKgs || d.totalReturnMilk || 0) > 0 ? 'text-orange-darken-3 font-weight-bold' : 'text-slate-500'"
                          style="white-space: nowrap;"
                        >
                          {{ formatNumber(it.returnKgs || d.totalReturnMilk || 0) }} Kg
                        </td>
                        <td class="text-end font-weight-bold text-info tabular-nums" style="white-space: nowrap;">
                          {{ formatNumber(it.todayMilk !== undefined ? it.todayMilk : d.totalMilk) }} Kg
                        </td>
                        <td class="text-end font-weight-bold text-slate-900 tabular-nums" style="white-space: nowrap;">
                          {{ formatCurrency(it.todayAmount !== undefined ? it.todayAmount : d.totalAmount) }}
                        </td>
                        <td class="text-end text-slate-700 font-weight-medium tabular-nums" style="white-space: nowrap;">
                          {{ formatCurrency(it.previousArrears || 0) }}
                        </td>
                        <td class="text-end font-weight-bold text-slate-900 tabular-nums" style="white-space: nowrap;">
                          {{ formatCurrency(it.totalPayable !== undefined ? it.totalPayable : d.totalAmount) }}
                        </td>
                        <td class="text-end font-weight-bold text-success tabular-nums" style="white-space: nowrap;">
                          {{ formatCurrency(it.todayCollection !== undefined ? it.todayCollection : d.totalCollection) }}
                        </td>
                        <td
                          class="text-end font-weight-bold tabular-nums"
                          :class="(it.newArrears || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'"
                          style="white-space: nowrap;"
                        >
                          {{ formatCurrency(it.newArrears || 0) }}
                        </td>
                        <td class="text-center">
                          <span
                            class="erp-tag"
                            :class="getCollectionStatusTagClass(it)"
                          >
                            {{ getCollectionStatusLabel(it) }}
                          </span>
                        </td>
                      </template>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="settlement-tfoot-row font-weight-black text-body-2 border-t">
                      <td class="text-uppercase font-weight-black text-slate-800">
                        GUEST CUSTOMER SALES TOTALS:
                      </td>
                      <td class="text-end text-grey-darken-1">-</td>
                      <td class="text-end text-slate-900 tabular-nums" style="white-space: nowrap;">
                        {{ formatNumber(guestSettlementTotals.milkDispatchedKg) }} Kg
                      </td>
                      <td class="text-end text-orange-darken-3 tabular-nums" style="white-space: nowrap;">
                        {{ formatNumber(guestSettlementTotals.returnMilkKg) }} Kg
                      </td>
                      <td class="text-end text-info tabular-nums" style="white-space: nowrap;">
                        {{ formatNumber(guestSettlementTotals.totalMilk) }} Kg
                      </td>
                      <td class="text-end text-slate-900 tabular-nums" style="white-space: nowrap;">
                        {{ formatCurrency(guestSettlementTotals.totalAmount) }}
                      </td>
                      <td class="text-end text-slate-700 tabular-nums" style="white-space: nowrap;">
                        {{ formatCurrency(guestSettlementTotals.totalPreviousArrears) }}
                      </td>
                      <td class="text-end text-slate-900 tabular-nums" style="white-space: nowrap;">
                        {{ formatCurrency(guestSettlementTotals.totalPayable) }}
                      </td>
                      <td class="text-end text-emerald-700 tfoot-collection tabular-nums" style="white-space: nowrap; font-size: 0.95rem;">
                        {{ formatCurrency(guestSettlementTotals.totalCollection) }}
                      </td>
                      <td class="text-end tabular-nums" :class="guestSettlementTotals.totalNewArrears > 0 ? 'text-rose-600' : 'text-emerald-700'" style="white-space: nowrap;">
                        {{ formatCurrency(guestSettlementTotals.totalNewArrears) }}
                      </td>
                      <td class="text-center">
                        <span
                          class="erp-tag"
                          :class="guestSettlementTotals.totalNewArrears > 0 ? 'erp-tag-orange' : 'erp-tag-green'"
                        >
                          {{ guestSettlementTotals.totalNewArrears > 0 ? 'PARTIAL' : 'SETTLED' }}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </v-table>

                <!-- Under-Table Action Bar for Guest Sales -->
                <div class="px-6 py-3 bg-grey-lighten-5 border-t d-flex align-center justify-space-between flex-wrap gap-3">
                  <div class="text-caption text-grey-darken-1 d-flex align-center gap-2">
                    <v-icon size="16" color="teal-darken-2">mdi-check-circle-outline</v-icon>
                    <span>All <strong>{{ guestSettlementDispatches.length }}</strong> walk-in counter guest sales recorded in 1 table. Milk returns and cash refunds are managed via Masters / Milk Dispatch.</span>
                  </div>
                  <div class="d-flex align-center gap-2 ms-auto">
                    <v-btn
                      variant="outlined"
                      size="small"
                      color="primary"
                      prepend-icon="mdi-pencil-box-outline"
                      to="/masters/dispatches"
                      class="text-capitalize font-weight-bold"
                    >
                      Manage in Dispatches Master
                    </v-btn>
                    <v-chip
                      color="success"
                      variant="tonal"
                      class="font-weight-bold px-4"
                    >
                      <v-icon start size="16">mdi-check-decagram</v-icon>
                      Counter Sales Settled
                    </v-chip>
                  </div>
                </div>
              </div>
            </section>

            <!-- 2. Regular Route Dispatches Section (Placed Below Guest Customer, with Next Route Stepper) -->
            <section
              v-if="regularSettlementDispatches.length > 0 && settlementActiveTab === 'routes'"
              class="route-settlement-section w-100 bg-white"
            >
              <!-- Route Stepper Header with Interactive Route Cards -->
              <div
                v-if="regularSettlementDispatches.length > 1"
                class="route-stepper-header px-6 py-4 bg-slate-50 border-b d-flex align-center justify-space-between flex-wrap gap-3 w-100"
              >
                <!-- Left: Route Cards Carousel -->
                <div class="d-flex align-center gap-2 flex-wrap">
                  <div
                    v-for="(r, idx) in regularSettlementDispatches"
                    :key="r.id"
                    class="route-nav-card"
                    :class="{
                      'is-active': activeRouteIndex === idx,
                      'is-dispatched': r.status === 'Dispatched',
                      'is-settled': r.status !== 'Dispatched',
                    }"
                    @click="setActiveRouteIndex(idx)"
                  >
                    <div class="nav-card-num">R{{ idx + 1 }}</div>
                    <div class="nav-card-info">
                      <div class="nav-card-title">{{ r.areaName }}</div>
                      <div class="nav-card-sub">
                        <span>{{ (r.items || []).length }} Shops</span>
                        <span class="nav-card-dot">•</span>
                        <span :class="r.status === 'Dispatched' ? 'text-amber-800 font-weight-bold' : 'text-emerald-800 font-weight-bold'">
                          {{ r.status === 'Dispatched' ? 'Pending' : 'Settled' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Right: Route Stepper (Prev / Next Route Buttons) -->
                <div class="d-flex align-center gap-2 flex-wrap">
                  <span class="text-caption font-weight-bold text-slate-500 me-1">
                    Route {{ activeRouteIndex + 1 }} of {{ regularSettlementDispatches.length }}
                  </span>
                  <!-- Previous Route Button -->
                  <v-btn
                    height="38"
                    variant="outlined"
                    color="primary"
                    class="route-nav-btn text-capitalize font-weight-bold rounded-lg px-3 bg-white"
                    prepend-icon="mdi-chevron-left"
                    :disabled="activeRouteIndex <= 0"
                    @click="prevRegularRoute"
                  >
                    Previous Route
                  </v-btn>

                  <!-- Next Route Button -->
                  <v-btn
                    height="38"
                    variant="flat"
                    color="primary"
                    class="route-nav-btn text-capitalize font-weight-bold rounded-lg px-4 shadow-sm"
                    append-icon="mdi-chevron-right"
                    :disabled="activeRouteIndex >= regularSettlementDispatches.length - 1"
                    @click="nextRegularRoute"
                  >
                    Next Route {{ activeRouteIndex + 1 < regularSettlementDispatches.length ? `(${regularSettlementDispatches[activeRouteIndex + 1]?.areaName})` : '' }}
                  </v-btn>
                </div>
              </div>

              <!-- Route Card(s) Rendering -->
              <div
                v-for="(d, loopIdx) in displayedRegularDispatches"
                :key="d.id"
                class="route-card-container w-100"
                :class="{ 'border-t-2': loopIdx > 0 }"
              >
                <!-- Executive Sophisticated Route Section Card -->
                <div class="route-executive-card w-100">
                <!-- Tier 1: Identity & Action Command Bar -->
                <div
                  class="route-command-bar d-flex align-center justify-space-between flex-wrap gap-3 px-6 py-3.5"
                  :class="d.status === 'Dispatched' ? 'status-dispatched-bar' : 'status-settled-bar'"
                >
                  <!-- Left: Route Identity, Live Status & Crew Capsule -->
                  <div class="d-flex align-center gap-3 flex-wrap">
                    <div class="route-identity-block d-flex align-center gap-2">
                      <span v-if="regularSettlementDispatches.length > 1" class="route-index-badge">
                        Route {{ (settlementRouteViewMode === 'stepper' && regularSettlementDispatches.length > 1 ? activeRouteIndex : loopIdx) + 1 }}
                      </span>
                      <div class="route-pin-avatar">
                        <v-icon size="17" color="primary">mdi-map-marker-radius</v-icon>
                      </div>
                      <span class="route-area-title">
                        {{ d.areaName }}
                      </span>
                    </div>

                    <!-- Route Date Badge -->
                    <div class="route-date-pill">
                      <v-icon size="14" color="primary">mdi-calendar-text-outline</v-icon>
                      <span>{{ formatDate(d.date) }}</span>
                    </div>

                    <!-- Route Status Pill -->
                    <div
                      class="route-status-pill"
                      :class="d.status === 'Dispatched' ? 'status-delivery-out' : 'status-settled'"
                    >
                      <span class="status-live-dot"></span>
                      <span>{{ d.status === 'Dispatched' ? 'Delivery Out • Pending Settlement' : 'Returned & Settle Completed' }}</span>
                    </div>

                    <!-- Structured Meta Group -->
                    <div class="route-meta-group d-inline-flex align-center gap-2">
                      <!-- Vehicle -->
                      <div class="route-meta-pill pill-vehicle">
                        <v-icon size="14" class="meta-icon">mdi-truck-outline</v-icon>
                        <strong class="meta-val">{{ d.vehicleNumber }}</strong>
                      </div>

                      <!-- Driver & Assistant -->
                      <div class="route-meta-pill pill-crew">
                        <v-icon size="14" class="meta-icon">mdi-steering</v-icon>
                        <span class="meta-lbl">Driver:</span>
                        <strong class="meta-val">{{ d.driverName }}</strong>
                        <template v-if="d.calanderName">
                          <span class="meta-dot">•</span>
                          <v-icon size="14" class="meta-icon">mdi-account-tie-outline</v-icon>
                          <span class="meta-lbl">Calander:</span>
                          <strong class="meta-val">{{ d.calanderName }}</strong>
                        </template>
                      </div>

                      <!-- Shop Count -->
                      <div class="route-meta-pill pill-shops">
                        <v-icon size="14" class="meta-icon">mdi-storefront-outline</v-icon>
                        <strong class="meta-val">{{ (d.items || []).length }}</strong>
                        <span class="meta-lbl ms-1">{{ (d.items || []).length === 1 ? 'Shop' : 'Shops' }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Right: Action Center -->
                  <div class="d-flex align-center gap-2">
                    <v-btn
                      v-if="d.status === 'Dispatched' && !inspection?.isClosed"
                      color="warning"
                      variant="flat"
                      size="small"
                      class="text-capitalize font-weight-bold shadow-sm"
                      prepend-icon="mdi-truck-check"
                      :loading="savingDispatchId === d.id"
                      @click="saveInlineDispatchSettlement(d)"
                    >
                      Mark Back Route
                    </v-btn>
                    <v-btn
                      v-if="authStore.isAdmin && settingsStore.settings.allowDeleteDispatch !== false && !inspection?.isClosed"
                      icon="mdi-delete"
                      size="small"
                      variant="text"
                      color="error"
                      title="Delete Dispatch (Admin)"
                      @click="confirmDeleteDispatchFromClosing(d)"
                    />
                  </div>
                </div>

                <!-- Tier 2: Connected Financial Ribbon -->
                <div class="metrics-ribbon-wrapper px-6 pb-4 pt-4">
                  <div class="metrics-ribbon">
                    <!-- 1. Volume: Milk Dispatched -->
                    <div class="ribbon-segment segment-milk">
                      <div class="segment-label">
                        <span class="segment-badge badge-sky">
                          <v-icon size="13" color="#0284c7">mdi-water-outline</v-icon>
                        </span>
                        <span>Milk Dispatched</span>
                      </div>
                      <div class="segment-value text-sky-darken-3 font-weight-black">
                        {{ formatNumber(d.totalMilk) }} <span class="segment-unit">Kg</span>
                      </div>
                      <div class="segment-sub">
                        <span v-if="(d.totalReturnMilk || 0) > 0" class="sub-pill pill-amber">
                          <v-icon size="11" class="me-0.5">mdi-arrow-u-left-bottom</v-icon>
                          {{ formatNumber(d.totalReturnMilk) }} Kg Returned
                        </span>
                        <span v-else class="text-slate-400 font-weight-medium">0.00 Kg Returns</span>
                      </div>
                    </div>

                    <!-- 2. Today Sales Amount -->
                    <div class="ribbon-segment segment-sales">
                      <div class="segment-label">
                        <span class="segment-badge badge-primary">
                          <v-icon size="13" color="#063F78">mdi-cash-multiple</v-icon>
                        </span>
                        <span>Route Sales</span>
                      </div>
                      <div class="segment-value text-slate-900 font-weight-black">
                        {{ formatCurrency(d.totalAmount) }}
                      </div>
                      <div class="segment-sub text-slate-400 font-weight-medium">
                        Current Day Revenue
                      </div>
                    </div>

                    <!-- 3. Previous Arrears -->
                    <div class="ribbon-segment segment-prev">
                      <div class="segment-label">
                        <span class="segment-badge badge-neutral">
                          <v-icon size="13" color="#64748b">mdi-history</v-icon>
                        </span>
                        <span>Prev. Arrears</span>
                      </div>
                      <div class="segment-value text-slate-800 font-weight-bold">
                        {{ formatCurrency(d.totalPreviousArrears) }}
                      </div>
                      <div class="segment-sub text-slate-400 font-weight-medium">
                        Opening Balance
                      </div>
                    </div>

                    <!-- 4. Total Payable (Sales + Prev) -->
                    <div class="ribbon-segment segment-payable">
                      <div class="segment-label">
                        <span class="segment-badge badge-indigo">
                          <v-icon size="13" color="#4338ca">mdi-calculator-variant-outline</v-icon>
                        </span>
                        <span>Total Payable</span>
                      </div>
                      <div class="segment-value text-indigo-darken-3 font-weight-black">
                        {{ formatCurrency((d.totalAmount || 0) + (d.totalPreviousArrears || 0)) }}
                      </div>
                      <div class="segment-sub text-slate-400 font-weight-medium">
                        Sales + Opening Due
                      </div>
                    </div>

                    <!-- 5. Today Collection (Hero Accent) -->
                    <div class="ribbon-segment segment-hero-collection">
                      <div class="segment-label text-emerald-800">
                        <span class="segment-badge badge-emerald">
                          <v-icon size="13" color="#059669">mdi-check-decagram</v-icon>
                        </span>
                        <span>Today Collected</span>
                      </div>
                      <div class="segment-value text-emerald-700 font-weight-black">
                        {{ formatCurrency(d.totalCollection) }}
                      </div>
                      <div class="segment-sub">
                        <span class="sub-pill pill-emerald">
                          {{ getRouteCollectionPercentage(d) }}
                        </span>
                      </div>
                    </div>

                    <!-- 6. New Arrears (Balance Outcome) -->
                    <div
                      class="ribbon-segment"
                      :class="(d.totalNewArrears || 0) > 0 ? 'segment-outcome-arrears' : 'segment-outcome-cleared'"
                    >
                      <div class="segment-label" :class="(d.totalNewArrears || 0) > 0 ? 'text-rose-800' : 'text-emerald-800'">
                        <span
                          class="segment-badge"
                          :class="(d.totalNewArrears || 0) > 0 ? 'badge-rose' : 'badge-emerald'"
                        >
                          <v-icon size="13" :color="(d.totalNewArrears || 0) > 0 ? '#e11d48' : '#059669'">
                            {{ (d.totalNewArrears || 0) > 0 ? 'mdi-alert-circle-outline' : 'mdi-shield-check' }}
                          </v-icon>
                        </span>
                        <span>Closing Arrears</span>
                      </div>
                      <div
                        class="segment-value font-weight-black"
                        :class="(d.totalNewArrears || 0) > 0 ? 'text-rose-600' : 'text-emerald-700'"
                      >
                        {{ formatCurrency(d.totalNewArrears) }}
                      </div>
                      <div class="segment-sub">
                        <span
                          class="sub-pill"
                          :class="(d.totalNewArrears || 0) > 0 ? 'pill-rose' : 'pill-emerald'"
                        >
                          {{ (d.totalNewArrears || 0) > 0 ? 'Uncollected Balance' : 'Fully Settled' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Full-width Shop-by-Shop Breakdown Table -->
              <div class="w-100 overflow-x-auto border-t">
                <v-table density="compact" class="dispatch-table settlement-table w-100 border-0 rounded-0">
                  <thead>
                    <tr class="settlement-th-row">
                      <th style="min-width: 190px;">SHOP / OWNER</th>
                      <th style="min-width: 105px;" class="text-end">PRICE</th>
                      <th style="min-width: 115px;" class="text-end">SENT (KG)</th>
                      <th style="min-width: 115px;" class="text-end">RETURN (KG)</th>
                      <th style="min-width: 110px;" class="text-end">NET MILK</th>
                      <th style="min-width: 130px;" class="text-end">TODAY AMOUNT</th>
                      <th style="min-width: 120px;" class="text-end">PREV ARREARS</th>
                      <th style="min-width: 130px;" class="text-end">TOTAL PAYABLE</th>
                      <th style="min-width: 180px;" class="text-end th-collection">TODAY COLLECTION</th>
                      <th style="min-width: 125px;" class="text-end">NEW ARREARS</th>
                      <th style="min-width: 130px;" class="text-center">COLLECTION STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(it, itIdx) in getFilteredRouteItems(d)" :key="it.shopId || it.shopCode || itIdx">
                      <td>
                        <div class="font-weight-bold text-primary shop-title">{{ it.shopCode }} — {{ it.shopName }}</div>
                        <div class="text-caption text-grey-darken-1">{{ it.ownerName }}</div>
                      </td>
                      <td :class="['text-end', { 'editable-cell-highlight': !inspection?.isClosed }]">
                        <v-text-field
                          v-model.number="it.price"
                          type="number"
                          min="0"
                          density="compact"
                          variant="outlined"
                          hide-details
                          class="editable-input price-input"
                          style="min-width: 90px;"
                          :disabled="Boolean(inspection?.isClosed)"
                          :readonly="Boolean(inspection?.isClosed)"
                          @update:model-value="(val) => onInlineItemChange(d, it, 'price', val)"
                        />
                      </td>
                      <td class="text-end font-weight-bold text-slate-900 tabular-nums" style="white-space: nowrap;">
                        <div>{{ formatNumber(it.kgs) }} Kg</div>
                        <div v-if="Number(it.cans) > 0" class="text-caption text-slate-500">
                          ({{ formatNumber(it.cans) }} Cans)
                        </div>
                      </td>
                      <td :class="['text-end', { 'editable-cell-highlight': !inspection?.isClosed }]">
                        <v-text-field
                          v-model.number="it.returnKgs"
                          type="number"
                          min="0"
                          :max="it.kgs"
                          density="compact"
                          variant="outlined"
                          hide-details
                          class="editable-input return-input font-weight-bold"
                          style="min-width: 95px;"
                          :disabled="Boolean(inspection?.isClosed)"
                          :readonly="Boolean(inspection?.isClosed)"
                          @update:model-value="(val) => onInlineItemChange(d, it, 'returnKgs', val)"
                        />
                      </td>
                      <td class="text-end font-weight-bold text-info tabular-nums" style="white-space: nowrap;">
                        {{ formatNumber(it.todayMilk) }} Kg
                      </td>
                      <td class="text-end font-weight-bold text-slate-900 tabular-nums" style="white-space: nowrap;">
                        {{ formatCurrency(it.todayAmount) }}
                      </td>
                      <td class="text-end text-slate-700 font-weight-medium tabular-nums" style="white-space: nowrap;">
                        {{ formatCurrency(it.previousArrears) }}
                      </td>
                      <td class="text-end font-weight-bold text-slate-900 tabular-nums" style="white-space: nowrap;">
                        {{ formatCurrency(it.totalPayable) }}
                      </td>
                      <td :class="['text-end', { 'editable-cell-highlight bg-green-lighten-5': !inspection?.isClosed }]">
                        <div class="d-flex align-center gap-1.5 justify-end">
                          <v-text-field
                            v-model.number="it.todayCollection"
                            type="number"
                            min="0"
                            density="compact"
                            variant="outlined"
                            hide-details
                            class="editable-input collection-input font-weight-bold text-success"
                            style="min-width: 110px;"
                            :disabled="Boolean(inspection?.isClosed)"
                            :readonly="Boolean(inspection?.isClosed)"
                            @update:model-value="(val) => onInlineItemChange(d, it, 'todayCollection', val)"
                          />
                          <button
                            v-if="!inspection?.isClosed && (Number(it.todayCollection) || 0) < (Number(it.totalPayable) || 0)"
                            type="button"
                            class="quick-paid-full-chip"
                            title="Quick 1-Click Paid in Full"
                            @click="collectFullPayableInline(d, it)"
                          >
                            <v-icon size="13">mdi-check</v-icon>
                            <span>Full</span>
                          </button>
                          <span
                            v-else-if="(Number(it.todayCollection) || 0) >= (Number(it.totalPayable) || 0) && (Number(it.totalPayable) || 0) > 0"
                            class="quick-paid-check"
                            title="Paid in Full"
                          >
                            <v-icon size="18" color="success">mdi-check-circle</v-icon>
                          </span>
                        </div>
                      </td>
                      <td
                        class="text-end font-weight-bold tabular-nums"
                        :class="it.newArrears > 0 ? 'text-rose-600' : 'text-emerald-600'"
                        style="white-space: nowrap;"
                      >
                        {{ formatCurrency(it.newArrears) }}
                      </td>
                      <td class="text-center">
                        <span
                          class="erp-tag"
                          :class="getCollectionStatusTagClass(it)"
                        >
                          {{ getCollectionStatusLabel(it) }}
                        </span>
                      </td>
                    </tr>
                    <tr v-if="getFilteredRouteItems(d).length === 0">
                      <td colspan="11" class="text-center pa-6 text-grey">
                        <v-icon size="24" color="grey" class="mb-1">mdi-storefront-remove-outline</v-icon>
                        <div v-if="routeShopSearch">No shops match the search filter "{{ routeShopSearch }}".</div>
                        <div v-else>No shop items recorded for this route dispatch.</div>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot v-if="d.items && d.items.length > 0">
                    <tr class="settlement-tfoot-row font-weight-black text-body-2 border-t">
                      <td class="text-uppercase font-weight-black text-slate-800">
                        {{ regularSettlementDispatches.length > 1 ? `ROUTE #${(settlementRouteViewMode === 'stepper' && regularSettlementDispatches.length > 1 ? activeRouteIndex : loopIdx) + 1} (${d.areaName}) TOTALS:` : 'GRAND TOTALS:' }}
                      </td>
                      <td class="text-end text-grey-darken-1">-</td>
                      <td class="text-end text-slate-900 tabular-nums" style="white-space: nowrap;">{{ formatNumber(getRouteTotalSent(d)) }} Kg</td>
                      <td class="text-end text-orange-darken-3 tabular-nums" style="white-space: nowrap;">{{ formatNumber(d.totalReturnMilk || 0) }} Kg</td>
                      <td class="text-end text-info tabular-nums" style="white-space: nowrap;">{{ formatNumber(d.totalMilk) }} Kg</td>
                      <td class="text-end text-slate-900 tabular-nums" style="white-space: nowrap;">{{ formatCurrency(d.totalAmount) }}</td>
                      <td class="text-end text-slate-700 tabular-nums" style="white-space: nowrap;">{{ formatCurrency(d.totalPreviousArrears) }}</td>
                      <td class="text-end text-slate-900 tabular-nums" style="white-space: nowrap;">{{ formatCurrency((d.totalAmount || 0) + (d.totalPreviousArrears || 0)) }}</td>
                      <td class="text-end text-emerald-700 tfoot-collection tabular-nums" style="white-space: nowrap; font-size: 0.95rem;">
                        {{ formatCurrency(d.totalCollection) }}
                      </td>
                      <td class="text-end tabular-nums" :class="(d.totalNewArrears || 0) > 0 ? 'text-rose-600' : 'text-emerald-700'" style="white-space: nowrap;">
                        {{ formatCurrency(d.totalNewArrears) }}
                      </td>
                      <td class="text-center">
                        <span
                          class="erp-tag"
                          :class="d.status === 'Dispatched' ? 'erp-tag-orange' : 'erp-tag-green'"
                        >
                          {{ d.status === 'Dispatched' ? 'PENDING' : 'SETTLED' }}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </v-table>

                <!-- Under-Table Action & Remarks Bar -->
                <div class="px-6 py-3 bg-grey-lighten-5 border-t d-flex align-center justify-space-between flex-wrap gap-3">
                  <div style="flex: 1 1 340px; max-width: 520px;">
                    <v-text-field
                      v-model="d.returnNotes"
                      label="Return Remarks / Settlement Note (Optional)"
                      placeholder="e.g., 5 Kg returned unsold, cash collection settled"
                      variant="outlined"
                      density="compact"
                      hide-details
                      prepend-inner-icon="mdi-note-text-outline"
                      class="bg-white rounded-lg return-notes-field"
                      :disabled="Boolean(inspection?.isClosed)"
                      :readonly="Boolean(inspection?.isClosed)"
                      @update:model-value="() => markDispatchDirty(d.id)"
                    />
                  </div>
                  <div class="d-flex align-center gap-2 ms-auto flex-wrap">
                    <template v-if="!inspection?.isClosed">
                      <v-btn
                        size="default"
                        variant="tonal"
                        color="success"
                        class="text-capitalize font-weight-bold rounded-lg px-3 shadow-none"
                        prepend-icon="mdi-check-all"
                        @click="collectAllFullPayable(d)"
                        title="Set Today Collection to Total Payable for all shops in this route"
                      >
                        Collect All in Full
                      </v-btn>
                      <v-btn
                        color="success"
                        variant="flat"
                        size="default"
                        class="text-capitalize rounded-lg px-6 font-weight-bold shadow-sm"
                        :prepend-icon="d.status === 'Dispatched' ? 'mdi-truck-check' : 'mdi-cash-check'"
                        :loading="savingDispatchId === d.id"
                        @click="saveInlineDispatchSettlement(d)"
                      >
                        {{ d.status === 'Dispatched' ? 'Save Today Collection & Settle Route (Mark Back)' : 'Save Today Collection & Settle Route' }}
                      </v-btn>
                    </template>
                    <v-chip
                      v-else
                      color="success"
                      variant="tonal"
                      class="font-weight-bold px-4"
                    >
                      <v-icon start size="16">mdi-lock-check</v-icon>
                      Route Settled &amp; Closed
                    </v-chip>
                  </div>
                </div>
              </div>
            </div>
            </section>

            <!-- Informational notice when only guest sales exist for this date -->
            <div
              v-if="regularSettlementDispatches.length === 0 && guestSettlementDispatches.length > 0"
              class="pa-6 text-center text-grey bg-white border-t"
            >
              <v-icon size="32" color="grey-lighten-1" class="mb-1">mdi-truck-outline</v-icon>
              <div class="font-weight-medium text-caption">No vehicle delivery routes recorded for this date. (Only counter retail guest sales were recorded)</div>
            </div>
          </div>
        </v-card-text>

        <!-- Dialog Footer with Action Buttons -->
        <v-card-actions class="px-6 py-3 bg-white border-t d-flex align-center justify-space-between flex-wrap gap-2 flex-shrink-0">
          <div class="d-flex align-center gap-2 text-caption text-slate-500 font-weight-medium">
            <v-icon size="16" color="primary">mdi-shield-check-outline</v-icon>
            <span>Live Settlement Ledger • Review returned milk cans &amp; cash collections before closing day</span>
          </div>

          <div class="d-flex align-center gap-2">
            <v-btn
              variant="outlined"
              color="grey-darken-2"
              class="dialog-footer-btn px-5 text-capitalize font-weight-bold rounded-lg bg-white"
              @click="routeSettlementsDialog = false"
            >
              Close Window
            </v-btn>

            <v-btn
              v-if="!inspection?.isClosed"
              color="primary"
              variant="flat"
              class="dialog-footer-btn px-5 font-weight-bold text-capitalize rounded-lg shadow-sm"
              prepend-icon="mdi-lock-check"
              :disabled="!inspection?.canClose"
              :title="!inspection?.canClose ? (summary.arrivalsCount === 0 ? 'Day not open — record milk arrival first' : 'Mark back all dispatches before closing') : `Save all records and close ${formatDate(selectedDate)}`"
              @click="openCloseDayAllocationDialog"
            >
              Save &amp; Close Day ({{ formatDate(selectedDate) }})
            </v-btn>
            <v-chip
              v-else
              color="warning"
              variant="flat"
              class="dialog-footer-chip font-weight-black px-4 rounded-lg"
            >
              <v-icon start size="16" style="color: #0f172a !important;">mdi-lock-check</v-icon>
              Day Closed ({{ formatDate(selectedDate) }})
            </v-chip>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>



    <!-- Edit Guest Sale Dialog -->
    <EditGuestSaleDialog
      v-model="editGuestSaleDialog"
      :sale="activeGuestSaleToEdit"
      @saved="onGuestSaleUpdated"
    />

    <!-- Delete Dispatch Confirmation Dialog (Admin) -->
    <ConfirmDialog
      v-model="deleteDispatchDialog"
      title="Delete Dispatch Record"
      :message="dispatchToDelete?.dispatchType === 'guest' || dispatchToDelete?.isGuest
        ? `Are you sure you want to delete guest sale #${dispatchToDelete?.token || ''} (${dispatchToDelete?.customerName || 'Guest Customer'})?`
        : `Are you sure you want to delete dispatch for ${dispatchToDelete?.areaName} (${dispatchToDelete?.vehicleNumber})? Shop arrears balance will be rolled back.`"
      confirm-text="Delete Dispatch"
      confirm-color="error"
      :loading="deletingDispatch"
      @confirm="executeDeleteDispatchFromClosing"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { dayClosingService } from '@/services/dayClosingService';
import { dispatchService } from '@/services/dispatchService';
import { storageAdapter } from '@/services/storageAdapter';
import { calculateDispatchRow } from '@/utils/calculations';
import { useBusinessDayStore } from '@/stores/businessDay';
import { useAuthStore } from '@/stores/auth';
import { useSnackbarStore } from '@/stores/snackbar';
import { useSettingsStore } from '@/stores/settings';
import { formatCurrency, formatNumber, formatDate, formatDateTime } from '@/utils/formatters';
import StatCard from '@/components/common/StatCard.vue';
import AppDatePicker from '@/components/common/AppDatePicker.vue';
import AppDateRangePicker from '@/components/common/AppDateRangePicker.vue';
import AppPagination from '@/components/common/AppPagination.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import BulkActionsBar from '@/components/common/BulkActionsBar.vue';
import DayClosingMobileView from './DayClosingMobileView.vue';
import EditGuestSaleDialog from '@/components/dispatch/EditGuestSaleDialog.vue';

const router = useRouter();
const display = useDisplay();
const businessDayStore = useBusinessDayStore();
const authStore = useAuthStore();
const snackbar = useSnackbarStore();
const settingsStore = useSettingsStore();

const editGuestSaleDialog = ref(false);
const activeGuestSaleToEdit = ref(null);

function openEditGuestSale(d) {
  activeGuestSaleToEdit.value = d;
  editGuestSaleDialog.value = true;
}

async function onGuestSaleUpdated() {
  snackbar.success('Guest customer sale updated!');
  await Promise.all([loadInspection(), businessDayStore.refreshBusinessDay(), loadSettlementPeriodData()]);
}

const loading = ref(false);
const closingDay = ref(false);
const reopening = ref(false);
const selectedDate = ref(businessDayStore.activeBusinessDate);
const inspection = ref(null);
const closingRemarks = ref('');
const routeSettlementsDialog = ref(false);
const closeDayAllocationDialog = ref(false);
const reopenDialog = ref(false);
const reopenTargetDate = ref('');
const selectedDates = ref([]);
const pendingDeleteRows = ref([]);
const deleteStep1Dialog = ref(false);
const deleteStep2Dialog = ref(false);
const deletingClosings = ref(false);

const ledgerDateFilter = ref({ mode: 'all', from: '', to: '', date: '' });
const allocationForm = ref({
  type: 'cash',
  bankName: '',
  bankRef: '',
  cashAmount: 0,
  bankAmount: 0,
});

const page = ref(1);
const itemsPerPage = ref(10);
const ledgerFilter = ref('all');

watch([ledgerFilter, ledgerDateFilter], () => {
  page.value = 1;
  selectedDates.value = [];
});

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
const dateDispatches = computed(() => inspection.value?.dispatches || []);
const expandedDispatchIds = ref([]);

// Settlement Period & Multi-Date / Month Filter in Route Settlements Dialog
const settlementDateFilter = ref({
  mode: 'single',
  date: selectedDate.value,
  from: selectedDate.value,
  to: selectedDate.value,
  month: '',
});
const loadingSettlementPeriod = ref(false);
const periodDispatches = ref([]);
const periodSummary = ref(null);

const settlementDispatches = computed(() => {
  if (settlementDateFilter.value?.mode === 'single' && settlementDateFilter.value?.date === selectedDate.value) {
    return dateDispatches.value;
  }
  return periodDispatches.value;
});

function isGuestDispatch(d) {
  if (!d) return false;
  return (
    d.dispatchType === 'guest' ||
    d.isGuest === true ||
    (d.areaName && d.areaName.toLowerCase().includes('guest'))
  );
}

const regularSettlementDispatches = computed(() => {
  return settlementDispatches.value.filter((d) => !isGuestDispatch(d));
});

const guestSettlementDispatches = computed(() => {
  return settlementDispatches.value.filter((d) => isGuestDispatch(d));
});

// Route Stepper Navigation for Regular Routes in Route Settlements Dialog
const activeRouteIndex = ref(0);
const settlementRouteViewMode = ref('stepper'); // 'stepper' or 'all'
const settlementActiveTab = ref('routes'); // 'routes', 'guest', or 'all'
const routeShopSearch = ref('');

function getFilteredRouteItems(dispatch) {
  if (!dispatch || !dispatch.items) return [];
  if (!routeShopSearch.value || !routeShopSearch.value.trim()) {
    return dispatch.items;
  }
  const q = routeShopSearch.value.toLowerCase().trim();
  return dispatch.items.filter((it) => {
    return (
      (it.shopName && it.shopName.toLowerCase().includes(q)) ||
      (it.shopCode && it.shopCode.toLowerCase().includes(q)) ||
      (it.ownerName && it.ownerName.toLowerCase().includes(q))
    );
  });
}

function collectAllFullPayable(dispatch) {
  if (inspection.value?.isClosed) return;
  if (!dispatch || !dispatch.items) return;
  dispatch.items.forEach((it) => {
    it.todayCollection = Math.max(0, Number(it.totalPayable) || 0);
    recalcInlineDispatchRow(dispatch, it);
  });
  snackbar.success(`Collected full payable for ${dispatch.areaName || 'Route'}`);
}

function resetAllRouteCollections(dispatch) {
  if (inspection.value?.isClosed) return;
  if (!dispatch || !dispatch.items) return;
  dispatch.items.forEach((it) => {
    it.todayCollection = 0;
    recalcInlineDispatchRow(dispatch, it);
  });
  snackbar.info(`Reset collections to 0 for ${dispatch.areaName || 'Route'}`);
}

const activeRegularRoute = computed(() => {
  if (!regularSettlementDispatches.value || regularSettlementDispatches.value.length === 0) return null;
  const idx = Math.min(Math.max(0, activeRouteIndex.value), regularSettlementDispatches.value.length - 1);
  return regularSettlementDispatches.value[idx] || null;
});

const displayedRegularDispatches = computed(() => {
  if (!regularSettlementDispatches.value || regularSettlementDispatches.value.length === 0) return [];
  if (settlementRouteViewMode.value === 'all' || regularSettlementDispatches.value.length <= 1) {
    return regularSettlementDispatches.value.filter(Boolean);
  }
  return activeRegularRoute.value ? [activeRegularRoute.value] : [];
});

const settlementDialogBody = ref(null);

function scrollToSettlementTop() {
  nextTick(() => {
    if (settlementDialogBody.value?.$el) {
      settlementDialogBody.value.$el.scrollTop = 0;
    } else if (settlementDialogBody.value) {
      settlementDialogBody.value.scrollTop = 0;
    }
  });
}

function nextRegularRoute() {
  if (activeRouteIndex.value < regularSettlementDispatches.value.length - 1) {
    activeRouteIndex.value++;
    routeShopSearch.value = '';
    scrollToSettlementTop();
  }
}

function prevRegularRoute() {
  if (activeRouteIndex.value > 0) {
    activeRouteIndex.value--;
    routeShopSearch.value = '';
    scrollToSettlementTop();
  }
}

function setActiveRouteIndex(idx) {
  if (idx >= 0 && idx < regularSettlementDispatches.value.length) {
    activeRouteIndex.value = idx;
    routeShopSearch.value = '';
    scrollToSettlementTop();
  }
}

watch(regularSettlementDispatches, (newList) => {
  if (!newList || newList.length === 0) {
    activeRouteIndex.value = 0;
  } else if (activeRouteIndex.value >= newList.length) {
    activeRouteIndex.value = Math.max(0, newList.length - 1);
  }
});

const guestSettlementTotals = computed(() => {
  let milkDispatchedKg = 0;
  let returnMilkKg = 0;
  let totalAmount = 0;
  let totalPreviousArrears = 0;
  let totalCollection = 0;
  let totalNewArrears = 0;

  for (const d of guestSettlementDispatches.value) {
    const it = (d.items && d.items[0]) || d;
    const sent = Math.max(0, Number(it.kgs !== undefined ? it.kgs : d.totalMilk) || 0);
    const ret = Math.max(0, Number(it.returnKgs !== undefined ? it.returnKgs : d.totalReturnMilk) || 0);
    const net = Math.max(0, Number(it.todayMilk !== undefined ? it.todayMilk : d.totalMilk) || 0);
    const amt = Math.max(0, Number(it.todayAmount !== undefined ? it.todayAmount : d.totalAmount) || 0);
    const prev = Math.max(0, Number(it.previousArrears !== undefined ? it.previousArrears : d.totalPreviousArrears) || 0);
    const coll = Math.max(0, Number(it.todayCollection !== undefined ? it.todayCollection : d.totalCollection) || 0);
    const arr = Math.max(0, Number(it.newArrears !== undefined ? it.newArrears : d.totalNewArrears) || 0);

    milkDispatchedKg += sent;
    returnMilkKg += ret;
    totalAmount += amt;
    totalPreviousArrears += prev;
    totalCollection += coll;
    totalNewArrears += arr;
  }

  const totalPayable = totalAmount + totalPreviousArrears;
  const recoveredPct = totalPayable > 0 ? ((totalCollection / totalPayable) * 100).toFixed(1) : '100';

  return {
    milkDispatchedKg: Number(milkDispatchedKg.toFixed(2)),
    returnMilkKg: Number(returnMilkKg.toFixed(2)),
    totalMilk: Number((milkDispatchedKg - returnMilkKg).toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    totalPreviousArrears: Number(totalPreviousArrears.toFixed(2)),
    totalPayable: Number(totalPayable.toFixed(2)),
    totalCollection: Number(totalCollection.toFixed(2)),
    totalNewArrears: Number(totalNewArrears.toFixed(2)),
    recoveredPct: `${recoveredPct}% of Total Due Recovered`,
  };
});

const hasDirtyGuestDispatches = computed(() => {
  return guestSettlementDispatches.value.some((d) => dirtyDispatchIds.value.has(d.id));
});

const savingGuestDispatches = ref(false);

function resetGuestDispatchesChanges() {
  for (const d of guestSettlementDispatches.value) {
    if (dirtyDispatchIds.value.has(d.id)) {
      resetDispatchChanges(d);
    }
  }
}

async function saveAllGuestDispatches() {
  savingGuestDispatches.value = true;
  try {
    for (const d of guestSettlementDispatches.value) {
      if (dirtyDispatchIds.value.has(d.id)) {
        await dispatchService.updateDispatch(d.id, {
          header: {
            date: d.date,
            dispatchType: 'guest',
            token: d.token,
            customerName: d.customerName,
            customerPhone: d.customerPhone,
            paymentMethod: d.paymentMethod,
            returnNotes: (d.returnNotes || '').trim(),
          },
          items: d.items || [],
          status: 'Returned',
        });
        originalDispatchItems.set(d.id, JSON.parse(JSON.stringify(d.items || [])));
        unmarkDispatchDirty(d.id);
      }
    }
    snackbar.success('Guest customer sales collections & settlements saved!');
    await Promise.all([loadInspection(), businessDayStore.refreshBusinessDay(), loadSettlementPeriodData()]);
  } catch (err) {
    snackbar.error(err.message || 'Failed to save guest sales settlements');
  } finally {
    savingGuestDispatches.value = false;
  }
}

const activeSettlementSummary = computed(() => {
  const dispatches = settlementDispatches.value;
  let milkDispatchedKg = 0;
  let totalDispatchAmount = 0;
  let totalCollection = 0;

  for (const d of dispatches) {
    milkDispatchedKg += (Number(d.totalMilk) || 0) + (Number(d.totalReturnMilk) || 0);
    totalDispatchAmount += Number(d.totalAmount) || 0;
    totalCollection += Number(d.totalCollection) || 0;
  }

  const baseSummary =
    settlementDateFilter.value?.mode === 'single' && settlementDateFilter.value?.date === selectedDate.value
      ? summary.value
      : periodSummary.value || summary.value;

  const totalExpenses = Number(baseSummary.totalExpenses) || 0;

  return {
    ...baseSummary,
    milkDispatchedKg,
    totalDispatchAmount,
    totalCollection,
    totalExpenses,
    netCashFlow: totalCollection - totalExpenses,
    dispatchesCount: dispatches.length,
  };
});

const currentMonthLabel = computed(() => {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const now = new Date();
  return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
});

const settlementFilterDisplayTitle = computed(() => {
  const f = settlementDateFilter.value;
  if (!f || f.mode === 'all') return 'All Historical Routes';
  if (f.mode === 'month' && f.month) return f.month;
  if (f.mode === 'single' && f.date) return formatDate(f.date);
  if (f.from && f.to) {
    if (f.from === f.to) return formatDate(f.from);
    return `${formatDate(f.from)} – ${formatDate(f.to)}`;
  }
  if (f.from) return `From ${formatDate(f.from)}`;
  return formatDate(selectedDate.value);
});

const settlementFilterLabel = computed(() => {
  const f = settlementDateFilter.value;
  if (!f || f.mode === 'all') return 'All Historical Dates';
  if (f.mode === 'month' && f.month) return `Month of ${f.month}`;
  if (f.mode === 'single' && f.date) return `Date: ${formatDate(f.date)}`;
  if (f.from && f.to) return `${formatDate(f.from)} to ${formatDate(f.to)}`;
  return '';
});

function applySettlementPreset(preset) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  if (preset === 'today') {
    settlementDateFilter.value = {
      mode: 'single',
      date: todayStr,
      from: todayStr,
      to: todayStr,
      month: '',
    };
  } else if (preset === 'working_day') {
    const activeDate = selectedDate.value || businessDayStore.activeBusinessDate;
    settlementDateFilter.value = {
      mode: 'single',
      date: activeDate,
      from: activeDate,
      to: activeDate,
      month: '',
    };
  } else if (preset === 'this_month') {
    const lastDay = new Date(y, today.getMonth() + 1, 0).getDate();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    settlementDateFilter.value = {
      mode: 'month',
      month: `${monthNames[today.getMonth()]} ${y}`,
      from: `${y}-${m}-01`,
      to: `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
      date: '',
    };
  } else if (preset === 'all') {
    settlementDateFilter.value = { mode: 'all', from: '', to: '', date: '', month: '' };
  }
  onSettlementFilterChange();
}

function isSettlementPresetActive(preset) {
  const f = settlementDateFilter.value;
  if (!f) return false;
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;
  const targetWorkingDay = selectedDate.value || businessDayStore.activeBusinessDate;

  if (preset === 'working_day') {
    if (f.mode === 'single' && (f.date === targetWorkingDay || f.from === targetWorkingDay)) return true;
    if (f.mode === 'range' && f.from === targetWorkingDay && f.to === targetWorkingDay) return true;
    return false;
  }
  if (preset === 'today') {
    if (f.mode === 'single' && (f.date === todayStr || f.from === todayStr)) return true;
    if (f.mode === 'range' && f.from === todayStr && f.to === todayStr) return true;
    return false;
  }
  if (preset === 'this_month') {
    const firstDay = `${y}-${m}-01`;
    return (f.mode === 'month' && f.from === firstDay) || (f.from === firstDay && f.to?.startsWith(`${y}-${m}`));
  }
  if (preset === 'all') {
    return f.mode === 'all';
  }
  return false;
}

async function loadSettlementPeriodData() {
  const filter = settlementDateFilter.value;
  if (!filter || filter.mode === 'all') {
    loadingSettlementPeriod.value = true;
    try {
      const allDispatches = await storageAdapter.getCollection('dispatches', [], 'date', 'desc');
      const allExpenses = await storageAdapter.getCollection('expenses');
      const totalExpenses = allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const dispatchesWithItems = await Promise.all(
        allDispatches.map(async (d) => {
          const items = await storageAdapter.getSubcollection('dispatches', d.id, 'items');
          return { ...d, items: items || [] };
        })
      );
      dispatchesWithItems.sort((a, b) => {
        if (a.date !== b.date) return (b.date || '').localeCompare(a.date || '');
        return (a.areaName || '').localeCompare(b.areaName || '');
      });
      dispatchesWithItems.forEach((d) => {
        prepareDispatchForInlineEdit(d);
        originalDispatchItems.set(d.id, JSON.parse(JSON.stringify(d.items || [])));
      });
      periodDispatches.value = dispatchesWithItems;
      expandedDispatchIds.value = dispatchesWithItems.map((d) => d.id);

      let milkDispatchedKg = 0;
      let totalDispatchAmount = 0;
      let totalCollection = 0;
      for (const d of dispatchesWithItems) {
        milkDispatchedKg += (Number(d.totalMilk) || 0) + (Number(d.totalReturnMilk) || 0);
        totalDispatchAmount += Number(d.totalAmount) || 0;
        totalCollection += Number(d.totalCollection) || 0;
      }
      periodSummary.value = {
        milkDispatchedKg,
        totalDispatchAmount,
        totalCollection,
        totalExpenses,
        netCashFlow: totalCollection - totalExpenses,
        dispatchesCount: dispatchesWithItems.length,
      };
    } catch (err) {
      console.error(err);
      snackbar.error('Failed to load dispatches');
    } finally {
      loadingSettlementPeriod.value = false;
    }
    return;
  }

  if (filter.mode === 'single' && filter.date) {
    if (filter.date !== selectedDate.value) {
      selectedDate.value = filter.date;
      await loadInspection();
    }
    periodDispatches.value = inspection.value?.dispatches || [];
    periodSummary.value = inspection.value?.summary || defaultSummary;
    expandedDispatchIds.value = periodDispatches.value.map((d) => d.id);
    return;
  }

  // Month or Range mode
  const from = filter.from;
  const to = filter.to || filter.from;
  if (!from) return;

  loadingSettlementPeriod.value = true;
  try {
    const allDispatches = await storageAdapter.getCollection('dispatches', [], 'date', 'desc');
    const filtered = allDispatches.filter((d) => {
      if (!d.date) return false;
      if (from && to) return d.date >= from && d.date <= to;
      if (from) return d.date >= from;
      return true;
    });

    const allExpenses = await storageAdapter.getCollection('expenses');
    const periodExpenses = allExpenses.filter((e) => {
      if (!e.date) return false;
      if (from && to) return e.date >= from && e.date <= to;
      if (from) return e.date >= from;
      return true;
    });
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const dispatchesWithItems = await Promise.all(
      filtered.map(async (d) => {
        const items = await storageAdapter.getSubcollection('dispatches', d.id, 'items');
        return { ...d, items: items || [] };
      })
    );

    dispatchesWithItems.sort((a, b) => {
      if (a.date !== b.date) return (b.date || '').localeCompare(a.date || '');
      return (a.areaName || '').localeCompare(b.areaName || '');
    });

    dispatchesWithItems.forEach((d) => {
      prepareDispatchForInlineEdit(d);
      originalDispatchItems.set(d.id, JSON.parse(JSON.stringify(d.items || [])));
    });

    periodDispatches.value = dispatchesWithItems;
    expandedDispatchIds.value = dispatchesWithItems.map((d) => d.id);

    let milkDispatchedKg = 0;
    let totalDispatchAmount = 0;
    let totalCollection = 0;
    for (const d of dispatchesWithItems) {
      milkDispatchedKg += (Number(d.totalMilk) || 0) + (Number(d.totalReturnMilk) || 0);
      totalDispatchAmount += Number(d.totalAmount) || 0;
      totalCollection += Number(d.totalCollection) || 0;
    }
    periodSummary.value = {
      milkDispatchedKg,
      totalDispatchAmount,
      totalCollection,
      totalExpenses,
      netCashFlow: totalCollection - totalExpenses,
      dispatchesCount: dispatchesWithItems.length,
    };
  } catch (err) {
    console.error(err);
    snackbar.error('Failed to load period route data');
  } finally {
    loadingSettlementPeriod.value = false;
  }
}

async function onSettlementFilterChange() {
  await loadSettlementPeriodData();
}

function toggleExpandDispatch(id) {
  if (expandedDispatchIds.value.includes(id)) {
    expandedDispatchIds.value = expandedDispatchIds.value.filter((x) => x !== id);
  } else {
    expandedDispatchIds.value.push(id);
  }
}

async function openRouteSettlementsDialog(targetDate = null) {
  const d = (typeof targetDate === 'string' && targetDate) ? targetDate : selectedDate.value;
  selectedDate.value = d;
  settlementDateFilter.value = {
    mode: 'single',
    from: d,
    to: d,
    date: d,
    month: '',
  };
  settlementRouteViewMode.value = 'stepper';
  await loadSettlementPeriodData();

  if (regularSettlementDispatches.value.length > 0) {
    settlementActiveTab.value = 'routes';
  } else if (guestSettlementDispatches.value.length > 0) {
    settlementActiveTab.value = 'guest';
  } else {
    settlementActiveTab.value = 'routes';
  }
  routeShopSearch.value = '';

  // Find first unreturned (Dispatched) route if any and focus it
  const pendingIdx = regularSettlementDispatches.value.findIndex((r) => r.status === 'Dispatched');
  activeRouteIndex.value = pendingIdx >= 0 ? pendingIdx : 0;

  routeSettlementsDialog.value = true;
}

function getRouteTotalSent(d) {
  if (d.items && d.items.length > 0) {
    return d.items.reduce((sum, it) => sum + (Number(it.kgs ?? it.todayMilk) || 0), 0);
  }
  return (Number(d.totalMilk) || 0) + (Number(d.totalReturnMilk) || 0);
}

function getRouteCollectionPercentage(d) {
  const totalPayable = (Number(d.totalAmount) || 0) + (Number(d.totalPreviousArrears) || 0);
  const collected = Number(d.totalCollection) || 0;
  if (totalPayable <= 0) {
    return '100% Settled';
  }
  const pct = Math.min(100, Math.round((collected / totalPayable) * 100));
  return `${pct}% of Total Due Recovered`;
}

function getCollectionStatusTagClass(item) {
  const col = Number(item.todayCollection) || 0;
  const payable = Number(item.totalPayable) || 0;
  if (col >= payable && payable > 0) return 'erp-tag-green';
  if (col > 0) return 'erp-tag-blue';
  return 'erp-tag-orange';
}

function getCollectionStatusLabel(item) {
  const col = Number(item.todayCollection) || 0;
  const payable = Number(item.totalPayable) || 0;
  if (col >= payable && payable > 0) return 'PAID IN FULL';
  if (col > 0) return 'PARTIAL PAID';
  return 'NO COLLECTION';
}

// Inline Route Settlement Logic (Directly Editable Table — No Popup Dialog)
const savingDispatchId = ref(null);
const dirtyDispatchIds = ref(new Set());
const originalDispatchItems = new Map();

function markDispatchDirty(id) {
  dirtyDispatchIds.value.add(id);
}

function unmarkDispatchDirty(id) {
  dirtyDispatchIds.value.delete(id);
}

function isDispatchDirty(id) {
  return dirtyDispatchIds.value.has(id);
}

function prepareDispatchForInlineEdit(d) {
  if (!d) return;
  d.returnNotes = d.returnNotes || '';
  if (!d.items) d.items = [];
  if (isGuestDispatch(d) && d.items.length === 0) {
    d.items = [{
      shopId: `guest-${d.token || d.id}`,
      shopCode: 'GUEST',
      shopName: d.customerName || 'Guest Customer',
      ownerName: d.customerPhone || 'Counter Retail Sale',
      price: Number(d.rate) || 250,
      cans: 0,
      kgs: Number(d.totalMilk) || 0,
      returnKgs: Number(d.totalReturnMilk) || 0,
      todayMilk: Number(d.totalMilk) || 0,
      todayAmount: Number(d.totalAmount) || 0,
      previousArrears: Number(d.totalPreviousArrears) || 0,
      todayCollection: Number(d.totalCollection) || 0,
      totalPayable: Number(d.totalAmount) || 0,
      newArrears: Number(d.totalNewArrears) || 0,
    }];
  }
  d.items.forEach((it) => {
    it.price = Number(it.price) || 0;
    it.cans = Number(it.cans) || 0;
    it.kgs =
      it.kgs !== undefined && it.kgs !== null && Number(it.kgs) > 0
        ? Number(it.kgs)
        : Number(it.todayMilk) || 0;
    it.returnKgs = Number(it.returnKgs) || 0;
    it.todayMilk = Math.max(0, Number((it.kgs - it.returnKgs).toFixed(2)));
    it.previousArrears = Number(it.previousArrears) || 0;
    it.todayCollection = Number(it.todayCollection) || 0;
    it.todayAmount = Number((it.todayMilk * it.price).toFixed(2));
    it.totalPayable = Number((it.previousArrears + it.todayAmount).toFixed(2));
    it.newArrears = Number((it.totalPayable - it.todayCollection).toFixed(2));
  });
  recalcDispatchTotals(d);
}

function onInlineItemChange(dispatch, row, field, val) {
  if (inspection.value?.isClosed) return;
  if (val !== undefined) {
    row[field] = Math.max(0, Number(val) || 0);
  }
  recalcInlineDispatchRow(dispatch, row);
}

function collectFullPayableInline(dispatch, row) {
  if (inspection.value?.isClosed) return;
  row.todayCollection = Math.max(0, Number(row.totalPayable) || 0);
  recalcInlineDispatchRow(dispatch, row);
}

function recalcInlineDispatchRow(dispatch, row) {
  const sent = Math.max(0, Number(row.kgs) || 0);
  const ret = Math.max(0, Math.min(sent, Number(row.returnKgs) || 0));
  if ((Number(row.returnKgs) || 0) > sent) {
    row.returnKgs = sent;
  }
  row.returnKgs = ret;
  row.todayMilk = Math.max(0, Number((sent - ret).toFixed(2)));

  const result = calculateDispatchRow({
    price: Number(row.price) || 0,
    todayMilk: row.todayMilk,
    previousArrears: Number(row.previousArrears) || 0,
    todayCollection: Number(row.todayCollection) || 0,
  });

  row.todayAmount = result.todayAmount;
  row.totalPayable = result.totalPayable;
  row.newArrears = result.newArrears;

  recalcDispatchTotals(dispatch);
  markDispatchDirty(dispatch.id);
}

function recalcDispatchTotals(dispatch) {
  let totalCans = 0;
  let totalMilk = 0;
  let totalReturnMilk = 0;
  let totalAmount = 0;
  let totalPreviousArrears = 0;
  let totalCollection = 0;
  let totalNewArrears = 0;

  for (const it of dispatch.items || []) {
    totalCans += Number(it.cans) || 0;
    totalMilk += Number(it.todayMilk) || 0;
    totalReturnMilk += Number(it.returnKgs) || 0;
    totalAmount += Number(it.todayAmount) || 0;
    totalPreviousArrears += Number(it.previousArrears) || 0;
    totalCollection += Number(it.todayCollection) || 0;
    totalNewArrears += Number(it.newArrears) || 0;
  }

  dispatch.totalCans = totalCans;
  dispatch.totalMilk = Number(totalMilk.toFixed(2));
  dispatch.totalReturnMilk = Number(totalReturnMilk.toFixed(2));
  dispatch.totalAmount = Number(totalAmount.toFixed(2));
  dispatch.totalPreviousArrears = Number(totalPreviousArrears.toFixed(2));
  dispatch.totalCollection = Number(totalCollection.toFixed(2));
  dispatch.totalNewArrears = Number(totalNewArrears.toFixed(2));
}

function resetDispatchChanges(d) {
  if (!d || !originalDispatchItems.has(d.id)) return;
  d.items = JSON.parse(JSON.stringify(originalDispatchItems.get(d.id)));
  recalcDispatchTotals(d);
  unmarkDispatchDirty(d.id);
}

async function saveInlineDispatchSettlement(d) {
  if (!d) return;
  if (inspection.value?.isClosed) {
    snackbar.error('Day is closed. Reopen day first to modify route settlements.');
    return;
  }
  savingDispatchId.value = d.id;
  try {
    await dispatchService.updateDispatch(d.id, {
      header: {
        date: d.date,
        areaId: d.areaId,
        areaName: d.areaName,
        vehicleId: d.vehicleId,
        vehicleNumber: d.vehicleNumber,
        driverId: d.driverId,
        driverName: d.driverName,
        calanderId: d.calanderId,
        calanderName: d.calanderName,
        returnNotes: (d.returnNotes || '').trim(),
      },
      items: d.items || [],
      status: 'Returned',
    });

    d.status = 'Returned';
    originalDispatchItems.set(d.id, JSON.parse(JSON.stringify(d.items || [])));
    unmarkDispatchDirty(d.id);

    snackbar.success(
      `Collections & settlement saved for ${d.areaName}! Shop arrears updated.`
    );
    await Promise.all([loadInspection(), businessDayStore.refreshBusinessDay(), loadSettlementPeriodData()]);
  } catch (err) {
    snackbar.error(err.message || 'Failed to save collection settlement');
  } finally {
    savingDispatchId.value = null;
  }
}

// Delete single dispatch (Admin)
const deleteDispatchDialog = ref(false);
const dispatchToDelete = ref(null);
const deletingDispatch = ref(false);

function confirmDeleteDispatchFromClosing(d) {
  if (!authStore.isAdmin) {
    snackbar.error('Staff cannot delete dispatches. Only administrators have permission.');
    return;
  }
  if (settingsStore.settings.allowDeleteDispatch === false) {
    snackbar.error('Deleting dispatches is disabled in Master settings.');
    return;
  }
  if (inspection.value?.isClosed) {
    snackbar.error(`${formatDate(d.date)} is already closed. Reopen day first to delete dispatch.`);
    return;
  }
  dispatchToDelete.value = d;
  deleteDispatchDialog.value = true;
}

async function executeDeleteDispatchFromClosing() {
  if (!dispatchToDelete.value) return;
  deletingDispatch.value = true;
  try {
    await dispatchService.deleteDispatch(dispatchToDelete.value.id, dispatchToDelete.value.date);
    snackbar.success('Dispatch deleted and shop arrears rolled back.');
    deleteDispatchDialog.value = false;
    dispatchToDelete.value = null;
    await Promise.all([loadInspection(), businessDayStore.refreshBusinessDay(), loadSettlementPeriodData()]);
  } catch (err) {
    snackbar.error(err.message || 'Failed to delete dispatch');
  } finally {
    deletingDispatch.value = false;
  }
}
const allLedgerRows = computed(() => businessDayStore.ledgerRows || []);
const pendingLedgerCount = computed(() => allLedgerRows.value.filter((r) => !r.isClosed).length);
const closedLedgerCount = computed(() => allLedgerRows.value.filter((r) => r.isClosed).length);

const filteredLedgerRows = computed(() => {
  let rows = allLedgerRows.value;

  if (ledgerFilter.value === 'pending') {
    rows = rows.filter((r) => !r.isClosed);
  } else if (ledgerFilter.value === 'closed') {
    rows = rows.filter((r) => r.isClosed);
  }

  const df = ledgerDateFilter.value;
  if (df && df.mode !== 'all') {
    if (df.mode === 'single' && df.date) {
      rows = rows.filter((r) => r.date === df.date);
    } else if (df.from && df.to) {
      rows = rows.filter((r) => r.date >= df.from && r.date <= df.to);
    } else if (df.from) {
      rows = rows.filter((r) => r.date >= df.from);
    }
  }

  return rows;
});

function onLedgerDateFilterChange(val) {
  if (val && val.mode === 'single' && val.date) {
    selectedDate.value = val.date;
    loadInspection();
  }
}

// Separated Cash & Bank Handover Register State & Calculations
const activeClosingTab = ref('ledger');
const allocationTypeFilter = ref('all');
const allocationPage = ref(1);
const allocationItemsPerPage = ref(15);

const closedAllocationRows = computed(() => {
  return allLedgerRows.value
    .filter((r) => r.isClosed && r.closing?.allocation)
    .map((r) => {
      const a = r.closing.allocation || {};
      const net = a.remainingAmount !== undefined
        ? Number(a.remainingAmount)
        : Math.max(0, (r.summary.totalCollection || 0) - (r.summary.totalExpenses || 0));
      return {
        date: r.date,
        closing: r.closing,
        summary: r.summary,
        type: a.type || 'cash',
        remainingAmount: net,
        bankAmount: Number(a.bankAmount) || 0,
        bankName: a.bankName || '',
        bankRef: a.bankRef || '',
        cashAmount: Number(a.cashAmount) || 0,
        closedBy: r.closing.closedBy || 'Admin',
        closedAt: r.closing.closedAt || '',
        remarks: r.closing.remarks || '',
      };
    });
});

const filteredAllocationRows = computed(() => {
  let rows = closedAllocationRows.value;

  if (allocationTypeFilter.value !== 'all') {
    rows = rows.filter((r) => r.type === allocationTypeFilter.value);
  }

  const filter = ledgerDateFilter.value;
  if (filter && filter.mode !== 'all') {
    if (filter.mode === 'single' && filter.date) {
      rows = rows.filter((r) => r.date === filter.date);
    } else if (filter.from && filter.to) {
      rows = rows.filter((r) => r.date >= filter.from && r.date <= filter.to);
    }
  }

  return rows;
});

const paginatedAllocationRows = computed(() => {
  const start = (allocationPage.value - 1) * allocationItemsPerPage.value;
  return filteredAllocationRows.value.slice(start, start + allocationItemsPerPage.value);
});

const allocationBankCount = computed(() => closedAllocationRows.value.filter((r) => r.type === 'bank').length);
const allocationCashCount = computed(() => closedAllocationRows.value.filter((r) => r.type === 'cash').length);
const allocationSplitCount = computed(() => closedAllocationRows.value.filter((r) => r.type === 'split').length);

const totalBankAllocated = computed(() => {
  return filteredAllocationRows.value.reduce((acc, r) => acc + (r.bankAmount || 0), 0);
});

const totalCashAllocated = computed(() => {
  return filteredAllocationRows.value.reduce((acc, r) => acc + (r.cashAmount || 0), 0);
});

const totalNetAllocated = computed(() => {
  return filteredAllocationRows.value.reduce((acc, r) => acc + (r.remainingAmount || 0), 0);
});

const paginatedLedgerRows = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  return filteredLedgerRows.value.slice(start, start + itemsPerPage.value);
});

function canDeleteRow(row) {
  if (!authStore.isAdmin || !row) return false;
  return row.date < businessDayStore.realToday || Boolean(row.closing);
}

const selectablePageRows = computed(() => {
  return paginatedLedgerRows.value.filter(canDeleteRow);
});

const isAllSelected = computed(() => {
  return (
    selectablePageRows.value.length > 0 &&
    selectablePageRows.value.every((row) => selectedDates.value.includes(row.date))
  );
});

const isSomeSelected = computed(() => {
  return selectedDates.value.length > 0 && !isAllSelected.value;
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedDates.value = [];
  } else {
    selectedDates.value = selectablePageRows.value.map((row) => row.date);
  }
}

function toggleSelectDate(dateStr) {
  const idx = selectedDates.value.indexOf(dateStr);
  if (idx > -1) {
    selectedDates.value.splice(idx, 1);
  } else {
    selectedDates.value.push(dateStr);
  }
}

const deleteStep1Message = computed(() => {
  const rows = pendingDeleteRows.value;
  if (rows.length === 0) return '';
  if (rows.length === 1) {
    const row = rows[0];
    const dateLabel = formatDate(row.date);
    if (row.hasActivity) {
      return `First check: Permanently remove ${dateLabel} from Day Closing? Any closing, dispatch, arrival, expense, and attendance records on this date will be deleted.`;
    }
    return `First check: Do you want to permanently delete the day closing record for ${dateLabel}?`;
  }
  return `First check: Permanently remove ${rows.length} selected day record(s) and any activity recorded on those dates?`;
});

const deleteStep2Message = computed(() => {
  const rows = pendingDeleteRows.value;
  if (rows.length === 0) return '';
  if (rows.length === 1) {
    return `Final confirmation required: Are you 100% sure you want to permanently delete ${formatDate(rows[0].date)}? This action cannot be undone.`;
  }
  return `Final confirmation required: Permanently delete ${rows.length} selected day record(s)? This action cannot be undone.`;
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

function getAllocationTagClass(type) {
  if (type === 'bank') return 'erp-tag-blue';
  if (type === 'cash') return 'erp-tag-green';
  if (type === 'split') return 'erp-tag-purple';
  return 'erp-tag-grey';
}

function getAllocationLabel(type) {
  if (type === 'bank') return 'BANK DEPOSIT';
  if (type === 'cash') return 'CASH IN HAND';
  if (type === 'split') return 'CUSTOM SPLIT';
  return '-';
}

function getLedgerRowAllocationTagClass(row) {
  if (!row.isClosed) {
    if (row.summary.pendingDispatchCount > 0) return 'erp-tag-orange';
    if (row.canClose) return 'erp-tag-blue';
    return 'erp-tag-grey';
  }
  const type = row.closing?.allocation?.type;
  if (type === 'bank') return 'erp-tag-blue';
  if (type === 'cash') return 'erp-tag-green';
  if (type === 'split') return 'erp-tag-purple';
  return 'erp-tag-grey';
}

function getLedgerRowAllocationLabel(row) {
  if (!row.isClosed) {
    if (row.summary.pendingDispatchCount > 0) return 'PENDING';
    if (row.canClose) return 'READY';
    return '-';
  }
  const type = row.closing?.allocation?.type;
  if (type === 'bank') return 'BANK DEPOSIT';
  if (type === 'cash') return 'CASH IN HAND';
  if (type === 'split') return 'CUSTOM SPLIT';
  return 'CLOSED';
}

async function goToPendingDispatchesForDate(dateStr) {
  await openRouteSettlementsDialog(dateStr);
}

async function promptCloseRow(dateStr) {
  selectedDate.value = dateStr;
  await loadInspection();
  openCloseDayAllocationDialog();
}

async function loadInspection() {
  loading.value = true;
  try {
    inspection.value = await dayClosingService.inspectDayStatus(selectedDate.value);
    if (inspection.value?.dispatches && inspection.value.dispatches.length > 0) {
      inspection.value.dispatches.forEach((d) => {
        prepareDispatchForInlineEdit(d);
        originalDispatchItems.set(d.id, JSON.parse(JSON.stringify(d.items || [])));
      });
      expandedDispatchIds.value = inspection.value.dispatches.map((d) => d.id);
    }
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

function selectPendingCloseDate() {
  selectedDate.value = businessDayStore.activeBusinessDate;
  loadInspection();
}

async function goToPendingDispatches() {
  await openRouteSettlementsDialog(selectedDate.value);
}

function openCloseDayAllocationDialog() {
  const net = Number(summary.value.netCashFlow) || 0;
  allocationForm.value = {
    type: 'cash',
    bankName: '',
    bankRef: '',
    cashAmount: net,
    bankAmount: 0,
  };
  closeDayAllocationDialog.value = true;
}

function onBankAmountChange(val) {
  const net = Number(summary.value.netCashFlow) || 0;
  const b = Math.max(0, Math.min(net, Number(val) || 0));
  allocationForm.value.bankAmount = b;
  allocationForm.value.cashAmount = Math.max(0, Number((net - b).toFixed(2)));
}

function onCashAmountChange(val) {
  const net = Number(summary.value.netCashFlow) || 0;
  const c = Math.max(0, Math.min(net, Number(val) || 0));
  allocationForm.value.cashAmount = c;
  allocationForm.value.bankAmount = Math.max(0, Number((net - c).toFixed(2)));
}

async function executeCloseDayWithAllocation() {
  closingDay.value = true;
  try {
    const net = Number(summary.value.netCashFlow) || 0;
    let cashAmt = 0;
    let bankAmt = 0;

    if (allocationForm.value.type === 'bank') {
      bankAmt = net;
      cashAmt = 0;
    } else if (allocationForm.value.type === 'cash') {
      cashAmt = net;
      bankAmt = 0;
    } else {
      bankAmt = Number(allocationForm.value.bankAmount) || 0;
      cashAmt = Number(allocationForm.value.cashAmount) || 0;
    }

    await businessDayStore.closeDay(selectedDate.value, {
      closedBy: authStore.userName || 'Admin',
      remarks: closingRemarks.value,
      allocationType: allocationForm.value.type,
      remainingAmount: net,
      cashAmount: cashAmt,
      bankAmount: bankAmt,
      bankName: allocationForm.value.bankName,
      bankRef: allocationForm.value.bankRef,
    });

    closeDayAllocationDialog.value = false;
    routeSettlementsDialog.value = false;
    closingRemarks.value = '';

    const nextDate = businessDayStore.activeBusinessDate;
    let allocMsg = '';
    if (allocationForm.value.type === 'bank') {
      allocMsg = ` Remaining ${formatCurrency(net)} added to Bank${allocationForm.value.bankName ? ` (${allocationForm.value.bankName})` : ''}.`;
    } else if (allocationForm.value.type === 'cash') {
      allocMsg = ` Remaining ${formatCurrency(net)} retained in Cash in Hand.`;
    } else {
      allocMsg = ` Split: Bank ${formatCurrency(bankAmt)}, Cash ${formatCurrency(cashAmt)}.`;
    }

    snackbar.success(
      `Day ${formatDate(selectedDate.value)} successfully closed!${allocMsg} Active working day is now ${formatDate(nextDate)}.`
    );
    selectedDate.value = nextDate;
    await Promise.all([refreshAll(), loadSettlementPeriodData()]);
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
    await Promise.all([refreshAll(), loadSettlementPeriodData()]);
  } catch (err) {
    snackbar.error(err.message || 'Failed to reopen day');
  } finally {
    reopening.value = false;
  }
}

function confirmDeleteClosing(row) {
  if (!authStore.isAdmin) {
    snackbar.error('Staff cannot delete day closing records. Only administrators have permission.');
    return;
  }
  pendingDeleteRows.value = [row];
  deleteStep1Dialog.value = true;
}

function confirmBulkDelete() {
  if (!authStore.isAdmin) {
    snackbar.error('Staff cannot delete day closing records. Only administrators have permission.');
    return;
  }
  if (selectedDates.value.length === 0) return;
  pendingDeleteRows.value = allLedgerRows.value.filter((row) =>
    selectedDates.value.includes(row.date)
  );
  if (pendingDeleteRows.value.length === 0) return;
  deleteStep1Dialog.value = true;
}

async function proceedToSecondDeleteConfirm() {
  deleteStep1Dialog.value = false;
  await nextTick();
  deleteStep2Dialog.value = true;
}

async function executeDeleteClosings() {
  if (pendingDeleteRows.value.length === 0) return;
  const targets = [...pendingDeleteRows.value];
  deletingClosings.value = true;
  try {
    for (const row of targets) {
      await dayClosingService.deleteClosing(row.date);
    }
    await businessDayStore.refreshBusinessDay();
    const removedSet = new Set(targets.map((r) => r.date));
    selectedDates.value = selectedDates.value.filter((d) => !removedSet.has(d));
    pendingDeleteRows.value = [];
    deleteStep2Dialog.value = false;
    snackbar.success(
      targets.length === 1
        ? `Closing record for ${formatDate(targets[0].date)} deleted.`
        : `${targets.length} closing record(s) deleted.`
    );
    selectedDate.value = businessDayStore.activeBusinessDate;
    await Promise.all([refreshAll(), loadSettlementPeriodData()]);
  } catch (err) {
    snackbar.error(err.message || 'Failed to delete closing record(s)');
  } finally {
    deletingClosings.value = false;
  }
}

onMounted(async () => {
  await Promise.all([settingsStore.loadSettings(), businessDayStore.refreshBusinessDay()]);
  selectedDate.value = businessDayStore.activeBusinessDate;
  await loadInspection();
});
</script>

<style scoped>
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

.handover-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 650px) {
  .handover-metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }
}

.closing-metrics-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1200px) {
  .closing-metrics-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .closing-metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 440px) {
  .closing-metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }
}

.pending-dispatch-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #fff8e1;
  border: 1px solid #f59e0b;
  border-radius: 6px;
}

/* Redesigned Executive Settlement Status Badge */
.settlement-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  line-height: 1.2;
  white-space: nowrap;
}

.settlement-status-badge.badge-ready {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
}

.settlement-status-badge.badge-ready .status-live-dot {
  background: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}

.settlement-status-badge.badge-closed {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #047857;
}

.settlement-status-badge.badge-closed .status-live-dot {
  background: #10b981;
}

.settlement-status-badge.badge-pending {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #b45309;
}

.settlement-status-badge.badge-pending .status-live-dot {
  background: #f59e0b;
}

.settlement-status-badge.badge-not-open {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
}

.settlement-status-badge.badge-not-open .status-live-dot {
  background: #94a3b8;
}

.v-table tbody tr.row-pending-unclosed {
  background-color: #fffbeb !important;
  box-shadow: inset 4px 0 0 #d97706 !important;
}

.v-table tbody tr.row-selected-inspect:not(.row-pending-unclosed) {
  background-color: rgba(25, 118, 210, 0.06) !important;
}

/* Executive Table Action Buttons Cluster */
.table-actions-cluster {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  vertical-align: middle;
}

.action-btn-close-day {
  height: 30px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #0d47a1;
  color: #ffffff;
  border: 1px solid #0a3880;
  border-radius: 7px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(13, 71, 161, 0.25);
  white-space: nowrap;
}

.action-btn-close-day:hover {
  background: #1565c0;
  border-color: #0d47a1;
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(13, 71, 161, 0.35);
}

.action-btn-mark-back {
  height: 30px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #fff8e1;
  color: #b45309;
  border: 1px solid #fcd34d;
  border-radius: 7px;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.action-btn-mark-back:hover {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #92400e;
  transform: translateY(-1px);
}

.action-icon-btn {
  height: 30px;
  width: 30px;
  min-width: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.action-icon-btn:hover {
  transform: translateY(-1px);
}

.action-btn-reopen {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #d97706;
}

.action-btn-reopen:hover {
  background: #fef3c7;
  border-color: #fcd34d;
  color: #b45309;
  box-shadow: 0 2px 4px rgba(217, 119, 6, 0.15);
}

/* Handover Register Metric Cards */
.handover-stat-card {
  border-radius: 8px !important;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.handover-stat-card.card-bank {
  background: #eff6ff !important;
  border: 1px solid #60a5fa !important;
}

.handover-stat-card.card-cash {
  background: #f0fdf4 !important;
  border: 1px solid #4ade80 !important;
}

.handover-stat-card.card-net {
  background: #eef2ff !important;
  border: 1px solid #818cf8 !important;
}

.handover-stat-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.dispatch-metrics-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1200px) {
  .dispatch-metrics-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .dispatch-metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 440px) {
  .dispatch-metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }
}

.dispatch-metric-card {
  background: #ffffff;
  border: 1px solid #e2e8f0 !important;
  border-radius: 12px;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 84px;
  transition: all 0.2s ease;
}

.dispatch-metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.dispatch-metric-card.card-arrears {
  background: #fff8e1 !important;
}

.metric-card-label {
  font-size: 0.74rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.metric-card-value {
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.2;
}

.metric-card-sub {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 2px;
}

.dispatch-table {
  width: 100% !important;
  border-radius: 0 !important;
  border: none !important;
}

.dispatch-table table {
  width: 100% !important;
  border-collapse: collapse !important;
}

.dispatch-table th,
.dispatch-table td {
  padding: 8px 10px !important;
}

.settlement-table {
  width: 100% !important;
  background: #ffffff !important;
}

.settlement-table table {
  border-collapse: separate !important;
  border-spacing: 0 !important;
}

.settlement-table thead tr.settlement-th-row th {
  background-color: #0b3b75 !important;
  color: #ffffff !important;
  font-size: 0.73rem !important;
  font-weight: 800 !important;
  letter-spacing: 0.05em !important;
  text-transform: uppercase !important;
  padding: 10px 10px !important;
  border-bottom: 2px solid #062b56 !important;
  border-right: 1px solid rgba(255, 255, 255, 0.12) !important;
  white-space: nowrap !important;
}

.settlement-table thead tr.settlement-th-row th:last-child {
  border-right: none !important;
}

.settlement-table tbody tr {
  transition: background-color 0.15s ease;
}

.settlement-table tbody tr:hover {
  background-color: #f8fafc !important;
}

.settlement-table tbody td {
  padding: 8px 10px !important;
  vertical-align: middle !important;
  border-bottom: 1px solid #e2e8f0 !important;
  font-size: 0.88rem !important;
}

.shop-title {
  font-size: 0.9rem !important;
  color: #1565c0 !important;
}

/* Grand Totals Footer */
.settlement-tfoot-row td {
  background-color: #edf4fa !important;
  padding: 12px 10px !important;
  border-top: 2px solid #cbd5e1 !important;
  border-bottom: 1px solid #cbd5e1 !important;
  font-size: 0.9rem !important;
  font-weight: 800 !important;
}

.settlement-tfoot-row td.tfoot-collection {
  background-color: #dcfce7 !important;
  color: #15803d !important;
}

/* Editable Inputs inside Settlement Table */
.editable-input :deep(.v-field) {
  background-color: #ffffff !important;
  border-radius: 6px !important;
  border: 1.5px solid #cbd5e1 !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04) !important;
  transition: all 0.15s ease-in-out !important;
}

.editable-input :deep(.v-field__input) {
  min-height: 32px !important;
  height: 32px !important;
  padding: 3px 8px !important;
  font-size: 0.88rem !important;
  font-weight: 700 !important;
  text-align: right !important;
}

.editable-input :deep(.v-field--focused) {
  border-color: #0b3b75 !important;
  box-shadow: 0 0 0 3px rgba(11, 59, 117, 0.15) !important;
}

.editable-input.collection-input :deep(.v-field) {
  border-color: #86efac !important;
  background-color: #ffffff !important;
}

.editable-input.collection-input :deep(.v-field--focused) {
  border-color: #16a34a !important;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.18) !important;
}

.editable-input.collection-input :deep(input) {
  color: #16a34a !important;
  font-weight: 800 !important;
}

.editable-input.return-input :deep(input) {
  color: #ea580c !important;
  font-weight: 700 !important;
}

.editable-input :deep(.v-field--disabled) {
  background-color: #f1f5f9 !important;
  border-color: #e2e8f0 !important;
  box-shadow: none !important;
  cursor: not-allowed !important;
  opacity: 0.9 !important;
}

.editable-input :deep(.v-field--disabled input) {
  color: #475569 !important;
  cursor: not-allowed !important;
  -webkit-text-fill-color: #475569 !important;
}

.editable-input.collection-input :deep(.v-field--disabled) {
  border-color: #cbd5e1 !important;
  background-color: #f1f5f9 !important;
}

.editable-input.collection-input :deep(.v-field--disabled input) {
  color: #059669 !important;
  -webkit-text-fill-color: #059669 !important;
}

.editable-input.return-input :deep(.v-field--disabled input) {
  color: #b45309 !important;
  -webkit-text-fill-color: #b45309 !important;
}

.return-notes-field :deep(.v-field--disabled) {
  background-color: #f8fafc !important;
  cursor: not-allowed !important;
  opacity: 0.9 !important;
}

.return-notes-field :deep(.v-field--disabled input) {
  cursor: not-allowed !important;
  color: #475569 !important;
  -webkit-text-fill-color: #475569 !important;
}

.editable-input :deep(input[type="number"]::-webkit-inner-spin-button),
.editable-input :deep(input[type="number"]::-webkit-outer-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

.editable-input :deep(input[type="number"]) {
  -moz-appearance: textfield;
}

.btn-quick-collect {
  width: 26px !important;
  height: 26px !important;
  min-width: 26px !important;
  border-radius: 50% !important;
  background-color: #dcfce7 !important;
  color: #16a34a !important;
  box-shadow: 0 1px 2px rgba(22, 163, 74, 0.15) !important;
  transition: all 0.15s ease !important;
}

.btn-quick-collect:hover {
  background-color: #16a34a !important;
  color: #ffffff !important;
  transform: scale(1.08) !important;
}

.editable-cell-highlight {
  background: rgba(25, 118, 210, 0.03);
}

.closing-modal-header {
  background: #063F78 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 16px rgba(6, 63, 120, 0.35) !important;
  position: relative;
  padding: 14px 24px !important;
  min-height: 66px !important;
  box-sizing: border-box !important;
}

.route-settlement-section {
  position: relative;
  border-bottom: 3px solid #cbd5e1;
}

.route-section-separator {
  background: #e2e8f0 !important;
  border-top: 2px solid #94a3b8 !important;
  border-bottom: 1px solid #cbd5e1 !important;
}

.route-executive-card {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.route-index-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: #0d47a1;
  color: #ffffff;
  padding: 3px 8px;
  border-radius: 6px;
  line-height: 1.2;
}

/* Route Command Bar */
.route-command-bar {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  border-left: 4px solid #0d47a1;
  padding: 14px 24px;
  min-height: 58px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}

.route-command-bar.status-settled-bar {
  border-left-color: #10b981;
}

.route-command-bar.status-dispatched-bar {
  border-left-color: #f59e0b;
}

.route-identity-block {
  display: inline-flex;
  align-items: center;
}

.route-pin-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(13, 71, 161, 0.08);
  border: 1px solid rgba(13, 71, 161, 0.15);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.route-area-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

/* Route Date Pill */
.route-date-pill {
  height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0 10px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #334155;
  user-select: none;
}

/* Route Status Pill */
.route-status-pill {
  height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0 12px;
  border-radius: 9999px;
  user-select: none;
}

.route-status-pill.status-settled {
  background: #ecfdf5;
  color: #065f46;
  border: 1.5px solid #a7f3d0;
}
.route-status-pill.status-settled .status-live-dot {
  background-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
}

.route-status-pill.status-delivery-out {
  background: #fffbeb;
  color: #92400e;
  border: 1.5px solid #fde68a;
}
.route-status-pill.status-delivery-out .status-live-dot {
  background-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.25);
}

/* Meta Pills Group */
.route-meta-group {
  flex-wrap: wrap;
}

.route-meta-pill {
  height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0 11px;
  font-size: 0.78rem;
  color: #334155;
  transition: all 0.15s ease;
}

.route-meta-pill:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.route-meta-pill .meta-icon {
  color: #64748b;
}

.route-meta-pill.pill-vehicle {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}
.route-meta-pill.pill-vehicle .meta-icon {
  color: #16a34a;
}

.route-meta-pill.pill-shops {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1e40af;
}
.route-meta-pill.pill-shops .meta-icon {
  color: #2563eb;
}

.meta-lbl {
  color: #64748b;
  font-weight: 500;
}

.meta-val {
  color: #0f172a;
  font-weight: 700;
}

.meta-dot {
  margin: 0 4px;
  color: #94a3b8;
  font-weight: 700;
}

/* Action Buttons */
.route-action-btn {
  height: 34px !important;
  min-height: 34px !important;
  font-size: 0.8rem !important;
  font-weight: 700 !important;
  border-radius: 8px !important;
  padding: 0 14px !important;
  text-transform: capitalize !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04) !important;
}

.btn-settle-green {
  background: #10b981 !important;
  color: #ffffff !important;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3) !important;
}

.btn-view-tonal {
  background: #eff6ff !important;
  color: #0d47a1 !important;
  border: 1px solid #bfdbfe !important;
}
.btn-view-tonal:hover {
  background: #dbeafe !important;
  border-color: #93c5fd !important;
}

.btn-toggle-shops {
  background: #ffffff !important;
  border: 1.5px solid #cbd5e1 !important;
  color: #1e293b !important;
}
.btn-toggle-shops:hover {
  background: #f8fafc !important;
  border-color: #0d47a1 !important;
  color: #0d47a1 !important;
}

.route-delete-btn {
  height: 34px;
  width: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1.5px solid #fecdd3;
  background: #fff1f2;
  color: #e11d48;
  cursor: pointer;
  transition: all 0.15s ease;
}

.route-delete-btn:hover {
  background: #fee2e2;
  border-color: #f87171;
  color: #be123c;
  transform: translateY(-1px);
}

/* Executive Connected Financial Ribbon */
.metrics-ribbon {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03);
}

.ribbon-segment {
  min-width: 0;
  padding: 13px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-right: 1px solid #f1f5f9;
  border-top: 3px solid transparent;
  background-color: #ffffff;
  transition: all 0.18s ease;
  position: relative;
}

.ribbon-segment:last-child {
  border-right: none;
}

.ribbon-segment:hover:not(.segment-hero-collection):not(.segment-outcome-arrears) {
  background-color: #f8fafc;
}

/* Category Accent Top Borders */
.ribbon-segment.segment-milk {
  border-top-color: #38bdf8;
}
.ribbon-segment.segment-sales {
  border-top-color: #063F78;
}
.ribbon-segment.segment-prev {
  border-top-color: #94a3b8;
}
.ribbon-segment.segment-payable {
  border-top-color: #6366f1;
}

/* Segment Header Label & Micro-Badge */
.segment-label {
  font-size: 0.69rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 5px;
}

.segment-badge {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.badge-sky { background: #e0f2fe; color: #0284c7; }
.badge-primary { background: #e0f2fe; color: #063F78; }
.badge-neutral { background: #f1f5f9; color: #64748b; }
.badge-indigo { background: #e0e7ff; color: #4338ca; }
.badge-emerald { background: #dcfce7; color: #059669; }
.badge-rose { background: #ffe4e6; color: #e11d48; }

.segment-value {
  font-size: 1.25rem;
  line-height: 1.25;
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.segment-unit {
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
  margin-left: 2px;
}

.segment-sub {
  font-size: 0.72rem;
  line-height: 1.3;
  margin-top: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
}

/* Micro Status Pill Badges */
.sub-pill {
  display: inline-flex;
  align-items: center;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 9999px;
  letter-spacing: 0.01em;
  line-height: 1.2;
}

.pill-emerald {
  background: #dcfce7;
  color: #047857;
  border: 1px solid #bbf7d0;
}

.pill-rose {
  background: #ffe4e6;
  color: #be123c;
  border: 1px solid #fecdd3;
}

.pill-amber {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
}

/* Hero Collection Segment */
.segment-hero-collection {
  border-top-color: #10b981 !important;
  background: linear-gradient(180deg, rgba(236, 253, 245, 0.85) 0%, rgba(255, 255, 255, 0.95) 100%) !important;
}

/* Outcome Arrears Segment */
.segment-outcome-arrears {
  border-top-color: #f43f5e !important;
  background: linear-gradient(180deg, rgba(255, 241, 242, 0.85) 0%, rgba(255, 255, 255, 0.95) 100%) !important;
}

.segment-outcome-cleared {
  border-top-color: #10b981 !important;
  background: linear-gradient(180deg, rgba(240, 253, 244, 0.5) 0%, rgba(255, 255, 255, 0.95) 100%) !important;
}

@media (max-width: 1250px) {
  .metrics-ribbon {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  }
  .ribbon-segment {
    border-bottom: 1px solid #f1f5f9 !important;
  }
  .ribbon-segment:nth-child(3n) {
    border-right: none !important;
  }
}

@media (max-width: 680px) {
  .metrics-ribbon {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
  .ribbon-segment:nth-child(3n) {
    border-right: 1px solid #f1f5f9 !important;
  }
  .ribbon-segment:nth-child(2n) {
    border-right: none !important;
  }
}

.allocation-choice-card {
  transition: all 0.15s ease;
  background-color: #ffffff;
  border-color: #e2e8f0;
}
.allocation-choice-card:hover {
  border-color: #94a3b8;
  background-color: #f8fafc;
}

.settlement-filter-toolbar {
  background: #f1f5f9;
  border-top: 1px solid #e2e8f0;
  border-bottom: 2px solid #cbd5e1;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05);
  position: sticky;
  top: 0;
  z-index: 10;
}

.filter-header-badge {
  height: 36px;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #0d47a1;
  color: #ffffff;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  padding: 0 12px;
  border-radius: 8px;
  text-transform: uppercase;
  box-shadow: 0 1px 3px rgba(13, 71, 161, 0.25);
  flex-shrink: 0;
}

.settlement-datepicker-box {
  min-width: 310px;
  width: 320px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .settlement-datepicker-box {
    min-width: 260px;
    width: 100%;
  }
}

.filter-preset-pill {
  height: 36px;
  box-sizing: border-box;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  color: #1e293b;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0 14px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.18s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  user-select: none;
  flex-shrink: 0;
}

.filter-preset-pill:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
  color: #0f172a;
  transform: translateY(-1px);
}

.filter-preset-pill.pill-active {
  background: #0d47a1 !important;
  border-color: #0d47a1 !important;
  color: #ffffff !important;
  font-weight: 800 !important;
  box-shadow: 0 2px 8px rgba(13, 71, 161, 0.35) !important;
}

.filter-preset-pill.pill-active .v-icon {
  color: #ffffff !important;
}

.filter-preset-pill.pill-reset {
  background: #ffffff;
  border: 1.5px dashed #f87171;
  color: #dc2626;
}

.filter-preset-pill.pill-reset:hover {
  background: #fee2e2;
  border-style: solid;
  border-color: #ef4444;
  color: #b91c1c;
}

.route-select-pill {
  padding: 4px 10px;
  border-radius: 9999px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #334155;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
}

.route-select-pill:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.route-select-pill.active {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 1px 3px rgba(2, 132, 199, 0.3);
}

.route-select-pill.pill-dispatched {
  border-color: #f97316;
  color: #c2410c;
  background: #fff7ed;
}

.route-select-pill.pill-dispatched.active {
  background: #ea580c;
  color: #ffffff;
  border-color: #ea580c;
  box-shadow: 0 1px 3px rgba(234, 88, 12, 0.35);
}

.guest-route-dark-divider {
  width: 100%;
  height: 14px;
  background: #0f172a !important;
  border-top: 2px solid #334155 !important;
  border-bottom: 2px solid #063F78 !important;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 2px 5px rgba(15, 23, 42, 0.25) !important;
  position: relative;
  z-index: 2;
  margin: 0 !important;
}

/* Executive Luxury Modal Header */
.closing-modal-header::before {
  display: none !important;
}

.header-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(8px);
}

.header-main-title {
  font-size: 1.25rem !important;
  font-weight: 900 !important;
  letter-spacing: -0.015em !important;
  color: #ffffff !important;
  line-height: 1.2 !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-date-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.28);
  color: #e0f2fe;
  padding: 3px 12px;
  border-radius: 9999px;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
  white-space: nowrap;
}

.header-subtitle {
  font-size: 0.78rem !important;
  color: #bae6fd !important;
  font-weight: 500 !important;
  margin-top: 3px;
  letter-spacing: 0.01em;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Stunning Yellow / Golden "Day Closed" Badge (Pure Solid Color) */
.header-badge-closed-yellow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #facc15 !important;
  color: #713f12 !important;
  font-size: 0.82rem !important;
  font-weight: 900 !important;
  letter-spacing: 0.02em;
  height: 38px !important;
  box-sizing: border-box !important;
  padding: 0 14px !important;
  border-radius: 9999px !important;
  border: 1px solid #eab308 !important;
  box-shadow: 0 2px 6px rgba(250, 204, 21, 0.3) !important;
  user-select: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.header-badge-closed-yellow .v-icon {
  color: #713f12 !important;
}

/* Route Pending Amber Badge (Pure Solid Color) */
.header-badge-pending-amber {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #f97316 !important;
  color: #ffffff !important;
  font-size: 0.82rem !important;
  font-weight: 900 !important;
  letter-spacing: 0.02em;
  height: 38px !important;
  box-sizing: border-box !important;
  padding: 0 14px !important;
  border-radius: 9999px !important;
  border: 1px solid #ea580c !important;
  box-shadow: 0 2px 6px rgba(249, 115, 22, 0.3) !important;
  user-select: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.header-badge-pending-amber .v-icon {
  color: #ffffff !important;
}

/* Route Settled Emerald Badge (Pure Solid Color) */
.header-badge-settled-emerald {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #10b981 !important;
  color: #ffffff !important;
  font-size: 0.82rem !important;
  font-weight: 900 !important;
  letter-spacing: 0.02em;
  height: 38px !important;
  box-sizing: border-box !important;
  padding: 0 14px !important;
  border-radius: 9999px !important;
  border: 1px solid #059669 !important;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3) !important;
  user-select: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.header-badge-settled-emerald .v-icon {
  color: #ffffff !important;
}

/* Minimalist Clean X Button */
.header-close-btn {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  color: #ffffff !important;
  opacity: 0.85;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  width: 38px !important;
  height: 38px !important;
  padding: 0 !important;
  border-radius: 8px !important;
  transition: all 0.15s ease !important;
  flex-shrink: 0;
}

.header-close-btn:hover {
  background: rgba(255, 255, 255, 0.15) !important;
  opacity: 1 !important;
  transform: scale(1.08) !important;
  color: #ffffff !important;
}

/* Header Search Bar (Full Width, No Truncation, Pure White Text & Icons) */
.header-search-box {
  width: 280px !important;
  min-width: 260px !important;
  flex-shrink: 0 !important;
}

.header-search-input :deep(.v-field) {
  background: rgba(255, 255, 255, 0.14) !important;
  border: 1px solid rgba(255, 255, 255, 0.32) !important;
  border-radius: 9999px !important;
  color: #ffffff !important;
  height: 38px !important;
  min-height: 38px !important;
  padding: 0 12px !important;
  backdrop-filter: blur(12px) !important;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.12) !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.header-search-input:hover :deep(.v-field) {
  background: rgba(255, 255, 255, 0.2) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}

.header-search-input:focus-within :deep(.v-field) {
  background: rgba(255, 255, 255, 0.25) !important;
  border-color: #ffffff !important;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.18) !important;
}

.header-search-input :deep(.v-field__input) {
  height: 38px !important;
  min-height: 38px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  color: #ffffff !important;
  font-size: 0.82rem !important;
  font-weight: 500 !important;
}

.header-search-input :deep(input) {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.header-search-input :deep(input::placeholder),
.header-search-input :deep(input::-webkit-input-placeholder),
.header-search-input :deep(input::-moz-placeholder),
.header-search-input :deep(input:-ms-input-placeholder) {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
  font-size: 0.82rem !important;
}

.header-search-input :deep(.v-field__prepend-inner) {
  padding-top: 0 !important;
  align-items: center !important;
}

.header-search-input :deep(.v-field__prepend-inner .v-icon) {
  color: #ffffff !important;
  font-size: 18px !important;
  opacity: 1 !important;
}

.header-search-input :deep(.v-field__clearable) {
  padding-top: 0 !important;
  align-items: center !important;
}

.header-search-input :deep(.v-field__clearable .v-icon) {
  color: #ffffff !important;
  font-size: 16px !important;
  opacity: 0.85 !important;
}

.header-search-input :deep(.v-field__clearable .v-icon:hover) {
  color: #ffffff !important;
  opacity: 1 !important;
}

/* Category Segmented Strip */
.settlement-category-strip {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

.category-tab-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1.5px solid #cbd5e1;
  background: #f8fafc;
  color: #334155;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.category-tab-pill:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}

.category-tab-pill.tab-pill-active {
  background: #063F78 !important;
  border-color: #063F78 !important;
  color: #ffffff !important;
  box-shadow: 0 2px 6px rgba(6, 63, 120, 0.25) !important;
}

.category-tab-pill.tab-pill-active .v-icon {
  color: #ffffff !important;
}

.category-tab-pill.tab-pill-muted {
  background: #ffffff;
  border-style: dashed;
}

.tab-pill-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 9999px;
  background: #e2e8f0;
  color: #1e293b;
  font-size: 0.72rem;
  font-weight: 800;
}

.category-tab-pill.tab-pill-active .tab-pill-count {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.tab-pill-status {
  font-size: 0.68rem;
  padding: 1px 7px;
  border-radius: 9999px;
  font-weight: 800;
}

.pill-status-pending {
  background: #fef3c7;
  color: #b45309;
}

.category-tab-pill.tab-pill-active .pill-status-pending {
  background: #f59e0b;
  color: #ffffff;
}

.pill-status-settled {
  background: #dcfce7;
  color: #047857;
}

.category-tab-pill.tab-pill-active .pill-status-settled {
  background: #10b981;
  color: #ffffff;
}

/* Route Stepper Strip */
.route-stepper-header {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding-top: 16px !important;
  padding-bottom: 16px !important;
}

.route-nav-btn {
  height: 38px !important;
  font-size: 0.82rem !important;
  letter-spacing: 0.01em;
}

.route-nav-card {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-radius: 10px;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.route-nav-card:hover {
  border-color: #94a3b8;
  background: #f1f5f9;
  transform: translateY(-1px);
}

.route-nav-card.is-active {
  background: #063F78 !important;
  border-color: #063F78 !important;
  box-shadow: 0 3px 10px rgba(6, 63, 120, 0.25) !important;
}

.route-nav-card.is-active .nav-card-num {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
}

.route-nav-card.is-active .nav-card-title {
  color: #ffffff !important;
}

.route-nav-card.is-active .nav-card-sub,
.route-nav-card.is-active .nav-card-sub span {
  color: #e0f2fe !important;
}

.nav-card-num {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #334155;
  font-size: 0.72rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-card-info {
  display: flex;
  flex-direction: column;
}

.nav-card-title {
  font-size: 0.84rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
}

.nav-card-sub {
  font-size: 0.69rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 1px;
}

.nav-card-dot {
  color: #94a3b8;
}

.search-shop-field :deep(.v-field) {
  background: #ffffff !important;
  border-radius: 8px !important;
  height: 32px !important;
  min-height: 32px !important;
}

.search-shop-field :deep(.v-field__input) {
  min-height: 32px !important;
  height: 32px !important;
  padding-top: 2px !important;
  padding-bottom: 2px !important;
  font-size: 0.8rem !important;
}

/* Quick Paid Full Chip */
.quick-paid-full-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid #10b981;
  background: #ecfdf5;
  color: #047857;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  user-select: none;
  flex-shrink: 0;
}

.quick-paid-full-chip:hover {
  background: #10b981;
  color: #ffffff;
  transform: scale(1.04);
}

.quick-paid-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0 4px;
}

/* Dialog Footer Action Buttons (Close Window & Day Closed) */
.dialog-footer-btn {
  height: 42px !important;
  min-height: 42px !important;
  font-size: 0.86rem !important;
  letter-spacing: 0.01em !important;
  display: inline-flex !important;
  align-items: center !important;
}

.dialog-footer-chip {
  height: 42px !important;
  min-height: 42px !important;
  background-color: #facc15 !important;
  color: #0f172a !important;
  font-size: 0.86rem !important;
  font-weight: 800 !important;
  display: inline-flex !important;
  align-items: center !important;
  border-radius: 8px !important;
}

.dialog-footer-chip .v-icon {
  color: #0f172a !important;
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

