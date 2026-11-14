<template>
  <div class="page-container d-flex align-center justify-center text-center py-12">
    <div>
      <v-icon color="primary" size="84" class="mb-4">mdi-alert-circle-outline</v-icon>
      <h1 class="text-h4 font-weight-bold text-primary mb-2">404 - Page Not Found</h1>
      <p class="text-body-1 text-grey mb-6">The page or module you are looking for does not exist.</p>
      <v-btn
        color="primary"
        variant="flat"
        class="text-capitalize rounded-lg font-weight-bold px-6"
        prepend-icon="mdi-home"
        to="/dashboard"
      >
        Go to Dashboard
      </v-btn>
    </div>
  </div>
</template>

<script setup>
</script>

