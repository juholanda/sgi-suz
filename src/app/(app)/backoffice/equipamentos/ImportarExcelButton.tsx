'use client'

import { useRef, useState } from 'react'

interface ImportResult {
  created: number
  updated: number
  errors: string[]
}

export default function ImportarExcelButton({ onImportDone }: { onImportDone?: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setResult(null)
    setErrorMsg('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/equipamentos/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Erro ao importar arquivo.')
      } else {
        setResult(data as ImportResult)
        onImportDone?.()
      }
    } catch {
      setErrorMsg('Erro de conexão ao importar arquivo.')
    } finally {
      setImporting(false)
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const dismissResult = () => {
    setResult(null)
    setErrorMsg('')
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button
        onClick={handleClick}
        disabled={importing}
        className="px-4 py-2 text-sm border"
        style={{
          borderColor: '#E2E8F0',
          borderRadius: '4px',
          color: importing ? '#94A3B8' : '#475569',
          cursor: importing ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'white',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '18px' }}
        >
          upload_file
        </span>
        {importing ? 'Importando...' : 'Importar Excel'}
      </button>

      {/* Success/error banner */}
      {(result || errorMsg) && (
        <div
          style={{
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 100,
            maxWidth: '480px',
            width: '100%',
            padding: '16px',
            borderRadius: '4px',
            background: errorMsg ? '#FEF2F2' : '#F0FDF4',
            border: `1px solid ${errorMsg ? '#FECACA' : '#BBF7D0'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              {errorMsg && (
                <p style={{ margin: 0, fontSize: '14px', color: '#B91C1C', fontWeight: 500 }}>
                  {errorMsg}
                </p>
              )}
              {result && (
                <>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: '#166534' }}>
                    Importacao concluida
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>
                    {result.created} criado(s), {result.updated} atualizado(s)
                    {result.errors.length > 0 && `, ${result.errors.length} erro(s)`}
                  </p>
                  {result.errors.length > 0 && (
                    <details style={{ marginTop: '8px' }}>
                      <summary
                        style={{ fontSize: '12px', color: '#B91C1C', cursor: 'pointer', fontWeight: 500 }}
                      >
                        Ver erros ({result.errors.length})
                      </summary>
                      <ul style={{ margin: '4px 0 0 0', padding: '0 0 0 16px', fontSize: '12px', color: '#6B7280', maxHeight: '200px', overflow: 'auto' }}>
                        {result.errors.map((err, i) => (
                          <li key={i} style={{ marginBottom: '2px' }}>{err}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </>
              )}
            </div>
            <button
              onClick={dismissResult}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#6B7280',
                padding: '0 0 0 8px',
                lineHeight: 1,
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  )
}
