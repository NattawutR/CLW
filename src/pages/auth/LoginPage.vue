<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore, USERS } from "@/stores/auth";
import { getRoleLabel } from "@/lib/permissions";
import { useToast } from "primevue/usetoast";
import Button from "primevue/button";
import Password from "primevue/password";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const toast = useToast();

const selectedUserId = ref<string | null>(null);
const pin = ref("");
const loading = ref(false);

const selectedUser = computed(() =>
  USERS.find((u) => u.id === selectedUserId.value),
);
const isAdminSelected = computed(() => selectedUser.value?.role === "admin");

function getRoleIcon(role: string) {
  const map: Record<string, string> = {
    admin: "👑",
    co_admin: "⭐",
    staff: "🔧",
    owner: "👩",
  };
  return map[role] || "👤";
}

function getRoleColor(role: string) {
  const map: Record<string, string> = {
    admin: "from-primary-500 to-primary-700",
    co_admin: "from-purple-500 to-purple-700",
    staff: "from-emerald-500 to-emerald-700",
    owner: "from-amber-500 to-amber-700",
  };
  return map[role] || "from-surface-500 to-surface-700";
}

function selectUser(userId: string) {
  selectedUserId.value = userId;
  pin.value = "";
}

async function handleLogin() {
  if (!selectedUserId.value) {
    toast.add({
      severity: "warn",
      summary: "เลือกผู้ใช้",
      detail: "กรุณาเลือกผู้ใช้ก่อนเข้าสู่ระบบ",
      life: 3000,
    });
    return;
  }

  loading.value = true;
  try {
    auth.signIn(selectedUserId.value, pin.value || undefined);
    const redirect = (route.query.redirect as string) || "/dashboard";
    router.push(redirect);
    toast.add({
      severity: "success",
      summary: "เข้าสู่ระบบสำเร็จ",
      detail: `ยินดีต้อนรับ ${auth.displayName}`,
      life: 3000,
    });
  } catch (error: any) {
    toast.add({
      severity: "error",
      summary: "เข้าสู่ระบบไม่สำเร็จ",
      detail: error.message,
      life: 5000,
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="animate-fade-in-up">
    <!-- Logo -->
    <div class="text-center mb-8">
      <div
        class="w-20 h-20 rounded-2xl gradient-blue flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30"
      >
        <i class="pi pi-car text-white text-3xl"></i>
      </div>
      <h1 class="text-2xl font-bold text-white">ชาละวัน ออโต้</h1>
      <p class="text-surface-400 mt-1">เลือกผู้ใช้เพื่อเข้าสู่ระบบ</p>
    </div>

    <!-- Login Card -->
    <div class="bg-white rounded-2xl shadow-xl p-6">
      <!-- User Selection -->
      <div class="space-y-2 mb-5">
        <button
          v-for="u in USERS"
          :key="u.id"
          @click="selectUser(u.id)"
          :class="[
            'w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-200 text-left',
            selectedUserId === u.id
              ? 'border-primary-500 bg-primary-50 shadow-sm'
              : 'border-surface-200 hover:border-surface-300 hover:bg-surface-50',
          ]"
        >
          <!-- <div :class="['w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 text-lg', getRoleColor(u.role)]">
            {{ getRoleIcon(u.role) }}
          </div> -->
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-surface-900 text-sm">
              {{ u.full_name }}
            </p>
            <p class="text-xs text-surface-500">{{ getRoleLabel(u.role) }}</p>
          </div>
          <div
            v-if="selectedUserId === u.id"
            class="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center"
          >
            <i class="pi pi-check text-white text-xs" />
          </div>
        </button>
      </div>

      <!-- User PIN -->
      <div v-if="selectedUserId" class="mb-5 animate-fade-in-up">
        <label class="block text-sm font-medium text-surface-700 mb-1.5"
          >🔒 รหัสผ่านเข้าใช้งาน</label
        >
        <Password
          v-model="pin"
          placeholder="กรอกรหัสผ่าน..."
          :feedback="false"
          toggleMask
          class="w-full"
          inputClass="w-full"
          @keyup.enter="handleLogin"
        />
      </div>

      <!-- Login Button -->
      <Button
        :label="selectedUserId ? `เข้าสู่ระบบ (${selectedUser?.full_name})` : 'เข้าสู่ระบบ'"
        icon="pi pi-lock"
        class="w-full !py-3 !text-base"
        :loading="loading"
        :disabled="!selectedUserId"
        @click="handleLogin"
      />
    </div>

    <p class="text-center text-surface-500 text-xs mt-6">
      © {{ new Date().getFullYear() }} ชาละวันออโต้ซาวด์ · ระบบจัดการการเงิน
    </p>
  </div>
</template>
