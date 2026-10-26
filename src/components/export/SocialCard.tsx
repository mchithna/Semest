import { forwardRef } from 'react'
import { formatGpa } from '@/lib/score'
import { AMBER, NIGHT, SOCIAL_PX } from '@/lib/export/palette'
import { formatCredits, type ReportModel } from '@/lib/export/reportModel'
import { ClassRuler } from './ClassRuler'

export const SocialCard = forwardRef<HTMLElement, { model: ReportModel }>(function SocialCard({ model }, ref) {
  const size = SOCIAL_PX[model.aspect]
  const chips = model.show.semesterTables ? model.semesters : model.semesters.slice(0, 2)
  const showNumbers = !model.hideExactGpa

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
        padding: size.height > 1400 ? 96 : 72,
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
              padding: '8px 16px',
              fontSize: 22,
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

      <div style={{ marginTop: size.height > 1400 ? 120 : 72 }}>
        {model.show.summaryFigures && (
          <>
            <p style={{ margin: 0, fontSize: 28, color: '#A3AAD1' }}>Cumulative GPA</p>
            {showNumbers && model.cgpa != null ? (
              <p
                style={{
                  margin: '8px 0 0',
                  fontFamily: 'Bricolage Grotesque, sans-serif',
                  fontSize: size.height > 1400 ? 220 : 168,
                  lineHeight: 0.9,
                  fontWeight: 700,
                }}
              >
                {formatGpa(model.cgpa)}
              </p>
            ) : null}
            <p
              style={{
                margin: '12px 0 0',
                fontFamily: 'Bricolage Grotesque, sans-serif',
                fontSize: 48,
                fontWeight: 700,
                color: AMBER,
              }}
            >
              {model.classification || 'No class yet'}
            </p>
            {showNumbers && model.distanceToNext && model.nextClass && (
              <p style={{ margin: '8px 0 0', fontSize: 28, color: '#A3AAD1' }}>
                {model.distanceToNext} from {model.nextClass}
              </p>
            )}
          </>
        )}
      </div>

      {model.show.classificationRuler && model.hasClassBands && (
        <div style={{ marginTop: 48 }}>
          <ClassRuler
            track={model.track}
            value={model.cgpa}
            target={model.targetCgpa}
            variant="screen"
            showNumbers={false}
            showBandLabels
            youLabel="You"
            height={28}
          />
        </div>
      )}

      {chips.length > 0 && (
        <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: 20, paddingTop: 48 }}>
          {chips.map((semester) => (
            <div
              key={semester.id}
              style={{
                flex: '1 1 240px',
                background: '#171B3A',
                borderRadius: 24,
                padding: '22px 24px',
              }}
            >
              <div style={{ fontSize: 22, color: '#A3AAD1' }}>{semester.title}</div>
              <div style={{ fontSize: 18, color: '#A3AAD1' }}>{formatCredits(semester.credits)} credits</div>
              {showNumbers && semester.gpa != null && (
                <div style={{ marginTop: 8, fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 48, fontWeight: 700 }}>
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
      <span style={{ fontWeight: 700, fontSize: 32 }}>Semest</span>
    </span>
  )
}
