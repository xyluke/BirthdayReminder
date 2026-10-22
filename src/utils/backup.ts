import type { BackupFile, Birthday } from '../types'
import { isValidBirthday } from './storage'

/** 导出为 JSON 备份文件并触发下载 */
export function exportBirthdays(records: Birthday[]): void {
  const backup: BackupFile = {
    app: 'motheRemind',
    version: 1,
    exportedAt: new Date().toISOString(),
    records
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  a.download = `birthday-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** 解析备份文件，返回有效记录；文件无效时抛出带友好信息的错误 */
export async function parseBackup(file: File): Promise<Birthday[]> {
  let data: unknown
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error('文件不是有效的 JSON')
  }
  const records = (data as Partial<BackupFile>)?.records
  const valid = Array.isArray(records) ? records.filter(isValidBirthday) : []
  if (valid.length === 0) throw new Error('文件中没有有效的生日记录')
  return valid.map((b) => ({ ...b, note: typeof b.note === 'string' ? b.note : '' }))
}
