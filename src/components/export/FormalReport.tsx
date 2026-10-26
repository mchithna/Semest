import { formatGpa } from '@/lib/score'
import { HAIRLINE, INK, INK_MUTED, PAPER, PAPER_PX } from '@/lib/export/palette'
import { disclaimer, formatCredits, type ReportModel, type ReportSemester } from '@/lib/export/reportModel'

export function FormalReport({ model, pageIndex }: { model: ReportModel; pageIndex: number }) {
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
        background: PAPER,
        color: INK,
        fontFamily: 'Georgia, "Times New Roman", serif',
        padding: '36px 42px 28px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {page?.showIntro ? <Masthead model={model} showNumbers={showNumbers} /> : <RunningHeader model={model} />}
      {model.show.semesterTables &&
        semesters.map((semester) => <SemesterTable key={semester.id} semester={semester} showNumbers={showNumbers} />)}
      {page?.showIntro && model.show.gradeScale && (
        <p style={{ margin: '8px 0 0', fontSize: 10, lineHeight: 1.45, color: INK_MUTED }}>{model.scaleNote}</p>
      )}
      {page?.showIntro && model.show.registrarEndorsement && <Endorsement />}
      <footer
        style={{
          marginTop: 'auto',
          borderTop: `1px solid ${HAIRLINE}`,
          paddingTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'Instrument Sans, sans-serif',
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

function Masthead({ model, showNumbers }: { model: ReportModel; showNumbers: boolean }) {
  return (
    <header>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
        <div>
          {model.show.degreeInstitution && model.institution && (
            <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK_MUTED }}>
              {model.institution}
            </p>
          )}
          <h1 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, lineHeight: 1.15 }}>{model.title}</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: INK_MUTED }}>Self-reported academic statement</p>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: INK_MUTED, whiteSpace: 'nowrap' }}>Issued {model.issuedOn}</p>
      </div>
      {(model.show.studentDetails || model.show.degreeInstitution) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr 1fr 0.8fr',
            gap: 12,
            marginTop: 18,
            paddingTop: 12,
            borderTop: `1px solid ${HAIRLINE}`,
          }}
        >
          {model.show.studentDetails && <Field label="Student name" value={model.studentName || '—'} />}
          {model.show.studentDetails && <Field label="Student ID" value={model.studentId || '—'} />}
          {model.show.degreeInstitution && <Field label="Degree" value={model.degreeTitle} />}
          {model.show.degreeInstitution && <Field label="Institution" value={model.institution || '—'} />}
        </div>
      )}
      {model.show.summaryFigures && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            marginTop: 14,
            borderTop: `1px solid ${HAIRLINE}`,
            borderBottom: `1px solid ${HAIRLINE}`,
          }}
        >
          <Stat label="Cumulative GPA" value={showNumbers && model.cgpa != null ? formatGpa(model.cgpa) : '—'} />
          <Stat label="Credits earned" value={formatCredits(model.earnedCredits)} />
          <Stat label="Best semester" value={showNumbers && model.bestSemesterGpa != null ? formatGpa(model.bestSemesterGpa) : '—'} />
          <Stat label="Classification" value={model.classification || '—'} last />
        </div>
      )}
    </header>
  )
}

function RunningHeader({ model }: { model: ReportModel }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        borderBottom: `1px solid ${HAIRLINE}`,
        paddingBottom: 8,
        marginBottom: 12,
        fontSize: 11,
      }}
    >
      <strong>{model.title}</strong>
      <span style={{ color: INK_MUTED }}>
        {model.institution ? `${model.institution} · ` : ''}Issued {model.issuedOn}
      </span>
    </div>
  )
}

function SemesterTable({ semester, showNumbers }: { semester: ReportSemester; showNumbers: boolean }) {
  return (
    <section style={{ marginTop: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          borderBottom: `1px solid ${INK}`,
          paddingBottom: 4,
          fontSize: 12,
        }}
      >
        <strong>{semester.title}</strong>
        <span>
          {semester.gpa != null && showNumbers ? `GPA ${formatGpa(semester.gpa)}` : 'In progress'}
          {' | '}
          {formatCredits(semester.credits)} credits
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '64px 1fr 64px 64px 56px',
          gap: 8,
          padding: '6px 0 4px',
          fontFamily: 'Instrument Sans, sans-serif',
          fontSize: 9,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: INK_MUTED,
        }}
      >
        <span>Code</span>
        <span>Module</span>
        <span style={{ textAlign: 'right' }}>Credits</span>
        <span style={{ textAlign: 'right' }}>Grade</span>
        <span style={{ textAlign: 'right' }}>Points</span>
      </div>
      {semester.modules.map((mod) => (
        <div
          key={mod.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '64px 1fr 64px 64px 56px',
            gap: 8,
            padding: '4px 0',
            borderTop: `1px solid ${HAIRLINE}`,
            fontSize: 12,
          }}
        >
          <span>{mod.code}</span>
          <span style={{ overflowWrap: 'anywhere' }}>{mod.name}</span>
          <span style={{ textAlign: 'right' }}>{formatCredits(mod.credits)}</span>
          <span style={{ textAlign: 'right' }}>{mod.grade}</span>
          <span style={{ textAlign: 'right' }}>{mod.points != null && showNumbers ? formatGpa(mod.points) : '—'}</span>
        </div>
      ))}
    </section>
  )
}

function Endorsement() {
  return (
    <section style={{ marginTop: 18, border: `1px solid ${HAIRLINE}`, padding: 12 }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>Registrar endorsement</p>
      <p style={{ margin: '4px 0 16px', fontSize: 10, color: INK_MUTED }}>Leave blank. This is not a university stamp.</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ flex: 1, borderBottom: `1px solid ${INK}`, height: 36, fontSize: 10, color: INK_MUTED }}>Signature</div>
        <div style={{ width: 72, height: 72, border: `1px dashed ${HAIRLINE}` }} />
      </div>
    </section>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'Instrument Sans, sans-serif', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK_MUTED }}>
        {label}
      </div>
      <div style={{ marginTop: 2, fontSize: 13, overflowWrap: 'anywhere' }}>{value}</div>
    </div>
  )
}

function Stat({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ padding: '8px 10px', borderRight: last ? 'none' : `1px solid ${HAIRLINE}` }}>
      <div style={{ fontFamily: 'Instrument Sans, sans-serif', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', color: INK_MUTED }}>
        {label}
      </div>
      <div style={{ marginTop: 2, fontSize: 16 }}>{value}</div>
    </div>
  )
}
