import { forwardRef } from 'react'
import { formatGpa } from '@/lib/score'
import { AMBER, NIGHT, SOCIAL_PX } from '@/lib/export/palette'
import { formatCredits, type ReportModel } from '@/lib/export/reportModel'
import { ClassRuler } from './ClassRuler'

export const SocialCard = forwardRef<HTMLElement, { model: ReportModel }>(function SocialCard({ model }, ref) {
  const size = SOCIAL_PX[model.aspect]
  const tall = model.aspect === '9:16'
  const chips = model.show.semesterTables ? model.semesters : model.semesters.slice(0, 2)
  const showNumbers = !model.hideExactGpa
  const gpaSize = tall ? 248 : model.aspect === '1:1' ? 176 : 210

  return (
    <article
      ref={ref}
      style={{
        width: size.width,
        height: size.height,
        boxSizing: 'border-box',
        background: NIGHT,
        color: '#E6E9F7',
        fontFamily: 'Instrument Sans, sans-serif',
        padding: tall ? 88 : 76,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Wordmark />
        {model.show.degreeInstitution && (
          <span
            style={{
              border: '1px solid rgba(230,233,247,0.24)',
              borderRadius: 999,
              padding: '12px 22px',
              fontSize: 26,
              fontWeight: 650,
            }}
          >
            {model.degreeTitle}
          </span>
        )}
      </div>

      {model.show.studentDetails && (model.studentName || model.studentId) && (
        <p style={{ margin: '28px 0 0', fontSize: 24, color: '#A3AAD1' }}>
          {[model.studentName, model.studentId].filter(Boolean).join(' · ')}
        </p>
      )}

      <div style={{ marginTop: tall ? 96 : 64 }}>
        {model.show.summaryFigures && (
          <>
            <p style={{ margin: 0, fontSize: 30, color: '#A3AAD1' }}>Cumulative GPA</p>
            {showNumbers && model.cgpa != null ? (
              <p
                style={{
                  margin: '4px 0 0',
                  fontFamily: 'Bricolage Grotesque, sans-serif',
                  fontSize: gpaSize,
                  lineHeight: 0.86,
                  fontWeight: 700,
                  letterSpacing: '-0.045em',
                }}
              >
                {formatGpa(model.cgpa)}
              </p>
            ) : null}
            <p
              style={{
                margin: '10px 0 0',
                fontFamily: 'Bricolage Grotesque, sans-serif',
                fontSize: tall ? 64 : 52,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: AMBER,
              }}
            >
              {model.classification || 'No class yet'}
            </p>
            {showNumbers && model.distanceToNext && model.nextClass && (
              <p style={{ margin: '10px 0 0', fontSize: 30, color: '#A3AAD1' }}>
                {model.distanceToNext} from {model.nextClass}
              </p>
            )}
          </>
        )}
      </div>

      {model.show.classificationRuler && model.hasClassBands && (
        <div style={{ marginTop: tall ? 36 : 20 }}>
          <ClassRuler
            track={model.track}
            value={model.cgpa}
            target={model.targetCgpa}
            variant="screen"
            showNumbers={false}
            showBandLabels
            youLabel="You"
          />
        </div>
      )}

      {chips.length > 0 && (
        <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: 24, paddingTop: 56 }}>
          {chips.map((semester) => (
            <div
              key={semester.id}
              style={{
                flex: '1 1 280px',
                background: '#171B3A',
                borderRadius: 28,
                padding: '28px 30px 24px',
              }}
            >
              <div style={{ fontSize: 26, color: '#A3AAD1' }}>{semester.title}</div>
              <div style={{ marginTop: 4, fontSize: 20, color: '#A3AAD1' }}>{formatCredits(semester.credits)} credits</div>
              {showNumbers && semester.gpa != null && (
                <div style={{ marginTop: 12, fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 64, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {formatGpa(semester.gpa)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </article>
  )
})

function Wordmark() {
  const bars = ['#7C8BFF', '#38B6C9', '#E6B84A', '#F07A5A']
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 3 }}>
        {bars.map((color, index) => (
          <span key={color} style={{ width: 6, height: 14 + index * 6, borderRadius: 99, background: color }} />
        ))}
      </span>
      <span style={{ fontWeight: 700, fontSize: 36 }}>Semest</span>
    </span>
  )
}
