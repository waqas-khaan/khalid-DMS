<template>
  <div class="app-month-picker-wrapper">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      transition="scale-transition"
      offset="6"
      min-width="290"
      max-width="310"
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
          class="app-month-input"
          @click:clear="handleClear"
        />
      </template>

      <v-card class="calendar-card pa-3" elevation="8">
        <!-- Year Switcher -->
        <div class="d-flex align-center justify-space-between mb-3 px-1">
          <v-btn
            icon="mdi-chevron-left"
            size="small"
            variant="text"
            color="primary"
            title="Previous Year"
            @click="viewYear--"
          />

          <div class="month-header-year">
            {{ viewYear }}
          </div>

          <v-btn
            icon="mdi-chevron-right"
            size="small"
            variant="text"
            color="primary"
            title="Next Year"
            @click="viewYear++"
          />
        </div>

        <!-- 12 Months Grid -->
        <div class="months-grid mb-3">
          <div
            v-for="(m, idx) in monthList"
            :key="idx"
            class="month-cell"
            :class="{
              'month-selected': isSelectedMonth(idx),
              'month-current': isCurrentMonth(idx),
            }"
            @click="selectMonth(idx)"
          >
            {{ m }}
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="d-flex align-center justify-space-between pt-2 border-t">
          <v-btn
            size="small"
            variant="tonal"
            color="primary"
            class="text-capitalize font-weight-bold"
            @click="selectCurrentMonth"
          >
            This Month
          </v-btn>

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

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: 'Select Month' },
  variant: { type: String, default: 'outlined' },
  density: { type: String, default: 'compact' },
  hideDetails: { type: [Boolean, String], default: false },
  clearable: { type: Boolean, default: false },
  rules: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  prependInnerIcon: { type: String, default: 'mdi-calendar-month' },
});

const emit = defineEmits(['update:modelValue', 'change']);

const menu = ref(false);

const monthList = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const fullMonthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const viewYear = ref(new Date().getFullYear());

watch(
  () => props.modelValue,
  (val) => {
    if (val && /^\d{4}-\d{2}$/.test(val)) {
      const [y] = val.split('-').map(Number);
      viewYear.value = y;
    }
  },
  { immediate: true }
);

const displayValue = computed(() => {
  if (!props.modelValue) return '';
  const parts = props.modelValue.split('-');
  if (parts.length !== 2) return props.modelValue;
  const [y, m] = parts.map(Number);
  if (m < 1 || m > 12) return props.modelValue;
  return `${fullMonthNames[m - 1]} ${y}`;
});

function isSelectedMonth(idx) {
  if (!props.modelValue) return false;
  const target = `${viewYear.value}-${String(idx + 1).padStart(2, '0')}`;
  return props.modelValue === target;
}

function isCurrentMonth(idx) {
  const now = new Date();
  return now.getFullYear() === viewYear.value && now.getMonth() === idx;
}

function selectMonth(idx) {
  const val = `${viewYear.value}-${String(idx + 1).padStart(2, '0')}`;
  emit('update:modelValue', val);
  emit('change', val);
  menu.value = false;
}

function selectCurrentMonth() {
  const now = new Date();
  const val = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  emit('update:modelValue', val);
  emit('change', val);
  menu.value = false;
}

function handleClear() {
  emit('update:modelValue', '');
  emit('change', '');
}
</script>

<style scoped>
.app-month-picker-wrapper {
  display: inline-block;
  width: 100%;
}

:deep(.app-month-input input) {
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

:deep(.app-month-input .v-field) {
  cursor: pointer !important;
  background: #ffffff !important;
}

:deep(.app-month-input .v-field__outline) {
  color: #cbd5e1 !important;
}

:deep(.app-month-input .v-field__outline__start),
:deep(.app-month-input .v-field__outline__notch::before),
:deep(.app-month-input .v-field__outline__notch::after),
:deep(.app-month-input .v-field__outline__end) {
  border-color: #cbd5e1 !important;
}

:deep(.app-month-input .v-field--focused .v-field__outline) {
  color: #0284c7 !important;
}

:deep(.app-month-input .v-field--focused .v-field__outline__start),
:deep(.app-month-input .v-field--focused .v-field__outline__notch::before),
:deep(.app-month-input .v-field--focused .v-field__outline__notch::after),
:deep(.app-month-input .v-field--focused .v-field__outline__end) {
  border-color: #0284c7 !important;
}

:deep(.app-month-input .v-field-label),
:deep(.app-month-input .v-label) {
  color: #475569 !important;
  opacity: 1 !important;
  font-weight: 600 !important;
}

:deep(.app-month-input .v-field-label--floating),
:deep(.app-month-input .v-label--floating) {
  color: #0f172a !important;
  opacity: 1 !important;
  font-weight: 700 !important;
  font-size: 0.80rem !important;
}

:deep(.app-month-input .v-field--focused .v-field-label--floating) {
  color: #0284c7 !important;
}

:deep(.app-month-input .v-field__input) {
  padding-inline-start: 6px !important;
  padding-inline-end: 6px !important;
  overflow: visible !important;
  color: #0f172a !important;
}

:deep(.app-month-input .v-field__clearable) {
  margin-inline-end: 2px !important;
  padding: 0 !important;
}

:deep(.app-month-input .v-field__prepend-inner) {
  padding-inline-end: 8px !important;
}

:deep(.app-month-input .v-field__prepend-inner .v-icon) {
  color: #475569 !important;
  opacity: 1 !important;
}

.calendar-card {
  border-radius: 16px !important;
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  box-shadow: 0 10px 30px rgba(6, 63, 120, 0.15) !important;
}

.month-header-year {
  font-weight: 800;
  font-size: 1.15rem;
  color: #0f172a !important;
  letter-spacing: -0.3px;
}

.months-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.month-cell {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  color: #0f172a !important;
  background: #f8fafc;
  border: 1px solid #cbd5e1 !important;
  transition: all 0.15s ease;
  user-select: none;
}

.month-cell:hover:not(.month-selected) {
  background: rgba(2, 132, 199, 0.12);
  color: #0284c7;
  border-color: #0284c7;
}

.month-current {
  border: 1.5px solid #0284c7;
  color: #0284c7 !important;
  font-weight: 700;
}

.month-selected {
  background: #0284c7 !important;
  color: #ffffff !important;
  border-color: #0284c7 !important;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.35);
}
</style>

