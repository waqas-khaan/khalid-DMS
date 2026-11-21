<template>
  <v-app-bar
    app
    color="#063F78"
    flat
    class="demo-navbar"
    :height="display.smAndDown.value ? 56 : 64"
  >
    <v-app-bar-nav-icon
      v-if="isLoggedIn"
      @click="$emit('toggle-drawer')"
      aria-label="Toggle navigation menu"
    />

    <div
      class="d-flex align-center navbar-brand"
      style="cursor: pointer;"
      title="Go to Operations Dashboard"
      @click="router.push('/dashboard')"
    >
      <span v-if="currentPageTitle" class="navbar-page-title">
        {{ currentPageTitle }}
      </span>
    </div>

    <v-spacer></v-spacer>

    <div class="header-center-time">
      <CurrentTimeDate />
    </div>

    <v-spacer></v-spacer>

    <!-- Unified Administrator Profile Pill & Dropdown (Mobile & Desktop) -->
    <div class="header-right-actions d-flex align-center">
      <!-- Universal Desktop Install Button (desktop only, hidden on mobile view) -->
      <div v-if="!pwaStore.isInstalled" class="install-pwa-header-action d-none d-md-block">
        <v-btn
          size="small"
          variant="tonal"
          color="white"
          class="text-capitalize font-weight-bold install-desktop-btn rounded-lg"
          prepend-icon="mdi-laptop"
          @click="pwaStore.promptInstall"
        >
          Install Falcon DMS
        </v-btn>
      </div>

      <!-- Desktop View: Profile Pill with Menu -->
      <v-menu v-if="isLoggedIn && !display.smAndDown.value" location="bottom end" :offset="8">
        <template v-slot:activator="{ props }">
          <button
            type="button"
            v-bind="props"
            class="user-profile-trigger"
            aria-label="Open profile menu"
          >
            <span class="user-avatar-circle">
              <v-icon size="18" class="user-avatar-icon">
                {{ authStore.isAdmin ? 'mdi-shield-crown' : 'mdi-account-check' }}
              </v-icon>
            </span>
            <span class="user-name">{{ authStore.userName }}</span>
            <span class="mobile-power-icon-badge">
              <v-icon size="15" class="user-power-icon">mdi-power</v-icon>
            </span>
          </button>
        </template>
        <div class="profile-menu-card">
          <div class="profile-menu-user">
            <div class="profile-menu-name">{{ authStore.userName }}</div>
          </div>
          <v-btn
            block
            size="small"
            variant="flat"
            color="#063F78"
            class="text-capitalize text-white font-weight-bold rounded-lg"
            prepend-icon="mdi-power"
            @click="handleSignOff"
          >
            Sign Out
          </v-btn>
        </div>
      </v-menu>

      <!-- Mobile View: Profile Pill directly displaying Power 0/I and triggering confirmation dialog -->
      <button
        v-if="isLoggedIn && display.smAndDown.value"
        type="button"
        class="user-profile-trigger mobile-user-profile-trigger"
        aria-label="Sign Out"
        title="Sign Out"
        @click="showLogoutDialog = true"
      >
        <span class="user-avatar-circle">
          <v-icon size="18" class="user-avatar-icon">
            {{ authStore.isAdmin ? 'mdi-shield-crown' : 'mdi-account-check' }}
          </v-icon>
        </span>
        <span class="user-name">{{ authStore.userName }}</span>
        <span class="mobile-power-icon-badge">
          <v-icon size="15" class="user-power-icon">mdi-power</v-icon>
        </span>
      </button>
    </div>
  </v-app-bar>

  <!-- Mobile Sign Out Confirmation Dialog -->
  <v-dialog v-model="showLogoutDialog" max-width="320">
    <v-card class="rounded-xl pa-4 text-center bg-white">
      <div class="d-flex justify-center mb-3">
        <v-avatar color="red-lighten-5" size="52">
          <v-icon size="28" color="error">mdi-power</v-icon>
        </v-avatar>
      </div>
      <div class="text-subtitle-1 font-weight-bold text-slate-800 mb-1">Sign Out?</div>
      <div class="text-caption text-grey-darken-1 mb-4">
        Are you sure you want to end your session and sign out?
      </div>
      <div class="d-flex gap-2">
        <v-btn
          variant="outlined"
          color="grey-darken-1"
          class="flex-grow-1 text-capitalize rounded-lg font-weight-bold"
          @click="showLogoutDialog = false"
        >
          Cancel
        </v-btn>
        <v-btn
          variant="flat"
          color="error"
          class="flex-grow-1 text-capitalize rounded-lg font-weight-bold"
          prepend-icon="mdi-power"
          @click="confirmLogout"
        >
          Sign Out
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useAuthStore } from '@/stores/auth';
import { usePwaStore } from '@/stores/pwa';
import CurrentTimeDate from './CurrentTimeDate.vue';

defineProps({
  isLoggedIn: { type: Boolean, default: false },
});

defineEmits(['toggle-drawer']);

const route = useRoute();
const router = useRouter();
const display = useDisplay();
const authStore = useAuthStore();
const pwaStore = usePwaStore();

const showLogoutDialog = ref(false);

const currentPageTitle = computed(() => {
  return route.meta?.title || route.name || '';
});

function confirmLogout() {
  showLogoutDialog.value = false;
  handleSignOff();
}

function handleSignOff() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped src="@/assets/css/navbar.css"></style>

