-- ================================================
-- ชาละวัน ออโต้ — Supabase Schema
-- Copy ทั้งหมดไปรันใน Supabase SQL Editor
-- ================================================

-- Enable UUID
create extension if not exists "uuid-ossp";

-- ========== PROFILES ==========
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text not null check (role in ('admin','co_admin','owner','staff')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========== INCOME CATEGORIES ==========
create table income_categories (
  id serial primary key,
  name text not null,
  is_active boolean default true
);

-- ========== EXPENSE CATEGORIES ==========
create table expense_categories (
  id serial primary key,
  name text not null,
  is_active boolean default true
);

-- ========== PRODUCTS ==========
create table products (
  id serial primary key,
  name text not null,
  category_id int references income_categories,
  unit text,
  price numeric(12,2) default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========== INCOMES ==========
create table incomes (
  id serial primary key,
  date date not null,
  category_id int references income_categories,
  product_id int references products,
  description text,
  quantity numeric(10,2) default 1,
  amount numeric(12,2) not null,
  note text,
  created_by uuid references profiles,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========== EXPENSES ==========
create table expenses (
  id serial primary key,
  date date not null,
  category_id int references expense_categories,
  description text not null,
  amount numeric(12,2) not null,
  is_fixed_cost boolean default false,
  note text,
  created_by uuid references profiles,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========== FIXED COSTS ==========
create table fixed_costs (
  id serial primary key,
  name text not null,
  amount numeric(12,2) not null,
  category_id int references expense_categories,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========== CAPITAL ==========
create table capital (
  id serial primary key,
  type text not null check (type in ('inject','withdraw')),
  amount numeric(12,2) not null,
  note text,
  date date not null,
  created_by uuid references profiles,
  created_at timestamptz default now()
);

-- ========== SALARY SETTINGS (Phase 2) ==========
create table salary_settings (
  id serial primary key,
  profile_id uuid references profiles,
  type text check (type in ('fixed','percent')),
  value numeric(10,2) not null,
  effective_from date not null
);

-- ========== SALARY PAYMENTS (Phase 2) ==========
create table salary_payments (
  id serial primary key,
  profile_id uuid references profiles,
  month date not null,
  amount numeric(12,2) not null,
  paid_at timestamptz,
  created_by uuid references profiles,
  created_at timestamptz default now()
);

-- ========== TRIGGER: auto updated_at ==========
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on profiles for each row execute function handle_updated_at();
create trigger set_updated_at before update on products for each row execute function handle_updated_at();
create trigger set_updated_at before update on incomes for each row execute function handle_updated_at();
create trigger set_updated_at before update on expenses for each row execute function handle_updated_at();
create trigger set_updated_at before update on fixed_costs for each row execute function handle_updated_at();

-- ========== TRIGGER: auto-create profile on signup ==========
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'staff');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ========== RLS ==========
alter table profiles enable row level security;
alter table income_categories enable row level security;
alter table expense_categories enable row level security;
alter table products enable row level security;
alter table incomes enable row level security;
alter table expenses enable row level security;
alter table fixed_costs enable row level security;
alter table capital enable row level security;
alter table salary_settings enable row level security;
alter table salary_payments enable row level security;

-- Helper function
create or replace function get_my_role()
returns text as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

-- PROFILES
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update_self" on profiles for update using (id = auth.uid());

-- INCOME CATEGORIES
create policy "income_cat_select" on income_categories for select using (true);
create policy "income_cat_insert" on income_categories for insert with check (get_my_role() in ('admin','co_admin'));
create policy "income_cat_update" on income_categories for update using (get_my_role() in ('admin','co_admin'));
create policy "income_cat_delete" on income_categories for delete using (get_my_role() in ('admin','co_admin'));

-- EXPENSE CATEGORIES
create policy "expense_cat_select" on expense_categories for select using (true);
create policy "expense_cat_insert" on expense_categories for insert with check (get_my_role() in ('admin','co_admin'));
create policy "expense_cat_update" on expense_categories for update using (get_my_role() in ('admin','co_admin'));
create policy "expense_cat_delete" on expense_categories for delete using (get_my_role() in ('admin','co_admin'));

-- PRODUCTS
create policy "products_select" on products for select using (true);
create policy "products_insert" on products for insert with check (get_my_role() in ('admin','co_admin'));
create policy "products_update" on products for update using (get_my_role() in ('admin','co_admin'));
create policy "products_delete" on products for delete using (get_my_role() in ('admin','co_admin'));

-- INCOMES
create policy "incomes_select" on incomes for select using (true);
create policy "incomes_insert" on incomes for insert with check (get_my_role() in ('admin','co_admin','staff'));
create policy "incomes_update" on incomes for update using (
  get_my_role() in ('admin','co_admin') or (get_my_role() = 'staff' and created_by = auth.uid())
);
create policy "incomes_delete" on incomes for delete using (
  get_my_role() in ('admin','co_admin') or (get_my_role() = 'staff' and created_by = auth.uid())
);

-- EXPENSES
create policy "expenses_select" on expenses for select using (true);
create policy "expenses_insert" on expenses for insert with check (get_my_role() in ('admin','co_admin','staff'));
create policy "expenses_update" on expenses for update using (
  get_my_role() in ('admin','co_admin') or (get_my_role() = 'staff' and created_by = auth.uid())
);
create policy "expenses_delete" on expenses for delete using (
  get_my_role() in ('admin','co_admin') or (get_my_role() = 'staff' and created_by = auth.uid())
);

-- FIXED COSTS
create policy "fixed_costs_select" on fixed_costs for select using (get_my_role() in ('admin','co_admin'));
create policy "fixed_costs_insert" on fixed_costs for insert with check (get_my_role() in ('admin','co_admin'));
create policy "fixed_costs_update" on fixed_costs for update using (get_my_role() in ('admin','co_admin'));
create policy "fixed_costs_delete" on fixed_costs for delete using (get_my_role() in ('admin','co_admin'));

-- CAPITAL
create policy "capital_select" on capital for select using (get_my_role() in ('admin','co_admin'));
create policy "capital_insert" on capital for insert with check (get_my_role() = 'admin');
create policy "capital_update" on capital for update using (get_my_role() = 'admin');
create policy "capital_delete" on capital for delete using (get_my_role() = 'admin');

-- SALARY SETTINGS
create policy "salary_settings_select" on salary_settings for select using (
  get_my_role() = 'admin' or (get_my_role() = 'co_admin' and profile_id = auth.uid())
);
create policy "salary_settings_insert" on salary_settings for insert with check (get_my_role() = 'admin');
create policy "salary_settings_update" on salary_settings for update using (get_my_role() = 'admin');
create policy "salary_settings_delete" on salary_settings for delete using (get_my_role() = 'admin');

-- SALARY PAYMENTS
create policy "salary_payments_select" on salary_payments for select using (
  get_my_role() = 'admin' or (get_my_role() = 'co_admin' and profile_id = auth.uid())
);
create policy "salary_payments_insert" on salary_payments for insert with check (get_my_role() = 'admin');

-- ========== SEED DATA ==========
insert into income_categories (name) values
  ('ขายอะไหล่'),
  ('ค่าแรงซ่อม'),
  ('ล้างรถ'),
  ('ค่าบริการอื่นๆ');

insert into expense_categories (name) values
  ('ซื้ออะไหล่'),
  ('ค่าน้ำ'),
  ('ค่าไฟ'),
  ('ค่าเช่า'),
  ('ค่าอินเทอร์เน็ต'),
  ('เงินเดือน'),
  ('การตลาด'),
  ('ค่าใช้จ่ายอื่นๆ');
