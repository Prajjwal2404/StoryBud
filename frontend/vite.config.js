import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/token': 'http://localhost:8000',
            '/users': 'http://localhost:8000',
            '/upload-story': 'http://localhost:8000',
            '/ws': {
                target: 'ws://localhost:8000',
                ws: true
            }
        }
    }
})
