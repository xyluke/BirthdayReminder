import { computed, ref } from 'vue'
import type { Birthday, BirthdayWithMeta } from '../types'
import { loadBirthdays, normalizeBirthdayData, saveBirthdays, uuid } from '../utils/storage'
import { daysUntil, nextOccurrence, startOfToday } from '../utils/lunar'

const birthdays = ref<Birthday[]>(loadBirthdays())

function persist(): void {
  saveBirthdays(birthdays.value)
}

export function useBirthdays() {
  /** 按下次生日倒计时升序（同天按添加先后） */
  const sorted = computed<BirthdayWithMeta[]>(() => {
    const today = startOfToday()
    return birthdays.value
      .map((b) => {
        const nextDate = nextOccurrence(b, today)
        return { ...b, nextDate, days: daysUntil(nextDate, today) }
      })
      .sort((a, b) => a.days - b.days || a.createdAt - b.createdAt)
  })

  function add(data: Omit<Birthday, 'id' | 'createdAt'>): void {
    birthdays.value.unshift({ ...normalizeBirthdayData(data), id: uuid(), createdAt: Date.now() })
    persist()
  }

  function update(record: Birthday): void {
    const i = birthdays.value.findIndex((b) => b.id === record.id)
    if (i !== -1) {
      birthdays.value[i] = { ...normalizeBirthdayData(record), id: record.id, createdAt: record.createdAt }
    }
    persist()
  }

  function remove(id: string): void {
    birthdays.value = birthdays.value.filter((b) => b.id !== id)
    persist()
  }

  function replaceAll(records: Birthday[]): void {
    birthdays.value = records
    persist()
  }

  return { birthdays, sorted, add, update, remove, replaceAll }
}
