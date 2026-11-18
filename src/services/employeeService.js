import { storageAdapter } from './storageAdapter';
import { getMonthDaysCount } from '../utils/formatters';
import { calculateAttendanceAndSalary } from '../utils/calculations';
import { statsService } from './statsService';

export const SALARY_PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'EasyPaisa', 'JazzCash'];

function buildEmployeePayrollEntry({ emp, month, monthlyAttendance, advances, existingRecord, totalDaysInMonth }) {
  const empAttendance = monthlyAttendance.filter((a) => a.employeeId === emp.id);
  const absentsCount = empAttendance.filter((a) => a.status === 'Absent').length;
  const presentCount = empAttendance.filter((a) => a.status === 'Present').length;

  const empAdvances = advances.filter((adv) => adv.employeeId === emp.id);
  const advancesTotal = empAdvances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  const calc = calculateAttendanceAndSalary({
    monthlySalary: emp.salary,
    totalDaysInMonth,
    absents: absentsCount,
    advancesTotal,
    allowedFreeAbsents: 2,
  });

  return {
    id: existingRecord ? existingRecord.id : null,
    employeeId: emp.id,
    employeeName: emp.name,
    designation: emp.designation,
    phone: emp.phone,
    active: emp.active !== false,
    month,
    baseSalary: emp.salary,
    totalDaysInMonth,
    presentCount,
    absents: absentsCount,
    allowedFreeAbsents: 2,
    deductibleDays: calc.deductibleDays,
    perDayRate: calc.perDaySalary,
    payCut: calc.payCut,
    advancesTotal,
    advancesList: empAdvances.map((adv) => ({
      id: adv.id,
      date: adv.date,
      amount: adv.amount,
      reason: adv.reason,
    })),
    netPayable: calc.netPayable,
    status: existingRecord ? existingRecord.status : 'Pending',
    paidDate: existingRecord ? existingRecord.paidDate : null,
    paymentMethod: existingRecord ? existingRecord.paymentMethod : 'Cash',
    notes: existingRecord ? existingRecord.notes || '' : '',
  };
}

export const employeeService = {
  // ---- EMPLOYEE MASTER ----
  async getEmployees() {
    return await storageAdapter.getCollection('employees', [], 'name', 'asc');
  },

  async getEmployee(id) {
    return await storageAdapter.getDoc('employees', id);
  },

  async createEmployee(data) {
    const status = data.status || (data.active === false ? 'Inactive' : 'Active');
    const active = status !== 'Inactive';
    return await storageAdapter.addDoc('employees', {
      name: data.name?.trim(),
      phone: data.phone?.trim() || '',
      designation: data.designation?.trim() || 'Worker',
      licenseNumber: data.licenseNumber?.trim() || '',
      notes: data.notes?.trim() || '',
      salary: Number(data.salary) || 0,
      joinDate: data.joinDate || new Date().toISOString().substring(0, 10),
      active,
      status,
    });
  },

  async updateEmployee(id, data) {
    const existing = await storageAdapter.getDoc('employees', id);
    const status =
      data.status ||
      (data.active === false
        ? 'Inactive'
        : existing?.status && existing.status !== 'Inactive'
          ? existing.status
          : 'Active');
    const active = status !== 'Inactive';
    return await storageAdapter.updateDoc('employees', id, {
      name: data.name?.trim(),
      phone: data.phone?.trim() || '',
      designation: data.designation?.trim() || 'Worker',
      licenseNumber: data.licenseNumber?.trim() || '',
      notes: data.notes?.trim() || '',
      salary: Number(data.salary) || 0,
      joinDate: data.joinDate,
      active,
      status,
    });
  },

  async deleteEmployee(id) {
    return await storageAdapter.deleteDoc('employees', id);
  },

  // ---- ATTENDANCE ----
  async getAttendanceByDate(date) {
    return await storageAdapter.getCollection('attendance', [
      { field: 'date', operator: '==', value: date },
    ]);
  },

  async saveDailyAttendance(date, records) {
    // records: [ { employeeId, employeeName, status: 'Present' | 'Absent', notes } ]
    const existing = await this.getAttendanceByDate(date);
    const existingMap = new Map(existing.map((r) => [r.employeeId, r.id]));

    for (const rec of records) {
      const payload = {
        date,
        employeeId: rec.employeeId,
        employeeName: rec.employeeName,
        status: rec.status || 'Present',
        notes: rec.notes || '',
      };
      if (existingMap.has(rec.employeeId)) {
        await storageAdapter.updateDoc('attendance', existingMap.get(rec.employeeId), payload);
      } else {
        await storageAdapter.addDoc('attendance', payload);
      }
    }
    return true;
  },

  async updateSingleAttendance(date, employeeId, { status, notes }) {
    const existing = await this.getAttendanceByDate(date);
    const rec = existing.find((r) => r.employeeId === employeeId);
    if (rec) {
      await storageAdapter.updateDoc('attendance', rec.id, {
        status: status || 'Present',
        notes: notes || '',
        updatedAt: new Date().toISOString(),
      });
      return rec.id;
    } else {
      const emp = await this.getEmployee(employeeId);
      return await storageAdapter.addDoc('attendance', {
        date,
        employeeId,
        employeeName: emp?.name || '',
        status: status || 'Present',
        notes: notes || '',
        createdAt: new Date().toISOString(),
      });
    }
  },

  // ---- ADVANCES ----
  async getAdvances(monthFilter = null, employeeIdFilter = null) {
    const list = await storageAdapter.getCollection('advances', [], 'date', 'desc');
    return list.filter((item) => {
      if (monthFilter) {
        const itemMonth = item.month || (item.date ? item.date.substring(0, 7) : '');
        if (itemMonth !== monthFilter) return false;
      }
      if (employeeIdFilter && item.employeeId !== employeeIdFilter) {
        return false;
      }
      return true;
    });
  },

  async addAdvance(data) {
    const date = data.date || new Date().toISOString().substring(0, 10);
    const month = data.month || date.substring(0, 7);
    const advance = await storageAdapter.addDoc('advances', {
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      date,
      month,
      amount: Number(data.amount) || 0,
      reason: data.reason?.trim() || 'General advance',
      status: 'Recorded',
    });

    // Refresh monthly stats
    await statsService.refreshMonthlyStats(month);
    return advance;
  },

  async deleteAdvance(id, month) {
    const deleted = await storageAdapter.deleteDoc('advances', id);
    if (month) {
      await statsService.refreshMonthlyStats(month);
    }
    return deleted;
  },

  // ---- MONTHLY SALARIES & SLIP CALCULATION ----
  async getSalaries(month) {
    return await storageAdapter.getCollection('salaries', [
      { field: 'month', operator: '==', value: month },
    ]);
  },

  async computeMonthlySalaries(month) {
    const employees = await this.getEmployees();
    const activeEmployees = employees.filter((e) => e.active !== false);

    // Get attendance for the month
    const allAttendance = await storageAdapter.getCollection('attendance');
    const monthlyAttendance = allAttendance.filter((a) => a.date && a.date.startsWith(month));

    // Get advances for the month
    const advances = await this.getAdvances(month);

    // Existing recorded salaries
    const existingSalaries = await this.getSalaries(month);
    const salaryMap = new Map(existingSalaries.map((s) => [s.employeeId, s]));

    const totalDaysInMonth = getMonthDaysCount(month);

    return activeEmployees.map((emp) =>
      buildEmployeePayrollEntry({
        emp,
        month,
        monthlyAttendance,
        advances,
        existingRecord: salaryMap.get(emp.id) || null,
        totalDaysInMonth,
      })
    );
  },

  async getEmployeeMonthlyRecord(employeeId, month) {
    if (!employeeId || !month) return null;

    const [emp, allAttendance, advances, existingSalaries] = await Promise.all([
      this.getEmployee(employeeId),
      storageAdapter.getCollection('attendance'),
      this.getAdvances(month, employeeId),
      this.getSalaries(month),
    ]);

    if (!emp) return null;

    const monthlyAttendance = allAttendance.filter(
      (a) => a.employeeId === employeeId && a.date && a.date.startsWith(month)
    );
    const attendanceByDate = new Map(monthlyAttendance.map((a) => [a.date, a]));
    const existingRecord = existingSalaries.find((s) => s.employeeId === employeeId) || null;
    const totalDaysInMonth = getMonthDaysCount(month);

    const payroll = buildEmployeePayrollEntry({
      emp,
      month,
      monthlyAttendance,
      advances,
      existingRecord,
      totalDaysInMonth,
    });

    const [yearNum, monthNum] = month.split('-').map(Number);
    const dailyAttendance = [];
    let unmarkedCount = 0;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = `${month}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(yearNum, monthNum - 1, day);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const rec = attendanceByDate.get(dateStr);
      const status = rec?.status || 'Not Marked';
      if (status === 'Not Marked') unmarkedCount += 1;

      dailyAttendance.push({
        date: dateStr,
        dayNumber: day,
        dayName,
        status,
        notes: rec?.notes || '',
      });
    }

    return {
      ...payroll,
      dailyAttendance,
      unmarkedCount,
    };
  },

  async recordSalaryPayment(salaryData) {
    const payload = {
      employeeId: salaryData.employeeId,
      employeeName: salaryData.employeeName,
      month: salaryData.month,
      baseSalary: Number(salaryData.baseSalary) || 0,
      totalDaysInMonth: Number(salaryData.totalDaysInMonth) || 30,
      absents: Number(salaryData.absents) || 0,
      allowedFreeAbsents: 2,
      deductibleDays: Number(salaryData.deductibleDays) || 0,
      perDayRate: Number(salaryData.perDayRate) || 0,
      payCut: Number(salaryData.payCut) || 0,
      advancesTotal: Number(salaryData.advancesTotal) || 0,
      advancesList: salaryData.advancesList || [],
      netPayable: Number(salaryData.netPayable) || 0,
      status: 'Paid',
      paidDate: salaryData.paidDate || new Date().toISOString().substring(0, 10),
      paymentMethod: salaryData.paymentMethod || 'Cash',
      notes: salaryData.notes || '',
    };

    let result;
    if (salaryData.id) {
      result = await storageAdapter.updateDoc('salaries', salaryData.id, payload);
    } else {
      result = await storageAdapter.addDoc('salaries', payload);
    }

    await statsService.refreshMonthlyStats(salaryData.month);
    return result;
  },
};

