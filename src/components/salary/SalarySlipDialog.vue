<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="650">
    <v-card v-if="salary" class="rounded-xl pa-4 printable-area">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between pb-3 border-b">
        <div class="d-flex align-center">
          <v-avatar color="primary" size="48" class="me-3">
            <v-icon color="white" size="26">mdi-currency-pkr</v-icon>
          </v-avatar>
          <div>
            <h2 class="text-h6 font-weight-bold text-primary mb-0">Salary Slip</h2>
            <div class="text-caption text-grey">DMS</div>
          </div>
        </div>
        <div class="text-end">
          <v-chip color="primary" variant="tonal" size="small" class="font-weight-bold">
            {{ formatMonth(salary.month) }}
          </v-chip>
          <div class="text-caption text-grey mt-1">
            Status: <strong :class="salary.status === 'Paid' ? 'text-success' : 'text-warning'">{{ salary.status }}</strong>
          </div>
        </div>
      </div>

      <!-- Employee Info -->
      <v-card variant="tonal" color="blue-grey" class="my-4 pa-3 rounded-lg">
        <v-row dense>
          <v-col cols="6">
            <div class="text-caption text-grey-darken-1">Employee Name</div>
            <div class="text-subtitle-1 font-weight-bold text-dark">{{ salary.employeeName }}</div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption text-grey-darken-1">Designation</div>
            <div class="text-subtitle-2 font-weight-medium">{{ salary.designation || 'Staff' }}</div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption text-grey-darken-1">Base Monthly Salary</div>
            <div class="text-subtitle-2 font-weight-bold text-primary">{{ formatCurrency(salary.baseSalary) }}</div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption text-grey-darken-1">Payment Date</div>
            <div class="text-subtitle-2 font-weight-medium">{{ salary.paidDate ? formatDate(salary.paidDate) : 'Pending' }}</div>
          </v-col>
        </v-row>
      </v-card>

      <!-- Attendance & Deduction Breakdown -->
      <div class="mb-3">
        <h4 class="text-subtitle-2 font-weight-bold text-grey-darken-3 mb-2 d-flex align-center">
          <v-icon size="18" color="primary" class="me-1">mdi-calendar-month</v-icon>
          Attendance & Salary Cut Calculation
        </h4>
        <v-table density="compact" class="border rounded-lg">
          <tbody>
            <tr>
              <td class="text-grey-darken-2">Total Days in Month</td>
              <td class="text-end font-weight-bold">{{ salary.totalDaysInMonth }} days</td>
            </tr>
            <tr>
              <td class="text-grey-darken-2">Per-Day Salary Rate (Salary / Days)</td>
              <td class="text-end font-weight-bold">{{ formatCurrency(salary.perDayRate) }}</td>
            </tr>
            <tr>
              <td class="text-grey-darken-2">Recorded Absences</td>
              <td class="text-end font-weight-bold" :class="salary.absents > 2 ? 'text-error' : 'text-success'">
                {{ salary.absents }} days
              </td>
            </tr>
            <tr>
              <td class="text-grey-darken-2">Allowed Free Absences</td>
              <td class="text-end font-weight-bold text-grey">2 days (without cut)</td>
            </tr>
            <tr>
              <td class="text-grey-darken-2">Deductible Days: max(0, Absences - 2)</td>
              <td class="text-end font-weight-bold text-error">{{ salary.deductibleDays }} days</td>
            </tr>
            <tr class="bg-red-lighten-5">
              <td class="font-weight-bold text-error">Pay Cut Amount (Deductible Days × Per-Day)</td>
              <td class="text-end font-weight-bold text-error">- {{ formatCurrency(salary.payCut) }}</td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <!-- Advances List -->
      <div class="mb-4">
        <h4 class="text-subtitle-2 font-weight-bold text-grey-darken-3 mb-2 d-flex align-center justify-space-between">
          <span>
            <v-icon size="18" color="primary" class="me-1">mdi-currency-pkr</v-icon>
            Advances Taken This Month (Kis Kaam Ke Liye)
          </span>
          <span class="text-caption text-error font-weight-bold">
            Total: - {{ formatCurrency(salary.advancesTotal) }}
          </span>
        </h4>

        <div v-if="salary.advancesList && salary.advancesList.length > 0">
          <v-table density="compact" class="border rounded-lg">
            <thead>
              <tr class="bg-grey-lighten-4">
                <th>Date</th>
                <th>Reason / Purpose</th>
                <th class="text-end">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(adv, idx) in salary.advancesList" :key="idx">
                <td>{{ formatDate(adv.date) }}</td>
                <td>{{ adv.reason || 'General advance' }}</td>
                <td class="text-end font-weight-bold text-error">- {{ formatCurrency(adv.amount) }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>
        <div v-else class="text-caption text-grey text-center py-2 border rounded-lg">
          No advances recorded for this employee in this month.
        </div>
      </div>

      <!-- Net Payable Summary Box -->
      <v-card color="#063F78" class="text-white pa-4 rounded-xl mb-4">
        <div class="d-flex align-center justify-space-between mb-1">
          <span class="text-body-2 opacity-80">Gross Monthly Salary:</span>
          <span class="text-body-1 font-weight-bold">{{ formatCurrency(salary.baseSalary) }}</span>
        </div>
        <div class="d-flex align-center justify-space-between mb-1">
          <span class="text-body-2 opacity-80">Attendance Pay Cut:</span>
          <span class="text-body-1 font-weight-bold text-red-lighten-3">- {{ formatCurrency(salary.payCut) }}</span>
        </div>
        <div class="d-flex align-center justify-space-between mb-2 pb-2 border-b">
          <span class="text-body-2 opacity-80">Advances Deducted:</span>
          <span class="text-body-1 font-weight-bold text-red-lighten-3">- {{ formatCurrency(salary.advancesTotal) }}</span>
        </div>
        <div class="d-flex align-center justify-space-between pt-1">
          <span class="text-h6 font-weight-bold">Net Salary Payable:</span>
          <span class="text-h5 font-weight-black text-amber-accent-2 tabular-nums">{{ formatCurrency(salary.netPayable) }}</span>
        </div>
      </v-card>

      <!-- Printable Signature Lines -->
      <div class="signature-block">
        <div class="signature-line">Employee Signature</div>
        <div class="signature-line">Farm Accountant Signature</div>
      </div>

      <!-- Actions -->
      <v-card-actions class="px-0 pt-4 no-print justify-space-between">
        <v-btn variant="outlined" class="text-capitalize" prepend-icon="mdi-printer" @click="printSlip">
          Print Salary Slip
        </v-btn>
        <div class="d-flex gap-2">
          <v-btn
            v-if="salary.status !== 'Paid'"
            color="success"
            variant="flat"
            class="text-capitalize rounded-lg px-4"
            prepend-icon="mdi-check-decagram"
            :loading="paying"
            @click="$emit('pay-now', salary)"
          >
            Mark Paid
          </v-btn>
          <v-btn variant="text" class="text-capitalize" @click="$emit('update:modelValue', false)">
            Close
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { formatCurrency, formatDate } from '@/utils/formatters';

defineProps({
  modelValue: { type: Boolean, default: false },
  salary: { type: Object, default: null },
  paying: { type: Boolean, default: false },
});

defineEmits(['update:modelValue', 'pay-now']);

function formatMonth(mStr) {
  if (!mStr) return '';
  const [year, month] = mStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function printSlip() {
  window.print();
}
</script>

