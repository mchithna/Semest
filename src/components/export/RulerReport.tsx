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
        padding: '36px 42px 28px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Wordmark />
        <span style={{ fontSize: 12, color: INK_MUTED }}>
          {[model.degreeTitle, model.show.degreeInstitution ? model.institution : ''].filter(Boolean).join(', ')}
        </span>
      </div>

      {page?.showIntro && model.show.summaryFigures && (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginTop: 28 }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: INK_MUTED }}>Cumulative GPA</p>
            <p style={{ margin: '4px 0 0', fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 104, lineHeight: 0.9, fontWeight: 700 }}>
              {showNumbers && model.cgpa != null ? formatGpa(model.cgpa) : model.classification || '—'}
            </p>
          </div>
          <div style={{ maxWidth: 280, paddingBottom: 8 }}>
            <p style={{ margin: 0, fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 22, fontWeight: 600, lineHeight: 1.25 }}>
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
        <div style={{ marginTop: 28 }}>
          <ClassRuler
            track={model.track}
            value={model.cgpa}
            semesterValues={model.semesters.flatMap((semester) => (semester.gpa == null ? [] : [semester.gpa]))}
            target={model.targetCgpa}
            variant="print"
            showNumbers={showNumbers}
            showBandLabels
            youLabel={showNumbers && model.cgpa != null ? `You ${formatGpa(model.cgpa)}` : 'You'}
            height={22}
          />
        </div>
      )}

      {page?.showIntro && !model.hasClassBands && (
        <p style={{ margin: '16px 0 0', fontSize: 12, color: INK_MUTED }}>
          This grade scale has no class bands, so the classification ruler is left out.
        </p>
      )}

      {model.show.semesterTables && (
        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {semesters.map((semester) => (
            <div key={semester.id} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 64px', gap: 16, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 650 }}>{semester.title}</div>
                <div style={{ fontSize: 12, color: INK_MUTED }}>{formatCredits(semester.credits)} credits</div>
              </div>
              <ClassRuler
                track={model.track}
                value={semester.gpa}
                variant="print"
                showNumbers={false}
                showBandLabels={false}
                height={8}
              />
              <div style={{ textAlign: 'right', fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 22, fontWeight: 700 }}>
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
