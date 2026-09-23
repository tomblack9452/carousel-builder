import { normalizeProject } from '../model/normalize'
import { toTemplateProject } from '../model/templates'
import type { Project } from '../types'

/*
 * Share links carry a project in the URL hash (#share=...): text, layout and
 * style, deflate-compressed and base64url-encoded. Images are left out, since
 * they'd make links far too long, so the person opening it adds their own.
 */

const PARAM = 'share'

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(out).arrayBuffer())
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

export async function shareUrl(project: Project): Promise<string> {
  const json = JSON.stringify(toTemplateProject(project))
  const packed = await pipe(new TextEncoder().encode(json), new CompressionStream('deflate-raw'))
  const url = new URL(window.location.href)
  url.hash = `${PARAM}=${toBase64Url(packed)}`
  return url.toString()
}

/** The encoded project in the current URL, if this is a share link. */
export function sharedPayload(): string | null {
  const match = window.location.hash.match(new RegExp(`^#${PARAM}=([\\w-]+)$`))
  return match ? match[1] : null
}

export async function readShared(payload: string): Promise<Project> {
  const bytes = await pipe(fromBase64Url(payload), new DecompressionStream('deflate-raw'))
  return normalizeProject(JSON.parse(new TextDecoder().decode(bytes)))
}

/** Drop the share data from the address bar so a reload doesn't ask again. */
export function clearSharedFromUrl(): void {
  history.replaceState(null, '', window.location.pathname + window.location.search)
}
