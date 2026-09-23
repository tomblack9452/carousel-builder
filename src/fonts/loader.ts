import { type FontPair, googleFontsUrl } from './catalog'

const loading = new Map<string, Promise<void>>()

/**
 * Add a pair's Google Fonts stylesheet and wait until its faces are usable on
 * canvas. Never rejects: offline or blocked fonts fall back to system fonts.
 */
export function loadFontPair(pair: FontPair): Promise<void> {
  let promise = loading.get(pair.id)
  if (!promise) {
    promise = new Promise<void>((resolve) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = googleFontsUrl(pair)
      link.onload = () => resolve()
      link.onerror = () => resolve()
      document.head.appendChild(link)
    })
      .then(() => Promise.all(
        [pair.heading, pair.body].flatMap((face) =>
          face.weights.map((w) => document.fonts.load(`${w} 40px "${face.family}"`))),
      ))
      .then(() => {}, () => {})
    loading.set(pair.id, promise)
  }
  return promise
}
