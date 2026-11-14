<template>
  <v-navigation-drawer
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    app
    class="demo-sidebar"
    width="280"
  >
    <div class="sidebar-content-wrapper">
      <!-- Mobile user profile header inside drawer -->
      <div v-if="display.smAndDown.value && authStore.user" class="sidebar-mobile-user px-4 py-3 d-flex align-center gap-3 border-b bg-white">
        <div style="width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #ffd54f 0%, #ffb300 100%); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
          <v-icon size="20" color="#063f78">
            {{ authStore.isAdmin ? 'mdi-shield-crown' : 'mdi-account' }}
          </v-icon>
        </div>
        <div class="d-flex flex-column" style="min-width: 0;">
          <span class="font-weight-black text-body-2 text-truncate" style="color: #063f78; line-height: 1.2;">
            {{ authStore.userName }}
          </span>
          <span class="font-weight-black text-caption text-uppercase" style="color: #64748b; font-size: 0.65rem !important; letter-spacing: 0.5px;">
            {{ authStore.userRoleText }}
          </span>
        </div>
      </div>

      <v-list v-model:opened="openedGroups" nav density="compact" class="sidebar-menu">
        <!-- Dashboard -->
        <v-list-item
          to="/dashboard"
          link
          class="sidebar-menu-item"
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
        />

        <!-- Operations Section Header -->
        <div class="sidebar-group-header">Operations</div>

        <!-- Day Opening Collapsible Group -->
        <v-list-group value="dayOpening" class="sidebar-group-accordion">
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              class="sidebar-menu-item sidebar-accordion-activator"
              prepend-icon="mdi-weather-sunset-up"
              title="Day Opening"
            />
          </template>

          <!-- Milk Arrival -->
          <v-list-item
            to="/milk-arrival"
            link
            class="sidebar-menu-item sidebar-sub-item"
            prepend-icon="mdi-truck-delivery"
            title="Milk Arrival"
          />

          <!-- Shop Milk Dispatch -->
          <v-list-item
            to="/milk-dispatch"
            link
            class="sidebar-menu-item sidebar-sub-item"
            prepend-icon="mdi-bottle-tonic-plus"
            title="Milk Dispatch"
          />

          <!-- Expenses -->
          <v-list-item
            to="/expenses"
            link
            class="sidebar-menu-item sidebar-sub-item"
            prepend-icon="mdi-currency-pkr"
            title="Expenses"
          />
        </v-list-group>

        <!-- Day Closing -->
        <v-list-item
          to="/day-closing"
          link
          class="sidebar-menu-item"
          prepend-icon="mdi-lock-check"
          title="Day Closing"
        >
          <template #append v-if="businessDayStore.isLockedOnPreviousDay">
            <span class="erp-tag erp-tag-orange sidebar-alert-badge ms-3">
              {{ businessDayStore.unclosedPreviousDates.length }} OPEN
            </span>
          </template>
        </v-list-item>


        <!-- Employees Section Header -->
        <div class="sidebar-group-header">Staff & Payroll</div>

        <v-list-item
          to="/employees"
          link
          class="sidebar-menu-item"
          prepend-icon="mdi-account-group"
          title="Employees"
        />

        <!-- Masters Section Header -->
        <div class="sidebar-group-header">Masters & Fleet</div>

        <v-list-item
          to="/masters"
          link
          class="sidebar-menu-item"
          prepend-icon="mdi-database-cog"
          title="Masters"
        />

        <!-- Settings (Admin Only) -->
        <div v-if="authStore.isAdmin" class="sidebar-group-header">System</div>

        <v-list-item
          v-if="authStore.isAdmin"
          to="/settings"
          link
          class="sidebar-menu-item"
          prepend-icon="mdi-cog"
          title="Settings & Users"
        />

        <v-divider class="sidebar-sign-out-divider" />

        <!-- Sign Out -->
        <v-list-item
          @click="signOut"
          class="sidebar-menu-item sidebar-sign-out"
          prepend-icon="mdi-logout"
          title="Sign Out"
        />
      </v-list>

      <!-- Sidebar bottom logo container -->
      <div class="sidebar-logo-container">
        <img
          src="@/assets/falcon-softwares-logo.png"
          alt="Falcon Softwares"
          class="sidebar-logo"
        />
        <p class="sidebar-logo-tagline">Systems by Falcon Softwares</p>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useAuthStore } from '@/stores/auth';
import { useBusinessDayStore } from '@/stores/businessDay';

defineProps({
  modelValue: { type: Boolean, default: true },
});

defineEmits(['update:modelValue']);

const route = useRoute();
const router = useRouter();
const display = useDisplay();
const authStore = useAuthStore();
const businessDayStore = useBusinessDayStore();

const DAY_OPENING_PATHS = ['/milk-arrival', '/milk-dispatch', '/expenses'];
const openedGroups = ref([]);

watch(
  () => route.path,
  (path) => {
    if (DAY_OPENING_PATHS.some((p) => path.startsWith(p)) && !openedGroups.value.includes('dayOpening')) {
      openedGroups.value.push('dayOpening');
    }
  },
  { immediate: true }
);

function signOut() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped src="@/assets/css/main-toolbar.css"></style>

