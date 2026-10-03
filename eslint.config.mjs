import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// SESSION-15 (S15-F3) — the lint gate hardened to the strongest rule set
// the codebase passes at ZERO findings (each enabling was experiment-
// verified before adoption):
//   - `react-hooks/purity` returns to the eslint-config-next v16 DEFAULT
//     (error — the react-hooks v7 compiler-era ruleset's core invariant).
//   - `prefer-const` / `no-unreachable` / `no-redeclare` /
//     `no-useless-escape` / `no-console` enabled at warn (core ESLint
//     guardrails next's preset does not turn on by itself).
//   - `no-console` is scoped OFF for `scripts/**` + `prisma/**`: the dev
//     probe scripts' console IS their output mechanism, and the seed logs
//     progress by design — zero findings remain in src/ and tests/.
//   - `react-hooks/exhaustive-deps` stays OFF deliberately: the codebase
//     has exactly 3 intentional dep suppressions in the quiz-flow timing
//     effects (lesson-view.tsx:132,137 — the reveal/advance effects fire
//     on lesson/question-change ONLY; onboarding-dashboard.tsx:178 — the
//     pending-setup pickup fires on publicMode change only). Adding the
//     deps without useCallback refactors would re-fire reset effects
//     mid-quiz and break the e2e-pinned auto-advance semantics — the
//     refactor risk outweighs the lint nicety (documented trade-off).

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // TypeScript rules
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/prefer-as-const": "off",
    "@typescript-eslint/no-unused-disable-directive": "off",

    // React rules
    "react-hooks/exhaustive-deps": "off", // the documented trade-off above
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",

    // Next.js rules
    "@next/next/no-img-element": "off",
    "@next/next/no-html-link-for-pages": "off",

    // General JavaScript rules — session-15 hardening (warn, zero findings)
    "prefer-const": "warn",
    "no-unreachable": "warn",
    "no-redeclare": "warn",
    "no-useless-escape": "warn",
    "no-console": "warn",

    // Still scaffold-level off (existing findings; not this session's scope)
    "no-unused-vars": "off",
    "no-debugger": "off",
    "no-empty": "off",
    "no-irregular-whitespace": "off",
    "no-case-declarations": "off",
    "no-fallthrough": "off",
    "no-mixed-spaces-and-tabs": "off",
    "no-undef": "off",
  },
}, {
  // The probe/seed scripts log BY DESIGN — the console is their output.
  files: ["scripts/**/*", "prisma/**/*"],
  rules: {
    "no-console": "off",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills", "delivery/**", "research/**", "tool-results/**", "mini-services/**", ".zscripts/**"]
}];

export default eslintConfig;
