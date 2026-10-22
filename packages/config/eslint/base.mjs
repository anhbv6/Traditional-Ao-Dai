// ESLint dùng chung cho workspace Node/TypeScript thuần (api, db, shared) — xem docs/PROJECT_RULES.md §3
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/** Luật TypeScript chung cho mọi workspace (kể cả web — web ghép thêm vào cấu hình Next) */
export const sharedTsRules = {
  // PROJECT_RULES §3: không dùng `any`
  '@typescript-eslint/no-explicit-any': 'error',
  // Tham số / biến bắt đầu bằng `_` là cố ý không dùng (vd. `next` của error handler Express)
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  // Chỉ nhập kiểu thì dùng `import type` — tránh kéo module thật vào bundle
  '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
  eqeqeq: ['error', 'smart'],
}

/**
 * Cấu hình cho workspace chạy trên Node.
 * @param {{ ignores?: string[] }} [options]
 */
export function nodeConfig({ ignores = [] } = {}) {
  return tseslint.config(
    { ignores: ['dist/**', 'node_modules/**', ...ignores] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      files: ['**/*.ts'],
      languageOptions: { globals: globals.node },
      rules: sharedTsRules,
    }
  )
}
