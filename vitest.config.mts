import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.spec.ts'],
    // Integration tests share one database, so run files one at a time.
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 120000,
  },
})
