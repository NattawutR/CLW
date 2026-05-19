<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import {
  getRoleBadgeClass,
  getRoleLabel,
  canAccessSettings,
  canAccessSalary,
} from "@/lib/permissions";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const sidebarOpen = ref(false);
const sidebarCollapsed = ref(false);

interface NavItem {
  icon: string;
  label: string;
  to: string;
  roles?: string[];
  children?: NavItem[];
}

const navItems = computed<NavItem[]>(() => {
  const items: NavItem[] = [
    { icon: "pi pi-chart-bar", label: "Dashboard", to: "/dashboard" },
    { icon: "pi pi-file", label: "รายงาน", to: "/reports" },
    { icon: "pi pi-wallet", label: "รายรับ", to: "/income" },
    { icon: "pi pi-credit-card", label: "รายจ่าย", to: "/expense" },
  ];

  if (auth.role && canAccessSettings(auth.role)) {
    items.push(
      {
        icon: "pi pi-calendar",
        label: "ค่าใช้จ่ายประจำ",
        to: "/settings/fixed-costs",
      },
      { icon: "pi pi-tags", label: "หมวดหมู่", to: "/settings/categories" },
      { icon: "pi pi-box", label: "สินค้า/บริการ", to: "/settings/products" },
    );
  }

  return items;
});

function isActive(path: string): boolean {
  return route.path === path;
}

function navigate(path: string) {
  router.push(path);
  sidebarOpen.value = false;
}

async function handleSignOut() {
  await auth.signOut();
  router.push("/login");
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}
</script>

<template>
  <div class="min-h-screen bg-surface-100 flex">
    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col bg-white border-r border-surface-200',
        'transition-all duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        sidebarCollapsed ? 'w-20' : 'w-72',
      ]"
    >
      <!-- Logo -->
      <div
        class="h-16 flex items-center gap-3 px-5 border-b border-surface-100 flex-shrink-0"
      >
        <div
          class="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center flex-shrink-0"
        >
          <i class="pi pi-car text-white text-lg"></i>
        </div>
        <div v-if="!sidebarCollapsed" class="overflow-hidden">
          <h1 class="text-base font-bold text-surface-900 truncate">
            ชาละวันออโต้ซาวด์
          </h1>
          <p class="text-[10px] text-surface-400 font-medium">
            ระบบจัดการการเงิน
          </p>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <button
          v-for="item in navItems"
          :key="item.to"
          :class="[
            'sidebar-link w-full text-left',
            isActive(item.to) && 'active',
          ]"
          @click="navigate(item.to)"
          :title="sidebarCollapsed ? item.label : ''"
        >
          <i :class="[item.icon, 'text-lg']" />
          <span v-if="!sidebarCollapsed" class="truncate">{{
            item.label
          }}</span>
        </button>
      </nav>

      <!-- User -->
      <div class="border-t border-surface-100 p-3 flex-shrink-0">
        <div
          :class="[
            'flex items-center gap-3 p-2 rounded-xl',
            sidebarCollapsed && 'justify-center',
          ]"
        >
          <div
            class="w-9 h-9 rounded-full gradient-purple flex items-center justify-center flex-shrink-0"
          >
            <span class="text-white text-sm font-bold">
              {{ auth.displayName?.charAt(0)?.toUpperCase() }}
            </span>
          </div>
          <div v-if="!sidebarCollapsed" class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-surface-900 truncate">
              {{ auth.displayName }}
            </p>
            <span
              v-if="auth.role"
              :class="getRoleBadgeClass(auth.role)"
              class="text-[10px] mt-0.5"
            >
              {{ getRoleLabel(auth.role) }}
            </span>
          </div>
          <button
            v-if="!sidebarCollapsed"
            @click="handleSignOut"
            class="p-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-red-500 transition-colors"
            title="ออกจากระบบ"
          >
            <i class="pi pi-sign-out text-sm" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-h-screen min-w-0">
      <!-- Header -->
      <header
        class="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30"
      >
        <div class="flex items-center gap-3">
          <button
            @click="toggleSidebar"
            class="lg:hidden p-2 rounded-xl hover:bg-surface-100 text-surface-600 transition-colors"
          >
            <i class="pi pi-bars text-lg" />
          </button>
          <button
            @click="sidebarCollapsed = !sidebarCollapsed"
            class="hidden lg:flex p-2 rounded-xl hover:bg-surface-100 text-surface-400 transition-colors"
          >
            <i
              :class="[
                'pi text-sm',
                sidebarCollapsed ? 'pi-chevron-right' : 'pi-chevron-left',
              ]"
            />
          </button>
          <h2 class="text-lg font-semibold text-surface-900">
            {{ route.name }}
          </h2>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="$router.push('/income')"
            class="btn-primary flex items-center gap-2 text-sm !py-2 !px-3"
          >
            <i class="pi pi-plus text-xs" />
            <span class="hidden sm:inline">รายรับ</span>
          </button>
          <button
            @click="$router.push('/expense')"
            class="btn-secondary flex items-center gap-2 text-sm !py-2 !px-3"
          >
            <i class="pi pi-plus text-xs" />
            <span class="hidden sm:inline">รายจ่าย</span>
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>
