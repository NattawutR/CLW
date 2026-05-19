<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/layouts/AppLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useRoute } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

const auth = useAuthStore()
const route = useRoute()

onMounted(async () => {
  await auth.initialize()
})
</script>

<template>
  <Toast position="top-right" />
  <ConfirmDialog />
  
  <div v-if="auth.loading" class="flex items-center justify-center min-h-screen bg-surface-100">
    <div class="text-center">
      <div class="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-surface-500 font-medium">กำลังโหลด...</p>
    </div>
  </div>

  <template v-else>
    <AuthLayout v-if="route.meta.layout === 'auth' || !auth.isAuthenticated">
      <router-view />
    </AuthLayout>
    <AppLayout v-else>
      <router-view />
    </AppLayout>
  </template>
</template>
