import Link from 'next/link'

const relatorios = [
  { href: '/relatorios/violacao-sla',           label: 'Prazo Excedido',               desc: 'Solicitações que excederam o prazo máximo. Uso: Compliance, Segurança do Processo.', icon: '⚠' },
  { href: '/relatorios/execucao-reabilitacao',  label: 'Execução e Reabilitação',       desc: 'Tempos, checklists cumpridos, disciplina operacional.',                   icon: '⚙' },
  { href: '/relatorios/auditoria',              label: 'Auditoria End-to-End',           desc: 'Linha do tempo completa. "Documento ouro" para auditorias formais.',       icon: '📋' },
]

export default function RelatoriosPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Relatórios</h1>
        <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Análises e exportações do SGI</p>
      </div>
      <div className="space-y-3">
        {relatorios.map(r => (
          <Link key={r.href} href={r.href}>
            <div className="bg-white border p-5 hover:shadow-sm transition-shadow flex items-start gap-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
              <span className="text-2xl">{r.icon}</span>
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: '#0038A8' }}>{r.label}</h3>
                <p className="text-xs" style={{ color: '#475569' }}>{r.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
