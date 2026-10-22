import type { Birthday } from '../types'

const KEY = 'birthday-reminder/v1'

/** crypto.randomUUID 仅在安全上下文可用（局域网 HTTP 下不存在），提供回退 */
export function uuid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function isValidBirthday(v: unknown): v is Birthday {
  if (!v || typeof v !== 'object') return false
  const b = v as Record<string, unknown>
  return (
    typeof b.id === 'string' &&
    typeof b.name === 'string' &&
    (b.type === 'solar' || b.type === 'lunar') &&
    (b.year === undefined || (typeof b.year === 'number' && b.year >= 1960 && b.year <= 2100)) &&
    typeof b.month === 'number' && b.month >= 1 && b.month <= 12 &&
    typeof b.day === 'number' && b.day >= 1 && b.day <= (b.type === 'lunar' ? 30 : 31) &&
    typeof b.leap === 'boolean' &&
    typeof b.createdAt === 'number'
  )
}

/** 写入前的兜底校正：年份钳到 1960 起、月份钳到 1-12、日期钳到合法范围，防止任何坏数据入库 */
export function normalizeBirthdayData(
  data: Omit<Birthday, 'id' | 'createdAt'>
): Omit<Birthday, 'id' | 'createdAt'> {
  const type = data.type === 'lunar' ? 'lunar' : 'solar'
  const yearNum = Math.round(Number(data.year))
  const year = Number.isFinite(yearNum) && yearNum >= 1960 && yearNum <= 2100 ? yearNum : undefined
  const month = Math.min(12, Math.max(1, Math.round(Number(data.month) || 1)))
  const maxDay = type === 'lunar' ? 30 : 31
  const day = Math.min(maxDay, Math.max(1, Math.round(Number(data.day) || 1)))
  return {
    name: String(data.name ?? '').trim(),
    note: String(data.note ?? '').trim(),
    type,
    year,
    month,
    day,
    leap: type === 'lunar' && data.leap === true
  }
}

export function loadBirthdays(): Birthday[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data
      .filter(isValidBirthday)
      .map((b) => ({ ...b, note: typeof b.note === 'string' ? b.note : '' }))
  } catch {
    return []
  }
}

export function saveBirthdays(list: Birthday[]): void {
  localStorage.setItem(KEY, JSON.stringify(list))
}
