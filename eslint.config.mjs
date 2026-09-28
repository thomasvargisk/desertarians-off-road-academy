import js from "@eslint/js";
import ts from "typescript-eslint";
import next from "eslint-config-next";

const eslintConfig = [
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: ts.parser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
    plugins: {
      "@typescript-eslint": ts.plugin,
    },
    rules: {
      ...ts.configs.recommended[2].rules,
      "no-undef": "off",
    },
  },
  next[0],
  next[1],
  {
    ignores: [".next/**", "out/**", "node_modules/**", ".open-next/**", ".wrangler/**"],
  },
];

export default eslintConfig;
