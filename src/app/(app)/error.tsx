'use client'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
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
