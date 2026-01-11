import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default tseslint.config(
  // Ignore patterns
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.config.js'],
  },

  // Base JS config
  js.configs.recommended,

  // TypeScript config
  ...tseslint.configs.recommended,

  // API package
  {
    files: ['packages/api/src/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // File size rules for API
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 75, skipBlankLines: true, skipComments: true, IIFEs: true }],
      'complexity': ['warn', 15],
      'max-depth': ['warn', 4],
      'max-params': ['warn', 5],
    },
  },

  // Dashboard package
  {
    files: ['packages/dashboard/src/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // ============================================
      // FILE SIZE RULES
      // ============================================
      
      // Max lines per file
      'max-lines': ['warn', {
        max: 300,
        skipBlankLines: true,
        skipComments: true,
      }],

      // Max lines per function/component
      'max-lines-per-function': ['warn', {
        max: 75,
        skipBlankLines: true,
        skipComments: true,
        IIFEs: true,
      }],

      // Max statements in a function
      'max-statements': ['warn', 20],

      // Cyclomatic complexity
      'complexity': ['warn', 15],

      // Max nesting depth
      'max-depth': ['warn', 4],

      // Max function parameters
      'max-params': ['warn', 5],

      // Max nested callbacks
      'max-nested-callbacks': ['warn', 3],
    },
  },

  // ============================================
  // OVERRIDES - Must come AFTER main configs
  // ============================================

  // Test files - disable size rules entirely
  {
    files: [
      'packages/dashboard/src/__tests__/**/*.{ts,tsx}',
      'packages/dashboard/src/**/*.test.{ts,tsx}',
      'packages/dashboard/src/**/*.spec.{ts,tsx}',
      'packages/api/src/__tests__/**/*.ts',
      'packages/api/src/**/*.test.ts',
      'packages/api/src/**/*.spec.ts',
    ],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'max-statements': 'off',
      'max-nested-callbacks': 'off',
      'complexity': 'off',
      'max-depth': 'off',
    },
  },

  // Type definition files
  {
    files: ['**/types/**/*.ts', '**/types.ts', '**/*.d.ts'],
    rules: {
      'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': 'off',
    },
  },

  // Utils files (allow more lines, keep functions small)
  {
    files: ['**/utils/**/*.ts', '**/utils.ts', '**/helpers/**/*.ts'],
    rules: {
      'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
    },
  },

  // Hooks (smaller functions expected)
  {
    files: ['**/hooks/**/*.ts', '**/use*.ts'],
    rules: {
      'max-lines': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],
    },
  },
);