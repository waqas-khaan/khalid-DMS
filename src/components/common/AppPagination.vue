<template>
  <div class="app-pagination-container d-flex align-center justify-space-between flex-wrap gap-3 pt-3 mt-auto">
    <!-- Left: Entry Summary & Rows per page -->
    <div class="d-flex align-center flex-wrap gap-4 text-caption text-grey-darken-2 font-weight-medium">
      <div class="entries-counter">
        <template v-if="totalItems === 0">
          Showing <strong>0</strong> entries
        </template>
        <template v-else>
          Showing <strong>{{ startIndex + 1 }}</strong> to <strong>{{ endIndex }}</strong> of <strong>{{ totalItems }}</strong> entries
        </template>
      </div>

      <div class="d-flex align-center gap-2">
        <span class="text-caption text-grey-darken-1">Rows per page:</span>
        <v-select
          :model-value="itemsPerPage"
          :items="itemsPerPageOptions"
          density="compact"
          variant="outlined"
          hide-details
          class="rows-select"
          @update:model-value="onItemsPerPageChange"
        />
      </div>
    </div>

    <!-- Right: Page Navigation -->
    <div class="d-flex align-center ms-auto">
      <v-pagination
        :model-value="page"
        :length="Math.max(1, totalPages)"
        :total-visible="totalVisible"
        density="comfortable"
        size="small"
        active-color="#063F78"
        variant="flat"
        rounded="lg"
        @update:model-value="onPageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';

const props = defineProps({
  page: {
    type: Number,
    default: 1,
  },
  itemsPerPage: {
    type: Number,
    default: 10,
  },
  totalItems: {
    type: Number,
    default: 0,
  },
  itemsPerPageOptions: {
    type: Array,
    default: () => [10, 25, 50, 100],
  },
  totalVisible: {
    type: Number,
    default: 5,
  },
});

const emit = defineEmits(['update:page', 'update:itemsPerPage', 'change']);

const totalPages = computed(() => {
  return Math.ceil(props.totalItems / props.itemsPerPage) || 1;
});

const startIndex = computed(() => {
  if (props.totalItems === 0) return 0;
  return (props.page - 1) * props.itemsPerPage;
});

const endIndex = computed(() => {
  return Math.min(startIndex.value + props.itemsPerPage, props.totalItems);
});

// Guard against page out of bounds
watch(
  () => props.totalItems,
  () => {
    if (props.page > totalPages.value) {
      emit('update:page', 1);
      emit('change', { page: 1, itemsPerPage: props.itemsPerPage });
    }
  }
);

function onPageChange(newPage) {
  emit('update:page', newPage);
  emit('change', { page: newPage, itemsPerPage: props.itemsPerPage });
}

function onItemsPerPageChange(val) {
  const num = Number(val) || 10;
  emit('update:itemsPerPage', num);
  emit('update:page', 1);
  emit('change', { page: 1, itemsPerPage: num });
}
</script>

<style scoped>
.app-pagination-container {
  border-top: 1px solid #cbd5e1;
  padding: 10px 28px !important;
  margin-top: auto !important;
  margin-left: -28px;
  margin-right: -28px;
  width: calc(100% + 56px);
  background: #f8fafc !important;
  position: sticky;
  bottom: 0;
  z-index: 5;
  flex-shrink: 0 !important;
}

@media (max-width: 960px) {
  .app-pagination-container {
    margin-left: -14px;
    margin-right: -14px;
    width: calc(100% + 28px);
    padding: 10px 14px !important;
  }
}

.entries-counter {
  color: #334155;
}

.entries-counter strong {
  color: #063F78;
  font-weight: 800;
}

.rows-select {
  width: 90px;
  max-width: 90px;
}

:deep(.rows-select .v-field) {
  border-radius: 8px !important;
  font-size: 0.82rem !important;
  font-weight: 700 !important;
  background: #ffffff !important;
  border-color: #94a3b8 !important;
}

:deep(.rows-select .v-field__input) {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  min-height: 32px !important;
}

:deep(.v-pagination__list) {
  gap: 6px !important;
}

:deep(.v-pagination__item .v-btn),
:deep(.v-pagination__prev .v-btn),
:deep(.v-pagination__next .v-btn) {
  min-width: 34px !important;
  height: 34px !important;
  border-radius: 8px !important;
  background-color: #ffffff !important;
  color: #1e293b !important;
  border: 1px solid #cbd5e1 !important;
  font-weight: 700 !important;
  opacity: 1 !important;
  transition: all 0.16s ease !important;
}

:deep(.v-pagination__item .v-btn .v-btn__overlay),
:deep(.v-pagination__prev .v-btn .v-btn__overlay),
:deep(.v-pagination__next .v-btn .v-btn__overlay) {
  display: none !important;
  opacity: 0 !important;
}

:deep(.v-pagination__item:not(.v-pagination__item--is-active) .v-btn:not(.v-btn--disabled):hover),
:deep(.v-pagination__prev .v-btn:not(.v-btn--disabled):hover),
:deep(.v-pagination__next .v-btn:not(.v-btn--disabled):hover) {
  background-color: #eff6ff !important;
  color: #1976D2 !important;
  border-color: #1976D2 !important;
}

:deep(.v-pagination__prev .v-btn.v-btn--disabled),
:deep(.v-pagination__next .v-btn.v-btn--disabled) {
  background-color: #f1f5f9 !important;
  color: #94a3b8 !important;
  border-color: #e2e8f0 !important;
  opacity: 1 !important;
}

:deep(.v-pagination__item--is-active .v-btn) {
  background-color: #063F78 !important;
  border-color: #063F78 !important;
  color: #ffffff !important;
  font-weight: 800 !important;
  opacity: 1 !important;
  box-shadow: 0 3px 8px rgba(6, 63, 120, 0.28) !important;
}
</style>

