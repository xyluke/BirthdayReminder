<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import type { PickerOption } from 'vant'
import type { Birthday, CalendarType } from '../types'
import { LUNAR_DAYS, LUNAR_MONTHS } from '../utils/lunar'

const props = defineProps<{ show: boolean; editing: Birthday | null }>()
const emit = defineEmits<{
  'update:show': [value: boolean]
  save: [data: Omit<Birthday, 'id' | 'createdAt'>]
  del: [id: string]
}>()

const MIN_DATE = new Date(1960, 0, 1)
const MAX_DATE = new Date() // 出生日期不能是未来

const name = ref('')
const note = ref('')
const type = ref<CalendarType>('solar')
const leap = ref(false)
/** 是否记录出生年份（用于显示年龄） */
const withYear = ref(true)
// 选择器 v-model 为补零字符串数组；含年份时为 3 个元素 ['1990', '01', '01']，否则 2 个
const solarSelection = ref<string[]>(['1990', '01', '01'])
const lunarSelection = ref<string[]>(['1990', '正月', '初一'])

const YEAR_MIN = 1960
const YEAR_MAX = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => {
  const y = String(YEAR_MIN + i)
  return { text: y, value: y }
})

// Vant 4.10 的 Picker 不支持纯字符串列，必须传 { text, value } 对象
const lunarColumns = computed<PickerOption[][]>(() => {
  const cols: PickerOption[][] = []
  if (withYear.value) cols.push(YEAR_OPTIONS)
  cols.push(
    LUNAR_MONTHS.map((m) => ({ text: m, value: m })),
    LUNAR_DAYS.map((d) => ({ text: d, value: d }))
  )
  return cols
})
const pad = (n: number) => String(n).padStart(2, '0')

// 切换"记录年份"时，给选择器的值数组加上/去掉开头的年份元素
let lastSolarYear = '1990'
let lastLunarYear = '1990'
watch(withYear, (v) => {
  const sv = solarSelection.value
  if (v && sv.length === 2) solarSelection.value = [lastSolarYear, ...sv]
  if (!v && sv.length === 3) {
    lastSolarYear = sv[0]
    solarSelection.value = sv.slice(1)
  }
  const lv = lunarSelection.value
  if (v && lv.length === 2) lunarSelection.value = [lastLunarYear, ...lv]
  if (!v && lv.length === 3) {
    lastLunarYear = lv[0]
    lunarSelection.value = lv.slice(1)
  }
})

const show = computed({
  get: () => props.show,
  set: (v: boolean) => emit('update:show', v)
})

watch(
  () => props.show,
  (v) => {
    if (!v) return
    const e = props.editing
    if (e) {
      name.value = e.name
      note.value = e.note
      type.value = e.type
      leap.value = e.leap
      withYear.value = e.year != null
      const yearPart = e.year != null ? [String(e.year)] : []
      if (e.type === 'solar') {
        solarSelection.value = [...yearPart, pad(e.month), pad(e.day)]
      } else {
        lunarSelection.value = [...yearPart, LUNAR_MONTHS[e.month - 1], LUNAR_DAYS[e.day - 1]]
      }
    } else {
      name.value = ''
      note.value = ''
      type.value = 'solar'
      leap.value = false
      withYear.value = true
      solarSelection.value = ['1990', '01', '01']
      lunarSelection.value = ['1990', '正月', '初一']
    }
  }
)

function onSave(): void {
  const n = name.value.trim()
  if (!n) {
    showToast('请填写姓名')
    return
  }
  const isSolar = type.value === 'solar'
  // 值数组可能含年份（3 元素）或不含（2 元素），月/日恒取最后两位
  const sv = solarSelection.value
  const lv = lunarSelection.value
  emit('save', {
    name: n,
    note: note.value.trim(),
    type: type.value,
    year: withYear.value ? Number(isSolar ? sv[0] : lv[0]) : undefined,
    month: isSolar
      ? Number(sv[sv.length - 2])
      : LUNAR_MONTHS.indexOf(lv[lv.length - 2]) + 1,
    day: isSolar
      ? Number(sv[sv.length - 1])
      : LUNAR_DAYS.indexOf(lv[lv.length - 1]) + 1,
    leap: isSolar ? false : leap.value
  })
}

async function onDelete(): Promise<void> {
  if (!props.editing) return
  try {
    await showConfirmDialog({
      title: '删除生日',
      message: `确定删除「${props.editing.name}」吗？`
    })
  } catch {
    return
  }
  emit('del', props.editing.id)
  show.value = false
}
</script>

<template>
  <van-popup v-model:show="show" position="bottom" round class="form-popup">
    <div class="form-title">{{ editing ? '编辑生日' : '添加生日' }}</div>

    <van-cell-group inset>
      <van-field v-model="name" label="姓名" placeholder="朋友的名字" maxlength="20" required />
      <van-field v-model="note" label="备注" placeholder="同学 / 同事…（可选）" maxlength="30" />
      <van-field label="日历类型">
        <template #input>
          <van-radio-group v-model="type" direction="horizontal">
            <van-radio name="solar">公历</van-radio>
            <van-radio name="lunar">农历</van-radio>
          </van-radio-group>
        </template>
      </van-field>
    </van-cell-group>

    <van-cell-group inset>
      <van-cell center title="记录出生年份">
        <template #value>
          <van-switch v-model="withYear" size="22" />
        </template>
      </van-cell>
      <div class="leap-tip">关掉后只记月日；开启后列表会显示“今年满几岁”</div>
    </van-cell-group>

    <div v-if="type === 'solar'" class="picker-box">
      <!-- 注意：Vant 4.10 的属性名是 columns-type（复数、数组），column-type 无效 -->
      <van-date-picker
        v-model="solarSelection"
        :columns-type="withYear ? ['year', 'month', 'day'] : ['month', 'day']"
        :min-date="MIN_DATE"
        :max-date="MAX_DATE"
        :show-toolbar="false"
      />
    </div>
    <template v-else>
      <div class="picker-box">
        <van-picker v-model="lunarSelection" :columns="lunarColumns" :show-toolbar="false" />
      </div>
      <van-cell-group inset>
        <van-cell center title="生日在闰月">
          <template #value>
            <van-switch v-model="leap" size="22" />
          </template>
        </van-cell>
        <div class="leap-tip">没有对应闰月的年份，按普通月计算</div>
      </van-cell-group>
    </template>

    <div class="btn-row">
      <van-button block round @click="show = false">取消</van-button>
      <van-button block round type="primary" color="linear-gradient(135deg, #f4796b, #e6534f)" @click="onSave">
        保存
      </van-button>
    </div>
    <div v-if="editing" class="del-row">
      <van-button block plain type="danger" round size="small" @click="onDelete">删除该生日</van-button>
    </div>
  </van-popup>
</template>

<style scoped>
.form-popup {
  max-height: 88%;
  padding-bottom: env(safe-area-inset-bottom);
  overflow-y: auto;
}
.form-title {
  padding: 18px 0 8px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}
.picker-box {
  margin: 8px 0;
}
.leap-tip {
  padding: 6px 40px 10px;
  font-size: 12px;
  color: #c8c9cc;
}
.btn-row {
  display: flex;
  gap: 12px;
  padding: 12px 24px 0;
}
.del-row {
  padding: 12px 24px 16px;
}
</style>
