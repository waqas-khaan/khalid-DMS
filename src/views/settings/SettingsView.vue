<template>
  <!-- Mobile Responsive View (Auto-switched on mobile devices / viewports) -->
  <SettingsMobileView v-if="display.smAndDown.value" />

  <!-- Desktop View (Preserved 100% intact, no changes) -->
  <div v-else class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-header-title">System Settings & Administration</h1>
        <p class="page-header-subtitle">Configure business parameters, conversion factors, and user accounts</p>
      </div>
    </div>

    <v-row>
      <!-- General Settings Card -->
      <v-col cols="12" md="6">
        <v-card class="modern-card pa-5 mb-4" elevation="0">
          <div class="d-flex align-center justify-space-between mb-4 pb-2 border-b">
            <div>
              <h2 class="text-subtitle-1 font-weight-bold text-primary mb-0">Dairy System Parameters</h2>
              <p class="text-caption text-grey mb-0">Business name, conversion factor, and attendance rules</p>
            </div>
            <v-icon color="primary" size="24">mdi-cog</v-icon>
          </div>

          <v-form @submit.prevent="saveSettings">
            <v-text-field
              v-model="form.companyName"
              label="Business / Farm Name *"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />

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

      <!-- User Management Card -->
      <v-col cols="12" md="6">
        <v-card class="modern-card pa-5" elevation="0">
          <div class="d-flex align-center justify-space-between mb-4 pb-2 border-b">
            <div>
              <h2 class="text-subtitle-1 font-weight-bold text-primary mb-0">User Accounts & Roles</h2>
              <p class="text-caption text-grey mb-0">Manage admin and staff accounts stored in users collection</p>
            </div>

            <v-btn
              color="primary"
              size="small"
              variant="flat"
              prepend-icon="mdi-account-plus"
              class="text-capitalize font-weight-bold px-4"
              @click="userDialog = true"
            >
              Add User
            </v-btn>
          </div>

          <v-table density="compact">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in usersList" :key="u.id || u.uid">
                <td class="font-weight-bold">
                  <v-icon size="16" class="me-1" :color="u.role === 'admin' ? 'primary' : 'blue-grey'">
                    {{ u.role === 'admin' ? 'mdi-shield-crown' : 'mdi-account-hard-hat' }}
                  </v-icon>
                  {{ u.name || 'User' }}
                </td>
                <td class="text-caption text-grey-darken-2">{{ u.email }}</td>
                <td>
                  <v-chip
                    size="x-small"
                    :color="u.role === 'admin' ? 'primary' : 'blue-grey'"
                    class="font-weight-bold uppercase"
                  >
                    {{ u.role }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create User Dialog -->
    <v-dialog v-model="userDialog" max-width="460">
      <v-card class="rounded-xl pa-3">
        <v-card-title class="font-weight-bold pt-3 px-4">
          Create New User Account
        </v-card-title>
        <v-card-text class="px-4 py-2">
          <v-form ref="userFormRef" v-model="userFormValid">
            <v-text-field
              v-model="newUser.name"
              label="Full Name *"
              placeholder="e.g. Tariq Manager"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-text-field
              v-model="newUser.email"
              label="Email Address *"
              placeholder="operator@dairy.com"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-text-field
              v-model="newUser.password"
              type="password"
              label="Password *"
              placeholder="••••••••"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-select
              v-model="newUser.role"
              :items="['admin', 'staff']"
              label="Role *"
              variant="outlined"
              density="comfortable"
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="px-4 pb-3 justify-end">
          <v-btn variant="text" class="text-capitalize" @click="userDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="text-capitalize rounded-lg px-4"
            :loading="creatingUser"
            @click="handleCreateUser"
          >
            Create User
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useDisplay } from 'vuetify';
import { useSettingsStore } from '@/stores/settings';
import { useSnackbarStore } from '@/stores/snackbar';
import { authService } from '@/services/authService';
import SettingsMobileView from './SettingsMobileView.vue';

const display = useDisplay();
const settingsStore = useSettingsStore();
const snackbar = useSnackbarStore();

const savingSettings = ref(false);
const usersList = ref([]);
const userDialog = ref(false);
const userFormValid = ref(true);
const creatingUser = ref(false);

const form = ref({
  companyName: 'Dairy Business Management System',
  literToKgFactor: 1.03,
  allowedFreeAbsents: 2,
  allowEditDispatch: true,
  allowDeleteDispatch: true,
});

const newUser = ref({
  name: '',
  email: '',
  password: '',
  role: 'staff',
});

async function loadData() {
  await settingsStore.loadSettings();
  form.value = {
    ...settingsStore.settings,
  };
  try {
    usersList.value = await authService.getAllUsers();
  } catch (err) {
    console.warn('Users fetch error:', err);
  }
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

async function handleCreateUser() {
  if (!newUser.value.email || !newUser.value.password || !newUser.value.name) {
    snackbar.error('Please fill required user details');
    return;
  }
  creatingUser.value = true;
  try {
    await authService.createUser(newUser.value);
    snackbar.success(`User ${newUser.value.name} created!`);
    userDialog.value = false;
    newUser.value = { name: '', email: '', password: '', role: 'staff' };
    usersList.value = await authService.getAllUsers();
  } catch (err) {
    snackbar.error(err.message || 'Failed to create user');
  } finally {
    creatingUser.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

