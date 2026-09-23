import type { ImageSlot, Project, Slide, SlideType } from '../types'
import { SLIDE_TYPES } from './slideTypes'

export function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function createSlot(): ImageSlot {
  return { asset: null, zoom: 1, px: 0, py: 0 }
}

export function createSlide(type: SlideType, content: Partial<Pick<Slide, 'title' | 'body'>> = {}): Slide {
  return {
    id: uid(),
    type,
    title: content.title ?? '',
    body: content.body ?? '',
    images: Array.from({ length: SLIDE_TYPES[type].imageSlots }, createSlot),
  }
}

/** The project a first-time visitor starts with. */
export function starterProject(): Project {
  return {
    handle: '@yourhandle',
    accent: '#ff7a3d',
    slides: [
      createSlide('cover', { title: 'The beauty\nof sunset\nin games' }),
      ...Array.from({ length: 10 }, () => createSlide('image')),
      createSlide('cta', {
        title: "Which one's yours?",
        body: 'Drop your favourite game sunset in the comments',
      }),
    ],
  }
}
