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
                  
                  // Injetamos a chave no process.env temporariamente para o ambiente local
                  process.env.GOOGLE_API_KEY = apiKey
                  
                  // Criamos objetos de requisição e resposta mockados com a mesma assinatura da Vercel
                  const mockReq = {
                    method: 'POST',
                    body: reqBody
                  }
                  
                  const mockRes = {
                    statusCode: 200,
                    headers: {} as Record<string, string>,
                    setHeader(name: string, value: string) {
                      this.headers[name] = value
                      return this
                    },
                    status(code: number) {
                      this.statusCode = code
                      return this
                    },
                    json(data: any) {
                      res.writeHead(this.statusCode, { 
                        'Content-Type': 'application/json',
                        ...this.headers
                      })
                      res.end(JSON.stringify(data))
                      return this
                    },
                    end() {
                      res.writeHead(this.statusCode, this.headers)
                      res.end()
                      return this
                    }
                  }
                  
                  await handleGerarPlano(mockReq, mockRes)
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
