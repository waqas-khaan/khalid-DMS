<template>
  <v-dialog
    :model-value="modelValue"
    :max-width="maxWidth"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="confirm-dialog-card rounded-xl pa-0" elevation="12">
      <div class="confirm-dialog-header d-flex align-start gap-3 px-5 pt-5 pb-3">
        <div
          class="confirm-dialog-icon-wrap flex-shrink-0"
          :class="`icon-${confirmColor}`"
        >
          <v-icon :color="iconTintColor" size="22">{{ icon }}</v-icon>
        </div>
        <div class="confirm-dialog-title">
          {{ title }}
        </div>
      </div>

      <v-card-text class="confirm-dialog-body px-5 pt-1 pb-4">
        {{ message }}
      </v-card-text>

      <v-divider />

      <v-card-actions class="confirm-dialog-actions px-5 py-3 justify-end gap-2 bg-grey-lighten-5">
        <v-btn
          variant="outlined"
          color="secondary"
          class="text-capitalize font-weight-bold px-4"
          :disabled="loading"
          @click="$emit('update:modelValue', false)"
        >
          Cancel
        </v-btn>
        <v-btn
          :color="confirmColor"
          variant="flat"
          class="text-capitalize font-weight-bold px-5"
          :loading="loading"
          @click="$emit('confirm')"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Confirm Action' },
  message: { type: String, default: 'Are you sure you want to proceed?' },
  confirmText: { type: String, default: 'Confirm Delete' },
  confirmColor: { type: String, default: 'error' },
  icon: { type: String, default: 'mdi-alert-circle-outline' },
  maxWidth: { type: [Number, String], default: 480 },
  loading: { type: Boolean, default: false },
});

const iconTintColor = computed(() => {
  if (props.confirmColor === 'warning') return 'orange-darken-3';
  return props.confirmColor;
});

defineEmits(['update:modelValue', 'confirm']);
</script>

<style scoped>
.v-card.confirm-dialog-card {
  border-radius: 16px !important;
  border: 1px solid #cbd5e1 !important;
  overflow: hidden !important;
  box-shadow: 0 20px 44px rgba(15, 23, 42, 0.2) !important;
}

.confirm-dialog-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(25, 118, 210, 0.12);
}

.confirm-dialog-icon-wrap.icon-error {
  background-color: rgba(198, 40, 40, 0.12);
}

.confirm-dialog-icon-wrap.icon-warning {
  background-color: rgba(255, 122, 26, 0.14);
}

.confirm-dialog-icon-wrap.icon-success {
  background-color: rgba(46, 125, 50, 0.12);
}

.confirm-dialog-title {
  font-size: 1.08rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.35;
  white-space: normal !important;
  word-break: break-word;
  padding-top: 6px;
}

.confirm-dialog-body {
  font-size: 0.94rem !important;
  line-height: 1.55 !important;
  color: #475569 !important;
  padding-left: 72px !important;
}
</style>

