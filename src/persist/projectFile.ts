import { isAssetId, normalizeProject, projectAssetIds } from '../model/normalize'
import type { Project } from '../types'

const APP_TAG = 'carousel-builder'
const FILE_VERSION = 1

/** A project and its images in one self-contained JSON file. */
interface ProjectFile {
  app: typeof APP_TAG
  version: number
  project: Project
  /** Asset id → data URL. */
  assets: Record<string, string>
}

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export async function writeProjectFile(project: Project, blobOf: (id: string) => Blob | undefined): Promise<Blob> {
  const assets: Record<string, string> = {}
  for (const id of projectAssetIds(project)) {
    const blob = blobOf(id)
    if (blob) assets[id] = await toDataUrl(blob)
  }
  const file: ProjectFile = { app: APP_TAG, version: FILE_VERSION, project, assets }
  return new Blob([JSON.stringify(file)], { type: 'application/json' })
}

export async function readProjectFile(file: File): Promise<{ project: Project; assets: Record<string, Blob> }> {
  let data: unknown
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error(`${file.name} isn't a project file.`)
  }
  const parsed = data as Partial<ProjectFile> | null
  if (!parsed || parsed.app !== APP_TAG) throw new Error(`${file.name} isn't a project file.`)

  const project = normalizeProject(parsed.project)
  const assets: Record<string, Blob> = {}
  for (const [id, url] of Object.entries(parsed.assets ?? {})) {
    if (isAssetId(id) && typeof url === 'string' && /^data:(image|video)\//.test(url)) {
      assets[id] = await (await fetch(url)).blob()
    }
  }
  return { project, assets }
}
