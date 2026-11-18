<template>
  <v-card
    class="dashboard-card stat-card-themed pa-3-5 px-4 h-100 rounded-xl"
    :class="[`stat-card--${color || 'primary'}`]"
    elevation="0"
  >
    <div class="stat-card-header d-flex align-center justify-space-between mb-1-5">
      <span class="stat-card-label">{{ label }}</span>
      <div class="stat-card-icon-wrap" :class="`icon-theme-${color || 'primary'}`">
        <v-icon size="17">{{ resolvedIcon }}</v-icon>
      </div>
    </div>
    <div class="stat-card-value my-1" :class="valueColorClass">
      {{ value }}
    </div>
    <div v-if="subtitle" class="stat-card-subtitle mt-1 text-truncate" :title="subtitle">
      {{ subtitle }}
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  subtitle: { type: String, default: '' },
  color: { type: String, default: 'primary' },
  icon: { type: String, default: '' },
});

const resolvedIcon = computed(() => {
  if (props.icon) return props.icon;
  const l = (props.label || '').toLowerCase();
  if (l.includes('income') || l.includes('collection') || l.includes('profit') || l.includes('revenue')) return 'mdi-cash-plus';
  if (l.includes('available') || l.includes('cash') || l.includes('balance') || l.includes('opening')) return 'mdi-wallet-outline';
  if (l.includes('arrear') || l.includes('due') || l.includes('pending') || l.includes('receivable')) return 'mdi-account-alert-outline';
  if (l.includes('milk') && (l.includes('received') || l.includes('arrival') || l.includes('intake'))) return 'mdi-water-check-outline';
  if (l.includes('milk') && (l.includes('dispatch') || l.includes('out') || l.includes('sold'))) return 'mdi-truck-delivery-outline';
  if (l.includes('milk')) return 'mdi-water-outline';
  if (l.includes('dispatch') || l.includes('delivery') || l.includes('route') || l.includes('vehicle')) return 'mdi-truck-fast-outline';
  if (l.includes('expense') || l.includes('cost') || l.includes('spent') || l.includes('payout')) return 'mdi-receipt-text-minus-outline';
  if (l.includes('salar') || l.includes('payroll') || l.includes('staff') || l.includes('employee')) return 'mdi-account-group-outline';
  if (l.includes('advance') || l.includes('loan')) return 'mdi-hand-coin-outline';
  if (l.includes('shop') || l.includes('customer') || l.includes('counter')) return 'mdi-storefront-outline';
  if (l.includes('rate') || l.includes('price')) return 'mdi-tag-outline';

  // Fallback by color
  const c = props.color || 'primary';
  if (c === 'success') return 'mdi-cash-plus';
  if (c === 'teal') return 'mdi-cash-register';
  if (c === 'warning' || c === 'orange') return 'mdi-alert-circle-outline';
  if (c === 'error' || c === 'red') return 'mdi-receipt-text-minus-outline';
  if (c === 'info') return 'mdi-water-outline';
  if (c === 'purple' || c === 'indigo') return 'mdi-chart-line';
  return 'mdi-chart-box-outline';
});

const valueColorClass = computed(() => {
  const c = props.color || 'primary';
  if (c === 'success') return 'text-emerald-700';
  if (c === 'teal') return 'text-teal-700';
  if (c === 'warning') return 'text-amber-700';
  if (c === 'orange') return 'text-orange-700';
  if (c === 'error' || c === 'red') return 'text-rose-600';
  if (c === 'info') return 'text-sky-700';
  if (c === 'primary') return 'text-blue-800';
  if (c === 'purple') return 'text-purple-800';
  if (c === 'indigo') return 'text-indigo-800';
  return 'text-slate-900';
});
</script>

<style scoped>
.stat-card-themed {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 14px !important;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 10px 25px -4px rgba(15, 23, 42, 0.1), 0 4px 10px -2px rgba(15, 23, 42, 0.06) !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
  min-height: 112px !important;
}

.stat-card-themed:hover {
  transform: translateY(-3px) !important;
  box-shadow: 0 16px 32px -4px rgba(15, 23, 42, 0.16), 0 8px 16px -2px rgba(15, 23, 42, 0.08) !important;
  border-color: #cbd5e1 !important;
}

.stat-card-label {
  font-size: 0.72rem !important;
  font-weight: 700 !important;
  color: #64748b !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
}

.stat-card-icon-wrap {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-theme-primary { background: #eff6ff; color: #063F78; }
.icon-theme-success { background: #ecfdf5; color: #059669; }
.icon-theme-teal    { background: #f0fdfa; color: #0d9488; }
.icon-theme-warning { background: #fffbeb; color: #d97706; }
.icon-theme-orange  { background: #fff7ed; color: #ea580c; }
.icon-theme-error,
.icon-theme-red     { background: #fff1f2; color: #e11d48; }
.icon-theme-info    { background: #f0f9ff; color: #0284c7; }
.icon-theme-indigo  { background: #eef2ff; color: #4f46e5; }
.icon-theme-purple  { background: #f5f3ff; color: #7c3aed; }
.icon-theme-grey,
.icon-theme-secondary { background: #f1f5f9; color: #64748b; }

.stat-card-value {
  font-size: 1.35rem !important;
  font-weight: 800 !important;
  line-height: 1.25 !important;
  letter-spacing: -0.02em !important;
  font-variant-numeric: tabular-nums !important;
}

.stat-card-subtitle {
  font-size: 0.72rem !important;
  font-weight: 500 !important;
  color: #64748b !important;
}

/* Elegant Top Accent Borders */
.stat-card--primary { border-top: 3px solid #2563eb !important; }
.stat-card--success { border-top: 3px solid #10b981 !important; }
.stat-card--teal    { border-top: 3px solid #0d9488 !important; }
.stat-card--warning { border-top: 3px solid #f59e0b !important; }
.stat-card--orange  { border-top: 3px solid #f97316 !important; }
.stat-card--error,
.stat-card--red     { border-top: 3px solid #ef4444 !important; }
.stat-card--info    { border-top: 3px solid #0284c7 !important; }
.stat-card--indigo  { border-top: 3px solid #6366f1 !important; }
.stat-card--purple  { border-top: 3px solid #8b5cf6 !important; }
.stat-card--grey,
.stat-card--secondary { border-top: 3px solid #94a3b8 !important; }
</style>
