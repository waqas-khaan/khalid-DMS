<template>
  <div class="current-time-badge">
    <v-icon size="16" color="white" class="me-2">mdi-clock-outline</v-icon>
    <span class="current-date">{{ currentDate }}</span>
    <span class="time-separator">•</span>
    <span class="current-time">{{ currentTime }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useBusinessDayStore } from '@/stores/businessDay';
import { getRealTodayDateString } from '@/utils/formatters';

const businessDayStore = useBusinessDayStore();

const currentDate = ref('');
const currentTime = ref('');
let timer = null;

function updateClock() {
  const now = new Date();
  currentDate.value = now.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
  currentTime.value = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  // Detect midnight calendar rollover while open and enforce previous-day closing check
  const realToday = getRealTodayDateString();
  if (businessDayStore.initialized && realToday !== businessDayStore.realToday && !businessDayStore.loading) {
    businessDayStore.refreshBusinessDay();
  }
}

onMounted(() => {
  updateClock();
  timer = setInterval(updateClock, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.current-time-badge {
  display: inline-flex;
  align-items: center;
  padding: 7px 18px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0.14) 100%);
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow:
    0 0 18px rgba(255, 255, 255, 0.42),
    0 0 6px rgba(255, 255, 255, 0.28),
    inset 0 1px 1px rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(6px);
  color: #ffffff;
  font-size: 0.84rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.current-date {
  font-weight: 600;
}

.time-separator {
  margin: 0 8px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 800;
}

.current-time {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}
</style>
