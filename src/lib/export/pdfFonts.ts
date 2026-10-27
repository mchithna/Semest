import { Font } from '@react-pdf/renderer'
import display500 from '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-500-normal.woff?url'
import display600 from '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-600-normal.woff?url'
import display700 from '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff?url'
import sans400 from '@fontsource/instrument-sans/files/instrument-sans-latin-400-normal.woff?url'
import sans500 from '@fontsource/instrument-sans/files/instrument-sans-latin-500-normal.woff?url'
import sans600 from '@fontsource/instrument-sans/files/instrument-sans-latin-600-normal.woff?url'
import serif400 from '@fontsource/source-serif-4/files/source-serif-4-latin-400-normal.woff?url'
import serif600 from '@fontsource/source-serif-4/files/source-serif-4-latin-600-normal.woff?url'
import serif700 from '@fontsource/source-serif-4/files/source-serif-4-latin-700-normal.woff?url'

/**
 * Every font a PDF uses is registered here, so react-pdf embeds a subset of each.
 * Nothing falls back to the built-in Helvetica or Times, which are not embedded.
 * Source Serif 4 ships lining, tabular figures by default.
 */
export const PDF_FONT = {
  display: 'SemestDisplay',
  sans: 'SemestSans',
  serif: 'SemestSerif',
} as const

let registered = false

export function registerPdfFonts() {
  if (registered) return
  registered = true
  Font.register({
    family: PDF_FONT.display,
    fonts: [
      { src: display500, fontWeight: 500 },
      { src: display600, fontWeight: 600 },
      { src: display700, fontWeight: 700 },
    ],
  })
  Font.register({
    family: PDF_FONT.sans,
    fonts: [
      { src: sans400, fontWeight: 400 },
      { src: sans500, fontWeight: 500 },
      { src: sans600, fontWeight: 600 },
    ],
  })
  Font.register({
    family: PDF_FONT.serif,
    fonts: [
      { src: serif400, fontWeight: 400 },
      { src: serif600, fontWeight: 600 },
      { src: serif700, fontWeight: 700 },
    ],
  })
  Font.registerHyphenationCallback((word) => [word])
}
