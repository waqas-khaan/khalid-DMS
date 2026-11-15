<template>
  <div class="login-page-wrapper">
    <v-card class="login-card" elevation="10">
      <div class="text-center mb-6">
        <img
          src="@/assets/dairy-logo.svg"
          alt="Dairy Business Management System"
          style="max-width: 220px; height: auto;"
          class="mb-2"
        />
        <h2 class="text-h6 font-weight-bold text-primary mt-2">Sign In to Your Account</h2>
        <p class="text-caption text-grey">Dairy Business Management System</p>
      </div>

      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-4 text-caption rounded-lg"
        closable
        @click:close="errorMessage = ''"
      >
        {{ errorMessage }}
      </v-alert>

      <v-form @submit.prevent="handleLogin" v-model="formValid">
        <!-- Username Dropdown (Staff / Admin) -->
        <v-select
          v-model="username"
          :items="userOptions"
          item-title="title"
          item-value="value"
          label="Select Username *"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-account-circle-outline"
          :rules="[rules.required]"
          class="mb-3"
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props">
              <template #prepend>
                <v-icon :color="item.raw.value === 'admin' ? 'primary' : 'blue-grey'">
                  {{ item.raw.value === 'admin' ? 'mdi-shield-crown' : 'mdi-account' }}
                </v-icon>
              </template>
              <template #subtitle>
                <span class="text-caption text-grey">
                  {{ item.raw.value === 'admin' ? 'Full access (Add, Edit, Delete)' : 'Staff access (Add data only)' }}
                </span>
              </template>
            </v-list-item>
          </template>
        </v-select>

        <!-- Password Input Field -->
        <v-text-field
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          label="Password *"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPassword = !showPassword"
          :rules="[rules.required]"
          class="mb-4"
          placeholder="Enter password"
          autocomplete="current-password"
          @keyup.enter="handleLogin"
        />

        <v-btn
          type="submit"
          color="primary"
          block
          size="large"
          class="text-capitalize rounded-lg font-weight-bold"
          :loading="loading"
          :disabled="!formValid"
        >
          Sign In
        </v-btn>
      </v-form>

      <!-- Quick User Selector Chips -->
      <div class="mt-6 pt-4 border-t text-center">
        <div class="text-caption text-grey-darken-1 mb-2 font-weight-medium">Quick Select User:</div>
        <div class="d-flex justify-center gap-2">
          <v-chip
            :color="username === 'admin' ? 'primary' : 'grey-darken-1'"
            :variant="username === 'admin' ? 'flat' : 'outlined'"
            size="small"
            class="cursor-pointer font-weight-bold"
            prepend-icon="mdi-shield-crown"
            @click="selectAccount('admin')"
          >
            Admin
          </v-chip>
          <v-chip
            :color="username === 'staff' ? 'primary' : 'grey-darken-1'"
            :variant="username === 'staff' ? 'flat' : 'outlined'"
            size="small"
            class="cursor-pointer font-weight-bold"
            prepend-icon="mdi-account"
            @click="selectAccount('staff')"
          >
            Staff
          </v-chip>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSnackbarStore } from '@/stores/snackbar';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const snackbar = useSnackbarStore();

const userOptions = [
  { title: 'admin', value: 'admin' },
  { title: 'staff', value: 'staff' },
];

const username = ref('admin');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const formValid = ref(true);

const rules = {
  required: (v) => !!v || 'This field is required',
};

function selectAccount(val) {
  username.value = val;
  errorMessage.value = '';
}

async function handleLogin() {
  if (!username.value || !password.value) {
    errorMessage.value = 'Please select a username and enter your password.';
    return;
  }
  loading.value = true;
  errorMessage.value = '';

  try {
    const user = await authStore.login(username.value, password.value);
    snackbar.success(`Signed in as ${user.name}!`);
    const redirect = route.query.redirect || '/dashboard';
    router.push(redirect);
  } catch (err) {
    errorMessage.value = err.message || 'Login failed. Please check credentials.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-card {
  border-radius: 10px !important;
  border: 1px solid #000000 !important;
}
</style>
