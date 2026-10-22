<script setup lang="ts">
import { ref } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import type { Birthday } from './types'
import { useBirthdays } from './composables/useBirthdays'
import { exportBirthdays, parseBackup } from './utils/backup'
import BirthdayItem from './components/BirthdayItem.vue'
import BirthdayForm from './components/BirthdayForm.vue'
import BirthdayCalendar from './components/BirthdayCalendar.vue'

const { birthdays, sorted, add, update, remove, replaceAll } = useBirthdays()

const activeTab = ref(0)

const showForm = ref(false)
const editing = ref<Birthday | null>(null)

function openAdd(): void {
  editing.value = null
  showForm.value = true
}

function openEdit(b: Birthday): void {
  editing.value = b
  showForm.value = true
}

function onSave(data: Omit<Birthday, 'id' | 'createdAt'>): void {
  if (editing.value) {
    update({ ...editing.value, ...data })
    showToast('已保存')
  } else {
    add(data)
    showToast('已添加')
  }
  showForm.value = false
}

async function onDelete(item: Birthday): Promise<void> {
  try {
    await showConfirmDialog({
      title: '删除生日',
      message: `确定删除「${item.name}」吗？`
    })
  } catch {
    return
  }
  remove(item.id)
  showToast('已删除')
}

// ---------- 导出 / 导入 ----------
const showActions = ref(false)
const actions = [{ name: '导出备份' }, { name: '导入恢复' }]
const fileInput = ref<HTMLInputElement | null>(null)

function onAction(_action: unknown, index: number): void {
  showActions.value = false
  if (index === 0) {
    if (birthdays.value.length === 0) {
      showToast('还没有数据可导出')
      return
    }
    exportBirthdays(birthdays.value)
  } else {
    fileInput.value?.click()
  }
}

async function onFileChange(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  let records: Birthday[]
  try {
    records = await parseBackup(file)
  } catch (err) {
    showToast(err instanceof Error ? err.message : '导入失败')
    return
  }
  try {
    await showConfirmDialog({
      title: '导入备份',
      message: `将导入 ${records.length} 条记录，覆盖现有 ${birthdays.value.length} 条，确定吗？`
    })
  } catch {
    return
  }
  replaceAll(records)
  showToast('导入成功')
}
</script>

<template>
  <div class="page">
    <van-nav-bar title="生日提醒" fixed placeholder>
      <template #right>
        <van-icon name="wap-nav" size="18" @click="showActions = true" />
      </template>
    </van-nav-bar>

    <van-tabs v-model:active="activeTab" class="page-tabs">
      <van-tab title="生日列表">
        <div class="list">
          <van-empty
            v-if="sorted.length === 0"
            image="search"
            description="还没有记录生日，点击右下角 + 添加"
          />
          <van-swipe-cell v-for="item in sorted" v-else :key="item.id" class="item-card">
            <BirthdayItem :item="item" @click="openEdit(item)" />
            <template #right>
              <van-button square type="danger" text="删除" class="delete-btn" @click="onDelete(item)" />
            </template>
          </van-swipe-cell>
        </div>
      </van-tab>
      <van-tab title="生日日历">
        <BirthdayCalendar @edit="openEdit" />
      </van-tab>
    </van-tabs>

    <div class="add-btn" @click="openAdd">
      <van-icon name="plus" size="24" />
    </div>

    <BirthdayForm v-model:show="showForm" :editing="editing" @save="onSave" @del="remove" />
    <van-action-sheet v-model:show="showActions" :actions="actions" cancel-text="取消" @select="onAction" />
    <input ref="fileInput" type="file" accept="application/json,.json" hidden @change="onFileChange" />
  </div>
</template>

<style>
body {
  margin: 0;
  background: #f7f8fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Segoe UI, Arial,
    Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft Yahei', sans-serif;
  -webkit-font-smoothing: antialiased;
}
</style>

<style scoped>
.list {
  padding: 12px 0 96px;
}
.item-card {
  display: block;
  margin: 0 12px 10px;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 1px 4px rgba(100, 101, 102, 0.08);
}
.delete-btn {
  height: 100%;
}
.add-btn {
  position: fixed;
  right: 20px;
  bottom: calc(24px + env(safe-area-inset-bottom));
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f4796b, #e6534f);
  color: #fff;
  box-shadow: 0 4px 12px rgba(230, 83, 79, 0.4);
  cursor: pointer;
}
.add-btn:active {
  transform: scale(0.95);
}
</style>
