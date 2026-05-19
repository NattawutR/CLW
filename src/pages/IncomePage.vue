<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useIncome } from '@/composables/useIncome'
import { useProducts } from '@/composables/useProducts'
import { useAuthStore, USERS } from '@/stores/auth'
import { canEdit, canDelete, canWrite } from '@/lib/permissions'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import dayjs from 'dayjs'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import type { IncomeFormData } from '@/types'

const toast = useToast()
const confirm = useConfirm()
const auth = useAuthStore()
const { incomes, categories, loading, totalCount, fetchIncomes, fetchCategories, createIncome, updateIncome, deleteIncome } = useIncome()
const { products, fetchProducts } = useProducts()

const showForm = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const page = ref(1)
const search = ref('')
const filterCategoryId = ref<number | null>(null)

const form = ref<IncomeFormData>({ date: dayjs().format('YYYY-MM-DD'), category_id: null, product_id: null, description: '', quantity: 1, amount: 0, note: '' })

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchProducts()])
  await loadData()
})

async function loadData() { await fetchIncomes({ search: search.value, categoryId: filterCategoryId.value, startDate: null, endDate: null }, page.value) }

watch([search, filterCategoryId], () => { page.value = 1; loadData() })

function openCreate() {
  editingId.value = null
  form.value = { date: dayjs().format('YYYY-MM-DD'), category_id: null, product_id: null, description: '', quantity: 1, amount: 0, note: '' }
  showForm.value = true
}

function openEdit(row: any) {
  editingId.value = row.id
  form.value = { date: row.date, category_id: row.category_id, product_id: row.product_id, description: row.description || '', quantity: row.quantity, amount: row.amount, note: row.note || '' }
  showForm.value = true
}

function onProductSelect() {
  const p = products.value.find(x => x.id === form.value.product_id)
  if (p) {
    form.value.amount = p.price
    form.value.description = p.name
    if (p.category_id) form.value.category_id = p.category_id
  }
}

const selectedProductProfit = computed(() => {
  if (!form.value.product_id) return null
  const p = products.value.find(x => x.id === form.value.product_id)
  if (!p) return null
  const cost = p.cost_price || 0
  const price = form.value.amount || 0
  return (price - cost) * (form.value.quantity || 1)
})

async function handleSave() {
  if (!form.value.amount || !form.value.category_id) {
    toast.add({ severity: 'warn', summary: 'กรุณากรอกข้อมูล', detail: 'กรุณาเลือกประเภทและกรอกจำนวนเงิน', life: 3000 })
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await updateIncome(editingId.value, form.value)
      toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'แก้ไขรายรับเรียบร้อย', life: 3000 })
    } else {
      await createIncome(form.value)
      toast.add({ severity: 'success', summary: 'สำเร็จ', detail: 'เพิ่มรายรับเรียบร้อย', life: 3000 })
    }
    showForm.value = false
    await loadData()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: e.message, life: 5000 })
  } finally { saving.value = false }
}

function confirmDelete(row: any) {
  confirm.require({
    message: `ต้องการลบรายรับ "${row.description}" จำนวน ฿${row.amount} ใช่หรือไม่?`,
    header: 'ยืนยันการลบ',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'ลบ',
    rejectLabel: 'ยกเลิก',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await deleteIncome(row.id)
        toast.add({ severity: 'success', summary: 'ลบแล้ว', detail: 'ลบรายรับเรียบร้อย', life: 3000 })
        await loadData()
      } catch (e: any) {
        toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: e.message, life: 5000 })
      }
    },
  })
}

function fmt(n: number) { return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n) }
</script>

<template>
  <div class="page-container">
    <div class="flex items-center justify-between mb-6">
      <h1 class="page-title !mb-0">💰 รายรับ</h1>
      <Button v-if="auth.role && canWrite(auth.role)" label="+ เพิ่มรายรับ" icon="pi pi-plus" @click="openCreate" class="!rounded-xl" />
    </div>

    <!-- Filters -->
    <div class="card mb-6">
      <div class="card-body flex flex-wrap gap-3">
        <InputText v-model="search" placeholder="🔍 ค้นหา..." class="w-full sm:w-64" />
        <Select v-model="filterCategoryId" :options="categories" optionLabel="name" optionValue="id" placeholder="ทุกประเภท" showClear class="w-full sm:w-48" />
      </div>
    </div>

    <!-- Table -->
    <div class="card">
      <DataTable :value="incomes" :loading="loading" :rows="20" :totalRecords="totalCount" paginator :rowsPerPageOptions="[10,20,50]" class="text-sm" stripedRows responsiveLayout="scroll" emptyMessage="ไม่มีรายการรายรับ">
        <Column field="date" header="วันที่" :sortable="true" style="min-width:100px">
          <template #body="{data}">{{ dayjs(data.date).format('DD/MM/YY') }}</template>
        </Column>
        <Column header="ประเภท" style="min-width:120px">
          <template #body="{data}"><span class="badge bg-emerald-100 text-emerald-700">{{ data.category?.name || '-' }}</span></template>
        </Column>
        <Column field="description" header="รายละเอียด" style="min-width:200px" />
        <Column field="quantity" header="จำนวน" style="min-width:80px" />
        <Column header="จำนวนเงิน" style="min-width:120px">
          <template #body="{data}"><span class="font-bold text-emerald-600">฿{{ fmt(data.amount) }}</span></template>
        </Column>
        <Column header="ผู้บันทึก" style="min-width:100px">
          <template #body="{data}">{{ USERS.find(u => u.id === data.created_by)?.full_name || '-' }}</template>
        </Column>
        <Column header="จัดการ" style="min-width:100px" v-if="auth.role && canWrite(auth.role)">
          <template #body="{data}">
            <div class="flex gap-1">
              <Button v-if="auth.role && canEdit(auth.role, data.created_by, auth.user?.id || '')" icon="pi pi-pencil" severity="info" text rounded size="small" @click="openEdit(data)" />
              <Button v-if="auth.role && canDelete(auth.role, data.created_by, auth.user?.id || '')" icon="pi pi-trash" severity="danger" text rounded size="small" @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Form Dialog -->
    <Dialog v-model:visible="showForm" :header="editingId ? 'แก้ไขรายรับ' : 'เพิ่มรายรับ'" modal :style="{width:'500px'}" class="mx-4">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-surface-700 mb-1">วันที่</label>
          <DatePicker v-model="form.date" dateFormat="yy-mm-dd" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-surface-700 mb-1">สินค้า/บริการ (ถ้ามี)</label>
          <Select v-model="form.product_id" :options="products.filter(p=>p.is_active)" optionLabel="name" optionValue="id" placeholder="เลือกสินค้า..." showClear class="w-full" @change="onProductSelect" />
        </div>
        <div>
          <label class="block text-sm font-medium text-surface-700 mb-1">ประเภท *</label>
          <Select v-model="form.category_id" :options="categories" optionLabel="name" optionValue="id" placeholder="เลือกประเภท..." class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-surface-700 mb-1">รายละเอียด</label>
          <InputText v-model="form.description" class="w-full" placeholder="รายละเอียด..." />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">จำนวน</label>
            <InputNumber v-model="form.quantity" :min="1" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">จำนวนเงิน (฿) *</label>
            <InputNumber v-model="form.amount" :min="0" :minFractionDigits="0" mode="decimal" class="w-full" />
            <p v-if="selectedProductProfit !== null" class="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
              <i class="pi pi-check-circle"></i> กำไรโดยประมาณ: ฿{{ fmt(selectedProductProfit) }}
            </p>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-surface-700 mb-1">หมายเหตุ</label>
          <Textarea v-model="form.note" rows="2" class="w-full" placeholder="หมายเหตุ..." />
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" severity="secondary" text @click="showForm=false" />
        <Button :label="editingId ? 'บันทึก' : 'เพิ่มรายรับ'" icon="pi pi-check" @click="handleSave" :loading="saving" />
      </template>
    </Dialog>
  </div>
</template>
