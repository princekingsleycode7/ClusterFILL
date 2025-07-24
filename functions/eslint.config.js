// functions/eslint.config.js

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Default recommended configurations
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Custom configuration for our source files
  {
    files: ["src/**/*.ts"],
    rules: {
      // You can add specific backend rule overrides here if needed
      // e.g., "@typescript-eslint/no-unused-vars": "warn"
    },
  },

  // Tell ESLint to ignore the compiled JavaScript output directory
  {
    ignores: ["lib/**"],
  }
);