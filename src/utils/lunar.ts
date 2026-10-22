import { Lunar, LunarMonth, LunarYear } from 'lunar-typescript'
import type { Birthday } from '../types'

export const LUNAR_MONTHS = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月'
]

export const LUNAR_DAYS = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
]

export function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/**
 * 下一个生日（含今天）对应的公历日期。
 * 农历闰月生日：当年有同名闰月则过闰月，否则按普通月计算（通用习惯）；
 * 农历三十在小月（29天）时回退到当月最后一天。
 */
/**
 * 某条生日在指定公历年份的"发生日期"；当年不过这个生日（如平年的2月29日）返回 null。
 * 农历规则同 nextOccurrence：当年有同名闰月则过闰月，否则按普通月；三十遇小月回退。
 */
export function solarDateInYear(b: Birthday, year: number): Date | null {
  if (b.type === 'solar') {
    const d = new Date(year, b.month - 1, b.day)
    // 2月29日在平年会顺延到3月1日，日历上不算当年生日
    return d.getDate() === b.day && d.getMonth() === b.month - 1 ? d : null
  }
  const leapMonth = LunarYear.fromYear(year).getLeapMonth()
  const m = b.leap && leapMonth === b.month ? -b.month : b.month
  const lm = LunarMonth.fromYm(year, m)
  if (!lm) return null
  const day = Math.min(b.day, lm.getDayCount())
  const s = Lunar.fromYmd(year, m, day).getSolar()
  return new Date(s.getYear(), s.getMonth() - 1, s.getDay())
}

export function nextOccurrence(b: Birthday, today = startOfToday()): Date {
  if (b.type === 'solar') {
    const y = today.getFullYear()
    const candidate = new Date(y, b.month - 1, b.day)
    return candidate >= today ? candidate : new Date(y + 1, b.month - 1, b.day)
  }
  const y0 = today.getFullYear()
  for (let y = y0; y <= y0 + 2; y++) {
    const date = solarDateInYear(b, y)
    if (date && date >= today) return date
  }
  return today // 理论上不可达
}

export function daysUntil(date: Date, today = startOfToday()): number {
  return Math.round((date.getTime() - today.getTime()) / 86400000)
}

/** "公历 4月3日" / "农历闰四月初三" */
export function formatBirthdayText(b: Pick<Birthday, 'type' | 'month' | 'day' | 'leap'>): string {
  if (b.type === 'solar') return `公历 ${b.month}月${b.day}日`
  return `农历${b.leap ? '闰' : ''}${LUNAR_MONTHS[b.month - 1]}${LUNAR_DAYS[b.day - 1]}`
}

/** Date → "5月19日" */
export function formatDateText(d: Date): string {
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
