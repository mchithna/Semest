import React, { useState, useRef } from 'react'
import { FileDown, Loader2, X, FileText, Sparkles, Layout } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { toast } from 'sonner'
import type { DegreeWithScale } from '@/lib/queries/degrees'
import type { SemesterWithModules } from '@/lib/queries/semesters'
import { PdfTemplates, type PdfExportOptions } from './PdfTemplates'
import { PdfMiniPreview } from './PdfMiniPreview'
import { ReactPdfDocument } from './ReactPdfDocument'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ExportPdfModalProps = {
  isOpen: boolean
  onClose: () => void
  degree: DegreeWithScale | undefined
  semesters: SemesterWithModules[]
  metrics: {
    cgpa: number
    earnedCredits: number
    highestGpa: number
    standing: string
  }
  defaultStudentName?: string
  defaultStudentEmail?: string
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  degree,
  semesters,
  metrics,
  defaultStudentName = '',
  defaultStudentEmail = '',
}) => {
  const printContainerRef = useRef<HTMLDivElement | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const [options, setOptions] = useState<PdfExportOptions>({
    theme: 'official',
    studentName: defaultStudentName,
    studentEmail: defaultStudentEmail,
    reportTitle: degree ? `${degree.title} - Academic Transcript` : 'Academic Progression Report',
    includeName: true,
    includeMetadata: true,
    includeStats: true,
    includeModules: true,
    includeTrendChart: true,
    includeTargetGoal: false,
    targetCgpa: '3.70',
    remainingCredits: '30',
  })

  if (!isOpen || !degree) return null

  const handleToggleOption = (key: keyof PdfExportOptions) => {
    setOptions(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleThemeSelect = (theme: 'official' | 'modern' | 'executive') => {
    setOptions(prev => ({ ...prev, theme }))
  }

  const handleExportPdf = async () => {
    try {
      setIsExporting(true)
      const cleanFileName = (options.reportTitle || degree.title)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 40)

      const blob = await pdf(
        <ReactPdfDocument
          degree={degree}
          semesters={semesters}
          metrics={metrics}
          options={options}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${cleanFileName}_Report.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Vector PDF report downloaded successfully!')
      onClose()
    } catch (err: any) {
      console.error('PDF export error:', err)
      toast.error(err?.message || 'Failed to generate PDF document.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Hidden PDF Printable Component */}
      <PdfTemplates
        degree={degree}
        semesters={semesters}
        metrics={metrics}
        options={options}
        containerRef={printContainerRef}
      />

      {/* Main Dialog Box */}
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-foreground font-mono">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold tracking-widest uppercase text-foreground">
              Customize PDF Academic Report
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content Area: Controls + Live Preview */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column: Customization Controls */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Theme Selector */}
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest block">
                Document Theme
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleThemeSelect('official')}
                  className={`p-3 rounded-lg border text-left flex flex-col items-center text-center gap-1.5 transition-all ${
                    options.theme === 'official'
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-md'
                      : 'border-border bg-background hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-xs">Official Academic</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeSelect('modern')}
                  className={`p-3 rounded-lg border text-left flex flex-col items-center text-center gap-1.5 transition-all ${
                    options.theme === 'modern'
                      ? 'border-emerald-400 bg-emerald-500/10 text-emerald-400 font-bold shadow-md'
                      : 'border-border bg-background hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="text-xs">UniScore Modern</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeSelect('executive')}
                  className={`p-3 rounded-lg border text-left flex flex-col items-center text-center gap-1.5 transition-all ${
                    options.theme === 'executive'
                      ? 'border-indigo-400 bg-indigo-500/10 text-indigo-400 font-bold shadow-md'
                      : 'border-border bg-background hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <Layout className="w-5 h-5" />
                  <span className="text-xs">Compact Snapshot</span>
                </button>
              </div>
            </div>

            {/* Editable Header Meta */}
            <div className="space-y-4 pt-2 border-t border-border">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-widest">
                  Report Title
                </Label>
                <Input
                  value={options.reportTitle}
                  onChange={e => setOptions(prev => ({ ...prev, reportTitle: e.target.value }))}
                  className="bg-background border-border text-foreground font-mono text-sm"
                />
              </div>

              {options.includeName && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">
                      Student Name
                    </Label>
                    <Input
                      value={options.studentName}
                      onChange={e => setOptions(prev => ({ ...prev, studentName: e.target.value }))}
                      placeholder="e.g. Alex Morgan"
                      className="bg-background border-border text-foreground font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">
                      Email / ID
                    </Label>
                    <Input
                      value={options.studentEmail}
                      onChange={e => setOptions(prev => ({ ...prev, studentEmail: e.target.value }))}
                      placeholder="student@univ.edu"
                      className="bg-background border-border text-foreground font-mono text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section Toggles */}
            <div className="space-y-3 pt-2 border-t border-border">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest block">
                Include Sections & Metadata
              </Label>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2.5 p-2 rounded-md bg-background border border-border cursor-pointer hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={options.includeName}
                    onChange={() => handleToggleOption('includeName')}
                    className="accent-primary rounded"
                  />
                  <span>Student Name & Email</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-md bg-background border border-border cursor-pointer hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={options.includeMetadata}
                    onChange={() => handleToggleOption('includeMetadata')}
                    className="accent-primary rounded"
                  />
                  <span>Degree & Institution Info</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-md bg-background border border-border cursor-pointer hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={options.includeStats}
                    onChange={() => handleToggleOption('includeStats')}
                    className="accent-primary rounded"
                  />
                  <span>Executive Stats Bar</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-md bg-background border border-border cursor-pointer hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={options.includeModules}
                    onChange={() => handleToggleOption('includeModules')}
                    className="accent-primary rounded"
                  />
                  <span>Semester & Course Tables</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-md bg-background border border-border cursor-pointer hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={options.includeTrendChart}
                    onChange={() => handleToggleOption('includeTrendChart')}
                    className="accent-primary rounded"
                  />
                  <span>GPA Trend Summary</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-md bg-background border border-border cursor-pointer hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={options.includeTargetGoal}
                    onChange={() => handleToggleOption('includeTargetGoal')}
                    className="accent-primary rounded"
                  />
                  <span>Target Goal Box</span>
                </label>
              </div>
            </div>

          </div>

          {/* Right Column: Live Miniature Wireframe Sketch Preview */}
          <div className="md:col-span-5 flex items-center justify-center bg-muted/20 border border-border rounded-lg p-4">
            <PdfMiniPreview
              degree={degree}
              semesters={semesters}
              metrics={metrics}
              options={options}
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/40">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
            className="font-mono text-xs uppercase tracking-wider rounded-sm border-border"
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold font-mono text-xs uppercase tracking-widest rounded-sm"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  )
}
