/**
 * Service Worker Registration for Universal Desktop PWA
 */

export function registerSW() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Register when the page loads
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered with scope:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                console.log('[PWA] New version available! Reload to update.');
                window.dispatchEvent(new CustomEvent('pwa-update-available', { detail: registration }));
              } else {
                console.log('[PWA] Content is cached for offline use.');
              }
            }
          });
        });
      })
      .catch((error) => {
        console.warn('[PWA] Service Worker registration failed:', error);
      });
  });
}
