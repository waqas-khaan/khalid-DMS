<template>
  <v-dialog
    :model-value="modelValue"
    max-width="480"
    width="95vw"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="receipt-dialog-card rounded-2xl overflow-hidden" elevation="6">
      <!-- Sophisticated Header (no-print) -->
      <div class="dialog-header px-5 py-4 text-white d-flex align-center justify-space-between no-print">
        <div class="d-flex align-center gap-3">
          <div class="header-icon-box d-flex align-center justify-center">
            <v-icon color="white" size="20">mdi-receipt-text-check-outline</v-icon>
          </div>
          <div>
            <h2 class="text-subtitle-1 font-weight-bold line-height-tight mb-0 text-white">
              80mm Thermal Receipt
            </h2>
            <div class="text-caption text-blue-lighten-4 mt-0-5" style="font-size: 0.75rem !important;">
              Dual Copies &bull; Gate Receipt &amp; Customer Slip
            </div>
          </div>
        </div>
        <v-btn icon size="small" variant="text" color="white" class="close-btn" @click="close">
          <v-icon size="18">mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Printable Area Wrapper -->
      <v-card-text class="pa-5 bg-slate-100 receipt-scroll-area">
        <div id="receipt-printable-target" class="receipt-printable-container py-2">
          <!-- SLIP 1: GATE RECEIPT -->
          <div
            v-if="printTarget === 'all' || printTarget === 'gate'"
            class="pos-80mm-slip gate-copy-slip"
          >
            <!-- Copy Identifier Banner -->
            <div class="slip-type-header">
              GATE RECEIPT
            </div>

            <!-- Top Business Info -->
            <div class="slip-header-row justify-center">
              <span class="slip-since">Since: 1960</span>
            </div>

            <div class="slip-title-urdu">خالد ملک</div>
            <div class="slip-address">Warsk Road, Peshawar</div>
            <div class="slip-phone">Manager : 0333-9322266</div>

            <div class="slip-divider-dashed"></div>

            <!-- Token, Date, Time in dedicated rows -->
            <div class="slip-meta-rows">
              <div class="slip-meta-row">
                <span class="slip-meta-lbl">Token:</span>
                <span class="slip-meta-val font-weight-bold font-mono">#{{ saleData.token || '440b23ce' }}</span>
              </div>
              <div class="slip-meta-row">
                <span class="slip-meta-lbl">Date:</span>
                <span class="slip-meta-val">{{ formatSlipDate(saleData.date) }}</span>
              </div>
              <div class="slip-meta-row">
                <span class="slip-meta-lbl">Time:</span>
                <span class="slip-meta-val">{{ saleData.time || '02:16 PM' }}</span>
              </div>
            </div>

            <div class="slip-divider-dashed"></div>

            <!-- Customer & Rate Row -->
            <div class="slip-customer-row">
              <span class="slip-customer-name">{{ saleData.customerName || 'Guest Customer' }}</span>
              <span class="slip-rate font-weight-bold">{{ saleData.rate || 195 }} / Rate</span>
            </div>

            <!-- Line Items Table -->
            <table class="slip-table">
              <tbody>
                <tr class="slip-tr">
                  <td class="slip-td-val">{{ saleData.quantityKg || 0 }}</td>
                  <td class="slip-td-lbl">کلو</td>
                </tr>
                <tr v-if="saleData.returnKgs > 0" class="slip-tr">
                  <td class="slip-td-val text-orange-darken-4">-{{ saleData.returnKgs }}</td>
                  <td class="slip-td-lbl">واپسی دودھ</td>
                </tr>
                <tr class="slip-tr">
                  <td class="slip-td-val">{{ formatNumber(saleData.totalAmount) }}</td>
                  <td class="slip-td-lbl">رقم</td>
                </tr>
                <tr class="slip-tr">
                  <td class="slip-td-val">{{ formatNumber(saleData.paidAmount) }}</td>
                  <td class="slip-td-lbl">وصول / ادا کیا</td>
                </tr>
                <tr class="slip-tr slip-tr-balance">
                  <td class="slip-td-val">{{ formatNumber(saleData.bakaya) }}</td>
                  <td class="slip-td-lbl">بقیہ</td>
                </tr>
              </tbody>
            </table>

            <div class="slip-footer-text">
              برائے مہربانی دودھ موقع پر چیک کریں۔ شکریہ!
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
              CUSTOMER COPY
            </div>

            <!-- Top Business Info -->
            <div class="slip-header-row justify-center">
              <span class="slip-since">Since: 1960</span>
            </div>

            <div class="slip-title-urdu">خالد ملک</div>
            <div class="slip-address">Warsk Road, Peshawar</div>
            <div class="slip-phone">Manager : 0333-9322266</div>

            <div class="slip-divider-dashed"></div>

            <!-- Token, Date, Time in dedicated rows -->
            <div class="slip-meta-rows">
              <div class="slip-meta-row">
                <span class="slip-meta-lbl">Token:</span>
                <span class="slip-meta-val font-weight-bold font-mono">#{{ saleData.token || '440b23ce' }}</span>
              </div>
              <div class="slip-meta-row">
                <span class="slip-meta-lbl">Date:</span>
                <span class="slip-meta-val">{{ formatSlipDate(saleData.date) }}</span>
              </div>
              <div class="slip-meta-row">
                <span class="slip-meta-lbl">Time:</span>
                <span class="slip-meta-val">{{ saleData.time || '02:16 PM' }}</span>
              </div>
            </div>

            <div class="slip-divider-dashed"></div>

            <!-- Customer & Rate Row -->
            <div class="slip-customer-row">
              <span class="slip-customer-name">{{ saleData.customerName || 'Guest Customer' }}</span>
              <span class="slip-rate font-weight-bold">{{ saleData.rate || 195 }} / Rate</span>
            </div>

            <!-- Line Items Table -->
            <table class="slip-table">
              <tbody>
                <tr class="slip-tr">
                  <td class="slip-td-val">{{ saleData.quantityKg || 0 }}</td>
                  <td class="slip-td-lbl">کلو</td>
                </tr>
                <tr v-if="saleData.returnKgs > 0" class="slip-tr">
                  <td class="slip-td-val text-orange-darken-4">-{{ saleData.returnKgs }}</td>
                  <td class="slip-td-lbl">واپسی دودھ</td>
                </tr>
                <tr class="slip-tr">
                  <td class="slip-td-val">{{ formatNumber(saleData.totalAmount) }}</td>
                  <td class="slip-td-lbl">رقم</td>
                </tr>
                <tr class="slip-tr">
                  <td class="slip-td-val">{{ formatNumber(saleData.paidAmount) }}</td>
                  <td class="slip-td-lbl">وصول / ادا کیا</td>
                </tr>
                <tr class="slip-tr slip-tr-balance">
                  <td class="slip-td-val">{{ formatNumber(saleData.bakaya) }}</td>
                  <td class="slip-td-lbl">بقیہ</td>
                </tr>
              </tbody>
            </table>

            <div class="slip-footer-text">
              برائے مہربانی دودھ موقع پر چیک کریں۔ شکریہ!
            </div>
          </div>
        </div>
      </v-card-text>

      <!-- Clean Modal Actions Footer (no-print) -->
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
              {{ printTargetLabel }}
            </v-btn>
          </template>
          <v-list density="compact" class="py-1 rounded-lg">
            <v-list-item @click="setTarget('all')">
              <template #prepend><v-icon size="16" color="primary">mdi-content-copy</v-icon></template>
              <v-list-item-title class="text-caption font-weight-bold">Both Slips (Gate + Customer)</v-list-item-title>
            </v-list-item>
            <v-list-item @click="setTarget('gate')">
              <template #prepend><v-icon size="16" color="slate-600">mdi-shield-check-outline</v-icon></template>
              <v-list-item-title class="text-caption font-weight-bold">Gate Receipt Only</v-list-item-title>
            </v-list-item>
            <v-list-item @click="setTarget('customer')">
              <template #prepend><v-icon size="16" color="slate-600">mdi-account-outline</v-icon></template>
              <v-list-item-title class="text-caption font-weight-bold">Customer Copy Only</v-list-item-title>
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
            {{ printTarget === 'all' ? 'Print Both Slips' : 'Print Slip' }}
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
  sale: { type: Object, default: () => ({}) },
  autoPrint: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'printed']);

const printTarget = ref('all'); // 'all' | 'gate' | 'customer'

const printTargetLabel = computed(() => {
  if (printTarget.value === 'gate') return 'Gate Slip Only';
  if (printTarget.value === 'customer') return 'Customer Slip Only';
  return 'Both Slips (2x)';
});

function setTarget(target) {
  printTarget.value = target;
}

const saleData = computed(() => {
  const s = props.sale || {};
  const qty = Number(s.quantityKg ?? s.totalMilk) || 0;
  const returnKgs = Number(s.returnKgs ?? s.totalReturnMilk) || 0;
  const rate = Number(s.rate ?? s.price) || 195;
  const total = Number(s.totalAmount ?? (qty * rate)) || 0;
  const paid = Number(s.paidAmount ?? s.totalCollection ?? total) || 0;
  const paymentReturn = Number(s.paymentReturn) || 0;
  const balance = Math.max(0, Number(s.balance ?? s.totalNewArrears ?? (total - paid)) || 0);

  let bakaya = 0;
  if (paymentReturn > 0) {
    bakaya = paymentReturn;
  } else if (paid > total) {
    bakaya = paid - total;
  } else if (balance > 0) {
    bakaya = balance;
  }

  return {
    token: s.token || (s.id ? s.id.substring(0, 8) : '440b23ce'),
    date: s.date || new Date().toISOString().split('T')[0],
    time: s.time || (s.createdAt ? formatTime(s.createdAt) : formatTime(new Date())),
    customerName: s.customerName || (s.items && s.items[0]?.shopName) || 'Guest Customer',
    quantityKg: qty,
    returnKgs,
    rate,
    totalAmount: total,
    paidAmount: paid,
    paymentReturn,
    balance,
    bakaya,
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

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      printTarget.value = 'all';
      if (props.autoPrint) {
        nextTick(() => {
          setTimeout(() => {
            executePrint();
          }, 300);
        });
      }
    }
  }
);

function executePrint() {
  document.body.classList.add('printing-modal-active');
  const cleanup = () => {
    document.body.classList.remove('printing-modal-active');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);

  nextTick(() => {
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 2000);
      emit('printed');
    }, 50);
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
  max-height: 72vh;
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
  padding: 22px 20px 24px 20px;
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
  font-size: 13px;
  letter-spacing: 1.5px;
  padding: 2px 0 10px 0;
  border-bottom: 1px dashed #000000;
  margin-bottom: 12px;
  color: #000000;
  text-transform: uppercase;
}

.slip-header-row {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 2px 0 4px 0;
}

.slip-since {
  font-size: 11.5px;
  font-weight: 700;
  color: #334155;
  text-align: center;
  letter-spacing: 0.4px;
}

.slip-title-urdu {
  text-align: center;
  font-size: 30px;
  font-weight: 900;
  font-family: "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Urdu Typesetting", "Arabic Typesetting", serif;
  margin: 8px 0 4px 0;
  line-height: 1.35;
  letter-spacing: 0.5px;
}

.slip-address,
.slip-phone {
  text-align: center;
  font-size: 11.5px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.5;
  margin: 2px 0;
}

.slip-divider-dashed {
  border-bottom: 1px dashed #000000;
  margin: 12px 0;
}

/* Token, Date, Time dedicated rows */
.slip-meta-rows {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 4px 0;
}

.slip-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12.5px;
  line-height: 1.35;
}

.slip-meta-lbl {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  letter-spacing: 0.3px;
}

.slip-meta-val {
  font-size: 12.5px;
  font-weight: 800;
  color: #000000;
  text-align: right;
  letter-spacing: 0.4px;
}

/* Customer & Rate Row */
.slip-customer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  margin-bottom: 4px;
}

.slip-customer-name {
  font-size: 13.5px;
  font-weight: 800;
  color: #000000;
}

.slip-rate {
  font-size: 13.5px;
  font-weight: 800;
  color: #000000;
}

/* Line Items Table */
.slip-table {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0 16px 0;
  border: 1.5px solid #000000;
  background: #ffffff;
}

.slip-tr {
  border-bottom: 1px solid #000000;
}

.slip-td-val {
  width: 50%;
  padding: 8px 10px;
  text-align: left;
  font-weight: 800;
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  line-height: 1.3;
  border-right: 1px solid #000000;
  vertical-align: middle;
}

.slip-td-lbl {
  width: 50%;
  padding: 8px 10px;
  text-align: right;
  direction: rtl;
  font-weight: 900;
  font-size: 18px;
  font-family: "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Urdu Typesetting", serif;
  line-height: 1.4;
  vertical-align: middle;
}

.slip-tr-balance {
  border-top: 1.5px solid #000000;
  border-bottom: none;
}

.slip-tr-balance .slip-td-val {
  font-size: 16.5px;
  font-weight: 900;
}

.slip-tr-balance .slip-td-lbl {
  font-size: 18.5px;
  font-weight: 900;
}

.slip-footer-text {
  text-align: center;
  font-size: 13.5px;
  font-weight: 800;
  margin-top: 18px;
  margin-bottom: 4px;
  line-height: 1.5;
  font-family: "Noto Nastaliq Urdu", "Urdu Typesetting", serif;
  direction: rtl;
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
  .pos-80mm-slip {
    width: 76mm !important;
    max-width: 76mm !important;
    margin: 0 auto !important;
    padding: 3mm 2mm 6mm 2mm !important;
    border: 1.5px solid #000000 !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    background: #ffffff !important;
    color: #000000 !important;
  }

  .slip-type-header {
    border-bottom: 1.5px dashed #000000 !important;
    color: #000000 !important;
  }

  .slip-divider-dashed {
    border-bottom: 1px dashed #000000 !important;
  }

  .slip-table {
    border: 1.5px solid #000000 !important;
    background: #ffffff !important;
    width: 100% !important;
  }

  .slip-tr {
    border-bottom: 1px solid #000000 !important;
  }

  .slip-td-val {
    border-right: 1px solid #000000 !important;
    color: #000000 !important;
  }

  .slip-td-lbl {
    color: #000000 !important;
  }

  .slip-tr-balance {
    border-top: 1.5px solid #000000 !important;
  }

  .print-page-break {
    display: block !important;
    page-break-after: always !important;
    break-after: page !important;
    height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
  }

  .no-print {
    display: none !important;
  }
}
</style>
