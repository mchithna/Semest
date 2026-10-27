import { formatGpa } from '@/lib/score'
import { HAIRLINE, INK, INK_MUTED, SPACE } from '@/lib/export/palette'
import { bandPaint } from '@/lib/export/rulerStyle'
import { paperMetrics } from '@/lib/export/rulerStyle'
import { rulerGeometry } from '@/lib/export/geometry'
import { contentWidth, headerRightWidth, heroNumeralSize, MARGIN, PAGE_PT, RULER, RULER_STATEMENT_W } from '@/lib/export/layout'
import { degreeLine, formatCredits, studentLine, type ReportModel } from '@/lib/export/reportModel'
import { heroDetail, heroGpa, heroStatement, NO_BANDS_NOTE, rulerSummary } from '@/lib/export/copy'
import { Logo } from '@/components/layout/Logo'
import { ClassRuler, ReportMiniRuler } from './ClassRuler'
import { DocFooter, DocKey } from './ReportParts'

const SANS = 'Instrument Sans, sans-serif'
const DISPLAY = 'Bricolage Grotesque, Instrument Sans, sans-serif'
const NUMERALS = { fontVariantNumeric: 'lining-nums tabular-nums' } as const

/** Ruler report as HTML in pt units: the same numbers the PDF uses, so the preview matches the file. */
export function RulerReport({ model, pageIndex }: { model: ReportModel; pageIndex: number }) {
  const page = model.pages[pageIndex] ?? model.pages[0]
  const size = PAGE_PT[model.paper]
  const semesters = model.semesters.filter((semester) => page?.semesterIds.includes(semester.id))
  const intro = Boolean(page?.showIntro)
  const showRuler = model.show.classificationRuler && model.hasClassBands
  const student = studentLine(model)
  const geo = rulerGeometry(model.track)
  const width = contentWidth(model.paper)

  return (
    <article
      data-export="ruler"
      data-gpa={model.cgpa ?? ''}
      style={{
        position: 'relative',
        width: `${size.width}pt`,
        height: `${size.height}pt`,
        boxSizing: 'border-box',
        overflow: 'hidden',
        background: '#FFFFFF',
        color: INK,
        fontFamily: SANS,
        fontSize: '10pt',
        padding: `${MARGIN}pt`,
        ...NUMERALS,
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${RULER.stripH}pt` }}>
        {model.hasClassBands &&
          geo.bands.map((band) => (
            <span
              key={band.id}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${band.left}%`,
                width: `${band.width}%`,
                background: bandPaint(band, true, 'paper').fill,
              }}
            />
          ))}
      </div>

      <header style={{ height: `${RULER.headerH}pt`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo scale={0.8} unit="pt" color={INK} />
        <div
          style={{
            width: `${headerRightWidth(model.paper)}pt`,
            textAlign: 'right',
            fontSize: '10pt',
            lineHeight: '12pt',
            color: INK_MUTED,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{degreeLine(model)}</div>
          {student && <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{student}</div>}
        </div>
      </header>

      {intro && (
        <>
          <section style={{ marginTop: `${SPACE.xxl}pt`, height: `${RULER.heroH}pt` }}>
            <p style={{ margin: 0, fontSize: '10pt', lineHeight: '12pt', color: INK_MUTED }}>Cumulative GPA</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: `${SPACE.xs}pt` }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: DISPLAY,
                  fontSize: `${heroNumeralSize(heroGpa(model), model.paper)}pt`,
                  lineHeight: `${RULER.heroNumeralLine}pt`,
                  height: `${RULER.heroNumeralLine}pt`,
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  whiteSpace: 'nowrap',
                }}
              >
                {heroGpa(model)}
              </p>
              <div style={{ width: `${RULER_STATEMENT_W}pt`, paddingBottom: `${SPACE.sm}pt` }}>
                <p style={{ margin: 0, fontFamily: DISPLAY, fontSize: '20pt', lineHeight: '24pt', fontWeight: 500 }}>
                  {heroStatement(model)}
                </p>
                <p style={{ margin: `${SPACE.xs}pt 0 0`, fontSize: '10pt', lineHeight: '13pt', color: INK_MUTED }}>{heroDetail(model)}</p>
              </div>
            </div>
          </section>

          {model.show.summaryFigures && (
            <section
              style={{
                marginTop: `${SPACE.xxl}pt`,
                height: `${RULER.summaryH}pt`,
                boxSizing: 'border-box',
                borderTop: `1pt solid ${INK}`,
                paddingTop: `${SPACE.md}pt`,
                display: 'flex',
              }}
            >
              {rulerSummary(model).map((cell) => (
                <div key={cell.label} style={{ flex: 1 }}>
                  <div style={{ fontSize: '9pt', lineHeight: '11pt', color: INK_MUTED }}>{cell.label}</div>
                  <div style={{ marginTop: '2pt', fontFamily: DISPLAY, fontSize: '18pt', lineHeight: '22pt', fontWeight: 600 }}>{cell.value}</div>
                </div>
              ))}
            </section>
          )}

          {showRuler && (
            <section style={{ marginTop: `${SPACE.xxl}pt` }}>
              <ClassRuler
                track={model.track}
                variant="paper"
                metrics={paperMetrics(width)}
                value={model.cgpa}
                youLabel={model.cgpa != null ? `You ${formatGpa(model.cgpa)}` : undefined}
                target={model.targetCgpa}
              />
            </section>
          )}
          {model.show.classificationRuler && !model.hasClassBands && (
            <p style={{ margin: `${SPACE.xxl}pt 0 0`, fontSize: '10pt', lineHeight: '14pt', color: INK_MUTED }}>{NO_BANDS_NOTE}</p>
          )}
        </>
      )}

      {model.show.semesterTables && (
        <section style={{ marginTop: `${SPACE.xxl}pt` }}>
          {semesters.map((semester) => (
            <div
              key={semester.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: `${SPACE.lg}pt`,
                padding: `${RULER.semesterPad}pt 0`,
                boxSizing: 'border-box',
                borderBottom: `0.75pt solid ${HAIRLINE}`,
              }}
            >
              <div style={{ flex: '1.2 1 0', minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '11pt',
                    lineHeight: '14pt',
                    fontWeight: 600,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {semester.title}
                </div>
                <div style={{ marginTop: '2pt', fontSize: '9.5pt', lineHeight: '12pt', color: INK_MUTED }}>
                  {formatCredits(semester.credits)} credits
                </div>
              </div>
              <div style={{ flex: '3 1 0', minWidth: 0 }}>
                {model.hasClassBands ? <ReportMiniRuler track={model.track} value={semester.gpa} unit="pt" /> : null}
              </div>
              <div style={{ width: '64pt', textAlign: 'right', fontFamily: DISPLAY, fontSize: '20pt', lineHeight: '24pt', fontWeight: 600 }}>
                {semester.gpa != null ? formatGpa(semester.gpa) : '—'}
              </div>
            </div>
          ))}
        </section>
      )}

      <DocKey model={model} fontFamily={SANS} show={model.show.gradeScale} />
      <DocFooter model={model} pageIndex={pageIndex} fontFamily={SANS} />
    </article>
  )
}
