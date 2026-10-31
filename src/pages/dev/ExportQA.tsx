import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { pdf } from '@react-pdf/renderer'
import { toPng } from 'html-to-image'
import { FIXTURE_BY_ID, FIXTURES } from '@/lib/export/fixtures'
import { buildReport, type PaperSize, type SocialAspect } from '@/lib/export/reportModel'
import { resolveToggles, type ThemeId } from '@/lib/export/themes'
import { NIGHT, SOCIAL_PX } from '@/lib/export/palette'
import { socialFontCss, waitForExportFonts } from '@/lib/export/fontEmbed'
import { FormalReport } from '@/components/export/FormalReport'
import { RulerReport } from '@/components/export/RulerReport'
import { SocialCard } from '@/components/export/SocialCard'
import { FormalPdf, RulerPdf } from '@/components/export/ReportPdf'

/**
 * Dev-only harness for visual checks. Renders one export template at full size from a fixture,
 * and exposes the real PDF and PNG code paths on window.__qa for the QA script.
 * Query: fixture, theme, paper, aspect, page.
 */
export default function ExportQA() {
  const [params] = useSearchParams()
  const fixture = FIXTURE_BY_ID[params.get('fixture') ?? 'two'] ?? FIXTURES[0]
  const theme = (params.get('theme') ?? 'ruler') as ThemeId
  const paper = (params.get('paper') ?? 'A4') as PaperSize
  const aspect = (params.get('aspect') ?? '4:5') as SocialAspect
  const pageIndex = Number(params.get('page') ?? 0)

  const model = useMemo(() => {
    const hasBands = true
    const resolved = resolveToggles(theme, fixture.toggles, hasBands)
    return buildReport({
      degree: fixture.degree,
      semesters: fixture.semesters,
      theme,
      toggles: resolved.values,
      title: '',
      studentName: fixture.studentName,
      studentId: fixture.studentId,
      paper,
      aspect,
      targetCgpa: fixture.target ?? null,
      issuedOn: new Date('2026-10-27T10:00:00Z'),
    })
  }, [fixture, theme, paper, aspect])

  useEffect(() => {
    const w = window as unknown as { __qa?: unknown }
    w.__qa = {
      model,
      async pdf() {
        const tree = theme === 'ruler' ? <RulerPdf model={model} /> : <FormalPdf model={model} />
        const blob = await pdf(tree).toBlob()
        const bytes = new Uint8Array(await blob.arrayBuffer())
        let binary = ''
        for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
        return btoa(binary)
      },
      /** Render every PDF page with pdf.js and return text boxes in pt, top-left origin. */
      async rasterize(base64: string, scale = 2) {
        const pdfjs = await import('pdfjs-dist')
        const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
        pdfjs.GlobalWorkerOptions.workerSrc = worker
        const data = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0))
        const doc = await pdfjs.getDocument({ data }).promise
        const pages = []
        for (let n = 1; n <= doc.numPages; n += 1) {
          const page = await doc.getPage(n)
          const viewport = page.getViewport({ scale })
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(viewport.width)
          canvas.height = Math.round(viewport.height)
          await page.render({ canvas, viewport }).promise
          const text = await page.getTextContent()
          const base = page.getViewport({ scale: 1 })
          const items = text.items
            .filter((item) => 'str' in item && item.str.trim().length > 0)
            .map((item) => {
              const t = item as { str: string; transform: number[]; width: number; height: number; fontName: string }
              return {
                str: t.str,
                x: t.transform[4],
                y: base.height - t.transform[5] - t.height,
                w: t.width,
                h: t.height,
                font: (text.styles[t.fontName] as { fontFamily?: string } | undefined)?.fontFamily ?? t.fontName,
              }
            })
          pages.push({ width: base.width, height: base.height, png: canvas.toDataURL('image/png'), items })
        }
        return pages
      },
      async png() {
        await waitForExportFonts()
        const node = document.querySelector<HTMLElement>('[data-export="social"]')
        if (!node) throw new Error('no card')
        const size = SOCIAL_PX[aspect]
        return toPng(node, {
          pixelRatio: 1,
          width: size.width,
          height: size.height,
          canvasWidth: size.width,
          canvasHeight: size.height,
          backgroundColor: NIGHT,
          fontEmbedCSS: await socialFontCss(),
          style: { margin: '0', transform: 'none' },
        })
      },
    }
    ;(window as unknown as { __qaReady?: boolean }).__qaReady = true
  }, [model, theme, aspect])

  return (
    <div style={{ background: '#444', minHeight: '100vh', padding: 24, display: 'inline-block' }}>
      {theme === 'formal' && <FormalReport model={model} pageIndex={pageIndex} />}
      {theme === 'ruler' && <RulerReport model={model} pageIndex={pageIndex} />}
      {theme === 'social' && <SocialCard model={model} />}
    </div>
  )
}
