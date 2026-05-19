<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFixedCosts } from '@/composables/useFixedCosts'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import dayjs from 'dayjs'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import InputSwitch from 'primevue/inputswitch'
import Tag from 'primevue/tag'

const toast = useToast()
const confirm = useConfirm()
const { fixedCosts, categories, loading, fetchFixedCosts, fetchCategories, createFixedCost, updateFixedCost, deleteFixedCost, generateMonthlyExpenses } = useFixedCosts()

const showForm = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const generating = ref(false)
const form = ref({ name: '', amount: 0, category_id: null as number | null, is_active: true })

onMounted(async () => { await fetchCategories(); await fetchFixedCosts() })

function openCreate() { editingId.value = null; form.value = { name: '', amount: 0, category_id: null, is_active: true }; showForm.value = true }
function openEdit(row: any) { editingId.value = row.id; form.value = { name: row.name, amount: row.amount, category_id: row.category_id, is_active: row.is_active }; showForm.value = true }

async function handleSave() {
  if (!form.value.name || !form.value.amount) { toast.add({ severity: 'warn', summary: 'กรุณากรอกข้อมูล', life: 3000 }); return }
  saving.value = true
  try {
    if (editingId.value) { await updateFixedCost(editingId.value, form.value); toast.add({ severity: 'success', summary: 'แก้ไขเรียบร้อย', life: 3000 }) }
    else { await createFixedCost(form.value); toast.add({ severity: 'success', summary: 'เพิ่มเรียบร้อย', life: 3000 }) }
    showForm.value = false; await fetchFixedCosts()
  } catch (e: any) { toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: e.message, life: 5000 }) }
  finally { saving.value = false }
}

function confirmDel(row: any) {
  confirm.require({
    message: `ลบ "${row.name}" ใช่หรือไม่?`, header: 'ยืนยัน', icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'ลบ', rejectLabel: 'ยกเลิก', acceptClass: 'p-button-danger',
    accept: async () => {
      try { await deleteFixedCost(row.id); toast.add({ severity: 'success', summary: 'ลบแล้ว', life: 3000 }); await fetchFixedCosts() }
      catch (e: any) { toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: e.message, life: 5000 }) }
    },
  })
}

function confirmGenerate() {
  const month = dayjs().format('MMMM YYYY')
  confirm.require({
    message: `สร้างรายจ่ายประจำเดือน ${month} จาก Fixed Cost ที่เปิดใช้งานทั้งหมด?`,
    header: 'ยืนยันการสร้างรายจ่าย', icon: 'pi pi-calendar',
    acceptLabel: 'สร้าง', rejectLabel: 'ยกเลิก',
    accept: async () => {
      generating.value = true
      try {
        const count = await generateMonthlyExpenses()
        toast.add({ severity: 'success', summary: 'สร้างเรียบร้อย', detail: `สร้างรายจ่าย ${count} รายการ`, life: 5000 })
      } catch (e: any) { toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: e.message, life: 5000 }) }
      finally { generating.value = false }
    },
  })
}
function fmt(n: number) { return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n) }
</script>

<template>
  <div class="page-container">
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <h1 class="page-title !mb-0">📅 ค่าใช้จ่ายประจำ (Fixed Cost)</h1>
      <div class="flex gap-2">
        <Button label="Generate เดือนนี้" icon="pi pi-bolt" severity="warn" @click="confirmGenerate" :loading="generating" class="!rounded-xl" />
        <Button label="+ เพิ่ม" icon="pi pi-plus" @click="openCreate" class="!rounded-xl" />
      </div>
    </div>
    <div class="card">
      <DataTable :value="fixedCosts" :loading="loading" class="text-sm" stripedRows emptyMessage="ยังไม่มี Fixed Cost">
        <Column field="name" header="ชื่อ" :sortable="true" style="min-width:200px" />
        <Column header="ประเภท" style="min-width:120px"><template #body="{data}">{{ data.category?.name || '-' }}</template></Column>
        <Column header="จำนวนเงิน" style="min-width:120px"><template #body="{data}"><span class="font-bold">฿{{ fmt(data.amount) }}</span></template></Column>
        <Column header="สถานะ" style="min-width:80px"><template #body="{data}"><Tag :value="data.is_active ? 'เปิด' : 'ปิด'" :severity="data.is_active ? 'success' : 'secondary'" /></template></Column>
        <Column header="จัดการ" style="min-width:100px">
          <template #body="{data}">
            <div class="flex gap-1">
              <Button icon="pi pi-pencil" severity="info" text rounded size="small" @click="openEdit(data)" />
              <Button icon="pi pi-trash" severity="danger" text rounded size="small" @click="confirmDel(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
    <Dialog v-model:visible="showForm" :header="editingId ? 'แก้ไข Fixed Cost' : 'เพิ่ม Fixed Cost'" modal :style="{width:'450px'}" class="mx-4">
      <div class="space-y-4">
        <div><label class="block text-sm font-medium text-surface-700 mb-1">ชื่อ *</label><InputText v-model="form.name" class="w-full" placeholder="เช่น ค่าเช่า, ค่าน้ำ..." /></div>
        <div><label class="block text-sm font-medium text-surface-700 mb-1">ประเภท</label><Select v-model="form.category_id" :options="categories" optionLabel="name" optionValue="id" placeholder="เลือก..." showClear class="w-full" /></div>
        <div><label class="block text-sm font-medium text-surface-700 mb-1">จำนวนเงิน (฿) *</label><InputNumber v-model="form.amount" :min="0" :minFractionDigits="2" mode="decimal" class="w-full" /></div>
        <div class="flex items-center gap-3"><InputSwitch v-model="form.is_active" /><span class="text-sm">{{ form.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}</span></div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" severity="secondary" text @click="showForm=false" />
        <Button :label="editingId ? 'บันทึก' : 'เพิ่ม'" icon="pi pi-check" @click="handleSave" :loading="saving" />
      </template>
    </Dialog>
  </div>
</template>
