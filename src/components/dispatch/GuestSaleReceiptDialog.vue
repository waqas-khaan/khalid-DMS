<template>
  <v-dialog
    :model-value="modelValue"
    max-width="520"
    width="95vw"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="rounded-xl overflow-hidden shadow-xl" elevation="0">
      <!-- Dialog Header (no-print) -->
      <div class="pa-4 bg-slate-900 text-white d-flex align-center justify-space-between no-print">
        <div class="d-flex align-center gap-2">
          <v-icon color="amber" size="22">mdi-receipt-text-check</v-icon>
          <div>
            <div class="font-weight-black text-subtitle-2 line-height-tight">80mm POS Thermal Receipt</div>
            <div class="text-caption text-slate-300" style="font-size: 0.72rem !important;">
              Dual Copies: Gate Receipt + Customer Copy
            </div>
          </div>
        </div>
        <v-btn icon size="small" variant="text" color="white" @click="close">
          <v-icon size="18">mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Action Toolbar (no-print) -->
      <div class="pa-3 bg-slate-100 border-b d-flex align-center justify-space-between flex-wrap gap-2 no-print">
        <div class="d-flex align-center gap-1">
          <v-chip size="x-small" color="primary" variant="flat" class="font-weight-bold">
            80mm Standard Roll
          </v-chip>
          <v-chip size="x-small" color="success" variant="flat" class="font-weight-bold">
            2 Slips Ready
          </v-chip>
        </div>

        <div class="d-flex align-center gap-2">
          <v-btn
            size="small"
            variant="flat"
            color="primary"
            class="font-weight-black text-capitalize px-4"
            prepend-icon="mdi-printer"
            @click="printAll"
          >
            Print Both (2x)
          </v-btn>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn size="small" variant="outlined" color="primary" icon="mdi-dots-vertical" v-bind="props" />
            </template>
            <v-list density="compact" class="py-1">
              <v-list-item prepend-icon="mdi-shield-check" @click="printSingle('gate')">
                <v-list-item-title class="text-caption font-weight-bold">Gate Receipt Only</v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-account" @click="printSingle('customer')">
                <v-list-item-title class="text-caption font-weight-bold">Customer Copy Only</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>

      <!-- Printable Area Wrapper -->
      <v-card-text class="pa-4 bg-slate-50 receipt-scroll-area">
        <div id="receipt-printable-target" class="receipt-printable-container">
          <!-- SLIP 1: GATE RECEIPT -->
          <div
            v-if="printTarget === 'all' || printTarget === 'gate'"
            class="pos-80mm-slip gate-copy-slip"
          >
            <!-- Copy Identifier Banner -->
            <div class="slip-type-header">
              *** GATE RECEIPT / گیٹ رسید ***
            </div>

            <!-- Top Business Info -->
            <div class="slip-header-row">
              <span class="slip-since">Since: 1960</span>
              <span class="slip-license">License# 8822</span>
            </div>

            <div class="slip-title-urdu">خالد ملک</div>
            <div class="slip-address">Warsk Road, Peshawar</div>
            <div class="slip-phone">Manager : 0333-9322266</div>

            <div class="slip-divider-dashed"></div>

            <!-- QR Code & Token Row -->
            <div class="slip-meta-row">
              <div class="slip-qr-box">
                <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR" class="slip-qr-img" />
              </div>
              <div class="slip-meta-text">
                <div class="slip-token">{{ saleData.token || '440b23ce' }}</div>
                <div class="slip-date">{{ formatSlipDate(saleData.date) }}</div>
                <div class="slip-time">{{ saleData.time || '02:16 PM' }}</div>
              </div>
            </div>

            <div class="slip-divider-dashed"></div>

            <!-- Sequence / Arrears & Rate Row -->
            <div class="slip-sub-row">
              <span class="slip-seq">{{ saleData.seqNo || '270,589,883' }}</span>
              <span class="slip-rate font-weight-bold">{{ saleData.rate || 195 }} / Rate</span>
            </div>

            <div class="slip-customer-name">
              {{ saleData.customerName || 'Guest Customer [ 13 ]' }}
            </div>

            <div class="slip-divider-solid"></div>

            <!-- Line Items Table (Matches Image) -->
            <div class="slip-table-rows">
              <div class="slip-row">
                <span class="slip-val">{{ saleData.quantityKg || 0 }}</span>
                <span class="slip-lbl-urdu">کلو</span>
              </div>
              <div class="slip-row">
                <span class="slip-val">{{ formatNumber(saleData.totalAmount) }}</span>
                <span class="slip-lbl-urdu">رقم</span>
              </div>
              <div class="slip-row">
                <span class="slip-val">{{ formatNumber(saleData.paidAmount) }}</span>
                <span class="slip-lbl-urdu">ادا کیا</span>
              </div>
              <div class="slip-row">
                <span class="slip-val">{{ formatNumber(saleData.balance || 0) }}</span>
                <span class="slip-lbl-urdu">بقیہ</span>
              </div>
              <div class="slip-box-row">
                <span class="slip-val">{{ saleData.totalBalance || '270,589,883' }}</span>
                <span class="slip-lbl-urdu">کل بقیہ</span>
              </div>
            </div>

            <div class="slip-footer-text">
              برائے مہربانی دودھ موقع پر چیک کریں۔ شکریہ!
            </div>
            <div class="slip-security-mark">
              Gate Clearance Pass &bull; Verified
            </div>
          </div>

          <!-- Tear / Cut Line between slips -->
          <div
            v-if="printTarget === 'all'"
            class="receipt-cut-line no-print"
          >
            <span>✂ - - - - - - - - - - TEAR / CUT HERE - - - - - - - - - - ✂</span>
          </div>
          <div v-if="printTarget === 'all'" class="print-page-break"></div>

          <!-- SLIP 2: CUSTOMER COPY -->
          <div
            v-if="printTarget === 'all' || printTarget === 'customer'"
            class="pos-80mm-slip customer-copy-slip"
          >
            <!-- Copy Identifier Banner -->
            <div class="slip-type-header">
              *** CUSTOMER COPY / کسٹمر رسید ***
            </div>

            <!-- Top Business Info -->
            <div class="slip-header-row">
              <span class="slip-since">Since: 1960</span>
              <span class="slip-license">License# 8822</span>
            </div>

            <div class="slip-title-urdu">خالد ملک</div>
            <div class="slip-address">Warsk Road, Peshawar</div>
            <div class="slip-phone">Manager : 0333-9322266</div>

            <div class="slip-divider-dashed"></div>

            <!-- QR Code & Token Row -->
            <div class="slip-meta-row">
              <div class="slip-qr-box">
                <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR" class="slip-qr-img" />
              </div>
              <div class="slip-meta-text">
                <div class="slip-token">{{ saleData.token || '440b23ce' }}</div>
                <div class="slip-date">{{ formatSlipDate(saleData.date) }}</div>
                <div class="slip-time">{{ saleData.time || '02:16 PM' }}</div>
              </div>
            </div>

            <div class="slip-divider-dashed"></div>

            <!-- Sequence / Arrears & Rate Row -->
            <div class="slip-sub-row">
              <span class="slip-seq">{{ saleData.seqNo || '270,589,883' }}</span>
              <span class="slip-rate font-weight-bold">{{ saleData.rate || 195 }} / Rate</span>
            </div>

            <div class="slip-customer-name">
              {{ saleData.customerName || 'Guest Customer [ 13 ]' }}
            </div>

            <div class="slip-divider-solid"></div>

            <!-- Line Items Table (Matches Image) -->
            <div class="slip-table-rows">
              <div class="slip-row">
                <span class="slip-val">{{ saleData.quantityKg || 0 }}</span>
                <span class="slip-lbl-urdu">کلو</span>
              </div>
              <div class="slip-row">
                <span class="slip-val">{{ formatNumber(saleData.totalAmount) }}</span>
                <span class="slip-lbl-urdu">رقم</span>
              </div>
              <div class="slip-row">
                <span class="slip-val">{{ formatNumber(saleData.paidAmount) }}</span>
                <span class="slip-lbl-urdu">ادا کیا</span>
              </div>
              <div class="slip-row">
                <span class="slip-val">{{ formatNumber(saleData.balance || 0) }}</span>
                <span class="slip-lbl-urdu">بقیہ</span>
              </div>
              <div class="slip-box-row">
                <span class="slip-val">{{ saleData.totalBalance || '270,589,883' }}</span>
                <span class="slip-lbl-urdu">کل بقیہ</span>
              </div>
            </div>

            <div class="slip-footer-text">
              برائے مہربانی دودھ موقع پر چیک کریں۔ شکریہ!
            </div>
            <div class="slip-security-mark">
              Customer Copy &bull; Payment Received
            </div>
          </div>
        </div>
      </v-card-text>

      <!-- Footer Buttons (no-print) -->
      <v-card-actions class="pa-4 bg-white border-t d-flex align-center justify-end gap-2 no-print">
        <v-btn variant="text" class="text-capitalize" @click="close">
          Close
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="font-weight-black text-capitalize px-6"
          prepend-icon="mdi-printer"
          @click="printAll"
        >
          Print 2x 80mm Slips
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import QRCode from 'qrcode';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  sale: { type: Object, default: () => ({}) },
  autoPrint: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'printed']);

const qrDataUrl = ref('');
const printTarget = ref('all'); // 'all' | 'gate' | 'customer'

const saleData = computed(() => {
  const s = props.sale || {};
  const qty = Number(s.quantityKg ?? s.totalMilk) || 0;
  const rate = Number(s.rate ?? s.price) || 195;
  const total = Number(s.totalAmount ?? (qty * rate)) || 0;
  const paid = Number(s.paidAmount ?? s.totalCollection ?? total) || 0;
  const balance = Math.max(0, Number(s.balance ?? s.totalNewArrears ?? (total - paid)) || 0);

  return {
    token: s.token || (s.id ? s.id.substring(0, 8) : '440b23ce'),
    seqNo: s.seqNo || '270,589,883',
    date: s.date || new Date().toISOString().split('T')[0],
    time: s.time || (s.createdAt ? formatTime(s.createdAt) : formatTime(new Date())),
    customerName: s.customerName || (s.items && s.items[0]?.shopName) || 'Guest Customer [ 13 ]',
    quantityKg: qty,
    rate,
    totalAmount: total,
    paidAmount: paid,
    balance,
    totalBalance: s.totalBalance || s.totalPreviousArrears || '270,589,883',
  };
});

function formatTime(d) {
  try {
    const dt = new Date(d);
    return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (e) {
    return '02:16 PM';
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

// Generate QR Code
watch(
  () => props.sale,
  async (newVal) => {
    if (newVal) {
      try {
        const qrContent = `KM:${saleData.value.token}:${saleData.value.date}:${saleData.value.quantityKg}KG:RS${saleData.value.totalAmount}`;
        qrDataUrl.value = await QRCode.toDataURL(qrContent, {
          width: 120,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        });
      } catch (err) {
        console.error('Failed to generate QR Code:', err);
      }
    }
  },
  { immediate: true, deep: true }
);

watch(
  () => props.modelValue,
  (val) => {
    if (val && props.autoPrint) {
      nextTick(() => {
        setTimeout(() => {
          printAll();
        }, 300);
      });
    }
  }
);

function printAll() {
  printTarget.value = 'all';
  nextTick(() => {
    window.print();
    emit('printed');
  });
}

function printSingle(target) {
  printTarget.value = target;
  nextTick(() => {
    window.print();
    printTarget.value = 'all';
    emit('printed');
  });
}

function close() {
  emit('update:modelValue', false);
}
</script>

<style scoped>
.receipt-scroll-area {
  max-height: 75vh;
  overflow-y: auto;
}

/* 80mm POS Slip Screen Styling */
.pos-80mm-slip {
  width: 80mm;
  max-width: 100%;
  margin: 0 auto;
  background: #ffffff;
  color: #000000;
  padding: 12px 14px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 13px;
  line-height: 1.35;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.slip-type-header {
  text-align: center;
  font-weight: 800;
  font-size: 11px;
  letter-spacing: 0.5px;
  padding: 2px 0 6px 0;
  border-bottom: 1px dashed #94a3b8;
  margin-bottom: 6px;
  color: #1e293b;
}

.slip-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  color: #1e293b;
}

.slip-title-urdu {
  text-align: center;
  font-size: 26px;
  font-weight: 900;
  font-family: "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Urdu Typesetting", "Arabic Typesetting", serif;
  margin: 2px 0;
  line-height: 1.4;
  letter-spacing: 0.5px;
}

.slip-address,
.slip-phone {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: #0f172a;
}

.slip-divider-dashed {
  border-bottom: 1px dashed #000000;
  margin: 8px 0;
}

.slip-divider-solid {
  border-bottom: 1.5px solid #000000;
  margin: 8px 0;
}

/* QR Code and Meta */
.slip-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.slip-qr-box {
  width: 68px;
  height: 68px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slip-qr-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.slip-meta-text {
  flex-grow: 1;
  text-align: right;
}

.slip-token {
  font-size: 13px;
  font-weight: 800;
  font-family: monospace;
  letter-spacing: 0.5px;
}

.slip-date {
  font-size: 12px;
  font-weight: 600;
}

.slip-time {
  font-size: 11px;
  font-weight: 600;
}

/* Rate & Customer Row */
.slip-sub-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
}

.slip-customer-name {
  text-align: center;
  font-size: 13px;
  font-weight: 800;
  margin-top: 2px;
}

/* Table Rows */
.slip-table-rows {
  margin: 6px 0;
}

.slip-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 4px;
  font-size: 14px;
}

.slip-val {
  font-weight: 800;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.slip-lbl-urdu {
  font-size: 16px;
  font-weight: 900;
  font-family: "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Urdu Typesetting", serif;
  text-align: right;
  direction: rtl;
}

.slip-box-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1.5px solid #000000;
  padding: 4px 6px;
  margin-top: 6px;
  font-size: 14px;
}

.slip-footer-text {
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  margin-top: 10px;
  font-family: "Noto Nastaliq Urdu", "Urdu Typesetting", serif;
  direction: rtl;
}

.slip-security-mark {
  text-align: center;
  font-size: 9px;
  color: #64748b;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.receipt-cut-line {
  text-align: center;
  font-size: 10px;
  color: #64748b;
  margin: 16px 0;
  letter-spacing: 1px;
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

  .receipt-printable-container,
  .receipt-printable-container * {
    visibility: visible !important;
  }

  .receipt-printable-container {
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
    padding: 0 0 10mm 0 !important;
    page-break-inside: avoid;
  }

  .print-page-break {
    display: block;
    page-break-after: always;
    height: 1px;
  }

  .no-print {
    display: none !important;
  }
}
</style>
