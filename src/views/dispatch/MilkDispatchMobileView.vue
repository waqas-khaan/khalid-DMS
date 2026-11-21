<template>
  <div class="mobile-dispatch-page pb-16">
    <!-- 1. Sticky Mobile App Header -->
    <header class="mobile-app-header px-4 py-3 bg-white border-b sticky-top">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center gap-2">
          <div class="header-icon-box">
            <v-icon color="primary" size="20">mdi-truck-fast</v-icon>
          </div>
          <div>
            <h1 class="text-subtitle-1 font-weight-black text-slate-900 line-height-tight mb-0">
              Milk Dispatch
            </h1>
            <span class="text-caption text-grey-darken-1 font-weight-medium" style="font-size: 0.72rem !important;">
              Route Delivery & Shop Distributions
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
          @click="loadDispatches"
        >
          <v-icon size="18">mdi-refresh</v-icon>
        </v-btn>
      </div>

      <!-- Quick Day Stepper -->
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
            Active
          </v-chip>
        </div>

        <button
          type="button"
          class="stepper-arrow-btn"
          title="Next Day"
          @click="stepDay(1)"
        >
          <v-icon size="20">mdi-chevron-right</v-icon>
        </button>
      </div>
    </header>

    <div class="px-3 pt-3">
      <!-- Mode Switcher: Route Dispatches vs Guest Sales -->
      <div class="dispatch-mode-toggle d-flex align-center p-1 bg-slate-200 rounded-xl mb-3">
        <button
          type="button"
          class="mode-toggle-btn flex-grow-1"
          :class="{ active: currentTab === 'routes' }"
          @click="currentTab = 'routes'"
        >
          <v-icon start size="16">mdi-truck-fast</v-icon>
          Routes ({{ routeDispatches.length }})
        </button>
        <button
          type="button"
          class="mode-toggle-btn flex-grow-1"
          :class="{ active: currentTab === 'guest' }"
          @click="currentTab = 'guest'"
        >
          <v-icon start size="16">mdi-storefront</v-icon>
          Guest Sales ({{ guestSales.length }})
        </button>
      </div>

      <!-- TAB A: ROUTE DISPATCHES -->
      <div v-if="currentTab === 'routes'">
        <!-- 2. Daily Summary Metric Cards (2x2 Grid) -->
      <div class="mobile-kpi-grid mb-3">
        <!-- Card 1: Milk Sent -->
        <div class="mobile-kpi-card milk-out-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Milk Sent</span>
            <div class="kpi-icon-badge bg-blue-50 text-blue-600">
              <v-icon size="16">mdi-bottle-tonic-plus</v-icon>
            </div>
          </div>
          <div class="kpi-value text-blue-700">
            {{ formatNumber(totals.milkSent) }} <span class="kpi-unit">Kg</span>
          </div>
          <div class="kpi-subtitle">
            {{ dateDispatches.length }} routes dispatched
          </div>
        </div>

        <!-- Card 2: Return Milk -->
        <div class="mobile-kpi-card arrears-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Return Milk</span>
            <div class="kpi-icon-badge bg-amber-50 text-amber-700">
              <v-icon size="16">mdi-keyboard-return</v-icon>
            </div>
          </div>
          <div class="kpi-value text-orange-700">
            {{ formatNumber(totals.returns) }} <span class="kpi-unit">Kg</span>
          </div>
          <div class="kpi-subtitle">
            Net: {{ formatNumber(totals.milkSent - totals.returns) }} Kg
          </div>
        </div>

        <!-- Card 3: Cash Collected -->
        <div class="mobile-kpi-card income-card pa-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">Shop Collections</span>
            <div class="kpi-icon-badge bg-emerald-50 text-emerald-600">
              <v-icon size="16">mdi-cash-check</v-icon>
            </div>
          </div>
          <div class="kpi-value text-emerald-600">
            {{ formatCurrency(totals.collection) }}
          </div>
          <div class="kpi-subtitle">
            Collected from shops
          </div>
        </div>

        <!-- Card 4: New Arrears -->
        <div class="mobile-kpi-card pa-3 bg-white" :class="totals.arrears > 0 ? 'expense-card' : 'cash-card'">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="kpi-label">New Arrears</span>
            <div
              class="kpi-icon-badge"
              :class="totals.arrears > 0 ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600'"
            >
              <v-icon size="16">mdi-alert-circle-outline</v-icon>
            </div>
          </div>
          <div
            class="kpi-value"
            :class="totals.arrears > 0 ? 'text-rose-600' : 'text-teal-700'"
          >
            {{ formatCurrency(totals.arrears) }}
          </div>
          <div class="kpi-subtitle">
            Balance additions
          </div>
        </div>
      </div>

      <!-- 3. Search & Route Status Filter Pills -->
      <div class="mb-3">
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search by area, driver, or vehicle..."
          variant="outlined"
          density="compact"
          hide-details
          class="bg-white rounded-lg mb-2"
          clearable
        />

        <div class="d-flex align-center gap-1-5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            class="filter-pill-btn"
            :class="{ active: statusFilter === 'all' }"
            @click="statusFilter = 'all'"
          >
            All Routes ({{ dateDispatches.length }})
          </button>
          <button
            type="button"
            class="filter-pill-btn"
            :class="{ active: statusFilter === 'dispatched' }"
            @click="statusFilter = 'dispatched'"
          >
            In Route
          </button>
          <button
            type="button"
            class="filter-pill-btn"
            :class="{ active: statusFilter === 'returned' }"
            @click="statusFilter = 'returned'"
          >
            Settled / Returned
          </button>
        </div>
      </div>

      <!-- 4. Delivery Routes List (Native Mobile Read-Only) -->
      <div class="mobile-section-header mb-2 d-flex align-center justify-space-between">
        <span class="text-caption font-weight-bold text-slate-800 text-uppercase">
          Dispatched Delivery Routes ({{ filteredDispatches.length }})
        </span>
        <button
          v-if="selectedDate"
          type="button"
          class="text-caption text-primary font-weight-bold cursor-pointer"
          @click="selectedDate = null; loadDispatches()"
        >
          View All Dates
        </button>
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredDispatches.length === 0"
        class="pa-6 bg-white rounded-xl border text-center text-grey-darken-1 shadow-xs mb-3"
      >
        <v-icon size="40" color="grey-lighten-1" class="mb-2">mdi-truck-outline</v-icon>
        <div class="font-weight-bold text-body-2 text-slate-800">No Dispatches Found</div>
        <div class="text-caption text-grey">
          {{ selectedDate ? `No delivery routes recorded for ${formatDate(selectedDate)}.` : 'No routes match your search filters.' }}
        </div>
      </div>

      <!-- Routes Content (with Route Stepper & Prev/Next Navigation) -->
      <div v-else>
        <!-- Stepper Navigation Header (when multiple routes exist) -->
        <div v-if="filteredDispatches.length > 1" class="route-navigation-card bg-white border rounded-xl pa-3 shadow-xs mb-3">
          <div class="d-flex align-center justify-space-between mb-2-5">
            <div class="d-flex align-center gap-2">
              <span class="route-badge-capsule">R{{ currentRouteIndex + 1 }}</span>
              <span class="text-caption font-weight-black text-slate-900 text-uppercase tracking-wider">
                Route {{ currentRouteIndex + 1 }} of {{ filteredDispatches.length }}
              </span>
            </div>

            <!-- Toggle View Mode: Single Focused Route vs All Routes -->
            <button
              type="button"
              class="stepper-mode-toggle-btn"
              @click="viewMode = viewMode === 'stepper' ? 'list' : 'stepper'"
            >
              <v-icon size="13">{{ viewMode === 'stepper' ? 'mdi-view-headline' : 'mdi-card-outline' }}</v-icon>
              <span>{{ viewMode === 'stepper' ? 'Show All (' + filteredDispatches.length + ')' : 'Single View' }}</span>
            </button>
          </div>

          <!-- Stepper Buttons (Previous & Next Route) -->
          <div class="d-flex align-center gap-2 mb-2">
            <v-btn
              variant="flat"
              :disabled="currentRouteIndex === 0"
              class="stepper-nav-btn stepper-btn-prev flex-grow-1"
              @click="prevRoute"
            >
              <v-icon start size="18">mdi-chevron-left</v-icon>
              <span>Previous Route</span>
            </v-btn>

            <v-btn
              variant="flat"
              :disabled="currentRouteIndex >= filteredDispatches.length - 1"
              class="stepper-nav-btn stepper-btn-next flex-grow-1"
              @click="nextRoute"
            >
              <span>Next Route</span>
              <v-icon end size="18">mdi-chevron-right</v-icon>
            </v-btn>
          </div>

          <!-- Route Quick Selection Chips -->
          <div class="route-pills-strip d-flex align-center gap-2 overflow-x-auto no-scrollbar">
            <button
              v-for="(r, idx) in filteredDispatches"
              :key="r.id"
              type="button"
              class="route-select-pill text-caption font-weight-bold"
              :class="{ active: idx === currentRouteIndex }"
              @click="setRouteIndex(idx)"
            >
              R{{ idx + 1 }}: {{ r.areaName || 'Route' }}
            </button>
          </div>
        </div>

        <!-- Render Route Cards -->
        <div class="d-flex flex-column gap-3">
          <div
            v-for="(d, loopIdx) in (viewMode === 'stepper' && filteredDispatches.length > 1 ? (activeRoute ? [activeRoute] : []) : filteredDispatches)"
            :key="d.id"
            class="mobile-route-card bg-white border rounded-xl shadow-xs overflow-hidden"
          >
            <!-- Route Header -->
            <div class="pa-3 bg-slate-50 border-b d-flex align-center justify-space-between">
              <div>
                <div class="d-flex align-center">
                  <v-chip size="x-small" color="primary" variant="flat" class="font-weight-bold me-2">
                    R{{ (viewMode === 'stepper' && filteredDispatches.length > 1 ? currentRouteIndex : loopIdx) + 1 }}
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
              <div class="route-kpi-grid text-caption">
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

            <!-- Shop Accordion Toggle -->
            <div
              class="d-flex align-center justify-space-between px-3 py-2-5 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
              @click="toggleRouteExpand(d.id)"
            >
              <div class="d-flex align-center">
                <v-icon size="16" color="primary" class="me-2">mdi-storefront-outline</v-icon>
                <span class="text-caption font-weight-bold text-slate-800">
                  {{ (d.items || d.shopDispatches || []).length === 1 ? '1 Shop in Route' : ((d.items || d.shopDispatches || []).length + ' Shops in Route') }}
                </span>
              </div>
              <div class="d-flex align-center gap-1 text-primary font-weight-bold text-caption">
                <span>{{ expandedRouteId === d.id ? 'Hide' : 'View' }}</span>
                <v-icon size="16" class="ms-1">{{ expandedRouteId === d.id ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
              </div>
            </div>

            <!-- Expanded Shop Items (Redesigned Sophisticated Mobile Cards) -->
            <div v-if="expandedRouteId === d.id" class="pa-3 bg-slate-50 border-t">
              <div v-if="loadingItems && !(d.items || d.shopDispatches)" class="text-center pa-4 text-caption text-grey">
                <v-progress-circular indeterminate size="20" color="primary" class="me-2" />
                Loading shop breakdown...
              </div>
              <div v-else-if="!(d.items || d.shopDispatches) || (d.items || d.shopDispatches).length === 0" class="text-center pa-3 text-caption text-grey">
                No shop items recorded for this route.
              </div>
              <div v-else class="d-flex flex-column gap-2">
                <div
                  v-for="s in (d.items || d.shopDispatches)"
                  :key="s.shopId || s.shopName"
                  class="shop-card-native pa-3 rounded-xl border bg-white shadow-xs"
                >
                  <!-- 1. Shop Header: Avatar & Name -->
                  <div class="d-flex align-center gap-2 pb-2 mb-2 border-b">
                    <div class="shop-avatar flex-shrink-0">
                      <v-icon size="16" color="primary">mdi-storefront</v-icon>
                    </div>
                    <div class="font-weight-black text-body-2 text-slate-900 leading-tight">
                      {{ s.shopName }}
                    </div>
                  </div>

                  <!-- 2. Delivery & Rate Strip (Spans full width, clean & balanced) -->
                  <div class="shop-delivery-strip d-flex align-center justify-space-between px-2-5 py-1-5 rounded-lg mb-2">
                    <div class="d-flex align-center gap-1 font-weight-medium text-slate-600" style="font-size: 0.70rem;">
                      <span>Rate:</span>
                      <strong class="text-slate-800">Rs. {{ s.price || s.rate }}</strong>/Kg
                    </div>
                    <div class="d-flex align-center gap-1 text-sky-900 font-weight-bold" style="font-size: 0.72rem;">
                      <v-icon size="13" color="primary" class="me-0-5">mdi-truck-outline</v-icon>
                      <span>Sent:</span>
                      <strong class="text-sky-950 font-weight-black">{{ formatNumber(s.todayMilk || s.todaySupplyMilk || s.kgs) }} Kg</strong>
                      <span v-if="(s.returnKgs || 0) > 0" class="text-orange-700 font-weight-bold" style="font-size: 0.65rem;">
                        (-{{ formatNumber(s.returnKgs) }} ret)
                      </span>
                    </div>
                  </div>

                  <!-- 2. Financial Receipt Statement (Consolidated, Zero Duplicates) -->
                  <div class="shop-statement-box">
                    <!-- Today's Bill -->
                    <div class="statement-row">
                      <span class="statement-label">Today's Bill:</span>
                      <strong class="statement-val text-slate-900">
                        {{ formatCurrency(s.todayAmount || s.todayBill || s.totalPayable) }}
                      </strong>
                    </div>

                    <!-- Previous Arrears (if any) -->
                    <div v-if="(s.previousArrears || 0) > 0" class="statement-row text-slate-600">
                      <span class="statement-label">Previous Arrears:</span>
                      <span class="statement-val font-weight-semibold">+ {{ formatCurrency(s.previousArrears) }}</span>
                    </div>

                    <!-- Total Payable (if previous arrears > 0) -->
                    <div v-if="(s.previousArrears || 0) > 0" class="statement-row statement-subtotal">
                      <span class="statement-label font-weight-bold text-slate-700">Total Payable:</span>
                      <strong class="statement-val text-slate-900">{{ formatCurrency(s.totalPayable || ((s.todayAmount || 0) + (s.previousArrears || 0))) }}</strong>
                    </div>

                    <!-- Cash Collected -->
                    <div class="statement-row statement-collected">
                      <span class="statement-label text-emerald-800 font-weight-bold d-flex align-center gap-1">
                        <v-icon size="13" color="success">mdi-cash-check</v-icon>
                        Cash Collected:
                      </span>
                      <strong class="statement-val text-success">{{ formatCurrency(s.todayCollection) }}</strong>
                    </div>

                    <!-- Remaining Balance Due -->
                    <div
                      class="statement-row statement-total"
                      :class="(s.newArrears || 0) > 0 ? 'is-due' : 'is-cleared'"
                    >
                      <span class="statement-label">
                        {{ (s.newArrears || 0) > 0 ? 'Remaining Balance:' : 'Account Balance:' }}
                      </span>
                      <strong class="statement-val" style="font-size: 0.82rem !important;">
                        {{ (s.newArrears || 0) > 0 ? formatCurrency(s.newArrears) : 'Rs. 0.00 (All Cleared)' }}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <!-- TAB B: GUEST / WALK-IN SALES -->
      <!-- TAB B: GUEST / WALK-IN SALES (Read-Only Records) -->
      <div v-else-if="currentTab === 'guest'">
        <!-- Guest Sales Summary (2-Card Grid) -->
        <div class="mobile-kpi-grid mb-3">
          <!-- Milk Sold -->
          <div class="mobile-kpi-card milk-out-card pa-3 bg-white">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="kpi-label">Guest Milk</span>
              <div class="kpi-icon-badge bg-blue-50 text-blue-600">
                <v-icon size="16">mdi-weight-kilogram</v-icon>
              </div>
            </div>
            <div class="kpi-value text-blue-700">
              {{ formatNumber(guestTotals.totalMilk) }} <span class="kpi-unit">Kg</span>
            </div>
            <div class="kpi-subtitle">
              {{ guestSales.length }} transactions
            </div>
          </div>

          <!-- Cash Received -->
          <div class="mobile-kpi-card income-card pa-3 bg-white">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="kpi-label">Cash Collected</span>
              <div class="kpi-icon-badge bg-emerald-50 text-emerald-600">
                <v-icon size="16">mdi-cash-check</v-icon>
              </div>
            </div>
            <div class="kpi-value text-emerald-600">
              {{ formatCurrency(guestTotals.totalCollection) }}
            </div>
            <div class="kpi-subtitle">
              Paid at counter
            </div>
          </div>
        </div>

        <!-- Guest Sales List -->
        <div class="mobile-section-header mb-2 d-flex align-center justify-space-between">
          <span class="text-caption font-weight-bold text-slate-800 text-uppercase">
            Recorded Guest Sales ({{ guestSales.length }})
          </span>
          <span class="text-caption text-grey font-weight-bold">
            Date: {{ formatDate(selectedDate) }}
          </span>
        </div>

        <!-- Empty State (Read-Only) -->
        <div
          v-if="guestSales.length === 0"
          class="pa-6 bg-white rounded-xl border text-center text-grey-darken-1 shadow-xs mb-3"
        >
          <v-icon size="40" color="grey-lighten-1" class="mb-2">mdi-account-cash-outline</v-icon>
          <div class="font-weight-bold text-body-2 text-slate-800">No Guest Sales Recorded</div>
          <div class="text-caption text-grey">
            No walk-in retail customer milk purchases recorded for {{ formatDate(selectedDate) }}.
          </div>
        </div>

        <!-- Guest Sales Cards (Read-Only) -->
        <div v-else class="d-flex flex-column gap-3">
          <div
            v-for="s in guestSales"
            :key="s.id"
            class="mobile-route-card bg-white border rounded-xl shadow-xs overflow-hidden"
          >
            <!-- Sale Header -->
            <div class="pa-3 bg-slate-50 border-b d-flex align-center justify-space-between">
              <div>
                <div class="d-flex align-center gap-1-5">
                  <v-chip size="x-small" color="primary" variant="flat" class="font-weight-bold font-mono">
                    #{{ s.token || (s.id ? s.id.substring(0, 8) : '440b23ce') }}
                  </v-chip>
                  <span class="font-weight-black text-body-2 text-slate-900">
                    {{ s.customerName || 'Guest Customer' }}
                  </span>
                </div>
                <div class="text-caption text-grey-darken-1 mt-0-5 font-weight-medium">
                  {{ s.time || (s.createdAt ? formatTime(s.createdAt) : '') }} &bull; {{ s.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash in Hand' }}
                </div>
              </div>

              <div>
                <v-chip
                  size="small"
                  color="success"
                  variant="flat"
                  class="font-weight-bold text-caption px-2-5"
                >
                  <v-icon start size="13">mdi-check-circle</v-icon>
                  PAID
                </v-chip>
              </div>
            </div>

            <!-- Sale Details Grid -->
            <div class="pa-3 bg-white">
              <div class="route-kpi-grid text-caption mb-2">
                <!-- Milk Sold -->
                <div class="pa-2 rounded-lg bg-sky-50 border border-sky-100">
                  <span class="text-sky-800 font-weight-bold text-uppercase d-block" style="font-size: 0.60rem !important;">QUANTITY</span>
                  <strong class="text-sky-900 font-weight-black text-body-2">{{ formatNumber(s.totalMilk) }}</strong> <span class="text-caption font-weight-bold text-sky-800">Kg</span>
                </div>

                <!-- Rate -->
                <div class="pa-2 rounded-lg bg-slate-50 border">
                  <span class="text-slate-700 font-weight-bold text-uppercase d-block" style="font-size: 0.60rem !important;">RATE / KG</span>
                  <strong class="text-slate-900 font-weight-black text-body-2">Rs. {{ s.rate || 195 }}</strong>
                </div>

                <!-- Cash Paid -->
                <div class="pa-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  <span class="text-emerald-800 font-weight-bold text-uppercase d-block" style="font-size: 0.60rem !important;">COLLECTED</span>
                  <strong class="text-emerald-900 font-weight-black text-body-2">{{ formatCurrency(s.totalCollection) }}</strong>
                </div>
              </div>

              <!-- Action Bar (Read-Only: Print/View Slip) -->
              <div class="d-flex align-center justify-end pt-2 border-t gap-2">
                <v-btn
                  size="small"
                  variant="flat"
                  color="primary"
                  class="font-weight-black text-capitalize px-3 rounded-lg"
                  prepend-icon="mdi-printer"
                  @click="viewReceipt(s, true)"
                >
                  Print Slip
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals for Guest Sales (Read-Only Receipt Viewer) -->
    <GuestSaleReceiptDialog
      v-model="receiptModal"
      :sale="activeReceiptSale"
      :auto-print="autoPrintReceipt"
    />

    <!-- Date Picker Modal -->
    <v-dialog v-model="datePickerModal" max-width="320">
      <v-card class="pa-3 rounded-xl">
        <AppDatePicker
          v-model="selectedDate"
          label="Select Inspection Date"
          hide-details
          @change="onDateChanged"
        />
        <v-card-actions class="px-0 pt-2 justify-end">
          <v-btn
            variant="text"
            size="small"
            color="primary"
            class="text-capitalize font-weight-bold"
            @click="datePickerModal = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { dispatchService } from '@/services/dispatchService';
import { useBusinessDayStore } from '@/stores/businessDay';
import { formatCurrency, formatNumber, formatDate, getOffsetDateString } from '@/utils/formatters';
import AppDatePicker from '@/components/common/AppDatePicker.vue';
import GuestSaleReceiptDialog from '@/components/dispatch/GuestSaleReceiptDialog.vue';

const businessDayStore = useBusinessDayStore();

const loading = ref(false);
const datePickerModal = ref(false);
const selectedDate = ref(businessDayStore.activeBusinessDate);
const dateDispatches = ref([]);
const expandedRouteId = ref(null);
const searchQuery = ref('');
const statusFilter = ref('all');
const currentRouteIndex = ref(0);
const viewMode = ref('stepper'); // 'stepper' or 'list'
const loadingItems = ref(false);

// Mode Toggle: 'routes' or 'guest'
const currentTab = ref('routes');

// Guest receipt inspection & slip dialog state (Read-Only)
const receiptModal = ref(false);
const activeReceiptSale = ref(null);
const autoPrintReceipt = ref(false);

// Route dispatches vs Guest counter sales
const routeDispatches = computed(() => {
  return (dateDispatches.value || []).filter((d) => d.dispatchType !== 'guest');
});

const guestSales = computed(() => {
  return (dateDispatches.value || []).filter((d) => d.dispatchType === 'guest');
});

const guestTotals = computed(() => {
  let totalMilk = 0;
  let totalAmount = 0;
  let totalCollection = 0;
  for (const s of guestSales.value) {
    totalMilk += Number(s.totalMilk) || 0;
    totalAmount += Number(s.totalAmount) || 0;
    totalCollection += Number(s.totalCollection) || 0;
  }
  return {
    totalMilk,
    totalAmount,
    totalCollection,
    count: guestSales.value.length,
  };
});

function viewReceipt(sale, autoPrint = false) {
  activeReceiptSale.value = sale;
  autoPrintReceipt.value = autoPrint;
  receiptModal.value = true;
}

function formatTime(d) {
  try {
    const dt = new Date(d);
    return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (e) {
    return '';
  }
}

const filteredDispatches = computed(() => {
  let list = routeDispatches.value || [];
  if (statusFilter.value === 'dispatched') {
    list = list.filter((d) => d.status === 'Dispatched');
  } else if (statusFilter.value === 'returned') {
    list = list.filter((d) => d.status === 'Returned');
  }
  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter((d) =>
      (d.areaName || '').toLowerCase().includes(q) ||
      (d.driverName || '').toLowerCase().includes(q) ||
      (d.vehicleNumber || '').toLowerCase().includes(q)
    );
  }
  return list;
});

const activeRoute = computed(() => {
  if (!filteredDispatches.value || filteredDispatches.value.length === 0) return null;
  const idx = Math.min(Math.max(0, currentRouteIndex.value), filteredDispatches.value.length - 1);
  return filteredDispatches.value[idx];
});

watch([filteredDispatches, selectedDate], () => {
  if (currentRouteIndex.value >= filteredDispatches.value.length) {
    currentRouteIndex.value = Math.max(0, filteredDispatches.value.length - 1);
  }
});

watch(activeRoute, async (newRoute) => {
  if (newRoute) {
    expandedRouteId.value = newRoute.id;
    await ensureRouteItems(newRoute);
  }
}, { immediate: true });

async function ensureRouteItems(d) {
  if (!d || d.items) return;
  try {
    loadingItems.value = true;
    const full = await dispatchService.getDispatchById(d.id);
    if (full?.items) {
      d.items = full.items;
    }
  } catch (e) {
    console.warn('Failed to load shop items:', e);
  } finally {
    loadingItems.value = false;
  }
}

function prevRoute() {
  if (currentRouteIndex.value > 0) {
    currentRouteIndex.value--;
  }
}

function nextRoute() {
  if (currentRouteIndex.value < filteredDispatches.value.length - 1) {
    currentRouteIndex.value++;
  }
}

function setRouteIndex(idx) {
  currentRouteIndex.value = idx;
}

const totals = computed(() => {
  let milkSent = 0;
  let returns = 0;
  let collection = 0;
  let arrears = 0;

  for (const d of routeDispatches.value) {
    milkSent += Number(d.totalMilk) || 0;
    returns += Number(d.totalReturnMilk) || 0;
    collection += Number(d.totalCollection) || 0;
    arrears += Number(d.totalNewArrears) || 0;
  }

  return { milkSent, returns, collection, arrears };
});

async function toggleRouteExpand(id) {
  if (expandedRouteId.value === id) {
    expandedRouteId.value = null;
    return;
  }
  expandedRouteId.value = id;
  const target = dateDispatches.value.find(d => d.id === id);
  if (target && !target.items) {
    await ensureRouteItems(target);
  }
}

function stepDay(offset) {
  selectedDate.value = getOffsetDateString(selectedDate.value, offset);
  loadDispatches();
}

function onDateChanged() {
  datePickerModal.value = false;
  loadDispatches();
}

async function loadDispatches() {
  loading.value = true;
  expandedRouteId.value = null;
  currentRouteIndex.value = 0;
  try {
    const dispatches = await dispatchService.getDispatches(selectedDate.value);
    dateDispatches.value = dispatches;
    if (filteredDispatches.value.length > 0) {
      const first = filteredDispatches.value[0];
      expandedRouteId.value = first.id;
      await ensureRouteItems(first);
    }
  } catch (err) {
    console.warn('Failed to load dispatches on mobile:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await businessDayStore.refreshBusinessDay();
  if (!selectedDate.value) {
    selectedDate.value = businessDayStore.activeBusinessDate || businessDayStore.realToday;
  }
  await loadDispatches();
});
</script>

<style scoped>
.mobile-dispatch-page {
  background-color: #f8fafc;
  min-height: 100vh;
}

.dispatch-mode-toggle {
  background: #e2e8f0;
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
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
  background: #ffffff;
  color: #0284c7;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
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

.mobile-kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 10px !important;
}

.mobile-kpi-card {
  background: #ffffff;
  border: 1px solid #e2e8f0 !important;
  border-radius: 14px !important;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04) !important;
}

.income-card { border-top: 3px solid #10b981 !important; }
.cash-card { border-top: 3px solid #0d9488 !important; }
.arrears-card { border-top: 3px solid #f59e0b !important; }
.milk-in-card { border-top: 3px solid #0284c7 !important; }
.milk-out-card { border-top: 3px solid #3b82f6 !important; }
.expense-card { border-top: 3px solid #ef4444 !important; }

.mobile-route-card {
  border: 1px solid #e2e8f0 !important;
  border-radius: 12px !important;
}

.mobile-guest-sale-btn {
  background: #063F78 !important;
  color: #ffffff !important;
  font-weight: 700 !important;
}

.mobile-guest-sale-btn:disabled,
.mobile-guest-sale-btn.v-btn--disabled {
  background: #cbd5e1 !important;
  color: #64748b !important;
  opacity: 1 !important;
  box-shadow: none !important;
  border: 1px solid #cbd5e1 !important;
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

.filter-pill-btn {
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-pill-btn.active {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

