// @ts-expect-error - defineWorkspace exists in vitest/config
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/api',
  'packages/dashboard',
  'packages/cli',
]);