<template>
  <v-dialog
    :model-value="modelValue"
    max-width="520"
    width="95vw"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="guest-sale-card rounded-2xl overflow-hidden" elevation="6">
      <!-- Header -->
      <div class="dialog-header px-5 py-4 d-flex align-center justify-space-between text-white">
        <div class="d-flex align-center gap-3">
          <div class="header-icon-wrap d-flex align-center justify-center">
            <v-icon size="20" color="white">mdi-storefront-outline</v-icon>
          </div>
          <div>
            <h2 class="text-subtitle-1 font-weight-bold line-height-tight mb-0 text-white">
              New Guest / Walk-in Sale
            </h2>
            <div class="text-caption text-blue-lighten-4 mt-0-5" style="font-size: 0.75rem !important;">
              Counter Retail Milk Sale &bull; Instant Receipt
            </div>
          </div>
        </div>
        <v-btn
          icon
          size="small"
          variant="text"
          color="white"
          class="close-btn"
          :disabled="saving"
          @click="close"
        >
          <v-icon size="18">mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Meta Strip: Date & Master Rate -->
      <div class="dialog-meta-strip px-5 py-2-5 d-flex align-center justify-space-between bg-slate-50 border-b">
        <div class="d-flex align-center gap-2 text-slate-700">
          <v-icon size="16" color="primary">mdi-calendar-month-outline</v-icon>
          <span class="text-caption font-weight-bold text-slate-800">{{ formatDate(form.date) }}</span>
        </div>
        <div class="d-flex align-center gap-1-5">
          <span class="text-caption text-slate-500 font-weight-medium">Standard Rate:</span>
          <span class="text-caption font-weight-bold text-primary">Rs. {{ masterMilkPrice }} / Kg</span>
        </div>
      </div>

      <!-- Form Content -->
      <v-card-text class="pa-5 bg-white">
        <!-- Customer Name -->
        <div class="mb-4">
          <label class="field-label mb-1 d-block">Customer Name</label>
          <v-text-field
            v-model="form.customerName"
            density="compact"
            variant="outlined"
            placeholder="Guest Customer"
            prepend-inner-icon="mdi-account-outline"
            hide-details
            class="rounded-lg"
          />
        </div>

        <!-- Milk Quantity Section -->
        <div class="mb-4">
          <div class="d-flex align-center justify-space-between mb-1-5">
            <label class="field-label mb-0">
              Quantity (Kg) <span class="text-rose-500 font-weight-bold">*</span>
            </label>
            <span class="text-caption text-slate-400 font-weight-medium">Select quick preset or enter</span>
          </div>

          <!-- Quick Increment Pills -->
          <div class="preset-pills-row mb-2 d-flex gap-1-5 flex-wrap">
            <button
              v-for="q in [1, 2, 5, 10, 20, 35]"
              :key="q"
              type="button"
              class="preset-pill font-weight-semibold"
              :class="{ 'preset-pill-active': form.quantityKg === q }"
              @click="form.quantityKg = q"
            >
              {{ q }} Kg
            </button>
          </div>

          <v-text-field
            v-model.number="form.quantityKg"
            type="number"
            min="0.25"
            step="0.5"
            density="comfortable"
            variant="outlined"
            suffix="Kg"
            placeholder="e.g. 2, 5, 10"
            prepend-inner-icon="mdi-scale"
            hide-details
            class="rounded-lg font-weight-bold"
          />
        </div>

        <!-- Pricing & Total Amount -->
        <div class="pricing-row d-flex gap-3 align-stretch mb-4">
          <!-- Rate per Kg -->
          <div class="flex-grow-1" style="flex-basis: 50%;">
            <label class="field-label mb-1 d-block">Rate (Rs / Kg)</label>
            <v-text-field
              v-model.number="form.rate"
              type="number"
              min="1"
              density="compact"
              variant="outlined"
              prefix="Rs."
              hide-details
              class="rounded-lg"
            />
          </div>

          <!-- Total Calculation Display -->
          <div class="flex-grow-1 d-flex flex-column" style="flex-basis: 50%;">
            <label class="field-label mb-1 d-block">Total Amount</label>
            <div class="total-calc-box flex-grow-1 d-flex align-center justify-space-between px-3 py-2 rounded-lg">
              <span class="text-caption font-weight-bold text-slate-500">Total</span>
              <div class="text-subtitle-1 font-weight-black text-slate-900">
                <span class="text-caption font-weight-bold text-slate-500 me-1">Rs.</span>
                {{ formatNumber(computedTotal) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Collection Section -->
        <div class="payment-card pa-3-5 rounded-xl mb-3">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="d-flex align-center gap-1-5">
              <v-icon size="17" color="primary">mdi-cash-check</v-icon>
              <span class="text-caption font-weight-bold text-slate-700 text-uppercase tracking-wider">
                Payment Collection
              </span>
            </div>

            <!-- Full Paid Toggle Button -->
            <button
              type="button"
              class="payment-status-badge d-flex align-center gap-1"
              :class="isFullPaid ? 'badge-paid' : 'badge-pending'"
              @click="setFullPaid"
            >
              <v-icon size="13">{{ isFullPaid ? 'mdi-check' : 'mdi-plus' }}</v-icon>
              <span>{{ isFullPaid ? 'Paid in Full' : 'Set Full' }}</span>
            </button>
          </div>

          <v-row dense class="align-center">
            <v-col cols="4">
              <label class="text-caption text-slate-600 font-weight-medium mb-1 d-block">Cash Received</label>
              <v-text-field
                v-model.number="form.paidAmount"
                type="number"
                min="0"
                density="compact"
                variant="outlined"
                prefix="Rs."
                hide-details
                class="bg-white rounded-lg font-weight-bold"
                @update:model-value="onPaidAmountChange"
              />
            </v-col>

            <v-col cols="4">
              <label class="text-caption text-slate-600 font-weight-medium mb-1 d-block text-emerald-800">
                Payment Return (بقیہ)
              </label>
              <v-text-field
                v-model.number="form.paymentReturn"
                type="number"
                min="0"
                density="compact"
                variant="outlined"
                prefix="Rs."
                hide-details
                class="bg-white rounded-lg font-weight-bold"
                style="color: #047857;"
              />
            </v-col>

            <v-col cols="4">
              <label class="text-caption text-slate-600 font-weight-medium mb-1 d-block">Method</label>
              <v-select
                v-model="form.paymentMethod"
                :items="paymentMethods"
                item-title="title"
                item-value="value"
                density="compact"
                variant="outlined"
                hide-details
                class="bg-white rounded-lg"
              />
            </v-col>
          </v-row>

          <!-- Remaining Balance Status (if pending) -->
          <div
            v-if="computedBalance > 0"
            class="balance-row mt-2-5 pt-2 border-t d-flex align-center justify-space-between"
          >
            <span class="text-caption text-slate-600 font-weight-medium d-flex align-center gap-1">
              <v-icon size="14" color="amber-700">mdi-alert-circle-outline</v-icon>
              Remaining Balance:
            </span>
            <span class="text-caption font-weight-black text-rose-600">
              Rs. {{ formatNumber(computedBalance) }} (Pending)
            </span>
          </div>
        </div>

        <!-- Optional Note -->
        <div class="mb-0">
          <v-text-field
            v-model="form.notes"
            density="compact"
            variant="outlined"
            placeholder="Optional note / vehicle plate number..."
            prepend-inner-icon="mdi-file-document-edit-outline"
            hide-details
            class="rounded-lg text-caption"
          />
        </div>
      </v-card-text>

      <!-- Footer Actions -->
      <v-card-actions class="dialog-actions px-5 py-3-5 bg-slate-50 border-t d-flex align-center justify-space-between">
        <v-btn
          variant="text"
          color="slate-600"
          class="text-capitalize font-weight-medium px-3"
          :disabled="saving"
          @click="close"
        >
          Cancel
        </v-btn>

        <div class="d-flex align-center gap-2">
          <v-btn
            variant="outlined"
            color="primary"
            class="text-capitalize font-weight-bold px-4 rounded-lg"
            :loading="saving"
            :disabled="!isValid"
            @click="handleSave(false)"
          >
            Save Only
          </v-btn>

          <v-btn
            color="primary"
            variant="flat"
            class="save-print-btn text-capitalize font-weight-bold px-4 rounded-lg"
            prepend-icon="mdi-printer"
            :loading="saving"
            :disabled="!isValid"
            @click="handleSave(true)"
          >
            Save &amp; Print Slips
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { useBusinessDayStore } from '@/stores/businessDay';
import { dispatchService } from '@/services/dispatchService';
import { milkService } from '@/services/milkService';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  defaultDate: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue', 'saved']);

const settingsStore = useSettingsStore();
const businessDayStore = useBusinessDayStore();

const masterMilkPrice = computed(() => Number(settingsStore.settings.defaultMilkPrice) || 195);

const paymentMethods = [
  { title: 'Cash in Hand', value: 'cash' },
  { title: 'Bank Transfer', value: 'bank' },
];

const form = ref({
  date: '',
  customerName: 'Guest Customer',
  customerPhone: '',
  quantityKg: 2,
  rate: 195,
  paidAmount: 390,
  paymentReturn: 0,
  paymentMethod: 'cash',
  notes: '',
});

const saving = ref(false);

// Initialize form values
function initForm() {
  const d = props.defaultDate || businessDayStore.activeBusinessDate || new Date().toISOString().split('T')[0];
  const rate = masterMilkPrice.value || 195;
  const qty = 2;
  const total = qty * rate;

  form.value = {
    date: d,
    customerName: 'Guest Customer',
    customerPhone: '',
    quantityKg: qty,
    rate,
    paidAmount: total,
    paymentReturn: 0,
    paymentMethod: 'cash',
    notes: '',
  };
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      initForm();
    }
  },
  { immediate: true }
);

const computedTotal = computed(() => {
  const q = Number(form.value.quantityKg) || 0;
  const r = Number(form.value.rate) || 0;
  return Number((q * r).toFixed(2));
});

const computedBalance = computed(() => {
  const total = computedTotal.value;
  const paid = Number(form.value.paidAmount) || 0;
  const ret = Number(form.value.paymentReturn) || 0;
  const netReceived = Math.max(0, paid - ret);
  return Math.max(0, Number((total - netReceived).toFixed(2)));
});

const isFullPaid = computed(() => {
  return computedTotal.value > 0 && Number(form.value.paidAmount) >= computedTotal.value && Number(form.value.paymentReturn) === 0;
});

// Auto-sync paid amount when quantity or rate changes if user was previously full-paid
watch(computedTotal, (newTotal) => {
  if (isFullPaid.value || Number(form.value.paidAmount) === 0) {
    form.value.paidAmount = newTotal;
    form.value.paymentReturn = 0;
  }
});

function onPaidAmountChange(val) {
  const paid = Number(val) || 0;
  const total = computedTotal.value;
  if (paid > total) {
    form.value.paymentReturn = Number((paid - total).toFixed(2));
  } else {
    form.value.paymentReturn = 0;
  }
}

function setFullPaid() {
  form.value.paidAmount = computedTotal.value;
  form.value.paymentReturn = 0;
}

const isValid = computed(() => {
  return (
    Number(form.value.quantityKg) > 0 &&
    Number(form.value.rate) > 0 &&
    Boolean(form.value.date)
  );
});

function formatDate(dateStr) {
  if (!dateStr) return '';
  return dateStr;
}

function formatNumber(val) {
  const n = Number(val) || 0;
  return n.toLocaleString('en-US');
}

async function handleSave(triggerPrint = true) {
  if (!isValid.value || saving.value) return;

  saving.value = true;
  try {
    const arrivals = await milkService.getMilkArrivals(form.value.date);
    const totalKg = arrivals.reduce((sum, a) => sum + (Number(a.quantityKg) || Number(a.quantity) || 0), 0);
    if (arrivals.length === 0 || totalKg <= 0) {
      alert(`Cannot save sale: No milk arrival has been recorded for ${formatDate(form.value.date)}.`);
      saving.value = false;
      return;
    }

    const salePayload = {
      date: form.value.date,
      customerName: form.value.customerName || 'Guest Customer',
      customerPhone: form.value.customerPhone || '',
      quantityKg: Number(form.value.quantityKg) || 0,
      rate: Number(form.value.rate) || 0,
      totalAmount: computedTotal.value,
      paidAmount: Number(form.value.paidAmount) || 0,
      paymentReturn: Number(form.value.paymentReturn) || 0,
      paymentMethod: form.value.paymentMethod || 'cash',
      notes: form.value.notes || '',
    };

    const saved = await dispatchService.createGuestSale(salePayload);
    emit('saved', { sale: saved, triggerPrint });
    emit('update:modelValue', false);
  } catch (err) {
    console.error('Failed to create guest sale:', err);
    alert('Failed to save guest sale: ' + (err.message || 'Unknown error'));
  } finally {
    saving.value = false;
  }
}

function close() {
  emit('update:modelValue', false);
}
</script>

<style scoped>
.guest-sale-card {
  border: 1px solid #e2e8f0;
  background: #ffffff;
}

.dialog-header {
  background: #063F78; /* App Brand Navy */
}

.header-icon-wrap {
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

.dialog-meta-strip {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.field-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  letter-spacing: -0.01em;
}

/* Quick Preset Pills */
.preset-pills-row {
  display: flex;
  gap: 6px;
}

.preset-pill {
  padding: 5px 12px;
  border-radius: 8px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 0.8125rem;
  line-height: 1.2;
  transition: all 0.15s ease;
  cursor: pointer;
  user-select: none;
}

.preset-pill:hover {
  background: #e2e8f0;
  color: #1e293b;
  border-color: #cbd5e1;
}

.preset-pill-active {
  background: #063F78 !important;
  border-color: #063F78 !important;
  color: #ffffff !important;
  box-shadow: 0 2px 6px rgba(6, 63, 120, 0.25);
}

/* Pricing Grid & Total Box */
.pricing-row {
  display: flex;
}

.total-calc-box {
  height: 40px;
  background: #f0f7ff;
  border: 1px solid #bae6fd;
}

/* Payment Card */
.payment-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.payment-status-badge {
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 20px;
  padding: 3px 10px;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.badge-paid {
  background: #dcfce7;
  color: #15803d;
}

.badge-paid:hover {
  background: #bbf7d0;
}

.badge-pending {
  background: #e0f2fe;
  color: #0369a1;
}

.badge-pending:hover {
  background: #bae6fd;
}

.balance-row {
  border-color: #e2e8f0;
}

.dialog-actions {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.save-print-btn {
  background: #063F78 !important;
  color: #ffffff !important;
  box-shadow: 0 2px 6px rgba(6, 63, 120, 0.25);
}

.save-print-btn:hover {
  background: #053361 !important;
}
</style>
