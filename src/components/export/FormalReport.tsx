import type { CSSProperties } from 'react'
import { formatGpa } from '@/lib/score'
import { HAIRLINE, INK, INK_MUTED, PAPER, SPACE } from '@/lib/export/palette'
import { contentWidth, FORMAL, MARGIN, PAGE_PT } from '@/lib/export/layout'
import { formatCredits, type ReportModel, type ReportSemester } from '@/lib/export/reportModel'
import { singleLineSize } from '@/lib/export/copy'
import { DocFooter, DocKey } from './ReportParts'

export const SERIF = '"Source Serif 4", Georgia, serif'
const SANS = 'Instrument Sans, sans-serif'
const NUMERALS: CSSProperties = { fontVariantNumeric: 'lining-nums tabular-nums' }

const COL = { code: 52, credits: 52, grade: 52, points: 52, gap: SPACE.sm } as const

/** Formal report as HTML in pt units: the same numbers the PDF uses. */
export function FormalReport({ model, pageIndex }: { model: ReportModel; pageIndex: number }) {
  const page = model.pages[pageIndex] ?? model.pages[0]
  const size = PAGE_PT[model.paper]
  const semesters = model.semesters.filter((semester) => page?.semesterIds.includes(semester.id))

  return (
    <article
      data-export="formal"
      style={{
        position: 'relative',
        width: `${size.width}pt`,
        height: `${size.height}pt`,
        boxSizing: 'border-box',
        overflow: 'hidden',
        background: PAPER,
        color: INK,
        fontFamily: SERIF,
        fontSize: '10.5pt',
        padding: `${MARGIN}pt`,
        ...NUMERALS,
      }}
    >
      {page?.showIntro ? <Masthead model={model} /> : <RunningHeader model={model} />}
      {model.show.semesterTables && semesters.map((semester) => <SemesterTable key={semester.id} semester={semester} />)}
      {page?.showIntro && model.show.registrarEndorsement && <Endorsement />}
      <DocKey model={model} fontFamily={SERIF} leadFont={SERIF} show={model.show.gradeScale} />
      <DocFooter model={model} pageIndex={pageIndex} fontFamily={SANS} />
    </article>
  )
}

const label: CSSProperties = {
  fontFamily: SANS,
  fontSize: '8pt',
  lineHeight: '10pt',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: INK_MUTED,
}

function Masthead({ model }: { model: ReportModel }) {
  const cell = (contentWidth(model.paper) - SPACE.lg * 3) / 4
  const classification = model.classification || '—'
  return (
    <header>
      <div style={{ height: `${FORMAL.masthead}pt`, display: 'flex', justifyContent: 'space-between', gap: `${SPACE.lg}pt` }}>
        <div style={{ minWidth: 0 }}>
          {model.show.degreeInstitution && model.institution && (
            <p style={{ ...label, margin: 0 }}>{model.institution}</p>
          )}
          <h1
            style={{
              margin: `${SPACE.xs}pt 0 0`,
              fontSize: '20pt',
              lineHeight: '24pt',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: `${contentWidth(model.paper) - 110}pt`,
            }}
          >
            {model.title}
          </h1>
          <p style={{ margin: `${SPACE.xs}pt 0 0`, fontSize: '9.5pt', lineHeight: '12pt', color: INK_MUTED }}>Self-reported academic statement</p>
        </div>
        <p style={{ margin: 0, fontSize: '9.5pt', lineHeight: '12pt', color: INK_MUTED, whiteSpace: 'nowrap' }}>Issued {model.issuedOn}</p>
      </div>

      {(model.show.studentDetails || model.show.degreeInstitution) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            columnGap: `${SPACE.lg}pt`,
            marginTop: `${SPACE.lg}pt`,
            height: `${FORMAL.meta - SPACE.lg}pt`,
            boxSizing: 'border-box',
            borderTop: `0.75pt solid ${HAIRLINE}`,
            paddingTop: `${SPACE.md}pt`,
          }}
        >
          {model.show.studentDetails && <Meta label="Student name" value={model.studentName || '—'} />}
          {model.show.studentDetails && <Meta label="Student ID" value={model.studentId || '—'} />}
          {model.show.degreeInstitution && <Meta label="Degree" value={model.degreeTitle} />}
          {model.show.degreeInstitution && <Meta label="Institution" value={model.institution || '—'} />}
        </div>
      )}

      {model.show.summaryFigures && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            columnGap: `${SPACE.lg}pt`,
            marginTop: `${SPACE.lg}pt`,
            height: `${FORMAL.stats - SPACE.lg}pt`,
            boxSizing: 'border-box',
            borderTop: `1pt solid ${INK}`,
            borderBottom: `1pt solid ${INK}`,
            padding: `${SPACE.sm}pt 0`,
          }}
        >
          <Stat label="Cumulative GPA" value={model.cgpa != null ? formatGpa(model.cgpa) : '—'} size={20} />
          <Stat label="Credits earned" value={formatCredits(model.earnedCredits)} size={20} />
          <Stat label="Best semester" value={model.bestSemesterGpa != null ? formatGpa(model.bestSemesterGpa) : '—'} size={20} />
          <Stat label="Classification" value={classification} size={singleLineSize(classification, cell, 20, 11, 0.5)} />
        </div>
      )}
    </header>
  )
}

function RunningHeader({ model }: { model: ReportModel }) {
  return (
    <div
      style={{
        height: `${FORMAL.running}pt`,
        boxSizing: 'border-box',
        marginBottom: `${SPACE.sm}pt`,
        display: 'flex',
        justifyContent: 'space-between',
        gap: `${SPACE.md}pt`,
        borderBottom: `0.75pt solid ${HAIRLINE}`,
        paddingBottom: `${SPACE.sm}pt`,
        fontSize: '9.5pt',
        lineHeight: '14pt',
      }}
    >
      <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{model.title}</strong>
      <span style={{ color: INK_MUTED, whiteSpace: 'nowrap' }}>
        {model.institution ? `${model.institution}, ` : ''}Issued {model.issuedOn}
      </span>
    </div>
  )
}

const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: `${COL.gap}pt`,
  boxSizing: 'border-box',
}
const num: CSSProperties = { textAlign: 'right', flex: 'none' }

function SemesterTable({ semester }: { semester: ReportSemester }) {
  return (
    <section style={{ marginTop: `${FORMAL.semesterGap}pt` }}>
      <div
        style={{
          height: `${FORMAL.head}pt`,
          boxSizing: 'border-box',
          display: 'flex',
          justifyContent: 'space-between',
          gap: `${SPACE.md}pt`,
          borderBottom: `1pt solid ${INK}`,
          paddingBottom: '5pt',
          fontSize: '10.5pt',
          lineHeight: '16pt',
        }}
      >
        <strong style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{semester.title}</strong>
        <span style={{ whiteSpace: 'nowrap' }}>
          {semester.gpa != null ? `GPA ${formatGpa(semester.gpa)}` : 'In progress'}
          {' | '}
          {formatCredits(semester.credits)} credits
        </span>
      </div>
      <div style={{ ...row, ...label, height: `${FORMAL.columns}pt`, paddingTop: '4pt', paddingBottom: '3pt' }}>
        <span style={{ width: `${COL.code}pt`, flex: 'none' }}>Code</span>
        <span style={{ flex: 1, minWidth: 0 }}>Module</span>
        <span style={{ ...num, width: `${COL.credits}pt` }}>Credits</span>
        <span style={{ ...num, width: `${COL.grade}pt` }}>Grade</span>
        <span style={{ ...num, width: `${COL.points}pt` }}>Points</span>
      </div>
      {semester.modules.map((mod) => (
        <div
          key={mod.id}
          style={{ ...row, height: `${FORMAL.row}pt`, borderTop: `0.75pt solid ${HAIRLINE}`, fontSize: '10.5pt', lineHeight: '14pt' }}
        >
          <span style={{ width: `${COL.code}pt`, flex: 'none', whiteSpace: 'nowrap' }}>{mod.code}</span>
          <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.name}</span>
          <span style={{ ...num, width: `${COL.credits}pt` }}>{formatCredits(mod.credits)}</span>
          <span style={{ ...num, width: `${COL.grade}pt` }}>{mod.grade}</span>
          <span style={{ ...num, width: `${COL.points}pt` }}>{mod.points != null ? formatGpa(mod.points) : '—'}</span>
        </div>
      ))}
    </section>
  )
}

function Endorsement() {
  return (
    <section
      style={{
        marginTop: `${SPACE.lg}pt`,
        height: `${FORMAL.endorse}pt`,
        boxSizing: 'border-box',
        border: `0.75pt solid ${HAIRLINE}`,
        padding: `${SPACE.md}pt`,
      }}
    >
      <p style={{ margin: 0, fontSize: '10.5pt', fontWeight: 700 }}>Registrar endorsement</p>
      <p style={{ margin: `${SPACE.xs}pt 0 ${SPACE.lg}pt`, fontSize: '9pt', color: INK_MUTED }}>Leave blank. This is not a university stamp.</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: `${SPACE.xl}pt` }}>
        <div style={{ flex: 1, borderBottom: `1pt solid ${INK}`, height: `${SPACE.xxl}pt`, fontSize: '9pt', color: INK_MUTED }}>Signature</div>
        <div style={{ width: '48pt', height: '48pt', border: `0.75pt dashed ${HAIRLINE}` }} />
      </div>
    </section>
  )
}

function Meta({ label: text, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={label}>{text}</div>
      <div
        style={{
          marginTop: `${SPACE.xs}pt`,
          fontSize: '10.5pt',
          lineHeight: '13pt',
          maxHeight: '26pt',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function Stat({ label: text, value, size }: { label: string; value: string; size: number }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={label}>{text}</div>
      <div style={{ marginTop: `${SPACE.xs}pt`, fontSize: `${size}pt`, lineHeight: '26pt', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  )
}
