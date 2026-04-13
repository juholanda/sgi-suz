import { prisma } from '@/lib/db'
import { tokens } from '@/lib/tokens'

async function getClasses() {
  return prisma.classe.findMany({ orderBy: { numero: 'asc' } })
}

const CLASSE_APROVADORES: Record<number, string> = {
  1: 'Especialista Operação + Especialista Manutenção',
  2: 'Coord. Área + Coord. Manutenção',
  3: 'Gerente Área + Coord. Manutenção + Coord. Área',
  4: 'Gerente Industrial + Gerente Manutenção + Gerente Área',
  5: 'NÃO FORÇÁVEL',
}

export default async function ClassesPage() {
  const classes = await getClasses()

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Classes de risco</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Backoffice · Prazos e alçadas por classe</p>
        </div>
      </div>

      <div className="grid gap-4">
        {classes.map(c => {
          const colors = tokens.colors.classe[c.numero as 1|2|3|4|5]
          return (
            <div key={c.id} className="bg-white border p-5" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {/* Classe badge */}
                  <div
                    className="w-14 h-14 flex items-center justify-center text-lg font-bold flex-shrink-0"
                    style={{ background: colors.bg, color: colors.text, border: `2px solid ${colors.border}`, borderRadius: '4px' }}
                  >
                    {c.numero}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: '#0F172A' }}>Classe {c.numero} — {c.descricao}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs" style={{ color: '#6B7280' }}>
                        Prazo máximo:{' '}
                        <strong style={{ color: colors.text }}>
                          {c.prazoMaximoDias ? `${c.prazoMaximoDias} dia(s)` : 'NÃO FORÇÁVEL'}
                        </strong>
                      </span>
                      <span className="text-xs" style={{ color: '#6B7280' }}>
                        Aprovadores: {CLASSE_APROVADORES[c.numero]}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: '#6B7280' }}>Cor:</span>
                    <div
                      className="w-6 h-6 border"
                      style={{ background: colors.badge, borderRadius: '4px', borderColor: '#E2E8F0' }}
                      title={colors.badge}
                    />
                  </div>
                  <button className="text-xs px-3 py-1.5 border" style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}>
                    Editar prazo
                  </button>
                </div>
              </div>

              {c.numero === 5 && (
                <div className="mt-3 px-3 py-2 text-xs" style={{ background: '#3F0000', color: '#FCA5A5', borderRadius: '4px' }}>
                  ⛔ Classe 5: Intertravamento NÃO FORÇÁVEL. Não é possível criar solicitação de desabilitação para esta classe.
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
