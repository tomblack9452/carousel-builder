import type { Adjustments, ImageSlot, Logo, Project, Slide, SlideType, Theme } from '../types'
import { PRESETS, presetTheme } from './presets'
import { DEFAULT_TEXT } from './textLayout'
import { SLIDE_TYPES } from './slideTypes'

export function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function createSlot(): ImageSlot {
  return { asset: null, zoom: 1, px: 0, py: 0 }
}

export function neutralAdjustments(): Adjustments {
  return { brightness: 1, saturation: 1, warmth: 0, vignette: 0 }
}

/** Sample text for a freshly added slide, so it's obvious what each field does. */
const SAMPLE_CONTENT: Record<SlideType, Pick<Slide, 'title' | 'body'>> = {
  cover: { title: 'Your title\ngoes here', body: '' },
  image: { title: '', body: '' },
  video: { title: '', body: '' },
  panorama: { title: '', body: '' },
  grid2: { title: '', body: '' },
  grid3: { title: '', body: '' },
  grid4: { title: '', body: '' },
  text: { title: 'Heading', body: 'Write a short paragraph here.' },
  quote: { title: 'Say something worth remembering', body: 'Someone' },
  list: { title: 'Top tips', body: 'First thing\nSecond thing\nThird thing' },
  compare: { title: '', body: 'Before\nAfter' },
  cta: { title: 'Follow for more', body: 'Save this post for later' },
}

export function createSlide(type: SlideType, content: Partial<Pick<Slide, 'title' | 'body'>> = {}): Slide {
  return {
    id: uid(),
    type,
    title: content.title ?? '',
    body: content.body ?? '',
    images: Array.from({ length: SLIDE_TYPES[type].imageSlots }, createSlot),
    adjust: neutralAdjustments(),
    text: { ...DEFAULT_TEXT[type] },
    alt: '',
    stickers: [],
  }
}

export function createSampleSlide(type: SlideType): Slide {
  return createSlide(type, SAMPLE_CONTENT[type])
}

/** Deep copy with a fresh id. Images are shared, which is fine because assets never change. */
export function cloneSlide(slide: Slide): Slide {
  return { ...(JSON.parse(JSON.stringify(slide)) as Slide), id: uid() }
}

/**
 * Switch a slide's type in place, adding image slots if the new type needs more.
 * Text goes back to the new type's default position.
 * A slide with no text yet gets the new type's sample text.
 */
export function changeSlideType(slide: Slide, type: SlideType): void {
  slide.type = type
  slide.text = { ...DEFAULT_TEXT[type] }
  while (slide.images.length < SLIDE_TYPES[type].imageSlots) slide.images.push(createSlot())
  if (!slide.title.trim() && !slide.body.trim()) Object.assign(slide, SAMPLE_CONTENT[type])
}

/** A short sample project for "New project". */
export function blankProject(): Project {
  return {
    ...starterProject(),
    slides: [
      createSampleSlide('cover'),
      createSlide('image'),
      createSlide('image'),
      createSlide('image'),
      createSampleSlide('cta'),
    ],
  }
}

export function defaultTheme(): Theme {
  return presetTheme(PRESETS[0].id)
}

export function defaultLogo(): Logo {
  return { asset: null, position: 'top-left', size: 0.12, opacity: 0.9 }
}

/** The project a first-time visitor starts with. */
export function starterProject(): Project {
  return {
    aspect: '4:5',
    handle: '@yourhandle',
    theme: defaultTheme(),
    logo: defaultLogo(),
    cues: { numbers: false, dots: false, arrow: false },
    caption: '',
    export: { format: 'jpg', quality: 0.95 },
    slides: [
      createSlide('cover', { title: 'Swipe through\nfor the full story' }),
      ...Array.from({ length: 5 }, () => createSlide('image')),
      createSlide('cta', {
        title: 'Which one is your favourite?',
        body: 'Let me know in the comments',
      }),
    ],
  }
}
