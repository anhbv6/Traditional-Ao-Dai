// ESLint cho Backend API — cưỡng chế quy chuẩn ở docs/PROJECT_RULES.md (§3 TypeScript: không dùng `any`)
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      // Tham số bắt đầu bằng `_` là cố ý không dùng (vd. `next` của error handler Express)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  }
)
