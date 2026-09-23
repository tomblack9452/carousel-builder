import type { Sticker, StickerKind } from '../types'
import { uid } from './factory'

export const EMOJI = ['🔥', '⭐', '❤️', '✅', '👉', '😍', '💡', '📌', '🎉', '👀']

export const SHAPES: { kind: Exclude<StickerKind, 'emoji'>; label: string }[] = [
  { kind: 'arrow', label: 'Arrow' },
  { kind: 'circle', label: 'Circle' },
  { kind: 'box', label: 'Box' },
  { kind: 'star', label: 'Star' },
  { kind: 'underline', label: 'Underline' },
]

/** Height relative to width, for drawing and hit-testing. */
export function stickerAspect(kind: StickerKind): number {
  return kind === 'arrow' ? 0.45 : kind === 'underline' ? 0.25 : kind === 'box' ? 0.7 : 1
}

export function createSticker(kind: StickerKind, emoji = '', color = '#ffffff'): Sticker {
  return {
    id: uid(),
    kind,
    emoji,
    x: 0.5,
    y: 0.5,
    size: kind === 'emoji' || kind === 'star' ? 0.14 : 0.3,
    rotation: 0,
    color,
  }
}
