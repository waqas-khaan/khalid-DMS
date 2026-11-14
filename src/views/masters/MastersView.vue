<template>
  <MastersMobileView v-if="display.smAndDown.value" />
  <div v-else class="page-container table-page">
    <div class="page-header">
      <div>
        <h1 class="page-header-title">Masters &amp; Fleet</h1>
        <p class="page-header-subtitle">
          Manage vehicles, employees (drivers, calanders &amp; staff), delivery areas/routes, shops, and expense categories from one screen
        </p>
      </div>
    </div>

    <!-- Single-page Tab Switcher -->
    <v-tabs
      v-model="activeTab"
      grow
      show-arrows
      class="erp-tabs mb-3 flex-shrink-0"
    >
      <v-tab value="vehicles" class="text-capitalize font-weight-bold">
        <v-icon start>mdi-car</v-icon>
        Vehicles
      </v-tab>
      <v-tab value="employees" class="text-capitalize font-weight-bold">
        <v-icon start>mdi-account-group</v-icon>
        Employees
      </v-tab>
      <v-tab value="areas" class="text-capitalize font-weight-bold">
        <v-icon start>mdi-map-marker-path</v-icon>
        Areas / Routes
      </v-tab>
      <v-tab value="shops" class="text-capitalize font-weight-bold">
        <v-icon start>mdi-store</v-icon>
        Shops &amp; Milk Price
      </v-tab>
      <v-tab value="categories" class="text-capitalize font-weight-bold">
        <v-icon start>mdi-shape-plus</v-icon>
        Expense Categories
      </v-tab>
      <v-tab value="dispatches" class="text-capitalize font-weight-bold">
        <v-icon start>mdi-truck-fast</v-icon>
        Milk Dispatches
      </v-tab>
    </v-tabs>

    <div class="masters-flex-panel">
      <VehiclesView v-if="activeTab === 'vehicles'" embedded />
      <EmployeesMasterView v-else-if="activeTab === 'employees'" embedded />
      <AreasView v-else-if="activeTab === 'areas'" embedded />
      <ShopsView v-else-if="activeTab === 'shops'" embedded />
      <ExpenseCategoriesMasterView v-else-if="activeTab === 'categories'" embedded />
      <DispatchesMasterView v-else-if="activeTab === 'dispatches'" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import MastersMobileView from './MastersMobileView.vue';
import VehiclesView from './VehiclesView.vue';
import EmployeesMasterView from '@/views/employees/EmployeesMasterView.vue';
import AreasView from './AreasView.vue';
import ShopsView from './ShopsView.vue';
import ExpenseCategoriesMasterView from './ExpenseCategoriesMasterView.vue';
import DispatchesMasterView from './DispatchesMasterView.vue';

const VALID_TABS = new Set(['vehicles', 'employees', 'areas', 'shops', 'categories', 'dispatches']);

const route = useRoute();
const router = useRouter();
const display = useDisplay();

function resolveTab(rawTab) {
  const normalized = typeof rawTab === 'string' ? rawTab.toLowerCase() : '';
  if (normalized === 'drivers' || normalized === 'calanders' || normalized === 'calenders') {
    return 'employees';
  }
  if (normalized === 'expense-categories' || normalized === 'expensecategories') {
    return 'categories';
  }
  return VALID_TABS.has(normalized) ? normalized : 'vehicles';
}

const activeTab = ref(resolveTab(route.query.tab));

watch(
  () => route.query.tab,
  (nextTab) => {
    const resolved = resolveTab(nextTab);
    if (resolved !== activeTab.value) {
      activeTab.value = resolved;
    }
  }
);

watch(activeTab, (tab) => {
  if (route.query.tab !== tab) {
    router.replace({ query: { ...route.query, tab } });
  }
});
</script>

