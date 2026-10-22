import { createApp } from 'vue'
import { Capacitor } from '@capacitor/core'
import Vant from 'vant'
import 'vant/lib/index.css'
import App from './App.vue'
import { registerSW } from 'virtual:pwa-register'

// APK（Capacitor）内不注册 Service Worker：代码随 APK 更新，避免旧缓存导致升级后显示旧版本
// 局域网 HTTP（非安全上下文）下注册也会失败，一并忽略
if (!Capacitor.isNativePlatform()) {
  try {
    registerSW({ immediate: true })
  } catch {
    /* ignore */
  }
}

createApp(App).use(Vant).mount('#app')
