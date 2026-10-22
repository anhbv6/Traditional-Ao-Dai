// PostToolUse (Write | Edit): chạy ESLint cho đúng file vừa sửa trong workspace chứa nó.
// Lỗi -> exit 2 để agent sửa ngay; file không phải TS/JS hoặc ngoài workspace -> bỏ qua.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const input = JSON.parse(readFileSync(0, 'utf8'))
const file = input.tool_input?.file_path ?? input.tool_response?.filePath
if (!file || !/\.(ts|tsx|mts|mjs)$/.test(file)) process.exit(0)

// Gốc repo suy từ vị trí script (.claude/hooks/) — không phụ thuộc kiểu đường dẫn của shell
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
// Git Bash trên Windows có thể đưa dạng /e/... -> đổi về E:/...
const absFile = path.resolve(file.replace(/^\/([a-zA-Z])\//, '$1:/'))
const rel = path.relative(root, absFile).split(path.sep).join('/')
const match = rel.match(/^(apps|packages)\/[^/]+/)
if (!match || rel.includes('/node_modules/') || rel.includes('/.next/') || rel.includes('/dist/')) process.exit(0)

const workspace = path.join(root, match[0])
const eslintBin = path.join(workspace, 'node_modules', 'eslint', 'bin', 'eslint.js')
const result = spawnSync(process.execPath, [eslintBin, '--no-warn-ignored', path.relative(workspace, absFile)], {
  cwd: workspace,
  encoding: 'utf8',
})
if (result.status !== 0) {
  process.stderr.write(`ESLint báo lỗi ở ${rel}:\n${result.stdout}${result.stderr}`)
  process.exit(2)
}
