import { storageAdapter } from './storageAdapter';
import { calculateAvailableCash } from '../utils/calculations';

async function saveStatsIfRelevant(docId, statsData, hasData) {
  const existing = await storageAdapter.getDoc('stats', docId);
  if (existing || hasData) {
    await storageAdapter.setDoc('stats', docId, statsData);
  }
}

export const statsService = {
  async getDailyStats(date) {
    if (!date) return null;
    return await this.refreshDailyStats(date);
  },

  async refreshDailyStats(date) {
    if (!date) return null;
    const docId = `daily_${date}`;

    // 1. Dispatches for date
    const dispatches = await storageAdapter.getCollection('dispatches', [
      { field: 'date', operator: '==', value: date },
    ]);

    let todayMilkDispatched = 0;
    let todayDispatchAmount = 0;
    let todayIncome = 0; // today's collection

    for (const d of dispatches) {
      todayMilkDispatched += Number(d.totalMilk) || 0;
      todayDispatchAmount += Number(d.totalAmount) || 0;
      todayIncome += Number(d.totalCollection) || 0;
    }

    // 2. Milk Arrivals for date
    const arrivals = await storageAdapter.getCollection('milkArrivals', [
      { field: 'date', operator: '==', value: date },
    ]);

    let milkReceivedTodayLiters = 0;
    let milkReceivedTodayKg = 0;
    let openingCashToday = 0;

    for (const a of arrivals) {
      milkReceivedTodayLiters += Number(a.quantityLiters) || 0;
      milkReceivedTodayKg += Number(a.quantityKg) || 0;
      openingCashToday += Number(a.availableCash) || 0;
    }

    // 3. Expenses for date
    const expenses = await storageAdapter.getCollection('expenses', [
      { field: 'date', operator: '==', value: date },
    ]);

    let totalExpenseToday = 0;
    let foodExpense = 0;
    let homeExpense = 0;
    let transportExpense = 0;
    let dieselExpense = 0;
    let maintenanceExpense = 0;
    const expenseByCategory = {};

    for (const exp of expenses) {
      const amt = Number(exp.amount) || 0;
      totalExpenseToday += amt;
      const cat = exp.category || 'Other';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + amt;

      if (cat.toLowerCase() === 'food') {
        foodExpense += amt;
      } else if (cat.toLowerCase() === 'home') {
        homeExpense += amt;
      } else if (cat.toLowerCase() === 'transport') {
        transportExpense += amt;
        const sub = (exp.subCategory || '').toLowerCase();
        if (sub.includes('diesel') || sub.includes('fuel')) {
          dieselExpense += amt;
        } else if (sub.includes('maintenance') || sub.includes('repair')) {
          maintenanceExpense += amt;
        }
      }
    }

    // 4. Advances given & salaries paid on date
    const advances = await storageAdapter.getCollection('advances', [
      { field: 'date', operator: '==', value: date },
    ]);
    const advancesToday = advances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

    const salaries = await storageAdapter.getCollection('salaries');
    const paidSalariesForDate = salaries.filter((s) => s.status === 'Paid' && s.paidDate === date);
    const salariesPaidToday = paidSalariesForDate.reduce(
      (sum, s) => sum + (Number(s.netPayable) || 0),
      0
    );

    const availableCashToday = calculateAvailableCash({
      openingCash: openingCashToday,
      totalIncome: todayIncome,
      totalExpenses: totalExpenseToday,
      advancesPaid: advancesToday,
      salariesPaid: salariesPaidToday,
    });

    // 5. Total current arrears of all shops
    const shops = await storageAdapter.getCollection('shops');
    const totalArrears = shops.reduce((sum, s) => sum + (Number(s.currentArrears) || 0), 0);

    const statsData = {
      date,
      totalIncome: todayIncome,
      openingCashToday,
      advancesToday,
      salariesPaidToday,
      availableCashToday,
      todayDispatchAmount,
      totalArrears,
      milkReceivedToday: milkReceivedTodayKg,
      milkReceivedTodayLiters,
      milkDispatchedToday: todayMilkDispatched,
      totalExpenseToday,
      foodExpense,
      homeExpense,
      transportExpense,
      dieselExpense,
      maintenanceExpense,
      expenseByCategory,
      dispatchesCount: dispatches.length,
      arrivalsCount: arrivals.length,
      updatedAt: new Date().toISOString(),
    };

    const hasData =
      dispatches.length > 0 ||
      arrivals.length > 0 ||
      expenses.length > 0 ||
      advances.length > 0 ||
      paidSalariesForDate.length > 0 ||
      totalArrears !== 0;
    await saveStatsIfRelevant(docId, statsData, hasData);
    return statsData;
  },

  async getMonthlyStats(month) {
    if (!month) return null;
    return await this.refreshMonthlyStats(month);
  },

  async refreshMonthlyStats(month) {
    if (!month) return null;
    const docId = `monthly_${month}`;

    // 1. Dispatches in month
    const dispatches = await storageAdapter.getCollection('dispatches');
    const monthlyDispatches = dispatches.filter((d) => d.date && d.date.startsWith(month));

    let monthlyIncome = 0;
    let monthlyDispatched = 0;
    for (const d of monthlyDispatches) {
      monthlyIncome += Number(d.totalCollection) || 0;
      monthlyDispatched += Number(d.totalMilk) || 0;
    }

    // 2. Milk arrivals in month
    const arrivals = await storageAdapter.getCollection('milkArrivals');
    const monthlyArrivals = arrivals.filter((a) => a.date && a.date.startsWith(month));

    let monthlyReceivedKg = 0;
    let monthlyReceivedLiters = 0;
    for (const a of monthlyArrivals) {
      monthlyReceivedKg += Number(a.quantityKg) || 0;
      monthlyReceivedLiters += Number(a.quantityLiters) || 0;
    }

    // 3. Expenses in month
    const expenses = await storageAdapter.getCollection('expenses');
    const monthlyExpenses = expenses.filter((e) => e.date && e.date.startsWith(month));

    let totalMonthlyExpense = 0;
    const expenseByCategory = {};
    for (const e of monthlyExpenses) {
      const amt = Number(e.amount) || 0;
      totalMonthlyExpense += amt;
      const cat = e.category || 'Other';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + amt;
    }

    // 4. Salaries paid in month
    const salaries = await storageAdapter.getCollection('salaries');
    const monthlySalaries = salaries.filter((s) => s.month === month && s.status === 'Paid');
    const salariesPaid = monthlySalaries.reduce((sum, s) => sum + (Number(s.netPayable) || 0), 0);

    // 5. Advances given in month
    const advances = await storageAdapter.getCollection('advances');
    const monthlyAdvances = advances.filter((a) => a.month === month || (a.date && a.date.startsWith(month)));
    const advancesGiven = monthlyAdvances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

    const statsData = {
      month,
      monthlyIncome,
      monthlyDispatched,
      monthlyReceivedKg,
      monthlyReceivedLiters,
      totalMonthlyExpense,
      expenseByCategory,
      salariesPaid,
      advancesGiven,
      updatedAt: new Date().toISOString(),
    };

    const hasData =
      monthlyDispatches.length > 0 ||
      monthlyArrivals.length > 0 ||
      monthlyExpenses.length > 0 ||
      monthlySalaries.length > 0 ||
      monthlyAdvances.length > 0;
    await saveStatsIfRelevant(docId, statsData, hasData);
    return statsData;
  },
};

