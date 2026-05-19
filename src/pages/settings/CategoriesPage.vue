<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputSwitch from 'primevue/inputswitch'
import Tag from 'primevue/tag'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'

const toast = useToast()
const confirm = useConfirm()

const incomeCategories = ref<any[]>([])
const expenseCategories = ref<any[]>([])
const loading = ref(false)
const showForm = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const activeTab = ref('income')
const form = ref({ name: '', is_active: true })

onMounted(() => loadAll())

async function loadAll() {
  loading.value = true
  try {
    const [{ data: inc }, { data: exp }] = await Promise.all([
      supabase.from('income_categories').select('*').order('name'),
      supabase.from('expense_categories').select('*').order('name'),
    ])
    incomeCategories.value = inc || []
    expenseCategories.value = exp || []
  } finally { loading.value = false }
}

function openCreate(tab: string) { activeTab.value = tab; editingId.value = null; form.value = { name: '', is_active: true }; showForm.value = true }
function openEdit(tab: string, row: any) { activeTab.value = tab; editingId.value = row.id; form.value = { name: row.name, is_active: row.is_active }; showForm.value = true }

async function handleSave() {
  if (!form.value.name) { toast.add({ severity: 'warn', summary: 'กรุณากรอกชื่อ', life: 3000 }); return }
  saving.value = true
  const table = activeTab.value === 'income' ? 'income_categories' : 'expense_categories'
  try {
    if (editingId.value) { await supabase.from(table).update(form.value).eq('id', editingId.value) }
    else { await supabase.from(table).insert(form.value) }
    toast.add({ severity: 'success', summary: 'บันทึกเรียบร้อย', life: 3000 })
    showForm.value = false; await loadAll()
  } catch (e: any) { toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: e.message, life: 5000 }) }
  finally { saving.value = false }
}

function confirmDel(tab: string, row: any) {
  const table = tab === 'income' ? 'income_categories' : 'expense_categories'
  confirm.require({
    message: `ลบหมวดหมู่ "${row.name}" ใช่หรือไม่?`, header: 'ยืนยัน', icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'ลบ', rejectLabel: 'ยกเลิก', acceptClass: 'p-button-danger',
    accept: async () => {
      try { await supabase.from(table).delete().eq('id', row.id); toast.add({ severity: 'success', summary: 'ลบแล้ว', life: 3000 }); await loadAll() }
      catch (e: any) { toast.add({ severity: 'error', summary: 'ผิดพลาด', detail: e.message, life: 5000 }) }
    },
  })
}
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">🏷️ จัดการหมวดหมู่</h1>

    <TabView>
      <TabPanel value="0" header="📥 หมวดหมู่รายรับ">
        <div class="flex justify-end mb-4"><Button label="+ เพิ่ม" icon="pi pi-plus" size="small" @click="openCreate('income')" /></div>
        <DataTable :value="incomeCategories" :loading="loading" class="text-sm" stripedRows emptyMessage="ยังไม่มีหมวดหมู่">
          <Column field="name" header="ชื่อ" :sortable="true" />
          <Column header="สถานะ"><template #body="{data}"><Tag :value="data.is_active ? 'ใช้งาน' : 'ปิด'" :severity="data.is_active ? 'success' : 'secondary'" /></template></Column>
          <Column header="จัดการ" style="width:100px"><template #body="{data}"><div class="flex gap-1"><Button icon="pi pi-pencil" severity="info" text rounded size="small" @click="openEdit('income', data)" /><Button icon="pi pi-trash" severity="danger" text rounded size="small" @click="confirmDel('income', data)" /></div></template></Column>
        </DataTable>
      </TabPanel>
      <TabPanel value="1" header="📤 หมวดหมู่รายจ่าย">
        <div class="flex justify-end mb-4"><Button label="+ เพิ่ม" icon="pi pi-plus" size="small" @click="openCreate('expense')" /></div>
        <DataTable :value="expenseCategories" :loading="loading" class="text-sm" stripedRows emptyMessage="ยังไม่มีหมวดหมู่">
          <Column field="name" header="ชื่อ" :sortable="true" />
          <Column header="สถานะ"><template #body="{data}"><Tag :value="data.is_active ? 'ใช้งาน' : 'ปิด'" :severity="data.is_active ? 'success' : 'secondary'" /></template></Column>
          <Column header="จัดการ" style="width:100px"><template #body="{data}"><div class="flex gap-1"><Button icon="pi pi-pencil" severity="info" text rounded size="small" @click="openEdit('expense', data)" /><Button icon="pi pi-trash" severity="danger" text rounded size="small" @click="confirmDel('expense', data)" /></div></template></Column>
        </DataTable>
      </TabPanel>
    </TabView>

    <Dialog v-model:visible="showForm" :header="editingId ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'" modal :style="{width:'400px'}" class="mx-4">
      <div class="space-y-4">
        <div><label class="block text-sm font-medium text-surface-700 mb-1">ชื่อ *</label><InputText v-model="form.name" class="w-full" /></div>
        <div class="flex items-center gap-3"><InputSwitch v-model="form.is_active" /><span class="text-sm">{{ form.is_active ? 'ใช้งาน' : 'ปิดใช้งาน' }}</span></div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" severity="secondary" text @click="showForm=false" />
        <Button :label="editingId ? 'บันทึก' : 'เพิ่ม'" icon="pi pi-check" @click="handleSave" :loading="saving" />
      </template>
    </Dialog>
  </div>
</template>
