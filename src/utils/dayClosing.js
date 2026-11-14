const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(val) {
  return typeof val === 'string' && DATE_REGEX.test(val);
}

/**
 * Computes active working day and any unclosed previous dates.
 * Any operational date strictly before `realToday` that lacks a `'Closed'` record
 * prevents advancing the working date forward.
 */
export function computeBusinessDayState({
  realToday,
  closings = [],
  dispatches = [],
  arrivals = [],
  expenses = [],
  attendance = [],
}) {
  const closedDates = closings
    .filter((c) => c && c.status === 'Closed' && isValidIsoDate(c.date))
    .map((c) => c.date);
  const closedSet = new Set(closedDates);

  const activityDates = new Set();
  const collectPastDate = (item) => {
    if (item && isValidIsoDate(item.date) && item.date < realToday) {
      activityDates.add(item.date);
    }
  };

  dispatches.forEach(collectPastDate);
  arrivals.forEach(collectPastDate);
  expenses.forEach(collectPastDate);
  attendance.forEach(collectPastDate);

  const unclosedPreviousDates = Array.from(activityDates)
    .filter((d) => !closedSet.has(d))
    .sort((a, b) => a.localeCompare(b));

  const earliestUnclosedDate = unclosedPreviousDates.length > 0 ? unclosedPreviousDates[0] : null;
  const activeBusinessDate = earliestUnclosedDate || realToday;

  const pendingDispatchesOnActiveDate = dispatches.filter(
    (d) => d && d.date === activeBusinessDate && d.status === 'Dispatched'
  );

  return {
    realToday,
    activeBusinessDate,
    earliestUnclosedDate,
    unclosedPreviousDates,
    pendingDispatchesCount: pendingDispatchesOnActiveDate.length,
    isPreviousDayUnclosed: Boolean(earliestUnclosedDate),
    isActiveDayClosed: closedSet.has(activeBusinessDate),
    closedDates: Array.from(closedSet),
  };
}

/**
 * Aggregates full checklist & financial summary for a given day closing candidate.
 */
export function buildDayClosingInspection({
  date,
  closing = null,
  dispatches = [],
  arrivals = [],
  expenses = [],
  attendance = [],
  shops = [],
}) {
  const pendingDispatches = dispatches.filter((d) => d.status === 'Dispatched');
  const returnedDispatches = dispatches.filter((d) => d.status !== 'Dispatched');

  let totalCansDispatched = 0;
  let milkDispatchedKg = 0;
  let milkReturnedKg = 0;
  let totalDispatchAmount = 0;
  let totalCollection = 0;

  for (const d of dispatches) {
    totalCansDispatched += Number(d.totalCans) || 0;
    milkDispatchedKg += Number(d.totalMilk) || 0;
    milkReturnedKg += Number(d.totalReturnMilk) || 0;
    totalDispatchAmount += Number(d.totalAmount) || 0;
    totalCollection += Number(d.totalCollection) || 0;
  }

  let milkReceivedKg = 0;
  let milkReceivedLiters = 0;
  for (const a of arrivals) {
    milkReceivedKg += Number(a.quantityKg) || 0;
    milkReceivedLiters += Number(a.quantityLiters) || 0;
  }

  let totalExpenses = 0;
  for (const e of expenses) {
    totalExpenses += Number(e.amount) || 0;
  }

  const totalShopArrears = shops.reduce((sum, s) => sum + (Number(s.currentArrears) || 0), 0);
  const presentCount = attendance.filter((a) => a.status === 'Present').length;
  const absentCount = attendance.filter((a) => a.status === 'Absent').length;
  const isClosed = closing?.status === 'Closed';
  const hasArrivals = arrivals.length > 0;
  const isDayOpened = hasArrivals;

  return {
    date,
    closing,
    isClosed,
    isDayOpened,
    hasArrivals,
    canClose:
      !isClosed &&
      (hasArrivals || dispatches.length > 0) &&
      pendingDispatches.length === 0,
    hasActivity:
      dispatches.length + arrivals.length + expenses.length + attendance.length > 0,
    dispatches,
    pendingDispatches,
    returnedDispatches,
    summary: {
      date,
      dispatchesCount: dispatches.length,
      pendingDispatchCount: pendingDispatches.length,
      returnedDispatchCount: returnedDispatches.length,
      totalCansDispatched,
      milkDispatchedKg: Number(milkDispatchedKg.toFixed(2)),
      milkReturnedKg: Number(milkReturnedKg.toFixed(2)),
      totalDispatchAmount: Number(totalDispatchAmount.toFixed(2)),
      totalCollection: Number(totalCollection.toFixed(2)),
      arrivalsCount: arrivals.length,
      milkReceivedKg: Number(milkReceivedKg.toFixed(2)),
      milkReceivedLiters: Number(milkReceivedLiters.toFixed(2)),
      expensesCount: expenses.length,
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netCashFlow: Number((totalCollection - totalExpenses).toFixed(2)),
      totalShopArrears: Number(totalShopArrears.toFixed(2)),
      attendanceCount: attendance.length,
      presentCount,
      absentCount,
    },
  };
}

/**
 * Builds unified ledger rows containing ALL pending/unclosed days and closed days,
 * sorted so unclosed previous days appear first at the top for immediate resolution.
 */
export function buildDayLedgerRows({
  realToday,
  closings = [],
  dispatches = [],
  arrivals = [],
  expenses = [],
  attendance = [],
  shops = [],
}) {
  const byDate = (list) => {
    const map = new Map();
    for (const item of list) {
      if (!item || !isValidIsoDate(item.date)) continue;
      if (!map.has(item.date)) map.set(item.date, []);
      map.get(item.date).push(item);
    }
    return map;
  };

  const closingsByDate = new Map();
  for (const c of closings) {
    if (c && isValidIsoDate(c.date)) {
      closingsByDate.set(c.date, c);
    }
  }

  const dispatchesByDate = byDate(dispatches);
  const arrivalsByDate = byDate(arrivals);
  const expensesByDate = byDate(expenses);
  const attendanceByDate = byDate(attendance);

  const allDates = new Set([
    ...closingsByDate.keys(),
    ...dispatchesByDate.keys(),
    ...arrivalsByDate.keys(),
    ...expensesByDate.keys(),
    ...attendanceByDate.keys(),
  ]);

  const rows = [];
  for (const date of allDates) {
    const closing = closingsByDate.get(date) || null;
    const inspection = buildDayClosingInspection({
      date,
      closing,
      dispatches: dispatchesByDate.get(date) || [],
      arrivals: arrivalsByDate.get(date) || [],
      expenses: expensesByDate.get(date) || [],
      attendance: attendanceByDate.get(date) || [],
      shops,
    });

    const isPreviousUnclosed = !inspection.isClosed && date < realToday && inspection.hasActivity;
    let ledgerStatus = 'Open';
    if (inspection.isClosed) {
      ledgerStatus = 'Closed';
    } else if (inspection.pendingDispatches.length > 0) {
      ledgerStatus = 'PendingReturn';
    } else if (isPreviousUnclosed) {
      ledgerStatus = 'PendingClose';
    }

    // A working day is opened once milk arrival has been recorded.
    // Display in ledger if:
    // 1) Finalized closed day
    // 2) Opened from Milk Arrival (arrivals exist)
    // 3) Historical unclosed day with past activity (must be resolved)
    const isOpenedFromMilkArrival = (arrivalsByDate.get(date) || []).length > 0;
    const shouldDisplayInLedger =
      inspection.isClosed ||
      isOpenedFromMilkArrival ||
      isPreviousUnclosed;

    if (shouldDisplayInLedger) {
      rows.push({
        ...inspection,
        ledgerStatus,
        isPreviousUnclosed,
      });
    }
  }

  // Sort: Pending unclosed days first (oldest blocking first), then remaining dates newest first
  rows.sort((a, b) => {
    const aPending = a.isPreviousUnclosed ? 0 : (a.isClosed ? 2 : 1);
    const bPending = b.isPreviousUnclosed ? 0 : (b.isClosed ? 2 : 1);
    if (aPending !== bPending) return aPending - bPending;
    if (aPending === 0) return a.date.localeCompare(b.date);
    return b.date.localeCompare(a.date);
  });

  return rows;
}

/**
 * Guards entry/edit dates against unclosed previous days and already closed days.
 */
export function validateOperationalDate({
  dateStr,
  activeBusinessDate,
  isLockedOnPreviousDay,
  closedDates = [],
  formatDateFn = (d) => d,
}) {
  if (!isValidIsoDate(dateStr)) {
    return { valid: false, message: 'Please select a valid date.' };
  }

  if (closedDates.includes(dateStr)) {
    return {
      valid: false,
      message: `${formatDateFn(dateStr)} is closed. An Admin must reopen it in Day Closing before modifying entries.`,
    };
  }

  if (isLockedOnPreviousDay && dateStr > activeBusinessDate) {
    return {
      valid: false,
      message: `Previous day (${formatDateFn(activeBusinessDate)}) is not closed. Close ${formatDateFn(activeBusinessDate)} before moving forward to ${formatDateFn(dateStr)}.`,
    };
  }

  return { valid: true, message: '' };
}

