<template>
  <v-container fluid class="login-container fill-height pa-0">
    <div class="background-backdrop"></div>

    <!-- Background Tech Design Elements -->
    <div class="bg-design-layer" aria-hidden="true">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
      <div class="bg-grid-glow"></div>
      <div class="corner-accent top-left"></div>
      <div class="corner-accent top-right"></div>
      <div class="corner-accent bottom-left"></div>
      <div class="corner-accent bottom-right"></div>
    </div>

    <v-row align="center" justify="center" class="fill-height ma-0 w-100 py-6 py-sm-10">
      <v-col cols="12" class="d-flex justify-center align-center pa-2 pa-sm-4">
        <div class="login-card-glow-wrapper">
          <v-card class="login-v-card" style="position: relative;">
            <v-card-text class="login-card-content">
            <!-- Logo -->
            <div class="text-center logo-wrapper mb-6">
              <img
                src="@/assets/falcon-softwares-logo.png"
                alt="Falcon Softwares"
                class="login-brand-logo mx-auto"
              />
            </div>

            <!-- Title & Subtitle -->
            <h1 class="login-title font-weight-bold mb-2 text-center text-dark">Sign in</h1>
            <p class="login-subtitle text-body-1 text-center mb-8 text-grey-darken-1">
              Welcome back! Please enter your details.
            </p>

            <v-form
              ref="formRef"
              v-model="valid"
              @submit.prevent="handleLogin"
            >
              <!-- Field 1: Username -->
              <div class="field-block mb-6">
                <div class="field-label-row text-body-2 font-weight-medium mb-2 d-flex align-center text-grey-darken-2">
                  <v-icon size="20" class="mr-2">mdi-account-outline</v-icon>
                  <span>Username</span>
                </div>
                <v-select
                  v-model="username"
                  :items="userOptions"
                  item-title="title"
                  item-value="value"
                  placeholder="Select Username"
                  :rules="rules.usernameRules"
                  required
                  variant="outlined"
                  density="default"
                  hide-details="auto"
                  class="custom-login-field"
                  :menu-props="{ contentClass: 'login-user-select-menu', elevation: 8 }"
                  @update:model-value="clearError"
                >
                  <!-- Selected Item Display (Always Uppercase & High Contrast) -->
                  <template #selection="{ item }">
                    <div class="d-flex align-center">
                      <v-icon
                        size="18"
                        class="mr-2"
                        :color="item.raw.value === 'admin' ? '#0284c7' : '#64748b'"
                      >
                        {{ item.raw.value === 'admin' ? 'mdi-shield-crown' : 'mdi-account' }}
                      </v-icon>
                      <span class="selected-user-text font-weight-bold">
                        {{ item.raw.title }}
                      </span>
                    </div>
                  </template>

                  <!-- Dropdown Menu Item (Clearly Visible & Styled) -->
                  <template #item="{ props, item }">
                    <v-list-item
                      v-bind="{ ...props, title: undefined, subtitle: undefined }"
                      class="login-dropdown-item py-2 px-3"
                    >
                      <template #prepend>
                        <div class="user-role-badge mr-3" :class="item.raw.value">
                          <v-icon size="18" :color="item.raw.value === 'admin' ? '#0284c7' : '#64748b'">
                            {{ item.raw.value === 'admin' ? 'mdi-shield-crown' : 'mdi-account' }}
                          </v-icon>
                        </div>
                      </template>
                      <v-list-item-title class="user-role-title">
                        {{ item.raw.title }}
                      </v-list-item-title>
                      <v-list-item-subtitle class="user-role-subtitle">
                        {{ item.raw.value === 'admin' ? 'Full Access (Add, Edit, Delete)' : 'Staff Access (Add data only)' }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-select>
              </div>

              <!-- Field 2: Password -->
              <div class="field-block mb-6">
                <div class="field-label-row text-body-2 font-weight-medium mb-2 d-flex align-center text-grey-darken-2">
                  <v-icon size="20" class="mr-2">mdi-lock-outline</v-icon>
                  <span>Password</span>
                </div>
                <v-text-field
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Enter Password"
                  :rules="rules.passwordRules"
                  required
                  variant="outlined"
                  density="default"
                  hide-details="auto"
                  class="custom-login-field"
                  autocomplete="current-password"
                  @input="clearError"
                  @keyup.enter="handleLogin"
                >
                  <template #append-inner>
                    <v-icon
                      @click="showPassword = !showPassword"
                      class="pointer"
                      size="22"
                      color="grey-darken-1"
                    >
                      {{ showPassword ? "mdi-eye-off" : "mdi-eye" }}
                    </v-icon>
                  </template>
                </v-text-field>
              </div>

              <!-- Sign In Button -->
              <v-btn
                block
                height="54"
                variant="flat"
                :ripple="false"
                type="submit"
                class="app-navy-action-btn text-capitalize mb-4 font-weight-bold"
                :disabled="!valid || !username || !password || loading"
                :loading="loading"
              >
                Sign In
              </v-btn>

              <!-- Error Alert -->
              <v-alert
                v-if="error"
                type="error"
                density="compact"
                variant="tonal"
                class="mb-4 text-caption rounded-lg"
                closable
                @click:close="error = null"
              >
                {{ error }}
              </v-alert>
            </v-form>
          </v-card-text>
        </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>
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

const formRef = ref(null);
const valid = ref(false);
const username = ref('admin');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const error = ref(null);

const userOptions = [
  { title: 'Admin', value: 'admin' },
  { title: 'Staff', value: 'staff' },
];

const rules = {
  usernameRules: [(v) => !!v || 'Username is required'],
  passwordRules: [(v) => !!v || 'Password is required'],
};

function clearError() {
  error.value = null;
}

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = 'Please select a username and enter your password.';
    return;
  }

  loading.value = true;
  clearError();

  try {
    const cleanUser = String(username.value).trim().toLowerCase();
    const user = await authStore.login(cleanUser, password.value);
    snackbar.success(`Signed in as ${user.name}!`);
    const redirect = route.query.redirect || '/dashboard';
    router.push(redirect);
  } catch (err) {
    error.value = err.message || 'Login failed. Please check credentials.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* Sophisticated Executive Midnight Slate & Falcon Navy Background with Tech Design */
.login-container {
  position: relative;
  overflow-y: auto;
  min-height: 100vh;
  padding: 0;
  margin: 0;
  background-color: #060c18;
}

.login-container .background-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #060c18;
  background-image: 
    /* Center highlight */
    radial-gradient(circle at 50% 30%, rgba(6, 63, 120, 0.65) 0%, transparent 60%),
    /* Ambient cyan glow */
    radial-gradient(circle at 12% 85%, rgba(2, 132, 199, 0.25) 0%, transparent 45%),
    /* Ambient indigo glow */
    radial-gradient(circle at 88% 15%, rgba(99, 102, 241, 0.2) 0%, transparent 45%),
    /* Subtle tech grid */
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    /* Deep midnight base */
    linear-gradient(135deg, #050a14 0%, #0a1426 50%, #070e1c 100%);
  background-size: 
    100% 100%,
    100% 100%,
    100% 100%,
    44px 44px,
    44px 44px,
    100% 100%;
  opacity: 1;
  z-index: 0;
}

/* Background Tech Design Elements */
.bg-design-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.bg-circle-1 {
  width: 740px;
  height: 740px;
  border: 1.5px dashed rgba(255, 255, 255, 0.09);
  animation: rotateSlow 120s linear infinite;
}

.bg-circle-2 {
  width: 1020px;
  height: 1020px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.bg-circle-3 {
  width: 1320px;
  height: 1320px;
  border: 1px dashed rgba(255, 255, 255, 0.04);
}

.bg-grid-glow {
  position: absolute;
  width: 700px;
  height: 700px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(6, 63, 120, 0.4) 0%, rgba(2, 132, 199, 0.15) 50%, transparent 70%);
  filter: blur(60px);
}

@keyframes rotateSlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.corner-accent {
  position: absolute;
  width: 60px;
  height: 60px;
  border: 2px solid rgba(255, 255, 255, 0.08);
}

.corner-accent.top-left {
  top: 32px;
  left: 32px;
  border-right: none;
  border-bottom: none;
}

.corner-accent.top-right {
  top: 32px;
  right: 32px;
  border-left: none;
  border-bottom: none;
}

.corner-accent.bottom-left {
  bottom: 32px;
  left: 32px;
  border-right: none;
  border-top: none;
}

.corner-accent.bottom-right {
  bottom: 32px;
  right: 32px;
  border-left: none;
  border-top: none;
}

.login-container .v-row {
  position: relative;
  z-index: 2;
  min-height: 100vh;
}

/* Card Glow Wrapper - Soft Ambient Brand Backlight */
.login-card-glow-wrapper {
  position: relative;
  width: 100%;
  max-width: 580px;
  display: flex;
  justify-content: center;
}

.login-card-glow-wrapper::before {
  content: '';
  position: absolute;
  top: -12px;
  left: -12px;
  right: -12px;
  bottom: -12px;
  background: radial-gradient(
    circle at center,
    rgba(2, 132, 199, 0.22) 0%,
    rgba(6, 63, 120, 0.3) 45%,
    transparent 72%
  );
  filter: blur(32px);
  border-radius: 24px;
  pointer-events: none;
  z-index: 1;
}

/* Card Styling - Razor-Sharp Executive Card with Premium Realistic Depth */
.login-container .login-v-card {
  position: relative;
  z-index: 2;
  background-color: #ffffff !important;
  border-radius: 12px !important;
  border: 1px solid rgba(226, 232, 240, 0.9) !important;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 12px 28px -4px rgba(0, 0, 0, 0.35),
    0 30px 60px -12px rgba(0, 0, 0, 0.65),
    0 0 0 1px rgba(255, 255, 255, 0.15) !important;
  width: 100%;
  max-width: 580px;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
}

.login-card-content {
  padding: 44px 44px 40px 44px !important;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: center;
}

.login-brand-logo {
  max-width: 300px;
  width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
}

.login-title {
  font-size: 2.25rem !important;
  font-weight: 700 !important;
  line-height: 1.2 !important;
  color: #1e293b !important;
}

.login-subtitle {
  font-size: 1rem !important;
  color: #64748b !important;
}

.field-label-row {
  font-size: 0.95rem !important;
  font-weight: 600 !important;
  color: #334155 !important;
}

/* Selected User Text */
.selected-user-text {
  font-size: 15px !important;
  font-weight: 600 !important;
  color: #0f172a !important;
}

/* High-Contrast Visible Dropdown Menu */
:deep(.login-user-select-menu) {
  border-radius: 8px !important;
  border: 1px solid #cbd5e1 !important;
  background-color: #ffffff !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2) !important;
  padding: 6px !important;
}

:deep(.login-dropdown-item) {
  border-radius: 6px !important;
  margin-bottom: 4px !important;
  padding: 8px 12px !important;
  cursor: pointer !important;
  transition: background-color 0.15s ease !important;
}

:deep(.login-dropdown-item:hover) {
  background-color: #f1f5f9 !important;
}

:deep(.login-dropdown-item.v-list-item--active) {
  background-color: #e0f2fe !important;
}

.user-role-badge {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f5f9;
}

.user-role-badge.admin {
  background-color: #e0f2fe;
}

.user-role-badge.staff {
  background-color: #f1f5f9;
}

:deep(.user-role-title) {
  font-size: 15px !important;
  font-weight: 700 !important;
  color: #0f172a !important;
  margin-bottom: 2px !important;
}

:deep(.user-role-subtitle) {
  font-size: 12.5px !important;
  font-weight: 600 !important;
  color: #475569 !important;
  opacity: 1 !important;
}

/* Responsive Login Page */
@media (max-width: 960px) {
  .login-container .login-v-card {
    max-width: 520px;
    min-height: 560px;
  }

  .login-card-content {
    padding: 36px 32px 32px 32px !important;
  }

  .login-brand-logo {
    max-width: 260px;
  }

  .login-title {
    font-size: 2rem !important;
  }
}

@media (max-width: 600px) {
  .login-container {
    padding: 12px 8px !important;
  }

  .login-container .login-v-card {
    margin: 8px auto !important;
    max-width: 100% !important;
    width: 100% !important;
    min-height: auto;
    border-radius: 8px !important;
  }

  .login-card-content {
    padding: 28px 18px 24px 18px !important;
  }

  .login-brand-logo {
    max-width: 220px;
  }

  .login-title {
    font-size: 1.75rem !important;
  }

  .login-subtitle {
    font-size: 0.9rem !important;
    margin-bottom: 24px !important;
  }

  .field-block {
    margin-bottom: 18px !important;
  }

  :deep(.custom-login-field .v-field) {
    min-height: 48px !important;
  }

  .app-navy-action-btn {
    width: 100% !important;
    min-height: 50px !important;
    height: 50px !important;
  }
}

/* Inputs Styling */
:deep(.custom-login-field .v-field) {
  border-radius: 8px !important;
  background-color: #ffffff !important;
  min-height: 54px !important;
}

:deep(.custom-login-field .v-field__outline) {
  --v-field-border-opacity: 0.4 !important;
  color: #64748b !important;
}

:deep(.custom-login-field.v-field--focused .v-field__outline) {
  --v-field-border-opacity: 1 !important;
  color: #063f78 !important;
}

:deep(.custom-login-field .v-field__input) {
  padding-top: 14px !important;
  padding-bottom: 14px !important;
  font-size: 15px !important;
}

/* App Navy Action Button */
.app-navy-action-btn {
  background-color: #063f78 !important;
  color: #ffffff !important;
  min-height: 54px !important;
  height: 54px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  border-radius: 8px !important;
  transition: all 0.2s ease;
}

.app-navy-action-btn:hover:not(:disabled) {
  background-color: #053361 !important;
  box-shadow: 0 6px 18px rgba(6, 63, 120, 0.35) !important;
}

.app-navy-action-btn:disabled {
  background-color: #f1f5f9 !important;
  color: #94a3b8 !important;
  border: 1px solid #e2e8f0 !important;
}

/* Cursor pointer for interactive elements */
.pointer {
  cursor: pointer;
}

button, .v-btn, .v-icon, a, .v-list-item, [role="button"], [tabindex] {
  cursor: pointer;
}
</style>
