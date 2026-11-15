<template>
  <v-card
    class="dashboard-card stat-card-themed pa-3 px-3 h-100"
    :class="[`stat-card--${color || 'primary'}`]"
    elevation="0"
  >
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

<style scoped>
.stat-card-themed {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
}
.stat-card--primary { border: 1.5px solid #2563eb !important; }
.stat-card--success { border: 1.5px solid #10b981 !important; }
.stat-card--teal { border: 1.5px solid #0d9488 !important; }
.stat-card--warning { border: 1.5px solid #f59e0b !important; }
.stat-card--orange { border: 1.5px solid #f97316 !important; }
.stat-card--error,
.stat-card--red { border: 1.5px solid #ef4444 !important; }
.stat-card--info { border: 1.5px solid #0284c7 !important; }
.stat-card--indigo { border: 1.5px solid #6366f1 !important; }
.stat-card--purple { border: 1.5px solid #8b5cf6 !important; }
.stat-card--grey,
.stat-card--secondary { border: 1.5px solid #94a3b8 !important; }
</style>

