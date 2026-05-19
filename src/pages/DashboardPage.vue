<script setup lang="ts">
import { onMounted, computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useDashboard } from "@/composables/useDashboard";
import { Bar, Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import dayjs from "dayjs";
import Button from "primevue/button";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputNumber from "primevue/inputnumber";
import { useToast } from "primevue/usetoast";
import { supabase } from "@/lib/supabase";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const router = useRouter();
const toast = useToast();
const { summary, dailyChart, monthlyProfit, topProducts, loading, fetchAll } =
  useDashboard();

onMounted(() => fetchAll());

function fmt(n: number) {
  return new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0 }).format(n);
}
function fmtFull(n: number) {
  return new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2 }).format(n);
}

const barData = computed(() => ({
  labels: dailyChart.value.map((d) => dayjs(d.date).format("DD/MM")),
  datasets: [
    {
      label: "รายรับ",
      data: dailyChart.value.map((d) => d.income),
      backgroundColor: "rgba(16,185,129,0.8)",
      borderRadius: 8,
      borderSkipped: false,
    },
    {
      label: "รายจ่าย",
      data: dailyChart.value.map((d) => d.expense),
      backgroundColor: "rgba(239,68,68,0.8)",
      borderRadius: 8,
      borderSkipped: false,
    },
  ],
}));
const barOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
      labels: { usePointStyle: true, padding: 20 },
    },
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      grid: { color: "#f1f5f9" },
      ticks: { callback: (v: any) => `฿${fmt(v)}` },
    },
  },
};

const lineData = computed(() => ({
  labels: monthlyProfit.value.map((d) => d.month),
  datasets: [
    {
      label: "กำไรรายเดือน",
      data: monthlyProfit.value.map((d) => d.profit),
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59,130,246,0.1)",
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointBackgroundColor: "#3b82f6",
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
    },
    {
      label: "กำไรสะสม",
      data: monthlyProfit.value.map((d) => d.cumulative),
      borderColor: "#8b5cf6",
      backgroundColor: "rgba(139,92,246,0.05)",
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointBackgroundColor: "#8b5cf6",
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
      borderDash: [5, 5],
    },
  ],
}));
const lineOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
      labels: { usePointStyle: true, padding: 20 },
    },
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      grid: { color: "#f1f5f9" },
      ticks: { callback: (v: any) => `฿${fmt(v)}` },
    },
  },
};

const stats = computed(() => [
  {
    label: "รายรับวันนี้",
    value: summary.value.todayIncome,
    icon: "pi pi-arrow-down-left",
    gradient: "gradient-green",
    color: "text-emerald-600",
  },
  {
    label: "รายจ่ายวันนี้",
    value: summary.value.todayExpense,
    icon: "pi pi-arrow-up-right",
    gradient: "gradient-red",
    color: "text-red-600",
  },
  {
    label: "กำไรวันนี้",
    value: summary.value.todayProfit,
    icon: "pi pi-chart-line",
    gradient: "gradient-blue",
    color: "text-primary-600",
  },
  {
    label: "เงินทุนคงเหลือ",
    value: summary.value.capitalRemaining,
    icon: "pi pi-database",
    gradient: "gradient-purple",
    color: "text-purple-600",
  },
]);
const monthCards = computed(() => [
  {
    label: "รายรับเดือนนี้ (เข้า)",
    value: summary.value.monthIncome,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    label: "รายจ่ายเดือนนี้ (ออก)",
    value: summary.value.monthExpense,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    label: "กำไร (ก่อนแบ่งช่าง)",
    value: summary.value.monthGrossProfit,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    label: "กำไรสุทธิ (เข้ากระเป๋าร้าน)",
    value: summary.value.monthNetProfit,
    color: "text-primary-600",
    bg: "bg-primary-50",
  },
]);

const mechanicPercent = ref(30); // มาตรฐานร้านทั่วไป ช่างคนละ 30% (รวม 60%) ร้านเก็บ 40%
const mechanicShare = computed(() => {
  const profit = summary.value.monthGrossProfit;
  if (profit <= 0) return 0;
  return (profit * mechanicPercent.value) / 100;
});
const shopRetainedPercent = computed(() => {
  return Math.max(10, 100 - mechanicPercent.value * 2); // ร้านต้องได้อย่างน้อย 10%
});
const shopRetainedAmount = computed(() => {
  const profit = summary.value.monthGrossProfit;
  if (profit <= 0) return 0;
  return (profit * shopRetainedPercent.value) / 100;
});

const paying = ref(false);
async function payMechanics() {
  if (mechanicShare.value <= 0) return;
  paying.value = true;
  try {
    const userStr = localStorage.getItem("chalawan_user");
    const user = userStr ? JSON.parse(userStr) : null;

    // พยายามหา Category "เงินเดือนพนักงาน" ถ้ามี
    const { data: catData } = await supabase
      .from("expense_categories")
      .select("id")
      .eq("name", "เงินเดือนพนักงาน")
      .maybeSingle();

    const expensesToInsert = [
      {
        date: dayjs().format("YYYY-MM-DD"),
        category_id: catData?.id || null,
        description: `เงินเดือนส่วนแบ่ง พี่กอล์ฟ (${mechanicPercent.value}%)`,
        amount: mechanicShare.value,
        note: `คำนวณจากกำไรขั้นต้น: ${fmt(summary.value.monthGrossProfit)} บาท`,
        created_by: user?.id,
      },
      {
        date: dayjs().format("YYYY-MM-DD"),
        category_id: catData?.id || null,
        description: `เงินเดือนส่วนแบ่ง พี่เอฟ (${mechanicPercent.value}%)`,
        amount: mechanicShare.value,
        note: `คำนวณจากกำไรขั้นต้น: ${fmt(summary.value.monthGrossProfit)} บาท`,
        created_by: user?.id,
      },
    ];

    const { error } = await supabase.from("expenses").insert(expensesToInsert);
    if (error) throw error;

    toast.add({
      severity: "success",
      summary: "จ่ายเงินสำเร็จ",
      detail: "บันทึกเป็นรายจ่ายเรียบร้อยแล้ว ยอดกำไรสุทธิจะลดลง",
      life: 5000,
    });
    await fetchAll();
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: e.message,
      life: 5000,
    });
  } finally {
    paying.value = false;
  }
}
</script>

<template>
  <div class="page-container">
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div
        class="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"
      ></div>
    </div>
    <template v-else>
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-surface-900">Dashboard</h1>
          <p class="text-sm text-surface-500 mt-0.5">
            {{ dayjs().format("DD/MM/YYYY") }}
          </p>
        </div>
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          rounded
          text
          @click="fetchAll"
        />
      </div>

      <!-- Today Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          v-for="(c, i) in stats"
          :key="i"
          class="stat-card animate-fade-in-up opacity-0"
          :class="`stagger-${i + 1}`"
        >
          <div
            :class="[
              c.gradient,
              'w-10 h-10 rounded-xl flex items-center justify-center mb-3',
            ]"
          >
            <i :class="[c.icon, 'text-white text-sm']" />
          </div>
          <p :class="['stat-card-value', c.color]">฿{{ fmt(c.value) }}</p>
          <p class="stat-card-label">{{ c.label }}</p>
        </div>
      </div>

      <!-- Month Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          v-for="(c, i) in monthCards"
          :key="i"
          :class="[c.bg, 'rounded-2xl p-4']"
        >
          <p class="text-xs font-medium text-surface-500 mb-1">{{ c.label }}</p>
          <p :class="['text-lg font-bold', c.color]">฿{{ fmt(c.value) }}</p>
        </div>
      </div>

      <!-- Mechanics Salary Share Realtime -->
      <div class="card mb-6 border-2 border-primary-100 bg-gradient-to-r from-primary-50 to-white">
        <div class="card-body p-5">
          <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            
            <!-- Left Side: Title & Info -->
            <div class="flex items-start sm:items-center gap-4">
              <div class="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl flex-shrink-0">👨‍🔧</div>
              <div>
                <h3 class="font-bold text-surface-900 text-xl">ระบบจ่ายเงินช่าง (ตามมาตรฐาน)</h3>
                <p class="text-surface-500 mb-2">กำไรที่จะเอามาแบ่ง: <span class="font-bold text-amber-600">฿{{ fmt(summary.monthGrossProfit) }}</span></p>
                <div class="flex flex-wrap gap-2 text-xs">
                  <span class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md font-medium">เหลือเข้าร้าน (กองกลาง) {{ shopRetainedPercent }}% = ฿{{ fmt(shopRetainedAmount) }}</span>
                </div>
              </div>
            </div>
            
            <!-- Right Side: Controls & Button -->
            <div class="flex flex-wrap items-center justify-center sm:justify-end gap-4 lg:gap-6 bg-white/60 p-4 rounded-xl border border-primary-100">
              
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-surface-600 whitespace-nowrap">ให้ช่างคนละ:</span>
                <InputNumber v-model="mechanicPercent" :min="0" :max="45" suffix="%" class="w-20" inputClass="!text-center !py-2 !px-2 w-full" />
              </div>
              
              <div class="hidden sm:block w-px h-10 bg-surface-200"></div>
              
              <div class="text-center sm:text-right min-w-[100px]">
                <p class="text-xs text-surface-500 whitespace-nowrap">ได้คนละประมาณ</p>
                <p class="text-xl font-bold text-primary-600 whitespace-nowrap">฿{{ fmt(mechanicShare) }}</p>
              </div>
              
              <Button 
                label="กดจ่ายเงินช่าง" 
                icon="pi pi-check-circle" 
                class="!px-5 !py-3 !text-base !font-bold shadow-md whitespace-nowrap" 
                @click="payMechanics" 
                :loading="paying" 
                :disabled="mechanicShare <= 0" 
              />

            </div>

          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="card">
          <div class="card-header">
            <h3 class="font-semibold text-surface-900">
              รายรับ vs รายจ่าย (7 วัน)
            </h3>
          </div>
          <div class="card-body">
            <div class="h-[280px]">
              <Bar :data="barData" :options="barOpts" />
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="font-semibold text-surface-900">กำไรสะสมรายเดือน</h3>
          </div>
          <div class="card-body">
            <div class="h-[280px]">
              <Line :data="lineData" :options="lineOpts" />
            </div>
          </div>
        </div>
      </div>

      <!-- Top Products + Quick Actions -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 card">
          <div class="card-header">
            <h3 class="font-semibold text-surface-900">
              🏆 สินค้าขายดี (เดือนนี้)
            </h3>
          </div>
          <div class="card-body" v-if="topProducts.length">
            <DataTable :value="topProducts" :rows="5" class="text-sm">
              <Column field="name" header="สินค้า/บริการ" />
              <Column field="total_quantity" header="จำนวน"
                ><template #body="{ data }"
                  ><span class="font-semibold">{{
                    data.total_quantity
                  }}</span></template
                ></Column
              >
              <Column field="total_amount" header="ยอดรวม"
                ><template #body="{ data }"
                  ><span class="font-bold text-emerald-600"
                    >฿{{ fmtFull(data.total_amount) }}</span
                  ></template
                ></Column
              >
            </DataTable>
          </div>
          <div v-else class="card-body text-center py-8 text-surface-400">
            <i class="pi pi-box text-4xl mb-3 block" />
            <p>ยังไม่มีข้อมูล</p>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="font-semibold text-surface-900">⚡ ทางลัด</h3>
          </div>
          <div class="card-body space-y-3">
            <button
              @click="router.push('/income')"
              class="w-full flex items-center gap-3 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors group"
            >
              <div
                class="w-10 h-10 rounded-xl gradient-green flex items-center justify-center group-hover:scale-110 transition-transform"
              >
                <i class="pi pi-plus text-white" />
              </div>
              <div class="text-left">
                <p class="font-semibold text-surface-900">บันทึกรายรับ</p>
                <p class="text-xs text-surface-500">เพิ่มรายการรายรับใหม่</p>
              </div>
            </button>
            <button
              @click="router.push('/expense')"
              class="w-full flex items-center gap-3 p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors group"
            >
              <div
                class="w-10 h-10 rounded-xl gradient-red flex items-center justify-center group-hover:scale-110 transition-transform"
              >
                <i class="pi pi-plus text-white" />
              </div>
              <div class="text-left">
                <p class="font-semibold text-surface-900">บันทึกรายจ่าย</p>
                <p class="text-xs text-surface-500">เพิ่มรายการรายจ่ายใหม่</p>
              </div>
            </button>
            <button
              @click="router.push('/reports')"
              class="w-full flex items-center gap-3 p-4 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors group"
            >
              <div
                class="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center group-hover:scale-110 transition-transform"
              >
                <i class="pi pi-file text-white" />
              </div>
              <div class="text-left">
                <p class="font-semibold text-surface-900">ดูรายงาน</p>
                <p class="text-xs text-surface-500">สรุปรายรับรายจ่าย</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
