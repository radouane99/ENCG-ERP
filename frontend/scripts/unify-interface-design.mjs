import ts from 'typescript'
import fs from 'node:fs'
import path from 'node:path'

// Only JSX className literals are changed. Routes, handlers, labels and data stay intact.
const root = path.resolve('src/features')
const files = []
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory() && entry.name !== '__tests__') walk(file)
    else if (entry.isFile() && file.endsWith('.tsx') && !/(?:\.test\.|Pdf|PDF|Preview|Template|Certificate)/.test(file)) files.push(file)
  }
}
walk(root)
files.push(...['Header.tsx', 'MobileBottomNav.tsx', 'AuthLayout.tsx'].map(file => path.resolve('src/shared/components/layout', file)))
const report = []
const neutral = {
  'bg-white': 'bg-card', 'bg-gray-50': 'bg-muted/50', 'bg-slate-50': 'bg-muted/50',
  'bg-gray-100': 'bg-muted', 'bg-slate-100': 'bg-muted',
  'text-gray-900': 'text-foreground', 'text-slate-900': 'text-foreground', 'text-gray-800': 'text-foreground', 'text-slate-800': 'text-foreground',
  'text-gray-500': 'text-muted-foreground', 'text-slate-500': 'text-muted-foreground', 'text-gray-600': 'text-muted-foreground', 'text-slate-600': 'text-muted-foreground',
  'border-gray-200': 'border-border', 'border-slate-200': 'border-border', 'border-gray-100': 'border-border', 'border-slate-100': 'border-border',
  'rounded-[2.5rem]': 'rounded-2xl', 'rounded-[3rem]': 'rounded-2xl',
  'rounded-3xl': 'rounded-2xl', 'shadow-2xl': 'shadow-sm', 'shadow-xl': 'shadow-sm',
  'font-black': 'font-bold', 'font-extrabold': 'font-bold',
}
function transformClasses(value, title, banner, control, pageRoot) {
  let tokens = value.split(/\s+/).filter(Boolean).map(token => {
    const customRadius = token.match(/^((?:[a-z-]+:)*)rounded-\[([0-9.]+)(rem|px)\]$/)
    if (customRadius) {
      const pixels = Number(customRadius[2]) * (customRadius[3] === 'rem' ? 16 : 1)
      if (pixels >= 16 && pixels < 999) return customRadius[1] + 'rounded-2xl'
    }
    const match = token.match(/^((?:[a-z-]+:)*)((?:bg|text|border|ring)-(?:blue|indigo)-(?:50|100|200|300|500|600|700|800|900))$/)
    if (match) {
      const [, prefix, utility] = match
      const [type, , shade] = utility.split('-')
      const amount = Number(shade)
      if (type === 'bg') return prefix + (amount <= 200 ? `bg-primary/${amount === 50 ? 5 : amount === 100 ? 10 : 15}` : amount >= 800 ? 'bg-secondary' : 'bg-primary')
      if (type === 'text' && amount >= 500) return prefix + 'text-primary'
      if (type === 'border') return prefix + (amount <= 300 ? 'border-primary/20' : 'border-primary')
      if (type === 'ring') return prefix + 'ring-ring'
    }
    const dark = token.match(/^dark:(bg|text|border)-(slate|gray)-(\d+)$/)
    if (dark) {
      const [, type, , level] = dark
      if (type === 'bg' && Number(level) >= 800) return Number(level) === 950 ? 'dark:bg-background' : 'dark:bg-card'
      if (type === 'text' && Number(level) <= 400) return Number(level) === 400 ? 'dark:text-muted-foreground' : 'dark:text-foreground'
      if (type === 'border') return 'dark:border-border'
    }
    const prefix = token.match(/^((?:hover:|focus:|focus-visible:|disabled:)*)((?:bg|text|border)-.+)$/)
    if (prefix && neutral[prefix[2]]) return prefix[1] + neutral[prefix[2]]
    return neutral[token] || token
  })
  if (banner) {
    tokens = tokens.filter(token => !/^(?:bg-gradient-|bg-linear-|from-|via-|to-|rounded-|shadow-)/.test(token))
    tokens.push('erp-page-banner')
  }
  if (title) {
    tokens = tokens.filter(token => !/^(?:(?:(?:sm:|md:|lg:|xl:))?text-(?:xs|sm|base|lg|xl|[2-9]xl|\[\d+(?:\.\d+)?(?:px|rem|em)\])|font-(?:black|extrabold|bold|semibold)|tracking-(?:tight|tighter|wide|wider|widest)|uppercase)$/.test(token))
    tokens.push('erp-page-title')
  }
  if (control) { tokens = tokens.filter(token => !/^rounded-/.test(token)); tokens.push('rounded-[var(--control-radius)]') }
  if (pageRoot) tokens = tokens.filter(token => !/^(?:(?:sm|md|lg|xl):)?p-(?:3|4|5|6|7|8|10|12)$/.test(token))
  for (const type of ['primary', 'success', 'warning', 'destructive']) {
    if (tokens.includes(`bg-${type}`) && !tokens.some(token => /^(?:bg-gradient-|bg-linear-)/.test(token))) {
      tokens = tokens.map(token => token === 'text-white' ? `text-${type}-foreground` : token)
    }
  }
  return [...new Set(tokens)].join(' ')
}
function containsTitle(node) {
  let found = false
  const visit = current => {
    if (ts.isJsxOpeningElement(current) && current.tagName.getText() === 'h1') found = true
    if (!found) ts.forEachChild(current, visit)
  }
  visit(node)
  return found
}
for (const file of files) {
  if (file.replaceAll('\\', '/').includes('/features/public/') && !/Inscription|Dossier|RegistrationFields/.test(path.basename(file))) continue
  const source = fs.readFileSync(file, 'utf8')
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const edits = []
  let titles = 0; let banners = 0
  function visit(node) {
    if (ts.isJsxAttribute(node) && node.name.getText(ast) === 'className' && node.initializer) {
      let concatenated = false
      const findConcatenation = current => {
        if (ts.isBinaryExpression(current) && current.operatorToken.kind === ts.SyntaxKind.PlusToken) concatenated = true
        ts.forEachChild(current, findConcatenation)
      }
      findConcatenation(node.initializer)
      // Spaces can be significant in manually concatenated classes. Leave those expressions intact.
      if (concatenated) return
      const opening = node.parent.parent
      const title = opening.tagName?.getText(ast) === 'h1'
      const tag = opening.tagName?.getText(ast)
      const fieldType = opening.attributes?.properties.find(attr => attr.name?.getText(ast) === 'type')?.initializer?.text
      const control = ['select', 'textarea'].includes(tag) || (tag === 'input' && !['checkbox', 'radio', 'hidden', 'file', 'range', 'color'].includes(fieldType))
      const parent = opening.parent
      let container = parent.parent
      while (container && ts.isParenthesizedExpression(container)) container = container.parent
      const pageRoot = file.replaceAll('\\', '/').includes('/pages/') && !file.replaceAll('\\', '/').includes('/public/') && ts.isJsxElement(parent) && ts.isReturnStatement(container) && ['div', 'main', 'section'].includes(tag) && containsTitle(parent)
      const staticValue = ts.isStringLiteral(node.initializer) ? node.initializer.text : ''
      const banner = !!staticValue && /bg-(?:gradient|linear)-/.test(staticValue) && /\btext-white\b/.test(staticValue) && ts.isJsxElement(parent) && containsTitle(parent)
      function replaceLiteral(literal) {
        if (ts.isStringLiteral(literal) || ts.isNoSubstitutionTemplateLiteral(literal)) {
          if (ts.isBinaryExpression(literal.parent) && ![ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken].includes(literal.parent.operatorToken.kind)) return
          if (ts.isCallExpression(literal.parent) && !['cn', 'clsx', 'classNames', 'cva'].includes(literal.parent.expression.getText(ast))) return
          const value = ts.isJsxAttribute(literal.parent) ? literal.text.replace(/&(amp|quot|apos|lt|gt);/g, (_, entity) => ({ amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' })[entity]) : literal.text
          const next = transformClasses(value, title, banner, control, pageRoot)
          if (next !== value) {
            const replacement = ts.isJsxAttribute(literal.parent) ? `"${next.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"` : JSON.stringify(next)
            edits.push({ start: literal.getStart(ast), end: literal.end, text: replacement })
            if (title) titles++
            if (banner) banners++
          }
        } else ts.forEachChild(literal, replaceLiteral)
      }
      replaceLiteral(node.initializer)
      return
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
  if (!edits.length) continue
  let output = source
  for (const edit of edits.sort((a, b) => b.start - a.start)) output = output.slice(0, edit.start) + edit.text + output.slice(edit.end)
  if (ast.parseDiagnostics.length || ts.createSourceFile(file, output, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX).parseDiagnostics.length) throw new Error(`JSX invalide : ${file}`)
  if (process.argv.includes('--write')) {
    for (let attempt = 0; ; attempt++) {
      try { fs.writeFileSync(file, output); break }
      catch (error) {
        if (!['EINVAL', 'EBUSY', 'EPERM'].includes(error.code) || attempt >= 4) throw error
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)))
      }
    }
  }
  report.push({ file: path.relative(process.cwd(), file).replaceAll('\\', '/'), classNames: edits.length, titles, banners })
}
console.log(JSON.stringify({ files: report.length, classNames: report.reduce((sum, row) => sum + row.classNames, 0), titles: report.reduce((sum, row) => sum + row.titles, 0), banners: report.reduce((sum, row) => sum + row.banners, 0), details: report }, null, 2))
if (process.argv.includes('--check') && report.length > 0) process.exitCode = 1
