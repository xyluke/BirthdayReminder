<script setup lang="ts">
import { computed, ref } from 'vue'
import { Solar } from 'lunar-typescript'
import type { Birthday } from '../types'
import { formatBirthdayText, solarDateInYear } from '../utils/lunar'
import { useBirthdays } from '../composables/useBirthdays'

const emit = defineEmits<{ edit: [b: Birthday] }>()

const { sorted } = useBirthdays()

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth() + 1) // 1-12

const weekHeaders = ['日', '一', '二', '三', '四', '五', '六']

const monthTitle = computed(() => `${viewYear.value}年${viewMonth.value}月`)
const daysInMonth = computed(() => new Date(viewYear.value, viewMonth.value, 0).getDate())
const firstWeekday = computed(() => new Date(viewYear.value, viewMonth.value - 1, 1).getDay())

interface DayCell {
  day: number
  lunarText: string
  isToday: boolean
  hasBirthday: boolean
}

/** 本月生日（按查看年份换算后的日期落在本月的记录），按日期排序 */
const monthBirthdays = computed(() => {
  const list: { day: number; b: Birthday }[] = []
  for (const b of sorted.value) {
    const occ = solarDateInYear(b, viewYear.value)
    if (occ && occ.getMonth() + 1 === viewMonth.value) {
      list.push({ day: occ.getDate(), b })
    }
  }
  return list.sort((x, y) => x.day - y.day)
})

const birthdayDays = computed(() => new Set(monthBirthdays.value.map((x) => x.day)))

const cells = computed<DayCell[]>(() => {
  const cells: DayCell[] = []
  const isThisMonth =
    viewYear.value === today.getFullYear() && viewMonth.value === today.getMonth() + 1
  for (let d = 1; d <= daysInMonth.value; d++) {
    const lunar = Solar.fromYmd(viewYear.value, viewMonth.value, d).getLunar()
    // 初一那天显示农历月名（如"九月"），其余显示农历日（如"十五"）
    const lunarText = lunar.getDayInChinese() === '初一' ? lunar.getMonthInChinese() : lunar.getDayInChinese()
    cells.push({
      day: d,
      lunarText,
      isToday: isThisMonth && d === today.getDate(),
      hasBirthday: birthdayDays.value.has(d)
    })
  }
  return cells
})

function shiftMonth(delta: number): void {
  let y = viewYear.value
  let m = viewMonth.value + delta
  if (m < 1) { m = 12; y-- }
  if (m > 12) { m = 1; y++ }
  viewYear.value = y
  viewMonth.value = m
}

function backToToday(): void {
  viewYear.value = today.getFullYear()
  viewMonth.value = today.getMonth() + 1
}
</script>

<template>
  <div class="calendar">
    <div class="cal-toolbar">
      <van-icon name="arrow-left" size="18" class="cal-arrow" @click="shiftMonth(-1)" />
      <span class="cal-title">{{ monthTitle }}</span>
      <van-icon name="arrow" size="18" class="cal-arrow" @click="shiftMonth(1)" />
      <span class="cal-today-btn" @click="backToToday">回到今天</span>
    </div>

    <div class="cal-card">
      <div class="cal-grid">
        <div v-for="h in weekHeaders" :key="h" class="cal-week">{{ h }}</div>
        <div v-for="i in firstWeekday" :key="'blank' + i" class="cal-cell" />
        <div
          v-for="c in cells"
          :key="c.day"
          class="cal-cell"
          :class="{ today: c.isToday, 'has-birthday': c.hasBirthday }"
        >
          <div class="cal-day">{{ c.day }}</div>
          <div class="cal-lunar">{{ c.lunarText }}</div>
        </div>
      </div>
    </div>

    <div class="cal-list">
      <div class="cal-list-title">本月生日</div>
      <template v-if="monthBirthdays.length > 0">
        <van-cell
          v-for="item in monthBirthdays"
          :key="item.b.id"
          class="cal-item"
          :border="false"
          is-link
          @click="emit('edit', item.b)"
        >
          <template #title>
            <span class="cal-item-name">{{ item.b.name }}</span>
            <span class="cal-item-date">{{ item.day }}日</span>
          </template>
          <template #label>
            {{ formatBirthdayText(item.b) }}<template v-if="item.b.year != null"> · 今年满 {{ viewYear - item.b.year }} 岁</template>
          </template>
        </van-cell>
      </template>
      <div v-else class="cal-empty">本月没有生日</div>
    </div>
  </div>
</template>

<style scoped>
.calendar {
  padding: 4px 0 96px;
}
.cal-toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 16px;
}
.cal-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}
.cal-arrow {
  color: #646566;
  padding: 4px;
  cursor: pointer;
}
.cal-today-btn {
  margin-left: auto;
  font-size: 12px;
  color: #ee6a63;
  border: 1px solid #ee6a63;
  border-radius: 999px;
  padding: 2px 10px;
  cursor: pointer;
}
.cal-card {
  margin: 0 12px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(100, 101, 102, 0.08);
  overflow: hidden;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 6px 0 10px;
}
.cal-week {
  text-align: center;
  font-size: 12px;
  color: #969799;
  padding: 6px 0;
}
.cal-cell {
  min-height: 46px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
}
.cal-day {
  font-size: 16px;
  color: #323233;
  line-height: 22px;
  width: 22px;
  height: 22px;
  text-align: center;
  border-radius: 50%;
}
.cal-lunar {
  font-size: 10px;
  color: #c8c9cc;
  line-height: 1.2;
}
.cal-cell.today .cal-day {
  background: #ee6a63;
  color: #fff;
  font-weight: 600;
}
.cal-cell.has-birthday {
  background: #fff5f4;
}
.cal-cell.has-birthday .cal-day {
  color: #ee6a63;
  font-weight: 700;
}
.cal-cell.has-birthday .cal-lunar {
  color: #ee6a63;
}
.cal-list {
  margin: 12px 12px 0;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(100, 101, 102, 0.08);
  padding: 12px 0 6px;
}
.cal-list-title {
  padding: 0 16px 6px;
  font-size: 13px;
  font-weight: 600;
  color: #646566;
}
.cal-item-name {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  margin-right: 8px;
}
.cal-item-date {
  font-size: 13px;
  color: #ee6a63;
  font-weight: 600;
}
.cal-empty {
  padding: 8px 16px 12px;
  font-size: 13px;
  color: #c8c9cc;
  text-align: center;
}
</style>
