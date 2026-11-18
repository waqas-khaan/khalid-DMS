<template>
  <!-- Mobile Responsive View (Auto-switched on mobile devices / viewports) -->
  <SettingsMobileView v-if="display.smAndDown.value" />

  <!-- Desktop View -->
  <div v-else class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-header-title">System Settings & Administration</h1>
        <p class="page-header-subtitle">Configure system parameters, conversion factors, and dispatch action controls</p>
      </div>
    </div>

    <v-row>
      <!-- General Settings Card -->
      <v-col cols="12" md="8" lg="6">
        <v-card class="modern-card pa-5 mb-4" elevation="0">
          <div class="d-flex align-center justify-space-between mb-4 pb-2 border-b">
            <div>
              <h2 class="text-subtitle-1 font-weight-bold text-primary mb-0">Dairy System Parameters</h2>
              <p class="text-caption text-grey mb-0">Conversion factor, attendance rules, and dispatch controls</p>
            </div>
            <v-icon color="primary" size="24">mdi-cog</v-icon>
          </div>

          <v-form @submit.prevent="saveSettings">
            <v-text-field
              v-model.number="form.literToKgFactor"
              type="number"
              step="0.001"
              label="Milk Liter-to-Kg Conversion Factor *"
              hint="Default is 1.03 kg per liter (density of pure milk)"
              persistent-hint
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />

            <v-text-field
              v-model.number="form.allowedFreeAbsents"
              type="number"
              label="Allowed Free Absences Per Month *"
              hint="Number of absences without salary deduction (default: 2)"
              persistent-hint
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />

            <v-divider class="my-3" />
            <div class="text-subtitle-2 font-weight-bold text-grey-darken-3 mb-1">
              Dispatch Action Visibility Controls
            </div>
            <p class="text-caption text-grey mb-3">
              Enable or disable Edit and Delete options across Milk Dispatch tables and records
            </p>

            <v-switch
              v-model="form.allowEditDispatch"
              color="primary"
              label="Allow Edit Dispatch (Show edit pencil icon)"
              density="compact"
              hide-details
              class="mb-2 font-weight-medium"
            />

            <v-switch
              v-model="form.allowDeleteDispatch"
              color="error"
              label="Allow Delete Dispatch (Show delete trash icon)"
              density="compact"
              hide-details
              class="mb-4 font-weight-medium"
            />

            <v-btn
              type="submit"
              color="primary"
              variant="flat"
              class="text-capitalize font-weight-bold px-5"
              :loading="savingSettings"
            >
              Save Configuration
            </v-btn>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useSettingsStore } from '@/stores/settings';
import { useSnackbarStore } from '@/stores/snackbar';
import SettingsMobileView from './SettingsMobileView.vue';

const router = useRouter();
const display = useDisplay();
const settingsStore = useSettingsStore();
const snackbar = useSnackbarStore();

// Redirect to dashboard on mobile view (Settings is desktop-only)
onMounted(() => {
  if (display.smAndDown.value) {
    router.replace('/dashboard');
  }
});

watch(
  () => display.smAndDown.value,
  (isMobile) => {
    if (isMobile) {
      router.replace('/dashboard');
    }
  }
);

const savingSettings = ref(false);

const form = ref({
  companyName: 'Dairy Business Management System',
  literToKgFactor: 1.03,
  allowedFreeAbsents: 2,
  allowEditDispatch: true,
  allowDeleteDispatch: true,
});

async function loadData() {
  await settingsStore.loadSettings();
  form.value = {
    ...settingsStore.settings,
  };
}

async function saveSettings() {
  savingSettings.value = true;
  try {
    await settingsStore.updateSettings(form.value);
    snackbar.success('Settings updated successfully');
  } catch (err) {
    snackbar.error('Failed to save settings');
  } finally {
    savingSettings.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>
