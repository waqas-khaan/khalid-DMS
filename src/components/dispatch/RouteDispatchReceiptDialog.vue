<template>
  <v-dialog
    :model-value="modelValue"
    max-width="500"
    width="96vw"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="receipt-dialog-card rounded-2xl overflow-hidden" elevation="6">
      <!-- Modal Header (no-print) -->
      <div class="dialog-header px-5 py-4 text-white d-flex align-center justify-space-between no-print">
        <div class="d-flex align-center gap-3">
          <div class="header-icon-box d-flex align-center justify-center">
            <v-icon color="white" size="20">mdi-printer-pos</v-icon>
          </div>
          <div>
            <h2 class="text-subtitle-1 font-weight-bold line-height-tight mb-0 text-white">
              80mm Route Delivery Slips
            </h2>
            <div class="text-caption text-blue-lighten-4 mt-0-5" style="font-size: 0.75rem !important;">
              {{ routeTitle }} &bull; {{ activePrintItems.length }} Segregated Shop {{ activePrintItems.length === 1 ? 'Slip' : 'Slips' }}
            </div>
          </div>
        </div>
        <v-btn icon size="small" variant="text" color="white" class="close-btn" @click="close">
          <v-icon size="18">mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Scrollable Printable Preview Area -->
      <v-card-text class="pa-5 bg-slate-100 receipt-scroll-area">
        <div
          id="route-receipt-printable-target"
          class="receipt-printable-container route-receipt-printable-container py-2"
        >
          <!-- Loop through each shop's segregated delivery slip -->
          <div
            v-for="(item, idx) in activePrintItems"
            :key="item.shopId || item.id || idx"
            class="route-shop-slip-wrapper"
          >
            <div class="pos-80mm-slip route-shop-slip">
              <!-- Slip Header Banner -->
              <div class="slip-type-header">
                ROUTE DELIVERY SLIP &bull; ترسیل سلپ
              </div>

              <!-- Top Business Info -->
              <div class="slip-brand-box">
                <div class="slip-since">Since: 1960</div>
                <div class="slip-title-urdu">خالد ملک</div>
                <div class="slip-address">Warsk Road, Peshawar</div>
                <div class="slip-phone">Manager: 0333-9322266</div>
              </div>

              <div class="slip-divider-dashed"></div>

              <!-- Route & Trip Logistics -->
              <div class="slip-meta-rows">
                <div class="slip-meta-row">
                  <div class="slip-meta-lbl">
                    <span class="lbl-en">Route</span>
                    <span class="lbl-ur">(روٹ):</span>
                  </div>
                  <span class="slip-meta-val font-weight-black text-uppercase">{{ dispatchInfo.areaName || 'Route' }}</span>
                </div>
                <div class="slip-meta-row">
                  <div class="slip-meta-lbl">
                    <span class="lbl-en">Date</span>
                    <span class="lbl-ur">(تاریخ):</span>
                  </div>
                  <span class="slip-meta-val font-weight-bold">{{ formatSlipDate(dispatchInfo.date) }}</span>
                </div>
                <div class="slip-meta-row">
                  <div class="slip-meta-lbl">
                    <span class="lbl-en">Time</span>
                    <span class="lbl-ur">(وقت):</span>
                  </div>
                  <span class="slip-meta-val font-mono">{{ dispatchInfo.time || currentTimeStr }}</span>
                </div>
                <div class="slip-meta-row">
                  <div class="slip-meta-lbl">
                    <span class="lbl-en">Vehicle</span>
                    <span class="lbl-ur">(گاڑی):</span>
                  </div>
                  <span class="slip-meta-val font-weight-black font-mono">{{ dispatchInfo.vehicleNumber || '-' }}</span>
                </div>
                <div class="slip-meta-row">
                  <div class="slip-meta-lbl">
                    <span class="lbl-en">Driver</span>
                    <span class="lbl-ur">(ڈرائیور):</span>
                  </div>
                  <span class="slip-meta-val font-weight-bold">{{ dispatchInfo.driverName || '-' }}</span>
                </div>
                <div v-if="dispatchInfo.calanderName" class="slip-meta-row">
                  <div class="slip-meta-lbl">
                    <span class="lbl-en">Calander</span>
                    <span class="lbl-ur">(کلینڈر):</span>
                  </div>
                  <span class="slip-meta-val font-weight-bold">{{ dispatchInfo.calanderName }}</span>
                </div>
              </div>

              <div class="slip-divider-dashed"></div>

              <!-- Segregated Shop Banner -->
              <div class="slip-shop-banner">
                <div class="slip-shop-headline">
                  <span class="slip-shop-badge font-mono">{{ item.shopCode || ('#' + (idx + 1)) }}</span>
                  <span class="slip-shop-name">{{ item.shopName || 'Shop Customer' }}</span>
                </div>
                <div v-if="item.ownerName" class="slip-shop-subline">
                  <span class="owner-lbl">Owner / <bdi>مالک</bdi>:</span>
                  <span class="owner-val">{{ item.ownerName }}</span>
                </div>
              </div>

              <!-- Line Items Table -->
              <table class="slip-table">
                <thead>
                  <tr class="slip-th-row">
                    <th class="slip-th-val">Amount / مقدار</th>
                    <th class="slip-th-lbl">Description / تفصیل</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Cans Count -->
                  <tr class="slip-tr">
                    <td class="slip-td-val">
                      <span class="val-num">{{ item.cans || 0 }}</span>
                      <span class="val-unit">Cans</span>
                    </td>
                    <td class="slip-td-lbl">
                      <div class="lbl-ur">کین (50 کلو)</div>
                      <div class="lbl-en">Total Cans</div>
                    </td>
                  </tr>

                  <!-- Milk (Kg) -->
                  <tr class="slip-tr">
                    <td class="slip-td-val font-weight-black">
                      <span class="val-num">{{ formatNumber(item.todayMilk ?? item.kgs ?? 0) }}</span>
                      <span class="val-unit">Kg</span>
                    </td>
                    <td class="slip-td-lbl">
                      <div class="lbl-ur">کلو دودھ</div>
                      <div class="lbl-en">Dispatched Milk</div>
                    </td>
                  </tr>

                  <!-- Return Milk (if any) -->
                  <tr v-if="Number(item.returnKgs) > 0" class="slip-tr slip-tr-return">
                    <td class="slip-td-val text-orange-darken-4 font-weight-bold">
                      <span class="val-num">-{{ formatNumber(item.returnKgs) }}</span>
                      <span class="val-unit">Kg</span>
                    </td>
                    <td class="slip-td-lbl">
                      <div class="lbl-ur text-orange-darken-4">واپسی دودھ</div>
                      <div class="lbl-en">Milk Return</div>
                    </td>
                  </tr>

                  <!-- Rate / Price -->
                  <tr class="slip-tr">
                    <td class="slip-td-val">
                      <span class="val-num">Rs. {{ formatNumber(item.price) }}</span>
                      <span class="val-unit">/ Kg</span>
                    </td>
                    <td class="slip-td-lbl">
                      <div class="lbl-ur">فی کلو ریٹ</div>
                      <div class="lbl-en">Rate / Price</div>
                    </td>
                  </tr>

                  <!-- Today Amount -->
                  <tr class="slip-tr">
                    <td class="slip-td-val font-weight-bold">
                      <span class="val-num">Rs. {{ formatNumber(item.todayAmount) }}</span>
                    </td>
                    <td class="slip-td-lbl">
                      <div class="lbl-ur">آج کی رقم</div>
                      <div class="lbl-en">Today Amount</div>
                    </td>
                  </tr>

                  <!-- Previous Arrears -->
                  <tr class="slip-tr">
                    <td class="slip-td-val">
                      <span class="val-num">Rs. {{ formatNumber(item.previousArrears) }}</span>
                    </td>
                    <td class="slip-td-lbl">
                      <div class="lbl-ur">سابقہ بقایا</div>
                      <div class="lbl-en">Previous Arrears</div>
                    </td>
                  </tr>

                  <!-- Total Payable -->
                  <tr class="slip-tr slip-tr-payable">
                    <td class="slip-td-val slip-val-highlight">
                      <span class="val-num">Rs. {{ formatNumber(item.totalPayable) }}</span>
                    </td>
                    <td class="slip-td-lbl slip-lbl-highlight">
                      <div class="lbl-ur">کل واجب الادا</div>
                      <div class="lbl-en">TOTAL PAYABLE</div>
                    </td>
                  </tr>

                  <!-- Today Collection (if entered) -->
                  <tr v-if="Number(item.todayCollection) > 0" class="slip-tr">
                    <td class="slip-td-val text-green-darken-3 font-weight-bold">
                      <span class="val-num">Rs. {{ formatNumber(item.todayCollection) }}</span>
                    </td>
                    <td class="slip-td-lbl">
                      <div class="lbl-ur text-green-darken-3">وصول رقم</div>
                      <div class="lbl-en">Today Collection</div>
                    </td>
                  </tr>

                  <!-- Closing Balance / New Arrears (if collection entered) -->
                  <tr v-if="Number(item.todayCollection) > 0" class="slip-tr slip-tr-balance">
                    <td class="slip-td-val font-weight-black">
                      <span class="val-num">Rs. {{ formatNumber(item.newArrears) }}</span>
                    </td>
                    <td class="slip-td-lbl font-weight-black">
                      <div class="lbl-ur">بقیہ بقایا</div>
                      <div class="lbl-en">New Balance</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Signature & Receiver Confirmation -->
              <div class="slip-sign-row">
                <span class="slip-sign-lbl">دستخط وصول کنندہ:</span>
                <span class="slip-sign-line"></span>
              </div>
              <div class="slip-sign-sub-en">Receiver Signature</div>

              <!-- Courtesy Footer -->
              <div class="slip-footer-text">
                <div class="footer-ur">برائے مہربانی دودھ موقع پر چیک کریں۔ شکریہ!</div>
                <div class="footer-en">Please check milk at the time of delivery. Thank you!</div>
              </div>
            </div>

            <!-- Tear / Cut Line between segregated shops (Screen Preview) -->
            <div
              v-if="idx < activePrintItems.length - 1"
              class="receipt-cut-line no-print"
            >
              <span>✂ - - - - - - - - - - TEAR / CUT HERE - - - - - - - - - - ✂</span>
            </div>

            <!-- Physical Page Break on Thermal Paper Roll -->
            <div
              v-if="idx < activePrintItems.length - 1"
              class="print-page-break"
            ></div>
          </div>
        </div>
      </v-card-text>

      <!-- Modal Actions Footer (no-print) -->
      <v-card-actions class="dialog-actions px-5 py-3-5 bg-slate-50 border-t d-flex align-center justify-space-between no-print">
        <!-- Target Selection Menu -->
        <v-menu location="top start">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              variant="outlined"
              color="slate-600"
              size="small"
              class="text-capitalize font-weight-medium rounded-lg"
              append-icon="mdi-chevron-down"
            >
              {{ printFilterLabel }}
            </v-btn>
          </template>
          <v-list density="compact" class="py-1 rounded-lg" max-height="300">
            <v-list-item @click="selectedShopId = 'all'">
              <template #prepend><v-icon size="16" color="primary">mdi-format-list-bulleted</v-icon></template>
              <v-list-item-title class="text-caption font-weight-bold">
                All Route Shops ({{ allPrintableItems.length }} Slips)
              </v-list-item-title>
            </v-list-item>
            <v-divider class="my-1" />
            <v-list-item
              v-for="item in allPrintableItems"
              :key="item.shopId || item.id"
              @click="selectedShopId = (item.shopId || item.id)"
            >
              <template #prepend><v-icon size="16" color="slate-500">mdi-store-outline</v-icon></template>
              <v-list-item-title class="text-caption">
                <strong>{{ item.shopCode }}</strong> - {{ item.shopName }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- Right Side: Close & Primary Print -->
        <div class="d-flex align-center gap-2">
          <v-btn
            variant="text"
            color="slate-600"
            class="text-capitalize font-weight-medium px-3"
            @click="close"
          >
            Close
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="print-action-btn text-capitalize font-weight-bold px-5 rounded-lg"
            prepend-icon="mdi-printer"
            @click="executePrint"
          >
            {{ selectedShopId === 'all' ? `Print All Slips (${activePrintItems.length})` : 'Print Shop Slip' }}
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  dispatchData: { type: Object, default: () => ({}) },
  autoPrint: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'printed']);

const selectedShopId = ref('all');
const currentTimeStr = ref(formatTime(new Date()));

const dispatchInfo = computed(() => {
  return props.dispatchData || {};
});

const routeTitle = computed(() => {
  return dispatchInfo.value.areaName || 'Route Dispatch';
});

// All printable items in this route dispatch
const allPrintableItems = computed(() => {
  const items = dispatchInfo.value.items || [];
  if (!Array.isArray(items)) return [];
  return items;
});

// Active filtered items to print
const activePrintItems = computed(() => {
  if (selectedShopId.value === 'all') {
    return allPrintableItems.value;
  }
  return allPrintableItems.value.filter(
    (it) => (it.shopId || it.id) === selectedShopId.value
  );
});

const printFilterLabel = computed(() => {
  if (selectedShopId.value === 'all') {
    return `All Shops (${allPrintableItems.value.length})`;
  }
  const match = allPrintableItems.value.find(
    (it) => (it.shopId || it.id) === selectedShopId.value
  );
  if (match) {
    return `${match.shopCode || ''} ${match.shopName || ''}`.trim();
  }
  return 'Select Shop';
});

function formatTime(d) {
  try {
    const dt = new Date(d);
    return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (e) {
    return '02:00 PM';
  }
}

function formatSlipDate(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const m = parseInt(parts[1], 10) - 1;
    return `${parts[2]} ${months[m] || ''} ${parts[0]}`;
  }
  return dateStr;
}

function formatNumber(val) {
  const n = Number(val) || 0;
  return n.toLocaleString('en-US');
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      selectedShopId.value = 'all';
      currentTimeStr.value = formatTime(new Date());
      if (props.autoPrint) {
        nextTick(() => {
          setTimeout(() => {
            executePrint();
          }, 350);
        });
      }
    }
  }
);

function executePrint() {
  nextTick(() => {
    window.print();
    emit('printed');
  });
}

function close() {
  emit('update:modelValue', false);
}
</script>

<style scoped>
.receipt-dialog-card {
  border: 1px solid #e2e8f0;
  background: #ffffff;
}

.dialog-header {
  background: #063F78; /* App Brand Navy */
}

.header-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
}

.close-btn {
  opacity: 0.85;
  transition: opacity 0.15s ease;
}

.close-btn:hover {
  opacity: 1;
}

.receipt-scroll-area {
  max-height: 75vh;
  overflow-y: auto;
  background: #f1f5f9;
}

/* 80mm POS Slip Screen Styling */
.pos-80mm-slip {
  width: 80mm;
  max-width: 100%;
  margin: 0 auto;
  background: #ffffff;
  color: #000000;
  padding: 18px 16px 20px 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 13px;
  line-height: 1.4;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.slip-type-header {
  text-align: center;
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 1px;
  padding: 2px 0 8px 0;
  border-bottom: 1px dashed #000000;
  margin-bottom: 8px;
  color: #000000;
  text-transform: uppercase;
}

.slip-brand-box {
  text-align: center;
  padding: 2px 0 4px 0;
}

.slip-since {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.4px;
}

.slip-title-urdu {
  text-align: center;
  font-size: 28px;
  font-weight: 900;
  font-family: "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Urdu Typesetting", "Arabic Typesetting", serif;
  margin: 4px 0 2px 0;
  line-height: 1.35;
  letter-spacing: 0.5px;
}

.slip-address,
.slip-phone {
  text-align: center;
  font-size: 11.5px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.4;
  margin: 1px 0;
}

.slip-divider-dashed {
  border-bottom: 1px dashed #000000;
  margin: 10px 0;
}

/* Route & Trip Dedicated Rows */
.slip-meta-rows {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 2px 0;
}

.slip-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  line-height: 1.35;
}

.slip-meta-lbl {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.lbl-en {
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
}

.lbl-ur {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, Arial, sans-serif;
  direction: rtl;
}

.slip-meta-val {
  font-size: 12.5px;
  font-weight: 800;
  color: #000000;
  text-align: right;
  letter-spacing: 0.2px;
}

/* Shop Identity Banner */
.slip-shop-banner {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 8px 10px;
  margin: 10px 0;
}

.slip-shop-headline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slip-shop-badge {
  background: #063F78;
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.slip-shop-name {
  font-size: 14.5px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.25;
}

.slip-shop-subline {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #475569;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px dashed #e2e8f0;
}

.owner-lbl {
  font-weight: 600;
  color: #64748b;
}

.owner-val {
  font-weight: 700;
  color: #0f172a;
}

/* Line Items Table */
.slip-table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0 14px 0;
  border: 1.5px solid #000000;
  background: #ffffff;
}

.slip-th-row {
  background: #f1f5f9;
  border-bottom: 1.5px solid #000000;
}

.slip-th-val {
  width: 50%;
  padding: 5px 8px;
  font-size: 10.5px;
  font-weight: 800;
  text-align: left;
  border-right: 1px solid #000000;
  color: #334155;
  text-transform: uppercase;
}

.slip-th-lbl {
  width: 50%;
  padding: 5px 8px;
  font-size: 10.5px;
  font-weight: 800;
  text-align: right;
  color: #334155;
  direction: rtl;
  text-transform: uppercase;
}

.slip-tr {
  border-bottom: 1px solid #000000;
}

.slip-td-val {
  width: 50%;
  padding: 7px 10px;
  text-align: left;
  border-right: 1px solid #000000;
  vertical-align: middle;
}

.val-num {
  font-size: 14.5px;
  font-weight: 800;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #000000;
}

.val-unit {
  font-size: 11.5px;
  font-weight: 600;
  color: #475569;
  margin-left: 3px;
}

.slip-td-lbl {
  width: 50%;
  padding: 6px 10px;
  text-align: right;
  direction: rtl;
  vertical-align: middle;
}

.lbl-ur {
  font-size: 13.5px;
  font-weight: 800;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, Arial, sans-serif;
  line-height: 1.35;
  color: #000000;
}

.lbl-en {
  font-size: 9.5px;
  font-weight: 700;
  color: #64748b;
  line-height: 1.2;
  margin-top: 1px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  direction: ltr;
  text-align: right;
}

.slip-tr-payable {
  border-top: 1.5px solid #000000;
  border-bottom: 1.5px solid #000000;
  background: #f8fafc;
}

.slip-val-highlight .val-num {
  font-size: 16px;
  font-weight: 900;
  color: #000000;
}

.slip-lbl-highlight .lbl-ur {
  font-size: 14.5px;
  font-weight: 900;
  color: #000000;
}

.slip-lbl-highlight .lbl-en {
  color: #0f172a;
  font-weight: 800;
}

.slip-tr-balance {
  border-top: 1.5px solid #000000;
  border-bottom: none;
}

/* Receiver Signature Box */
.slip-sign-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  margin-top: 16px;
  margin-bottom: 2px;
  direction: rtl;
}

.slip-sign-lbl {
  font-size: 12.5px;
  font-weight: 800;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, Arial, sans-serif;
  color: #000000;
  white-space: nowrap;
  flex-shrink: 0;
}

.slip-sign-line {
  flex: 1;
  border-bottom: 1.5px dashed #000000;
  height: 1px;
  margin-bottom: 4px;
}

.slip-sign-sub-en {
  font-size: 9px;
  font-weight: 600;
  color: #64748b;
  text-align: right;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Courtesy Footer */
.slip-footer-text {
  text-align: center;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px dashed #000000;
}

.footer-ur {
  font-size: 12px;
  font-weight: 800;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, Arial, sans-serif;
  direction: rtl;
  line-height: 1.4;
  color: #000000;
}

.footer-en {
  font-size: 9.5px;
  font-weight: 600;
  color: #64748b;
  margin-top: 2px;
  letter-spacing: 0.2px;
}

.receipt-cut-line {
  text-align: center;
  font-size: 10px;
  color: #64748b;
  margin: 24px 0;
  letter-spacing: 1.2px;
}

.dialog-actions {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.print-action-btn {
  background: #063F78 !important;
  color: #ffffff !important;
  box-shadow: 0 2px 6px rgba(6, 63, 120, 0.25);
}

.print-action-btn:hover {
  background: #053361 !important;
}

/* 80mm ESC/POS Thermal Printing Mode */
@media print {
  @page {
    size: 80mm auto;
    margin: 0;
  }

  html, body {
    width: 80mm !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
  }

  body * {
    visibility: hidden;
  }

  .route-receipt-printable-container,
  .route-receipt-printable-container * {
    visibility: visible !important;
  }

  .route-receipt-printable-container {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 80mm !important;
    max-width: 80mm !important;
    margin: 0 !important;
    padding: 2mm 3mm !important;
    box-shadow: none !important;
    border: none !important;
    background: #ffffff !important;
    z-index: 999999;
  }

  .pos-80mm-slip {
    width: 100% !important;
    max-width: 100% !important;
    border: none !important;
    box-shadow: none !important;
    padding: 2mm 1mm 10mm 1mm !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .slip-table {
    border: 1.5px solid #000000 !important;
  }

  .slip-th-row {
    background: #f1f5f9 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .slip-tr {
    border-bottom: 1px solid #000000 !important;
  }

  .slip-td-val {
    border-right: 1px solid #000000 !important;
  }

  .slip-tr-payable {
    border-top: 1.5px solid #000000 !important;
    border-bottom: 1.5px solid #000000 !important;
    background: #f8fafc !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .slip-tr-balance {
    border-top: 1.5px solid #000000 !important;
  }

  .slip-sign-line {
    border-bottom: 1.5px dashed #000000 !important;
  }

  .print-page-break {
    display: block !important;
    page-break-after: always !important;
    break-after: page !important;
    height: 1px !important;
  }

  .no-print {
    display: none !important;
  }
}
</style>
