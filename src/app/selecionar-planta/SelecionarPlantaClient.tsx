'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
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

const PLANTA_IMAGES: Record<string, string> = {
  'planta-aracruz': 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=240&q=80&fit=crop&auto=format',
  'planta-limeira': 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=240&q=80&fit=crop&auto=format',
  'planta-ribas':   'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=240&q=80&fit=crop&auto=format',
}
const PLANTA_IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1581091870622-1c6a4eea9cee?w=240&q=80&fit=crop&auto=format'

function getPlantaImage(id: string, nome: string): string {
  if (PLANTA_IMAGES[id]) return PLANTA_IMAGES[id]
  const lowered = nome.toLowerCase()
  if (lowered.includes('aracruz')) return PLANTA_IMAGES['planta-aracruz']
  if (lowered.includes('limeira')) return PLANTA_IMAGES['planta-limeira']
  if (lowered.includes('ribas'))   return PLANTA_IMAGES['planta-ribas']
  return PLANTA_IMAGE_FALLBACK
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
    const firstPerfil = Array.from(new Set(perfis))[0]
    if (firstPerfil) {
      localStorage.setItem('sgi_demo_perfil', firstPerfil)
      document.cookie = `sgi_perfil_ativo=${firstPerfil};path=/;max-age=86400`
    }
    router.push('/dashboard')
  }

  // Auto-select when the user only has access to one active plant
  useEffect(() => {
    if (plantas.length === 1) {
      handleSelect(plantas[0].id, plantas[0].perfis)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    await signOut({ callbackUrl: '/login' })
  }

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

  // If only 1 plant, show a loading state while auto-selecting
  if (plantas.length === 1) {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#0038A8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 15, color: '#475569', margin: 0 }}>Entrando em {plantas[0].nome}…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const formContent = (
    <div className="w-full" style={{ maxWidth: '380px' }}>
      <div className="flex items-center gap-3 mb-8">
        <div
          className="flex items-center justify-center font-bold text-white"
          style={{ width: 44, height: 44, background: '#0038A8', borderRadius: '10px', fontSize: 16, flexShrink: 0 }}
        >
          S
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>SGI</div>
          <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.2 }}>Suzano</div>
        </div>
      </div>

      <div className="mb-6">
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>Selecionar planta</h1>
        <p style={{ fontSize: 15, color: '#64748B', margin: 0 }}>Escolha a unidade em que deseja atuar hoje</p>
      </div>

      <div
        className="flex items-center gap-3 mb-6"
        style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px' }}
      >
        <div
          className="flex items-center justify-center shrink-0 font-bold text-white"
          style={{ width: 44, height: 44, borderRadius: '50%', background: '#0038A8', fontSize: 16 }}
        >
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</p>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</p>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>Matrícula {userMatricula}</p>
        </div>
        <span
          className="shrink-0"
          style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', background: '#DCFCE7', color: '#16A34A', borderRadius: '20px' }}
        >
          Conectado
        </span>
      </div>

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
                borderRadius: '12px',
                padding: '18px 20px',
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
              <div
                className="relative flex items-center justify-center shrink-0 overflow-hidden"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0038A8 0%, #1E3A8A 100%)',
                  color: '#FFFFFF',
                }}
              >
                <Icon name="factory" size={26} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getPlantaImage(planta.id, planta.nome)}
                  alt={planta.nome}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: isLoading ? 'brightness(0.55)' : 'none' }}
                  onError={e => { e.currentTarget.style.display = 'none' }}
                />
                {isLoading && (
                  <span
                    className="relative inline-block border-2 rounded-full animate-spin"
                    style={{ width: 22, height: 22, borderColor: '#FFFFFF', borderTopColor: 'transparent', zIndex: 1 }}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', margin: '0 0 6px' }}>{planta.nome}</p>
                <div className="flex flex-wrap items-center gap-y-1" style={{ gap: '0' }}>
                  {Array.from(new Set(planta.perfis)).map((p, idx, arr) => (
                    <span key={p} className="inline-flex items-center">
                      <span
                        className="inline-flex items-center gap-1"
                        style={{ fontSize: 13, fontWeight: 400, color: '#64748B' }}
                      >
                        <Icon name={PERFIL_ICONS[p] ?? 'person'} size={13} />
                        {PERFIL_LABELS[p] ?? p}
                      </span>
                      {idx < arr.length - 1 && (
                        <span
                          style={{
                            display: 'inline-block',
                            width: 3,
                            height: 3,
                            borderRadius: '50%',
                            background: '#CBD5E1',
                            margin: '0 6px',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <div className="shrink-0 flex items-center" style={{ color: isLoading ? '#94A3B8' : '#0038A8' }}>
                {isLoading
                  ? <span style={{ fontSize: 13, color: '#64748B' }}>Abrindo…</span>
                  : <Icon name="arrow_forward_ios" size={20} />
                }
              </div>
            </button>
          )
        })}
      </div>

      <button
        onClick={handleSignOut}
        disabled={!!selecting || signingOut}
        className="w-full flex items-center justify-center gap-2"
        style={{
          height: 48,
          fontSize: 15,
          background: 'none',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
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
          ? <><span className="inline-block border-2 border-current border-t-transparent rounded-full animate-spin" style={{ width: 18, height: 18 }} />Saindo…</>
          : <><Icon name="logout" size={20} />Sair e trocar conta</>
        }
      </button>
    </div>
  )

  return (
    <div style={{ fontFamily: 'var(--font-sans, Inter, system-ui, sans-serif)', minHeight: '100svh' }}>
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
