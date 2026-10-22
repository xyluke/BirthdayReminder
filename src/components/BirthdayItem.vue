<script setup lang="ts">
import { computed } from 'vue'
import type { BirthdayWithMeta } from '../types'
import { formatBirthdayText, formatDateText } from '../utils/lunar'

const props = defineProps<{ item: BirthdayWithMeta }>()

defineEmits<{ click: [] }>()

const subText = computed(() => {
  const base = formatBirthdayText(props.item)
  let t = props.item.type === 'lunar' ? `${base} · ${formatDateText(props.item.nextDate)}` : base
  if (props.item.year != null) t += ` · 今年满 ${new Date().getFullYear() - props.item.year} 岁`
  if (props.item.note) t += ` · ${props.item.note}`
  return t
})

const countdown = computed(() => {
  const d = props.item.days
  if (d === 0) return '今天'
  if (d === 1) return '明天'
  return `${d} 天`
})
</script>

<template>
  <van-cell class="item" :border="false" @click="$emit('click')">
    <template #title>
      <div class="name-row">
        <span class="name">{{ item.name }}</span>
        <van-tag plain :type="item.type === 'lunar' ? 'warning' : 'primary'">
          {{ item.type === 'lunar' ? '农历' : '公历' }}
        </van-tag>
        <van-tag v-if="item.leap" plain type="warning">闰月</van-tag>
      </div>
      <div class="sub">{{ subText }}</div>
    </template>
    <template #value>
      <span class="countdown" :class="{ today: item.days === 0, soon: item.days > 0 && item.days <= 7 }">
        {{ countdown }}
      </span>
    </template>
  </van-cell>
</template>

<style scoped>
.item {
  background: transparent;
  padding: 6px 4px;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}
.sub {
  margin-top: 4px;
  font-size: 12px;
  color: #969799;
}
.countdown {
  font-size: 14px;
  color: #969799;
}
.countdown.soon {
  color: #ff976a;
  font-weight: 600;
}
.countdown.today {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #f4796b, #e6534f);
  color: #fff;
  font-weight: 600;
}
</style>
