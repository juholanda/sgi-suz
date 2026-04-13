'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { ClasseNum } from '@/lib/tokens'

type Etapa = 1 | 2 | 3

interface Area {
  id: string
  nome: string
  codigo: string | null
  planta: { id: string; nome: string }
}

interface Equipamento {
  id: string
  tag: string
  descricao: string
  areaId: string
  area: { nome: string }
}

interface UserOption {
  id: string
  nome: string
  matricula: string
  cargo: { nome: string } | null
}

interface FormData {
  areaId: string
  equipamentoId: string
  executanteId: string
  tipo: string
  classeNumero: string
  funcaoIntertravamento: string
  motivoDesabilitacao: string
  periodoInicio: string
  periodoFim: string
  medidasContingenciais: string
  cienteRiscos: boolean
}

interface FieldError {
  [key: string]: string
}

interface AnexoFile {
  file: File
  preview?: string // para imagens
}

const ETAPAS = [
  { num: 1, label: 'Identificação' },
  { num: 2, label: 'Contingência' },
  { num: 3, label: 'Revisão e Envio' },
]

const PRAZO_MAX: Record<string, string> = {
  '1': '7 dias', '2': '5 dias', '3': '3 dias', '4': '1 dia', '5': 'NÃO FORÇÁVEL',
}

const COR_CLASSE: Record<string, string> = {
  '1': '#16A34A', '2': '#EAB308', '3': '#EA580C', '4': '#DC2626', '5': '#7F1D1D',
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1 }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

export default function NovaSolicitacaoPage() {
  const router = useRouter()
  const [etapa, setEtapa] = useState<Etapa>(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FieldError>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Dados externos
  const [areas, setAreas] = useState<Area[]>([])
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [executantes, setExecutantes] = useState<UserOption[]>([])
  const [loadingAreas, setLoadingAreas] = useState(true)

  // Anexos — RF-016
  const [anexos, setAnexos] = useState<AnexoFile[]>([])

  const [form, setForm] = useState<FormData>({
    areaId: '', equipamentoId: '', executanteId: '', tipo: '', classeNumero: '',
    funcaoIntertravamento: '', motivoDesabilitacao: '', periodoInicio: '', periodoFim: '',
    medidasContingenciais: '', cienteRiscos: false,
  })

  useEffect(() => {
    fetch('/api/areas')
      .then(r => r.json())
      .then(data => { setAreas(data); setLoadingAreas(false) })
      .catch(() => setLoadingAreas(false))
  }, [])

  useEffect(() => {
    if (!form.areaId) { setEquipamentos([]); return }
    fetch(`/api/equipamentos?areaId=${form.areaId}`)
      .then(r => r.json())
      .then(data => setEquipamentos(data))
      .catch(() => setEquipamentos([]))
  }, [form.areaId])

  useEffect(() => {
    const plantaId = areas.find(a => a.id === form.areaId)?.planta.id
    const qs = plantaId ? `?perfil=EXECUTANTE&plantaId=${plantaId}` : '?perfil=EXECUTANTE'
    fetch(`/api/users${qs}`)
      .then(r => r.json())
      .then(data => setExecutantes(data))
      .catch(() => {})
  }, [form.areaId, areas])

  function set(field: keyof FormData, value: string | boolean) {
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
    if (field === 'areaId') {
      setForm(prev => ({ ...prev, areaId: value as string, equipamentoId: '' }))
    } else {
      setForm(prev => ({ ...prev, [field]: value }))
    }
  }

  // Equipamento selecionado — para o info block
  const equipSelecionado = equipamentos.find(e => e.id === form.equipamentoId)
  const areaSelecionada = areas.find(a => a.id === form.areaId)
  const executanteSelecionado = executantes.find(u => u.id === form.executanteId)

  function validateEtapa1(): boolean {
    const e: FieldError = {}
    if (!form.areaId) e.areaId = 'Selecione a área'
    if (!form.equipamentoId) e.equipamentoId = 'Selecione o equipamento / TAG'
    if (!form.executanteId) e.executanteId = 'Selecione o executante'
    if (!form.tipo) e.tipo = 'Selecione o tipo de intertravamento'
    if (!form.classeNumero) e.classeNumero = 'Selecione a classe'
    if (!form.funcaoIntertravamento.trim()) e.funcaoIntertravamento = 'Campo obrigatório'
    if (!form.motivoDesabilitacao.trim()) e.motivoDesabilitacao = 'Campo obrigatório'
    if (!form.periodoInicio) e.periodoInicio = 'Campo obrigatório'
    if (!form.periodoFim) e.periodoFim = 'Campo obrigatório'
    if (form.periodoInicio && form.periodoFim && new Date(form.periodoFim) <= new Date(form.periodoInicio)) {
      e.periodoFim = 'O fim deve ser posterior ao início'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateEtapa2(): boolean {
    const e: FieldError = {}
    if (!form.medidasContingenciais.trim()) e.medidasContingenciais = 'Campo obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function avancar() {
    if (etapa === 1 && !validateEtapa1()) return
    if (etapa === 2 && !validateEtapa2()) return
    setEtapa(e => (e + 1) as Etapa)
  }

  // Anexos handlers — RF-016
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const novos: AnexoFile[] = files.map(file => {
      const isImage = file.type.startsWith('image/')
      return {
        file,
        preview: isImage ? URL.createObjectURL(file) : undefined,
      }
    })
    setAnexos(prev => [...prev, ...novos])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removerAnexo(index: number) {
    setAnexos(prev => {
      const next = [...prev]
      if (next[index].preview) URL.revokeObjectURL(next[index].preview!)
      next.splice(index, 1)
      return next
    })
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  async function handleSalvarRascunho() {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('data', JSON.stringify({ ...form, rascunho: true }))
      anexos.forEach(a => formData.append('anexos', a.file))
      const res = await fetch('/api/solicitacoes', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) router.push('/solicitacoes')
    } finally {
      setLoading(false)
    }
  }

  async function handleEnviar() {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('data', JSON.stringify({ ...form, rascunho: false }))
      anexos.forEach(a => formData.append('anexos', a.file))
      const res = await fetch('/api/solicitacoes', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      router.push(`/solicitacoes/${data.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Nova Solicitação de Desabilitação</h1>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-0 mb-8">
        {ETAPAS.map((e, i) => (
          <div key={e.num} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 flex items-center justify-center text-xs font-bold"
                style={{
                  borderRadius: '50%',
                  background: etapa >= e.num ? '#0038A8' : '#E2E8F0',
                  color: etapa >= e.num ? 'white' : '#94A3B8',
                }}
              >
                {etapa > e.num ? '✓' : e.num}
              </div>
              <span className="text-sm" style={{ color: etapa === e.num ? '#0038A8' : '#94A3B8', fontWeight: etapa === e.num ? 600 : 400 }}>
                {e.label}
              </span>
            </div>
            {i < ETAPAS.length - 1 && (
              <div className="w-12 h-px mx-3" style={{ background: etapa > e.num ? '#0038A8' : '#E2E8F0' }} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white border p-6" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>

        {/* ETAPA 1 — Identificação */}
        {etapa === 1 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold" style={{ color: '#0F172A' }}>Etapa 1 — Identificação</h2>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Área *" error={errors.areaId}>
                <select
                  className={`field-input ${errors.areaId ? 'field-error' : ''}`}
                  value={form.areaId}
                  onChange={e => set('areaId', e.target.value)}
                  disabled={loadingAreas}
                >
                  <option value="">{loadingAreas ? 'Carregando...' : 'Selecione a área'}</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.planta.nome} › {a.nome}</option>
                  ))}
                </select>
              </Field>

              <Field label="TAG do Intertravamento *" error={errors.equipamentoId}>
                <select
                  className={`field-input ${errors.equipamentoId ? 'field-error' : ''}`}
                  value={form.equipamentoId}
                  onChange={e => set('equipamentoId', e.target.value)}
                  disabled={!form.areaId}
                >
                  <option value="">{!form.areaId ? 'Selecione a área primeiro' : 'Selecione o equipamento'}</option>
                  {equipamentos.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.tag}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Info block da TAG — RF-014 */}
            {equipSelecionado && (
              <div
                className="p-4 space-y-2"
                style={{ background: '#F0F4F8', borderRadius: '6px', border: '1px solid #E2E8F0' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="info" size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#475569' }}>
                    Informações do Intertravamento
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <InfoRow icon="tag" label="TAG" value={equipSelecionado.tag} mono />
                  <InfoRow icon="description" label="Descrição" value={equipSelecionado.descricao} />
                  <InfoRow icon="location_on" label="Área" value={equipSelecionado.area.nome} />
                  {areaSelecionada && (
                    <InfoRow icon="factory" label="Planta" value={areaSelecionada.planta.nome} />
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Executante *" error={errors.executanteId}>
                <select
                  className={`field-input ${errors.executanteId ? 'field-error' : ''}`}
                  value={form.executanteId}
                  onChange={e => set('executanteId', e.target.value)}
                >
                  <option value="">Selecione o executante</option>
                  {executantes.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nome} ({u.matricula}){u.cargo ? ` — ${u.cargo.nome}` : ''}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Tipo de Intertravamento *" error={errors.tipo}>
                <select
                  className={`field-input ${errors.tipo ? 'field-error' : ''}`}
                  value={form.tipo}
                  onChange={e => set('tipo', e.target.value)}
                >
                  <option value="">Selecione o tipo</option>
                  <option value="FISICO">Físico</option>
                  <option value="LOGICO">Lógico</option>
                  <option value="DISPOSITIVO_SEGURANCA">Dispositivo de Segurança</option>
                </select>
              </Field>
            </div>

            {/* Seletor de Classe — RF-012: Classe 5 desabilitada */}
            <Field label="Classe *" error={errors.classeNumero}>
              <div className="flex gap-2">
                {([1, 2, 3, 4] as ClasseNum[]).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('classeNumero', String(c))}
                    className="flex-1 py-2.5 text-sm font-medium border transition-all"
                    style={{
                      borderRadius: '6px',
                      borderColor: form.classeNumero === String(c) ? COR_CLASSE[String(c)] : '#E2E8F0',
                      background: form.classeNumero === String(c) ? `${COR_CLASSE[String(c)]}18` : 'white',
                      color: form.classeNumero === String(c) ? COR_CLASSE[String(c)] : '#6B7280',
                    }}
                  >
                    <div className="font-semibold">Classe {c}</div>
                    <div className="text-xs opacity-80">{PRAZO_MAX[String(c)]}</div>
                  </button>
                ))}
                {/* Classe 5 — desabilitada, RF-012 */}
                <div className="relative group flex-1">
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 text-sm border cursor-not-allowed opacity-40"
                    style={{ borderRadius: '6px', borderColor: '#E2E8F0', background: '#F8FAFC', color: '#94A3B8' }}
                  >
                    <div className="font-semibold">Classe 5</div>
                    <div className="text-xs">NÃO FORÇÁVEL</div>
                  </button>
                  <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-52 text-xs text-center text-white px-3 py-2"
                    style={{ background: '#1E293B', borderRadius: '6px' }}
                  >
                    Classe 5 não pode ser desabilitada sob nenhuma circunstância
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: '#1E293B' }} />
                  </div>
                </div>
              </div>
              {form.classeNumero && (
                <div
                  className="mt-3 flex items-center gap-3 px-3 py-2 text-sm"
                  style={{ background: `${COR_CLASSE[form.classeNumero]}10`, borderRadius: '6px', border: `1px solid ${COR_CLASSE[form.classeNumero]}40` }}
                >
                  <ClasseBadge classe={parseInt(form.classeNumero) as ClasseNum} showPrazo />
                  <span style={{ color: '#475569' }}>
                    Prazo máximo: <strong>{PRAZO_MAX[form.classeNumero]}</strong> após execução
                  </span>
                </div>
              )}
            </Field>

            <Field label="Função do intertravamento *" error={errors.funcaoIntertravamento}>
              <input
                className={`field-input ${errors.funcaoIntertravamento ? 'field-error' : ''}`}
                placeholder="Descreva a função de proteção deste intertravamento"
                value={form.funcaoIntertravamento}
                onChange={e => set('funcaoIntertravamento', e.target.value)}
              />
            </Field>

            <Field label="Motivo da desabilitação *" error={errors.motivoDesabilitacao}>
              <textarea
                className={`field-input ${errors.motivoDesabilitacao ? 'field-error' : ''}`}
                rows={3}
                placeholder="Descreva o motivo técnico da desabilitação..."
                value={form.motivoDesabilitacao}
                onChange={e => set('motivoDesabilitacao', e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Período início *" error={errors.periodoInicio}>
                <input
                  type="datetime-local"
                  className={`field-input ${errors.periodoInicio ? 'field-error' : ''}`}
                  value={form.periodoInicio}
                  onChange={e => set('periodoInicio', e.target.value)}
                />
              </Field>
              <Field label="Período fim *" error={errors.periodoFim}>
                <input
                  type="datetime-local"
                  className={`field-input ${errors.periodoFim ? 'field-error' : ''}`}
                  value={form.periodoFim}
                  onChange={e => set('periodoFim', e.target.value)}
                />
              </Field>
            </div>

            {form.periodoInicio && form.periodoFim && new Date(form.periodoFim) > new Date(form.periodoInicio) && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm" style={{ background: '#EBF0FB', color: '#0038A8', borderRadius: '6px' }}>
                <Icon name="schedule" size={16} />
                Duração prevista: <strong>{Math.ceil((new Date(form.periodoFim).getTime() - new Date(form.periodoInicio).getTime()) / 86400000)} dia(s)</strong>
              </div>
            )}
          </div>
        )}

        {/* ETAPA 2 — Contingência + Anexos */}
        {etapa === 2 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold" style={{ color: '#0F172A' }}>Etapa 2 — Medidas Contingenciais e Anexos</h2>

            <div className="flex items-start gap-2 px-4 py-3 text-sm" style={{ background: '#FEF9C3', color: '#92400E', borderRadius: '6px', border: '1px solid #FDE68A' }}>
              <Icon name="warning" size={18} />
              <span><strong>Atenção:</strong> Descreva as medidas que garantirão a segurança durante o período de desabilitação.</span>
            </div>

            <Field label="Medidas Preventivas / Contingenciais *" error={errors.medidasContingenciais}>
              <textarea
                className={`field-input ${errors.medidasContingenciais ? 'field-error' : ''}`}
                rows={6}
                placeholder="Exemplos:&#10;• Monitoramento manual periódico&#10;• Isolamento de área&#10;• Sinalização adicional&#10;• Procedimentos operacionais alternativos"
                value={form.medidasContingenciais}
                onChange={e => set('medidasContingenciais', e.target.value)}
                maxLength={1000}
              />
              <div className="text-right text-xs mt-1" style={{ color: '#94A3B8' }}>
                {form.medidasContingenciais.length}/1000 caracteres
              </div>
            </Field>

            {/* Upload de anexos — RF-016 */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                Anexos (fotos, PDFs)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center gap-2 w-full py-3 text-sm cursor-pointer border-2 border-dashed transition-colors"
                style={{ borderColor: '#CBD5E1', borderRadius: '6px', color: '#475569' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#0038A8')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#CBD5E1')}
              >
                <Icon name="attach_file" size={20} />
                Clique para adicionar arquivos ou arraste aqui
                <span className="text-xs" style={{ color: '#94A3B8' }}>(PDF, JPG, PNG, WEBP)</span>
              </label>

              {/* Lista de anexos adicionados */}
              {anexos.length > 0 && (
                <div className="mt-3 space-y-2">
                  {anexos.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5"
                      style={{ background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}
                    >
                      {a.preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.preview} alt="" className="w-10 h-10 object-cover" style={{ borderRadius: '4px' }} />
                      ) : (
                        <div
                          className="w-10 h-10 flex items-center justify-center"
                          style={{ background: '#FEE2E2', borderRadius: '4px' }}
                        >
                          <Icon name="picture_as_pdf" size={22} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#0F172A' }}>{a.file.name}</p>
                        <p className="text-xs" style={{ color: '#94A3B8' }}>{formatBytes(a.file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removerAnexo(i)}
                        className="flex items-center justify-center w-7 h-7"
                        style={{ color: '#94A3B8', borderRadius: '4px' }}
                      >
                        <Icon name="close" size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ETAPA 3 — Revisão */}
        {etapa === 3 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold" style={{ color: '#0F172A' }}>Etapa 3 — Revisão e Envio</h2>

            <div className="border divide-y" style={{ borderColor: '#E2E8F0', borderRadius: '6px' }}>
              <ResumoRow label="Área" value={areaSelecionada ? `${areaSelecionada.planta.nome} › ${areaSelecionada.nome}` : '—'} />
              <ResumoRow label="TAG" value={equipSelecionado?.tag ?? '—'} mono />
              <ResumoRow label="Tipo" value={
                form.tipo === 'FISICO' ? 'Físico' :
                form.tipo === 'LOGICO' ? 'Lógico' :
                form.tipo === 'DISPOSITIVO_SEGURANCA' ? 'Dispositivo de Segurança' : '—'
              } />
              <ResumoRow label="Classe" value={form.classeNumero ? `Classe ${form.classeNumero} — ${PRAZO_MAX[form.classeNumero]}` : '—'} />
              <ResumoRow label="Executante" value={executanteSelecionado ? `${executanteSelecionado.nome} (${executanteSelecionado.matricula})` : '—'} />
              <ResumoRow label="Período" value={
                form.periodoInicio && form.periodoFim
                  ? `${new Date(form.periodoInicio).toLocaleString('pt-BR')} → ${new Date(form.periodoFim).toLocaleString('pt-BR')}`
                  : '—'
              } />
              <ResumoRow label="Motivo" value={form.motivoDesabilitacao} />
              <ResumoRow label="Medidas" value={form.medidasContingenciais} />
              {anexos.length > 0 && (
                <ResumoRow label="Anexos" value={`${anexos.length} arquivo(s): ${anexos.map(a => a.file.name).join(', ')}`} />
              )}
            </div>

            {/* Ciência — RF-024 */}
            <div className="border p-4" style={{ borderColor: '#E2E8F0', borderRadius: '6px' }}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.cienteRiscos}
                  onChange={e => set('cienteRiscos', e.target.checked)}
                  className="mt-0.5"
                  style={{ accentColor: '#0038A8' }}
                />
                <span className="text-sm" style={{ color: '#374151' }}>
                  <strong>Declaro ciência dos riscos</strong> durante o período de desabilitação e assumo responsabilidade como Responsável Operacional por todas as medidas contingenciais descritas.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-5 border-t" style={{ borderColor: '#E2E8F0' }}>
          <div className="flex gap-2">
            {etapa > 1 && (
              <button
                type="button"
                onClick={() => setEtapa(e => (e - 1) as Etapa)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm border"
                style={{ borderColor: '#E2E8F0', borderRadius: '6px', color: '#475569' }}
              >
                <Icon name="arrow_back" size={16} /> Anterior
              </button>
            )}
            <button
              type="button"
              onClick={handleSalvarRascunho}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border"
              style={{ borderColor: '#E2E8F0', borderRadius: '6px', color: '#475569' }}
            >
              <Icon name="save" size={16} /> Salvar rascunho
            </button>
          </div>
          {etapa < 3 ? (
            <button
              type="button"
              onClick={avancar}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#0038A8', borderRadius: '6px' }}
            >
              Próximo: {ETAPAS[etapa].label} <Icon name="arrow_forward" size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEnviar}
              disabled={!form.cienteRiscos || loading}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white"
              style={{
                background: form.cienteRiscos ? '#0038A8' : '#94A3B8',
                borderRadius: '6px',
                cursor: form.cienteRiscos ? 'pointer' : 'not-allowed',
              }}
            >
              <Icon name="send" size={16} />
              {loading ? 'Enviando...' : 'Enviar Solicitação'}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .field-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          font-size: 14px;
          color: #0F172A;
          outline: none;
          transition: border-color 0.15s;
          background: white;
          font-family: inherit;
        }
        .field-input:focus { border-color: #0038A8; }
        .field-input:disabled { background: #F8FAFC; color: #94A3B8; cursor: not-allowed; }
        .field-error { border-color: #EF4444 !important; }
        select.field-input { appearance: auto; }
      `}</style>
    </div>
  )
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>{label}</label>
      {children}
      {error && <p className="mt-1 text-xs" style={{ color: '#EF4444' }}>{error}</p>}
    </div>
  )
}

function InfoRow({ icon, label, value, mono }: { icon: string; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs" style={{ color: '#94A3B8' }}>{label}</span>
      <span className={`text-sm font-medium ${mono ? 'font-mono' : ''}`} style={{ color: mono ? '#0038A8' : '#0F172A' }}>
        {value}
      </span>
    </div>
  )
}

function ResumoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <span className="text-xs font-medium w-24 shrink-0" style={{ color: '#6B7280' }}>{label}</span>
      <span className={`text-sm flex-1 ${mono ? 'font-mono font-semibold' : ''}`} style={{ color: mono ? '#0038A8' : '#0F172A' }}>
        {value || <span style={{ color: '#94A3B8' }}>—</span>}
      </span>
    </div>
  )
}
