import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Expense, ExpenseFormData, TransactionFilter, ExpenseCategory } from '@/types'

export function useExpense() {
  const expenses = ref<Expense[]>([])
  const categories = ref<ExpenseCategory[]>([])
  const loading = ref(false)
  const totalCount = ref(0)

  async function fetchExpenses(filter?: TransactionFilter, page = 1, pageSize = 20) {
    loading.value = true
    try {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          category:expense_categories(id, name),
          creator:profiles!created_by(id, full_name)
        `, { count: 'exact' })
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (filter?.startDate) {
        query = query.gte('date', filter.startDate)
      }
      if (filter?.endDate) {
        query = query.lte('date', filter.endDate)
      }
      if (filter?.categoryId) {
        query = query.eq('category_id', filter.categoryId)
      }
      if (filter?.search) {
        query = query.ilike('description', `%${filter.search}%`)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error
      expenses.value = data || []
      totalCount.value = count || 0
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

  async function createExpense(formData: ExpenseFormData) {
    const userStr = localStorage.getItem('chalawan_user')
    const user = userStr ? JSON.parse(userStr) : null
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        ...formData,
        created_by: user?.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async function updateExpense(id: number, formData: Partial<ExpenseFormData>) {
    const { data, error } = await supabase
      .from('expenses')
      .update(formData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async function deleteExpense(id: number) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  return {
    expenses,
    categories,
    loading,
    totalCount,
    fetchExpenses,
    fetchCategories,
    createExpense,
    updateExpense,
    deleteExpense,
  }
}
