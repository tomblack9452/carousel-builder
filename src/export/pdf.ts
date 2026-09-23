/**
 * Minimal PDF writer: one page per JPEG, each image filling its page.
 * JPEG data goes in as-is (DCTDecode), so there's no re-encoding.
 */

export interface PdfPage {
  jpeg: Uint8Array
  /** Pixel size of the image. */
  width: number
  height: number
}

/** Page size in points per image pixel (96 dpi images on a 72 pt/inch page). */
const PT_PER_PX = 0.75

export function buildPdf(pages: PdfPage[]): Blob {
  const encoder = new TextEncoder()
  const chunks: Uint8Array[] = []
  const offsets: number[] = []
  let length = 0

  const push = (part: string | Uint8Array) => {
    const bytes = typeof part === 'string' ? encoder.encode(part) : part
    chunks.push(bytes)
    length += bytes.length
  }
  const object = (id: number, body: string, stream?: Uint8Array) => {
    offsets[id] = length
    push(`${id} 0 obj\n${body}\n`)
    if (stream) {
      push('stream\n')
      push(stream)
      push('\nendstream\n')
    }
    push('endobj\n')
  }

  // Objects: 1 catalog, 2 page tree, then page/content/image triples.
  const pageId = (i: number) => 3 + i * 3
  push('%PDF-1.4\n%âãÏÓ\n')
  object(1, '<< /Type /Catalog /Pages 2 0 R >>')
  object(2, `<< /Type /Pages /Kids [${pages.map((_, i) => `${pageId(i)} 0 R`).join(' ')}] /Count ${pages.length} >>`)

  pages.forEach((page, i) => {
    const w = +(page.width * PT_PER_PX).toFixed(2)
    const h = +(page.height * PT_PER_PX).toFixed(2)
    const [pid, cid, iid] = [pageId(i), pageId(i) + 1, pageId(i) + 2]
    object(pid, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] `
      + `/Resources << /XObject << /Im0 ${iid} 0 R >> >> /Contents ${cid} 0 R >>`)
    const content = encoder.encode(`q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`)
    object(cid, `<< /Length ${content.length} >>`, content)
    object(iid, `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} `
      + `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>`, page.jpeg)
  })

  const size = 3 + pages.length * 3
  const xref = length
  push(`xref\n0 ${size}\n0000000000 65535 f \n`)
  for (let id = 1; id < size; id++) push(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`)
  push(`trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`)

  return new Blob(chunks as BlobPart[], { type: 'application/pdf' })
}
