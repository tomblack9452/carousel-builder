import type { Project, Slide } from '../types'
import { createSampleSlide, createSlide, starterProject, uid } from './factory'
import { presetTheme } from './presets'

export interface Template {
  id: string
  name: string
  /** Built-in templates can't be deleted. */
  builtIn?: boolean
  /** Layout, style and text only: image slots are empty and there's no logo. */
  project: Project
}

/** Copy of a project with images, logo and handle stripped, for saving as a template. */
export function toTemplateProject(project: Project): Project {
  const copy = JSON.parse(JSON.stringify(project)) as Project
  for (const slide of copy.slides) for (const slot of slide.images) Object.assign(slot, { asset: null, zoom: 1, px: 0, py: 0 })
  copy.logo.asset = null
  copy.caption = ''
  return copy
}

const withSlides = (slides: Slide[], theme = presetTheme('classic')): Project => ({ ...starterProject(), theme, slides })

const slide = (type: Slide['type'], title: string, body = '') => createSlide(type, { title, body })

export const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: 'builtin-tips',
    name: 'Top tips list',
    builtIn: true,
    project: withSlides([
      slide('cover', '5 tips\nyou need\nto know'),
      slide('list', 'The tips', 'Start small\nBe consistent\nTrack what works\nAsk for feedback\nKeep going'),
      slide('text', 'Why it works', 'Explain the idea behind your tips in a sentence or two.'),
      slide('quote', 'The best time to start was yesterday. The next best time is now.', 'Proverb'),
      createSampleSlide('cta'),
    ], presetTheme('minimal')),
  },
  {
    id: 'builtin-compare',
    name: 'Before and after',
    builtIn: true,
    project: withSlides([
      slide('cover', 'The\ntransformation'),
      slide('compare', '', 'Before\nAfter'),
      slide('compare', '', 'Day 1\nDay 30'),
      slide('text', 'What changed', 'Walk through the key steps that made the difference.'),
      createSampleSlide('cta'),
    ], presetTheme('bold')),
  },
  {
    id: 'builtin-quotes',
    name: 'Quote series',
    builtIn: true,
    project: withSlides([
      slide('cover', 'Words\nworth\nkeeping'),
      slide('quote', 'First quote goes here', 'Author'),
      slide('quote', 'Second quote goes here', 'Author'),
      slide('quote', 'Third quote goes here', 'Author'),
      createSlide('cta', { title: 'Which one hits hardest?', body: 'Tell me in the comments' }),
    ], presetTheme('editorial')),
  },
  {
    id: 'builtin-panorama',
    name: 'Panorama story',
    builtIn: true,
    project: withSlides([
      slide('panorama', 'Swipe', 'to see the whole view'),
      slide('panorama', ''),
      slide('panorama', ''),
      createSlide('cta', { title: 'Where should I go next?', body: 'Drop a suggestion below' }),
    ]),
  },
]

/** A fresh project from a template: new slide ids so it never collides with the template. */
export function projectFromTemplate(template: Template): Project {
  const project = JSON.parse(JSON.stringify(template.project)) as Project
  for (const s of project.slides) s.id = uid()
  return project
}
