// 无依赖图标生成器：纯 Node(zlib) 写 PNG
// 1) PWA 图标 → public/（pwa-192/512、maskable、apple-touch-icon）
// 2) Android 启动图标与启动屏 → android/app/src/main/res/（存在 android/ 时）
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const androidRes = join(root, 'android', 'app', 'src', 'main', 'res')
mkdirSync(publicDir, { recursive: true })

// ---------- PNG 编码 ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}

function encodePng(w, h, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  const stride = w * 4
  const raw = Buffer.alloc((stride + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    for (let x = 0; x < stride; x++) raw[y * (stride + 1) + 1 + x] = rgba[y * stride + x]
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

// ---------- 绘制（64x64 设计坐标，3x3 超采样抗锯齿） ----------
const BG = { top: [247, 124, 109], bottom: [232, 82, 78] } // 暖红渐变
const WHITE = [255, 255, 255]
const FLAME = [255, 214, 98]

function inRoundRect(x, y, x0, y0, w, h, r) {
  if (x < x0 || y < y0 || x > x0 + w || y > y0 + h) return false
  const dx = Math.max(x0 + r - x, x - (x0 + w - r), 0)
  const dy = Math.max(y0 + r - y, y - (y0 + h - r), 0)
  return dx * dx + dy * dy <= r * r
}

function inCircle(x, y, cx, cy, r) {
  const dx = x - cx
  const dy = y - cy
  return dx * dx + dy * dy <= r * r
}

// 蛋糕图形：两层蛋糕 + 蜡烛 + 火苗
function shapeAt(x, y) {
  if (inRoundRect(x, y, 15, 37, 34, 12, 3)) return WHITE // 底层
  if (inRoundRect(x, y, 20, 26, 24, 11, 3)) return WHITE // 上层
  if (inRoundRect(x, y, 30.6, 15, 2.8, 11, 1.2)) return WHITE // 蜡烛
  if (inCircle(x, y, 32, 11, 3.4)) return FLAME // 火苗
  return null
}

/**
 * 渲染图标/启动屏
 * mask: 'square' 渐变铺满 | 'circle' 渐变裁圆(透明四角) | 'none' 透明底只画图形
 * designFrac: 64 单位设计区占 min(w,h) 的比例；contentScale: 内容在设计区内的缩放
 */
function render({ w, h = w, mask = 'square', designFrac = 1, contentScale = 1 }) {
  const rgba = new Uint8Array(w * h * 4)
  const SS = 3
  const side = Math.min(w, h) * designFrac
  const toShape = (px, py) => {
    let x = 32 + (px - w / 2) / side * 64
    let y = 32 + (py - h / 2) / side * 64
    if (contentScale !== 1) {
      x = 32 + (x - 32) / contentScale
      y = 32 + (y - 32) / contentScale
    }
    return [x, y]
  }
  const inMask = (px, py) => {
    if (mask === 'square') return true
    if (mask === 'circle') {
      const dx = px - w / 2
      const dy = py - h / 2
      const r = Math.min(w, h) / 2
      return dx * dx + dy * dy <= r * r
    }
    return false
  }
  for (let py = 0; py < h; py++) {
    const t = py / (h - 1)
    const bg = [
      Math.round(BG.top[0] + (BG.bottom[0] - BG.top[0]) * t),
      Math.round(BG.top[1] + (BG.bottom[1] - BG.top[1]) * t),
      Math.round(BG.top[2] + (BG.bottom[2] - BG.top[2]) * t)
    ]
    for (let px = 0; px < w; px++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const spx = px + (sx + 0.5) / SS - 0.5
          const spy = py + (sy + 0.5) / SS - 0.5
          const inside = inMask(spx, spy)
          const [dx, dy] = toShape(spx, spy)
          const c = shapeAt(dx, dy)
          if (c) {
            r += c[0]
            g += c[1]
            b += c[2]
            a += 255
          } else if (inside) {
            r += bg[0]
            g += bg[1]
            b += bg[2]
            a += 255
          }
        }
      }
      const n = SS * SS
      const i = (py * w + px) * 4
      if (a > 0) {
        rgba[i] = Math.round(r / a * 255)
        rgba[i + 1] = Math.round(g / a * 255)
        rgba[i + 2] = Math.round(b / a * 255)
        rgba[i + 3] = Math.round(a / n)
      }
    }
  }
  return encodePng(w, h, rgba)
}

// ---------- 1) PWA 图标 ----------
// maskable 图标内容需位于中心安全区（半径 40%），内容整体缩放到 85%
const webOutputs = [
  ['pwa-192.png', { w: 192 }],
  ['pwa-512.png', { w: 512 }],
  ['pwa-maskable-512.png', { w: 512, contentScale: 0.85 }],
  ['apple-touch-icon.png', { w: 180 }]
]
for (const [name, opts] of webOutputs) {
  writeFileSync(join(publicDir, name), render(opts))
  console.log(`已生成 public/${name} (${opts.w}x${opts.w})`)
}

// ---------- 2) Android 启动图标 + 启动屏（需先 npx cap add android） ----------
if (existsSync(androidRes)) {
  // 启动图标密度：mdpi 48 / hdpi 72 / xhdpi 96 / xxhdpi 144 / xxxhdpi 192
  const densities = [
    ['mdpi', 48],
    ['hdpi', 72],
    ['xhdpi', 96],
    ['xxhdpi', 144],
    ['xxxhdpi', 192]
  ]
  for (const [dpi, size] of densities) {
    const dir = join(androidRes, `mipmap-${dpi}`)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'ic_launcher.png'), render({ w: size }))
    writeFileSync(join(dir, 'ic_launcher_round.png'), render({ w: size, mask: 'circle' }))
    // 自适应图标前景：108dp 画布，内容需在中心 66dp 安全区内，缩放到 72%
    writeFileSync(
      join(dir, 'ic_launcher_foreground.png'),
      render({ w: size * 2.25, mask: 'none', contentScale: 0.72 })
    )
    console.log(`已生成 android mipmap-${dpi} 启动图标`)
  }

  // 启动屏：按现有 splash 文件的尺寸逐个重绘（渐变底 + 居中蛋糕）
  for (const entry of readdirSync(androidRes)) {
    if (!entry.startsWith('drawable')) continue
    const dir = join(androidRes, entry)
    if (!statSync(dir).isDirectory()) continue
    const splash = join(dir, 'splash.png')
    if (!existsSync(splash)) continue
    const buf = readFileSync(splash)
    const w = buf.readUInt32BE(16)
    const h = buf.readUInt32BE(20)
    writeFileSync(splash, render({ w, h, designFrac: 0.32 }))
    console.log(`已生成 android ${entry}/splash.png (${w}x${h})`)
  }

  // 自适应图标背景色与渐变主色一致
  writeFileSync(
    join(androidRes, 'values', 'ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#EE6A63</color>\n</resources>\n`
  )
  console.log('已更新自适应图标背景色 #EE6A63')
} else {
  console.log('未发现 android/ 目录，跳过安卓图标生成（先运行 npx cap add android）')
}
