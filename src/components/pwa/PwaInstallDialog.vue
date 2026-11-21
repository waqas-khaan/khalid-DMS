<template>
  <v-dialog
    :model-value="pwaStore.showInstallDialog"
    @update:model-value="pwaStore.showInstallDialog = $event"
    max-width="490"
    transition="dialog-bottom-transition"
  >
    <v-card class="falcon-install-card overflow-hidden">
      <!-- Top Close Button -->
      <button
        type="button"
        class="falcon-dialog-close-btn"
        aria-label="Close dialog"
        @click="pwaStore.closeInstallDialog"
      >
        <v-icon size="18">mdi-close</v-icon>
      </button>

      <!-- Executive Header Section -->
      <div class="falcon-dialog-hero text-center px-6 pt-7 pb-4">
        <!-- Logo Emblem -->
        <div class="falcon-emblem-wrapper mx-auto mb-3">
          <img src="/icons/icon-192.png" alt="Falcon DMS" class="falcon-emblem-img" />
        </div>

        <div class="d-flex align-center justify-center gap-2 mb-1">
          <h2 class="falcon-dialog-title mb-0">Install Falcon DMS</h2>
          <span class="falcon-pwa-pill">Desktop App</span>
        </div>

        <p class="falcon-dialog-subtitle mx-auto">
          Fast, focused desktop application for daily dairy operations, milk collection, and payroll.
        </p>
      </div>

      <v-card-text class="px-6 py-2">
        <!-- 3-Column Value Highlights -->
        <div class="falcon-features-row mb-5">
          <div class="falcon-feature-chip">
            <div class="feature-chip-icon bg-blue-50 text-primary">
              <v-icon size="16">mdi-window-maximize</v-icon>
            </div>
            <div class="feature-chip-title">Clean Window</div>
            <div class="feature-chip-desc">Zero tab clutter</div>
          </div>

          <div class="falcon-feature-chip">
            <div class="feature-chip-icon bg-emerald-50 text-emerald-600">
              <v-icon size="16">mdi-lightning-bolt</v-icon>
            </div>
            <div class="feature-chip-title">Instant Launch</div>
            <div class="feature-chip-desc">Dock & Taskbar</div>
          </div>

          <div class="falcon-feature-chip">
            <div class="feature-chip-icon bg-amber-50 text-amber-700">
              <v-icon size="16">mdi-cached</v-icon>
            </div>
            <div class="feature-chip-title">Offline Cache</div>
            <div class="feature-chip-desc">Always responsive</div>
          </div>
        </div>

        <!-- 1-Click Native Install Action (Chromium: Chrome/Edge/Brave) -->
        <div v-if="pwaStore.isNativePromptReady" class="mb-5">
          <v-btn
            size="large"
            block
            class="falcon-primary-install-btn text-capitalize font-weight-bold"
            prepend-icon="mdi-laptop"
            @click="handleNativeInstall"
          >
            Install Falcon DMS (1-Click)
          </v-btn>
          <div class="text-center mt-1-5 text-caption text-slate-500">
            Click to trigger the browser desktop installation prompt
          </div>
        </div>

        <!-- Guided Browser Installation Section -->
        <div class="falcon-guide-container rounded-xl p-3 border bg-slate-50 mb-3">
          <!-- Browser Segmented Control -->
          <div class="d-flex align-center justify-space-between mb-3 px-1">
            <span class="text-caption font-weight-bold text-slate-700 d-flex align-center gap-1">
              <v-icon size="14" color="primary">mdi-help-circle-outline</v-icon>
              <span>Install Instructions</span>
            </span>

            <!-- Browser Switcher Pills -->
            <div class="browser-pill-switcher">
              <button
                type="button"
                class="browser-pill-item"
                :class="{ active: currentBrowser === 'chrome' }"
                @click="currentBrowser = 'chrome'"
              >
                <v-icon size="13" class="mr-1">mdi-google-chrome</v-icon> Chrome
              </button>
              <button
                type="button"
                class="browser-pill-item"
                :class="{ active: currentBrowser === 'edge' }"
                @click="currentBrowser = 'edge'"
              >
                <v-icon size="13" class="mr-1">mdi-microsoft-edge</v-icon> Edge
              </button>
              <button
                type="button"
                class="browser-pill-item"
                :class="{ active: currentBrowser === 'safari' }"
                @click="currentBrowser = 'safari'"
              >
                <v-icon size="13" class="mr-1">mdi-apple-safari</v-icon> Safari
              </button>
            </div>
          </div>

          <!-- Chrome & Brave Guide Panel -->
          <div v-if="currentBrowser === 'chrome'" class="browser-guide-card bg-white rounded-lg p-3 border">
            <!-- Simulated Address Bar Mockup -->
            <div class="simulated-omnibox d-flex align-center justify-space-between px-3 py-1-5 mb-2-5 rounded">
              <div class="d-flex align-center gap-1-5 text-caption text-slate-500 text-truncate">
                <v-icon size="12" color="slate-400">mdi-lock</v-icon>
                <span>falconsoftwares.com</span>
              </div>
              <div class="omnibox-highlight-btn d-flex align-center gap-1 px-2 py-0-5 rounded">
                <v-icon size="13" color="#063F78">mdi-download-box-outline</v-icon>
                <span class="text-caption font-weight-bold" style="color: #063F78; font-size: 0.72rem;">Install</span>
              </div>
            </div>

            <div class="guide-bullet-list">
              <div class="guide-bullet-item">
                <span class="guide-num">1</span>
                <span class="guide-text">
                  Look at the right side of your Chrome URL address bar.
                </span>
              </div>
              <div class="guide-bullet-item">
                <span class="guide-num">2</span>
                <span class="guide-text">
                  Click the <strong>Install icon</strong> <v-icon size="13" color="#063F78">mdi-download-box-outline</v-icon> or <strong>(⊕)</strong>.
                </span>
              </div>
              <div class="guide-bullet-item">
                <span class="guide-num">3</span>
                <span class="guide-text">
                  Confirm <strong>Install</strong> to open Falcon DMS in its standalone window.
                </span>
              </div>
            </div>
          </div>

          <!-- Microsoft Edge Guide Panel -->
          <div v-if="currentBrowser === 'edge'" class="browser-guide-card bg-white rounded-lg p-3 border">
            <!-- Simulated Address Bar Mockup -->
            <div class="simulated-omnibox d-flex align-center justify-space-between px-3 py-1-5 mb-2-5 rounded">
              <div class="d-flex align-center gap-1-5 text-caption text-slate-500 text-truncate">
                <v-icon size="12" color="slate-400">mdi-lock</v-icon>
                <span>falconsoftwares.com</span>
              </div>
              <div class="omnibox-highlight-btn d-flex align-center gap-1 px-2 py-0-5 rounded">
                <v-icon size="13" color="#063F78">mdi-laptop</v-icon>
                <span class="text-caption font-weight-bold" style="color: #063F78; font-size: 0.72rem;">App Available</span>
              </div>
            </div>

            <div class="guide-bullet-list">
              <div class="guide-bullet-item">
                <span class="guide-num">1</span>
                <span class="guide-text">
                  Click the <strong>App available</strong> icon <v-icon size="13" color="#063F78">mdi-laptop</v-icon> in the Edge address bar.
                </span>
              </div>
              <div class="guide-bullet-item">
                <span class="guide-num">2</span>
                <span class="guide-text">
                  Click <strong>Install Falcon DMS</strong> to pin to your Taskbar or Start Menu.
                </span>
              </div>
            </div>
          </div>

          <!-- Apple Safari (macOS Sonoma / Sequoia) Guide Panel -->
          <div v-if="currentBrowser === 'safari'" class="browser-guide-card bg-white rounded-lg p-3 border">
            <!-- Simulated Mac Menu Bar Mockup -->
            <div class="simulated-omnibox d-flex align-center gap-2 px-3 py-1-5 mb-2-5 rounded">
              <v-icon size="13" color="slate-600">mdi-apple</v-icon>
              <span class="text-caption text-slate-600 font-weight-medium">File</span>
              <v-icon size="11" color="slate-400">mdi-chevron-right</v-icon>
              <span class="text-caption font-weight-bold" style="color: #063F78;">Add to Dock...</span>
            </div>

            <div class="guide-bullet-list">
              <div class="guide-bullet-item">
                <span class="guide-num">1</span>
                <span class="guide-text">
                  In your top Mac menu bar, click <strong>File</strong>.
                </span>
              </div>
              <div class="guide-bullet-item">
                <span class="guide-num">2</span>
                <span class="guide-text">
                  Select <strong>Add to Dock...</strong> from the dropdown menu.
                </span>
              </div>
              <div class="guide-bullet-item">
                <span class="guide-num">3</span>
                <span class="guide-text">
                  Click <strong>Add</strong>. Falcon DMS will appear in your Mac Dock & Launchpad.
                </span>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>

      <!-- Footer Bar -->
      <div class="falcon-dialog-footer px-6 py-3 border-t bg-slate-50 d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-1-5 text-caption text-slate-500">
          <img src="/icons/icon-192.png" alt="Falcon" style="width: 16px; height: 16px; border-radius: 3px;" />
          <span style="font-size: 0.73rem;">Systems by Falcon Softwares</span>
        </div>

        <v-btn
          variant="flat"
          size="small"
          color="#063F78"
          class="text-capitalize font-weight-bold rounded-lg text-white"
          @click="pwaStore.closeInstallDialog"
        >
          Done
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { usePwaStore } from '@/stores/pwa';

const pwaStore = usePwaStore();
const currentBrowser = ref('chrome');

onMounted(() => {
  // Auto-detect client browser & set initial view cleanly
  if (pwaStore.browser === 'safari' || (pwaStore.platform === 'mac' && pwaStore.browser !== 'chrome')) {
    currentBrowser.value = 'safari';
  } else if (pwaStore.browser === 'edge') {
    currentBrowser.value = 'edge';
  } else {
    currentBrowser.value = 'chrome';
  }
});

async function handleNativeInstall() {
  await pwaStore.promptInstall();
}
</script>

<style scoped>
.falcon-install-card {
  background: #ffffff;
  border-radius: 20px !important;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.08) !important;
  position: relative;
}

/* Close Button */
.falcon-dialog-close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  z-index: 10;
}

.falcon-dialog-close-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* Hero Section */
.falcon-dialog-hero {
  background: radial-gradient(circle at 50% 0%, rgba(6, 63, 120, 0.05) 0%, transparent 70%);
}

.falcon-emblem-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 6px;
  box-shadow: 0 8px 16px -4px rgba(6, 63, 120, 0.12), 0 2px 6px -1px rgba(6, 63, 120, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.falcon-emblem-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.falcon-dialog-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.falcon-pwa-pill {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #e0f2fe;
  color: #0369a1;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid #bae6fd;
}

.falcon-dialog-subtitle {
  font-size: 0.82rem;
  color: #64748b;
  max-width: 380px;
  line-height: 1.45;
}

/* 3-Column Features */
.falcon-features-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.falcon-feature-chip {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 8px;
  text-align: center;
}

.feature-chip-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 6px auto;
}

.feature-chip-title {
  font-size: 0.74rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.feature-chip-desc {
  font-size: 0.68rem;
  color: #64748b;
  margin-top: 2px;
}

/* 1-Click Action Button */
.falcon-primary-install-btn {
  background: linear-gradient(135deg, #063F78 0%, #0b4f94 100%) !important;
  color: #ffffff !important;
  border-radius: 12px !important;
  height: 44px !important;
  font-size: 0.9rem !important;
  letter-spacing: 0.01em !important;
  box-shadow: 0 4px 14px rgba(6, 63, 120, 0.3) !important;
  transition: all 0.2s ease !important;
}

.falcon-primary-install-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(6, 63, 120, 0.4) !important;
}

/* Browser Pill Switcher */
.browser-pill-switcher {
  display: inline-flex;
  background: #e2e8f0;
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}

.browser-pill-item {
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.15s ease;
}

.browser-pill-item.active {
  background: #ffffff;
  color: #063F78;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Simulated Omnibox */
.simulated-omnibox {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
}

.omnibox-highlight-btn {
  background: #e0f2fe;
  border: 1px solid #bae6fd;
}

/* Guide Bullet List */
.guide-bullet-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.guide-bullet-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.guide-num {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #063F78;
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.guide-text {
  font-size: 0.78rem;
  color: #334155;
  line-height: 1.4;
}

.guide-text strong {
  color: #0f172a;
}
</style>
