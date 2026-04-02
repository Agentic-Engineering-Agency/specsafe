import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'content',
      include: ['tests/**/*.test.ts'],
    },
  },
  'generators',
]);
