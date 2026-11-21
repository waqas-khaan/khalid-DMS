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

      <!-- Net Cash in Hand Executive Card -->
      <div class="net-flow-hero-card pa-3-5 bg-white border rounded-xl shadow-sm mb-4 d-flex align-center justify-space-between">
        <div>
          <span class="text-caption font-weight-bold text-uppercase text-slate-600" style="font-size: 0.70rem !important; letter-spacing: 0.03em;">
            Net Cash in Hand
          </span>
          <div class="text-h6 font-weight-black text-sky-800 line-height-tight mt-1">
            {{ formatCurrency(summary.netCashFlow) }}
          </div>
        </div>
        <div class="kpi-icon-badge bg-sky-50 text-sky-700 pa-2 rounded-lg">
          <v-icon size="22" color="primary">mdi-cash-check</v-icon>
        </div>
      </div>

      <!-- 5. Route Deliveries & Shop Settlements (Read-Only Executive Inspection) -->
      <div class="mobile-routes-section mb-4">
        <div class="d-flex align-center justify-space-between mb-2 px-1">
          <div class="d-flex align-center gap-1-5">
            <v-icon color="primary" size="18">mdi-truck-outline</v-icon>
            <h2 class="text-subtitle-2 font-weight-black text-slate-900 text-uppercase mb-0">
              Deliveries &amp; Settlements ({{ dateDispatches.length }})
            </h2>
          </div>
          <span class="text-caption font-weight-bold text-grey-darken-2">
            {{ summary.pendingDispatchCount > 0 ? `${summary.pendingDispatchCount} In Delivery` : 'All Settled' }}
          </span>
        </div>

        <!-- Mode Switcher Tabs: Delivery Routes vs Guest Sales (when guest sales exist) -->
        <div v-if="guestDispatches.length > 0" class="dispatch-mode-toggle d-flex align-center p-1 bg-slate-200 rounded-xl mb-3">
          <button
            type="button"
            class="mode-toggle-btn routes-mode-btn flex-grow-1"
            :class="{ active: dispatchActiveTab === 'routes' }"
            @click="dispatchActiveTab = 'routes'"
          >
            <v-icon start size="16">mdi-truck-fast</v-icon>
            Routes ({{ regularDispatches.length }})
          </button>
          <button
            type="button"
            class="mode-toggle-btn guest-mode-btn flex-grow-1"
            :class="{ active: dispatchActiveTab === 'guest' }"
            @click="dispatchActiveTab = 'guest'"
          >
            <v-icon start size="16">mdi-storefront</v-icon>
            Guest Sales ({{ guestDispatches.length }})
          </button>
        </div>

        <!-- Empty State (No records at all) -->
        <div
          v-if="dateDispatches.length === 0"
          class="pa-5 bg-white rounded-xl border text-center text-grey-darken-1 shadow-xs"
        >
          <v-icon size="36" color="grey-lighten-1" class="mb-2">mdi-clipboard-text-off-outline</v-icon>
          <div class="font-weight-bold text-body-2 text-slate-800">No Routes or Sales Recorded</div>
          <div class="text-caption text-grey">No milk deliveries or guest sales recorded on {{ formatDate(selectedDate) }}.</div>
        </div>

        <!-- Deliveries & Settlements Content -->
        <div v-else>
          <!-- TAB 1: DELIVERY ROUTES CONTROLLER -->
          <template v-if="dispatchActiveTab === 'routes'">
            <!-- Empty state for routes -->
            <div
              v-if="regularDispatches.length === 0"
              class="pa-5 bg-white rounded-xl border text-center text-grey-darken-1 shadow-xs mb-3"
            >
              <v-icon size="36" color="grey-lighten-1" class="mb-2">mdi-truck-outline</v-icon>
              <div class="font-weight-bold text-body-2 text-slate-800">No Delivery Routes</div>
              <div class="text-caption text-grey">No delivery routes recorded on {{ formatDate(selectedDate) }}.</div>
            </div>

            <!-- Route Stepper Header (when multiple routes exist) -->
            <div v-else-if="regularDispatches.length > 1" class="route-navigation-card bg-white border rounded-xl pa-3 shadow-xs mb-3">
              <div class="d-flex align-center justify-space-between mb-2-5">
                <div class="d-flex align-center gap-2">
                  <span class="route-badge-capsule">R{{ closingRouteIndex + 1 }}</span>
                  <span class="text-caption font-weight-black text-slate-900 text-uppercase tracking-wider">
                    Route {{ closingRouteIndex + 1 }} of {{ regularDispatches.length }}
                  </span>
                </div>

                <!-- Toggle View Mode: Single Focused Route vs All Routes -->
                <button
                  type="button"
                  class="stepper-mode-toggle-btn"
                  @click="closingRouteViewMode = closingRouteViewMode === 'stepper' ? 'list' : 'stepper'"
                >
                  <v-icon size="13">{{ closingRouteViewMode === 'stepper' ? 'mdi-view-headline' : 'mdi-card-outline' }}</v-icon>
                  <span>{{ closingRouteViewMode === 'stepper' ? 'Show All (' + regularDispatches.length + ')' : 'Single View' }}</span>
                </button>
              </div>

              <!-- Stepper Buttons (Previous & Next Route) -->
              <div class="d-flex align-center gap-2 mb-2">
                <v-btn
                  variant="flat"
                  :disabled="closingRouteIndex === 0"
                  class="stepper-nav-btn stepper-btn-prev flex-grow-1"
                  @click="prevClosingRoute"
                >
                  <v-icon start size="18">mdi-chevron-left</v-icon>
                  <span>Previous Route</span>
                </v-btn>

                <v-btn
                  variant="flat"
                  :disabled="closingRouteIndex >= regularDispatches.length - 1"
                  class="stepper-nav-btn stepper-btn-next flex-grow-1"
                  @click="nextClosingRoute"
                >
                  <span>Next Route</span>
                  <v-icon end size="18">mdi-chevron-right</v-icon>
                </v-btn>
              </div>

              <!-- Route Quick Selection Chips -->
              <div class="route-pills-strip d-flex align-center gap-2 overflow-x-auto no-scrollbar">
                <button
                  v-for="(r, idx) in regularDispatches"
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
          </template>

          <!-- TAB 2: GUEST / COUNTER SALES CONTROLLER -->
          <template v-else-if="dispatchActiveTab === 'guest'">
            <!-- Empty state for guest sales -->
            <div
              v-if="guestDispatches.length === 0"
              class="pa-5 bg-white rounded-xl border text-center text-grey-darken-1 shadow-xs mb-3"
            >
              <v-icon size="36" color="grey-lighten-1" class="mb-2">mdi-account-cash-outline</v-icon>
              <div class="font-weight-bold text-body-2 text-slate-800">No Guest Sales</div>
              <div class="text-caption text-grey">No walk-in guest sales recorded on {{ formatDate(selectedDate) }}.</div>
            </div>

            <!-- Guest Sales Stepper Header (when multiple guest sales exist) -->
            <div v-else-if="guestDispatches.length > 1" class="route-navigation-card bg-white border rounded-xl pa-3 shadow-xs mb-3">
              <div class="d-flex align-center justify-space-between mb-2-5">
                <div class="d-flex align-center gap-2">
                  <span class="guest-badge-capsule">G{{ guestSaleIndex + 1 }}</span>
                  <span class="text-caption font-weight-black text-slate-900 text-uppercase tracking-wider">
                    Guest Sale {{ guestSaleIndex + 1 }} of {{ guestDispatches.length }}
                  </span>
                </div>

                <!-- Toggle View Mode: Single Focused Sale vs All Sales -->
                <button
                  type="button"
                  class="stepper-mode-toggle-btn"
                  @click="guestSaleViewMode = guestSaleViewMode === 'stepper' ? 'list' : 'stepper'"
                >
                  <v-icon size="13">{{ guestSaleViewMode === 'stepper' ? 'mdi-view-headline' : 'mdi-card-outline' }}</v-icon>
                  <span>{{ guestSaleViewMode === 'stepper' ? 'Show All (' + guestDispatches.length + ')' : 'Single View' }}</span>
                </button>
              </div>

              <!-- Stepper Buttons (Previous & Next Sale) -->
              <div class="d-flex align-center gap-2 mb-2">
                <v-btn
                  variant="flat"
                  :disabled="guestSaleIndex === 0"
                  class="stepper-nav-btn stepper-btn-prev flex-grow-1"
                  @click="prevGuestSale"
                >
                  <v-icon start size="18">mdi-chevron-left</v-icon>
                  <span>Previous Sale</span>
                </v-btn>

                <v-btn
                  variant="flat"
                  :disabled="guestSaleIndex >= guestDispatches.length - 1"
                  class="stepper-nav-btn stepper-btn-guest-next flex-grow-1"
                  @click="nextGuestSale"
                >
                  <span>Next Sale</span>
                  <v-icon end size="18">mdi-chevron-right</v-icon>
                </v-btn>
              </div>

              <!-- Guest Quick Selection Chips -->
              <div class="route-pills-strip d-flex align-center gap-2 overflow-x-auto no-scrollbar">
                <button
                  v-for="(g, idx) in guestDispatches"
                  :key="g.id"
                  type="button"
                  class="route-select-pill text-caption font-weight-bold"
                  :class="{ 'active-guest': idx === guestSaleIndex }"
                  @click="setGuestSaleIndex(idx)"
                >
                  🛒 Guest #{{ g.token || (idx + 1) }}
                </button>
              </div>
            </div>
          </template>

          <!-- Route or Guest Cards List -->
          <div class="d-flex flex-column gap-3">
            <div
              v-for="(d, loopIdx) in displayedDispatches"
              :key="d.id"
              class="mobile-route-card bg-white border rounded-xl shadow-xs overflow-hidden"
            >
              <!-- Route Header -->
              <div class="pa-3 bg-slate-50 border-b d-flex align-center justify-space-between">
                <div>
                  <div class="d-flex align-center">
                    <v-chip size="x-small" :color="d.dispatchType === 'guest' ? 'secondary' : 'primary'" variant="flat" class="font-weight-bold me-2">
                      {{ d.dispatchType === 'guest' ? (d.token ? `🛒 GUEST #${d.token}` : '🛒 GUEST') : `R${(closingRouteViewMode === 'stepper' && regularDispatches.length > 1 ? closingRouteIndex : loopIdx) + 1}` }}
                    </v-chip>
                    <span class="font-weight-black text-body-1 text-slate-900">
                      {{ d.dispatchType === 'guest' ? (d.customerName || 'Guest Customer') : d.areaName }}
                    </span>
                  </div>
                  <div class="text-caption text-grey-darken-1 mt-1 font-weight-medium">
                    <template v-if="d.dispatchType === 'guest'">
                      Token: <strong>#{{ d.token || 'N/A' }}</strong> • Paid via {{ d.paymentMethod === 'bank' ? 'Bank' : 'Cash' }} • Rate: Rs. {{ d.rate || d.items?.[0]?.price }}/Kg
                    </template>
                    <template v-else>
                      Driver: <strong>{{ d.driverName }}</strong> • {{ d.vehicleNumber }}
                    </template>
                  </div>
                </div>

                <div>
                  <v-chip
                    size="small"
                    :color="d.dispatchType === 'guest' ? 'secondary' : (d.status === 'Dispatched' ? 'warning' : 'success')"
                    variant="flat"
                    class="font-weight-bold text-caption px-2-5"
                  >
                    <v-icon start size="13">
                      {{ d.dispatchType === 'guest' ? 'mdi-cash-check' : (d.status === 'Dispatched' ? 'mdi-truck-fast' : 'mdi-check-circle') }}
                    </v-icon>
                    {{ d.dispatchType === 'guest' ? 'COUNTER PAID' : (d.status === 'Dispatched' ? 'IN ROUTE' : 'SETTLED') }}
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
                    <div class="font-weight-black text-body-2 text-emerald-900 text-no-wrap mt-0-5" style="font-size: 0.82rem !important;">
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
                    <div class="font-weight-black text-body-2 text-no-wrap mt-0-5" :class="(d.totalNewArrears || 0) > 0 ? 'text-rose-900' : 'text-emerald-700'" style="font-size: 0.82rem !important;">
                      {{ formatCurrency(d.totalNewArrears) }}
                    </div>
                    <div class="font-weight-medium text-no-wrap mt-0-5" :class="(d.totalNewArrears || 0) > 0 ? 'text-rose-700' : 'text-slate-500'" style="font-size: 0.62rem !important;">
                      {{ (d.totalNewArrears || 0) > 0 ? 'Pending dues' : 'All cleared' }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Expandable Shop List Toggle -->
              <div
                class="d-flex align-center justify-space-between px-3 py-2-5 bg-slate-50 border-t cursor-pointer hover:bg-slate-100 transition-colors"
                @click="toggleRouteExpand(d.id)"
              >
                <div class="d-flex align-center gap-1-5">
                  <v-icon size="16" color="primary">{{ d.dispatchType === 'guest' ? 'mdi-receipt-text-outline' : 'mdi-storefront-outline' }}</v-icon>
                  <span class="text-caption font-weight-bold text-slate-800">
                    <template v-if="d.dispatchType === 'guest'">
                      Direct Guest Sale Details
                    </template>
                    <template v-else>
                      {{ (d.items || []).length === 1 ? '1 Shop in this route' : `${(d.items || []).length} Shops in this route` }}
                    </template>
                  </span>
                </div>
                <div class="d-flex align-center text-primary text-caption font-weight-bold">
                  <span>{{ isRouteExpanded(d.id) ? (d.dispatchType === 'guest' ? 'Hide Details' : 'Hide Shops') : (d.dispatchType === 'guest' ? 'View Details' : 'View Shop Breakdown') }}</span>
                  <v-icon size="16" class="ms-1">{{ isRouteExpanded(d.id) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                </div>
              </div>

              <!-- Clean Shop Breakdown List (Read-Only) -->
              <div v-if="isRouteExpanded(d.id)" class="pa-3 bg-slate-100 border-t d-flex flex-column gap-2-5">
                <div
                  v-for="(row, rowIdx) in (d.items || [])"
                  :key="row.shopId || row.shopCode || rowIdx"
                  class="bg-white rounded-xl border pa-3 shadow-xs"
                >
                  <!-- 1. Shop Header: Avatar & Name -->
                  <div class="d-flex align-center gap-2 pb-2 mb-2 border-b">
                    <div class="shop-avatar flex-shrink-0">
                      <v-icon size="16" color="primary">mdi-storefront</v-icon>
                    </div>
                    <div class="font-weight-black text-body-2 text-slate-900 leading-tight">
                      {{ row.shopName }}
                    </div>
                  </div>

                  <!-- 2. Delivery & Rate Strip (Spans full width, clean & balanced) -->
                  <div class="shop-delivery-strip d-flex align-center justify-space-between px-2-5 py-1-5 rounded-lg mb-2">
                    <div class="d-flex align-center gap-1 font-weight-medium text-slate-600" style="font-size: 0.70rem;">
                      <span>Rate:</span>
                      <strong class="text-slate-800">Rs. {{ row.price }}</strong>/Kg
                    </div>
                    <div class="d-flex align-center gap-1 text-sky-900 font-weight-bold" style="font-size: 0.72rem;">
                      <v-icon size="13" color="primary" class="me-0-5">mdi-truck-outline</v-icon>
                      <span>Sent:</span>
                      <strong class="text-sky-950 font-weight-black">{{ formatNumber(row.kgs) }} Kg</strong>
                      <span v-if="(row.returnKgs || 0) > 0" class="text-orange-700 font-weight-bold" style="font-size: 0.65rem;">
                        (-{{ formatNumber(row.returnKgs) }} ret)
                      </span>
                    </div>
                  </div>

                  <!-- 2. Financial Receipt Statement (Consolidated, Zero Duplicates) -->
                  <div class="shop-statement-box">
                    <!-- Today's Bill -->
                    <div class="statement-row">
                      <span class="statement-label">Today's Bill:</span>
                      <strong class="statement-val text-slate-900">
                        {{ formatCurrency(row.todayAmount || ((row.kgs - (row.returnKgs || 0)) * row.price)) }}
                      </strong>
                    </div>

                    <!-- Previous Arrears (if any) -->
                    <div v-if="(row.previousArrears || 0) > 0" class="statement-row text-slate-600">
                      <span class="statement-label">Previous Arrears:</span>
                      <span class="statement-val font-weight-semibold">+ {{ formatCurrency(row.previousArrears) }}</span>
                    </div>

                    <!-- Total Payable (if previous arrears > 0) -->
                    <div v-if="(row.previousArrears || 0) > 0" class="statement-row statement-subtotal">
                      <span class="statement-label font-weight-bold text-slate-700">Total Payable:</span>
                      <strong class="statement-val text-slate-900">{{ formatCurrency(row.totalPayable) }}</strong>
                    </div>

                    <!-- Cash Collected -->
                    <div class="statement-row statement-collected">
                      <span class="statement-label text-emerald-800 font-weight-bold d-flex align-center gap-1">
                        <v-icon size="13" color="success">mdi-cash-check</v-icon>
                        Cash Collected:
                      </span>
                      <strong class="statement-val text-success">{{ formatCurrency(row.todayCollection) }}</strong>
                    </div>

                    <!-- Remaining Balance Due -->
                    <div
                      class="statement-row statement-total"
                      :class="(row.newArrears || 0) > 0 ? 'is-due' : 'is-cleared'"
                    >
                      <span class="statement-label">
                        {{ (row.newArrears || 0) > 0 ? 'Remaining Balance:' : 'Account Balance:' }}
                      </span>
                      <strong class="statement-val" style="font-size: 0.82rem !important;">
                        {{ (row.newArrears || 0) > 0 ? formatCurrency(row.newArrears) : 'Rs. 0.00 (All Cleared)' }}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 6. Mobile Segmented Tab Controller (Read-Only History & Treasury) -->
      <div class="mobile-tabs-pill-bar mb-4 pa-1 bg-slate-200 rounded-lg d-flex gap-1">
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
        <!-- Filter pills row -->
        <div class="ledger-filter-bar mb-4 d-flex align-center gap-1-5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            class="handover-filter-pill"
            :class="{ active: ledgerFilter === 'all' }"
            @click="ledgerFilter = 'all'"
          >
            All Days <span class="pill-count">({{ allLedgerRows.length }})</span>
          </button>
          <button
            type="button"
            class="handover-filter-pill"
            :class="{ active: ledgerFilter === 'closed' }"
            @click="ledgerFilter = 'closed'"
          >
            Closed
          </button>
          <button
            type="button"
            class="handover-filter-pill"
            :class="{ active: ledgerFilter === 'pending' }"
            @click="ledgerFilter = 'pending'"
          >
            Pending
          </button>
        </div>

        <!-- Ledger Days Card List (Tap card to inspect day) -->
        <div class="d-flex flex-column gap-2-5">
          <div
            v-for="row in paginatedLedgerRows"
            :key="row.date"
            class="mobile-ledger-card pa-3-5 bg-white rounded-xl cursor-pointer"
            :class="{ 'card-active-inspect': row.date === selectedDate }"
            @click="inspectMobileDay(row.date)"
          >
            <!-- Card Header: Date, Route, Milk & Status -->
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="d-flex align-center gap-2-5 min-w-0">
                <div class="ledger-avatar flex-shrink-0" :class="row.isClosed ? 'avatar-closed' : 'avatar-open'">
                  <v-icon size="16">
                    {{ row.isClosed ? 'mdi-calendar-check' : 'mdi-calendar-clock' }}
                  </v-icon>
                </div>
                <div class="min-w-0">
                  <div class="d-flex align-center gap-1-5 flex-wrap">
                    <span class="font-weight-bold text-body-2 text-slate-900 line-height-tight">
                      {{ formatDate(row.date) }}
                    </span>
                    <span
                      v-if="row.date === selectedDate"
                      class="ledger-inspect-tag"
                    >
                      Selected
                    </span>
                  </div>
                  <div class="text-caption text-slate-500 font-weight-medium mt-0-5 d-flex align-center gap-1 text-truncate" style="font-size: 0.72rem !important;">
                    <span>{{ row.summary.dispatchesCount }} {{ row.summary.dispatchesCount === 1 ? 'Route' : 'Routes' }}</span>
                    <span class="text-slate-300">•</span>
                    <span class="text-slate-600 font-weight-semibold">
                      <v-icon size="12" class="me-0-5 text-slate-400">mdi-truck-outline</v-icon>
                      {{ formatNumber(row.summary.milkDispatchedKg) }} Kg
                    </span>
                  </div>
                </div>
              </div>

              <!-- Status Pill (Top Right) -->
              <div class="flex-shrink-0 ps-2">
                <span
                  class="ledger-status-pill"
                  :class="row.isClosed ? 'pill-closed' : (row.ledgerStatus === 'PendingClose' ? 'pill-error' : 'pill-warning')"
                >
                  <span class="ledger-status-dot"></span>
                  {{ getLedgerStatusLabel(row) }}
                </span>
              </div>
            </div>

            <!-- Unified Executive Financial Panel -->
            <div class="ledger-financial-panel mb-2-5">
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="ledger-kpi-subhead">NET CASH FLOW</span>
                <span class="text-caption text-slate-400 font-weight-medium" style="font-size: 0.68rem !important;">
                  Collected − Expenses
                </span>
              </div>

              <div class="d-flex align-baseline gap-1-5">
                <span
                  class="ledger-hero-amount"
                  :class="((row.summary.totalCollection || 0) - (row.summary.totalExpenses || 0)) < 0 ? 'text-rose-600' : 'text-slate-900'"
                >
                  {{ formatCurrency((row.summary.totalCollection || 0) - (row.summary.totalExpenses || 0)) }}
                </span>
              </div>

              <!-- Hairline Divider -->
              <div class="ledger-panel-divider my-2"></div>

              <!-- Breakdown Columns: Collection & Expenses -->
              <div class="d-flex align-center justify-space-between">
                <!-- Collection (Money In) -->
                <div class="d-flex flex-column">
                  <div class="d-flex align-center gap-1 text-slate-500 font-weight-medium mb-0-5" style="font-size: 0.68rem !important;">
                    <span class="ledger-indicator-dot bg-emerald-500"></span>
                    <span>Collection</span>
                  </div>
                  <span class="font-weight-black text-emerald-700" style="font-size: 0.84rem !important;">
                    {{ formatCurrency(row.summary.totalCollection) }}
                  </span>
                </div>

                <!-- Expenses (Money Out) -->
                <div class="d-flex flex-column text-end">
                  <div class="d-flex align-center justify-end gap-1 text-slate-500 font-weight-medium mb-0-5" style="font-size: 0.68rem !important;">
                    <span class="ledger-indicator-dot bg-rose-500"></span>
                    <span>Expenses</span>
                  </div>
                  <span class="font-weight-black text-rose-700" style="font-size: 0.84rem !important;">
                    {{ formatCurrency(row.summary.totalExpenses) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Allocation & Audit Footer (if closed) -->
            <div v-if="row.isClosed && row.closing?.allocation" class="pt-2 border-t border-slate-100 d-flex align-center justify-space-between text-caption">
              <div class="d-flex align-center gap-1-5 font-weight-medium text-slate-600" style="font-size: 0.72rem !important;">
                <v-icon size="13" class="text-slate-400">
                  {{ row.closing.allocation.type === 'bank' ? 'mdi-bank-outline' : (row.closing.allocation.type === 'split' ? 'mdi-call-split' : 'mdi-cash') }}
                </v-icon>
                <span v-if="row.closing.allocation.type === 'bank'">
                  Handover Bank: <strong class="text-slate-800 font-weight-bold">{{ formatCurrency(row.closing.allocation.bankAmount) }}</strong>
                </span>
                <span v-else-if="row.closing.allocation.type === 'cash'">
                  Handover Cash: <strong class="text-slate-800 font-weight-bold">{{ formatCurrency(row.closing.allocation.cashAmount) }}</strong>
                </span>
                <span v-else-if="row.closing.allocation.type === 'split'">
                  Split: Bank <strong class="text-slate-800 font-weight-bold">{{ formatCurrency(row.closing.allocation.bankAmount) }}</strong> / Cash <strong class="text-slate-800 font-weight-bold">{{ formatCurrency(row.closing.allocation.cashAmount) }}</strong>
                </span>
              </div>

              <span class="text-slate-400 font-weight-medium" style="font-size: 0.68rem !important;">
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
        <!-- Unified Executive Treasury Summary Panel -->
        <div class="treasury-summary-panel mb-4">
          <div class="d-flex align-center justify-space-between mb-1">
            <div class="d-flex align-center gap-1-5">
              <v-icon size="14" class="text-slate-500">mdi-safe</v-icon>
              <span class="treasury-kpi-subhead">TREASURY HANDOVER SUMMARY</span>
            </div>
            <span class="treasury-finalized-pill">
              <span class="treasury-dot"></span>
              Finalized
            </span>
          </div>

          <div class="treasury-hero-val mt-0-5">
            {{ formatCurrency(totalNetAllocated) }}
          </div>

          <!-- Hairline Divider -->
          <div class="treasury-divider my-2"></div>

          <!-- Split Breakdown Row -->
          <div class="d-flex align-center justify-space-between">
            <!-- Allocated to Bank -->
            <div class="d-flex flex-column">
              <div class="d-flex align-center gap-1 text-slate-500 font-weight-medium mb-0-5" style="font-size: 0.68rem !important;">
                <span class="treasury-indicator-dot bg-sky-500"></span>
                <span>Allocated to Bank</span>
              </div>
              <span class="font-weight-black text-sky-800" style="font-size: 0.84rem !important;">
                {{ formatCurrency(totalBankAllocated) }}
              </span>
            </div>

            <!-- Retained in Cash -->
            <div class="d-flex flex-column text-end">
              <div class="d-flex align-center justify-end gap-1 text-slate-500 font-weight-medium mb-0-5" style="font-size: 0.68rem !important;">
                <span class="treasury-indicator-dot bg-emerald-500"></span>
                <span>Retained in Cash</span>
              </div>
              <span class="font-weight-black text-emerald-800" style="font-size: 0.84rem !important;">
                {{ formatCurrency(totalCashAllocated) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Method filter pills -->
        <div class="handover-filter-bar mb-4 d-flex align-center gap-1-5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            class="handover-filter-pill"
            :class="{ active: allocationTypeFilter === 'all' }"
            @click="allocationTypeFilter = 'all'"
          >
            All Methods <span class="pill-count">({{ closedAllocationRows.length }})</span>
          </button>
          <button
            type="button"
            class="handover-filter-pill"
            :class="{ active: allocationTypeFilter === 'bank' }"
            @click="allocationTypeFilter = 'bank'"
          >
            Bank <span class="pill-count">({{ allocationBankCount }})</span>
          </button>
          <button
            type="button"
            class="handover-filter-pill"
            :class="{ active: allocationTypeFilter === 'cash' }"
            @click="allocationTypeFilter = 'cash'"
          >
            Cash <span class="pill-count">({{ allocationCashCount }})</span>
          </button>
          <button
            type="button"
            class="handover-filter-pill"
            :class="{ active: allocationTypeFilter === 'split' }"
            @click="allocationTypeFilter = 'split'"
          >
            Split <span class="pill-count">({{ allocationSplitCount }})</span>
          </button>
        </div>

        <!-- Handover Record Cards List -->
        <div class="d-flex flex-column gap-2">
          <div
            v-for="row in paginatedAllocationRows"
            :key="row.date"
            class="mobile-ledger-card pa-3 bg-white rounded-xl cursor-pointer"
            :class="{ 'card-active-inspect': row.date === selectedDate }"
            @click="inspectMobileDay(row.date)"
          >
            <!-- Top Row: Avatar, Date, Subtitle & Method Pill -->
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center gap-2 min-w-0">
                <div class="handover-avatar flex-shrink-0" :class="row.type === 'bank' ? 'avatar-bank' : (row.type === 'split' ? 'avatar-split' : 'avatar-cash')">
                  <v-icon size="16">
                    {{ row.type === 'bank' ? 'mdi-bank' : (row.type === 'split' ? 'mdi-call-split' : 'mdi-cash') }}
                  </v-icon>
                </div>
                <div class="min-w-0">
                  <span class="font-weight-bold text-body-2 text-slate-900 line-height-tight d-block text-truncate">
                    {{ formatDate(row.date) }}
                  </span>
                  <span class="text-caption text-slate-400 font-weight-medium mt-0-5 d-block text-truncate" style="font-size: 0.68rem !important;">
                    Closed by {{ row.closedBy }}
                  </span>
                </div>
              </div>

              <!-- Method Pill -->
              <div class="flex-shrink-0 ps-2">
                <span
                  class="handover-method-pill"
                  :class="row.type === 'bank' ? 'method-bank' : (row.type === 'split' ? 'method-split' : 'method-cash')"
                >
                  <span class="method-dot"></span>
                  {{ row.type === 'bank' ? 'Bank Deposit' : (row.type === 'split' ? 'Custom Split' : 'Cash in Hand') }}
                </span>
              </div>
            </div>

            <!-- Hairline Divider -->
            <div class="my-2 border-t border-slate-100"></div>

            <!-- Bottom Row: Handover Amount label on left, value on right -->
            <div class="d-flex align-center justify-space-between">
              <span class="text-caption font-weight-bold text-slate-500 text-uppercase tracking-wider" style="font-size: 0.66rem !important;">
                Handover Amount
              </span>
              <span class="font-weight-black text-slate-900" style="font-size: 1.05rem !important;">
                {{ formatCurrency(row.remainingAmount) }}
              </span>
            </div>

            <!-- Split Breakdown (if split) -->
            <div v-if="row.type === 'split'" class="mt-2 pt-2 border-t border-slate-100 d-flex align-center justify-space-between text-caption">
              <div class="d-flex align-center gap-1 font-weight-semibold text-sky-800">
                <v-icon size="12" class="text-sky-600">mdi-bank</v-icon>
                <span>Bank:</span>
                <strong class="text-sky-950 font-weight-bold">{{ formatCurrency(row.bankAmount) }}</strong>
              </div>
              <div class="d-flex align-center gap-1 font-weight-semibold text-emerald-800">
                <v-icon size="12" class="text-emerald-600">mdi-cash</v-icon>
                <span>Cash:</span>
                <strong class="text-emerald-950 font-weight-bold">{{ formatCurrency(row.cashAmount) }}</strong>
              </div>
            </div>

            <!-- Bank Metadata (if bank deposit and info available) -->
            <div v-else-if="row.type === 'bank' && (row.bankName || row.bankRef)" class="mt-1-5 text-caption text-slate-400 d-flex align-center gap-1" style="font-size: 0.68rem !important;">
              <v-icon size="12" class="text-slate-400">mdi-information-outline</v-icon>
              <span>{{ row.bankName || 'Bank' }}</span>
              <span v-if="row.bankRef">• Ref: {{ row.bankRef }}</span>
            </div>

            <!-- Remarks if any -->
            <div v-if="row.remarks" class="mt-1 text-caption text-slate-400 italic font-weight-medium" style="font-size: 0.68rem !important;">
              {{ row.remarks }}
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

function isGuestDispatch(d) {
  if (!d) return false;
  return (
    d.dispatchType === 'guest' ||
    d.isGuest === true ||
    (d.areaName && d.areaName.toLowerCase().includes('guest'))
  );
}

const regularDispatches = computed(() => {
  return dateDispatches.value.filter((d) => !isGuestDispatch(d));
});

const guestDispatches = computed(() => {
  return dateDispatches.value.filter((d) => isGuestDispatch(d));
});

const dispatchActiveTab = ref('routes'); // 'routes' or 'guest'
const guestSaleIndex = ref(0);
const guestSaleViewMode = ref('stepper'); // 'stepper' or 'list'

const activeClosingRoute = computed(() => {
  if (!regularDispatches.value || regularDispatches.value.length === 0) return null;
  const idx = Math.min(Math.max(0, closingRouteIndex.value), regularDispatches.value.length - 1);
  return regularDispatches.value[idx];
});

const activeGuestSale = computed(() => {
  if (!guestDispatches.value || guestDispatches.value.length === 0) return null;
  const idx = Math.min(Math.max(0, guestSaleIndex.value), guestDispatches.value.length - 1);
  return guestDispatches.value[idx];
});

watch([dateDispatches, selectedDate], () => {
  if (regularDispatches.value.length === 0 && guestDispatches.value.length > 0) {
    dispatchActiveTab.value = 'guest';
  } else {
    dispatchActiveTab.value = 'routes';
  }

  if (closingRouteIndex.value >= regularDispatches.value.length) {
    closingRouteIndex.value = Math.max(0, regularDispatches.value.length - 1);
  }
  if (guestSaleIndex.value >= guestDispatches.value.length) {
    guestSaleIndex.value = Math.max(0, guestDispatches.value.length - 1);
  }

  if (activeClosingRoute.value) {
    expandedRouteIds.value.add(activeClosingRoute.value.id);
  }
  if (activeGuestSale.value) {
    expandedRouteIds.value.add(activeGuestSale.value.id);
  }
});

watch(dispatchActiveTab, (tab) => {
  if (tab === 'routes' && activeClosingRoute.value) {
    expandedRouteIds.value.add(activeClosingRoute.value.id);
  } else if (tab === 'guest' && activeGuestSale.value) {
    expandedRouteIds.value.add(activeGuestSale.value.id);
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
  if (closingRouteIndex.value < regularDispatches.value.length - 1) {
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

function prevGuestSale() {
  if (guestSaleIndex.value > 0) {
    guestSaleIndex.value--;
    if (activeGuestSale.value) {
      expandedRouteIds.value.add(activeGuestSale.value.id);
    }
  }
}

function nextGuestSale() {
  if (guestSaleIndex.value < guestDispatches.value.length - 1) {
    guestSaleIndex.value++;
    if (activeGuestSale.value) {
      expandedRouteIds.value.add(activeGuestSale.value.id);
    }
  }
}

function setGuestSaleIndex(idx) {
  guestSaleIndex.value = idx;
  if (activeGuestSale.value) {
    expandedRouteIds.value.add(activeGuestSale.value.id);
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
  margin-bottom: 16px !important;
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

.dispatch-mode-toggle {
  background: #e2e8f0;
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
  border: 1px solid #cbd5e1;
}

.mode-toggle-btn {
  border: none;
  background: transparent;
  padding: 8px 14px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-toggle-btn.active {
  background: linear-gradient(135deg, #063F78 0%, #0284c7 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 3px 10px rgba(6, 63, 120, 0.28) !important;
}

.mode-toggle-btn.active .v-icon {
  color: #ffffff !important;
}

.mode-toggle-btn.guest-mode-btn.active {
  background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%) !important;
  box-shadow: 0 3px 10px rgba(124, 58, 237, 0.28) !important;
}

.mode-toggle-btn.guest-mode-btn.active .v-icon {
  color: #ffffff !important;
}

.mobile-ledger-card {
  position: relative;
  transition: all 0.2s ease;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

.mobile-ledger-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.06);
}

.mobile-ledger-card.card-active-inspect {
  border-color: #cbd5e1 !important;
  border-left: 4px solid #0284c7 !important;
  background-color: #ffffff !important;
  box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(2, 132, 199, 0.08) !important;
}

.ledger-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ledger-avatar.avatar-closed {
  background-color: #f0fdf4;
  color: #16a34a;
  border: 1px solid #dcfce7;
}

.ledger-avatar.avatar-open {
  background-color: #fffbeb;
  color: #d97706;
  border: 1px solid #fef3c7;
}

.ledger-inspect-tag {
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
  font-size: 0.6rem !important;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 9999px;
  line-height: 1.2;
}

.ledger-status-pill {
  font-size: 0.66rem !important;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  letter-spacing: 0.2px;
}

.ledger-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.ledger-status-pill.pill-closed {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.ledger-status-pill.pill-warning {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

.ledger-status-pill.pill-error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.ledger-financial-panel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 12px;
}

.ledger-kpi-subhead {
  font-size: 0.64rem !important;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #64748b;
  text-transform: uppercase;
}

.ledger-hero-amount {
  font-size: 1.2rem !important;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.ledger-panel-divider {
  height: 1px;
  background: #e2e8f0;
  width: 100%;
}

.ledger-indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
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
  border: 1px solid #cbd5e1 !important;
  border-radius: 12px !important;
  padding: 12px 14px !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
}

.route-badge-capsule {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 22px;
  padding: 0 6px;
  border-radius: 6px;
  background: #063F78;
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1;
}

.guest-badge-capsule {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 22px;
  padding: 0 6px;
  border-radius: 6px;
  background: #7c3aed;
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1;
}

.stepper-mode-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #063F78;
  font-size: 0.72rem;
  font-weight: 700;
  border: 1px solid #cbd5e1;
  cursor: pointer;
  transition: all 0.15s ease;
}

.stepper-mode-toggle-btn:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
}

.stepper-nav-btn {
  height: 38px !important;
  min-height: 38px !important;
  border-radius: 8px !important;
  font-size: 0.8rem !important;
  font-weight: 700 !important;
  text-transform: none !important;
  letter-spacing: 0.01em !important;
  box-shadow: none !important;
  transition: all 0.15s ease !important;
}

.stepper-btn-prev {
  background: #f8fafc !important;
  border: 1.5px solid #cbd5e1 !important;
  color: #063F78 !important;
}

.stepper-btn-prev:hover:not(:disabled) {
  background: #f1f5f9 !important;
  border-color: #94a3b8 !important;
}

.stepper-btn-prev:disabled {
  opacity: 0.45 !important;
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
  color: #94a3b8 !important;
}

.stepper-btn-next {
  background: #063F78 !important;
  border: 1.5px solid #063F78 !important;
  color: #ffffff !important;
}

.stepper-btn-next:hover:not(:disabled) {
  background: #084c8d !important;
  border-color: #084c8d !important;
}

.stepper-btn-next:disabled {
  opacity: 0.45 !important;
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
  color: #94a3b8 !important;
}

.stepper-btn-guest-next {
  background: #7c3aed !important;
  border: 1.5px solid #7c3aed !important;
  color: #ffffff !important;
}

.stepper-btn-guest-next:hover:not(:disabled) {
  background: #6d28d9 !important;
  border-color: #6d28d9 !important;
}

.stepper-btn-guest-next:disabled {
  opacity: 0.45 !important;
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
  color: #94a3b8 !important;
}

.route-pills-strip {
  border-top: 1px solid #f1f5f9 !important;
  padding-top: 8px !important;
  margin-top: 2px !important;
}

.route-select-pill {
  padding: 5px 12px !important;
  border-radius: 8px !important;
  border: 1.5px solid #cbd5e1 !important;
  background: #ffffff !important;
  color: #334155 !important;
  font-size: 0.72rem !important;
  font-weight: 700 !important;
  white-space: nowrap !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
}

.route-select-pill:hover {
  background: #f8fafc !important;
  border-color: #94a3b8 !important;
  color: #063F78 !important;
}

.route-select-pill.active {
  background: #063F78 !important;
  color: #ffffff !important;
  border-color: #063F78 !important;
  box-shadow: 0 2px 5px rgba(6, 63, 120, 0.22) !important;
}

.route-select-pill.active-guest {
  background: #7c3aed !important;
  color: #ffffff !important;
  border-color: #7c3aed !important;
  box-shadow: 0 2px 5px rgba(124, 58, 237, 0.22) !important;
}

.shop-card-native {
  background: #ffffff;
  border: 1px solid #e2e8f0 !important;
  border-radius: 12px !important;
}

.shop-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Sophisticated Shop Card Badges & Statement */
.shop-delivery-strip {
  background: #f0f9ff;
  border: 1px solid #e0f2fe;
}

.shop-status-pill {
  font-size: 0.67rem !important;
  font-weight: 700;
  padding: 2.5px 8px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.shop-status-pill.pill-due {
  background: #fff1f2;
  color: #e11d48;
  border: 1px solid #fecdd3;
}

.shop-status-pill.pill-cleared {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.status-dot-due {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #e11d48;
  margin-inline-end: 4px;
}

.shop-statement-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.statement-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.72rem;
  line-height: 1.35;
}

.statement-label {
  color: #64748b;
  font-weight: 500;
}

.statement-val {
  white-space: nowrap;
}

.statement-subtotal {
  border-top: 1px dashed #cbd5e1;
  padding-top: 4px;
  margin-top: 1px;
}

.statement-collected {
  background: #ecfdf5;
  border: 1px solid #d1fae5;
  border-radius: 6px;
  padding: 3px 6px;
  margin: 1px 0;
}

.statement-total {
  border-top: 1.5px solid #e2e8f0;
  padding-top: 4px;
  margin-top: 1px;
}

.statement-total.is-due {
  background: #fef2f2;
  border: 1px solid #fecdd3;
  border-radius: 6px;
  padding: 4px 8px;
  margin-top: 3px;
}

.statement-total.is-due .statement-label {
  color: #b91c1c !important;
  font-weight: 700 !important;
}

.statement-total.is-due .statement-val {
  color: #dc2626 !important;
  font-weight: 900 !important;
}

.statement-total.is-cleared {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  padding: 4px 8px;
  margin-top: 3px;
}

.statement-total.is-cleared .statement-label {
  color: #15803d !important;
  font-weight: 700 !important;
}

.statement-total.is-cleared .statement-val {
  color: #16a34a !important;
  font-weight: 900 !important;
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

/* Treasury Handover Summary Panel */
.treasury-summary-panel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 16px !important;
}

.treasury-kpi-subhead {
  font-size: 0.64rem !important;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #64748b;
  text-transform: uppercase;
}

.treasury-finalized-pill {
  font-size: 0.64rem !important;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
  background: #eef2ff;
  color: #4338ca;
  border: 1px solid #c7d2fe;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.treasury-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.treasury-hero-val {
  font-size: 1.25rem !important;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.treasury-divider {
  height: 1px;
  background: #e2e8f0;
  width: 100%;
}

.treasury-indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

/* Ledger & Handover Filter Pills */
.ledger-filter-bar,
.handover-filter-bar {
  padding-top: 2px;
  padding-bottom: 4px;
  margin-bottom: 16px !important;
}

.handover-filter-pill {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  white-space: nowrap;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.handover-filter-pill:hover {
  background: #f8fafc;
  color: #0f172a;
}

.handover-filter-pill.active {
  background: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.15);
}

.handover-filter-pill .pill-count {
  opacity: 0.75;
  font-size: 0.68rem;
}

/* Handover Record Card Avatars & Pills */
.handover-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.handover-avatar.avatar-cash {
  background-color: #f0fdf4;
  color: #16a34a;
  border: 1px solid #dcfce7;
}

.handover-avatar.avatar-bank {
  background-color: #f0f9ff;
  color: #0284c7;
  border: 1px solid #e0f2fe;
}

.handover-avatar.avatar-split {
  background-color: #eef2ff;
  color: #4f46e5;
  border: 1px solid #e0e7ff;
}

.handover-method-pill {
  font-size: 0.66rem !important;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.method-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.handover-method-pill.method-cash {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.handover-method-pill.method-bank {
  background: #f0f9ff;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

.handover-method-pill.method-split {
  background: #eef2ff;
  color: #4338ca;
  border: 1px solid #c7d2fe;
}

.handover-detail-panel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 12px;
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
