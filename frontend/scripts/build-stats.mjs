import fs from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const html = fs.readFileSync('dist/index.html', 'utf8')
const files = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^" ]+\.js)"/g)].map(match => match[1]))]
const assets = files.map(file => fs.readFileSync(path.join('dist', file)))
const stats = {
  initialJsFiles: files,
  initialJsBytes: assets.reduce((total, data) => total + data.length, 0),
  initialJsGzipBytes: assets.reduce((total, data) => total + gzipSync(data).length, 0),
}
console.log(JSON.stringify(stats, null, 2))
if (stats.initialJsBytes > 750_000) throw new Error('Initial JavaScript budget exceeded (750 KB).')
