import { formatGpa } from '@/lib/score'
import { HAIRLINE, INK, INK_MUTED, PAPER_PX } from '@/lib/export/palette'
import { disclaimer, formatCredits, type ReportModel } from '@/lib/export/reportModel'
import { ClassRuler } from './ClassRuler'

export function RulerReport({ model, pageIndex }: { model: ReportModel; pageIndex: number }) {
  const page = model.pages[pageIndex] ?? model.pages[0]
  const size = PAPER_PX[model.paper]
  const semesters = model.semesters.filter((semester) => page?.semesterIds.includes(semester.id))
  const showNumbers = !model.hideExactGpa

  return (
    <article
      style={{
        width: size.width,
        height: size.height,
        boxSizing: 'border-box',
        background: '#FFFFFF',
        color: INK,
        fontFamily: 'Instrument Sans, sans-serif',
        padding: '0 48px 32px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ height: 8, margin: '0 -48px 28px', display: 'flex' }}>
        {['#B9C0FF', '#9BD8E2', '#F0D488', '#F7C4B5'].map((color) => (
          <span key={color} style={{ flex: 1, background: color }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Wordmark />
        <span style={{ fontSize: 12, color: INK_MUTED }}>
          {[model.degreeTitle, model.show.degreeInstitution ? model.institution : ''].filter(Boolean).join(', ')}
        </span>
      </div>

      {page?.showIntro && model.show.summaryFigures && (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 28, marginTop: 36 }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, color: INK_MUTED }}>Cumulative GPA</p>
            <p style={{ margin: '2px 0 0', fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 120, lineHeight: 0.86, fontWeight: 700, letterSpacing: '-0.04em' }}>
              {showNumbers && model.cgpa != null ? formatGpa(model.cgpa) : model.classification || '—'}
            </p>
          </div>
          <div style={{ maxWidth: 340, paddingBottom: 12 }}>
            <p style={{ margin: 0, fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 24, fontWeight: 650, lineHeight: 1.15 }}>
              {model.standing || 'No classification yet'}
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.45, color: INK_MUTED }}>
              {[model.nextBand, `${formatCredits(model.earnedCredits)} of ${formatCredits(model.totalCredits)} credits graded.`]
                .filter(Boolean)
                .join(' ')}
            </p>
          </div>
        </div>
      )}

      {page?.showIntro && model.show.studentDetails && (model.studentName || model.studentId) && (
        <p style={{ margin: '12px 0 0', fontSize: 13, color: INK_MUTED }}>
          {[model.studentName, model.studentId].filter(Boolean).join(' · ')}
        </p>
      )}

      {page?.showIntro && model.show.classificationRuler && model.hasClassBands && (
        <div style={{ marginTop: 36 }}>
          <ClassRuler
            track={model.track}
            value={model.cgpa}
            semesterValues={model.semesters.flatMap((semester) => (semester.gpa == null ? [] : [semester.gpa]))}
            target={model.targetCgpa}
            variant="print"
            showNumbers={showNumbers}
            showBandLabels
            youLabel={showNumbers && model.cgpa != null ? `You ${formatGpa(model.cgpa)}` : 'You'}
          />
        </div>
      )}

      {page?.showIntro && !model.hasClassBands && (
        <p style={{ margin: '16px 0 0', fontSize: 12, color: INK_MUTED }}>
          This grade scale has no class bands, so the classification ruler is left out.
        </p>
      )}

      {model.show.semesterTables && (
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {semesters.map((semester) => (
            <div key={semester.id} style={{ display: 'grid', gridTemplateColumns: '210px 1fr 78px', gap: 18, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 650 }}>{semester.title}</div>
                <div style={{ marginTop: 2, fontSize: 12, color: INK_MUTED }}>{formatCredits(semester.credits)} credits</div>
              </div>
              <ClassRuler track={model.track} value={semester.gpa} variant="print" showNumbers={false} marker height={12} />
              <div style={{ textAlign: 'right', fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em' }}>
                {showNumbers && semester.gpa != null ? formatGpa(semester.gpa) : '—'}
              </div>
            </div>
          ))}
        </div>
      )}

      {page?.showIntro && model.show.gradeScale && (
        <p style={{ margin: '16px 0 0', fontSize: 10, lineHeight: 1.4, color: INK_MUTED }}>{model.scaleNote}</p>
      )}

      <footer
        style={{
          marginTop: 'auto',
          borderTop: `1px solid ${HAIRLINE}`,
          paddingTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 9,
          color: INK_MUTED,
        }}
      >
        <span>{disclaimer()}</span>
        <span>
          Page {pageIndex + 1} of {model.pages.length}
        </span>
      </footer>
    </article>
  )
}

function Wordmark() {
  const bars = ['#7C8BFF', '#38B6C9', '#E6B84A', '#F07A5A']
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 8 }}>
      <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 2 }}>
        {bars.map((color, index) => (
          <span key={color} style={{ width: 3, height: 8 + index * 3, borderRadius: 99, background: color }} />
        ))}
      </span>
      <span style={{ fontWeight: 700, fontSize: 16 }}>Semest</span>
    </span>
  )
}
