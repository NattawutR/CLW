import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Income, IncomeFormData, TransactionFilter, IncomeCategory } from '@/types'
import dayjs from 'dayjs'

export function useIncome() {
  const incomes = ref<Income[]>([])
  const categories = ref<IncomeCategory[]>([])
  const loading = ref(false)
  const totalCount = ref(0)

  async function fetchIncomes(filter?: TransactionFilter, page = 1, pageSize = 20) {
    loading.value = true
    try {
      let query = supabase
        .from('incomes')
        .select(`
          *,
          category:income_categories(id, name),
          product:products(id, name, price, unit),
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

      // Pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error
      incomes.value = data || []
      totalCount.value = count || 0
    } finally {
      loading.value = false
    }
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('income_categories')
      .select('*')
      .eq('is_active', true)
      .order('name')
    categories.value = data || []
  }

  async function createIncome(formData: IncomeFormData) {
    const userStr = localStorage.getItem('chalawan_user')
    const user = userStr ? JSON.parse(userStr) : null
    const { data, error } = await supabase
      .from('incomes')
      .insert({
        ...formData,
        created_by: user?.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async function updateIncome(id: number, formData: Partial<IncomeFormData>) {
    const { data, error } = await supabase
      .from('incomes')
      .update(formData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async function deleteIncome(id: number) {
    const { error } = await supabase
      .from('incomes')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  return {
    incomes,
    categories,
    loading,
    totalCount,
    fetchIncomes,
    fetchCategories,
    createIncome,
    updateIncome,
    deleteIncome,
  }
}
