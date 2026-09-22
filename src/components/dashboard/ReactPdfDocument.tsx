import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { DegreeWithScale } from '@/lib/queries/degrees'
import type { SemesterWithModules } from '@/lib/queries/semesters'
import type { PdfExportOptions } from './PdfTemplates'
import { computeScore, totalCredits } from '@/lib/score'
import { compareSemesters } from '@/lib/semesterOrder'

// Register standard fonts
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf', fontWeight: 'normal' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica-bold@1.0.4/Helvetica-Bold.ttf', fontWeight: 'bold' },
  ]
})

const getThemeStyles = (theme: 'official' | 'modern' | 'executive') => {
  const isModern = theme === 'modern'
  const isExecutive = theme === 'executive'

  return StyleSheet.create({
    page: {
      padding: 32,
      fontSize: 9,
      fontFamily: 'Helvetica',
      backgroundColor: isModern ? '#090D16' : '#FFFFFF',
      color: isModern ? '#F8FAFC' : '#0F172A',
    },
    header: {
      borderBottomWidth: 1,
      borderBottomColor: isModern ? '#1E293B' : '#CBD5E1',
      paddingBottom: 12,
      marginBottom: 16,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    title: {
      fontSize: 18,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
      color: isModern ? '#34D399' : isExecutive ? '#4F46E5' : '#0F172A',
    },
    subtitle: {
      fontSize: 9,
      color: isModern ? '#94A3B8' : '#64748B',
      marginTop: 2,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 3,
      backgroundColor: isModern ? '#064E3B' : isExecutive ? '#EEF2FF' : '#F1F5F9',
      color: isModern ? '#34D399' : isExecutive ? '#4338CA' : '#0F172A',
      borderWidth: isModern ? 1 : 0,
      borderColor: isModern ? '#059669' : 'transparent',
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
    },
    studentMeta: {
      flexDirection: 'row',
      gap: 20,
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isModern ? '#1E293B' : '#E2E8F0',
    },
    metaItem: {
      flexDirection: 'column',
    },
    metaLabel: {
      fontSize: 7,
      color: isModern ? '#64748B' : '#94A3B8',
      textTransform: 'uppercase',
    },
    metaValue: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: isModern ? '#F1F5F9' : '#1E293B',
      marginTop: 1,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      padding: 8,
      backgroundColor: isModern ? '#1E293B' : '#F8FAFC',
      borderRadius: 4,
      borderWidth: 1,
      borderColor: isModern ? '#334155' : '#E2E8F0',
    },
    statLabel: {
      fontSize: 7,
      color: isModern ? '#94A3B8' : '#64748B',
      textTransform: 'uppercase',
    },
    statValueCgpa: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: isModern ? '#34D399' : isExecutive ? '#4F46E5' : '#0F172A',
      marginTop: 2,
    },
    statValueCredits: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: '#38BDF8',
      marginTop: 2,
    },
    statValueBest: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: '#F59E0B',
      marginTop: 2,
    },
    statValueSems: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: isModern ? '#A78BFA' : '#6366F1',
      marginTop: 2,
    },
    chartBox: {
      padding: 10,
      backgroundColor: isModern ? '#1E293B' : '#F8FAFC',
      borderRadius: 4,
      borderWidth: 1,
      borderColor: isModern ? '#334155' : '#E2E8F0',
      marginBottom: 16,
    },
    chartTitle: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: isModern ? '#94A3B8' : '#64748B',
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    chartTrack: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      height: 45,
      gap: 6,
    },
    chartCol: {
      flex: 1,
      alignItems: 'center',
    },
    chartVal: {
      fontSize: 7,
      color: isModern ? '#CBD5E1' : '#334155',
      marginBottom: 2,
    },
    chartBar: {
      width: '100%',
      backgroundColor: isModern ? '#34D399' : isExecutive ? '#4F46E5' : '#0F172A',
      borderRadius: 2,
    },
    chartTerm: {
      fontSize: 7,
      color: isModern ? '#94A3B8' : '#64748B',
      marginTop: 2,
    },
    targetGoalBox: {
      padding: 8,
      backgroundColor: isModern ? '#1E293B' : '#FEF3C7',
      borderRadius: 4,
      borderWidth: 1,
      borderColor: isModern ? '#334155' : '#FDE68A',
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    targetGoalText: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: isModern ? '#F59E0B' : '#92400E',
    },
    semesterCard: {
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isModern ? '#334155' : '#E2E8F0',
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: isModern ? '#0F172A' : '#FFFFFF',
    },
    semesterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: isModern ? '#1E293B' : '#F1F5F9',
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    semesterTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: isModern ? '#34D399' : '#0F172A',
      textTransform: 'uppercase',
    },
    semesterMeta: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: isModern ? '#F1F5F9' : '#0F172A',
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: isModern ? '#090D16' : '#F8FAFC',
      borderBottomWidth: 1,
      borderBottomColor: isModern ? '#1E293B' : '#E2E8F0',
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: isModern ? '#1E293B' : '#F1F5F9',
      paddingHorizontal: 10,
      paddingVertical: 5,
      alignItems: 'center',
    },
    thIndex: { width: 24, fontSize: 7, color: isModern ? '#64748B' : '#64748B', fontFamily: 'Helvetica-Bold' },
    thName: { flex: 1, fontSize: 7, color: isModern ? '#64748B' : '#64748B', fontFamily: 'Helvetica-Bold' },
    thCredits: { width: 45, textAlign: 'center', fontSize: 7, color: isModern ? '#64748B' : '#64748B', fontFamily: 'Helvetica-Bold' },
    thGrade: { width: 45, textAlign: 'center', fontSize: 7, color: isModern ? '#64748B' : '#64748B', fontFamily: 'Helvetica-Bold' },
    tdIndex: { width: 24, fontSize: 8, color: isModern ? '#64748B' : '#94A3B8' },
    tdName: { flex: 1, fontSize: 8, color: isModern ? '#F1F5F9' : '#1E293B' },
    tdCredits: { width: 45, textAlign: 'center', fontSize: 8, color: isModern ? '#CBD5E1' : '#334155' },
    tdGrade: { width: 45, textAlign: 'center', fontSize: 8, fontFamily: 'Helvetica-Bold', color: isModern ? '#34D399' : '#0F172A' },
    footer: {
      marginTop: 20,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: isModern ? '#1E293B' : '#E2E8F0',
      textAlign: 'center',
      fontSize: 7,
      color: isModern ? '#64748B' : '#94A3B8',
    }
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

export const ReactPdfDocument: React.FC<ReactPdfDocumentProps> = ({
  degree,
  semesters,
  metrics,
  options,
}) => {
  const sortedSemesters = [...semesters].sort(compareSemesters)
  const gradeScale = degree.grade_scale?.grades || []
  const styles = getThemeStyles(options.theme)

  return (
    <Document title={options.reportTitle || degree.title}>
      <Page size="A4" style={styles.page}>
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
            <Text style={styles.badge}>{metrics.standing}</Text>
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
              <Text style={styles.statLabel}>Cumulative GPA</Text>
              <Text style={styles.statValueCgpa}>{metrics.cgpa.toFixed(3)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Earned Credits</Text>
              <Text style={styles.statValueCredits}>{metrics.earnedCredits.toFixed(1)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Best Sem GPA</Text>
              <Text style={styles.statValueBest}>{metrics.highestGpa.toFixed(3)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Semesters</Text>
              <Text style={styles.statValueSems}>{semesters.length}</Text>
            </View>
          </View>
        )}

        {/* Trend Summary Chart */}
        {options.includeTrendChart && sortedSemesters.length > 0 && (
          <View style={styles.chartBox}>
            <Text style={styles.chartTitle}>Semester GPA Progression Summary</Text>
            <View style={styles.chartTrack}>
              {sortedSemesters.map((sem, i) => {
                const sgpa = computeScore(sem.modules, gradeScale)
                const barHeight = Math.max(6, Math.min(30, (sgpa / 4.0) * 30))
                return (
                  <View key={sem.id || i} style={styles.chartCol}>
                    <Text style={styles.chartVal}>{sgpa.toFixed(2)}</Text>
                    <View style={[styles.chartBar, { height: barHeight }]} />
                    <Text style={styles.chartTerm}>{sem.term || `S${i + 1}`}</Text>
                  </View>
                )
              })}
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
                    Credits: {semCredits.toFixed(1)}   |   GPA: {semGpa.toFixed(2)}
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
          Generated via UniScore Track • Academic Progression Report
        </Text>
      </Page>
    </Document>
  )
}
