# 生日提醒 (motheRemind)

记录朋友生日的手机 App（PWA），支持公历和农历（含闰月），数据保存在手机本地。

## 功能

- 记录朋友的生日：公历 / 农历（含闰月，如"闰四月初三"）
- 可选记录出生年份（1960 年起），列表显示"今年满 N 岁"
- 日历视图：按月浏览，每天显示农历，生日当天标红，底部列出本月生日
- 列表按"距离下次生日"倒计时排序，今天过生日的会高亮
- 农历生日自动换算成今年对应的公历日期并显示
- 数据保存在浏览器本地存储（localStorage），不上传服务器
- 导出 / 导入 JSON 备份文件（换手机、换域名时用）

## 常用命令

```bash
npm install        # 安装依赖（首次）
npm run dev        # 开发模式（局域网可访问，用于手机测试）
npm run build      # 类型检查 + 打包到 dist/
npm run preview    # 预览打包结果
npm run gen:icons  # 重新生成 PWA 图标
```

## 安装到手机

### iPhone

1. 电脑运行 `npm run dev`，终端会显示局域网地址（如 `http://192.168.1.5:5173`）
2. 手机（同一 Wi-Fi）用 Safari 打开该地址
3. 点「分享」→「添加到主屏幕」，之后从主屏幕图标打开即是全屏 App

### Android：打包成 APK 安装

项目已集成 Capacitor（配置见 `capacitor.config.ts`，安卓工程在 `android/` 目录），
网页代码会被完整打包进 APK，**完全离线可用、不依赖任何网站**。

一次性准备（仅需首次）：

1. 安装 [Android Studio](https://developer.android.com/studio)（自带 JDK 和 Android SDK）

打包步骤：

```bash
npm run cap:sync        # 构建网页 + 同步到安卓工程（改完代码后每次都要跑）
npx cap open android    # 用 Android Studio 打开安卓工程
```

然后在 Android Studio 菜单：**Build → Build App Bundle(s) / APK(s) → Build APK(s)**，

生成的安装包在：`android/app/build/outputs/apk/debug/app-debug.apk`，

传到手机上直接安装（首次需允许"安装未知来源应用"）。

**不用 Android Studio 的命令行打包**（本机已配置好 JDK 21 + SDK + 镜像）：

```bash
cd android && JAVA_HOME="D:/1Soft/jdk/jdk-21.0.12.1+1" ./gradlew assembleDebug --no-daemon
```

> 完整步骤、常见问题排查、换电脑重建环境，见 [docs/手动打包APK指南.md](docs/手动打包APK指南.md)

> 说明：debug 包用调试签名，个人使用足够；以后改了网页代码，
> 重新 `npm run cap:sync` 再 Build 一次即可覆盖升级（数据保留）。

### Android：不打包，直接当 PWA 用（替代方案）

Chrome 要求 HTTPS 才出现"安装应用"提示，两种方式任选：

- **推荐**：把 `npm run build` 产出的 `dist/` 部署到任意免费静态托管
  （Vercel / Cloudflare Pages / GitHub Pages 等），手机用 HTTPS 地址访问后安装
- 或在 Chrome 地址栏输入 `chrome://flags/#unsafely-treat-insecure-origin-as-secure`，
  填入局域网地址后重启浏览器，再访问

> 注意：PWA 方式的数据按"域名"保存在本地，换了域名需要用「导出→导入」迁移；
> APK 方式不存在这个问题（数据跟着 App 走）。

## 农历说明

- 闰月生日：当年有对应闰月就过闰月，没有就按普通月过（如"闰四月初三"，无闰四月的年份按四月初三）
- 农历三十出生、当年是小月（29 天）时，按当月最后一天（廿九）计算

## 技术栈

Vue 3 + TypeScript + Vant 4 + lunar-typescript（农历换算）+ vite-plugin-pwa
