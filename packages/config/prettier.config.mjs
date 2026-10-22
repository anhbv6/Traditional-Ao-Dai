// Prettier dùng chung — giữ đúng phong cách đang có của từng workspace:
// web dùng nháy kép + chấm phẩy; api/db/shared/config dùng nháy đơn + không chấm phẩy.
/** @type {import('prettier').Config} */
export default {
  printWidth: 120,
  tabWidth: 2,
  trailingComma: 'es5',
  endOfLine: 'lf',
  singleQuote: true,
  semi: false,
  overrides: [
    {
      files: ['apps/web/**'],
      options: { singleQuote: false, semi: true },
    },
  ],
}
