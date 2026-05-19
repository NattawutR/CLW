<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'
import Papa from 'papaparse'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const period = ref('month')
const periods = [
  { label: 'รายวัน', value: 'day' },
  { label: 'รายสัปดาห์', value: 'week' },
  { label: 'รายเดือน', value: 'month' },
  { label: 'รายปี', value: 'year' },
]

const loading = ref(false)
const rows = ref<any[]>([])
const totalIncome = ref(0)
const totalExpense = ref(0)

onMounted(() => loadReport())

async function loadReport() {
  loading.value = true
  try {
    let startDate: string, endDate: string
    if (period.value === 'day') {
      startDate = endDate = dayjs().format('YYYY-MM-DD')
    } else if (period.value === 'week') {
      startDate = dayjs().startOf('week').format('YYYY-MM-DD')
      endDate = dayjs().endOf('week').format('YYYY-MM-DD')
    } else if (period.value === 'month') {
      startDate = dayjs().startOf('month').format('YYYY-MM-DD')
      endDate = dayjs().endOf('month').format('YYYY-MM-DD')
    } else {
      startDate = dayjs().startOf('year').format('YYYY-MM-DD')
      endDate = dayjs().endOf('year').format('YYYY-MM-DD')
    }

    const { data: incData } = await supabase.from('incomes').select('date, amount, description, category:income_categories(name)').gte('date', startDate).lte('date', endDate).order('date')
    const { data: expData } = await supabase.from('expenses').select('date, amount, description, category:expense_categories(name)').gte('date', startDate).lte('date', endDate).order('date')

    const combined: any[] = []
    for (const r of (incData || [])) combined.push({ ...r, type: 'รายรับ', categoryName: (r.category as any)?.name || '-' })
    for (const r of (expData || [])) combined.push({ ...r, type: 'รายจ่าย', categoryName: (r.category as any)?.name || '-' })
    combined.sort((a, b) => a.date.localeCompare(b.date))

    rows.value = combined
    totalIncome.value = (incData || []).reduce((s, r) => s + Number(r.amount), 0)
    totalExpense.value = (expData || []).reduce((s, r) => s + Number(r.amount), 0)
  } finally { loading.value = false }
}

const profit = computed(() => totalIncome.value - totalExpense.value)
function fmt(n: number) { return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n) }

function exportCSV() {
  const data = rows.value.map(r => ({
    วันที่: dayjs(r.date).format('DD/MM/YYYY'),
    ประเภท: r.type,
    หมวดหมู่: r.categoryName,
    รายละเอียด: r.description,
    จำนวนเงิน: r.amount,
  }))
  const csv = Papa.unparse(data)
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chalawan-report-${period.value}-${dayjs().format('YYYYMMDD')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function changePeriod() { loadReport() }
</script>

<template>
  <div class="page-container">
    <div class="flex items-center justify-between mb-6">
      <h1 class="page-title !mb-0">📋 รายงาน</h1>
      <Button label="Export CSV" icon="pi pi-download" severity="secondary" @click="exportCSV" class="!rounded-xl" />
    </div>

    <div class="card mb-6">
      <div class="card-body">
        <SelectButton v-model="period" :options="periods" optionLabel="label" optionValue="value" @change="changePeriod" />
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="rounded-2xl bg-emerald-50 p-5">
        <p class="text-sm text-surface-500 mb-1">รายรับรวม</p>
        <p class="text-xl font-bold text-emerald-600">฿{{ fmt(totalIncome) }}</p>
      </div>
      <div class="rounded-2xl bg-red-50 p-5">
        <p class="text-sm text-surface-500 mb-1">รายจ่ายรวม</p>
        <p class="text-xl font-bold text-red-600">฿{{ fmt(totalExpense) }}</p>
      </div>
      <div class="rounded-2xl bg-primary-50 p-5">
        <p class="text-sm text-surface-500 mb-1">กำไร</p>
        <p :class="['text-xl font-bold', profit >= 0 ? 'text-primary-600' : 'text-red-600']">฿{{ fmt(profit) }}</p>
      </div>
    </div>

    <div class="card">
      <DataTable :value="rows" :loading="loading" paginator :rows="20" :rowsPerPageOptions="[10,20,50,100]" class="text-sm" stripedRows emptyMessage="ไม่มีข้อมูล">
        <Column field="date" header="วันที่" style="min-width:100px"><template #body="{data}">{{ dayjs(data.date).format('DD/MM/YY') }}</template></Column>
        <Column field="type" header="ประเภท" style="min-width:80px">
          <template #body="{data}"><span :class="['badge', data.type === 'รายรับ' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700']">{{ data.type }}</span></template>
        </Column>
        <Column field="categoryName" header="หมวดหมู่" style="min-width:120px" />
        <Column field="description" header="รายละเอียด" style="min-width:200px" />
        <Column header="จำนวนเงิน" style="min-width:120px">
          <template #body="{data}"><span :class="['font-bold', data.type === 'รายรับ' ? 'text-emerald-600' : 'text-red-600']">฿{{ fmt(data.amount) }}</span></template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
