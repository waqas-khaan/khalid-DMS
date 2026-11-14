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
        <v-text-field
          v-model="email"
          label="Email Address"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-email-outline"
          :rules="[rules.required, rules.email]"
          class="mb-3"
          placeholder="admin@dairy.com"
          autocomplete="username"
        />

        <v-text-field
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          label="Password"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPassword = !showPassword"
          :rules="[rules.required]"
          class="mb-4"
          placeholder="••••••••"
          autocomplete="current-password"
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

      <!-- Quick Demo Login Presets -->
      <div class="mt-6 pt-4 border-t text-center">
        <div class="text-caption text-grey mb-2 font-weight-medium">Quick Demo Accounts:</div>
        <div class="d-flex justify-center gap-2">
          <v-chip
            color="primary"
            variant="tonal"
            size="small"
            class="cursor-pointer font-weight-bold"
            prepend-icon="mdi-shield-crown"
            @click="fillCredentials('admin@dairy.com', 'admin123')"
          >
            Admin Demo
          </v-chip>
          <v-chip
            color="blue-grey"
            variant="tonal"
            size="small"
            class="cursor-pointer font-weight-bold"
            prepend-icon="mdi-account-hard-hat"
            @click="fillCredentials('staff@dairy.com', 'staff123')"
          >
            Staff Demo
          </v-chip>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSnackbarStore } from '@/stores/snackbar';

const router = useRouter();
const authStore = useAuthStore();
const snackbar = useSnackbarStore();

const email = ref('admin@dairy.com');
const password = ref('admin123');
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const formValid = ref(true);

const rules = {
  required: (v) => !!v || 'This field is required',
  email: (v) => /.+@.+\..+/.test(v) || 'Must be a valid email',
};

function fillCredentials(e, p) {
  email.value = e;
  password.value = p;
  errorMessage.value = '';
}

async function handleLogin() {
  if (!email.value || !password.value) return;
  loading.value = true;
  errorMessage.value = '';

  try {
    const user = await authStore.login(email.value, password.value);
    snackbar.success(`Welcome back, ${user.name || user.email}!`);
    router.push('/dashboard');
  } catch (err) {
    errorMessage.value = err.message || 'Login failed. Please check credentials.';
  } finally {
    loading.value = false;
  }
}
</script>

