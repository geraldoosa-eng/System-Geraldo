import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import handleGerarPlano from './api/gerar-plano'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente (incluindo chaves secretas sem o prefixo VITE_)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'api-server',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/api/gerar-plano' && req.method === 'POST') {
              let body = ''
              
              req.on('data', (chunk) => {
                body += chunk
              })
              
              req.on('end', async () => {
                try {
                  const reqBody = JSON.parse(body || '{}')
                  const apiKey = env.GOOGLE_API_KEY || env.GEMINI_API_KEY
                  
                  const result = await handleGerarPlano(reqBody, apiKey)
                  
                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify(result))
                } catch (error: any) {
                  res.writeHead(500, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ error: error.message || 'Erro interno do servidor' }))
                }
              })
            } else {
              next()
            }
          })
        }
      }
    ]
  }
})
