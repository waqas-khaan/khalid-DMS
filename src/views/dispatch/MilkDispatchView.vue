<template>
  <MilkDispatchMobileView v-if="display.smAndDown.value" />
  <div v-else class="page-container table-page">
    <div class="page-header">
      <div>
        <h1 class="page-header-title">Shop Milk Dispatch</h1>
        <p class="page-header-subtitle">Route distribution, per-shop milk supply, cash collections, and arrears ledger</p>
      </div>

      <div class="d-flex align-center" style="gap: 12px;">
        <v-btn
          v-if="currentStep === 1 && activeTab === 'new'"
          variant="tonal"
          color="primary"
          class="text-capitalize rounded-lg font-weight-bold"
          prepend-icon="mdi-history"
          @click="activeTab = 'history'"
        >
          View Past Dispatches
        </v-btn>
        <v-btn
          v-if="activeTab === 'history'"
          color="primary"
          variant="flat"
          class="text-capitalize font-weight-bold px-5"
          prepend-icon="mdi-plus"
          :disabled="businessDayStore.isLockedOnPreviousDay"
          :title="businessDayStore.isLockedOnPreviousDay ? businessDayStore.lockReason : 'Create New Dispatch'"
          @click="startNewDispatch"
        >
          New Dispatch
        </v-btn>
      </div>
    </div>

    <!-- TABS: New Dispatch Wizard VS Past Dispatches History -->
    <v-tabs v-model="activeTab" grow show-arrows class="erp-tabs mb-3 flex-shrink-0">
      <v-tab value="new" class="text-capitalize font-weight-bold">
        <v-icon start>mdi-truck-fast</v-icon>
        {{ isEditingDispatch ? 'Edit Dispatch' : 'Dispatch Entry' }}
      </v-tab>
      <v-tab value="history" class="text-capitalize font-weight-bold">
        <v-icon start>mdi-clipboard-list</v-icon>
        Dispatches History
      </v-tab>
    </v-tabs>

    <!-- TAB 1: DISPATCH WIZARD -->
    <div v-if="activeTab === 'new'" class="dispatch-flex-panel">
      <!-- STEP 1: Route & Vehicle Selection (Delivery Workflow) -->
      <v-card v-if="currentStep === 1" class="modern-card pa-4 delivery-window table-card-full" elevation="0">
        <!-- Delivery Window Header -->
        <div class="delivery-header d-flex align-center justify-space-between pb-2 mb-3 border-b flex-wrap gap-2 flex-shrink-0">
          <div class="d-flex align-center flex-wrap gap-3">
            <h1 class="delivery-title text-red-darken-2 font-weight-black">Delivery</h1>
            <span class="delivery-subtitle text-caption text-grey-darken-1">
              Select Vehicle, Driver, Calander (Helper), and Group to generate milk dispatch
            </span>
          </div>

          <!-- Dispatch Date Picker inside header -->
          <div class="d-flex align-center gap-2">
            <div style="min-width: 240px; width: 260px;">
              <AppDatePicker
                v-model="wizardHeader.date"
                label="Delivery Date *"
                density="compact"
                :disabled="isDispatchEntryLocked || isEditingDispatch"
                hide-details
              />
            </div>
          </div>
        </div>

        <!-- Previous Day Unclosed Lock Alert inside Dispatch Entry -->
        <v-alert
          v-if="isDispatchEntryLocked"
          type="error"
          variant="tonal"
          border="start"
          density="compact"
          class="mb-3 flex-shrink-0"
        >
          <div class="d-flex align-center justify-space-between flex-wrap gap-2">
            <div>
              <strong>Dispatch Entry Disabled — Previous Day ({{ formatDate(businessDayStore.activeBusinessDate) }}) Not Closed:</strong>
              {{ businessDayStore.lockReason }}
            </div>
            <div class="d-flex align-center gap-2">
              <v-btn
                v-if="businessDayStore.pendingDispatchesCount > 0"
                size="small"
                color="warning"
                variant="flat"
                class="text-capitalize font-weight-bold"
                prepend-icon="mdi-truck-check"
                @click="goToHistoryForPendingCloseDate"
              >
                Mark Back Pending ({{ businessDayStore.pendingDispatchesCount }})
              </v-btn>
              <v-btn
                size="small"
                color="primary"
                variant="flat"
                class="text-capitalize font-weight-bold"
                prepend-icon="mdi-lock-check"
                @click="router.push('/day-closing')"
              >
                Open Day Closing
              </v-btn>
            </div>
          </div>
        </v-alert>

        <!-- 4-Column Delivery Panel -->
        <div class="delivery-columns-grid" :class="{ 'delivery-columns-locked': isDispatchEntryLocked }">
          <!-- COLUMN 1: VEHICLES (Red Border) -->
          <div class="delivery-column col-vehicles">
            <div class="column-header text-center">
              <span class="column-title text-red-darken-2">Vehicles</span>
              <div class="column-icon-box">
                <v-icon size="30" color="red-darken-2">mdi-truck-outline</v-icon>
              </div>
            </div>
            <div class="column-list-scroll">
              <div
                v-for="v in vehicles"
                :key="v.id"
                class="delivery-item-card vehicle-card"
                :class="{
                  'item-selected': wizardHeader.vehicleId === v.id && !isVehicleDisabled(v.id),
                  'item-disabled': isVehicleDisabled(v.id),
                }"
                :aria-disabled="isVehicleDisabled(v.id)"
                :title="isVehicleDisabled(v.id) ? `${v.vehicleNumber} is dispatched for ${formatDate(wizardHeader.date)} until marked back` : `Select ${v.vehicleNumber}`"
                @click="selectVehicle(v)"
              >
                <div class="delivery-item-row">
                  <v-icon
                    size="22"
                    class="flex-shrink-0"
                    :color="isVehicleDisabled(v.id) ? 'grey' : (wizardHeader.vehicleId === v.id ? 'red-darken-2' : 'grey-darken-2')"
                  >
                    mdi-truck-outline
                  </v-icon>
                  <span class="item-text font-weight-bold">{{ v.vehicleNumber }}</span>
                  <span v-if="isVehicleDisabled(v.id)" class="erp-tag erp-tag-orange busy-badge flex-shrink-0">
                    DISPATCHED
                  </span>
                  <v-icon v-else-if="wizardHeader.vehicleId === v.id" size="18" class="flex-shrink-0" color="red-darken-2">
                    mdi-check-circle
                  </v-icon>
                </div>
              </div>
              <div v-if="vehicles.length === 0" class="text-caption text-grey text-center pa-4">
                No active vehicles
              </div>
            </div>
          </div>

          <!-- COLUMN 2: DRIVERS (Green Border) -->
          <div class="delivery-column col-drivers">
            <div class="column-header text-center">
              <span class="column-title text-green-darken-3">Drivers</span>
              <div class="column-icon-box">
                <v-icon size="30" color="green-darken-3">mdi-account-tie-outline</v-icon>
              </div>
            </div>
            <div class="column-list-scroll">
              <div
                v-for="d in drivers"
                :key="d.id"
                class="delivery-item-card driver-card"
                :class="{
                  'item-selected': wizardHeader.driverId === d.id && !isDriverDisabled(d.id),
                  'item-disabled': isDriverDisabled(d.id),
                }"
                :aria-disabled="isDriverDisabled(d.id)"
                :title="isDriverDisabled(d.id) ? `${d.name} is dispatched for ${formatDate(wizardHeader.date)} until marked back` : `Select ${d.name}`"
                @click="selectDriver(d)"
              >
                <div class="delivery-item-row">
                  <v-icon
                    size="22"
                    class="flex-shrink-0"
                    :color="isDriverDisabled(d.id) ? 'grey' : (wizardHeader.driverId === d.id ? 'green-darken-3' : 'grey-darken-2')"
                  >
                    mdi-account-outline
                  </v-icon>
                  <span class="item-text font-weight-bold">{{ d.name }}</span>
                  <span v-if="isDriverDisabled(d.id)" class="erp-tag erp-tag-orange busy-badge flex-shrink-0">
                    DISPATCHED
                  </span>
                  <v-icon v-else-if="wizardHeader.driverId === d.id" size="18" class="flex-shrink-0" color="green-darken-3">
                    mdi-check-circle
                  </v-icon>
                </div>
              </div>
              <div v-if="drivers.length === 0" class="text-caption text-grey text-center pa-4">
                No active drivers
              </div>
            </div>
          </div>

          <!-- COLUMN 3: CALANDER (Person going with driver / Helper - Purple Border) -->
          <div class="delivery-column col-calendar">
            <div class="column-header text-center">
              <span class="column-title text-purple-darken-2">Calander</span>
              <div class="column-icon-box">
                <v-icon size="30" color="purple-darken-2">mdi-account-outline</v-icon>
              </div>
            </div>
            <div class="column-list-scroll">
              <div
                v-for="c in calanders"
                :key="c.id"
                class="delivery-item-card calander-card"
                :class="{
                  'item-selected': wizardHeader.calanderId === c.id && !isCalanderDisabled(c.id),
                  'item-disabled': isCalanderDisabled(c.id),
                }"
                :aria-disabled="isCalanderDisabled(c.id)"
                :title="isCalanderDisabled(c.id) ? `${c.name} is dispatched for ${formatDate(wizardHeader.date)} until marked back` : `Select ${c.name}`"
                @click="selectCalander(c)"
              >
                <div class="delivery-item-row">
                  <v-icon
                    size="22"
                    class="flex-shrink-0"
                    :color="isCalanderDisabled(c.id) ? 'grey' : (wizardHeader.calanderId === c.id ? 'purple-darken-2' : 'grey-darken-2')"
                  >
                    mdi-account-outline
                  </v-icon>
                  <span class="item-text font-weight-bold">{{ c.name }}</span>
                  <span v-if="isCalanderDisabled(c.id)" class="erp-tag erp-tag-orange busy-badge flex-shrink-0">
                    DISPATCHED
                  </span>
                  <v-icon v-else-if="wizardHeader.calanderId === c.id" size="18" class="flex-shrink-0" color="purple-darken-2">
                    mdi-check-circle
                  </v-icon>
                </div>
              </div>
              <div v-if="calanders.length === 0" class="text-caption text-grey text-center pa-4">
                No active calanders
              </div>
            </div>
          </div>

          <!-- COLUMN 4: GROUPS (Slate Border) -->
          <div class="delivery-column col-groups">
            <div class="column-header text-center">
              <span class="column-title text-blue-grey-darken-3">Groups</span>
              <div class="column-icon-box">
                <v-icon size="30" color="blue-grey-darken-3">mdi-map-marker-path</v-icon>
              </div>
            </div>
            <div class="column-table-container">
              <div class="groups-table-header px-3 py-1 font-weight-bold text-caption text-grey-darken-2">
                Title
              </div>
              <div class="column-list-scroll groups-scroll">
                <div
                  v-for="a in areas"
                  :key="a.id"
                  class="group-row px-3 py-2"
                  :class="{
                    'group-selected': wizardHeader.areaId === a.id && !isAreaDisabled(a.id),
                    'item-disabled': isAreaDisabled(a.id),
                  }"
                  :aria-disabled="isAreaDisabled(a.id)"
                  :title="isAreaDisabled(a.id) ? `${a.name} is dispatched for ${formatDate(wizardHeader.date)} until marked back` : `Select ${a.name}`"
                  @click="selectArea(a)"
                >
                  <div class="group-row-inner">
                    <span class="group-name">{{ a.name }}</span>
                    <span v-if="isAreaDisabled(a.id)" class="erp-tag erp-tag-orange busy-badge flex-shrink-0">
                      DISPATCHED
                    </span>
                    <v-icon v-else-if="wizardHeader.areaId === a.id" size="18" class="flex-shrink-0" color="white">mdi-check</v-icon>
                  </div>
                </div>
                <div v-if="areas.length === 0" class="text-caption text-grey text-center pa-4">
                  No groups found
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Action Bar (Status Chips + Cancel & Generate) -->
        <div class="delivery-footer mt-3 pt-3 border-t d-flex align-center justify-space-between flex-wrap gap-3 flex-shrink-0">
          <!-- Selection Status Chips -->
          <div class="d-flex align-center flex-wrap gap-2">
            <v-chip size="small" :color="wizardHeader.vehicleId ? 'red-darken-2' : 'grey'" variant="tonal" class="font-weight-medium">
              <v-icon start size="16">mdi-truck</v-icon>
              Vehicle: {{ wizardHeader.vehicleNumber || 'None' }}
            </v-chip>
            <v-chip size="small" :color="wizardHeader.driverId ? 'green-darken-2' : 'grey'" variant="tonal" class="font-weight-medium">
              <v-icon start size="16">mdi-account-tie</v-icon>
              Driver: {{ wizardHeader.driverName || 'None' }}
            </v-chip>
            <v-chip size="small" :color="wizardHeader.calanderId ? 'purple-darken-2' : 'grey'" variant="tonal" class="font-weight-medium">
              <v-icon start size="16">mdi-account</v-icon>
              Calander: {{ wizardHeader.calanderName || 'None' }}
            </v-chip>
            <v-chip size="small" :color="wizardHeader.areaId ? 'cyan-darken-3' : 'grey'" variant="tonal" class="font-weight-medium">
              <v-icon start size="16">mdi-map-marker</v-icon>
              Group: {{ wizardHeader.areaName || 'None' }}
            </v-chip>
            <v-chip size="small" :color="wizardHeader.date ? 'blue-darken-2' : 'grey'" variant="tonal" class="font-weight-medium">
              <v-icon start size="16">mdi-calendar</v-icon>
              Date: {{ formatDate(wizardHeader.date) }}
            </v-chip>
            <v-chip
              v-if="activeDispatchesOnSelectedDate.length > 0"
              size="small"
              color="warning"
              variant="flat"
              class="font-weight-bold cursor-pointer"
              title="View active dispatches to mark them back"
              @click="goToHistoryForSelectedDate"
            >
              <v-icon start size="15">mdi-truck-fast</v-icon>
              {{ activeDispatchesOnSelectedDate.length }} Out — Mark Back
            </v-chip>
          </div>

          <!-- Buttons -->
          <div class="d-flex align-center gap-3 ms-auto">
            <v-btn
              color="primary"
              variant="flat"
              class="text-capitalize px-8 font-weight-bold"
              size="large"
              :disabled="!canProceedToStep2 || isDispatchEntryLocked"
              @click="goToStep2"
            >
              {{ isDispatchEntryLocked ? 'Locked Until Previous Day Closed' : 'Generate' }}
            </v-btn>
          </div>
        </div>
      </v-card>

      <!-- STEP 2: Shop Milk Dispatch Table -->
      <div v-if="currentStep === 2" class="dispatch-flex-panel">
        <!-- Selected Details Banner (Full width edge-to-edge touching page left and right) -->
        <v-card class="dispatch-details-banner mb-3 flex-shrink-0" elevation="0">
          <div class="banner-inner d-flex align-center justify-space-between flex-wrap gap-4">
            <div class="details-items-row d-flex align-center flex-wrap flex-grow-1">
              <div class="details-block">
                <span class="details-label">Route / Area:</span>
                <div class="details-val">{{ wizardHeader.areaName }}</div>
              </div>
              <div class="details-divider d-none d-sm-block"></div>

              <div class="details-block">
                <span class="details-label">Date:</span>
                <div class="details-val">{{ formatDate(wizardHeader.date) }}</div>
              </div>
              <div class="details-divider d-none d-sm-block"></div>

              <div class="details-block">
                <span class="details-label">Vehicle:</span>
                <div class="details-val">{{ wizardHeader.vehicleNumber }}</div>
              </div>
              <div class="details-divider d-none d-sm-block"></div>

              <div class="details-block">
                <span class="details-label">Driver:</span>
                <div class="details-val">{{ wizardHeader.driverName }}</div>
              </div>
              <div class="details-divider d-none d-sm-block"></div>

              <div class="details-block">
                <span class="details-label">Calander:</span>
                <div class="details-val">{{ wizardHeader.calanderName || '-' }}</div>
              </div>
            </div>

            <div class="banner-action ms-auto">
              <v-btn
                color="white"
                variant="outlined"
                size="small"
                class="text-capitalize rounded-lg font-weight-bold"
                prepend-icon="mdi-arrow-left"
                @click="currentStep = 1"
              >
                Change Route / Vehicle
              </v-btn>
            </div>
          </div>
        </v-card>

        <!-- Grand Totals Cards Banner (5-Column Responsive Grid) -->
        <div class="dispatch-metrics-grid mb-3 flex-shrink-0">
          <div class="dispatch-metric-card text-center">
            <div class="metric-card-label">TOTAL CANS</div>
            <div class="metric-card-value text-primary">{{ grandTotals.totalCans }}</div>
          </div>

          <div class="dispatch-metric-card text-center">
            <div class="metric-card-label">TOTAL MILK (KG)</div>
            <div class="metric-card-value text-info">{{ formatNumber(grandTotals.totalMilk) }}</div>
          </div>

          <div class="dispatch-metric-card text-center">
            <div class="metric-card-label">TODAY AMOUNT</div>
            <div class="metric-card-value text-dark">{{ formatCurrency(grandTotals.totalAmount) }}</div>
          </div>

          <div class="dispatch-metric-card text-center">
            <div class="metric-card-label text-grey-darken-3">PREVIOUS ARREARS</div>
            <div class="metric-card-value text-grey-darken-3">{{ formatCurrency(grandTotals.totalPreviousArrears) }}</div>
          </div>

          <div class="dispatch-metric-card card-arrears text-center">
            <div class="metric-card-label text-amber-darken-4">TOTAL PAYABLE</div>
            <div class="metric-card-value text-amber-darken-4">{{ formatCurrency(grandTotals.totalPayable) }}</div>
            <div class="metric-card-sub text-caption text-grey-darken-2">
              Today ({{ formatCurrency(grandTotals.totalAmount) }}) + Prev
            </div>
          </div>
        </div>

        <!-- Shops Dispatch Table -->
        <v-card class="modern-card pa-4 mb-4 table-card-full" elevation="0">
          <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-2">
            <div>
              <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-3 mb-0">
                Route Shops ({{ dispatchRows.length }} shops in {{ wizardHeader.areaName }})
              </h3>
              <span class="text-caption text-grey">All totals and arrears recalculate automatically as you enter figures</span>
            </div>
            <div class="d-flex align-center flex-wrap gap-2">
              <div class="d-flex align-center gap-2 px-3 py-1 rounded border bg-blue-lighten-5">
                <v-icon size="16" color="primary">mdi-currency-pkr</v-icon>
                <span class="text-caption font-weight-bold text-primary">
                  Master: {{ formatCurrency(masterMilkPrice) }}/Kg
                </span>
                <span class="text-caption text-grey-darken-2">
                  • 1 Can = {{ kgPerCan }} Kg ({{ formatCurrency(masterMilkPrice * kgPerCan) }}/Can)
                </span>
              </div>
              <v-btn
                size="small"
                color="primary"
                variant="tonal"
                prepend-icon="mdi-sync"
                @click="applyMasterPriceToAllRouteRows"
              >
                Sync Master Rate
              </v-btn>
              <v-text-field
                v-model="searchShopQuery"
                prepend-inner-icon="mdi-magnify"
                placeholder="Search shop, code or owner..."
                variant="outlined"
                density="compact"
                hide-details
                style="width: 240px;"
                clearable
              />
            </div>
          </div>

          <!-- Bulk Actions Bar for Route Shops -->
          <BulkActionsBar
            :count="selectedRouteShopIds.length"
            item-label="shop"
            @clear="selectedRouteShopIds = []"
          >
            <template #actions>
              <v-btn
                size="small"
                variant="flat"
                color="primary"
                class="text-capitalize font-weight-bold"
                prepend-icon="mdi-currency-pkr"
                @click="promptBulkSetPrice"
              >
                Apply Price
              </v-btn>
              <v-btn
                size="small"
                variant="flat"
                color="warning"
                class="text-capitalize font-weight-bold"
                prepend-icon="mdi-refresh"
                @click="clearSelectedShopsInput"
              >
                Reset Figures
              </v-btn>
            </template>
          </BulkActionsBar>

          <div class="table-responsive flex-grow-1">
            <v-table density="compact" class="dispatch-table">
            <thead>
              <tr class="bg-grey-lighten-4">
                <th class="table-checkbox-col">
                  <v-checkbox-btn
                    :model-value="isAllRouteShopsSelected"
                    :indeterminate="isSomeRouteShopsSelected"
                    color="primary"
                    density="compact"
                    @update:model-value="toggleSelectAllRouteShops"
                  />
                </th>
                <th style="width: 100px;">Code</th>
                <th style="min-width: 160px;">Shop / Owner Name</th>
                <th style="width: 110px;" class="text-end">Milk Price</th>
                <th style="min-width: 148px;" class="text-center">Cans ({{ kgPerCan }}Kg)</th>
                <th style="width: 100px;" class="text-end">Kgs</th>
                <th style="width: 110px;" class="text-end">Today Milk</th>
                <th style="width: 120px;" class="text-end">Today Amount</th>
                <th style="width: 120px;" class="text-end">Prev Arrears</th>
                <th style="width: 130px;" class="text-end">Total Payable</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in displayedDispatchRows"
                :key="row.shopId || idx"
                :class="{ 'selected-row': selectedRouteShopIds.includes(row.shopId) }"
              >
                <td class="table-checkbox-col">
                  <v-checkbox-btn
                    :model-value="selectedRouteShopIds.includes(row.shopId)"
                    color="primary"
                    density="compact"
                    @update:model-value="toggleSelectRouteShop(row.shopId)"
                    @click.stop
                  />
                </td>
                <td class="font-weight-bold text-blue-grey-darken-2">
                  {{ row.shopCode }}
                </td>
                <td>
                  <div class="font-weight-bold text-primary">{{ row.shopName }}</div>
                  <div class="text-caption text-grey">{{ row.ownerName }}</div>
                </td>

                <!-- Milk Price Input -->
                <td class="editable-cell-highlight">
                  <v-text-field
                    v-model.number="row.price"
                    type="number"
                    density="compact"
                    variant="outlined"
                    hide-details
                    class="editable-input"
                    style="min-width: 96px;"
                    @update:model-value="(val) => onPriceChange(row, val)"
                  />
                </td>

                <!-- Cans Input -->
                <td class="editable-cell-highlight">
                  <div class="d-flex align-center justify-center gap-1">
                    <v-btn
                      icon="mdi-minus"
                      size="x-small"
                      variant="tonal"
                      color="grey-darken-2"
                      density="compact"
                      :disabled="(Number(row.cans) || 0) <= 0"
                      title="Decrease 1 Can"
                      @click="stepCans(row, -1)"
                    />
                    <v-text-field
                      v-model.number="row.cans"
                      type="number"
                      min="0"
                      step="1"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="editable-input"
                      style="width: 64px; min-width: 64px;"
                      @update:model-value="(val) => onCansChange(row, val)"
                    />
                    <v-btn
                      icon="mdi-plus"
                      size="x-small"
                      variant="tonal"
                      color="primary"
                      density="compact"
                      :title="`Add 1 Can (+${kgPerCan} Kg)`"
                      @click="stepCans(row, 1)"
                    />
                  </div>
                </td>

                <!-- Kgs Input -->
                <td class="editable-cell-highlight">
                  <v-text-field
                    v-model.number="row.kgs"
                    type="number"
                    density="compact"
                    variant="outlined"
                    hide-details
                    class="editable-input"
                    style="min-width: 96px;"
                    @update:model-value="(val) => onKgsChange(row, val)"
                  />
                </td>

                <!-- Today Milk (Kg) -->
                <td class="font-weight-bold text-info text-end" style="white-space: nowrap;">
                  {{ formatNumber(row.todayMilk) }} Kg
                </td>

                <!-- Today Amount (todayMilk x price) -->
                <td class="font-weight-bold text-dark text-end" style="white-space: nowrap;">
                  {{ formatCurrency(row.todayAmount) }}
                </td>

                <!-- Previous Arrears -->
                <td class="font-weight-medium text-grey-darken-2 text-end" style="white-space: nowrap;">
                  {{ formatCurrency(row.previousArrears) }}
                </td>

                <!-- Total Payable: Previous Arrears + Today Amount -->
                <td class="font-weight-bold text-amber-darken-4 text-end" style="white-space: nowrap;">
                  {{ formatCurrency(row.totalPayable) }}
                </td>
              </tr>

              <!-- Empty State in Table -->
              <tr v-if="dispatchRows.length === 0">
                <td colspan="10" class="text-center pa-8">
                  <div class="empty-state-box">
                    <v-icon class="empty-state-icon">mdi-store-off</v-icon>
                    <div class="empty-state-title">No Shops in {{ wizardHeader.areaName }}</div>
                    <div class="empty-state-subtitle">There are currently no active customer shops assigned to this delivery route.</div>
                    <v-btn v-if="authStore.isAdmin" color="primary" variant="flat" size="small" :to="{ path: '/masters', query: { tab: 'shops' } }" prepend-icon="mdi-plus">
                      Register Shops for this Route
                    </v-btn>
                  </div>
                </td>
              </tr>
              <tr v-else-if="displayedDispatchRows.length === 0">
                <td colspan="10" class="text-center py-6 text-grey">
                  No shops match "{{ searchShopQuery }}".
                </td>
              </tr>

              <!-- GRAND TOTALS ROW -->
              <tr v-if="dispatchRows.length > 0" class="bg-blue-lighten-5 font-weight-black text-body-2">
                <td colspan="4" class="text-uppercase font-weight-black text-primary">
                  Grand Totals:
                </td>
                <td class="font-weight-black text-primary text-end">{{ grandTotals.totalCans }}</td>
                <td colspan="2" class="font-weight-black text-info text-end">{{ formatNumber(grandTotals.totalMilk) }} Kg</td>
                <td class="font-weight-black text-dark text-end">{{ formatCurrency(grandTotals.totalAmount) }}</td>
                <td class="font-weight-black text-grey-darken-3 text-end">{{ formatCurrency(grandTotals.totalPreviousArrears) }}</td>
                <td class="font-weight-black text-amber-darken-4 text-end">{{ formatCurrency(grandTotals.totalPayable) }}</td>
              </tr>
            </tbody>
          </v-table>
          </div>

          <!-- Save Button Bar -->
          <div class="d-flex align-center justify-space-between mt-auto pt-3 pb-2 border-t flex-shrink-0 flex-wrap gap-2">
            <v-btn
              variant="outlined"
              class="text-capitalize"
              prepend-icon="mdi-arrow-left"
              @click="currentStep = 1"
            >
              Back to Route Selection
            </v-btn>

            <div class="d-flex align-center gap-2 ms-auto flex-wrap">
              <v-btn
                color="primary"
                variant="flat"
                size="large"
                class="text-capitalize rounded-lg px-8 font-weight-bold"
                :prepend-icon="isEditingDispatch ? 'mdi-content-save-check' : 'mdi-truck-fast'"
                :disabled="isDispatchEntryLocked"
                :loading="saving"
                @click="saveDispatch(false)"
              >
                {{ isEditingDispatch ? 'Update Dispatch' : 'Save & Dispatch' }}
              </v-btn>
            </div>
          </div>
        </v-card>
      </div>
    </div>

    <!-- TAB 2: PAST DISPATCHES HISTORY -->
    <div v-if="activeTab === 'history'" class="dispatch-flex-panel">
      <v-card class="modern-card pa-4 table-card-full" elevation="0">
        <div class="d-flex align-center justify-space-between mb-3 flex-wrap" style="gap: 16px;">
          <div class="d-flex align-center flex-wrap" style="gap: 12px;">
            <div style="min-width: 260px; width: 280px;">
              <AppDatePicker
                v-model="historyDateFilter"
                label="Filter by Date"
                clearable
                hide-details
                @change="loadHistory"
              />
            </div>
            <v-btn
              v-if="historyDateFilter"
              variant="flat"
              size="small"
              prepend-icon="mdi-calendar-range"
              class="text-capitalize accent-orange-btn"
              @click="historyDateFilter = null; loadHistory()"
            >
              Show All Dates
            </v-btn>
          </div>

          <div class="text-caption text-grey">
            {{ dispatchesHistory.length }} recorded dispatches
          </div>
        </div>

        <!-- Bulk Actions Bar for History -->
        <BulkActionsBar
          :count="selectedHistoryIds.length"
          item-label="dispatch"
          @clear="selectedHistoryIds = []"
        >
          <template #actions>
            <v-btn
              v-if="hasSelectedActiveDispatches"
              size="small"
              variant="flat"
              color="success"
              class="text-capitalize font-weight-bold"
              prepend-icon="mdi-truck-check"
              :loading="markingBack"
              @click="promptBulkMarkBack"
            >
              Mark Selected Back
            </v-btn>
            <v-btn
              v-if="authStore.isAdmin && settingsStore.settings.allowDeleteDispatch !== false"
              size="small"
              variant="flat"
              color="error"
              class="text-capitalize font-weight-bold"
              prepend-icon="mdi-delete-sweep"
              @click="confirmBulkDeleteHistory"
            >
              Delete Selected ({{ selectedHistoryIds.length }})
            </v-btn>
          </template>
        </BulkActionsBar>

        <div class="table-responsive flex-grow-1">
          <v-table hover>
            <thead>
              <tr>
                <th class="table-checkbox-col">
                  <v-checkbox-btn
                    :model-value="isAllHistorySelected"
                    :indeterminate="isSomeHistorySelected"
                    color="primary"
                    density="compact"
                    @update:model-value="toggleSelectAllHistory"
                  />
                </th>
                <th>Date</th>
                <th>Area / Route</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Calander</th>
                <th>Status</th>
                <th class="text-end">Milk (Kg)</th>
                <th class="text-end">Today Amount</th>
                <th class="text-end">New Arrears</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="d in paginatedHistory"
                :key="d.id"
                class="cursor-pointer"
                :class="{ 'selected-row': selectedHistoryIds.includes(d.id) }"
                @click="viewDispatchSummary(d)"
              >
                <td class="table-checkbox-col" @click.stop>
                  <v-checkbox-btn
                    :model-value="selectedHistoryIds.includes(d.id)"
                    color="primary"
                    density="compact"
                    @update:model-value="toggleSelectHistoryItem(d.id)"
                    @click.stop
                  />
                </td>
                <td class="font-weight-bold text-dark">
                  <v-icon size="16" color="primary" class="me-1">mdi-calendar</v-icon>
                  {{ formatDate(d.date) }}
                </td>
                <td class="font-weight-bold text-primary">{{ d.areaName }}</td>
                <td>{{ d.vehicleNumber }}</td>
                <td>{{ d.driverName }}</td>
                <td>{{ d.calanderName || '-' }}</td>
                <td>
                  <span
                    class="erp-tag"
                    :class="d.status === 'Dispatched' ? 'erp-tag-orange' : 'erp-tag-green'"
                  >
                    {{ d.status === 'Dispatched' ? 'DISPATCHED' : 'RETURNED' }}
                  </span>
                </td>
                <td class="text-end font-weight-bold text-info">
                  {{ formatNumber(d.totalMilk) }} Kg
                  <div v-if="d.totalReturnMilk > 0" class="text-caption text-orange-darken-3 font-weight-medium">
                    Ret: {{ formatNumber(d.totalReturnMilk) }} Kg
                  </div>
                </td>
                <td class="text-end font-weight-medium">{{ formatCurrency(d.totalAmount) }}</td>
                <td class="text-end font-weight-bold text-error">{{ formatCurrency(d.totalNewArrears) }}</td>
              </tr>
              <tr v-if="dispatchesHistory.length === 0">
                <td colspan="10" class="text-center pa-8">
                  <div class="empty-state-box">
                    <v-icon class="empty-state-icon">mdi-clipboard-text-off-outline</v-icon>
                    <div class="empty-state-title">No Dispatches Recorded</div>
                    <div class="empty-state-subtitle">There are no dispatch records found for the selected date filter.</div>
                    <v-btn color="primary" variant="flat" size="small" class="mt-2 text-capitalize font-weight-bold" prepend-icon="mdi-plus" @click="startNewDispatch">
                      Create New Dispatch
                    </v-btn>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <!-- Pagination Footer -->
        <AppPagination
          v-model:page="historyPage"
          v-model:itemsPerPage="historyItemsPerPage"
          :total-items="dispatchesHistory.length"
        />
      </v-card>
    </div>

    <!-- Dispatch Summary / Receipt Modal -->
    <v-dialog v-model="summaryDialog" max-width="1080" width="92vw">
      <v-card v-if="selectedDispatch" class="rounded-xl pa-4 printable-area">
        <div class="d-flex align-center justify-space-between pb-3 border-b">
          <div>
            <h2 class="text-h6 font-weight-bold text-primary mb-0">Dispatch Receipt & Shop Breakdown</h2>
            <div class="text-caption text-grey">
              {{ selectedDispatch.areaName }} Route | Date: {{ formatDate(selectedDispatch.date) }}
            </div>
          </div>
          <div class="d-flex align-center gap-2">
            <v-btn
              v-if="canEditDispatch(selectedDispatch)"
              variant="tonal"
              color="primary"
              size="small"
              class="no-print text-capitalize font-weight-bold"
              prepend-icon="mdi-pencil"
              @click="summaryDialog = false; editExistingDispatch(selectedDispatch)"
            >
              Edit Dispatch
            </v-btn>
            <v-btn variant="outlined" size="small" class="no-print text-capitalize" prepend-icon="mdi-printer" @click="printReceipt">
              Print
            </v-btn>
          </div>
        </div>

        <div class="my-3">
          <v-row dense class="align-center">
            <v-col cols="3"><span class="text-caption text-grey">Vehicle:</span> <strong>{{ selectedDispatch.vehicleNumber }}</strong></v-col>
            <v-col cols="3"><span class="text-caption text-grey">Driver:</span> <strong>{{ selectedDispatch.driverName }}</strong></v-col>
            <v-col cols="3"><span class="text-caption text-grey">Calander:</span> <strong>{{ selectedDispatch.calanderName || '-' }}</strong></v-col>
            <v-col cols="3" class="text-end">
              <span class="text-caption text-grey me-2">Status:</span>
              <span
                class="erp-tag"
                :class="selectedDispatch.status === 'Dispatched' ? 'erp-tag-orange' : 'erp-tag-green'"
              >
                {{ selectedDispatch.status === 'Dispatched' ? 'DISPATCHED' : 'RETURNED' }}
              </span>
            </v-col>
          </v-row>
          <div v-if="selectedDispatch.returnNotes" class="text-caption text-grey-darken-2 mt-2">
            <strong>Return Note:</strong> {{ selectedDispatch.returnNotes }}
          </div>
        </div>

        <v-table density="compact" class="border rounded-lg mb-4">
          <thead>
            <tr class="bg-grey-lighten-4">
              <th>Shop</th>
              <th class="text-end">Price</th>
              <th class="text-end">Sent (Kg)</th>
              <th v-if="selectedDispatch.totalReturnMilk > 0" class="text-end">Return (Kg)</th>
              <th class="text-end">Net Milk (Kg)</th>
              <th class="text-end">Today Amount</th>
              <th class="text-end">Prev Arrears</th>
              <th class="text-end">Collection</th>
              <th class="text-end">New Arrears</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in selectedDispatch.items" :key="it.shopId || it.id">
              <td><strong>{{ it.shopCode }}</strong> - {{ it.shopName }}</td>
              <td class="text-end">{{ formatCurrency(it.price) }}</td>
              <td class="text-end font-weight-medium">{{ formatNumber(it.kgs ?? it.todayMilk) }} Kg</td>
              <td v-if="selectedDispatch.totalReturnMilk > 0" class="text-end text-orange-darken-3 font-weight-bold">{{ formatNumber(it.returnKgs || 0) }} Kg</td>
              <td class="text-end font-weight-bold">{{ formatNumber(it.todayMilk) }} Kg</td>
              <td class="text-end">{{ formatCurrency(it.todayAmount) }}</td>
              <td class="text-end">{{ formatCurrency(it.previousArrears) }}</td>
              <td class="text-end text-success font-weight-bold">{{ formatCurrency(it.todayCollection) }}</td>
              <td class="text-end text-error font-weight-bold">{{ formatCurrency(it.newArrears) }}</td>
            </tr>
          </tbody>
        </v-table>

        <div class="signature-block">
          <div class="signature-line">Driver Signature</div>
          <div class="signature-line">Farm Manager Signature</div>
        </div>

        <v-card-actions class="px-0 pt-4 no-print justify-end gap-2">
          <v-btn
            v-if="selectedDispatch.status === 'Dispatched'"
            color="success"
            variant="flat"
            class="text-capitalize font-weight-bold"
            prepend-icon="mdi-truck-check"
            @click="summaryDialog = false; openMarkBackDialog(selectedDispatch)"
          >
            Mark Back & Settle Returns
          </v-btn>
          <v-btn variant="text" class="text-capitalize" @click="summaryDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Mark Back / Return & Collection Settlement Dialog -->
    <v-dialog v-model="markBackDialog" max-width="1440" width="96vw" persistent scrollable>
      <v-card v-if="markBackDispatch" class="rounded-xl pa-5">
        <div class="d-flex align-center justify-space-between pb-3 border-b flex-wrap gap-2">
          <div>
            <h2 class="text-h6 font-weight-bold text-primary d-flex align-center gap-2 mb-0">
              <v-icon color="success">mdi-truck-check</v-icon>
              Dispatch Return & Arrears Settlement
            </h2>
            <div class="text-caption text-grey-darken-1 mt-1">
              <strong>{{ markBackDispatch.areaName }}</strong> Route &bull;
              Date: <strong>{{ formatDate(markBackDispatch.date) }}</strong> &bull;
              Vehicle: <strong>{{ markBackDispatch.vehicleNumber }}</strong> &bull;
              Driver: <strong>{{ markBackDispatch.driverName }}</strong> &bull;
              Calander: <strong>{{ markBackDispatch.calanderName || '-' }}</strong>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="markBackDialog = false" />
        </div>

        <!-- Live Settlement Totals Summary -->
        <div class="dispatch-metrics-grid my-3">
          <div class="dispatch-metric-card text-center">
            <div class="metric-card-label">SENT MILK (KG)</div>
            <div class="metric-card-value text-primary">{{ formatNumber(markBackTotals.totalKgs) }} Kg</div>
          </div>
          <div class="dispatch-metric-card text-center">
            <div class="metric-card-label text-orange-darken-3">TODAY RETURNS (KG)</div>
            <div class="metric-card-value text-orange-darken-3">{{ formatNumber(markBackTotals.totalReturnMilk) }} Kg</div>
          </div>
          <div class="dispatch-metric-card text-center">
            <div class="metric-card-label text-info">NET MILK &amp; AMOUNT</div>
            <div class="metric-card-value text-dark">{{ formatCurrency(markBackTotals.totalAmount) }}</div>
            <div class="metric-card-sub text-caption text-info font-weight-bold">
              Net: {{ formatNumber(markBackTotals.totalMilk) }} Kg
            </div>
          </div>
          <div class="dispatch-metric-card text-center">
            <div class="metric-card-label text-success">TODAY COLLECTION</div>
            <div class="metric-card-value text-success">{{ formatCurrency(markBackTotals.totalCollection) }}</div>
          </div>
          <div class="dispatch-metric-card card-arrears text-center">
            <div class="metric-card-label text-amber-darken-4">UPDATED NEW ARREARS</div>
            <div class="metric-card-value text-amber-darken-4">{{ formatCurrency(markBackTotals.totalNewArrears) }}</div>
            <div class="metric-card-sub text-caption text-grey-darken-2">
              Prev: {{ formatCurrency(markBackTotals.totalPreviousArrears) }}
            </div>
          </div>
        </div>

        <v-card-text class="px-0 py-1" style="max-height: 460px; overflow-y: auto;">
          <div class="table-responsive">
            <v-table density="compact" class="dispatch-table settlement-table border rounded-lg">
              <thead>
                <tr class="bg-grey-lighten-4">
                  <th style="min-width: 200px;">Shop / Owner</th>
                  <th style="min-width: 110px;" class="text-end">Price</th>
                  <th style="min-width: 105px;" class="text-end">Sent (Kg)</th>
                  <th style="min-width: 115px;" class="text-end">Return (Kg)</th>
                  <th style="min-width: 105px;" class="text-end">Net Milk</th>
                  <th style="min-width: 130px;" class="text-end">Today Amount</th>
                  <th style="min-width: 125px;" class="text-end">Prev Arrears</th>
                  <th style="min-width: 175px;" class="text-end">Today Collection</th>
                  <th style="min-width: 130px;" class="text-end">New Arrears</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in markBackRows" :key="row.shopId || idx">
                  <td>
                    <div class="font-weight-bold text-primary">{{ row.shopCode }} - {{ row.shopName }}</div>
                    <div class="text-caption text-grey">{{ row.ownerName }}</div>
                  </td>
                  <td class="editable-cell-highlight">
                    <v-text-field
                      v-model.number="row.price"
                      type="number"
                      min="0"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="editable-input"
                      style="min-width: 96px;"
                      @update:model-value="(val) => onMarkBackFieldChange(row, 'price', val)"
                    />
                  </td>
                  <td class="text-end font-weight-bold text-primary tabular-nums" style="white-space: nowrap;">
                    <div>{{ formatNumber(row.kgs) }} Kg</div>
                    <div v-if="Number(row.cans) > 0" class="text-caption text-grey-darken-1">
                      ({{ formatNumber(row.cans) }} Cans)
                    </div>
                  </td>
                  <td class="editable-cell-highlight">
                    <v-text-field
                      v-model.number="row.returnKgs"
                      type="number"
                      min="0"
                      :max="row.kgs"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="editable-input font-weight-bold text-orange-darken-3"
                      style="min-width: 100px;"
                      @update:model-value="(val) => onMarkBackFieldChange(row, 'returnKgs', val)"
                    />
                  </td>
                  <td class="text-end font-weight-bold text-info tabular-nums" style="white-space: nowrap;">
                    {{ formatNumber(row.todayMilk) }} Kg
                  </td>
                  <td class="text-end font-weight-bold tabular-nums" style="white-space: nowrap;">
                    {{ formatCurrency(row.todayAmount) }}
                  </td>
                  <td class="text-end text-grey-darken-2 tabular-nums" style="white-space: nowrap;">
                    {{ formatCurrency(row.previousArrears) }}
                  </td>
                  <td class="editable-cell-highlight">
                    <div class="d-flex align-center gap-1">
                      <v-text-field
                        v-model.number="row.todayCollection"
                        type="number"
                        min="0"
                        density="compact"
                        variant="outlined"
                        hide-details
                        class="editable-input font-weight-bold text-success"
                        style="min-width: 118px;"
                        @update:model-value="(val) => onMarkBackFieldChange(row, 'todayCollection', val)"
                      />
                      <v-btn
                        icon="mdi-check-all"
                        size="x-small"
                        variant="tonal"
                        color="success"
                        title="Collect Full Payable"
                        @click="collectFullPayable(row)"
                      />
                    </div>
                  </td>
                  <td
                    class="text-end font-weight-bold tabular-nums"
                    :class="row.newArrears > 0 ? 'text-error' : 'text-success'"
                    style="white-space: nowrap;"
                  >
                    {{ formatCurrency(row.newArrears) }}
                  </td>
                </tr>
                <tr v-if="markBackRows.length > 0" class="bg-blue-lighten-5 font-weight-black text-body-2">
                  <td colspan="2" class="text-uppercase text-primary">Grand Totals:</td>
                  <td class="text-end text-primary" style="white-space: nowrap;">{{ formatNumber(markBackTotals.totalKgs) }} Kg</td>
                  <td class="text-end text-orange-darken-3" style="white-space: nowrap;">{{ formatNumber(markBackTotals.totalReturnMilk) }} Kg</td>
                  <td class="text-end text-info" style="white-space: nowrap;">{{ formatNumber(markBackTotals.totalMilk) }} Kg</td>
                  <td class="text-end" style="white-space: nowrap;">{{ formatCurrency(markBackTotals.totalAmount) }}</td>
                  <td class="text-end text-grey-darken-3" style="white-space: nowrap;">{{ formatCurrency(markBackTotals.totalPreviousArrears) }}</td>
                  <td class="text-end text-success" style="white-space: nowrap;">{{ formatCurrency(markBackTotals.totalCollection) }}</td>
                  <td class="text-end text-error" style="white-space: nowrap;">{{ formatCurrency(markBackTotals.totalNewArrears) }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>

        <div class="pt-3 mt-2 border-t d-flex align-center justify-space-between flex-wrap gap-3">
          <div style="flex: 1 1 320px; max-width: 480px;">
            <v-text-field
              v-model="markBackReturnNotes"
              label="Return Remarks / Settlement Note (Optional)"
              placeholder="e.g., 5 Kg returned unsold, cash settled"
              variant="outlined"
              density="compact"
              hide-details
              prepend-inner-icon="mdi-note-text-outline"
            />
          </div>
          <div class="d-flex align-center gap-2 ms-auto">
            <v-btn variant="outlined" class="text-capitalize" @click="markBackDialog = false">
              Cancel
            </v-btn>
            <v-btn
              color="success"
              variant="flat"
              size="large"
              class="text-capitalize font-weight-bold px-6"
              prepend-icon="mdi-truck-check"
              :loading="markingBack"
              @click="submitMarkBackSettlement"
            >
              Confirm Return & Update Arrears
            </v-btn>
          </div>
        </div>
      </v-card>
    </v-dialog>

    <!-- Bulk Mark Back Confirmation -->
    <ConfirmDialog
      v-model="bulkMarkBackConfirmDialog"
      title="Mark Selected Dispatches Back"
      :message="`Mark ${selectedActiveDispatchCount} active dispatch(es) as returned using their existing amounts and arrears?`"
      confirm-text="Mark Returned"
      confirm-color="success"
      :loading="markingBack"
      @confirm="executeBulkMarkBack"
    />

    <!-- Delete Confirmation -->
    <ConfirmDialog
      v-model="deleteDialog"
      title="Delete Dispatch"
      :message="`Are you sure you want to delete dispatch for ${targetDispatch?.areaName} on ${formatDate(targetDispatch?.date)}?`"
      :loading="deleting"
      @confirm="executeDeleteDispatch"
    />

    <!-- Bulk Delete History Confirmation -->
    <ConfirmDialog
      v-model="bulkDeleteHistoryDialog"
      title="Bulk Delete Dispatches"
      :message="`Are you sure you want to delete ${selectedHistoryIds.length} selected dispatch(es)? This action will revert shop balances accordingly.`"
      :loading="bulkDeletingHistory"
      @confirm="executeBulkDeleteHistory"
    />

    <!-- Prompt to Close Previous Day after last pending dispatch is marked back -->
    <ConfirmDialog
      v-model="closeDayPromptDialog"
      title="Close Previous Day"
      :message="`All dispatches for ${formatDate(closeDayTargetDate)} are now marked back (Returned). Close ${formatDate(closeDayTargetDate)} now and move forward to ${formatDate(businessDayStore.realToday)}?`"
      confirm-text="Close Day & Advance"
      confirm-color="primary"
      :loading="closingDay"
      @confirm="executeClosePromptedDay"
    />

    <!-- Apply Bulk Milk Price Dialog -->
    <v-dialog v-model="applyBulkPriceDialog" max-width="400">
      <v-card class="rounded-xl pa-4">
        <v-card-title class="font-weight-bold px-0 pt-0 text-primary">
          Apply Milk Price to Selected Shops
        </v-card-title>
        <v-card-text class="px-0 py-2">
          <p class="text-body-2 mb-3">
            Set milk price (Rs./liter) for <strong>{{ selectedRouteShopIds.length }}</strong> selected shop(s):
          </p>
          <v-text-field
            v-model.number="bulkPriceValue"
            type="number"
            label="Milk Price (Rs.) *"
            prepend-inner-icon="mdi-currency-pkr"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions class="px-0 pb-0 justify-end">
          <v-btn variant="text" class="text-capitalize" @click="applyBulkPriceDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="text-capitalize rounded-lg px-4 font-weight-bold"
            @click="executeBulkSetPrice"
          >
            Apply Price
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import MilkDispatchMobileView from './MilkDispatchMobileView.vue';
import { mastersService } from '@/services/mastersService';
import { dispatchService } from '@/services/dispatchService';
import { useSnackbarStore } from '@/stores/snackbar';
import { useSettingsStore } from '@/stores/settings';
import { useBusinessDayStore } from '@/stores/businessDay';
import { useAuthStore } from '@/stores/auth';
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters';
import { calculateDispatchRow, convertCanToKg } from '@/utils/calculations';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import AppDatePicker from '@/components/common/AppDatePicker.vue';
import AppPagination from '@/components/common/AppPagination.vue';
import BulkActionsBar from '@/components/common/BulkActionsBar.vue';

const route = useRoute();
const router = useRouter();
const display = useDisplay();
const snackbar = useSnackbarStore();
const settingsStore = useSettingsStore();
const businessDayStore = useBusinessDayStore();
const authStore = useAuthStore();
const masterMilkPrice = computed(() => Number(settingsStore.settings.defaultMilkPrice) || 180);
const kgPerCan = computed(() => Number(settingsStore.settings.canWeightKg) || 50);

const activeTab = ref('new');
const currentStep = ref(1);
const step1Valid = ref(true);
const saving = ref(false);
const deleting = ref(false);

const areas = ref([]);
const vehicles = ref([]);
const drivers = ref([]);
const calanders = ref([]);
const allShops = ref([]);
const allDispatches = ref([]);
const dispatchesHistory = ref([]);
const historyDateFilter = ref(businessDayStore.activeBusinessDate);
const historyPage = ref(1);
const historyItemsPerPage = ref(10);
const selectedHistoryIds = ref([]);
const bulkDeleteHistoryDialog = ref(false);
const bulkDeletingHistory = ref(false);
const markingBack = ref(false);
const markBackDialog = ref(false);
const markBackDispatch = ref(null);
const markBackRows = ref([]);
const markBackReturnNotes = ref('');
const bulkMarkBackConfirmDialog = ref(false);
const closeDayPromptDialog = ref(false);
const closeDayTargetDate = ref('');
const closingDay = ref(false);

const paginatedHistory = computed(() => {
  const start = (historyPage.value - 1) * historyItemsPerPage.value;
  return dispatchesHistory.value.slice(start, start + historyItemsPerPage.value);
});

const isAllHistorySelected = computed(() => {
  return paginatedHistory.value.length > 0 && paginatedHistory.value.every(d => selectedHistoryIds.value.includes(d.id));
});

const isSomeHistorySelected = computed(() => {
  return selectedHistoryIds.value.length > 0 && !isAllHistorySelected.value;
});

const selectedActiveDispatchCount = computed(() => {
  return dispatchesHistory.value.filter(
    (d) => selectedHistoryIds.value.includes(d.id) && d.status === 'Dispatched'
  ).length;
});

const hasSelectedActiveDispatches = computed(() => selectedActiveDispatchCount.value > 0);

function toggleSelectAllHistory() {
  if (isAllHistorySelected.value) {
    selectedHistoryIds.value = [];
  } else {
    selectedHistoryIds.value = paginatedHistory.value.map(d => d.id);
  }
}

function toggleSelectHistoryItem(id) {
  const idx = selectedHistoryIds.value.indexOf(id);
  if (idx > -1) {
    selectedHistoryIds.value.splice(idx, 1);
  } else {
    selectedHistoryIds.value.push(id);
  }
}

const isEditingDispatch = ref(false);
const editingDispatchId = ref(null);
const editingDispatchStatus = ref('Returned');

const wizardHeader = ref({
  date: businessDayStore.activeBusinessDate,
  areaId: '',
  areaName: '',
  vehicleId: '',
  vehicleNumber: '',
  driverId: '',
  driverName: '',
  calanderId: '',
  calanderName: '',
});

const dispatchRows = ref([]);
const searchShopQuery = ref('');
const selectedRouteShopIds = ref([]);
const applyBulkPriceDialog = ref(false);
const bulkPriceValue = ref(180);

const displayedDispatchRows = computed(() => {
  if (!searchShopQuery.value) return dispatchRows.value;
  const q = searchShopQuery.value.toLowerCase().trim();
  return dispatchRows.value.filter(
    (r) =>
      (r.shopCode && r.shopCode.toLowerCase().includes(q)) ||
      (r.shopName && r.shopName.toLowerCase().includes(q)) ||
      (r.ownerName && r.ownerName.toLowerCase().includes(q))
  );
});

const isAllRouteShopsSelected = computed(() => {
  return displayedDispatchRows.value.length > 0 && displayedDispatchRows.value.every(r => selectedRouteShopIds.value.includes(r.shopId));
});

const isSomeRouteShopsSelected = computed(() => {
  return selectedRouteShopIds.value.length > 0 && !isAllRouteShopsSelected.value;
});

function toggleSelectAllRouteShops() {
  if (isAllRouteShopsSelected.value) {
    selectedRouteShopIds.value = [];
  } else {
    selectedRouteShopIds.value = displayedDispatchRows.value.map(r => r.shopId);
  }
}

function toggleSelectRouteShop(id) {
  const idx = selectedRouteShopIds.value.indexOf(id);
  if (idx > -1) {
    selectedRouteShopIds.value.splice(idx, 1);
  } else {
    selectedRouteShopIds.value.push(id);
  }
}

function promptBulkSetPrice() {
  if (selectedRouteShopIds.value.length === 0) return;
  bulkPriceValue.value = masterMilkPrice.value;
  applyBulkPriceDialog.value = true;
}

function executeBulkSetPrice() {
  const p = Number(bulkPriceValue.value) || 0;
  dispatchRows.value.forEach(r => {
    if (selectedRouteShopIds.value.includes(r.shopId)) {
      r.price = p;
      recalcRow(r);
    }
  });
  applyBulkPriceDialog.value = false;
  snackbar.success(`Applied Rs. ${p} to ${selectedRouteShopIds.value.length} selected shop(s)`);
}

function applyMasterPriceToAllRouteRows() {
  const p = masterMilkPrice.value;
  dispatchRows.value.forEach((r) => {
    r.price = p;
    recalcRow(r);
  });
  snackbar.success(`Synced Master Price (Rs. ${p}/Kg) to all ${dispatchRows.value.length} route shop(s)`);
}

function clearSelectedShopsInput() {
  dispatchRows.value.forEach(r => {
    if (selectedRouteShopIds.value.includes(r.shopId)) {
      r.cans = 0;
      r.kgs = 0;
      r.todayMilk = 0;
      r.todayAmount = 0;
      r.todayCollection = 0;
      recalcRow(r);
    }
  });
  snackbar.info(`Reset figures for ${selectedRouteShopIds.value.length} selected shop(s)`);
}

const summaryDialog = ref(false);
const selectedDispatch = ref(null);
const deleteDialog = ref(false);
const targetDispatch = ref(null);

const activeDispatchesOnSelectedDate = computed(() => {
  const selectedDate = wizardHeader.value.date;
  if (!selectedDate) return [];
  return allDispatches.value.filter(
    (d) =>
      d.date === selectedDate &&
      d.status === 'Dispatched' &&
      (!isEditingDispatch.value || d.id !== editingDispatchId.value)
  );
});

const busyVehicleIds = computed(() => new Set(activeDispatchesOnSelectedDate.value.map((d) => d.vehicleId).filter(Boolean)));
const busyDriverIds = computed(() => new Set(activeDispatchesOnSelectedDate.value.map((d) => d.driverId).filter(Boolean)));
const busyCalanderIds = computed(() => new Set(activeDispatchesOnSelectedDate.value.map((d) => d.calanderId).filter(Boolean)));
const busyAreaIds = computed(() => new Set(activeDispatchesOnSelectedDate.value.map((d) => d.areaId).filter(Boolean)));

function isVehicleDisabled(id) {
  return Boolean(id) && busyVehicleIds.value.has(id);
}

function isDriverDisabled(id) {
  return Boolean(id) && busyDriverIds.value.has(id);
}

function isCalanderDisabled(id) {
  return Boolean(id) && busyCalanderIds.value.has(id);
}

function isAreaDisabled(id) {
  return Boolean(id) && busyAreaIds.value.has(id);
}

function syncAvailableSelections() {
  if (isEditingDispatch.value) return;

  if (!wizardHeader.value.vehicleId || isVehicleDisabled(wizardHeader.value.vehicleId)) {
    const availVehicle = vehicles.value.find((v) => !isVehicleDisabled(v.id));
    wizardHeader.value.vehicleId = availVehicle ? availVehicle.id : '';
    wizardHeader.value.vehicleNumber = availVehicle ? availVehicle.vehicleNumber : '';
  }

  if (!wizardHeader.value.driverId || isDriverDisabled(wizardHeader.value.driverId)) {
    const availDriver = drivers.value.find((d) => !isDriverDisabled(d.id));
    wizardHeader.value.driverId = availDriver ? availDriver.id : '';
    wizardHeader.value.driverName = availDriver ? availDriver.name : '';
  }

  if (!wizardHeader.value.calanderId || isCalanderDisabled(wizardHeader.value.calanderId)) {
    const availCalander = calanders.value.find((c) => !isCalanderDisabled(c.id));
    wizardHeader.value.calanderId = availCalander ? availCalander.id : '';
    wizardHeader.value.calanderName = availCalander ? availCalander.name : '';
  }

  if (!wizardHeader.value.areaId || isAreaDisabled(wizardHeader.value.areaId)) {
    const availArea = areas.value.find((a) => !isAreaDisabled(a.id));
    wizardHeader.value.areaId = availArea ? availArea.id : '';
    wizardHeader.value.areaName = availArea ? availArea.name : '';
  }
}

const isDispatchEntryLocked = computed(() => {
  return !isEditingDispatch.value && businessDayStore.isLockedOnPreviousDay;
});

const canProceedToStep2 = computed(() => {
  return (
    !isDispatchEntryLocked.value &&
    Boolean(wizardHeader.value.date) &&
    Boolean(wizardHeader.value.areaId) &&
    Boolean(wizardHeader.value.vehicleId) &&
    Boolean(wizardHeader.value.driverId) &&
    Boolean(wizardHeader.value.calanderId) &&
    !isAreaDisabled(wizardHeader.value.areaId) &&
    !isVehicleDisabled(wizardHeader.value.vehicleId) &&
    !isDriverDisabled(wizardHeader.value.driverId) &&
    !isCalanderDisabled(wizardHeader.value.calanderId)
  );
});

function selectVehicle(v) {
  if (isDispatchEntryLocked.value) {
    snackbar.error(businessDayStore.lockReason);
    return;
  }
  if (isVehicleDisabled(v.id)) {
    snackbar.warning(`Vehicle ${v.vehicleNumber} is already dispatched for ${formatDate(wizardHeader.value.date)} until marked back`);
    return;
  }
  wizardHeader.value.vehicleId = v.id;
  wizardHeader.value.vehicleNumber = v.vehicleNumber;
}

function selectDriver(d) {
  if (isDispatchEntryLocked.value) {
    snackbar.error(businessDayStore.lockReason);
    return;
  }
  if (isDriverDisabled(d.id)) {
    snackbar.warning(`Driver ${d.name} is already dispatched for ${formatDate(wizardHeader.value.date)} until marked back`);
    return;
  }
  wizardHeader.value.driverId = d.id;
  wizardHeader.value.driverName = d.name;
}

function selectCalander(c) {
  if (isDispatchEntryLocked.value) {
    snackbar.error(businessDayStore.lockReason);
    return;
  }
  if (isCalanderDisabled(c.id)) {
    snackbar.warning(`Calander ${c.name} is already dispatched for ${formatDate(wizardHeader.value.date)} until marked back`);
    return;
  }
  wizardHeader.value.calanderId = c.id;
  wizardHeader.value.calanderName = c.name;
}

function selectArea(a) {
  if (isDispatchEntryLocked.value) {
    snackbar.error(businessDayStore.lockReason);
    return;
  }
  if (isAreaDisabled(a.id)) {
    snackbar.warning(`Group/Route ${a.name} is already dispatched for ${formatDate(wizardHeader.value.date)} until marked back`);
    return;
  }
  wizardHeader.value.areaId = a.id;
  wizardHeader.value.areaName = a.name;
}

function goToHistoryForPendingCloseDate() {
  historyDateFilter.value = businessDayStore.activeBusinessDate;
  activeTab.value = 'history';
  loadHistory();
}

function goToHistoryForSelectedDate() {
  historyDateFilter.value = wizardHeader.value.date;
  activeTab.value = 'history';
  loadHistory();
}

function isSameDay(dateStr) {
  return (
    dateStr === businessDayStore.activeBusinessDate &&
    !businessDayStore.closedDates.includes(dateStr)
  );
}

function canEditDispatch(d) {
  if (!d) return false;
  if (settingsStore.settings.allowEditDispatch === false) return false;
  return authStore.isAdmin;
}

function canDeleteDispatch(d) {
  if (!d) return false;
  if (settingsStore.settings.allowDeleteDispatch === false) return false;
  return authStore.isAdmin;
}

async function loadMasters() {
  try {
    const [areasList, vehiclesList, driversList, calandersList, shopsList] = await Promise.all([
      mastersService.getAreas(),
      mastersService.getVehicles(),
      mastersService.getDrivers(),
      mastersService.getCalanders(),
      mastersService.getShops(),
      settingsStore.loadSettings(),
    ]);

    areas.value = areasList.filter((a) => a.active !== false);
    vehicles.value = vehiclesList.filter((v) => v.status === 'Active');
    drivers.value = driversList.filter((d) => d.status === 'Active');
    calanders.value = calandersList.filter((c) => (c.status || 'Active') === 'Active');
    allShops.value = shopsList;
  } catch (err) {
    snackbar.error('Failed to load masters data');
  }
}

async function loadAllDispatches() {
  try {
    allDispatches.value = await dispatchService.getDispatches();
  } catch (err) {
    console.warn('Failed to load active dispatches check:', err);
  }
}

async function loadHistory() {
  try {
    selectedHistoryIds.value = [];
    dispatchesHistory.value = await dispatchService.getDispatches(historyDateFilter.value);
    historyPage.value = 1;
  } catch (err) {
    snackbar.error('Failed to load dispatch history');
  }
}

function startNewDispatch() {
  if (businessDayStore.isLockedOnPreviousDay) {
    snackbar.error(businessDayStore.lockReason);
    return;
  }
  isEditingDispatch.value = false;
  editingDispatchId.value = null;
  editingDispatchStatus.value = 'Dispatched';
  activeTab.value = 'new';
  currentStep.value = 1;
  wizardHeader.value = {
    date: businessDayStore.activeBusinessDate,
    areaId: '',
    areaName: '',
    vehicleId: '',
    vehicleNumber: '',
    driverId: '',
    driverName: '',
    calanderId: '',
    calanderName: '',
  };
  dispatchRows.value = [];
  syncAvailableSelections();
}

async function goToStep2() {
  await businessDayStore.refreshBusinessDay();
  if (isDispatchEntryLocked.value) {
    snackbar.error(businessDayStore.lockReason);
    return;
  }
  const dateCheck = businessDayStore.validateOperationDate(wizardHeader.value.date);
  if (!dateCheck.valid) {
    snackbar.error(dateCheck.message);
    return;
  }

  if (
    isVehicleDisabled(wizardHeader.value.vehicleId) ||
    isDriverDisabled(wizardHeader.value.driverId) ||
    isCalanderDisabled(wizardHeader.value.calanderId) ||
    isAreaDisabled(wizardHeader.value.areaId)
  ) {
    snackbar.warning('Selected driver, calander, vehicle, or route is currently dispatched until marked back');
    syncAvailableSelections();
    return;
  }

  if (!canProceedToStep2.value) {
    snackbar.error('Please select available date, vehicle, driver, calander, and group');
    return;
  }

  // Refresh master milk price, can weight, and shop default rates before loading route rows
  await Promise.all([
    settingsStore.loadSettings(),
    mastersService.getShops().then((shopsList) => {
      allShops.value = shopsList;
    }),
  ]);

  // Load shops belonging to selected area
  const areaShops = allShops.value.filter(
    (s) => s.areaId === wizardHeader.value.areaId && s.active !== false
  );

  if (areaShops.length === 0) {
    snackbar.warning(`No active shops found for area "${wizardHeader.value.areaName}". Please add shops in Masters first.`);
    return;
  }

  // If not editing, populate blank dispatch rows from shops master
  if (!isEditingDispatch.value) {
    dispatchRows.value = areaShops.map((shop) => {
      const price = Number(shop.defaultPrice) || masterMilkPrice.value;
      const prevArrears = Number(shop.currentArrears) || 0;
      return {
        shopId: shop.id,
        shopCode: shop.code,
        shopName: shop.name,
        ownerName: shop.ownerName,
        price,
        cans: 0,
        kgs: 0,
        returnKgs: 0,
        todayMilk: 0,
        todayAmount: 0,
        previousArrears: prevArrears,
        todayCollection: 0,
        totalPayable: prevArrears,
        newArrears: prevArrears,
      };
    });
  }

  currentStep.value = 2;
}

function onPriceChange(row, val) {
  if (val !== undefined) {
    row.price = Number(val) || 0;
  }
  recalcRow(row);
}

function stepCans(row, delta) {
  const currentCans = Number(row.cans) || 0;
  const nextCans = Math.max(0, Number((currentCans + delta).toFixed(2)));
  onCansChange(row, nextCans);
}

function onCansChange(row, val) {
  const parsedCans = Math.max(0, Number(val !== undefined ? val : row.cans) || 0);
  if (val !== '' && val !== null && val !== undefined) {
    row.cans = parsedCans;
  }
  row.kgs = convertCanToKg(parsedCans, kgPerCan.value);
  onKgsChange(row);
}

function onKgsChange(row, val) {
  if (val !== undefined) {
    row.kgs = Number(val) || 0;
  }
  const sent = Math.max(0, Number(row.kgs) || 0);
  const ret = Math.max(0, Number(row.returnKgs) || 0);
  row.todayMilk = Math.max(0, Number((sent - ret).toFixed(2)));
  recalcRow(row);
}

function onCollectionChange(row, val) {
  if (val !== undefined) {
    row.todayCollection = Number(val) || 0;
  }
  recalcRow(row);
}

function recalcRow(row) {
  const result = calculateDispatchRow({
    price: row.price,
    todayMilk: row.todayMilk,
    previousArrears: row.previousArrears,
    todayCollection: row.todayCollection,
  });

  row.todayAmount = result.todayAmount;
  row.totalPayable = result.totalPayable;
  row.newArrears = result.newArrears;
}

const grandTotals = computed(() => {
  let totalCans = 0;
  let totalMilk = 0;
  let totalAmount = 0;
  let totalPreviousArrears = 0;
  let totalPayable = 0;

  for (const r of dispatchRows.value) {
    totalCans += Number(r.cans) || 0;
    totalMilk += Number(r.todayMilk) || 0;
    totalAmount += Number(r.todayAmount) || 0;
    totalPreviousArrears += Number(r.previousArrears) || 0;
    totalPayable += Number(r.totalPayable) || 0;
  }

  return {
    totalCans,
    totalMilk: Number(totalMilk.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    totalPreviousArrears: Number(totalPreviousArrears.toFixed(2)),
    totalPayable: Number(totalPayable.toFixed(2)),
    totalCollection: 0,
    totalNewArrears: Number(totalPayable.toFixed(2)),
  };
});

async function saveDispatch(markAsReturned = false) {
  if (dispatchRows.value.length === 0) {
    snackbar.error('No shops in dispatch');
    return;
  }

  await businessDayStore.refreshBusinessDay();
  if (isDispatchEntryLocked.value) {
    snackbar.error(businessDayStore.lockReason);
    return;
  }
  const dateCheck = businessDayStore.validateOperationDate(wizardHeader.value.date);
  if (!dateCheck.valid) {
    snackbar.error(dateCheck.message);
    return;
  }

  // Ensure every row's net milk, amount, and arrears are freshly synced before saving
  dispatchRows.value.forEach((r) => onKgsChange(r));

  saving.value = true;
  try {
    if (isEditingDispatch.value && editingDispatchId.value) {
      await dispatchService.updateDispatch(editingDispatchId.value, {
        header: wizardHeader.value,
        items: dispatchRows.value,
        status: markAsReturned ? 'Returned' : null,
      });
      snackbar.success(
        markAsReturned
          ? 'Dispatch updated and marked as back! Resources are now available.'
          : 'Dispatch updated and shop arrears recalculated!'
      );
    } else {
      await dispatchService.createDispatch({
        header: wizardHeader.value,
        items: dispatchRows.value,
        status: 'Dispatched',
      });
      snackbar.success('Dispatch saved! Vehicle, Driver, Calander & Route locked for this date until marked back.');
    }

    // Refresh masters, active dispatches, and business day closing state
    allShops.value = await mastersService.getShops();
    historyDateFilter.value = wizardHeader.value.date;
    await Promise.all([loadAllDispatches(), loadHistory(), businessDayStore.refreshBusinessDay()]);
    activeTab.value = 'history';
    currentStep.value = 1;
    isEditingDispatch.value = false;
    editingDispatchId.value = null;
    editingDispatchStatus.value = 'Returned';
    syncAvailableSelections();
  } catch (err) {
    snackbar.error(err.message || 'Failed to save dispatch');
  } finally {
    saving.value = false;
  }
}

async function editExistingDispatch(d) {
  if (settingsStore.settings.allowEditDispatch === false) {
    snackbar.error('Editing dispatches is disabled in Master settings.');
    return;
  }
  isEditingDispatch.value = true;
  editingDispatchId.value = d.id;
  editingDispatchStatus.value = d.status || 'Returned';

  const fullDispatch = await dispatchService.getDispatchById(d.id);
  wizardHeader.value = {
    date: fullDispatch.date,
    areaId: fullDispatch.areaId,
    areaName: fullDispatch.areaName,
    vehicleId: fullDispatch.vehicleId,
    vehicleNumber: fullDispatch.vehicleNumber,
    driverId: fullDispatch.driverId,
    driverName: fullDispatch.driverName,
    calanderId: fullDispatch.calanderId || (calanders.value[0]?.id || ''),
    calanderName: fullDispatch.calanderName || (calanders.value[0]?.name || ''),
  };

  dispatchRows.value = (fullDispatch.items || []).map((it) => {
    const kgs =
      it.kgs !== undefined && it.kgs !== null && Number(it.kgs) > 0
        ? Number(it.kgs)
        : Number(it.todayMilk) || 0;
    const returnKgs = Number(it.returnKgs) || 0;
    const row = {
      ...it,
      price: Number(it.price) || 0,
      cans: Number(it.cans) || 0,
      kgs,
      returnKgs,
      todayMilk: Math.max(0, Number((kgs - returnKgs).toFixed(2))),
      previousArrears: Number(it.previousArrears) || 0,
      todayCollection: Number(it.todayCollection) || 0,
    };
    recalcRow(row);
    return row;
  });

  activeTab.value = 'new';
  currentStep.value = 2;
}

async function openMarkBackDialog(d) {
  if (!d || d.status !== 'Dispatched') return;
  try {
    const fullDispatch = await dispatchService.getDispatchById(d.id);
    markBackDispatch.value = fullDispatch;
    markBackReturnNotes.value = fullDispatch.returnNotes || '';
    markBackRows.value = (fullDispatch.items || []).map((it) => {
      const kgs =
        it.kgs !== undefined && it.kgs !== null && Number(it.kgs) > 0
          ? Number(it.kgs)
          : Number(it.todayMilk) || 0;
      const returnKgs = Number(it.returnKgs) || 0;
      const netMilk = Math.max(0, Number((kgs - returnKgs).toFixed(2)));
      const row = {
        ...it,
        price: Number(it.price) || 0,
        cans: Number(it.cans) || 0,
        kgs,
        returnKgs,
        todayMilk: netMilk,
        previousArrears: Number(it.previousArrears) || 0,
        todayCollection: Number(it.todayCollection) || 0,
      };
      recalcMarkBackRow(row);
      return row;
    });
    markBackDialog.value = true;
  } catch (err) {
    snackbar.error('Failed to load dispatch details for return settlement');
  }
}

function onMarkBackFieldChange(row, field, val) {
  if (val !== undefined) {
    row[field] = Math.max(0, Number(val) || 0);
  }
  recalcMarkBackRow(row);
}

function recalcMarkBackRow(row) {
  const sent = Math.max(0, Number(row.kgs) || 0);
  const ret = Math.max(0, Math.min(sent, Number(row.returnKgs) || 0));
  if ((Number(row.returnKgs) || 0) > sent) {
    row.returnKgs = sent;
  }
  row.todayMilk = Math.max(0, Number((sent - ret).toFixed(2)));

  const result = calculateDispatchRow({
    price: row.price,
    todayMilk: row.todayMilk,
    previousArrears: row.previousArrears,
    todayCollection: row.todayCollection,
  });

  row.todayAmount = result.todayAmount;
  row.totalPayable = result.totalPayable;
  row.newArrears = result.newArrears;
}

function collectFullPayable(row) {
  row.todayCollection = Math.max(0, Number(row.totalPayable) || 0);
  recalcMarkBackRow(row);
}

const markBackTotals = computed(() => {
  let totalKgs = 0;
  let totalReturnMilk = 0;
  let totalMilk = 0;
  let totalAmount = 0;
  let totalPreviousArrears = 0;
  let totalCollection = 0;
  let totalNewArrears = 0;

  for (const r of markBackRows.value) {
    totalKgs += Math.max(0, Number(r.kgs) || 0);
    totalReturnMilk += Math.max(0, Number(r.returnKgs) || 0);
    totalMilk += Number(r.todayMilk) || 0;
    totalAmount += Number(r.todayAmount) || 0;
    totalPreviousArrears += Number(r.previousArrears) || 0;
    totalCollection += Number(r.todayCollection) || 0;
    totalNewArrears += Number(r.newArrears) || 0;
  }

  return {
    totalKgs: Number(totalKgs.toFixed(2)),
    totalReturnMilk: Number(totalReturnMilk.toFixed(2)),
    totalMilk: Number(totalMilk.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    totalPreviousArrears: Number(totalPreviousArrears.toFixed(2)),
    totalCollection: Number(totalCollection.toFixed(2)),
    totalNewArrears: Number(totalNewArrears.toFixed(2)),
  };
});

async function syncAfterReturnOrDelete(settledDate = null) {
  await Promise.all([loadAllDispatches(), loadHistory(), businessDayStore.refreshBusinessDay()]);
  syncAvailableSelections();

  if (
    settledDate &&
    businessDayStore.isLockedOnPreviousDay &&
    settledDate === businessDayStore.activeBusinessDate &&
    businessDayStore.pendingDispatchesCount === 0
  ) {
    closeDayTargetDate.value = settledDate;
    closeDayPromptDialog.value = true;
  }
}

async function executeClosePromptedDay() {
  if (!closeDayTargetDate.value) return;
  closingDay.value = true;
  try {
    await businessDayStore.closeDay(closeDayTargetDate.value, {
      closedBy: authStore.userName || 'Admin',
      remarks: 'Closed after marking remaining dispatch back',
    });
    closeDayPromptDialog.value = false;
    wizardHeader.value.date = businessDayStore.activeBusinessDate;
    historyDateFilter.value = businessDayStore.activeBusinessDate;
    await Promise.all([loadAllDispatches(), loadHistory()]);
    syncAvailableSelections();
    snackbar.success(
      `Previous day closed! Working day advanced to ${formatDate(businessDayStore.activeBusinessDate)}.`
    );
  } catch (err) {
    snackbar.error(err.message || 'Failed to close previous day');
  } finally {
    closingDay.value = false;
  }
}

async function submitMarkBackSettlement() {
  if (!markBackDispatch.value) return;
  markingBack.value = true;
  try {
    const settledDate = markBackDispatch.value.date;
    await dispatchService.updateDispatch(markBackDispatch.value.id, {
      header: {
        date: settledDate,
        areaId: markBackDispatch.value.areaId,
        areaName: markBackDispatch.value.areaName,
        vehicleId: markBackDispatch.value.vehicleId,
        vehicleNumber: markBackDispatch.value.vehicleNumber,
        driverId: markBackDispatch.value.driverId,
        driverName: markBackDispatch.value.driverName,
        calanderId: markBackDispatch.value.calanderId,
        calanderName: markBackDispatch.value.calanderName,
        returnNotes: markBackReturnNotes.value.trim(),
      },
      items: markBackRows.value,
      status: 'Returned',
    });

    allShops.value = await mastersService.getShops();
    markBackDialog.value = false;
    snackbar.success(
      `Return settled for ${markBackDispatch.value.areaName} (${markBackDispatch.value.vehicleNumber}). Arrears updated & resources unlocked!`
    );
    await syncAfterReturnOrDelete(settledDate);
  } catch (err) {
    snackbar.error(err.message || 'Failed to settle dispatch return');
  } finally {
    markingBack.value = false;
  }
}

function promptBulkMarkBack() {
  const targets = dispatchesHistory.value.filter(
    (d) => selectedHistoryIds.value.includes(d.id) && d.status === 'Dispatched'
  );
  if (targets.length === 0) return;
  if (targets.length === 1) {
    openMarkBackDialog(targets[0]);
    return;
  }
  bulkMarkBackConfirmDialog.value = true;
}

async function executeBulkMarkBack() {
  const targets = dispatchesHistory.value.filter(
    (d) => selectedHistoryIds.value.includes(d.id) && d.status === 'Dispatched'
  );
  if (targets.length === 0) return;
  markingBack.value = true;
  try {
    for (const d of targets) {
      await dispatchService.markDispatchReturned(d.id);
    }
    bulkMarkBackConfirmDialog.value = false;
    snackbar.success(`${targets.length} dispatch(es) marked back. Resources unlocked!`);
    selectedHistoryIds.value = [];
    const settledDate = targets[0]?.date || null;
    await syncAfterReturnOrDelete(settledDate);
  } catch (err) {
    snackbar.error('Failed to mark selected dispatches as back');
  } finally {
    markingBack.value = false;
  }
}

async function viewDispatchSummary(d) {
  const full = await dispatchService.getDispatchById(d.id);
  selectedDispatch.value = full;
  summaryDialog.value = true;
}

function printReceipt() {
  window.print();
}

function confirmDeleteDispatch(d) {
  if (!authStore.isAdmin) {
    snackbar.error('Staff cannot delete dispatches. Only administrators have permission.');
    return;
  }
  if (settingsStore.settings.allowDeleteDispatch === false) {
    snackbar.error('Deleting dispatches is disabled in Master settings.');
    return;
  }
  if (businessDayStore.closedDates.includes(d.date)) {
    snackbar.error(`${formatDate(d.date)} is closed. Reopen it in Day Closing before deleting.`);
    return;
  }
  targetDispatch.value = d;
  deleteDialog.value = true;
}

async function executeDeleteDispatch() {
  if (!targetDispatch.value) return;
  deleting.value = true;
  try {
    await dispatchService.deleteDispatch(targetDispatch.value.id, targetDispatch.value.date);
    snackbar.success('Dispatch deleted');
    deleteDialog.value = false;
    await Promise.all([loadAllDispatches(), loadHistory(), businessDayStore.refreshBusinessDay()]);
    syncAvailableSelections();
  } catch (err) {
    snackbar.error('Failed to delete dispatch');
  } finally {
    deleting.value = false;
  }
}

function confirmBulkDeleteHistory() {
  if (!authStore.isAdmin) {
    snackbar.error('Staff cannot delete dispatches. Only administrators have permission.');
    return;
  }
  if (settingsStore.settings.allowDeleteDispatch === false) {
    snackbar.error('Deleting dispatches is disabled in Master settings.');
    return;
  }
  if (selectedHistoryIds.value.length === 0) return;
  const closedMatch = dispatchesHistory.value.find(
    (item) => selectedHistoryIds.value.includes(item.id) && businessDayStore.closedDates.includes(item.date)
  );
  if (closedMatch) {
    snackbar.error(`Cannot delete dispatch on closed date ${formatDate(closedMatch.date)}. Reopen day first.`);
    return;
  }
  bulkDeleteHistoryDialog.value = true;
}

async function executeBulkDeleteHistory() {
  bulkDeletingHistory.value = true;
  try {
    const toDelete = [...selectedHistoryIds.value];
    for (const id of toDelete) {
      const d = dispatchesHistory.value.find(item => item.id === id);
      await dispatchService.deleteDispatch(id, d?.date);
    }
    snackbar.success(`${toDelete.length} dispatch(es) deleted successfully`);
    selectedHistoryIds.value = [];
    bulkDeleteHistoryDialog.value = false;
    await Promise.all([loadAllDispatches(), loadHistory(), businessDayStore.refreshBusinessDay()]);
    syncAvailableSelections();
  } catch (err) {
    snackbar.error('Failed to delete some dispatches');
  } finally {
    bulkDeletingHistory.value = false;
  }
}

function applyRouteQueryState() {
  if (route.query.tab === 'history') {
    activeTab.value = 'history';
  }
  if (typeof route.query.date === 'string' && route.query.date) {
    historyDateFilter.value = route.query.date;
    loadHistory();
  }
}

watch(() => route.query, () => {
  applyRouteQueryState();
});

watch(() => wizardHeader.value.date, () => {
  syncAvailableSelections();
});

watch(
  () => businessDayStore.activeBusinessDate,
  (newDate, oldDate) => {
    if (!newDate) return;
    if (!isEditingDispatch.value && (!wizardHeader.value.date || wizardHeader.value.date === oldDate || wizardHeader.value.date > newDate)) {
      wizardHeader.value.date = newDate;
    }
    if (!route.query.date && (historyDateFilter.value === oldDate || (businessDayStore.isLockedOnPreviousDay && historyDateFilter.value > newDate))) {
      historyDateFilter.value = newDate;
      loadHistory();
    }
  }
);

watch(() => activeTab.value, async (tab) => {
  if (tab === 'new' && currentStep.value === 1) {
    await Promise.all([loadAllDispatches(), businessDayStore.refreshBusinessDay()]);
    syncAvailableSelections();
  }
});

onMounted(async () => {
  await businessDayStore.refreshBusinessDay();
  wizardHeader.value.date = businessDayStore.activeBusinessDate;
  historyDateFilter.value =
    typeof route.query.date === 'string' && route.query.date
      ? route.query.date
      : businessDayStore.activeBusinessDate;
  if (route.query.tab === 'history') {
    activeTab.value = 'history';
  }
  await Promise.all([loadMasters(), loadAllDispatches(), loadHistory()]);
  syncAvailableSelections();
  if (route.query.editId) {
    const target = dispatchesHistory.value.find((d) => d.id === route.query.editId);
    if (target) {
      await editExistingDispatch(target);
    }
  }
});
</script>

<style scoped>
.dispatch-table th,
.dispatch-table td {
  padding: 8px 10px !important;
}

.settlement-table th,
.settlement-table td {
  padding: 8px 8px !important;
}

/* Delivery Workflow Window */
.dispatch-flex-panel {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

.delivery-window {
  border-top: 1px solid #000000 !important;
  border-bottom: 1px solid #000000 !important;
  border-left: none !important;
  border-right: none !important;
  border-radius: 0 !important;
  background: #ffffff !important;
  padding-bottom: 12px !important;
  display: flex !important;
  flex-direction: column !important;
}

.delivery-title {
  font-size: 2.1rem;
  letter-spacing: -0.5px;
  line-height: 1;
}

.delivery-columns-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: minmax(0, 1fr);
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
}

@media (max-width: 1200px) {
  .delivery-columns-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: auto;
    overflow-y: auto;
  }
}

@media (max-width: 650px) {
  .delivery-columns-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
    grid-template-rows: auto;
  }
}

.delivery-column {
  border-radius: 8px;
  background: #ffffff;
  padding: 8px;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.col-vehicles {
  border: 2px solid #e53935;
}

.col-drivers {
  border: 2px solid #2e7d32;
}

.col-calendar {
  border: 2px solid #7b1fa2;
}

.col-groups {
  border: 2px solid #455a64;
}

.column-header {
  padding-bottom: 6px;
  flex-shrink: 0;
}

.column-title {
  font-size: 1.15rem;
  font-weight: 800;
  display: block;
  margin-bottom: 4px;
}

.column-icon-box {
  width: 64px;
  height: 52px;
  border: 1.5px solid #b0bec5;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  background: #fafafa;
}

.column-list-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.delivery-item-card {
  border: 1.5px solid #cfd8dc;
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 6px;
  cursor: pointer;
  background: #ffffff;
  transition: all 0.15s ease;
  user-select: none;
}

.delivery-item-row {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
}

.delivery-item-row .item-text {
  margin-left: 0;
  margin-right: auto;
  text-align: left;
  transition: all 0.15s ease;
}

.item-selected .delivery-item-row .item-text {
  margin-left: auto;
  margin-right: 0;
  text-align: right;
}

.delivery-item-card:hover:not(.item-disabled) {
  background: #f5f5f5;
  border-color: #90a4ae;
}

.delivery-item-card.item-disabled,
.group-row.item-disabled {
  opacity: 0.62;
  background-color: #f1f5f9 !important;
  border-color: #cbd5e1 !important;
  color: #64748b !important;
  cursor: not-allowed !important;
}

.delivery-item-card.item-disabled:hover,
.group-row.item-disabled:hover {
  background-color: #f1f5f9 !important;
  border-color: #cbd5e1 !important;
}

.busy-badge {
  padding: 2px 7px !important;
  font-size: 0.65rem !important;
  letter-spacing: 0.4px !important;
}

.vehicle-card.item-selected {
  background: #ffebee !important;
  border-color: #c62828 !important;
  box-shadow: 0 0 0 1px #c62828;
}

.driver-card.item-selected {
  background: #e8f5e9 !important;
  border-color: #2e7d32 !important;
  box-shadow: 0 0 0 1px #2e7d32;
}

.calander-card.item-selected {
  background: #f3e5f5 !important;
  border-color: #7b1fa2 !important;
  box-shadow: 0 0 0 1px #7b1fa2;
}

.column-table-container {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 1200px) {
  .column-list-scroll,
  .column-table-container {
    min-height: 220px;
    max-height: 300px;
  }
}

.groups-table-header {
  background: #eceff1;
  border: 1px solid #cfd8dc;
  border-bottom: none;
  font-size: 0.82rem;
  text-transform: uppercase;
  color: #37474f;
  flex-shrink: 0;
}

.groups-scroll {
  flex: 1 1 auto;
  min-height: 0;
  border: 1px solid #cfd8dc;
  border-top: none;
  height: auto;
  overflow-y: auto;
  padding-right: 0;
}

.delivery-footer {
  margin-top: auto !important;
}

.group-row {
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  color: #263238;
  transition: all 0.15s ease;
}

.group-row-inner {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.group-row-inner .group-name {
  margin-left: 0;
  margin-right: auto;
  text-align: left;
  transition: all 0.15s ease;
}

.group-row.group-selected .group-row-inner .group-name {
  margin-left: auto;
  margin-right: 0;
  text-align: right;
}

.group-row:hover:not(.group-selected):not(.item-disabled) {
  background: #e0f7fa;
}

.group-row.group-selected {
  background-color: #0097a7 !important;
  color: #ffffff !important;
  font-weight: 700;
}

/* Step 2 Details Banner (Edge-to-edge touching page left and right) */
.dispatch-details-banner {
  background: #063f78 !important;
  color: #ffffff !important;
  border-top: 1px solid #000000 !important;
  border-bottom: 1px solid #000000 !important;
  border-left: none !important;
  border-right: none !important;
  border-radius: 0 !important;
  margin-left: -28px !important;
  margin-right: -28px !important;
  width: calc(100% + 56px) !important;
  max-width: calc(100% + 56px) !important;
  padding: 14px 28px !important;
  box-shadow: none !important;
}

@media (max-width: 960px) {
  .dispatch-details-banner {
    margin-left: -12px !important;
    margin-right: -12px !important;
    width: calc(100% + 24px) !important;
    max-width: calc(100% + 24px) !important;
    padding: 12px 14px !important;
  }
}

.details-items-row {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: space-between;
  gap: 20px;
}

.details-block {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 110px;
}

.details-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 0.5px;
}

.details-val {
  font-size: 1.05rem;
  font-weight: 800;
  color: #ffffff;
  white-space: nowrap;
}

.details-divider {
  width: 1px;
  height: 32px;
  background-color: rgba(255, 255, 255, 0.25);
  flex-shrink: 0;
}

/* Step 2 Grand Totals Metrics Grid */
.dispatch-metrics-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1100px) {
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
  border: 1px solid #000000 !important;
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
  letter-spacing: 0.5px;
  color: #607d8b;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.metric-card-value {
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.metric-card-sub {
  font-size: 0.72rem !important;
  font-weight: 600;
  margin-top: 2px;
}

.delivery-columns-locked {
  opacity: 0.52;
  filter: grayscale(25%);
  pointer-events: none;
  user-select: none;
}
</style>

