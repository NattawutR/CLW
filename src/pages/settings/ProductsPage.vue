<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProducts } from '@/composables/useProducts'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
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
const { products, categories, loading, fetchProducts, fetchCategories, createProduct, updateProduct, deleteProduct } = useProducts()

const showForm = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const form = ref({ name: '', category_id: null as number | null, unit: '', cost_price: 0, price: 0, is_active: true })

onMounted(async () => { await fetchCategories(); await fetchProducts() })

function openCreate() {
  editingId.value = null
  form.value = { name: '', category_id: null, unit: '', cost_price: 0, price: 0, is_active: true }
  showForm.value = true
}
function openEdit(row: any) {
  editingId.value = row.id
  form.value = { name: row.name, category_id: row.category_id, unit: row.unit, cost_price: row.cost_price || 0, price: row.price, is_active: row.is_active }
  showForm.value = true
}

async function handleSave() {
  if (!form.value.name) { toast.add({ severity: 'warn', summary: 'กรุณากรอกชื่อ', life: 3000 }); return }
  saving.value = true
  try {
    if (editingId.value) {
      await updateProduct(editingId.value, form.value as any)
      toast.add({ severity: 'success', summary: 'แก้ไขสินค้าเรียบร้อย', life: 3000 })
    } else {
      await createProduct(form.value as any)
      toast.add({ severity: 'success', summary: 'เพิ่มสินค้าเรียบร้อย', life: 3000 })
    }
    showForm.value = false; await fetchProducts()
  } catch (e: any) { toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: e.message, life: 5000 }) }
  finally { saving.value = false }
}

function confirmDel(row: any) {
  confirm.require({
    message: `ต้องการลบ "${row.name}" ใช่หรือไม่?`, header: 'ยืนยันการลบ', icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'ลบ', rejectLabel: 'ยกเลิก', acceptClass: 'p-button-danger',
    accept: async () => {
      try { await deleteProduct(row.id); toast.add({ severity: 'success', summary: 'ลบแล้ว', life: 3000 }); await fetchProducts() }
      catch (e: any) { toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: e.message, life: 5000 }) }
    },
  })
}
function fmt(n: number) { return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n) }
</script>

<template>
  <div class="page-container">
    <div class="flex items-center justify-between mb-6">
      <h1 class="page-title !mb-0">📦 สินค้า/บริการ</h1>
      <Button label="+ เพิ่มสินค้า" icon="pi pi-plus" @click="openCreate" class="!rounded-xl" />
    </div>
    <div class="card">
      <DataTable :value="products" :loading="loading" paginator :rows="20" class="text-sm" stripedRows emptyMessage="ยังไม่มีสินค้า">
        <Column field="name" header="ชื่อ" :sortable="true" style="min-width:180px" />
        <Column header="ประเภท" style="min-width:120px"><template #body="{data}">{{ data.category?.name || '-' }}</template></Column>
        <Column field="unit" header="หน่วย" style="min-width:80px" />
        <Column header="ต้นทุน" style="min-width:100px"><template #body="{data}"><span>฿{{ fmt(data.cost_price || 0) }}</span></template></Column>
        <Column header="ราคาขาย" style="min-width:100px"><template #body="{data}"><span class="font-bold text-emerald-600">฿{{ fmt(data.price) }}</span></template></Column>
        <Column header="สถานะ" style="min-width:80px">
          <template #body="{data}"><Tag :value="data.is_active ? 'ใช้งาน' : 'ปิด'" :severity="data.is_active ? 'success' : 'secondary'" /></template>
        </Column>
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
    <Dialog v-model:visible="showForm" :header="editingId ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'" modal :style="{width:'450px'}" class="mx-4">
      <div class="space-y-4">
        <div><label class="block text-sm font-medium text-surface-700 mb-1">ชื่อ *</label><InputText v-model="form.name" class="w-full" /></div>
        <div><label class="block text-sm font-medium text-surface-700 mb-1">ประเภท</label><Select v-model="form.category_id" :options="categories" optionLabel="name" optionValue="id" placeholder="เลือก..." showClear class="w-full" /></div>
        <div class="grid grid-cols-1 gap-4">
          <div><label class="block text-sm font-medium text-surface-700 mb-1">หน่วย (เช่น ชิ้น, ครั้ง)</label><InputText v-model="form.unit" class="w-full" placeholder="ชิ้น, ครั้ง..." /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-sm font-medium text-surface-700 mb-1">ต้นทุน (฿)</label><InputNumber v-model="form.cost_price" :min="0" :minFractionDigits="0" mode="decimal" class="w-full" /></div>
          <div><label class="block text-sm font-medium text-surface-700 mb-1">ราคาขาย (฿)</label><InputNumber v-model="form.price" :min="0" :minFractionDigits="0" mode="decimal" class="w-full" /></div>
        </div>
        <div class="flex items-center gap-3"><InputSwitch v-model="form.is_active" /><span class="text-sm">{{ form.is_active ? 'ใช้งาน' : 'ปิดใช้งาน' }}</span></div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" severity="secondary" text @click="showForm=false" />
        <Button :label="editingId ? 'บันทึก' : 'เพิ่มสินค้า'" icon="pi pi-check" @click="handleSave" :loading="saving" />
      </template>
    </Dialog>
  </div>
</template>
