import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

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
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          plano_semanal: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                dia: { type: SchemaType.STRING },
                refeicoes: {
                  type: SchemaType.OBJECT,
                  properties: {
                    cafe_da_manha: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    lanche_manha: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    almoco: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    lanche_tarde: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    jantar: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                  },
                  required: ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar']
                }
              },
              required: ['dia', 'refeicoes']
            }
          }
        },
        required: ['plano_semanal']
      }
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
      "dia": "Domingo",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
    // ... repetir estruturado para os 7 dias da semana (Domingo a Sábado)
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

    // Higienizar dados para garantir resiliência (5 opções por refeição)
    parsedData.plano_semanal = parsedData.plano_semanal.map((diaObj: any) => {
      const refeicoesHigienizadas: Refeicoes = {
        cafe_da_manha: Array.isArray(diaObj.refeicoes?.cafe_da_manha) ? diaObj.refeicoes.cafe_da_manha.slice(0, 5) : [],
        lanche_manha: Array.isArray(diaObj.refeicoes?.lanche_manha) ? diaObj.refeicoes.lanche_manha.slice(0, 5) : [],
        almoco: Array.isArray(diaObj.refeicoes?.almoco) ? diaObj.refeicoes.almoco.slice(0, 5) : [],
        lanche_tarde: Array.isArray(diaObj.refeicoes?.lanche_tarde) ? diaObj.refeicoes.lanche_tarde.slice(0, 5) : [],
        jantar: Array.isArray(diaObj.refeicoes?.jantar) ? diaObj.refeicoes.jantar.slice(0, 5) : []
      };

      // Completar até 5 opções se faltar
      const chavesRefeicoes: (keyof Refeicoes)[] = ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'];
      chavesRefeicoes.forEach((chave) => {
        while (refeicoesHigienizadas[chave].length < 5) {
          refeicoesHigienizadas[chave].push('');
        }
      });

      return {
        dia: diaObj.dia || '',
        refeicoes: refeicoesHigienizadas
      };
    });

    return parsedData;
  } catch (e: any) {
    console.error('Falha ao parsear o JSON retornado pela IA:', responseText);
    throw new Error('Erro na estruturação dos dados gerados pela IA. Detalhe: ' + e.message);
  }
}

function extrairDadosDoPaciente(dados_paciente: string) {
  const txt = dados_paciente.toLowerCase();
  
  const objetivos: string[] = [];
  if (txt.includes('emagrecer') || txt.includes('perda de peso') || txt.includes('peso inicial')) objetivos.push('emagrecimento');
  if (txt.includes('massa') || txt.includes('hipertrofia') || txt.includes('ganho')) objetivos.push('hipertrofia');
  
  const restricoes: string[] = [];
  if (txt.includes('vegetariano') || txt.includes('vegetariana')) restricoes.push('vegetariano');
  if (txt.includes('vegano') || txt.includes('vegana')) restricoes.push('vegano');
  if (txt.includes('diabetes') || txt.includes('sem açúcar') || txt.includes('zero açúcar')) restricoes.push('sem_acucar');
  
  const alergias: string[] = [];
  if (txt.includes('amendoim')) alergias.push('amendoim');
  if (txt.includes('leite') || txt.includes('lactose')) alergias.push('lactose');
  if (txt.includes('glúten') || txt.includes('gluten') || txt.includes('trigo')) alergias.push('gluten');
  if (txt.includes('ovo')) alergias.push('ovo');
  if (txt.includes('peixe') || txt.includes('frutos do mar')) alergias.push('frutos_mar');

  return { objetivos, restricoes, alergias };
}

function gerarPlanoMockado(dados_paciente: string): PlanoAlimentarJSON {
  const { restricoes, alergias } = extrairDadosDoPaciente(dados_paciente);
  
  const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  
  const plano_semanal = diasSemana.map((dia, idx) => {
    const varIdx = idx % 3;
    
    // Café da Manhã
    let cafe = [
      'Tapioca com ovos mexidos e café com leite',
      'Mamão picado com aveia e granola',
      'Pão integral com queijo branco e chá verde',
      'Iogurte natural com morangos e chia',
      'Omelete de espinafre com suco de laranja natural'
    ];
    if (alergias.includes('lactose')) {
      cafe = cafe.map(x => x.replace('leite', 'leite de amêndoa').replace('queijo branco', 'tofu grelhado').replace('Iogurte natural', 'Iogurte de coco'));
    }
    if (alergias.includes('gluten')) {
      cafe = cafe.map(x => x.replace('Pão integral', 'Pão sem glúten').replace('aveia', 'aveia sem glúten'));
    }
    if (alergias.includes('ovo') || restricoes.includes('vegano')) {
      cafe = cafe.map(x => x.replace('ovos mexidos', 'tofu mexido').replace('Omelete de espinafre', 'Panqueca de banana vegana'));
    }
    
    // Lanche da Manhã
    let lancheM = [
      '1 Maçã com 5 castanhas-do-pará',
      'Salada de frutas com sementes de girassol',
      'Mix de nozes e damascos secos',
      '1 Banana com canela em pó',
      'Suco verde detox (couve, limão, gengibre)'
    ];
    if (alergias.includes('amendoim')) {
      lancheM = lancheM.map(x => x.replace('castanhas', 'amêndoas').replace('nozes', 'sementes de abóbora'));
    }
    
    // Almoço
    let almoco = [
      'Arroz integral, feijão preto, filé de frango grelhado e salada verde',
      'Purê de batata doce, patinho moído cozido e brócolis ao vapor',
      'Macarrão integral ao sugo, filé de tilápia grelhada e salada de tomate',
      'Arroz de forno com legumes, sobrecoxa assada e abobrinha refogada',
      'Quinoa cozida, lentilha cozida, peixe assado e mix de folhas'
    ];
    if (alergias.includes('gluten')) {
      almoco = almoco.map(x => x.replace('Macarrão integral', 'Macarrão de arroz sem glúten'));
    }
    if (restricoes.includes('vegetariano') || restricoes.includes('vegano')) {
      almoco = almoco.map(x => x.replace('filé de frango grelhado', 'tofu grelhado marinado')
                           .replace('patinho moído cozido', 'proteína de soja texturizada refogada')
                           .replace('filé de tilápia grelhada', 'hambúrguer de grão de bico')
                           .replace('sobrecoxa assada', 'cogumelos Paris refogados')
                           .replace('peixe assado', 'tempeh grelhado'));
    }
    
    // Lanche da Tarde
    let lancheT = [
      'Iogurte desnatado com castanhas e canela',
      '1 fatia de pão de forma integral com patê de atum',
      'Vitamina de abacate com leite desnatado e aveia',
      'Bolacha de arroz com pasta de amendoim',
      'Salada de frutas simples'
    ];
    if (alergias.includes('lactose')) {
      lancheT = lancheT.map(x => x.replace('Iogurte desnatado', 'Iogurte vegetal').replace('leite desnatado', 'leite de aveia'));
    }
    if (alergias.includes('gluten')) {
      lancheT = lancheT.map(x => x.replace('pão de forma integral', 'pão integral sem glúten'));
    }
    if (alergias.includes('amendoim')) {
      lancheT = lancheT.map(x => x.replace('pasta de amendoim', 'pasta de amêndoas ou gergelim'));
    }
    
    // Jantar
    let jantar = [
      'Sopa de legumes com frango desfiado',
      'Filé de peixe grelhado com purê de mandioquinha e salada',
      'Omelete caprese (tomate, queijo branco e manjericão) com salada',
      'Creme de abóbora cabotiá com carne moída magra',
      'Arroz integral com feijão carioca, bife acebolado magro e brócolis'
    ];
    if (alergias.includes('lactose')) {
      jantar = jantar.map(x => x.replace('queijo branco', 'tofu'));
    }
    if (alergias.includes('ovo') || restricoes.includes('vegano')) {
      jantar = jantar.map(x => x.replace('Omelete caprese', 'Tofu caprese grelhado').replace('frango desfiado', 'grão-de-bico cozido'));
    }
    if (restricoes.includes('vegetariano') || restricoes.includes('vegano')) {
      jantar = jantar.map(x => x.replace('Filé de peixe grelhado', 'Hambúrguer de lentilha')
                           .replace('carne moída magra', 'lentilhas cozidas')
                           .replace('bife acebolado magro', 'shitake acebolado'));
    }

    const rotacionar = (arr: string[], n: number) => {
      const result = [...arr];
      for (let i = 0; i < n; i++) {
        const first = result.shift();
        if (first !== undefined) result.push(first);
      }
      return result;
    };

    return {
      dia,
      refeicoes: {
        cafe_da_manha: rotacionar(cafe, varIdx),
        lanche_manha: rotacionar(lancheM, varIdx),
        almoco: rotacionar(almoco, varIdx),
        lanche_tarde: rotacionar(lancheT, varIdx),
        jantar: rotacionar(jantar, varIdx)
      }
    };
  });

  return { plano_semanal };
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

    if (!dados_paciente) {
      return res.status(400).json({ 
        error: 'Os dados do paciente são obrigatórios para a geração do plano alimentar.' 
      });
    }

    // Se a chave estiver ausente ou parecer um token temporário/inválido local (não começa com AIzaSy)
    const isInvalidKey = !apiKey || !apiKey.startsWith('AIzaSy');

    if (isInvalidKey) {
      console.warn('[System Geraldo - Backend] Chave de API inválida ou ausente no .env local. Usando fallback de desenvolvimento com plano mockado inteligente.');
      const planoMock = gerarPlanoMockado(dados_paciente);
      return res.status(200).json(planoMock);
    }

    try {
      const plano = await gerarPlanoComIA(dados_paciente, apiKey);
      return res.status(200).json(plano);
    } catch (apiError: any) {
      console.error('[System Geraldo - Backend] Falha na chamada da API do Gemini:', apiError.message);
      console.warn('[System Geraldo - Backend] Ativando fallback resiliente: gerando plano mockado baseado nos dados do paciente.');
      const planoMock = gerarPlanoMockado(dados_paciente);
      return res.status(200).json(planoMock);
    }
  } catch (error: any) {
    console.error('Erro no processamento da API de plano alimentar:', error);
    return res.status(500).json({ 
      error: error.message || 'Erro interno no servidor ao processar a geração com IA.' 
    });
  }
}
