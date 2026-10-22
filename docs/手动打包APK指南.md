# 手动打包 APK 指南

日常给手机更新版本，只需要跑两条命令。本文档说明完整流程、每一步在做什么，以及出问题时怎么排查。

## 快速流程（日常用这个）

```bash
# 第 1 步：构建网页并同步到安卓工程（改了网页代码后必跑）
npm run cap:sync

# 第 2 步：编译出 APK
cd android
JAVA_HOME="D:/1Soft/jdk/jdk-21.0.12.1+1" ./gradlew assembleDebug --no-daemon
```

完成后安装包在这里：

```
android\app\build\outputs\apk\debug\app-debug.apk
```

传到手机覆盖安装即可（微信文件传输 / 数据线 / 网盘都行），**数据不会丢**。

> 如果只改了网页代码（src/ 下的东西），跑完上面两步就够了。
> 如果改了安卓工程（android/ 下的图标、配置）或重新生成了图标，跳过第 1 步直接跑第 2 步。

## 每一步在做什么

| 命令 | 干什么 | 产物 |
|---|---|---|
| `npm run cap:sync` | 先 `npm run build` 用 Vite 把 src/ 打包成静态文件，再把产物拷进安卓工程 | `dist/` → `android/app/src/main/assets/public/` |
| `gradlew assembleDebug` | Gradle 编译整个安卓工程（壳 + 网页资源 + 图标）并打包签名 | `app-debug.apk` |

`cap:sync` = `build + sync` 两步合一，定义在 package.json 的 scripts 里。

## 本机环境说明（已配置好，无需再动）

| 项目 | 位置/配置 |
|---|---|
| JDK 21 | `D:\1Soft\jdk\jdk-21.0.12.1+1`（构建时用 `JAVA_HOME` 指定） |
| Android SDK | `C:\Users\zy_luke\AppData\Local\Android\Sdk`（`android\local.properties` 指向它） |
| Gradle 分发包 | 走腾讯镜像（`android/gradle/wrapper/gradle-wrapper.properties`） |
| 依赖仓库 | 走阿里云镜像（`android/build.gradle`），官方源兜底 |

> 注意：不要用 Android Studio 自带的 Java（JBR 25）跑构建，它和本项目用的 Gradle 8.14.3 不兼容，命令行里的 `JAVA_HOME` 参数就是为此存在的。

## 安装到手机

- **方式一**：APK 传到手机文件管理器里，点击安装（首次需允许"安装未知来源应用"）
- **方式二**：手机开 USB 调试连电脑，执行 `adb install -r app-debug.apk`（`-r` 表示覆盖安装、保留数据）

## 想改版本号（可选）

编辑 `android/app/build.gradle`：

```gradle
versionCode 2        // 整数，每次发新包 +1
versionName "1.0.1"  // 显示用的版本号
```

不升版本号也能覆盖安装，个人使用可改可不改。

## 用 Android Studio 界面打包（可选）

1. 项目目录执行 `npx cap open android`
2. **重要**：Settings → Build, Execution, Deployment → Build Tools → Gradle → **Gradle JVM** 选 `D:\1Soft\jdk\jdk-21.0.12.1+1`（否则同步会报 Java 版本错误）
3. 菜单 Build → Build App Bundle(s) / APK(s) → Build APK(s)

## 常见问题排查

| 现象 | 原因 / 处理 |
|---|---|
| `JAVA_HOME is not set or invalid` | 检查命令里路径拼写（bash 里用正斜杠 `/`） |
| `Unsupported class file major version` | 用了错误的 Java（版本过高），确认 JAVA_HOME 指向 JDK 21 |
| 下载依赖卡住 | 检查 `gradle-wrapper.properties` 和 `build.gradle` 里的镜像配置是否还在 |
| 手机安装提示"签名不一致" | 手机上装过别的签名的包，需先卸载旧版（**卸载会丢数据，先导出备份！**） |
| 打出的包还是旧界面 | 忘了跑 `npm run cap:sync`，网页产物没更新进工程 |
| 想换应用图标 | 改 `scripts/gen-icons.mjs` 里的颜色/图形 → `npm run gen:icons` → 重新打包 |

## 环境从零重建（换电脑时）

1. 安装 Node.js（≥20）后，项目目录 `npm install`
2. 装 JDK 21（清华 Adoptium 镜像的 zip 解压版即可），记下路径
3. 安装 Android SDK 组件：`platforms;android-36`、`build-tools;36.0.0`、`platform-tools`， licenses 文件放好
4. 写 `android/local.properties`：`sdk.dir=<SDK 绝对路径>`（Windows 路径冒号要转义 `\:`）
5. 跑快速流程第 2 步验证
