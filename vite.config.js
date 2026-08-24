import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

function copyRootLogo() {
  return {
    name: 'copy-root-mr-prmtu-logo',
    closeBundle() {
      const source = resolve(process.cwd(), 'mr-prmtu-logo.png')
      if (!existsSync(source)) return

      const assetsDir = resolve(process.cwd(), 'dist/assets')
      mkdirSync(assetsDir, { recursive: true })
      copyFileSync(source, resolve(assetsDir, 'mr-prmtu-logo.png'))
    },
  }
}

export default defineConfig({
  plugins: [react(), copyRootLogo()],
  base: '/union-court/'
})
