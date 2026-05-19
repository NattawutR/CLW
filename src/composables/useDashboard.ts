import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { DashboardSummary, DailyChartData, MonthlyProfitData, TopProduct } from '@/types'
import dayjs from 'dayjs'

export function useDashboard() {
  const summary = ref<DashboardSummary>({
    todayIncome: 0,
    todayExpense: 0,
    todayProfit: 0,
    monthIncome: 0,
    monthExpense: 0,
    monthProfit: 0,
    monthGrossProfit: 0,
    monthNetProfit: 0,
    capitalRemaining: 0,
    cumulativeProfit: 0,
  })
  const dailyChart = ref<DailyChartData[]>([])
  const monthlyProfit = ref<MonthlyProfitData[]>([])
  const topProducts = ref<TopProduct[]>([])
  const loading = ref(false)

  const today = dayjs().format('YYYY-MM-DD')
  const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD')
  const endOfMonth = dayjs().endOf('month').format('YYYY-MM-DD')

  async function fetchSummary() {
    loading.value = true
    try {
      // Today's income
      const { data: todayIncData } = await supabase
        .from('incomes')
        .select('amount')
        .eq('date', today)
      const todayIncome = (todayIncData || []).reduce((sum, r) => sum + Number(r.amount), 0)

      // Today's expense
      const { data: todayExpData } = await supabase
        .from('expenses')
        .select('amount')
        .eq('date', today)
      const todayExpense = (todayExpData || []).reduce((sum, r) => sum + Number(r.amount), 0)

      // Month income
      const { data: monthIncData } = await supabase
        .from('incomes')
        .select('amount')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
      const monthIncome = (monthIncData || []).reduce((sum, r) => sum + Number(r.amount), 0)

      // Month expense
      const { data: monthExpData } = await supabase
        .from('expenses')
        .select('amount, description')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)

      let monthExpenseNormal = 0
      let monthExpenseMechanic = 0
      for (const exp of (monthExpData || [])) {
        if (exp.description?.includes('เงินเดือนส่วนแบ่ง') || exp.description?.includes('ส่วนแบ่งช่าง') || exp.description?.includes('จ่ายเงินช่าง')) {
          monthExpenseMechanic += Number(exp.amount)
        } else {
          monthExpenseNormal += Number(exp.amount)
        }
      }

      const monthExpense = monthExpenseNormal + monthExpenseMechanic
      const monthGrossProfit = monthIncome - monthExpenseNormal
      const monthNetProfit = monthGrossProfit - monthExpenseMechanic

      // Capital
      const { data: capitalData } = await supabase
        .from('capital')
        .select('type, amount')
      const capitalTotal = (capitalData || []).reduce((sum, r) => {
        return sum + (r.type === 'inject' ? Number(r.amount) : -Number(r.amount))
      }, 0)

      // All-time income and expense for cumulative
      const { data: allIncData } = await supabase.from('incomes').select('amount')
      const allIncome = (allIncData || []).reduce((sum, r) => sum + Number(r.amount), 0)

      const { data: allExpData } = await supabase.from('expenses').select('amount')
      const allExpense = (allExpData || []).reduce((sum, r) => sum + Number(r.amount), 0)

      summary.value = {
        todayIncome,
        todayExpense,
        todayProfit: todayIncome - todayExpense,
        monthIncome,
        monthExpense,
        monthProfit: monthIncome - monthExpense,
        monthGrossProfit,
        monthNetProfit,
        capitalRemaining: capitalTotal + allIncome - allExpense,
        cumulativeProfit: allIncome - allExpense,
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchDailyChart() {
    const days: DailyChartData[] = []
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD')

      const { data: incData } = await supabase
        .from('incomes')
        .select('amount')
        .eq('date', date)

      const { data: expData } = await supabase
        .from('expenses')
        .select('amount')
        .eq('date', date)

      days.push({
        date,
        income: (incData || []).reduce((s, r) => s + Number(r.amount), 0),
        expense: (expData || []).reduce((s, r) => s + Number(r.amount), 0),
      })
    }
    dailyChart.value = days
  }

  async function fetchMonthlyProfit() {
    const months: MonthlyProfitData[] = []
    let cumulative = 0

    for (let i = 5; i >= 0; i--) {
      const start = dayjs().subtract(i, 'month').startOf('month').format('YYYY-MM-DD')
      const end = dayjs().subtract(i, 'month').endOf('month').format('YYYY-MM-DD')
      const label = dayjs().subtract(i, 'month').format('MMM YYYY')

      const { data: incData } = await supabase
        .from('incomes')
        .select('amount')
        .gte('date', start)
        .lte('date', end)

      const { data: expData } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', start)
        .lte('date', end)

      const income = (incData || []).reduce((s, r) => s + Number(r.amount), 0)
      const expense = (expData || []).reduce((s, r) => s + Number(r.amount), 0)
      const profit = income - expense
      cumulative += profit

      months.push({ month: label, profit, cumulative })
    }
    monthlyProfit.value = months
  }

  async function fetchTopProducts() {
    const { data } = await supabase
      .from('incomes')
      .select('product:products(name), amount, quantity')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .not('product_id', 'is', null)

    if (!data) {
      topProducts.value = []
      return
    }

    // Aggregate by product name
    const map = new Map<string, { total_amount: number; total_quantity: number }>()
    for (const row of data) {
      const name = (row.product as any)?.name || 'ไม่ระบุ'
      const existing = map.get(name) || { total_amount: 0, total_quantity: 0 }
      existing.total_amount += Number(row.amount)
      existing.total_quantity += Number(row.quantity)
      map.set(name, existing)
    }

    topProducts.value = Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 5)
  }

  async function fetchAll() {
    await Promise.all([
      fetchSummary(),
      fetchDailyChart(),
      fetchMonthlyProfit(),
      fetchTopProducts(),
    ])
  }

  return {
    summary,
    dailyChart,
    monthlyProfit,
    topProducts,
    loading,
    fetchSummary,
    fetchDailyChart,
    fetchMonthlyProfit,
    fetchTopProducts,
    fetchAll,
  }
}
