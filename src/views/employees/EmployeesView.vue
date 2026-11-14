<template>
  <EmployeesMobileView v-if="display.smAndDown.value" />
  <div v-else class="page-container table-page">
    <div class="page-header">
      <div>
        <h1 class="page-header-title">Employees &amp; Payroll</h1>
        <p class="page-header-subtitle">
          Manage staff directory, daily attendance, salary advances, and monthly payroll from one screen
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
      <v-tab value="directory" class="text-capitalize font-weight-bold">
        <v-icon start>mdi-badge-account</v-icon>
        Staff Directory
      </v-tab>
      <v-tab value="attendance" class="text-capitalize font-weight-bold">
        <v-icon start>mdi-calendar-check</v-icon>
        Daily Attendance
      </v-tab>
      <v-tab value="advances" class="text-capitalize font-weight-bold">
        <v-icon start>mdi-currency-pkr</v-icon>
        Advances
      </v-tab>
      <v-tab value="salaries" class="text-capitalize font-weight-bold">
        <v-icon start>mdi-currency-pkr</v-icon>
        Monthly Salaries
      </v-tab>
      <v-tab value="record" class="text-capitalize font-weight-bold">
        <v-icon start>mdi-file-account-outline</v-icon>
        Monthly Record
      </v-tab>
    </v-tabs>

    <div class="masters-flex-panel">
      <EmployeesMasterView v-if="activeTab === 'directory'" embedded readonly />
      <DailyAttendanceView v-else-if="activeTab === 'attendance'" embedded />
      <AdvancesView v-else-if="activeTab === 'advances'" embedded />
      <MonthlySalariesView v-else-if="activeTab === 'salaries'" embedded />
      <EmployeeMonthlyRecordView v-else-if="activeTab === 'record'" embedded />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import EmployeesMobileView from './EmployeesMobileView.vue';
import EmployeesMasterView from './EmployeesMasterView.vue';
import DailyAttendanceView from './DailyAttendanceView.vue';
import AdvancesView from './AdvancesView.vue';
import MonthlySalariesView from './MonthlySalariesView.vue';
import EmployeeMonthlyRecordView from './EmployeeMonthlyRecordView.vue';

const VALID_TABS = new Set(['directory', 'attendance', 'advances', 'salaries', 'record']);

const route = useRoute();
const router = useRouter();
const display = useDisplay();

function resolveTab(rawTab) {
  const normalized = typeof rawTab === 'string' ? rawTab.toLowerCase() : '';
  return VALID_TABS.has(normalized) ? normalized : 'directory';
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

