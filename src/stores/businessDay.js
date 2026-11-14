import { defineStore } from 'pinia';
import { dayClosingService } from '../services/dayClosingService';
import { formatDate, getRealTodayDateString } from '../utils/formatters';
import { validateOperationalDate } from '../utils/dayClosing';

export const useBusinessDayStore = defineStore('businessDay', {
  state: () => ({
    realToday: getRealTodayDateString(),
    activeBusinessDate: getRealTodayDateString(),
    earliestUnclosedDate: null,
    unclosedPreviousDates: [],
    pendingDispatchesCount: 0,
    isActiveDayClosed: false,
    closedDates: [],
    closings: [],
    ledgerRows: [],
    initialized: false,
    loading: false,
  }),

  getters: {
    isLockedOnPreviousDay: (state) => Boolean(state.earliestUnclosedDate),
    maxAllowedDate: (state) => state.earliestUnclosedDate || state.realToday,
    lockReason: (state) => {
      if (!state.earliestUnclosedDate) return '';
      const prevLabel = formatDate(state.earliestUnclosedDate);
      const todayLabel = formatDate(state.realToday);
      if (state.pendingDispatchesCount > 0) {
        return `Previous day (${prevLabel}) has ${state.pendingDispatchesCount} unreturned dispatch(es) and is not closed. Cannot move forward to ${todayLabel}.`;
      }
      return `Previous day (${prevLabel}) is not closed yet. Close ${prevLabel} before moving forward to ${todayLabel}.`;
    },
  },

  actions: {
    async refreshBusinessDay() {
      this.loading = true;
      try {
        const realToday = getRealTodayDateString();
        const [snapshot, closingsList, ledgerList] = await Promise.all([
          dayClosingService.getBusinessDaySnapshot(realToday),
          dayClosingService.getClosings(),
          dayClosingService.getDayLedgerRows(realToday),
        ]);

        this.realToday = snapshot.realToday;
        this.activeBusinessDate = snapshot.activeBusinessDate;
        this.earliestUnclosedDate = snapshot.earliestUnclosedDate;
        this.unclosedPreviousDates = snapshot.unclosedPreviousDates;
        this.pendingDispatchesCount = snapshot.pendingDispatchesCount;
        this.isActiveDayClosed = snapshot.isActiveDayClosed;
        this.closedDates = snapshot.closedDates;
        this.closings = closingsList;
        this.ledgerRows = ledgerList;
        this.initialized = true;
        return snapshot;
      } finally {
        this.loading = false;
      }
    },

    validateOperationDate(dateStr) {
      return validateOperationalDate({
        dateStr,
        activeBusinessDate: this.activeBusinessDate,
        isLockedOnPreviousDay: this.isLockedOnPreviousDay,
        closedDates: this.closedDates,
        formatDateFn: formatDate,
      });
    },

    async closeDay(date, options = {}) {
      const saved = await dayClosingService.closeDay(date, options);
      await this.refreshBusinessDay();
      return saved;
    },

    async reopenDay(date, options = {}) {
      const updated = await dayClosingService.reopenDay(date, options);
      await this.refreshBusinessDay();
      return updated;
    },

    async deleteClosing(date) {
      const removed = await dayClosingService.deleteClosing(date);
      await this.refreshBusinessDay();
      return removed;
    },
  },
});

