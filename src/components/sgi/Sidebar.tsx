'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'

interface NavItem {
  href: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Início', icon: '⌂' },
  { href: '/solicitacoes', label: 'Solicitações', icon: '☰' },
  { href: '/relatorios', label: 'Métricas', icon: '◔' },
  { href: '/perfil', label: 'Perfil', icon: '◉' },
]

const adminLink: NavItem = { href: '/admin', label: 'Backoffice', icon: '⚙' }

interface Props {
  user: {
    name?: string | null
    email?: string | null
    perfis?: string[]
    plantas?: Array<{ id: string; nome: string }>
    plantaAtivaNome?: string
    perfilAtivoNome?: string
  }
}

export default function Sidebar({ user }: Props) {
  const pathname = usePathname()
  const isNonProd = process.env.NODE_ENV !== 'production'
  const perfis = user.perfis ?? []
  const plantas = user.plantas ?? []
  const canAccessBackoffice = perfis.includes('ADMINISTRADOR')
  const initialPlantaId =
    plantas.find(planta => planta.nome === user.plantaAtivaNome)?.id ??
    plantas[0]?.id ??
    'planta-default'
  const [activePlantaId, setActivePlantaId] = useState(initialPlantaId)
  const [activePerfil, setActivePerfil] = useState(user.perfilAtivoNome ?? perfis[0] ?? 'SOLICITANTE')
  const [savingContext, setSavingContext] = useState(false)

  const perfilOptions = perfis.length > 0 ? perfis : ['SOLICITANTE']
  const plantaOptions = plantas.length > 0 ? plantas : [{ id: 'planta-default', nome: 'Planta 1' }]

  async function updateContext(input: { perfil?: string; plantaId?: string }) {
    setSavingContext(true)
    try {
      const response = await fetch('/api/contexto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!response.ok) {
        throw new Error('Falha ao atualizar contexto ativo.')
      }
      window.location.reload()
    } catch (err) {
      console.error(err)
      alert('Não foi possível atualizar o contexto ativo. Tente novamente.')
    } finally {
      setSavingContext(false)
    }
  }

  return (
    <aside
      className="w-60 flex flex-col shrink-0"
      style={{ background: '#0038A8', minHeight: '100vh' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center text-sm font-bold"
            style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px', color: 'white' }}
          >
            S
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">SGI</div>
            <div className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Suzano
            </div>
          </div>
        </div>
      </div>

      {/* Context switchers */}
      <div className="px-4 py-4 border-b space-y-2" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
        <div>
          <label className="block text-[11px] mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Planta ativa
          </label>
          <select
            className="w-full text-left text-xs px-3 py-2"
            value={activePlantaId}
            onChange={e => {
              const nextPlantaId = e.target.value
              setActivePlantaId(nextPlantaId)
              void updateContext({ plantaId: nextPlantaId })
            }}
            disabled={savingContext}
            style={{
              background: 'rgba(255,255,255,0.12)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              width: '100%',
            }}
          >
            {plantaOptions.map(planta => (
              <option key={planta.id} value={planta.id} style={{ color: '#0F172A' }}>
                {planta.nome}
              </option>
            ))}
          </select>
        </div>
        {isNonProd && (
          <div>
            <label className="block text-[11px] mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Perfil ativo
            </label>
            <select
              className="w-full text-left text-xs px-3 py-2"
              value={activePerfil}
              onChange={e => {
                const nextPerfil = e.target.value
                setActivePerfil(nextPerfil)
                void updateContext({ perfil: nextPerfil })
              }}
              disabled={savingContext}
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                width: '100%',
              }}
            >
              {perfilOptions.map(perfil => (
                <option key={perfil} value={perfil} style={{ color: '#0F172A' }}>
                  {perfil}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(item => {
          const active =
            item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors"
              style={{
                borderRadius: '4px',
                color: active ? 'white' : 'rgba(255,255,255,0.7)',
                background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                fontWeight: active ? 500 : 400,
              }}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}

        <div className="pt-3 mt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          {canAccessBackoffice ? (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 text-sm transition-colors"
              style={{
                borderRadius: '4px',
                color: pathname.startsWith('/admin') ? 'white' : 'rgba(255,255,255,0.7)',
                background: pathname.startsWith('/admin') ? 'rgba(255,255,255,0.15)' : 'transparent',
                fontWeight: pathname.startsWith('/admin') ? 500 : 400,
              }}
            >
              <span className="text-base w-5 text-center">{adminLink.icon}</span>
              {adminLink.label}
            </Link>
          ) : null}
        </div>
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-white"
            style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}
          >
            {user.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user.name}</div>
            <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {user.email}
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-xs py-1.5 text-center transition-colors"
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.7)',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Sair
        </button>
      </div>
    </aside>
  )
}
