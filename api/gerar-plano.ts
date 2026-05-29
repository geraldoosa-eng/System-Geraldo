import { GoogleGenerativeAI } from '@google/generative-ai';

export interface Refeicoes {
  cafe_da_manha: string[];
  lanche_manha: string[];
  almoco: string[];
  lanche_tarde: string[];
  jantar: string[];
}

export interface DiaPlano {
  dia: string;
  refeicoes: Refeicoes;
}

export interface PlanoAlimentarJSON {
  plano_semanal: DiaPlano[];
}

// Função auxiliar contendo a lógica de comunicação com o Gemini
async function gerarPlanoComIA(dados_paciente: string, apiKey: string): Promise<PlanoAlimentarJSON> {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Usando o modelo gemini-2.5-flash conforme solicitado
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const prompt = `
Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dados_paciente}

⚠️ Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
    // ... repetir estruturado para os 7 dias da semana (Segunda a Domingo)
  ]
}
`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  if (!responseText) {
    throw new Error('A IA não retornou nenhuma resposta.');
  }

  try {
    const parsedData: PlanoAlimentarJSON = JSON.parse(responseText);
    
    // Validar se a estrutura básica foi retornada
    if (!parsedData.plano_semanal || !Array.isArray(parsedData.plano_semanal)) {
      throw new Error('A estrutura de dados retornada pela IA não possui o formato do plano semanal esperado.');
    }

    return parsedData;
  } catch (e: any) {
    console.error('Falha ao parsear o JSON retornado pela IA:', responseText);
    throw new Error('Erro na estruturação dos dados gerados pela IA. Detalhe: ' + e.message);
  }
}

// O handler padrão de Serverless Function nativo do Node.js para a Vercel
export default async function handleGerarPlano(req: any, res: any) {
  // Configuração básica de cabeçalhos CORS para produção
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Tratar requisição OPTIONS prévia do CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Apenas POST é aceito
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    // Na Vercel req.body já vem como objeto.
    const { dados_paciente } = req.body || {};
    
    // Ler a API key das variáveis de ambiente globais
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Chave de API do Gemini não configurada em produção. Por favor, adicione GOOGLE_API_KEY nas variáveis de ambiente da Vercel.' 
      });
    }

    if (!dados_paciente) {
      return res.status(400).json({ 
        error: 'Os dados do paciente são obrigatórios para a geração do plano alimentar.' 
      });
    }

    const plano = await gerarPlanoComIA(dados_paciente, apiKey);
    return res.status(200).json(plano);
  } catch (error: any) {
    console.error('Erro no processamento da API de plano alimentar:', error);
    return res.status(500).json({ 
      error: error.message || 'Erro interno no servidor ao processar a geração com IA.' 
    });
  }
}
