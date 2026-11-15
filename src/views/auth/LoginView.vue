<template>
  <div class="login-page-wrapper">
    <v-card class="login-card" elevation="0">
      <!-- Go To Home Link -->
      <div class="d-flex align-center mb-3">
        <button
          type="button"
          class="go-home-link d-inline-flex align-center"
          @click="goToHome"
        >
          <v-icon size="18" class="me-1">mdi-arrow-left</v-icon>
          <span>Go To Home</span>
        </button>
      </div>

      <!-- Falcon Softwares Logo -->
      <div class="text-center mb-4">
        <img
          src="@/assets/falcon-softwares-logo.png"
          alt="Falcon Softwares"
          class="login-logo"
        />
      </div>

      <!-- Header Title & Subtitle -->
      <div class="text-center mb-6">
        <h1 class="login-title mb-1">Sign in</h1>
        <p class="login-subtitle">Welcome back! Please enter your details.</p>
      </div>

      <!-- Error Alert -->
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
        <!-- Username Field -->
        <div class="field-group mb-4">
          <label class="field-label mb-1 d-flex align-center">
            <v-icon size="16" class="me-1 text-grey-darken-2">mdi-account-outline</v-icon>
            <span>Username</span>
          </label>
          <v-select
            v-model="username"
            :items="userOptions"
            item-title="title"
            item-value="value"
            placeholder="Select Username"
            variant="outlined"
            density="comfortable"
            :rules="[rules.required]"
            hide-details="auto"
            class="custom-field"
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
                    {{ item.raw.value === 'admin' ? 'Admin (Add, Edit, Delete)' : 'Staff (Add data only)' }}
                  </span>
                </template>
              </v-list-item>
            </template>
          </v-select>
        </div>

        <!-- Password Field -->
        <div class="field-group mb-6">
          <label class="field-label mb-1 d-flex align-center">
            <v-icon size="16" class="me-1 text-grey-darken-2">mdi-lock-outline</v-icon>
            <span>Password</span>
          </label>
          <v-text-field
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Enter Password"
            variant="outlined"
            density="comfortable"
            :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
            @click:append-inner="showPassword = !showPassword"
            :rules="[rules.required]"
            hide-details="auto"
            class="custom-field"
            autocomplete="current-password"
            @keyup.enter="handleLogin"
          />
        </div>

        <!-- Sign In Button -->
        <v-btn
          type="submit"
          block
          height="48"
          class="sign-in-btn text-capitalize font-weight-bold"
          :class="{ 'btn-filled': username && password && formValid }"
          :loading="loading"
          :disabled="!username || !password || !formValid"
          elevation="0"
        >
          Sign In
        </v-btn>
      </v-form>

      <!-- Quick User Selector Chips -->
      <div class="mt-6 pt-4 border-t text-center">
        <div class="text-caption text-grey-darken-1 mb-2 font-weight-medium">Quick Select User:</div>
        <div class="d-flex justify-center gap-2">
          <v-chip
            :color="username === 'admin' ? 'primary' : 'grey-lighten-1'"
            :variant="username === 'admin' ? 'flat' : 'outlined'"
            size="small"
            class="cursor-pointer font-weight-bold"
            prepend-icon="mdi-shield-crown"
            @click="selectAccount('admin')"
          >
            Admin
          </v-chip>
          <v-chip
            :color="username === 'staff' ? 'primary' : 'grey-lighten-1'"
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

function goToHome() {
  if (authStore.isAuthenticated) {
    router.push('/dashboard');
  } else {
    router.push('/');
  }
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
.go-home-link {
  background: none;
  border: none;
  color: #475569;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.15s ease, transform 0.15s ease;
}

.go-home-link:hover {
  color: #0f172a;
  transform: translateX(-2px);
}

.login-logo {
  max-width: 220px;
  height: auto;
  object-fit: contain;
  display: inline-block;
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
}

.login-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
}

.field-group {
  text-align: left;
}

.field-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
}

:deep(.custom-field .v-field) {
  border-radius: 8px !important;
  background-color: #ffffff !important;
  font-size: 0.92rem !important;
}

:deep(.custom-field .v-field__outline) {
  --v-field-border-opacity: 0.25 !important;
  color: #64748b !important;
}

:deep(.custom-field.v-field--focused .v-field__outline) {
  --v-field-border-opacity: 1 !important;
  color: #063f78 !important;
}

.sign-in-btn {
  border-radius: 8px !important;
  font-size: 0.95rem !important;
  letter-spacing: 0.01em;
  background-color: #f1f5f9 !important;
  color: #94a3b8 !important;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.sign-in-btn.btn-filled {
  background-color: #063f78 !important;
  color: #ffffff !important;
  border-color: #063f78 !important;
  box-shadow: 0 4px 12px rgba(6, 63, 120, 0.25) !important;
}

.sign-in-btn.btn-filled:hover {
  background-color: #053361 !important;
  box-shadow: 0 6px 16px rgba(6, 63, 120, 0.35) !important;
}
</style>
