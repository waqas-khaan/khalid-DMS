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
      <div class="mobile-date-stepper d-flex align-center justify-space-between gap-1 pa-1 bg-slate-100 rounded-lg border">
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

      <!-- 4. Executive Financial KPI Cards (2x2 Grid) -->
      <div class="mobile-kpi-grid mb-3">
        <!-- Milk Received -->
        <div class="mobile-kpi-card milk-in-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Milk Received</span>
            <div class="kpi-icon-badge bg-sky-50 text-sky-600">
              <v-icon size="16">mdi-truck-delivery</v-icon>
            </div>
          </div>
          <div class="kpi-value text-sky-700">
            {{ formatNumber(summary.milkReceivedKg) }} <span class="kpi-unit">Kg</span>
          </div>
          <div class="kpi-subtitle">
            {{ formatNumber(summary.milkReceivedLiters) }} L • {{ summary.arrivalsCount }} arrivals
          </div>
        </div>

        <!-- Milk Dispatched -->
        <div class="mobile-kpi-card milk-out-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Milk Dispatched</span>
            <div class="kpi-icon-badge bg-blue-50 text-blue-600">
              <v-icon size="16">mdi-truck-fast</v-icon>
            </div>
          </div>
          <div class="kpi-value text-blue-700">
            {{ formatNumber(summary.milkDispatchedKg) }} <span class="kpi-unit">Kg</span>
          </div>
          <div class="kpi-subtitle">
            {{ summary.dispatchesCount }} routes dispatched
          </div>
        </div>

        <!-- Today Collection -->
        <div class="mobile-kpi-card income-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Today Collection</span>
            <div class="kpi-icon-badge bg-emerald-50 text-emerald-600">
              <v-icon size="16">mdi-cash-plus</v-icon>
            </div>
          </div>
          <div class="kpi-value text-emerald-600">
            {{ formatCurrency(summary.totalCollection) }}
          </div>
          <div class="kpi-subtitle">
            Collected from shops
          </div>
        </div>

        <!-- Total Expenses -->
        <div class="mobile-kpi-card expense-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Total Expenses</span>
            <div class="kpi-icon-badge bg-rose-50 text-rose-600">
              <v-icon size="16">mdi-cash-minus</v-icon>
            </div>
          </div>
          <div class="kpi-value text-rose-600">
            {{ formatCurrency(summary.totalExpenses) }}
          </div>
          <div class="kpi-subtitle">
            Operational expenses
          </div>
        </div>
      </div>

      <!-- Net Cash Flow Hero Banner with Clear Math Breakdown & Collection Rate -->
      <div class="net-flow-hero-card pa-3-5 bg-white border rounded-xl shadow-sm mb-4">
        <div class="d-flex align-center justify-space-between mb-2-5">
          <div>
            <div class="d-flex align-center gap-1-5">
              <v-icon size="16" color="primary">mdi-cash-check</v-icon>
              <span class="text-caption font-weight-bold text-uppercase text-slate-600" style="font-size: 0.70rem !important; letter-spacing: 0.03em;">
                Net Cash in Hand
              </span>
              <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold" style="height: 18px; font-size: 0.60rem !important; padding: 0 6px;">
                To Finalize
              </v-chip>
            </div>
            <div class="text-h6 font-weight-black text-sky-800 line-height-tight mt-1">
              {{ formatCurrency(summary.netCashFlow) }}
            </div>
          </div>

          <div class="text-end">
            <span class="text-caption font-weight-bold text-uppercase text-slate-500 d-block" style="font-size: 0.68rem !important; letter-spacing: 0.03em;">
              Collection Rate
            </span>
            <div class="text-subtitle-1 font-weight-black line-height-tight mt-1" :class="collectionEfficiency >= 80 ? 'text-success' : 'text-warning'">
              {{ collectionEfficiency }}%
            </div>
          </div>
        </div>

        <!-- Math Breakdown Pill: Collection - Expenses = Net Cash -->
        <div class="px-2-5 py-2 rounded-lg bg-slate-50 border d-flex align-center justify-space-between text-caption text-slate-700 font-weight-medium" style="font-size: 0.70rem !important;">
          <div class="d-flex align-center gap-1 text-no-wrap">
            <span class="text-slate-500">Collected:</span>
            <strong class="text-success font-weight-bold">{{ formatCurrency(summary.totalCollection) }}</strong>
          </div>
          <span class="text-slate-400 font-weight-bold mx-1">−</span>
          <div class="d-flex align-center gap-1 text-no-wrap">
            <span class="text-slate-500">Expenses:</span>
            <strong class="text-error font-weight-bold">{{ formatCurrency(summary.totalExpenses) }}</strong>
          </div>
          <span class="text-slate-400 font-weight-bold mx-1">=</span>
          <div class="text-no-wrap">
            <strong class="text-sky-800 font-weight-black">{{ formatCurrency(summary.netCashFlow) }}</strong>
          </div>
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

              <!-- Route Key Financial Stats (Clean 3-Box Row) -->
              <div class="pa-3 bg-white">
                <div class="route-kpi-grid text-caption mb-2">
                  <!-- Milk Sent -->
                  <div class="pa-2 rounded-lg bg-sky-50 border border-sky-100">
                    <span class="text-sky-800 font-weight-bold text-uppercase d-block" style="font-size: 0.60rem !important;">MILK SENT</span>
                    <div class="font-weight-black text-body-2 text-sky-900 text-no-wrap mt-0-5">
                      {{ formatNumber(d.totalMilk) }} <span class="text-caption font-weight-bold text-sky-950">Kg</span>
                    </div>
                    <div v-if="(d.totalReturnMilk || 0) > 0" class="text-orange-darken-4 font-weight-bold text-no-wrap mt-0-5" style="font-size: 0.62rem !important;">
                      -{{ formatNumber(d.totalReturnMilk) }} Kg ret
                    </div>
                    <div v-else class="text-slate-400 font-weight-medium text-no-wrap mt-0-5" style="font-size: 0.62rem !important;">
                      0 Kg ret
                    </div>
                  </div>

                  <!-- Collection -->
                  <div class="pa-2 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span class="text-emerald-800 font-weight-bold text-uppercase d-block" style="font-size: 0.60rem !important;">COLLECTED</span>
                    <div class="font-weight-black text-body-2 text-emerald-900 text-no-wrap mt-0-5">
                      {{ formatCurrency(d.totalCollection) }}
                    </div>
                    <div class="text-emerald-700 font-weight-medium text-no-wrap mt-0-5" style="font-size: 0.62rem !important;">
                      Cash received
                    </div>
                  </div>

                  <!-- New Arrears -->
                  <div class="pa-2 rounded-lg border" :class="(d.totalNewArrears || 0) > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50'">
                    <span class="font-weight-bold text-uppercase d-block" :class="(d.totalNewArrears || 0) > 0 ? 'text-rose-800' : 'text-slate-600'" style="font-size: 0.60rem !important;">
                      NEW ARREARS
                    </span>
                    <div class="font-weight-black text-body-2 text-no-wrap mt-0-5" :class="(d.totalNewArrears || 0) > 0 ? 'text-rose-900' : 'text-emerald-700'">
                      {{ formatCurrency(d.totalNewArrears) }}
                    </div>
                    <div class="font-weight-medium text-no-wrap mt-0-5" :class="(d.totalNewArrears || 0) > 0 ? 'text-rose-700' : 'text-slate-500'" style="font-size: 0.62rem !important;">
                      {{ (d.totalNewArrears || 0) > 0 ? 'Pending dues' : 'All cleared' }}
                    </div>
                  </div>
                </div>

                <!-- Route Progress Bar -->
                <div class="pt-2 border-t">
                  <div class="d-flex align-center justify-space-between text-caption mb-1">
                    <span class="text-slate-600 font-weight-medium" style="font-size: 0.70rem !important;">
                      Route Collection: <strong>{{ formatCurrency(d.totalCollection) }}</strong> of {{ formatCurrency(getRouteTotalPayable(d)) }}
                    </span>
                    <span class="font-weight-black" :class="getRouteCollectionPercentage(d) >= 80 ? 'text-success' : 'text-warning'" style="font-size: 0.72rem !important;">
                      {{ getRouteCollectionPercentage(d) }}%
                    </span>
                  </div>
                  <div class="w-100 bg-slate-100 rounded-pill overflow-hidden" style="height: 6px;">
                    <div
                      class="h-100 rounded-pill transition-all"
                      :style="{
                        width: `${Math.min(100, Math.max(0, getRouteCollectionPercentage(d)))}%`,
                        backgroundColor: getRouteCollectionPercentage(d) >= 80 ? '#10b981' : '#f59e0b'
                      }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- Expandable Shop List Toggle -->
              <div
                class="d-flex align-center justify-space-between px-3 py-2-5 bg-slate-50 border-t cursor-pointer hover:bg-slate-100 transition-colors"
                @click="toggleRouteExpand(d.id)"
              >
                <div class="d-flex align-center gap-1-5">
                  <v-icon size="16" color="primary">mdi-storefront-outline</v-icon>
                  <span class="text-caption font-weight-bold text-slate-800">
                    {{ (d.items || []).length === 1 ? '1 Shop in this route' : `${(d.items || []).length} Shops in this route` }}
                  </span>
                </div>
                <div class="d-flex align-center text-primary text-caption font-weight-bold">
                  <span>{{ isRouteExpanded(d.id) ? 'Hide Shops' : 'View Shop Breakdown' }}</span>
                  <v-icon size="16" class="ms-1">{{ isRouteExpanded(d.id) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                </div>
              </div>

              <!-- Clean Shop Breakdown List (Read-Only) -->
              <div v-if="isRouteExpanded(d.id)" class="pa-3 bg-slate-100 border-t d-flex flex-column gap-2-5">
                <div
                  v-for="row in (d.items || [])"
                  :key="row.shopId"
                  class="bg-white rounded-xl border pa-3 shadow-xs"
                >
                  <!-- Shop Header: Name, Rate & Balance Due Status -->
                  <div class="d-flex align-center justify-space-between pb-2 mb-2 border-b">
                    <div class="d-flex align-center gap-2">
                      <div class="shop-avatar">
                        <v-icon size="16" color="primary">mdi-storefront</v-icon>
                      </div>
                      <div>
                        <div class="font-weight-black text-body-2 text-slate-900 leading-tight">
                          {{ row.shopName }}
                        </div>
                        <div class="text-caption text-slate-500 font-weight-medium mt-0-5" style="font-size: 0.70rem !important;">
                          Selling Rate: <strong class="text-slate-800">Rs. {{ row.price }}</strong>/Kg
                        </div>
                      </div>
                    </div>

                    <!-- Right Header: Prominent Balance Due or Cleared Status -->
                    <div class="text-end">
                      <div v-if="(row.newArrears || 0) > 0">
                        <span class="text-caption text-rose-700 font-weight-bold d-block text-uppercase" style="font-size: 0.60rem !important;">
                          BALANCE DUE
                        </span>
                        <span class="text-body-2 font-weight-black text-rose-600 line-height-tight text-no-wrap">
                          {{ formatCurrency(row.newArrears) }}
                        </span>
                      </div>
                      <div v-else>
                        <v-chip size="x-small" color="success" variant="flat" class="font-weight-black text-caption px-2" style="height: 20px;">
                          CLEARED
                        </v-chip>
                      </div>
                    </div>
                  </div>

                  <!-- Shop Financial Details: 2 Balanced Columns -->
                  <div class="shop-metrics-grid text-caption">
                    <!-- Delivery Side -->
                    <div class="pa-2 rounded-lg bg-slate-50 border">
                      <div class="d-flex align-center justify-space-between">
                        <span class="text-slate-500 font-weight-medium" style="font-size: 0.68rem !important;">Milk Sent:</span>
                        <strong class="text-primary font-weight-black text-no-wrap">{{ formatNumber(row.kgs) }} Kg</strong>
                      </div>
                      <div v-if="(row.returnKgs || 0) > 0" class="d-flex align-center justify-space-between mt-1 text-orange-darken-4 font-weight-bold" style="font-size: 0.65rem !important;">
                        <span>Return:</span>
                        <span>-{{ formatNumber(row.returnKgs) }} Kg</span>
                      </div>
                      <div class="d-flex align-center justify-space-between mt-1 pt-1 border-t text-slate-700" style="font-size: 0.68rem !important;">
                        <span>Today's Bill:</span>
                        <strong class="text-slate-900 text-no-wrap">{{ formatCurrency(row.todayAmount || ((row.kgs - (row.returnKgs || 0)) * row.price)) }}</strong>
                      </div>
                    </div>

                    <!-- Payment & Arrears Side -->
                    <div class="pa-2 rounded-lg bg-slate-50 border">
                      <div class="d-flex align-center justify-space-between">
                        <span class="text-slate-500 font-weight-medium" style="font-size: 0.68rem !important;">Collected:</span>
                        <strong class="text-success font-weight-black text-no-wrap">{{ formatCurrency(row.todayCollection) }}</strong>
                      </div>
                      <div class="d-flex align-center justify-space-between mt-1 text-slate-500" style="font-size: 0.65rem !important;">
                        <span>Prev Arrears:</span>
                        <span class="font-weight-bold text-slate-700 text-no-wrap">{{ formatCurrency(row.previousArrears || 0) }}</span>
                      </div>
                      <div class="d-flex align-center justify-space-between mt-1 pt-1 border-t text-slate-700" style="font-size: 0.68rem !important;">
                        <span>Total Payable:</span>
                        <strong class="text-slate-900 text-no-wrap">{{ formatCurrency(row.totalPayable) }}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 6. Mobile Segmented Tab Controller (Read-Only History & Treasury) -->
      <div class="mobile-tabs-pill-bar mb-3 pa-1 bg-slate-200 rounded-lg d-flex gap-1">
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
            <div class="d-flex align-center justify-space-between mb-2-5 pb-2 border-b">
              <div class="d-flex align-center gap-2">
                <v-avatar size="28" :color="row.isClosed ? 'success' : 'warning'" variant="tonal" class="rounded-lg">
                  <v-icon size="16">
                    {{ row.isClosed ? 'mdi-calendar-check' : 'mdi-calendar-clock' }}
                  </v-icon>
                </v-avatar>
                <div>
                  <div class="d-flex align-center gap-1-5">
                    <span class="font-weight-black text-body-2 text-slate-900 line-height-tight">
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
                  <span class="text-caption text-slate-500 font-weight-medium" style="font-size: 0.68rem !important;">
                    {{ row.summary.dispatchesCount }} {{ row.summary.dispatchesCount === 1 ? 'Route' : 'Routes' }}
                  </span>
                </div>
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

            <!-- 2x2 Clean Metrics Grid -->
            <div class="ledger-metrics-grid mb-2">
              <!-- Collection Box -->
              <div class="pa-2 rounded-lg bg-emerald-50 border border-emerald-100">
                <span class="ledger-kpi-label text-emerald-800">COLLECTION</span>
                <div class="font-weight-black text-body-2 text-emerald-900 text-no-wrap mt-0-5">
                  {{ formatCurrency(row.summary.totalCollection) }}
                </div>
              </div>

              <!-- Expenses Box -->
              <div class="pa-2 rounded-lg bg-rose-50 border border-rose-100">
                <span class="ledger-kpi-label text-rose-800">EXPENSES</span>
                <div class="font-weight-black text-body-2 text-rose-900 text-no-wrap mt-0-5">
                  {{ formatCurrency(row.summary.totalExpenses) }}
                </div>
              </div>

              <!-- Milk Dispatched Box -->
              <div class="pa-2 rounded-lg bg-sky-50 border border-sky-100">
                <span class="ledger-kpi-label text-sky-800">MILK DISPATCHED</span>
                <div class="font-weight-black text-body-2 text-sky-900 text-no-wrap mt-0-5">
                  {{ formatNumber(row.summary.milkDispatchedKg) }} <span class="text-caption font-weight-bold text-sky-950">Kg</span>
                </div>
              </div>

              <!-- Net Cash Flow Box -->
              <div class="pa-2 rounded-lg bg-slate-50 border">
                <span class="ledger-kpi-label text-slate-600">NET CASH FLOW</span>
                <div class="font-weight-black text-body-2 text-slate-900 text-no-wrap mt-0-5">
                  {{ formatCurrency((row.summary.totalCollection || 0) - (row.summary.totalExpenses || 0)) }}
                </div>
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
  border: 1px solid #e2e8f0 !important;
  border-radius: 14px !important;
}

.income-card { border-top: 3px solid #10b981 !important; }
.cash-card { border-top: 3px solid #0d9488 !important; }
.arrears-card { border-top: 3px solid #f59e0b !important; }
.milk-in-card { border-top: 3px solid #0284c7 !important; }
.milk-out-card { border-top: 3px solid #3b82f6 !important; }
.expense-card { border-top: 3px solid #ef4444 !important; }

.net-flow-hero-card {
  border: 1px solid #cbd5e1 !important;
  border-top: 3px solid #0284c7 !important;
  border-radius: 14px !important;
  background: #ffffff !important;
  padding: 14px !important;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04) !important;
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

.ledger-metrics-grid {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 8px !important;
}

.ledger-kpi-label {
  font-size: 0.62rem !important;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  display: block;
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
  border: 1px solid #e2e8f0 !important;
  border-radius: 12px !important;
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
  border: 1px solid #e2e8f0 !important;
  border-radius: 12px !important;
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

.shop-metrics-grid {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 8px !important;
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
  font-size: 0.85rem !important;
  line-height: 1.25;
  white-space: nowrap !important;
}

.shop-kpi-sub {
  font-size: 0.65rem !important;
  margin-top: 2px;
  white-space: nowrap !important;
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
