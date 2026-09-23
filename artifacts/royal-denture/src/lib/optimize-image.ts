/**
 * Resize + compress images before upload (WebP when supported).
 * Max edge 1400px, quality 0.82 — keeps files well under Storage limits.
 */
export async function optimizeImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file
  // SVG / tiny files: upload as-is
  if (file.type === "image/svg+xml" || file.size < 40 * 1024) return file

  try {
    const bitmap = await createImageBitmap(file)
    const maxEdge = 1400
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()

    const webpBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.82)
    )
    if (webpBlob && webpBlob.size < file.size) {
      return new File([webpBlob], file.name.replace(/\.\w+$/, "") + ".webp", {
        type: "image/webp",
      })
    }

    const jpegBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    )
    if (jpegBlob && jpegBlob.size < file.size) {
      return new File([jpegBlob], file.name.replace(/\.\w+$/, "") + ".jpg", {
        type: "image/jpeg",
      })
    }
    return file
  } catch {
    return file
  }
}
