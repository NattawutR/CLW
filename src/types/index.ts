// === Profiles ===
export type UserRole = 'admin' | 'co_admin' | 'owner' | 'staff'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

// === Categories ===
export interface IncomeCategory {
  id: number
  name: string
  is_active: boolean
}

export interface ExpenseCategory {
  id: number
  name: string
  is_active: boolean
}

// === Products ===
export interface Product {
  id: number
  name: string
  category_id: number
  unit: string
  cost_price: number
  price: number
  is_active: boolean
  created_at: string
  updated_at: string
  // joined
  category?: IncomeCategory
}

// === Income ===
export interface Income {
  id: number
  date: string
  category_id: number
  product_id: number | null
  description: string
  quantity: number
  amount: number
  note: string
  created_by: string
  created_at: string
  updated_at: string
  // joined
  category?: IncomeCategory
  product?: Product
  creator?: Profile
}

export interface IncomeFormData {
  date: any
  category_id: number | null
  product_id: number | null
  description: string
  quantity: number
  amount: number
  note: string
}

// === Expense ===
export interface Expense {
  id: number
  date: string
  category_id: number
  description: string
  amount: number
  is_fixed_cost: boolean
  note: string
  created_by: string
  created_at: string
  updated_at: string
  // joined
  category?: ExpenseCategory
  creator?: Profile
}

export interface ExpenseFormData {
  date: any
  category_id: number | null
  description: string
  amount: number
  note: string
}

// === Fixed Cost ===
export interface FixedCost {
  id: number
  name: string
  amount: number
  category_id: number
  is_active: boolean
  created_at: string
  updated_at: string
  // joined
  category?: ExpenseCategory
}

export interface FixedCostFormData {
  name: string
  amount: number
  category_id: number | null
  is_active: boolean
}

// === Capital ===
export interface Capital {
  id: number
  type: 'inject' | 'withdraw'
  amount: number
  note: string
  date: string
  created_by: string
  created_at: string
}

// === Salary ===
export interface SalarySetting {
  id: number
  profile_id: string
  type: 'fixed' | 'percent'
  value: number
  effective_from: string
  // joined
  profile?: Profile
}

export interface SalaryPayment {
  id: number
  profile_id: string
  month: string
  amount: number
  paid_at: string
  created_by: string
  created_at: string
  // joined
  profile?: Profile
}

// === Dashboard ===
export interface DashboardSummary {
  todayIncome: number
  todayExpense: number
  todayProfit: number
  monthIncome: number
  monthExpense: number
  monthProfit: number
  monthGrossProfit: number
  monthNetProfit: number
  capitalRemaining: number
  cumulativeProfit: number
}

export interface DailyChartData {
  date: string
  income: number
  expense: number
}

export interface MonthlyProfitData {
  month: string
  profit: number
  cumulative: number
}

export interface TopProduct {
  name: string
  total_amount: number
  total_quantity: number
}

// === Filters ===
export interface DateFilter {
  startDate: string | null
  endDate: string | null
}

export interface TransactionFilter extends DateFilter {
  categoryId: number | null
  search: string
}
