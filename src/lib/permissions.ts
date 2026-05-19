import type { UserRole } from '@/types'

// Role hierarchy: admin > co_admin > owner/staff
const WRITE_ROLES: UserRole[] = ['admin', 'co_admin', 'staff']
const ADMIN_ROLES: UserRole[] = ['admin', 'co_admin']
const SETTINGS_ROLES: UserRole[] = ['admin', 'co_admin']

export function canWrite(role: UserRole): boolean {
  return WRITE_ROLES.includes(role)
}

export function canDelete(role: UserRole, createdBy: string, currentUserId: string): boolean {
  if (role === 'admin' || role === 'co_admin') return true
  if (role === 'staff') return createdBy === currentUserId
  return false
}

export function canEdit(role: UserRole, createdBy: string, currentUserId: string): boolean {
  if (role === 'admin' || role === 'co_admin') return true
  if (role === 'staff') return createdBy === currentUserId
  return false
}

export function canAccessSettings(role: UserRole): boolean {
  return SETTINGS_ROLES.includes(role)
}

export function canAccessSalary(role: UserRole): boolean {
  return role === 'admin'
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'admin'
}

export function isAdminOrCoAdmin(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role)
}

export function getRoleBadgeClass(role: UserRole): string {
  const map: Record<UserRole, string> = {
    admin: 'badge-admin',
    co_admin: 'badge-co-admin',
    owner: 'badge-owner',
    staff: 'badge-staff',
  }
  return `badge ${map[role]}`
}

export function getRoleLabel(role: UserRole): string {
  const map: Record<UserRole, string> = {
    admin: 'Admin',
    co_admin: 'Co-Admin',
    owner: 'เจ้าของ',
    staff: 'พนักงาน',
  }
  return map[role]
}
