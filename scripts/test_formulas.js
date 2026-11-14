import {
  convertLiterToKg,
  convertKgToLiter,
  calculateAttendanceAndSalary,
  calculateDispatchRow,
  convertCanToKg,
  calculateCanAmount,
  calculateAvailableCash,
} from '../src/utils/calculations.js';
import {
  computeBusinessDayState,
  buildDayClosingInspection,
  buildDayLedgerRows,
  validateOperationalDate,
} from '../src/utils/dayClosing.js';

console.log('--- TEST 1: Liter to Kg Conversion ---');
const factor = 1.03;
const liters = 500;
const kg = convertLiterToKg(liters, factor);
console.log(`${liters} Liters = ${kg} Kg (Expected: 515.00)`);
if (kg !== 515.00) throw new Error('Liter conversion failed');

const backToLiters = convertKgToLiter(515, factor);
console.log(`515 Kg = ${backToLiters} Liters (Expected: 500.00)`);
if (backToLiters !== 500.00) throw new Error('Kg conversion failed');

console.log('\n--- TEST 2: Attendance & Salary Rules ---');
// Scenario A: 2 absences (within allowance, no deduction)
const resA = calculateAttendanceAndSalary({
  monthlySalary: 30000,
  totalDaysInMonth: 30,
  absents: 2,
  advancesTotal: 0,
});
console.log('Scenario A (2 absents):', resA);
if (resA.deductibleDays !== 0 || resA.payCut !== 0 || resA.netPayable !== 30000) {
  throw new Error('Allowance of 2 free absences failed');
}

// Scenario B: 4 absences, 3000 advance
// perDay = 30000 / 30 = 1000
// deductibleDays = 4 - 2 = 2
// payCut = 2 * 1000 = 2000
// netPayable = 30000 - 2000 - 3000 = 25000
const resB = calculateAttendanceAndSalary({
  monthlySalary: 30000,
  totalDaysInMonth: 30,
  absents: 4,
  advancesTotal: 3000,
});
console.log('Scenario B (4 absents, 3000 advance):', resB);
if (resB.perDaySalary !== 1000 || resB.deductibleDays !== 2 || resB.payCut !== 2000 || resB.netPayable !== 25000) {
  throw new Error('Salary pay cut or advance deduction failed');
}

console.log('\n--- TEST 3: Shop Dispatch Row & Arrears ---');
// Price: 180, Milk: 50 Kg
// Today Amount = 50 * 180 = 9000
// Previous Arrears = 15000
// Total Payable = 15000 + 9000 = 24000
// Today Collection = 10000
// New Arrears = 24000 - 10000 = 14000
const row = calculateDispatchRow({
  price: 180,
  todayMilk: 50,
  previousArrears: 15000,
  todayCollection: 10000,
});
console.log('Dispatch row calculation:', row);
if (row.todayAmount !== 9000 || row.totalPayable !== 24000 || row.newArrears !== 14000) {
  throw new Error('Dispatch row calculation failed');
}

console.log('\n--- TEST 4: 1 Can = 50 Kg & Master Milk Price ---');
const oneCanKg = convertCanToKg(1, 50);
const twoCansKg = convertCanToKg(2, 50);
const oneCanAmountAt180 = calculateCanAmount(1, 180, 50);
const twoCansAmountAt200 = calculateCanAmount(2, 200, 50);
console.log({ oneCanKg, twoCansKg, oneCanAmountAt180, twoCansAmountAt200 });
if (oneCanKg !== 50 || twoCansKg !== 100 || oneCanAmountAt180 !== 9000 || twoCansAmountAt200 !== 20000) {
  throw new Error('Can to Kg / Price calculation failed');
}

console.log('\n--- TEST 5: Previous Day Closing & Forward-Date Lock ---');
const sampleDispatches = [
  { id: 'd1', date: '2026-11-11', status: 'Returned', totalMilk: 100, totalAmount: 18000, totalCollection: 15000 },
  { id: 'd2', date: '2026-11-11', status: 'Dispatched', totalMilk: 0, totalAmount: 0, totalCollection: 0 },
];
const lockedState = computeBusinessDayState({
  realToday: '2026-11-12',
  closings: [{ date: '2026-11-10', status: 'Closed' }],
  dispatches: sampleDispatches,
});
console.log('Locked State:', lockedState);
if (
  !lockedState.isPreviousDayUnclosed ||
  lockedState.activeBusinessDate !== '2026-11-11' ||
  lockedState.pendingDispatchesCount !== 1
) {
  throw new Error('Expected activeBusinessDate to stay locked on 2026-11-11 when unclosed');
}

const blockedForward = validateOperationalDate({
  dateStr: '2026-11-12',
  activeBusinessDate: lockedState.activeBusinessDate,
  isLockedOnPreviousDay: lockedState.isPreviousDayUnclosed,
  closedDates: lockedState.closedDates,
});
const allowedPendingDay = validateOperationalDate({
  dateStr: '2026-11-11',
  activeBusinessDate: lockedState.activeBusinessDate,
  isLockedOnPreviousDay: lockedState.isPreviousDayUnclosed,
  closedDates: lockedState.closedDates,
});
if (blockedForward.valid || !allowedPendingDay.valid) {
  throw new Error('Forward date should be blocked while 2026-11-11 remains open');
}

const openInspect = buildDayClosingInspection({ date: '2026-11-11', dispatches: sampleDispatches });
if (openInspect.canClose) {
  throw new Error('Day must not close while a dispatch is still Dispatched');
}

const settledDispatches = sampleDispatches.map((d) => ({ ...d, status: 'Returned' }));
const readyInspect = buildDayClosingInspection({ date: '2026-11-11', dispatches: settledDispatches });
if (!readyInspect.canClose) {
  throw new Error('Day should be closable once all dispatches are Returned');
}

const unlockedState = computeBusinessDayState({
  realToday: '2026-11-12',
  closings: [
    { date: '2026-11-10', status: 'Closed' },
    { date: '2026-11-11', status: 'Closed' },
  ],
  dispatches: settledDispatches,
});
console.log('Unlocked State:', unlockedState);
if (unlockedState.isPreviousDayUnclosed || unlockedState.activeBusinessDate !== '2026-11-12') {
  throw new Error('Expected system to advance to 2026-11-12 once 2026-11-11 is Closed');
}

const allowedToday = validateOperationalDate({
  dateStr: '2026-11-12',
  activeBusinessDate: unlockedState.activeBusinessDate,
  isLockedOnPreviousDay: unlockedState.isPreviousDayUnclosed,
  closedDates: unlockedState.closedDates,
});
const blockedClosedPast = validateOperationalDate({
  dateStr: '2026-11-11',
  activeBusinessDate: unlockedState.activeBusinessDate,
  isLockedOnPreviousDay: unlockedState.isPreviousDayUnclosed,
  closedDates: unlockedState.closedDates,
});
if (!allowedToday.valid || blockedClosedPast.valid) {
  throw new Error('2026-11-12 should be allowed and closed 2026-11-11 should be protected');
}

const ledgerRows = buildDayLedgerRows({
  realToday: '2026-11-12',
  closings: [],
  dispatches: sampleDispatches,
});
console.log(
  'Ledger rows (0 closings):',
  ledgerRows.map((r) => ({ date: r.date, status: r.ledgerStatus, pending: r.summary.pendingDispatchCount }))
);
if (
  ledgerRows.length < 2 ||
  ledgerRows[0].date !== '2026-11-11' ||
  ledgerRows[0].ledgerStatus !== 'PendingReturn' ||
  ledgerRows[0].summary.pendingDispatchCount !== 1
) {
  throw new Error('Expected pending day 2026-11-11 to appear first in Day Closing ledger even when 0 days closed');
}

console.log('\n--- TEST 6: Daily Available Cash Calculation ---');
const cashRemaining = calculateAvailableCash({
  openingCash: 50000,
  totalIncome: 15000,
  totalExpenses: 4000,
  advancesPaid: 3000,
  salariesPaid: 28499.99,
});
console.log('Available Cash remaining:', cashRemaining, '(Expected: 29500.01)');
if (cashRemaining !== 29500.01) {
  throw new Error('Available cash calculation failed');
}

console.log('\n>>> ALL FORMULAS PASSED SUCCESSFULLY! <<<');

