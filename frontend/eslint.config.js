import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["dist", "node_modules"] },
  js.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    files: ["**/*.{ts,mts,cts,tsx}"],
    languageOptions: { parser: tseslint.parser, globals: globals.browser },
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: tseslint.configs.recommended.at(-1).rules,
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { parser: tseslint.parser },
    },
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      ...tseslint.configs.recommended.at(-1).rules,
      "vue/multi-word-component-names": "off",
    },
  },
  {
    languageOptions: { globals: globals.browser },
    rules: { "vue/multi-word-component-names": "off" },
  },
  prettier,
];
