import { Document, Font, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import displayUrl from '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff?url'
import sansUrl from '@fontsource/instrument-sans/files/instrument-sans-latin-400-normal.woff?url'
import sansBoldUrl from '@fontsource/instrument-sans/files/instrument-sans-latin-600-normal.woff?url'

Font.register({ family: 'SemestDisplay', src: displayUrl })
Font.register({
  family: 'SemestSans',
  fonts: [
    { src: sansUrl, fontWeight: 400 },
    { src: sansBoldUrl, fontWeight: 600 },
  ],
})
Font.registerHyphenationCallback((word) => [word])
import { formatGpa } from '@/lib/score'
import { BAND_PRINT } from '@/lib/export/palette'
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
  page: { paddingTop: 28, paddingBottom: 40, paddingHorizontal: 40, fontFamily: 'SemestSans', fontSize: 10, color: '#14213D', backgroundColor: '#FFFFFF' },
  stripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 8, flexDirection: 'row' },
  kicker: { fontSize: 10, color: '#5A6483' },
  gpa: { fontSize: 78, fontFamily: 'SemestDisplay', marginTop: 2, letterSpacing: -1.5 },
  standing: { fontSize: 16, fontFamily: 'SemestDisplay', maxWidth: 260 },
  muted: { fontSize: 10, color: '#5A6483', marginTop: 6, maxWidth: 250 },
  ticks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  tick: { fontSize: 8, color: '#5A6483' },
  semester: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  semesterGpa: { width: 64, textAlign: 'right', fontFamily: 'SemestDisplay', fontSize: 20 },
  semesterName: { width: 150 },
  footer: { position: 'absolute', left: 40, right: 40, bottom: 22, borderTopWidth: 1, borderTopColor: '#D5D8E2', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#5A6483' },
  pill: { position: 'absolute', top: 0, width: 86, marginLeft: -43, backgroundColor: '#14213D', borderRadius: 8, paddingVertical: 4 },
  pillText: { color: '#FDFCF9', fontSize: 9, textAlign: 'center', fontFamily: 'SemestSans', fontWeight: 600 },
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
            <View style={ruler.stripe}>
              {['#B9C0FF', '#9BD8E2', '#F0D488', '#F7C4B5'].map((color) => (
                <View key={color} style={{ flexGrow: 1, backgroundColor: color, height: 8 }} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <PdfWordmark />
              <Text style={ruler.kicker}>
                {[model.degreeTitle, model.show.degreeInstitution ? model.institution : ''].filter(Boolean).join(', ')}
              </Text>
            </View>
            {page.showIntro && model.show.summaryFigures && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 22 }}>
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
                    <Text style={{ fontFamily: 'SemestSans', fontWeight: 600 }}>{semester.title}</Text>
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

const MARK_COLORS = ['#7C8BFF', '#38B6C9', '#E6B84A', '#F07A5A']

function PdfWordmark() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      {MARK_COLORS.map((color, index) => (
        <View key={color} style={{ width: 3, height: 7 + index * 3, backgroundColor: color, borderRadius: 2, marginRight: 2 }} />
      ))}
      <Text style={{ fontFamily: 'SemestDisplay', fontSize: 13, marginLeft: 4 }}>Semest</Text>
    </View>
  )
}

function RulerBar({ model, value }: { model: ReportModel; value: number | null }) {
  const span = model.track.max - model.track.min
  const ticks = [...model.track.bands.map((band) => band.min), model.track.max]
  const percent = value == null ? 0 : markerPercent(value, model.track)
  return (
    <View style={{ marginTop: 22, position: 'relative' }}>
      {value != null && (
        <View style={[ruler.pill, { left: `${percent}%` }]}>
          <Text style={ruler.pillText}>{`You ${formatGpa(value)}`}</Text>
        </View>
      )}
      {value != null && (
        <View style={{ position: 'absolute', left: `${percent}%`, top: 16, marginLeft: -0.5, width: 1.5, height: 6, backgroundColor: '#14213D' }} />
      )}
      <View style={{ flexDirection: 'row', height: 22, borderRadius: 11, overflow: 'hidden', marginTop: 22 }}>
        {model.track.bands.map((band) => {
          const reached = value == null || value + 0.0001 >= band.min
          const share = span > 0 ? (band.max - band.min) / span : 1
          return (
            <View
              key={band.id}
              style={{
                flexGrow: span > 0 ? Math.max(band.max - band.min, 0.01) : 1,
                height: 22,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  backgroundColor: BAND_PRINT[band.tone],
                  opacity: reached ? 1 : 0.4,
                }}
              />
              {band.label && share >= 0.1 ? <Text style={{ fontSize: 8, color: '#1C2438' }}>{band.label}</Text> : null}
            </View>
          )
        })}
      </View>
      {model.semesters.map((semester) =>
        semester.gpa == null ? null : (
          <View
            key={semester.id}
            style={{
              position: 'absolute',
              left: `${markerPercent(semester.gpa, model.track)}%`,
              top: 40,
              marginLeft: -3,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#14213D',
              borderWidth: 1,
              borderColor: '#FFFFFF',
            }}
          />
        ),
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
  const percent = value == null ? 0 : markerPercent(value, model.track)
  return (
    <View style={{ position: 'relative', height: 14, justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden' }}>
        {model.track.bands.map((band) => {
          const reached = value == null || value + 0.0001 >= band.min
          return (
            <View
              key={band.id}
              style={{
                flexGrow: span > 0 ? Math.max(band.max - band.min, 0.01) : 1,
                backgroundColor: BAND_PRINT[band.tone],
                opacity: reached ? 1 : 0.4,
                height: 8,
              }}
            />
          )
        })}
      </View>
      {value != null && (
        <View
          style={{
            position: 'absolute',
            left: `${percent}%`,
            top: 1,
            marginLeft: -5,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: '#14213D',
            borderWidth: 1.5,
            borderColor: '#FFFFFF',
          }}
        />
      )}
    </View>
  )
}
