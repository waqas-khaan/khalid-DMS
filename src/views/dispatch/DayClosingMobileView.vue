<template>
  <div class="mobile-day-closing-page pb-16">
    <!-- 1. Sticky Mobile App Header (iOS/Material 3 Executive Style) -->
    <header class="mobile-app-header px-4 py-3 bg-white border-b sticky-top">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center gap-2">
          <div class="header-icon-box">
            <v-icon color="primary" size="20">mdi-finance</v-icon>
          </div>
          <div>
            <h1 class="text-subtitle-1 font-weight-black text-slate-900 line-height-tight mb-0">
              Day Closing
            </h1>
            <span class="text-caption text-grey-darken-1 font-weight-medium" style="font-size: 0.72rem !important;">
              Executive Daily Inspection
            </span>
          </div>
        </div>

        <div class="d-flex align-center gap-2">
          <!-- Business Day Status Pill -->
          <v-chip
            size="small"
            :color="businessDayStore.isActiveDayClosed ? 'success' : 'primary'"
            variant="flat"
            class="font-weight-bold text-caption px-2-5 shadow-xs"
          >
            <v-icon start size="13">
              {{ businessDayStore.isActiveDayClosed ? 'mdi-check-circle' : 'mdi-clock-outline' }}
            </v-icon>
            {{ businessDayStore.isActiveDayClosed ? 'DAY CLOSED' : 'DAY OPEN' }}
          </v-chip>

          <!-- Refresh Button -->
          <v-btn
            icon
            size="small"
            variant="tonal"
            color="primary"
            :loading="loading"
            class="refresh-icon-btn"
            @click="refreshAll"
          >
            <v-icon size="18">mdi-refresh</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- Quick Day Stepper & Inspector -->
      <div class="mobile-date-stepper d-flex align-center justify-space-between gap-1 p-1 bg-slate-100 rounded-lg border">
        <button
          type="button"
          class="stepper-arrow-btn"
          title="Previous Day"
          @click="stepDay(-1)"
        >
          <v-icon size="20">mdi-chevron-left</v-icon>
        </button>

        <div
          class="d-flex align-center gap-2 flex-grow-1 justify-center cursor-pointer py-1"
          @click="datePickerModal = true"
        >
          <v-icon size="16" color="primary">mdi-calendar-month</v-icon>
          <span class="font-weight-black text-body-2 text-slate-800">
            {{ formatDate(selectedDate) }}
          </span>
          <v-chip
            v-if="selectedDate === businessDayStore.activeBusinessDate"
            size="x-small"
            color="primary"
            variant="flat"
            class="font-weight-bold"
            style="height: 18px; font-size: 0.62rem !important;"
          >
            Active Day
          </v-chip>
          <v-chip
            v-else-if="selectedDate === businessDayStore.realToday"
            size="x-small"
            color="info"
            variant="tonal"
            class="font-weight-bold"
            style="height: 18px; font-size: 0.62rem !important;"
          >
            Today
          </v-chip>
        </div>

        <button
          type="button"
          class="stepper-arrow-btn"
          title="Next Day"
          :disabled="isNextDayDisabled"
          @click="stepDay(1)"
        >
          <v-icon size="20" :color="isNextDayDisabled ? 'grey-lighten-1' : 'default'">mdi-chevron-right</v-icon>
        </button>
      </div>
    </header>

    <div class="px-3 pt-3">
      <!-- 2. Working Day Lock Warning Banner (if locked on previous day) -->
      <div
        v-if="businessDayStore.isLockedOnPreviousDay"
        class="mobile-lock-alert mb-3 pa-3 rounded-lg border shadow-xs"
      >
        <div class="d-flex align-center justify-space-between mb-1">
          <div class="d-flex align-center gap-2">
            <v-icon size="18" color="amber-darken-4">mdi-lock-alert</v-icon>
            <span class="text-subtitle-2 font-weight-black text-amber-darken-4">
              Operational Lock Active
            </span>
          </div>
          <v-chip size="x-small" color="amber-darken-4" variant="flat" class="font-weight-bold">
            Pending
          </v-chip>
        </div>
        <p class="text-caption text-grey-darken-3 mb-2 font-weight-medium">
          {{ businessDayStore.lockReason }}
        </p>
        <div class="d-flex align-center justify-between text-caption text-grey-darken-2 bg-amber-lighten-5 pa-2 rounded border border-amber-lighten-3">
          <span>Held Date: <strong>{{ formatDate(businessDayStore.activeBusinessDate) }}</strong></span>
          <span v-if="businessDayStore.pendingDispatchesCount > 0" class="text-amber-darken-4 font-weight-bold">
            {{ businessDayStore.pendingDispatchesCount }} delivery unreturned
          </span>
        </div>
      </div>

      <!-- 3. Day Audit & Finalization Status Card -->
      <div class="mobile-audit-hero pa-3 rounded-xl border bg-white shadow-sm mb-3">
        <div class="d-flex align-center justify-space-between mb-2 pb-2 border-b">
          <div class="d-flex align-center gap-2">
            <span
              class="settlement-status-badge text-caption"
              :class="getStatusBadgeClass"
            >
              <span class="status-dot"></span>
              {{ getStatusBadgeLabel }}
            </span>
          </div>

          <v-chip
            size="small"
            :color="inspection?.isClosed ? 'success' : 'warning'"
            variant="tonal"
            class="font-weight-bold text-caption"
          >
            <v-icon start size="14">
              {{ inspection?.isClosed ? 'mdi-lock-check' : 'mdi-lock-open-outline' }}
            </v-icon>
            {{ inspection?.isClosed ? 'Finalized Record' : 'In Progress (Web)' }}
          </v-chip>
        </div>

        <!-- If Finalized & Closed on Desktop -->
        <div v-if="inspection?.isClosed" class="closed-details-box">
          <div class="d-flex align-center justify-space-between mb-2">
            <div>
              <span class="text-caption text-grey d-block" style="font-size: 0.68rem !important;">FINALIZED BY</span>
              <strong class="text-body-2 text-slate-800 font-weight-bold">{{ inspection?.closedBy || 'Admin' }}</strong>
            </div>
            <div class="text-end">
              <span class="text-caption text-grey d-block" style="font-size: 0.68rem !important;">CLOSED AT</span>
              <span class="text-caption font-weight-medium text-slate-700">{{ formatDateTime(inspection?.closedAt) }}</span>
            </div>
          </div>

          <!-- Allocation Pill -->
          <div v-if="inspection?.closing?.allocation" class="pa-2 bg-slate-50 border rounded-lg d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-2">
              <v-avatar
                size="26"
                :color="inspection.closing.allocation.type === 'bank' ? 'primary' : 'success'"
                variant="tonal"
              >
                <v-icon size="14">
                  {{ inspection.closing.allocation.type === 'bank' ? 'mdi-bank' : 'mdi-cash' }}
                </v-icon>
              </v-avatar>
              <div>
                <span class="text-caption text-grey font-weight-bold d-block" style="font-size: 0.65rem !important;">
                  TREASURY ALLOCATION
                </span>
                <span class="font-weight-bold text-caption text-slate-800">
                  <template v-if="inspection.closing.allocation.type === 'bank'">
                    Bank Deposit: {{ formatCurrency(inspection.closing.allocation.bankAmount) }}
                    <span v-if="inspection.closing.allocation.bankName" class="text-grey font-weight-regular">({{ inspection.closing.allocation.bankName }})</span>
                  </template>
                  <template v-else-if="inspection.closing.allocation.type === 'cash'">
                    Cash in Hand: {{ formatCurrency(inspection.closing.allocation.cashAmount) }}
                  </template>
                  <template v-else>
                    Split: Bank {{ formatCurrency(inspection.closing.allocation.bankAmount) }} • Cash {{ formatCurrency(inspection.closing.allocation.cashAmount) }}
                  </template>
                </span>
              </div>
            </div>
            <v-chip size="x-small" color="primary" variant="flat" class="font-weight-bold">
              Finalized
            </v-chip>
          </div>

          <div v-if="inspection?.closing?.remarks" class="mt-2 text-caption text-grey-darken-2 fst-italic">
            <v-icon size="12" class="me-1">mdi-format-quote-open</v-icon>
            {{ inspection.closing.remarks }}
          </div>
        </div>

        <!-- If Open / In Progress -->
        <div v-else class="open-day-status-notice d-flex align-center justify-space-between bg-blue-grey-lighten-5 pa-2-5 rounded-lg border">
          <div class="d-flex align-center gap-2">
            <v-icon color="primary" size="20">mdi-clipboard-clock-outline</v-icon>
            <div>
              <div class="text-caption font-weight-bold text-slate-900 line-height-tight">
                Active Working Day
              </div>
              <div class="text-caption text-grey-darken-2" style="font-size: 0.68rem !important;">
                {{ summary.pendingDispatchCount > 0 ? `${summary.pendingDispatchCount} delivery still in route` : 'All deliveries returned & settled' }}
              </div>
            </div>
          </div>
          <v-chip size="x-small" :color="summary.pendingDispatchCount > 0 ? 'warning' : 'info'" variant="tonal" class="font-weight-bold">
            {{ summary.pendingDispatchCount > 0 ? 'Delivery Out' : 'Ready on Web' }}
          </v-chip>
        </div>
      </div>

      <!-- 4. Executive Financial KPI Cards (2x2 Grid) -->
      <div class="mobile-kpi-grid mb-3">
        <!-- Milk Received -->
        <div class="mobile-kpi-card pa-3 bg-white border rounded-xl shadow-xs">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase" style="font-size: 0.68rem !important;">
              Milk Received
            </span>
            <v-avatar color="info" size="26" variant="tonal">
              <v-icon size="14" color="info">mdi-truck-delivery</v-icon>
            </v-avatar>
          </div>
          <div class="text-subtitle-1 font-weight-black text-info line-height-tight">
            {{ formatNumber(summary.milkReceivedKg) }} <span class="text-caption font-weight-bold">Kg</span>
          </div>
          <div class="text-caption text-grey font-weight-medium mt-0-5" style="font-size: 0.68rem !important;">
            {{ formatNumber(summary.milkReceivedLiters) }} L • {{ summary.arrivalsCount }} arrivals
          </div>
        </div>

        <!-- Milk Dispatched -->
        <div class="mobile-kpi-card pa-3 bg-white border rounded-xl shadow-xs">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase" style="font-size: 0.68rem !important;">
              Milk Dispatched
            </span>
            <v-avatar color="primary" size="26" variant="tonal">
              <v-icon size="14" color="primary">mdi-truck-fast</v-icon>
            </v-avatar>
          </div>
          <div class="text-subtitle-1 font-weight-black text-primary line-height-tight">
            {{ formatNumber(summary.milkDispatchedKg) }} <span class="text-caption font-weight-bold">Kg</span>
          </div>
          <div class="text-caption text-grey font-weight-medium mt-0-5" style="font-size: 0.68rem !important;">
            {{ summary.dispatchesCount }} routes dispatched
          </div>
        </div>

        <!-- Today Collection -->
        <div class="mobile-kpi-card pa-3 bg-white border rounded-xl shadow-xs">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase" style="font-size: 0.68rem !important;">
              Today Collection
            </span>
            <v-avatar color="success" size="26" variant="tonal">
              <v-icon size="14" color="success">mdi-cash-plus</v-icon>
            </v-avatar>
          </div>
          <div class="text-subtitle-1 font-weight-black text-success line-height-tight">
            {{ formatCurrency(summary.totalCollection) }}
          </div>
          <div class="text-caption text-grey font-weight-medium mt-0-5" style="font-size: 0.68rem !important;">
            Collected from shops
          </div>
        </div>

        <!-- Total Expenses -->
        <div class="mobile-kpi-card pa-3 bg-white border rounded-xl shadow-xs">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase" style="font-size: 0.68rem !important;">
              Total Expenses
            </span>
            <v-avatar color="error" size="26" variant="tonal">
              <v-icon size="14" color="error">mdi-cash-minus</v-icon>
            </v-avatar>
          </div>
          <div class="text-subtitle-1 font-weight-black text-error line-height-tight">
            {{ formatCurrency(summary.totalExpenses) }}
          </div>
          <div class="text-caption text-grey font-weight-medium mt-0-5" style="font-size: 0.68rem !important;">
            Operational expenses
          </div>
        </div>
      </div>

      <!-- Net Cash Flow Hero Banner with Collection Efficiency Progress -->
      <div class="net-flow-hero-card pa-3-5 bg-white border rounded-xl shadow-sm mb-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <div>
            <span class="text-caption font-weight-bold text-uppercase text-grey-darken-1" style="font-size: 0.68rem !important;">
              Net Cash Flow to Finalize
            </span>
            <div class="text-h6 font-weight-black text-primary line-height-tight">
              {{ formatCurrency(summary.netCashFlow) }}
            </div>
          </div>

          <div class="text-end">
            <span class="text-caption font-weight-bold text-uppercase text-grey-darken-1" style="font-size: 0.68rem !important;">
              Collection Efficiency
            </span>
            <div class="text-subtitle-1 font-weight-black" :class="collectionEfficiency >= 80 ? 'text-success' : 'text-warning'">
              {{ collectionEfficiency }}%
            </div>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="w-100 bg-slate-100 rounded-pill overflow-hidden" style="height: 7px;">
          <div
            class="h-100 rounded-pill transition-all"
            :style="{
              width: `${Math.min(100, Math.max(0, collectionEfficiency))}%`,
              backgroundColor: collectionEfficiency >= 80 ? '#10b981' : '#f59e0b'
            }"
          ></div>
        </div>
      </div>

      <!-- 5. Route Deliveries & Shop Settlements (Read-Only Executive Inspection) -->
      <div class="mobile-routes-section mb-4">
        <div class="d-flex align-center justify-space-between mb-2 px-1">
          <div class="d-flex align-center gap-1-5">
            <v-icon color="primary" size="18">mdi-truck-outline</v-icon>
            <h2 class="text-subtitle-2 font-weight-black text-slate-900 text-uppercase mb-0">
              Dispatched Routes ({{ dateDispatches.length }})
            </h2>
          </div>
          <span class="text-caption font-weight-bold text-grey-darken-2">
            {{ summary.pendingDispatchCount > 0 ? `${summary.pendingDispatchCount} In Delivery` : 'All Settled' }}
          </span>
        </div>

        <!-- Empty State -->
        <div
          v-if="dateDispatches.length === 0"
          class="pa-5 bg-white rounded-xl border text-center text-grey-darken-1 shadow-xs"
        >
          <v-icon size="36" color="grey-lighten-1" class="mb-2">mdi-clipboard-text-off-outline</v-icon>
          <div class="font-weight-bold text-body-2 text-slate-800">No Routes Dispatched</div>
          <div class="text-caption text-grey">No milk deliveries recorded on {{ formatDate(selectedDate) }}.</div>
        </div>

        <!-- Route Deliveries (with Route Stepper & Prev/Next Navigation) -->
        <div v-else>
          <!-- Stepper Navigation Header (when multiple routes exist) -->
          <div v-if="dateDispatches.length > 1" class="route-navigation-card bg-white border rounded-xl pa-3 shadow-xs mb-3">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="d-flex align-center gap-1-5">
                <v-chip size="x-small" color="primary" variant="flat" class="font-weight-black">
                  R{{ closingRouteIndex + 1 }}
                </v-chip>
                <span class="text-caption font-weight-black text-slate-900 text-uppercase">
                  Route {{ closingRouteIndex + 1 }} of {{ dateDispatches.length }}
                </span>
              </div>

              <!-- Toggle View Mode: Single Focused Route vs All Routes -->
              <button
                type="button"
                class="text-caption text-primary font-weight-bold"
                @click="closingRouteViewMode = closingRouteViewMode === 'stepper' ? 'list' : 'stepper'"
              >
                {{ closingRouteViewMode === 'stepper' ? 'Show All (' + dateDispatches.length + ')' : 'Single Route View' }}
              </button>
            </div>

            <!-- Stepper Buttons (Previous & Next Route) -->
            <div class="d-flex align-center gap-2">
              <v-btn
                size="small"
                variant="outlined"
                color="primary"
                :disabled="closingRouteIndex === 0"
                class="flex-grow-1 font-weight-bold text-caption text-capitalize rounded-lg"
                @click="prevClosingRoute"
              >
                <v-icon start size="18">mdi-chevron-left</v-icon>
                Previous Route
              </v-btn>

              <v-btn
                size="small"
                variant="flat"
                color="primary"
                :disabled="closingRouteIndex >= dateDispatches.length - 1"
                class="flex-grow-1 font-weight-bold text-caption text-capitalize rounded-lg"
                @click="nextClosingRoute"
              >
                Next Route
                <v-icon end size="18">mdi-chevron-right</v-icon>
              </v-btn>
            </div>

            <!-- Route Quick Selection Chips -->
            <div class="d-flex align-center gap-1-5 mt-2-5 overflow-x-auto no-scrollbar pt-1">
              <button
                v-for="(r, idx) in dateDispatches"
                :key="r.id"
                type="button"
                class="route-select-pill text-caption font-weight-bold"
                :class="{ active: idx === closingRouteIndex }"
                @click="setClosingRouteIndex(idx)"
              >
                R{{ idx + 1 }}: {{ r.areaName || 'Route' }}
              </button>
            </div>
          </div>

          <!-- Route Cards List -->
          <div class="d-flex flex-column gap-3">
            <div
              v-for="(d, loopIdx) in (closingRouteViewMode === 'stepper' && dateDispatches.length > 1 ? (activeClosingRoute ? [activeClosingRoute] : []) : dateDispatches)"
              :key="d.id"
              class="mobile-route-card bg-white border rounded-xl shadow-xs overflow-hidden"
            >
              <!-- Route Header -->
              <div class="pa-3 bg-slate-50 border-b d-flex align-center justify-space-between">
                <div>
                  <div class="d-flex align-center">
                    <v-chip size="x-small" color="primary" variant="flat" class="font-weight-bold me-2">
                      R{{ (closingRouteViewMode === 'stepper' && dateDispatches.length > 1 ? closingRouteIndex : loopIdx) + 1 }}
                    </v-chip>
                    <span class="font-weight-black text-body-1 text-slate-900">
                      {{ d.areaName }}
                    </span>
                  </div>
                  <div class="text-caption text-grey-darken-1 mt-1 font-weight-medium">
                    Driver: <strong>{{ d.driverName }}</strong> • {{ d.vehicleNumber }}
                  </div>
                </div>

                <div>
                  <v-chip
                    size="small"
                    :color="d.status === 'Dispatched' ? 'warning' : 'success'"
                    variant="flat"
                    class="font-weight-bold text-caption px-2-5"
                  >
                    <v-icon start size="13">
                      {{ d.status === 'Dispatched' ? 'mdi-truck-fast' : 'mdi-check-circle' }}
                    </v-icon>
                    {{ d.status === 'Dispatched' ? 'IN ROUTE' : 'SETTLED' }}
                  </v-chip>
                </div>
              </div>

              <!-- Route Financial Ribbon -->
              <div class="px-3 py-2-5 bg-white d-flex align-center justify-space-between text-caption border-b">
                <div>
                  <span class="text-grey-darken-1 d-block font-weight-bold text-uppercase" style="font-size: 0.65rem !important;">MILK SENT</span>
                  <strong class="text-primary font-weight-black">{{ formatNumber(d.totalMilk) }} Kg</strong>
                </div>
                <div v-if="(d.totalReturnMilk || 0) > 0">
                  <span class="text-grey-darken-1 d-block font-weight-bold text-uppercase" style="font-size: 0.65rem !important;">RETURN</span>
                  <strong class="text-orange-darken-4 font-weight-black">{{ formatNumber(d.totalReturnMilk) }} Kg</strong>
                </div>
                <div>
                  <span class="text-grey-darken-1 d-block font-weight-bold text-uppercase" style="font-size: 0.65rem !important;">COLLECTION</span>
                  <strong class="text-success font-weight-black">{{ formatCurrency(d.totalCollection) }}</strong>
                </div>
                <div>
                  <span class="text-grey-darken-1 d-block font-weight-bold text-uppercase" style="font-size: 0.65rem !important;">NEW ARREARS</span>
                  <strong :class="(d.totalNewArrears || 0) > 0 ? 'text-error font-weight-black' : 'text-success font-weight-black'">
                    {{ formatCurrency(d.totalNewArrears) }}
                  </strong>
                </div>
              </div>

              <!-- Route Collection Progress Bar -->
              <div class="px-3 py-2 bg-slate-50 border-b">
                <div class="d-flex align-center justify-space-between text-caption mb-1">
                  <span class="text-grey font-weight-medium" style="font-size: 0.68rem !important;">
                    Collected {{ formatCurrency(d.totalCollection) }} of {{ formatCurrency(getRouteTotalPayable(d)) }}
                  </span>
                  <strong class="font-weight-black" :class="getRouteCollectionPercentage(d) >= 80 ? 'text-success' : 'text-warning'">
                    {{ getRouteCollectionPercentage(d) }}%
                  </strong>
                </div>
                <div class="w-100 bg-grey-lighten-2 rounded-pill overflow-hidden" style="height: 5px;">
                  <div
                    class="h-100 rounded-pill"
                    :style="{
                      width: `${Math.min(100, Math.max(0, getRouteCollectionPercentage(d)))}%`,
                      backgroundColor: getRouteCollectionPercentage(d) >= 80 ? '#10b981' : '#f59e0b'
                    }"
                  ></div>
                </div>
              </div>

              <!-- Expandable Shop List Toggle -->
              <div
                class="d-flex align-center justify-space-between px-3 py-2-5 bg-white cursor-pointer hover:bg-slate-50 transition-colors"
                @click="toggleRouteExpand(d.id)"
              >
                <div class="d-flex align-center">
                  <v-icon size="16" color="primary" class="me-2">mdi-storefront-outline</v-icon>
                  <span class="text-caption font-weight-bold text-slate-800">
                    {{ (d.items || []).length }} Shops in Route
                  </span>
                </div>
                <div class="d-flex align-center text-primary text-caption font-weight-bold">
                  <span>{{ isRouteExpanded(d.id) ? 'Hide' : 'Inspect Shops' }}</span>
                  <v-icon size="16" class="ms-1">{{ isRouteExpanded(d.id) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                </div>
              </div>

              <!-- Redesigned Sophisticated Mobile Shop Cards (Read-Only) -->
              <div v-if="isRouteExpanded(d.id)" class="px-3 pb-3 pt-2 bg-slate-50 d-flex flex-column gap-2 border-t">
                <div
                  v-for="row in (d.items || [])"
                  :key="row.shopId"
                  class="shop-card-native pa-3 rounded-xl border bg-white shadow-xs"
                >
                  <!-- Shop Header -->
                  <div class="d-flex align-center justify-space-between pb-2 mb-2 border-b">
                    <div class="d-flex align-center gap-2">
                      <div class="shop-avatar">
                        <v-icon size="16" color="primary">mdi-storefront</v-icon>
                      </div>
                      <div>
                        <div class="font-weight-black text-body-2 text-slate-900 leading-tight">
                          {{ row.shopName }}
                        </div>
                        <div class="text-caption text-grey-darken-1 font-weight-medium mt-0-5" style="font-size: 0.68rem !important;">
                          Rate: <strong class="text-slate-800">Rs. {{ row.price }}</strong>/Kg
                        </div>
                      </div>
                    </div>

                    <div class="text-end">
                      <span class="text-caption text-grey-darken-1 font-weight-bold d-block text-uppercase" style="font-size: 0.60rem !important;">
                        COLLECTED
                      </span>
                      <span class="text-body-2 font-weight-black text-success line-height-tight">
                        {{ formatCurrency(row.todayCollection) }}
                      </span>
                    </div>
                  </div>

                  <!-- 3-Column Metrics Grid -->
                  <div class="shop-kpi-row pt-1">
                    <div class="shop-kpi-col">
                      <span class="shop-kpi-label">MILK SENT</span>
                      <span class="shop-kpi-val text-primary font-weight-black">
                        {{ formatNumber(row.kgs) }} <small class="font-weight-bold">Kg</small>
                      </span>
                      <span v-if="(row.returnKgs || 0) > 0" class="shop-kpi-sub text-orange-darken-4 font-weight-bold">
                        -{{ formatNumber(row.returnKgs) }} Kg ret
                      </span>
                    </div>

                    <div class="shop-kpi-col border-x px-2">
                      <span class="shop-kpi-label">TOTAL PAYABLE</span>
                      <span class="shop-kpi-val text-slate-900 font-weight-bold">
                        {{ formatCurrency(row.totalPayable) }}
                      </span>
                      <span v-if="(row.previousArrears || 0) > 0" class="shop-kpi-sub text-grey font-weight-medium">
                        Prev: {{ formatCurrency(row.previousArrears) }}
                      </span>
                    </div>

                    <div class="shop-kpi-col text-end ps-2">
                      <span class="shop-kpi-label">BALANCE DUE</span>
                      <div v-if="(row.newArrears || 0) > 0">
                        <span class="shop-kpi-val text-error font-weight-black">
                          {{ formatCurrency(row.newArrears) }}
                        </span>
                      </div>
                      <div v-else>
                        <v-chip size="x-small" color="success" variant="flat" class="font-weight-black text-caption px-1-5" style="height: 18px; font-size: 0.62rem !important;">
                          CLEARED
                        </v-chip>
                      </div>
                    </div>
                  </div>

                  <!-- Mini Collection bar for this shop -->
                  <div class="w-100 bg-slate-100 rounded-pill overflow-hidden mt-2" style="height: 4px;">
                    <div
                      class="h-100 rounded-pill"
                      :style="{
                        width: `${Math.min(100, Math.max(0, getShopCollectionPercent(row)))}%`,
                        backgroundColor: (row.newArrears || 0) <= 0 ? '#10b981' : '#f59e0b'
                      }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 6. Mobile Segmented Tab Controller (Read-Only History & Treasury) -->
      <div class="mobile-tabs-pill-bar mb-3 p-1 bg-slate-200 rounded-lg d-flex gap-1">
        <button
          type="button"
          class="mobile-tab-btn flex-grow-1"
          :class="{ active: activeClosingTab === 'ledger' }"
          @click="activeClosingTab = 'ledger'"
        >
          <v-icon size="16">mdi-history</v-icon>
          <span>Daily Ledger</span>
        </button>

        <button
          type="button"
          class="mobile-tab-btn flex-grow-1"
          :class="{ active: activeClosingTab === 'allocation' }"
          @click="activeClosingTab = 'allocation'"
        >
          <v-icon size="16">mdi-bank-transfer</v-icon>
          <span>Handover Register</span>
        </button>
      </div>

      <!-- TAB 1: DAILY CLOSING LEDGER (Read-Only Audit Cards) -->
      <div v-if="activeClosingTab === 'ledger'" class="mobile-tab-content">
        <!-- Filter chips row -->
        <div class="d-flex align-center gap-1 overflow-x-auto pb-2 mb-2 no-scrollbar">
          <v-chip
            size="small"
            :variant="ledgerFilter === 'all' ? 'flat' : 'outlined'"
            :color="ledgerFilter === 'all' ? 'primary' : 'default'"
            class="font-weight-bold"
            @click="ledgerFilter = 'all'"
          >
            All Days ({{ allLedgerRows.length }})
          </v-chip>
          <v-chip
            size="small"
            :variant="ledgerFilter === 'closed' ? 'flat' : 'outlined'"
            :color="ledgerFilter === 'closed' ? 'success' : 'default'"
            class="font-weight-bold"
            @click="ledgerFilter = 'closed'"
          >
            Closed
          </v-chip>
          <v-chip
            size="small"
            :variant="ledgerFilter === 'pending' ? 'flat' : 'outlined'"
            :color="ledgerFilter === 'pending' ? 'warning' : 'default'"
            class="font-weight-bold"
            @click="ledgerFilter = 'pending'"
          >
            Pending
          </v-chip>
        </div>

        <!-- Ledger Days Card List (Tap card to inspect day) -->
        <div class="d-flex flex-column gap-2-5">
          <div
            v-for="row in paginatedLedgerRows"
            :key="row.date"
            class="mobile-ledger-card pa-3 bg-white border rounded-xl shadow-xs cursor-pointer"
            :class="{ 'card-active-inspect': row.date === selectedDate }"
            @click="inspectMobileDay(row.date)"
          >
            <!-- Card Header: Date & Status -->
            <div class="d-flex align-center justify-space-between mb-2 pb-2 border-b">
              <div class="d-flex align-center gap-1-5">
                <v-icon
                  size="18"
                  :color="row.isClosed ? 'success' : (row.isPreviousUnclosed ? 'warning' : 'primary')"
                >
                  {{ row.isClosed ? 'mdi-calendar-check' : 'mdi-calendar-clock' }}
                </v-icon>
                <span class="font-weight-black text-body-2 text-slate-900">
                  {{ formatDate(row.date) }}
                </span>
                <v-chip
                  v-if="row.date === selectedDate"
                  size="x-small"
                  color="primary"
                  variant="flat"
                  class="font-weight-bold"
                  style="height: 16px; font-size: 0.58rem !important;"
                >
                  Inspecting
                </v-chip>
              </div>

              <v-chip
                size="small"
                :color="row.isClosed ? 'success' : (row.ledgerStatus === 'PendingReturn' ? 'warning' : (row.ledgerStatus === 'PendingClose' ? 'error' : 'primary'))"
                variant="flat"
                class="font-weight-bold text-caption px-2-5"
              >
                <v-icon start size="13">
                  {{ row.isClosed ? 'mdi-check-circle' : 'mdi-clock-outline' }}
                </v-icon>
                {{ getLedgerStatusLabel(row) }}
              </v-chip>
            </div>

            <!-- Metrics Grid -->
            <div class="d-grid mobile-ledger-metrics-grid gap-2 mb-2 text-caption">
              <div>
                <span class="text-grey d-block" style="font-size: 0.65rem !important;">COLLECTION</span>
                <strong class="text-success font-weight-black">
                  {{ formatCurrency(row.summary.totalCollection) }}
                </strong>
              </div>

              <div>
                <span class="text-grey d-block" style="font-size: 0.65rem !important;">EXPENSES</span>
                <strong class="text-error font-weight-bold">
                  {{ formatCurrency(row.summary.totalExpenses) }}
                </strong>
              </div>

              <div>
                <span class="text-grey d-block" style="font-size: 0.65rem !important;">MILK DISPATCHED</span>
                <strong class="text-primary font-weight-bold">
                  {{ formatNumber(row.summary.milkDispatchedKg) }} Kg
                </strong>
              </div>

              <div>
                <span class="text-grey d-block" style="font-size: 0.65rem !important;">ROUTES</span>
                <strong class="text-slate-800 font-weight-bold">
                  {{ row.summary.dispatchesCount }}
                </strong>
              </div>
            </div>

            <!-- Allocation Pill if closed -->
            <div v-if="row.isClosed && row.closing?.allocation" class="pt-2 border-t d-flex align-center justify-space-between">
              <v-chip
                v-if="row.closing.allocation.type === 'bank'"
                size="x-small"
                color="primary"
                variant="tonal"
                class="font-weight-bold"
              >
                <v-icon start size="12">mdi-bank</v-icon>
                Bank: {{ formatCurrency(row.closing.allocation.bankAmount) }}
              </v-chip>
              <v-chip
                v-else-if="row.closing.allocation.type === 'cash'"
                size="x-small"
                color="success"
                variant="tonal"
                class="font-weight-bold"
              >
                <v-icon start size="12">mdi-cash</v-icon>
                Cash: {{ formatCurrency(row.closing.allocation.cashAmount) }}
              </v-chip>
              <v-chip
                v-else-if="row.closing.allocation.type === 'split'"
                size="x-small"
                color="indigo"
                variant="tonal"
                class="font-weight-bold"
              >
                <v-icon start size="12">mdi-call-split</v-icon>
                Split Bank &amp; Cash
              </v-chip>

              <span class="text-caption text-grey font-weight-medium" style="font-size: 0.68rem !important;">
                By {{ row.closing?.closedBy || 'Admin' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Mobile Pagination -->
        <div class="d-flex align-center justify-space-between mt-3 px-1">
          <v-btn
            size="small"
            variant="tonal"
            :disabled="page <= 1"
            class="text-capitalize font-weight-bold"
            @click="page--"
          >
            Previous
          </v-btn>
          <span class="text-caption text-grey font-weight-medium">
            Page {{ page }} of {{ totalLedgerPages }}
          </span>
          <v-btn
            size="small"
            variant="tonal"
            :disabled="page >= totalLedgerPages"
            class="text-capitalize font-weight-bold"
            @click="page++"
          >
            Next
          </v-btn>
        </div>
      </div>

      <!-- TAB 2: CASH & BANK HANDOVER REGISTER (Treasury Audit Cards) -->
      <div v-if="activeClosingTab === 'allocation'" class="mobile-tab-content">
        <!-- 3 Highlight Metric Cards (2 in 1 row grid) -->
        <div class="mobile-kpi-grid mb-3">
          <!-- Total Allocated to Bank -->
          <div class="pa-3 rounded-xl d-flex align-center gap-2-5 handover-stat-card card-bank border shadow-xs bg-white">
            <v-avatar color="primary" size="32" variant="tonal">
              <v-icon color="primary" size="18">mdi-bank</v-icon>
            </v-avatar>
            <div style="min-width: 0;">
              <div class="text-caption font-weight-bold text-primary text-uppercase text-truncate" style="font-size: 0.65rem !important;">
                Allocated to Bank
              </div>
              <div class="text-subtitle-2 font-weight-black text-primary line-height-tight text-truncate">
                {{ formatCurrency(totalBankAllocated) }}
              </div>
            </div>
          </div>

          <!-- Total Retained in Cash -->
          <div class="pa-3 rounded-xl d-flex align-center gap-2-5 handover-stat-card card-cash border shadow-xs bg-white">
            <v-avatar color="success" size="32" variant="tonal">
              <v-icon color="success" size="18">mdi-cash-multiple</v-icon>
            </v-avatar>
            <div style="min-width: 0;">
              <div class="text-caption font-weight-bold text-success text-uppercase text-truncate" style="font-size: 0.65rem !important;">
                Retained in Cash
              </div>
              <div class="text-subtitle-2 font-weight-black text-success line-height-tight text-truncate">
                {{ formatCurrency(totalCashAllocated) }}
              </div>
            </div>
          </div>

          <!-- Total Cash Flow Finalized -->
          <div class="pa-3 rounded-xl d-flex align-center justify-space-between handover-stat-card card-net border shadow-xs bg-white" style="grid-column: 1 / -1;">
            <div class="d-flex align-center gap-2-5">
              <v-avatar color="indigo-darken-3" size="32" variant="tonal">
                <v-icon color="indigo-darken-3" size="18">mdi-check-decagram</v-icon>
              </v-avatar>
              <div>
                <div class="text-caption font-weight-bold text-indigo-darken-3 text-uppercase" style="font-size: 0.68rem !important;">
                  Total Cash Flow Finalized
                </div>
                <div class="text-subtitle-1 font-weight-black text-indigo-darken-3 line-height-tight">
                  {{ formatCurrency(totalNetAllocated) }}
                </div>
              </div>
            </div>
            <v-chip size="x-small" color="indigo-darken-3" variant="flat" class="font-weight-black">
              Finalized
            </v-chip>
          </div>
        </div>

        <!-- Method filter chips -->
        <div class="d-flex align-center gap-1 overflow-x-auto pb-2 mb-2 no-scrollbar">
          <v-chip
            size="small"
            :variant="allocationTypeFilter === 'all' ? 'flat' : 'outlined'"
            :color="allocationTypeFilter === 'all' ? 'primary' : 'default'"
            class="font-weight-bold"
            @click="allocationTypeFilter = 'all'"
          >
            All Methods ({{ closedAllocationRows.length }})
          </v-chip>
          <v-chip
            size="small"
            :variant="allocationTypeFilter === 'bank' ? 'flat' : 'outlined'"
            :color="allocationTypeFilter === 'bank' ? 'primary' : 'default'"
            class="font-weight-bold"
            @click="allocationTypeFilter = 'bank'"
          >
            Bank ({{ allocationBankCount }})
          </v-chip>
          <v-chip
            size="small"
            :variant="allocationTypeFilter === 'cash' ? 'flat' : 'outlined'"
            :color="allocationTypeFilter === 'cash' ? 'success' : 'default'"
            class="font-weight-bold"
            @click="allocationTypeFilter = 'cash'"
          >
            Cash ({{ allocationCashCount }})
          </v-chip>
          <v-chip
            size="small"
            :variant="allocationTypeFilter === 'split' ? 'flat' : 'outlined'"
            :color="allocationTypeFilter === 'split' ? 'indigo' : 'default'"
            class="font-weight-bold"
            @click="allocationTypeFilter = 'split'"
          >
            Split ({{ allocationSplitCount }})
          </v-chip>
        </div>

        <!-- Handover Record Cards List -->
        <div class="d-flex flex-column gap-2-5">
          <div
            v-for="row in paginatedAllocationRows"
            :key="row.date"
            class="mobile-ledger-card pa-3 bg-white border rounded-xl shadow-xs cursor-pointer"
            @click="inspectMobileDay(row.date)"
          >
            <div class="d-flex align-center justify-space-between mb-2 pb-1 border-b">
              <span class="font-weight-black text-body-2 text-slate-800">
                {{ formatDate(row.date) }}
              </span>

              <v-chip
                v-if="row.type === 'bank'"
                size="x-small"
                color="primary"
                variant="tonal"
                class="font-weight-bold"
              >
                Bank Deposit
              </v-chip>
              <v-chip
                v-else-if="row.type === 'cash'"
                size="x-small"
                color="success"
                variant="tonal"
                class="font-weight-bold"
              >
                Cash in Hand
              </v-chip>
              <v-chip
                v-else-if="row.type === 'split'"
                size="x-small"
                color="indigo"
                variant="tonal"
                class="font-weight-bold"
              >
                Custom Split
              </v-chip>
            </div>

            <div class="d-flex align-center justify-space-between mb-2">
              <div>
                <span class="text-caption text-grey d-block" style="font-size: 0.65rem !important;">FINAL AMOUNT</span>
                <strong class="text-subtitle-2 font-weight-black text-primary">
                  {{ formatCurrency(row.remainingAmount) }}
                </strong>
              </div>

              <div class="text-end">
                <span class="text-caption text-grey d-block" style="font-size: 0.65rem !important;">CLOSED BY</span>
                <span class="text-caption font-weight-bold text-slate-800">
                  {{ row.closedBy }}
                </span>
              </div>
            </div>

            <!-- Bank / Cash breakdown -->
            <div v-if="row.type === 'bank' || row.type === 'split'" class="pa-2 bg-slate-50 rounded border text-caption mb-1">
              <div v-if="row.bankName || row.bankRef">
                Bank: <strong>{{ row.bankName || '-' }}</strong> (Ref: {{ row.bankRef || '-' }})
              </div>
              <div>Bank Amount: <strong class="text-primary">{{ formatCurrency(row.bankAmount) }}</strong></div>
            </div>

            <div v-if="row.type === 'cash' || row.type === 'split'" class="pa-2 bg-slate-50 rounded border text-caption">
              <div>Cash Amount: <strong class="text-success">{{ formatCurrency(row.cashAmount) }}</strong></div>
            </div>
          </div>
        </div>

        <!-- Handover Pagination -->
        <div class="d-flex align-center justify-space-between mt-3 px-1">
          <v-btn
            size="small"
            variant="tonal"
            :disabled="allocationPage <= 1"
            class="text-capitalize font-weight-bold"
            @click="allocationPage--"
          >
            Previous
          </v-btn>
          <span class="text-caption text-grey font-weight-medium">
            Page {{ allocationPage }} of {{ totalAllocationPages }}
          </span>
          <v-btn
            size="small"
            variant="tonal"
            :disabled="allocationPage >= totalAllocationPages"
            class="text-capitalize font-weight-bold"
            @click="allocationPage++"
          >
            Next
          </v-btn>
        </div>
      </div>

      <!-- Read-Only Executive Guidance Footer -->
      <div class="mt-4 pa-3 bg-slate-100 rounded-lg text-center text-caption text-grey-darken-1 border">
        <v-icon size="14" class="me-1" color="grey">mdi-shield-check-outline</v-icon>
        Mobile view is optimized for read-only inspection. New entries, settlements, and closures are managed on desktop web.
      </div>
    </div>

    <!-- DIALOG: Date Picker Modal -->
    <v-dialog v-model="datePickerModal" max-width="360px">
      <v-card class="rounded-xl pa-4">
        <h3 class="text-subtitle-1 font-weight-bold mb-3 text-slate-800">
          Select Day to Inspect
        </h3>
        <AppDatePicker
          v-model="selectedDate"
          label="Business Date"
          :enforce-business-day="false"
          hide-details
          class="mb-4"
          @change="onModalDateSelect"
        />
        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" @click="datePickerModal = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="datePickerModal = false; loadInspection()">Inspect Day</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { dayClosingService } from '@/services/dayClosingService';
import { useBusinessDayStore } from '@/stores/businessDay';
import { useSnackbarStore } from '@/stores/snackbar';
import { formatCurrency, formatNumber, formatDate, formatDateTime } from '@/utils/formatters';
import AppDatePicker from '@/components/common/AppDatePicker.vue';

const businessDayStore = useBusinessDayStore();
const snackbar = useSnackbarStore();

const loading = ref(false);
const selectedDate = ref(businessDayStore.activeBusinessDate);
const inspection = ref(null);
const datePickerModal = ref(false);
const expandedRouteIds = ref(new Set());
const closingRouteIndex = ref(0);
const closingRouteViewMode = ref('stepper'); // 'stepper' or 'list'

// Tab & Filters
const activeClosingTab = ref('ledger');
const ledgerFilter = ref('all');
const allocationTypeFilter = ref('all');
const page = ref(1);
const itemsPerPage = ref(10);
const allocationPage = ref(1);
const allocationItemsPerPage = ref(10);

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
};

const summary = computed(() => inspection.value?.summary || defaultSummary);
const dateDispatches = computed(() => inspection.value?.dispatches || []);

const activeClosingRoute = computed(() => {
  if (!dateDispatches.value || dateDispatches.value.length === 0) return null;
  const idx = Math.min(Math.max(0, closingRouteIndex.value), dateDispatches.value.length - 1);
  return dateDispatches.value[idx];
});

watch([dateDispatches, selectedDate], () => {
  if (closingRouteIndex.value >= dateDispatches.value.length) {
    closingRouteIndex.value = Math.max(0, dateDispatches.value.length - 1);
  }
  if (activeClosingRoute.value) {
    expandedRouteIds.value.add(activeClosingRoute.value.id);
  }
});

function prevClosingRoute() {
  if (closingRouteIndex.value > 0) {
    closingRouteIndex.value--;
    if (activeClosingRoute.value) {
      expandedRouteIds.value.add(activeClosingRoute.value.id);
    }
  }
}

function nextClosingRoute() {
  if (closingRouteIndex.value < dateDispatches.value.length - 1) {
    closingRouteIndex.value++;
    if (activeClosingRoute.value) {
      expandedRouteIds.value.add(activeClosingRoute.value.id);
    }
  }
}

function setClosingRouteIndex(idx) {
  closingRouteIndex.value = idx;
  if (activeClosingRoute.value) {
    expandedRouteIds.value.add(activeClosingRoute.value.id);
  }
}

const isNextDayDisabled = computed(() => {
  if (!selectedDate.value) return false;
  const max = businessDayStore.maxAllowedDate || businessDayStore.realToday;
  return selectedDate.value >= max;
});

const collectionEfficiency = computed(() => {
  const collection = Number(summary.value.totalCollection) || 0;
  const dispatchAmt = Number(summary.value.totalDispatchAmount) || 0;
  if (dispatchAmt <= 0) return collection > 0 ? 100 : 0;
  return Math.round((collection / dispatchAmt) * 100);
});

function stepDay(offset) {
  if (!selectedDate.value) return;
  const current = new Date(selectedDate.value + 'T00:00:00');
  current.setDate(current.getDate() + offset);
  const y = current.getFullYear();
  const m = String(current.getMonth() + 1).padStart(2, '0');
  const d = String(current.getDate()).padStart(2, '0');
  const nextDateStr = `${y}-${m}-${d}`;

  const max = businessDayStore.maxAllowedDate || businessDayStore.realToday;
  if (offset > 0 && nextDateStr > max) return;

  selectedDate.value = nextDateStr;
  loadInspection();
}

function onModalDateSelect(val) {
  if (val) {
    selectedDate.value = val;
    loadInspection();
    datePickerModal.value = false;
  }
}

// Route Accordion
function toggleRouteExpand(id) {
  if (expandedRouteIds.value.has(id)) {
    expandedRouteIds.value.delete(id);
  } else {
    expandedRouteIds.value.add(id);
  }
}

function isRouteExpanded(id) {
  return expandedRouteIds.value.has(id);
}

function getRouteTotalPayable(d) {
  return (Number(d.totalAmount) || 0) + (Number(d.totalPreviousArrears) || 0);
}

function getRouteCollectionPercentage(d) {
  const payable = getRouteTotalPayable(d);
  const collected = Number(d.totalCollection) || 0;
  if (payable <= 0) return collected > 0 ? 100 : 0;
  return Math.round((collected / payable) * 100);
}

function getShopCollectionPercent(row) {
  const payable = Number(row.totalPayable) || 0;
  const collected = Number(row.todayCollection) || 0;
  if (payable <= 0) return collected > 0 ? 100 : 0;
  return Math.round((collected / payable) * 100);
}

// Badge status
const getStatusBadgeClass = computed(() => {
  if (inspection.value?.isClosed) return 'badge-closed';
  if (inspection.value?.canClose) return 'badge-ready';
  if (summary.value.pendingDispatchCount > 0) return 'badge-out';
  return 'badge-active';
});

const getStatusBadgeLabel = computed(() => {
  if (inspection.value?.isClosed) return 'Day Closed';
  if (inspection.value?.canClose) return 'Ready to Close (Web)';
  if (summary.value.pendingDispatchCount > 0) return 'Deliveries Out';
  return 'In Progress';
});

// Inspection & refresh
async function loadInspection() {
  loading.value = true;
  try {
    inspection.value = await dayClosingService.inspectDayStatus(selectedDate.value);
    if (inspection.value?.dispatches && inspection.value.dispatches.length > 0) {
      // By default expand the first route for easy inspection
      expandedRouteIds.value.clear();
      expandedRouteIds.value.add(inspection.value.dispatches[0].id);
    }
  } catch (err) {
    snackbar.error('Failed to load day inspection');
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

function inspectMobileDay(dateStr) {
  selectedDate.value = dateStr;
  loadInspection();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Ledger data list
const allLedgerRows = computed(() => businessDayStore.ledgerRows || []);

const filteredLedgerRows = computed(() => {
  let rows = allLedgerRows.value;
  if (ledgerFilter.value === 'closed') {
    rows = rows.filter((r) => r.isClosed);
  } else if (ledgerFilter.value === 'pending') {
    rows = rows.filter((r) => !r.isClosed);
  }
  return rows;
});

const totalLedgerPages = computed(() => Math.max(1, Math.ceil(filteredLedgerRows.value.length / itemsPerPage.value)));

const paginatedLedgerRows = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  return filteredLedgerRows.value.slice(start, start + itemsPerPage.value);
});

function getLedgerStatusTagClass(row) {
  if (row.ledgerStatus === 'Closed') return 'erp-tag-green';
  if (row.ledgerStatus === 'PendingReturn') return 'erp-tag-orange';
  if (row.ledgerStatus === 'PendingClose') return 'erp-tag-red';
  return 'erp-tag-blue';
}

function getLedgerStatusLabel(row) {
  if (row.ledgerStatus === 'Closed') return 'CLOSED';
  if (row.ledgerStatus === 'PendingReturn') return `OUT (${row.summary.pendingDispatchCount})`;
  if (row.ledgerStatus === 'PendingClose') return 'READY';
  return 'OPEN';
}

// Handover register
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
  return rows;
});

const totalAllocationPages = computed(() => Math.max(1, Math.ceil(filteredAllocationRows.value.length / allocationItemsPerPage.value)));

const paginatedAllocationRows = computed(() => {
  const start = (allocationPage.value - 1) * allocationItemsPerPage.value;
  return filteredAllocationRows.value.slice(start, start + allocationItemsPerPage.value);
});

const allocationBankCount = computed(() => closedAllocationRows.value.filter((r) => r.type === 'bank').length);
const allocationCashCount = computed(() => closedAllocationRows.value.filter((r) => r.type === 'cash').length);
const allocationSplitCount = computed(() => closedAllocationRows.value.filter((r) => r.type === 'split').length);

const totalBankAllocated = computed(() => filteredAllocationRows.value.reduce((acc, r) => acc + (r.bankAmount || 0), 0));
const totalCashAllocated = computed(() => filteredAllocationRows.value.reduce((acc, r) => acc + (r.cashAmount || 0), 0));
const totalNetAllocated = computed(() => filteredAllocationRows.value.reduce((acc, r) => acc + (r.remainingAmount || 0), 0));

onMounted(async () => {
  await businessDayStore.refreshBusinessDay();
  selectedDate.value = businessDayStore.activeBusinessDate || businessDayStore.realToday;
  await loadInspection();
});
</script>

<style scoped>
.mobile-day-closing-page {
  background-color: #f8fafc;
  min-height: 100vh;
}

.sticky-top {
  position: sticky;
  top: 56px;
  z-index: 30;
}

.mobile-app-header {
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.05);
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

.mobile-lock-alert {
  background: #fffbeb;
  border-color: #fcd34d !important;
}

.mobile-kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 10px !important;
}

.mobile-kpi-card {
  transition: transform 0.15s ease;
  background: #ffffff;
  border: 1px solid #000000 !important;
  border-radius: 10px !important;
}

.net-flow-hero-card {
  border-color: #bfdbfe !important;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.shop-read-only-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 12px;
}

.mobile-tabs-pill-bar {
  border: 1px solid #cbd5e1;
}

.mobile-tab-btn {
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  background: transparent;
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mobile-tab-btn.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.mobile-ledger-card {
  transition: all 0.15s ease;
}

.mobile-ledger-card.card-active-inspect {
  border-color: #3b82f6 !important;
  background-color: #f8faff !important;
  box-shadow: 0 0 0 1.5px #3b82f6 !important;
}

.mobile-ledger-metrics-grid {
  grid-template-columns: repeat(2, 1fr);
}

/* Status Badges */
.settlement-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 800;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.badge-ready {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
}
.badge-ready .status-dot {
  background: #2563eb;
}

.badge-out {
  background: #fff8e1;
  border: 1px solid #fcd34d;
  color: #b45309;
}
.badge-out .status-dot {
  background: #f59e0b;
}

.badge-closed {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #047857;
}
.badge-closed .status-dot {
  background: #10b981;
}

.badge-active {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
}
.badge-active .status-dot {
  background: #94a3b8;
}

/* Route Stepper Navigation & Shop Breakdown Native Cards */
.route-navigation-card {
  background: #ffffff;
  border: 1px solid #000000 !important;
  border-radius: 10px !important;
}

.route-select-pill {
  padding: 4px 10px;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
}

.route-select-pill.active {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

.shop-card-native {
  background: #ffffff;
  border: 1px solid #000000 !important;
  border-radius: 10px !important;
}

.shop-avatar {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background-color: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shop-kpi-row {
  display: grid;
  grid-template-columns: 1fr 1.15fr 1fr;
  align-items: flex-start;
  gap: 6px;
}

.shop-kpi-col {
  display: flex;
  flex-direction: column;
}

.shop-kpi-label {
  font-size: 0.62rem !important;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.3px;
  margin-bottom: 2px;
}

.shop-kpi-val {
  font-size: 0.82rem !important;
  line-height: 1.25;
}

.shop-kpi-sub {
  font-size: 0.62rem !important;
  margin-top: 2px;
}

/* Handover Register Metric Cards with Crisp Borders */
.handover-stat-card {
  border-radius: 8px !important;
  box-sizing: border-box;
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

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.line-height-tight {
  line-height: 1.15;
}
</style>
