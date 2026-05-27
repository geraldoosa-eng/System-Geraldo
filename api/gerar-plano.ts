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

export default async function handleGerarPlano(reqBody: any, envApiKey?: string) {
  const apiKey = envApiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Chave de API do Gemini não configurada. Por favor, adicione a variável GOOGLE_API_KEY no arquivo .env');
  }

  const { dados_paciente } = reqBody;

  if (!dados_paciente) {
    throw new Error('Os dados do paciente são obrigatórios para a geração do plano alimentar.');
  }

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

  // Validação com try/catch ao dar JSON.parse para evitar crashes caso ocorra anomalia no texto
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
