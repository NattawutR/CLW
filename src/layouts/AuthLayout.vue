<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-900 via-primary-950 to-surface-900 p-4">
    <!-- Decorative blobs -->
    <div class="absolute top-0 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
    <div class="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
    
    <div class="relative z-10 w-full max-w-md">
      <slot />
    </div>
  </div>
</template>
