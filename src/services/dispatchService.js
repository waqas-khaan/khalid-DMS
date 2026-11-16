import { storageAdapter } from './storageAdapter';
import { mastersService } from './mastersService';
import { statsService } from './statsService';

export const dispatchService = {
  async getDispatches(dateFilter = null) {
    const filters = [];
    if (dateFilter) {
      filters.push({ field: 'date', operator: '==', value: dateFilter });
    }
    return await storageAdapter.getCollection('dispatches', filters, 'createdAt', 'desc');
  },

  async getDispatchById(id) {
    const dispatch = await storageAdapter.getDoc('dispatches', id);
    if (!dispatch) return null;
    const items = await storageAdapter.getSubcollection('dispatches', id, 'items');
    return { ...dispatch, items };
  },

  async createDispatch({ header, items, status = 'Dispatched' }) {
    // 1. Calculate totals across all items
    let totalCans = 0;
    let totalMilk = 0;
    let totalReturnMilk = 0;
    let totalAmount = 0;
    let totalPreviousArrears = 0;
    let totalCollection = 0;
    let totalNewArrears = 0;

    const sanitizedItems = items.map((item) => {
      const price = Number(item.price) || 0;
      const cans = Number(item.cans) || 0;
      const kgs = Number(item.kgs) || 0;
      const returnKgs = Math.max(0, Number(item.returnKgs) || 0);
      const computedNetMilk = Math.max(0, Number((kgs - returnKgs).toFixed(2)));
      const todayMilk =
        item.todayMilk !== undefined && item.todayMilk !== null
          ? Math.max(0, Number(item.todayMilk) || 0)
          : computedNetMilk;
      const todayAmount = Number((todayMilk * price).toFixed(2));
      const previousArrears = Number(item.previousArrears) || 0;
      const todayCollection = Number(item.todayCollection) || 0;
      const totalPayable = Number((previousArrears + todayAmount).toFixed(2));
      const newArrears = Number((totalPayable - todayCollection).toFixed(2));

      totalCans += cans;
      totalMilk += todayMilk;
      totalReturnMilk += returnKgs;
      totalAmount += todayAmount;
      totalPreviousArrears += previousArrears;
      totalCollection += todayCollection;
      totalNewArrears += newArrears;

      return {
        shopId: item.shopId,
        shopCode: item.shopCode || '',
        shopName: item.shopName || '',
        ownerName: item.ownerName || '',
        price,
        cans,
        kgs,
        returnKgs,
        todayMilk,
        todayAmount,
        previousArrears,
        todayCollection,
        totalPayable,
        newArrears,
      };
    });

    // 2. Create the dispatch document
    const dispatchPayload = {
      date: header.date,
      vehicleId: header.vehicleId,
      vehicleNumber: header.vehicleNumber || '',
      driverId: header.driverId,
      driverName: header.driverName || '',
      calanderId: header.calanderId || '',
      calanderName: header.calanderName || '',
      areaId: header.areaId,
      areaName: header.areaName || '',
      totalCans,
      totalMilk: Number(totalMilk.toFixed(2)),
      totalReturnMilk: Number(totalReturnMilk.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      totalPreviousArrears: Number(totalPreviousArrears.toFixed(2)),
      totalCollection: Number(totalCollection.toFixed(2)),
      totalNewArrears: Number(totalNewArrears.toFixed(2)),
      returnNotes: header.returnNotes || '',
      status: status || 'Dispatched',
    };

    const savedDispatch = await storageAdapter.addDoc('dispatches', dispatchPayload);

    // 3. Save items into subcollection dispatches/{dispatchId}/items
    await storageAdapter.saveSubcollectionItems('dispatches', savedDispatch.id, 'items', sanitizedItems);

    // 4. Update each shop's current arrears in shops collection
    for (const row of sanitizedItems) {
      if (row.shopId) {
        await mastersService.updateShopArrears(row.shopId, row.newArrears);
      }
    }

    // 5. Update daily stats
    await statsService.refreshDailyStats(header.date);

    return { ...savedDispatch, items: sanitizedItems };
  },

  async updateDispatch(dispatchId, { header, items, status = null }) {
    // 1. Calculate updated totals
    let totalCans = 0;
    let totalMilk = 0;
    let totalReturnMilk = 0;
    let totalAmount = 0;
    let totalPreviousArrears = 0;
    let totalCollection = 0;
    let totalNewArrears = 0;

    const sanitizedItems = items.map((item) => {
      const price = Number(item.price) || 0;
      const cans = Number(item.cans) || 0;
      const kgs = Number(item.kgs) || 0;
      const returnKgs = Math.max(0, Number(item.returnKgs) || 0);
      const computedNetMilk = Math.max(0, Number((kgs - returnKgs).toFixed(2)));
      const todayMilk =
        item.todayMilk !== undefined && item.todayMilk !== null
          ? Math.max(0, Number(item.todayMilk) || 0)
          : computedNetMilk;
      const todayAmount = Number((todayMilk * price).toFixed(2));
      const previousArrears = Number(item.previousArrears) || 0;
      const todayCollection = Number(item.todayCollection) || 0;
      const totalPayable = Number((previousArrears + todayAmount).toFixed(2));
      const newArrears = Number((totalPayable - todayCollection).toFixed(2));

      totalCans += cans;
      totalMilk += todayMilk;
      totalReturnMilk += returnKgs;
      totalAmount += todayAmount;
      totalPreviousArrears += previousArrears;
      totalCollection += todayCollection;
      totalNewArrears += newArrears;

      return {
        id: item.id,
        shopId: item.shopId,
        shopCode: item.shopCode || '',
        shopName: item.shopName || '',
        ownerName: item.ownerName || '',
        price,
        cans,
        kgs,
        returnKgs,
        todayMilk,
        todayAmount,
        previousArrears,
        todayCollection,
        totalPayable,
        newArrears,
      };
    });

    const dispatchUpdates = {
      date: header.date,
      vehicleId: header.vehicleId,
      vehicleNumber: header.vehicleNumber || '',
      driverId: header.driverId,
      driverName: header.driverName || '',
      calanderId: header.calanderId || '',
      calanderName: header.calanderName || '',
      areaId: header.areaId,
      areaName: header.areaName || '',
      totalCans,
      totalMilk: Number(totalMilk.toFixed(2)),
      totalReturnMilk: Number(totalReturnMilk.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      totalPreviousArrears: Number(totalPreviousArrears.toFixed(2)),
      totalCollection: Number(totalCollection.toFixed(2)),
      totalNewArrears: Number(totalNewArrears.toFixed(2)),
      ...(header.returnNotes !== undefined ? { returnNotes: header.returnNotes } : {}),
      updatedAt: new Date().toISOString(),
      ...(status ? { status } : {}),
      ...(status === 'Returned' ? { returnedAt: new Date().toISOString() } : {}),
    };

    const updated = await storageAdapter.updateDoc('dispatches', dispatchId, dispatchUpdates);
    await storageAdapter.saveSubcollectionItems('dispatches', dispatchId, 'items', sanitizedItems);

    // Update shop current arrears
    for (const row of sanitizedItems) {
      if (row.shopId) {
        await mastersService.updateShopArrears(row.shopId, row.newArrears);
      }
    }

    // Refresh daily stats
    await statsService.refreshDailyStats(header.date);

    return { ...updated, items: sanitizedItems };
  },

  async markDispatchReturned(dispatchId) {
    return await storageAdapter.updateDoc('dispatches', dispatchId, {
      status: 'Returned',
      returnedAt: new Date().toISOString(),
    });
  },

  async createGuestSale({
    date,
    customerName = 'Guest Customer',
    customerPhone = '',
    quantityKg,
    rate,
    totalAmount,
    paidAmount,
    paymentMethod = 'cash',
    notes = '',
    token = '',
    seqNo = '',
  }) {
    const qty = Number(quantityKg) || 0;
    const r = Number(rate) || 0;
    const computedTotal = Number((qty * r).toFixed(2));
    const total = totalAmount !== undefined && totalAmount !== null ? Number(totalAmount) || 0 : computedTotal;
    const paid = paidAmount !== undefined && paidAmount !== null ? Number(paidAmount) || 0 : total;
    const balance = Math.max(0, Number((total - paid).toFixed(2)));
    const shortToken = token || Math.random().toString(16).substring(2, 10);
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const guestItem = {
      shopId: '',
      shopCode: 'GUEST',
      shopName: customerName || 'Guest Customer',
      ownerName: customerPhone || '',
      price: r,
      cans: 0,
      kgs: qty,
      returnKgs: 0,
      todayMilk: qty,
      todayAmount: total,
      previousArrears: 0,
      todayCollection: paid,
      totalPayable: total,
      newArrears: balance,
    };

    const dispatchPayload = {
      dispatchType: 'guest',
      date,
      token: shortToken,
      seqNo: seqNo || String(Date.now()).slice(-8),
      time: timeStr,
      customerName: customerName || 'Guest Customer',
      customerPhone: customerPhone || '',
      vehicleId: '',
      vehicleNumber: 'Counter Sale',
      driverId: '',
      driverName: 'Direct Cashier',
      calanderId: '',
      calanderName: '',
      areaId: '',
      areaName: 'Direct / Guest Sale',
      totalCans: 0,
      totalMilk: qty,
      totalReturnMilk: 0,
      totalAmount: total,
      totalPreviousArrears: 0,
      totalCollection: paid,
      totalNewArrears: balance,
      rate: r,
      paymentMethod,
      returnNotes: notes || 'Direct counter guest customer sale',
      status: 'Returned', // Completed/settled at counter immediately; never blocks Day Close
      createdAt: now.toISOString(),
    };

    const savedDispatch = await storageAdapter.addDoc('dispatches', dispatchPayload);
    await storageAdapter.saveSubcollectionItems('dispatches', savedDispatch.id, 'items', [guestItem]);
    await statsService.refreshDailyStats(date);

    return { ...savedDispatch, items: [guestItem] };
  },

  async getGuestSales(dateFilter = null) {
    const filters = [{ field: 'dispatchType', operator: '==', value: 'guest' }];
    if (dateFilter) {
      filters.push({ field: 'date', operator: '==', value: dateFilter });
    }
    return await storageAdapter.getCollection('dispatches', filters, 'createdAt', 'desc');
  },

  async deleteDispatch(dispatchId, date) {
    const dispatch = await storageAdapter.getDoc('dispatches', dispatchId);
    if (dispatch) {
      const items = await storageAdapter.getSubcollection('dispatches', dispatchId, 'items');
      for (const item of items || []) {
        if (item.shopId) {
          if (item.previousArrears !== undefined && item.previousArrears !== null) {
            await mastersService.updateShopArrears(item.shopId, Number(item.previousArrears) || 0);
          }
        }
      }
    }
    const deleted = await storageAdapter.deleteDoc('dispatches', dispatchId);
    const targetDate = date || dispatch?.date;
    if (targetDate) {
      await statsService.refreshDailyStats(targetDate);
    }
    return deleted;
  },
};

