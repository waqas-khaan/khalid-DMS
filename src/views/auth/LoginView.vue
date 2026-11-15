<template>
  <v-container fluid class="login-container fill-height pa-0">
    <div class="background-backdrop"></div>

    <v-row align="center" justify="center" class="fill-height ma-0 w-100 py-6 py-sm-10">
      <v-col cols="12" class="d-flex justify-center align-center pa-2 pa-sm-4">
        <v-card class="login-v-card elevation-5" style="position: relative;">
          <!-- Top Row: Go to Home -->
          <div class="login-card-header d-flex align-center justify-space-between">
            <v-btn
              to="/"
              variant="text"
              size="small"
              color="#334155"
              class="text-capitalize font-weight-bold px-0 go-home-action"
            >
              <v-icon start size="18">mdi-arrow-left</v-icon>
              Go to Home
            </v-btn>
          </div>

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
                  @update:model-value="clearError"
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
  { title: 'admin', value: 'admin' },
  { title: 'staff', value: 'staff' },
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
    const user = await authStore.login(username.value, password.value);
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
/* Login Page Background */
.login-container {
  position: relative;
  overflow-y: auto;
  min-height: 100vh;
  padding: 0;
  margin: 0;
  background: linear-gradient(135deg, #eef2f6 0%, #e2e8f0 50%, #f8fafc 100%);
}

.login-container .background-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #eef2f6 0%, #e2e8f0 50%, #f8fafc 100%);
  opacity: 1;
  z-index: 0;
}

.login-container .v-row {
  position: relative;
  z-index: 2;
  min-height: 100vh;
}

/* Card Styling - Responsive Width & Height, Crisp Border & Reduced Radius */
.login-container .login-v-card {
  position: relative;
  z-index: 2;
  background-color: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(10px);
  border-radius: 10px !important;
  border: 1px solid #000000 !important;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.08) !important;
  width: 100%;
  max-width: 580px;
  min-height: 640px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  box-sizing: border-box;
}

.login-card-header {
  padding: 24px 32px 0 32px;
}

.login-card-content {
  padding: 16px 40px 40px 40px !important;
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

/* Responsive Login Page */
@media (max-width: 960px) {
  .login-container .login-v-card {
    max-width: 520px;
    min-height: 580px;
  }

  .login-card-header {
    padding: 16px 24px 0 24px;
  }

  .login-card-content {
    padding: 12px 28px 32px 28px !important;
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

  .login-card-header {
    padding: 12px 16px 0 16px;
  }

  .login-card-content {
    padding: 12px 18px 24px 18px !important;
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
