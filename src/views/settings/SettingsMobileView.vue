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
              <v-icon size="18" color="primary">mdi-domain</v-icon>
              <span class="text-caption font-weight-bold text-grey-darken-2">Farm / Business Name</span>
            </div>
            <span class="text-subtitle-2 font-weight-black text-slate-900">
              {{ settings.companyName || 'Dairy Business' }}
            </span>
          </div>

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

      <!-- 3. User Accounts (Read-Only Native Cards, No Tables) -->
      <div>
        <div class="d-flex align-center justify-space-between mb-2 px-1">
          <span class="text-subtitle-2 font-weight-black text-slate-900 text-uppercase">
            Registered Users ({{ filteredUsers.length }})
          </span>
          <span class="text-caption text-grey font-weight-medium">Web-managed</span>
        </div>

        <v-text-field
          v-model="userSearch"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search user by name or email..."
          variant="outlined"
          density="compact"
          hide-details
          class="bg-white rounded-lg mb-3"
          clearable
        />

        <div class="d-flex flex-column gap-2">
          <div
            v-for="u in filteredUsers"
            :key="u.id || u.uid"
            class="pa-3 bg-white border rounded-xl shadow-xs d-flex align-center justify-space-between"
          >
            <div class="d-flex align-center gap-3">
              <div
                class="d-flex align-center justify-center rounded-circle"
                :style="{
                  width: '36px',
                  height: '36px',
                  backgroundColor: u.role === 'admin' ? '#fef3c7' : '#e0f2fe',
                }"
              >
                <v-icon
                  size="18"
                  :color="u.role === 'admin' ? 'amber-darken-4' : 'primary'"
                >
                  {{ u.role === 'admin' ? 'mdi-shield-crown' : 'mdi-account-hard-hat' }}
                </v-icon>
              </div>

              <div>
                <div class="font-weight-black text-body-2 text-slate-800 line-height-tight">
                  {{ u.name || 'User' }}
                </div>
                <div class="text-caption text-grey-darken-1 font-weight-medium" style="font-size: 0.72rem !important;">
                  {{ u.email }}
                </div>
              </div>
            </div>

            <v-chip
              size="x-small"
              :color="u.role === 'admin' ? 'primary' : 'blue-grey'"
              variant="flat"
              class="font-weight-black text-uppercase"
            >
              {{ u.role }}
            </v-chip>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { authService } from '@/services/authService';

const settingsStore = useSettingsStore();

const loading = ref(false);
const usersList = ref([]);
const settings = ref({});
const userSearch = ref('');

const filteredUsers = computed(() => {
  if (!userSearch.value || !userSearch.value.trim()) return usersList.value;
  const q = userSearch.value.toLowerCase().trim();
  return usersList.value.filter(u =>
    (u.name || '').toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q) ||
    (u.role || '').toLowerCase().includes(q)
  );
});

async function loadData() {
  loading.value = true;
  try {
    await settingsStore.loadSettings();
    settings.value = { ...settingsStore };
    const users = await authService.getUsers();
    usersList.value = users || [];
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

