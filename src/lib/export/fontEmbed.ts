import display500 from '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-500-normal.woff2?url'
import display600 from '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-600-normal.woff2?url'
import display700 from '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff2?url'
import sans400 from '@fontsource/instrument-sans/files/instrument-sans-latin-400-normal.woff2?url'
import sans500 from '@fontsource/instrument-sans/files/instrument-sans-latin-500-normal.woff2?url'
import sans600 from '@fontsource/instrument-sans/files/instrument-sans-latin-600-normal.woff2?url'

const FACES = [
  { family: 'Bricolage Grotesque', weight: 500, url: display500 },
  { family: 'Bricolage Grotesque', weight: 600, url: display600 },
  { family: 'Bricolage Grotesque', weight: 700, url: display700 },
  { family: 'Instrument Sans', weight: 400, url: sans400 },
  { family: 'Instrument Sans', weight: 500, url: sans500 },
  { family: 'Instrument Sans', weight: 600, url: sans600 },
] as const

let cached: Promise<string> | null = null

async function toDataUrl(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not load font ${url}`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  let binary = ''
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  }
  return `data:font/woff2;base64,${btoa(binary)}`
}

/**
 * @font-face rules with the font files inlined as base64, for the PNG capture.
 * html-to-image otherwise tries to re-fetch the faces from the page stylesheets and can fall back to a system font.
 */
export function socialFontCss(): Promise<string> {
  cached ??= Promise.all(
    FACES.map(async (face) => {
      const data = await toDataUrl(face.url)
      return `@font-face{font-family:'${face.family}';font-style:normal;font-weight:${face.weight};font-display:block;src:url(${data}) format('woff2');}`
    }),
  ).then((rules) => rules.join('\n'))
  return cached
}

/** Resolves once the faces the card uses are loaded, so the first capture never uses a fallback. */
export async function waitForExportFonts() {
  await Promise.all(
    [
      '700 100px "Bricolage Grotesque"',
      '600 40px "Bricolage Grotesque"',
      '500 40px "Bricolage Grotesque"',
      '400 30px "Instrument Sans"',
      '600 30px "Instrument Sans"',
    ].map((spec) => document.fonts.load(spec, '0123456789.Semest')),
  )
  await document.fonts.ready
}
