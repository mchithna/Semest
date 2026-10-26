import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatGpa } from '@/lib/score'
import { BAND_PRINT, BAND_SCREEN } from '@/lib/export/palette'
import { disclaimer, formatCredits, type ReportModel, type ReportSemester } from '@/lib/export/reportModel'
import { markerPercent } from '@/lib/bands'

/**
 * PDFs use @react-pdf/renderer, which is already in the app, so the file is vector text
 * with selectable copy and real A4 or Letter pages. The HTML templates are the preview;
 * both sides read the same ReportModel, including the page splits.
 */

const formal = StyleSheet.create({
  page: { padding: 36, fontFamily: 'Times-Roman', fontSize: 10, color: '#14213D', backgroundColor: '#FDFCF9' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  kicker: { fontSize: 8, color: '#5A6483', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { fontSize: 18, marginTop: 4, fontFamily: 'Times-Bold' },
  muted: { fontSize: 9, color: '#5A6483', marginTop: 3 },
  meta: { flexDirection: 'row', marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#D5D8E2' },
  metaItem: { flexGrow: 1, flexBasis: 0, paddingRight: 8 },
  stats: { flexDirection: 'row', marginTop: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#D5D8E2' },
  stat: { flexGrow: 1, flexBasis: 0, paddingVertical: 6, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#D5D8E2' },
  statLast: { borderRightWidth: 0 },
  statLabel: { fontSize: 7, color: '#5A6483', textTransform: 'uppercase' },
  statValue: { fontSize: 12, marginTop: 2 },
  semester: { marginTop: 12 },
  semesterHead: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#14213D', paddingBottom: 3 },
  columns: { flexDirection: 'row', marginTop: 4 },
  module: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#D5D8E2', paddingVertical: 3 },
  code: { width: 52 },
  name: { flexGrow: 1, flexBasis: 0 },
  num: { width: 48, textAlign: 'right' },
  note: { marginTop: 8, fontSize: 8, color: '#5A6483' },
  endorse: { marginTop: 12, borderWidth: 1, borderColor: '#D5D8E2', padding: 8 },
  sign: { marginTop: 16, borderBottomWidth: 1, borderBottomColor: '#14213D', width: 180, height: 18 },
  footer: { position: 'absolute', left: 36, right: 36, bottom: 22, borderTopWidth: 1, borderTopColor: '#D5D8E2', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#5A6483', fontFamily: 'Helvetica' },
  running: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#D5D8E2', paddingBottom: 6, marginBottom: 8 },
})

const ruler = StyleSheet.create({
  page: { padding: 36, fontFamily: 'Helvetica', fontSize: 10, color: '#14213D', backgroundColor: '#FFFFFF' },
  kicker: { fontSize: 9, color: '#5A6483' },
  gpa: { fontSize: 54, fontFamily: 'Helvetica-Bold', marginTop: 2 },
  standing: { fontSize: 14, fontFamily: 'Helvetica-Bold', maxWidth: 220 },
  muted: { fontSize: 9, color: '#5A6483', marginTop: 4 },
  barRow: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 16 },
  ticks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
  tick: { fontSize: 8, color: '#5A6483' },
  semester: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  semesterGpa: { width: 48, textAlign: 'right', fontFamily: 'Helvetica-Bold', fontSize: 12 },
  semesterName: { width: 150 },
  footer: { position: 'absolute', left: 36, right: 36, bottom: 22, borderTopWidth: 1, borderTopColor: '#D5D8E2', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#5A6483' },
})

function pageSize(model: ReportModel) {
  return model.paper === 'LETTER' ? 'LETTER' : 'A4'
}

export function FormalPdf({ model }: { model: ReportModel }) {
  return (
    <Document title={model.title}>
      {model.pages.map((page) => {
        const semesters = model.semesters.filter((semester) => page.semesterIds.includes(semester.id))
        return (
          <Page key={page.index} size={pageSize(model)} style={formal.page}>
            {page.showIntro ? <FormalMasthead model={model} /> : <FormalRunning model={model} />}
            {model.show.semesterTables && semesters.map((semester) => <FormalSemester key={semester.id} semester={semester} />)}
            {page.showIntro && model.show.gradeScale && <Text style={formal.note}>{model.scaleNote}</Text>}
            {page.showIntro && model.show.registrarEndorsement && (
              <View style={formal.endorse}>
                <Text style={{ fontFamily: 'Times-Bold' }}>Registrar endorsement</Text>
                <Text style={formal.muted}>Leave blank. This is not a university stamp.</Text>
                <View style={formal.sign} />
              </View>
            )}
            <View style={formal.footer}>
              <Text>{disclaimer()}</Text>
              <Text>{`Page ${page.index + 1} of ${model.pages.length}`}</Text>
            </View>
          </Page>
        )
      })}
    </Document>
  )
}

function FormalMasthead({ model }: { model: ReportModel }) {
  return (
    <View>
      <View style={formal.row}>
        <View>
          {model.show.degreeInstitution && model.institution ? <Text style={formal.kicker}>{model.institution}</Text> : null}
          <Text style={formal.title}>{model.title}</Text>
          <Text style={formal.muted}>Self-reported academic statement</Text>
        </View>
        <Text style={formal.muted}>{`Issued ${model.issuedOn}`}</Text>
      </View>
      {(model.show.studentDetails || model.show.degreeInstitution) && (
        <View style={formal.meta}>
          {model.show.studentDetails && <Meta label="Student name" value={model.studentName || '—'} />}
          {model.show.studentDetails && <Meta label="Student ID" value={model.studentId || '—'} />}
          {model.show.degreeInstitution && <Meta label="Degree" value={model.degreeTitle} />}
          {model.show.degreeInstitution && <Meta label="Institution" value={model.institution || '—'} />}
        </View>
      )}
      {model.show.summaryFigures && (
        <View style={formal.stats}>
          <Stat label="Cumulative GPA" value={model.cgpa != null ? formatGpa(model.cgpa) : '—'} />
          <Stat label="Credits earned" value={formatCredits(model.earnedCredits)} />
          <Stat label="Best semester" value={model.bestSemesterGpa != null ? formatGpa(model.bestSemesterGpa) : '—'} />
          <Stat label="Classification" value={model.classification || '—'} last />
        </View>
      )}
    </View>
  )
}

function FormalRunning({ model }: { model: ReportModel }) {
  return (
    <View style={formal.running}>
      <Text style={{ fontFamily: 'Times-Bold' }}>{model.title}</Text>
      <Text style={formal.muted}>{`${model.institution ? `${model.institution} · ` : ''}Issued ${model.issuedOn}`}</Text>
    </View>
  )
}

function FormalSemester({ semester }: { semester: ReportSemester }) {
  return (
    <View style={formal.semester} wrap={false}>
      <View style={formal.semesterHead}>
        <Text style={{ fontFamily: 'Times-Bold' }}>{semester.title}</Text>
        <Text>
          {semester.gpa != null ? `GPA ${formatGpa(semester.gpa)}` : 'In progress'}
          {` | ${formatCredits(semester.credits)} credits`}
        </Text>
      </View>
      <View style={formal.columns}>
        <Text style={formal.code}>Code</Text>
        <Text style={formal.name}>Module</Text>
        <Text style={formal.num}>Credits</Text>
        <Text style={formal.num}>Grade</Text>
        <Text style={formal.num}>Points</Text>
      </View>
      {semester.modules.map((mod) => (
        <View key={mod.id} style={formal.module}>
          <Text style={formal.code}>{mod.code}</Text>
          <Text style={formal.name}>{mod.name}</Text>
          <Text style={formal.num}>{formatCredits(mod.credits)}</Text>
          <Text style={formal.num}>{mod.grade}</Text>
          <Text style={formal.num}>{mod.points != null ? formatGpa(mod.points) : '—'}</Text>
        </View>
      ))}
    </View>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={formal.metaItem}>
      <Text style={formal.kicker}>{label}</Text>
      <Text style={{ marginTop: 2 }}>{value}</Text>
    </View>
  )
}

function Stat({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={last ? [formal.stat, formal.statLast] : formal.stat}>
      <Text style={formal.statLabel}>{label}</Text>
      <Text style={formal.statValue}>{value}</Text>
    </View>
  )
}

export function RulerPdf({ model }: { model: ReportModel }) {
  return (
    <Document title={model.title}>
      {model.pages.map((page) => {
        const semesters = model.semesters.filter((semester) => page.semesterIds.includes(semester.id))
        return (
          <Page key={page.index} size={pageSize(model)} style={ruler.page}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Semest</Text>
              <Text style={ruler.kicker}>
                {[model.degreeTitle, model.show.degreeInstitution ? model.institution : ''].filter(Boolean).join(', ')}
              </Text>
            </View>
            {page.showIntro && model.show.summaryFigures && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
                <View>
                  <Text style={ruler.kicker}>Cumulative GPA</Text>
                  <Text style={ruler.gpa}>{model.cgpa != null ? formatGpa(model.cgpa) : '—'}</Text>
                </View>
                <View>
                  <Text style={ruler.standing}>{model.standing || 'No classification yet'}</Text>
                  <Text style={ruler.muted}>
                    {[model.nextBand, `${formatCredits(model.earnedCredits)} of ${formatCredits(model.totalCredits)} credits graded.`]
                      .filter(Boolean)
                      .join(' ')}
                  </Text>
                </View>
              </View>
            )}
            {page.showIntro && model.show.studentDetails && (model.studentName || model.studentId) && (
              <Text style={ruler.muted}>{[model.studentName, model.studentId].filter(Boolean).join(' · ')}</Text>
            )}
            {page.showIntro && model.show.classificationRuler && model.hasClassBands && <RulerBar model={model} value={model.cgpa} />}
            {page.showIntro && !model.hasClassBands && (
              <Text style={ruler.muted}>This grade scale has no class bands, so the classification ruler is left out.</Text>
            )}
            {model.show.semesterTables &&
              semesters.map((semester) => (
                <View key={semester.id} style={ruler.semester} wrap={false}>
                  <View style={ruler.semesterName}>
                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>{semester.title}</Text>
                    <Text style={ruler.kicker}>{`${formatCredits(semester.credits)} credits`}</Text>
                  </View>
                  <View style={{ flexGrow: 1 }}>
                    <MiniBar model={model} value={semester.gpa} />
                  </View>
                  <Text style={ruler.semesterGpa}>{semester.gpa != null ? formatGpa(semester.gpa) : '—'}</Text>
                </View>
              ))}
            {page.showIntro && model.show.gradeScale && <Text style={[ruler.muted, { marginTop: 10 }]}>{model.scaleNote}</Text>}
            <View style={ruler.footer}>
              <Text>{disclaimer()}</Text>
              <Text>{`Page ${page.index + 1} of ${model.pages.length}`}</Text>
            </View>
          </Page>
        )
      })}
    </Document>
  )
}

function RulerBar({ model, value }: { model: ReportModel; value: number | null }) {
  const span = model.track.max - model.track.min
  const ticks = [...model.track.bands.map((band) => band.min), model.track.max]
  return (
    <View style={{ marginTop: 8 }}>
      <View style={ruler.barRow}>
        {model.track.bands.map((band) => {
          const reached = value == null || value + 0.0001 >= band.min
          return (
            <View
              key={band.id}
              style={{
                flexGrow: span > 0 ? Math.max(band.max - band.min, 0.01) : 1,
                backgroundColor: BAND_PRINT[band.tone],
                opacity: reached ? 1 : 0.35,
                height: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 7 }}>{band.label}</Text>
            </View>
          )
        })}
      </View>
      {value != null && (
        <Text style={{ fontSize: 8, marginTop: 2 }}>{`You ${formatGpa(value)} · ${Math.round(markerPercent(value, model.track))}% along the scale`}</Text>
      )}
      <View style={ruler.ticks}>
        {ticks.map((tick, index) => (
          <Text key={`${tick}-${index}`} style={ruler.tick}>
            {formatGpa(tick)}
          </Text>
        ))}
      </View>
    </View>
  )
}

function MiniBar({ model, value }: { model: ReportModel; value: number | null }) {
  const span = model.track.max - model.track.min
  return (
    <View style={{ flexDirection: 'row', height: 6, borderRadius: 4, overflow: 'hidden' }}>
      {model.track.bands.map((band) => (
        <View
          key={band.id}
          style={{
            flexGrow: span > 0 ? Math.max(band.max - band.min, 0.01) : 1,
            backgroundColor: value != null && value + 0.0001 < band.min ? BAND_SCREEN[band.tone] : BAND_PRINT[band.tone],
            opacity: value != null && value + 0.0001 < band.min ? 0.35 : 1,
            height: 6,
          }}
        />
      ))}
    </View>
  )
}
