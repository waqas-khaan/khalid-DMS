<template>
  <v-snackbar
    v-model="snackbarStore.show"
    :color="snackbarStore.color"
    :timeout="snackbarStore.timeout"
    location="top right"
    elevation="4"
    rounded="lg"
  >
    <div class="d-flex align-center">
      <v-icon :icon="snackbarStore.icon" class="me-2" />
      <span>{{ snackbarStore.text }}</span>
    </div>
    <template v-slot:actions>
      <v-btn
        variant="text"
        icon="mdi-close"
        size="small"
        @click="snackbarStore.show = false"
      />
    </template>
  </v-snackbar>
</template>

<script setup>
import { useSnackbarStore } from '@/stores/snackbar';

const snackbarStore = useSnackbarStore();
</script>

