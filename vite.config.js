import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // 상대 경로로 빌드 → GitHub Pages 저장소 이름이 바뀌어도 그대로 동작
  build: {
    chunkSizeWarningLimit: 600, // three(3D 라이브러리)가 커서 경고 기준을 올림. 입장할 때만 내려받음
    rolldownOptions: {
      output: {
        // 큰 라이브러리를 따로 담음 → 사이트를 고쳐도 하객이 라이브러리는 다시 내려받지 않음
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\/]three[\/]/ },
            { name: 'firebase', test: /node_modules[\/]@?firebase[\/]/ },
          ],
        },
      },
    },
  },
})
