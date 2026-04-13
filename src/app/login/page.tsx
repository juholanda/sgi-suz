'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

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

export default function LoginPage() {
  const [matricula, setMatricula] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', {
      matricula,
      senha,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError('Matrícula ou senha incorretos. Verifique seus dados e tente novamente.')
    } else {
      router.push('/selecionar-planta')
    }
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'var(--font-sans, Inter, system-ui, sans-serif)' }}>
      {/* ── LEFT PANEL ────────────────────────────────────── */}
      <div
        className="flex flex-col justify-center items-center w-full md:w-[480px] lg:w-[520px] shrink-0 px-8 py-12"
        style={{ background: '#FFFFFF', minHeight: '100svh' }}
      >
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
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
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#0F172A' }}>
              Bem-vindo de volta
            </h1>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Sistema de Gestão de Intertravamentos
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Matrícula */}
            <div>
              <label
                htmlFor="matricula"
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#374151' }}
              >
                Matrícula
              </label>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#94A3B8', display: 'flex', alignItems: 'center' }}
                >
                  <Icon name="badge" size={17} />
                </span>
                <input
                  id="matricula"
                  type="text"
                  value={matricula}
                  onChange={e => setMatricula(e.target.value)}
                  placeholder="Ex.: 000001"
                  required
                  autoComplete="username"
                  className="field-input w-full"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label
                htmlFor="senha"
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#374151' }}
              >
                Senha
              </label>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#94A3B8', display: 'flex', alignItems: 'center' }}
                >
                  <Icon name="lock" size={17} />
                </span>
                <input
                  id="senha"
                  type={showSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                  autoComplete="current-password"
                  className="field-input w-full"
                  style={{ paddingLeft: '38px', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  tabIndex={-1}
                  aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <Icon name={showSenha ? 'visibility_off' : 'visibility'} size={17} />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-start gap-2 px-3 py-2.5 text-sm"
                style={{ background: '#FEF2F2', color: '#B91C1C', borderRadius: '8px', border: '1px solid #FECACA' }}
              >
                <Icon name="error" size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white transition-all mt-2"
              style={{
                background: loading ? '#94A3B8' : '#0038A8',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => !loading && ((e.currentTarget as HTMLButtonElement).style.background = '#002D8A')}
              onMouseLeave={e => !loading && ((e.currentTarget as HTMLButtonElement).style.background = '#0038A8')}
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <Icon name="login" size={17} />
                  Entrar
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-xs text-center mt-8" style={{ color: '#94A3B8' }}>
            Acesso restrito a colaboradores cadastrados.{' '}
            <br />
            Em caso de problemas, contate o administrador.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — cellulose factory image ─────────── */}
      <div
        className="hidden md:block flex-1 relative overflow-hidden"
        style={{ minHeight: '100svh' }}
      >
        {/* Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80&fit=crop"
          alt="Fábrica de celulose"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.7)' }}
        />

        {/* Overlay gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(0,56,168,0.55) 0%, rgba(0,10,40,0.65) 100%)',
          }}
        />

        {/* Content over image */}
        <div className="relative h-full flex flex-col justify-end p-12">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 text-xs font-semibold uppercase tracking-widest"
            style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(6px)',
              borderRadius: '20px',
              color: 'rgba(255,255,255,0.85)',
              width: 'fit-content',
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: '#34D399' }}
            />
            Sistema operacional
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold mb-3" style={{ color: '#FFFFFF', lineHeight: 1.2 }}>
            Gestão segura de<br />intertravamentos
          </h2>
          <p className="text-sm lg:text-base mb-8" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '380px', lineHeight: 1.6 }}>
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
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
