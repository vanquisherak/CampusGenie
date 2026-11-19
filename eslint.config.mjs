import { FlatCompat } from "@eslint/eslintrc";
import firebaseRulesPlugin from "@firebase/eslint-plugin-security-rules";

const compat = new FlatCompat();

const eslintConfig = [
  {
    ignores: ["node_modules/**", ".next/**", ".next-dev/**", "next-env.d.ts", "out/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript").map((config) => ({
    ...config,
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
  })),
  firebaseRulesPlugin.configs["flat/recommended"],
];

export default eslintConfig;