import { forwardRef, type CSSProperties } from 'react'
import { formatGpa } from '@/lib/score'
import { AMBER, NIGHT, NIGHT_MUTED, NIGHT_RAISED, NIGHT_TEXT, SPACE } from '@/lib/export/palette'
import { SOCIAL, socialChipSlice, socialPlan } from '@/lib/export/layout'
import { nightMetrics } from '@/lib/export/rulerStyle'
import { formatCredits, studentLine, type ReportModel, type ReportSemester } from '@/lib/export/reportModel'
import { Logo } from '@/components/layout/Logo'
import { ClassRuler } from './ClassRuler'

const DISPLAY = 'Bricolage Grotesque, Instrument Sans, sans-serif'
const NUMERALS: CSSProperties = { fontVariantNumeric: 'lining-nums tabular-nums' }

/**
 * Social card. Rendered unscaled at the exact export size. The preview scales a wrapper around it,
 * the PNG capture reads this node directly, so both come from one component.
 */
export const SocialCard = forwardRef<HTMLElement, { model: ReportModel }>(function SocialCard({ model }, ref) {
  const hide = model.hideExactGpa
  const showHero = model.show.summaryFigures
  const showRuler = model.show.classificationRuler && model.hasClassBands
  const chipSource = model.show.semesterTables ? model.semesters : model.semesters.slice(-2)
  const { shown, more } = socialChipSlice(chipSource)
  const student = studentLine(model)
  const mutedLine = !hide && model.distanceToNext && model.nextClass ? `${model.distanceToNext} from ${model.nextClass}` : ''
  const hasTarget = showRuler && model.targetCgpa != null

  const plan = socialPlan({
    aspect: model.aspect,
    chipCount: shown.length,
    hasMore: more > 0,
    hideGpa: hide,
    hasRuler: showRuler,
    showTicks: !hide,
    hasTarget,
    hasStudent: Boolean(student),
    hasMutedLine: Boolean(mutedLine),
    hasHero: showHero,
  })
  const trackWidth = plan.width - plan.margin * 2

  return (
    <article
      ref={ref}
      data-export="social"
      data-gpa={model.cgpa ?? ''}
      style={{
        position: 'relative',
        width: plan.width,
        height: plan.height,
        boxSizing: 'border-box',
        overflow: 'hidden',
        background: NIGHT,
        color: NIGHT_TEXT,
        fontFamily: 'Instrument Sans, sans-serif',
        ...NUMERALS,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: plan.margin,
          right: plan.margin,
          top: plan.top,
          bottom: plan.bottom,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <header style={{ height: plan.header, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.xl }}>
          <Logo scale={2.1} color={NIGHT_TEXT} />
          {model.show.degreeInstitution && model.degreeTitle && (
            <span
              style={{
                boxSizing: 'border-box',
                height: 64,
                maxWidth: 640,
                padding: '0 28px',
                display: 'inline-flex',
                alignItems: 'center',
                border: '2px solid rgba(244, 246, 255, 0.28)',
                borderRadius: 999,
                fontSize: 32,
                fontWeight: 600,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {model.degreeTitle}
            </span>
          )}
        </header>

        {(showHero || student) && (
          <section style={{ height: plan.heroH }}>
            {showHero && (hide ? <HiddenHero model={model} plan={plan} /> : <Hero model={model} plan={plan} mutedLine={plan.showMuted ? mutedLine : ''} />)}
            {student && (
              <p style={{ margin: 0, marginTop: showHero ? SPACE.lg : 0, fontSize: 32, lineHeight: `${SOCIAL.studentLine}px`, color: NIGHT_MUTED }}>
                {student}
              </p>
            )}
          </section>
        )}

        {showRuler && (
          <ClassRuler
            track={model.track}
            variant="night"
            metrics={nightMetrics(trackWidth)}
            value={model.cgpa}
            youLabel="You"
            showTicks={!hide}
            target={model.targetCgpa}
            targetLabel={hide ? 'Target' : undefined}
          />
        )}

        {shown.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: plan.chipGap }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${plan.chipCols}, minmax(0, 1fr))`, gap: plan.chipGap }}>
              {shown.map((semester) => (
                <Chip key={semester.id} semester={semester} plan={plan} hide={hide} trackWidth={trackWidth} />
              ))}
            </div>
            {more > 0 && (
              <div
                style={{
                  boxSizing: 'border-box',
                  height: plan.moreH,
                  borderRadius: 36,
                  border: '2px solid rgba(244, 246, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 30,
                  color: NIGHT_MUTED,
                }}
              >
                +{more} more
              </div>
            )}
          </section>
        )}
      </div>
    </article>
  )
})

function Hero({ model, plan, mutedLine }: { model: ReportModel; plan: ReturnType<typeof socialPlan>; mutedLine: string }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: SOCIAL.label, lineHeight: `${SOCIAL.labelLine}px`, color: NIGHT_MUTED }}>Cumulative GPA</p>
      <p
        style={{
          margin: 0,
          marginTop: SPACE.lg,
          height: plan.numeralLine,
          fontFamily: DISPLAY,
          fontSize: plan.numeral,
          lineHeight: `${plan.numeralLine}px`,
          fontWeight: 700,
          letterSpacing: '-0.03em',
          whiteSpace: 'nowrap',
        }}
      >
        {model.cgpa != null ? formatGpa(model.cgpa) : '—'}
      </p>
      <p
        style={{
          margin: 0,
          marginTop: SPACE.lg,
          fontFamily: DISPLAY,
          fontSize: plan.classSize,
          lineHeight: `${plan.classLine}px`,
          fontWeight: 600,
          color: AMBER,
          whiteSpace: 'nowrap',
        }}
      >
        {model.classification || 'No class yet'}
      </p>
      {mutedLine && (
        <p style={{ margin: 0, marginTop: SPACE.sm, fontSize: SOCIAL.mutedSize, lineHeight: `${SOCIAL.mutedLine}px`, color: NIGHT_MUTED }}>
          {mutedLine}
        </p>
      )}
    </div>
  )
}

/** Hide exact GPA: class name only, no numeral anywhere. */
function HiddenHero({ model, plan }: { model: ReportModel; plan: ReturnType<typeof socialPlan> }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: SOCIAL.label, lineHeight: `${SOCIAL.labelLine}px`, color: NIGHT_MUTED }}>Classification</p>
      <p
        style={{
          margin: 0,
          marginTop: SPACE.lg,
          height: plan.hiddenClassLine * 2,
          fontFamily: DISPLAY,
          fontSize: plan.hiddenClassSize,
          lineHeight: `${plan.hiddenClassLine}px`,
          fontWeight: 700,
          letterSpacing: '-0.03em',
          color: AMBER,
        }}
      >
        {model.classification || 'No class yet'}
      </p>
    </div>
  )
}

function Chip({
  semester,
  plan,
  hide,
  trackWidth,
}: {
  semester: ReportSemester
  plan: ReturnType<typeof socialPlan>
  hide: boolean
  trackWidth: number
}) {
  const inner = (trackWidth - plan.chipGap * (plan.chipCols - 1)) / plan.chipCols - plan.chipPadX * 2
  const className = semester.className ?? 'In progress'
  const classSize = Math.min(40, Math.floor(inner / (className.length * 0.54)))
  return (
    <div
      style={{
        boxSizing: 'border-box',
        height: plan.chipH,
        padding: `${plan.chipPadY}px ${plan.chipPadX}px`,
        borderRadius: 36,
        background: NIGHT_RAISED,
        overflow: 'hidden',
      }}
    >
      <div style={{ fontSize: plan.chipLabel, lineHeight: '36px', color: NIGHT_MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {semester.title}
      </div>
      {plan.chipCredits && (
        <div style={{ marginTop: SPACE.xs, fontSize: SOCIAL.chipCreditsSize, lineHeight: `${SOCIAL.chipCreditsLine}px`, color: NIGHT_MUTED }}>
          {formatCredits(semester.credits)} credits
        </div>
      )}
      <div
        style={{
          marginTop: SPACE.sm,
          height: hide ? 48 : plan.chipGpa,
          fontFamily: DISPLAY,
          fontSize: hide ? classSize : plan.chipGpa,
          lineHeight: `${hide ? 48 : plan.chipGpa}px`,
          fontWeight: hide ? 600 : 700,
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
        }}
      >
        {hide ? className : semester.gpa != null ? formatGpa(semester.gpa) : '—'}
      </div>
    </div>
  )
}
