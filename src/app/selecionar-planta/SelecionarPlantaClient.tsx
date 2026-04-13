'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signOut } from 'next-auth/react'

const PERFIL_LABELS: Record<string, string> = {
  SOLICITANTE:   'Solicitante',
  EXECUTANTE:    'Executante',
  APROVADOR:     'Aprovador',
  GESTOR_SMS:    'Gestor SMS',
  ADMINISTRADOR: 'Administrador',
}

const PERFIL_ICONS: Record<string, string> = {
  SOLICITANTE:   'person',
  EXECUTANTE:    'engineering',
  APROVADOR:     'task_alt',
  GESTOR_SMS:    'security',
  ADMINISTRADOR: 'admin_panel_settings',
}

interface PlantaOption {
  id: string
  nome: string
  perfis: string[]
}

interface Props {
  plantas: PlantaOption[]
  userName: string
  userEmail: string
  userMatricula: string
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
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

export default function SelecionarPlantaClient({ plantas, userName, userEmail, userMatricula }: Props) {
  const router = useRouter()
  const [selecting, setSelecting] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  function handleSelect(plantaId: string, perfis: string[]) {
    setSelecting(plantaId)
    localStorage.setItem('sgi_demo_planta', plantaId)
    document.cookie = `sgi_planta_ativa=${plantaId};path=/;max-age=86400`
    // Reset perfil ativo para o primeiro perfil válido desta planta
    // Evita que cookie de perfil de outra planta (ex: APROVADOR em Aracruz)
    // apareça ao entrar em uma planta onde o usuário só é Solicitante/Executante
    const firstPerfil = Array.from(new Set(perfis))[0]
    if (firstPerfil) {
      localStorage.setItem('sgi_demo_perfil', firstPerfil)
      document.cookie = `sgi_perfil_ativo=${firstPerfil};path=/;max-age=86400`
    }
    router.push('/dashboard')
  }

  async function handleSignOut() {
    setSigningOut(true)
    await signOut({ callbackUrl: '/login' })
  }

  // ── Painel da imagem (desktop) ─────────────────────────────────────────────
  const imagePanel = (
    <div className="relative" style={{ height: '100%' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80&fit=crop"
        alt="Fábrica de celulose"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.7)' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(0,56,168,0.55) 0%, rgba(0,10,40,0.65) 100%)' }}
      />
      <div className="relative h-full flex flex-col justify-end p-12">
        <h2
          className="mb-3"
          style={{ color: '#FFFFFF', lineHeight: 1.2, fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)' }}
        >
          Gestão segura de<br />intertravamentos
        </h2>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '380px', lineHeight: 1.6 }}>
          Controle, rastreabilidade e conformidade em cada etapa do processo de desabilitação de instrumentos de segurança.
        </p>
        <div className="flex items-center gap-4">
          {[
            { icon: 'verified_user', label: 'Conformidade SMS' },
            { icon: 'history', label: 'Rastreabilidade' },
            { icon: 'speed', label: 'Agilidade operacional' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{item.icon}</span>
              <span className="text-xs" style={{ fontWeight: 400 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Conteúdo do formulário ─────────────────────────────────────────────────
  const formContent = (
    <div className="w-full" style={{ maxWidth: '380px' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 flex items-center justify-center text-sm font-bold text-white"
          style={{ background: '#0038A8', borderRadius: '8px' }}
        >
          S
        </div>
        <div>
          <div className="text-base font-bold" style={{ color: '#0F172A', lineHeight: 1.2 }}>SGI</div>
          <div className="text-xs" style={{ color: '#94A3B8', lineHeight: 1.2 }}>Suzano</div>
        </div>
      </div>

      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#0F172A' }}>Selecionar planta</h1>
        <p className="text-sm" style={{ color: '#64748B' }}>Escolha a unidade em que deseja atuar hoje</p>
      </div>

      {/* User identity card */}
      <div
        className="flex items-center gap-3 p-3 mb-6"
        style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}
      >
        <div
          className="flex items-center justify-center shrink-0 text-sm font-bold text-white"
          style={{ width: 40, height: 40, borderRadius: '50%', background: '#0038A8' }}
        >
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: '#0F172A' }}>{userName}</p>
          <p className="text-xs truncate" style={{ color: '#64748B' }}>{userEmail}</p>
          <p className="text-xs font-mono mt-0.5" style={{ color: '#94A3B8' }}>Matrícula {userMatricula}</p>
        </div>
        <span
          className="shrink-0 text-xs font-medium px-2 py-0.5"
          style={{ background: '#DCFCE7', color: '#16A34A', borderRadius: '20px' }}
        >
          Conectado
        </span>
      </div>

      {/* Plant cards — stacked vertically */}
      <div className="space-y-3 mb-6">
        {plantas.map(planta => {
          const isLoading = selecting === planta.id
          return (
            <button
              key={planta.id}
              onClick={() => handleSelect(planta.id, planta.perfis)}
              disabled={!!selecting || signingOut}
              className="w-full flex items-center gap-4 text-left transition-all"
              style={{
                background: 'white',
                border: '1.5px solid #E2E8F0',
                borderRadius: '10px',
                padding: '14px 16px',
                cursor: selecting || signingOut ? 'wait' : 'pointer',
                opacity: selecting && !isLoading ? 0.5 : 1,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
              onMouseEnter={e => {
                if (!selecting && !signingOut) {
                  e.currentTarget.style.borderColor = '#0038A8'
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,56,168,0.12)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#E2E8F0'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
              }}
            >
              {/* Icon */}
              <div
                className="flex items-center justify-center shrink-0"
                style={{ width: 42, height: 42, borderRadius: '9px', background: '#EBF0FB', color: '#0038A8' }}
              >
                {isLoading ? (
                  <span
                    className="inline-block w-5 h-5 border-2 rounded-full animate-spin"
                    style={{ borderColor: '#0038A8', borderTopColor: 'transparent' }}
                  />
                ) : (
                  <Icon name="factory" size={22} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-1" style={{ color: '#0F172A' }}>{planta.nome}</p>
                <div className="flex flex-wrap gap-1">
                  {Array.from(new Set(planta.perfis)).map(p => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5"
                      style={{ background: '#F1F5F9', color: '#374151', borderRadius: '20px', border: '1px solid #E2E8F0' }}
                    >
                      <Icon name={PERFIL_ICONS[p] ?? 'person'} size={11} />
                      {PERFIL_LABELS[p] ?? p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="shrink-0" style={{ color: isLoading ? '#94A3B8' : '#0038A8' }}>
                {isLoading
                  ? <span className="text-xs" style={{ color: '#64748B' }}>Abrindo...</span>
                  : <Icon name="arrow_forward" size={18} />
                }
              </div>
            </button>
          )
        })}
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        disabled={!!selecting || signingOut}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm"
        style={{
          background: 'none',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          color: signingOut ? '#94A3B8' : '#64748B',
          cursor: selecting || signingOut ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={e => {
          if (!selecting && !signingOut) e.currentTarget.style.borderColor = '#CBD5E1'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#E2E8F0'
        }}
      >
        {signingOut
          ? <><span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Saindo...</>
          : <><Icon name="logout" size={16} />Sair e trocar conta</>
        }
      </button>
    </div>
  )

  return (
    <div style={{ fontFamily: 'var(--font-sans, Inter, system-ui, sans-serif)', minHeight: '100svh' }}>
      {/* MOBILE */}
      <div className="md:hidden flex flex-col min-h-screen">
        <div className="relative" style={{ height: '20vh', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&fit=crop"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(0.65)' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(0,56,168,0.5) 0%, rgba(0,10,40,0.6) 100%)' }}
          />
        </div>
        <div className="flex flex-col items-center flex-1 px-6 pt-8 pb-8" style={{ background: '#FFFFFF' }}>
          {formContent}
        </div>
      </div>

      {/* DESKTOP — 50/50 grid */}
      <div className="hidden md:grid" style={{ gridTemplateColumns: '1fr 1fr', height: '100svh' }}>
        <div className="flex flex-col justify-center items-center px-12 py-16 overflow-y-auto" style={{ background: '#FFFFFF', height: '100%' }}>
          {formContent}
        </div>
        <div style={{ height: '100%' }}>
          {imagePanel}
        </div>
      </div>
    </div>
  )
}
