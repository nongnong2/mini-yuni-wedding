import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // 상대 경로로 빌드 → GitHub Pages 저장소 이름이 바뀌어도 그대로 동작
})
