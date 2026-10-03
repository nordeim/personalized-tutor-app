import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// SESSION-16 — the last two scaffold suppressions retired:
//   - `react-hooks/exhaustive-deps` is ON (warn): the 3 former "intentional
//     suppressions" were refactored to the latest-ref pattern (a useRef + a
//     no-deps update effect decouples the callback identity from the
//     consuming effect's deps — no useCallback refactor, the pinned firing
//     triggers unchanged; lesson-view's two reporters + onboarding's pickup).
//   - `@typescript-eslint/no-unused-vars` is ON (warn, TS-aware): it flags
//     dead code WITHOUT flagging named type-contract params (the base rule
//     flags those; it stays off so callback contracts keep their
//     documentation names). argsIgnorePattern/varsIgnorePattern "^_" for the
//     intentional keeps; caughtErrors none (unused catch bindings are fine).
//
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
    "react-hooks/exhaustive-deps": "warn", // session-16: the latest-ref pattern retired the suppressions
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

    // Session-16: the TS-aware unused-vars gate (dead code only — the base
    // rule would also flag named type-contract params; it stays off).
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        "args": "after-used",
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrors": "none",
      },
    ],

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
