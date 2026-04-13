import { prisma } from '@/lib/db'
import { tokens, ClasseNum } from '@/lib/tokens'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'

async function getAlcadas() {
  return prisma.alcadaAprovacao.findMany({
    include: {
      planta: true,
      classe: true,
      user: { select: { nome: true, matricula: true } },
    },
    orderBy: [{ plantaId: 'asc' }, { classeId: 'asc' }, { nivel: 'asc' }],
  })
}

async function getPlantasComClasses() {
  const plantas = await prisma.planta.findMany({ where: { ativa: true } })
  const classes = await prisma.classe.findMany({ orderBy: { numero: 'asc' } })
  return { plantas, classes }
}

export default async function AlcadasPage() {
  const [alcadas, { plantas, classes }] = await Promise.all([getAlcadas(), getPlantasComClasses()])

  // Group by planta + classe
  const grouped: Record<string, { planta: string; classe: typeof classes[0]; niveis: typeof alcadas }> = {}
  for (const a of alcadas) {
    const key = `${a.plantaId}__${a.classeId}`
    if (!grouped[key]) {
      grouped[key] = { planta: a.planta.nome, classe: a.classe, niveis: [] }
    }
    grouped[key].niveis.push(a)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Alçadas de aprovação</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Backoffice · Configuração por Planta × Classe</p>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-white" style={{ background: '#0038A8', borderRadius: '4px' }}>
          + Configurar Alçada
        </button>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white border text-center py-12" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
          <p className="text-sm mb-2" style={{ color: '#94A3B8' }}>Nenhuma alçada configurada.</p>
          <p className="text-xs" style={{ color: '#94A3B8' }}>Configure as alçadas para que as aprovações funcionem corretamente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(grouped).map((g, i) => {
            const colors = tokens.colors.classe[g.classe.numero as ClasseNum]
            return (
              <div key={i} className="bg-white border p-5" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
                <div className="flex items-center gap-3 mb-4">
                  <ClasseBadge classe={g.classe.numero as ClasseNum} showPrazo />
                  <span className="text-sm" style={{ color: '#475569' }}>em</span>
                  <span className="text-sm font-medium" style={{ color: '#0F172A' }}>{g.planta}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {g.niveis.sort((a, b) => a.nivel - b.nivel).map(n => (
                    <div
                      key={n.id}
                      className="flex items-center gap-2 px-3 py-2 border"
                      style={{ borderColor: colors.border, background: colors.bg, borderRadius: '4px' }}
                    >
                      <span className="text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full" style={{ background: colors.badge, color: 'white' }}>
                        {n.nivel}
                      </span>
                      <div>
                        <div className="text-xs font-medium" style={{ color: colors.text }}>{n.user.nome}</div>
                        <div className="text-xs font-mono" style={{ color: colors.text, opacity: 0.7 }}>{n.user.matricula}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
