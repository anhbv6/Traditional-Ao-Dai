// PreToolUse (Bash | PowerShell): chặn lệnh vi phạm quy tắc dự án (AGENTS.md §2, §11).
// Exit 2 + stderr -> Claude Code chặn lệnh và báo lý do cho agent.
import { readFileSync } from 'node:fs'

const input = JSON.parse(readFileSync(0, 'utf8'))
const command = String(input.tool_input?.command ?? '')

const RULES = [
  [/\bgit\s+add\s+(\.|-A\b|--all\b|\*)(\s|$)/, 'Không dùng `git add .` / `-A` / `--all` — chỉ add đúng file đã sửa: `git add -- <file>`.'],
  [/\bgit\s+push\b[^;&|\n]*\b(main|master)\b/, 'Không tự push lên main/master — dừng sau khi commit để người dùng kiểm tra.'],
  [/\bgit\s+push\b[^;&|\n]*(\s--force\b|\s-f\b)/, 'Không force push.'],
  [/\bgit\s+commit\b[^;&|\n]*\s(--no-verify|-n)\b/, 'Không bỏ qua hook khi commit (--no-verify).'],
  [/(^|[\s;&|(])npm\s+(i|install|ci|add)\b/, 'Dự án chỉ dùng pnpm: `pnpm add` / `pnpm --filter <workspace> add`.'],
  [/(^|[\s;&|(])yarn(\s|$)/, 'Dự án chỉ dùng pnpm, không dùng yarn.'],
  [/\bgit\s+add\b[^;&|\n]*\.env(\.(?!example\b)[\w.-]+)?(\s|$)/, 'Không commit file .env / .env.local — chỉ commit .env.example.'],
]

for (const [pattern, reason] of RULES) {
  if (pattern.test(command)) {
    process.stderr.write(`Bị chặn bởi quy tắc dự án: ${reason}\n`)
    process.exit(2)
  }
}
