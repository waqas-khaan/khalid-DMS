import { storageAdapter } from './storageAdapter';
import { getCurrentDateString, getCurrentMonthString } from '../utils/formatters';
import { statsService } from './statsService';

export const seedService = {
  async seedInitialData(force = false) {
    if (!force && localStorage.getItem('dairy_seeded') === 'true') {
      return false;
    }
    const existingShops = await storageAdapter.getCollection('shops');
    if (existingShops.length > 0 && !force) {
      localStorage.setItem('dairy_seeded', 'true');
      return false;
    }

    const today = getCurrentDateString();
    const currentMonth = getCurrentMonthString();

    console.log('Starting Dairy Business data seeding...');

    // 1. Settings
    await storageAdapter.setDoc('settings', 'general', {
      literToKgFactor: 1.03,
      defaultMilkPrice: 180,
      canWeightKg: 50,
      currency: 'Rs.',
      companyName: 'Dairy Business Management System',
      allowedFreeAbsents: 2,
    });

    // 2. Users
    const users = [
      {
        id: 'user_admin_001',
        uid: 'user_admin_001',
        email: 'admin@dairy.com',
        name: 'Dairy Admin',
        role: 'admin',
        password: 'admin123',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user_staff_001',
        uid: 'user_staff_001',
        email: 'staff@dairy.com',
        name: 'Dairy Staff',
        role: 'staff',
        password: 'staff123',
        createdAt: new Date().toISOString(),
      },
    ];
    for (const u of users) {
      await storageAdapter.setDoc('users', u.id, u);
    }

    // 3. Vehicles
    const vehicles = [
      {
        id: 'veh_01',
        vehicleNumber: '0000',
        model: 'Main Delivery Truck',
        capacityLiters: 1500,
        status: 'Active',
        notes: 'Primary delivery truck',
      },
      {
        id: 'veh_02',
        vehicleNumber: '433',
        model: 'Suzuki Mega Carry',
        capacityLiters: 800,
        status: 'Active',
        notes: 'City delivery pickup',
      },
      {
        id: 'veh_03',
        vehicleNumber: '5331',
        model: 'Toyota Hilux 4x4',
        capacityLiters: 1200,
        status: 'Active',
        notes: 'Hayatabad route',
      },
      {
        id: 'veh_04',
        vehicleNumber: '3775',
        model: 'Hyundai Shehzore',
        capacityLiters: 1400,
        status: 'Active',
        notes: 'Tehkal route',
      },
      {
        id: 'veh_05',
        vehicleNumber: 'C5844',
        model: 'Isuzu NPR Truck',
        capacityLiters: 2000,
        status: 'Active',
        notes: 'Peshawar city',
      },
      {
        id: 'veh_06',
        vehicleNumber: 'C4404',
        model: 'Kia Bongo',
        capacityLiters: 1000,
        status: 'Active',
        notes: 'Dokan & Arbab road',
      },
      {
        id: 'veh_07',
        vehicleNumber: 'C4211',
        model: 'Master Foton',
        capacityLiters: 1100,
        status: 'Active',
        notes: 'Dalazak road',
      },
      {
        id: 'veh_08',
        vehicleNumber: 'PES-4120',
        model: 'Toyota Hilux 4x4',
        capacityLiters: 1200,
        status: 'Active',
        notes: 'Main Hayatabad & Jalalabad delivery route',
      },
    ];
    for (const v of vehicles) {
      await storageAdapter.setDoc('vehicles', v.id, v);
    }

    // 4. Drivers
    const drivers = [
      {
        id: 'drv_01',
        name: 'Atta Tehsin',
        phone: '0300-1112221',
        licenseNumber: 'PK-NWFP-9901',
        status: 'Active',
        notes: 'Senior delivery driver',
      },
      {
        id: 'drv_02',
        name: 'jahanir',
        phone: '0300-2223332',
        licenseNumber: 'PK-NWFP-9902',
        status: 'Active',
        notes: 'Route driver',
      },
      {
        id: 'drv_03',
        name: 'Naveed',
        phone: '0300-3334443',
        licenseNumber: 'PK-NWFP-9903',
        status: 'Active',
        notes: 'City driver',
      },
      {
        id: 'drv_04',
        name: 'Younis',
        phone: '0300-4445554',
        licenseNumber: 'PK-NWFP-9904',
        status: 'Active',
        notes: 'Hayatabad driver',
      },
      {
        id: 'drv_05',
        name: 'Shamshad khan',
        phone: '0300-5556665',
        licenseNumber: 'PK-NWFP-9905',
        status: 'Active',
        notes: 'Morning shift driver',
      },
      {
        id: 'drv_05b',
        name: 'بابا',
        phone: '0300-5556660',
        licenseNumber: 'PK-NWFP-9900',
        status: 'Active',
        notes: 'Senior driver',
      },
      {
        id: 'drv_06',
        name: 'Abrar ul haq',
        phone: '0300-6667776',
        licenseNumber: 'PK-NWFP-9906',
        status: 'Active',
        notes: 'Experienced driver',
      },
      {
        id: 'drv_07',
        name: 'Gul Muhammad',
        phone: '0300-1234567',
        licenseNumber: 'PK-NWFP-9921',
        status: 'Active',
        notes: 'Senior driver, 8 years experience',
      },
      {
        id: 'drv_08',
        name: 'Tariq Mehmood',
        phone: '0333-7654321',
        licenseNumber: 'PK-NWFP-8842',
        status: 'Active',
        notes: 'Punctual and reliable',
      },
    ];
    for (const d of drivers) {
      await storageAdapter.setDoc('drivers', d.id, d);
    }

    // 4b. Calanders (Delivery Helpers)
    const calanders = [
      { id: 'cal_00', name: 'دکان', phone: '0300-9870000', status: 'Active', notes: 'Delivery helper' },
      { id: 'cal_01', name: 'Afzal khan', phone: '0300-9871111', status: 'Active', notes: 'Delivery helper' },
      { id: 'cal_02', name: 'Basheer', phone: '0300-9872222', status: 'Active', notes: 'Delivery helper' },
      { id: 'cal_03', name: 'بابا', phone: '0300-9873333', status: 'Active', notes: 'Senior helper' },
      { id: 'cal_04', name: 'nawab', phone: '0300-9874444', status: 'Active', notes: 'Delivery helper' },
      { id: 'cal_05', name: 'Niaz Gul', phone: '0300-9875555', status: 'Active', notes: 'Delivery helper' },
      { id: 'cal_06', name: 'Farooq', phone: '0300-9876666', status: 'Active', notes: 'Delivery helper' },
    ];
    for (const c of calanders) {
      await storageAdapter.setDoc('calanders', c.id, c);
    }

    // 5. Areas / Routes
    const areas = [
      {
        id: 'area_dokan',
        name: 'Dokan',
        code: 'DKN',
        description: 'Central Dokan Route',
        active: true,
      },
      {
        id: 'area_hayatabad',
        name: 'Hayatabad',
        code: 'HYT',
        description: 'Hayatabad Sectors Phase 1-7',
        active: true,
      },
      {
        id: 'area_baba_suzuki',
        name: 'Baba suzuki',
        code: 'BSZ',
        description: 'Baba Suzuki Delivery Line',
        active: true,
      },
      {
        id: 'area_tehkal_bala',
        name: 'Tehkal Bala',
        code: 'TKB',
        description: 'Tehkal Bala & Jamrud Road',
        active: true,
      },
      {
        id: 'area_peshawar_city',
        name: 'Peshawar City',
        code: 'PWC',
        description: 'Peshawar City Commercial Area',
        active: true,
      },
      {
        id: 'area_arbab_road',
        name: 'Arbab Road',
        code: 'ARB',
        description: 'Arbab Road & University Area',
        active: true,
      },
      {
        id: 'area_dalazak_road',
        name: 'Dalazak Road',
        code: 'DLR',
        description: 'Dalazak Road Route',
        active: true,
      },
      {
        id: 'area_board',
        name: 'Board',
        code: 'BRD',
        description: 'Board Bazar Commercial',
        active: true,
      },
      {
        id: 'area_wazeer_bagh',
        name: 'Wazeer bagh',
        code: 'WZB',
        description: 'Wazir Bagh Historic Quarter',
        active: true,
      },
      {
        id: 'area_jalalabad',
        name: 'Jalalabad',
        code: 'JLD',
        description: 'Jalalabad Highway Route',
        active: true,
      },
      {
        id: 'area_university_town',
        name: 'University Town',
        code: 'UTN',
        description: 'University Town & Campus Area',
        active: true,
      },
    ];
    for (const a of areas) {
      await storageAdapter.setDoc('areas', a.id, a);
    }

    // 6. Shops
    const shops = [
      {
        id: 'shp_dokan_01',
        code: 'DKN-01',
        name: 'Dokan Milk Center',
        ownerName: 'Afzal Khan',
        phone: '0300-9876543',
        areaId: 'area_dokan',
        defaultPrice: 180,
        openingArrears: 12500,
        currentArrears: 12500,
        active: true,
      },
      {
        id: 'shp_dokan_02',
        code: 'DKN-02',
        name: 'Insaf Dairy & Tea Shop',
        ownerName: 'Basheer',
        phone: '0333-8765432',
        areaId: 'area_dokan',
        defaultPrice: 180,
        openingArrears: 9000,
        currentArrears: 9000,
        active: true,
      },
      {
        id: 'shp_01',
        code: 'SHP-101',
        name: 'Al-Madina Milk & Sweets',
        ownerName: 'Haji Rafiq',
        phone: '0301-1112233',
        areaId: 'area_hayatabad',
        defaultPrice: 180,
        openingArrears: 15000,
        currentArrears: 15000,
        active: true,
      },
      {
        id: 'shp_02',
        code: 'SHP-102',
        name: 'Khyber Pure Dairy',
        ownerName: 'Sher Khan',
        phone: '0302-2223344',
        areaId: 'area_hayatabad',
        defaultPrice: 180,
        openingArrears: 8500,
        currentArrears: 8500,
        active: true,
      },
      {
        id: 'shp_03',
        code: 'SHP-103',
        name: 'City Sweets & Bakers',
        ownerName: 'Malik Usman',
        phone: '0303-3334455',
        areaId: 'area_hayatabad',
        defaultPrice: 185,
        openingArrears: 24000,
        currentArrears: 24000,
        active: true,
      },
      {
        id: 'shp_04',
        code: 'SHP-104',
        name: 'Afghan Milk Corner',
        ownerName: 'Niaz Wali',
        phone: '0304-4445566',
        areaId: 'area_jalalabad',
        defaultPrice: 175,
        openingArrears: 12000,
        currentArrears: 12000,
        active: true,
      },
      {
        id: 'shp_05',
        code: 'SHP-105',
        name: 'Border Dairy Point',
        ownerName: 'Habibullah',
        phone: '0305-5556677',
        areaId: 'area_jalalabad',
        defaultPrice: 175,
        openingArrears: 6000,
        currentArrears: 6000,
        active: true,
      },
      {
        id: 'shp_06',
        code: 'SHP-106',
        name: 'Town Fresh Milk & Cream',
        ownerName: 'Sardar Ali',
        phone: '0306-6667788',
        areaId: 'area_university_town',
        defaultPrice: 190,
        openingArrears: 9500,
        currentArrears: 9500,
        active: true,
      },
    ];
    for (const s of shops) {
      await storageAdapter.setDoc('shops', s.id, s);
    }

    // 7. Expense Categories
    const categories = [
      { id: 'cat_food', name: 'Food', isDefault: true, subTypes: [] },
      { id: 'cat_home', name: 'Home', isDefault: true, subTypes: [] },
      { id: 'cat_transport', name: 'Transport', isDefault: true, subTypes: ['Diesel', 'Maintenance'] },
    ];
    for (const c of categories) {
      await storageAdapter.setDoc('expenseCategories', c.id, c);
    }

    // 8. Sample Milk Arrivals (Today)
    const arrivals = [
      {
        id: 'arr_01',
        date: today,
        quantity: 500,
        unit: 'Liter',
        quantityKg: 515,
        quantityLiters: 500,
        source: 'Morning Farm Milking',
        notes: 'Section A & B cows milking',
      },
      {
        id: 'arr_02',
        date: today,
        quantity: 420,
        unit: 'Liter',
        quantityKg: 432.6,
        quantityLiters: 420,
        source: 'Evening Farm Milking',
        notes: 'Section C buffalo milking',
      },
      {
        id: 'arr_03',
        date: today,
        quantity: 250,
        unit: 'Kg',
        quantityKg: 250,
        quantityLiters: 242.72,
        source: 'Village Collection Center',
        notes: 'Chitral road cooperative milk',
      },
    ];
    for (const arr of arrivals) {
      await storageAdapter.setDoc('milkArrivals', arr.id, arr);
    }

    // 9. Sample Employees (Calander / Helpers & Dairy staff)
    const employees = [
      {
        id: 'emp_cal_00',
        name: 'دکان',
        phone: '0300-9870000',
        designation: 'Calander (Delivery Helper)',
        salary: 28000,
        joinDate: '2024-01-01',
        active: true,
      },
      {
        id: 'emp_cal_01',
        name: 'Afzal khan',
        phone: '0300-9871111',
        designation: 'Calander (Delivery Helper)',
        salary: 28000,
        joinDate: '2024-01-01',
        active: true,
      },
      {
        id: 'emp_cal_02',
        name: 'Basheer',
        phone: '0300-9872222',
        designation: 'Calander (Delivery Helper)',
        salary: 28000,
        joinDate: '2024-01-01',
        active: true,
      },
      {
        id: 'emp_cal_03',
        name: 'بابا',
        phone: '0300-9873333',
        designation: 'Calander (Senior Helper)',
        salary: 30000,
        joinDate: '2023-06-01',
        active: true,
      },
      {
        id: 'emp_cal_04',
        name: 'nawab',
        phone: '0300-9874444',
        designation: 'Calander (Delivery Helper)',
        salary: 28000,
        joinDate: '2024-02-01',
        active: true,
      },
      {
        id: 'emp_cal_05',
        name: 'Niaz Gul',
        phone: '0300-9875555',
        designation: 'Calander (Delivery Helper)',
        salary: 28000,
        joinDate: '2024-03-01',
        active: true,
      },
      {
        id: 'emp_cal_06',
        name: 'Farooq',
        phone: '0300-9876666',
        designation: 'Calander (Delivery Helper)',
        salary: 28000,
        joinDate: '2024-03-15',
        active: true,
      },
      {
        id: 'emp_01',
        name: 'Ahmad Ali',
        phone: '0311-1122334',
        designation: 'General Dairy Worker',
        salary: 35000,
        joinDate: '2024-01-15',
        active: true,
      },
      {
        id: 'emp_02',
        name: 'Bilal Shah',
        phone: '0312-2233445',
        designation: 'Driver & Delivery Specialist',
        salary: 42000,
        joinDate: '2024-02-01',
        active: true,
      },
      {
        id: 'emp_03',
        name: 'Farhan Qureshi',
        phone: '0313-3344556',
        designation: 'Farm Supervisor',
        salary: 50000,
        joinDate: '2023-11-10',
        active: true,
      },
      {
        id: 'emp_04',
        name: 'Kamran Khan',
        phone: '0314-4455667',
        designation: 'Milking & Animal Caretaker',
        salary: 32000,
        joinDate: '2024-03-20',
        active: true,
      },
    ];
    for (const emp of employees) {
      await storageAdapter.setDoc('employees', emp.id, emp);
    }

    // 10. Sample Attendance for Today and past days of the month
    const attendanceRecords = [
      { id: 'att_01', date: today, employeeId: 'emp_01', employeeName: 'Ahmad Ali', status: 'Present' },
      { id: 'att_02', date: today, employeeId: 'emp_02', employeeName: 'Bilal Shah', status: 'Present' },
      { id: 'att_03', date: today, employeeId: 'emp_03', employeeName: 'Farhan Qureshi', status: 'Present' },
      { id: 'att_04', date: today, employeeId: 'emp_04', employeeName: 'Kamran Khan', status: 'Absent' },
    ];
    for (const att of attendanceRecords) {
      await storageAdapter.setDoc('attendance', att.id, att);
    }

    // 11. Sample Advances
    const sampleAdvances = [
      {
        id: 'adv_01',
        employeeId: 'emp_01',
        employeeName: 'Ahmad Ali',
        date: today,
        month: currentMonth,
        amount: 3000,
        reason: 'Family medical expense',
        status: 'Recorded',
      },
      {
        id: 'adv_02',
        employeeId: 'emp_02',
        employeeName: 'Bilal Shah',
        date: today,
        month: currentMonth,
        amount: 5000,
        reason: 'Bike maintenance advance',
        status: 'Recorded',
      },
    ];
    for (const adv of sampleAdvances) {
      await storageAdapter.setDoc('advances', adv.id, adv);
    }

    // 12. Sample Expenses (Today)
    const sampleExpenses = [
      {
        id: 'exp_01',
        date: today,
        category: 'Food',
        subCategory: 'Staff Mess',
        amount: 1800,
        notes: 'Worker tea, breakfast and lunch supplies',
      },
      {
        id: 'exp_02',
        date: today,
        category: 'Transport',
        subCategory: 'Diesel',
        vehicleId: 'veh_01',
        vehicleNumber: 'PES-4120',
        amount: 9500,
        notes: 'Full tank diesel for delivery Hilux',
      },
      {
        id: 'exp_03',
        date: today,
        category: 'Transport',
        subCategory: 'Maintenance',
        vehicleId: 'veh_02',
        vehicleNumber: 'ISB-8831',
        amount: 3400,
        notes: 'Engine oil change and filter replacement',
      },
      {
        id: 'exp_04',
        date: today,
        category: 'Home',
        subCategory: 'Sanitation',
        amount: 2200,
        notes: 'Farm barn disinfectant and washing supplies',
      },
    ];
    for (const exp of sampleExpenses) {
      await storageAdapter.setDoc('expenses', exp.id, exp);
    }

    // 13. Refresh stats
    await statsService.refreshDailyStats(today);
    localStorage.setItem('dairy_seeded', 'true');

    console.log('Dairy Business data seeding completed successfully!');
    return true;
  },
};
