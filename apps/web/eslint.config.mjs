// ESLint cho Frontend — cấu hình Next + luật TypeScript chung (@repo/config) + luật ranh giới kiến trúc
// (AGENTS.md §7 "Ranh giới import"). Sửa luật ở đây thì cập nhật cả tài liệu.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { sharedTsRules } from "@repo/config/eslint/base";

/**
 * Import sâu vào feature khác bị cấm — đi qua `index.ts` của feature.
 * Ngoại lệ: file `*.server` (chỉ dùng ở server, không nằm trong barrel),
 * `features/admin/core/server/*` và `features/admin/core/session/permissions` (page server cần mà không kéo component client).
 * Admin không có barrel tổng: import `@/features/admin/core/<x>` hoặc `@/features/admin/modules/<m>`.
 */
const DEEP_FEATURE_IMPORT = {
  regex: String.raw`^@/features/(?:(?!admin/)[^/]+/(?!.*\.server$).+|admin/?|admin/(?!core/|modules/).+|admin/core/(?!server/)(?!session/permissions$)[^/]+/.+|admin/modules/[^/]+/.+)$`,
  message: "Import feature khác qua index của nó (@/features/<feature>, @/features/admin/core/<x>, @/features/admin/modules/<m>). Trong cùng feature dùng đường dẫn tương đối.",
};

const NO_FEATURES = {
  regex: "^@/features(/.*)?$",
  message: "Tầng dùng chung (lib/, hooks/, components/ui|shared|effects|feedback) không được phụ thuộc features/. Chuyển code vào feature hoặc truyền qua props.",
};

const LIB_ONLY_UI_COMPONENTS = {
  regex: String.raw`^@/components/(?!ui/).+$`,
  message: "lib/ chỉ được dùng components/ui (vd. toast) — không phụ thuộc component tự viết.",
};

const NO_COMPONENTS_FROM_LOWER_LAYER = {
  regex: String.raw`^(\.\./)+(components|core/[^/]+/components)(/.*)?$|^\./components(/.*)?$`,
  message: "Tầng dưới (api, constants, data, hooks, store, types, utils, validations, schemas, queries) không import ngược từ components/. Chuyển hằng số / kiểu xuống tầng dưới.",
};

const NO_SCHEMA_EXPORT = {
  regex: String.raw`^\./schemas(/.*)?$`,
  message: "Zod schema của Server Action là nội bộ module — không export qua index.ts.",
};

/** Mỗi nhóm file ghi đè hoàn toàn luật của nhóm trước (flat config không gộp mảng) nên luôn kèm DEEP_FEATURE_IMPORT */
const restrictImports = (files, extra = []) => ({
  files,
  rules: { "no-restricted-imports": ["error", { patterns: [DEEP_FEATURE_IMPORT, ...extra] }] },
});

const LOWER_LAYERS = "{api,constants,data,hooks,store,types,utils,validations,schemas,queries}";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      ...sharedTsRules,
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  restrictImports(["src/**/*.{ts,tsx}"]),
  restrictImports(["src/hooks/**", "src/components/{ui,shared,effects,feedback}/**"], [NO_FEATURES]),
  restrictImports(["src/lib/**"], [NO_FEATURES, LIB_ONLY_UI_COMPONENTS]),
  restrictImports(
    [
      `src/features/*/${LOWER_LAYERS}/**`,
      `src/features/admin/{core,modules}/*/${LOWER_LAYERS}/**`,
    ],
    [NO_COMPONENTS_FROM_LOWER_LAYER]
  ),
  restrictImports(["src/features/admin/{core,modules}/*/index.ts"], [NO_SCHEMA_EXPORT]),
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
