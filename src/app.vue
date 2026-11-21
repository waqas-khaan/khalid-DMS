<template>
  <v-app>
    <DefaultHeader
      v-if="showNavigation"
      :is-logged-in="authStore.isAuthenticated"
      @toggle-drawer="drawer = !drawer"
    />
    <MainToolbar
      v-if="showNavigation"
      v-model="drawer"
    />
    <v-main class="app-main-layout">
      <div
        v-if="showNavigation && businessDayStore.isLockedOnPreviousDay"
        class="closing-lock-bar d-none d-md-block px-4 py-2 flex-shrink-0"
      >
        <div class="d-flex align-center justify-space-between w-100 flex-wrap gap-2">
          <div class="d-flex align-center gap-2 text-caption font-weight-bold">
            <v-icon size="18" color="amber-darken-4">mdi-lock-alert</v-icon>
            <span>
              Working Day Locked at {{ formatDate(businessDayStore.activeBusinessDate) }} —
              {{ businessDayStore.lockReason }}
            </span>
          </div>
          <div class="d-flex align-center gap-2">
            <v-btn
              v-if="businessDayStore.pendingDispatchesCount > 0"
              size="x-small"
              color="warning"
              variant="flat"
              class="text-capitalize font-weight-bold"
              prepend-icon="mdi-truck-check"
              @click="goToPendingDispatches"
            >
              Mark Back ({{ businessDayStore.pendingDispatchesCount }})
            </v-btn>
            <v-btn
              size="x-small"
              color="primary"
              variant="flat"
              class="text-capitalize font-weight-bold"
              prepend-icon="mdi-lock-check"
              @click="router.push('/day-closing')"
            >
              Day Closing
            </v-btn>
          </div>
        </div>
      </div>
      <div class="app-view-slot">
        <router-view />
      </div>
    </v-main>
    <SnackbarNotification />
    <PwaInstallDialog />
  </v-app>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import { useBusinessDayStore } from '@/stores/businessDay';
import { formatDate } from '@/utils/formatters';
import DefaultHeader from '@/components/appbar/DefaultHeader.vue';
import MainToolbar from '@/components/side-view/MainToolbar.vue';
import SnackbarNotification from '@/components/common/SnackbarNotification.vue';
import PwaInstallDialog from '@/components/pwa/PwaInstallDialog.vue';

const route = useRoute();
const router = useRouter();
const display = useDisplay();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const businessDayStore = useBusinessDayStore();

const drawer = ref(!display.mobile.value);

// Auto-close drawer on mobile when route changes
watch(() => route.path, () => {
  if (display.mobile.value) {
    drawer.value = false;
  }
});

const showNavigation = computed(() => {
  return authStore.isAuthenticated && route.meta?.standalone !== true && route.path !== '/login';
});

function goToPendingDispatches() {
  router.push({
    path: '/milk-dispatch',
    query: { tab: 'history', date: businessDayStore.activeBusinessDate },
  });
}

watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      settingsStore.loadSettings();
      businessDayStore.refreshBusinessDay();
    }
  }
);

onMounted(() => {
  authStore.initAuth();
  settingsStore.loadSettings();
  if (authStore.isAuthenticated) {
    businessDayStore.refreshBusinessDay();
  }
});
</script>

<style>
/* Global CSS variables & layout */
@import "@/assets/css/main.css";

.closing-lock-bar {
  background-color: #fef3c7 !important;
  color: #78350f !important;
  border-bottom: 1px solid #d97706 !important;
  z-index: 999 !important;
}
</style>
