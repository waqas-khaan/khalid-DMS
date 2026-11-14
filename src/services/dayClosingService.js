import { storageAdapter } from './storageAdapter';
import { statsService } from './statsService';
import { getRealTodayDateString } from '../utils/formatters';
import { computeBusinessDayState, buildDayClosingInspection, buildDayLedgerRows } from '../utils/dayClosing';

function buildClosingDocId(date) {
  return `close_${date}`;
}

export const dayClosingService = {
  async getClosings() {
    const list = await storageAdapter.getCollection('dayClosings', [], 'date', 'desc');
    return list;
  },

  async getClosingByDate(date) {
    if (!date) return null;
    return await storageAdapter.getDoc('dayClosings', buildClosingDocId(date));
  },

  async getBusinessDaySnapshot(realToday = getRealTodayDateString()) {
    const [closings, dispatches, arrivals, expenses, attendance] = await Promise.all([
      storageAdapter.getCollection('dayClosings'),
      storageAdapter.getCollection('dispatches'),
      storageAdapter.getCollection('milkArrivals'),
      storageAdapter.getCollection('expenses'),
      storageAdapter.getCollection('attendance'),
    ]);

    return computeBusinessDayState({
      realToday,
      closings,
      dispatches,
      arrivals,
      expenses,
      attendance,
    });
  },

  async getDayLedgerRows(realToday = getRealTodayDateString()) {
    const [closings, dispatches, arrivals, expenses, attendance, shops] = await Promise.all([
      storageAdapter.getCollection('dayClosings'),
      storageAdapter.getCollection('dispatches'),
      storageAdapter.getCollection('milkArrivals'),
      storageAdapter.getCollection('expenses'),
      storageAdapter.getCollection('attendance'),
      storageAdapter.getCollection('shops'),
    ]);

    return buildDayLedgerRows({
      realToday,
      closings,
      dispatches,
      arrivals,
      expenses,
      attendance,
      shops,
    });
  },

  async inspectDayStatus(date) {
    if (!date) return null;
    const dateFilter = [{ field: 'date', operator: '==', value: date }];

    const [closing, dispatches, arrivals, expenses, attendance, shops] = await Promise.all([
      this.getClosingByDate(date),
      storageAdapter.getCollection('dispatches', dateFilter),
      storageAdapter.getCollection('milkArrivals', dateFilter),
      storageAdapter.getCollection('expenses', dateFilter),
      storageAdapter.getCollection('attendance', dateFilter),
      storageAdapter.getCollection('shops'),
    ]);

    const dispatchesWithItems = await Promise.all(
      dispatches.map(async (d) => {
        const items = await storageAdapter.getSubcollection('dispatches', d.id, 'items');
        return { ...d, items: items || [] };
      })
    );

    return buildDayClosingInspection({
      date,
      closing,
      dispatches: dispatchesWithItems,
      arrivals,
      expenses,
      attendance,
      shops,
    });
  },

  async closeDay(date, {
    closedBy = 'Admin',
    remarks = '',
    allocationType = 'cash',
    remainingAmount = null,
    cashAmount = 0,
    bankAmount = 0,
    bankName = '',
    bankRef = '',
  } = {}) {
    if (!date) throw new Error('Date is required to close day.');

    const inspection = await this.inspectDayStatus(date);
    if (inspection.isClosed) {
      throw new Error(`Day ${date} is already closed.`);
    }

    if (inspection.summary.arrivalsCount === 0 && inspection.summary.dispatchesCount === 0) {
      throw new Error(
        `Cannot close ${date}: No milk arrival entries recorded. Working day must be opened from Milk Arrival first.`
      );
    }

    if (inspection.pendingDispatches.length > 0) {
      throw new Error(
        `Cannot close ${date}: ${inspection.pendingDispatches.length} dispatch(es) are still DISPATCHED. Mark Back all deliveries first.`
      );
    }

    await statsService.refreshDailyStats(date);

    const netAmount =
      remainingAmount !== null && remainingAmount !== undefined
        ? Number(remainingAmount)
        : Number(inspection.summary.netCashFlow) || 0;

    const payload = {
      date,
      status: 'Closed',
      closedAt: new Date().toISOString(),
      closedBy,
      remarks: (remarks || '').trim(),
      summary: inspection.summary,
      allocation: {
        type: allocationType || 'cash',
        remainingAmount: netAmount,
        cashAmount: Number(cashAmount) || 0,
        bankAmount: Number(bankAmount) || 0,
        bankName: (bankName || '').trim(),
        bankRef: (bankRef || '').trim(),
      },
    };

    return await storageAdapter.setDoc('dayClosings', buildClosingDocId(date), payload, true);
  },

  async reopenDay(date, { reopenedBy = 'Admin' } = {}) {
    if (!date) throw new Error('Date is required to reopen day.');
    const docId = buildClosingDocId(date);
    const existing = await storageAdapter.getDoc('dayClosings', docId);
    if (!existing || existing.status !== 'Closed') {
      throw new Error(`Day ${date} is not currently closed.`);
    }
    return await storageAdapter.updateDoc('dayClosings', docId, {
      status: 'Reopened',
      reopenedAt: new Date().toISOString(),
      reopenedBy,
    });
  },

  async deleteClosing(date) {
    if (!date) throw new Error('Date is required to delete closing record.');
    const dateFilter = [{ field: 'date', operator: '==', value: date }];

    const [dispatches, arrivals, expenses, attendance] = await Promise.all([
      storageAdapter.getCollection('dispatches', dateFilter),
      storageAdapter.getCollection('milkArrivals', dateFilter),
      storageAdapter.getCollection('expenses', dateFilter),
      storageAdapter.getCollection('attendance', dateFilter),
    ]);

    const deletes = [
      storageAdapter.deleteDoc('dayClosings', buildClosingDocId(date)),
      ...dispatches.map((d) => storageAdapter.deleteDoc('dispatches', d.id)),
      ...arrivals.map((a) => storageAdapter.deleteDoc('milkArrivals', a.id)),
      ...expenses.map((e) => storageAdapter.deleteDoc('expenses', e.id)),
      ...attendance.map((att) => storageAdapter.deleteDoc('attendance', att.id)),
    ];

    await Promise.all(deletes);
    await Promise.all([
      statsService.refreshDailyStats(date),
      statsService.refreshMonthlyStats(date.substring(0, 7)),
    ]);
    return true;
  },
};

