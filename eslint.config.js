import js from '@eslint/js';

const k6Globals = {
  __ENV: 'readonly',
  __VU: 'readonly',
  __ITER: 'readonly',
  open: 'readonly',
  console: 'readonly',
};

export default [
  { ignores: ['node_modules/**', 'reports/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: k6Globals },
    rules: { 'no-var': 'error', 'prefer-const': 'error' },
  },
];
