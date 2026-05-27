import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tbnurjoxeiasmpoqmboe.supabase.co'
const supabaseAnonKey = 'sb_publishable_BPJIqfZiGWTwmrB_VfsQcg_i6Jhba9w'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testPacientesFields() {
  console.log('\n=== Testando colunas de PACIENTES ===')
  
  // Vamos tentar inserir um paciente completo com campos comuns
  const testObj = {
    nome: 'Teste Coluna',
    email: 'teste@coluna.com',
    whatsapp: '11999999999',
    nutricionista_id: '00000000-0000-0000-0000-000000000000', // UUID invalido ou valido para teste
    nutri_id: '00000000-0000-0000-0000-000000000000',
    user_id: '00000000-0000-0000-0000-000000000000'
  }

  // Vamos testar inserindo um por um ou ver se da erro de coluna inexistente
  for (const field of Object.keys(testObj)) {
    const { error } = await supabase
      .from('pacientes')
      .insert([{ nome: 'Teste', [field]: testObj[field] }])
    
    if (error) {
      console.log(`Campo '${field}':`, error.message)
    } else {
      console.log(`Campo '${field}': Sucesso ao inserir ou ignorado!`)
    }
  }
}

async function testConsultasFields() {
  console.log('\n=== Testando colunas de CONSULTAS ===')
  
  const testObj = {
    paciente_id: '00000000-0000-0000-0000-000000000000',
    nutricionista_id: '00000000-0000-0000-0000-000000000000',
    nutri_id: '00000000-0000-0000-0000-000000000000',
    data: '2026-05-19T22:00:00Z',
    data_consulta: '2026-05-19T22:00:00Z',
    data_hora: '2026-05-19T22:00:00Z',
    datetime: '2026-05-19T22:00:00Z',
    horario: '2026-05-19T22:00:00Z',
    observacoes: 'Teste',
    status: 'agendado'
  }

  for (const field of Object.keys(testObj)) {
    const { error } = await supabase
      .from('consultas')
      .insert([{ [field]: testObj[field] }])
    
    if (error) {
      console.log(`Campo '${field}':`, error.message)
    } else {
      console.log(`Campo '${field}': Sucesso ao inserir ou ignorado!`)
    }
  }
}

async function run() {
  await testPacientesFields()
  await testConsultasFields()
}

run()
