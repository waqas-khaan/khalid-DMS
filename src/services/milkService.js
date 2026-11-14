import { storageAdapter } from './storageAdapter';
import { settingsService } from './settingsService';
import { convertLiterToKg, convertKgToLiter, convertCanToKg } from '../utils/calculations';
import { statsService } from './statsService';

function resolveArrivalQuantities(qty, unit, factor, kgPerCan) {
  if (unit === 'Liter') {
    return {
      quantityKg: convertLiterToKg(qty, factor),
      quantityLiters: qty,
    };
  }
  if (unit === 'Can') {
    const quantityKg = convertCanToKg(qty, kgPerCan);
    return {
      quantityKg,
      quantityLiters: convertKgToLiter(quantityKg, factor),
    };
  }
  return {
    quantityKg: qty,
    quantityLiters: convertKgToLiter(qty, factor),
  };
}

/**
 * Normalize and compute milk arrival persistence fields using current conversion settings.
 */
async function buildArrivalPayload(data) {
  const settings = await settingsService.getSettings();
  const factor = Number(settings.literToKgFactor) || 1.03;
  const kgPerCan = Number(settings.canWeightKg) || 50;

  const qty = Number(data.quantity) || 0;
  const unit = data.unit || 'Liter';
  const { quantityKg, quantityLiters } = resolveArrivalQuantities(qty, unit, factor, kgPerCan);

  return {
    date: data.date,
    quantity: qty,
    unit,
    quantityKg,
    quantityLiters,
    availableCash: Math.max(0, Number(data.availableCash) || 0),
    source: data.source?.trim() || 'Farm Collection',
    notes: data.notes?.trim() || '',
  };
}

export const milkService = {
  async getMilkArrivals(dateFilter = null) {
    const filters = [];
    if (dateFilter) {
      filters.push({ field: 'date', operator: '==', value: dateFilter });
    }
    return await storageAdapter.getCollection('milkArrivals', filters, 'createdAt', 'desc');
  },

  async addMilkArrival(data) {
    const payload = await buildArrivalPayload(data);
    const arrival = await storageAdapter.addDoc('milkArrivals', payload);

    // Update daily & monthly stats
    await statsService.refreshDailyStats(data.date);
    return arrival;
  },

  async updateMilkArrival(id, data) {
    const payload = await buildArrivalPayload(data);
    const updated = await storageAdapter.updateDoc('milkArrivals', id, payload);

    await statsService.refreshDailyStats(data.date);
    return updated;
  },

  async deleteMilkArrival(id, date) {
    const deleted = await storageAdapter.deleteDoc('milkArrivals', id);
    if (date) {
      await statsService.refreshDailyStats(date);
    }
    return deleted;
  },

  async getDailyTotals(date) {
    const arrivals = await this.getMilkArrivals(date);
    return arrivals.reduce(
      (acc, curr) => {
        acc.totalLiters += Number(curr.quantityLiters) || 0;
        acc.totalKg += Number(curr.quantityKg) || 0;
        acc.totalAvailableCash += Number(curr.availableCash) || 0;
        acc.count += 1;
        return acc;
      },
      { totalLiters: 0, totalKg: 0, totalAvailableCash: 0, count: 0 }
    );
  },
};

