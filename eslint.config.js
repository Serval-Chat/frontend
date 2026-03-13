import js from '@eslint/js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import react from 'eslint-plugin-react';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import query from '@tanstack/eslint-plugin-query';
import tailwindcss from 'eslint-plugin-tailwindcss';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export default tseslint.config(
  { ignores: ['dist', 'src-tauri/**/*', 'vitest.config.ts', 'vite.config.ts'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      tailwindcss: {
        config: path.join(__dirname, 'src/styles/index.css'),
        callees: ['cn', 'cva', 'cx'],
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'no-relative-import-paths': noRelativeImportPaths,
      react,
      import: importPlugin,
      'jsx-a11y': jsxA11y,
      '@tanstack/query': query,
      tailwindcss,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      ...query.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        { allowSameFolder: true, rootDir: 'src', prefix: '@' },
      ],

      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-boolean-value': ['warn', 'never'],
      'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
      'react/jsx-sort-props': ['warn', { callbacksLast: true, shorthandFirst: true }],
      'react/jsx-no-useless-fragment': 'warn',
      'react/jsx-props-no-spreading': ['warn', { html: 'ignore', custom: 'enforce' }],
      'react/no-array-index-key': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/await-thenable': 'warn',

      'semi': 'off',
      'quotes': 'off',
      'comma-dangle': 'off',
      'object-curly-spacing': 'off',
      'arrow-body-style': ['warn', 'as-needed'],
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      'import/order': 'off',
      'import/no-default-export': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/ban-ts-comment': ['warn', { 'ts-ignore': 'allow-with-description' }],

      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/\\[var\\(--color-/]',
          message:
            'Use Tailwind utility classes instead of inline var(--color-*). ' +
            'These tokens are registered in @theme and available as direct utilities ' +
            '(e.g., text-muted-foreground, bg-bg-subtle, border-border-subtle).',
        },
      ],
      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/no-contradicting-classname': 'error',
      'react/display-name': 'warn',
      'react/no-multi-comp': ['warn', { ignoreStateless: true }],
    },
  },
);
