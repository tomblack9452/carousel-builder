export type AspectId = '4:5' | '1:1' | '3:4'

/** Export sizes Instagram accepts for carousel posts. */
export const ASPECTS: Record<AspectId, { label: string; width: number; height: number }> = {
  '4:5': { label: 'Portrait 4:5', width: 1080, height: 1350 },
  '3:4': { label: 'Tall 3:4 (profile grid)', width: 1080, height: 1440 },
  '1:1': { label: 'Square 1:1', width: 1080, height: 1080 },
}

/** Used for editor-only text drawn on slides, like drop prompts. */
export const SUB_FONT = '"Barlow Condensed", "Arial Narrow", sans-serif'

/** Upscaling beyond this makes an image look soft once posted. */
export const LOW_RES_SCALE = 1.2

/** Instagram's carousel limit. */
export const MAX_SLIDES = 20

/** Instagram caption limits. */
export const CAPTION_MAX = 2200
export const HASHTAG_MAX = 5

/** Drag-and-drop type for reordering slides (distinguishes from file drops). */
export const SLIDE_DRAG_TYPE = 'application/x-carousel-slide'
