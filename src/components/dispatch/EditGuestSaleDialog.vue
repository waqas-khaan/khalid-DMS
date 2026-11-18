<template>
  <v-dialog
    :model-value="modelValue"
    max-width="560"
    width="95vw"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="edit-guest-sale-card rounded-2xl overflow-hidden" elevation="6">
      <!-- Header -->
      <div class="dialog-header px-5 py-4 d-flex align-center justify-space-between text-white">
        <div class="d-flex align-center gap-3">
          <div class="header-icon-wrap d-flex align-center justify-center">
            <v-icon size="20" color="white">mdi-pencil-box-outline</v-icon>
          </div>
          <div>
            <h2 class="text-subtitle-1 font-weight-bold line-height-tight mb-0 text-white">
              Edit Guest Customer Sale
            </h2>
            <div class="text-caption text-blue-lighten-4 mt-0-5" style="font-size: 0.75rem !important;">
              Adjust Milk Returns, Refund/Money Back &amp; Collections &bull; #{{ form.token }}
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

      <!-- Meta Strip -->
      <div class="dialog-meta-strip px-5 py-2-5 d-flex align-center justify-space-between bg-slate-50 border-b flex-wrap gap-2">
        <div class="d-flex align-center gap-2 text-slate-700">
          <v-icon size="16" color="primary">mdi-calendar-month-outline</v-icon>
          <span class="text-caption font-weight-bold text-slate-800">{{ formatDate(form.date) }}</span>
          <span class="text-slate-300">•</span>
          <span class="text-caption font-mono font-weight-bold text-primary">#{{ form.token }}</span>
        </div>
        <div class="d-flex align-center gap-1-5">
          <v-chip size="x-small" color="teal-darken-2" variant="flat" class="font-weight-bold">
            Counter Retail
          </v-chip>
        </div>
      </div>

      <!-- Form Content -->
      <v-card-text class="pa-5 bg-white">
        <!-- Customer Info Row -->
        <v-row dense class="mb-3">
          <v-col cols="12" sm="7">
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
          </v-col>
          <v-col cols="12" sm="5">
            <label class="field-label mb-1 d-block">Phone (Optional)</label>
            <v-text-field
              v-model="form.customerPhone"
              density="compact"
              variant="outlined"
              placeholder="0300-1234567"
              prepend-inner-icon="mdi-phone-outline"
              hide-details
              class="rounded-lg"
            />
          </v-col>
        </v-row>

        <!-- Milk & Return Section (Highlighted) -->
        <div class="pa-3-5 rounded-xl border bg-slate-50 mb-4">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption font-weight-bold text-slate-800 text-uppercase tracking-wider d-flex align-center gap-1">
              <v-icon size="16" color="primary">mdi-pail-outline</v-icon>
              Milk Dispatch &amp; Return Details
            </span>
            <span class="text-caption text-slate-500 font-weight-medium">
              Net Milk: <strong class="text-info">{{ formatNumber(computedNetMilk) }} Kg</strong>
            </span>
          </div>

          <v-row dense>
            <!-- Original Sent (Kg) -->
            <v-col cols="4">
              <label class="text-caption text-slate-600 font-weight-medium mb-1 d-block">Sent Milk (Kg)</label>
              <v-text-field
                v-model.number="form.quantityKg"
                type="number"
                min="0.25"
                step="0.5"
                density="compact"
                variant="outlined"
                suffix="Kg"
                hide-details
                class="bg-white rounded-lg font-weight-bold"
              />
            </v-col>

            <!-- Milk Returned (Kg) -->
            <v-col cols="4">
              <label class="text-caption text-orange-darken-4 font-weight-bold mb-1 d-block">
                Return Milk (Kg)
              </label>
              <v-text-field
                v-model.number="form.returnKgs"
                type="number"
                min="0"
                :max="form.quantityKg"
                step="0.5"
                density="compact"
                variant="outlined"
                suffix="Kg"
                hide-details
                class="bg-white rounded-lg font-weight-bold"
                style="color: #c2410c;"
              />
            </v-col>

            <!-- Rate (Rs / Kg) -->
            <v-col cols="4">
              <label class="text-caption text-slate-600 font-weight-medium mb-1 d-block">Rate (Rs/Kg)</label>
              <v-text-field
                v-model.number="form.rate"
                type="number"
                min="1"
                density="compact"
                variant="outlined"
                prefix="Rs."
                hide-details
                class="bg-white rounded-lg"
              />
            </v-col>
          </v-row>

          <!-- Net Calculation Banner -->
          <div class="mt-2-5 pt-2 border-t d-flex align-center justify-space-between flex-wrap gap-2 text-caption">
            <div>
              <span class="text-slate-500">Total Net Amount: </span>
              <strong class="text-slate-900 text-body-2 font-weight-bold">Rs. {{ formatNumber(computedTotalAmount) }}</strong>
            </div>
            <div v-if="Number(form.returnKgs) > 0" class="text-orange-darken-3 font-weight-medium">
              <v-icon size="14" color="orange-darken-3">mdi-arrow-u-left-bottom</v-icon>
              {{ form.returnKgs }} Kg milk returned
            </div>
          </div>
        </div>

        <!-- Payment, Collection & Money Back Return Section -->
        <div class="payment-card pa-3-5 rounded-xl border mb-3 bg-white">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption font-weight-bold text-slate-800 text-uppercase tracking-wider d-flex align-center gap-1">
              <v-icon size="16" color="success">mdi-cash-multiple</v-icon>
              Cash Collection &amp; Money Return (Bakaya)
            </span>

            <button
              type="button"
              class="payment-status-badge d-flex align-center gap-1"
              :class="computedBalance === 0 ? 'badge-paid' : 'badge-pending'"
              @click="setFullPaid"
            >
              <v-icon size="13">{{ computedBalance === 0 ? 'mdi-check' : 'mdi-plus' }}</v-icon>
              <span>{{ computedBalance === 0 ? 'Fully Settled' : 'Settle Full' }}</span>
            </button>
          </div>

          <v-row dense class="align-center">
            <!-- Cash Received / Collected -->
            <v-col cols="12" sm="4">
              <label class="text-caption text-slate-600 font-weight-medium mb-1 d-block">
                Cash Received (وصول)
              </label>
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

            <!-- Money Given Back / Return (Bakaya) -->
            <v-col cols="12" sm="4">
              <label class="text-caption text-emerald-800 font-weight-bold mb-1 d-block">
                Money Given Back (واپسی)
              </label>
              <v-text-field
                v-model.number="form.paymentReturn"
                type="number"
                min="0"
                density="compact"
                variant="outlined"
                prefix="Rs."
                hide-details
                class="bg-white rounded-lg font-weight-bold text-emerald-700"
              />
            </v-col>

            <!-- Payment Method -->
            <v-col cols="12" sm="4">
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

          <!-- Net Cash & Outcome Row -->
          <div class="mt-3 pt-2-5 border-t d-flex align-center justify-space-between flex-wrap gap-2 text-caption">
            <div>
              <span class="text-slate-500">Net Till Collection: </span>
              <strong class="text-emerald-700 font-weight-bold">Rs. {{ formatNumber(computedNetCollection) }}</strong>
            </div>

            <div v-if="computedBalance > 0" class="text-rose-600 font-weight-bold">
              Remaining Due: Rs. {{ formatNumber(computedBalance) }}
            </div>
            <div v-else class="text-emerald-700 font-weight-bold">
              <v-icon size="14" color="success">mdi-check-circle</v-icon>
              Fully Settled
            </div>
          </div>
        </div>

        <!-- Remarks / Return Reason -->
        <div>
          <label class="field-label mb-1 d-block">Return Remarks / Notes</label>
          <v-text-field
            v-model="form.notes"
            density="compact"
            variant="outlined"
            placeholder="e.g., Customer returned 1 Kg milk, refunded Rs. 250"
            prepend-inner-icon="mdi-note-text-outline"
            hide-details
            class="rounded-lg text-caption"
          />
        </div>
      </v-card-text>

      <!-- Footer Actions -->
      <v-card-actions class="dialog-actions px-5 py-3-5 bg-slate-50 border-t d-flex align-center justify-space-between flex-wrap gap-2">
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
            Save Changes
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
            Save &amp; Print Slip
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { dispatchService } from '@/services/dispatchService';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  sale: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['update:modelValue', 'saved', 'print']);

const paymentMethods = [
  { title: 'Cash in Hand', value: 'cash' },
  { title: 'Bank Transfer', value: 'bank' },
];

const form = ref({
  id: '',
  date: '',
  token: '',
  customerName: 'Guest Customer',
  customerPhone: '',
  quantityKg: 2,
  returnKgs: 0,
  rate: 195,
  paidAmount: 390,
  paymentReturn: 0,
  paymentMethod: 'cash',
  notes: '',
});

const saving = ref(false);

function initFromSale() {
  const s = props.sale || {};
  const it = (s.items && s.items[0]) || s;

  const qty = Number(it.kgs ?? s.quantityKg ?? s.totalMilk) || 0;
  const returnKgs = Number(it.returnKgs ?? s.returnKgs ?? s.totalReturnMilk) || 0;
  const rate = Number(it.price ?? s.rate) || 195;
  const total = Number(s.totalAmount ?? it.todayAmount ?? (qty * rate)) || 0;
  const paid = Number(s.paidAmount ?? it.paidAmount ?? s.totalCollection ?? total) || 0;
  const paymentReturn = Number(s.paymentReturn ?? it.paymentReturn) || 0;

  form.value = {
    id: s.id || '',
    date: s.date || '',
    token: s.token || (s.id ? s.id.substring(0, 8) : 'GUEST'),
    customerName: s.customerName || it.shopName || 'Guest Customer',
    customerPhone: s.customerPhone || it.ownerName || '',
    quantityKg: qty,
    returnKgs,
    rate,
    paidAmount: paid,
    paymentReturn,
    paymentMethod: s.paymentMethod || 'cash',
    notes: s.returnNotes || s.notes || '',
  };
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      initFromSale();
    }
  },
  { immediate: true }
);

watch(
  () => props.sale,
  () => {
    if (props.modelValue) {
      initFromSale();
    }
  }
);

const computedNetMilk = computed(() => {
  const q = Number(form.value.quantityKg) || 0;
  const ret = Number(form.value.returnKgs) || 0;
  return Math.max(0, Number((q - ret).toFixed(2)));
});

const computedTotalAmount = computed(() => {
  const net = computedNetMilk.value;
  const r = Number(form.value.rate) || 0;
  return Number((net * r).toFixed(2));
});

const computedNetCollection = computed(() => {
  const paid = Number(form.value.paidAmount) || 0;
  const ret = Number(form.value.paymentReturn) || 0;
  return Math.max(0, Number((paid - ret).toFixed(2)));
});

const computedBalance = computed(() => {
  const total = computedTotalAmount.value;
  const net = computedNetCollection.value;
  return Math.max(0, Number((total - net).toFixed(2)));
});

function onPaidAmountChange(val) {
  const paid = Number(val) || 0;
  const total = computedTotalAmount.value;
  if (paid > total) {
    form.value.paymentReturn = Number((paid - total).toFixed(2));
  }
}

function setFullPaid() {
  form.value.paidAmount = computedTotalAmount.value;
  form.value.paymentReturn = 0;
}

const isValid = computed(() => {
  return (
    Number(form.value.quantityKg) > 0 &&
    Number(form.value.rate) > 0 &&
    Number(form.value.returnKgs) <= Number(form.value.quantityKg)
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

async function handleSave(triggerPrint = false) {
  if (!isValid.value || saving.value || !form.value.id) return;

  saving.value = true;
  try {
    const payload = {
      customerName: form.value.customerName || 'Guest Customer',
      customerPhone: form.value.customerPhone || '',
      quantityKg: Number(form.value.quantityKg) || 0,
      returnKgs: Number(form.value.returnKgs) || 0,
      rate: Number(form.value.rate) || 0,
      totalAmount: computedTotalAmount.value,
      paidAmount: Number(form.value.paidAmount) || 0,
      paymentReturn: Number(form.value.paymentReturn) || 0,
      paymentMethod: form.value.paymentMethod || 'cash',
      notes: form.value.notes || '',
    };

    const updated = await dispatchService.updateGuestSale(form.value.id, payload);
    emit('saved', { sale: updated, triggerPrint });
    if (triggerPrint) {
      emit('print', updated);
    }
    emit('update:modelValue', false);
  } catch (err) {
    console.error('Failed to update guest sale:', err);
    alert('Failed to update guest sale: ' + (err.message || 'Unknown error'));
  } finally {
    saving.value = false;
  }
}

function close() {
  emit('update:modelValue', false);
}
</script>

<style scoped>
.edit-guest-sale-card {
  border: 1px solid #e2e8f0;
  background: #ffffff;
}

.dialog-header {
  background: #063F78; /* Executive Navy */
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

.field-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.payment-status-badge {
  border: none;
  cursor: pointer;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
  transition: all 0.15s ease;
}

.badge-paid {
  background: #dcfce7;
  color: #15803d;
}

.badge-pending {
  background: #fef3c7;
  color: #b45309;
}

.badge-pending:hover {
  background: #fde68a;
}
</style>
