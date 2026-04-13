'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span className="material-symbols-outlined select-none" style={{ fontSize: size, lineHeight: 1 }} aria-hidden="true">
      {name}
    </span>
  )
}

export default function LoginPage() {
  const [matricula, setMatricula] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [lembrar, setLembrar] = useState(false)
  const [errorMatricula, setErrorMatricula] = useState('')
  const [errorSenha, setErrorSenha] = useState('')
  const [forgotMsg, setForgotMsg] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMatricula('')
    setErrorSenha('')
    setForgotMsg(false)

    const check = await fetch('/api/auth/validate-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matricula, senha }),
    }).then(r => r.json())

    if (check.error === 'MATRICULA_NOT_FOUND') {
      setErrorMatricula('Matrícula não encontrada.')
      setLoading(false)
      return
    }
    if (check.error === 'WRONG_PASSWORD') {
      setErrorSenha('Senha incorreta.')
      setLoading(false)
      return
    }

    const result = await signIn('credentials', { matricula, senha, redirect: false })
    setLoading(false)
    if (result?.error) {
      setErrorSenha('Erro ao autenticar. Tente novamente.')
    } else {
      router.push('/selecionar-planta')
    }
  }

  const formContent = (
    <div className="w-full" style={{ maxWidth: '360px' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 flex items-center justify-center text-sm font-bold text-white" style={{ background: '#0038A8', borderRadius: '8px' }}>S</div>
        <div>
          <div className="text-base font-bold" style={{ color: '#0F172A', lineHeight: 1.2 }}>SGI</div>
          <div className="text-xs" style={{ color: '#94A3B8', lineHeight: 1.2 }}>Suzano</div>
        </div>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#0F172A' }}>Bem-vindo de volta</h1>
        <p className="text-sm" style={{ color: '#64748B' }}>Sistema de Gestão de Intertravamentos</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="matricula" className="field-label">Matrícula</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
              <Icon name="badge" size={17} />
            </span>
            <input
              id="matricula" type="text" value={matricula}
              onChange={e => { setMatricula(e.target.value); setErrorMatricula('') }}
              placeholder="Ex.: 000001" required autoComplete="username"
              className={`field-input w-full${errorMatricula ? ' field-input--error' : ''}`}
              style={{ paddingLeft: '38px' }}
            />
          </div>
          {errorMatricula && (
            <p className="field-error-msg">
              <span className="material-symbols-outlined select-none" style={{ fontSize: 13, lineHeight: 1 }} aria-hidden="true">error</span>
              {errorMatricula}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="senha" className="field-label">Senha</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
              <Icon name="lock" size={17} />
            </span>
            <input
              id="senha" type={showSenha ? 'text' : 'password'} value={senha}
              onChange={e => { setSenha(e.target.value); setErrorSenha('') }}
              placeholder="Digite sua senha" required autoComplete="current-password"
              className={`field-input w-full${errorSenha ? ' field-input--error' : ''}`}
              style={{ paddingLeft: '38px', paddingRight: '40px' }}
            />
            <button type="button" onClick={() => setShowSenha(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              tabIndex={-1} aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}>
              <Icon name={showSenha ? 'visibility_off' : 'visibility'} size={17} />
            </button>
          </div>
          {errorSenha && (
            <p className="field-error-msg">
              <span className="material-symbols-outlined select-none" style={{ fontSize: 13, lineHeight: 1 }} aria-hidden="true">error</span>
              {errorSenha}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={lembrar} onChange={e => setLembrar(e.target.checked)} className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: '#0038A8' }} />
            <span className="text-sm" style={{ color: '#374151' }}>Lembrar-me</span>
          </label>
          <button type="button" onClick={() => setForgotMsg(v => !v)} className="text-sm" style={{ color: '#0038A8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Esqueci a senha
          </button>
        </div>

        {forgotMsg && (
          <div className="flex items-start gap-2 px-3 py-2.5 text-sm" style={{ background: '#EFF6FF', color: '#1D4ED8', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
            <Icon name="info" size={16} />
            <span>Entre em contato com o administrador do sistema para redefinir sua senha.</span>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-white transition-all mt-2"
          style={{ background: loading ? '#94A3B8' : '#0038A8', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', border: 'none', fontWeight: 500 }}
          onMouseEnter={e => !loading && ((e.currentTarget as HTMLButtonElement).style.background = '#002D8A')}
          onMouseLeave={e => !loading && ((e.currentTarget as HTMLButtonElement).style.background = '#0038A8')}>
          {loading ? (
            <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Entrando...</>
          ) : (
            <><Icon name="login" size={17} />Entrar</>
          )}
        </button>
      </form>

      <p className="text-xs text-center mt-8" style={{ color: '#94A3B8' }}>
        Acesso restrito a colaboradores cadastrados.<br />Em caso de problemas, contate o administrador.
      </p>
    </div>
  )

  const imagePanel = (
    <div className="relative" style={{ height: '100%' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80&fit=crop" alt="Fábrica de celulose"
        className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'brightness(0.7)' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,56,168,0.55) 0%, rgba(0,10,40,0.65) 100%)' }} />
      <div className="relative h-full flex flex-col justify-end p-12">
        <h2 className="mb-3" style={{ color: '#FFFFFF', lineHeight: 1.2, fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)' }}>
          Gestão segura de<br />intertravamentos
        </h2>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '380px', lineHeight: 1.6 }}>
          Controle, rastreabilidade e conformidade em cada etapa do processo de desabilitação de instrumentos de segurança.
        </p>
        <div className="flex items-center gap-4">
          {[{ icon: 'verified_user', label: 'Conformidade SMS' }, { icon: 'history', label: 'Rastreabilidade' }, { icon: 'speed', label: 'Agilidade operacional' }].map(item => (
            <div key={item.label} className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{item.icon}</span>
              <span className="text-xs" style={{ fontWeight: 400 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'var(--font-sans, Inter, system-ui, sans-serif)', minHeight: '100svh' }}>
      {/* MOBILE layout */}
      <div className="md:hidden flex flex-col min-h-screen">
        <div className="relative" style={{ height: '25vh', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&fit=crop" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'brightness(0.65)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,56,168,0.5) 0%, rgba(0,10,40,0.6) 100%)' }} />
        </div>
        <div className="flex flex-col items-center flex-1 px-6 pt-8 pb-8" style={{ background: '#FFFFFF' }}>
          {formContent}
        </div>
      </div>

      {/* DESKTOP layout — CSS grid 50/50 */}
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
