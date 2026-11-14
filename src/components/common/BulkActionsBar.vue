<template>
  <div
    v-if="count > 0"
    class="bulk-actions-bar d-flex align-center justify-space-between flex-wrap gap-2"
  >
    <!-- Left: Selection Counter Badge & Description -->
    <div class="d-flex align-center gap-2">
      <v-icon color="white" size="19" class="flex-shrink-0">
        mdi-checkbox-marked-circle
      </v-icon>
      <span class="bulk-count-tag tabular-nums">
        {{ count }} Selected
      </span>
      <span v-if="descriptionText" class="bulk-selection-desc d-none d-sm-inline">
        {{ descriptionText }}
      </span>
    </div>

    <!-- Right: Deselect All & Contextual Bulk Action Buttons -->
    <div class="d-flex align-center flex-wrap gap-2 ms-auto">
      <v-btn
        size="small"
        variant="outlined"
        color="white"
        prepend-icon="mdi-close"
        class="bulk-deselect-btn text-capitalize"
        @click="$emit('clear')"
      >
        Deselect All
      </v-btn>

      <div v-if="$slots.actions" class="bulk-actions-divider d-none d-sm-block"></div>

      <div class="d-flex align-center flex-wrap gap-2 bulk-action-btns">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  count: {
    type: Number,
    default: 0,
  },
  itemLabel: {
    type: String,
    default: 'item',
  },
  customText: {
    type: String,
    default: '',
  },
});

defineEmits(['clear']);

const descriptionText = computed(() => {
  if (props.customText) return props.customText;
  return `${props.count} ${props.itemLabel}(s) selected`;
});
</script>

<style scoped>
.bulk-actions-bar {
  background: linear-gradient(90deg, #063f78 0%, #0a4d92 100%) !important;
  color: #ffffff !important;
  border: 1px solid #000000 !important;
  border-radius: 6px !important;
  padding: 8px 14px !important;
  margin-bottom: 10px !important;
  box-shadow: 0 2px 8px rgba(6, 63, 120, 0.16) !important;
  flex-shrink: 0 !important;
}

.bulk-count-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  color: #063f78;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 3px;
  line-height: 1.25;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.14);
}

.bulk-selection-desc {
  font-size: 0.82rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.88);
  margin-left: 2px;
}

.bulk-deselect-btn {
  border-color: rgba(255, 255, 255, 0.45) !important;
  color: #ffffff !important;
  border-radius: 4px !important;
  font-weight: 600 !important;
  height: 30px !important;
}

.bulk-deselect-btn:hover {
  background-color: rgba(255, 255, 255, 0.12) !important;
  border-color: #ffffff !important;
}

.bulk-actions-divider {
  width: 1px;
  height: 20px;
  background-color: rgba(255, 255, 255, 0.25);
}

:deep(.bulk-action-btns .v-btn) {
  border-radius: 4px !important;
  height: 30px !important;
  font-weight: 700 !important;
  letter-spacing: 0.2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
</style>

