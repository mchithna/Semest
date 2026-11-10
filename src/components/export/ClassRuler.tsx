import type { BandTrack } from '@/lib/bands'
import { formatGpa } from '@/lib/score'
import { clampPill, fitBandLabel, pillWidth, rulerGeometry, bandReached } from '@/lib/export/geometry'
import {
  bandPaint,
  RULER_COLORS,
  TARGET_COLOR,
  type RulerMetrics,
  type RulerVariant,
} from '@/lib/export/rulerStyle'
import { INK } from '@/lib/export/palette'

type ClassRulerProps = {
  track: BandTrack
  variant: RulerVariant
  metrics: RulerMetrics
  value: number | null
  /** Text in the pill above the bar. Omit for no pill. */
  youLabel?: string
  /** Show the numeric tick row. Off when exact GPA is hidden. */
  showTicks?: boolean
  target?: number | null
  targetLabel?: string
}

/**
 * Main classification ruler. Same structure in the Ruler report and the Social card:
 * pill and stem above, a clean bar, tick values under it, optional target below.
 * Every position comes from rulerGeometry.
 */
export function ClassRuler({
  track,
  variant,
  metrics,
  value,
  youLabel,
  showTicks = true,
  target = null,
  targetLabel,
}: ClassRulerProps) {
  const geo = rulerGeometry(track)
  const colors = RULER_COLORS[variant]
  const u = (n: number) => `${n}${metrics.unit}`
  const hasPill = youLabel != null && value != null
  const top = hasPill ? metrics.pillHeight + metrics.stem : 0
  const barTop = top
  const tickTop = barTop + metrics.bar + metrics.tickGap
  const targetTop = (showTicks ? tickTop + metrics.tickLine : barTop + metrics.bar) + metrics.targetGap
  const youPct = value != null ? geo.pct(value) : 0
  const pillW = hasPill ? pillWidth(youLabel, metrics.pillFont, metrics.pillPadX) : 0
  const hasTarget = target != null && Number.isFinite(target)
  const targetText = targetLabel ?? (hasTarget ? `Target ${formatGpa(target)}` : '')
  const targetPct = hasTarget ? geo.pct(target) : 0
  const targetW = hasTarget ? pillWidth(targetText, metrics.pillFont, metrics.pillPadX) : 0
  const height =
    targetTop + (hasTarget ? metrics.targetStem + metrics.pillHeight : 0) - (hasTarget ? 0 : metrics.targetGap)

  return (
    <div
      style={{
        position: 'relative',
        width: u(metrics.width),
        height: u(height),
        fontFamily: 'Instrument Sans, sans-serif',
        fontVariantNumeric: 'lining-nums tabular-nums',
      }}
    >
      {hasPill && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: `${clampPill(youPct, pillW, metrics.width)}%`,
              transform: 'translateX(-50%)',
              width: u(pillW),
              height: u(metrics.pillHeight),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              background: colors.pillBg,
              color: colors.pillText,
              fontSize: u(metrics.pillFont),
              fontWeight: 600,
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}
          >
            {youLabel}
          </div>
          {/* The stem ends at the top edge of the bar and never crosses it. */}
          <div
            data-ruler-stem
            style={{
              position: 'absolute',
              top: u(metrics.pillHeight),
              left: `${youPct}%`,
              marginLeft: u(-metrics.stemWidth / 2),
              width: u(metrics.stemWidth),
              height: u(metrics.stem),
              background: colors.pillBg,
            }}
          />
        </>
      )}

      <div
        data-ruler-bar
        style={{
          position: 'absolute',
          top: u(barTop),
          left: 0,
          right: 0,
          height: u(metrics.bar),
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        {geo.bands.map((band, index) => {
          const reached = bandReached(band, value)
          const paint = bandPaint(band, reached, variant, index, geo.bands.length)
          const inner = metrics.width * (band.width / 100) - metrics.labelPad * 2
          const fit = fitBandLabel(band.label, inner, metrics.label)
          return (
            <div
              key={band.id}
              data-ruler-band={band.min}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${band.left}%`,
                width: `${band.width}%`,
                boxSizing: 'border-box',
                background: paint.fill,
                color: paint.text,
                borderTop: paint.edge ? `1px dashed ${paint.edge}` : undefined,
                borderBottom: paint.edge ? `1px dashed ${paint.edge}` : undefined,
                borderRight: paint.edge ? `1px dashed ${paint.edge}` : undefined,
                display: 'flex',
                alignItems: 'center',
                padding: `0 ${u(metrics.labelPad)}`,
                fontSize: u(fit.fontSize),
                fontWeight: 600,
                lineHeight: 1.05,
                textAlign: 'left',
              }}
            >
              <span>{band.label}</span>
            </div>
          )
        })}
      </div>

      {showTicks &&
        geo.ticks.map((tick) => (
          <span
            key={tick.value}
            data-ruler-tick={tick.value}
            style={{
              position: 'absolute',
              top: u(tickTop),
              left: `${tick.left}%`,
              transform: `translateX(${tick.align === 'start' ? '0' : tick.align === 'end' ? '-100%' : '-50%'})`,
              fontSize: u(metrics.tick),
              lineHeight: u(metrics.tickLine),
              height: u(metrics.tickLine),
              color: colors.muted,
              whiteSpace: 'nowrap',
            }}
          >
            {formatGpa(tick.value)}
          </span>
        ))}

      {hasTarget && (
        <>
          <div
            style={{
              position: 'absolute',
              top: u(targetTop),
              left: `${targetPct}%`,
              marginLeft: u(-metrics.stemWidth / 2),
              height: u(metrics.targetStem),
              borderLeft: `${u(metrics.stemWidth)} dashed ${TARGET_COLOR}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: u(targetTop + metrics.targetStem),
              left: `${clampPill(targetPct, targetW, metrics.width)}%`,
              transform: 'translateX(-50%)',
              width: u(targetW),
              height: u(metrics.pillHeight),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              background: TARGET_COLOR,
              color: variant === 'night' ? '#10132A' : INK,
              fontSize: u(metrics.pillFont),
              fontWeight: 600,
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}
          >
            {targetText}
          </div>
        </>
      )}
    </div>
  )
}

type MiniProps = {
  track: BandTrack
  value: number | null
  unit: 'pt' | 'px'
}

/** Semester row ruler: 6pt track, 12pt dot with a 2pt white ring, same geometry as the main ruler. */
export function ReportMiniRuler({ track, value, unit }: MiniProps) {
  const geo = rulerGeometry(track)
  const u = (n: number) => `${n}${unit}`
  const dot = 12
  const ring = 2
  const trackH = 6
  return (
    <div style={{ position: 'relative', height: u(dot + ring * 2), width: '100%' }}>
      <div
        data-mini-track
        style={{
          position: 'absolute',
          top: u((dot + ring * 2 - trackH) / 2),
          left: 0,
          right: 0,
          height: u(trackH),
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        {geo.bands.map((band, index) => {
          const paint = bandPaint(band, bandReached(band, value), 'paper', index, geo.bands.length)
          return (
            <div
              key={band.id}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${band.left}%`,
                width: `${band.width}%`,
                background: paint.fill,
              }}
            />
          )
        })}
      </div>
      {value != null && (
        <div
          data-mini-dot={value}
          style={{
            position: 'absolute',
            top: 0,
            left: `${geo.pct(value)}%`,
            width: u(dot),
            height: u(dot),
            marginLeft: u(-(dot / 2 + ring)),
            boxSizing: 'content-box',
            border: `${u(ring)} solid #FFFFFF`,
            borderRadius: 999,
            background: INK,
          }}
        />
      )}
    </div>
  )
}
