<template>
  <div class="login-page-wrapper">
    <div class="login-card-container">
      <!-- Go To Home Link -->
      <div class="go-home-row mb-4">
        <button type="button" class="go-home-btn" @click="goToHome">
          <v-icon size="16" class="me-1">mdi-arrow-left</v-icon>
          <span>Go To Home</span>
        </button>
      </div>

      <!-- Falcon Softwares Logo -->
      <div class="logo-row text-center mb-5">
        <img
          src="@/assets/falcon-softwares-logo.png"
          alt="Falcon Softwares"
          class="falcon-logo"
        />
      </div>

      <!-- Title & Subtitle -->
      <div class="header-row text-center mb-6">
        <h1 class="card-title">Sign in</h1>
        <p class="card-subtitle">Welcome back! Please enter your details.</p>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="error-banner mb-4">
        <v-icon size="18" color="#ef4444" class="me-2">mdi-alert-circle-outline</v-icon>
        <span class="error-text">{{ errorMessage }}</span>
        <button type="button" class="close-error" @click="errorMessage = ''">×</button>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="login-form">
        <!-- Field 1: Username / Role Selection -->
        <div class="form-group mb-5">
          <label class="field-label mb-2">
            <v-icon size="16" color="#4b5563" class="me-1">mdi-account-outline</v-icon>
            <span>Username</span>
          </label>
          <div class="input-relative">
            <select
              v-model="username"
              class="custom-field select-field"
              required
            >
              <option value="" disabled>Select Username</option>
              <option value="admin">admin</option>
              <option value="staff">staff</option>
            </select>
            <v-icon size="20" color="#6b7280" class="select-chevron">mdi-chevron-down</v-icon>
          </div>
        </div>

        <!-- Field 2: Password -->
        <div class="form-group mb-6">
          <label class="field-label mb-2">
            <v-icon size="16" color="#4b5563" class="me-1">mdi-lock-outline</v-icon>
            <span>Password</span>
          </label>
          <div class="input-relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="custom-field password-field"
              placeholder="Enter Password"
              autocomplete="current-password"
              required
              @keyup.enter="handleLogin"
            />
            <button
              type="button"
              class="toggle-eye-btn"
              @click="showPassword = !showPassword"
              tabindex="-1"
              aria-label="Toggle password visibility"
            >
              <v-icon size="20" color="#6b7280">
                {{ showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}
              </v-icon>
            </button>
          </div>
        </div>

        <!-- Sign In Button -->
        <button
          type="submit"
          class="submit-button"
          :class="{ 'btn-active': username && password.length > 0 }"
          :disabled="!username || !password || loading"
        >
          <span v-if="!loading">Sign In</span>
          <v-progress-circular v-else indeterminate size="20" width="2" color="white" />
        </button>
      </form>
    </div>
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

const username = ref('admin');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref('');

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
.login-page-wrapper {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2f6 0%, #e2e8f0 50%, #f8fafc 100%);
  padding: 40px 16px;
  box-sizing: border-box;
}

.login-card-container {
  width: 100%;
  max-width: 560px;
  min-height: 580px;
  background-color: #ffffff;
  border-radius: 10px;
  border: 1px solid #000000;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
  padding: 44px 50px 48px 50px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

@media (max-width: 600px) {
  .login-card-container {
    max-width: 100%;
    min-height: auto;
    padding: 30px 22px 36px 22px;
    border-radius: 8px;
  }
}

.go-home-row {
  display: flex;
  align-items: center;
}

.go-home-btn {
  background: transparent;
  border: none;
  color: #4b5563;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s ease, transform 0.15s ease;
}

.go-home-btn:hover {
  color: #111827;
  transform: translateX(-2px);
}

.logo-row {
  display: flex;
  justify-content: center;
}

.falcon-logo {
  max-width: 270px;
  height: auto;
  object-fit: contain;
  display: block;
}

@media (max-width: 480px) {
  .falcon-logo {
    max-width: 210px;
  }
}

.card-title {
  font-size: 30px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.card-subtitle {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
}

.form-group {
  text-align: left;
}

.field-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.input-relative {
  position: relative;
  width: 100%;
}

.custom-field {
  width: 100%;
  height: 52px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background-color: #ffffff;
  font-size: 15px;
  color: #111827;
  padding: 12px 16px;
  box-sizing: border-box;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.custom-field:focus {
  border-color: #063f78;
  outline: none;
  box-shadow: 0 0 0 3px rgba(6, 63, 120, 0.15);
}

.custom-field::placeholder {
  color: #9ca3af;
}

.select-field {
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  padding-right: 42px;
}

.select-chevron {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.password-field {
  padding-right: 48px;
}

.toggle-eye-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: opacity 0.15s ease;
}

.toggle-eye-btn:hover {
  opacity: 0.8;
}

.submit-button {
  width: 100%;
  height: 52px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background-color: #f3f4f6;
  color: #9ca3af;
  font-size: 15px;
  font-weight: 600;
  cursor: not-allowed;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-top: 10px;
}

.submit-button.btn-active {
  background-color: #063f78;
  color: #ffffff;
  border-color: #063f78;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(6, 63, 120, 0.28);
}

.submit-button.btn-active:hover {
  background-color: #053361;
  box-shadow: 0 6px 18px rgba(6, 63, 120, 0.38);
}

.error-banner {
  display: flex;
  align-items: center;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 12px 14px;
  color: #b91c1c;
  font-size: 13px;
}

.close-error {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 18px;
  cursor: pointer;
  margin-left: auto;
  padding: 0 4px;
  line-height: 1;
}
</style>
