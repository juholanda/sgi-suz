import Link from 'next/link'

const modules = [
  { href: '/admin/plantas',      label: 'Plantas / Unidades',    desc: 'Estrutura organizacional base do sistema',         icon: 'factory' },
  { href: '/admin/areas',        label: 'Áreas Operacionais',    desc: 'Vinculadas às plantas — escopos de solicitação',   icon: 'location_on' },
  { href: '/admin/equipamentos', label: 'Equipamentos / TAGs',   desc: 'Intertravamentos cadastrados, importação em massa', icon: 'settings' },
  { href: '/admin/classes',      label: 'Classes de Risco',      desc: 'Prazos máximos e alçadas por classe (1–5)',         icon: 'warning' },
  { href: '/admin/alcadas',      label: 'Alçadas de Aprovação',  desc: 'Aprovadores por Planta × Classe × Nível',          icon: 'account_tree' },
  { href: '/admin/usuarios',     label: 'Usuários e Perfis',     desc: 'Associação Usuário × Perfil × Planta/Área',        icon: 'manage_accounts' },
  { href: '/admin/delegacoes',   label: 'Suplências / Delegações', desc: 'Vigência automática de aprovações por férias',   icon: 'swap_horiz' },
]

function Icon({ name, size = 22 }: { name: string; size?: number }) {
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
          <Link key={m.href} href={m.href} style={{ textDecoration: 'none' }}>
            <div
              className="bg-white border p-5 hover:shadow-md transition-all cursor-pointer group"
              style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: '#EBF0FB', color: '#0038A8',
                  }}
                >
                  <Icon name={m.icon} size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: '#0038A8' }}>
                    {m.label}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{m.desc}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-4 flex items-start gap-3" style={{ background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: '8px' }}>
        <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18, color: '#92400E', marginTop: 1 }}>lock</span>
        <div>
          <p className="text-sm font-medium" style={{ color: '#92400E' }}>Área restrita</p>
          <p className="text-xs mt-0.5" style={{ color: '#B45309' }}>
            Apenas administradores têm acesso ao backoffice. Alterações nos dados mestres impactam diretamente o fluxo operacional.
          </p>
        </div>
      </div>
    </div>
  )
}
