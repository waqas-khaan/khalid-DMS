import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const usePwaStore = defineStore('pwa', () => {
  const deferredPrompt = ref(null);
  const isInstalled = ref(checkIsInstalled());
  const showInstallDialog = ref(false);
  const isInitialized = ref(false);

  function checkIsInstalled() {
    if (typeof window === 'undefined') return false;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = window.navigator?.standalone === true;
    const isAndroidApp = document.referrer?.includes('android-app://');
    return Boolean(isStandalone || isIosStandalone || isAndroidApp);
  }

  // Detect platform: 'mac' | 'windows' | 'linux' | 'ios' | 'android' | 'other'
  const platform = computed(() => {
    if (typeof navigator === 'undefined') return 'other';
    const ua = navigator.userAgent.toLowerCase();
    const platformStr = (navigator.userAgentData?.platform || navigator.platform || '').toLowerCase();

    if (platformStr.includes('mac') || ua.includes('macintosh') || ua.includes('mac os')) return 'mac';
    if (platformStr.includes('win') || ua.includes('windows')) return 'windows';
    if (platformStr.includes('linux') || ua.includes('linux')) return 'linux';
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    return 'other';
  });

  // Detect browser: 'chrome' | 'edge' | 'safari' | 'firefox' | 'brave' | 'opera' | 'other'
  const browser = computed(() => {
    if (typeof navigator === 'undefined') return 'other';
    const ua = navigator.userAgent.toLowerCase();

    if (ua.includes('edg/')) return 'edge';
    if (ua.includes('opr/') || ua.includes('opera/')) return 'opera';
    if (navigator.brave && typeof navigator.brave.isBrave === 'function') return 'brave';
    if (ua.includes('chrome/') && !ua.includes('edg/')) return 'chrome';
    if (ua.includes('safari/') && !ua.includes('chrome/')) return 'safari';
    if (ua.includes('firefox/')) return 'firefox';
    return 'other';
  });

  const isDesktop = computed(() => {
    return ['mac', 'windows', 'linux'].includes(platform.value);
  });

  const isNativePromptReady = computed(() => {
    return Boolean(deferredPrompt.value);
  });

  const canInstall = computed(() => {
    return !isInstalled.value;
  });

  // Initialize listeners
  function init() {
    if (typeof window === 'undefined' || isInitialized.value) return;
    isInitialized.value = true;

    // Listen for beforeinstallprompt event (Chromium: Chrome, Edge, Brave, Opera)
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      deferredPrompt.value = e;
      console.log('[PWA] Captured beforeinstallprompt event ready for install');
    });

    // Listen for app installation completion
    window.addEventListener('appinstalled', (evt) => {
      console.log('[PWA] DMS application was successfully installed!', evt);
      isInstalled.value = true;
      deferredPrompt.value = null;
      showInstallDialog.value = false;
    });

    // Listen for standalone display-mode changes
    try {
      const matchMedia = window.matchMedia('(display-mode: standalone)');
      matchMedia.addEventListener('change', (e) => {
        isInstalled.value = e.matches;
      });
    } catch (e) {
      // Older browsers
    }
  }

  // Trigger installation
  async function promptInstall() {
    // If native prompt is available, trigger it directly
    if (deferredPrompt.value) {
      try {
        const promptEvent = deferredPrompt.value;
        await promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        console.log('[PWA] User choice outcome:', choiceResult.outcome);

        if (choiceResult.outcome === 'accepted') {
          isInstalled.value = true;
          deferredPrompt.value = null;
          showInstallDialog.value = false;
          return true;
        } else {
          console.log('[PWA] User dismissed install prompt');
          return false;
        }
      } catch (err) {
        console.warn('[PWA] Error calling prompt():', err);
        showInstallDialog.value = true;
        return false;
      }
    } else {
      // Fallback: Open guided desktop install dialog
      showInstallDialog.value = true;
      return false;
    }
  }

  function openInstallDialog() {
    showInstallDialog.value = true;
  }

  function closeInstallDialog() {
    showInstallDialog.value = false;
  }

  return {
    isInstalled,
    canInstall,
    isDesktop,
    platform,
    browser,
    isNativePromptReady,
    showInstallDialog,
    init,
    promptInstall,
    openInstallDialog,
    closeInstallDialog,
  };
});
