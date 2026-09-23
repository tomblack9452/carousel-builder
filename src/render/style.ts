import { fontPair, nearestWeight, stack } from '../fonts/catalog'
import type { RenderDoc, TitleEffect } from '../types'

export interface Face {
  family: string
  weight: number
  /** In em. */
  letterSpacing: number
}

/** Fonts and text settings for one render, resolved from the project theme. */
export interface TypeStyle {
  heading: Face
  body: Face
  bodyBold: Face
  headingScale: number
  bodyScale: number
  accent: string
  text: string
  titleEffect: TitleEffect
  /** Applies the uppercase setting to heading text. */
  caps: (text: string) => string
}

export function typeStyle(doc: RenderDoc): TypeStyle {
  const theme = doc.project.theme
  const pair = fontPair(theme.fontPair)
  const bodyFamily = stack(pair.body)
  return {
    heading: {
      family: stack(pair.heading),
      weight: nearestWeight(pair.heading, theme.headingWeight),
      letterSpacing: theme.letterSpacing,
    },
    body: { family: bodyFamily, weight: Math.min(...pair.body.weights), letterSpacing: 0 },
    bodyBold: { family: bodyFamily, weight: Math.max(...pair.body.weights), letterSpacing: 0 },
    headingScale: theme.headingScale,
    bodyScale: theme.bodyScale,
    accent: theme.accent,
    text: theme.text,
    titleEffect: theme.titleEffect,
    caps: theme.uppercase ? (t) => t.toUpperCase() : (t) => t,
  }
}
