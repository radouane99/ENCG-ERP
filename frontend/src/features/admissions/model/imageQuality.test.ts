import { describe, expect, it } from 'vitest'
import { assessImageQuality } from './imageQuality'
const pixels = (value: number) => { const data = new Uint8ClampedArray(20 * 20 * 4); for (let i = 0; i < data.length; i += 4) { data[i] = data[i + 1] = data[i + 2] = value; data[i + 3] = 255 } return data }
describe('Local image quality warnings', () => {
  it('signals dark, nearly blank and low resolution images', () => {
    expect(assessImageQuality(pixels(10), 20, 20, 1200, 1600)).toContain('dark')
    expect(assessImageQuality(pixels(255), 20, 20, 1200, 1600)).toContain('blank')
    expect(assessImageQuality(pixels(100), 20, 20, 300, 400)).toContain('resolution')
  })
  it('keeps a valid identity photo at its own size threshold and does not invent a crop verdict', () => {
    expect(assessImageQuality(pixels(100), 20, 20, 300, 400, true)).not.toContain('resolution')
    expect(assessImageQuality(pixels(100), 20, 20, 1200, 1600)).not.toContain('cropped')
  })
})
