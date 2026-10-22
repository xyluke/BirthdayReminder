export type CalendarType = 'solar' | 'lunar'

export interface Birthday {
  id: string
  name: string
  note: string
  type: CalendarType
  /** 出生年份（可选，1960 起，用于显示年龄） */
  year?: number
  /** 月份 1-12 */
  month: number
  /** 公历 1-31 / 农历 1-30 */
  day: number
  /** 仅农历：是否闰月 */
  leap: boolean
  createdAt: number
}

/** 列表展示用的记录（附带下次生日日期与倒计时天数） */
export interface BirthdayWithMeta extends Birthday {
  nextDate: Date
  /** 距下次生日天数，0 = 今天 */
  days: number
}

export interface BackupFile {
  app: string
  version: number
  exportedAt: string
  records: Birthday[]
}
