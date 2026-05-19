import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Product, IncomeCategory } from '@/types'

export function useProducts() {
  const products = ref<Product[]>([])
  const categories = ref<IncomeCategory[]>([])
  const loading = ref(false)

  async function fetchProducts() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:income_categories(id, name)
        `)
        .order('name')

      if (error) throw error
      products.value = data || []
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

  async function createProduct(product: Partial<Product>) {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async function updateProduct(id: number, product: Partial<Product>) {
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async function deleteProduct(id: number) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    if (error) throw error
  }

  return {
    products,
    categories,
    loading,
    fetchProducts,
    fetchCategories,
    createProduct,
    updateProduct,
    deleteProduct,
  }
}
