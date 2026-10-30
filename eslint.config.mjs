import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat();

export default [...compat.extends("next/core-web-vitals", "next/typescript")].map((config) => ({
  ...config,
  ignores: ["node_modules/**", ".next/**", "next-env.d.ts"],
}));