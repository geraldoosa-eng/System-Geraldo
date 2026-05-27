import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import { 
  Users, 
  LogOut, 
  Plus, 
  Search, 
  LayoutDashboard, 
  Calendar, 
  ChevronRight,
  UserCircle,
  User,
  Bell,
  Download,
  MessageCircle,
  Mail,
  Phone,
  BarChart2,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Share2,
  ChevronLeft,
  Settings,
  TrendingDown,
  Clock
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import './App.css'

// --- Tipos ---
interface Paciente {
  id: string
  nome: string
  email?: string
  whatsapp?: string
  telefone?: string
  nutricionista_id: string
  created_at: string
  data_nascimento?: string
  sexo?: string
  peso_inicial?: number
  altura?: number
  objetivos?: string[]
  objetivo_texto?: string
  nivel_atividade?: string
  patologias?: string[]
  restricoes_alimentares?: string[]
  alergias?: string[]
  medicamentos?: string
  suplementos?: string
  refeicoes_por_dia?: number
  horario_acorda?: string
  horario_dorme?: string
  litros_agua?: number
  atividade_fisica?: boolean
  atividade_fisica_descricao?: string
  observacoes?: string
}

interface Consulta {
  id: string
  paciente_id: string
  data_consulta: string
  peso?: number
  cintura?: number
  quadril?: number
  percentual_gordura?: number
  observacoes?: string
  proximo_retorno?: string
  created_at: string
  pacientes?: {
    nome: string
    email: string
    whatsapp: string
  }
}

// --- Componente de Autenticação ---
function Auth() {
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState('')
  const [crn, setCrn] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: nome, crn: crn }
          }
        })
        if (error) throw error
        
        toast.success('Conta criada! Verifique seu e-mail.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.success('Bem-vindo de volta!')
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container animate-fade">
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo-icon">G</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>System Geraldo</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {isRegistering ? 'Crie sua conta de nutricionista' : 'Acesse seu painel de controle'}
          </p>
        </div>

        <form onSubmit={handleAuth}>
          {isRegistering && (
            <div className="animate-fade">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Nome Completo</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required={isRegistering}
              />

              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>CRN (Registro Profissional)</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Ex: CRN-3 12345"
                value={crn}
                onChange={(e) => setCrn(e.target.value)}
                required={isRegistering}
              />
            </div>
          )}

          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>E-mail</label>
          <input 
            type="email" 
            className="input-field" 
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Senha</label>
          <input 
            type="password" 
            className="input-field" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processando...' : (isRegistering ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <button 
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
          >
            {isRegistering ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Cadastre-se agora'}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Componente do Dashboard ---
function Dashboard({ session }: { session: any }) {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [nutriNome, setNutriNome] = useState<string>('')
  
  // Controle de Visualização/Navegação
  const [currentView, setCurrentView] = useState<'dashboard' | 'pacientes' | 'perfil-paciente' | 'cadastro-paciente' | 'agenda' | 'perfil-nutri'>('dashboard')
  const [previousView, setPreviousView] = useState<'dashboard' | 'pacientes' | 'cadastro-paciente'>('dashboard')
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null)

  // Controle de Modais
  const [isAddPacienteOpen, setIsAddPacienteOpen] = useState(false)
  const [isAddConsultaOpen, setIsAddConsultaOpen] = useState(false)

  // Estados dos Formulários
  const [novoPacienteNome, setNovoPacienteNome] = useState('')
  const [novoPacienteEmail, setNovoPacienteEmail] = useState('')
  const [novoPacienteWhatsapp, setNovoPacienteWhatsapp] = useState('')
  
  const [novaConsultaData, setNovaConsultaData] = useState('')
  const [novaConsultaObs, setNovaConsultaObs] = useState('')

  // --- ESTADOS DO FORMULÁRIO DE CADASTRO DE PACIENTE ---
  const [activeCadastroTab, setActiveCadastroTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal')
  const [isEditing, setIsEditing] = useState(false)
  const [customPatologiasOptions, setCustomPatologiasOptions] = useState<string[]>([])
  const [customRestricoesOptions, setCustomRestricoesOptions] = useState<string[]>([])
  const [customAlergiasOptions, setCustomAlergiasOptions] = useState<string[]>([])

  // Aba 1 — Pessoal
  const [cadNome, setCadNome] = useState('')
  const [cadNascimento, setCadNascimento] = useState('')
  const [cadSexo, setCadSexo] = useState('')
  const [cadTelefone, setCadTelefone] = useState('')
  const [cadWhatsapp, setCadWhatsapp] = useState('')
  const [cadEmail, setCadEmail] = useState('')

  // Aba 2 — Clínico
  const [cadPeso, setCadPeso] = useState('')
  const [cadAltura, setCadAltura] = useState('')
  const [cadObjetivos, setCadObjetivos] = useState<string[]>([])
  const [cadObjetivoTexto, setCadObjetivoTexto] = useState('')
  const [cadNivelAtividade, setCadNivelAtividade] = useState('')
  const [cadPatologias, setCadPatologias] = useState<string[]>([])
  const [cadPatologiaLivre, setCadPatologiaLivre] = useState('')
  const [cadRestricoes, setCadRestricoes] = useState<string[]>([])
  const [cadRestricaoLivre, setCadRestricaoLivre] = useState('')
  const [cadAlergias, setCadAlergias] = useState<string[]>([])
  const [cadAlergiaLivre, setCadAlergiaLivre] = useState('')
  const [cadMedicamentos, setCadMedicamentos] = useState('')
  const [cadSuplementos, setCadSuplementos] = useState('')

  // Aba 3 — Hábitos
  const [cadRefeicoes, setCadRefeicoes] = useState('')
  const [cadAcorda, setCadAcorda] = useState('')
  const [cadDorme, setCadDorme] = useState('')
  const [cadAgua, setCadAgua] = useState('')
  const [cadAtividadeFisica, setCadAtividadeFisica] = useState(false)
  const [cadAtividadeDesc, setCadAtividadeDesc] = useState('')
  const [cadObservacoes, setCadObservacoes] = useState('')

  // --- ESTADOS EXTRAS PROMPT 5 ---
  const [activePerfilTab, setActivePerfilTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal')
  const [planosAlimentares, setPlanosAlimentares] = useState<any[]>([])
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)
  const [novaConsultaPeso, setNovaConsultaPeso] = useState('')
  const [novaConsultaCintura, setNovaConsultaCintura] = useState('')
  const [novaConsultaQuadril, setNovaConsultaQuadril] = useState('')
  const [novaConsultaGordura, setNovaConsultaGordura] = useState('')
  const [novaConsultaRetorno, setNovaConsultaRetorno] = useState('')

  // --- ESTADOS EXTRAS PROMPT 6 ---
  const [planoAtivo, setPlanoAtivo] = useState<any | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [activePlanTab, setActivePlanTab] = useState('Segunda-feira')

  // --- MÓDULO 1: AGENDA ---
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | null>(null)

  // --- MÓDULO 4: PERFIL DA NUTRICIONISTA ---
  const [nutriBio, setNutriBio] = useState('')
  const [nutriEspecialidade, setNutriEspecialidade] = useState('')
  const [nutriTelefone, setNutriTelefone] = useState('')
  const [nutriCrn, setNutriCrn] = useState('')
  const [nutriFotoUrl, setNutriFotoUrl] = useState('')
  const [nutriNomeCompleto, setNutriNomeCompleto] = useState('')
  const [savingPerfil, setSavingPerfil] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- MÓDULO 5: NOTIFICAÇÕES ---
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  // Sincroniza dados do paciente selecionado com as abas de edição do perfil
  useEffect(() => {
    if (selectedPacienteId && pacientes.length > 0) {
      const p = pacientes.find(x => x.id === selectedPacienteId)
      if (p) {
        setCadNome(p.nome || '')
        setCadNascimento(p.data_nascimento || '')
        setCadSexo(p.sexo || '')
        setCadTelefone(p.telefone || '')
        setCadWhatsapp(p.whatsapp || '')
        setCadEmail(p.email || '')
        
        setCadPeso(p.peso_inicial ? String(p.peso_inicial) : '')
        setCadAltura(p.altura ? String(p.altura) : '')
        setCadObjetivos(p.objetivos || [])
        setCadObjetivoTexto(p.objetivo_texto || '')
        setCadNivelAtividade(p.nivel_atividade || '')
        
        const patologiasPaciente = p.patologias || []
        setCadPatologias(patologiasPaciente)
        const padraoPatologias = ['Diabetes', 'Hipertensão', 'Dislipidemia', 'Gastrite', 'Nenhum']
        setCustomPatologiasOptions(patologiasPaciente.filter(x => !padraoPatologias.includes(x)))
        
        const restricoesPaciente = p.restricoes_alimentares || []
        setCadRestricoes(restricoesPaciente)
        const padraoRestricoes = ['Intolerância à Lactose', 'Intolerância ao Glúten', 'Vegano', 'Vegetariano', 'Nenhum']
        setCustomRestricoesOptions(restricoesPaciente.filter(x => !padraoRestricoes.includes(x)))
        
        const alergiasPaciente = p.alergias || []
        setCadAlergias(alergiasPaciente)
        const padraoAlergias = ['Proteína do Leite de Vaca (APLV)', 'Oleaginosas', 'Frutos do Mar', 'Nenhum']
        setCustomAlergiasOptions(alergiasPaciente.filter(x => !padraoAlergias.includes(x)))
        
        setCadMedicamentos(p.medicamentos || '')
        setCadSuplementos(p.suplementos || '')
        
        setCadRefeicoes(p.refeicoes_por_dia ? String(p.refeicoes_por_dia) : '')
        setCadAcorda(p.horario_acorda || '')
        setCadDorme(p.horario_dorme || '')
        setCadAgua(p.litros_agua ? String(p.litros_agua) : '')
        setCadAtividadeFisica(!!p.atividade_fisica)
        setCadAtividadeDesc(p.atividade_fisica_descricao || '')
        setCadObservacoes(p.observacoes || '')
      }
    }
  }, [selectedPacienteId, pacientes])

  // Busca planos alimentares do paciente selecionado
  useEffect(() => {
    const fetchPlanos = async () => {
      if (selectedPacienteId) {
        const { data, error } = await supabase
          .from('planos_alimentares')
          .select('*')
          .eq('paciente_id', selectedPacienteId)
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Erro ao buscar planos alimentares:', error)
        } else {
          setPlanosAlimentares(data || [])
        }
      } else {
        setPlanosAlimentares([])
      }
    }
    
    fetchPlanos()
  }, [selectedPacienteId])

  const resetCadastroForm = () => {
    setActiveCadastroTab('pessoal')
    setIsEditing(false)
    setCustomPatologiasOptions([])
    setCustomRestricoesOptions([])
    setCustomAlergiasOptions([])
    setCadNome('')
    setCadNascimento('')
    setCadSexo('')
    setCadTelefone('')
    setCadWhatsapp('')
    setCadEmail('')
    setCadPeso('')
    setCadAltura('')
    setCadObjetivos([])
    setCadObjetivoTexto('')
    setCadNivelAtividade('')
    setCadPatologias([])
    setCadPatologiaLivre('')
    setCadRestricoes([])
    setCadRestricaoLivre('')
    setCadAlergias([])
    setCadAlergiaLivre('')
    setCadMedicamentos('')
    setCadSuplementos('')
    setCadRefeicoes('')
    setCadAcorda('')
    setCadDorme('')
    setCadAgua('')
    setCadAtividadeFisica(false)
    setCadAtividadeDesc('')
    setCadObservacoes('')
  }

  // --- Helpers de Cálculo em tempo real ---
  const calcularIdade = (nascimento: string) => {
    if (!nascimento) return ''
    const hoje = new Date()
    const dataNasc = new Date(nascimento)
    let idade = hoje.getFullYear() - dataNasc.getFullYear()
    const mes = hoje.getMonth() - dataNasc.getMonth()
    if (mes < 0 || (mes === 0 && hoje.getDate() < dataNasc.getDate())) {
      idade--
    }
    return isNaN(idade) ? '' : `(${idade} anos)`
  }

  const calcularIMCValue = () => {
    const p = parseFloat(cadPeso)
    const a = parseFloat(cadAltura)
    if (!p || !a || isNaN(p) || isNaN(a)) return null
    return p / ((a / 100) ** 2)
  }

  const getClassificacaoIMC = (imc: number) => {
    if (imc < 18.5) return { classe: 'Baixo peso', status: 'danger' }
    if (imc >= 18.5 && imc < 25) return { classe: 'Peso normal', status: 'normal' }
    if (imc >= 25 && imc < 30) return { classe: 'Sobrepeso', status: 'alert' }
    return { classe: 'Obesidade', status: 'danger' }
  }

  const formatarHorarioNum = (numStr: string) => {
    if (!numStr) return ''
    const apenasNumeros = numStr.replace(/\D/g, '')
    if (!apenasNumeros) return ''
    let horas = 0
    let minutos = 0
    if (apenasNumeros.length <= 2) {
      horas = parseInt(apenasNumeros, 10)
    } else {
      horas = parseInt(apenasNumeros.slice(0, -2), 10)
      minutos = parseInt(apenasNumeros.slice(-2), 10)
    }
    if (horas > 23) horas = 23
    if (minutos > 59) minutos = 59
    const hPad = String(horas).padStart(2, '0')
    const mPad = String(minutos).padStart(2, '0')
    return `${hPad}:${mPad}`
  }

  const getUltimaConsultaPaciente = (pacienteId: string) => {
    const consultasP = consultas.filter(c => c.paciente_id === pacienteId)
    if (consultasP.length === 0) return 'Nenhuma consulta'
    const ultima = consultasP[consultasP.length - 1]
    return new Date(ultima.data_consulta).toLocaleDateString('pt-BR')
  }

  const renderWeightChart = () => {
    const consultasOrdenadasPeso = [...consultasSelecionado]
      .filter(c => c.peso !== null && c.peso !== undefined && !isNaN(Number(c.peso)))
      .sort((a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime())

    if (consultasOrdenadasPeso.length === 0) {
      return (
        <div className="weight-chart-empty animate-fade">
          <Calendar size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
          <p>Nenhuma consulta com registro de peso ainda.</p>
        </div>
      )
    }

    const pesos = consultasOrdenadasPeso.map(c => Number(c.peso))
    const minPeso = Math.min(...pesos)
    const maxPeso = Math.max(...pesos)
    const pesoMin = minPeso - (maxPeso - minPeso === 0 ? 5 : (maxPeso - minPeso) * 0.15)
    const pesoMax = maxPeso + (maxPeso - minPeso === 0 ? 5 : (maxPeso - minPeso) * 0.15)
    const pesoDiff = pesoMax - pesoMin || 1

    const width = 600
    const height = 200
    const paddingX = 60
    const paddingY = 35

    const points = consultasOrdenadasPeso.map((c, i) => {
      const x = paddingX + (i / (consultasOrdenadasPeso.length - 1 || 1)) * (width - 2 * paddingX)
      const y = height - paddingY - ((Number(c.peso) - pesoMin) / pesoDiff) * (height - 2 * paddingY)
      return { x, y, peso: c.peso, data: new Date(c.data_consulta).toLocaleDateString('pt-BR') }
    })

    let linePath = ''
    let areaPath = ''

    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y} `
      areaPath = `M ${points[0].x} ${height - paddingY} L ${points[0].x} ${points[0].y} `

      for (let i = 1; i < points.length; i++) {
        linePath += `L ${points[i].x} ${points[i].y} `
        areaPath += `L ${points[i].x} ${points[i].y} `
      }

      areaPath += `L ${points[points.length - 1].x} ${height - paddingY} Z`
    }

    return (
      <div className="weight-chart-container animate-fade">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ margin: 0, fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>Evolução de Peso (kg)</h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{points.length} registros</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="weight-chart-svg">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#f1f5f9" strokeWidth="1" />
          <line x1={paddingX} y1={height/2} x2={width - paddingX} y2={height/2} stroke="#f1f5f9" strokeWidth="1" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#e2e8f0" strokeWidth="1.5" />

          {points.length > 1 && (
            <>
              <path d={areaPath} fill="url(#chartGradient)" />
              <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}

          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="5" fill="white" stroke="var(--primary)" strokeWidth="3" />
              <circle cx={p.x} cy={p.y} r="8" fill="var(--primary)" fillOpacity="0.15" />
              
              <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--primary)">
                {p.peso} kg
              </text>

              <text x={p.x} y={height - 12} textAnchor="middle" fontSize="9" fontWeight="500" fill="var(--text-muted)">
                {p.data}
              </text>
            </g>
          ))}
        </svg>
      </div>
    )
  }

  // --- Toggle Multi-Escolha com "Nenhum" ---
  const handleTogglePatologia = (pat: string) => {
    if (pat === 'Nenhum') {
      setCadPatologias(['Nenhum'])
    } else {
      const filtrado = cadPatologias.filter(p => p !== 'Nenhum')
      if (filtrado.includes(pat)) {
        setCadPatologias(filtrado.filter(p => p !== pat))
      } else {
        setCadPatologias([...filtrado, pat])
      }
    }
  }

  const handleToggleRestricao = (res: string) => {
    if (res === 'Nenhum') {
      setCadRestricoes(['Nenhum'])
    } else {
      const filtrado = cadRestricoes.filter(r => r !== 'Nenhum')
      if (filtrado.includes(res)) {
        setCadRestricoes(filtrado.filter(r => r !== res))
      } else {
        setCadRestricoes([...filtrado, res])
      }
    }
  }

  const handleToggleAlergia = (al: string) => {
    if (al === 'Nenhum') {
      setCadAlergias(['Nenhum'])
    } else {
      const filtrado = cadAlergias.filter(a => a !== 'Nenhum')
      if (filtrado.includes(al)) {
        setCadAlergias(filtrado.filter(a => a !== al))
      } else {
        setCadAlergias([...filtrado, al])
      }
    }
  }

  const handleToggleObjetivo = (obj: string) => {
    if (cadObjetivos.includes(obj)) {
      setCadObjetivos(cadObjetivos.filter(o => o !== obj))
    } else {
      setCadObjetivos([...cadObjetivos, obj])
    }
  }

  const handleAddCustomPatologia = () => {
    if (cadPatologiaLivre.trim()) {
      const nova = cadPatologiaLivre.trim()
      const filtrado = cadPatologias.filter(p => p !== 'Nenhum')
      if (!filtrado.includes(nova)) {
        setCadPatologias([...filtrado, nova])
      }
      if (!customPatologiasOptions.includes(nova)) {
        setCustomPatologiasOptions([...customPatologiasOptions, nova])
      }
      setCadPatologiaLivre('')
    }
  }

  const handleAddCustomRestricao = () => {
    if (cadRestricaoLivre.trim()) {
      const nova = cadRestricaoLivre.trim()
      const filtrado = cadRestricoes.filter(r => r !== 'Nenhum')
      if (!filtrado.includes(nova)) {
        setCadRestricoes([...filtrado, nova])
      }
      if (!customRestricoesOptions.includes(nova)) {
        setCustomRestricoesOptions([...customRestricoesOptions, nova])
      }
      setCadRestricaoLivre('')
    }
  }

  const handleAddCustomAlergia = () => {
    if (cadAlergiaLivre.trim()) {
      const nova = cadAlergiaLivre.trim()
      const filtrado = cadAlergias.filter(a => a !== 'Nenhum')
      if (!filtrado.includes(nova)) {
        setCadAlergias([...filtrado, nova])
      }
      if (!customAlergiasOptions.includes(nova)) {
        setCustomAlergiasOptions([...customAlergiasOptions, nova])
      }
      setCadAlergiaLivre('')
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Buscar perfil da nutricionista
      const { data: nutriData, error: nutriError } = await supabase
        .from('nutricionistas')
        .select('nome')
        .eq('id', session.user.id)
        .maybeSingle()

      if (nutriError) {
        console.error('Erro ao buscar perfil da nutricionista:', nutriError)
      } else if (nutriData) {
        setNutriNome(nutriData.nome)
        setNutriNomeCompleto(nutriData.nome || '')
        setNutriBio(nutriData.bio || '')
        setNutriEspecialidade(nutriData.especialidade || '')
        setNutriTelefone(nutriData.telefone || '')
        setNutriCrn(nutriData.crn || '')
        setNutriFotoUrl(nutriData.foto_url || '')
      }
      
      // 1. Buscar todos os pacientes da nutricionista logada
      const { data: pacientesData, error: pacientesError } = await supabase
        .from('pacientes')
        .select('*')
        .eq('nutricionista_id', session.user.id)
        .order('nome', { ascending: true })

      if (pacientesError) throw pacientesError
      setPacientes(pacientesData || [])

      // 2. Buscar todas as consultas dos pacientes desta nutricionista
      const { data: consultasData, error: consultasError } = await supabase
        .from('consultas')
        .select('*, pacientes!inner(nutricionista_id, nome, email, whatsapp)')
        .eq('pacientes.nutricionista_id', session.user.id)
        .order('data_consulta', { ascending: true })

      if (consultasError) throw consultasError
      setConsultas(consultasData || [])
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => supabase.auth.signOut()

  // --- MÓDULO 4: SALVAR PERFIL DA NUTRICIONISTA ---
  const handleSalvarPerfilNutri = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nutriNomeCompleto.trim()) {
      toast.error('O nome é obrigatório!')
      return
    }
    try {
      setSavingPerfil(true)
      const { error } = await supabase
        .from('nutricionistas')
        .update({
          nome: nutriNomeCompleto.trim(),
          bio: nutriBio.trim() || null,
          especialidade: nutriEspecialidade.trim() || null,
          telefone: nutriTelefone.trim() || null,
          crn: nutriCrn.trim() || null,
          foto_url: nutriFotoUrl || null,
        })
        .eq('id', session.user.id)
      if (error) throw error
      setNutriNome(nutriNomeCompleto.trim())
      toast.success('Perfil atualizado com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao salvar perfil: ' + error.message)
    } finally {
      setSavingPerfil(false)
    }
  }

  // --- MÓDULO 4: UPLOAD FOTO ---
  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setNutriFotoUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // --- MÓDULO 2: EXPORTAR PDF DO PLANO ---
  const handleExportPlanPDF = (plan: any) => {
    const printWin = window.open('', '_blank', 'width=800,height=700')
    if (!printWin) { toast.error('Permita pop-ups para exportar PDF.'); return }
    const nutriName = nutriNome || 'Nutricionista'
    const pacienteNome = pacientes.find(p => p.id === selectedPacienteId)?.nome || ''
    const dataGeracao = new Date(plan.created_at).toLocaleDateString('pt-BR')
    const labelMap: any = {
      cafe_da_manha: '☕ Café da Manhã', lanche_manha: '🍎 Lanche da Manhã',
      almoco: '🍛 Almoço', lanche_tarde: '🍪 Lanche da Tarde', jantar: '🥗 Jantar'
    }
    let diasHtml = ''
    if (plan.conteudo?.plano_semanal) {
      diasHtml = plan.conteudo.plano_semanal.map((diaObj: any) => {
        const refHtml = Object.keys(diaObj.refeicoes).map(key => {
          const itens = diaObj.refeicoes[key].filter((i: string) => i.trim() !== '')
          if (!itens.length) return ''
          return `<div style="margin-bottom:12px"><strong style="color:#10b981">${labelMap[key] || key}</strong><ul style="margin:4px 0 0 18px;color:#475569">${itens.map((i: string) => `<li>${i}</li>`).join('')}</ul></div>`
        }).join('')
        return `<div style="page-break-inside:avoid;margin-bottom:20px;padding:16px;border:1px solid #e2e8f0;border-radius:8px"><h3 style="color:#0f172a;margin:0 0 12px;font-size:1rem">${diaObj.dia}</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">${refHtml}</div></div>`
      }).join('')
    }
    printWin.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Plano Alimentar — ${pacienteNome}</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#0f172a}h1{color:#10b981;border-bottom:2px solid #10b981;padding-bottom:10px}p.sub{color:#64748b;font-size:14px}@media print{body{padding:15px}}</style></head><body><h1>🥗 Plano Alimentar Semanal</h1><p class="sub"><strong>Paciente:</strong> ${pacienteNome} &nbsp;|&nbsp; <strong>Nutricionista:</strong> ${nutriName} &nbsp;|&nbsp; <strong>Gerado em:</strong> ${dataGeracao}</p><hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">${diasHtml}<p style="margin-top:30px;font-size:11px;color:#94a3b8;text-align:center">Gerado pelo System Geraldo — ${new Date().toLocaleDateString('pt-BR')}</p></body></html>`)
    printWin.document.close()
    setTimeout(() => { printWin.print() }, 400)
  }

  // --- MÓDULO 3: WHATSAPP & EMAIL ---
  const handleWhatsApp = (paciente: any) => {
    if (!paciente?.whatsapp) { toast.error('Paciente sem WhatsApp cadastrado.'); return }
    const numero = paciente.whatsapp.replace(/\D/g, '')
    const mensagem = encodeURIComponent(`Olá ${paciente.nome}! Tudo bem? Sou sua nutricionista. Gostaria de falar sobre o seu acompanhamento. 😊`)
    window.open(`https://wa.me/55${numero}?text=${mensagem}`, '_blank')
  }

  const handleEmail = (paciente: any) => {
    if (!paciente?.email) { toast.error('Paciente sem e-mail cadastrado.'); return }
    const assunto = encodeURIComponent(`Acompanhamento Nutricional — ${paciente.nome}`)
    const corpo = encodeURIComponent(`Olá ${paciente.nome},\n\nEspero que esteja bem!\n\nAtenciosamente,\n${nutriNome}`)
    window.location.href = `mailto:${paciente.email}?subject=${assunto}&body=${corpo}`
  }

  const handleCompartilharPlano = (plan: any, pacienteNome: string) => {
    let texto = `📋 Plano Alimentar Semanal — ${pacienteNome}\n\n`
    if (plan.conteudo?.plano_semanal) {
      plan.conteudo.plano_semanal.forEach((diaObj: any) => {
        texto += `📅 ${diaObj.dia}\n`
        Object.keys(diaObj.refeicoes).forEach(key => {
          const labelMap: any = { cafe_da_manha: 'Café da Manhã', lanche_manha: 'Lanche da Manhã', almoco: 'Almoço', lanche_tarde: 'Lanche da Tarde', jantar: 'Jantar' }
          const itens = diaObj.refeicoes[key].filter((i: string) => i.trim() !== '')
          if (itens.length) {
            texto += `  ${labelMap[key] || key}: ${itens.join(' / ')}\n`
          }
        })
        texto += '\n'
      })
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto)
      toast.success('Plano copiado para a área de transferência! Cole no WhatsApp.')
    }
  }

  // --- MÓDULO 5: NOTIFICAÇÕES (LÓGICA) ---
  const getAlertas = () => {
    const hoje = new Date()
    const seteDisasAntes = new Date()
    seteDisasAntes.setDate(hoje.getDate() + 7)
    const trintaDiasAtras = new Date()
    trintaDiasAtras.setDate(hoje.getDate() - 30)

    const alertas: { tipo: 'danger' | 'warning' | 'success'; titulo: string; descricao: string; pacienteId?: string }[] = []

    pacientes.forEach(p => {
      const consultasP = consultas.filter(c => c.paciente_id === p.id)
      const futuras = consultasP.filter(c => new Date(c.data_consulta) >= hoje)
      const passadas = consultasP.filter(c => new Date(c.data_consulta) < hoje)

      // Alerta: sem retorno há +30 dias
      if (futuras.length === 0 && passadas.length > 0) {
        const ultima = passadas[passadas.length - 1]
        if (new Date(ultima.data_consulta) < trintaDiasAtras) {
          alertas.push({
            tipo: 'danger',
            titulo: `${p.nome} sem retorno`,
            descricao: `Última consulta em ${new Date(ultima.data_consulta).toLocaleDateString('pt-BR')} (+30 dias)`,
            pacienteId: p.id
          })
        }
      }

      // Alerta: próximo retorno em menos de 7 dias
      futuras.forEach(c => {
        const dataConsulta = new Date(c.data_consulta)
        if (dataConsulta >= hoje && dataConsulta <= seteDisasAntes) {
          alertas.push({
            tipo: 'warning',
            titulo: `Consulta em breve: ${p.nome}`,
            descricao: `Agendada para ${dataConsulta.toLocaleDateString('pt-BR')} às ${dataConsulta.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
            pacienteId: p.id
          })
        }
      })
    })

    return alertas.slice(0, 20)
  }

  // --- MÓDULO 1: CALENDÁRIO (LÓGICA) ---
  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDay = new Date(firstDay)
    startDay.setDate(firstDay.getDate() - firstDay.getDay())
    const days: Date[] = []
    const current = new Date(startDay)
    while (current <= lastDay || days.length % 7 !== 0) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
      if (days.length > 42) break
    }
    return days
  }

  const getConsultasPorDia = (date: Date) => {
    return consultas.filter(c => {
      const d = new Date(c.data_consulta)
      return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()
    })
  }

  const getConsultasDoDiaSelecionado = () => {
    if (!selectedCalendarDay) {
      // Mostra consultas do mês atual
      return consultas.filter(c => {
        const d = new Date(c.data_consulta)
        return d.getMonth() === calendarDate.getMonth() && d.getFullYear() === calendarDate.getFullYear()
      }).sort((a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime())
    }
    return getConsultasPorDia(selectedCalendarDay).sort((a, b) =>
      new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime()
    )
  }

  // --- MÓDULO 2: EVOLUÇÃO DE PESO (ranking) ---
  const getRankingEvolucao = () => {
    const ranking: { paciente: any; evolucao: number }[] = []
    pacientes.forEach(p => {
      const consultasP = consultas
        .filter(c => c.paciente_id === p.id && c.peso)
        .sort((a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime())
      if (consultasP.length >= 2) {
        const primeiro = Number(consultasP[0].peso)
        const ultimo = Number(consultasP[consultasP.length - 1].peso)
        const evolucao = primeiro - ultimo // positivo = emagrecimento
        ranking.push({ paciente: p, evolucao })
      }
    })
    return ranking.sort((a, b) => b.evolucao - a.evolucao).slice(0, 5)
  }

  // --- MÓDULO 2: GRÁFICO DE CONSULTAS POR MÊS (SVG) ---
  const renderConsultasPorMesChart = () => {
    const hoje = new Date()
    const meses: { label: string; count: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const count = consultas.filter(c => {
        const cd = new Date(c.data_consulta)
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear()
      }).length
      meses.push({ label: d.toLocaleString('pt-BR', { month: 'short' }), count })
    }
    const maxCount = Math.max(...meses.map(m => m.count), 1)
    const svgW = 340, svgH = 120, padX = 30, padY = 16
    const barW = (svgW - padX * 2) / meses.length
    return (
      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: '130px' }}>
        {meses.map((m, i) => {
          const barH = ((m.count / maxCount) * (svgH - padY * 2)) || 2
          const x = padX + i * barW + barW * 0.15
          const y = svgH - padY - barH
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW * 0.7} height={barH} rx={4} fill="var(--primary)" opacity={0.85} />
              {m.count > 0 && (
                <text x={x + barW * 0.35} y={y - 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--primary)">
                  {m.count}
                </text>
              )}
              <text x={x + barW * 0.35} y={svgH - 3} textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontWeight="600">
                {m.label}
              </text>
            </g>
          )
        })}
      </svg>
    )
  }

  // --- LOGICA DOS CARDS ---
  
  // Card 1 — Total de pacientes ativos
  const totalPacientesAtivos = pacientes.length

  // Card 2 — Consultas da semana
  const getConsultasSemana = () => {
    const hoje = new Date()
    
    // Início da semana (domingo 00:00:00)
    const inicioSemana = new Date(hoje)
    inicioSemana.setDate(hoje.getDate() - hoje.getDay())
    inicioSemana.setHours(0, 0, 0, 0)

    // Fim da semana (sábado 23:59:59.999)
    const fimSemana = new Date(inicioSemana)
    fimSemana.setDate(inicioSemana.getDate() + 6)
    fimSemana.setHours(23, 59, 59, 999)

    return consultas.filter(c => {
      const dataC = new Date(c.data_consulta)
      return dataC >= inicioSemana && dataC <= fimSemana
    }).length
  }
  const consultasSemana = getConsultasSemana()

  // Card 3 — Pacientes sem retorno
  const getPacientesSemRetorno = () => {
    const hoje = new Date()
    const trintaDiasAtras = new Date()
    trintaDiasAtras.setDate(hoje.getDate() - 30)

    return pacientes.filter(p => {
      const consultasDoPaciente = consultas.filter(c => c.paciente_id === p.id)
      
      const consultasPassadas = consultasDoPaciente.filter(c => new Date(c.data_consulta) < hoje)
      const consultasFuturas = consultasDoPaciente.filter(c => new Date(c.data_consulta) >= hoje)

      // Regra 1: Não possuir próximo retorno agendado (nenhuma consulta futura)
      if (consultasFuturas.length > 0) return false

      // Regra 2: Possuir pelo menos uma consulta anterior
      if (consultasPassadas.length === 0) return false

      // Regra 3: A última consulta foi há mais de 30 dias
      const ultimaConsulta = consultasPassadas[consultasPassadas.length - 1]
      const dataUltima = new Date(ultimaConsulta.data_consulta)
      
      return dataUltima < trintaDiasAtras
    })
  }
  const pacientesSemRetorno = getPacientesSemRetorno()

  // --- AÇÕES DE CADASTRO ---
  
  const handleAddPaciente = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoPacienteNome) return

    try {
      const payload: any = {
        nome: novoPacienteNome,
        nutricionista_id: session.user.id
      }
      if (novoPacienteEmail.trim()) payload.email = novoPacienteEmail.trim()
      if (novoPacienteWhatsapp.trim()) payload.whatsapp = novoPacienteWhatsapp.trim()

      const { error } = await supabase
        .from('pacientes')
        .insert([payload])

      if (error) throw error
      
      toast.success('Paciente adicionado com sucesso!')
      setIsAddPacienteOpen(false)
      setNovoPacienteNome('')
      setNovoPacienteEmail('')
      setNovoPacienteWhatsapp('')
      fetchData()
    } catch (error: any) {
      toast.error('Erro ao adicionar paciente: ' + error.message)
    }
  }

  const handleOpenAddConsulta = () => {
    const hoje = new Date()
    const offset = hoje.getTimezoneOffset()
    const hojeLocal = new Date(hoje.getTime() - (offset * 60 * 1000))
    const dataString = hojeLocal.toISOString().slice(0, 16)
    
    setNovaConsultaData(dataString)
    setNovaConsultaObs('')
    setNovaConsultaPeso('')
    setNovaConsultaCintura('')
    setNovaConsultaQuadril('')
    setNovaConsultaGordura('')
    setNovaConsultaRetorno('')
    setIsAddConsultaOpen(true)
  }

  const handleAddConsulta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPacienteId || !novaConsultaData) return

    try {
      const payload: any = {
        paciente_id: selectedPacienteId,
        data_consulta: new Date(novaConsultaData).toISOString(),
        observacoes: novaConsultaObs.trim() || null
      }

      if (novaConsultaPeso.trim()) payload.peso = parseFloat(novaConsultaPeso)
      if (novaConsultaCintura.trim()) payload.cintura = parseFloat(novaConsultaCintura)
      if (novaConsultaQuadril.trim()) payload.quadril = parseFloat(novaConsultaQuadril)
      if (novaConsultaGordura.trim()) payload.percentual_gordura = parseFloat(novaConsultaGordura)
      if (novaConsultaRetorno.trim()) payload.proximo_retorno = novaConsultaRetorno

      const { error } = await supabase
        .from('consultas')
        .insert([payload])

      if (error) throw error

      toast.success('Consulta registrada com sucesso!')
      setIsAddConsultaOpen(false)
      
      // Limpar campos
      setNovaConsultaData('')
      setNovaConsultaObs('')
      setNovaConsultaPeso('')
      setNovaConsultaCintura('')
      setNovaConsultaQuadril('')
      setNovaConsultaGordura('')
      setNovaConsultaRetorno('')
      
      await fetchData()
    } catch (error: any) {
      toast.error('Erro ao registrar consulta: ' + error.message)
    }
  }

  const handleSalvarAlteracoesPerfil = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cadNome.trim() || !selectedPacienteId) {
      toast.error('O Nome Completo é obrigatório!')
      return
    }

    try {
      setLoading(true)

      let patologiasFinal = [...cadPatologias]
      if (cadPatologiaLivre.trim() && !patologiasFinal.includes(cadPatologiaLivre.trim())) {
        patologiasFinal = patologiasFinal.filter(p => p !== 'Nenhum')
        patologiasFinal.push(cadPatologiaLivre.trim())
      }

      let restricoesFinal = [...cadRestricoes]
      if (cadRestricaoLivre.trim() && !restricoesFinal.includes(cadRestricaoLivre.trim())) {
        restricoesFinal = restricoesFinal.filter(r => r !== 'Nenhum')
        restricoesFinal.push(cadRestricaoLivre.trim())
      }

      let alergiasFinal = [...cadAlergias]
      if (cadAlergiaLivre.trim() && !alergiasFinal.includes(cadAlergiaLivre.trim())) {
        alergiasFinal = alergiasFinal.filter(a => a !== 'Nenhum')
        alergiasFinal.push(cadAlergiaLivre.trim())
      }

      const payload: any = {
        nome: cadNome.trim(),
        data_nascimento: cadNascimento || null,
        sexo: cadSexo || null,
        telefone: cadTelefone.trim() || null,
        whatsapp: cadWhatsapp.trim() || null,
        email: cadEmail.trim() || null,
        peso_inicial: cadPeso ? parseFloat(cadPeso) : null,
        altura: cadAltura ? parseFloat(cadAltura) : null,
        objetivos: cadObjetivos.length > 0 ? cadObjetivos : null,
        objetivo_texto: cadObjetivoTexto.trim() || null,
        nivel_atividade: cadNivelAtividade || null,
        patologias: patologiasFinal.length > 0 ? patologiasFinal : null,
        restricoes_alimentares: restricoesFinal.length > 0 ? restricoesFinal : null,
        alergias: alergiasFinal.length > 0 ? alergiasFinal : null,
        medicamentos: cadMedicamentos.trim() || null,
        suplementos: cadSuplementos.trim() || null,
        refeicoes_por_dia: cadRefeicoes ? parseInt(cadRefeicoes, 10) : null,
        horario_acorda: cadAcorda || null,
        horario_dorme: cadDorme || null,
        litros_agua: cadAgua ? parseFloat(cadAgua) : null,
        atividade_fisica: cadAtividadeFisica,
        atividade_fisica_descricao: cadAtividadeFisica ? (cadAtividadeDesc.trim() || null) : null,
        observacoes: cadObservacoes.trim() || null
      }

      const { error } = await supabase
        .from('pacientes')
        .update(payload)
        .eq('id', selectedPacienteId)

      if (error) throw error

      toast.success('Alterações salvas com sucesso!')
      await fetchData()
    } catch (error: any) {
      toast.error('Erro ao salvar alterações: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGerarPlanoComIA = async () => {
    if (!pacienteSelecionado) return

    setIsGenerating(true)
    setLoadingMessage('Buscando dados do paciente...')
    setPlanoAtivo(null)

    const messages = [
      'Buscando dados do paciente...',
      'Analisando restrições e alergias...',
      'IA calculando o cardápio balanceado...',
      'Estruturando refeições brasileiras...',
      'Finalizando montagem do cardápio semanal...'
    ]
    let msgIndex = 0
    const msgInterval = setInterval(() => {
      if (msgIndex < messages.length - 1) {
        msgIndex++
        setLoadingMessage(messages[msgIndex])
      }
    }, 2500)

    try {
      const dados_paciente = `
Nome: ${pacienteSelecionado.nome}
Idade: ${pacienteSelecionado.data_nascimento ? `${calcularIdade(pacienteSelecionado.data_nascimento).replace(/[()]/g, '')}` : 'Não informada'}
Sexo: ${pacienteSelecionado.sexo || 'Não informado'}
Peso Inicial: ${pacienteSelecionado.peso_inicial ? `${pacienteSelecionado.peso_inicial} kg` : 'Não informado'}
Altura: ${pacienteSelecionado.altura ? `${pacienteSelecionado.altura} cm` : 'Não informado'}
Objetivos: ${pacienteSelecionado.objetivos ? pacienteSelecionado.objetivos.join(', ') : 'Não definido'}
Outros objetivos descritos: ${pacienteSelecionado.objetivo_texto || 'Nenhum'}
Nível de Atividade Física: ${pacienteSelecionado.nivel_atividade || 'Não informado'}
Patologias: ${pacienteSelecionado.patologias ? pacienteSelecionado.patologias.join(', ') : 'Nenhuma'}
Restrições Alimentares: ${pacienteSelecionado.restricoes_alimentares ? pacienteSelecionado.restricoes_alimentares.join(', ') : 'Nenhuma'}
Alergias Alimentares: ${pacienteSelecionado.alergias ? pacienteSelecionado.alergias.join(', ') : 'Nenhuma'}
Medicamentos: ${pacienteSelecionado.medicamentos || 'Nenhum'}
Suplementos: ${pacienteSelecionado.suplementos || 'Nenhum'}
Refeições por dia: ${pacienteSelecionado.refeicoes_por_dia || 'Não informado'}
Água por dia: ${pacienteSelecionado.litros_agua ? `${pacienteSelecionado.litros_agua} Litros` : 'Não informado'}
Atividade Física: ${pacienteSelecionado.atividade_fisica ? `Sim - ${pacienteSelecionado.atividade_fisica_descricao || ''}` : 'Não'}
Observações Gerais: ${pacienteSelecionado.observacoes || 'Nenhuma'}
`;

      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dados_paciente: dados_paciente.trim() }),
      })

      clearInterval(msgInterval)

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.error || 'Erro na resposta do servidor local.');
      }

      const result = await response.json()
      setPlanoAtivo(result)
      setActivePlanTab('Segunda-feira')
      toast.success('Plano alimentar gerado com IA com sucesso! Ajuste os campos se desejar.')
    } catch (error: any) {
      clearInterval(msgInterval)
      console.error(error)
      
      toast((t) => (
        <span style={{ fontSize: '0.875rem' }}>
          Não foi possível gerar o plano com IA no momento.
          <br/>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button 
              onClick={() => {
                toast.dismiss(t.id)
                handleGerarPlanoComIA()
              }}
              style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
            >
              Tentar Novamente
            </button>
            <button 
              onClick={() => {
                toast.dismiss(t.id)
                handleCriarPlanoManual()
              }}
              style={{ background: 'white', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '0.35rem 0.65rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              Criar Manual
            </button>
          </div>
        </span>
      ), { duration: 9000 })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCriarPlanoManual = () => {
    const planoVazio = {
      plano_semanal: [
        { dia: 'Segunda-feira', refeicoes: { cafe_da_manha: ['', '', '', '', ''], lanche_manha: ['', '', '', '', ''], almoco: ['', '', '', '', ''], lanche_tarde: ['', '', '', '', ''], jantar: ['', '', '', '', ''] } },
        { dia: 'Terça-feira', refeicoes: { cafe_da_manha: ['', '', '', '', ''], lanche_manha: ['', '', '', '', ''], almoco: ['', '', '', '', ''], lanche_tarde: ['', '', '', '', ''], jantar: ['', '', '', '', ''] } },
        { dia: 'Quarta-feira', refeicoes: { cafe_da_manha: ['', '', '', '', ''], lanche_manha: ['', '', '', '', ''], almoco: ['', '', '', '', ''], lanche_tarde: ['', '', '', '', ''], jantar: ['', '', '', '', ''] } },
        { dia: 'Quinta-feira', refeicoes: { cafe_da_manha: ['', '', '', '', ''], lanche_manha: ['', '', '', '', ''], almoco: ['', '', '', '', ''], lanche_tarde: ['', '', '', '', ''], jantar: ['', '', '', '', ''] } },
        { dia: 'Sexta-feira', refeicoes: { cafe_da_manha: ['', '', '', '', ''], lanche_manha: ['', '', '', '', ''], almoco: ['', '', '', '', ''], lanche_tarde: ['', '', '', '', ''], jantar: ['', '', '', '', ''] } },
        { dia: 'Sábado', refeicoes: { cafe_da_manha: ['', '', '', '', ''], lanche_manha: ['', '', '', '', ''], almoco: ['', '', '', '', ''], lanche_tarde: ['', '', '', '', ''], jantar: ['', '', '', '', ''] } },
        { dia: 'Domingo', refeicoes: { cafe_da_manha: ['', '', '', '', ''], lanche_manha: ['', '', '', '', ''], almoco: ['', '', '', '', ''], lanche_tarde: ['', '', '', '', ''], jantar: ['', '', '', '', ''] } },
      ]
    }
    setPlanoAtivo(planoVazio)
    setActivePlanTab('Segunda-feira')
    toast.success('Plano manual criado! Preencha as refeições para salvar.')
  }

  const handleUpdateOption = (diaNome: string, refeicaoNome: string, optionIndex: number, newValue: string) => {
    if (!planoAtivo) return

    const novoPlano = { ...planoAtivo }
    const diaIndex = novoPlano.plano_semanal.findIndex((d: any) => d.dia === diaNome)
    
    if (diaIndex !== -1) {
      const novasRefeicoes = { ...novoPlano.plano_semanal[diaIndex].refeicoes }
      const novasOpcoes = [...novasRefeicoes[refeicaoNome]]
      novasOpcoes[optionIndex] = newValue
      
      novasRefeicoes[refeicaoNome] = novasOpcoes
      novoPlano.plano_semanal[diaIndex] = {
        ...novoPlano.plano_semanal[diaIndex],
        refeicoes: novasRefeicoes
      }
      setPlanoAtivo(novoPlano)
    }
  }

  const handleSalvarPlanoAlimentar = async () => {
    if (!selectedPacienteId || !planoAtivo) return

    try {
      setLoading(true)

      const { error } = await supabase
        .from('planos_alimentares')
        .insert([{
          paciente_id: selectedPacienteId,
          conteudo: planoAtivo
        }])

      if (error) throw error

      toast.success('Plano alimentar salvo com sucesso!')
      
      setPlanoAtivo(null)
      
      // Atualiza a listagem de planos alimentares do paciente no histórico
      const { data, error: planosError } = await supabase
        .from('planos_alimentares')
        .select('*')
        .eq('paciente_id', selectedPacienteId)
        .order('created_at', { ascending: false })
      
      if (planosError) throw planosError
      setPlanosAlimentares(data || [])
    } catch (error: any) {
      toast.error('Erro ao salvar plano alimentar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePacienteCompleto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cadNome.trim()) {
      toast.error('O Nome Completo é obrigatório!')
      return
    }

    try {
      setLoading(true)

      let patologiasFinal = [...cadPatologias]
      if (cadPatologiaLivre.trim() && !patologiasFinal.includes(cadPatologiaLivre.trim())) {
        patologiasFinal = patologiasFinal.filter(p => p !== 'Nenhum')
        patologiasFinal.push(cadPatologiaLivre.trim())
      }

      let restricoesFinal = [...cadRestricoes]
      if (cadRestricaoLivre.trim() && !restricoesFinal.includes(cadRestricaoLivre.trim())) {
        restricoesFinal = restricoesFinal.filter(r => r !== 'Nenhum')
        restricoesFinal.push(cadRestricaoLivre.trim())
      }

      let alergiasFinal = [...cadAlergias]
      if (cadAlergiaLivre.trim() && !alergiasFinal.includes(cadAlergiaLivre.trim())) {
        alergiasFinal = alergiasFinal.filter(a => a !== 'Nenhum')
        alergiasFinal.push(cadAlergiaLivre.trim())
      }

      const payload: any = {
        nome: cadNome.trim(),
        data_nascimento: cadNascimento || null,
        sexo: cadSexo || null,
        telefone: cadTelefone.trim() || null,
        whatsapp: cadWhatsapp.trim() || null,
        email: cadEmail.trim() || null,
        peso_inicial: cadPeso ? parseFloat(cadPeso) : null,
        altura: cadAltura ? parseFloat(cadAltura) : null,
        objetivos: cadObjetivos.length > 0 ? cadObjetivos : null,
        objetivo_texto: cadObjetivoTexto.trim() || null,
        nivel_atividade: cadNivelAtividade || null,
        patologias: patologiasFinal.length > 0 ? patologiasFinal : null,
        restricoes_alimentares: restricoesFinal.length > 0 ? restricoesFinal : null,
        alergias: alergiasFinal.length > 0 ? alergiasFinal : null,
        medicamentos: cadMedicamentos.trim() || null,
        suplementos: cadSuplementos.trim() || null,
        refeicoes_por_dia: cadRefeicoes ? parseInt(cadRefeicoes, 10) : null,
        horario_acorda: cadAcorda || null,
        horario_dorme: cadDorme || null,
        litros_agua: cadAgua ? parseFloat(cadAgua) : null,
        atividade_fisica: cadAtividadeFisica,
        atividade_fisica_descricao: cadAtividadeFisica ? (cadAtividadeDesc.trim() || null) : null,
        observacoes: cadObservacoes.trim() || null,
        nutricionista_id: session.user.id
      }

      if (isEditing && selectedPacienteId) {
        const { error } = await supabase
          .from('pacientes')
          .update(payload)
          .eq('id', selectedPacienteId)

        if (error) throw error

        toast.success('Dados do paciente atualizados com sucesso!')
        
        setIsEditing(false)
        resetCadastroForm()
        await fetchData()
        
        setCurrentView('perfil-paciente')
      } else {
        const { data, error } = await supabase
          .from('pacientes')
          .insert([payload])
          .select('id')
          .single()

        if (error) throw error

        toast.success('Paciente cadastrado com sucesso!')
        
        resetCadastroForm()
        await fetchData()

        if (data && data.id) {
          setSelectedPacienteId(data.id)
          setPreviousView('pacientes')
          setCurrentView('perfil-paciente')
        } else {
          setCurrentView('pacientes')
        }
      }
    } catch (error: any) {
      toast.error('Erro ao salvar paciente: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // --- REDIRECIONAMENTO E VISUALIZAÇÃO ---
  
  const handleViewPaciente = (pacienteId: string, origin: 'dashboard' | 'pacientes') => {
    setSelectedPacienteId(pacienteId)
    setPreviousView(origin)
    setCurrentView('perfil-paciente')
  }

  const filteredPacientes = pacientes.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pacienteSelecionado = pacientes.find(p => p.id === selectedPacienteId)
  const consultasSelecionado = consultas.filter(c => c.paciente_id === selectedPacienteId)

  const alertas = getAlertas()

  return (
    <div className="dashboard-layout animate-fade" onClick={(e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-small">G</div>
          <span>System Geraldo</span>
        </div>

        {/* Card do perfil da nutricionista na sidebar */}
        <div
          className="sidebar-user-info"
          onClick={() => setCurrentView('perfil-nutri')}
          title="Ver meu perfil"
        >
          <div className="sidebar-avatar">
            {nutriFotoUrl
              ? <img src={nutriFotoUrl} alt="foto" />
              : <span>{(nutriNome || 'N').charAt(0).toUpperCase()}</span>
            }
          </div>
          <div className="sidebar-user-details">
            <div className="sidebar-user-name">{nutriNome || 'Nutricionista'}</div>
            <div className="sidebar-user-crn">{nutriCrn || 'Meu Perfil'}</div>
          </div>
          <Settings size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </div>
        
        <nav className="sidebar-nav">
          <button 
            onClick={() => { setCurrentView('dashboard'); setSelectedPacienteId(null); }}
            className={`nav-item-btn ${currentView === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button 
            onClick={() => { setCurrentView('pacientes'); setSelectedPacienteId(null); }}
            className={`nav-item-btn ${currentView === 'pacientes' ? 'active' : ''}`}
          >
            <Users size={20} /> Pacientes
          </button>
          <button 
            onClick={() => { setCurrentView('agenda'); setSelectedPacienteId(null); }}
            className={`nav-item-btn ${currentView === 'agenda' ? 'active' : ''}`}
          >
            <Calendar size={20} /> Agenda
          </button>
          <button 
            onClick={() => setCurrentView('perfil-nutri')}
            className={`nav-item-btn ${currentView === 'perfil-nutri' ? 'active' : ''}`}
          >
            <UserCircle size={20} /> Meu Perfil
          </button>
        </nav>

        <div className="sidebar-footer">
          {alertas.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#fff1f2', borderRadius: '8px', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--error)', fontWeight: 600 }}>
              <AlertTriangle size={14} />
              {alertas.length} alerta{alertas.length > 1 ? 's' : ''} pendente{alertas.length > 1 ? 's' : ''}
            </div>
          )}
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="content-header">
          <div>
            <h1>Olá, {nutriNome || 'Nutricionista'}!</h1>
            <p>Bem-vindo ao seu painel de controle.</p>
          </div>
          <div className="user-profile">
            {/* Sino de notificações */}
            <div className="notifications-wrapper" ref={notificationsRef}>
              <button
                className="notification-bell-btn"
                onClick={(e) => { e.stopPropagation(); setShowNotifications(v => !v) }}
                title="Notificações"
              >
                <Bell size={20} />
                {alertas.length > 0 && (
                  <span className="notification-badge">
                    {alertas.length > 9 ? '9+' : alertas.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="notifications-dropdown animate-slide-down">
                  <div className="notifications-dropdown-header">
                    <span>🔔 Notificações</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{alertas.length} alerta{alertas.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="notifications-list">
                    {alertas.length === 0 ? (
                      <div className="notifications-empty">✅ Tudo em dia! Nenhum alerta pendente.</div>
                    ) : (
                      alertas.map((alerta, i) => (
                        <div
                          key={i}
                          className={`notification-item ${alerta.tipo}`}
                          onClick={() => {
                            if (alerta.pacienteId) {
                              handleViewPaciente(alerta.pacienteId, 'dashboard')
                              setShowNotifications(false)
                            }
                          }}
                        >
                          <div className={`notification-icon ${alerta.tipo}`}>
                            {alerta.tipo === 'danger' && <AlertTriangle size={16} />}
                            {alerta.tipo === 'warning' && <Clock size={16} />}
                            {alerta.tipo === 'success' && <CheckCircle2 size={16} />}
                          </div>
                          <div className="notification-content">
                            <div className="notification-title">{alerta.titulo}</div>
                            <div className="notification-desc">{alerta.descricao}</div>
                          </div>
                          {alerta.pacienteId && <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <span style={{ fontSize: '0.8rem' }}>{session.user.email}</span>
            <div className="sidebar-avatar" style={{ width: 32, height: 32, cursor: 'pointer' }} onClick={() => setCurrentView('perfil-nutri')}>
              {nutriFotoUrl
                ? <img src={nutriFotoUrl} alt="foto" />
                : <span style={{ fontSize: '0.8rem' }}>{(nutriNome || 'N').charAt(0).toUpperCase()}</span>
              }
            </div>
          </div>
        </header>

        {/* 1. VIEW DASHBOARD */}
        {currentView === 'dashboard' && (
          <div className="animate-fade">
            {/* Stats Grid com os 3 Cards Principais */}
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total de Pacientes Ativos</span>
                <span className="stat-value">{totalPacientesAtivos}</span>
                <div className="card-indicator">Nutricionista conectada</div>
              </div>
              <div className="stat-card">
                <span className="stat-label">Consultas da Semana</span>
                <span className="stat-value">{consultasSemana}</span>
                <div className="card-indicator">Semana atual</div>
              </div>
              <div className="stat-card urgent">
                <span className="stat-label">Pacientes Sem Retorno</span>
                <span className="stat-value">{pacientesSemRetorno.length}</span>
                <div className="card-indicator">+30 dias desde a última</div>
              </div>
            </div>

            {/* Métricas Avançadas */}
            <div className="metrics-advanced-grid">
              {/* Gráfico de consultas por mês */}
              <div className="metric-card">
                <div className="metric-card-title">
                  <BarChart2 size={16} /> Consultas por Mês (últimos 6 meses)
                </div>
                {renderConsultasPorMesChart()}
              </div>

              {/* Ranking de evolução de peso */}
              <div className="metric-card">
                <div className="metric-card-title">
                  <TrendingDown size={16} /> Maior Evolução de Peso
                </div>
                {getRankingEvolucao().length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>Nenhum paciente com 2+ consultas ainda.</p>
                ) : (
                  <div className="evolution-ranking">
                    {getRankingEvolucao().map((item, i) => (
                      <div
                        key={item.paciente.id}
                        className="evolution-ranking-item"
                        onClick={() => handleViewPaciente(item.paciente.id, 'dashboard')}
                      >
                        <div className={`evolution-rank-badge rank-${i + 1}`}>{i + 1}</div>
                        <div className="evolution-rank-name">{item.paciente.nome}</div>
                        <div className={`evolution-rank-value ${item.evolucao >= 0 ? 'loss' : 'gain'}`}>
                          {item.evolucao >= 0 ? '↓' : '↑'} {Math.abs(item.evolucao).toFixed(1)} kg
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Alertas de próximas consultas */}
            {alertas.filter(a => a.tipo === 'warning').length > 0 && (
              <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>⏰ Próximas consultas esta semana</h3>
                {alertas.filter(a => a.tipo === 'warning').map((alerta, i) => (
                  <div key={i} className="alert-card" style={{ cursor: 'pointer' }} onClick={() => alerta.pacienteId && handleViewPaciente(alerta.pacienteId, 'dashboard')}>
                    <Clock size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{alerta.titulo}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{alerta.descricao}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Listagem de Pacientes Sem Retorno */}
            <section className="patients-section card">
              <div className="section-header">
                <h2>Pacientes sem retorno</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Lista de pacientes com última consulta há mais de 30 dias e sem nenhum agendamento futuro.
                </p>
              </div>

              <div className="table-container">
                {loading ? (
                  <div className="loading-state">Carregando dados...</div>
                ) : pacientesSemRetorno.length > 0 ? (
                  <table className="patients-table">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>WhatsApp</th>
                        <th>E-mail</th>
                        <th>Última Consulta</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pacientesSemRetorno.map((p) => {
                        const consultasP = consultas.filter(c => c.paciente_id === p.id && new Date(c.data_consulta) < new Date())
                        const ultimaC = consultasP[consultasP.length - 1]
                        
                        return (
                          <tr key={p.id} className="row-hover">
                            <td className="patient-name">
                              <button 
                                className="patient-link-btn"
                                onClick={() => handleViewPaciente(p.id, 'dashboard')}
                              >
                                {p.nome}
                              </button>
                            </td>
                            <td>{p.whatsapp || '-'}</td>
                            <td>{p.email || '-'}</td>
                            <td>
                              {ultimaC 
                                ? new Date(ultimaC.data_consulta).toLocaleDateString('pt-BR') 
                                : 'Nenhuma consulta'}
                            </td>
                            <td>
                              <button 
                                className="btn-small-link"
                                onClick={() => handleViewPaciente(p.id, 'dashboard')}
                              >
                                Ver Perfil <ChevronRight size={14} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <Users size={48} style={{ color: 'var(--primary)' }} />
                    <p style={{ marginTop: '1rem', fontWeight: 500 }}>Nenhum paciente sem retorno no momento</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* 2. VIEW PACIENTES */}
        {currentView === 'pacientes' && (
          <div className="animate-fade">
            <section className="patients-section card">
              <div className="section-header">
                <h2>Meus Pacientes</h2>
                <div className="actions">
                  <div className="search-box">
                    <Search size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar paciente..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button 
                    className="btn-add" 
                    onClick={() => { resetCadastroForm(); setCurrentView('cadastro-paciente'); }}
                  >
                    <Plus size={18} /> Novo Paciente
                  </button>
                </div>
              </div>

              <div className="table-container">
                {loading ? (
                  <div className="loading-state">Carregando pacientes...</div>
                ) : pacientes.length === 0 ? (
                  <div className="empty-state">
                    <Users size={48} style={{ color: 'var(--primary)' }} />
                    <p style={{ marginTop: '1rem', fontWeight: 500 }}>Nenhum paciente cadastrado ainda</p>
                    <button 
                      className="btn-primary" 
                      style={{ width: 'auto', marginTop: '1rem' }}
                      onClick={() => { resetCadastroForm(); setCurrentView('cadastro-paciente'); }}
                    >
                      Cadastrar seu primeiro paciente
                    </button>
                  </div>
                ) : filteredPacientes.length > 0 ? (
                  <table className="patients-table">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Objetivos</th>
                        <th>Última Consulta</th>
                        <th style={{ textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPacientes.map((p) => (
                        <tr key={p.id} className="row-hover">
                          <td className="patient-name">
                            <button 
                              className="patient-link-btn"
                              onClick={() => handleViewPaciente(p.id, 'pacientes')}
                            >
                              {p.nome}
                            </button>
                          </td>
                          <td>
                            {p.objetivos && p.objetivos.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                {p.objetivos.map((obj) => (
                                  <span key={obj} className="objective-badge" style={{ margin: 0 }}>
                                    {obj}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>Não definido</span>
                            )}
                          </td>
                          <td>{getUltimaConsultaPaciente(p.id)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn-small-link"
                              onClick={() => handleViewPaciente(p.id, 'pacientes')}
                            >
                              Ver Perfil <ChevronRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <Users size={48} style={{ color: 'var(--text-muted)' }} />
                    <p style={{ marginTop: '1rem' }}>Nenhum paciente encontrado para a busca.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* 3. VIEW CADASTRO DE PACIENTE */}
        {currentView === 'cadastro-paciente' && (
          <div className="animate-fade">
            <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {isEditing ? `Editar Dados de: ${cadNome}` : 'Cadastrar Novo Paciente'}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {isEditing ? 'Altere as informações do paciente organizadas em abas.' : 'Preencha os dados do paciente organizados em abas.'}
                  </p>
                </div>
                <button 
                  className="btn-secondary-outline" 
                  onClick={() => {
                    resetCadastroForm();
                    if (isEditing) {
                      setCurrentView('perfil-paciente');
                    } else {
                      setCurrentView('pacientes');
                    }
                  }}
                >
                  {isEditing ? 'Voltar para Perfil' : 'Voltar para Lista'}
                </button>
              </div>

              {/* Navegação de Abas */}
              <div className="tabs-navigation">
                <button 
                  type="button"
                  className={`tab-btn ${activeCadastroTab === 'pessoal' ? 'active' : ''}`}
                  onClick={() => setActiveCadastroTab('pessoal')}
                >
                  Pessoal
                </button>
                <button 
                  type="button"
                  className={`tab-btn ${activeCadastroTab === 'clinico' ? 'active' : ''}`}
                  onClick={() => setActiveCadastroTab('clinico')}
                >
                  Clínico
                </button>
                <button 
                  type="button"
                  className={`tab-btn ${activeCadastroTab === 'habitos' ? 'active' : ''}`}
                  onClick={() => setActiveCadastroTab('habitos')}
                >
                  Hábitos
                </button>
              </div>

              <form onSubmit={handleSavePacienteCompleto}>
                {/* ABA 1: PESSOAL */}
                {activeCadastroTab === 'pessoal' && (
                  <div className="animate-fade">
                    <div className="form-grid">
                      <div className="form-group-full">
                        <label>Nome Completo *</label>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="Digite o nome completo do paciente" 
                          value={cadNome}
                          onChange={(e) => setCadNome(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Data de Nascimento</label>
                        <input 
                          type="date" 
                          className="input-field" 
                          value={cadNascimento}
                          onChange={(e) => setCadNascimento(e.target.value)}
                        />
                        {cadNascimento && (
                          <span className="helper-text highlight">
                            Idade: {calcularIdade(cadNascimento)}
                          </span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Sexo</label>
                        <div className="chips-container">
                          {['Feminino', 'Masculino', 'Outro'].map((sexoOption) => (
                            <div key={sexoOption}>
                              <input 
                                type="radio" 
                                id={`sexo-${sexoOption}`} 
                                name="sexo" 
                                className="chip-input" 
                                checked={cadSexo === sexoOption}
                                onChange={() => setCadSexo(sexoOption)}
                              />
                              <label htmlFor={`sexo-${sexoOption}`} className="chip-label">
                                {sexoOption}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Telefone</label>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="Ex: (11) 99999-9999" 
                          value={cadTelefone}
                          onChange={(e) => setCadTelefone(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>WhatsApp</label>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="Ex: (11) 99999-9999" 
                          value={cadWhatsapp}
                          onChange={(e) => setCadWhatsapp(e.target.value)}
                        />
                      </div>

                      <div className="form-group-full">
                        <label>E-mail</label>
                        <input 
                          type="email" 
                          className="input-field" 
                          placeholder="exemplo@paciente.com" 
                          value={cadEmail}
                          onChange={(e) => setCadEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="btn-secondary-outline"
                        onClick={() => {
                          resetCadastroForm();
                          if (isEditing) {
                            setCurrentView('perfil-paciente');
                          } else {
                            setCurrentView('pacientes');
                          }
                        }}
                      >
                        Cancelar
                      </button>
                      <button 
                        type="button" 
                        className="btn-primary" 
                        style={{ width: 'auto' }}
                        onClick={() => setActiveCadastroTab('clinico')}
                      >
                        Próximo (Clínico)
                      </button>
                    </div>
                  </div>
                )}

                {/* ABA 2: CLÍNICO */}
                {activeCadastroTab === 'clinico' && (
                  <div className="animate-fade">
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Peso Inicial</label>
                        <div className="input-wrapper">
                          <input 
                            type="number" 
                            step="0.1" 
                            className="input-field" 
                            placeholder="Ex: 75.5" 
                            value={cadPeso}
                            onChange={(e) => setCadPeso(e.target.value)}
                          />
                          <span className="input-suffix">kg</span>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Altura</label>
                        <div className="input-wrapper">
                          <input 
                            type="number" 
                            className="input-field" 
                            placeholder="Ex: 175" 
                            value={cadAltura}
                            onChange={(e) => setCadAltura(e.target.value)}
                          />
                          <span className="input-suffix">cm</span>
                        </div>
                      </div>

                      <div className="form-group-full">
                        <label>IMC (Índice de Massa Corporal)</label>
                        {calcularIMCValue() ? (
                          <div className={`imc-badge ${getClassificacaoIMC(calcularIMCValue()!).status}`}>
                            {calcularIMCValue()!.toFixed(2)} - {getClassificacaoIMC(calcularIMCValue()!).classe}
                          </div>
                        ) : (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
                            Preencha Peso e Altura para calcular o IMC automaticamente.
                          </div>
                        )}
                      </div>

                      <div className="form-group-full">
                        <label>Objetivos (Selecione um ou mais)</label>
                        <div className="chips-container">
                          {['Emagrecimento', 'Hipertrofia', 'Saúde/Bem-estar', 'Performance Esportiva', 'Reeducação Alimentar'].map((obj) => (
                            <div key={obj}>
                              <input 
                                type="checkbox" 
                                id={`obj-${obj}`} 
                                className="chip-input" 
                                checked={cadObjetivos.includes(obj)}
                                onChange={() => handleToggleObjetivo(obj)}
                              />
                              <label htmlFor={`obj-${obj}`} className="chip-label">
                                {obj}
                              </label>
                            </div>
                          ))}
                        </div>
                        <div className="form-group" style={{ marginTop: '0.75rem' }}>
                          <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Outros Objetivos (Texto Livre)</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Descreva outros objetivos do paciente..." 
                            value={cadObjetivoTexto}
                            onChange={(e) => setCadObjetivoTexto(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group-full">
                        <label>Nível de Atividade Física</label>
                        <select 
                          className="input-field"
                          value={cadNivelAtividade}
                          onChange={(e) => setCadNivelAtividade(e.target.value)}
                        >
                          <option value="">Selecione o nível...</option>
                          <option value="Sedentário">Sedentário (pouco ou nenhum exercício)</option>
                          <option value="Levemente ativo">Levemente ativo (exercício leve 1-3 dias/semana)</option>
                          <option value="Moderadamente ativo">Moderadamente ativo (exercício moderado 3-5 dias/semana)</option>
                          <option value="Muito ativo">Muito ativo (exercício intenso 6-7 dias/semana)</option>
                          <option value="Extremamente ativo">Extremamente ativo (exercício muito pesado, trabalho físico)</option>
                        </select>
                      </div>

                      <div className="form-group-full">
                        <label>Patologias</label>
                        <div className="chips-container">
                          {Array.from(new Set(['Diabetes', 'Hipertensão', 'Dislipidemia', 'Gastrite', 'Nenhum', ...customPatologiasOptions])).map((pat) => (
                            <div key={pat}>
                              <input 
                                type="checkbox" 
                                id={`pat-${pat}`} 
                                className="chip-input" 
                                checked={cadPatologias.includes(pat)}
                                onChange={() => handleTogglePatologia(pat)}
                              />
                              <label htmlFor={`pat-${pat}`} className="chip-label">
                                {pat}
                              </label>
                            </div>
                          ))}
                        </div>
                        <div className="custom-add-container">
                          <input 
                            type="text" 
                            className="custom-add-input" 
                            placeholder="Outra patologia..." 
                            value={cadPatologiaLivre}
                            onChange={(e) => setCadPatologiaLivre(e.target.value)}
                          />
                          <button 
                            type="button" 
                            className="btn-add-secondary"
                            onClick={handleAddCustomPatologia}
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>

                      <div className="form-group-full">
                        <label>Restrições Alimentares</label>
                        <div className="chips-container">
                          {Array.from(new Set(['Intolerância à Lactose', 'Intolerância ao Glúten', 'Vegano', 'Vegetariano', 'Nenhum', ...customRestricoesOptions])).map((res) => (
                            <div key={res}>
                              <input 
                                type="checkbox" 
                                id={`res-${res}`} 
                                className="chip-input" 
                                checked={cadRestricoes.includes(res)}
                                onChange={() => handleToggleRestricao(res)}
                              />
                              <label htmlFor={`res-${res}`} className="chip-label">
                                {res}
                              </label>
                            </div>
                          ))}
                        </div>
                        <div className="custom-add-container">
                          <input 
                            type="text" 
                            className="custom-add-input" 
                            placeholder="Outra restrição..." 
                            value={cadRestricaoLivre}
                            onChange={(e) => setCadRestricaoLivre(e.target.value)}
                          />
                          <button 
                            type="button" 
                            className="btn-add-secondary"
                            onClick={handleAddCustomRestricao}
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>

                      <div className="form-group-full">
                        <label>Alergias</label>
                        <div className="chips-container">
                          {Array.from(new Set(['Proteína do Leite de Vaca (APLV)', 'Oleaginosas', 'Frutos do Mar', 'Nenhum', ...customAlergiasOptions])).map((al) => (
                            <div key={al}>
                              <input 
                                type="checkbox" 
                                id={`al-${al}`} 
                                className="chip-input" 
                                checked={cadAlergias.includes(al)}
                                onChange={() => handleToggleAlergia(al)}
                              />
                              <label htmlFor={`al-${al}`} className="chip-label">
                                {al}
                              </label>
                            </div>
                          ))}
                        </div>
                        <div className="custom-add-container">
                          <input 
                            type="text" 
                            className="custom-add-input" 
                            placeholder="Outra alergia..." 
                            value={cadAlergiaLivre}
                            onChange={(e) => setCadAlergiaLivre(e.target.value)}
                          />
                          <button 
                            type="button" 
                            className="btn-add-secondary"
                            onClick={handleAddCustomAlergia}
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>

                      <div className="form-group-full">
                        <label>Medicamentos em Uso</label>
                        <textarea 
                          className="input-field text-area" 
                          placeholder="Informe se o paciente faz uso de medicamentos (dosagem, frequência)..." 
                          value={cadMedicamentos}
                          onChange={(e) => setCadMedicamentos(e.target.value)}
                          rows={2}
                        />
                      </div>

                      <div className="form-group-full">
                        <label>Suplementos em Uso</label>
                        <textarea 
                          className="input-field text-area" 
                          placeholder="Informe se o paciente faz uso de suplementos (dosagem, frequência)..." 
                          value={cadSuplementos}
                          onChange={(e) => setCadSuplementos(e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="btn-secondary-outline"
                        onClick={() => setActiveCadastroTab('pessoal')}
                      >
                        Voltar
                      </button>
                      <button 
                        type="button" 
                        className="btn-primary" 
                        style={{ width: 'auto' }}
                        onClick={() => setActiveCadastroTab('habitos')}
                      >
                        Próximo (Hábitos)
                      </button>
                    </div>
                  </div>
                )}

                {/* ABA 3: HÁBITOS */}
                {activeCadastroTab === 'habitos' && (
                  <div className="animate-fade">
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Refeições por Dia</label>
                        <input 
                          type="number" 
                          className="input-field" 
                          placeholder="Ex: 5" 
                          value={cadRefeicoes}
                          onChange={(e) => setCadRefeicoes(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Consumo de Água Diário</label>
                        <div className="input-wrapper">
                          <input 
                            type="number" 
                            step="0.1" 
                            className="input-field" 
                            placeholder="Ex: 2.5" 
                            value={cadAgua}
                            onChange={(e) => setCadAgua(e.target.value)}
                          />
                          <span className="input-suffix">Litros</span>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Horário que Acorda</label>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="Ex: 630 ou 06:30" 
                          value={cadAcorda}
                          onChange={(e) => setCadAcorda(e.target.value)}
                          onBlur={() => setCadAcorda(formatarHorarioNum(cadAcorda))}
                        />
                        <span className="helper-text">Será formatado ao sair (ex: 630 &rarr; 06:30)</span>
                      </div>

                      <div className="form-group">
                        <label>Horário que Dorme</label>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="Ex: 22 ou 22:00" 
                          value={cadDorme}
                          onChange={(e) => setCadDorme(e.target.value)}
                          onBlur={() => setCadDorme(formatarHorarioNum(cadDorme))}
                        />
                        <span className="helper-text">Será formatado ao sair (ex: 22 &rarr; 22:00)</span>
                      </div>

                      <div className="form-group-full">
                        <label>Pratica Atividade Física?</label>
                        <div className="chips-container">
                          <div>
                            <input 
                              type="radio" 
                              id="ativ-sim" 
                              name="atividade" 
                              className="chip-input" 
                              checked={cadAtividadeFisica === true}
                              onChange={() => setCadAtividadeFisica(true)}
                            />
                            <label htmlFor="ativ-sim" className="chip-label">Sim</label>
                          </div>
                          <div>
                            <input 
                              type="radio" 
                              id="ativ-nao" 
                              name="atividade" 
                              className="chip-input" 
                              checked={cadAtividadeFisica === false}
                              onChange={() => setCadAtividadeFisica(false)}
                            />
                            <label htmlFor="ativ-nao" className="chip-label">Não</label>
                          </div>
                        </div>
                      </div>

                      {cadAtividadeFisica && (
                        <div className="form-group-full animate-fade">
                          <label>Descrição da Atividade Física</label>
                          <textarea 
                            className="input-field text-area" 
                            placeholder="Descreva a modalidade, frequência, intensidade..." 
                            value={cadAtividadeDesc}
                            onChange={(e) => setCadAtividadeDesc(e.target.value)}
                            rows={3}
                          />
                        </div>
                      )}

                      <div className="form-group-full">
                        <label>Observações Gerais</label>
                        <textarea 
                          className="input-field text-area" 
                          placeholder="Histórico familiar, observações comportamentais, observações importantes..." 
                          value={cadObservacoes}
                          onChange={(e) => setCadObservacoes(e.target.value)}
                          rows={4}
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="btn-secondary-outline"
                        onClick={() => setActiveCadastroTab('clinico')}
                      >
                        Voltar
                      </button>
                      <button 
                        type="submit" 
                        className="btn-primary" 
                        style={{ width: 'auto' }}
                        disabled={loading}
                      >
                        {loading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Salvar Paciente')}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* 4. VIEW PERFIL DO PACIENTE */}
        {currentView === 'perfil-paciente' && pacienteSelecionado && (
          <div className="animate-fade">
            {/* Header do Perfil */}
            <div className="profile-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div className="profile-avatar">
                  <User size={32} />
                </div>
                <div>
                  <h2 className="profile-name">{pacienteSelecionado.nome}</h2>
                  <p className="profile-subtitle">Paciente desde {new Date(pacienteSelecionado.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  className="btn-secondary-outline"
                  onClick={() => {
                    setCurrentView(previousView)
                    setSelectedPacienteId(null)
                  }}
                >
                  Voltar
                </button>
                <button 
                  className="btn-add"
                  onClick={handleOpenAddConsulta}
                >
                  <Plus size={18} /> Registrar Consulta
                </button>
              </div>
            </div>

            <div className="profile-sections-wrapper">
              
              {/* SEÇÃO 1 — DADOS DO PACIENTE */}
              <section className="profile-section-card animate-fade">
                <div className="profile-section-title">
                  <div className="profile-section-title-text">
                    <Users size={20} />
                    <span>Dados do Paciente</span>
                  </div>
                  
                  {/* Navegação de Abas Internas da Seção de Dados */}
                  <div className="tabs-navigation" style={{ margin: 0, borderBottom: 'none', gap: '1rem' }}>
                    <button 
                      type="button"
                      className={`tab-btn ${activePerfilTab === 'pessoal' ? 'active' : ''}`}
                      onClick={() => setActivePerfilTab('pessoal')}
                      style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                    >
                      Pessoal
                    </button>
                    <button 
                      type="button"
                      className={`tab-btn ${activePerfilTab === 'clinico' ? 'active' : ''}`}
                      onClick={() => setActivePerfilTab('clinico')}
                      style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                    >
                      Clínico
                    </button>
                    <button 
                      type="button"
                      className={`tab-btn ${activePerfilTab === 'habitos' ? 'active' : ''}`}
                      onClick={() => setActivePerfilTab('habitos')}
                      style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                    >
                      Hábitos
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSalvarAlteracoesPerfil}>
                  {/* ABA 1: PESSOAL */}
                  {activePerfilTab === 'pessoal' && (
                    <div className="animate-fade">
                      <div className="form-grid">
                        <div className="form-group-full">
                          <label>Nome Completo *</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            value={cadNome}
                            onChange={(e) => setCadNome(e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Data de Nascimento</label>
                          <input 
                            type="date" 
                            className="input-field" 
                            value={cadNascimento}
                            onChange={(e) => setCadNascimento(e.target.value)}
                          />
                          {cadNascimento && (
                            <span className="helper-text highlight">
                              Idade: {calcularIdade(cadNascimento)}
                            </span>
                          )}
                        </div>

                        <div className="form-group">
                          <label>Sexo</label>
                          <div className="chips-container">
                            {['Feminino', 'Masculino', 'Outro'].map((sexoOption) => (
                              <div key={sexoOption}>
                                <input 
                                  type="radio" 
                                  id={`perfil-sexo-${sexoOption}`} 
                                  name="perfil-sexo" 
                                  className="chip-input" 
                                  checked={cadSexo === sexoOption}
                                  onChange={() => setCadSexo(sexoOption)}
                                />
                                <label htmlFor={`perfil-sexo-${sexoOption}`} className="chip-label">
                                  {sexoOption}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Telefone</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Ex: (11) 99999-9999" 
                            value={cadTelefone}
                            onChange={(e) => setCadTelefone(e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label>WhatsApp</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Ex: (11) 99999-9999" 
                            value={cadWhatsapp}
                            onChange={(e) => setCadWhatsapp(e.target.value)}
                          />
                        </div>

                        <div className="form-group-full">
                          <label>E-mail</label>
                          <input 
                            type="email" 
                            className="input-field" 
                            placeholder="exemplo@paciente.com" 
                            value={cadEmail}
                            onChange={(e) => setCadEmail(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ABA 2: CLÍNICO */}
                  {activePerfilTab === 'clinico' && (
                    <div className="animate-fade">
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Peso Inicial</label>
                          <div className="input-wrapper">
                            <input 
                              type="number" 
                              step="0.1" 
                              className="input-field" 
                              placeholder="Ex: 75.5" 
                              value={cadPeso}
                              onChange={(e) => setCadPeso(e.target.value)}
                            />
                            <span className="input-suffix">kg</span>
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Altura</label>
                          <div className="input-wrapper">
                            <input 
                              type="number" 
                              className="input-field" 
                              placeholder="Ex: 175" 
                              value={cadAltura}
                              onChange={(e) => setCadAltura(e.target.value)}
                            />
                            <span className="input-suffix">cm</span>
                          </div>
                        </div>

                        <div className="form-group-full">
                          <label>IMC (Índice de Massa Corporal)</label>
                          {calcularIMCValue() ? (
                            <div className={`imc-badge ${getClassificacaoIMC(calcularIMCValue()!).status}`}>
                              {calcularIMCValue()!.toFixed(2)} - {getClassificacaoIMC(calcularIMCValue()!).classe}
                            </div>
                          ) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
                              Preencha Peso e Altura para calcular o IMC automaticamente.
                            </div>
                          )}
                        </div>

                        <div className="form-group-full">
                          <label>Objetivos (Selecione um ou mais)</label>
                          <div className="chips-container">
                            {['Emagrecimento', 'Hipertrofia', 'Saúde/Bem-estar', 'Performance Esportiva', 'Reeducação Alimentar'].map((obj) => (
                              <div key={obj}>
                                <input 
                                  type="checkbox" 
                                  id={`perfil-obj-${obj}`} 
                                  className="chip-input" 
                                  checked={cadObjetivos.includes(obj)}
                                  onChange={() => handleToggleObjetivo(obj)}
                                />
                                <label htmlFor={`perfil-obj-${obj}`} className="chip-label">
                                  {obj}
                                </label>
                              </div>
                            ))}
                          </div>
                          <div className="form-group" style={{ marginTop: '0.75rem' }}>
                            <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Outros Objetivos (Texto Livre)</label>
                            <input 
                              type="text" 
                              className="input-field" 
                              placeholder="Descreva outros objetivos do paciente..." 
                              value={cadObjetivoTexto}
                              onChange={(e) => setCadObjetivoTexto(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="form-group-full">
                          <label>Nível de Atividade Física</label>
                          <select 
                            className="input-field"
                            value={cadNivelAtividade}
                            onChange={(e) => setCadNivelAtividade(e.target.value)}
                          >
                            <option value="">Selecione o nível...</option>
                            <option value="Sedentário">Sedentário (pouco ou nenhum exercício)</option>
                            <option value="Levemente ativo">Levemente ativo (exercício leve 1-3 dias/semana)</option>
                            <option value="Moderadamente ativo">Moderadamente ativo (exercício moderado 3-5 dias/semana)</option>
                            <option value="Muito ativo">Muito ativo (exercício intenso 6-7 dias/semana)</option>
                            <option value="Extremamente ativo">Extremamente ativo (exercício muito pesado, trabalho físico)</option>
                          </select>
                        </div>

                        <div className="form-group-full">
                          <label>Patologias</label>
                          <div className="chips-container">
                            {Array.from(new Set(['Diabetes', 'Hipertensão', 'Dislipidemia', 'Gastrite', 'Nenhum', ...customPatologiasOptions])).map((pat) => (
                              <div key={pat}>
                                <input 
                                  type="checkbox" 
                                  id={`perfil-pat-${pat}`} 
                                  className="chip-input" 
                                  checked={cadPatologias.includes(pat)}
                                  onChange={() => handleTogglePatologia(pat)}
                                />
                                <label htmlFor={`perfil-pat-${pat}`} className="chip-label">
                                  {pat}
                                </label>
                              </div>
                            ))}
                          </div>
                          <div className="custom-add-container">
                            <input 
                              type="text" 
                              className="custom-add-input" 
                              placeholder="Outra patologia..." 
                              value={cadPatologiaLivre}
                              onChange={(e) => setCadPatologiaLivre(e.target.value)}
                            />
                            <button 
                              type="button" 
                              className="btn-add-secondary"
                              onClick={handleAddCustomPatologia}
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>

                        <div className="form-group-full">
                          <label>Restrições Alimentares</label>
                          <div className="chips-container">
                            {Array.from(new Set(['Intolerância à Lactose', 'Intolerância ao Glúten', 'Vegano', 'Vegetariano', 'Nenhum', ...customRestricoesOptions])).map((res) => (
                              <div key={res}>
                                <input 
                                  type="checkbox" 
                                  id={`perfil-res-${res}`} 
                                  className="chip-input" 
                                  checked={cadRestricoes.includes(res)}
                                  onChange={() => handleToggleRestricao(res)}
                                />
                                <label htmlFor={`perfil-res-${res}`} className="chip-label">
                                  {res}
                                </label>
                              </div>
                            ))}
                          </div>
                          <div className="custom-add-container">
                            <input 
                              type="text" 
                              className="custom-add-input" 
                              placeholder="Outra restrição..." 
                              value={cadRestricaoLivre}
                              onChange={(e) => setCadRestricaoLivre(e.target.value)}
                            />
                            <button 
                              type="button" 
                              className="btn-add-secondary"
                              onClick={handleAddCustomRestricao}
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>

                        <div className="form-group-full">
                          <label>Alergias</label>
                          <div className="chips-container">
                            {Array.from(new Set(['Proteína do Leite de Vaca (APLV)', 'Oleaginosas', 'Frutos do Mar', 'Nenhum', ...customAlergiasOptions])).map((al) => (
                              <div key={al}>
                                <input 
                                  type="checkbox" 
                                  id={`perfil-al-${al}`} 
                                  className="chip-input" 
                                  checked={cadAlergias.includes(al)}
                                  onChange={() => handleToggleAlergia(al)}
                                />
                                <label htmlFor={`perfil-al-${al}`} className="chip-label">
                                  {al}
                                </label>
                              </div>
                            ))}
                          </div>
                          <div className="custom-add-container">
                            <input 
                              type="text" 
                              className="custom-add-input" 
                              placeholder="Outra alergia..." 
                              value={cadAlergiaLivre}
                              onChange={(e) => setCadAlergiaLivre(e.target.value)}
                            />
                            <button 
                              type="button" 
                              className="btn-add-secondary"
                              onClick={handleAddCustomAlergia}
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>

                        <div className="form-group-full">
                          <label>Medicamentos em Uso</label>
                          <textarea 
                            className="input-field text-area" 
                            placeholder="Informe se o paciente faz uso de medicamentos (dosagem, frequência)..." 
                            value={cadMedicamentos}
                            onChange={(e) => setCadMedicamentos(e.target.value)}
                            rows={2}
                          />
                        </div>

                        <div className="form-group-full">
                          <label>Suplementos em Uso</label>
                          <textarea 
                            className="input-field text-area" 
                            placeholder="Informe se o paciente faz uso de suplementos (dosagem, frequência)..." 
                            value={cadSuplementos}
                            onChange={(e) => setCadSuplementos(e.target.value)}
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ABA 3: HÁBITOS */}
                  {activePerfilTab === 'habitos' && (
                    <div className="animate-fade">
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Refeições por Dia</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            placeholder="Ex: 5" 
                            value={cadRefeicoes}
                            onChange={(e) => setCadRefeicoes(e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label>Consumo de Água Diário</label>
                          <div className="input-wrapper">
                            <input 
                              type="number" 
                              step="0.1" 
                              className="input-field" 
                              placeholder="Ex: 2.5" 
                              value={cadAgua}
                              onChange={(e) => setCadAgua(e.target.value)}
                            />
                            <span className="input-suffix">Litros</span>
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Horário que Acorda</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Ex: 630 ou 06:30" 
                            value={cadAcorda}
                            onChange={(e) => setCadAcorda(e.target.value)}
                            onBlur={() => setCadAcorda(formatarHorarioNum(cadAcorda))}
                          />
                        </div>

                        <div className="form-group">
                          <label>Horário que Dorme</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Ex: 22 ou 22:00" 
                            value={cadDorme}
                            onChange={(e) => setCadDorme(e.target.value)}
                            onBlur={() => setCadDorme(formatarHorarioNum(cadDorme))}
                          />
                        </div>

                        <div className="form-group-full">
                          <label>Pratica Atividade Física?</label>
                          <div className="chips-container">
                            <div>
                              <input 
                                type="radio" 
                                id="perfil-ativ-sim" 
                                name="perfil-atividade" 
                                className="chip-input" 
                                checked={cadAtividadeFisica === true}
                                onChange={() => setCadAtividadeFisica(true)}
                              />
                              <label htmlFor="perfil-ativ-sim" className="chip-label">Sim</label>
                            </div>
                            <div>
                              <input 
                                type="radio" 
                                id="perfil-ativ-nao" 
                                name="perfil-atividade" 
                                className="chip-input" 
                                checked={cadAtividadeFisica === false}
                                onChange={() => setCadAtividadeFisica(false)}
                              />
                              <label htmlFor="perfil-ativ-nao" className="chip-label">Não</label>
                            </div>
                          </div>
                        </div>

                        {cadAtividadeFisica && (
                          <div className="form-group-full animate-fade">
                            <label>Descrição da Atividade Física</label>
                            <textarea 
                              className="input-field text-area" 
                              placeholder="Descreva a modalidade, frequência, intensidade..." 
                              value={cadAtividadeDesc}
                              onChange={(e) => setCadAtividadeDesc(e.target.value)}
                              rows={3}
                            />
                          </div>
                        )}

                        <div className="form-group-full">
                          <label>Observações Gerais</label>
                          <textarea 
                            className="input-field text-area" 
                            placeholder="Histórico familiar, observações comportamentais, observações importantes..." 
                            value={cadObservacoes}
                            onChange={(e) => setCadObservacoes(e.target.value)}
                            rows={4}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      style={{ width: 'auto' }}
                      disabled={loading}
                    >
                      {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </form>
              </section>

              {/* SEÇÃO 2 — CONSULTAS */}
              <section className="profile-section-card animate-fade">
                <div className="profile-section-title">
                  <div className="profile-section-title-text">
                    <Calendar size={20} />
                    <span>Consultas &amp; Avaliações</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-print" onClick={() => window.print()} title="Imprimir histórico">
                      <Printer size={14} /> Imprimir
                    </button>
                  </div>
                </div>

                {/* Barra de Comunicação */}
                {pacienteSelecionado && (
                  <div className="communication-bar">
                    <span className="communication-bar-label">Contato:</span>
                    <button
                      className="btn-whatsapp"
                      onClick={() => handleWhatsApp(pacienteSelecionado)}
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </button>
                    <button
                      className="btn-email"
                      onClick={() => handleEmail(pacienteSelecionado)}
                    >
                      <Mail size={14} /> E-mail
                    </button>
                    {pacienteSelecionado.telefone && (
                      <a
                        href={`tel:${pacienteSelecionado.telefone}`}
                        className="btn-print"
                      >
                        <Phone size={14} /> {pacienteSelecionado.telefone}
                      </a>
                    )}
                  </div>
                )}

                {/* Gráfico de Evolução de Peso */}
                {renderWeightChart()}

                {/* Histórico de Consultas em Ordem Decrescente */}
                <div style={{ marginTop: '2.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>Histórico de Consultas</h4>
                  
                  {consultasSelecionado.length > 0 ? (
                    <div className="consultations-table-container">
                      <table className="consultations-list-table">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Peso</th>
                            <th>Cintura</th>
                            <th>Quadril</th>
                            <th>% Gordura</th>
                            <th>Observações</th>
                            <th>Próximo Retorno</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...consultasSelecionado]
                            .sort((a, b) => new Date(b.data_consulta).getTime() - new Date(a.data_consulta).getTime())
                            .map((c) => (
                              <tr key={c.id} className="row-hover">
                                <td style={{ fontWeight: 600 }}>
                                  {new Date(c.data_consulta).toLocaleDateString('pt-BR')}
                                </td>
                                <td>{c.peso ? `${c.peso} kg` : '-'}</td>
                                <td>{c.cintura ? `${c.cintura} cm` : '-'}</td>
                                <td>{c.quadril ? `${c.quadril} cm` : '-'}</td>
                                <td>{c.percentual_gordura ? `${c.percentual_gordura}%` : '-'}</td>
                                <td className="consultation-obs-cell" title={c.observacoes || ''}>
                                  {c.observacoes || '-'}
                                </td>
                                <td>
                                  {c.proximo_retorno 
                                    ? new Date(c.proximo_retorno + 'T00:00:00').toLocaleDateString('pt-BR') 
                                    : '-'}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-timeline-state" style={{ padding: '3.5rem 1.5rem' }}>
                      <Calendar size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                      <p>Nenhuma consulta registrada ainda.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* SEÇÃO 3 — PLANOS ALIMENTARES */}
              <section className="profile-section-card animate-fade">
                {/* 3A. MODO LOADING DA GERADORA DE IA */}
                {isGenerating && (
                  <div className="weight-chart-empty" style={{ height: '300px', background: '#f8fafc' }}>
                    <div style={{ position: 'relative', width: '50px', height: '50px', marginBottom: '1rem' }}>
                      <div className="logo-small" style={{ width: '50px', height: '50px', fontSize: '1.5rem', animation: 'spin 1.5s linear infinite' }}>✨</div>
                    </div>
                    <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: '0 0 0.5rem 0' }}>Gerando Plano Alimentar com IA</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', animation: 'pulse 1.5s ease-in-out infinite', margin: 0 }}>
                      {loadingMessage}
                    </p>
                  </div>
                )}

                {/* 3B. MODO DE EDIÇÃO DO PLANO ATIVO (GERADO OU MANUAL) */}
                {!isGenerating && planoAtivo && (
                  <div className="animate-fade">
                    <div className="profile-section-title" style={{ borderBottom: 'none', marginBottom: '1rem' }}>
                      <div className="profile-section-title-text">
                        <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                        <span>✨ Elaborar Plano Alimentar</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          type="button" 
                          className="btn-secondary-outline"
                          onClick={() => setPlanoAtivo(null)}
                          style={{ padding: '0.4rem 0.85rem', fontSize: '0.8125rem' }}
                        >
                          Descartar
                        </button>
                        <button 
                          type="button" 
                          className="btn-primary"
                          onClick={handleSalvarPlanoAlimentar}
                          style={{ width: 'auto', padding: '0.4rem 0.85rem', fontSize: '0.8125rem' }}
                        >
                          Salvar Plano Alimentar
                        </button>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                      Ajuste as opções de refeições sugeridas pela IA ou preencha-as manualmente para cada dia da semana.
                    </p>

                    {/* Abas horizontais dos dias da semana */}
                    <div className="tabs-navigation" style={{ borderBottom: '2px solid var(--border)', marginBottom: '1.5rem', overflowX: 'auto', whiteSpace: 'nowrap', display: 'flex' }}>
                      {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'].map((dia) => (
                        <button
                          key={dia}
                          type="button"
                          className={`tab-btn ${activePlanTab === dia ? 'active' : ''}`}
                          onClick={() => setActivePlanTab(dia)}
                          style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', display: 'inline-block' }}
                        >
                          {dia}
                        </button>
                      ))}
                    </div>

                    {/* Formulário com as refeições do dia ativo */}
                    {planoAtivo.plano_semanal.map((diaObj: any) => {
                      if (diaObj.dia !== activePlanTab) return null

                      return (
                        <div key={diaObj.dia} className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          {Object.keys(diaObj.refeicoes).map((refKey) => {
                            const labelMap: any = {
                              cafe_da_manha: '☕ Café da Manhã',
                              lanche_manha: '🍎 Lanche da Manhã',
                              almoco: '🍛 Almoço',
                              lanche_tarde: '🍪 Lanche da Tarde',
                              jantar: '🥗 Jantar'
                            }
                            const refLabel = labelMap[refKey] || refKey
                            const opcoes = diaObj.refeicoes[refKey]

                            return (
                              <div key={refKey} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                                <h5 style={{ margin: '0 0 0.75rem 0', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                  {refLabel}
                                </h5>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {opcoes.map((opcao: string, index: number) => (
                                    <input
                                      key={index}
                                      type="text"
                                      className="input-field"
                                      placeholder={`Opção ${index + 1} de refeição`}
                                      value={opcao}
                                      onChange={(e) => handleUpdateOption(diaObj.dia, refKey, index, e.target.value)}
                                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                                    />
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                      <button 
                        type="button" 
                        className="btn-secondary-outline"
                        onClick={() => setPlanoAtivo(null)}
                      >
                        Descartar
                      </button>
                      <button 
                        type="button" 
                        className="btn-primary"
                        onClick={handleSalvarPlanoAlimentar}
                        style={{ width: 'auto' }}
                      >
                        Salvar Plano Alimentar
                      </button>
                    </div>
                  </div>
                )}

                {/* 3C. MODO EXIBIÇÃO PADRÃO (HISTÓRICO & AÇÃO DE INICIALIZAÇÃO) */}
                {!isGenerating && !planoAtivo && (
                  <div className="animate-fade">
                    <div className="profile-section-title">
                      <div className="profile-section-title-text">
                        <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                        <span>Planos Alimentares</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          type="button" 
                          className="btn-secondary-outline"
                          onClick={handleCriarPlanoManual}
                          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        >
                          Criar Manual
                        </button>
                        <button 
                          type="button" 
                          className="btn-primary"
                          onClick={handleGerarPlanoComIA}
                          style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          ✨ Gerar Plano com IA
                        </button>
                      </div>
                    </div>

                    {planosAlimentares.length > 0 ? (
                      <div className="plans-list animate-fade">
                        {planosAlimentares.map((plan) => (
                          <div key={plan.id} className="plan-item-card">
                            <div 
                              className="plan-item-header"
                              onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}
                            >
                              <span className="plan-title">
                                📋 Plano Alimentar Semanal
                              </span>
                              <div className="plan-item-header-actions">
                                <span className="plan-date">
                                  Gerado em {new Date(plan.created_at).toLocaleDateString('pt-BR')} às {new Date(plan.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <button
                                  className="btn-export-pdf"
                                  onClick={(e) => { e.stopPropagation(); handleExportPlanPDF(plan) }}
                                  title="Exportar como PDF"
                                >
                                  <Download size={13} /> PDF
                                </button>
                                <button
                                  className="btn-share"
                                  onClick={(e) => { e.stopPropagation(); handleCompartilharPlano(plan, pacienteSelecionado?.nome || '') }}
                                  title="Copiar texto do plano"
                                >
                                  <Share2 size={13} /> Copiar
                                </button>
                              </div>
                            </div>
                            {expandedPlanId === plan.id && (
                              <div className="plan-item-body animate-fade">
                                {typeof plan.conteudo === 'object' && plan.conteudo.plano_semanal ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {plan.conteudo.plano_semanal.map((diaObj: any) => (
                                      <div key={diaObj.dia} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                                        <h6 style={{ margin: '0 0 0.75rem 0', color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem' }}>
                                          {diaObj.dia}
                                        </h6>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                          {Object.keys(diaObj.refeicoes).map((refKey) => {
                                            const labelMap: any = {
                                              cafe_da_manha: '☕ Café da Manhã',
                                              lanche_manha: '🍎 Lanche da Manhã',
                                              almoco: '🍛 Almoço',
                                              lanche_tarde: '🍪 Lanche da Tarde',
                                              jantar: '🥗 Jantar'
                                            }
                                            const labelRef = labelMap[refKey] || refKey
                                            const itens = diaObj.refeicoes[refKey].filter((opt: string) => opt.trim() !== '')

                                            if (itens.length === 0) return null

                                            return (
                                              <div key={refKey} style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                                                <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>
                                                  {labelRef}
                                                </span>
                                                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#475569', lineHeight: '1.5' }}>
                                                  {itens.map((it: string, idx: number) => (
                                                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{it}</li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.9rem' }}>
                                    {typeof plan.conteudo === 'object' ? JSON.stringify(plan.conteudo, null, 2) : plan.conteudo}
                                  </pre>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="plan-empty-state">
                        <p style={{ margin: 0 }}>Nenhum plano alimentar gerado ainda.</p>
                      </div>
                    )}
                  </div>
                )}
              </section>

            </div>
          </div>
        )}

        {/* 5. VIEW AGENDA */}
        {currentView === 'agenda' && (
          <div className="animate-fade">
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Agenda de Consultas</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Visualize e gerencie todas as consultas agendadas.</p>
            </div>

            <div className="calendar-wrapper">
              {/* Calendário mensal */}
              <div className="calendar-container">
                <div className="calendar-nav">
                  <button
                    className="calendar-nav-btn"
                    onClick={() => {
                      const d = new Date(calendarDate)
                      d.setMonth(d.getMonth() - 1)
                      setCalendarDate(d)
                      setSelectedCalendarDay(null)
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <h3>
                    {calendarDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    className="calendar-nav-btn"
                    onClick={() => {
                      const d = new Date(calendarDate)
                      d.setMonth(d.getMonth() + 1)
                      setCalendarDate(d)
                      setSelectedCalendarDay(null)
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="calendar-grid">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                    <div key={d} className="calendar-day-header">{d}</div>
                  ))}
                  {getCalendarDays(calendarDate).map((day, i) => {
                    const isCurrentMonth = day.getMonth() === calendarDate.getMonth()
                    const hoje = new Date()
                    const isToday = day.toDateString() === hoje.toDateString()
                    const isSelected = selectedCalendarDay?.toDateString() === day.toDateString()
                    const consultasDia = getConsultasPorDia(day)
                    return (
                      <div
                        key={i}
                        className={[
                          'calendar-day',
                          !isCurrentMonth ? 'other-month' : '',
                          isToday ? 'today' : '',
                          isSelected ? 'selected' : ''
                        ].join(' ')}
                        onClick={() => setSelectedCalendarDay(isSelected ? null : day)}
                      >
                        <div className="calendar-day-number">{day.getDate()}</div>
                        <div className="calendar-events">
                          {consultasDia.slice(0, 2).map((c, ci) => {
                            const isFuture = new Date(c.data_consulta) >= hoje
                            const isHoje = new Date(c.data_consulta).toDateString() === hoje.toDateString()
                            return (
                              <div
                                key={ci}
                                className={`calendar-event-dot ${isHoje ? 'today-event' : isFuture ? 'future' : 'past'}`}
                              >
                                {(c.pacientes as any)?.nome?.split(' ')[0] || 'Consulta'}
                              </div>
                            )
                          })}
                          {consultasDia.length > 2 && (
                            <div className="calendar-event-dot past">+{consultasDia.length - 2}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Painel lateral */}
              <div className="agenda-panel">
                <div className="agenda-panel-header">
                  {selectedCalendarDay
                    ? `📅 ${selectedCalendarDay.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`
                    : `📅 ${calendarDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`
                  }
                </div>
                <div className="agenda-events-list">
                  {getConsultasDoDiaSelecionado().length === 0 ? (
                    <div className="agenda-empty">
                      {selectedCalendarDay ? '📭 Nenhuma consulta neste dia.' : '📭 Nenhuma consulta neste mês.'}
                    </div>
                  ) : (
                    getConsultasDoDiaSelecionado().map((c) => {
                      const dataC = new Date(c.data_consulta)
                      const isFuture = dataC >= new Date()
                      const paciente = pacientes.find(p => p.id === c.paciente_id)
                      return (
                        <div
                          key={c.id}
                          className={`agenda-event-item ${isFuture ? 'future' : 'past'}`}
                          onClick={() => paciente && handleViewPaciente(paciente.id, 'dashboard')}
                        >
                          <div>
                            <div className="agenda-event-time">
                              {dataC.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: isFuture ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                              {isFuture ? 'Futuro' : dataC.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="agenda-event-name">{(c.pacientes as any)?.nome || 'Paciente'}</div>
                            <div className="agenda-event-type">
                              {c.peso ? `⚖️ ${c.peso} kg` : 'Consulta'}
                              {c.observacoes && ` · ${c.observacoes.slice(0, 30)}...`}
                            </div>
                          </div>
                          <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. VIEW PERFIL DA NUTRICIONISTA */}
        {currentView === 'perfil-nutri' && (
          <div className="animate-fade">
            <div className="nutri-profile-container">
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Meu Perfil</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Gerencie suas informações profissionais.</p>
                </div>
              </div>

              <div className="nutri-profile-card">
                <div className="nutri-profile-banner" />
                
                <div className="nutri-profile-avatar-wrap">
                  <div
                    className="nutri-profile-avatar"
                    onClick={() => fileInputRef.current?.click()}
                    title="Clique para trocar a foto"
                  >
                    {nutriFotoUrl
                      ? <img src={nutriFotoUrl} alt="foto de perfil" />
                      : <span>{(nutriNomeCompleto || nutriNome || 'N').charAt(0).toUpperCase()}</span>
                    }
                    <div className="avatar-overlay">📷 Trocar foto</div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFotoUpload}
                  />
                </div>

                <div className="nutri-profile-body">
                  <div className="nutri-profile-name-section">
                    <h2>{nutriNomeCompleto || nutriNome || 'Nutricionista'}</h2>
                    <p>{nutriEspecialidade || 'Nutricionista'}</p>
                    {nutriCrn && <span className="crn-badge">{nutriCrn}</span>}
                  </div>

                  <form onSubmit={handleSalvarPerfilNutri}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Nome Completo *</label>
                        <input
                          type="text"
                          className="input-field"
                          value={nutriNomeCompleto}
                          onChange={e => setNutriNomeCompleto(e.target.value)}
                          required
                          placeholder="Seu nome completo"
                        />
                      </div>

                      <div className="form-group">
                        <label>CRN (Registro Profissional)</label>
                        <input
                          type="text"
                          className="input-field"
                          value={nutriCrn}
                          onChange={e => setNutriCrn(e.target.value)}
                          placeholder="Ex: CRN-3 12345"
                        />
                      </div>

                      <div className="form-group">
                        <label>Especialidade</label>
                        <input
                          type="text"
                          className="input-field"
                          value={nutriEspecialidade}
                          onChange={e => setNutriEspecialidade(e.target.value)}
                          placeholder="Ex: Nutrição Esportiva"
                        />
                      </div>

                      <div className="form-group">
                        <label>Telefone / WhatsApp</label>
                        <input
                          type="text"
                          className="input-field"
                          value={nutriTelefone}
                          onChange={e => setNutriTelefone(e.target.value)}
                          placeholder="Ex: (11) 99999-9999"
                        />
                      </div>

                      <div className="form-group-full">
                        <label>E-mail de contato</label>
                        <input
                          type="email"
                          className="input-field"
                          value={session.user.email}
                          disabled
                          style={{ background: '#f8fafc', color: 'var(--text-muted)' }}
                        />
                      </div>

                      <div className="form-group-full">
                        <label>Bio / Apresentação</label>
                        <textarea
                          className="input-field text-area"
                          value={nutriBio}
                          onChange={e => setNutriBio(e.target.value)}
                          placeholder="Conte um pouco sobre você, sua formação, abordagem de atendimento..."
                          rows={4}
                        />
                      </div>
                    </div>

                    {/* Estatísticas rápidas */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                      <div style={{ background: '#f0fdf4', border: '1px solid #bfe5d9', borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{pacientes.length}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pacientes</div>
                      </div>
                      <div style={{ background: '#f0fdf4', border: '1px solid #bfe5d9', borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{consultas.length}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Consultas</div>
                      </div>
                      <div style={{ background: '#f0fdf4', border: '1px solid #bfe5d9', borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{consultas.filter(c => new Date(c.data_consulta) >= new Date()).length}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Agendamentos</div>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={savingPerfil}>
                        {savingPerfil ? 'Salvando...' : 'Salvar Perfil'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- MODAL ADICIONAR PACIENTE --- */}
      {isAddPacienteOpen && (
        <div className="modal-backdrop">
          <div className="modal-content animate-fade">
            <div className="modal-header">
              <h3>Novo Paciente</h3>
              <button className="btn-close" onClick={() => setIsAddPacienteOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddPaciente}>
              <label>Nome Completo *</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Nome do paciente" 
                value={novoPacienteNome}
                onChange={(e) => setNovoPacienteNome(e.target.value)}
                required
              />

              <label>WhatsApp</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Ex: (11) 99999-9999" 
                value={novoPacienteWhatsapp}
                onChange={(e) => setNovoPacienteWhatsapp(e.target.value)}
              />

              <label>E-mail</label>
              <input 
                type="email" 
                className="input-field" 
                placeholder="email@paciente.com" 
                value={novoPacienteEmail}
                onChange={(e) => setNovoPacienteEmail(e.target.value)}
              />

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary-outline" 
                  onClick={() => setIsAddPacienteOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  Salvar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL ADICIONAR CONSULTA --- */}
      {isAddConsultaOpen && (
        <div className="modal-backdrop">
          <div className="modal-content animate-fade" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Registrar Nova Consulta</h3>
              <button className="btn-close" onClick={() => setIsAddConsultaOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddConsulta}>
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div className="form-group-full">
                  <label>Data e Hora da Consulta *</label>
                  <input 
                    type="datetime-local" 
                    className="input-field" 
                    value={novaConsultaData}
                    onChange={(e) => setNovaConsultaData(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Peso Atual *</label>
                  <div className="input-wrapper">
                    <input 
                      type="number" 
                      step="0.1" 
                      className="input-field" 
                      placeholder="Ex: 70.5" 
                      value={novaConsultaPeso}
                      onChange={(e) => setNovaConsultaPeso(e.target.value)}
                      required
                    />
                    <span className="input-suffix">kg</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Cintura (Opcional)</label>
                  <div className="input-wrapper">
                    <input 
                      type="number" 
                      step="0.1" 
                      className="input-field" 
                      placeholder="Ex: 80.0" 
                      value={novaConsultaCintura}
                      onChange={(e) => setNovaConsultaCintura(e.target.value)}
                    />
                    <span className="input-suffix">cm</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Quadril (Opcional)</label>
                  <div className="input-wrapper">
                    <input 
                      type="number" 
                      step="0.1" 
                      className="input-field" 
                      placeholder="Ex: 95.0" 
                      value={novaConsultaQuadril}
                      onChange={(e) => setNovaConsultaQuadril(e.target.value)}
                    />
                    <span className="input-suffix">cm</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>% de Gordura (Opcional)</label>
                  <div className="input-wrapper">
                    <input 
                      type="number" 
                      step="0.1" 
                      className="input-field" 
                      placeholder="Ex: 18.5" 
                      value={novaConsultaGordura}
                      onChange={(e) => setNovaConsultaGordura(e.target.value)}
                    />
                    <span className="input-suffix">%</span>
                  </div>
                </div>

                <div className="form-group-full">
                  <label>Próximo Retorno (Opcional)</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={novaConsultaRetorno}
                    onChange={(e) => setNovaConsultaRetorno(e.target.value)}
                  />
                </div>

                <div className="form-group-full">
                  <label>Observações / Notas Clínicas</label>
                  <textarea 
                    className="input-field text-area" 
                    placeholder="Evolução, queixas, metas, novos hábitos acordados..." 
                    value={novaConsultaObs}
                    onChange={(e) => setNovaConsultaObs(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary-outline" 
                  onClick={() => setIsAddConsultaOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  Salvar Consulta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// --- App Root ---
function App() {
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <>
      <Toaster position="top-right" />
      {!session ? <Auth /> : <Dashboard session={session} />}
    </>
  )
}

export default App

