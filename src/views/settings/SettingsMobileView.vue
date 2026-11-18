<template>
  <div class="mobile-settings-page pb-16">
    <!-- 1. Sticky Mobile App Header (Executive Style) -->
    <header class="mobile-app-header px-4 py-3 bg-white border-b sticky-top">
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-2">
          <div class="header-icon-box">
            <v-icon color="primary" size="20">mdi-cog</v-icon>
          </div>
          <div>
            <h1 class="text-subtitle-1 font-weight-black text-slate-900 line-height-tight mb-0">
              System Settings
            </h1>
            <span class="text-caption text-grey-darken-1 font-weight-medium" style="font-size: 0.72rem !important;">
              Configuration & Administration
            </span>
          </div>
        </div>

        <v-btn
          icon
          size="small"
          variant="tonal"
          color="primary"
          :loading="loading"
          class="refresh-icon-btn"
          @click="loadData"
        >
          <v-icon size="18">mdi-refresh</v-icon>
        </v-btn>
      </div>
    </header>

    <div class="px-3 pt-3">
      <!-- 2. System Parameters Spec Card -->
      <div class="mb-4">
        <div class="d-flex align-center justify-space-between mb-2 px-1">
          <span class="text-subtitle-2 font-weight-black text-slate-900 text-uppercase">
            Dairy System Parameters
          </span>
          <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-black">
            Active Config
          </v-chip>
        </div>

        <div class="bg-white border rounded-xl shadow-xs overflow-hidden">
          <div class="pa-3-5 border-b d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-2">
              <v-icon size="18" color="info">mdi-scale</v-icon>
              <span class="text-caption font-weight-bold text-grey-darken-2">Milk Liter-to-Kg Factor</span>
            </div>
            <span class="text-subtitle-2 font-weight-black text-info">
              {{ settings.literToKgFactor || 1.03 }} <span class="text-caption font-weight-bold">Kg/L</span>
            </span>
          </div>

          <div class="pa-3-5 border-b d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-2">
              <v-icon size="18" color="amber-darken-3">mdi-calendar-remove</v-icon>
              <span class="text-caption font-weight-bold text-grey-darken-2">Monthly Allowed Absences</span>
            </div>
            <span class="text-subtitle-2 font-weight-black text-amber-darken-4">
              {{ settings.allowedFreeAbsents ?? 2 }} Days
            </span>
          </div>

          <div class="pa-3-5 border-b d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-2">
              <v-icon size="18" color="teal">mdi-cash</v-icon>
              <span class="text-caption font-weight-bold text-grey-darken-2">System Currency</span>
            </div>
            <span class="text-subtitle-2 font-weight-black text-teal">
              {{ settings.currency || 'Rs.' }}
            </span>
          </div>

          <div class="pa-3-5 d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-2">
              <v-icon size="18" color="primary">mdi-shield-lock-outline</v-icon>
              <span class="text-caption font-weight-bold text-grey-darken-2">Dispatch Edit / Delete</span>
            </div>
            <div class="d-flex align-center gap-1-5">
              <v-chip
                size="x-small"
                :color="settings.allowEditDispatch ? 'success' : 'grey'"
                variant="flat"
                class="font-weight-bold"
              >
                Edit: {{ settings.allowEditDispatch ? 'ON' : 'OFF' }}
              </v-chip>
              <v-chip
                size="x-small"
                :color="settings.allowDeleteDispatch ? 'error' : 'grey'"
                variant="flat"
                class="font-weight-bold"
              >
                Del: {{ settings.allowDeleteDispatch ? 'ON' : 'OFF' }}
              </v-chip>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSettingsStore } from '@/stores/settings';

const settingsStore = useSettingsStore();

const loading = ref(false);
const settings = ref({});

async function loadData() {
  loading.value = true;
  try {
    await settingsStore.loadSettings();
    settings.value = { ...settingsStore };
  } catch (err) {
    console.error('Failed to load settings data in mobile view:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.mobile-settings-page {
  background-color: #f8fafc;
  min-height: 100vh;
}

.sticky-top {
  position: sticky;
  top: 56px;
  z-index: 20;
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
  width: 32px !important;
  height: 32px !important;
}
</style>

