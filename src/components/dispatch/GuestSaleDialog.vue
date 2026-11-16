<template>
  <v-dialog
    :model-value="modelValue"
    max-width="500"
    width="95vw"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="rounded-xl overflow-hidden shadow-xl" elevation="0">
      <!-- Modal Header -->
      <div class="pa-4 bg-primary text-white d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-2">
          <div class="pa-2 bg-white rounded-lg text-primary d-flex align-center justify-center">
            <v-icon size="20" color="primary">mdi-storefront</v-icon>
          </div>
          <div>
            <h2 class="text-subtitle-1 font-weight-black line-height-tight mb-0">
              New Guest / Walk-in Sale
            </h2>
            <span class="text-caption text-blue-lighten-4" style="font-size: 0.72rem !important;">
              Counter Retail Milk Sale &bull; Instant Payment &bull; Dual 80mm Slips
            </span>
          </div>
        </div>
        <v-btn icon size="small" variant="text" color="white" :disabled="saving" @click="close">
          <v-icon size="18">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="pa-4 bg-slate-50">
        <!-- Date & Master Rate Info Row -->
        <div class="d-flex align-center justify-space-between mb-3 bg-white pa-3 rounded-lg border">
          <div class="d-flex align-center gap-2">
            <v-icon size="18" color="primary">mdi-calendar-check</v-icon>
            <div>
              <div class="text-caption text-grey" style="font-size: 0.68rem !important;">SALE DATE</div>
              <div class="font-weight-bold text-caption text-slate-800">{{ formatDate(form.date) }}</div>
            </div>
          </div>

          <div class="text-end">
            <div class="text-caption text-grey" style="font-size: 0.68rem !important;">DEFAULT RATE</div>
            <div class="font-weight-bold text-caption text-primary">Rs. {{ masterMilkPrice }} / Kg</div>
          </div>
        </div>

        <!-- Customer Name -->
        <div class="mb-3">
          <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">
            Customer Identification
          </label>
          <v-text-field
            v-model="form.customerName"
            density="compact"
            variant="outlined"
            placeholder="e.g. Guest Customer [ 13 ] or Walk-in"
            prepend-inner-icon="mdi-account"
            hide-details
            class="bg-white rounded-lg"
          />
        </div>

        <!-- Milk Quantity (Kg) with Quick-Add Pills -->
        <div class="mb-3">
          <div class="d-flex align-center justify-space-between mb-1">
            <label class="text-caption font-weight-bold text-slate-700">
              Milk Quantity (Kg) <span class="text-red font-weight-black">*</span>
            </label>
            <span class="text-caption text-slate-500 font-weight-medium">Select or enter weight</span>
          </div>

          <v-text-field
            v-model.number="form.quantityKg"
            type="number"
            min="0.25"
            step="0.5"
            density="comfortable"
            variant="outlined"
            placeholder="e.g. 2, 5, 35"
            prepend-inner-icon="mdi-weight-kilogram"
            suffix="Kg"
            hide-details
            class="bg-white rounded-lg font-weight-bold text-h6 mb-2"
          />

          <!-- Quick Increment Buttons -->
          <div class="d-flex align-center gap-1-5 overflow-x-auto no-scrollbar pb-1">
            <button
              v-for="q in [1, 2, 5, 10, 20, 35]"
              :key="q"
              type="button"
              class="quick-kg-btn font-weight-bold"
              :class="{ active: form.quantityKg === q }"
              @click="form.quantityKg = q"
            >
              {{ q }} Kg
            </button>
          </div>
        </div>

        <!-- Rate & Total Grid -->
        <v-row dense class="mb-2">
          <!-- Rate per Kg -->
          <v-col cols="6">
            <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">
              Rate (Rs / Kg)
            </label>
            <v-text-field
              v-model.number="form.rate"
              type="number"
              min="1"
              density="compact"
              variant="outlined"
              prepend-inner-icon="mdi-cash"
              hide-details
              class="bg-white rounded-lg"
            />
          </v-col>

          <!-- Computed Total Amount -->
          <v-col cols="6">
            <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">
              Total Amount (رقم)
            </label>
            <div class="total-amount-display pa-2 px-3 rounded-lg border bg-blue-50 text-blue-900 font-weight-black d-flex align-center justify-space-between" style="height: 40px;">
              <span class="text-caption font-weight-bold text-blue-700">Rs.</span>
              <span class="text-subtitle-1 font-weight-black">{{ formatNumber(computedTotal) }}</span>
            </div>
          </v-col>
        </v-row>

        <!-- Payment & Receipt Section -->
        <div class="pa-3 bg-white rounded-xl border mb-3">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="d-flex align-center gap-1-5">
              <v-icon size="18" color="success">mdi-cash-check</v-icon>
              <span class="text-caption font-weight-black text-slate-800 text-uppercase">
                Payment Collection (ادا کیا)
              </span>
            </div>

            <!-- Full Payment Toggle Switch -->
            <v-btn
              size="x-small"
              :variant="isFullPaid ? 'flat' : 'outlined'"
              :color="isFullPaid ? 'success' : 'grey'"
              class="font-weight-bold text-capitalize"
              @click="setFullPaid"
            >
              {{ isFullPaid ? '✓ Paid in Full' : 'Set Full' }}
            </v-btn>
          </div>

          <v-row dense class="align-center">
            <v-col cols="6">
              <v-text-field
                v-model.number="form.paidAmount"
                type="number"
                min="0"
                density="compact"
                variant="outlined"
                label="Amount Paid"
                prefix="Rs."
                hide-details
                class="rounded-lg"
              />
            </v-col>

            <v-col cols="6">
              <v-select
                v-model="form.paymentMethod"
                :items="[
                  { title: '💵 Cash in Hand', value: 'cash' },
                  { title: '🏦 Bank Transfer', value: 'bank' }
                ]"
                density="compact"
                variant="outlined"
                label="Method"
                hide-details
                class="rounded-lg"
              />
            </v-col>
          </v-row>

          <!-- Balance / Arrears Status -->
          <div class="d-flex align-center justify-space-between mt-2 pt-2 border-t">
            <span class="text-caption text-grey font-weight-medium">Remaining (بقیہ):</span>
            <span
              class="font-weight-black text-caption"
              :class="computedBalance > 0 ? 'text-rose-600' : 'text-emerald-600'"
            >
              {{ computedBalance > 0 ? `Rs. ${formatNumber(computedBalance)} (Pending)` : 'Rs. 0.00 (Fully Settled)' }}
            </span>
          </div>
        </div>

        <!-- Optional Notes -->
        <div class="mb-1">
          <v-text-field
            v-model="form.notes"
            density="compact"
            variant="outlined"
            placeholder="Optional note / vehicle plate..."
            prepend-inner-icon="mdi-note-text-outline"
            hide-details
            class="bg-white rounded-lg text-caption"
          />
        </div>
      </v-card-text>

      <!-- Modal Actions -->
      <v-card-actions class="pa-4 bg-white border-t d-flex align-center justify-space-between gap-2">
        <v-btn
          variant="text"
          class="text-capitalize"
          :disabled="saving"
          @click="close"
        >
          Cancel
        </v-btn>

        <div class="d-flex align-center gap-2">
          <v-btn
            variant="outlined"
            color="primary"
            class="text-capitalize font-weight-bold"
            :loading="saving"
            :disabled="!isValid"
            @click="handleSave(false)"
          >
            Save Only
          </v-btn>

          <v-btn
            color="success"
            variant="flat"
            class="font-weight-black text-capitalize px-4"
            prepend-icon="mdi-printer"
            :loading="saving"
            :disabled="!isValid"
            @click="handleSave(true)"
          >
            Save &amp; Print 2x
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

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  defaultDate: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue', 'saved']);

const settingsStore = useSettingsStore();
const businessDayStore = useBusinessDayStore();

const masterMilkPrice = computed(() => Number(settingsStore.settings.defaultMilkPrice) || 195);

const form = ref({
  date: '',
  customerName: 'Guest Customer',
  customerPhone: '',
  quantityKg: 2,
  rate: 195,
  paidAmount: 390,
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
  return Math.max(0, Number((total - paid).toFixed(2)));
});

const isFullPaid = computed(() => {
  return computedTotal.value > 0 && Number(form.value.paidAmount) >= computedTotal.value;
});

// Auto-sync paid amount when quantity or rate changes if user was previously full-paid
watch(computedTotal, (newTotal) => {
  if (isFullPaid.value || Number(form.value.paidAmount) === 0) {
    form.value.paidAmount = newTotal;
  }
});

function setFullPaid() {
  form.value.paidAmount = computedTotal.value;
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
    const salePayload = {
      date: form.value.date,
      customerName: form.value.customerName || 'Guest Customer',
      customerPhone: form.value.customerPhone || '',
      quantityKg: Number(form.value.quantityKg) || 0,
      rate: Number(form.value.rate) || 0,
      totalAmount: computedTotal.value,
      paidAmount: Number(form.value.paidAmount) || 0,
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
.quick-kg-btn {
  padding: 6px 12px;
  border-radius: 8px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 0.78rem;
  white-space: nowrap;
  transition: all 0.15s ease;
  cursor: pointer;
}

.quick-kg-btn:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
}

.quick-kg-btn.active {
  background: #0284c7;
  border-color: #0284c7;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.3);
}

.total-amount-display {
  box-sizing: border-box;
}
</style>
