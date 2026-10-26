import { markerPercent, type BandTrack } from '@/lib/bands'
import { formatGpa } from '@/lib/score'
import { BAND_PRINT, BAND_SCREEN } from '@/lib/export/palette'
import type { BandTone } from '@/lib/bands'

type ClassRulerProps = {
  track: BandTrack
  value: number | null
  semesterValues?: number[]
  target?: number | null
  variant: 'print' | 'screen'
  showNumbers?: boolean
  showBandLabels?: boolean
  youLabel?: string
  height?: number
}

const TONE_INK: Record<BandTone, string> = {
  pass: '#1C2438',
  'second-lower': '#14343A',
  'second-upper': '#3A2E10',
  first: '#3A2018',
  plain: '#3A3A3A',
}

export function ClassRuler({
  track,
  value,
  semesterValues = [],
  target = null,
  variant,
  showNumbers = true,
  showBandLabels = false,
  youLabel,
  height = 10,
}: ClassRulerProps) {
  const palette = variant === 'print' ? BAND_PRINT : BAND_SCREEN
  const span = track.max - track.min
  const ticks = [...track.bands.map((band) => band.min), track.max]

  return (
    <div style={{ position: 'relative' }}>
      {youLabel && value != null && (
        <div
          style={{
            position: 'absolute',
            left: `${markerPercent(value, track)}%`,
            top: -22,
            transform: 'translateX(-50%)',
            background: '#14213D',
            color: '#FDFCF9',
            fontSize: 10,
            lineHeight: '16px',
            padding: '0 6px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
            fontFamily: 'Instrument Sans, sans-serif',
          }}
        >
          {youLabel}
        </div>
      )}
      <div style={{ display: 'flex', height, borderRadius: 999, overflow: 'hidden' }}>
        {track.bands.map((band) => {
          const reached = value == null || value + 0.0001 >= band.min
          return (
            <div
              key={band.id}
              style={{
                flexGrow: span > 0 ? Math.max(band.max - band.min, 0.01) : 1,
                background: palette[band.tone],
                opacity: reached ? 1 : 0.35,
                color: TONE_INK[band.tone],
                fontSize: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Instrument Sans, sans-serif',
              }}
            >
              {showBandLabels && band.label ? band.label : ''}
            </div>
          )
        })}
      </div>
      {semesterValues.map((semesterValue, index) => (
        <span
          key={`${semesterValue}-${index}`}
          style={{
            position: 'absolute',
            left: `${markerPercent(semesterValue, track)}%`,
            top: height / 2 - 3,
            width: 6,
            height: 6,
            marginLeft: -3,
            borderRadius: 99,
            background: '#14213D',
            boxShadow: '0 0 0 1.5px #FDFCF9',
          }}
        />
      ))}
      {target != null && Number.isFinite(target) && (
        <span
          style={{
            position: 'absolute',
            left: `${markerPercent(target, track)}%`,
            top: -2,
            width: 2,
            height: height + 4,
            marginLeft: -1,
            background: '#14213D',
          }}
        />
      )}
      {showNumbers && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 4,
            fontSize: 10,
            color: '#5A6483',
            fontFamily: 'Instrument Sans, sans-serif',
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
