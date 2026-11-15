<template>
  <div class="app-date-picker-wrapper">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      transition="scale-transition"
      offset="6"
      min-width="310"
      max-width="320"
    >
      <template v-slot:activator="{ props }">
        <v-text-field
          v-bind="props"
          :model-value="displayValue"
          :label="label"
          :variant="variant"
          :density="density"
          :hide-details="hideDetails"
          :rules="rules"
          :disabled="disabled"
          :clearable="clearable && !!modelValue"
          :prepend-inner-icon="prependInnerIcon"
          readonly
          class="app-date-input"
          @click:clear="handleClear"
        />
      </template>

      <v-card class="calendar-card pa-3" elevation="8">
        <!-- Header: Month & Year Switcher -->
        <div class="d-flex align-center justify-space-between mb-2 px-1">
          <div class="d-flex align-center">
            <v-btn
              icon="mdi-chevron-double-left"
              size="x-small"
              variant="text"
              color="primary"
              title="Previous Year"
              @click="changeYear(-1)"
            />
            <v-btn
              icon="mdi-chevron-left"
              size="x-small"
              variant="text"
              color="primary"
              title="Previous Month"
              @click="changeMonth(-1)"
            />
          </div>

          <div class="calendar-header-title">
            {{ monthNames[viewMonth] }} {{ viewYear }}
          </div>

          <div class="d-flex align-center">
            <v-btn
              icon="mdi-chevron-right"
              size="x-small"
              variant="text"
              color="primary"
              title="Next Month"
              @click="changeMonth(1)"
            />
            <v-btn
              icon="mdi-chevron-double-right"
              size="x-small"
              variant="text"
              color="primary"
              title="Next Year"
              @click="changeYear(1)"
            />
          </div>
        </div>

        <!-- Days of Week Header -->
        <div class="calendar-weekdays-row mb-1">
          <span v-for="d in dayHeaders" :key="d" class="weekday-cell">{{ d }}</span>
        </div>

        <!-- Days Grid -->
        <div class="calendar-days-grid mb-3">
          <div
            v-for="(cell, idx) in calendarCells"
            :key="idx"
            class="day-cell"
            :class="{
              'day-other-month': !cell.isCurrentMonth,
              'day-today': cell.isToday,
              'day-selected': cell.isSelected,
              'day-disabled': isDateDisabled(cell.dateStr),
            }"
            @click="selectDate(cell)"
          >
            {{ cell.day }}
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="d-flex align-center justify-space-between pt-2 border-t gap-2">
          <v-btn
            v-if="isBusinessDayLocked"
            size="small"
            variant="tonal"
            color="warning"
            class="text-capitalize font-weight-bold"
            @click="selectActiveBusinessDay"
          >
            Working Day ({{ formatShortDate(businessDayStore.activeBusinessDate) }})
          </v-btn>
          <v-btn
            v-else
            size="small"
            variant="tonal"
            color="primary"
            class="text-capitalize font-weight-bold"
            @click="selectToday"
          >
            Today
          </v-btn>

          <span
            v-if="isBusinessDayLocked"
            class="text-caption text-orange-darken-4 font-weight-medium"
            style="font-size: 0.7rem !important;"
          >
            Close {{ formatShortDate(businessDayStore.activeBusinessDate) }} first
          </span>

          <v-btn
            size="small"
            variant="text"
            class="text-capitalize"
            @click="menu = false"
          >
            Close
          </v-btn>
        </div>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useBusinessDayStore } from '@/stores/businessDay';

const businessDayStore = useBusinessDayStore();

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: 'Select Date' },
  variant: { type: String, default: 'outlined' },
  density: { type: String, default: 'compact' },
  hideDetails: { type: [Boolean, String], default: false },
  clearable: { type: Boolean, default: false },
  rules: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  min: { type: String, default: '' },
  max: { type: String, default: '' },
  enforceBusinessDay: { type: Boolean, default: true },
  prependInnerIcon: { type: String, default: 'mdi-calendar' },
  format: { type: String, default: 'full' }, // 'full' = 'November 11, 2026', 'short' = 'Nov 11, 2026'
});

const emit = defineEmits(['update:modelValue', 'change']);

const menu = ref(false);

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const shortMonthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];
const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Current viewing year and month in the calendar dialog
const viewYear = ref(new Date().getFullYear());
const viewMonth = ref(new Date().getMonth());

// Sync viewing month/year when modelValue changes or menu opens
watch(
  () => props.modelValue,
  (val) => {
    if (val && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [y, m] = val.split('-').map(Number);
      viewYear.value = y;
      viewMonth.value = m - 1;
    }
  },
  { immediate: true }
);

watch(menu, (open) => {
  if (open && props.modelValue && /^\d{4}-\d{2}-\d{2}$/.test(props.modelValue)) {
    const [y, m] = props.modelValue.split('-').map(Number);
    viewYear.value = y;
    viewMonth.value = m - 1;
  }
});

const todayDateStr = computed(() => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
});

const displayValue = computed(() => {
  if (!props.modelValue) return '';
  const parts = props.modelValue.split('-');
  if (parts.length !== 3) return props.modelValue;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d || m < 1 || m > 12) return props.modelValue;

  const monthStr = props.format === 'short' ? shortMonthNames[m - 1] : monthNames[m - 1];
  return `${monthStr} ${d}, ${y}`;
});

const calendarCells = computed(() => {
  const y = viewYear.value;
  const m = viewMonth.value;

  const firstDayIndex = new Date(y, m, 1).getDay(); // 0 = Sun
  const daysInCurrentMonth = new Date(y, m + 1, 0).getDate();
  const daysInPrevMonth = new Date(y, m, 0).getDate();

  const cells = [];

  // 1. Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonth = m === 0 ? 11 : m - 1;
    const prevYear = m === 0 ? y - 1 : y;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({
      day,
      isCurrentMonth: false,
      dateStr,
      isToday: dateStr === todayDateStr.value,
      isSelected: dateStr === props.modelValue,
    });
  }

  // 2. Current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({
      day,
      isCurrentMonth: true,
      dateStr,
      isToday: dateStr === todayDateStr.value,
      isSelected: dateStr === props.modelValue,
    });
  }

  // 3. Next month leading days (fill grid to multiple of 7)
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    const nextMonth = m === 11 ? 0 : m + 1;
    const nextYear = m === 11 ? y + 1 : y;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;
    cells.push({
      day: nextDay,
      isCurrentMonth: false,
      dateStr,
      isToday: dateStr === todayDateStr.value,
      isSelected: dateStr === props.modelValue,
    });
    nextDay++;
  }

  return cells;
});

function changeMonth(delta) {
  let m = viewMonth.value + delta;
  let y = viewYear.value;
  if (m < 0) {
    m = 11;
    y--;
  } else if (m > 11) {
    m = 0;
    y++;
  }
  viewMonth.value = m;
  viewYear.value = y;
}

function changeYear(delta) {
  viewYear.value += delta;
}

const isBusinessDayLocked = computed(() => {
  return props.enforceBusinessDay && businessDayStore.isLockedOnPreviousDay;
});

const effectiveMaxDate = computed(() => {
  if (!isBusinessDayLocked.value) return props.max || '';
  const lockDate = businessDayStore.activeBusinessDate;
  if (props.max && props.max < lockDate) return props.max;
  return lockDate;
});

function formatShortDate(dateStr) {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (isNaN(dt.getTime())) return dateStr;
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isDateDisabled(dateStr) {
  if (props.min && dateStr < props.min) return true;
  if (effectiveMaxDate.value && dateStr > effectiveMaxDate.value) return true;
  return false;
}

function selectDate(cell) {
  if (isDateDisabled(cell.dateStr)) return;
  emit('update:modelValue', cell.dateStr);
  emit('change', cell.dateStr);
  menu.value = false;
}

function selectToday() {
  const today = todayDateStr.value;
  if (isDateDisabled(today)) return;
  emit('update:modelValue', today);
  emit('change', today);
  menu.value = false;
}

function selectActiveBusinessDay() {
  const target = businessDayStore.activeBusinessDate;
  if (!target) return;
  emit('update:modelValue', target);
  emit('change', target);
  menu.value = false;
}

function handleClear() {
  emit('update:modelValue', '');
  emit('change', '');
}
</script>

<style scoped>
.app-date-picker-wrapper {
  display: inline-block;
  width: 100%;
}

:deep(.app-date-input input) {
  cursor: pointer !important;
  font-size: 0.88rem !important;
  font-weight: 600 !important;
  color: #0f172a !important;
  letter-spacing: normal !important;
  white-space: nowrap !important;
  text-overflow: clip !important;
  overflow: visible !important;
  opacity: 1 !important;
}

:deep(.app-date-input .v-field) {
  cursor: pointer !important;
  background: #ffffff !important;
}

:deep(.app-date-input .v-field-label),
:deep(.app-date-input .v-label) {
  color: #475569 !important;
  opacity: 1 !important;
  font-weight: 600 !important;
}

:deep(.app-date-input .v-field-label--floating),
:deep(.app-date-input .v-label--floating) {
  color: #0f172a !important;
  opacity: 1 !important;
  font-weight: 700 !important;
  font-size: 0.80rem !important;
}

:deep(.app-date-input .v-field--focused .v-field-label--floating) {
  color: #0284c7 !important;
}

:deep(.app-date-input .v-field__input) {
  padding-inline-start: 6px !important;
  padding-inline-end: 6px !important;
  overflow: visible !important;
  color: #0f172a !important;
}

:deep(.app-date-input .v-field__clearable) {
  margin-inline-end: 2px !important;
  padding: 0 !important;
}

:deep(.app-date-input .v-field__prepend-inner) {
  padding-inline-end: 8px !important;
}

:deep(.app-date-input .v-field__prepend-inner .v-icon) {
  color: #475569 !important;
  opacity: 1 !important;
}

.calendar-card {
  border-radius: 16px !important;
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  box-shadow: 0 10px 30px rgba(6, 63, 120, 0.15) !important;
}

.calendar-header-title {
  font-weight: 700;
  font-size: 0.95rem;
  color: #0f172a !important;
  letter-spacing: -0.2px;
}

.calendar-weekdays-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
}

.weekday-cell {
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569 !important;
  text-transform: uppercase;
  padding: 4px 0;
}

.calendar-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
}

.day-cell {
  width: 36px;
  height: 36px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 50%;
  cursor: pointer;
  color: #0f172a !important;
  transition: all 0.15s ease;
  user-select: none;
}

.day-cell:hover:not(.day-selected):not(.day-disabled) {
  background-color: rgba(2, 132, 199, 0.12);
  color: #0284c7;
}

.day-other-month {
  color: #94a3b8 !important;
  font-weight: 400;
}

.day-today {
  border: 1.5px solid #0284c7;
  font-weight: 700;
  color: #0284c7 !important;
}

.day-selected {
  background-color: #0284c7 !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
}

.day-disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}
</style>

