import { defineStore } from 'pinia';

export const useSnackbarStore = defineStore('snackbar', {
  state: () => ({
    show: false,
    text: '',
    color: 'success',
    timeout: 3500,
    icon: 'mdi-check-circle',
  }),

  actions: {
    showMessage({ text, color = 'info', icon = 'mdi-information', timeout = 3500 }) {
      this.text = text;
      this.color = color;
      this.icon = icon;
      this.timeout = timeout;
      this.show = true;
    },

    success(text) {
      this.showMessage({
        text,
        color: 'success',
        icon: 'mdi-check-circle',
      });
    },

    error(text) {
      this.showMessage({
        text,
        color: 'error',
        icon: 'mdi-alert-circle',
        timeout: 5000,
      });
    },

    info(text) {
      this.showMessage({
        text,
        color: 'info',
        icon: 'mdi-information',
      });
    },

    warning(text) {
      this.showMessage({
        text,
        color: 'warning',
        icon: 'mdi-alert',
      });
    },
  },
});

