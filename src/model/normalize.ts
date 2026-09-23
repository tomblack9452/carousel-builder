import { ASPECTS, MAX_SLIDES } from '../constants'
import { clamp } from '../render/geometry'
import { FONT_PAIRS } from '../fonts/catalog'
import type { ImageSlot, Project, Slide, Theme } from '../types'
import { createSlot, createSlide, defaultTheme, starterProject } from './factory'
import { SLIDE_TYPES } from './slideTypes'

/*
 * Turn untrusted JSON (a saved session or an opened project file) into a valid
 * Project. Unknown fields are dropped and missing ones get defaults, so older
 * saves keep loading as the format grows.
 */

type Json = Record<string, unknown>

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback)
const num = (v: unknown, fallback: number, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) ? clamp(v, min, max) : fallback
const colour = (v: unknown, fallback: string) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : fallback)

export const isAssetId = (v: unknown): v is string => typeof v === 'string' && /^[\w-]{1,64}$/.test(v)

function normalizeSlot(raw: unknown): ImageSlot {
  const slot = createSlot()
  if (!isObject(raw)) return slot
  return {
    asset: isAssetId(raw.asset) ? raw.asset : null,
    zoom: num(raw.zoom, slot.zoom, 1, 3),
    px: num(raw.px, 0, -1, 1),
    py: num(raw.py, 0, -1, 1),
  }
}

function normalizeSlide(raw: unknown): Slide | null {
  if (!isObject(raw) || typeof raw.type !== 'string' || !(raw.type in SLIDE_TYPES)) return null
  const slide = createSlide(raw.type as Slide['type'], { title: str(raw.title), body: str(raw.body) })
  if (Array.isArray(raw.images)) slide.images = raw.images.slice(0, 4).map(normalizeSlot)
  while (slide.images.length < SLIDE_TYPES[slide.type].imageSlots) slide.images.push(createSlot())
  if (isObject(raw.text)) {
    const t = raw.text
    const d = slide.text
    slide.text = {
      align: t.align === 'left' || t.align === 'center' || t.align === 'right' ? t.align : d.align,
      anchor: t.anchor === 'top' || t.anchor === 'middle' || t.anchor === 'bottom' ? t.anchor : d.anchor,
      x: num(t.x, d.x, 0, 1),
      y: num(t.y, d.y, 0, 1),
    }
  }
  return slide
}

function normalizeTheme(raw: unknown, legacyAccent: unknown): Theme {
  const d = defaultTheme()
  const t = isObject(raw) ? raw : {}
  return {
    fontPair: typeof t.fontPair === 'string' && FONT_PAIRS.some((p) => p.id === t.fontPair) ? t.fontPair : d.fontPair,
    headingWeight: num(t.headingWeight, d.headingWeight, 100, 900),
    headingScale: num(t.headingScale, d.headingScale, 0.6, 1.4),
    bodyScale: num(t.bodyScale, d.bodyScale, 0.6, 1.4),
    letterSpacing: num(t.letterSpacing, d.letterSpacing, -0.1, 0.3),
    uppercase: typeof t.uppercase === 'boolean' ? t.uppercase : d.uppercase,
    // Early saves kept the accent at the top level.
    accent: colour(t.accent ?? legacyAccent, d.accent),
    text: colour(t.text, d.text),
    background: colour(t.background, d.background),
    overlay: colour(t.overlay, d.overlay),
    overlayStrength: num(t.overlayStrength, d.overlayStrength, 0, 1.5),
    titleEffect: t.titleEffect === 'glow' || t.titleEffect === 'none' ? t.titleEffect : d.titleEffect,
  }
}

export function normalizeProject(raw: unknown): Project {
  if (!isObject(raw)) throw new Error('Not a project')
  const defaults = starterProject()
  const slides = (Array.isArray(raw.slides) ? raw.slides : [])
    .map(normalizeSlide)
    .filter((s): s is Slide => s !== null)
    .slice(0, MAX_SLIDES)
  if (!slides.length) throw new Error('Project has no slides')
  return {
    aspect: typeof raw.aspect === 'string' && raw.aspect in ASPECTS ? (raw.aspect as Project['aspect']) : defaults.aspect,
    handle: str(raw.handle, defaults.handle),
    theme: normalizeTheme(raw.theme, raw.accent),
    slides,
  }
}

/** Every asset id a project points at, including slots its current types don't show. */
export function projectAssetIds(project: Project): Set<string> {
  const ids = new Set<string>()
  for (const slide of project.slides) for (const slot of slide.images) if (slot.asset) ids.add(slot.asset)
  return ids
}
