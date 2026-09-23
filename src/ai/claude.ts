import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import { SLIDE_TYPES } from '../model/slideTypes'
import type { Project, Slide } from '../types'

/*
 * Writing suggestions from Claude, called straight from the browser with the
 * user's own API key. The key is kept in this browser's localStorage and only
 * ever sent to Anthropic.
 */

const MODEL = 'claude-opus-5'
const KEY_STORAGE = 'anthropic-api-key'

export function getApiKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? ''
  } catch {
    return ''
  }
}

export function setApiKey(key: string): void {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key)
    else localStorage.removeItem(KEY_STORAGE)
  } catch {
    // Storage blocked: the key just won't be remembered.
  }
}

const SYSTEM = [
  'You write copy for Instagram carousel posts.',
  'Match the tone of the existing text. Be specific and concrete; avoid clichés, filler and emoji spam.',
  'Keep slide titles short enough to read at a glance on a phone.',
].join(' ')

/** One-line description of each slide, for giving Claude the context of the whole post. */
function outline(project: Project): string {
  return project.slides
    .map((s, i) => {
      const parts = [s.title.replace(/\n/g, ' '), s.body.replace(/\n/g, ' / ')].filter((t) => t.trim())
      return `${i + 1}. [${SLIDE_TYPES[s.type].label}] ${parts.join(' - ') || '(no text yet)'}`
    })
    .join('\n')
}

/** Friendly message for anything that can go wrong with a request. */
export function describeError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return 'Anthropic rejected that API key. Check it in the AI panel.'
  if (err instanceof Anthropic.PermissionDeniedError) return "That API key doesn't have access to this model."
  if (err instanceof Anthropic.RateLimitError) return 'Too many requests right now. Try again in a minute.'
  if (err instanceof Anthropic.APIConnectionError) return "Couldn't reach Anthropic. Check your connection."
  if (err instanceof Anthropic.APIError) return `Anthropic returned an error (${err.status ?? 'unknown'}). Try again.`
  if (err instanceof Error) return err.message
  return 'Something went wrong asking for suggestions.'
}

async function ask<T extends z.ZodType>(schema: T, content: Anthropic.Beta.BetaContentBlockParam[]): Promise<z.infer<T>> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('Add your Anthropic API key in the AI panel first.')
  // The key belongs to the person using the page, so calling from the browser is intended here.
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM,
    // Short copywriting: low effort keeps it quick.
    output_config: { effort: 'low', format: betaZodOutputFormat(schema) },
    // If a request is declined, let Anthropic retry it on its recommended fallback model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    messages: [{ role: 'user', content }],
  })
  if (response.stop_reason === 'refusal') throw new Error("Claude couldn't help with that one. Try rewording your slides.")
  if (!response.parsed_output) throw new Error("Claude's answer couldn't be read. Try again.")
  return response.parsed_output
}

const CaptionSchema = z.object({
  caption: z.string().describe('The caption text, without hashtags'),
  hashtags: z.array(z.string()).describe('Up to 5 relevant hashtags, each starting with #'),
})

export async function suggestCaption(project: Project): Promise<string> {
  const result = await ask(CaptionSchema, [{
    type: 'text',
    text: `Write an Instagram caption for this carousel. Open with a hook, keep it under 120 words, and end with a question or call to action.\n\nSlides:\n${outline(project)}`
      + (project.caption.trim() ? `\n\nTheir current draft, to improve on:\n${project.caption}` : ''),
  }])
  const tags = result.hashtags.slice(0, 5).map((t) => (t.startsWith('#') ? t : `#${t}`).replace(/\s+/g, ''))
  return tags.length ? `${result.caption.trim()}\n\n${tags.join(' ')}` : result.caption.trim()
}

const TitlesSchema = z.object({
  titles: z.array(z.string()).describe('Three alternative titles'),
})

export async function suggestTitles(project: Project, slide: Slide): Promise<string[]> {
  const index = project.slides.indexOf(slide)
  const info = SLIDE_TYPES[slide.type]
  const field = info.title?.label.toLowerCase() ?? 'title'
  const result = await ask(TitlesSchema, [{
    type: 'text',
    text: `Suggest three alternative ${field}s for slide ${index + 1} (a "${info.label}" slide) of this carousel.`
      + (slide.type === 'cover' ? ' It is the cover, so it should make people want to swipe. Use line breaks (\\n) to split it into 2 or 3 short rows.' : '')
      + `\n\nSlides:\n${outline(project)}`,
  }])
  return result.titles.slice(0, 3).map((t) => t.trim()).filter(Boolean)
}

const AltSchema = z.object({
  alt: z.string().describe('Alt text for the slide image, one or two sentences'),
})

/** `jpeg` is a base64 JPEG of the rendered slide. */
export async function suggestAltText(jpeg: string): Promise<string> {
  const result = await ask(AltSchema, [
    { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: jpeg } },
    {
      type: 'text',
      text: 'Write alt text for this Instagram carousel slide for people using screen readers. '
        + 'Describe what the image shows and include any text on it. Keep it under 250 characters. Do not start with "Image of".',
    },
  ])
  return result.alt.trim()
}
