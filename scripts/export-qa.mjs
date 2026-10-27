/**
 * Export QA. Needs `npm run dev` on :5173 and Chrome installed.
 *   node scripts/export-qa.mjs            compare against qa/golden, fail on drift or layout problems
 *   node scripts/export-qa.mjs --update   rewrite qa/golden
 *   node scripts/export-qa.mjs two ruler  only cases whose name contains both words
 *
 * For every case it drives the real export code (react-pdf for PDFs, html-to-image for PNGs)
 * through the dev-only /dev/export-qa page, then checks:
 *  - PNG: exact size, no transparent pixels
 *  - PDF: every font embedded (pdffonts equivalent), page count, page size, footer and page number on every page
 *  - layout: no overlapping text, no clipped text, ruler ticks on band edges, stem ends at bar top,
 *    mini-ruler dots on the shared geometry
 */
import { chromium } from 'playwright-core'
import { PNG } from 'pngjs'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const BASE = process.env.QA_URL ?? 'http://localhost:5173'
const update = process.argv.includes('--update')
const filters = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
const OUT = 'qa/out'
const GOLDEN = 'qa/golden'
for (const dir of [OUT, GOLDEN]) fs.mkdirSync(dir, { recursive: true })

const CASES = []
for (const aspect of ['1:1', '4:5', '9:16']) {
  for (const fixture of ['two', 'eight', 'long', 'hidden', 'target', 'scale400']) {
    CASES.push({ kind: 'png', fixture, theme: 'social', aspect })
  }
}
CASES.push({ kind: 'png', fixture: 'noname', theme: 'social', aspect: '4:5' })
CASES.push({ kind: 'png', fixture: 'nobands', theme: 'social', aspect: '4:5' })
for (const paper of ['A4', 'LETTER']) {
  for (const fixture of ['two', 'eight', 'long', 'nobands', 'target', 'scale400', 'noname']) {
    CASES.push({ kind: 'pdf', fixture, theme: 'ruler', paper })
  }
  for (const fixture of ['two', 'eight', 'long']) {
    CASES.push({ kind: 'pdf', fixture, theme: 'formal', paper })
  }
}

const name = (c) => [c.theme, c.fixture, c.paper ?? c.aspect.replace(':', 'x')].join('-')
const selected = CASES.filter((c) => filters.every((f) => name(c).includes(f)))

const problems = []
const infos = new Set()
const totals = { ticks: 0, dots: 0, stems: 0, pdfTicks: 0 }
const tally = (checked) => {
  for (const key of ['ticks', 'dots', 'stems']) totals[key] += checked[key]
}
const note = (id, message) => problems.push(`${id}: ${message}`)

function checkPdfFonts(id, buffer) {
  // react-pdf writes objects uncompressed, so the font dictionaries are readable in the raw bytes.
  const text = buffer.toString('latin1')
  const fonts = [...text.matchAll(/\/BaseFont\s*\/([^\s/]+)/g)].map((m) => m[1])
  const unique = [...new Set(fonts)].filter((f) => !/\+/.test(f) || true)
  const descriptors = [...text.matchAll(/\/Type\s*\/FontDescriptor[\s\S]*?>>/g)].map((m) => m[0])
  const embedded = descriptors.filter((d) => /\/FontFile[23]?\b/.test(d)).length
  const report = unique.filter((f) => !/^[A-Z]{6}\+/.test(f))
  if (report.length) note(id, `fonts without a subset tag (substitute or standard 14): ${report.join(', ')}`)
  if (embedded < unique.length) note(id, `${unique.length} fonts but only ${embedded} embedded font files`)
  return unique
}

function checkPng(id, dataUrl, width, height) {
  const buffer = Buffer.from(dataUrl.split(',')[1], 'base64')
  const png = PNG.sync.read(buffer)
  if (png.width !== width || png.height !== height) note(id, `png is ${png.width}x${png.height}, expected ${width}x${height}`)
  let transparent = 0
  for (let i = 3; i < png.data.length; i += 4) if (png.data[i] < 255) transparent += 1
  if (transparent) note(id, `${transparent} non-opaque pixels`)
  return buffer
}

function diffPng(id, file, buffer) {
  const goldenFile = path.join(GOLDEN, file)
  if (update || !fs.existsSync(goldenFile)) {
    fs.writeFileSync(goldenFile, buffer)
    return
  }
  const a = PNG.sync.read(fs.readFileSync(goldenFile))
  const b = PNG.sync.read(buffer)
  if (a.width !== b.width || a.height !== b.height) return note(id, `size differs from golden (${a.width}x${a.height} vs ${b.width}x${b.height})`)
  let changed = 0
  for (let i = 0; i < a.data.length; i += 4) {
    const delta = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2])
    if (delta > 48) changed += 1
  }
  const share = changed / (a.width * a.height)
  if (share > 0.0005) note(id, `${(share * 100).toFixed(2)}% of pixels differ from golden ${file}`)
}

/** Runs inside the page: overlap, clipping and ruler geometry checks on the HTML template. */
const domChecks = (track) => {
  const root = document.querySelector('[data-export]')
  if (!root) return { issues: ['no template root'], info: [], checked: { ticks: 0, dots: 0, stems: 0 } }
  const issues = []
  const info = []
  const checked = { ticks: 0, dots: 0, stems: 0 }
  const rootRect = root.getBoundingClientRect()
  const boxes = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode
    if (!node.textContent.trim()) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    const rects = [...range.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5)
    if (!rects.length) continue
    const left = Math.min(...rects.map((r) => r.left))
    const right = Math.max(...rects.map((r) => r.right))
    const top = Math.min(...rects.map((r) => r.top))
    const bottom = Math.max(...rects.map((r) => r.bottom))
    // text that is deliberately cut with an ellipsis or a line clamp is reported once, not as overlap or clipping
    let truncated = false
    for (let el = node.parentElement; el && el !== root; el = el.parentElement) {
      const style = getComputedStyle(el)
      const lineClamp = style.webkitLineClamp && style.webkitLineClamp !== 'none'
      const cutAcross = style.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 3
      const cutDown = lineClamp && el.scrollHeight > el.clientHeight + 2
      if (cutAcross || cutDown) truncated = true
    }
    if (truncated) {
      info.push('truncated with ellipsis: ' + node.textContent.trim().slice(0, 40))
      continue
    }
    boxes.push({ text: node.textContent.trim().slice(0, 28), el: node.parentElement, rect: { left, right, top, bottom } })
  }
  // overlap between text from different elements, shrunk by the line-box slack
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i]
      const b = boxes[j]
      if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue
      const shrink = (r) => ({ left: r.left + 1, right: r.right - 1, top: r.top + 0.18 * (r.bottom - r.top), bottom: r.bottom - 0.18 * (r.bottom - r.top) })
      const p = shrink(a.rect)
      const q = shrink(b.rect)
      const w = Math.min(p.right, q.right) - Math.max(p.left, q.left)
      const h = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top)
      if (w > 1 && h > 1) issues.push(`text overlap: "${a.text}" and "${b.text}"`)
    }
  }
  // clipping: text outside an overflow:hidden ancestor, or outside the page
  for (const box of boxes) {
    const r = box.rect
    if (r.left < rootRect.left - 1 || r.right > rootRect.right + 1 || r.top < rootRect.top - 1 || r.bottom > rootRect.bottom + 1) {
      issues.push(`text outside the page: "${box.text}"`)
    }
    for (let el = box.el; el && el !== root; el = el.parentElement) {
      const style = getComputedStyle(el)
      if (style.overflow === 'visible') continue
      if (style.textOverflow === 'ellipsis' || style.webkitLineClamp !== 'none') continue
      const c = el.getBoundingClientRect()
      if (r.left < c.left - 1.5 || r.right > c.right + 1.5 || r.top < c.top - 1.5 || r.bottom > c.bottom + 1.5) {
        issues.push(`text clipped by container: "${box.text}"`)
        break
      }
    }
  }
  // ruler geometry
  const bar = root.querySelector('[data-ruler-bar]')
  if (bar) {
    const b = bar.getBoundingClientRect()
    const edges = [...bar.querySelectorAll('[data-ruler-band]')].map((el) => el.getBoundingClientRect().left)
    const bandEnd = b.right
    for (const tick of root.querySelectorAll('[data-ruler-tick]')) {
      const t = tick.getBoundingClientRect()
      const value = Number(tick.getAttribute('data-ruler-tick'))
      const first = tick === root.querySelector('[data-ruler-tick]')
      const anchor = first ? t.left : t.right > b.right - 0.5 && Math.abs(t.right - b.right) < 1 ? t.right : (t.left + t.right) / 2
      const onEdge = [...edges, bandEnd].some((e) => Math.abs(e - anchor) < 1)
      if (!onEdge) issues.push(`tick ${value} is not on a band edge`)
      else checked.ticks += 1
    }
    const stem = root.querySelector('[data-ruler-stem]')
    if (stem) {
      const s = stem.getBoundingClientRect()
      if (Math.abs(s.bottom - b.top) > 1) issues.push(`stem ends ${(s.bottom - b.top).toFixed(1)}px from the bar top`)
      for (const box of boxes) {
        const r = box.rect
        if (s.left < r.right && s.right > r.left && s.top < r.bottom && s.bottom > r.top) issues.push(`stem crosses text "${box.text}"`)
      }
    }
  }
  // mini ruler dots must sit at pos(gpa) of their own track
  const span = track.max - track.min
  for (const dot of root.querySelectorAll('[data-mini-dot]')) {
    const trackEl = dot.parentElement.querySelector('[data-mini-track]').getBoundingClientRect()
    const gpa = Number(dot.getAttribute('data-mini-dot'))
    const expected = trackEl.left + Math.min(1, Math.max(0, (gpa - track.min) / span)) * trackEl.width
    const d = dot.getBoundingClientRect()
    if (Math.abs((d.left + d.right) / 2 - expected) > 1) issues.push(`mini dot ${gpa} is off its geometry`)
    else checked.dots += 1
  }
  const stemEl = root.querySelector('[data-ruler-stem]')
  if (stemEl && bar) {
    const b = bar.getBoundingClientRect()
    const s = stemEl.getBoundingClientRect()
    const pct = (((s.left + s.right) / 2 - b.left) / b.width) * 100
    const youGpa = Number(root.dataset.gpa)
    if (Number.isFinite(youGpa) && Math.abs(pct - (((youGpa - track.min) / span) * 100)) > 0.2) issues.push(`You stem at ${pct.toFixed(2)}% is off pos(gpa)`)
    else checked.stems += 1
  }
  return { issues, info, checked }
}

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1400, height: 1200 }, deviceScaleFactor: 1 })
const page = await context.newPage()
page.on('pageerror', (error) => note('page', error.message))

let ran = 0
for (const c of selected) {
  const id = name(c)
  const params = new URLSearchParams({ fixture: c.fixture, theme: c.theme, paper: c.paper ?? 'A4', aspect: c.aspect ?? '4:5' })
  try {
    await page.goto(`${BASE}/dev/export-qa?${params}`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => window.__qaReady === true, null, { timeout: 20000 })
    await page.evaluate(() => document.fonts.ready)
    const model = await page.evaluate(() => JSON.parse(JSON.stringify(window.__qa.model)))
    const expectedPages = model.pages.length

    if (c.kind === 'png') {
      const size = { '1:1': [1080, 1080], '4:5': [1080, 1350], '9:16': [1080, 1920] }[c.aspect]
      const dom = await page.evaluate(domChecks, await page.evaluate(() => window.__qa.model.track))
      tally(dom.checked)
      for (const msg of dom.issues) note(id, msg)
      for (const msg of dom.info) infos.add(`${id} ${msg}`)
      const dataUrl = await page.evaluate(() => window.__qa.png())
      const buffer = checkPng(id, dataUrl, size[0], size[1])
      fs.writeFileSync(path.join(OUT, `${id}.png`), buffer)
      diffPng(id, `${id}.png`, buffer)
      if (c.fixture === 'hidden') {
        const text = await page.evaluate(() => document.querySelector('[data-export]').innerText)
        const digits = text.match(/\b\d\.\d{2}\b/g)
        if (digits) note(id, `exact GPA digits found with Hide exact GPA on: ${digits.join(', ')}`)
        if (/@/.test(text)) note(id, 'email-like text found on the card')
      }
      if (c.fixture === 'noname') {
        const text = await page.evaluate(() => document.querySelector('[data-export]').innerText)
        if (/CS26-/.test(text)) note(id, 'student id shown while the toggle is off')
      }
    } else {
      // HTML preview pages
      for (let index = 0; index < expectedPages; index += 1) {
        await page.goto(`${BASE}/dev/export-qa?${params}&page=${index}`, { waitUntil: 'networkidle' })
        await page.waitForFunction(() => window.__qaReady === true)
        await page.evaluate(() => document.fonts.ready)
        const dom = await page.evaluate(domChecks, await page.evaluate(() => window.__qa.model.track))
        tally(dom.checked)
        for (const msg of dom.issues) note(`${id} preview p${index + 1}`, msg)
        for (const msg of dom.info) infos.add(`${id} preview ${msg}`)
        const shot = await page.locator('[data-export]').screenshot()
        fs.writeFileSync(path.join(OUT, `${id}-preview-p${index + 1}.png`), shot)
        diffPng(`${id} preview p${index + 1}`, `${id}-preview-p${index + 1}.png`, shot)
      }
      await page.goto(`${BASE}/dev/export-qa?${params}`, { waitUntil: 'networkidle' })
      await page.waitForFunction(() => window.__qaReady === true)
      const base64 = await page.evaluate(() => window.__qa.pdf())
      const buffer = Buffer.from(base64, 'base64')
      fs.writeFileSync(path.join(OUT, `${id}.pdf`), buffer)
      checkPdfFonts(id, buffer)
      const pages = await page.evaluate((b) => window.__qa.rasterize(b, 2), base64)
      if (pages.length !== expectedPages) note(id, `PDF has ${pages.length} pages but the modal says ${expectedPages}`)
      const want = c.paper === 'LETTER' ? [612, 792] : [595.28, 841.89]
      pages.forEach((p, index) => {
        const label = `${id} pdf p${index + 1}`
        if (Math.abs(p.width - want[0]) > 1 || Math.abs(p.height - want[1]) > 1) note(label, `page size ${p.width}x${p.height}`)
        const all = p.items.map((i) => i.str).join(' ')
        if (!/Not an official transcript/.test(all)) note(label, 'disclaimer missing')
        if (!new RegExp(`Page ${index + 1} of ${pages.length}`).test(all)) note(label, 'page number missing')
        for (const item of p.items) {
          if (item.x < -1 || item.x + item.w > p.width + 1 || item.y < -1 || item.y + item.h > p.height + 1) note(label, `text off page: "${item.str}"`)
        }
        for (let i = 0; i < p.items.length; i += 1) {
          for (let j = i + 1; j < p.items.length; j += 1) {
            const a = p.items[i]
            const b = p.items[j]
            const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
            // pdf.js boxes are one em tall from the baseline; compare the cap-height band only
            const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y + a.h * 0.28, b.y + b.h * 0.28)
            if (w > 1.5 && h > 1.5) note(label, `text overlap: "${a.str}" and "${b.str}"`)
          }
        }
        if (index === 0 && c.theme === 'ruler' && model.show.classificationRuler && model.hasClassBands) {
          const W = p.width - 96
          const { min, max, bands } = model.track
          const values = [...new Set([min, ...bands.map((b) => b.min), max])]
          values.forEach((value, k) => {
            const candidates = p.items.filter((item) => item.str === value.toFixed(2))
            const expected = 48 + ((value - min) / (max - min)) * W
            const hit = candidates.some((item) => {
              const anchor = k === 0 ? item.x : k === values.length - 1 ? item.x + item.w : item.x + item.w / 2
              return Math.abs(anchor - expected) < 1
            })
            if (!hit) note(label, `PDF tick ${value.toFixed(2)} is not on its band boundary (${expected.toFixed(1)}pt)`)
            else totals.pdfTicks += 1
          })
        }
        const buf = Buffer.from(p.png.split(',')[1], 'base64')
        fs.writeFileSync(path.join(OUT, `${id}-pdf-p${index + 1}.png`), buf)
        diffPng(label, `${id}-pdf-p${index + 1}.png`, buf)
      })
    }
    ran += 1
  } catch (error) {
    note(id, `crashed: ${error.message}`)
  }
}

await browser.close()
console.log(
  `geometry checked: ${totals.ticks} ticks on band edges, ${totals.stems} You stems at pos(gpa) ending at the bar top, ${totals.dots} semester dots, ${totals.pdfTicks} PDF ticks`,
)
console.log(`${ran}/${selected.length} cases ran, ${update ? 'golden images updated' : 'compared with golden'}`)
if (infos.size) console.log('\ntruncated on purpose (names too long to fit):\n - ' + [...infos].join('\n - '))
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`)
  for (const p of problems) console.log(' - ' + p)
  process.exitCode = 1
} else {
  console.log('No problems found.')
}
void zlib
