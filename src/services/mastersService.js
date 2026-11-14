import { storageAdapter } from './storageAdapter';

const STAFF_ROLE_CONFIG = {
  driver: {
    legacyCollection: 'drivers',
    defaultDesignation: 'Driver',
    matchesDesignation: (d) => (d || '').toLowerCase().includes('driver'),
  },
  calander: {
    legacyCollection: 'calanders',
    defaultDesignation: 'Calander',
    matchesDesignation: (d) => {
      const lower = (d || '').toLowerCase();
      return lower.includes('calander') || lower.includes('calender') || lower.includes('helper');
    },
  },
};

function mapEmployeeToRoleRecord(emp) {
  const status = emp.active === false ? 'Inactive' : (emp.status || 'Active');
  return {
    id: emp.id,
    employeeId: emp.id,
    name: emp.name || '',
    phone: emp.phone || '',
    designation: emp.designation || '',
    licenseNumber: emp.licenseNumber || '',
    salary: Number(emp.salary) || 0,
    joinDate: emp.joinDate || '',
    status,
    notes: emp.notes || '',
    active: emp.active !== false,
    fromDirectory: true,
  };
}

async function getStaffRoleEntries(roleKey) {
  const cfg = STAFF_ROLE_CONFIG[roleKey];
  const [employees, legacyList] = await Promise.all([
    storageAdapter.getCollection('employees', [], 'name', 'asc'),
    storageAdapter.getCollection(cfg.legacyCollection, [], 'name', 'asc'),
  ]);

  const directoryMatches = (employees || [])
    .filter((emp) => cfg.matchesDesignation(emp.designation))
    .map(mapEmployeeToRoleRecord);

  const seenIds = new Set(directoryMatches.map((r) => r.id));
  const seenNames = new Set(directoryMatches.map((r) => (r.name || '').trim().toLowerCase()).filter(Boolean));

  const combined = [...directoryMatches];
  for (const item of legacyList || []) {
    const normName = (item.name || '').trim().toLowerCase();
    if (!seenIds.has(item.id) && (!normName || !seenNames.has(normName))) {
      combined.push({ ...item, fromDirectory: false });
    }
  }

  return combined.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

async function getStaffRoleEntry(roleKey, id) {
  if (!id) return null;
  const emp = await storageAdapter.getDoc('employees', id);
  if (emp) return mapEmployeeToRoleRecord(emp);
  const cfg = STAFF_ROLE_CONFIG[roleKey];
  return await storageAdapter.getDoc(cfg.legacyCollection, id);
}

async function createStaffRoleEntry(roleKey, data) {
  const cfg = STAFF_ROLE_CONFIG[roleKey];
  const status = data.status || 'Active';
  const saved = await storageAdapter.addDoc('employees', {
    name: data.name?.trim(),
    phone: data.phone?.trim() || '',
    designation: data.designation?.trim() || cfg.defaultDesignation,
    salary: Number(data.salary) || 0,
    joinDate: data.joinDate || new Date().toISOString().substring(0, 10),
    licenseNumber: data.licenseNumber?.trim() || '',
    status,
    active: status !== 'Inactive',
    notes: data.notes?.trim() || '',
  });
  return mapEmployeeToRoleRecord(saved);
}

async function updateStaffRoleEntry(roleKey, id, data) {
  const cfg = STAFF_ROLE_CONFIG[roleKey];
  const status = data.status || 'Active';
  const existingEmp = await storageAdapter.getDoc('employees', id);

  const payload = {
    name: data.name?.trim(),
    phone: data.phone?.trim() || '',
    designation: data.designation?.trim() || existingEmp?.designation || cfg.defaultDesignation,
    licenseNumber: data.licenseNumber?.trim() || '',
    status,
    active: status !== 'Inactive',
    notes: data.notes?.trim() || '',
  };
  if (data.salary !== undefined && data.salary !== null && data.salary !== '') {
    payload.salary = Number(data.salary) || 0;
  }

  if (existingEmp) {
    const updated = await storageAdapter.updateDoc('employees', id, payload);
    return updated ? mapEmployeeToRoleRecord(updated) : null;
  }

  const legacy = await storageAdapter.getDoc(cfg.legacyCollection, id);
  const migrated = await storageAdapter.setDoc('employees', id, {
    joinDate: legacy?.joinDate || new Date().toISOString().substring(0, 10),
    salary: Number(data.salary ?? legacy?.salary) || 0,
    ...payload,
  });
  if (legacy) {
    await storageAdapter.deleteDoc(cfg.legacyCollection, id);
  }
  return mapEmployeeToRoleRecord(migrated);
}

async function deleteStaffRoleEntry(roleKey, id) {
  const cfg = STAFF_ROLE_CONFIG[roleKey];
  const [emp, legacy] = await Promise.all([
    storageAdapter.getDoc('employees', id),
    storageAdapter.getDoc(cfg.legacyCollection, id),
  ]);
  if (emp) {
    await storageAdapter.deleteDoc('employees', id);
  }
  if (legacy) {
    await storageAdapter.deleteDoc(cfg.legacyCollection, id);
  }
  return true;
}

export const mastersService = {
  // ---- VEHICLES ----
  async getVehicles() {
    return await storageAdapter.getCollection('vehicles', [], 'vehicleNumber', 'asc');
  },
  async getVehicle(id) {
    return await storageAdapter.getDoc('vehicles', id);
  },
  async createVehicle(data) {
    return await storageAdapter.addDoc('vehicles', {
      vehicleNumber: data.vehicleNumber?.trim(),
      model: data.model?.trim() || '',
      capacityLiters: Number(data.capacityLiters) || 0,
      status: data.status || 'Active',
      notes: data.notes?.trim() || '',
    });
  },
  async updateVehicle(id, data) {
    return await storageAdapter.updateDoc('vehicles', id, {
      vehicleNumber: data.vehicleNumber?.trim(),
      model: data.model?.trim() || '',
      capacityLiters: Number(data.capacityLiters) || 0,
      status: data.status || 'Active',
      notes: data.notes?.trim() || '',
    });
  },
  async deleteVehicle(id) {
    return await storageAdapter.deleteDoc('vehicles', id);
  },

  // ---- DRIVERS (Synced with Staff Directory) ----
  async getDrivers() {
    return await getStaffRoleEntries('driver');
  },
  async getDriver(id) {
    return await getStaffRoleEntry('driver', id);
  },
  async createDriver(data) {
    return await createStaffRoleEntry('driver', data);
  },
  async updateDriver(id, data) {
    return await updateStaffRoleEntry('driver', id, data);
  },
  async deleteDriver(id) {
    return await deleteStaffRoleEntry('driver', id);
  },

  // ---- CALANDERS (DELIVERY HELPERS - Synced with Staff Directory) ----
  async getCalanders() {
    return await getStaffRoleEntries('calander');
  },
  async getCalander(id) {
    return await getStaffRoleEntry('calander', id);
  },
  async createCalander(data) {
    return await createStaffRoleEntry('calander', data);
  },
  async updateCalander(id, data) {
    return await updateStaffRoleEntry('calander', id, data);
  },
  async deleteCalander(id) {
    return await deleteStaffRoleEntry('calander', id);
  },

  // ---- AREAS / ROUTES ----
  async getAreas() {
    return await storageAdapter.getCollection('areas', [], 'name', 'asc');
  },
  async getArea(id) {
    return await storageAdapter.getDoc('areas', id);
  },
  async createArea(data) {
    return await storageAdapter.addDoc('areas', {
      name: data.name?.trim(),
      code: data.code?.trim()?.toUpperCase() || '',
      description: data.description?.trim() || '',
      active: data.active !== false,
    });
  },
  async updateArea(id, data) {
    return await storageAdapter.updateDoc('areas', id, {
      name: data.name?.trim(),
      code: data.code?.trim()?.toUpperCase() || '',
      description: data.description?.trim() || '',
      active: data.active !== false,
    });
  },
  async deleteArea(id) {
    return await storageAdapter.deleteDoc('areas', id);
  },

  // ---- SHOPS ----
  async getShops(areaId = null) {
    const filters = [];
    if (areaId) {
      filters.push({ field: 'areaId', operator: '==', value: areaId });
    }
    const shops = await storageAdapter.getCollection('shops', filters, 'name', 'asc');
    return shops;
  },
  async getShop(id) {
    return await storageAdapter.getDoc('shops', id);
  },
  async createShop(data) {
    const opening = Number(data.openingArrears) || 0;
    return await storageAdapter.addDoc('shops', {
      code: data.code?.trim() || `SHP-${Math.floor(100 + Math.random() * 900)}`,
      name: data.name?.trim(),
      ownerName: data.ownerName?.trim() || '',
      phone: data.phone?.trim() || '',
      areaId: data.areaId || '',
      defaultPrice: Number(data.defaultPrice) || 0,
      openingArrears: opening,
      currentArrears: opening,
      active: data.active !== false,
    });
  },
  async updateShop(id, data) {
    const updates = {
      code: data.code?.trim(),
      name: data.name?.trim(),
      ownerName: data.ownerName?.trim() || '',
      phone: data.phone?.trim() || '',
      areaId: data.areaId || '',
      defaultPrice: Number(data.defaultPrice) || 0,
      active: data.active !== false,
    };
    if (data.openingArrears !== undefined && data.currentArrears === undefined) {
      updates.openingArrears = Number(data.openingArrears) || 0;
    }
    if (data.currentArrears !== undefined) {
      updates.currentArrears = Number(data.currentArrears) || 0;
    }
    return await storageAdapter.updateDoc('shops', id, updates);
  },
  async deleteShop(id) {
    return await storageAdapter.deleteDoc('shops', id);
  },
  async updateShopArrears(shopId, newArrears) {
    return await storageAdapter.updateDoc('shops', shopId, {
      currentArrears: Number(newArrears) || 0,
    });
  },
  async updateAllShopsDefaultPrice(newPrice) {
    const price = Math.max(0, Number(newPrice) || 0);
    const shops = await this.getShops();
    for (const shop of shops) {
      await storageAdapter.updateDoc('shops', shop.id, {
        defaultPrice: price,
      });
    }
    return shops.length;
  },
  async updateShopsDefaultPrice(shopIds = [], newPrice) {
    const price = Math.max(0, Number(newPrice) || 0);
    for (const id of shopIds) {
      await storageAdapter.updateDoc('shops', id, {
        defaultPrice: price,
      });
    }
    return shopIds.length;
  },
};

