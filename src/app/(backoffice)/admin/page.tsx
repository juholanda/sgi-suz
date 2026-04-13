import Link from 'next/link'

const modules = [
  { href: '/admin/plantas',     label: 'Plantas / Unidades',     desc: 'Estrutura organizacional base do sistema',          icon: '🏭' },
  { href: '/admin/areas',       label: 'Áreas Operacionais',     desc: 'Vinculadas às plantas — escopos de solicitação',     icon: '📍' },
  { href: '/admin/equipamentos',label: 'Equipamentos / TAGs',    desc: 'Intertravamentos cadastrados, importação em massa',   icon: '⚙' },
  { href: '/admin/classes',     label: 'Classes de Risco',       desc: 'Prazos máximos e alçadas por classe (1–5)',          icon: '🔴' },
  { href: '/admin/alcadas',     label: 'Alçadas de Aprovação',  desc: 'Aprovadores por Planta × Classe × Nível',            icon: '✓' },
  { href: '/admin/usuarios',    label: 'Usuários e Perfis',      desc: 'Associação Usuário × Perfil × Planta/Área',          icon: '👤' },
  { href: '/admin/delegacoes',  label: 'Suplências / Delegações','desc': 'Vigência automática de aprovações por férias',     icon: '↔' },
]

export default function AdminHomePage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>SGI Backoffice</h1>
        <p className="text-sm mt-1" style={{ color: '#475569' }}>
          Configure os dados mestres que alimentam o sistema operacional. Alterações aqui refletem imediatamente no frontoffice.
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {modules.map(m => (
          <Link key={m.href} href={m.href}>
            <div
              className="bg-white border p-5 hover:shadow-md transition-all cursor-pointer group"
              style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{m.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold group-hover:text-blue-700 transition-colors" style={{ color: '#0038A8' }}>
                    {m.label}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{m.desc}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-4 border" style={{ borderColor: '#FDE68A', background: '#FEF9C3', borderRadius: '4px' }}>
        <p className="text-sm font-medium" style={{ color: '#92400E' }}>⚠ Área restrita</p>
        <p className="text-xs mt-1" style={{ color: '#B45309' }}>
          Apenas administradores têm acesso ao backoffice. Alterações nos dados mestres impactam diretamente o fluxo operacional.
        </p>
      </div>
    </div>
  )
}
