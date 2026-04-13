'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [matricula, setMatricula] = useState('')
  const [senha, setSenha] = useState('')
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
      setError('Matrícula ou senha incorretos.')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0F4F8' }}>
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg mb-4" style={{ background: '#0038A8' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" stroke="white" strokeWidth="2" fill="none"/>
              <path d="M16 10V22M10 13L22 19M10 19L22 13" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>SGI</h1>
          <p className="text-sm mt-1" style={{ color: '#475569' }}>Sistema de Gestão de Intertravamentos</p>
          <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Suzano</p>
        </div>

        {/* Card */}
        <div className="bg-white shadow-sm border p-8" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
          <h2 className="text-lg font-semibold mb-6" style={{ color: '#0F172A' }}>Entrar no sistema</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                Matrícula
              </label>
              <input
                type="text"
                value={matricula}
                onChange={e => setMatricula(e.target.value)}
                placeholder="Digite sua matrícula"
                required
                className="w-full px-3 py-2.5 border text-sm outline-none transition-colors"
                style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#0F172A' }}
                onFocus={e => (e.target.style.borderColor = '#0038A8')}
                onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                required
                className="w-full px-3 py-2.5 border text-sm outline-none transition-colors"
                style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#0F172A' }}
                onFocus={e => (e.target.style.borderColor = '#0038A8')}
                onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
              />
            </div>

            {error && (
              <div className="px-3 py-2 text-sm" style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', border: '1px solid #FECACA' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-medium text-white transition-colors"
              style={{ background: loading ? '#94A3B8' : '#0038A8', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
              onMouseEnter={e => !loading && ((e.target as HTMLButtonElement).style.background = '#002D8A')}
              onMouseLeave={e => !loading && ((e.target as HTMLButtonElement).style.background = '#0038A8')}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#94A3B8' }}>
          Em caso de problemas de acesso, contate o administrador do sistema.
        </p>
      </div>
    </div>
  )
}
