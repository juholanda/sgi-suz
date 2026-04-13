'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

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

export default function SelecionarPlantaClient({ plantas, userName }: Props) {
  const router = useRouter()
  const [selecting, setSelecting] = useState<string | null>(null)

  function handleSelect(plantaId: string) {
    setSelecting(plantaId)
    localStorage.setItem('sgi_demo_planta', plantaId)
    document.cookie = `sgi_planta_ativa=${plantaId};path=/;max-age=86400`
    router.push('/dashboard')
  }

  const firstName = userName.split(' ')[0]

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: '#F0F4F8' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div
          className="w-9 h-9 flex items-center justify-center text-sm font-bold text-white"
          style={{ background: '#0038A8', borderRadius: '8px' }}
        >
          S
        </div>
        <div>
          <div className="text-sm font-bold" style={{ color: '#0F172A' }}>SGI</div>
          <div className="text-xs" style={{ color: '#94A3B8' }}>Suzano</div>
        </div>
      </div>

      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#0F172A' }}>
          Olá, {firstName}!
        </h1>
        <p className="text-sm" style={{ color: '#64748B' }}>
          Selecione a planta em que deseja atuar hoje
        </p>
      </div>

      {/* Plant cards */}
      <div
        className="w-full grid gap-4"
        style={{
          maxWidth: '720px',
          gridTemplateColumns: `repeat(${Math.min(plantas.length, 3)}, minmax(0, 1fr))`,
        }}
      >
        {plantas.map(planta => {
          const isLoading = selecting === planta.id
          return (
            <button
              key={planta.id}
              onClick={() => handleSelect(planta.id)}
              disabled={!!selecting}
              className="flex flex-col items-start text-left transition-all"
              style={{
                background: 'white',
                border: '1.5px solid #E2E8F0',
                borderRadius: '12px',
                padding: '20px',
                cursor: selecting ? 'wait' : 'pointer',
                opacity: selecting && !isLoading ? 0.6 : 1,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
              onMouseEnter={e => {
                if (!selecting) {
                  e.currentTarget.style.borderColor = '#0038A8'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,56,168,0.12)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#E2E8F0'
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'
              }}
            >
              {/* Plant icon */}
              <div
                className="flex items-center justify-center mb-4"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '10px',
                  background: '#EBF0FB',
                  color: '#0038A8',
                }}
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

              {/* Plant name */}
              <div className="text-sm font-semibold mb-3" style={{ color: '#0F172A' }}>
                {planta.nome}
              </div>

              {/* Profiles */}
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set(planta.perfis)).map(p => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5"
                    style={{
                      background: '#F1F5F9',
                      color: '#374151',
                      borderRadius: '20px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <Icon name={PERFIL_ICONS[p] ?? 'person'} size={12} />
                    {PERFIL_LABELS[p] ?? p}
                  </span>
                ))}
              </div>

              {/* Arrow */}
              <div
                className="flex items-center gap-1 mt-4 text-xs font-medium"
                style={{ color: '#0038A8' }}
              >
                {isLoading ? 'Carregando...' : 'Acessar planta'}
                {!isLoading && <Icon name="arrow_forward" size={14} />}
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-xs mt-8" style={{ color: '#94A3B8' }}>
        Você pode trocar de planta a qualquer momento pelo menu lateral.
      </p>
    </div>
  )
}
