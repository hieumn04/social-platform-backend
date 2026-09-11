import tsParser from '@typescript-eslint/parser';
import path from 'path';
export default {
  root: true,
  parser: tsParser,
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: [path.resolve(__dirname, 'tsconfig.json')],
    sourceType: 'module',
  },
  env: {
    node: true,
    es2023: true,
    jest: true,
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended',
  ],
  rules: {
    // TypeScript rules
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // Prettier
    'prettier/prettier': ['error'],

    // JS rules
    'no-console': 'off',
    'no-unused-vars': 'warn',
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: path.resolve(__dirname, 'tsconfig.json'),
      },
    },
  },
};
