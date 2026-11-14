/**
 * Dairy Business Management Calculations
 */

/**
 * Convert liters to kilograms using factor (default 1.03)
 */
export function convertLiterToKg(liters, factor = 1.03) {
  const val = Number(liters) || 0;
  return Number((val * factor).toFixed(2));
}

/**
 * Convert kilograms to liters using factor (default 1.03)
 */
export function convertKgToLiter(kg, factor = 1.03) {
  const val = Number(kg) || 0;
  if (!factor) return val;
  return Number((val / factor).toFixed(2));
}

/**
 * Employee Salary & Attendance Calculation
 * Rules:
 * - 2 absences per month allowed without cut
 * - per-day salary = monthlySalary / totalDaysInMonth
 * - deductibleDays = max(0, absents - 2)
 * - payCut = deductibleDays * perDay
 * - netPayable = salary - payCut - advances
 */
export function calculateAttendanceAndSalary({
  monthlySalary = 0,
  totalDaysInMonth = 30,
  absents = 0,
  advancesTotal = 0,
  allowedFreeAbsents = 2,
}) {
  const salary = Number(monthlySalary) || 0;
  const days = Number(totalDaysInMonth) || 30;
  const absentDays = Number(absents) || 0;
  const advances = Number(advancesTotal) || 0;

  const perDaySalary = days > 0 ? Number((salary / days).toFixed(2)) : 0;
  const deductibleDays = Math.max(0, absentDays - allowedFreeAbsents);
  const payCut = Number((deductibleDays * perDaySalary).toFixed(2));
  const netPayable = Math.max(0, Number((salary - payCut - advances).toFixed(2)));

  return {
    monthlySalary: salary,
    totalDaysInMonth: days,
    absents: absentDays,
    allowedFreeAbsents,
    deductibleDays,
    perDaySalary,
    payCut,
    advancesTotal: advances,
    netPayable,
  };
}

/**
 * Shop Milk Dispatch Row Calculation
 * - Today Amount = todayMilk * price
 * - Total Payable = Previous Arrears + Today Amount
 * - New Arrears = Total Payable - Today Collection
 */
export function calculateDispatchRow({
  price = 0,
  todayMilk = 0,
  previousArrears = 0,
  todayCollection = 0,
}) {
  const p = Number(price) || 0;
  const milk = Number(todayMilk) || 0;
  const prevArrears = Number(previousArrears) || 0;
  const collection = Number(todayCollection) || 0;

  const todayAmount = Number((milk * p).toFixed(2));
  const totalPayable = Number((prevArrears + todayAmount).toFixed(2));
  const newArrears = Number((totalPayable - collection).toFixed(2));

  return {
    price: p,
    todayMilk: milk,
    todayAmount,
    previousArrears: prevArrears,
    todayCollection: collection,
    totalPayable,
    newArrears,
  };
}

/**
 * Convert Milk Cans to Kilograms (default 1 Can = 50 Kg)
 */
export function convertCanToKg(cans = 0, kgPerCan = 50) {
  const canCount = Math.max(0, Number(cans) || 0);
  const weightPerCan = Number(kgPerCan) > 0 ? Number(kgPerCan) : 50;
  return Number((canCount * weightPerCan).toFixed(2));
}

/**
 * Calculate total milk amount from Cans, Price per Kg, and Can weight (default 50 Kg)
 */
export function calculateCanAmount(cans = 0, pricePerKg = 0, kgPerCan = 50) {
  const kgs = convertCanToKg(cans, kgPerCan);
  const price = Math.max(0, Number(pricePerKg) || 0);
  return Number((kgs * price).toFixed(2));
}

/**
 * Calculate remaining available cash for a day after income/collections,
 * expenses, staff advances, and paid salaries.
 */
export function calculateAvailableCash({
  openingCash = 0,
  totalIncome = 0,
  totalExpenses = 0,
  advancesPaid = 0,
  salariesPaid = 0,
} = {}) {
  const opening = Number(openingCash) || 0;
  const income = Number(totalIncome) || 0;
  const expenses = Number(totalExpenses) || 0;
  const advances = Number(advancesPaid) || 0;
  const salaries = Number(salariesPaid) || 0;

  return Number((opening + income - expenses - advances - salaries).toFixed(2));
}

