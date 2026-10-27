import type { CSSProperties } from 'react'
import { HAIRLINE, INK_MUTED, SPACE } from '@/lib/export/palette'
import { FOOTER_H, KEY_GAP, KEY_LINE, MARGIN } from '@/lib/export/layout'
import { disclaimer, type ReportModel } from '@/lib/export/reportModel'
import { pageLabel } from '@/lib/export/copy'

/** Footer: hairline, disclaimer on the left, page number on the right. Same on every page of every PDF theme. */
export function DocFooter({ model, pageIndex, fontFamily }: { model: ReportModel; pageIndex: number; fontFamily: string }) {
  return (
    <footer
      style={{
        position: 'absolute',
        left: `${MARGIN}pt`,
        right: `${MARGIN}pt`,
        bottom: `${MARGIN}pt`,
        height: `${FOOTER_H}pt`,
        boxSizing: 'border-box',
        borderTop: `0.75pt solid ${HAIRLINE}`,
        paddingTop: `${SPACE.sm}pt`,
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily,
        fontSize: '8pt',
        lineHeight: `${KEY_LINE}pt`,
        color: INK_MUTED,
      }}
    >
      <span>{disclaimer(model.issuedOn)}</span>
      <span>{pageLabel(pageIndex, model.pages.length)}</span>
    </footer>
  )
}

/** Grade scale and classification key, full width, two columns, anchored above the footer. */
export function DocKey({
  model,
  fontFamily,
  leadFont,
  show = true,
}: {
  model: ReportModel
  fontFamily: string
  leadFont?: string
  show?: boolean
}) {
  if (!show) return null
  const column: CSSProperties = { flex: 1, minWidth: 0, margin: 0 }
  const lead: CSSProperties = { fontWeight: 700, fontFamily: leadFont ?? fontFamily, color: '#10132A' }
  return (
    <section
      style={{
        position: 'absolute',
        left: `${MARGIN}pt`,
        right: `${MARGIN}pt`,
        bottom: `${MARGIN + FOOTER_H + KEY_GAP}pt`,
        height: `${model.keyHeight}pt`,
        display: 'flex',
        gap: `${SPACE.xl}pt`,
        alignItems: 'flex-end',
        fontFamily,
        fontSize: '8pt',
        lineHeight: `${KEY_LINE}pt`,
        color: INK_MUTED,
      }}
    >
      <p style={column}>
        <span style={lead}>Grade scale. </span>
        {model.gradeScaleList}
      </p>
      <p style={column}>
        <span style={lead}>Classification. </span>
        {model.classificationList}
      </p>
    </section>
  )
}
