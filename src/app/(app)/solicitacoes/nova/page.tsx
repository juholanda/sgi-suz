'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import { ClasseNum } from '@/lib/tokens'

type Etapa = 1 | 2 | 3

interface FormData {
  areaId: string
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
  const [etapa, setEtapa] = useState<Etapa>(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormData>({
    areaId: '', equipamentoTag: '', executanteId: '', tipo: '', classeNumero: '',
    funcaoIntertravamento: '', motivoDesabilitacao: '', periodoInicio: '', periodoFim: '',
    medidasContingenciais: '', cienteRiscos: false,
  })

  function set(field: keyof FormData, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSalvarRascunho() {
    setLoading(true)
    try {
      await fetch('/api/solicitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rascunho: true }),
      })
      router.push('/solicitacoes')
    } finally {
      setLoading(false)
    }
  }

  async function handleEnviar() {
    setLoading(true)
    try {
      const res = await fetch('/api/solicitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rascunho: false }),
      })
      const data = await res.json()
      router.push(`/solicitacoes/${data.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl">
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

        {/* ETAPA 1 */}
        {etapa === 1 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold" style={{ color: '#0F172A' }}>Etapa 1 — Identificação</h2>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Área *">
                <input
                  className="field-input"
                  placeholder="Selecione a área"
                  value={form.areaId}
                  onChange={e => set('areaId', e.target.value)}
                />
              </Field>
              <Field label="TAG do Intertravamento *">
                <input
                  className="field-input"
                  placeholder="Digite ou busque a TAG"
                  value={form.equipamentoTag}
                  onChange={e => set('equipamentoTag', e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Executante *">
                <input
                  className="field-input"
                  placeholder="Nome do executante"
                  value={form.executanteId}
                  onChange={e => set('executanteId', e.target.value)}
                />
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
                {([1, 2, 3, 4] as ClasseNum[]).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('classeNumero', String(c))}
                    className="flex-1 py-2 text-sm font-medium border transition-all"
                    style={{
                      borderRadius: '4px',
                      borderColor: form.classeNumero === String(c) ? '#0038A8' : '#E2E8F0',
                      background: form.classeNumero === String(c) ? '#EBF0FB' : 'white',
                      color: form.classeNumero === String(c) ? '#0038A8' : '#6B7280',
                    }}
                  >
                    <div>Classe {c}</div>
                    <div className="text-xs opacity-70">{PRAZO_MAX[String(c)]}</div>
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
                Duração prevista: {Math.ceil((new Date(form.periodoFim).getTime() - new Date(form.periodoInicio).getTime()) / 86400000)} dia(s)
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
              <ResumoRow label="TAG" value={form.equipamentoTag} />
              <ResumoRow label="Tipo" value={form.tipo} />
              <ResumoRow label="Classe" value={form.classeNumero ? `Classe ${form.classeNumero} (${PRAZO_MAX[form.classeNumero]})` : ''} />
              <ResumoRow label="Período" value={form.periodoInicio && form.periodoFim ? `${new Date(form.periodoInicio).toLocaleString('pt-BR')} → ${new Date(form.periodoFim).toLocaleString('pt-BR')}` : ''} />
              <ResumoRow label="Motivo" value={form.motivoDesabilitacao} />
              <ResumoRow label="Medidas" value={form.medidasContingenciais} />
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

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-5 border-t" style={{ borderColor: '#E2E8F0' }}>
          <div className="flex gap-2">
            {etapa > 1 && (
              <button
                type="button"
                onClick={() => setEtapa(e => (e - 1) as Etapa)}
                className="px-4 py-2 text-sm border"
                style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}
              >
                ← Anterior
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
              onClick={() => setEtapa(e => (e + 1) as Etapa)}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#0038A8', borderRadius: '4px' }}
            >
              Próximo: {ETAPAS[etapa].label} →
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
