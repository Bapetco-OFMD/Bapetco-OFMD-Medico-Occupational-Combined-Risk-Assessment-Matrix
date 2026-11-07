import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigured = Boolean(url && key && !key.includes('PASTE_'))
export const supabase = supabaseConfigured
  ? createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null

export type RoleCode = 'worker' | 'site_safety_officer' | 'site_doctor' | 'review_doctor' | 'occupational_health_responsible' | 'system_owner'
export type RoleAssignment = { id: string; role_code: RoleCode; site_id: string | null; is_active: boolean }
export const roleNames: Record<RoleCode, { ar: string; en: string }> = {
  worker: { ar: 'العامل', en: 'Worker' },
  site_safety_officer: { ar: 'مسؤول السلامة بالموقع', en: 'Site Safety Officer' },
  site_doctor: { ar: 'طبيب الموقع', en: 'Site Doctor' },
  review_doctor: { ar: 'طبيب المراجعة', en: 'Review Doctor' },
  occupational_health_responsible: { ar: 'مسؤول الصحة المهنية العام', en: 'Occupational Health Lead' },
  system_owner: { ar: 'مالك النظام', en: 'System Owner' }
}
export const siteNames: Record<string, string> = {
  badr_3: 'بدر-3', alam_el_shawish: 'علم الشاويش', el_abyad: 'الأبيض', niyaj_1: 'نيّج-1'
}
