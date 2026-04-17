'use client'

import { useEffect } from 'react'

const RELOAD_FLAG = 'sgi:chunk-reloaded'

function isChunkLoadError(error: Error) {
  const msg = error?.message || ''
  const name = error?.name || ''
  return (
    name === 'ChunkLoadError' ||
    /Loading chunk [\w-]+ failed/i.test(msg) ||
    /Loading CSS chunk [\w-]+ failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg)
  )
}

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const chunkError = isChunkLoadError(error)
  const alreadyReloaded =
    typeof window !== 'undefined' && sessionStorage.getItem(RELOAD_FLAG) === '1'

  useEffect(() => {
    if (!chunkError || alreadyReloaded || typeof window === 'undefined') return
    sessionStorage.setItem(RELOAD_FLAG, '1')
    window.location.reload()
  }, [chunkError, alreadyReloaded])

  // Se o chunk error foi um incidente isolado, limpa a flag pra proximas navegacoes.
  useEffect(() => {
    if (!chunkError && typeof window !== 'undefined') {
      sessionStorage.removeItem(RELOAD_FLAG)
    }
  }, [chunkError])

  // Enquanto recarrega, nao mostra nada (evita flash da tela de erro).
  if (chunkError && !alreadyReloaded) return null

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#F0F4F8' }}>
      <div className="bg-white border p-8 max-w-md w-full text-center" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#DC2626', display: 'block', marginBottom: 16 }}>
          error
        </span>
        <h1 className="text-lg font-bold mb-2" style={{ color: '#0F172A' }}>
          Algo deu errado
        </h1>
        <p className="text-sm mb-2" style={{ color: '#475569' }}>
          {error.message || 'Ocorreu um erro inesperado.'}
        </p>
        {error.digest && (
          <p className="text-xs mb-4" style={{ color: '#94A3B8' }}>
            Digest: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm font-medium text-white"
            style={{ background: '#0038A8', borderRadius: '4px' }}
          >
            Tentar novamente
          </button>
          <a
            href="/selecionar-planta"
            className="px-4 py-2 text-sm font-medium"
            style={{ background: '#F1F5F9', color: '#475569', borderRadius: '4px', border: '1px solid #E2E8F0' }}
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  )
}
