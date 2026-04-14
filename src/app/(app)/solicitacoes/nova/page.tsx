'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { ClasseNum } from '@/lib/tokens'
import { PageBreadcrumb } from '@/components/sgi/PageBreadcrumb'
import { useAppToast } from '@/components/sgi/AppToastProvider'

type Etapa = 1 | 2 | 3

interface FormData {
  areaId: string
  equipamentoId: string
  equipamentoTag: string
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

interface MetaArea {
  id: string
  nome: string
  plantaId: string
  plantaNome: string
}

interface MetaEquipamento {
  id: string
  tag: string
  descricao: string
  areaId: string
  plantaId: string
  areaNome: string
  plantaNome: string
  tipoSugerido: string | null
  funcaoSugerida: string | null
  classeSugerida: number | null
}

interface MetaExecutante {
  id: string
  nome: string
  matricula: string
  areaIds: string[]
  plantaIds: string[]
}

interface MetaClasse {
  id: string
  numero: number
  descricao: string
  prazoMaximoDias: number | null
  cor: string
}

const ETAPAS = [
  { num: 1, label: 'Identificação' },
  { num: 2, label: 'Contingência' },
  { num: 3, label: 'Revisão e Envio' },
]

const PRAZO_MAX: Record<string, string> = {
  '1': '7 dias',
  '2': '5 dias',
  '3': '3 dias',
  '4': '1 dia',
  '5': 'NÃO FORÇÁVEL',
}

type Step1ErrorKey =
  | 'areaId'
  | 'equipamentoId'
  | 'executanteId'
  | 'tipo'
  | 'classeNumero'
  | 'funcaoIntertravamento'
  | 'motivoDesabilitacao'
  | 'periodoInicio'
  | 'periodoFim'

type Step1Errors = Partial<Record<Step1ErrorKey, string>>

export default function NovaSolicitacaoPage() {
  const router = useRouter()
  const { showToast } = useAppToast()
  const [etapa, setEtapa] = useState<Etapa>(1)
  const [loading, setLoading] = useState(false)
  const [metaLoading, setMetaLoading] = useState(true)
  const [areas, setAreas] = useState<MetaArea[]>([])
  const [equipamentos, setEquipamentos] = useState<MetaEquipamento[]>([])
  const [executantes, setExecutantes] = useState<MetaExecutante[]>([])
  const [funcoesIntertravamento, setFuncoesIntertravamento] = useState<string[]>([])
  const [classes, setClasses] = useState<MetaClasse[]>([])
  const [error, setError] = useState('')
  const [showStep1Errors, setShowStep1Errors] = useState(false)
  const [showStep2Errors, setShowStep2Errors] = useState(false)
  const [showStep3Errors, setShowStep3Errors] = useState(false)
  const [form, setForm] = useState<FormData>({
    areaId: '',
    equipamentoId: '',
    equipamentoTag: '',
    executanteId: '',
    tipo: '',
    classeNumero: '',
    funcaoIntertravamento: '',
    motivoDesabilitacao: '',
    periodoInicio: '',
    periodoFim: '',
    medidasContingenciais: '',
    cienteRiscos: false,
  })

  useEffect(() => {
    let cancelled = false
    async function loadMeta() {
      setMetaLoading(true)
      setError('')
      try {
        const res = await fetch('/api/solicitacoes/meta')
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Falha ao carregar dados para abertura de solicitação.')
        if (cancelled) return
        setAreas(data.areas ?? [])
        setEquipamentos(data.equipamentos ?? [])
        setExecutantes(
          (data.executantes ?? []).map((item: any) => ({
            ...item,
            areaIds: item.areaIds ?? [],
            plantaIds: item.plantaIds ?? [],
          })),
        )
        setFuncoesIntertravamento(data.funcoesIntertravamento ?? [])
        setClasses(data.classes ?? [])
        if ((data.areas ?? []).length === 1) {
          setForm(prev => ({ ...prev, areaId: data.areas[0].id }))
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Erro ao carregar dados')
      } finally {
        if (!cancelled) setMetaLoading(false)
      }
    }
    loadMeta()
    return () => {
      cancelled = true
    }
  }, [])

  function set(field: keyof FormData, value: string | boolean) {
    setError('')
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const selectedClasse = useMemo(
    () => classes.find(c => String(c.numero) === form.classeNumero),
    [classes, form.classeNumero],
  )

  const selectedArea = useMemo(
    () => areas.find(area => area.id === form.areaId) ?? null,
    [areas, form.areaId],
  )

  const selectedEquipamento = useMemo(
    () => equipamentos.find(eq => eq.id === form.equipamentoId) ?? null,
    [equipamentos, form.equipamentoId],
  )

  const equipamentosDaArea = useMemo(
    () => equipamentos.filter(eq => !form.areaId || eq.areaId === form.areaId),
    [equipamentos, form.areaId],
  )

  const executantesFiltradosPorArea = useMemo(() => {
    if (!selectedArea) return executantes
    return executantes.filter(executante => {
      const scopedByArea = executante.areaIds.length === 0 || executante.areaIds.includes(selectedArea.id)
      const scopedByPlanta =
        executante.plantaIds.length === 0 || executante.plantaIds.includes(selectedArea.plantaId)
      return scopedByArea && scopedByPlanta
    })
  }, [executantes, selectedArea])

  const usingExecutanteFallback = Boolean(
    selectedArea && executantesFiltradosPorArea.length === 0 && executantes.length > 0,
  )

  const executantesDaArea = useMemo(
    () => (usingExecutanteFallback ? executantes : executantesFiltradosPorArea),
    [executantes, executantesFiltradosPorArea, usingExecutanteFallback],
  )

  useEffect(() => {
    if (form.executanteId && !executantesDaArea.some(executante => executante.id === form.executanteId)) {
      setForm(prev => ({ ...prev, executanteId: '' }))
    }
  }, [executantesDaArea, form.executanteId])

  const funcoesDisponiveis = useMemo(() => {
    const values = new Set<string>()
    if (selectedEquipamento?.funcaoSugerida?.trim()) values.add(selectedEquipamento.funcaoSugerida.trim())
    for (const funcao of funcoesIntertravamento) {
      if (funcao.trim()) values.add(funcao.trim())
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [funcoesIntertravamento, selectedEquipamento])

  const durationDays = useMemo(() => {
    if (!form.periodoInicio || !form.periodoFim) return null
    const start = new Date(form.periodoInicio)
    const end = new Date(form.periodoFim)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null
    return (end.getTime() - start.getTime()) / 86_400_000
  }, [form.periodoInicio, form.periodoFim])

  const exceedsSla = useMemo(() => {
    if (!selectedClasse || selectedClasse.prazoMaximoDias == null || durationDays == null) return false
    return durationDays > selectedClasse.prazoMaximoDias
  }, [durationDays, selectedClasse])

  const step1Errors = useMemo<Step1Errors>(() => {
    const errors: Step1Errors = {}
    if (!form.areaId) errors.areaId = 'Selecione a área.'
    if (!form.equipamentoId) errors.equipamentoId = 'Selecione a TAG do intertravamento.'
    if (!form.executanteId) {
      errors.executanteId =
        executantes.length === 0
          ? 'Nenhum executante ativo foi encontrado no cadastro.'
          : 'Selecione o executante responsável.'
    }
    if (!form.tipo) errors.tipo = 'Selecione o tipo de intertravamento.'
    if (!form.classeNumero) errors.classeNumero = 'Selecione a classe.'
    if (!form.funcaoIntertravamento) errors.funcaoIntertravamento = 'Selecione a função do intertravamento.'
    if (!form.motivoDesabilitacao.trim()) errors.motivoDesabilitacao = 'Descreva o motivo da desabilitação.'
    if (!form.periodoInicio) errors.periodoInicio = 'Informe a data/hora de início.'
    if (!form.periodoFim) errors.periodoFim = 'Informe a data/hora de fim.'

    if (form.periodoInicio && form.periodoFim) {
      const inicio = new Date(form.periodoInicio)
      const fim = new Date(form.periodoFim)
      if (Number.isNaN(inicio.getTime())) errors.periodoInicio = 'Data/hora de início inválida.'
      if (Number.isNaN(fim.getTime())) errors.periodoFim = 'Data/hora de fim inválida.'
      if (!Number.isNaN(inicio.getTime()) && !Number.isNaN(fim.getTime()) && fim <= inicio) {
        errors.periodoFim = 'A data/hora de fim precisa ser maior que a de início.'
      }
      if (!errors.periodoFim && exceedsSla) {
        errors.periodoFim = 'O período excede o SLA da classe selecionada.'
      }
    }
    return errors
  }, [exceedsSla, executantes.length, form])

  const step2Error = useMemo(
    () =>
      form.medidasContingenciais.trim() ? '' : 'Informe as medidas preventivas/contingenciais para avançar.',
    [form.medidasContingenciais],
  )

  const canAdvanceStep1 = Object.keys(step1Errors).length === 0
  const canAdvanceStep2 = step2Error.length === 0

  const visibleStep1Error = (key: Step1ErrorKey) => {
    const message = step1Errors[key]
    if (!message) return ''
    if (showStep1Errors) return message
    if (key === 'periodoInicio' || key === 'periodoFim') {
      return form.periodoInicio || form.periodoFim ? message : ''
    }
    if (key === 'executanteId') {
      return form.areaId && executantes.length === 0 ? message : ''
    }
    return ''
  }

  function handleSelectEquipamento(equipamentoId: string) {
    const eq = equipamentosDaArea.find(item => item.id === equipamentoId)
    if (!eq) {
      setForm(prev => ({
        ...prev,
        equipamentoId: '',
        equipamentoTag: '',
      }))
      return
    }

    setForm(prev => ({
      ...prev,
      areaId: eq.areaId,
      equipamentoId: eq.id,
      equipamentoTag: eq.tag,
      tipo: eq.tipoSugerido ?? prev.tipo,
      classeNumero: eq.classeSugerida ? String(eq.classeSugerida) : prev.classeNumero,
      funcaoIntertravamento: eq.funcaoSugerida ?? prev.funcaoIntertravamento,
    }))
  }

  function nextStep() {
    if (etapa === 1) {
      if (!canAdvanceStep1) {
        setShowStep1Errors(true)
        return
      }
      setShowStep1Errors(false)
    }

    if (etapa === 2) {
      if (!canAdvanceStep2) {
        setShowStep2Errors(true)
        return
      }
      setShowStep2Errors(false)
    }

    setError('')
    setEtapa(e => (e + 1) as Etapa)
  }

  async function handleSalvarRascunho() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/solicitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rascunho: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Falha ao salvar rascunho.')
      showToast({ title: 'Rascunho salvo com sucesso', variant: 'success' })
      router.push('/solicitacoes')
    } catch (e: any) {
      setError(e?.message ?? 'Falha ao salvar rascunho.')
    } finally {
      setLoading(false)
    }
  }

  async function handleEnviar() {
    if (!canAdvanceStep1 || !canAdvanceStep2 || !form.cienteRiscos) {
      setShowStep1Errors(true)
      setShowStep2Errors(true)
      setShowStep3Errors(true)
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/solicitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rascunho: false }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Falha ao enviar solicitação.')
      showToast({ title: 'Solicitação enviada com sucesso', variant: 'success' })
      router.push(`/solicitacoes/${data.id}`)
    } catch (e: any) {
      setError(e?.message ?? 'Falha ao enviar solicitação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <PageBreadcrumb
        backHref="/solicitacoes"
        items={[
          { label: 'Solicitações', href: '/solicitacoes' },
          { label: 'Nova Solicitação' },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>
          Nova Solicitação de Desabilitação
        </h1>
      </div>

      <div className="mb-8 flex items-center gap-0">
        {ETAPAS.map((e, i) => (
          <div key={e.num} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center text-xs font-bold"
                style={{
                  borderRadius: '50%',
                  background: etapa >= e.num ? '#0038A8' : '#E2E8F0',
                  color: etapa >= e.num ? 'white' : '#94A3B8',
                }}
              >
                {etapa > e.num ? '✓' : e.num}
              </div>
              <span
                className="text-sm"
                style={{ color: etapa === e.num ? '#0038A8' : '#94A3B8', fontWeight: etapa === e.num ? 600 : 400 }}
              >
                {e.label}
              </span>
            </div>
            {i < ETAPAS.length - 1 && (
              <div className="mx-3 h-px w-12" style={{ background: etapa > e.num ? '#0038A8' : '#E2E8F0' }} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white border p-6" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
        {metaLoading && (
          <div className="mb-4 rounded bg-slate-50 px-3 py-2 text-sm" style={{ color: '#475569' }}>
            Carregando dados mestres para abertura...
          </div>
        )}
        {error && (
          <div className="mb-4 rounded bg-red-100 px-3 py-2 text-sm" style={{ color: '#B91C1C' }}>
            {error}
          </div>
        )}

        {etapa === 1 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold" style={{ color: '#0F172A' }}>
              Etapa 1 — Identificação
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Área *" icon="location_on" error={visibleStep1Error('areaId')}>
                <select
                  className={`field-input ${visibleStep1Error('areaId') ? 'field-input-error' : ''}`}
                  value={form.areaId}
                  onChange={e => {
                    const nextArea = e.target.value
                    setForm(prev => ({
                      ...prev,
                      areaId: nextArea,
                      equipamentoId: '',
                      equipamentoTag: '',
                    }))
                  }}
                  disabled={metaLoading}
                >
                  <option value="">Selecione a área</option>
                  {areas.map(area => (
                    <option key={area.id} value={area.id}>
                      {area.plantaNome} · {area.nome}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="TAG do Intertravamento *" icon="memory" error={visibleStep1Error('equipamentoId')}>
                <select
                  className={`field-input ${visibleStep1Error('equipamentoId') ? 'field-input-error' : ''}`}
                  value={form.equipamentoId}
                  onChange={e => handleSelectEquipamento(e.target.value)}
                  disabled={metaLoading || !form.areaId}
                >
                  <option value="">{form.areaId ? 'Selecione a TAG' : 'Selecione a área antes'}</option>
                  {equipamentosDaArea.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.tag} · {eq.descricao}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {selectedEquipamento && (
              <div className="grid grid-cols-1 gap-2 rounded border bg-slate-50 p-3 text-sm md:grid-cols-3" style={{ borderColor: '#E2E8F0', color: '#334155' }}>
                <InfoLine icon="badge" label="Nome" value={selectedEquipamento.descricao} />
                <InfoLine icon="place" label="Área" value={selectedEquipamento.areaNome} />
                <InfoLine icon="domain" label="Planta" value={selectedEquipamento.plantaNome} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Executante *"
                icon="engineering"
                error={visibleStep1Error('executanteId')}
                hint={
                  selectedArea && executantes.length === 0
                    ? 'Nenhum executante ativo encontrado. Rode o seed ou ajuste cadastro/perfis.'
                    : usingExecutanteFallback
                    ? 'Nenhum executante vinculado a esta área; exibindo executantes ativos da planta/contexto.'
                    : undefined
                }
              >
                <select
                  className={`field-input ${visibleStep1Error('executanteId') ? 'field-input-error' : ''}`}
                  value={form.executanteId}
                  onChange={e => set('executanteId', e.target.value)}
                  disabled={metaLoading || executantes.length === 0}
                >
                  <option value="">{executantesDaArea.length ? 'Selecione o executante' : 'Sem executantes disponíveis'}</option>
                  {executantesDaArea.map(executante => (
                    <option key={executante.id} value={executante.id}>
                      {executante.nome} ({executante.matricula})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Tipo de Intertravamento *" icon="category" error={visibleStep1Error('tipo')}>
                <select
                  className={`field-input ${visibleStep1Error('tipo') ? 'field-input-error' : ''}`}
                  value={form.tipo}
                  onChange={e => set('tipo', e.target.value)}
                >
                  <option value="">Selecione o tipo</option>
                  <option value="LOGICO">Lógico</option>
                  <option value="FISICO">Físico</option>
                  <option value="DISPOSITIVO_SEGURANCA">Dispositivo de Segurança</option>
                </select>
              </Field>
            </div>

            <Field label="Classe *" icon="warning" error={visibleStep1Error('classeNumero')}>
              <div className="flex gap-3">
                {classes.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => set('classeNumero', String(c.numero))}
                    className="flex-1 border py-2 text-sm font-medium transition-all"
                    style={{
                      borderRadius: '4px',
                      borderColor: form.classeNumero === String(c.numero) ? '#0038A8' : '#E2E8F0',
                      background: form.classeNumero === String(c.numero) ? '#EBF0FB' : 'white',
                      color: form.classeNumero === String(c.numero) ? '#0038A8' : '#6B7280',
                    }}
                  >
                    <div>Classe {c.numero}</div>
                    <div className="text-xs opacity-70">{PRAZO_MAX[String(c.numero)]}</div>
                  </button>
                ))}
              </div>
              {form.classeNumero && (
                <div className="mt-2 flex items-center gap-2">
                  <ClasseBadge classe={parseInt(form.classeNumero, 10) as ClasseNum} showPrazo />
                  <span className="text-xs" style={{ color: '#6B7280' }}>
                    prazo máximo selecionado
                  </span>
                </div>
              )}
            </Field>

            <Field
              label="Função do intertravamento *"
              icon="tune"
              error={visibleStep1Error('funcaoIntertravamento')}
              hint={selectedEquipamento?.funcaoSugerida ? `Sugerida pela TAG: ${selectedEquipamento.funcaoSugerida}` : undefined}
            >
              <select
                className={`field-input ${visibleStep1Error('funcaoIntertravamento') ? 'field-input-error' : ''}`}
                value={form.funcaoIntertravamento}
                onChange={e => set('funcaoIntertravamento', e.target.value)}
                disabled={funcoesDisponiveis.length === 0}
              >
                <option value="">
                  {funcoesDisponiveis.length === 0 ? 'Nenhuma função cadastrada' : 'Selecione a função'}
                </option>
                {funcoesDisponiveis.map(funcao => (
                  <option key={funcao} value={funcao}>
                    {funcao}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Motivo da desabilitação *" icon="description" error={visibleStep1Error('motivoDesabilitacao')}>
              <textarea
                className={`field-input ${visibleStep1Error('motivoDesabilitacao') ? 'field-input-error' : ''}`}
                rows={3}
                placeholder="Descreva o motivo da desabilitação..."
                value={form.motivoDesabilitacao}
                onChange={e => set('motivoDesabilitacao', e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Período início *" icon="event" error={visibleStep1Error('periodoInicio')}>
                <input
                  type="datetime-local"
                  className={`field-input ${visibleStep1Error('periodoInicio') ? 'field-input-error' : ''}`}
                  value={form.periodoInicio}
                  onChange={e => set('periodoInicio', e.target.value)}
                />
              </Field>
              <Field label="Período fim *" icon="event_available" error={visibleStep1Error('periodoFim')}>
                <input
                  type="datetime-local"
                  className={`field-input ${visibleStep1Error('periodoFim') ? 'field-input-error' : ''}`}
                  value={form.periodoFim}
                  onChange={e => set('periodoFim', e.target.value)}
                />
              </Field>
            </div>

            {durationDays != null && (
              <div className="rounded px-3 py-2 text-sm" style={{ background: '#EBF0FB', color: '#0038A8' }}>
                Duração prevista: {durationDays.toFixed(2)} dia(s)
              </div>
            )}
          </div>
        )}

        {etapa === 2 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold" style={{ color: '#0F172A' }}>
              Etapa 2 — Medidas Contingenciais
            </h2>
            <div
              className="rounded border px-4 py-3 text-sm"
              style={{ background: '#FEF9C3', color: '#92400E', borderColor: '#FDE68A' }}
            >
              <strong>Atenção:</strong> Descreva as medidas que garantirão a segurança durante o período de
              desabilitação.
            </div>
            <Field
              label="Medidas Preventivas / Contingenciais *"
              icon="health_and_safety"
              error={showStep2Errors ? step2Error : ''}
            >
              <textarea
                className={`field-input ${showStep2Errors && step2Error ? 'field-input-error' : ''}`}
                rows={6}
                placeholder="Exemplos:&#10;• Monitoramento manual periódico&#10;• Isolamento de área&#10;• Sinalização adicional&#10;• Procedimentos operacionais alternativos"
                value={form.medidasContingenciais}
                onChange={e => set('medidasContingenciais', e.target.value)}
                maxLength={1000}
              />
              <div className="mt-1 text-right text-xs" style={{ color: '#94A3B8' }}>
                {form.medidasContingenciais.length}/1000 caracteres
              </div>
            </Field>
          </div>
        )}

        {etapa === 3 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold" style={{ color: '#0F172A' }}>
              Etapa 3 — Revisão e Envio
            </h2>

            <div className="border divide-y" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
              <ResumoRow
                label="Área"
                value={selectedArea ? `${selectedArea.plantaNome} · ${selectedArea.nome}` : ''}
              />
              <ResumoRow label="TAG" value={form.equipamentoTag} />
              <ResumoRow label="Tipo" value={form.tipo} />
              <ResumoRow
                label="Classe"
                value={form.classeNumero ? `Classe ${form.classeNumero} (${PRAZO_MAX[form.classeNumero]})` : ''}
              />
              <ResumoRow
                label="Período"
                value={
                  form.periodoInicio && form.periodoFim
                    ? `${new Date(form.periodoInicio).toLocaleString('pt-BR')} → ${new Date(form.periodoFim).toLocaleString('pt-BR')}`
                    : ''
                }
              />
              <ResumoRow
                label="Executante"
                value={
                  executantes.find(e => e.id === form.executanteId)
                    ? `${executantes.find(e => e.id === form.executanteId)?.nome} (${executantes.find(e => e.id === form.executanteId)?.matricula})`
                    : ''
                }
              />
              <ResumoRow label="Motivo" value={form.motivoDesabilitacao} />
              <ResumoRow label="Medidas" value={form.medidasContingenciais} />
            </div>

            <div className="border p-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
              <h3 className="mb-1 text-sm font-semibold" style={{ color: '#0F172A' }}>
                Aprovadores que serão notificados
              </h3>
              <p className="text-xs" style={{ color: '#6B7280' }}>
                O fluxo será definido automaticamente pela alçada configurada para a Classe/Planta, com precedência
                sequencial.
              </p>
            </div>

            <div className="border p-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.cienteRiscos}
                  onChange={e => set('cienteRiscos', e.target.checked)}
                  className="mt-0.5"
                  style={{ accentColor: '#0038A8' }}
                />
                <span className="text-sm" style={{ color: '#374151' }}>
                  <strong>Declaro ciência dos riscos</strong> durante o período de desabilitação e assumo responsabilidade
                  como Responsável Operacional.
                </span>
              </label>
              {showStep3Errors && !form.cienteRiscos && (
                <p className="mt-2 text-xs font-medium" style={{ color: '#B91C1C' }}>
                  Marque a declaração de ciência para concluir o envio.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        className="sticky bottom-0 left-0 right-0 mt-4 border bg-white/95 backdrop-blur"
        style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex gap-2">
            {etapa > 1 ? (
              <button
                type="button"
                onClick={() => setEtapa(e => (e - 1) as Etapa)}
                className="border px-4 py-2 text-sm"
                style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}
              >
                Anterior
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/solicitacoes')}
                className="border px-4 py-2 text-sm"
                style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              onClick={handleSalvarRascunho}
              disabled={loading}
              className="border px-4 py-2 text-sm"
              style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}
            >
              Salvar rascunho
            </button>
          </div>
          {etapa < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#0038A8', borderRadius: '4px' }}
              disabled={metaLoading || loading}
            >
              Próximo
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEnviar}
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white"
              style={{
                background: '#0038A8',
                opacity: loading ? 0.8 : 1,
                borderRadius: '4px',
              }}
            >
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
          border-radius: 4px;
          font-size: 14px;
          color: #0F172A;
          outline: none;
          transition: border-color 0.15s;
          background: white;
          font-family: inherit;
        }
        .field-input:focus {
          border-color: #0038A8;
        }
        .field-input-error {
          border-color: #DC2626;
        }
        .field-input-error:focus {
          border-color: #B91C1C;
        }
        select.field-input {
          appearance: auto;
        }
      `}</style>
    </div>
  )
}

function Field({
  label,
  icon,
  error,
  hint,
  children,
}: {
  label: string
  icon?: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium" style={{ color: '#374151' }}>
        {icon && (
          <span className="material-symbols-outlined text-base" aria-hidden>
            {icon}
          </span>
        )}
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs" style={{ color: '#64748B' }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-1 text-xs font-medium" style={{ color: '#B91C1C' }}>
          {error}
        </p>
      )}
    </div>
  )
}

function InfoLine({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="material-symbols-outlined text-base" aria-hidden>
        {icon}
      </span>
      <div>
        <p className="text-[11px] uppercase tracking-wide" style={{ color: '#64748B' }}>
          {label}
        </p>
        <p className="text-sm font-medium" style={{ color: '#0F172A' }}>
          {value || '—'}
        </p>
      </div>
    </div>
  )
}

function ResumoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <span className="w-24 shrink-0 text-xs font-medium" style={{ color: '#6B7280' }}>
        {label}
      </span>
      <span className="text-sm" style={{ color: '#0F172A' }}>
        {value || '—'}
      </span>
    </div>
  )
}
