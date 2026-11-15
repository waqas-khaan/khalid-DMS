<template>
  <div class="app-date-range-picker-wrapper">
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
          :placeholder="placeholder || label || 'Select Date or Range'"
          :variant="variant"
          :density="density"
          :hide-details="hideDetails"
          :clearable="clearable && hasActiveFilter"
          prepend-inner-icon="mdi-calendar"
          readonly
          class="app-date-input"
          @click:clear="handleClear"
        />
      </template>

      <v-card class="calendar-card pa-3" elevation="8">
        <!-- MONTH PICKER VIEW (When title is clicked) -->
        <template v-if="showMonthGrid">
          <div class="d-flex align-center justify-space-between mb-2 px-1">
            <v-btn
              icon="mdi-chevron-left"
              size="x-small"
              variant="text"
              color="primary"
              title="Previous Year"
              @click="changeYear(-1)"
            />
            <div
              class="calendar-header-title d-flex align-center gap-1 cursor-pointer"
              title="Back to Days"
              @click="showMonthGrid = false"
            >
              <span>{{ viewYear }}</span>
              <v-icon size="16" color="primary">mdi-calendar-month</v-icon>
            </div>
            <v-btn
              icon="mdi-chevron-right"
              size="x-small"
              variant="text"
              color="primary"
              title="Next Year"
              @click="changeYear(1)"
            />
          </div>

          <div class="month-picker-grid mb-3">
            <button
              v-for="(mName, mIdx) in monthNamesShort"
              :key="mIdx"
              type="button"
              class="month-picker-cell"
              :class="{
                'month-picker-selected': isMonthSelected(mIdx),
                'month-picker-current': isCurrentMonth(mIdx),
              }"
              @click="selectMonth(mIdx)"
            >
              {{ mName }}
            </button>
          </div>

          <!-- Footer Actions for Month View -->
          <div class="d-flex align-center justify-space-between pt-2 border-t gap-2">
            <v-btn
              size="small"
              variant="tonal"
              color="primary"
              class="text-capitalize font-weight-bold"
              @click="selectThisMonth"
            >
              This Month
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              class="text-capitalize"
              @click="showMonthGrid = false"
            >
              Back to Days
            </v-btn>
          </div>
        </template>

        <!-- STANDARD CALENDAR VIEW (Image 2 Design) -->
        <template v-else>
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

            <div
              class="calendar-header-title cursor-pointer"
              title="Click to select month"
              @click="showMonthGrid = true"
            >
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
                'day-selected': isCellSelected(cell),
                'day-in-range': isCellInRange(cell),
              }"
              @click="selectDate(cell)"
            >
              {{ cell.day }}
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="d-flex align-center justify-space-between pt-2 border-t gap-2">
            <v-btn
              size="small"
              variant="tonal"
              color="primary"
              class="text-capitalize font-weight-bold"
              @click="selectToday"
            >
              Today
            </v-btn>

            <v-btn
              size="small"
              variant="text"
              class="text-capitalize text-grey-darken-3"
              @click="menu = false"
            >
              Close
            </v-btn>
          </div>
        </template>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ mode: 'all', from: '', to: '', date: '', month: '' }),
  },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  variant: { type: String, default: 'outlined' },
  density: { type: String, default: 'compact' },
  hideDetails: { type: [Boolean, String], default: true },
  clearable: { type: Boolean, default: true },
});

const emit = defineEmits(['update:modelValue', 'change']);

const menu = ref(false);
const showMonthGrid = ref(false);

const tempStartDate = ref('');
const tempEndDate = ref('');
const selectingRange = ref(false);

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayHeaders = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

const viewYear = ref(new Date().getFullYear());
const viewMonth = ref(new Date().getMonth());

// Sync internal dates from modelValue
watch(
  () => props.modelValue,
  (val) => {
    if (!val || val.mode === 'all') {
      tempStartDate.value = '';
      tempEndDate.value = '';
      selectingRange.value = false;
      return;
    }
    if (val.mode === 'month' && val.from) {
      tempStartDate.value = val.from;
      tempEndDate.value = val.to || val.from;
      syncView(val.from);
      return;
    }
    if (val.mode === 'single' || (val.date && !val.to)) {
      const d = val.date || val.from || '';
      tempStartDate.value = d;
      tempEndDate.value = d;
      if (d) syncView(d);
      return;
    }
    if (val.from || val.to) {
      tempStartDate.value = val.from || '';
      tempEndDate.value = val.to || '';
      if (val.from) syncView(val.from);
    }
  },
  { immediate: true, deep: true }
);

watch(menu, (open) => {
  if (open) {
    showMonthGrid.value = false;
    selectingRange.value = false;
    if (tempStartDate.value) {
      syncView(tempStartDate.value);
    }
  }
});

function syncView(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
  const [y, m] = dateStr.split('-').map(Number);
  viewYear.value = y;
  viewMonth.value = m - 1;
}

const todayDateStr = computed(() => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
});

const hasActiveFilter = computed(() => {
  if (!props.modelValue) return false;
  return Boolean(
    props.modelValue.mode === 'month' ||
    (props.modelValue.mode === 'single' && props.modelValue.date) ||
    (props.modelValue.mode === 'range' && (props.modelValue.from || props.modelValue.to)) ||
    props.modelValue.from ||
    props.modelValue.date
  );
});

const displayValue = computed(() => {
  if (!props.modelValue || props.modelValue.mode === 'all') {
    return '';
  }
  if (props.modelValue.mode === 'month' && props.modelValue.month) {
    return props.modelValue.month;
  }
  if (props.modelValue.mode === 'single' || (props.modelValue.date && !props.modelValue.to)) {
    const d = props.modelValue.date || props.modelValue.from;
    return d ? formatShortDate(d) : '';
  }
  if (props.modelValue.from && props.modelValue.to) {
    if (props.modelValue.from === props.modelValue.to) {
      return formatShortDate(props.modelValue.from);
    }
    return `${formatShortDate(props.modelValue.from)} – ${formatShortDate(props.modelValue.to)}`;
  }
  return '';
});

function formatShortDate(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr || '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const calendarCells = computed(() => {
  const y = viewYear.value;
  const m = viewMonth.value;

  const firstDayIndex = new Date(y, m, 1).getDay(); // 0 = Sun
  const daysInCurrentMonth = new Date(y, m + 1, 0).getDate();
  const daysInPrevMonth = new Date(y, m, 0).getDate();

  const cells = [];

  // Trailing previous month days
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
    });
  }

  // Current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({
      day,
      isCurrentMonth: true,
      dateStr,
      isToday: dateStr === todayDateStr.value,
    });
  }

  // Next month leading days (fill grid to multiple of 7)
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
    });
    nextDay++;
  }

  return cells;
});

function isCellSelected(cell) {
  if (!tempStartDate.value) return false;
  if (tempStartDate.value && tempEndDate.value) {
    return cell.dateStr === tempStartDate.value || cell.dateStr === tempEndDate.value;
  }
  return cell.dateStr === tempStartDate.value;
}

function isCellInRange(cell) {
  if (tempStartDate.value && tempEndDate.value && tempStartDate.value !== tempEndDate.value) {
    return cell.dateStr > tempStartDate.value && cell.dateStr < tempEndDate.value;
  }
  return false;
}

function selectDate(cell) {
  if (selectingRange.value && tempStartDate.value) {
    // 2nd click: completing the range
    let start = tempStartDate.value;
    let end = cell.dateStr;
    if (end < start) {
      const tmp = start;
      start = end;
      end = tmp;
    }
    tempStartDate.value = start;
    tempEndDate.value = end;
    selectingRange.value = false;

    if (start === end) {
      const result = {
        mode: 'single',
        date: start,
        from: start,
        to: start,
        month: '',
      };
      emit('update:modelValue', result);
      emit('change', result);
    } else {
      const result = {
        mode: 'range',
        from: start,
        to: end,
        date: '',
        month: '',
      };
      emit('update:modelValue', result);
      emit('change', result);
    }
  } else {
    // 1st click: starting new selection (single date)
    tempStartDate.value = cell.dateStr;
    tempEndDate.value = cell.dateStr;
    selectingRange.value = true;

    const result = {
      mode: 'single',
      date: cell.dateStr,
      from: cell.dateStr,
      to: cell.dateStr,
      month: '',
    };
    emit('update:modelValue', result);
    emit('change', result);
  }
}

function selectToday() {
  const today = todayDateStr.value;
  tempStartDate.value = today;
  tempEndDate.value = today;
  selectingRange.value = false;
  syncView(today);

  const result = {
    mode: 'single',
    date: today,
    from: today,
    to: today,
    month: '',
  };
  emit('update:modelValue', result);
  emit('change', result);
  menu.value = false;
}

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

function isMonthSelected(mIdx) {
  if (props.modelValue?.mode === 'month' && props.modelValue?.from) {
    const [y, m] = props.modelValue.from.split('-').map(Number);
    return viewYear.value === y && m - 1 === mIdx;
  }
  return false;
}

function isCurrentMonth(mIdx) {
  const now = new Date();
  return now.getFullYear() === viewYear.value && now.getMonth() === mIdx;
}

function selectMonth(mIdx) {
  const mNum = String(mIdx + 1).padStart(2, '0');
  const startStr = `${viewYear.value}-${mNum}-01`;
  const lastDay = new Date(viewYear.value, mIdx + 1, 0).getDate();
  const endStr = `${viewYear.value}-${mNum}-${String(lastDay).padStart(2, '0')}`;
  const monthLabel = `${monthNames[mIdx]} ${viewYear.value}`;

  tempStartDate.value = startStr;
  tempEndDate.value = endStr;
  selectingRange.value = false;
  showMonthGrid.value = false;

  const result = {
    mode: 'month',
    month: monthLabel,
    from: startStr,
    to: endStr,
    date: '',
  };
  emit('update:modelValue', result);
  emit('change', result);
  menu.value = false;
}

function selectThisMonth() {
  const now = new Date();
  viewYear.value = now.getFullYear();
  selectMonth(now.getMonth());
}

function handleClear() {
  tempStartDate.value = '';
  tempEndDate.value = '';
  selectingRange.value = false;
  const result = { mode: 'all', from: '', to: '', date: '', month: '' };
  emit('update:modelValue', result);
  emit('change', result);
  menu.value = false;
}
</script>

<style scoped>
.app-date-range-picker-wrapper {
  display: inline-block;
  width: 100%;
}

:deep(.app-date-input input) {
  cursor: pointer !important;
  font-size: 0.88rem !important;
  font-weight: 500 !important;
  letter-spacing: -0.2px !important;
  white-space: nowrap !important;
  text-overflow: clip !important;
  overflow: visible !important;
}

:deep(.app-date-input .v-field) {
  cursor: pointer !important;
}

:deep(.app-date-input .v-field__input) {
  padding-inline-start: 4px !important;
  padding-inline-end: 4px !important;
  overflow: visible !important;
}

:deep(.app-date-input .v-field__clearable) {
  margin-inline-end: 2px !important;
  padding: 0 !important;
}

:deep(.app-date-input .v-field__prepend-inner) {
  padding-inline-end: 4px !important;
}

/* Exact Image 2 Calendar Card Design */
.calendar-card {
  border-radius: 16px !important;
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 10px 30px rgba(6, 63, 120, 0.15) !important;
  box-sizing: border-box;
}

.calendar-header-title {
  font-weight: 700;
  font-size: 0.95rem;
  color: #063f78;
  letter-spacing: -0.2px;
  user-select: none;
}

.calendar-header-title:hover {
  opacity: 0.85;
}

.calendar-weekdays-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
}

.weekday-cell {
  font-size: 0.72rem;
  font-weight: 700;
  color: #78909c;
  text-transform: uppercase;
  padding: 4px 0;
  user-select: none;
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
  font-weight: 500;
  border-radius: 50%;
  cursor: pointer;
  color: #263238;
  transition: all 0.15s ease;
  user-select: none;
}

.day-cell:hover:not(.day-selected) {
  background-color: rgba(25, 118, 210, 0.12);
  color: #1976d2;
}

.day-other-month {
  color: #cfd8dc !important;
  font-weight: 400;
}

.day-today {
  border: 1.5px solid #1976d2;
  font-weight: 700;
}

.day-selected {
  background-color: #1976d2 !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.4);
}

.day-in-range {
  background-color: rgba(25, 118, 210, 0.15) !important;
  color: #1976d2 !important;
  border-radius: 6px !important;
}

/* Month Picker Grid */
.month-picker-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 4px 0;
}

.month-picker-cell {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.84rem;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  background-color: #ffffff;
  color: #263238;
  transition: all 0.15s ease;
}

.month-picker-cell:hover:not(.month-picker-selected) {
  background-color: rgba(25, 118, 210, 0.1);
  color: #1976d2;
  border-color: #90caf9;
}

.month-picker-selected {
  background-color: #1976d2 !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.4);
  border-color: #1976d2 !important;
}

.month-picker-current {
  border: 1.5px solid #1976d2;
  font-weight: 700;
}

/* High-visibility activator styling with perfect 36px vertical alignment */
.app-date-range-picker-wrapper {
  display: flex;
  align-items: center;
  height: 36px;
  width: 100%;
  min-width: 0;
}

.app-date-range-picker-wrapper :deep(.v-input) {
  margin: 0 !important;
  height: 36px !important;
  width: 100% !important;
  flex: 1 1 100% !important;
}

.app-date-range-picker-wrapper :deep(.v-input__control) {
  height: 36px !important;
  min-height: 36px !important;
  width: 100% !important;
}

.app-date-range-picker-wrapper :deep(.v-input__details) {
  display: none !important;
  height: 0 !important;
  min-height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
}

.app-date-input :deep(.v-field) {
  height: 36px !important;
  min-height: 36px !important;
  max-height: 36px !important;
  width: 100% !important;
  background-color: #ffffff !important;
  border-radius: 8px !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04) !important;
  display: flex !important;
  align-items: center !important;
  padding-left: 10px !important;
  padding-right: 8px !important;
}

.app-date-input :deep(.v-field__outline) {
  --v-field-border-width: 1.5px !important;
  --v-field-border-opacity: 1 !important;
  color: #cbd5e1 !important;
}

.app-date-input :deep(.v-field:hover .v-field__outline) {
  color: #0d47a1 !important;
}

.app-date-input :deep(.v-field--focused .v-field__outline) {
  color: #0d47a1 !important;
  box-shadow: 0 0 0 3px rgba(13, 71, 161, 0.15) !important;
}

.app-date-input :deep(.v-field__field) {
  height: 36px !important;
  min-height: 36px !important;
  display: flex !important;
  align-items: center !important;
  flex: 1 1 auto !important;
  min-width: 0 !important;
}

.app-date-input :deep(.v-field__input) {
  height: 36px !important;
  min-height: 36px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  padding-left: 6px !important;
  padding-right: 6px !important;
  font-size: 0.86rem !important;
  font-weight: 700 !important;
  color: #0f172a !important;
  display: flex !important;
  align-items: center !important;
  line-height: 36px !important;
  white-space: nowrap !important;
  overflow: visible !important;
  text-overflow: clip !important;
}

.app-date-input :deep(input) {
  width: 100% !important;
  white-space: nowrap !important;
  overflow: visible !important;
  text-overflow: clip !important;
}

.app-date-input :deep(.v-field__prepend-inner) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  height: 36px !important;
  display: flex !important;
  align-items: center !important;
}

.app-date-input :deep(.v-field__prepend-inner .v-icon) {
  color: #0d47a1 !important;
  opacity: 1 !important;
}

.app-date-input :deep(.v-field__clearable) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  height: 36px !important;
  display: flex !important;
  align-items: center !important;
}
</style>
