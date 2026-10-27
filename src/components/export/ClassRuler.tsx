import { markerPercent, type BandTone, type BandTrack } from '@/lib/bands'
import { formatGpa } from '@/lib/score'
import { BAND_PRINT, BAND_SCREEN } from '@/lib/export/palette'

type ClassRulerProps = {
  track: BandTrack
  value: number | null
  semesterValues?: number[]
  target?: number | null
  variant: 'print' | 'screen'
  showNumbers?: boolean
  showBandLabels?: boolean
  youLabel?: string
  /** Draw a dot on this ruler at `value`. Used for a semester row. */
  marker?: boolean
  height?: number
}

const TONE_INK: Record<BandTone, string> = {
  pass: '#1C2438',
  'second-lower': '#14343A',
  'second-upper': '#3A2E10',
  first: '#3A2018',
  plain: '#242424',
}

const METRICS = {
  print: { bar: 28, label: 11, you: 12, tick: 11, lift: 30, dot: 9, pillPad: '4px 9px' },
  screen: { bar: 64, label: 16, you: 22, tick: 18, lift: 46, dot: 16, pillPad: '8px 16px' },
} as const

export function ClassRuler({
  track,
  value,
  semesterValues = [],
  target = null,
  variant,
  showNumbers = true,
  showBandLabels = false,
  youLabel,
  marker = false,
  height,
}: ClassRulerProps) {
  const palette = variant === 'print' ? BAND_PRINT : BAND_SCREEN
  const metrics = METRICS[variant]
  const bar = height ?? metrics.bar
  const span = track.max - track.min
  const ticks = [...track.bands.map((band) => band.min), track.max]
  const ink = variant === 'screen' ? '#10132A' : undefined
  const onScreen = variant === 'screen'

  return (
    <div style={{ paddingTop: youLabel ? metrics.lift : 0, fontFamily: 'Instrument Sans, sans-serif' }}>
      <div style={{ position: 'relative' }}>
        {youLabel && value != null && (
          <div
            style={{
              position: 'absolute',
              left: `${markerPercent(value, track)}%`,
              top: -metrics.lift + 4,
              transform: 'translateX(-50%)',
              zIndex: 3,
              background: onScreen ? '#F4F6FF' : '#14213D',
              color: onScreen ? '#10132A' : '#FDFCF9',
              fontSize: metrics.you,
              fontWeight: 700,
              lineHeight: 1.2,
              padding: metrics.pillPad,
              borderRadius: 999,
              whiteSpace: 'nowrap',
              boxShadow: onScreen ? '0 8px 18px rgba(0,0,0,0.35)' : 'none',
            }}
          >
            {youLabel}
          </div>
        )}
        {youLabel && value != null && (
          <span
            style={{
              position: 'absolute',
              left: `${markerPercent(value, track)}%`,
              top: -8,
              width: 2,
              height: 10,
              marginLeft: -1,
              background: onScreen ? '#F4F6FF' : '#14213D',
              zIndex: 2,
            }}
          />
        )}
        <div style={{ display: 'flex', height: bar, borderRadius: 999, overflow: 'hidden' }}>
          {track.bands.map((band) => {
            const reached = value == null || value + 0.0001 >= band.min
            const share = span > 0 ? (band.max - band.min) / span : 1
            const showLabel = showBandLabels && band.label && share >= 0.1
            const labelColor = variant === 'screen' && !reached ? '#F4F6FF' : (ink ?? TONE_INK[band.tone])
            return (
              <div
                key={band.id}
                style={{
                  position: 'relative',
                  flexGrow: span > 0 ? Math.max(band.max - band.min, 0.01) : 1,
                  color: labelColor,
                  fontSize: metrics.label,
                  fontWeight: 650,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  padding: '0 6px',
                }}
              >
                <span style={{ position: 'absolute', inset: 0, background: palette[band.tone], opacity: reached ? 1 : 0.35 }} />
                {showLabel ? <span style={{ position: 'relative' }}>{band.label}</span> : null}
              </div>
            )
          })}
        </div>
        {semesterValues.map((semesterValue, index) => (
          <Dot key={`${semesterValue}-${index}`} percent={markerPercent(semesterValue, track)} bar={bar} size={7} anchor="bottom" />
        ))}
        {marker && value != null && <Dot percent={markerPercent(value, track)} bar={bar} size={Math.max(8, bar * 0.75)} anchor="center" />}
        {target != null && Number.isFinite(target) && (
          <span
            style={{
              position: 'absolute',
              left: `${markerPercent(target, track)}%`,
              top: -3,
              width: 2,
              height: bar + 6,
              marginLeft: -1,
              background: '#14213D',
              zIndex: 2,
            }}
          />
        )}
      </div>
      {showNumbers && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 8,
            fontSize: metrics.tick,
            color: variant === 'screen' ? '#A3AAD1' : '#5A6483',
          }}
        >
          {ticks.map((tick, index) => (
            <span key={`${tick}-${index}`}>{formatGpa(tick)}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function Dot({ percent, bar, size, anchor }: { percent: number; bar: number; size: number; anchor: 'center' | 'bottom' }) {
  return (
    <span
      style={{
        position: 'absolute',
        left: `${percent}%`,
        top: anchor === 'bottom' ? bar - 1 : bar / 2,
        width: size,
        height: size,
        transform: anchor === 'bottom' ? 'translate(-50%, -100%)' : 'translate(-50%, -50%)',
        borderRadius: 99,
        background: '#14213D',
        boxShadow: '0 0 0 2px #FDFCF9',
        zIndex: 2,
      }}
    />
  )
}
