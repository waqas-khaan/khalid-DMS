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

    <div class="header-right-actions d-none d-md-flex align-center">
      <!-- Unified User Profile Pill & Dropdown (Desktop only) -->
      <v-menu v-if="isLoggedIn" location="bottom end" :offset="8">
        <template v-slot:activator="{ props }">
          <button
            type="button"
            v-bind="props"
            class="user-profile-trigger"
            aria-label="Open profile menu"
          >
            <span class="user-avatar-circle">
              <v-icon size="18" class="user-avatar-icon">
                {{ authStore.isAdmin ? 'mdi-shield-crown' : 'mdi-account' }}
              </v-icon>
            </span>
            <span class="user-info">
              <span class="user-name">{{ authStore.userName }}</span>
              <span class="user-role-text">{{ authStore.userRoleText }}</span>
            </span>
            <v-icon size="18" class="user-chevron">mdi-chevron-down</v-icon>
          </button>
        </template>
        <div class="profile-menu-card">
          <div class="profile-menu-user">
            <div class="profile-menu-name">{{ authStore.userName }}</div>
            <div class="profile-menu-role">{{ authStore.userRoleText }}</div>
          </div>
          <v-btn
            block
            size="small"
            variant="flat"
            color="#063F78"
            class="text-capitalize text-white font-weight-bold rounded-lg"
            prepend-icon="mdi-logout"
            @click="handleSignOff"
          >
            Sign Out
          </v-btn>
        </div>
      </v-menu>
    </div>
  </v-app-bar>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useAuthStore } from '@/stores/auth';
import CurrentTimeDate from './CurrentTimeDate.vue';

defineProps({
  isLoggedIn: { type: Boolean, default: false },
});

defineEmits(['toggle-drawer']);

const route = useRoute();
const router = useRouter();
const display = useDisplay();
const authStore = useAuthStore();

const currentPageTitle = computed(() => {
  return route.meta?.title || route.name || '';
});

function handleSignOff() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped src="@/assets/css/navbar.css"></style>

