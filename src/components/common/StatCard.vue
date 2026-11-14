<template>
  <v-card class="dashboard-card pa-3 px-3 h-100" elevation="0">
    <div class="mb-1">
      <span class="stat-card-label">{{ label }}</span>
    </div>
    <div class="stat-card-value my-1">
      {{ value }}
    </div>
    <div v-if="subtitle" class="text-caption text-grey-darken-1 mt-1 text-truncate" style="font-size: 0.68rem !important;">
      {{ subtitle }}
    </div>
  </v-card>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  subtitle: { type: String, default: '' },
  color: { type: String, default: 'primary' },
});
</script>

