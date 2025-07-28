import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // ← this forces ExcelJS to use its pre‑bundled browser version
      exceljs: 'exceljs/dist/exceljs.min.js',
    },
  },
})
