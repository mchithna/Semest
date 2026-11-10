import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { LOGO_BAR_GAP, LOGO_BAR_WIDTH, LOGO_BARS, LOGO_TEXT_GAP, LOGO_TEXT_SIZE } from '@/lib/brand'
import { formatGpa } from '@/lib/score'
import { PDF_FONT, registerPdfFonts } from '@/lib/export/pdfFonts'
import { AMBER, HAIRLINE, INK, INK_MUTED, PAPER, SPACE } from '@/lib/export/palette'
import {
  bandReached,
  clampPill,
  fitBandLabel,
  pillWidth,
  rulerGeometry,
} from '@/lib/export/geometry'
import {
  contentWidth,
  FOOTER_H,
  FORMAL,
  KEY_GAP,
  KEY_LINE,
  MARGIN,
  PAGE_PT,
  RULER,
  headerRightWidth,
  heroNumeralSize,
  RULER_STATEMENT_W,
  rulerMiniWidth,
} from '@/lib/export/layout'
import { bandPaint, paperMetrics, RULER_COLORS, TARGET_COLOR, type RulerMetrics } from '@/lib/export/rulerStyle'
import {
  degreeLine,
  disclaimer,
  formatCredits,
  studentLine,
  type ReportModel,
  type ReportSemester,
} from '@/lib/export/reportModel'
import {
  heroDetail,
  heroGpa,
  heroStatement,
  NO_BANDS_NOTE,
  pageLabel,
  rulerSummary,
  singleLineSize,
} from '@/lib/export/copy'
import type { BandTrack } from '@/lib/bands'

registerPdfFonts()

/**
 * PDFs use @react-pdf/renderer: real vector text, embedded font subsets and true A4 or Letter pages.
 * The HTML previews (RulerReport, FormalReport) use the same numbers in pt, and both read one ReportModel.
 */

const D = PDF_FONT.display
const S = PDF_FONT.sans
const SERIF = PDF_FONT.serif

function pageSize(model: ReportModel) {
  return model.paper === 'LETTER' ? 'LETTER' : 'A4'
}

const lh = (px: number, fontSize: number) => px / fontSize

/**
 * CSS centres a short line box around the glyphs. react-pdf keeps the full ascent, so a 0.85 line-height
 * numeral sits too low by half the missing leading. Bricolage Grotesque: ascent 0.93em, descent 0.27em.
 */
const heroLeadShift = (size: number) => (size * 1.2 - RULER.heroNumeralLine) / 2

/* ---------- shared parts ---------- */

function PdfLogo({ scale = 0.8, color = INK }: { scale?: number; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        {LOGO_BARS.map((bar, index) => (
          <View
            key={bar.color}
            style={{
              width: LOGO_BAR_WIDTH * scale,
              height: bar.height * scale,
              borderRadius: 3,
              backgroundColor: bar.color,
              marginRight: index < LOGO_BARS.length - 1 ? LOGO_BAR_GAP * scale : 0,
            }}
          />
        ))}
      </View>
      <Text
        style={{
          marginLeft: LOGO_TEXT_GAP * scale,
          fontFamily: S,
          fontWeight: 600,
          fontSize: LOGO_TEXT_SIZE * scale,
          color,
          letterSpacing: -0.01 * LOGO_TEXT_SIZE * scale,
        }}
      >
        Semest
      </Text>
    </View>
  )
}

function PdfFooter({ model, index, font }: { model: ReportModel; index: number; font: string }) {
  return (
    <View
      fixed
      style={{
        position: 'absolute',
        left: MARGIN,
        right: MARGIN,
        bottom: MARGIN,
        height: FOOTER_H,
        borderTopWidth: 0.75,
        borderTopColor: HAIRLINE,
        paddingTop: SPACE.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}
    >
      <Text style={{ fontFamily: font, fontSize: 8, lineHeight: lh(KEY_LINE, 8), color: INK_MUTED }}>{disclaimer(model.issuedOn)}</Text>
      <Text style={{ fontFamily: font, fontSize: 8, lineHeight: lh(KEY_LINE, 8), color: INK_MUTED }}>
        {pageLabel(index, model.pages.length)}
      </Text>
    </View>
  )
}

function PdfKey({ model, font, leadFont }: { model: ReportModel; font: string; leadFont: string }) {
  if (!model.show.gradeScale) return null
  const text = { fontFamily: font, fontSize: 8, lineHeight: lh(KEY_LINE, 8), color: INK_MUTED }
  const lead = { fontFamily: leadFont, fontWeight: 700, color: INK } as const
  return (
    <View
      style={{
        position: 'absolute',
        left: MARGIN,
        right: MARGIN,
        bottom: MARGIN + FOOTER_H + KEY_GAP,
        height: model.keyHeight,
        flexDirection: 'row',
        alignItems: 'flex-end',
      }}
    >
      <Text style={{ ...text, flexGrow: 1, flexBasis: 0, marginRight: SPACE.xl }}>
        <Text style={lead}>Grade scale. </Text>
        {model.gradeScaleList}
      </Text>
      <Text style={{ ...text, flexGrow: 1, flexBasis: 0 }}>
        <Text style={lead}>Classification. </Text>
        {model.classificationList}
      </Text>
    </View>
  )
}

/* ---------- Ruler ---------- */

const ruler = StyleSheet.create({
  page: { padding: 0, backgroundColor: '#FFFFFF', fontFamily: S, fontSize: 10, color: INK },
  muted: { fontFamily: S, fontSize: 10, color: INK_MUTED },
})

function PdfRuler({
  track,
  value,
  youLabel,
  target,
  metrics,
}: {
  track: BandTrack
  value: number | null
  youLabel?: string
  target: number | null
  metrics: RulerMetrics
}) {
  const geo = rulerGeometry(track)
  const colors = RULER_COLORS.paper
  const W = metrics.width
  const hasPill = youLabel != null && value != null
  const barTop = hasPill ? metrics.pillHeight + metrics.stem : 0
  const tickTop = barTop + metrics.bar + metrics.tickGap
  const targetTop = tickTop + metrics.tickLine + metrics.targetGap
  const hasTarget = target != null && Number.isFinite(target)
  const youPct = value != null ? geo.pct(value) : 0
  const pillW = hasPill ? pillWidth(youLabel, metrics.pillFont, metrics.pillPadX) : 0
  const targetText = hasTarget ? `Target ${formatGpa(target)}` : ''
  const targetW = hasTarget ? pillWidth(targetText, metrics.pillFont, metrics.pillPadX) : 0
  const height = targetTop + (hasTarget ? metrics.targetStem + metrics.pillHeight : 0) - (hasTarget ? 0 : metrics.targetGap)
  const tickW = 40

  return (
    <View style={{ position: 'relative', width: W, height }}>
      {hasPill && (
        <>
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: (clampPill(youPct, pillW, W) / 100) * W - pillW / 2,
              width: pillW,
              height: metrics.pillHeight,
              borderRadius: metrics.pillHeight / 2,
              backgroundColor: colors.pillBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: S, fontWeight: 600, fontSize: metrics.pillFont, color: colors.pillText }}>{youLabel}</Text>
          </View>
          <View
            style={{
              position: 'absolute',
              top: metrics.pillHeight,
              left: (youPct / 100) * W - metrics.stemWidth / 2,
              width: metrics.stemWidth,
              height: metrics.stem,
              backgroundColor: colors.pillBg,
            }}
          />
        </>
      )}

      <View
        style={{
          position: 'absolute',
          top: barTop,
          left: 0,
          width: W,
          height: metrics.bar,
          borderRadius: metrics.bar / 2,
          overflow: 'hidden',
        }}
      >
        {geo.bands.map((band, index) => {
          const paint = bandPaint(band, bandReached(band, value), 'paper', index, geo.bands.length)
          const bandW = (band.width / 100) * W
          const fit = fitBandLabel(band.label, bandW - metrics.labelPad * 2, metrics.label)
          const dashed = paint.edge
            ? ({
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderRightWidth: 1,
                borderTopStyle: 'dashed',
                borderBottomStyle: 'dashed',
                borderRightStyle: 'dashed',
                borderTopColor: paint.edge,
                borderBottomColor: paint.edge,
                borderRightColor: paint.edge,
              } as const)
            : {}
          return (
            <View
              key={band.id}
              style={{
                position: 'absolute',
                top: 0,
                left: (band.left / 100) * W,
                width: bandW,
                height: metrics.bar,
                backgroundColor: paint.fill,
                justifyContent: 'center',
                paddingHorizontal: metrics.labelPad,
                ...dashed,
              }}
            >
              <Text style={{ fontFamily: S, fontWeight: 600, fontSize: fit.fontSize, lineHeight: 1.05, color: paint.text }}>{band.label}</Text>
            </View>
          )
        })}
      </View>

      {geo.ticks.map((tick) => {
        const x = (tick.left / 100) * W
        const left = tick.align === 'start' ? 0 : tick.align === 'end' ? W - tickW : x - tickW / 2
        return (
          <Text
            key={tick.value}
            style={{
              position: 'absolute',
              top: tickTop,
              left,
              width: tickW,
              fontFamily: S,
              fontSize: metrics.tick,
              lineHeight: lh(metrics.tickLine, metrics.tick),
              color: colors.muted,
              textAlign: tick.align === 'start' ? 'left' : tick.align === 'end' ? 'right' : 'center',
            }}
          >
            {formatGpa(tick.value)}
          </Text>
        )
      })}

      {hasTarget && (
        <>
          <View
            style={{
              position: 'absolute',
              top: targetTop,
              left: (geo.pct(target) / 100) * W - metrics.stemWidth / 2,
              height: metrics.targetStem,
              borderLeftWidth: metrics.stemWidth,
              borderLeftStyle: 'dashed',
              borderLeftColor: TARGET_COLOR,
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: targetTop + metrics.targetStem,
              left: (clampPill(geo.pct(target), targetW, W) / 100) * W - targetW / 2,
              width: targetW,
              height: metrics.pillHeight,
              borderRadius: metrics.pillHeight / 2,
              backgroundColor: AMBER,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: S, fontWeight: 600, fontSize: metrics.pillFont, color: INK }}>{targetText}</Text>
          </View>
        </>
      )}
    </View>
  )
}

function PdfMini({ track, value, width }: { track: BandTrack; value: number | null; width: number }) {
  const geo = rulerGeometry(track)
  const { dot, ring, trackH } = RULER
  const full = dot + ring * 2
  return (
    <View style={{ position: 'relative', width, height: full }}>
      <View
        style={{
          position: 'absolute',
          top: (full - trackH) / 2,
          left: 0,
          width,
          height: trackH,
          borderRadius: trackH / 2,
          overflow: 'hidden',
        }}
      >
        {geo.bands.map((band, index) => (
          <View
            key={band.id}
            style={{
              position: 'absolute',
              top: 0,
              left: (band.left / 100) * width,
              width: (band.width / 100) * width,
              height: trackH,
              backgroundColor: bandPaint(band, bandReached(band, value), 'paper', index, geo.bands.length).fill,
            }}
          />
        ))}
      </View>
      {value != null && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: (geo.pct(value) / 100) * width - full / 2,
            width: full,
            height: full,
            borderRadius: full / 2,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: INK }} />
        </View>
      )}
    </View>
  )
}

export function RulerPdf({ model }: { model: ReportModel }) {
  const width = contentWidth(model.paper)
  const geo = rulerGeometry(model.track)
  const miniW = rulerMiniWidth(model.paper)
  const showRuler = model.show.classificationRuler && model.hasClassBands
  const student = studentLine(model)
  const heroSize = heroNumeralSize(heroGpa(model), model.paper)

  return (
    <Document title={model.title} author="Semest" creator="Semest" producer="Semest">
      {model.pages.map((page) => {
        const semesters = model.semesters.filter((semester) => page.semesterIds.includes(semester.id))
        return (
          <Page key={page.index} size={pageSize(model)} style={ruler.page}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: RULER.stripH }}>
              {model.hasClassBands &&
                geo.bands.map((band, index) => (
                  <View
                    key={band.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: (band.left / 100) * PAGE_PT[model.paper].width,
                      width: (band.width / 100) * PAGE_PT[model.paper].width,
                      height: RULER.stripH,
                      backgroundColor: bandPaint(band, true, 'paper', index, geo.bands.length).fill,
                    }}
                  />
                ))}
            </View>

            <View style={{ paddingTop: MARGIN, paddingHorizontal: MARGIN }}>
              <View style={{ height: RULER.headerH, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <PdfLogo />
                <View style={{ width: headerRightWidth(model.paper), alignItems: 'flex-end' }}>
                  <Text style={{ ...ruler.muted, lineHeight: lh(12, 10), maxLines: 1, textOverflow: 'ellipsis' }}>{degreeLine(model)}</Text>
                  {student ? (
                    <Text style={{ ...ruler.muted, lineHeight: lh(12, 10), maxLines: 1, textOverflow: 'ellipsis' }}>{student}</Text>
                  ) : null}
                </View>
              </View>

              {page.showIntro && (
                <>
                  <View style={{ marginTop: SPACE.xxl, height: RULER.heroH }}>
                    <Text style={{ ...ruler.muted, lineHeight: lh(12, 10) }}>Cumulative GPA</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: SPACE.xs }}>
                      <Text
                        style={{
                          fontFamily: D,
                          fontWeight: 700,
                          fontSize: heroSize,
                          lineHeight: RULER.heroNumeralLine / heroSize,
                          letterSpacing: -0.03 * heroSize,
                          position: 'relative',
                          top: -heroLeadShift(heroSize),
                        }}
                      >
                        {heroGpa(model)}
                      </Text>
                      <View style={{ width: RULER_STATEMENT_W, paddingBottom: SPACE.sm }}>
                        <Text style={{ fontFamily: D, fontWeight: 500, fontSize: 20, lineHeight: lh(24, 20) }}>{heroStatement(model)}</Text>
                        <Text style={{ ...ruler.muted, marginTop: SPACE.xs, lineHeight: lh(13, 10) }}>{heroDetail(model)}</Text>
                      </View>
                    </View>
                  </View>

                  {model.show.summaryFigures && (
                    <View
                      style={{
                        marginTop: SPACE.xxl,
                        height: RULER.summaryH,
                        borderTopWidth: 1,
                        borderTopColor: INK,
                        paddingTop: SPACE.md,
                        flexDirection: 'row',
                      }}
                    >
                      {rulerSummary(model).map((cell) => (
                        <View key={cell.label} style={{ flexGrow: 1, flexBasis: 0 }}>
                          <Text style={{ fontFamily: S, fontSize: 9, lineHeight: lh(11, 9), color: INK_MUTED }}>{cell.label}</Text>
                          <Text style={{ marginTop: 2, fontFamily: D, fontWeight: 600, fontSize: 18, lineHeight: lh(22, 18) }}>{cell.value}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {showRuler && (
                    <View style={{ marginTop: SPACE.xxl }}>
                      <PdfRuler
                        track={model.track}
                        value={model.cgpa}
                        youLabel={model.cgpa != null ? `You ${formatGpa(model.cgpa)}` : undefined}
                        target={model.targetCgpa}
                        metrics={paperMetrics(width)}
                      />
                    </View>
                  )}
                  {model.show.classificationRuler && !model.hasClassBands && (
                    <Text style={{ ...ruler.muted, marginTop: SPACE.xxl, lineHeight: lh(14, 10) }}>{NO_BANDS_NOTE}</Text>
                  )}
                </>
              )}

              {model.show.semesterTables && (
                <View style={{ marginTop: SPACE.xxl }}>
                  {semesters.map((semester) => (
                    <View
                      key={semester.id}
                      wrap={false}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: RULER.semesterPad,
                        borderBottomWidth: 0.75,
                        borderBottomColor: HAIRLINE,
                      }}
                    >
                      <View style={{ flexGrow: 1.2, flexBasis: 0, marginRight: SPACE.lg }}>
                        <Text style={{ fontFamily: S, fontWeight: 600, fontSize: 11, lineHeight: lh(14, 11), maxLines: 2, textOverflow: 'ellipsis' }}>
                          {semester.title}
                        </Text>
                        <Text style={{ marginTop: 2, fontFamily: S, fontSize: 9.5, lineHeight: lh(12, 9.5), color: INK_MUTED }}>
                          {formatCredits(semester.credits)} credits
                        </Text>
                      </View>
                      <View style={{ flexGrow: 3, flexBasis: 0, marginRight: SPACE.lg }}>
                        {model.hasClassBands ? <PdfMini track={model.track} value={semester.gpa} width={miniW} /> : null}
                      </View>
                      <Text style={{ width: 64, textAlign: 'right', fontFamily: D, fontWeight: 600, fontSize: 20, lineHeight: lh(24, 20) }}>
                        {semester.gpa != null ? formatGpa(semester.gpa) : '—'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <PdfKey model={model} font={S} leadFont={S} />
            <PdfFooter model={model} index={page.index} font={S} />
          </Page>
        )
      })}
    </Document>
  )
}

/* ---------- Formal ---------- */

const formal = StyleSheet.create({
  page: { padding: 0, backgroundColor: PAPER, fontFamily: SERIF, fontSize: 10.5, color: INK },
  label: { fontFamily: S, fontSize: 8, lineHeight: 1.25, letterSpacing: 0.48, textTransform: 'uppercase', color: INK_MUTED },
})

const COL = { code: 52, credits: 52, grade: 52, points: 52, gap: SPACE.sm } as const

export function FormalPdf({ model }: { model: ReportModel }) {
  return (
    <Document title={model.title} author="Semest" creator="Semest" producer="Semest">
      {model.pages.map((page) => {
        const semesters = model.semesters.filter((semester) => page.semesterIds.includes(semester.id))
        return (
          <Page key={page.index} size={pageSize(model)} style={formal.page}>
            <View style={{ paddingTop: MARGIN, paddingHorizontal: MARGIN }}>
              {page.showIntro ? <FormalMasthead model={model} /> : <FormalRunning model={model} />}
              {model.show.semesterTables && semesters.map((semester) => <FormalSemester key={semester.id} semester={semester} />)}
              {page.showIntro && model.show.registrarEndorsement && (
                <View
                  style={{
                    marginTop: SPACE.lg,
                    height: FORMAL.endorse,
                    borderWidth: 0.75,
                    borderColor: HAIRLINE,
                    padding: SPACE.md,
                  }}
                >
                  <Text style={{ fontWeight: 700, fontSize: 10.5 }}>Registrar endorsement</Text>
                  <Text style={{ marginTop: SPACE.xs, fontSize: 9, color: INK_MUTED }}>Leave blank. This is not a university stamp.</Text>
                  <View style={{ marginTop: SPACE.lg, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flexGrow: 1, height: SPACE.xxl, borderBottomWidth: 1, borderBottomColor: INK, marginRight: SPACE.xl }}>
                      <Text style={{ fontSize: 9, color: INK_MUTED }}>Signature</Text>
                    </View>
                    <View style={{ width: 48, height: 48, borderWidth: 0.75, borderStyle: 'dashed', borderColor: HAIRLINE }} />
                  </View>
                </View>
              )}
            </View>
            <PdfKey model={model} font={SERIF} leadFont={SERIF} />
            <PdfFooter model={model} index={page.index} font={S} />
          </Page>
        )
      })}
    </Document>
  )
}

function FormalMasthead({ model }: { model: ReportModel }) {
  const cell = (contentWidth(model.paper) - SPACE.lg * 3) / 4
  const classification = model.classification || '—'
  const grid = { flexDirection: 'row', columnGap: SPACE.lg } as const
  return (
    <View>
      <View style={{ height: FORMAL.masthead, flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ width: contentWidth(model.paper) - 110 }}>
          {model.show.degreeInstitution && model.institution ? (
            <Text style={{ ...formal.label, maxLines: 1, textOverflow: 'ellipsis' }}>
              {model.institution}
            </Text>
          ) : null}
          <Text style={{ marginTop: SPACE.xs, fontWeight: 700, fontSize: 20, lineHeight: lh(24, 20), maxLines: 1, textOverflow: 'ellipsis' }}>
            {model.title}
          </Text>
          <Text style={{ marginTop: SPACE.xs, fontSize: 9.5, lineHeight: lh(12, 9.5), color: INK_MUTED }}>Self-reported academic statement</Text>
        </View>
        <Text style={{ marginLeft: SPACE.lg, fontSize: 9.5, lineHeight: lh(12, 9.5), color: INK_MUTED }}>{`Issued ${model.issuedOn}`}</Text>
      </View>

      {(model.show.studentDetails || model.show.degreeInstitution) && (
        <View
          style={{
            ...grid,
            marginTop: SPACE.lg,
            height: FORMAL.meta - SPACE.lg,
            borderTopWidth: 0.75,
            borderTopColor: HAIRLINE,
            paddingTop: SPACE.md,
          }}
        >
          {model.show.studentDetails && <FormalMeta label="Student name" value={model.studentName || '—'} cell={cell} />}
          {model.show.studentDetails && <FormalMeta label="Student ID" value={model.studentId || '—'} cell={cell} />}
          {model.show.degreeInstitution && <FormalMeta label="Degree" value={model.degreeTitle} cell={cell} />}
          {model.show.degreeInstitution && <FormalMeta label="Institution" value={model.institution || '—'} cell={cell} />}
        </View>
      )}

      {model.show.summaryFigures && (
        <View
          style={{
            ...grid,
            marginTop: SPACE.lg,
            height: FORMAL.stats - SPACE.lg,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderTopColor: INK,
            borderBottomColor: INK,
            paddingVertical: SPACE.sm,
          }}
        >
          <FormalStat label="Cumulative GPA" value={model.cgpa != null ? formatGpa(model.cgpa) : '—'} size={20} cell={cell} />
          <FormalStat label="Credits earned" value={formatCredits(model.earnedCredits)} size={20} cell={cell} />
          <FormalStat label="Best semester" value={model.bestSemesterGpa != null ? formatGpa(model.bestSemesterGpa) : '—'} size={20} cell={cell} />
          <FormalStat label="Classification" value={classification} size={singleLineSize(classification, cell, 20, 11, 0.5)} cell={cell} />
        </View>
      )}
    </View>
  )
}

function FormalMeta({ label, value, cell }: { label: string; value: string; cell: number }) {
  return (
    <View style={{ width: cell }}>
      <Text style={formal.label}>{label}</Text>
      <Text style={{ marginTop: SPACE.xs, fontSize: 10.5, lineHeight: lh(13, 10.5), maxLines: 2, textOverflow: 'ellipsis' }}>
        {value}
      </Text>
    </View>
  )
}

function FormalStat({ label, value, size, cell }: { label: string; value: string; size: number; cell: number }) {
  return (
    <View style={{ width: cell }}>
      <Text style={formal.label}>{label}</Text>
      <Text style={{ marginTop: SPACE.xs, fontSize: size, lineHeight: lh(26, size), maxLines: 1, textOverflow: 'ellipsis' }}>
        {value}
      </Text>
    </View>
  )
}

function FormalRunning({ model }: { model: ReportModel }) {
  return (
    <View
      style={{
        height: FORMAL.running,
        marginBottom: SPACE.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 0.75,
        borderBottomColor: HAIRLINE,
        paddingBottom: SPACE.sm,
      }}
    >
      <Text style={{ fontWeight: 700, fontSize: 9.5, lineHeight: lh(14, 9.5), flexShrink: 1, maxLines: 1, textOverflow: 'ellipsis' }}>
        {model.title}
      </Text>
      <Text style={{ marginLeft: SPACE.md, fontSize: 9.5, lineHeight: lh(14, 9.5), color: INK_MUTED }}>
        {`${model.institution ? `${model.institution}, ` : ''}Issued ${model.issuedOn}`}
      </Text>
    </View>
  )
}

function FormalSemester({ semester }: { semester: ReportSemester }) {
  const right = { width: COL.credits, textAlign: 'right' } as const
  return (
    <View style={{ marginTop: FORMAL.semesterGap }} wrap={false}>
      <View
        style={{
          height: FORMAL.head,
          flexDirection: 'row',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: INK,
          paddingBottom: 5,
        }}
      >
        <Text style={{ fontWeight: 700, fontSize: 10.5, lineHeight: lh(16, 10.5), flexShrink: 1, maxLines: 1, textOverflow: 'ellipsis' }}>
          {semester.title}
        </Text>
        <Text style={{ marginLeft: SPACE.md, fontSize: 10.5, lineHeight: lh(16, 10.5) }}>
          {`${semester.gpa != null ? `GPA ${formatGpa(semester.gpa)}` : 'In progress'} | ${formatCredits(semester.credits)} credits`}
        </Text>
      </View>
      <View style={{ height: FORMAL.columns, flexDirection: 'row', paddingTop: 4, paddingBottom: 3 }}>
        <Text style={{ ...formal.label, width: COL.code, marginRight: COL.gap }}>Code</Text>
        <Text style={{ ...formal.label, flexGrow: 1, flexBasis: 0, marginRight: COL.gap }}>Module</Text>
        <Text style={{ ...formal.label, ...right, marginRight: COL.gap }}>Credits</Text>
        <Text style={{ ...formal.label, ...right, marginRight: COL.gap }}>Grade</Text>
        <Text style={{ ...formal.label, ...right }}>Points</Text>
      </View>
      {semester.modules.map((mod) => (
        <View
          key={mod.id}
          style={{
            height: FORMAL.row,
            flexDirection: 'row',
            alignItems: 'center',
            borderTopWidth: 0.75,
            borderTopColor: HAIRLINE,
          }}
        >
          <Text style={{ width: COL.code, marginRight: COL.gap, fontSize: 10.5, maxLines: 1, textOverflow: 'ellipsis' }}>{mod.code}</Text>
          <Text style={{ flexGrow: 1, flexBasis: 0, marginRight: COL.gap, fontSize: 10.5, maxLines: 1, textOverflow: 'ellipsis' }}>{mod.name}</Text>
          <Text style={{ ...right, marginRight: COL.gap, fontSize: 10.5 }}>{formatCredits(mod.credits)}</Text>
          <Text style={{ ...right, marginRight: COL.gap, fontSize: 10.5 }}>{mod.grade}</Text>
          <Text style={{ ...right, fontSize: 10.5 }}>{mod.points != null ? formatGpa(mod.points) : '—'}</Text>
        </View>
      ))}
    </View>
  )
}
