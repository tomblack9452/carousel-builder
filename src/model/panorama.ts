import type { Slide } from '../types'

export interface PanoramaRun {
  /** Index of the first slide in the run. */
  start: number
  count: number
}

/** The run of consecutive panorama slides that `index` belongs to. */
export function panoramaRun(slides: Slide[], index: number): PanoramaRun {
  let start = index
  while (start > 0 && slides[start - 1].type === 'panorama') start--
  let end = index
  while (end < slides.length - 1 && slides[end + 1].type === 'panorama') end++
  return { start, count: end - start + 1 }
}

/** Every run of panorama slides in the project. */
export function panoramaRuns(slides: Slide[]): PanoramaRun[] {
  const runs: PanoramaRun[] = []
  for (let i = 0; i < slides.length; i++) {
    if (slides[i].type !== 'panorama') continue
    const run = panoramaRun(slides, i)
    runs.push(run)
    i = run.start + run.count - 1
  }
  return runs
}

/**
 * Give every slide in each run the same image settings, taken from the first
 * slide in the run that has an image. Call after slides are added, moved or retyped.
 */
export function syncPanoramas(slides: Slide[]): void {
  for (const { start, count } of panoramaRuns(slides)) {
    const run = slides.slice(start, start + count)
    const source = run.find((s) => s.images[0].asset)?.images[0]
    if (!source) continue
    for (const slide of run) Object.assign(slide.images[0], source)
  }
}
