import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Profile, UserRole } from '@/types'

// ========== Predefined Users ==========
export const USERS: Profile[] = [
  { id: '11111111-1111-1111-1111-111111111111', full_name: 'ฟิล์ม', role: 'admin', created_at: '', updated_at: '' },
  { id: '22222222-2222-2222-2222-222222222222', full_name: 'ฟ้า', role: 'co_admin', created_at: '', updated_at: '' },
  { id: '33333333-3333-3333-3333-333333333333', full_name: 'พี่กอล์ฟ', role: 'co_admin', created_at: '', updated_at: '' },
  { id: '44444444-4444-4444-4444-444444444444', full_name: 'พี่เอฟ', role: 'co_admin', created_at: '', updated_at: '' },
  { id: '55555555-5555-5555-5555-555555555555', full_name: 'แม่', role: 'owner', created_at: '', updated_at: '' },
]

const ADMIN_PIN = '1234' // เปลี่ยนได้ภายหลัง

export const useAuthStore = defineStore('auth', () => {
  const profile = ref<Profile | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!profile.value)
  const user = computed(() => profile.value ? { id: profile.value.id } : null)
  const role = computed<UserRole | null>(() => profile.value?.role || null)
  const isAdmin = computed(() => role.value === 'admin')
  const isCoAdmin = computed(() => role.value === 'co_admin')
  const isAdminOrCoAdmin = computed(() => role.value === 'admin' || role.value === 'co_admin')
  const isOwner = computed(() => role.value === 'owner')
  const isStaff = computed(() => role.value === 'staff')
  const displayName = computed(() => profile.value?.full_name || 'ผู้ใช้')

  function initialize() {
    loading.value = true
    try {
      const saved = localStorage.getItem('chalawan_user')
      if (saved) {
        const parsed = JSON.parse(saved)
        const found = USERS.find(u => u.id === parsed.id)
        if (found) profile.value = found
      }
    } catch {
      // ignore
    } finally {
      loading.value = false
    }
  }

  function signIn(userId: string, pin?: string): boolean {
    const found = USERS.find(u => u.id === userId)
    if (!found) throw new Error('ไม่พบผู้ใช้')

    // Admin ต้องกรอก PIN
    if (found.role === 'admin') {
      if (!pin || pin !== ADMIN_PIN) {
        throw new Error('รหัสผ่านไม่ถูกต้อง')
      }
    }

    profile.value = found
    localStorage.setItem('chalawan_user', JSON.stringify({ id: found.id }))
    return true
  }

  function signOut() {
    profile.value = null
    localStorage.removeItem('chalawan_user')
  }

  return {
    user,
    profile,
    loading,
    isAuthenticated,
    role,
    isAdmin,
    isCoAdmin,
    isAdminOrCoAdmin,
    isOwner,
    isStaff,
    displayName,
    initialize,
    signIn,
    signOut,
  }
})
