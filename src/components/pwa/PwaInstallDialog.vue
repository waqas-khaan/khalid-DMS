<template>
  <v-dialog
    :model-value="pwaStore.showInstallDialog"
    @update:model-value="pwaStore.showInstallDialog = $event"
    max-width="560"
    transition="dialog-bottom-transition"
  >
    <v-card class="pwa-install-card rounded-xl overflow-hidden border">
      <!-- Header Banner with Gradient -->
      <div class="pwa-dialog-header pa-6 text-white position-relative">
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="d-flex align-center gap-3">
            <div class="pwa-icon-box elevation-3">
              <img src="/icons/icon-192.png" alt="Falcon DMS Logo" class="pwa-logo-img" />
            </div>
            <div>
              <div class="text-h6 font-weight-bold text-white d-flex align-center gap-2">
                <span>Install Falcon DMS Desktop</span>
                <span class="pwa-badge">Desktop PWA</span>
              </div>
              <div class="text-caption text-blue-lighten-4">
                Falcon DMS — Operations, Collection & Payroll
              </div>
            </div>
          </div>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            color="white"
            @click="pwaStore.closeInstallDialog"
            aria-label="Close dialog"
          />
        </div>

        <p class="text-body-2 text-blue-lighten-4 ma-0 line-height-relaxed">
          Install Falcon DMS as a standalone desktop application directly from your browser. Enjoy a dedicated window, fast launch from your Dock/Taskbar, and zero browser tab clutter.
        </p>
      </div>

      <v-card-text class="pa-6">
        <!-- Feature Highlights Grid -->
        <div class="pwa-features-grid mb-6">
          <div class="pwa-feature-item">
            <div class="feature-icon bg-blue-lighten-5">
              <v-icon color="#063F78" size="20">mdi-monitor-dashboard</v-icon>
            </div>
            <div class="feature-text">
              <div class="feature-title">Dedicated Window</div>
              <div class="feature-desc">No browser tabs or address bar distractions</div>
            </div>
          </div>

          <div class="pwa-feature-item">
            <div class="feature-icon bg-green-lighten-5">
              <v-icon color="#1b5e20" size="20">mdi-lightning-bolt</v-icon>
            </div>
            <div class="feature-text">
              <div class="feature-title">Instant Launch</div>
              <div class="feature-desc">Pin to macOS Dock, Windows Taskbar, or Start Menu</div>
            </div>
          </div>

          <div class="pwa-feature-item">
            <div class="feature-icon bg-amber-lighten-5">
              <v-icon color="#e65100" size="20">mdi-cloud-sync-outline</v-icon>
            </div>
            <div class="feature-text">
              <div class="feature-title">Always Updated</div>
              <div class="feature-desc">Automatic background updates with local caching</div>
            </div>
          </div>
        </div>

        <!-- 1-Click Native Install Action (if available) -->
        <div v-if="pwaStore.isNativePromptReady" class="native-install-box pa-4 mb-6 rounded-lg text-center bg-blue-lighten-5 border">
          <v-btn
            color="#063F78"
            size="large"
            block
            class="text-capitalize text-white font-weight-bold rounded-lg elevation-2"
            prepend-icon="mdi-download-box"
            @click="handleNativeInstall"
          >
            Install Desktop App (1-Click)
          </v-btn>
          <div class="text-caption text-grey-darken-2 mt-2">
            Click above to trigger the standard desktop installation prompt.
          </div>
        </div>

        <!-- Step-by-Step Browser Guides -->
        <div class="pwa-guides-section">
          <div class="text-subtitle-2 font-weight-bold text-grey-darken-3 mb-3 d-flex align-center gap-2">
            <v-icon size="18" color="primary">mdi-help-circle-outline</v-icon>
            <span>Installation Instructions by Browser</span>
          </div>

          <v-tabs v-model="activeTab" density="compact" color="#063F78" class="border-b mb-4">
            <v-tab value="chrome" class="text-capitalize font-weight-bold">
              <v-icon size="16" class="mr-1">mdi-google-chrome</v-icon> Chrome / Brave
            </v-tab>
            <v-tab value="edge" class="text-capitalize font-weight-bold">
              <v-icon size="16" class="mr-1">mdi-microsoft-edge</v-icon> MS Edge
            </v-tab>
            <v-tab value="safari" class="text-capitalize font-weight-bold">
              <v-icon size="16" class="mr-1">mdi-apple-safari</v-icon> Safari (Mac)
            </v-tab>
          </v-tabs>

          <v-window v-model="activeTab">
            <!-- Chrome Tab -->
            <v-window-item value="chrome">
              <div class="guide-steps">
                <div class="guide-step">
                  <span class="step-num">1</span>
                  <div class="step-content">
                    Look at the right end of your browser's address bar (URL bar).
                  </div>
                </div>
                <div class="guide-step">
                  <span class="step-num">2</span>
                  <div class="step-content">
                    Click the <strong>Install icon</strong> <v-icon size="16" color="#063F78">mdi-download-box-outline</v-icon> or <strong>(⊕)</strong>.
                  </div>
                </div>
                <div class="guide-step">
                  <span class="step-num">3</span>
                  <div class="step-content">
                    Click <strong>Install</strong> in the popup. Falcon DMS will open in its own desktop window!
                  </div>
                </div>
              </div>
            </v-window-item>

            <!-- Edge Tab -->
            <v-window-item value="edge">
              <div class="guide-steps">
                <div class="guide-step">
                  <span class="step-num">1</span>
                  <div class="step-content">
                    Look at the right side of the address bar for the <strong>App available</strong> icon.
                  </div>
                </div>
                <div class="guide-step">
                  <span class="step-num">2</span>
                  <div class="step-content">
                    Click <strong>Install Falcon DMS</strong> or press the icon <v-icon size="16" color="#063F78">mdi-laptop</v-icon>.
                  </div>
                </div>
                <div class="guide-step">
                  <span class="step-num">3</span>
                  <div class="step-content">
                    Choose to pin Falcon DMS to your <strong>Taskbar</strong> or <strong>Start Menu</strong>.
                  </div>
                </div>
              </div>
            </v-window-item>

            <!-- Safari Tab -->
            <v-window-item value="safari">
              <div class="guide-steps">
                <div class="guide-step">
                  <span class="step-num">1</span>
                  <div class="step-content">
                    In the top macOS menu bar, click <strong>File</strong>.
                  </div>
                </div>
                <div class="guide-step">
                  <span class="step-num">2</span>
                  <div class="step-content">
                    Select <strong>Add to Dock...</strong> from the dropdown menu.
                  </div>
                </div>
                <div class="guide-step">
                  <span class="step-num">3</span>
                  <div class="step-content">
                    Click <strong>Add</strong>. Falcon DMS is now installed in your Mac Dock and Launchpad!
                  </div>
                </div>
              </div>
            </v-window-item>
          </v-window>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4 bg-grey-lighten-5 d-flex justify-space-between align-center">
        <div class="text-caption text-grey-darken-1 d-flex align-center gap-1">
          <v-icon size="14">mdi-shield-check</v-icon>
          <span>Verified Universal Desktop PWA</span>
        </div>
        <v-btn
          variant="text"
          color="grey-darken-2"
          class="text-capitalize font-weight-bold"
          @click="pwaStore.closeInstallDialog"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { usePwaStore } from '@/stores/pwa';

const pwaStore = usePwaStore();
const activeTab = ref('chrome');

onMounted(() => {
  if (pwaStore.browser === 'safari' || pwaStore.platform === 'mac') {
    activeTab.value = pwaStore.browser === 'safari' ? 'safari' : 'chrome';
  } else if (pwaStore.browser === 'edge') {
    activeTab.value = 'edge';
  } else {
    activeTab.value = 'chrome';
  }
});

async function handleNativeInstall() {
  await pwaStore.promptInstall();
}
</script>

<style scoped>
.pwa-install-card {
  background: #ffffff;
}

.pwa-dialog-header {
  background: linear-gradient(135deg, #061c38 0%, #063F78 60%, #0284c7 100%);
}

.pwa-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #ffffff;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pwa-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pwa-badge {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 20px;
}

.line-height-relaxed {
  line-height: 1.5;
}

.pwa-features-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pwa-feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feature-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-title {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}

.feature-desc {
  font-size: 12px;
  color: #64748b;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 4px;
}

.guide-step {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #063F78;
  color: #ffffff;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.step-content {
  font-size: 13px;
  color: #334155;
  line-height: 1.4;
}
</style>
