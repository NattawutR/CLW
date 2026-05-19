import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { FixedCost, FixedCostFormData, ExpenseCategory } from '@/types'
import dayjs from 'dayjs'

export function useFixedCosts() {
  const fixedCosts = ref<FixedCost[]>([])
  const categories = ref<ExpenseCategory[]>([])
  const loading = ref(false)

  async function fetchFixedCosts() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('fixed_costs')
        .select(`
          *,
          category:expense_categories(id, name)
        `)
        .order('name')

      if (error) throw error
      fixedCosts.value = data || []
    } finally {
      loading.value = false
    }
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('is_active', true)
      .order('name')
    categories.value = data || []
  }

  async function createFixedCost(formData: FixedCostFormData) {
    const { data, error } = await supabase
      .from('fixed_costs')
      .insert(formData)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async function updateFixedCost(id: number, formData: Partial<FixedCostFormData>) {
    const { data, error } = await supabase
      .from('fixed_costs')
      .update(formData)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async function deleteFixedCost(id: number) {
    const { error } = await supabase
      .from('fixed_costs')
      .delete()
      .eq('id', id)
    if (error) throw error
  }

  async function generateMonthlyExpenses(month?: string) {
    const targetMonth = month || dayjs().format('YYYY-MM-DD')
    const userStr = localStorage.getItem('chalawan_user')
    const user = userStr ? JSON.parse(userStr) : null

    // Get active fixed costs
    const { data: activeCosts, error: fetchErr } = await supabase
      .from('fixed_costs')
      .select('*')
      .eq('is_active', true)

    if (fetchErr) throw fetchErr
    if (!activeCosts || activeCosts.length === 0) {
      throw new Error('ไม่มีค่าใช้จ่ายประจำที่เปิดใช้งาน')
    }

    // Check if already generated this month (if so, delete them to allow regenerate)
    const startOfMonth = dayjs(targetMonth).startOf('month').format('YYYY-MM-DD')
    const endOfMonth = dayjs(targetMonth).endOf('month').format('YYYY-MM-DD')

    await supabase
      .from('expenses')
      .delete()
      .eq('is_fixed_cost', true)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)

    // Generate expense records
    const expenses = activeCosts.map(cost => ({
      date: startOfMonth,
      category_id: cost.category_id,
      description: `[Fixed] ${cost.name}`,
      amount: cost.amount,
      is_fixed_cost: true,
      note: `Auto-generated from fixed cost: ${cost.name}`,
      created_by: user?.id,
    }))

    const { error: insertErr } = await supabase
      .from('expenses')
      .insert(expenses)

    if (insertErr) throw insertErr

    return expenses.length
  }

  return {
    fixedCosts,
    categories,
    loading,
    fetchFixedCosts,
    fetchCategories,
    createFixedCost,
    updateFixedCost,
    deleteFixedCost,
    generateMonthlyExpenses,
  }
}
