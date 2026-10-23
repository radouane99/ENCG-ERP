import ts from 'typescript'
import fs from 'node:fs'
import path from 'node:path'

const configPath = path.resolve('tsconfig.json')
const config = ts.readConfigFile(configPath, ts.sys.readFile)
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'))
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath))
const versions = new Map()
const host = {
  getCompilationSettings: () => parsed.options,
  getScriptFileNames: () => parsed.fileNames,
  getScriptVersion: file => String(versions.get(file) ?? 0),
  getScriptSnapshot: file => fs.existsSync(file) ? ts.ScriptSnapshot.fromString(fs.readFileSync(file, 'utf8')) : undefined,
  getCurrentDirectory: () => process.cwd(),
  getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  readDirectory: ts.sys.readDirectory,
  directoryExists: ts.sys.directoryExists,
  getDirectories: ts.sys.getDirectories,
}
const service = ts.createLanguageService(host)
let changed = 0
const pending = []
for (const file of parsed.fileNames) {
  const edits = service.organizeImports({ type: 'file', fileName: file, mode: ts.OrganizeImportsMode.RemoveUnused }, {}, {})
  pending.push(...edits)
}
for (const edit of pending) {
    let source = fs.readFileSync(edit.fileName, 'utf8')
    for (const change of [...edit.textChanges].sort((a, b) => b.span.start - a.span.start)) {
      source = source.slice(0, change.span.start) + change.newText + source.slice(change.span.start + change.span.length)
    }
    fs.writeFileSync(edit.fileName, source)
    changed++
}
console.log(`Removed unused imports in ${changed} files; declarations and expressions are preserved.`)
