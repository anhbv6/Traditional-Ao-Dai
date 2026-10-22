// Stop: khi agent dừng mà có thay đổi code chưa kiểm tra -> chạy `pnpm check` (AGENTS.md §6).
// Lỗi -> exit 2, agent tiếp tục sửa. Ghi nhớ trạng thái đã kiểm tra xanh để không chạy lại khi không có gì đổi.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { execSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const input = JSON.parse(readFileSync(0, 'utf8'))
// Đã bị chặn một lần ở lượt dừng này -> không chặn nữa để tránh vòng lặp
if (input.stop_hook_active) process.exit(0)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const git = (args) => execSync(`git ${args}`, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  })

const changed = git('status --porcelain')
  .split('\n')
  .map((line) => line.slice(3).trim())
  .filter((f) => /\.(ts|tsx|mts|mjs|json)$/.test(f))
if (changed.length === 0) process.exit(0)

const fingerprint = createHash('sha1').update(git('diff HEAD')).update(changed.join('\n')).digest('hex')
const stampFile = path.join(root, '.claude', '.cache', 'last-check')
try {
  if (readFileSync(stampFile, 'utf8') === fingerprint) process.exit(0)
} catch {
  // chưa có dấu kiểm tra
}

const result = spawnSync('pnpm check', { cwd: root, encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024 })
if (result.status !== 0) {
  const output = `${result.stdout}${result.stderr}`.split('\n').slice(-60).join('\n')
  process.stderr.write(`pnpm check thất bại — sửa lỗi trước khi kết thúc:\n${output}\n`)
  process.exit(2)
}
mkdirSync(path.dirname(stampFile), { recursive: true })
writeFileSync(stampFile, fingerprint)
