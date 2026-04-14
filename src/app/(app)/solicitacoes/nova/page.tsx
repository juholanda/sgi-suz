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
  tipoSugerido: string | null
  funcaoSugerida: string | null
  classeSugerida: number | null
}

interface MetaExecutante {
  id: string
  nome: string
  matricula: string
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
  '1': '7 dias', '2': '5 dias', '3': '3 dias', '4': '1 dia', '5': 'NÃO FORÇÁVEL',
}

export default function NovaSolicitacaoPage() {
  const router = useRouter()
  const { showToast } = useAppToast()
  const [etapa, setEtapa] = useState<Etapa>(1)
  const [loading, setLoading] = useState(false)
  const [metaLoading, setMetaLoading] = useState(true)
  const [areas, setAreas] = useState<MetaArea[]>([])
  const [equipamentos, setEquipamentos] = useState<MetaEquipamento[]>([])
  const [executantes, setExecutantes] = useState<MetaExecutante[]>([])
  const [classes, setClasses] = useState<MetaClasse[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormData>({
    areaId: '', equipamentoId: '', equipamentoTag: '', executanteId: '', tipo: '', classeNumero: '',
    funcaoIntertravamento: '', motivoDesabilitacao: '', periodoInicio: '', periodoFim: '',
    medidasContingenciais: '', cienteRiscos: false,
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
        setExecutantes(data.executantes ?? [])
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

  const equipamentosDaArea = useMemo(
    () => equipamentos.filter(eq => !form.areaId || eq.areaId === form.areaId),
    [equipamentos, form.areaId],
  )

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

  const canAdvanceStep1 =
    !!form.areaId &&
    !!form.equipamentoTag &&
    !!form.executanteId &&
    !!form.tipo &&
    !!form.classeNumero &&
    !!form.funcaoIntertravamento &&
    !!form.motivoDesabilitacao.trim() &&
    !!form.periodoInicio &&
    !!form.periodoFim &&
    durationDays != null &&
    !exceedsSla

  const canAdvanceStep2 = !!form.medidasContingenciais.trim()

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
      equipamentoId: eq.id,
      equipamentoTag: eq.tag,
      tipo: eq.tipoSugerido ?? prev.tipo,
      classeNumero: eq.classeSugerida ? String(eq.classeSugerida) : prev.classeNumero,
      funcaoIntertravamento: eq.funcaoSugerida ?? prev.funcaoIntertravamento,
    }))
  }

  function nextStep() {
    if (etapa === 1 && !canAdvanceStep1) {
      setError('Preencha os campos obrigatórios da Etapa 1 e corrija o período/SLA.')
      return
    }
    if (etapa === 2 && !canAdvanceStep2) {
      setError('Informe as medidas preventivas/contingenciais para avançar.')
      return
    }
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
    if (!form.cienteRiscos) {
      setError('Marque a declaração de ciência para enviar.')
      return
    }
    if (!canAdvanceStep1 || !canAdvanceStep2) {
      setError('Há campos obrigatórios pendentes antes do envio.')
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
      {/* Header */}
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

      {/* Card */}
      <div className="bg-white border p-6" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
        {metaLoading && (
          <div className="mb-4 px-3 py-2 text-sm" style={{ background: '#F8FAFC', color: '#475569', borderRadius: '4px' }}>
            Carregando dados mestres para abertura...
          </div>
        )}
        {error && (
          <div className="mb-4 px-3 py-2 text-sm" style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {/* ETAPA 1 */}
        {etapa === 1 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold" style={{ color: '#0F172A' }}>Etapa 1 — Identificação</h2>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Área *">
                <select
                  className="field-input"
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
              <Field label="TAG do Intertravamento *">
                <select
                  className="field-input"
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

            <div className="grid grid-cols-2 gap-4">
              <Field label="Executante *">
                <select
                  className="field-input"
                  value={form.executanteId}
                  onChange={e => set('executanteId', e.target.value)}
                  disabled={metaLoading}
                >
                  <option value="">Selecione o executante</option>
                  {executantes.map(executante => (
                    <option key={executante.id} value={executante.id}>
                      {executante.nome} ({executante.matricula})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tipo de Intertravamento *">
                <select className="field-input" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                  <option value="">Selecione o tipo</option>
                  <option value="LOGICO">Lógico</option>
                  <option value="FISICO">Físico</option>
                  <option value="DISPOSITIVO_SEGURANCA">Dispositivo de Segurança</option>
                </select>
              </Field>
            </div>

            <Field label="Classe *">
              <div className="flex gap-3">
                {classes.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => set('classeNumero', String(c.numero))}
                    className="flex-1 py-2 text-sm font-medium border transition-all"
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
                  <ClasseBadge classe={parseInt(form.classeNumero) as ClasseNum} showPrazo />
                  <span className="text-xs" style={{ color: '#6B7280' }}>prazo máximo selecionado</span>
                </div>
              )}
            </Field>

            <Field label="Função do intertravamento *">
              <input
                className="field-input"
                placeholder="Descreva a função de proteção"
                value={form.funcaoIntertravamento}
                onChange={e => set('funcaoIntertravamento', e.target.value)}
              />
            </Field>

            <Field label="Motivo da desabilitação *">
              <textarea
                className="field-input"
                rows={3}
                placeholder="Descreva o motivo da desabilitação..."
                value={form.motivoDesabilitacao}
                onChange={e => set('motivoDesabilitacao', e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Período início *">
                <input type="datetime-local" className="field-input" value={form.periodoInicio} onChange={e => set('periodoInicio', e.target.value)} />
              </Field>
              <Field label="Período fim *">
                <input type="datetime-local" className="field-input" value={form.periodoFim} onChange={e => set('periodoFim', e.target.value)} />
              </Field>
            </div>

            {form.periodoInicio && form.periodoFim && new Date(form.periodoFim) > new Date(form.periodoInicio) && (
              <div className="px-3 py-2 text-sm" style={{ background: '#EBF0FB', color: '#0038A8', borderRadius: '4px' }}>
                Duração prevista: {durationDays?.toFixed(2)} dia(s)
              </div>
            )}
            {exceedsSla && (
              <div className="px-3 py-2 text-sm" style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px' }}>
                Período previsto excede o prazo máximo da Classe selecionada.
              </div>
            )}
          </div>
        )}

        {/* ETAPA 2 */}
        {etapa === 2 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold" style={{ color: '#0F172A' }}>Etapa 2 — Medidas Contingenciais</h2>
            <div className="px-4 py-3 text-sm" style={{ background: '#FEF9C3', color: '#92400E', borderRadius: '4px', border: '1px solid #FDE68A' }}>
              <strong>Atenção:</strong> Descreva as medidas que garantirão a segurança durante o período de desabilitação.
            </div>
            <Field label="Medidas Preventivas / Contingenciais *">
              <textarea
                className="field-input"
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
          </div>
        )}

        {/* ETAPA 3 */}
        {etapa === 3 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold" style={{ color: '#0F172A' }}>Etapa 3 — Revisão e Envio</h2>

            {/* Resumo */}
            <div className="border divide-y" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
              <ResumoRow
                label="Área"
                value={areas.find(a => a.id === form.areaId) ? `${areas.find(a => a.id === form.areaId)?.plantaNome} · ${areas.find(a => a.id === form.areaId)?.nome}` : ''}
              />
              <ResumoRow label="TAG" value={form.equipamentoTag} />
              <ResumoRow label="Tipo" value={form.tipo} />
              <ResumoRow label="Classe" value={form.classeNumero ? `Classe ${form.classeNumero} (${PRAZO_MAX[form.classeNumero]})` : ''} />
              <ResumoRow label="Período" value={form.periodoInicio && form.periodoFim ? `${new Date(form.periodoInicio).toLocaleString('pt-BR')} → ${new Date(form.periodoFim).toLocaleString('pt-BR')}` : ''} />
              <ResumoRow
                label="Executante"
                value={executantes.find(e => e.id === form.executanteId) ? `${executantes.find(e => e.id === form.executanteId)?.nome} (${executantes.find(e => e.id === form.executanteId)?.matricula})` : ''}
              />
              <ResumoRow label="Motivo" value={form.motivoDesabilitacao} />
              <ResumoRow label="Medidas" value={form.medidasContingenciais} />
            </div>

            <div className="border p-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#0F172A' }}>Aprovadores que serão notificados</h3>
              <p className="text-xs" style={{ color: '#6B7280' }}>
                O fluxo será definido automaticamente pela alçada configurada para a Classe/Planta, com precedência sequencial.
              </p>
            </div>

            {/* Ciência */}
            <div className="border p-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.cienteRiscos}
                  onChange={e => set('cienteRiscos', e.target.checked)}
                  className="mt-0.5"
                  style={{ accentColor: '#0038A8' }}
                />
                <span className="text-sm" style={{ color: '#374151' }}>
                  <strong>Declaro ciência dos riscos</strong> durante o período de desabilitação e assumo responsabilidade como Responsável Operacional.
                </span>
              </label>
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
                className="px-4 py-2 text-sm border"
                style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}
              >
                Anterior
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/solicitacoes')}
                className="px-4 py-2 text-sm border"
                style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              onClick={handleSalvarRascunho}
              disabled={loading}
              className="px-4 py-2 text-sm border"
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
              disabled={!form.cienteRiscos || loading}
              className="px-5 py-2 text-sm font-medium text-white"
              style={{
                background: form.cienteRiscos ? '#0038A8' : '#94A3B8',
                borderRadius: '4px',
                cursor: form.cienteRiscos ? 'pointer' : 'not-allowed',
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
        .field-input:focus { border-color: #0038A8; }
        select.field-input { appearance: auto; }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>{label}</label>
      {children}
    </div>
  )
}

function ResumoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <span className="text-xs font-medium w-24 shrink-0" style={{ color: '#6B7280' }}>{label}</span>
      <span className="text-sm" style={{ color: '#0F172A' }}>{value || '—'}</span>
    </div>
  )
}
