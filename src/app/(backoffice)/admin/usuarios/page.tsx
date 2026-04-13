import { prisma } from '@/lib/db'

const PERFIL_LABELS: Record<string, string> = {
  SOLICITANTE: 'Solicitante',
  EXECUTANTE: 'Executante',
  APROVADOR: 'Aprovador',
  GESTOR_SMS: 'Gestor SMS',
  ADMINISTRADOR: 'Administrador',
}

const PERFIL_COLORS: Record<string, { bg: string; text: string }> = {
  SOLICITANTE:   { bg: '#DBEAFE', text: '#1D4ED8' },
  EXECUTANTE:    { bg: '#DCFCE7', text: '#15803D' },
  APROVADOR:     { bg: '#FEF3C7', text: '#B45309' },
  GESTOR_SMS:    { bg: '#FEE2E2', text: '#B91C1C' },
  ADMINISTRADOR: { bg: '#F3E8FF', text: '#7E22CE' },
}

async function getUsuarios() {
  return prisma.user.findMany({
    include: { perfis: { include: { planta: true, area: true } } },
    orderBy: { nome: 'asc' },
  })
}

export default async function UsuariosPage() {
  const usuarios = await getUsuarios()

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Usuários e Perfis</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Backoffice · Associação Usuário × Perfil × Planta/Área</p>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-white" style={{ background: '#0038A8', borderRadius: '4px' }}>
          + Novo Usuário
        </button>
      </div>

      <div className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Matrícula', 'Nome', 'E-mail', 'Perfis / Escopo', 'Status', 'Ações'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-sm" style={{ color: '#94A3B8' }}>Nenhum usuário cadastrado</td></tr>
            ) : usuarios.map(u => (
              <tr key={u.id} className="border-t" style={{ borderColor: '#F1F5F9' }}>
                <td className="px-4 py-3 text-sm font-mono font-medium" style={{ color: '#0038A8' }}>{u.matricula}</td>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: '#0F172A' }}>{u.nome}</td>
                <td className="px-4 py-3 text-xs" style={{ color: '#475569' }}>{u.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.perfis.map(p => {
                      const colors = PERFIL_COLORS[p.perfil] ?? { bg: '#F1F5F9', text: '#475569' }
                      return (
                        <span
                          key={p.id}
                          className="text-xs px-2 py-0.5 font-medium"
                          style={{ background: colors.bg, color: colors.text, borderRadius: '4px' }}
                          title={`${p.planta?.nome ?? 'Global'}${p.area ? ` › ${p.area.nome}` : ''}`}
                        >
                          {PERFIL_LABELS[p.perfil]}
                          {p.planta && <span style={{ opacity: 0.7 }}> · {p.planta.nome}</span>}
                        </span>
                      )
                    })}
                    {u.perfis.length === 0 && <span className="text-xs" style={{ color: '#94A3B8' }}>Sem perfil</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 font-medium" style={{ borderRadius: '4px', background: u.ativo ? '#D1FAE5' : '#F1F5F9', color: u.ativo ? '#065F46' : '#64748B' }}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button className="text-xs" style={{ color: '#0038A8' }}>Editar</button>
                  <button className="text-xs" style={{ color: '#6B7280' }}>Perfis</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
