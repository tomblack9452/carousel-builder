import type { SlideType } from '../types'

export interface FieldInfo {
  label: string
  placeholder: string
  multiline?: boolean
}

export interface SlideTypeInfo {
  label: string
  /** Number of image slots this type draws. */
  imageSlots: number
  title: FieldInfo | null
  body: FieldInfo | null
  /** Images can be left empty without a warning. */
  imagesOptional?: boolean
  /** Takes a video file instead of an image. */
  video?: boolean
  /** Shown under the image controls, e.g. to explain an optional image. */
  imageHint?: string
}

const OPTIONAL_BACKGROUND = 'Optional background image, dimmed behind the text.'

/** In the order they're offered in the type picker. */
export const SLIDE_TYPES: Record<SlideType, SlideTypeInfo> = {
  cover: {
    label: 'Cover',
    imageSlots: 1,
    title: { label: 'Title', placeholder: 'Title, one line per row', multiline: true },
    body: null,
  },
  image: {
    label: 'Image + caption',
    imageSlots: 1,
    title: { label: 'Title', placeholder: 'Title' },
    body: { label: 'Subtitle', placeholder: 'Subtitle' },
  },
  video: {
    label: 'Video',
    imageSlots: 1,
    title: { label: 'Title', placeholder: 'Title (optional)' },
    body: { label: 'Subtitle', placeholder: 'Subtitle (optional)' },
    video: true,
    imageHint: 'Exports as an MP4 video (WebM in browsers that can\'t make MP4), up to 60 seconds. Recording runs in real time, so keep this tab open.',
  },
  panorama: {
    label: 'Panorama',
    imageSlots: 1,
    title: { label: 'Title', placeholder: 'Title (optional)' },
    body: { label: 'Subtitle', placeholder: 'Subtitle (optional)' },
    imageHint: 'Panorama slides next to each other share one wide image, split across the swipe.',
  },
  grid2: {
    label: 'Grid: 2 side by side',
    imageSlots: 2,
    title: { label: 'Title', placeholder: 'Title (optional)' },
    body: null,
  },
  grid3: {
    label: 'Grid: 1 + 2',
    imageSlots: 3,
    title: { label: 'Title', placeholder: 'Title (optional)' },
    body: null,
  },
  grid4: {
    label: 'Grid: 2 × 2',
    imageSlots: 4,
    title: { label: 'Title', placeholder: 'Title (optional)' },
    body: null,
  },
  text: {
    label: 'Text',
    imageSlots: 1,
    title: { label: 'Heading', placeholder: 'Heading' },
    body: { label: 'Body', placeholder: 'Body text', multiline: true },
    imagesOptional: true,
    imageHint: OPTIONAL_BACKGROUND,
  },
  quote: {
    label: 'Quote',
    imageSlots: 1,
    title: { label: 'Quote', placeholder: 'The quote', multiline: true },
    body: { label: 'Attribution', placeholder: 'Who said it' },
    imagesOptional: true,
    imageHint: OPTIONAL_BACKGROUND,
  },
  list: {
    label: 'List',
    imageSlots: 1,
    title: { label: 'Heading', placeholder: 'Heading' },
    body: { label: 'Items', placeholder: 'One item per line', multiline: true },
    imagesOptional: true,
    imageHint: OPTIONAL_BACKGROUND,
  },
  compare: {
    label: 'Before / after',
    imageSlots: 2,
    title: { label: 'Heading', placeholder: 'Heading (optional)' },
    body: { label: 'Labels', placeholder: 'One label per line, e.g. Before / After', multiline: true },
  },
  cta: {
    label: 'Call to action',
    imageSlots: 1,
    title: { label: 'Heading', placeholder: 'Heading' },
    body: { label: 'Subline', placeholder: 'Subline' },
    imagesOptional: true,
    imageHint: 'Without one, the cover image is used, blurred.',
  },
}

export const SLIDE_TYPE_ORDER = Object.keys(SLIDE_TYPES) as SlideType[]
