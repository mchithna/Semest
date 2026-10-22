import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { DegreeWithScale } from '@/lib/queries/degrees'
import type { SemesterWithModules } from '@/lib/queries/semesters'
import type { PdfExportOptions } from './PdfTemplates'
import { computeScore, formatGpa, hasGradedWork, totalCredits } from '@/lib/score'
import { compareSemesters } from '@/lib/semesterOrder'
import { bandsForScale, markerPercent, type BandTone } from '@/lib/bands'

// Register standard fonts
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf', fontWeight: 'normal' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica-bold@1.0.4/Helvetica-Bold.ttf', fontWeight: 'bold' },
  ]
})

const BAND_FILL: Record<BandTone, string> = {
  pass: '#5B6CFF',
  'second-lower': '#38B6C9',
  'second-upper': '#E6B84A',
  first: '#F07A5A',
  plain: '#D6D3D1',
}

const getThemeStyles = (theme: 'official' | 'modern' | 'executive') => {
  const isModern = theme === 'modern'
  const isExecutive = theme === 'executive'
  const ink = '#1C1915'
  const muted = '#8A847C'
  const line = '#E6E1D6'
  const paper = isModern ? '#FFFFFF' : '#FBF8F3'

  return StyleSheet.create({
    page: {
      padding: isExecutive ? 28 : 36,
      fontSize: isExecutive ? 8 : 9,
      fontFamily: 'Helvetica',
      backgroundColor: paper,
      color: ink,
    },
    header: {
      borderBottomWidth: 1,
      borderBottomColor: line,
      paddingBottom: 10,
      marginBottom: 12,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    title: {
      fontSize: isExecutive ? 13 : 16,
      fontFamily: 'Helvetica-Bold',
      color: ink,
    },
    subtitle: {
      fontSize: 8,
      color: muted,
      marginTop: 3,
      textTransform: 'uppercase',
    },
    badge: {
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: line,
      color: muted,
      fontSize: 7,
      textTransform: 'uppercase',
    },
    studentMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
      paddingTop: 8,
    },
    metaItem: {
      flexDirection: 'column',
    },
    metaLabel: {
      fontSize: 7,
      color: muted,
      textTransform: 'uppercase',
    },
    metaValue: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: ink,
      marginTop: 1,
    },
    statsRow: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: line,
      marginBottom: 14,
    },
    statCard: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRightWidth: 1,
      borderRightColor: line,
    },
    statCardLast: {
      borderRightWidth: 0,
    },
    statLabel: {
      fontSize: 7,
      color: muted,
      textTransform: 'uppercase',
    },
    statValueCgpa: {
      fontSize: isExecutive ? 12 : 14,
      fontFamily: 'Helvetica-Bold',
      color: isModern ? '#5B6CFF' : ink,
      marginTop: 2,
    },
    statValueCredits: {
      fontSize: isExecutive ? 12 : 14,
      fontFamily: 'Helvetica-Bold',
      color: isModern ? '#38B6C9' : ink,
      marginTop: 2,
    },
    statValueBest: {
      fontSize: isExecutive ? 12 : 14,
      fontFamily: 'Helvetica-Bold',
      color: isModern ? '#E6B84A' : ink,
      marginTop: 2,
    },
    statValueSems: {
      fontSize: isExecutive ? 12 : 14,
      fontFamily: 'Helvetica-Bold',
      color: isModern ? '#F07A5A' : ink,
      marginTop: 2,
    },
    rulerBox: {
      marginBottom: 14,
    },
    rulerTitle: {
      fontSize: 8,
      color: muted,
      marginBottom: 6,
    },
    rulerTrack: {
      flexDirection: 'row',
      height: 7,
      borderRadius: 4,
      overflow: 'hidden',
    },
    rulerLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 3,
    },
    rulerLabel: {
      fontSize: 7,
      color: muted,
    },
    targetGoalBox: {
      paddingVertical: 6,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: line,
      marginBottom: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    targetGoalText: {
      fontSize: 8,
      color: ink,
    },
    semesterCard: {
      marginBottom: 12,
    },
    semesterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: line,
      paddingBottom: 4,
      marginBottom: 2,
    },
    semesterTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: ink,
    },
    semesterMeta: {
      fontSize: 8,
      color: ink,
    },
    tableHeader: {
      flexDirection: 'row',
      paddingVertical: 3,
    },
    tableRow: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: line,
      paddingVertical: 4,
      alignItems: 'center',
    },
    thIndex: { width: 24, fontSize: 7, color: muted, fontFamily: 'Helvetica-Bold' },
    thName: { flex: 1, fontSize: 7, color: muted, fontFamily: 'Helvetica-Bold' },
    thCredits: { width: 45, textAlign: 'center', fontSize: 7, color: muted, fontFamily: 'Helvetica-Bold' },
    thGrade: { width: 45, textAlign: 'right', fontSize: 7, color: muted, fontFamily: 'Helvetica-Bold' },
    tdIndex: { width: 24, fontSize: 8, color: muted },
    tdName: { flex: 1, fontSize: 8, color: ink },
    tdCredits: { width: 45, textAlign: 'center', fontSize: 8, color: ink },
    tdGrade: { width: 45, textAlign: 'right', fontSize: 8, color: ink },
    footer: {
      marginTop: 16,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: line,
      fontSize: 7,
      color: muted,
    },
  })
}

type ReactPdfDocumentProps = {
  degree: DegreeWithScale
  semesters: SemesterWithModules[]
  metrics: {
    cgpa: number
    earnedCredits: number
    highestGpa: number
    standing: string
  }
  options: PdfExportOptions
}

function formatCount(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export const ReactPdfDocument: React.FC<ReactPdfDocumentProps> = ({
  degree,
  semesters,
  metrics,
  options,
}) => {
  const sortedSemesters = [...semesters].sort(compareSemesters)
  const gradeScale = degree.grade_scale?.grades || []
  const styles = getThemeStyles(options.theme)
  const track = bandsForScale(gradeScale)
  const gradedCount = semesters.filter((semester) => hasGradedWork(semester.modules, gradeScale)).length
  const generatedOn = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const rulerTicks = [...track.bands.map((band) => band.min), track.max]

  return (
    <Document title={options.reportTitle || degree.title}>
      <Page size={options.pageSize === 'LETTER' ? 'LETTER' : 'A4'} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>{options.reportTitle || degree.title}</Text>
              {options.includeMetadata && (
                <Text style={styles.subtitle}>
                  {degree.institution || 'University Academic Record'}{' '}
                  {degree.started_year ? `• Enrolled ${degree.started_year}` : ''}
                </Text>
              )}
            </View>
            {metrics.standing ? <Text style={styles.badge}>{metrics.standing}</Text> : null}
          </View>

          {options.includeName && (options.studentName || options.studentEmail) && (
            <View style={styles.studentMeta}>
              {options.studentName !== '' && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Student Name</Text>
                  <Text style={styles.metaValue}>{options.studentName}</Text>
                </View>
              )}
              {options.studentEmail !== '' && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Email / ID</Text>
                  <Text style={styles.metaValue}>{options.studentEmail}</Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Grade Scale</Text>
                <Text style={styles.metaValue}>{degree.grade_scale?.label || 'Standard 4.0'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Stats Row */}
        {options.includeStats && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>CGPA</Text>
              <Text style={styles.statValueCgpa}>{formatGpa(metrics.cgpa)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Credits</Text>
              <Text style={styles.statValueCredits}>{formatCount(metrics.earnedCredits)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Best semester</Text>
              <Text style={styles.statValueBest}>{formatGpa(metrics.highestGpa)}</Text>
            </View>
            <View style={[styles.statCard, styles.statCardLast]}>
              <Text style={styles.statLabel}>Graded</Text>
              <Text style={styles.statValueSems}>{gradedCount}</Text>
            </View>
          </View>
        )}

        {options.includeTrendChart && (
          <View style={styles.rulerBox}>
            <Text style={styles.rulerTitle}>Classification</Text>
            <View style={{ position: 'relative' }}>
              <View style={styles.rulerTrack}>
                {track.bands.map((band) => (
                  <View
                    key={band.id}
                    style={{
                      flexGrow: Math.max(band.max - band.min, 0.01),
                      flexBasis: 0,
                      height: 7,
                      backgroundColor: BAND_FILL[band.tone],
                    }}
                  />
                ))}
              </View>
              {metrics.earnedCredits > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    left: `${markerPercent(metrics.cgpa, track)}%`,
                    top: -1,
                    width: 8,
                    height: 9,
                    marginLeft: -4,
                    borderRadius: 4,
                    backgroundColor: '#1C1915',
                    borderWidth: 1,
                    borderColor: '#FFFFFF',
                  }}
                />
              )}
            </View>
            <View style={styles.rulerLabels}>
              {rulerTicks.map((tick, index) => (
                <Text key={`${tick}-${index}`} style={styles.rulerLabel}>
                  {formatGpa(tick)}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Target Goal Summary Box */}
        {options.includeTargetGoal && options.targetCgpa && (
          <View style={styles.targetGoalBox}>
            <Text style={styles.targetGoalText}>
              Target CGPA Goal: {options.targetCgpa}
            </Text>
            <Text style={styles.targetGoalText}>
              Remaining Credits: {options.remainingCredits || '30'}
            </Text>
          </View>
        )}

        {/* Semester Tables with Native Page Wrapping Control */}
        {options.includeModules &&
          sortedSemesters.map((sem, idx) => {
            const semGpa = computeScore(sem.modules, gradeScale)
            const semCredits = totalCredits(sem.modules)

            return (
              <View key={sem.id || idx} style={styles.semesterCard} wrap={false}>
                <View style={styles.semesterHeader}>
                  <Text style={styles.semesterTitle}>
                    {sem.title} {sem.term ? `(${sem.term})` : ''}
                  </Text>
                  <Text style={styles.semesterMeta}>
                    Credits: {semCredits.toFixed(1)}   |   GPA: {formatGpa(semGpa)}
                  </Text>
                </View>

                <View style={styles.tableHeader}>
                  <Text style={styles.thIndex}>#</Text>
                  <Text style={styles.thName}>Module Name</Text>
                  <Text style={styles.thCredits}>Credits</Text>
                  <Text style={styles.thGrade}>Grade</Text>
                </View>

                {sem.modules.map((mod, mIdx) => (
                  <View key={mod.id || mIdx} style={styles.tableRow}>
                    <Text style={styles.tdIndex}>{mIdx + 1}</Text>
                    <Text style={styles.tdName}>{mod.name}</Text>
                    <Text style={styles.tdCredits}>{mod.credits}</Text>
                    <Text style={styles.tdGrade}>{mod.grade}</Text>
                  </View>
                ))}
              </View>
            )
          })}

        <Text style={styles.footer}>
          {`Generated by Semest on ${generatedOn}. Not an official transcript.`}
        </Text>
      </Page>
    </Document>
  )
}
