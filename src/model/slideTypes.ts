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
  /** Shown under the image controls, e.g. to explain an optional image. */
  imageHint?: string
}

export const SLIDE_TYPES: Record<SlideType, SlideTypeInfo> = {
  cover: {
    label: 'Cover',
    imageSlots: 1,
    title: { label: 'Title', placeholder: 'One line per row', multiline: true },
    body: null,
  },
  image: {
    label: 'Image + caption',
    imageSlots: 1,
    title: { label: 'Title', placeholder: 'Game name' },
    body: { label: 'Subtitle', placeholder: 'Console, year' },
  },
  cta: {
    label: 'Call to action',
    imageSlots: 1,
    title: { label: 'Heading', placeholder: "Which one's yours?" },
    body: { label: 'Subline', placeholder: 'Tell me in the comments' },
    imagesOptional: true,
    imageHint: 'Optional. Without one, the cover image is used, blurred.',
  },
}
