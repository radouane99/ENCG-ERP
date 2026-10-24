export type ImageQualityWarning = 'resolution' | 'dark' | 'blank' | 'blur'
/** Local heuristics, not a document or authenticity classifier. Never uploads pixels. */
export function assessImageQuality(pixels: Uint8ClampedArray, width: number, height: number, originalWidth: number, originalHeight: number, photo = false): ImageQualityWarning[] {
  const warnings: ImageQualityWarning[] = []
  if (Math.min(originalWidth, originalHeight) < (photo ? 200 : 600)) warnings.push('resolution')
  if (width < 3 || height < 3 || pixels.length !== width * height * 4) return warnings
  const gray = new Float32Array(width * height)
  let sum = 0; let sumSquares = 0
  for (let i = 0; i < gray.length; i++) { const p = i * 4; const alpha = pixels[p + 3] / 255; gray[i] = (0.299 * pixels[p] + 0.587 * pixels[p + 1] + 0.114 * pixels[p + 2]) * alpha + 255 * (1 - alpha); sum += gray[i]; sumSquares += gray[i] ** 2 }
  const mean = sum / gray.length; const contrast = Math.sqrt(Math.max(0, sumSquares / gray.length - mean ** 2))
  if (mean < 55) warnings.push('dark')
  if (contrast < 8 && mean > 220) warnings.push('blank')
  let laplace = 0; let laplaceSquares = 0; let count = 0
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) { const i = y * width + x; const value = gray[i - width] + gray[i + width] + gray[i - 1] + gray[i + 1] - 4 * gray[i]; laplace += value; laplaceSquares += value ** 2; count++ }
  const sharpness = Math.max(0, laplaceSquares / count - (laplace / count) ** 2)
  if (!photo && contrast >= 8 && sharpness < 25) warnings.push('blur')
  return warnings
}
